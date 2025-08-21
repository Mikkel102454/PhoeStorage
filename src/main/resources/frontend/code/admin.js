const { use } = require("react")

class Download{
    uuid //string
    owner //string
    name //string
    extension //string
    download //int
    maxDownload //int
    expire //string
    isFolder // bool
    constructor(uuid, owner, name, extension, download, maxDownload, expire, isFolder) {
        this.uuid = uuid
        this.owner = owner
        this.name = name
        this.extension = extension
        this.download = download
        this.maxDownload = maxDownload
        this.expire = expire
        this.isFolder = isFolder
    }
}

class User{
    uuid //string
    username //string
    dataLimit //long
    dataUsed //long
    isAdmin //bool
    isEnabled // bool
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

// User panel
let createUserPanel
let createUsernameInput
let createPasswordInput
let createDataLimitInput
let createAdminInput
let createEnabledInput
async function createUser(){
    if(!createUserPanel) {createUserPanel = document.getElementById("userCreate")}
    if(!createUsernameInput) {createUsernameInput = createUserPanel.querySelector("#username")}
    if(!createPasswordInput) {createPasswordInput = createUserPanel.querySelector("#password")}
    if(!createDataLimitInput) {createDataLimitInput = createUserPanel.querySelector("#data")}
    if(!createAdminInput) {createAdminInput = createUserPanel.querySelector("#admin")}
    if(!createEnabledInput) {createEnabledInput = createUserPanel.querySelector("#enabled")}

    const response = await fetch(`/api/admin/user?
        u=${encodeURIComponent(createUsernameInput.value)}
        &p=${encodeURIComponent(createPasswordInput.value)}
        &d=${encodeURIComponent(createDataLimitInput.value)}
        &a=${encodeURIComponent(createAdminInput.checked)}
        &e=${encodeURIComponent(createEnabledInput.checked)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
    getAllUsers()
}

let allUsers
async function getAllUsers(){
    const response = await fetch(`/api/admin/link`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }
    const result = await response.json();

    allUsers = []
    result.forEach(item => {
        users.push(new User(
            item.uuid,
            item.username,
            item.dataLimit,
            item.dataUsed,
            item.isAdmin,
            item.isEnabled,
        ))
    });
    if(!users) {
        throwError("Failed to load download links")
        return
    }

    initUsers(users)
}

let userContainer
let userTemp
function initUsers(users){
    if(!userContainer) {document.getElementById("rowContainer")}
    if(!userTemp) {document.getElementById("userRow")}

    if(!users.length > 0) {
        userContainer.innerHTML = "<h3>Nothing to show here</h3>"
        return
    }

    const frag = document.createDocumentFragment();

    for (const d of users) {
        const row = userTemp.content.cloneNode(true);

        row.querySelector("#useranme").value = getUserameFast(d.ownerUuid);
        row.querySelector("#dataLimit").value = formatSize(d.dataLimit);
        row.querySelector("#dataUsed").textContent = d.dataUsed;
        row.querySelector("#isAdmin").checked = d.isAdmin;
        row.querySelector("#isEnabled").checked = d.isEnabled;

        row.querySelector("#upload").addEventListener("click", async () => {
            await openUserUpdateMenu(d.uuid, row.querySelector("#useranme").value, row.querySelector("#dataLimit").value,
                row.querySelector("#isAdmin").checked, row.querySelector("#isEnabled").checked, d)
        });

        row.querySelector("#forceLogout").addEventListener("click", async () => {
            await forceLogout(d.uuid)
        });

        row.querySelector("#resetPassword").addEventListener("click", () => {
            openAdminPasswordMenu(d.uuid)
        });

        row.querySelector("#trash").addEventListener("click", async () => {
            await deleteUser(d.uuid)
        });

        frag.appendChild(row);
    }

    userContainer.innerHTML = "";
    userContainer.replaceChildren(frag);
}

let userUpdateMenu
let userUpdateMenuTitle
let userUpdateMenuList
let userUpdateMenuConfirm

let userUpdateMenuHandler
function openUserUpdateMenu(uuid, username, dataLimit, isAdmin, isEnabled, user){
    if(!userUpdateMenu) {userUpdateMenu = document.getElementById("userUpdateMenu")}
    if(!userUpdateMenuTitle) {userUpdateMenuTitle = createUserPanel.querySelector("#title")}
    if(!userUpdateMenuList) {userUpdateMenuList = createUserPanel.querySelector("#listContainer")}
    if(!userUpdateMenuConfirm) {userUpdateMenuConfirm = createUserPanel.querySelector("#confirmButton")}

    userUpdateMenuTitle.innerText = `User update for "${user.username}"`

    if (userUpdateMenuHandler) {
        userUpdateMenuConfirm.removeEventListener("click", userUpdateMenuHandler);
        userUpdateMenuHandler = null;
    }

    if(username !== user.username) {userUpdateMenuList.innerHTML += `<span>Username: ${user.username} -> ${username}</span>`}
    if(dataLimit !== user.dataLimit) {userUpdateMenuList.innerHTML += `<span>Data limit: ${user.username} -> ${username}</span>`}
    if(isAdmin !== user.isAdmin) {userUpdateMenuList.innerHTML += `<span>Is admin: ${user.username} -> ${username}</span>`}
    if(isEnabled !== user.isEnabled) {userUpdateMenuList.innerHTML += `<span>Is enabled: ${user.username} -> ${username}</span>`}

    userUpdateMenuHandler = async function (){
        userUpdateMenuConfirm.disabled = true;

        updateUser(uuid, username, dataLimit, isAdmin, isEnabled)

        closeUserUpdateMenu()
        userUpdateMenuConfirm.disabled = false;
    }
    userUpdateMenuConfirm.addEventListener("click", deleteModalButtonHandler)

    userUpdateMenu.classList.add("visible");
}

function closeUserUpdateMenu(){
    userUpdateMenuTitle.innerText = 'User update for "Loading..."'
    userUpdateMenuList.innerText = ""

    userUpdateMenu.classList.remove("visible")
}

let adminPasswordMenu
let adminPasswordMenuTitle
let adminPasswordMenuInput
let adminPasswordMenuConfirm

let adminPasswordMenuHandler
function openAdminPasswordMenu(uuid){
    if(!adminPasswordMenu) {adminPasswordMenu = document.getElementById("passwordResetMenu")}
    if(!adminPasswordMenuTitle) {adminPasswordMenuTitle = adminPasswordMenu.querySelector("#title")}
    if(!adminPasswordMenuInput) {adminPasswordMenuInput = adminPasswordMenu.querySelector("#passwordResetInput")}
    if(!adminPasswordMenuConfirm) {adminPasswordMenuConfirm = adminPasswordMenu.querySelector("#confirmButton")}

    adminPasswordMenuTitle.innerText = `Reset password for "${user.username}"`
    if (adminPasswordMenuHandler) {
        adminPasswordMenuConfirm.removeEventListener("click", adminPasswordMenuHandler);
        adminPasswordMenuHandler = null;
    }

    adminPasswordMenuHandler = async function (){
        adminPasswordMenuConfirm.disabled = true;

        adminResetPassword(uuid, adminPasswordMenuInput.value)

        closeAdminPasswordMenu()
        adminPasswordMenuConfirm.disabled = false;
    }
    adminPasswordMenuConfirm.addEventListener("click", deleteModalButtonHandler)
}

function closeAdminPasswordMenu(){
    adminPasswordMenuTitle.innerText = 'Reset password for "Loading..."'

    adminPasswordMenu.classList.remove("visible")
}

async function deleteUser(uuid){
    const response = await fetch(`/api/admin/user?uuid=${encodeURIComponent(uuid)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
}

async function forceLogout(uuid){
    const response = await fetch(`/api/admin/user/logout?uuid=${encodeURIComponent(uuid)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
}


async function updateUser(uuid, username, dataLimit, isAdmin, isEnabled){
    const response = await fetch(`/api/admin/user?
        uuid=${encodeURIComponent(uuid)}
        &u=${encodeURIComponent(username)}
        &d=${encodeURIComponent(dataLimit)}
        &a=${encodeURIComponent(isAdmin)}
        &e=${encodeURIComponent(isEnabled)}`, {
        method: "PUT"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
}

async function adminResetPassword(uuid, newPassword){
    const response = await fetch(`/api/admin/user/password?uuid=${encodeURIComponent(uuid)}&p=${encodeURIComponent(newPassword)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
}



// Notification panel
let notifyTitleInput
let notifyMessageInput
async function sendNotification(){
    const response = await fetch(`/api/admin/notify?title=${encodeURIComponent(notifyTitleInput.value)}&msg=${encodeURIComponent(notifyMessageInput.value)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
}



// Storage panel
let storageBar
let storageText
async function getStatistic(){
    const response = await fetch(`/api/admin/storage`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    return
}


async function getSharedFiles(){
    const response = await fetch(`/api/admin/link`, {
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
            item.ownerUuid,
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

    initSharedFiles(downloads)
}

let shareContainer
let shareTemp
function initSharedFiles(downloads){
    if(!shareTemp) {shareTemp = document.getElementById("fileRow")}
    if(!shareContainer) {shareContainer = document.getElementById("rowContainer")}

    if(!downloads.length > 0) {
        fileRowContainer.innerHTML = "<h3>Nothing to show here</h3>"
        return
    }

    const frag = document.createDocumentFragment();

    for (const d of downloads) {
        const row = fileRowTemp.content.cloneNode(true);

        row.querySelector("#name").textContent = d.isFolder ? `${d.name}.${d.extension}` : d.name;
        row.querySelector("#owner").textContent = getUserameFast(d.ownerUuid);
        row.querySelector("#download").textContent = d.download;
        row.querySelector("#maxDownload").textContent = d.maxDownload === -1 ? "infinite" : d.maxDownload;

        row.querySelector("#exp").textContent = Number(d.expire) === -1 ? "never" : formatDate(Number(d.expire));

        row.querySelector("#link").addEventListener("click", async () => {
            await navigator.clipboard.writeText(`${location.origin}/download/${d.uuid}`);
        });

        row.querySelector("#trash").addEventListener("click", async () => {
            await adminDeleteDownload(d.uuid, d.ownerUuid);
            await getSharedFiles()
        });

        frag.appendChild(row);
    }

    fileRowContainer.innerHTML = "";
    fileRowContainer.replaceChildren(frag);

}

function getUserameFast(uuid){
    for (const u of allUsers){
        if(u.uuid === uuid) {return u.username}
    }
    return "Not Found"
}

async function adminDeleteDownload(uuid, owner){
    const response = await fetch(`/api/admin/link?uuid=${encodeURIComponent(uuid)}&owner=${encodeURIComponent(owner)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
}

getAllUsers()
getStatistic()
getSharedFiles()