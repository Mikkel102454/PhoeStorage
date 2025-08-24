let allLoadedFiles = []

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

    async load(parent){
        if(!fileTemp) {console.log("Error loading file. fileTemp is null"); return}
        if(!parent) {console.log("Error loading file. parent is null"); return}

        const wrapper = document.createElement("div");

        let clone = fileTemp.content.cloneNode(true)
        clone.querySelector('[type="span.name"]').innerHTML = fileIcon(this.extension) + this.name
        clone.querySelector('[type="span.username"]').textContent = await getUsernameFromUuid(this.owner)
        clone.querySelector('[type="span.date"]').textContent = this.modified ? formatDate(this.modified) : formatDate(this.created)
        clone.querySelector('[type="span.size"]').textContent = formatSize(this.size)
        clone.querySelector('[type="icon.favorite"]').classList.toggle("fa-solid", this.starred);

        clone.querySelector('[type="icon.share"]').addEventListener("click", async () => {
            openShareModal(this)
        })

        clone.querySelector('[type="icon.download"]').addEventListener("click", async () => {
            downloadFile(this.folderId, this.uuid)
        })

        clone.querySelector('[type="icon.rename"]').addEventListener("click", async () => {
            openRenameModal(this)
        })

        clone.querySelector('[type="icon.favorite"]').addEventListener("click", async () => {
            await this.star()
        }) 

        clone.querySelector('[type="icon.delete"]').addEventListener("click", async () => {
            openTrashModal(this)
        })

        wrapper.appendChild(clone)
        parent.appendChild(wrapper)
        this.loadedElement = wrapper
        allLoadedFiles.push(this)
    }

    unload(){
        this.loadedElement.remove()
        const index = allLoadedFiles.indexOf(this);
        if (index !== -1) {
            allLoadedFiles.splice(index, 1);
        }
    }

    async star(){
        await setStarredFile(this.folderId, this.uuid, !this.starred)
        this.starred = !this.starred
        this.loadedElement.querySelector('[type="icon.favorite"]').classList.toggle("fa-solid", this.starred);
    }

    async rename(newName){
        if(!await renameFile(this.folderId, this.uuid, newName)) {return}
        this.name = newName.toString()
        const i = this.name.lastIndexOf('.');
        this.extension = i >= 0 && i < this.name.length - 1 ? this.name.slice(i + 1) : "";

        this.loadedElement.querySelector('[type="span.name"]').innerHTML = fileIcon(this.extension) + this.name
    }

    async share(maxDownloads){
        return await createDownloadLink(this.folderId, this.uuid, maxDownloads ? maxDownloads : -1, false)
    }
}

async function unloadAllFiles(){
    while (allLoadedFiles.length > 0) {
        await allLoadedFiles[0].unload();
    }
}