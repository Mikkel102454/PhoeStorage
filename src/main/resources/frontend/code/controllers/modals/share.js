let shareModalTemplate = document.getElementById("shareModal")
let currentShareModal

function openShareModal(item){
    if(!shareModalTemplate){throwError("shareModalTemplate was not set"); return}
    if(currentShareModal){throwError("shareModal already open"); return}

    let clone = shareModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "shareModalOpen"

    let input = clone.querySelector('[typeI="input.limit"]')

    clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
        closeShareModal()
        openShareCopyModal(await item.share(input.value))
    })
    
    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closeShareModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closeShareModal()
    })

    getModalParent().appendChild(clone)
    currentShareModal = document.getElementById("shareModalOpen")
}

function closeShareModal(){
    if(!currentShareModal) {console.log("shareModal was not open"); return}
    currentShareModal.remove()
    currentShareModal = null
}



let shareCopyModalTemplate = document.getElementById("shareCopyModal")
let currentShareCopyModal

function openShareCopyModal(link){
    if(!shareCopyModalTemplate){throwError("shareCopyModalTemplate was not set"); return}
    if(currentShareCopyModal){throwError("shareCopyModal already open"); return}

    let clone = shareCopyModalTemplate.content.cloneNode(true)

    clone.firstElementChild.id = "shareCopyModalOpen"

    clone.querySelector('[type="span.link"]').innerText = window.location.host + "/download/" + link
    
    clone.querySelector('[type="button.confirm"]').addEventListener("click", async () => {
        await navigator.clipboard.writeText(window.location.protocol + "//" + window.location.host + "/download/" + link);
        throwInformation("Copied link to clipboard")
    })

    clone.querySelector('[type="button.cancel"]').addEventListener("click", async () => {
        closeShareCopyModal()
    })

    clone.querySelector('[type="modal.background"]').addEventListener("click", async () => {
        closeShareCopyModal()
    })

    getModalParent().appendChild(clone)
    currentShareCopyModal = document.getElementById("shareCopyModalOpen")
}

function closeShareCopyModal(){
    if(!currentShareCopyModal) {console.log("shareCopyModal was not open"); return}
    currentShareCopyModal.remove()
    currentShareCopyModal = null
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {closeShareCopyModal(); closeShareModal();}
});
