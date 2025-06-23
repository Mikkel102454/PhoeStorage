package server.phoestorage.datasource.file;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import server.phoestorage.dto.FileEntry;

import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {
    List<FileEntity> findByOwnerAndPath(String userId, String relativePath);

    FileEntity findByOwnerAndFullPath(String uuid, String fullPath);

    @Query(
            value = """
        SELECT DISTINCT SUBSTRING_INDEX(SUBSTRING(path, LENGTH(:path) + 1), '/', 1)
        FROM file
        WHERE owner = :owner AND path LIKE CONCAT(:path, '%') AND path != :path
    """,
            nativeQuery = true
    )
    List<String> findImmediateSubfolders(@Param("owner") String owner, @Param("path") String path);

    List<FileEntity> findByOwnerAndFullPathStartingWith(String owner, String path);
}
