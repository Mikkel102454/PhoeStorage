let userDeleteModalTemplate = document.getElementById("userDeleteModal")
let currentUserDeleteModal

function openUserDeleteModal(user){
    if(!userDeleteModalTemplate){throwError("userDeleteModalTemplate was not set"); return}
    if(currentUserDeleteModal){throwError("userDeleteModal already open"); return}

    let clone = userDeleteModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "userDeleteModalOpen"

    clone.querySelector('[type="span.description"]').textContent = `Are you sure you want to delete "${user.username}".`

    clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
        closeUserDeleteModal()
        await deleteUser(user.uuid)
    })
    
    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closeUserDeleteModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closeUserDeleteModal()
    })

    getModalParent().appendChild(clone)
    currentUserDeleteModal = document.getElementById("userDeleteModalOpen")
}

function closeUserDeleteModal(){
    if(!currentUserDeleteModal) {console.log("userDeleteModal was not open"); return}
    currentUserDeleteModal.remove()
    currentUserDeleteModal = null
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUserDeleteModal();
});
