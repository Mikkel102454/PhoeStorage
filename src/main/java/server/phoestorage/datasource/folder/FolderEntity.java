package server.phoestorage.datasource.folder;

import jakarta.persistence.*;

/**
 * File entity is data of a file
 *
 */
@Entity(name = "folder")                 // JPQL entity name is "folder"
@Table(
        name = "folder",                     // physical table name
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_owner_parent_name",
                        columnNames = {"owner", "folderId", "name"}   // use your actual column names
                )
        },
        indexes = {
                @Index(name = "ix_folders_owner_uuid",   columnList = "owner, uuid"),
                @Index(name = "ix_folders_owner_parent", columnList = "owner, folderId")
        }
)
public class FolderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int id;

    @Column(unique = false, nullable = false, name = "uuid")
    String uuid;

    @Column(unique = false, nullable = false, name = "owner")
    String owner;

    @Column(unique = false, nullable = false, name = "name")
    String name;

    @Column(unique = false, nullable = false, name = "folderId")
    String folderId;

    @Column(unique = false, nullable = false, name = "userCreated")
    boolean userCreated;

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

    public String getFolderId() {
        return folderId;
    }

    public void setFolderId(String folderId) {
        this.folderId = folderId;
    }

    public boolean getUserCreated() {
        return userCreated;
    }

    public void setUserCreated(boolean userCreated) {
        this.userCreated = userCreated;
    }
}
