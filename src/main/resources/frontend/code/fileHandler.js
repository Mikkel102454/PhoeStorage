// #################################################
// ##                 FILE STUFF                  ##
// #################################################

async function uploadFile(file, folderId, notify) {
    const chunkSize = 10 * 1024 * 1024; // 10 MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileName = file.name;

    if (!file) {
        throwWarning("You did not upload a file")
        return;
    }
    if (file.size === 0) {
        throwWarning("Your uploaded file is empty")
        return;
    }
    if(notify){throwInformation("Upload Began")}
    let uploadId = "";
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkIndex", chunkIndex);
        formData.append("totalChunks", totalChunks);
        formData.append("fileName", fileName);
        formData.append("folderId", folderId);
        formData.append("uploadId", uploadId);
        console.log(formData)
        const response = await fetch("/api/files/upload", {
            method: "POST",
            body: formData
        });

        if (response.status === 507) {
            throwWarning("You dont have enough space for this file")
            return -1;
        }
        if (response.status === 409) {
            throwWarning("File already exists: " + fileName)
            return;
        }
        if (response.status === 404) {
            throwWarning("The folder you uploaded to does not exist")
            return;
        }

        if (!response.ok) {
            throwError("Upload failed: " + await response.text())
            return;
        }
        uploadId = await response.text()
    }
    if(notify){throwSuccess("Upload finished")}
}

function downloadFile(folderId, fileId) {
    fetch(`/api/files/download?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}`, {
        method: "GET",

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
        .catch(error => throwError("Download failed: " + error));
}

async function deleteFile(folderId, fileId, notify) {

    const response = await fetch(`/api/files/delete?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}`, {
        method: "POST"
    });

    if(response.status === 404){
        throwWarning("Could not find the file")
        return;
    }

    if (!response.ok) {
        throwError("Failed to delete file: " + await response.text())
        return
    }
    if(notify){throwSuccess("File deleted")}
}

async function renameFile(folderId, fileId, name){
    const response = await fetch(`/api/files/rename?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}&name=${encodeURIComponent(name)}`, {
        method: "POST"
    });

    if (response.status === 409) {
        throwWarning("File already exists: " + await response.text())
        return;
    }

    if (!response.ok) {
        throwError("Failed to rename file: " + await response.text())
    }
}

async function getStarredFiles(){
    const response = await fetch(`/api/files/starred`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError("Failed to get starred files: " + await response.text())
        return
    }
    const result = await response.json();

    return result.map(file => new File(
        file.uuid,
        file.owner,
        file.name,
        file.extension,
        file.folderId,
        file.created,
        file.modified,
        file.accessed,
        file.size,
        file.starred
    ));
}

async function setStarredFile(folderId, fileId, value){
    const response = await fetch(`/api/files/starred?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}&value=${value}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError("Failed to star file: " + await response.text())
        return
    }
}


// #################################################
// ##               FOLDER STUFF                  ##
// #################################################
async function getFolderLocation(folderUuid){
    const response = await fetch(`/api/folders/location?folderUuid=${encodeURIComponent(folderUuid)}`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError("Failed to get folder location: " + await response.text())
    }

    const result = await response.json();

    return result.map(folder => new Folder(
        folder.uuid,
        folder.owner,
        folder.name,
        folder.folderId
    ));
}

async function uploadFolder(folderId, folderName) {
    const response = await fetch(`/api/folders/upload?folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(folderName)}`, {
        method: "POST"
    });

    if (response.status === 409) {
        throwWarning("Folder already exists: " + await response.text())
        return;
    }

    if (!response.ok) {
        throwError("Failed to upload folder: " + await response.text())
    }
    return response.text();
}

async function browseDirectory(folderId) {
    const response = await fetch(`/api/folders/browse?folderId=${encodeURIComponent(folderId)}`, {
        method: "GET"
    });

    if (response.status === 404) {
        throwWarning("Could not find directory")
        return;
    }

    if (!response.ok) {
        throwError("Failed to browse directory: " + await response.text());
        return;
    }

    const result = await response.json();

    const files = result.files.map(file => new File(
        file.uuid,
        file.owner,
        file.name,
        file.extension,
        file.folderId,
        file.created,
        file.modified,
        file.accessed,
        file.size,
        file.starred
    ));

    const folders = result.folders.map(folder => new Folder(
        folder.uuid,
        folder.owner,
        folder.name,
        folder.folderId,
        folder.size
    ));

    return { files, folders };
}

function downloadZipFile(folderId, folderUuid) {
    fetch(`/api/folders/download?folderId=${encodeURIComponent(folderId)}&folderUuid=${encodeURIComponent(folderUuid)}`, {
        method: "GET"
    })
        .then(async response => {
            if(response.status === 404) {throwWarning("No files found to zip"); return Promise.reject("No files found to zip");}
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
        .catch(error => {
            if(error !== "No files found to zip"){
                throwError("Download failed: " + error)
            }
        });
}

async function deleteFolder(folderId, folderUuid, notify) {

    const response = await fetch(`/api/folders/delete?folderId=${encodeURIComponent(folderId)}&folderUuid=${encodeURIComponent(folderUuid)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError("Failed to delete folder: " + await response.text())
    }

    if(notify){throwSuccess("Folder deleted")}
}

async function renameFolder(folderId, folderUuid, name){
    const response = await fetch(`/api/folders/rename?folderId=${encodeURIComponent(folderId)}&folderUuid=${encodeURIComponent(folderUuid)}&name=${encodeURIComponent(name)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError("Failed to rename folder: " + await response.text())
    }
}

async function getFolderId(folderId, folderName){
    const response = await fetch(`/api/folders/parent?folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(folderName)}`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError("Failed to get folder id: " + await response.text())
        return null;
    }

    return await response.text();
}




async function createDownloadLink(folderId, itemId, maxDownloads, isFolder) {
    const url = isFolder
        ? `/api/folders/download?folderId=${encodeURIComponent(folderId)}&folderUuid=${encodeURIComponent(itemId)}&limit=${encodeURIComponent(maxDownloads)}`
        : `/api/files/download?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(itemId)}&limit=${encodeURIComponent(maxDownloads)}`;

    return fetch(url, { method: "POST" })
        .then(async (response) => {
            if (!response.ok) throw new Error("Creating share link failed");
            return await response.text();
        })
        .catch((error) => {
            throwError("Something failed: " + error);
        });
}
