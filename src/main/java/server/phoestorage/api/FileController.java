package server.phoestorage.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.phoestorage.datasource.users.UserRepository;
import server.phoestorage.dto.FileEntry;
import server.phoestorage.service.AppUserDetailsService;
import server.phoestorage.service.FileService;

import java.io.File;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FileController {

    private FileService fileService;

    @Autowired
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/browse")
    public ResponseEntity<?> browseDirectory(@RequestParam() String path) {
        return fileService.BrowseDirectory(path, SecurityContextHolder.getContext());
    }
}
