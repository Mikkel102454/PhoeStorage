package server.phoestorage.datasource.file;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.phoestorage.dto.FileEntry;

import java.util.List;
import java.util.Optional;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {
    List<FileEntity> findByOwnerAndFolderId(String userId, String folderId);
    Optional<FileEntity> findByOwnerAndFolderIdAndName(String userId, String folderId, String name);
    Optional<FileEntity> findByOwnerAndFolderIdAndUuid(String userId, String folderId, String fileId);

    @Query(value = """
    SELECT * FROM file
    WHERE owner = :owner
      AND folder_id IN (
          SELECT uuid FROM (
              WITH RECURSIVE folder_tree AS (
                  SELECT uuid FROM folder 
                  WHERE uuid = :folderId AND folder_id = :parentId AND owner = :owner
                  UNION ALL
                  SELECT f.uuid FROM folder f
                  JOIN folder_tree ft ON f.folder_id = ft.uuid
                  WHERE f.owner = :owner
              )
              SELECT uuid FROM folder_tree
          ) AS all_folders
      );
    """, nativeQuery = true)
    List<FileEntity> findAllFilesUnderFolderTree(
            @Param("owner") String owner,
            @Param("parentId") String parentId,
            @Param("folderId") String folderId
    );
}
