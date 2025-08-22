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
    enabled // bool
    constructor(uuid, username, dataLimit, dataUsed, isAdmin, enabled) {
        this.uuid = uuid
        this.username = username
        this.dataLimit = dataLimit
        this.dataUsed = dataUsed
        this.isAdmin = isAdmin
        this.enabled = enabled
    }
}

onload = async function(){
    await getAllUsers()
    await getStatistic()
    await getSharedFiles()
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

    let dataByteLimit = parseSize(createDataLimitInput.value)
    if(dataByteLimit === -1){throwError("The storage limit input could not be converted to bytes"); return}
    const response = await fetch(`/api/admin/user?u=${encodeURIComponent(createUsernameInput.value)}&p=${encodeURIComponent(createPasswordInput.value)}&d=${encodeURIComponent(dataByteLimit.toString())}&a=${encodeURIComponent(createAdminInput.checked)}&e=${encodeURIComponent(createEnabledInput.checked)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }

    throwSuccess(await response.text())
    await getAllUsers()
}

let allUsers
async function getAllUsers(){
    const response = await fetch(`/api/admin/user`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }
    const result = await response.json();

    allUsers = []
    result.forEach(item => {
        allUsers.push(new User(
            item.uuid,
            item.username,
            item.dataLimit,
            item.dataUsed,
            item.admin,
            item.enabled,
        ))
    });
    if(!allUsers) {
        throwError("Failed to load download links")
        return
    }

    initUsers(allUsers)
}

let userContainer
let userTemp
function initUsers(users){
    if(!userContainer) {userContainer = document.getElementById("userRowContainer")}
    if(!userTemp) {userTemp = document.getElementById("userRow")}

    if(!users.length > 0) {
        userContainer.innerHTML = "<h3>Nothing to show here</h3>"
        return
    }

    const frag = document.createDocumentFragment();

    for (const d of users) {
        const row = userTemp.content.cloneNode(true);

        console.log(d)
        row.querySelector("#username").value = getUsernameFast(d.uuid);
        row.querySelector("#dataLimit").value = formatSize(d.dataLimit);
        row.querySelector("#dataUsed").textContent = formatSize(d.dataUsed);
        row.querySelector("#isAdmin").checked = d.isAdmin;
        row.querySelector("#isEnabled").checked = d.enabled;

        row.querySelector("#upload").addEventListener("click", async (e) => {
            const userRow = e.currentTarget.closest(".userRow");
            await openUserUpdateMenu(d.uuid, userRow.querySelector("#username").value, userRow.querySelector("#dataLimit").value,
                userRow.querySelector("#isAdmin").checked, userRow.querySelector("#isEnabled").checked, d)
        });

        row.querySelector("#forceLogout").addEventListener("click", async () => {
            await forceLogout(d.uuid)
        });

        row.querySelector("#resetPassword").addEventListener("click", () => {
            openAdminPasswordMenu(d.uuid)
        });

        row.querySelector("#trash").addEventListener("click", async () => {
            openDeleteUserMenu(d.uuid)
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
function openUserUpdateMenu(uuid, username, dataLimit, isAdmin, enabled, user){
    if(!userUpdateMenu) {userUpdateMenu = document.getElementById("userUpdateMenu")}
    if(!userUpdateMenuTitle) {userUpdateMenuTitle = userUpdateMenu.querySelector("#title")}
    if(!userUpdateMenuList) {userUpdateMenuList = userUpdateMenu.querySelector("#listContainer")}
    if(!userUpdateMenuConfirm) {userUpdateMenuConfirm = userUpdateMenu.querySelector("#confirmButton")}

    userUpdateMenuTitle.innerText = `User update for "${user.username}"`

    if (userUpdateMenuHandler) {
        userUpdateMenuConfirm.removeEventListener("click", userUpdateMenuHandler);
        userUpdateMenuHandler = null;
    }

    let i = 0
    if(username !== user.username) {userUpdateMenuList.innerHTML += `<span style="font-size: 1.7vh;">Username: ${user.username} -> ${username}</span>`; i++}
    if(parseSize(dataLimit).toString() !== user.dataLimit.toString()) {userUpdateMenuList.innerHTML += `<span style="font-size: 1.7vh;">Data limit: ${formatSize(user.dataLimit)} -> ${dataLimit}</span>`; i++}
    if(isAdmin !== user.isAdmin) {userUpdateMenuList.innerHTML += `<span style="font-size: 1.7vh;">Is admin: ${user.isAdmin} -> ${isAdmin}</span>`; i++}
    if(enabled !== user.enabled) {userUpdateMenuList.innerHTML += `<span style="font-size: 1.7vh;">Is enabled: ${user.enabled} -> ${enabled}</span>`; i++}

    if(i === 0){
        throwWarning("No user data changed")
        closeUserUpdateMenu()
        return
    }

    userUpdateMenuHandler = async function (){
        userUpdateMenuConfirm.disabled = true;

        await updateUser(uuid, username, dataLimit, isAdmin, enabled)

        closeUserUpdateMenu()
        userUpdateMenuConfirm.disabled = false;
    }
    userUpdateMenuConfirm.addEventListener("click", userUpdateMenuHandler)

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

    adminPasswordMenuTitle.innerText = `Reset password for "${getUsernameFast(uuid)}"`
    if (adminPasswordMenuHandler) {
        adminPasswordMenuConfirm.removeEventListener("click", adminPasswordMenuHandler);
        adminPasswordMenuHandler = null;
    }

    adminPasswordMenuHandler = async function (){
        adminPasswordMenuConfirm.disabled = true;

        await adminResetPassword(uuid, adminPasswordMenuInput.value)

        closeAdminPasswordMenu()
        adminPasswordMenuConfirm.disabled = false;
    }
    adminPasswordMenuConfirm.addEventListener("click", adminPasswordMenuHandler)
    adminPasswordMenu.classList.add("visible")
}

function closeAdminPasswordMenu(){
    adminPasswordMenuTitle.innerText = 'Reset password for "Loading..."'

    adminPasswordMenu.classList.remove("visible")
}


let deleteUserMenu
let deleteUserMenuTitle
let deleteUserMenuConfirm

let deleteUserMenuHandler
function openDeleteUserMenu(uuid){
    if(!deleteUserMenu) {deleteUserMenu = document.getElementById("deleteUserMenu")}
    if(!deleteUserMenuTitle) {deleteUserMenuTitle = deleteUserMenu.querySelector("#title")}
    if(!deleteUserMenuConfirm) {deleteUserMenuConfirm = deleteUserMenu.querySelector("#confirmButton")}

    deleteUserMenuTitle.innerText = `Delete user "${getUsernameFast(uuid)}"`
    if (deleteUserMenuHandler) {
        deleteUserMenuConfirm.removeEventListener("click", deleteUserMenuHandler);
        deleteUserMenuHandler = null;
    }

    deleteUserMenuHandler = async function (){
        deleteUserMenuConfirm.disabled = true;

        await deleteUser(uuid)
        closeDeleteUserMenu()
        deleteUserMenuConfirm.disabled = false;
    }
    deleteUserMenuConfirm.addEventListener("click", deleteUserMenuHandler)

    deleteUserMenu.classList.add("visible")
}

function closeDeleteUserMenu(){
    deleteUserMenuTitle.innerText = 'Delete user "Loading..."'

    deleteUserMenu.classList.remove("visible")
}

async function deleteUser(uuid){
    const response = await fetch(`/api/admin/user?uuid=${encodeURIComponent(uuid)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }
    await getAllUsers()
    throwSuccess(await response.text())
}

async function forceLogout(uuid){
    const response = await fetch(`/api/admin/user/logout?uuid=${encodeURIComponent(uuid)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }

    throwSuccess(await response.text())
}


async function updateUser(uuid, username, dataLimit, isAdmin, enabled){
    let dataByteLimit = parseSize(dataLimit)
    if(dataByteLimit === -1){throwError("The storage limit input could not be converted to bytes"); return}
    const response = await fetch(`/api/admin/user?uuid=${encodeURIComponent(uuid)}&u=${encodeURIComponent(username)}&d=${encodeURIComponent(dataByteLimit.toString())}&a=${encodeURIComponent(isAdmin)}&e=${encodeURIComponent(enabled)}`, {
        method: "PUT"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }

    throwSuccess(await response.text())
    await getAllUsers()
}

async function adminResetPassword(uuid, newPassword){
    const response = await fetch(`/api/admin/user/password?uuid=${encodeURIComponent(uuid)}&p=${encodeURIComponent(newPassword)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }

    throwSuccess(await response.text())
}



// Notification panel
let notifyTitleInput
let notifyMessageInput
async function sendNotification(){
    if(!notifyTitleInput) {notifyTitleInput = document.getElementById("notifyTitle")}
    if(!notifyMessageInput) {notifyMessageInput = document.getElementById("notifyMsg")}

    const response = await fetch(`/api/admin/notify?title=${encodeURIComponent(notifyTitleInput.value)}&msg=${encodeURIComponent(notifyMessageInput.value)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
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
        return
    }
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
        shareContainer.innerHTML = "<h3>Nothing to show here</h3>"
        return
    }

    const frag = document.createDocumentFragment();

    for (const d of downloads) {
        const row = shareTemp.content.cloneNode(true);

        row.querySelector("#name").textContent = d.isFolder ? `${d.name}.${d.extension}` : d.name;
        row.querySelector("#owner").textContent = getUsernameFast(d.owner);
        row.querySelector("#download").textContent = d.download;
        row.querySelector("#maxDownload").textContent = d.maxDownload === -1 ? "infinite" : d.maxDownload;

        row.querySelector("#exp").textContent = Number(d.expire) === -1 ? "never" : formatDate(Number(d.expire));

        row.querySelector("#link").addEventListener("click", async () => {
            await navigator.clipboard.writeText(`${location.origin}/download/${d.uuid}`);
        });

        row.querySelector("#trash").addEventListener("click", async () => {
            await adminDeleteDownload(d.uuid, d.owner);
            await getSharedFiles()
        });

        frag.appendChild(row);
    }

    shareContainer.innerHTML = "";
    shareContainer.replaceChildren(frag);

}

function getUsernameFast(uuid){
    console.log(allUsers)
    console.log(uuid)
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
        return
    }

    throwSuccess(await response.text())
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