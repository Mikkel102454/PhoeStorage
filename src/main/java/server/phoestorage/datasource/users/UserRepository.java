package server.phoestorage.datasource.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query("SELECT u.username FROM users u WHERE u.uuid = :uuid")
    Optional<String> findUsernameByUuid(@Param("uuid") String uuid);

    @Query("SELECT u.uuid FROM users u WHERE u.username = :username")
    Optional<String> findUuidByUsername(String username);
}