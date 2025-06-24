package server.phoestorage.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.datasource.users.UserRepository;
import server.phoestorage.service.FileService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FolderService folderService;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, FolderService folderService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.folderService = folderService;
    }

    /**
     * Creates user
     *
     * @param username user's username
     * @param password user's password
     * @param admin is user admin
     * @return exit code
     *
     */
    public int addUser(String username, String password, boolean admin) {
        if(userRepository.existsByUsername(username)) { return 1; }
        if(password.length() < 3) { return 2; }

        String uuid = UUID.randomUUID().toString();

        UserEntity user = new UserEntity();
        user.setUuid(uuid);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setAdmin(admin);
        user.setEnabled(true);

        userRepository.save(user);

        folderService.createUserFolder(user);
        return 0;
    }
}
