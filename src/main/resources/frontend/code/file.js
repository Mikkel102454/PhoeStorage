class File{
    uuid // string
    owner // string
    name // string
    extension // string
    path // string
    fullPath // string
    created // string
    modified // string
    accessed // string
    size // long
    isFolder // boolean
    constructor(uuid, owner, name, extension, path, fullPath, created, modified, accessed, size, isFolder){
        this.uuid = uuid;
        this.owner = owner;
        this.name = name;
        this.extension = extension;
        this.path = path;
        this.fullPath = fullPath;
        this.created = created;
        this.modified = modified;
        this.accessed = accessed;
        this.size = size;
        this.isFolder = isFolder
    }
}

let fileCardTemplate
let folderPathTemplate

async function createFile(file, fileParent){
    if(!fileCardTemplate){
        fileCardTemplate = document.getElementById("file-card-temp");
    }
    let fileTemp = fileCardTemplate.content.cloneNode(true);

    fileTemp.querySelector(".file-owner").innerHTML = isMe(file.owner) ? "me" : await getUsernameFromUuid(file.owner);

    if (file.isFolder){
        fileTemp.querySelector(".file-name").innerHTML = "<i class='fa-solid fa-folder icon' style = 'color: #FFD43B;'></i>" + file.name
        fileTemp.querySelector(".file-size").innerHTML = "<i class='fa-regular fa-dash'></i>"
        fileTemp.querySelector(".file-modified").innerHTML = "<i class='fa-regular fa-dash'></i>"

        const fileElement1 = fileTemp.querySelector(".fa-down-to-bracket");
        fileElement1.addEventListener("click", function (){
            downloadZipFile(getParameter("jbd") + file.name + "/")
        })


        const fileElement = fileTemp.querySelector("li");
        fileElement.addEventListener("dblclick", function() {
            addParameter("jbd", file.name + "/");
            loadDirectory(getParameter("jbd"));

            addPathView(file.name, getParameter("jbd"))
        });

    }else{
        fileTemp.querySelector(".file-name").innerHTML = fileIcon(file.extension) + file.name
        fileTemp.querySelector(".file-modified").innerHTML = file.modified ? formatDate(file.modified) : formatDate(file.created)
        fileTemp.querySelector(".file-size").innerHTML = formatSize(file.size)
        const fileElement = fileTemp.querySelector(".fa-down-to-bracket");
        fileElement.addEventListener("click", function (){
            downloadFile(file.fullPath)
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