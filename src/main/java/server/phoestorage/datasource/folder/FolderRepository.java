package server.phoestorage.datasource.folder;

import org.springframework.data.jpa.repository.JpaRepository;
import server.phoestorage.datasource.file.FileEntity;

import java.util.List;

public interface FolderRepository extends JpaRepository<FolderEntity, Integer> {
    List<FolderEntity> findByOwnerAndFolderId(String userId, String folderId);
}
