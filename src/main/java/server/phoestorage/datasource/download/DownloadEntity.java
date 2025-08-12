package server.phoestorage.datasource.download;

import jakarta.persistence.*;

@Entity(name = "download")
public class DownloadEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int id;

    @Column(unique = true, nullable = false, name = "uuid")
    String uuid;
    @Column(unique = false, nullable = false, name = "fileUuid")
    String fileUuid;
    @Column(unique = false, nullable = false, name = "folderUuid")
    String folderUuid;
    @Column(unique = false, nullable = false, name = "ownerUuid")
    String ownerUuid;
    @Column(unique = false, nullable = false, name = "dateCreated")
    String dateCreated;
    @Column(unique = false, nullable = false, name = "dateExpire")
    String dateExpire;
    @Column(unique = false, nullable = false, name = "downloadLimit")
    int downloadLimit;
    @Column(unique = false, nullable = false, name = "downloads")
    int downloads;

    public int getId() {
        return id;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getFileUuid() {
        return fileUuid;
    }

    public void setFileUuid(String fileUuid) {
        this.fileUuid = fileUuid;
    }

    public String getFolderUuid() {
        return folderUuid;
    }

    public void setFolderUuid(String folderUuid) {
        this.folderUuid = folderUuid;
    }

    public String getOwnerUuid() {
        return ownerUuid;
    }

    public void setOwnerUuid(String ownerUuid) {
        this.ownerUuid = ownerUuid;
    }

    public String getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(String dateCreated) {
        this.dateCreated = dateCreated;
    }

    public String getDateExpire() {
        return dateExpire;
    }

    public void setDateExpire(String dateExpire) {
        this.dateExpire = dateExpire;
    }

    public int getDownloadLimit() {
        return downloadLimit;
    }

    public void setDownloadLimit(int downloadLimit) {
        this.downloadLimit = downloadLimit;
    }

    public int getDownloads() {
        return downloads;
    }

    public void setDownloads(int downloads) {
        this.downloads = downloads;
    }
}
