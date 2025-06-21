package server.phoestorage.datasource.file;

import org.springframework.data.jpa.repository.JpaRepository;
import server.phoestorage.dto.FileEntry;

import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {
    List<FileEntity> findByOwnerAndPath(String userId, String relativePath);

    FileEntity findByOwnerAndFullPath(String uuid, String fullPath);
}
