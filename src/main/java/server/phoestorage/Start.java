package server.phoestorage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import server.phoestorage.service.UserService;

@Component
public class Start implements CommandLineRunner {
    private final UserService userService;

    @Autowired
    public Start(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void run(String... args) throws Exception {
        //userService.addUser("admin", "admin", true);
    }
}
