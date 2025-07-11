package server.phoestorage.controller.api;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import server.phoestorage.datasource.file.FileEntity;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.service.FileService;
import server.phoestorage.service.FolderService;
import server.phoestorage.service.HandlerService;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
public class FolderController {
    private final FileRepository fileRepository;
    private FolderService folderService;
    private HandlerService handlerService;

    @Autowired
    public FolderController(FolderService folderService, HandlerService handlerService, FileRepository fileRepository) {
        this.folderService = folderService;
        this.handlerService = handlerService;
        this.fileRepository = fileRepository;
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
        folderName = folderName.replaceAll("\\s+", " ").trim();
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

    @PostMapping("/delete")
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

    @GetMapping("/location")
    public ResponseEntity<?> getFolderLocation(
            @RequestParam("folderUuid") String folderUuid
    ){
        return folderService.getFolderLocation(folderUuid);
    }

    @PostMapping("/rename")
    public ResponseEntity<?> renameFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderUuid") String folderUuid,
            @RequestParam("name") String name
    ){
        if(name.isEmpty()) {return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(handlerService.get400());}
        name = name.replaceAll("\\s+", " ").trim();
        return folderService.renameFolder(folderId, folderUuid, name);
    }
}
