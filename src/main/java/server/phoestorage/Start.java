package server.phoestorage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import server.phoestorage.datasource.users.UserRepository;
import server.phoestorage.service.UserService;

@Component
public class Start implements CommandLineRunner {
    private final UserService userService;
    private final UserRepository userRepository;

    @Autowired
    public Start(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if(!userRepository.existsByAdminTrue()){
            userService.addUser("admin", "admin", 107374182400L, true, true);
        }
    }
}
