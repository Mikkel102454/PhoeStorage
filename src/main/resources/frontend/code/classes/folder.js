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
    dragElement

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

        let currentHover = null;
        let dragTimer = null;

        wrapper.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            dragTimer = setTimeout(() => {
                this.drag = true;

                const wrapper2 = document.createElement("div");
                const clone2 = itemDrag.content.cloneNode(true);
                clone2.querySelector('[type="span.name"]').innerHTML =
                    "<i class='fa-solid fa-folder icon m-r-08' style = 'color: #FFD43B;'></i>" + this.name;

                wrapper2.appendChild(clone2);
                // make it behave like a drag ghost
                Object.assign(wrapper2.style, {
                    position: 'fixed',
                    left: e.clientX + 'px',
                    top: e.clientY + 'px',
                    pointerEvents: 'none',
                    opacity: '0.9',
                    zIndex: '9999',
                });

                this.loadedElement.style.opacity = "0.6"

                document.body.appendChild(wrapper2);
                this.dragElement = wrapper2;
            }, 500);
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.drag || !this.dragElement) return;

            // follow cursor
            this.dragElement.style.left = e.clientX + 'px';
            this.dragElement.style.top  = e.clientY + 'px';

            // detect item under cursor
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const target = el && el.closest('[item]');

            // clear old highlight
            if (currentHover && currentHover !== target) {
                currentHover.style.backgroundColor = '';
                currentHover = null;
            }

            if (!target) return;

            // skip non-folders
            if (target.getAttribute('isFolder') === '0') return;

            // apply highlight (no semicolon inside value)
            target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            currentHover = target;
        });

        window.addEventListener('mouseup', async (e) => {
            if (e.button !== 0) return;
            if (dragTimer) { clearTimeout(dragTimer); dragTimer = null; }

            if (!this.drag) return;
            this.drag = false;

            // cleanup ghost
            if (this.dragElement) {
                this.dragElement.remove();
                this.dragElement = null;
            }
            this.loadedElement.style.opacity = "1"

            let completed
            // cleanup highlight
            if (currentHover) {
                completed = await this.move(currentHover.getAttribute("uuid"))

                if(completed) {
                    let sizeSpan = currentHover.querySelector('[type="span.size"]')
                    if (sizeSpan) {
                        sizeSpan.innerText = formatSize(BigInt(formatSizeReverse(sizeSpan.innerText)) + BigInt(this.size))
                    }
                }

                currentHover.style.backgroundColor = '';
                currentHover = null;
            }


            if (!completed) return
            this.unload()
        });

        wrapper.addEventListener('mouseleave', () => {
            // not strictly needed if we have window listeners, but harmless
            if (!this.drag) { this.drag = false; if (dragTimer) { clearTimeout(dragTimer); dragTimer = null; } }
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
        if(!newName.length > 0){ throwWarning("Folder name must be 1 or more characters"); return}
        if(newName === this.name) return
        if(!await renameFolder(this.folderId, this.uuid, newName)) {return}
        this.name = newName
        this.loadedElement.querySelector('[type="span.name"]').innerHTML = "<i class='fa-solid fa-folder icon m-r-08' style = 'color: #FFD43B;'></i>" + this.name
    }

    async move(newFolderUuid){
        return moveFolder(this.uuid, this.folderId, newFolderUuid)
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