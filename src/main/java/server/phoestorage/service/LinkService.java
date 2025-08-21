package server.phoestorage.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.View;
import server.phoestorage.datasource.download.DownloadEntity;
import server.phoestorage.datasource.download.DownloadRepository;
import server.phoestorage.datasource.file.FileEntity;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.datasource.folder.FolderEntity;
import server.phoestorage.datasource.folder.FolderRepository;
import server.phoestorage.dto.DownloadEntry;
import server.phoestorage.dto.FileEntry;
import server.phoestorage.dto.FolderEntry;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class LinkService {
    private final AppUserDetailsService appUserDetailsService;

    private final FileService fileService;
    private final FolderService folderService;

    private final DownloadRepository downloadRepository;
    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;

    @Autowired
    public LinkService(AppUserDetailsService appUserDetailsService,
                       FileService fileService, FolderService folderService,
                       DownloadRepository downloadRepository, FileRepository fileRepository, FolderRepository folderRepository) {
        this.appUserDetailsService = appUserDetailsService;
        this.fileService = fileService;
        this.folderService = folderService;
        this.downloadRepository = downloadRepository;
        this.fileRepository = fileRepository;
        this.folderRepository = folderRepository;
    }

    public String createDownloadLink(String parentId, String childId, int downloadLimit, String date, boolean isFolder) {
        try {
            String uuid = appUserDetailsService.getUserEntity().getUuid();
            if (!isFolder && !fileService.fileExistByUuid(uuid, parentId, childId)) {
                return "404 - NOT FOUND";
            }
            else if (isFolder && !folderService.folderExistByUuid(uuid, parentId, childId)) {
                return "404 - NOT FOUND";
            }



            String linkUuid = UUID.randomUUID().toString();
            linkUuid = linkUuid.replace("-", "");
            DownloadEntity downloadEntity = new DownloadEntity();
            downloadEntity.setUuid(linkUuid);
            downloadEntity.setFileUuid(childId);
            downloadEntity.setFolderUuid(parentId);

            downloadEntity.setOwnerUuid(uuid);
            downloadEntity.setDateCreated(LocalDateTime.now().toString());
            downloadEntity.setDateExpire(date);
            downloadEntity.setDownloadLimit(downloadLimit);
            downloadEntity.setIsFolder(isFolder);

            if(isFolder){
                downloadEntity.setSize(folderRepository.totalSizeUnderFolder(childId, parentId, uuid));
                downloadEntity.setFileExtension("zip");
                downloadEntity.setFileName(folderRepository.findByOwnerAndFolderIdAndUuid(uuid, parentId, childId).get().getName());
            }else{
                downloadEntity.setSize(fileRepository.findByOwnerAndFolderIdAndUuid(uuid, parentId, childId).get().getSize());

                FileEntity fileEntity = fileRepository.findByOwnerAndFolderIdAndUuid(uuid, parentId, childId).get();
                downloadEntity.setFileExtension(fileEntity.getExtension());
                downloadEntity.setFileName(fileEntity.getName());
            }


            downloadRepository.save(downloadEntity);


            return linkUuid;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return "500 - INTERNAL SERVER ERROR";
        }
    }

    public int deleteDownloadLink(String linkUuid,String owner) {
        try{
            Optional<DownloadEntity> downloadEntity = downloadRepository.findByUuidAndOwnerUuid(linkUuid, owner);
            if (downloadEntity.isEmpty()) { return 404; }
            downloadRepository.delete(downloadEntity.get());
            return 0;
        }catch (Exception e){
            System.err.println(e.getMessage());
            return -1;
        }
    }

    public int deleteAllDownloadLink(String owner) {
        try{
            List<DownloadEntity> downloadEntitys = downloadRepository.findAllByOwnerUuid(owner);
            downloadRepository.deleteAll(downloadEntitys);
            return 0;
        }catch (Exception e){
            System.err.println(e.getMessage());
            return -1;
        }
    }


    public DownloadEntity isLinkValid(String linkUuid) {
        DownloadEntity downloadEntity = downloadRepository.findByUuid(linkUuid);
        if(downloadEntity == null) {
            System.out.println("downloadEntity was not found in database");
            return null;
        }
        if(downloadEntity.getDownloadLimit() >= 0 && downloadEntity.getDownloads() >= downloadEntity.getDownloadLimit()){
            // max number of downloads reached
            downloadRepository.delete(downloadEntity);
            System.out.println("downloadEntity reached maximum downloads. Deleting...");
            return null;
        }

        downloadRepository.save(downloadEntity);
        return downloadEntity;
    }

    public ResponseEntity<DownloadEntry> getDownloadInfo(String downloadUuid) {
        DownloadEntity downloadEntity = isLinkValid(downloadUuid);
        if(downloadEntity == null) {
            System.out.println("downloadEntity was not found in database");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        DownloadEntry downloadEntry = new DownloadEntry();
        downloadEntry.setIsFolder(downloadEntity.getIsFolder());
        downloadEntry.setSize(downloadEntity.getSize());
        downloadEntry.setDateExpire(downloadEntity.getDateExpire());
        downloadEntry.setOwnerUuid(downloadEntity.getOwnerUuid());
        downloadEntry.setFileExtension(downloadEntity.getFileExtension());
        downloadEntry.setFileName(downloadEntity.getFileName());

        return ResponseEntity.ok(downloadEntry);
    }

    public List<DownloadEntry> getDownloads(String owner){
        List<DownloadEntity> downloadEntities = downloadRepository.findAllByOwnerUuid(owner);

        List<DownloadEntry> downloadEntries = new ArrayList<>();
        for(DownloadEntity downloadEntity : downloadEntities){
            DownloadEntry downloadEntry = new DownloadEntry();
            downloadEntry.setUuid(downloadEntity.getUuid());
            downloadEntry.setOwnerUuid(downloadEntity.getOwnerUuid());
            downloadEntry.setFileName(downloadEntity.getFileName());
            downloadEntry.setFileExtension(downloadEntity.getFileExtension());
            downloadEntry.setDownloads(downloadEntity.getDownloads());
            downloadEntry.setMaxDownloads(downloadEntity.getDownloadLimit());
            downloadEntry.setDateExpire(downloadEntity.getDateExpire());
            downloadEntry.setIsFolder(downloadEntity.getIsFolder());
            downloadEntries.add(downloadEntry);
        }
        return downloadEntries;
    }

    public List<DownloadEntry> getAllDownloads(){
        List<DownloadEntity> downloadEntities = downloadRepository.findAll();

        List<DownloadEntry> downloadEntries = new ArrayList<>();
        for(DownloadEntity downloadEntity : downloadEntities){
            DownloadEntry downloadEntry = new DownloadEntry();
            downloadEntry.setUuid(downloadEntity.getUuid());
            downloadEntry.setOwnerUuid(downloadEntity.getOwnerUuid());
            downloadEntry.setFileName(downloadEntity.getFileName());
            downloadEntry.setFileExtension(downloadEntity.getFileExtension());
            downloadEntry.setDownloads(downloadEntity.getDownloads());
            downloadEntry.setMaxDownloads(downloadEntity.getDownloadLimit());
            downloadEntry.setDateExpire(downloadEntity.getDateExpire());
            downloadEntry.setIsFolder(downloadEntity.getIsFolder());
            downloadEntries.add(downloadEntry);
        }
        return downloadEntries;
    }
}
