class Download{
    uuid //string
    name //string
    extension //string
    download //int
    maxDownload //int
    expire //string
    isFolder // bool
    constructor(uuid, name, extension, download, maxDownload, expire, isFolder) {
        this.uuid = uuid
        this.name = name
        this.extension = extension
        this.download = download
        this.maxDownload = maxDownload
        this.expire = expire
        this.isFolder = isFolder
    }
}

class Setting{
    // all settings the player can change this will keep track of all the settings
    username //string

    constructor(username) {
        this.username = username
    }
}

onload = async function(){
    await getSettings()
    await getDownloads()
}

async function getDownloads(){
    const response = await fetch(`/api/users/download`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError("Failed to load download links")
        return
    }
    const result = await response.json();

    let downloads = []
    result.forEach(item => {
        downloads.push(new Download(
            item.uuid,
            item.fileName,
            item.fileExtension,
            item.downloads,
            item.maxDownloads,
            item.dateExpire,
            item.isFolder
        ))
    });
    if(!downloads) {
        throwError("Failed to load download links")
        return
    }

    addDownload(downloads)
}

let fileRowContainer
let fileRowTemp
function addDownload(downloads){
    if(!fileRowTemp) {fileRowTemp = document.getElementById("fileRow")}
    if(!fileRowContainer) {fileRowContainer = document.getElementById("rowContainer")}

    if(!downloads.length > 0) {
        fileRowContainer.innerHTML = "<h3>Nothing to show here</h3>"
        return
    }

    const frag = document.createDocumentFragment();

    for (const d of downloads) {
        console.log(downloads)
        const row = fileRowTemp.content.cloneNode(true);

        row.querySelector("#name").textContent = d.isFolder ? `${d.name}.${d.extension}` : d.name;
        row.querySelector("#download").textContent = d.download;
        row.querySelector("#maxDownload").textContent = d.maxDownload === -1 ? "infinite" : d.maxDownload;

        row.querySelector("#exp").textContent = Number(d.expire) === -1 ? "never" : formatDate(Number(d.expire));

        row.querySelector("#link").addEventListener("click", async () => {
            await navigator.clipboard.writeText(`${location.origin}/download/${d.uuid}`);
        });

        row.querySelector("#trash").addEventListener("click", async () => {
            await deleteDownload(d.uuid);
            await getDownloads()
        });

        frag.appendChild(row);
    }

    fileRowContainer.innerHTML = "";
    fileRowContainer.replaceChildren(frag);

}

async function deleteDownload(uuid){
    const response = await fetch(`/api/users/download?downloadUuid=${encodeURIComponent(uuid)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throwError("Failed to delete download link")
    }

    throwSuccess("Download link deleted")
}

let lastTriedUsername
let username
async function getSettings(){
    const response = await fetch(`/api/users/setting`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError("Failed to load settings")
        return
    }
    const result = await response.json();

    let settings = new Setting(
        result.username
    )

    if(!settings) {
        throwError("Failed to load settings")
        return
    }

    if(!username){username = document.getElementById("username")}

    username.value = settings.username
    lastTriedUsername = settings.username
}

async function setSettings(name, value){
    if(name === "username" && lastTriedUsername === value){return}
    const response = await fetch(`/api/users/setting?name=${encodeURIComponent(name)}&value=${encodeURIComponent(value)}`, {
        method: "POST"
    });

    if (!response.ok) {
        if(name === "username" && Number(response.status) === 409){
            throwError("User with this username already exist")
            return
        }
        if(name === "username" && Number(response.status) === 400){
            throwError("Username must be at least 3 characters")
            return
        }
    }

    throwSuccess("Setting saved")
    await getSettings()

}

async function setPassword(oldPassword, newPassword){
    const response = await fetch(`/api/users/password?oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`, {
        method: "POST"
    });

    if (!response.ok) {
        if(Number(response.status) === 401){
            throwError("The entered password does not match your current password")
            return
        }
        if(Number(response.status) === 400){
            throwError("Password must be at least 3 characters")
            return
        }
        throwError("Could not change password")
    }

    throwSuccess("Password updated")
}

const tabs = document.querySelectorAll('.tab');

function syncTab() {
    const h = location.hash || '#account';

    tabs.forEach(t => t.removeAttribute('tab-current'));

    const active = document.querySelector(`a.tab[href="${h}"]`);

    if (active) active.setAttribute('tab-current', 'page');
}

window.addEventListener('hashchange', syncTab);

syncTab();