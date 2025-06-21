package server.phoestorage.datasource.file;

import jakarta.persistence.*;

import java.util.Date;

@Entity(name = "file")
public class FileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int id;

    @Column(unique = true, nullable = false, name = "uuid")
    String uuid;

    @Column(unique = false, nullable = false, name = "owner")
    String owner;

    @Column(unique = false, nullable = false, name = "name")
    String name;

    @Column(unique = false, nullable = false, name = "extension")
    String extension;

    @Column(unique = false, nullable = false, name = "path")
    String path;

    @Column(unique = false, nullable = false, name = "fullPath")
    String fullPath;

    @Column(unique = false, nullable = false, name = "internalPath")
    String internalPath;

    @Column(unique = false, nullable = false, name = "created")
    String created;

    @Column(unique = false, nullable = true, name = "modified")
    String modified;

    @Column(unique = false, nullable = true, name = "accessed")
    String accessed;

    @Column(unique = false, nullable = false, name = "size")
    long size; // Bytes

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getExtension() {
        return extension;
    }

    public void setExtension(String extension) {
        this.extension = extension;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getFullPath() {
        return fullPath;
    }

    public void setFullPath(String fullPath) {
        this.fullPath = fullPath;
    }

    public String getInternalPath() {
        return internalPath;
    }

    public void setInternalPath(String internalPath) {
        this.internalPath = internalPath;
    }

    public String getCreated() {
        return created;
    }

    public void setCreated(String created) {
        this.created = created;
    }

    public String getModified() {
        return modified;
    }

    public void setModified(String modified) {
        this.modified = modified;
    }

    public String getAccessed() {
        return accessed;
    }

    public void setAccessed(String accessed) {
        this.accessed = accessed;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }
}
