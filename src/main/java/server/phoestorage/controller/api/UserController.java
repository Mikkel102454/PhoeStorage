package server.phoestorage.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.phoestorage.datasource.users.UserRepository;
import server.phoestorage.service.AppUserDetailsService;
import server.phoestorage.service.FileService;
import server.phoestorage.service.HandlerService;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private UserRepository userRepository;
    private AppUserDetailsService appUserDetailsService;

    @Autowired
    public UserController(UserRepository userRepository, AppUserDetailsService appUserDetailsService) {
        this.userRepository = userRepository;
        this.appUserDetailsService = appUserDetailsService;
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
}
