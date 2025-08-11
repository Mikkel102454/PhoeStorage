package server.phoestorage.service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
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
import server.phoestorage.dto.FileEntry;
import server.phoestorage.dto.FolderEntry;

@Service
public class FileService {
    private final FolderRepository folderRepository;
    @Value("${server.root}")
    private String rootPath;

    private final AppUserDetailsService appUserDetailsService;
    private final HandlerService handlerService;

    private final FileRepository fileRepository;

    private final DownloadRepository downloadRepository;

    @Autowired
    public FileService(AppUserDetailsService appUserDetailsService,
                       HandlerService handlerService,
                       FileRepository fileRepository, FolderRepository folderRepository,
                       DownloadRepository downloadRepository) {
        this.appUserDetailsService = appUserDetailsService;
        this.handlerService = handlerService;
        this.fileRepository = fileRepository;
        this.folderRepository = folderRepository;
        this.downloadRepository = downloadRepository;
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
                    Files.deleteIfExists(chunkFile);
                }
                Files.delete(chunkDir);
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

            fileRepository.save(fileEntity);
            return 0;
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());

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
    public ResponseEntity<?> downloadFile(String folderId, String fileId, String rangeHeader) {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();

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

            return ResponseEntity.ok().build();
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
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
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }

    public ResponseEntity<String> createDownloadLink(String folderId, String fileId, int downloadLimit, String date) {
        try {
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            if (!fileExistByUuid(uuid, folderId, fileId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
            }

            String linkUuid = UUID.randomUUID().toString();

            DownloadEntity downloadEntity = new DownloadEntity();
            downloadEntity.setUuid(linkUuid);
            downloadEntity.setFileUuid(fileId);
            downloadEntity.setFolderUuid(folderId);
            downloadEntity.setOwnerUuid(uuid);
            downloadEntity.setDateCreated(LocalDateTime.now().toString());
            downloadEntity.setDateExpire(date);
            downloadEntity.setDownloadLimit(downloadLimit);

            downloadRepository.save(downloadEntity);

            return ResponseEntity.ok(linkUuid);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(e));
        }
    }

}
