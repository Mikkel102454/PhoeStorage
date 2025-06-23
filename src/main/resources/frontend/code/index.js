let homePageTemplate
let drivePageTemplate
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
            default:
                loadHome()
        }
    }else{
        loadHome()
    }

}

function loadHome(){
    setParameter("jbm", "home")
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
    setParameterIfNotExist("jbd", "/")
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
    mainElement.appendChild(temp);

    initDragnDrop(document.getElementById("drop-zone"))
}

async function loadDirectoryInit(temp){
    const params = new URLSearchParams(window.location.search);
    files = await browseDirectory(params.get('jbd'))
    let fileParent = temp.querySelector(".file-content");
    fileParent.innerHTML = "";
    for(const key in files){
        await createFile(files[key], fileParent);
    }
}

async function loadDirectory(path){
    if(!path){path = await browseDirectory(getParameter('jbd'))}
    const files = await browseDirectory(path)
    let fileParent = document.querySelector(".file-content");
    fileParent.innerHTML = "";
    for(const key in files){
        await createFile(files[key], fileParent);
    }
}