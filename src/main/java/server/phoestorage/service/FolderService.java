package server.phoestorage.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import server.phoestorage.datasource.file.FileEntity;
import server.phoestorage.datasource.file.FileRepository;
import server.phoestorage.datasource.folder.FolderEntity;
import server.phoestorage.datasource.folder.FolderRepository;
import server.phoestorage.datasource.users.UserEntity;
import server.phoestorage.dto.FileEntry;
import server.phoestorage.dto.FolderEntry;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static server.phoestorage.utils.Database.extractConstraintName;

@Service
public class FolderService {
    @Value("${server.root}")
    private String rootPath;

    private final AppUserDetailsService appUserDetailsService;
    private final FileService fileService;

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;

    @Autowired
    public FolderService(AppUserDetailsService appUserDetailsService,
                       FolderRepository folderRepository,
                         FileRepository fileRepository,
                         FileService fileService) {
        this.appUserDetailsService = appUserDetailsService;
        this.folderRepository = folderRepository;
        this.fileRepository = fileRepository;
        this.fileService = fileService;
    }

    /**
     * Create user folders
     *
     * @param user the user
     * @return true if successful and false if unsuccessful
     *
     */
    public void createUserFolder(UserEntity user) {
        try{
            new File(rootPath + user.getUuid()).mkdirs();
            new File(rootPath + user.getUuid() + "/temp").mkdirs();
            new File(rootPath + user.getUuid() + "/temp/upload").mkdirs();
            new File(rootPath + user.getUuid() + "/storage").mkdirs();

            FolderEntity folderEntity = new FolderEntity();
            folderEntity.setUuid(user.getUuid());
            folderEntity.setOwner(user.getUuid());
            folderEntity.setFolderId("-1");
            folderEntity.setName("My Drive");
            folderEntity.setUserCreated(false);

            folderRepository.save(folderEntity);
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
        }
    }

    /**
     * Delete user folders
     *
     * @param user the user uuid
     * @return true if successful and false if unsuccessful
     *
     */
    public void deleteUserFolder(String user) {
        try{
            deleteDirectoryRecursively(Paths.get(rootPath, user));

            folderRepository.deleteAll(folderRepository.findAllByOwner(user));
            fileRepository.deleteAll(fileRepository.findAllByOwner(user));
        }catch (Exception e){
            System.err.println(e.getMessage() + "\n With Cause:\n" + e.getCause());
        }
    }


    /**
     * Browse directory
     *
     * @param folderId the current browsing directory
     * @return response entity with list of FileEntry
     *
     */
    public ResponseEntity<Map<String, Object>> BrowseDirectory(String folderId) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        List<FileEntity> files = fileRepository.findByOwnerAndFolderId(uuid, folderId);
        List<FileEntry> fileResult = new ArrayList<>();
        List<FolderEntry> folderResult = new ArrayList<>();

        for(FileEntity file : files) {
            FileEntry fileEntry = new FileEntry();
            fileEntry.setUuid(file.getUuid());
            fileEntry.setOwner(file.getOwner());
            fileEntry.setName(file.getName());
            fileEntry.setExtension(file.getExtension());
            fileEntry.setFolderId(file.getFolderId());
            fileEntry.setCreated(file.getCreated());
            fileEntry.setModified(file.getModified());
            fileEntry.setAccessed(file.getAccessed());
            fileEntry.setSize(file.getSize());
            fileEntry.setStarred(file.getStarred());
            fileResult.add(fileEntry);
        }

        List<FolderEntity> folders = folderRepository.findByOwnerAndFolderId(uuid, folderId);
        for (FolderEntity folder : folders) {
            FolderEntry folderEntry = new FolderEntry();
            folderEntry.setUuid(folder.getUuid());
            folderEntry.setOwner(uuid);
            folderEntry.setName(folder.getName());
            folderEntry.setFolderId(folder.getFolderId());
            folderEntry.setSize(folderRepository.totalSizeUnderFolder(folder.getUuid(), folder.getFolderId(), uuid));
            folderResult.add(folderEntry);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("files", fileResult);
        response.put("folders", folderResult);
        return ResponseEntity.ok(response);
    }

    /**
     * Create folder
     *
     * @param folderId the parent folder
     * @param folderName the name of the new folder
     * @return exit code
     *
     */
    public FolderEntry createFolder(String folderId, String folderName) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        folderName = getValidFolderName(folderId, folderName, uuid);

        if(folderName.equals("nil")) {
            return null;
        }

        String folderUuid = UUID.randomUUID().toString();

        FolderEntity folderEntity = new FolderEntity();
        folderEntity.setUuid(folderUuid);
        folderEntity.setName(folderName);
        folderEntity.setFolderId(folderId);
        folderEntity.setOwner(uuid);
        folderEntity.setUserCreated(true);

