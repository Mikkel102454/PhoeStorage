let passwordResetModalTemplate = document.getElementById("passwordResetModal")
let currentPasswordResetModal

function openPasswordResetModal(user){
    if(!passwordResetModalTemplate){throwError("passwordResetModalTemplate was not set"); return}
    if(currentPasswordResetModal){throwError("passwordReserModal already open"); return}

    let clone = passwordResetModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "passwordResetModalOpen"

    let input = clone.querySelector('[typeI="input.password"]')
    clone.querySelector('[type="span.description"]').textContent = `Choose a new password for "${user.username}".`

    clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
        closePasswordResetModal()
        await adminResetPassword(user.uuid, input.value)
    })
    
    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closePasswordResetModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closePasswordResetModal()
    })

    getModalParent().appendChild(clone)
    currentPasswordResetModal = document.getElementById("passwordResetModalOpen")
}

function closePasswordResetModal(){
    if(!currentPasswordResetModal) {console.log("passwordReserModal was not open"); return}
    currentPasswordResetModal.remove()
    currentPasswordResetModal = null
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePasswordResetModal();
});
