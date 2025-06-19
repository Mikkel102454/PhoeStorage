package server.phoestorage.service;

import java.io.File;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import server.phoestorage.datasource.users.UserEntity;

@Service
public class FileService {
    @Value("${server.root}")
    private String rootDirectory;

    public boolean createUserFolder(UserEntity user) {
        try{
            new File(rootDirectory + user.getUuid()).mkdirs();
            return true;
        }catch (Exception e){
            return false;
        }
    }

}
