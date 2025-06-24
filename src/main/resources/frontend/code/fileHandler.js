// #################################################
// ##                 FILE STUFF                  ##
// #################################################

async function uploadFile(file, folderId) {
    const chunkSize = 10 * 1024 * 1024; // 10 MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileName = file.name;

    if (!file || file.size === 0) {
        alert("Invalid file selected or file is empty.");
        return;
    }
    console.log(chunkSize + " : " + totalChunks + " : " + fileName + " : " + file.size)
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkIndex", chunkIndex);
        formData.append("totalChunks", totalChunks);
        formData.append("fileName", encodeURIComponent(fileName));
        formData.append("folderId", encodeURIComponent(folderId));
        console.log(formData)
        const response = await fetch("/api/files/upload", {
            method: "POST",
            body: formData
        });

        if (response.status === 409) {
            alert("Upload failed: File already exists");
            return;
        }

        if (!response.ok) {
            const error = await response.text();
            alert("Upload failed: " + error);
            return;
        }
    }
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
        .catch(err => alert("Error downloading file: " + err));
}

async function deleteFile(folderId, fileId) {

    const response = await fetch(`/api/files/delete?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("Failed to delete file.");
    }
}


// #################################################
// ##               FOLDER STUFF                  ##
// #################################################

async function uploadFolder(folderId, folderName) {
    const response = await fetch(`/api/folders/upload?folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(folderName)}`, {
        method: "POST"
    });

    if (response.status === 409) {
        alert("Folder creation: Folder already exists");
        return;
    }

    if (!response.ok) {
        const error = await response.text();
        alert("Upload failed: " + error);
    }
}

async function browseDirectory(folderId) {
    const response = await fetch(`/api/folders/browse?folderId=${encodeURIComponent(folderId)}`, {
        method: "GET"
    });

    if (!response.ok) {
        alert("Failed to browse directory.");
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
        file.size
    ));

    const folders = result.folders.map(folder => new Folder(
        folder.uuid,
        folder.owner,
        folder.name,
        folder.folderId
    ));

    return { files, folders };
}

function downloadZipFile(path) {
    fetch(`/api/folders/download?path=${encodeURIComponent(path)}`, {
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
        .catch(err => alert("Error downloading file: " + err));
}

async function deleteFolder(folderId, folderUuid) {

    const response = await fetch(`/api/folders/delete?folderId=${encodeURIComponent(folderId)}&folderUuid=${encodeURIComponent(folderUuid)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("Failed to delete folder.");
    }
}

async function getFolderId(folderId, folderName){
    const response = await fetch(`/api/folders/browse?folderId=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(folderName)}`, {
        method: "GET"
    });

    if (!response.ok) {
        alert("Failed get folder id");
        return;
    }

    return await response.text();
}