async function uploadFile(file, path) {
    const chunkSize = 10 * 1024 * 1024; // 10 MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const filename = file.name;

    if (!file || file.size === 0) {
        alert("Invalid file selected or file is empty.");
        return;
    }
    console.log(chunkSize + " : " + totalChunks + " : " + filename + " : " + file.size)
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        console.log("upload chunk")
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkIndex", chunkIndex);
        formData.append("totalChunks", totalChunks);
        formData.append("filename", filename);
        formData.append("filepath", path);

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


async function browseDirectory(path) {
    const response = await fetch(`/api/files/browse?path=${encodeURIComponent(path)}`, {
        method: "GET"
    });

    if (!response.ok) {
        alert("Failed to browse directory.");
        return;
    }

    const result = await response.json();
    const files = [];
    for (const key in result) {
        files.push(new File(
            result[key].uuid,
            result[key].owner,
            result[key].name,
            result[key].extension,
            result[key].path,
            result[key].fullPath,
            result[key].created,
            result[key].modified,
            result[key].accessed,
            result[key].size,
            result[key].isFolder
        ));
    }

    return files;
}

function downloadFile(path) {
    fetch(`/api/files/download?path=${encodeURIComponent(path)}`, {
        method: "GET",

    })
        .then(response => {
            if (!response.ok) throw new Error("Download failed");

            return response.blob();
        })
        .then(blob => {
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = path.split("/").pop();
            link.click();
        })
        .catch(err => alert("Error downloading file: " + err));
}

async function deleteFile(path) {

    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(path)}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("Failed to delete file.");
        return;
    }
}