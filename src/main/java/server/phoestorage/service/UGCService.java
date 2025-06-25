package server.phoestorage.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.stream.Stream;

@Service
public class UGCService {
    @Value("${server.root}")
    private String rootFolder;
    private static final Duration UPLOAD_TIMEOUT = Duration.ofMinutes(10);

    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void startUGC(){
        System.out.println("Starting UGC service");
        try (Stream<Path> userDirs = Files.list(Paths.get(rootFolder))) {
            Instant now = Instant.now(); // Get time now
            userDirs
                    .filter(Files::isDirectory)
                    .forEach(userDirectory -> {
                        Path uploadsRoot = Paths.get(userDirectory.toString(), "temp", "upload");
                        // Check if the folder exists

                        if (Files.exists(uploadsRoot)) {
                            try (Stream<Path> uploadDirs = Files.list(uploadsRoot)) {
                                uploadDirs
                                        .filter(Files::isDirectory)
                                        .filter(dir -> isExpired(dir, now))
                                        .forEach(this::deleteDirectorySilently);
                            } catch (IOException e) {
                                // log if needed
                            }
                        }
                    });

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private boolean isExpired(Path dir, Instant now) {
        try {
            FileTime lastModified = Files.getLastModifiedTime(dir);
            return lastModified.toInstant().plus(UPLOAD_TIMEOUT).isBefore(now);
        } catch (IOException e) {
            return false; // can't read? skip
        }
    }

    private void deleteDirectorySilently(Path dir) {
        try {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException ignored) {}
                    });
        } catch (IOException ignored) {}
    }
}
