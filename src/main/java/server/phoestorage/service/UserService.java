package server.phoestorage.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.session.SessionInformation;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.datasource.users.UserRepository;
import server.phoestorage.dto.SettingsEntry;
import server.phoestorage.dto.UserEntry;
import server.phoestorage.service.FileService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FolderService folderService;
    private final AppUserDetailsService appUserDetailsService;
    private final SessionRegistry sessionRegistry;
    private final LinkService linkService;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, FolderService folderService, AppUserDetailsService appUserDetailsService, SessionRegistry sessionRegistry, LinkService linkService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.folderService = folderService;
        this.appUserDetailsService = appUserDetailsService;
        this.sessionRegistry = sessionRegistry;
        this.linkService = linkService;
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
    public int addUser(String username, String password, Long data, boolean admin, boolean enabled) {
        try{
            if(userRepository.existsByUsername(username)) { return 1; }
            if(password.length() < 3) { return 2; }
            if(username.length() < 3) { return 3; }

            String uuid = UUID.randomUUID().toString();

            UserEntity user = new UserEntity();
            user.setUuid(uuid);
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(password));
            user.setDataLimit(data);
            user.setAdmin(admin);
            user.setEnabled(enabled);
            user.setForceChangePassword(true);

            userRepository.save(user);

            folderService.createUserFolder(user);
            return 0;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return 500;
        }
    }

    public int adminDeleteUser(String uuid){
        try{
            if(!userRepository.existsByUuid(uuid)) { return 404; }

            UserEntity user = userRepository.findByUuid(uuid);


            linkService.deleteAllDownloadLink(user.getUuid());
            folderService.deleteUserFolder(user.getUuid());
            userRepository.delete(user);
            return 0;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return 500;
        }
    }

    public int updateUser(String uuid, String username, Long data, boolean admin, boolean enabled) {
        try{
            if(!userRepository.existsByUuid(uuid)) { return 404; }
            if(userRepository.existsByUsername(username)) { return 1; }
            if(username.length() < 3) { return 3; }

            UserEntity user = userRepository.findByUuid(uuid);
            user.setUsername(username);
            user.setDataLimit(data);
            user.setAdmin(admin);
            user.setEnabled(enabled);

            userRepository.save(user);
            return 0;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return 500;
        }
    }

    public int adminResetPassword(String uuid, String newPassword) {
        try {
            if(!userRepository.existsByUuid(uuid)) { return 404; }
            if(newPassword.length() < 3) { return 2; }

            UserEntity user = userRepository.findByUuid(uuid);
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setForceChangePassword(true);
            userRepository.save(user);
            return 0;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return 500;
        }
    }
    public int adminLogoutUser(String uuid) {
        try {
            if(!userRepository.existsByUuid(uuid)) { return 404; }

            String user = userRepository.findUsernameByUuid(uuid).get();

            sessionRegistry.getAllPrincipals().forEach(principal -> {
                if (principal instanceof UserDetails userDetails) {
                    if (userDetails.getUsername().equals(user)) {
                        sessionRegistry.getAllSessions(principal, false)
                                .forEach(SessionInformation::expireNow);
                    }
                }
            });

            return 0;
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return 500;
        }
    }

    public boolean passwordChangeForce(String uuid){
        UserEntity user = userRepository.findByUuid(uuid);
        return user.isForceChangePassword();
    }

    public SettingsEntry getSettings(String uuid){
        UserEntity user = userRepository.findByUuid(uuid);
        SettingsEntry entry = new SettingsEntry();
        entry.setUsername(user.getUsername());

        return entry;
    }

    public int setSetting(String uuid, String name, String value){
        UserEntity user = userRepository.findByUuid(uuid);
        if(name.equals("username")) {
            if(value.length() < 3) { return 400; }
            if(userRepository.findByUsername(value).isPresent()) { return 409; }
            user.setUsername(value);
            userRepository.save(user);
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserDetails newUserDetails = appUserDetailsService.loadUserByUsername(value);
            Authentication newAuth = new UsernamePasswordAuthenticationToken(
                    newUserDetails,
                    auth.getCredentials(),
                    newUserDetails.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(newAuth);

            return 0;
        }

        return 0;
    }

    public int setPassword(String uuid, String oldPassword, String newPassword){
        if(newPassword.length() < 3) { return 400; }
        UserEntity user = userRepository.findByUuid(uuid);
        if(!passwordEncoder.matches(oldPassword, user.getPassword())) { return 401; }

        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        return 0;
    }

    public int forceSetPassword(String uuid, String newPassword){
        if(newPassword.length() < 3) { return 400; }
        UserEntity user = userRepository.findByUuid(uuid);
        if(!user.isForceChangePassword()) { return 401; }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setForceChangePassword(false);
        userRepository.save(user);

        return 0;
    }


    public List<UserEntry> getAllUsers() {
        List<UserEntity> users = userRepository.findAll();

        List<UserEntry> userReturnList = new ArrayList<UserEntry>();
        for(UserEntity user : users) {
            UserEntry entry = new UserEntry();
            entry.setUuid(user.getUuid());
            entry.setUsername(user.getUsername());
            entry.setDataLimit(user.getDataLimit());
            entry.setDataUsed(user.getDataUsed());
            entry.setAdmin(user.isAdmin());
            entry.setEnabled(user.isEnabled());
            userReturnList.add(entry);
        }
        return userReturnList;
    }
}