        folderRepository.save(folderEntity);

        FolderEntry folderEntry = new FolderEntry();
        folderEntry.setUuid(folderUuid);
        folderEntry.setOwner(uuid);
        folderEntry.setName(folderName);
        folderEntry.setFolderId(folderId);
        folderEntry.setSize(0);
        return folderEntry;
    }


    /**
     * Delete folder
     *
     * @param folderId the parent folder
     * @param folderUuid uuid of the folder
     * @return exit code
     *
     */
    public int deleteFolder(String folderId, String folderUuid) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        if(!folderExistByUuid(uuid, folderId, folderUuid)) { return 404; }

        List<FolderEntity> folders = folderRepository.findAllDescendantFolders(uuid, folderId, folderUuid);
        List<FileEntity> files = fileRepository.findAllFilesUnderFolderTree(uuid, folderId, folderUuid);

        for(FileEntity file : files) {
            fileService.deleteFile(file.getFolderId(), file.getUuid());
        }
        folderRepository.deleteAll(folders);

        return 0;
    }

    public ResponseEntity<List<FolderEntry>> getFolderLocation(String folderUuid) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        List<FolderEntity> folders = folderRepository.findChainUntilUserRoot(folderUuid, uuid);

        List<FolderEntry> entrys = new ArrayList<>();
        for (FolderEntity folder : folders) {
            FolderEntry folderEntry = new FolderEntry();

            folderEntry.setUuid(folder.getUuid());
            folderEntry.setName(folder.getName());
            folderEntry.setFolderId(folder.getFolderId());
            folderEntry.setOwner(folder.getOwner());

            entrys.add(folderEntry);
        }
        return ResponseEntity.ok().body(entrys);
    }

    /**
     * Folder exist with name
     *
     * @param folderId the parent folder
     * @param folderName name of the folder
     * @return exit code
     *
     */
    public boolean folderExistByName(String owner, String folderId, String folderName) {
        Optional<FolderEntity> folderEntity = folderRepository.findByOwnerAndFolderIdAndName(owner, folderId, folderName);

        return folderEntity.isPresent();
    }

    /**
     * Folder exist with uuid
     *
     * @param folderId the parent folder
     * @param folderUuid uuid of the folder
     * @return exit code
     *
     */
    public boolean folderExistByUuid(String owner, String folderId, String folderUuid) {
        Optional<FolderEntity> folderEntity = folderRepository.findByOwnerAndFolderIdAndUuid(owner, folderId, folderUuid);

        return folderEntity.isPresent();
    }



    public void downloadZipFile(String folderId, String folderUuid,
                                HttpServletResponse response, String uuid) {
        try {
            // 1) Collect folders/files from your repositories
            List<FolderEntity> allFolders = folderRepository.findAllDescendantFolders(uuid, folderId, folderUuid);
            List<FileEntity> allFiles    = fileRepository.findAllFilesUnderFolderTree(uuid, folderId, folderUuid);

            // 2) Validate files exist on disk
            List<FileEntity> validFiles = allFiles.stream()
                    .filter(f -> Files.exists(Paths.get(f.getInternalPath())))
                    .toList();

            if (validFiles.isEmpty()) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "No files found to zip.");
                return;
            }

            // 3) Choose download filename from the root folder name
            String zipFileName = allFolders.stream()
                    .filter(f -> f.getUuid().equals(folderUuid))
                    .map(FolderEntity::getName)
                    .findFirst()
                    .orElse("download") + ".zip";

            // 4) Build "zip path" → "disk path" mapping
            Map<String, String> zipMap = buildZipPathMap(validFiles, allFolders, folderUuid);

            // 5) Prepare response headers (send early to get TTFB and avoid proxy timeouts)
            response.setContentType("application/zip");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFileName + "\"");
            // (Optional, helps with Nginx/Cloudflare):
            response.setHeader("X-Accel-Buffering", "no");
            response.setBufferSize(128 * 1024);
            response.flushBuffer(); // flush headers immediately

            // 6) Stream the ZIP
            try (ZipOutputStream zip = new ZipOutputStream(response.getOutputStream())) {
                zip.setLevel(Deflater.NO_COMPRESSION);

                byte[] buffer = new byte[1024  * 1024];

                for (Map.Entry<String, String> e : zipMap.entrySet()) {
                    String zipName  = normalizeZipPath(e.getKey());
                    Path   diskPath = Paths.get(e.getValue());

                    // Ensure directory entries are present if you want (optional; not strictly required)
                    // addParentDirs(zip, zipName);

                    ZipEntry entry = new ZipEntry(zipName);
                    zip.putNextEntry(entry);

                    try (InputStream in = Files.newInputStream(diskPath)) {
                        int read;
                        while ((read = in.read(buffer)) != -1) {
                            zip.write(buffer, 0, read);
                        }
                    } catch (IOException io) {
                        // On per-file error, close the entry and continue with the next file
                        // (You could also log + break, depending on your requirements)
                    } finally {
                        zip.closeEntry();
                    }
                }

                zip.finish(); // finalize central directory
                zip.flush();
            }
        } catch (Exception e) {
            // If anything fails before headers are committed, return a 500
            try {
                if (!response.isCommitted()) {
                    response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to generate zip.");
                }
            } catch (IOException ignored) {}
        }
    }

    // Keep your original mapping logic; just normalize to forward slashes for ZIP entries.
    public Map<String, String> buildZipPathMap(List<FileEntity> files, List<FolderEntity> folders, String rootFolderId) {
        Map<String, FolderEntity> folderMap = folders.stream()
                .collect(Collectors.toMap(FolderEntity::getUuid, f -> f));

        Map<String, String> result = new LinkedHashMap<>();

        for (FileEntity file : files) {
            String zipPath = file.getName();
            String parentId = file.getFolderId();

            while (parentId != null) {
                FolderEntity parent = folderMap.get(parentId);
                if (parent == null || parent.getUuid().equals(rootFolderId)) break;
                zipPath = parent.getName() + "/" + zipPath;
                parentId = parent.getFolderId();
            }

            result.put(zipPath, file.getInternalPath());
        }
        return result;
    }

    private static String normalizeZipPath(String p) {
        // ZIP spec uses forward slashes; also guard against accidental leading slashes
        String s = p.replace('\\', '/');
        while (s.startsWith("/")) s = s.substring(1);
        return s;
    }

    public static void deleteDirectoryRecursively(Path dir) throws IOException {
        if (dir == null || !Files.exists(dir)) return;

        // Don’t follow symlinks so we only delete inside this tree.
        Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.deleteIfExists(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path directory, IOException exc) throws IOException {
                // Delete directory after its contents
                Files.deleteIfExists(directory);
                return FileVisitResult.CONTINUE;
            }
        });
    }



    /* optimised single query*/
    public String getValidFolderName(String folderId, String folderName, String owner) {
        List<String> existingNames = folderRepository
                .findByOwnerAndFolderIdStartingWithName(owner, folderId, folderName);

        if (!existingNames.contains(folderName)) {
            return folderName;
        }

        for (int i = 1; i <= 20; i++) {
            String newFolderName = folderName + " (" + i + ")";
            if (!existingNames.contains(newFolderName)) {
                return newFolderName;
            }
        }

        return "nil"; // fallback if all names are taken
    }

    public FolderEntry getParentFolder(String folderId, String folderName) {
        String uuid = appUserDetailsService.getUserEntity().getUuid();

        Optional<FolderEntity> folder = folderRepository.findByOwnerAndFolderIdAndName(uuid, folderId, folderName);
        if(folder.isEmpty()) return null;

        FolderEntity folderEntity = folder.get();

        FolderEntry folderEntry = new FolderEntry();
        folderEntry.setUuid(folderEntity.getUuid());
        folderEntry.setOwner(uuid);
        folderEntry.setName(folderName);
        folderEntry.setFolderId(folderEntity.getFolderId());

        return folderEntry;
    }

    public int renameFolder(String folderId, String folderUuid, String name){
        String owner = appUserDetailsService.getUserEntity().getUuid();

        try {
            int rows = folderRepository.renameFolder(owner, folderId, folderUuid, name);
            if (rows == 0) return 404;
            return 200;

        } catch (DataIntegrityViolationException ex) {
            String c = extractConstraintName(ex);
            if ("fk_folder_parent".equalsIgnoreCase(c)) return 404;    // destination missing
            if ("uq_owner_parent_name".equalsIgnoreCase(c)) return 409; // duplicate
            return 500;
        }
    }

    public int moveFolder(String itemId, String newParent) {
        if (itemId.equals(newParent)) return 400; // moved into self

        String owner = appUserDetailsService.getUserEntity().getUuid();

        try {
            int rows = folderRepository.moveFolder(owner, itemId, newParent);
            if (rows == 0) return 404;
            return 200;

        } catch (DataIntegrityViolationException ex) {
            String c = extractConstraintName(ex);
            if ("fk_folder_parent".equalsIgnoreCase(c)) return 404;    // destination missing
            if ("uq_owner_parent_name".equalsIgnoreCase(c)) return 409; // duplicate
            return 500;
        }
    }
}
