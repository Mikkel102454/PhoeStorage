package server.phoestorage.datasource.download;

import org.springframework.data.jpa.repository.JpaRepository;
import server.phoestorage.datasource.file.FileEntity;

import java.util.List;

public interface DownloadRepository extends JpaRepository<DownloadEntity, Integer> {
    DownloadEntity findByUuid(String uuid);
}
