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
        const files = e.dataTransfer.files;

        if (files.length > 0) {
            for (const file of files) {
                await uploadFile(file, getParameter("jbd"));
            }
            await loadDirectory(getParameter("jbd"))
        }
    });
}
