class File{
    uuid // string
    owner // string
    name // string
    extension // string
    folderId // string
    created // string
    modified // string
    accessed // string
    size // long
    starred // boolean
    constructor(uuid, owner, name, extension, folderId, created, modified, accessed, size, starred){
        this.uuid = uuid;
        this.owner = owner;
        this.name = name;
        this.extension = extension;
        this.folderId = folderId;
        this.created = created;
        this.modified = modified;
        this.accessed = accessed;
        this.size = size;
        this.starred = starred;
    }
}

class Folder{
    uuid // string
    owner // string
    name // string
    folderId // string
    size // long
    constructor(uuid, owner, name, folderId, size){
        this.uuid = uuid;
        this.owner = owner;
        this.name = name;
        this.folderId = folderId;
        this.size = size;
    }
}

let fileCardTemplate
let folderPathTemplate

async function createFile(file, fileParent, isFolder){
    if(!fileCardTemplate){
        fileCardTemplate = document.getElementById("file-card-temp");
    }

    let fileTemp = fileCardTemplate.content.cloneNode(true);

    fileTemp.querySelector(".file-owner").innerHTML = isMe(file.owner) ? "me" : await getUsernameFromUuid(file.owner);

    if (isFolder){
        fileTemp.querySelector(".file-name").innerHTML = "<i class='fa-solid fa-folder icon' style = 'color: #FFD43B;'></i>" + file.name
        fileTemp.querySelector(".file-size").innerHTML = formatSize(file.size)
        fileTemp.querySelector(".file-modified").innerHTML = "<i class='fa-regular fa-dash'></i>"

        const fileElementShare = fileTemp.querySelector(".fa-user-plus");
        fileElementShare.addEventListener("click", async function (){
            openShareMenu(file, true)
        })

        const folderElementDownload = fileTemp.querySelector(".fa-down-to-bracket");
        folderElementDownload.addEventListener("click", function (){
            downloadZipFile(getParameter("jbd"), file.uuid)
        })
        const folderElementRename = fileTemp.querySelector(".fa-pen-line");
        folderElementRename.addEventListener("click", async function (){
            openRenameMenu(file, true)
        })
        const folderElementStar = fileTemp.querySelector(".fa-star");
        folderElementStar.parentElement.style.visibility = "hidden"

        const folderElementDelete = fileTemp.querySelector(".fa-trash");
        folderElementDelete.addEventListener("click", async function (){
            await openDeleteModal(file, true, getParameter("jbd"), file.uuid)
        })

        const folderElement = fileTemp.querySelector("li");
        folderElement.addEventListener("dblclick", function() {
            setParameter("jbd", file.uuid);
            loadDirectory(getParameter("jbd"));

            addPathView(file.name, getParameter("jbd"))
        });

    }else{
        fileTemp.querySelector(".file-name").innerHTML = fileIcon(file.extension) + file.name
        fileTemp.querySelector(".file-modified").innerHTML = file.modified ? formatDate(file.modified) : formatDate(file.created)
        fileTemp.querySelector(".file-size").innerHTML = formatSize(file.size)
        const fileElementShare = fileTemp.querySelector(".fa-user-plus");
        fileElementShare.addEventListener("click", async function (){
            openShareMenu(file, false)
        })

        const fileElementDownload = fileTemp.querySelector(".fa-down-to-bracket");
        fileElementDownload.addEventListener("click", function (){
            downloadFile(file.folderId, file.uuid)
        })
        const fileElementRename = fileTemp.querySelector(".fa-pen-line");
        fileElementRename.addEventListener("click", async function (){
            openRenameMenu(file, false)
        })
        const fileElementStar = fileTemp.querySelector(".fa-star");
        if(file.starred) {
            fileElementStar.classList.add('fa-solid');
            fileElementStar.classList.remove('fa-regular');
        }

        fileElementStar.addEventListener("click", async function (){
            if(this.classList.contains('fa-regular')){
                await setStarredFile(file.folderId, file.uuid, true);
                this.classList.add('fa-solid');
                this.classList.remove('fa-regular');
            }else{
                await setStarredFile(file.folderId, file.uuid, false);
                this.classList.remove('fa-solid');
                this.classList.add('fa-regular');
            }
        })
        const fileElementDelete = fileTemp.querySelector(".fa-trash");
        fileElementDelete.addEventListener("click", async function (){
            await openDeleteModal(file, false, file.folderId, file.uuid)
        })
    }

    fileParent.appendChild(fileTemp);
}

function addPathView(name, redirect) {
    if(!folderPathTemplate){
        folderPathTemplate = document.getElementById("folder-path-temp");
    }
    let folderPathTemp = folderPathTemplate.content.cloneNode(true);
    let pathName = folderPathTemp.querySelector(".path-name");
    pathName.innerHTML = name

    pathName.addEventListener("click", function() {
        setParameter('jbd', redirect)
        loadDirectory(redirect);
        deletePathAfter(this.parentElement);
    })

    document.querySelector(".path").appendChild(folderPathTemp)
}

