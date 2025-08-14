onload = function(){
    init()
}

class Download{
    ownerUuid // string
    fileName // string
    fileExtension // string
    dateExpire // string
    isFolder // boolean
    size // long
    constructor(ownerUuid, fileName, fileExtension, dateExpire, isFolder, size){
        this.ownerUuid = ownerUuid
        this.fileName = fileName
        this.fileExtension = fileExtension
        this.dateExpire = dateExpire
        this.isFolder = isFolder
        this.size = size
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
        "<i class=\"fileLogo fa-solid fa-file-word icon\" style=\"color: #4285f8;\"></i>",
        "<i class=\"fileLogo fa-solid fa-file-excel icon\" style=\"color: #07a85f;\"></i>",
        "<i class=\"fileLogo fa-solid fa-file-powerpoint icon\" style=\"color: #f06741;\"></i>",
        "<i class=\"fileLogo fa-solid fa-file-image icon\" style=\"color: #269b7f;\"></i>",
        "<i class=\"fileLogo fa-solid fa-file-music icon\" style=\"color: #e6a10c;\"></i>",
        "<i class=\"fileLogo fa-solid fa-file-video icon\" style=\"color: #2e3eac;\"></i>",
        "<i class=\"fileLogo fa-solid fa-file-zipper icon\" style=\"color: #ffc640;\"></i>",
        "<i class=\"fileLogo fa-solid fa-file icon\" style=\"color: #a5a5a5;\"></i>",
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

function downloadFile(link) {
    fetch(`/api/public/download/file?downloadId=${encodeURIComponent(link)}`, {
        method: "GET"
    })
        .then(async response => {
            if (!response.ok) throw new Error("Download failed");

            // Try to get filename from the Content-Disposition header
            const disposition = response.headers.get("Content-Disposition");
            let filename = "downloaded_file";
            if (disposition && disposition.includes("filename=")) {
                const match = disposition.match(/filename="(.+)"/);
                if (match && match[1]) filename = match[1];
            }

            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(link.href);
        })
        .catch(error => console.log("Download failed: " + error));
}

function downloadZipFile(link) {
    fetch(`/api/public/download/folder?downloadId=${encodeURIComponent(link)}`, {
        method: "GET"
    })
        .then(async response => {
            if(response.status === 404) {console.log("No files found to zip"); return Promise.reject("No files found to zip");}
            if (!response.ok){
                alert("Download failed")
                throw new Error("Download failed");
            }

            // Try to get filename from the Content-Disposition header
            const disposition = response.headers.get("Content-Disposition");
            let filename = "downloaded_file";
            if (disposition && disposition.includes("filename=")) {
                const match = disposition.match(/filename="(.+)"/);
                if (match && match[1]) filename = match[1];
            }

            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(link.href);
        })
        .catch(error => {
            if(error !== "No files found to zip"){
                alert("Download failed: " + error)
            }
        });
}


async function init(){
    let link = window.location.pathname.split('/').pop()

    const response = await fetch(`/api/public/download/info?downloadId=${encodeURIComponent(link)}`, {
        method: "GET"
    });

    if (!response.ok) {
        return
    }
    const result = await response.json();

    download = new Download(
        result.ownerUuid,
        result.fileName,
        result.fileExtension,
        result.dateExpire,
        result.isFolder,
        result.size
    );

    //set data
    document.getElementById("fileName").textContent = download.fileName
    document.getElementById("fileSize").textContent = formatSize(download.size)
    document.getElementById("fileType").textContent = download.fileExtension
    document.getElementById("dateExpire").textContent = formatDate(download.dateExpire)

    document.getElementById("fileLogo").innerHTML = fileIcon(download.fileExtension)

    document.getElementById("downloadBtn").addEventListener("click", async function (){
        if(download.isFolder){
            downloadZipFile(link)
        }else{
            downloadFile(link)
        }
    })
    document.getElementById("copyBtn").addEventListener("click", async function (){
        navigator.clipboard.writeText(window.location.href);
    })
}