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
    constructor(uuid, owner, name, extension, folderId, created, modified, accessed, size){
        this.uuid = uuid;
        this.owner = owner;
        this.name = name;
        this.extension = extension;
        this.folderId = folderId;
        this.created = created;
        this.modified = modified;
        this.accessed = accessed;
        this.size = size;
    }
}

class Folder{
    uuid // string
    owner // string
    name // string
    folderId // string
    constructor(uuid, owner, name, folderId){
        this.uuid = uuid;
        this.owner = owner;
        this.name = name;
        this.folderId = folderId;
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
        fileTemp.querySelector(".file-size").innerHTML = "<i class='fa-regular fa-dash'></i>"
        fileTemp.querySelector(".file-modified").innerHTML = "<i class='fa-regular fa-dash'></i>"

        const folderElement1 = fileTemp.querySelector(".fa-down-to-bracket");
        folderElement1.addEventListener("click", function (){
            downloadZipFile(getParameter("jbd"), file.uuid)
        })

        const folderElement = fileTemp.querySelector("li");
        folderElement.addEventListener("dblclick", function() {
            setParameter("jbd", file.uuid);
            console.log(file.uuid)
            loadDirectory(getParameter("jbd"));

            addPathView(file.name, getParameter("jbd"))
        });

    }else{
        fileTemp.querySelector(".file-name").innerHTML = fileIcon(file.extension) + file.name
        fileTemp.querySelector(".file-modified").innerHTML = file.modified ? formatDate(file.modified) : formatDate(file.created)
        fileTemp.querySelector(".file-size").innerHTML = formatSize(file.size)
        const fileElementDownload = fileTemp.querySelector(".fa-down-to-bracket");
        fileElementDownload.addEventListener("click", function (){
            downloadFile(file.folderId, file.uuid)
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

function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0;

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }

    return `${bytes.toFixed(1)} ${units[i]}`;
}

function fileIcon(extension) {

    const units = [
        "<i class=\"fa-solid fa-file-word icon\" style=\"color: #4285f8;\"></i>",
        "<i class=\"fa-solid fa-file-excel icon\" style=\"color: #07a85f;\"></i>",
        "<i class=\"fa-solid fa-file-powerpoint icon\" style=\"color: #f06741;\"></i>",
        "<i class=\"fa-solid fa-file-image icon\" style=\"color: #269b7f;\"></i>",
        "<i class=\"fa-solid fa-file-music icon\" style=\"color: #e6a10c;\"></i>",
        "<i class=\"fa-solid fa-file-video icon\" style=\"color: #2e3eac;\"></i>",
        "<i class=\"fa-solid fa-file-zipper icon\" style=\"color: #ffc640;\"></i>",
        "<i class=\"fa-solid fa-file icon\" style=\"color: #a5a5a5;\"></i>",
    ];
    if(!extension){return units[7]}
    extension = extension.toLowerCase();
    return {
        "doc": units[0],
        "docx": units[0],
        "xls": units[1],
        "xlsx": units[1],
        "ppt": units[2],
        "pptx": units[2],
        "7z": units[6],
        "rar": units[6],
        "zip": units[6],
        "mov": units[5],
        "mp4": units[5],
        "mpg": units[5],
        "gif": units[3],
        "jpg": units[3],
        "png": units[3],
        "jpeg": units[3],
        "mp3": units[4],
        "ogg": units[4],
        "wav": units[4],
        "bmp": units[3],
        "dcm": units[3],
        "dds": units[3],
        "djvu": units[3],
        "heic": units[3],
        "psd": units[3],
        "tga": units[3],
        "tif": units[3],
        "aif": units[4],
        "flac": units[4],
        "m3u": units[4],
        "m4a": units[4],
        "mid": units[4],
        "3gp": units[4],
        "wma": units[5],
        "asf": units[5],
        "avi": units[5],
        "flv": units[5],
        "m4v": units[5],
        "srt": units[5],
        "swf": units[5],
        "ts": units[5],
        "vob": units[5],
        "wmv": units[5],
        "cbr": units[6],
        "deb": units[6],
        "gz": units[6],
        "pkg": units[6],
        "rpm": units[6],
        "tar.gz": units[6],
        "xapk": units[6],
        "zipx": units[6],
    }[extension] || units[7];
}

function formatDate(raw){
    const trimmed = raw.replace(/(\.\d{3})\d+/, '$1'); // Keep only milliseconds
    const date = new Date(trimmed);

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
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
            await uploadFile(file, getParameter("jbd"));
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

        // Upload the file to its final parent folder
        if (typeof parentId === "string" && file instanceof File) {
            await uploadFile(file, parentId);
        } else {
            console.warn("Skipped file:", file);
        }
    }

    await loadDirectory(rootFolderId);
}
