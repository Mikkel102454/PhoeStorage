package server.phoestorage.controller.api;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import server.phoestorage.datasource.download.DownloadEntity;
import server.phoestorage.datasource.download.DownloadRepository;
import server.phoestorage.service.*;

@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final FolderService folderService;
    private final DownloadRepository downloadRepository;
    private FileService fileService;
    private HandlerService handlerService;
    private LinkService linkService;
    @Autowired
    public PublicController(FileService fileService,
                            HandlerService handlerService,
                            FolderService folderService,
                            LinkService linkService, DownloadRepository downloadRepository) {
        this.fileService = fileService;
        this.handlerService = handlerService;
        this.folderService = folderService;
        this.linkService = linkService;
        this.downloadRepository = downloadRepository;
    }
    @GetMapping("/download/file")
    public ResponseEntity<?> downloadFile(
            @RequestParam("downloadId") String downloadId,
            @RequestHeader(value = "Range", required = false) String rangeHeader
    ){
        DownloadEntity downloadEntity = linkService.isLinkValid(downloadId);
        if(downloadEntity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
        }

        downloadEntity.setDownloads(downloadEntity.getDownloads() + 1);
        downloadRepository.save(downloadEntity);
        return fileService.downloadFile(downloadEntity.getFolderUuid(), downloadEntity.getFileUuid(), rangeHeader, downloadEntity.getOwnerUuid());
    }

    @GetMapping("/download/folder")
    public void downloadFolder(
            @RequestParam("downloadId") String downloadId,
            HttpServletResponse response
    ){
        DownloadEntity downloadEntity = linkService.isLinkValid(downloadId);
        if(downloadEntity == null) {
            response.setStatus(HttpStatus.NOT_FOUND.value());
            System.out.println("downloadEntity was not found for zip download");
            return;
        }

        downloadEntity.setDownloads(downloadEntity.getDownloads() + 1);
        downloadRepository.save(downloadEntity);
        folderService.downloadZipFile(downloadEntity.getFolderUuid(), downloadEntity.getFileUuid(), response, downloadEntity.getOwnerUuid());
    }

    @GetMapping("/download/info")
    public ResponseEntity<?> getInfoOfDownload(
            @RequestParam("downloadId") String downloadId
    ){
        return linkService.getDownloadInfo(downloadId);
    }


}
