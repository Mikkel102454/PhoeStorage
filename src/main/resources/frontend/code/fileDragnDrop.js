async function initDragnDrop(dropZone){
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, e => e.preventDefault());
        dropZone.addEventListener(eventName, e => e.stopPropagation());
    });

    // Visual feedback (optional)
    dropZone.addEventListener("dragover", () => {

    });

    dropZone.addEventListener("dragleave", () => {

    });

    dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        const allFiles = Array.from(e.dataTransfer.files);

        if (allFiles.length === 0) return;

        const folderFiles = allFiles.filter(file => file.webkitRelativePath && file.webkitRelativePath.includes("/"));
        const singleFiles = allFiles.filter(file => !file.webkitRelativePath || !file.webkitRelativePath.includes("/"));

        // Upload individual files directly
        for (const file of singleFiles) {
            await uploadFile(file, getParameter("jbd"));
        }

        // Upload folders if any
        if (folderFiles.length > 0) {
            // uploaded folder
        }

        await loadDirectory(getParameter("jbd"));
    });
}
