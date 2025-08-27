let uploadTemp;
let uploadContainer;

async function uploadFile(file, folderId) {
    const chunkSize = 10 * 1024 * 1024; // 10 MB

    if (!file) {
        throwWarning("You did not upload a file")
        return;
    }
    if (file.size === 0) {
        throwWarning("Your uploaded file is empty")
        return;
    }

    let cancelled = false

    if(!uploadTemp) {uploadTemp = document.getElementById("uploadItem")}
    if(!uploadContainer) {uploadContainer = document.querySelector('[type="container.upload"]')}

    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / chunkSize);
    const fileName = file.name;

    const wrapper = document.createElement("div");
    const temp = uploadTemp.content.cloneNode(true)

    temp.querySelector('[type="span.name"]').innerHTML = fileIcon(file.extension) + file.name
    temp.querySelector('[type="span.time"]').textContent = "Estimating..."

    temp.querySelector('[type="icon.stop"]').addEventListener("click", () => {
        cancelled = true
        wrapper.remove()
        if(!uploadContainer.childElementCount > 0) uploadContainer.parentElement.classList.add("d-none")
    })

    setCircleProgress(temp, 0);

    wrapper.appendChild(temp)
    uploadContainer.appendChild(wrapper)

    uploadContainer.parentElement.querySelector('[type="span.title"]').textContent = `Uploading ${uploadContainer.childElementCount} item`

    uploadContainer.parentElement.classList.remove("d-none")

    let uploadId = "";
    const startedAt = performance.now();

    function fmtDuration(sec) {
        sec = Math.max(0, Math.round(sec));
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h} hour, ${m} min left`;
        if (m > 0) return `${m} min, ${s} sec left`;
        if(!s > 0) return "Finalizing"
        return `${s} seconds left`;
    }
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if(cancelled) return
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

        const response = await fetch("/api/files/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throwError(await response.text())
            wrapper.remove()
            if(!uploadContainer.childElementCount > 0) uploadContainer.parentElement.classList.add("d-none")
            return;
        }
        uploadId = await response.text()

        const uploadedBytes = end;
        const f = uploadedBytes / totalSize;
        const pct = Math.round(f * 100);
        const elapsed = (performance.now() - startedAt) / 1000;
        const etaSec = f > 0 ? (elapsed * (1 - f)) / f : Infinity;

        if(etaSec === 0){
            wrapper.querySelector('[type="span.time"]').textContent = "finalizing..."
        } else{
            wrapper.querySelector('[type="span.time"]').textContent = isFinite(etaSec) ? fmtDuration(etaSec) : "estimating..."
        }
        
        setCircleProgress(wrapper, pct);
    }
    wrapper.remove()
    if(!uploadContainer.childElementCount > 0) uploadContainer.parentElement.classList.add("d-none")
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

async function moveFile(fileId, folderId, newFolderId){
    const response = await fetch(`/api/files/move?folderId=${encodeURIComponent(folderId)}&fileId=${encodeURIComponent(fileId)}&newFolderId=${encodeURIComponent(newFolderId)}`, {
        method: "PUT"
    });

    if (!response.ok) {
        throwError(await response.text())
    }

    throwSuccess(await response.text())
    return true
}

function openFileUploadMenu() {
    document.getElementById('hiddenFileInput').click();
}

document.getElementById('hiddenFileInput').addEventListener('change', async function () {
    if (this.files.length > 0) {
        for (const file of this.files) {
            await uploadFile(file, getParameter("jbd"), false);
            await reloadStorageLimit()
        }
        await refreshDirectoryDrive()
    }
});