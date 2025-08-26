let userRowContainer

async function getAllUsers(){
    const response = await fetch(`/api/admin/user`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }
    const result = await response.json();

    let allUsers = []
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

    if(!userRowContainer) {userRowContainer = document.querySelector('[type="container.user"]')}

    if(!allUsers.length > 0) {userRowContainer.innerHTML = `<div class="d-flex h-15"><h3 class="m-a w-fit font-note">Nothing to show here</h3></div>`; return}

    userRowContainer.innerHTML = ""
    for (const u of allUsers){
        u.load(userRowContainer)
    }
}

let downloadRowContainer
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

    if(!downloadRowContainer) {downloadRowContainer = document.querySelector('[type="container.download"]')}

    if(!downloads.length > 0) {downloadRowContainer.innerHTML = `<div class="d-flex h-15"><h3 class="m-a w-fit font-note">Nothing to show here</h3></div>`; return}

    downloadRowContainer.innerHTML = ""
    for (const d of downloads){
        d.load(downloadRowContainer)
    }
}

// User panel
let createUsernameInput
let createPasswordInput
let createDataLimitInput
let createAdminInput
let createEnabledInput
let createButton
async function createUserInit(){
    if(!createUsernameInput) {createUsernameInput = document.querySelector('[typeI="input.username.createUser"]')}
    if(!createPasswordInput) {createPasswordInput = document.querySelector('[typeI="input.password.createUser"]')}
    if(!createDataLimitInput) {createDataLimitInput = document.querySelector('[typeI="input.dataLimit.createUser"]')}
    if(!createAdminInput) {createAdminInput = document.querySelector('[typeI="input.isAdmin.createUser"]')}
    if(!createEnabledInput) {createEnabledInput = document.querySelector('[typeI="input.isEnabled.createUser"]')}

    if(!createButton) {createButton = document.querySelector('[type="button.confirm.createUser"]')}

    createButton.addEventListener("click", async () => {
        let dataByteLimit = formatSizeReverse(createDataLimitInput.value)
        if(dataByteLimit === -1){throwError("The storage limit input could not be converted to bytes"); return}
        const response = await fetch(`/api/admin/user?u=${encodeURIComponent(createUsernameInput.value)}&p=${encodeURIComponent(createPasswordInput.value)}&d=${encodeURIComponent(dataByteLimit.toString())}&a=${encodeURIComponent(createAdminInput.checked)}&e=${encodeURIComponent(createEnabledInput.checked)}`, {
            method: "POST"
        });

        createUsernameInput.value = ""
        createPasswordInput.value = ""
        createDataLimitInput.value = ""
        createAdminInput.checked = false
        createEnabledInput.checked = false

        if (!response.ok) {
            throwError(await response.text())
            return
        }

        throwSuccess(await response.text())
        await getAllUsers()
    })
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
    let dataByteLimit = formatSizeReverse(dataLimit)
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

onload = async function (){
    await getAllUsers()
    await createUserInit()
    await getSharedFiles()
}