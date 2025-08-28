package server.phoestorage.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import server.phoestorage.datasource.users.UserRepository;
import server.phoestorage.dto.DownloadEntry;
import server.phoestorage.dto.SettingsEntry;
import server.phoestorage.service.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final LinkService linkService;
    private final UserService userService;
    private UserRepository userRepository;
    private AppUserDetailsService appUserDetailsService;

    @Autowired
    public UserController(UserRepository userRepository, AppUserDetailsService appUserDetailsService, LinkService linkService, UserService userService) {
        this.userRepository = userRepository;
        this.appUserDetailsService = appUserDetailsService;
        this.linkService = linkService;
        this.userService = userService;
    }

    @GetMapping("/whois")
    public ResponseEntity<String> whoIs(@RequestParam() String uuid) {
        String username = userRepository.findUsernameByUuid(uuid).orElse(null);
        if(username == null || username.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(username);
    }

    @GetMapping("/whoami")
    public ResponseEntity<String> whoAmI() {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(uuid);
    }

    @GetMapping("/space")
    public ResponseEntity<String> getSpace() {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(userRepository.findByUuid(uuid).getDataUsed() + "-" + userRepository.findByUuid(uuid).getDataLimit());
    }

    @GetMapping("/download")
    public ResponseEntity<List<DownloadEntry>> getDownloads() {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(linkService.getDownloads(uuid));
    }

    @DeleteMapping("/download")
    public ResponseEntity<String> deleteDownload(
            @RequestParam() String downloadUuid
    ) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        int code = linkService.deleteDownloadLink(downloadUuid, uuid);
        return switch (code) {
            case 0 -> ResponseEntity.ok("");
            case 404 -> ResponseEntity.notFound().build();
            default -> ResponseEntity.internalServerError().build();
        };
    }

    @GetMapping("/setting")
    public ResponseEntity<SettingsEntry> getSettings() {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(userService.getSettings(uuid));
    }

    @PostMapping("/setting")
    public ResponseEntity<String> setSetting(
            @RequestParam() String name,
            @RequestParam() String value
    ) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        int code = userService.setSetting(uuid, name, value);
        return switch (code) {
            case 0 -> ResponseEntity.ok("");
            case 400 -> ResponseEntity.badRequest().build();
            case 404 -> ResponseEntity.notFound().build();
            case 409 -> ResponseEntity.status(409).build();
            default -> ResponseEntity.internalServerError().build();
        };
    }

    @PostMapping("/password")
    public ResponseEntity<String> setPassword(
            @RequestParam() String oldPassword,
            @RequestParam() String newPassword
    ) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        int code = userService.setPassword(uuid, oldPassword, newPassword);
        return switch (code) {
            case 0 -> ResponseEntity.ok("");
            case 400 -> ResponseEntity.badRequest().build();
            case 404 -> ResponseEntity.notFound().build();
            case 401 -> ResponseEntity.status(401).build();
            default -> ResponseEntity.internalServerError().build();
        };
    }

    @PostMapping("/forcePassword")
    public ResponseEntity<String> forceSetPassword(
            @RequestParam() String newPassword
    ) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        int code = userService.forceSetPassword(uuid, newPassword);
        return switch (code) {
            case 0 -> ResponseEntity.status(HttpStatus.OK).body("Password has been updated");
            case 400 -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be 3 characters or more");
            case 404 -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            case 401 -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are note forced to change your password. Please use settings");
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something happened");
        };
    }

    @GetMapping("/forcePassword")
    public ResponseEntity<String> getForcePassword(
    ) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();
        if(uuid == null || uuid.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        boolean change = userService.passwordChangeForce(uuid);
        if(change) {return ResponseEntity.ok("");}
        return ResponseEntity.badRequest().build();
    }
}
