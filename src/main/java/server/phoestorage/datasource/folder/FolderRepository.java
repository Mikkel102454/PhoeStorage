package server.phoestorage.datasource.folder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import server.phoestorage.datasource.file.FileEntity;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<FolderEntity, Integer> {
    List<FolderEntity> findByOwnerAndFolderId(String userId, String folderId);
    List<FolderEntity> findAllByOwner(String userId);

    Optional<FolderEntity> findByOwnerAndFolderIdAndName(String owner, String folderId, String name);
    Optional<FolderEntity> findByOwnerAndFolderIdAndUuid(String owner, String folderId, String uuid);

    Optional<FolderEntity> findByOwnerAndUuid(String owner, String uuid);

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

    @Modifying
    @Transactional
    @Query("UPDATE folder f SET f.name = :name WHERE f.owner = :owner AND f.folderId = :folderId AND f.uuid = :folderUuid")
    int renameFolder(@Param("owner") String owner,
                   @Param("folderId") String folderId,
                   @Param("folderUuid") String folderUuid,
                   @Param("name") String name);

    @Query(value = """
    WITH RECURSIVE folder_chain AS (
        SELECT *, 0 AS depth
        FROM folder
        WHERE uuid = :folderUuid AND owner = :owner

        UNION ALL

        SELECT f.*, fc.depth + 1
        FROM folder f
        INNER JOIN folder_chain fc ON f.uuid = fc.folder_id
        WHERE f.owner = :owner
    )
    SELECT * FROM folder_chain
    ORDER BY depth DESC
    """, nativeQuery = true)
    List<FolderEntity> findChainUntilUserRoot(
            @Param("folderUuid") String folderUuid,
            @Param("owner") String owner
    );

    @Query(
            value = """
        WITH RECURSIVE folder_tree AS (
            SELECT *
            FROM `folder`
            WHERE uuid      = :folderId
              AND folder_id = :parentId
              AND owner     = :owner
            UNION ALL
            SELECT f.*
            FROM `folder` f
            JOIN folder_tree ft ON f.folder_id = ft.uuid
            WHERE f.owner = :owner
        )
        SELECT COALESCE(SUM(fi.size), 0)
        FROM folder_tree ft
        LEFT JOIN `file` fi
          ON fi.folder_id = ft.uuid
         AND fi.owner     = :owner
        """,
            nativeQuery = true
    )
    Long totalSizeUnderFolder(
            @Param("folderId") String folderId,
            @Param("parentId") String parentId,
            @Param("owner")    String owner
    );
}
