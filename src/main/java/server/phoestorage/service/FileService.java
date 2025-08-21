package server.phoestorage.service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.io.input.BoundedInputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import server.phoestorage.datasource.download.DownloadEntity;
import server.phoestorage.datasource.download.DownloadRepository;
import server.phoestorage.datasource.file.FileEntity;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.datasource.folder.FolderEntity;
import server.phoestorage.datasource.folder.FolderRepository;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.datasource.users.UserRepository;
import server.phoestorage.dto.FileEntry;
import server.phoestorage.dto.FolderEntry;

@Service
public class FileService {
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    @Value("${server.root}")
    private String rootPath;

    private final AppUserDetailsService appUserDetailsService;
    private final HandlerService handlerService;

    private final FileRepository fileRepository;

    @Autowired
    public FileService(AppUserDetailsService appUserDetailsService,
                       HandlerService handlerService,
                       FileRepository fileRepository, FolderRepository folderRepository, UserRepository userRepository) {
        this.appUserDetailsService = appUserDetailsService;
        this.handlerService = handlerService;
        this.fileRepository = fileRepository;
        this.folderRepository = folderRepository;
        this.userRepository = userRepository;
    }


    private static void addToMeta(Path metaPath, long delta) throws IOException {
        // Open/create for read+write so we can lock and update in-place
        try (FileChannel ch = FileChannel.open(metaPath,
                StandardOpenOption.CREATE, StandardOpenOption.READ, StandardOpenOption.WRITE)) {

            try (FileLock lock = ch.lock()) { // exclusive lock
                ch.position(0);

                // Read current value
                ByteBuffer buf = ByteBuffer.allocate(64);
                int read = ch.read(buf);
                long current = 0L;
                if (read > 0) {
                    buf.flip();
                    String s = StandardCharsets.UTF_8.decode(buf).toString().trim();
                    if (!s.isEmpty()) {
                        try {
                            current = Long.parseLong(s);
                        } catch (NumberFormatException ignored) {
                            current = 0L; // corrupted/empty meta → treat as 0
                        }
                    }
                }

                long updated = Math.addExact(current, delta); // throws on overflow

                // Rewrite atomically (truncate then write)
                ch.truncate(0);
                ch.position(0);
                ByteBuffer out = StandardCharsets.UTF_8.encode(Long.toString(updated));
                while (out.hasRemaining()) ch.write(out);
                ch.force(true);
            }
        }
    }

    static long readMeta(Path metaPath) throws IOException {
        if (!Files.exists(metaPath)) return 0L;
        String s = Files.readString(metaPath, StandardCharsets.UTF_8).trim();
        if (s.isEmpty()) return 0L;
        try { return Long.parseLong(s); } catch (NumberFormatException e) { return 0L; }
    }


    /**
     * Saves chunks of a file
     *
     * @param chunkId the index of the current chunk
     * @param file the chunked file
     * @param folderId the folder to save the file into
     * @param fileName the name of the file
     * @param uploadId the current upload session id
     * @return the exit code
     *
     */
    public int saveChunk(int chunkId, MultipartFile file, String folderId, String fileName, String uploadId){
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            if(fileExistByName(uuid, folderId, fileName)) {return -2;}

            Path chunkDir = Paths.get(rootPath, uuid, "temp", "upload", uploadId);
            Files.createDirectories(chunkDir);



            Path chunkPath = chunkDir.resolve("chunk_" + chunkId);

            long written = 0L;
            try (InputStream is = file.getInputStream();
                 OutputStream os = Files.newOutputStream(chunkPath)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                    written += bytesRead;
                }
            }

            Path metaPath = chunkDir.resolve("file.meta");
            addToMeta(metaPath, written);

            UserEntity userEntity = appUserDetailsService.getUserEntity();
            long dataUsed = readMeta(metaPath);

            if(userEntity.getDataUsed() + dataUsed > userEntity.getDataLimit()) {return -3;}

