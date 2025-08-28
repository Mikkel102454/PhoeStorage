let forcePasswordResetModalTemplate = document.getElementById("forcePasswordResetModal")
let currentForcePasswordResetModal

function openForcePasswordResetModal(user){
    if(!forcePasswordResetModalTemplate){throwError("forcePasswordResetModalTemplate was not set"); return}
    if(currentForcePasswordResetModal){throwError("forcePasswordResetModal already open"); return}

    let clone = forcePasswordResetModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "forcePasswordResetModalOpen"

    let password = clone.querySelector('[typeI="input.password"]')
    let passwordConfirm = clone.querySelector('[typeI="input.passwordConfirm"]')

    clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
        if(await forceChangePassword(password.value, passwordConfirm.value)) {closeForcePasswordResetModal(); return}

        password.classList.add("error")
        password.classList.add("errorBorder")
    })

    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closeForcePasswordResetModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closeForcePasswordResetModal()
    })

    getModalParent().appendChild(clone)
    currentForcePasswordResetModal = document.getElementById("forcePasswordResetModalOpen")
}

function closeForcePasswordResetModal(){
    if(!currentForcePasswordResetModal) {console.log("forcePasswordResetModal was not open"); return}
    currentForcePasswordResetModal.remove()
    currentForcePasswordResetModal = null
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeForcePasswordResetModal();
});