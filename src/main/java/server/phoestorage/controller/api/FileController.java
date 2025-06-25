package server.phoestorage.controller.api;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import server.phoestorage.service.FileService;
import server.phoestorage.service.HandlerService;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private FileService fileService;
    private HandlerService handlerService;

    @Autowired
    public FileController(FileService fileService, HandlerService handlerService) {
        this.fileService = fileService;
        this.handlerService = handlerService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadChunk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") int totalChunks,
            @RequestParam("fileName") String fileName,
            @RequestParam("folderId") String folderId
    ){
        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body("Chunk too large (max 10 MB) the chunk was " + file.getSize() + " Bytes");
        }
        fileName = fileName.replaceAll("\\s+", " ").trim();
        int chunkCode = fileService.saveChunk(chunkIndex, file, folderId, fileName);
        if(chunkCode == -2) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(fileName);
        }
        if(chunkCode != 0) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(new Exception(String.valueOf(chunkCode))));
        }

        if(chunkIndex >= totalChunks - 1) {
            String internalFileName = fileService.mergeChunk(totalChunks);
            if(fileService.saveFileDatabase(internalFileName, folderId, fileName) != 0){
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(new Exception("error while saving file to database")));
            }
        }
        return ResponseEntity.ok("");
    }

    @GetMapping("/download")
    public ResponseEntity<?> downloadFile(
            @RequestParam("fileId") String fileId,
            @RequestParam("folderId") String FolderId,
            @RequestHeader(value = "Range", required = false) String rangeHeader
    ){
        return fileService.downloadFile(FolderId, fileId, rangeHeader);
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteFile(
            @RequestParam("folderId") String folderId,
            @RequestParam("fileId") String fileId
    ){
        return fileService.deleteFile(folderId, fileId);
    }

    @PostMapping("/rename")
    public ResponseEntity<?> renameFile(
            @RequestParam("folderId") String folderId,
            @RequestParam("fileId") String fileId,
            @RequestParam("name") String name
    ){
        if(name.isEmpty()) {return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(handlerService.get400());}
        name = name.replaceAll("\\s+", " ").trim();
        return fileService.renameFile(folderId, fileId, name);
    }
}