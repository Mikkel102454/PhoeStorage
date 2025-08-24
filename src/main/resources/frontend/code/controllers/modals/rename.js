let renameModalTemplate = document.getElementById("renameModal")
let currentRenameModal

function openRenameModal(item){
    if(!renameModalTemplate){throwError("renameModalTemplate was not set"); return}
    if(currentRenameModal){throwError("renameModal already open"); return}

    let clone = renameModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "renameModalOpen"

    let input = clone.querySelector('[typeI="input.name"]')
    input.value = item.name

    clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
        closeRenameModal()
        await item.rename(input.value)
    })
    
    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closeRenameModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closeRenameModal()
    })

    getModalParent().appendChild(clone)
    currentRenameModal = document.getElementById("renameModalOpen")
}

function closeRenameModal(){
    if(!currentRenameModal) {console.log("renameModal was not open"); return}
    currentRenameModal.remove()
    currentRenameModal = null
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeRenameModal();
});
