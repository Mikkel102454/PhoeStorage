package server.phoestorage.dto;

public class FileEntry {
    private String path;
    private boolean isDirectory;

    public FileEntry(String path, boolean isDirectory) {
        this.path = path;
        this.isDirectory = isDirectory;
    }

    public String getPath() {
        return path;
    }

    public boolean isDirectory() {
        return isDirectory;
    }
}
