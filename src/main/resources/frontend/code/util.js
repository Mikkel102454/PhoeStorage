let homePageTemplate
let drivePageTemplate
let mainElement

function loadHome(){
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
    if(!drivePageTemplate){
        drivePageTemplate = document.getElementById("drive-file-temp");
    }
    if(!mainElement){
        mainElement = document.getElementById("main");
    }
    let temp = drivePageTemplate.content.cloneNode(true);

    temp = await loadDirectory(temp, "/")
    mainElement.innerHTML = "";
    mainElement.appendChild(temp);
}

async function loadDirectory(temp, path){
    files = await browseDirectory(path)
    let fileParent = temp.querySelector(".file-content");
    fileParent.innerHTML = "";
    let temp_
    for(const key in files){
        temp_ = createFile(files[key], temp)
    }
    return temp_
}