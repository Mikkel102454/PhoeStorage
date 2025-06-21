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
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.parameters.P;
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

    private AppUserDetailsService appUserDetailsService;
    private HandlerService handlerService;

    private FileRepository fileRepository;

    @Autowired
    public FileService(AppUserDetailsService appUserDetailsService, HandlerService handlerService, FileRepository fileRepository) {
        this.appUserDetailsService = appUserDetailsService;
        this.handlerService = handlerService;
        this.fileRepository = fileRepository;
    }

    public boolean createUserFolder(UserEntity user) {
        try{
            new File(rootPath + user.getUuid()).mkdirs();
            new File(rootPath + user.getUuid() + "/temp").mkdirs();
            new File(rootPath + user.getUuid() + "/storage").mkdirs();
            return true;
        }catch (Exception e){
            return false;
        }
    }

    public ResponseEntity<?> BrowseDirectory(String path) {
        String uuid = appUserDetailsService.getUuidFromUsername();
        if(path.startsWith("/")) {
            path = path.substring(1);
        }

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
            result.add(fileEntry);
        }
        return ResponseEntity.ok(result);
    }


    public int saveChunk(int chunkId, MultipartFile file){
        try{
            String uuid = appUserDetailsService.getUuidFromUsername();
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
            e.printStackTrace();
            return -1;
        }
    }
    public String mergeChunk(int totalChunks){
        try{
            String uuid = appUserDetailsService.getUuidFromUsername();
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
            e.printStackTrace();
            return null;
        }
    }

    public int saveFile(String path, String filePath, String fileName) {
        try{
            String uuid = appUserDetailsService.getUuidFromUsername();

            String extension;

            int dotIndex = fileName.lastIndexOf(".");
            if (dotIndex != -1 && dotIndex < fileName.length() - 1) {
                extension = fileName.substring(dotIndex + 1);
            } else {
                extension = "";
            }

            String internalPath = rootPath + uuid + "/storage/" + path;

            FileEntity fileEntity = new FileEntity();
            fileEntity.setUuid(path);
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
            e.printStackTrace();
            return -1;
        }
    }
}
