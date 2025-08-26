async function loadDownload(){
    /* loads account downloads */
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


let downloadContainer


function addDownload(downloads){
    if(!downloadContainer) {downloadContainer = document.querySelector('[type="container.download"]')}

    if(!downloads.length > 0) {
        downloadContainer.innerHTML = '<div class="d-flex h-15"><h3 class="m-a w-fit font-note">Nothing to show here</h3></div>'
        return
    }

    downloadContainer.innerHTML = "";

    for (const d of downloads) {
        d.load(downloadContainer)
    }
}



let lastTriedUsername
let username
let usernameConfirm

let passwordOld
let passwordNew
let passwordConfirm
async function loadSettings(){
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

    /* USERNAME */
    if(!username){username = document.querySelector('[typeI="input.username"]')}
    if(!usernameConfirm){usernameConfirm = document.querySelector('[type="button.username.confirm"]')}

    usernameConfirm.addEventListener("click", async () => {
        await setSettings("username", username.value)
    })
    username.value = settings.username
    lastTriedUsername = settings.username


    /* PASSWORD */
    if(!passwordOld){passwordOld = document.querySelector('[typeI="input.passwordOld"]')}
    if(!passwordNew){passwordNew = document.querySelector('[typeI="input.passwordNew"]')}
    if(!passwordConfirm){passwordConfirm = document.querySelector('[type="button.password.confirm"]')}

    passwordConfirm.addEventListener("click", async () => {
        await setPassword(passwordOld.value, passwordNew.value)
        passwordOld.value = ""
        passwordNew.value = ""
    })
}

async function setSettings(name, value){
    if(name === "username" && lastTriedUsername === value){return}
    if(name === "username"){lastTriedUsername = value}
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

onload = async function(){
    await loadDownload()
    await loadSettings()
}