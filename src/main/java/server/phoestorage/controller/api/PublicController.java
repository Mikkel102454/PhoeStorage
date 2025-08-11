package server.phoestorage.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import server.phoestorage.datasource.download.DownloadEntity;
import server.phoestorage.datasource.download.DownloadRepository;
import server.phoestorage.service.FileService;
import server.phoestorage.service.HandlerService;

@RestController
@RequestMapping("/api/public")
public class PublicController {
    private FileService fileService;
    private DownloadRepository downloadRepository;
    private HandlerService handlerService;
    @Autowired
    public PublicController(FileService fileService, DownloadRepository downloadRepository, HandlerService handlerService) {
        this.fileService = fileService;
        this.downloadRepository = downloadRepository;
        this.handlerService = handlerService;
    }
    @GetMapping("/download")
    public ResponseEntity<?> download(
            @RequestParam("downloadId") String downloadId,
            @RequestHeader(value = "Range", required = false) String rangeHeader
    ){
        DownloadEntity downloadEntity = downloadRepository.findByUuid(downloadId);
        if(downloadEntity.getDownloads() >= downloadEntity.getDownloadLimit()){
            // max number of downloads reached
            downloadRepository.delete(downloadEntity);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
        }
        // TODO
        // check date
        return fileService.downloadFile(downloadEntity.getFolderUuid(), downloadEntity.getFileUuid(), rangeHeader);
    }
}
