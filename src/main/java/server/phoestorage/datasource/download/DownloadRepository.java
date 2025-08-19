package server.phoestorage.datasource.download;

import org.springframework.data.jpa.repository.JpaRepository;
import server.phoestorage.datasource.file.FileEntity;

import java.util.List;
import java.util.Optional;

public interface DownloadRepository extends JpaRepository<DownloadEntity, Integer> {
    DownloadEntity findByUuid(String uuid);

    List<DownloadEntity> findAllByOwnerUuid(String ownerUuid);
    Optional<DownloadEntity> findByUuidAndOwnerUuid(String uuid, String ownerUuid);
}
