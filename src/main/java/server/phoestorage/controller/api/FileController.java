package server.phoestorage.controller.api;

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

    @GetMapping("/browse")
    public ResponseEntity<?> browseDirectory(@RequestParam() String path) {
        if(path.startsWith("/")) {
            path = path.substring(1);
        }

        if(path.length() > 1 && !path.endsWith("/")) {
            path += "/";
        }
        return fileService.BrowseDirectory(path);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadChunk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") int totalChunks,
            @RequestParam("filename") String filename,
            @RequestParam("filepath") String filepath
    ){
        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body("Chunk too large (max 10 MB) the chunk was " + file.getSize() + " Bytes");
        }


        if(filepath.startsWith("/")) {
            filepath = filepath.substring(1);
        }

        if(!filepath.isEmpty() && !filepath.endsWith("/")){
            filepath += "/";
        }

        int chunkCode = fileService.saveChunk(chunkIndex, file, filepath + filename);
        if(chunkCode == -2) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(handlerService.get409("There is already a file named: " + filename + " here"));
        }
        if(chunkCode != 0) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(new Exception(String.valueOf(chunkCode))));
        }

        if(chunkIndex >= totalChunks - 1) {
            String internalFileName = fileService.mergeChunk(totalChunks);
            if(fileService.saveFileDatabase(internalFileName, filepath, filename) != 0){
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(handlerService.get500(new Exception("error while saving file to database")));
            }
        }
        return ResponseEntity.ok("");
    }

    @GetMapping("/download")
    public ResponseEntity<?> downloadFile(
            @RequestParam("path") String filePath,
            @RequestHeader(value = "Range", required = false) String rangeHeader
    ){
        return fileService.downloadFile(filePath, rangeHeader);
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteFile(
            @RequestParam("path") String filePath
    ){
        return fileService.deleteFile(filePath);
    }
}