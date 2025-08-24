package server.phoestorage.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import server.phoestorage.datasource.file.FileEntity;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.datasource.folder.FolderEntity;
import server.phoestorage.datasource.folder.FolderRepository;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.dto.FileEntry;
import server.phoestorage.dto.FolderEntry;
import server.phoestorage.zip.ZipBridge;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipOutputStream;

@Service
public class FolderService {
    @Value("${server.root}")
    private String rootPath;

    private final AppUserDetailsService appUserDetailsService;
    private final FileService fileService;
    private final HandlerService handlerService;

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;

    @Autowired
    public FolderService(AppUserDetailsService appUserDetailsService,
                       FolderRepository folderRepository,
                         FileRepository fileRepository,
                         FileService fileService,
                         HandlerService handlerService) {
        this.appUserDetailsService = appUserDetailsService;
        this.folderRepository = folderRepository;
        this.fileRepository = fileRepository;
        this.fileService = fileService;
        this.handlerService = handlerService;
    }

    /**
     * Create user folders
     *
     * @param user the user
     * @return true if successful and false if unsuccessful
     *
     */
    public void createUserFolder(UserEntity user) {
        try{
            new File(rootPath + user.getUuid()).mkdirs();
            new File(rootPath + user.getUuid() + "/temp").mkdirs();
            new File(rootPath + user.getUuid() + "/temp/upload").mkdirs();
            new File(rootPath + user.getUuid() + "/storage").mkdirs();

            FolderEntity folderEntity = new FolderEntity();
            folderEntity.setUuid(user.getUuid());
            folderEntity.setOwner(user.getUuid());
            folderEntity.setFolderId("-1");
            folderEntity.setName("My Drive");
            folderEntity.setUserCreated(false);

            folderRepository.save(folderEntity);
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
        }
    }

    /**
     * Delete user folders
     *
     * @param user the user uuid
     * @return true if successful and false if unsuccessful
     *
     */
    public void deleteUserFolder(String user) {
        try{
            deleteDirectoryRecursively(Paths.get(rootPath, user));

            folderRepository.deleteAll(folderRepository.findAllByOwner(user));
            fileRepository.deleteAll(fileRepository.findAllByOwner(user));
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
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
            fileEntry.setStarred(file.getStarred());
            fileResult.add(fileEntry);
        }

        List<FolderEntity> folders = folderRepository.findByOwnerAndFolderId(uuid, folderId);
        for (FolderEntity folder : folders) {
            FolderEntry folderEntry = new FolderEntry();
            folderEntry.setUuid(folder.getUuid());
            folderEntry.setOwner(uuid);
            folderEntry.setName(folder.getName());
            folderEntry.setFolderId(folder.getFolderId());
            folderEntry.setSize(folderRepository.totalSizeUnderFolder(folder.getUuid(), folder.getFolderId(), uuid));
            folderResult.add(folderEntry);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("files", fileResult);
        response.put("folders", folderResult);
        return ResponseEntity.ok(response);
    }

    /**
     * Create folder
     *
     * @param folderId the parent folder
     * @param folderName the name of the new folder
     * @return exit code
     *
     */
    public ResponseEntity<String> createFolder(String folderId, String folderName) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        if(folderExistByName(uuid, folderId, folderName)) { folderName = getValidFolderName(folderId, folderName, uuid); }

        if(folderName.equals("nil")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(folderName);
        }

        String folderUuid = UUID.randomUUID().toString();

        FolderEntity folderEntity = new FolderEntity();
        folderEntity.setUuid(folderUuid);
        folderEntity.setName(folderName);
        folderEntity.setFolderId(folderId);
        folderEntity.setOwner(uuid);
        folderEntity.setUserCreated(true);

        folderRepository.save(folderEntity);
        return ResponseEntity.ok(folderUuid);
    }
    public String getValidFolderName(String folderId, String folderName, String owner) {
        List<String> existingNames = folderRepository
                .findByOwnerAndFolderIdStartingWithName(owner, folderId, folderName);

        if (!existingNames.contains(folderName)) {
            return folderName;
        }

        for (int i = 1; i <= 20; i++) {
            String newFolderName = folderName + " (" + i + ")";
            if (!existingNames.contains(newFolderName)) {
                return newFolderName;
            }
        }

        return "nil"; // fallback if all names are taken
    }

    /**
     * Delete folder
     *
     * @param folderId the parent folder
     * @param folderUuid uuid of the folder
     * @return exit code
     *
     */
    public int deleteFolder(String folderId, String folderUuid) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        if(!folderExistByUuid(uuid, folderId, folderUuid)) { return 404; }

        List<FolderEntity> folders = folderRepository.findAllDescendantFolders(uuid, folderId, folderUuid);
        List<FileEntity> files = fileRepository.findAllFilesUnderFolderTree(uuid, folderId, folderUuid);

        for(FileEntity file : files) {
            fileService.deleteFile(file.getFolderId(), file.getUuid());
        }
        folderRepository.deleteAll(folders);

