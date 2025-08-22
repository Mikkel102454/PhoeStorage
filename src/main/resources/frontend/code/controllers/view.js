let viewContainerDrive

async function loadDirectoryDrive(path){
    if(!viewContainerDrive) {document.getElementById("viewContainerDrive")}

    setParameter("jbd", path)
    const { files, folders } = await browseDirectory(path)

    for(const key in folders){
        folders[key].load()
    }
    for(const key in files){
        files[key].load()
    }
}

async function refreshDirectoryDrive(){
    if(!viewContainerDrive) {document.getElementById("viewContainerDrive")}

    const { files, folders } = await browseDirectory(getParameter("jbd"))

    for(const key in folders){
        folders[key].load()
    }
    for(const key in files){
        files[key].load()
    }
}