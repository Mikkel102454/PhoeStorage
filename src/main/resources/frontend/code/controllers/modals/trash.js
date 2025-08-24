let trashModalTemplate = document.getElementById("trashModal")
let currentTrashModal

function openTrashModal(item){
    if(!trashModalTemplate){throwError("trashModalTemplate was not set"); return}
    if(currentTrashModal){throwError("trashModal already open"); return}

    let clone = trashModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "trashModalOpen"

    clone.querySelector('[type="span.name"]').textContent = item.name
    clone.querySelector('[type="span.size"]').textContent = formatSize(item.size)
    if(item instanceof File){
        clone.querySelector('[type="span.date"]').textContent = item.modified ? formatDate(item.modified) : formatDate(item.created)
        clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
            closeTrashModal()
            await deleteFile(item.folderId, item.uuid, true)
            await reloadStorageLimit()
            item.unload()
        })
    }else{
        clone.querySelector('[type="span.date"]').innerHTML = "<i class='fa-regular fa-dash'></i>"
        clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
            closeTrashModal()
            await deleteFolder(item.folderId, item.uuid, true)
            await reloadStorageLimit()
            item.unload()
        })
    }
    
    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closeTrashModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closeTrashModal()
    })

    getModalParent().appendChild(clone)
    currentTrashModal = document.getElementById("trashModalOpen")
}

function closeTrashModal(){
    if(!currentTrashModal) {console.log("trashModal was not open"); return}
    currentTrashModal.remove()
    currentTrashModal = null
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTrashModal();
});
