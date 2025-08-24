let viewContainerDrive
let pathContainerDrive
let fileTemp = document.getElementById("file-view")
let pathTemp = document.getElementById("path-view")

async function resetDirectoryDrive(){
    await setParameter("jbd", await getMyUuid());
    pathContainerDrive.innerHTML = ""
    await refreshDirectoryDrive()
}

async function loadDirectoryDrive(path, name){
    if(!viewContainerDrive) {viewContainerDrive = document.getElementById("viewContainerDrive")}
    if(!pathContainerDrive) {pathContainerDrive = document.getElementById("pathContainerDrive")}

    setParameter("jbd", path)
    const { files, folders } = await browseDirectory(path)

    await unloadAllFiles()
    await unloadAllFolders()

    if(name){
        // User walked into folder so add folder path view
        initPathView(path, name, pathContainerDrive)
    }


    for(const key in folders){
        await folders[key].load(viewContainerDrive)
    }
    for(const key in files){
        await files[key].load(viewContainerDrive)
    }
}

async function refreshDirectoryDrive(){
    if(!viewContainerDrive) {viewContainerDrive = document.getElementById("viewContainerDrive")}
    if(!pathContainerDrive) {pathContainerDrive = document.getElementById("pathContainerDrive")}

    const { files, folders } = await browseDirectory(getParameter("jbd"))

    await unloadAllFiles()
    await unloadAllFolders()

    pathContainerDrive.innerHTML = ""

    const folderChain = await getFolderLocation(getParameter("jbd"))

    for (let i = 1; i < folderChain.length; i++){
        initPathView(folderChain[i].uuid ,folderChain[i].name, pathContainerDrive)
    }


    for(const key in folders){
        await folders[key].load(viewContainerDrive)
    }
    for(const key in files){
        await files[key].load(viewContainerDrive)
    }
}

function initPathView(uuid, name, parent){
    let clone = pathTemp.content.cloneNode(true)
    clone.querySelector('[type="span.name"]').innerText = name
    clone.querySelector('[type="span.name"]').addEventListener("click", async function (){
        await loadDirectoryDrive(uuid, null)

        let node = this.parentElement.nextElementSibling;
        while (node) {
            const next = this.parentElement.nextElementSibling;
            node.remove();
            node = next;
        }
    })
    parent.appendChild(clone)
}


let viewContainerStarred

async function refreshDirectoryStarred(){
    if(!viewContainerStarred) {viewContainerStarred = document.getElementById("viewContainerStarred")}

    const files = await getStarredFiles()

    await unloadAllFiles()
    await unloadAllFolders()

    for(const key in files){
        await files[key].load(viewContainerStarred)
    }
}

async function search(query, searchBar, starred){
    if(query === ""){
        if(starred) {await refreshDirectoryStarred(); return}
        await refreshDirectoryDrive(); return
    }
    let result = await searchFiles(query)

    await unloadAllFiles()
    await unloadAllFolders()

    for(const file of result){
        if(starred){
            if(file.starred){file.load(viewContainerStarred)}
        }else{
            file.load(viewContainerDrive)
        }
    }
}




document.addEventListener("DOMContentLoaded", async () => {
    await setParameterIfNotExist("jbd", await getMyUuid());
    await refreshDirectoryDrive();
});