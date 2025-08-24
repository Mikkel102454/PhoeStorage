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
            throwError(error);
            return null
        });
}