            return 0;
        } catch (Exception e){
            System.err.println(e);
            return -1;
        }
    }

    /**
     * Merges saved chunks into one file
     *
     * @param totalChunks total amount of chunks
     * @return the internal file name
     *
     */
    public String mergeChunk(int totalChunks, String uploadId){
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            Path chunkDir = Paths.get(rootPath, uuid, "temp", "upload", uploadId);

            String fileName = UUID.randomUUID().toString();

            Path outputPath = Paths.get(rootPath, uuid, "storage", fileName);

            try (OutputStream os = Files.newOutputStream(outputPath, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
                for (int i = 0; i < totalChunks; i++) {
                    Path chunkFile = chunkDir.resolve("chunk_" + i);
                    try (InputStream is = Files.newInputStream(chunkFile)) {
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = is.read(buffer)) != -1) {
                            os.write(buffer, 0, bytesRead);
                        }
                    }
                    Files.deleteIfExists(chunkDir.resolve("file.meta"));
                    Files.deleteIfExists(chunkFile);
                }
                Files.delete(chunkDir);
            }
            return fileName;
        }catch (Exception e){
            System.err.println(e);
            return null;
        }
    }

    /**
     * Saves file to database
     *
     * @param folderId the folder the file should be saved in
     * @param fileName the name of the saved file
     * @param uploadId the current upload session id
     * @param totalChunks the total amount of chunks
     * @return exit code
     *
     */
    public int saveFileDatabase(String folderId, String fileName, String uploadId, int totalChunks) {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();

            String internalName = mergeChunk(totalChunks, uploadId);
            String internalPath = rootPath + uuid + "/storage/" + internalName;

            Path path = Paths.get(internalPath);
            if(fileExistByUuid(uuid, folderId, internalName)) {Files.delete(path); return 409;}
            if(folderRepository.findByOwnerAndFolderId(uuid, folderId) == null) {Files.delete(path); return 404;}

            String extension;

            String[] parts = fileName.split("\\.");
            if (parts.length > 1) {
                extension = parts[parts.length - 1].toLowerCase();
            } else {
                extension = "";
            }

            FileEntity fileEntity = new FileEntity();
            fileEntity.setUuid(internalName);
            fileEntity.setOwner(uuid);
            fileEntity.setName(fileName);
            fileEntity.setExtension(extension);
            fileEntity.setFolderId(folderId);
            fileEntity.setInternalPath(internalPath);
            fileEntity.setCreated(LocalDateTime.now().toString());
            fileEntity.setSize(Files.size(path));
            fileEntity.setStarred(false);

            UserEntity userEntity = appUserDetailsService.getUserEntity();
            userEntity.setDataUsed(userEntity.getDataUsed() + Files.size(path));

            fileRepository.save(fileEntity);
            return 0;
        }catch (Exception e){
            System.err.println(e);

            return 500;
        }
    }

    /**
     * Downloads the file
     *
     * @param folderId the folder the file is in
     * @param fileId the id of the file
     * @param rangeHeader the folder the file should be saved in
     * @return response entity
     *
     */
    public ResponseEntity<?> downloadFile(String folderId, String fileId, String rangeHeader, String uuid) {
        try{

            if(!fileExistByUuid(uuid, folderId, fileId)) {return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());}

            Optional<FileEntity> fileEntity = fileRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, fileId);

            Path file = Paths.get(fileEntity.get().getInternalPath()); // warning is irrelevant because we call fileExistByUuid()
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists()) {
                System.out.print("Could not find file in local files. send 404");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
            }

            long fileSize = Files.size(file);
            long start = 0, end = fileSize - 1;

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                String[] ranges = rangeHeader.replace("bytes=", "").split("-");
                start = Long.parseLong(ranges[0]);
                if (ranges.length > 1 && !ranges[1].isEmpty()) {
                    end = Long.parseLong(ranges[1]);
                }
            }

            long contentLength = end - start + 1;
            InputStream inputStream = Files.newInputStream(file);

            long skipped = 0;
            while (skipped < start) {
                long bytes = inputStream.skip(start - skipped);
                if (bytes <= 0) return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(new Exception()));
                skipped += bytes;
            }

            BoundedInputStream limited = new BoundedInputStream(inputStream, contentLength);
            InputStreamResource inputStreamResource = new InputStreamResource(limited);

            return ResponseEntity.status(rangeHeader == null ? 200 : 206)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.get().getName() + "\"")
                    .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileSize)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentLength(contentLength)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(inputStreamResource);
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }

    /**
     * Deletes the file local and on database
     *
     * @param folderId the folder the file is in
     * @param fileId the id of the file
     * @return response entity
     *
     */
    public ResponseEntity<?> deleteFile(String folderId, String fileId) {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();

            if (!fileExistByUuid(uuid, folderId, fileId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
            }

            Optional<FileEntity> response = fileRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, fileId);
            FileEntity fileEntity = response.get();
            if (Files.exists(Paths.get(fileEntity.getInternalPath()))) {
                Files.delete(Paths.get(fileEntity.getInternalPath()));
            } else { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());}

            fileRepository.delete(fileEntity);

            UserEntity userEntity = appUserDetailsService.getUserEntity();
            userEntity.setDataUsed(userEntity.getDataUsed() - fileEntity.getSize());
            userRepository.save(userEntity);

            return ResponseEntity.ok().build();
        }catch (Exception e){
            System.err.println(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }

    public ResponseEntity<?> renameFile(String folderId, String fileId, String name) {
        try {
            String uuid = appUserDetailsService.getUserEntity().getUuid();

            if(!fileExistByUuid(uuid, folderId, fileId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
            }

            if(fileRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, fileId).get().getName().equals(name)) {
                return ResponseEntity.ok().body("");
            }

            if(fileExistByName(uuid, folderId, name)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(name);
            }

            String extension;

            String[] parts = name.split("\\.");
            if (parts.length > 1) {
                extension = parts[parts.length - 1].toLowerCase();
            } else {
                extension = "";
            }

            if(fileRepository.renameFile(uuid, folderId, fileId, name, extension) != 1){
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(new Exception()));
            }
            return ResponseEntity.ok().build();
        } catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }

    /**
     * File exist with uuid
     *
     * @param folderId the parent folder
     * @param fileId uuid of the file
     * @return exit code
     *
     */
    public boolean fileExistByUuid(String owner, String folderId, String fileId) throws IOException {
        Optional<FileEntity> fileEntity = fileRepository.findByOwnerAndFolderIdAndUuid(owner, folderId, fileId);

        if(fileEntity.isEmpty()){ return false; }

        Path file = Paths.get(fileEntity.get().getInternalPath());
        Resource resource = new UrlResource(file.toUri());

        return resource.exists();
    }

    /**
     * File exist with name
     *
     * @param folderId the parent folder
     * @param fileName name of the file
     * @return exit code
     *
     */
    public boolean fileExistByName(String owner, String folderId, String fileName) {
        Optional<FileEntity> fileEntity = fileRepository.findByOwnerAndFolderIdAndName(owner, folderId, fileName);

        return fileEntity.isPresent();

    }


    public ResponseEntity<?> getStarredFiles() {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            return ResponseEntity.ok(fileRepository.findByOwnerAndStarred(uuid, true));
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }

    public ResponseEntity<?> setStarredFile(String folderId, String fileId, boolean starred) {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();

            if(!fileExistByUuid(uuid, folderId, fileId)) {return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());}

            FileEntity file = fileRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, fileId).get();
            file.setStarred(starred);
            fileRepository.save(file);

            return ResponseEntity.ok("");
        }catch (Exception e){
            System.err.println(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }

    public List<FileEntry> searchFile(String query){
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        List<FileEntity> result = new ArrayList<>();
        if(query.startsWith(".")){
            query = query.substring(1);
            result = fileRepository.findTop100ByOwnerAndExtensionContainingIgnoreCase(uuid, query);
        }else{
            result = fileRepository.findTop100ByOwnerAndNameContainingIgnoreCase(uuid, query);
        }

        List<FileEntry> r = new ArrayList<>();
        for (FileEntity fileEntity : result) {
            FileEntry fileEntry = new FileEntry();
            fileEntry.setUuid(fileEntity.getUuid());
            fileEntry.setOwner(fileEntity.getOwner());
            fileEntry.setName(fileEntity.getName());
            fileEntry.setExtension(fileEntity.getExtension());
            fileEntry.setFolderId(fileEntity.getFolderId());
            fileEntry.setCreated(fileEntity.getCreated());
            fileEntry.setModified(fileEntity.getModified());
            fileEntry.setAccessed(fileEntity.getAccessed());
            fileEntry.setSize(fileEntity.getSize());
            fileEntry.setStarred(fileEntity.getStarred());

            r.add(fileEntry);
        }
        return r;
    }
}
