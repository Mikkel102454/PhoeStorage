package server.phoestorage.service;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

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
import server.phoestorage.datasource.file.FileEntity;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.dto.FileEntry;

@Service
public class FileService {
    @Value("${server.root}")
    private String rootPath;

    private final AppUserDetailsService appUserDetailsService;
    private final HandlerService handlerService;

    private final FileRepository fileRepository;

    @Autowired
    public FileService(AppUserDetailsService appUserDetailsService, HandlerService handlerService, FileRepository fileRepository) {
        this.appUserDetailsService = appUserDetailsService;
        this.handlerService = handlerService;
        this.fileRepository = fileRepository;
    }

    /**
     * Create user folders
     *
     * @param user the user
     * @return true if successful and false if unsuccessful
     *
     */
    public boolean createUserFolder(UserEntity user) {
        try{
            new File(rootPath + user.getUuid()).mkdirs();
            new File(rootPath + user.getUuid() + "/temp").mkdirs();
            new File(rootPath + user.getUuid() + "/storage").mkdirs();
            return true;
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return false;
        }
    }

    /**
     * Browse directory
     *
     * @param path the current browsing directory
     * @return response entity with list of FileEntry
     *
     */
    public ResponseEntity<?> BrowseDirectory(String path) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        List<FileEntity> files = fileRepository.findByOwnerAndPath(uuid, path);
        List<FileEntry> result = new ArrayList<>();

        for(FileEntity file : files) {
            FileEntry fileEntry = new FileEntry();
            fileEntry.setUuid(file.getUuid());
            fileEntry.setOwner(file.getOwner());
            fileEntry.setName(file.getName());
            fileEntry.setExtension(file.getExtension());
            fileEntry.setPath(file.getPath());
            fileEntry.setFullPath(file.getFullPath());
            fileEntry.setCreated(file.getCreated());
            fileEntry.setModified(file.getModified());
            fileEntry.setAccessed(file.getAccessed());
            fileEntry.setSize(file.getSize());
            fileEntry.setIsFolder(false);
            result.add(fileEntry);
        }

        List<String> subfolders = fileRepository.findImmediateSubfolders(uuid, path);
        for (String folderName : subfolders) {
            FileEntry folderEntry = new FileEntry();
            folderEntry.setName(folderName);
            folderEntry.setOwner(uuid);
            folderEntry.setFullPath(path + folderName + "/");
            folderEntry.setIsFolder(true);
            result.add(folderEntry);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Saves chunks of a file
     *
     * @param chunkId the index of the current chunk
     * @param file the chunked file
     * @param path the full path to the destination
     * @return the exit code
     *
     */
    public int saveChunk(int chunkId, MultipartFile file, String path){
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();

            FileEntity fileEntity = fileRepository.findByOwnerAndFullPath(uuid, path);

            if (fileEntity != null) {
                return -2;
            }

            Path chunkDir = Paths.get(rootPath, uuid, "temp", "chunk");
            Files.createDirectories(chunkDir);

            Path chunkPath = chunkDir.resolve("chunk_" + chunkId);

            try (InputStream is = file.getInputStream();
                 OutputStream os = Files.newOutputStream(chunkPath)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
            }

            return 0;
        } catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
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
    public String mergeChunk(int totalChunks){
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            Path chunkDir = Paths.get(rootPath, uuid, "temp", "chunk");

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
                    Files.deleteIfExists(chunkFile);
                }
            }
            return fileName;
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return null;
        }
    }

    /**
     * Saves file to database
     *
     * @param internalName the internal file name
     * @param filePath the folder the file should be saved in
     * @param fileName the name of the saved file
     * @return exit code
     *
     */
    public int saveFileDatabase(String internalName, String filePath, String fileName) {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();

            String extension;

            String[] parts = fileName.split("\\.");
            if (parts.length > 1) {
                extension = parts[parts.length - 1];
            } else {
                extension = "";
            }

            String internalPath = rootPath + uuid + "/storage/" + internalName;

            FileEntity fileEntity = new FileEntity();
            fileEntity.setUuid(internalName);
            fileEntity.setOwner(uuid);
            fileEntity.setName(fileName);
            fileEntity.setExtension(extension);
            fileEntity.setPath(filePath);
            fileEntity.setFullPath(filePath + fileName);
            fileEntity.setInternalPath(internalPath);
            fileEntity.setCreated(LocalDateTime.now().toString());
            fileEntity.setSize(Files.size(Paths.get(internalPath)));

            fileRepository.save(fileEntity);
            return 0;
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return -1;
        }
    }

    /**
     * Downloads the file
     *
     * @param path the internal file name
     * @param rangeHeader the folder the file should be saved in
     * @return response entity
     *
     */
    public ResponseEntity<?> downloadFile(String path, String rangeHeader) {
        try{
            if(path.startsWith("/")) {
                path = path.substring(1);
            }

            String uuid = appUserDetailsService.getUserEntity().getUuid();
            FileEntity fileEntity = fileRepository.findByOwnerAndFullPath(uuid, path);

            if (fileEntity == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
            }


            Path file = Paths.get(fileEntity.getInternalPath());
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists()) {
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
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
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
     * @param path path to the files that should be deleted
     * @return response entity
     *
     */
    public ResponseEntity<?> deleteFile(String path) {
        try{
            if(path.startsWith("/")) {
                path = path.substring(1);
            }
            System.out.println(path);
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            FileEntity fileEntity = fileRepository.findByOwnerAndFullPath(uuid, path);
            if (fileEntity == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
            }

            if (Files.exists(Paths.get(fileEntity.getInternalPath()))) {
                Files.delete(Paths.get(fileEntity.getInternalPath()));
            } else { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());}

            fileRepository.delete(fileEntity);

            return ResponseEntity.ok().build();
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }
}
