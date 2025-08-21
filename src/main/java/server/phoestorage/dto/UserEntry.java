package server.phoestorage.dto;

public class UserEntry{
    private String uuid;
    private String username;
    private Long dataLimit;
    private Long dataUsed;
    private boolean isAdmin;
    private boolean isEnabled;

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Long getDataLimit() {
        return dataLimit;
    }

    public void setDataLimit(Long dataLimit) {
        this.dataLimit = dataLimit;
    }

    public Long getDataUsed() {
        return dataUsed;
    }

    public void setDataUsed(Long dataUsed) {
        this.dataUsed = dataUsed;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }
}
