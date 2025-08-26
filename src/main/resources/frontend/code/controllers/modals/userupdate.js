let userUpdateModalTemplate = document.getElementById("userUpdateModal")
let userUpdateModalEntryTemplate = document.getElementById("userUpdateEntryModal")
let currentUserUpdateModal

function openUserUpdateModal(user, username, dataLimit, isAdmin, enabled){
    if(!userUpdateModalTemplate){throwError("userUpdateModalTemplate was not set"); return}
    if(currentUserUpdateModal){throwError("userUpdateModal already open"); return}

    let clone = userUpdateModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "userUpdateModalOpen"

    clone.querySelector('[type="span.description"]').textContent = `The following is what will be updated for "${user.username}".`

    let entryParent = clone.querySelector('[type="container.entry"]')

    console.log(user, username, dataLimit, isAdmin, enabled, formatSizeReverse(dataLimit).toString(), user.dataLimit.toString())

    let i = 0
    if(username !== user.username) {loadUserUpdateEntry(entryParent, "Username:", user.username, username); i++}
    if(formatSizeReverse(dataLimit).toString() !== user.dataLimit.toString()) {loadUserUpdateEntry(entryParent, "Data limit:", formatSize(user.dataLimit), dataLimit); i++}
    if(isAdmin !== user.isAdmin) {loadUserUpdateEntry(entryParent, "Is admin:", user.isAdmin, isAdmin); i++}
    if(enabled !== user.enabled) {loadUserUpdateEntry(entryParent, "Is enabled:", user.enabled, enabled); i++}

    if(i === 0){
        throwWarning("No user data changed")
        closeUserUpdateModal()
        return
    }

    clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
        closeUserUpdateModal()
        await updateUser(user.uuid, username, dataLimit, isAdmin, enabled)
        await getAllUsers()
    })
    
    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closeUserUpdateModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closeUserUpdateModal()
    })

    getModalParent().appendChild(clone)
    currentUserUpdateModal = document.getElementById("userUpdateModalOpen")
}

function closeUserUpdateModal(){
    if(!currentUserUpdateModal) {console.log("userUpdateModal was not open"); return}
    currentUserUpdateModal.remove()
    currentUserUpdateModal = null
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUserUpdateModal();
});

function loadUserUpdateEntry(parent, name, valueOld, valueNew){
    let clone = userUpdateModalEntryTemplate.content.cloneNode(true)
    clone.querySelector('[type="span.type"]').textContent = name
    clone.querySelector('[type="span.valueOld"]').textContent = valueOld
    clone.querySelector('[type="span.valueNew"]').textContent = valueNew
    parent.appendChild(clone)
}
