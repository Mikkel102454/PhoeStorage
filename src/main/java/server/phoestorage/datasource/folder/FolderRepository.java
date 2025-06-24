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

    @Query(value = """
    WITH RECURSIVE folder_tree AS (
        SELECT * FROM folder WHERE uuid = :folderId AND folder_id = :parentId AND owner = :owner
        UNION ALL
        SELECT f.* FROM folder f
        JOIN folder_tree ft ON f.folder_id = ft.uuid
        WHERE f.owner = :owner
    )
    SELECT * FROM folder_tree;
    """, nativeQuery = true)
    List<FolderEntity> findAllDescendantFolders(
            @Param("owner") String owner,
            @Param("parentId") String parentId,
            @Param("folderId") String folderId
    );
}