        return 0;
    }

    public ResponseEntity<?> renameFolder(String folderId, String folderUuid, String name){
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        if(!folderExistByUuid(uuid, folderId, folderUuid)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
        }

        if(folderRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, folderUuid).get().getName().equals(name)) {
            return ResponseEntity.ok().body("");
        }

        if(folderExistByName(uuid, folderId, name)) {
            name = getValidFolderName(folderId, name, uuid);
            if(name.equals("nil")){
                return ResponseEntity.status(HttpStatus.CONFLICT).body(name);
            }
        }

        if(folderRepository.renameFolder(uuid, folderId, folderUuid, name) != 1){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(new Exception()));
        }
        return ResponseEntity.ok("");
    }

    public FolderEntry getParentFolder(String folderId, String folderName) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(!folderExistByName(uuid, folderId, folderName)) {
            return null;
        }

        FolderEntity folderEntity = folderRepository.findByOwnerAndFolderIdAndName(uuid, folderId, folderName).get();

        FolderEntry folderEntry = new FolderEntry();
        folderEntry.setUuid(folderEntity.getUuid());
        folderEntry.setOwner(uuid);
        folderEntry.setName(folderName);
        folderEntry.setFolderId(folderEntity.getFolderId());

        return folderEntry;
    }

    public ResponseEntity<List<FolderEntry>> getFolderLocation(String folderUuid) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        List<FolderEntity> folders = folderRepository.findChainUntilUserRoot(folderUuid, uuid);

        List<FolderEntry> entrys = new ArrayList<>();
        for (FolderEntity folder : folders) {
            FolderEntry folderEntry = new FolderEntry();

            folderEntry.setUuid(folder.getUuid());
            folderEntry.setName(folder.getName());
            folderEntry.setFolderId(folder.getFolderId());
            folderEntry.setOwner(folder.getOwner());

            entrys.add(folderEntry);
        }
        return ResponseEntity.ok().body(entrys);
    }

    /**
     * Folder exist with name
     *
     * @param folderId the parent folder
     * @param folderName name of the folder
     * @return exit code
     *
     */
    public boolean folderExistByName(String owner, String folderId, String folderName) {
        Optional<FolderEntity> folderEntity = folderRepository.findByOwnerAndFolderIdAndName(owner, folderId, folderName);

        return folderEntity.isPresent();
    }

    /**
     * Folder exist with uuid
     *
     * @param folderId the parent folder
     * @param folderUuid uuid of the folder
     * @return exit code
     *
     */
    public boolean folderExistByUuid(String owner, String folderId, String folderUuid) {
        Optional<FolderEntity> folderEntity = folderRepository.findByOwnerAndFolderIdAndUuid(owner, folderId, folderUuid);

        return folderEntity.isPresent();
    }

    public void downloadZipFile(String folderId, String folderUuid, HttpServletResponse response, String uuid) {
        try {
            List<FolderEntity> allFolders = folderRepository.findAllDescendantFolders(uuid, folderId, folderUuid);
            List<FileEntity> allFiles = fileRepository.findAllFilesUnderFolderTree(uuid, folderId, folderUuid);

            List<FileEntity> validFiles = allFiles.stream()
                    .filter(f -> Files.exists(Paths.get(f.getInternalPath())))
                    .toList();

            if (validFiles.isEmpty()) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND , "No files found to zip.");
                System.err.println("No files found to zip.");
                return;
            }

            String zipFileName = allFolders.stream()
                    .filter(f -> f.getUuid().equals(folderUuid))
                    .map(FolderEntity::getName)
                    .findFirst()
                    .orElse("download") + ".zip";

            response.setContentType("application/zip");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFileName + "\"");

            Map<String, String> zipMap = buildZipPathMap(validFiles, allFolders, folderUuid);

            String[] zipNames = zipMap.keySet().toArray(new String[0]);
            String[] diskPaths = zipMap.values().toArray(new String[0]);

            new ZipBridge().streamZip(zipNames, diskPaths, response.getOutputStream());

        } catch (Exception e) {
            System.err.println("ZIP generation failed: " + e.getMessage());
            try {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to generate zip.");
            } catch (IOException ioException) {
                ioException.printStackTrace();
            }
        }
    }

    public Map<String, String> buildZipPathMap(List<FileEntity> files, List<FolderEntity> folders, String rootFolderId) {
        Map<String, FolderEntity> folderMap = folders.stream()
                .collect(Collectors.toMap(FolderEntity::getUuid, f -> f));

        Map<String, String> result = new LinkedHashMap<>();

        for (FileEntity file : files) {
            String zipPath = file.getName();
            String parentId = file.getFolderId();

            while (parentId != null) {
                FolderEntity parent = folderMap.get(parentId);
                if (parent == null || parent.getUuid().equals(rootFolderId)) break;

                zipPath = parent.getName() + "/" + zipPath;
                parentId = parent.getFolderId();
            }

            result.put(zipPath, file.getInternalPath());
        }

        return result;
    }


    public static void deleteDirectoryRecursively(Path dir) throws IOException {
        if (dir == null || !Files.exists(dir)) return;

        // Don’t follow symlinks so we only delete inside this tree.
        Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.deleteIfExists(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path directory, IOException exc) throws IOException {
                // Delete directory after its contents
                Files.deleteIfExists(directory);
                return FileVisitResult.CONTINUE;
            }
        });
    }
}
