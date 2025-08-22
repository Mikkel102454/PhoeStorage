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

    if (!response.ok) {
        throwError(await response.text())
    }
    return response.text();
}

async function browseDirectory(folderId) {
    const response = await fetch(`/api/folders/browse?folderId=${encodeURIComponent(folderId)}`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text());
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
                throwError(error)
            }
        });
}

async function deleteFolder(folderId, folderUuid, notify) {

    const response = await fetch(`/api/folders/delete?folderId=${encodeURIComponent(folderId)}&folderUuid=${encodeURIComponent(folderUuid)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    if(notify){throwSuccess("Folder deleted")}
}

async function renameFolder(folderId, folderUuid, name){
    const response = await fetch(`/api/folders/rename?folderId=${encodeURIComponent(folderId)}&folderUuid=${encodeURIComponent(folderUuid)}&name=${encodeURIComponent(name)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
    }
}

async function getFolderId(folderId, folderName){
    const response = await fetch(`/api/folders/parent?folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(folderName)}`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text())
        return null;
    }

    return await response.text();
}