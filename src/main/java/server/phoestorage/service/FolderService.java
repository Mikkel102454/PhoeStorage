package server.phoestorage.service;

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

import java.io.File;
import java.util.*;

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
     * Create folder
     *
     * @param folderId the parent folder
     * @param folderName the name of the new folder
     * @return exit code
     *
     */
    public int createFolder(String folderId, String folderName) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        if(folderExistByName(uuid, folderId, folderName)) { folderName = getValidFolderName(folderId, folderName, uuid); }

        if(folderName.equals("nil")) { return 409; }

        FolderEntity folderEntity = new FolderEntity();
        folderEntity.setUuid(UUID.randomUUID().toString());
        folderEntity.setName(folderName);
        folderEntity.setFolderId(folderId);
        folderEntity.setOwner(uuid);
        folderEntity.setUserCreated(true);

        folderRepository.save(folderEntity);
        return 0;
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

        Optional<FolderEntity> folderEntity = folderRepository.findByOwnerAndFolderIdAndUuid(uuid, folderId, folderUuid);
        if(folderEntity.isEmpty()) {return 404;}

        Map<String, Object> folderResponse = BrowseDirectory(folderId).getBody();

        for (FileEntity file : (FileEntity[]) folderResponse.get("files")){
            fileService.deleteFile(file.getFolderId(), file.getUuid());
        }
        for (FolderEntity folder : (FolderEntity[]) folderResponse.get("folders")){
            deleteFolder(folder.getFolderId(), folder.getUuid());
        }

        folderRepository.delete(folderEntity.get());
        return 0;
    }

    public ResponseEntity<String> getParentFolder(String folderId, String folderName) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(!folderExistByName(uuid, folderId, folderName)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(handlerService.get404());
        }

        FolderEntity folderEntity = folderRepository.findByOwnerAndFolderIdAndName(uuid, folderId, folderName).get();
        return ResponseEntity.ok(folderEntity.getFolderId());
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
}
