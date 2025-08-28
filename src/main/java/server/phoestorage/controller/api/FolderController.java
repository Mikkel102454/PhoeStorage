package server.phoestorage.controller.api;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.graphql.GraphQlProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.dto.FolderEntry;
import server.phoestorage.service.*;


@RestController
@RequestMapping("/api/folders")
public class FolderController {
    private final FolderService folderService;
    private final HandlerService handlerService;
    private final LinkService linkService;
    private final AppUserDetailsService appUserDetailsService;

    @Autowired
    public FolderController(FolderService folderService,
                            HandlerService handlerService,
                            LinkService linkService,
                            AppUserDetailsService appUserDetailsService) {
        this.folderService = folderService;
        this.handlerService = handlerService;
        this.linkService = linkService;
        this.appUserDetailsService = appUserDetailsService;
    }

    @GetMapping("/browse")
    public ResponseEntity<?> browseDirectory(@RequestParam() String folderId) {
        return folderService.BrowseDirectory(folderId);
    }

    @GetMapping("/download")
    public void downloadFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderUuid") String folderUuid,
            HttpServletResponse response
    ){
        folderService.downloadZipFile(folderId, folderUuid, response, appUserDetailsService.getUserEntity().getUuid());
    }
    @PostMapping("/download")
    public String createDownload(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderUuid") String folderUuid,
            @RequestParam(value="limit", defaultValue = "-1", required = false) int downloadLimit,
            @RequestParam(value = "expire", defaultValue = "-1", required = false) String expireDate
    ){
        return linkService.createDownloadLink(folderId, folderUuid, downloadLimit, expireDate, true);
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
    public ResponseEntity<?> getParentFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderName") String folderName
    ){
        FolderEntry folderEntry = folderService.getParentFolder(folderId, folderName);
        if(folderEntry == null){return ResponseEntity.status(500).body("Internal server error");}
        return ResponseEntity.ok(folderEntry);
    }

    @GetMapping("/location")
    public ResponseEntity<?> getFolderLocation(
            @RequestParam("folderUuid") String folderUuid
    ){
        return folderService.getFolderLocation(folderUuid);
    }

    /* OPTIMISED */
    @PostMapping("/upload")
    public ResponseEntity<?> createFolder(
            @RequestParam(value="folderName", defaultValue = "New Folder", required = false) String folderName,
            @RequestParam("folderId") String folderId
    ){
        if(folderName.isEmpty()) { folderName = "New Folder"; }
        folderName = folderName.replaceAll("\\s+", " ").trim();

        FolderEntry folder = folderService.createFolder(folderId, folderName);
        if(folder == null) {return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something happened");}
        return ResponseEntity.status(HttpStatus.CREATED).body(folder);
    }

    @PostMapping("/rename")
    public ResponseEntity<String> renameFolder(
            @RequestParam("folderId") String folderId,
            @RequestParam("folderUuid") String folderUuid,
            @RequestParam("name") String name
    ){
        if(name.isEmpty()) {return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Folder name cannot be empty");}
        name = name.replaceAll("\\s+", " ").trim();
        int code = folderService.renameFolder(folderId, folderUuid, name);
        return switch (code) {
            case 200 -> ResponseEntity.status(HttpStatus.OK).body("Successfully renamed folder");
            case 404 -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Something was not found");
            case 409 -> ResponseEntity.status(HttpStatus.CONFLICT).body("A folder named that already exist in this location");
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something happened");
        };
    }

    @PutMapping("/move")
    public ResponseEntity<String> moveFolder(
            @RequestParam("itemId") String itemId,
            @RequestParam("newFolderId") String newFolderId
    ){
        int code = folderService.moveFolder(itemId, newFolderId);
        return switch (code) {
            case 200 -> ResponseEntity.status(HttpStatus.OK).body("Successfully moved folder");
            case 404 -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Something was not found");
            case 409 -> ResponseEntity.status(HttpStatus.CONFLICT).body("A folder named that already exist in the new location");
            default -> ResponseEntity.status(HttpStatus.CONFLICT).body("Something happened");
        };
    }
}
