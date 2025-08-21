package server.phoestorage.controller.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import server.phoestorage.dto.DownloadEntry;
import server.phoestorage.dto.UserEntry;
import server.phoestorage.service.LinkService;
import server.phoestorage.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserService userService;
    private final LinkService linkService;

    public AdminController(UserService userService, LinkService linkService) {
        this.userService = userService;
        this.linkService = linkService;
    }

    @PostMapping("/user")
    public ResponseEntity<String> createuser(
            @RequestParam() String u,
            @RequestParam() String p,
            @RequestParam() long d,
            @RequestParam() boolean a,
            @RequestParam() boolean e
    ){
        int code = userService.addUser(u, p, d, a, e);

        return switch (code) {
            case 0 -> ResponseEntity.ok("User added successfully");
            case 1 -> ResponseEntity.status(409).body("User with this username already exist");
            case 2 -> ResponseEntity.badRequest().body("Password must be at least 3 characters");
            case 3 -> ResponseEntity.badRequest().body("Username must be at least 3 characters");
            case 404 -> ResponseEntity.badRequest().body("User not found");
            default -> ResponseEntity.internalServerError().body("Failed to create user");
        };
    }

    @PutMapping("/user")
    public ResponseEntity<String> updateUser(
            @RequestParam() String uuid,
            @RequestParam() String u,
            @RequestParam() long d,
            @RequestParam() boolean a,
            @RequestParam() boolean e
    ){
        int code = userService.updateUser(uuid, u, d, a, e);

        return switch (code) {
            case 0 -> ResponseEntity.ok("User updated successfully");
            case 1 -> ResponseEntity.status(409).body("User with this username already exist");
            case 3 -> ResponseEntity.badRequest().body("Username must be at least 3 characters");
            case 404 -> ResponseEntity.badRequest().body("User not found");
            default -> ResponseEntity.internalServerError().body("Failed to update user");
        };
    }

    @PostMapping("/user/password")
    public ResponseEntity<String> resetPassword(
            @RequestParam() String uuid,
            @RequestParam() String p
    ){
        int code = userService.adminResetPassword(uuid, p);

        return switch (code) {
            case 0 -> ResponseEntity.ok("Password updated successfully");
            case 2 -> ResponseEntity.ok("Password must be at least 3 characters");
            default -> ResponseEntity.internalServerError().body("Failed to update password");
        };
    }

    @DeleteMapping("/user")
    public ResponseEntity<String> deleteUser(
            @RequestParam() String uuid
    ){
        int code = userService.adminDeleteUser(uuid);

        return switch (code) {
            case 0 -> ResponseEntity.ok("User deleted successfully");
            case 404 -> ResponseEntity.status(404).body("User not found");
            default -> ResponseEntity.internalServerError().body("Failed to delete user");
        };
    }

    @PostMapping("/user/logout")
    public ResponseEntity<String> forceLogout(
            @RequestParam() String uuid
    ){
        int code = userService.adminLogoutUser(uuid);

        return switch (code) {
            case 0 -> ResponseEntity.ok("User force logout successfully");
            case 404 -> ResponseEntity.ok("User not found");
            default -> ResponseEntity.internalServerError().body("Failed to force logout user");
        };
    }

    @GetMapping("/user")
    public ResponseEntity<List<UserEntry>> getUsers(){
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/notify")
    public ResponseEntity<String> sendNotify(
            @RequestParam() String title,
            @RequestParam() String msg
    ){

        //TODO
        // create notify
        return null;
    }

    @GetMapping("/storage")
    public ResponseEntity<long[]> getStorage(){
        return null;
    }

    @GetMapping("/link")
    public ResponseEntity<List<DownloadEntry>> getLink(){
        return ResponseEntity.ok(linkService.getAllDownloads());
    }

    @DeleteMapping("/link")
    public ResponseEntity<String> deleteLink(
            @RequestParam() String uuid,
            @RequestParam() String owner
    ){
        int code = linkService.deleteDownloadLink(uuid, owner);
        return switch (code) {
            case 0 -> ResponseEntity.ok("Download link deleted successfully");
            case 404 -> ResponseEntity.ok("Download link not found");
            default -> ResponseEntity.internalServerError().body("Failed to delete download link");
        };

    }
}
