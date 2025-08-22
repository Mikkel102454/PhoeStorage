let fileTemp

class File{
    uuid // string
    owner // string
    name // string
    extension // string
    folderId // string
    created // string
    modified // string
    accessed // string
    size // long
    starred // boolean
    constructor(uuid, owner, name, extension, folderId, created, modified, accessed, size, starred){
        this.uuid = uuid;
        this.owner = owner;
        this.name = name;
        this.extension = extension;
        this.folderId = folderId;
        this.created = created;
        this.modified = modified;
        this.accessed = accessed;
        this.size = size;
        this.starred = starred;
    }

    loadedElement

    load(parent){
        if(!fileTemp) {console.log("Error loading file. fileTemp is null"); return}
        this.loadedElement = fileTemp.content.cloneNode(true)
        this.loadedElement.querySelector('[type="span.name"]').innerHTML = fileIcon(this.extension) + fileIconthis.name
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
    }

    unload(){
        this.loadedElement.remove()
    }
}
