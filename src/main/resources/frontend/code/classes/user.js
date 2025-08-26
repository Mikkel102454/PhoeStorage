let allLoadedUsers = []
let userTemp

class User{
    uuid //string
    username //string
    dataLimit //long
    dataUsed //long
    isAdmin //bool
    enabled // bool
    constructor(uuid, username, dataLimit, dataUsed, isAdmin, enabled) {
        this.uuid = uuid
        this.username = username
        this.dataLimit = dataLimit
        this.dataUsed = dataUsed
        this.isAdmin = isAdmin
        this.enabled = enabled
    }

    loadedElement

    async load(parent){
        if(!userTemp) {userTemp = document.getElementById("userRow")}
        if(!userTemp) {console.log("Error loading file. userTemp is null"); return}
        if(!parent) {console.log("Error loading file. parent is null"); return}

        const wrapper = document.createElement("div");

        let clone = userTemp.content.cloneNode(true)

        let name = clone.querySelector('[typeI="input.username"]')
        let limit = clone.querySelector('[typeI="input.dataLimit"]')
        let used = clone.querySelector('[type="span.dataUsed"]')

        let isAdmin = clone.querySelector('[typeI="checkbox.isAdmin"]')
        let isEnabled = clone.querySelector('[typeI="checkbox.isEnabled"]')

        name.value = this.username
        limit.value = formatSize(this.dataLimit)
        used.textContent = formatSize(this.dataUsed)

        isAdmin.checked = this.isAdmin
        isEnabled.checked = this.enabled

        clone.querySelector('[type="icon.update"]').addEventListener("click", async () => {
            openUserUpdateModal(this, name.value, limit.value, isAdmin.checked, isEnabled.checked)
        })

        clone.querySelector('[type="icon.logout"]').addEventListener("click", async () => {
            await forceLogout(this.uuid)
        })

        clone.querySelector('[type="icon.reset"]').addEventListener("click", async () => {
            openPasswordResetModal(this)
        })

        clone.querySelector('[type="icon.trash"]').addEventListener("click", async () => {
            openUserDeleteModal(this)
        })

        wrapper.appendChild(clone)
        parent.appendChild(wrapper)
        this.loadedElement = wrapper
        allLoadedUsers.push(this)
    }

    unload() {
        let parent = this.loadedElement.parentElement
        this.loadedElement.remove()
        if(!parent.childElementCount > 0) {parent.innerHTML = '<div class="d-flex h-15"><h3 class="m-a w-fit font-note">Nothing to show here</h3></div>'}
        const index = allLoadedUsers.indexOf(this);
        if (index !== -1) {
            allLoadedUsers.splice(index, 1);
        }
    }
}

async function unloadAllDownloads(){
    while (allLoadedUsers.length > 0) {
        await allLoadedUsers[0].unload();
    }
}