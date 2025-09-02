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
    drag

    async load(parent){
        if(!fileTemp) {console.log("Error loading file. fileTemp is null"); return}
        if(!parent) {console.log("Error loading file. parent is null"); return}

        const wrapper = document.createElement("div");
        wrapper.setAttribute("isFolder", "0")
        wrapper.setAttribute("uuid", this.uuid)
        wrapper.setAttribute("folderId", this.folderId)
        wrapper.setAttribute("item", "")

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

        let currentHover = null;
        let dragTimer = null;

        wrapper.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            dragTimer = setTimeout(() => {
                this.drag = true;

                const wrapper2 = document.createElement("div");
                const clone2 = itemDrag.content.cloneNode(true);
                clone2.querySelector('[type="span.name"]').innerHTML =
                    fileIcon(this.extension) + this.name;

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
            // cleanup highlight
            let completed
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

    async move(newFolderUuid){
        return moveFile(this.uuid, this.folderId, newFolderUuid);
    }
}

async function unloadAllFiles(){
    while (allLoadedFiles.length > 0) {
        await allLoadedFiles[0].unload();
    }
}