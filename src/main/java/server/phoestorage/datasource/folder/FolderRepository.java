package server.phoestorage.datasource.folder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.phoestorage.datasource.file.FileEntity;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<FolderEntity, Integer> {
    List<FolderEntity> findByOwnerAndFolderId(String userId, String folderId);

    Optional<FolderEntity> findByOwnerAndFolderIdAndName(String owner, String folderId, String name);
    Optional<FolderEntity> findByOwnerAndFolderIdAndUuid(String owner, String folderId, String uuid);

    @Query("SELECT f.name FROM folder f " +
            "WHERE f.owner = :owner AND f.folderId = :folderId " +
            "AND f.name LIKE CONCAT(:folderName, '%')")
    List<String> findByOwnerAndFolderIdStartingWithName(@Param("owner") String owner,
                                       @Param("folderId") String folderId,
                                       @Param("folderName") String folderName);
}
