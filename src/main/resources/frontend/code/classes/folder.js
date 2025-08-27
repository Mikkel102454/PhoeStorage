let allLoadedFolders = []

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

    loadedElement

    async load(parent) {
        if (!fileTemp) {
            console.log("Error loading folder. fileTemp is null");
            return
        }
        if (!parent) {
            console.log("Error loading folder. parent is null");
            return
        }

        const wrapper = document.createElement("div");

        wrapper.setAttribute("isFolder", "1")
        wrapper.setAttribute("uuid", this.uuid)
        wrapper.setAttribute("folderId", this.folderId)
        wrapper.setAttribute("item", "")

        let clone = fileTemp.content.cloneNode(true)
        clone.querySelector('[type="span.name"]').innerHTML = "<i class='fa-solid fa-folder icon m-r-08' style = 'color: #FFD43B;'></i>" + this.name
        clone.querySelector('[type="span.username"]').textContent = await getUsernameFromUuid(this.owner)
        clone.querySelector('[type="span.date"]').innerHTML = "<i class='fa-regular fa-dash'></i>"
        clone.querySelector('[type="span.size"]').textContent = formatSize(this.size)

        clone.querySelector('[type="icon.share"]').addEventListener("click", async () => {
            openShareModal(this)
        })

        clone.querySelector('[type="icon.download"]').addEventListener("click", async () => {
            downloadZipFile(this.folderId, this.uuid)
        })

        clone.querySelector('[type="icon.rename"]').addEventListener("click", async () =>  {
            openRenameModal(this)
        })

        clone.querySelector('[type="icon.favorite"]').style.visibility = "hidden"

        clone.querySelector('[type="icon.delete"]').addEventListener("click", async () =>  {
            openTrashModal(this)
        })

        clone.firstElementChild.addEventListener("dblclick", async () =>  {
            await loadDirectoryDrive(this.uuid, this.name)
        })

        wrapper.addEventListener('mousedown', () => {
            this.drag = true
        });

        window.addEventListener('mouseup', async (e) => {
            if(!this.drag) return

            this.drag = false
            let element  = document.elementFromPoint(e.clientX, e.clientY).closest('[item]');
            if(!element) return;
            if(element.getAttribute("isFolder") === "0") return

            if(element.getAttribute("uuid") === this.folderId) return

            if(await this.move(element.getAttribute("uuid")) === false) return
            this.unload()
        });

        wrapper.appendChild(clone)
        parent.appendChild(wrapper)
        this.loadedElement = wrapper
        allLoadedFolders.push(this)
    }

    unload() {
        this.loadedElement.remove()
        const index = allLoadedFolders.indexOf(this);
        if (index !== -1) {
            allLoadedFolders.splice(index, 1);
        }
    }

    async share(maxDownloads){
        return await createDownloadLink(this.folderId, this.uuid, maxDownloads ? maxDownloads : -1, true)
    }

    async rename(newName){
        if(!await renameFolder(this.folderId, this.uuid, newName)) {return}
        this.name = newName
        this.loadedElement.querySelector('[type="span.name"]').innerHTML = "<i class='fa-solid fa-folder icon m-r-08' style = 'color: #FFD43B;'></i>" + this.name
        await renameFolder(this.folderId, this.uuid, newName)
    }

    async move(newFolderUuid){
        //create moveFolder function on frontend and backend
        return await moveFolder(this.uuid, this.folderId, newFolderUuid)
    }
}

async function unloadAllFolders(){
    while (allLoadedFolders.length > 0) {
        await allLoadedFolders[0].unload();
    }
}

function getFolder(uuid, folderId){
    for(let i = 0; i < allLoadedFolders.length; i++){
        if(allLoadedFolders[i].uuid === uuid && allLoadedFolders[i].folderId === folderId) return allLoadedFolders[i]
    }
}