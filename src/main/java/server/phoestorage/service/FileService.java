package server.phoestorage.service;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Service;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.dto.FileEntry;

@Service
public class FileService {
    @Value("${server.root}")
    private String rootPath;

    private AppUserDetailsService appUserDetailsService;
    private HandlerService handlerService;

    @Autowired
    public FileService(AppUserDetailsService appUserDetailsService, HandlerService handlerService) {
        this.appUserDetailsService = appUserDetailsService;
        this.handlerService = handlerService;
    }

    public boolean createUserFolder(UserEntity user) {
        try{
            new File(rootPath + user.getUuid()).mkdirs();
            return true;
        }catch (Exception e){
            return false;
        }
    }

    public ResponseEntity<?> BrowseDirectory(String path, SecurityContext securityContext) {
        Path userRoot = Paths.get(rootPath, appUserDetailsService.getUuidFromUsername(securityContext)).toAbsolutePath().normalize();
        if(path.startsWith("/")) {
            path = path.substring(1);
        }

        Path requestedPath = userRoot.resolve(path).normalize();

        // Check if user is still in their directory
        System.out.println(requestedPath);
        if (!requestedPath.startsWith(userRoot)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(handlerService.get403());
        }
        File folder = requestedPath.toFile();

        if(!folder.exists() || !folder.isDirectory()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(handlerService.get404());
        }

        File[] files = folder.listFiles();

        List<FileEntry> result = new ArrayList<>();
        for (int i = 0; i < files.length; i++) {
            String relative = userRoot.relativize(files[i].toPath()).toString();
            result.add(new FileEntry("/" + relative, files[i].isDirectory()));
        }

        return ResponseEntity.ok(result);
    }


}
