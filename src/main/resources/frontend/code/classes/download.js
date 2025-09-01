let allLoadedDownloads = []
let downloadTemp

class Download{
    uuid //string
    name //string
    extension //string
    download //int
    maxDownload //int
    expire //string
    isFolder // bool
    size
    constructor(uuid, name, extension, download, maxDownload, expire, isFolder, size) {
        this.uuid = uuid
        this.name = name
        this.extension = extension
        this.download = download
        this.maxDownload = maxDownload
        this.expire = expire
        this.isFolder = isFolder
        this.size = size
    }

    loadedElement

    async load(parent){
        if(!downloadTemp) {downloadTemp = document.getElementById("downloadRow")}
        if(!downloadTemp) {console.log("Error loading file. downloadTemp is null"); return}
        if(!parent) {console.log("Error loading file. parent is null"); return}

        const wrapper = document.createElement("div");

        let clone = downloadTemp.content.cloneNode(true)
        if(this.isFolder){
            clone.querySelector('[type="span.name"]').textContent = this.name + ".zip"
        }else{
            clone.querySelector('[type="span.name"]').textContent = this.name
        }

        clone.querySelector('[type="span.downloads"]').textContent = this.download
        clone.querySelector('[type="span.limit"]').textContent = this.maxDownload === -1 ? "infinite" : this.maxDownload
        clone.querySelector('[type="span.expire"]').textContent = this.expire === "-1" ? "never" : this.expire

        clone.querySelector('[type="icon.link"]').addEventListener("click", async () => {
            await navigator.clipboard.writeText(window.location.protocol + "//" + window.location.host + "/download/" + this.uuid);
            throwInformation("Copied link to clipboard")
        })

        clone.querySelector('[type="icon.trash"]').addEventListener("click", async () => {
            await deleteDownload(this.uuid)
            this.unload()
        })

        wrapper.appendChild(clone)
        parent.appendChild(wrapper)
        this.loadedElement = wrapper
        allLoadedDownloads.push(this)
    }

    unload() {
        let parent = this.loadedElement.parentElement
        this.loadedElement.remove()
        if(!parent.childElementCount > 0) {parent.innerHTML = '<div class="d-flex h-15"><h3 class="m-a w-fit font-note">Nothing to show here</h3></div>'}
        const index = allLoadedDownloads.indexOf(this);
        if (index !== -1) {
            allLoadedDownloads.splice(index, 1);
        }
    }
}

async function unloadAllDownloads(){
    while (allLoadedDownloads.length > 0) {
        await allLoadedDownloads[0].unload();
    }
}