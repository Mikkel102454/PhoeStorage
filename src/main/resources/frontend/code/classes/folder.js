class Folder{
    uuid // string
    owner // string
    name // string
    folderId // string
    size // long
    constructor(uuid, owner, name, folderId, size){
        this.uuid = uuid;
        this.owner = owner;
        this.name = name;
        this.folderId = folderId;
        this.size = size;
    }
    load(parent){
        if(!fileTemp) {console.log("Error loading file. fileTemp is null"); return}
        this.loadedElement = fileTemp.content.cloneNode(true)
        this.loadedElement.querySelector('[type="span.name"]').innerHTML = "<i class='fa-solid fa-folder icon' style = 'color: #FFD43B;'></i>" + this.name
        this.loadedElement.querySelector('[type="span.username"]').textContent = whois(owner)
        this.loadedElement.querySelector('[type="span.date"]').textContent =  this.modified ? formatDate(file.modified) : formatDate(file.created)
        this.loadedElement.querySelector('[type="span.size"]').textContent = formatSize(this.size)

        this.loadedElement.querySelector('[type="icon.share"]').addEventListener("click", async function (){
            
        }) //TODO

        this.loadedElement.querySelector('[type="icon.download"]').addEventListener("click", async function (){
            downloadFile(this.folderId, this.uuid)
        })

        this.loadedElement.querySelector('[type="icon.rename"]').addEventListener("click", async function (){
           
        }) //TODO

        this.loadedElement.querySelector('[type="icon.favorite"]').addEventListener("click", async function (){
            
        }) //TODO

        this.loadedElement.querySelector('[type="icon.delete"]').addEventListener("click", async function (){
           
        }) //TODO

        this.loadedElement.addEventListener("click", async function (){
           browseDirectory(this.folderId)
        }) //TODO

        parent.appendChild(this.loadedElement)
        allLoadedFiles.append(this)
    }

    unload(){
        this.loadedElement.remove()
        allLoadedFiles.remove(this)
    }
}

let allLoadedFiles = []