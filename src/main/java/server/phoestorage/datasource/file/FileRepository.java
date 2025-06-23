package server.phoestorage.datasource.file;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.phoestorage.dto.FileEntry;

import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {
    List<FileEntity> findByOwnerAndFolderId(String userId, String folderId);
    FileEntity findByOwnerAndFolderIdAndName(String userId, String folderId, String name);
    FileEntity findByOwnerAndFolderIdAndUuid(String userId, String folderId, String fileId);
}
