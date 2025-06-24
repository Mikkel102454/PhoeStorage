package server.phoestorage.controller.api;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import server.phoestorage.service.FileService;
import server.phoestorage.service.FolderService;
import server.phoestorage.service.HandlerService;

@RestController
@RequestMapping("/api/folders")
public class FolderController {
    private FolderService folderService;
    private HandlerService handlerService;

    @Autowired
    public FolderController(FolderService folderService, HandlerService handlerService) {
        this.folderService = folderService;
        this.handlerService = handlerService;
    }

    @GetMapping("/browse")
    public ResponseEntity<?> browseDirectory(@RequestParam() String folderId) {
        return folderService.BrowseDirectory(folderId);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> createFolder(
            @RequestParam(value="folderName", defaultValue = "New Folder", required = false) String folderName,
            @RequestParam("folderId") String folderId
    ){
        if(folderName.isEmpty()) { folderName = "New Folder"; }

        return folderService.createFolder(folderId, folderName);
    }

    @GetMapping("/download")
    public void downloadFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderUuid") String folderUuid,
            HttpServletResponse response
    ){
        folderService.downloadZipFile(folderId, folderUuid, response);
    }

    @GetMapping("/delete")
    public ResponseEntity<String> deleteFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderUuid") String folderUuid
    ){
        int code = folderService.deleteFolder(folderId, folderUuid);

        if(code == 404){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(handlerService.get404());
        }
        return ResponseEntity.ok("");
    }

    @GetMapping("/parent")
    public ResponseEntity<String> getParentFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderName") String folderName
    ){
        return folderService.getParentFolder(folderId, folderName);
    }
}
