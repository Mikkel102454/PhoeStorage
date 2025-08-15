let myUuid;

async function getMyUuid() {
    if(!myUuid){myUuid = await requestMyUuid();}
    return myUuid;
}

async function requestMyUuid() {
    const response = await fetch(`/api/users/whoami`);
    if (!response.ok) {
        alert("Failed to find your uuid.");
        return;
    }
    return await response.text();
}

async function getUsernameFromUuid(uuid) {
    const response = await fetch(`/api/users/whois?uuid=${uuid}`);
    if (!response.ok) {
        alert("Failed to find user's username.");
        return;
    }
    return await response.text();
}

async function isMe(uuid) {
    return uuid === myUuid;
}


function deleteParameter(parameter){
    const url = new URL(window.location.href);
    url.searchParams.delete(parameter);
    history.replaceState(null, '', url.toString());
}

function setParameter(parameter, value){
    const url = new URL(window.location.href);
    url.searchParams.set(parameter, value);
    history.replaceState(null, '', url.toString());
}
function setParameterIfNotExist(parameter, value){
    const params = new URLSearchParams(window.location.search);
    const url = new URL(window.location.href);
    if(!params.has(parameter)){
        url.searchParams.set(parameter, value);
        history.replaceState(null, '', url.toString());
    }
}
function addParameter(parameter, value){
    const params = new URLSearchParams(window.location.search);
    const url = new URL(window.location.href);
    url.searchParams.set(parameter, params.get(parameter) + value);
    history.replaceState(null, '', url.toString());
}
function getParameter(parameter){
    const params = new URLSearchParams(window.location.search);
    return decodeURIComponent(params.get(parameter))
}



function loadContextMenu(element, contextMenu, postop, posleft) {
    let isFadingOut = false;

    element.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        const newTop = postop || `${e.clientY}px`;
        const newLeft = posleft || `${e.clientX}px`;

        if (contextMenu.classList.contains("visible")) {
            // If already visible, fade it out first
            isFadingOut = true;
            contextMenu.classList.remove("visible");

            // Wait for fade-out to finish
            contextMenu.addEventListener("transitionend", function handler(event) {
                if (event.propertyName === "opacity" && isFadingOut) {
                    contextMenu.removeEventListener("transitionend", handler);
                    isFadingOut = false;

                    // Move to new position
                    contextMenu.style.top = newTop;
                    contextMenu.style.left = newLeft;

                    // Now fade it back in
                    requestAnimationFrame(() => {
                        contextMenu.classList.add("visible");
                    });
                }
            });
        } else {
            // If not visible, just show it at position
            contextMenu.style.top = newTop;
            contextMenu.style.left = newLeft;
            contextMenu.classList.add("visible");
        }
    });

    window.addEventListener("click", () => {
        disableContextMenu(contextMenu);
    });
    window.addEventListener("contextmenu", (e) => {
        if (!element.contains(e.target)) {
            disableContextMenu(contextMenu);
        }
    });

}

function disableContextMenu(element){
    element.classList.remove("visible");
}


function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function copyToClipboard(input) {
  navigator.clipboard.writeText(input);

  throwInformation("Copied to clipboard");
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeDeleteModal()
        closeShareMenu()
        closeRenameMenu()
    }
});