function deletePathAfter(element){
    const allPaths = Array.from(document.querySelector(".path").children);
    const index = allPaths.indexOf(element);

    if (index === -1) return;

    for (let i = allPaths.length - 1; i > index; i--) {
        allPaths[i].remove();
    }
}

async function resetPath(element) {
    const uuid = await getMyUuid();
    await loadDirectory(uuid);
    deletePathAfter(element);
    setParameter('jbd', uuid);
}

let renameMenu;
let renameMenuConfirm;
let renameMenuInput;
let currentRenameHandler; // store the current handler to remove it later

function openRenameMenu(item, isFolder) {
    if (!renameMenu) renameMenu = document.getElementById("renameMenu");
    if (!renameMenuConfirm) renameMenuConfirm = renameMenu.querySelector("#confirmButton");
    if (!renameMenuInput) renameMenuInput = renameMenu.querySelector("#renameMenuInput");

    // Remove old click handler if any
    if (currentRenameHandler) {
        renameMenuConfirm.removeEventListener("click", currentRenameHandler);
        currentRenameHandler = null;
    }

    renameMenuInput.value = item.name;

    // Define and store the current handler so it can be removed next time
    currentRenameHandler = async function () {
        const newName = renameMenuInput.value.trim();
        if (newName.length === 0) return;

        if (isFolder) {
            await renameFolder(item.folderId, item.uuid, newName);
        } else {
            await renameFile(item.folderId, item.uuid, newName);
        }
        await loadDirectory(getParameter("jbd"));
        closeRenameMenu();
    };

    renameMenuConfirm.addEventListener("click", currentRenameHandler);

    renameMenu.classList.add("visible");
}

function closeRenameMenu(){
    if(!renameMenu) {renameMenu = document.getElementById("renameMenu")}
    renameMenu.classList.remove("visible");
}

let shareMenu;
let shareMenuTitle
let shareMenuConfirm;
let shareMenuInput;
let shareMenuOutput;
let currentShareHandler; // store the current handler to remove it later

function openShareMenu(item, isFolder) {
    if (!shareMenu) shareMenu = document.getElementById("shareMenu");
    if (!shareMenuTitle) shareMenuTitle = shareMenu.querySelector("#shareMenuTitle");
    if (!shareMenuConfirm) shareMenuConfirm = shareMenu.querySelector("#confirmButton");
    if (!shareMenuInput) shareMenuInput = shareMenu.querySelector("#shareMenuInput");
    if (!shareMenuOutput) shareMenuOutput = shareMenu.querySelector("#shareMenuOutput");
    

    // Remove old click handler if any
    if (currentShareHandler) {
        shareMenuConfirm.removeEventListener("click", currentShareHandler);
        currentShareHandler = null;
    }


    shareMenuTitle.innerText = 'Share "' + item.name + '"'
    shareMenuOutput.innerText = "";
    shareMenuInput.value = "";

    // Define and store the current handler so it can be removed next time
    currentShareHandler = async function () {
        let downloadLimit = shareMenuInput.value.trim()
            ? Number(shareMenuInput.value.trim())
            : -1;

        let link = await createDownloadLink(item.folderId, item.uuid, downloadLimit, isFolder)

        if (link === "404 - NOT FOUND" || link === "500 - INTERNAL SERVER ERROR"){
            throwError(link)
            closeShareMenu()
            return
        }

        shareMenuOutput.innerText = window.location.host + "/download/" + link
        if (shareMenuOutput.innerText !== ""){
            shareMenuConfirm.removeEventListener("click", currentShareHandler);
            currentShareHandler = null;
        }
    };

    shareMenuConfirm.addEventListener("click", currentShareHandler);

    shareMenu.classList.add("visible");
}

function closeShareMenu(){
    if(!shareMenu) {shareMenu = document.getElementById("shareMenu")}
    shareMenu.classList.remove("visible");
}

function toggleFolderCreationMenu(){
    const createFolder = document.getElementById("createFolderMenu")
    document.getElementById("createFolderMenuInput").value = "";
    createFolder.classList.toggle("visible");

}

function openFileUploadMenu() {
    document.getElementById('hiddenFileInput').click();
}

function openFolderUploadMenu() {
    document.getElementById('hiddenFolderInput').click();
}

document.getElementById('hiddenFileInput').addEventListener('change', async function () {
    if (this.files.length > 0) {
        for (const file of this.files) {
            await uploadFile(file, getParameter("jbd"), true);
        }
        await loadDirectory(getParameter("jbd"))
    }
});

document.getElementById('hiddenFolderInput').addEventListener('change', async function () {
    FolderUploading(this.files)
});

