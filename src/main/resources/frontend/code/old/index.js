let homePageTemplate
let drivePageTemplate
let starredPageTemplate
let mainElement
let storageLimitText
let storageLimitFill

onload = function(){
    const params = new URLSearchParams(window.location.search);
    if(params.has('jbm')){
        switch (params.get('jbm')){
            case 'home':
                loadHome();
                break
            case 'drive':
                loadDrive()
                break
            case 'starred':
                loadStarred()
                break
            default:
                loadHome()
        }
    }else{
        loadDrive()
    }

}

function loadHome(){
    setParameter("jbm", "home");
    deleteParameter("jbd");
    if(!homePageTemplate){
        homePageTemplate = document.getElementById("home-section-temp");
    }
    if(!mainElement){
        mainElement = document.getElementById("main");
    }
    let temp = homePageTemplate.content.cloneNode(true);
    mainElement.innerHTML = "";
    mainElement.appendChild(temp);
    reloadStorageLimit()
}

async function loadDrive(){
    setParameter("jbm", "drive")
    setParameterIfNotExist("jbd", await getMyUuid())
    if(!drivePageTemplate){
        drivePageTemplate = document.getElementById("drive-file-temp");
    }
    if(!mainElement){
        mainElement = document.getElementById("main");
    }
    let temp = drivePageTemplate.content.cloneNode(true);
    //await loadDirectoryInit(temp, "/")
    mainElement.innerHTML = "";


    await loadDirectoryInit(temp)
    await mainElement.appendChild(temp);

    const folders = await getFolderLocation(getParameter("jbd"))
    for (let i = 1; i < folders.length; i++){
        addPathView(folders[i].name, folders[i].uuid)
    }

    loadContextMenu(document.getElementById("drop-zone"),  document.getElementById('context-menu-drive'))
    await initDragnDrop(document.getElementById("drop-zone"))
}

async function loadDirectoryInit(temp){
    const params = new URLSearchParams(window.location.search);
    const { files, folders } = await browseDirectory(params.get('jbd'))
    let fileParent = temp.querySelector(".file-content");
    fileParent.innerHTML = "";
    for(const key in folders){
        await createFile(folders[key], fileParent, true);
    }
    for(const key in files){
        await createFile(files[key], fileParent, false);
    }
    await reloadStorageLimit()
}

async function loadDirectory(path){
    if(!path){path = await browseDirectory(getParameter('jbd'))}
    const { files, folders } = await browseDirectory(path)
    let fileParent = document.querySelector(".file-content");
    fileParent.innerHTML = "";
    for(const key in folders){
        await createFile(folders[key], fileParent, true);
    }
    for(const key in files){
        await createFile(files[key], fileParent, false);
    }
    await reloadStorageLimit()
}


async function createFolder(name){
    await uploadFolder(getParameter('jbd'), name)
    toggleFolderCreationMenu()
    await loadDirectory(getParameter('jbd'))
}



// Starred

async function loadStarred(){
    setParameter("jbm", "starred")
    if(!starredPageTemplate){
        starredPageTemplate = document.getElementById("starred-file-temp");
    }
    if(!mainElement){
        mainElement = document.getElementById("main");
    }
    let temp = starredPageTemplate.content.cloneNode(true);

    mainElement.innerHTML = "";


    await loadStarredDirectory(temp)
    await mainElement.appendChild(temp);
}

async function loadStarredDirectory(temp) {
    const files = await getStarredFiles()
    let fileParent = temp.querySelector(".file-content");
    fileParent.innerHTML = "";
    for (const key in files) {
        await createFile(files[key], fileParent, false);
    }
    await reloadStorageLimit()
}

async function reloadStorageLimit(){
    const response = await fetch(`/api/users/space`, {
        method: "GET"
    });

    if (!response.ok) {
        throwError("Failed to get user storage limit" + await response.text())
        return null;
    }

    let limit = (await response.text()).split("-");
    let storageUsed = BigInt(limit[0])
    let storageLimit = BigInt(limit[1])

    if(!storageLimitText)  storageLimitText  = document.getElementById("storageLimitText");
    if(!storageLimitFill)  storageLimitFill  = document.getElementById("storageLimitFill");

    // % used (two decimals), clamped to [0,100]
    const pct = (storageLimit > 0n)
        ? Number(storageUsed * 10000n / storageLimit) / 100
        : 0;
    const pctClamped = Math.max(0, Math.min(100, pct));

    // text
    storageLimitText.textContent =
        `${formatSize(storageUsed)} of ${formatSize(storageLimit)} used`;

    // width
    storageLimitFill.style.width = `${pctClamped}%`;

    // 3-stage color: <60% green, 60–90% amber, >=90% red
    storageLimitFill.classList.remove("ok","warn","danger");
    if (pctClamped < 60) {
        storageLimitFill.classList.add("ok");
    } else if (pctClamped < 90) {
        storageLimitFill.classList.add("warn");
    } else {
        storageLimitFill.classList.add("danger");
    }
}