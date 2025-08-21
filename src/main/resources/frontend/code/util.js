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
        closeAdminPasswordMenu()
        closeUserUpdateMenu()
    }
});

function formatSize(bytes) {
    if (typeof bytes === "bigint") {
        // Convert to Number for math display — will clamp large values
        if (bytes > BigInt(Number.MAX_SAFE_INTEGER)) {
            console.warn("formatSize: value too large for exact conversion, showing approximate value");
        }
        bytes = Number(bytes);
    }

    if (typeof bytes !== "number" || isNaN(bytes) || bytes < 0) {
        return "0 B";
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0;

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }

    const value = bytes % 1 === 0 ? bytes.toFixed(0) : bytes.toFixed(1);
    return `${value} ${units[i]}`;
}


function fileIcon(extension) {

    const units = [
        "<i class=\"fa-solid fa-file-word icon\" style=\"color: #4285f8;\"></i>",
        "<i class=\"fa-solid fa-file-excel icon\" style=\"color: #07a85f;\"></i>",
        "<i class=\"fa-solid fa-file-powerpoint icon\" style=\"color: #f06741;\"></i>",
        "<i class=\"fa-solid fa-file-image icon\" style=\"color: #269b7f;\"></i>",
        "<i class=\"fa-solid fa-file-music icon\" style=\"color: #e6a10c;\"></i>",
        "<i class=\"fa-solid fa-file-video icon\" style=\"color: #2e3eac;\"></i>",
        "<i class=\"fa-solid fa-file-zipper icon\" style=\"color: #ffc640;\"></i>",
        "<i class=\"fa-solid fa-file icon\" style=\"color: #a5a5a5;\"></i>",
    ];
    if(!extension){return units[7]}
    extension = extension.toLowerCase();
    return {
        "doc": units[0],
        "docx": units[0],
        "xls": units[1],
        "xlsx": units[1],
        "ppt": units[2],
        "pptx": units[2],
        "7z": units[6],
        "rar": units[6],
        "zip": units[6],
        "mov": units[5],
        "mp4": units[5],
        "mpg": units[5],
        "gif": units[3],
        "jpg": units[3],
        "png": units[3],
        "jpeg": units[3],
        "mp3": units[4],
        "ogg": units[4],
        "wav": units[4],
        "bmp": units[3],
        "dcm": units[3],
        "dds": units[3],
        "djvu": units[3],
        "heic": units[3],
        "psd": units[3],
        "tga": units[3],
        "tif": units[3],
        "aif": units[4],
        "flac": units[4],
        "m3u": units[4],
        "m4a": units[4],
        "mid": units[4],
        "3gp": units[4],
        "wma": units[5],
        "asf": units[5],
        "avi": units[5],
        "flv": units[5],
        "m4v": units[5],
        "srt": units[5],
        "swf": units[5],
        "ts": units[5],
        "vob": units[5],
        "wmv": units[5],
        "cbr": units[6],
        "deb": units[6],
        "gz": units[6],
        "pkg": units[6],
        "rpm": units[6],
        "tar.gz": units[6],
        "xapk": units[6],
        "zipx": units[6],
    }[extension] || units[7];
}

function formatDate(raw){
    const trimmed = raw.replace(/(\.\d{3})\d+/, '$1'); // Keep only milliseconds
    const date = new Date(trimmed);

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}