async function FolderUploading(fileListOrArray) {
    const files = Array.from(fileListOrArray); // Works with FileList or Array<File>
    const rootFolderId = getParameter("jbd");

    if (!rootFolderId || typeof rootFolderId !== "string") {
        alert("Invalid root folder ID.");
        return;
    }

    const folderIdCache = new Map();
    throwInformation("Upload began")
    for (const file of files) {
        if (!file.webkitRelativePath) continue; // skip loose files

        const parts = file.webkitRelativePath.split('/');
        parts.pop(); // Remove file name from path
        let parentId = rootFolderId;

        for (let i = 0; i < parts.length; i++) {
            const folderName = parts[i];
            const cacheKey = `${parentId}/${folderName}`;

            if (!folderIdCache.has(cacheKey)) {
                let folderId;

                if (i === 0) {
                    // Always create the top-level folder (e.g., "MyFolder")
                    folderId = await uploadFolder(parentId, folderName);
                } else {
                    // Try to fetch, or create if missing
                    folderId = await getFolderId(parentId, folderName);
                    if (!folderId || typeof folderId !== "string") {
                        folderId = await uploadFolder(parentId, folderName);
                    }
                }

                folderIdCache.set(cacheKey, folderId);
            }

            parentId = folderIdCache.get(cacheKey);
        }

        await uploadFile(file, parentId);
    }
    throwSuccess("Upload finished")
    await loadDirectory(rootFolderId);
}

let deleteModal
let deleteModalTitle
let deleteModalName
let deleteModalSize
let deleteModalLastModified
let deleteModalButton
let deleteModalButtonHandler
async function openDeleteModal(file, isFolder, parentId, objectId){
    initDeleteModal()

    if(isFolder) { deleteModalTitle.innerText = "Delete folder permanently?" }
    else { deleteModalTitle.innerText = "Delete file permanently?" }

    deleteModalName.innerText = file.name

    deleteModalSize.innerText = formatSize(file.size)

    if(isFolder) { deleteModalLastModified.innerHTML = "<i class='fa-regular fa-dash'></i>"}
    else { deleteModalLastModified.innerText = formatDate(file.modified ? file.modified : file.created) }

    if (deleteModalButtonHandler) {
        deleteModalButton.removeEventListener("click", deleteModalButtonHandler);
        deleteModalButtonHandler = null;
    }

    deleteModalButtonHandler = async function (){
        deleteModalButton.disabled = true;
        if(isFolder){await deleteFolder(parentId, objectId, true)}
        else{await deleteFile(parentId, objectId, true)}

        await loadDirectory(getParameter("jbd"));

        closeDeleteModal()
        deleteModalButton.disabled = false;
    }
    deleteModalButton.addEventListener("click", deleteModalButtonHandler)

    deleteModal.classList.add("visible");
}
function closeDeleteModal(){
    initDeleteModal()

    deleteModalTitle.innerText = "Delete file permanently?"
    deleteModalName.innerText = "Loading..."
    deleteModalSize.innerText = "Loading..."
    deleteModalLastModified.innerText = "Loading..."

    deleteModal.classList.remove("visible")
}

let forcePasswordMenu;
let forcePasswordMenuConfirm;
let forcePasswordMenuInput;
let forcePasswordMenuInputConfirm;
function openForcePasswordMenu() {
    if (!forcePasswordMenu) forcePasswordMenu = document.getElementById("passwordMenu");
    if (!forcePasswordMenuConfirm) forcePasswordMenuConfirm = forcePasswordMenu.querySelector("#confirmButton");
    if (!forcePasswordMenuInput) forcePasswordMenuInput = forcePasswordMenu.querySelector("#passwordInput");
    if (!forcePasswordMenuInputConfirm) forcePasswordMenuInputConfirm = forcePasswordMenu.querySelector("#confirmPasswordInput");

    forcePasswordMenuConfirm.addEventListener("click", async function(){
        switch (await forceChangePassword(forcePasswordMenuInput.value, forcePasswordMenuInputConfirm.value)){
            case 0:
                closeForcePasswordMenu()
                throwSuccess("Changed password")
                break;
            case 1:
                throwError("Password need to be 3 character or longer")
                break;
            case 2:
                throwError("Passwords is not the same")
                break;
        }
    });

    forcePasswordMenu.classList.add("visible");
}

function closeForcePasswordMenu(){
    if(!forcePasswordMenu) {forcePasswordMenu = document.getElementById("renameMenu")}
    forcePasswordMenu.classList.remove("visible");
}

function initDeleteModal(){
    if(!deleteModal) deleteModal = document.getElementById("deleteModal");
    if(!deleteModalTitle) deleteModalTitle = deleteModal.querySelector("#title");
    if(!deleteModalName) deleteModalName = deleteModal.querySelector("#name");
    if(!deleteModalSize) deleteModalSize = deleteModal.querySelector("#size");
    if(!deleteModalLastModified) deleteModalLastModified = deleteModal.querySelector("#date");
    if(!deleteModalButton) deleteModalButton = deleteModal.querySelector("#confirmBtn");
}

async function search(query, searchBar, starred){
    if(query === ""){
        if(starred) {await loadStarred(); return}
        await loadDirectory(getParameter("jbd")); return
    }
    let result = await searchFiles(query)

    let fileParent = document.querySelector(".file-content")

    fileParent.innerHTML = ""
    for(const file of result){
        if(starred){
            if(file.starred){await createFile(file, fileParent, false)}
        }else{
            await createFile(file, fileParent, false)
        }
    }
}
