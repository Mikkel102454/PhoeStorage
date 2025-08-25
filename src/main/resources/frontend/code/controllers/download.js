function downloadFile(link) {
    fetch(`/api/public/download/file?downloadId=${encodeURIComponent(link)}`, {
        method: "GET"
    })
        .then(async response => {
            if (!response.ok){
                throwWarning(await response.text())
                return
            };

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


async function downloadInit(){
    let link = window.location.pathname.split('/').pop()

    const response = await fetch(`/api/public/download/info?downloadId=${encodeURIComponent(link)}`, {
        method: "GET"
    });

    if (!response.ok) {
        return
    }
    const result = await response.json();

    let download = new Download(
        result.ownerUuid,
        result.fileName,
        result.fileExtension,
        result.dateExpire,
        result.isFolder,
        result.size
    );

    //set data
    document.querySelector('[type="span.name"]').textContent = download.fileName
    document.querySelector('[type="span.size"]').textContent = formatSize(download.size)
    document.querySelector('[type="span.extension"]').textContent = download.fileExtension
    document.querySelector('[type="span.expire"]').textContent = download.dateExpire === "-1" ? "Never" : formatDate(download.dateExpire)

    document.querySelector('[type="span.icon"]').innerHTML = fileIcon(download.fileExtension)
    document.querySelector('[type="span.icon"]').firstElementChild.classList.remove("m-r-08")
    document.querySelector('[type="span.icon"]').firstElementChild.classList.add("m-a")

    document.querySelector('[type="button.confirm"]').addEventListener("click", async function (){
        if(download.isFolder){
            await downloadZipFile(link)
        }else{
            await downloadFile(link)
        }
    })
    document.querySelector('[type="button.copy"]').addEventListener("click", async function (){
        await navigator.clipboard.writeText(window.location.href);
    })
}

document.addEventListener("DOMContentLoaded", async () => {
    await downloadInit()
});