package server.phoestorage.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import server.phoestorage.datasource.download.DownloadEntity;
import server.phoestorage.datasource.download.DownloadRepository;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.datasource.folder.FolderRepository;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class LinkService {
    private final AppUserDetailsService appUserDetailsService;
    private final HandlerService handlerService;

    private final FileService fileService;
    private final FolderService folderService;

    private final DownloadRepository downloadRepository;

    @Autowired
    public LinkService(AppUserDetailsService appUserDetailsService,
                       HandlerService handlerService,
                       FileService fileService, FolderService folderService,
                       DownloadRepository downloadRepository) {
        this.appUserDetailsService = appUserDetailsService;
        this.handlerService = handlerService;
        this.fileService = fileService;
        this.folderService = folderService;
        this.downloadRepository = downloadRepository;
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

            downloadRepository.save(downloadEntity);


            return linkUuid;
        } catch (Exception e) {
            return "500 - INTERNAL SERVER ERROR";
        }
    }

    public DownloadEntity isLinkValid(String linkUuid) {
        DownloadEntity downloadEntity = downloadRepository.findByUuid(linkUuid);
        if(downloadEntity == null) {return null;}
        downloadEntity.setDownloads(downloadEntity.getDownloads() + 1);
        if(downloadEntity.getDownloadLimit() >= 0 && downloadEntity.getDownloads() >= downloadEntity.getDownloadLimit()){
            // max number of downloads reached
            downloadRepository.delete(downloadEntity);
            return null;
        }

        downloadRepository.save(downloadEntity);
        return downloadEntity;
    }
}
