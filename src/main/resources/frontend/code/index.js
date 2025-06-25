let homePageTemplate
let drivePageTemplate
let starredPageTemplate
let mainElement

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
        loadHome()
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

async function loadStarredDirectory(temp){
    const files = await getStarredFiles()
    let fileParent = temp.querySelector(".file-content");
    fileParent.innerHTML = "";
    for(const key in files){
        await createFile(files[key], fileParent, false);
    }
}