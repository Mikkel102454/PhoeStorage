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
import server.phoestorage.datasource.file.FileEntity;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.datasource.folder.FolderEntity;
import server.phoestorage.datasource.folder.FolderRepository;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.dto.FileEntry;
import server.phoestorage.dto.FolderEntry;

@Service
public class FileService {
    @Value("${server.root}")
    private String rootPath;

    private final AppUserDetailsService appUserDetailsService;
    private final HandlerService handlerService;

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;

    @Autowired
    public FileService(AppUserDetailsService appUserDetailsService, HandlerService handlerService, FileRepository fileRepository, FolderRepository folderRepository) {
        this.appUserDetailsService = appUserDetailsService;
        this.handlerService = handlerService;
        this.fileRepository = fileRepository;
        this.folderRepository = folderRepository;
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

            FolderEntity folderEntity = new FolderEntity();
            folderEntity.setUuid(user.getUuid());
            folderEntity.setOwner(user.getUuid());
            folderEntity.setFolderId("-1");
            folderEntity.setName("My Drive");
            folderEntity.setUserCreated(false);

            folderRepository.save(folderEntity);
            return true;
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
            return false;
        }
    }

    /**
     * Browse directory
     *
     * @param folderId the current browsing directory
     * @return response entity with list of FileEntry
     *
     */
    public ResponseEntity<Map<String, Object>> BrowseDirectory(String folderId) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        List<FileEntity> files = fileRepository.findByOwnerAndFolderId(uuid, folderId);
        List<FileEntry> fileResult = new ArrayList<>();
        List<FolderEntry> folderResult = new ArrayList<>();

        for(FileEntity file : files) {
            FileEntry fileEntry = new FileEntry();
            fileEntry.setUuid(file.getUuid());
            fileEntry.setOwner(file.getOwner());
            fileEntry.setName(file.getName());
            fileEntry.setExtension(file.getExtension());
            fileEntry.setFolderId(file.getFolderId());
            fileEntry.setCreated(file.getCreated());
            fileEntry.setModified(file.getModified());
            fileEntry.setAccessed(file.getAccessed());
            fileEntry.setSize(file.getSize());
            fileEntry.setIsFolder(false);
            fileResult.add(fileEntry);
        }

        List<FolderEntity> folders = folderRepository.findByOwnerAndFolderId(uuid, folderId);
        for (FolderEntity folder : folders) {
            FolderEntry folderEntry = new FolderEntry();
            folderEntry.setUuid(folder.getUuid());
            folderEntry.setOwner(uuid);
            folderEntry.setName(folder.getName());
            folderEntry.setFolderId(folder.getFolderId());
            folderResult.add(folderEntry);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("files", fileResult);
        response.put("folders", folderResult);
        return ResponseEntity.ok(response);
    }

    /**
     * Saves chunks of a file
     *
     * @param chunkId the index of the current chunk
     * @param file the chunked file
     * @param folderId the folder to save the file into
     * @param fileName the name of the file
     * @return the exit code
     *
     */
    public int saveChunk(int chunkId, MultipartFile file, String folderId, String fileName){
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();

            FileEntity fileEntity = fileRepository.findByOwnerAndFolderIdAndName(uuid, folderId, fileName);

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
     * @param folderId the folder the file should be saved in
     * @param fileName the name of the saved file
     * @return exit code
     *
     */
    public int saveFileDatabase(String internalName, String folderId, String fileName) {
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
            fileEntity.setFolderId(folderId);
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
     * @param folderId the folder the file is in
     * @param fileId the id of the file
     * @param rangeHeader the folder the file should be saved in
     * @return response entity
     *
     */
    public ResponseEntity<?> downloadFile(String folderId, String fileId, String rangeHeader) {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            FileEntity fileEntity = fileRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, fileId);

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
     * @param folderId the folder the file is in
     * @param fileId the id of the file
     * @return response entity
     *
     */
    public ResponseEntity<?> deleteFile(String folderId, String fileId) {
        try{
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            FileEntity fileEntity = fileRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, fileId);
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



//    public void downloadZipFile(String folderId, HttpServletResponse response) {
//        try {
//            String uuid = appUserDetailsService.getUserEntity().getUuid();
//            List<FileEntity> allFiles = fileRepository.findByOwnerAndFullPathStartingWith(uuid, path);
//
//            List<FileEntity> validFiles = allFiles.stream()
//                    .filter(f -> Files.exists(Paths.get(f.getInternalPath())))
//                    .toList();
//
//            if (validFiles.isEmpty()) {
//                response.sendError(HttpServletResponse.SC_NOT_FOUND, "No files found to zip.");
//                return;
//            }
//
//            String zipFileName = Paths.get(path).getFileName().toString() + ".zip";
//
//            response.setContentType("application/zip");
//            response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFileName + "\"");
//
//            try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
//                Set<String> addedFolders = new HashSet<>();
//
//                for (FileEntity file : validFiles) {
//                    Path internalPath = Paths.get(file.getInternalPath());
//
//                    String relativePath = file.getPath().startsWith(path)
//                            ? file.getPath().substring(path.length())
//                            : file.getPath();
//
//                    String virtualPath = relativePath + file.getName();
//                    if (!file.getExtension().isEmpty()) {
//                        virtualPath += "." + file.getExtension();
//                    }
//
//                    // folder creations
//                    String[] pathParts = relativePath.split("/");
//                    String folderPath = "";
//                    for (String part : pathParts) {
//                        if (part.isEmpty()) continue;
//                        folderPath += part + "/";
//                        if (addedFolders.add(folderPath)) {
//                            zos.putNextEntry(new ZipEntry(folderPath));
//                            zos.closeEntry();
//                        }
//                    }
//
//                    zos.putNextEntry(new ZipEntry(virtualPath));
//                    Files.copy(internalPath, zos);
//                    zos.closeEntry();
//                }
//            }
//
//        } catch (Exception e) {
//            System.err.println("ZIP generation failed: " + e.getMessage());
//            try {
//                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to generate zip.");
//            } catch (IOException ioException) {
//                ioException.printStackTrace();
//            }
//        }
//    }
}
