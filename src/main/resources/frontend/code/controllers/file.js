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

        if (!response.ok) {
            throwError(await response.text())
            return;
        }
        uploadId = await response.text()
    }
    if(notify){throwSuccess("Upload finished")}

    return true
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
        .catch(error => throwError(error));

    return true
}

async function deleteFile(folderId, fileId, notify) {

    const response = await fetch(`/api/files/delete?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
        return
    }
    if(notify){throwSuccess("File deleted")}

    return true
}

async function renameFile(folderId, fileId, name){
    if(!name.length > 0){ throwWarning("File name must be 1 or more characters"); return}

    const response = await fetch(`/api/files/rename?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}&name=${encodeURIComponent(name)}`, {
        method: "POST"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    return true
}

async function searchFiles(query) {
    const response = await fetch(`/api/files/search?query=${encodeURIComponent(query)}`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text());
        return;
    }

    const result = await response.json();
    let allFiles = []
    result.forEach(item => {
        allFiles.push(new File(
            item.uuid,
            item.owner,
            item.name,
            item.extension,
            item.folderId,
            item.created,
            item.modified,
            item.accessed,
            item.size,
            item.starred
        ))
    });
    return allFiles
}

async function getStarredFiles(){
    const response = await fetch(`/api/files/starred`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError(await response.text())
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
        throwError(await response.text())
        return
    }

    return true
}



function openFileUploadMenu() {
    document.getElementById('hiddenFileInput').click();
}

document.getElementById('hiddenFileInput').addEventListener('change', async function () {
    if (this.files.length > 0) {
        throwInformation("Upload Began")
        for (const file of this.files) {
            await uploadFile(file, getParameter("jbd"), false);
            await reloadStorageLimit()
        }
        await refreshDirectoryDrive()
        throwSuccess("Upload finished")
    }
});