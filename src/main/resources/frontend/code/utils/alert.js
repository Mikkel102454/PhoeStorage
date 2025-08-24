let alertBox;

const TEMPLATES = {
    warning: `<div class="alert warning">
      <span class="icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
      <div class="text"><span>Warning!</span><span class="alert-msg">Some example warning message text here</span></div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>`,

    error: `<div class="alert error">
      <span class="icon"><i class="fa-solid fa-circle-xmark"></i></span>
      <div class="text"><span>Error!</span><span class="alert-msg">Some example error message text here</span></div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>`,

    info: `<div class="alert info">
      <span class="icon"><i class="fa-solid fa-circle-info"></i></span>
      <div class="text"><span>Information</span><span class="alert-msg">Some example message text here</span></div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>`,

    success: `<div class="alert success">
      <span class="icon"><i class="fa-solid fa-circle-check"></i></span>
      <div class="text"><span>Success</span><span class="alert-msg">Your action was successful</span></div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>`
};

function ensureAlertBox() {
    if (!alertBox) {
        alertBox = document.getElementById("alertBox");
        if (!alertBox) {
            alertBox = document.createElement("div");
            alertBox.id = "alertBox";
            document.body.appendChild(alertBox);
        }
    }
}

function spawnAlert(type, msg, timeoutSeconds = 6) {
    ensureAlertBox();

    const template = TEMPLATES[type];
    if (!template) {
        console.error("Unknown alert type:", type);
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template;
    const alertElement = wrapper.firstElementChild;
    if (!alertElement) {
        console.error("Template produced no element");
        return;
    }

    const msgNode = alertElement.querySelector(".alert-msg");
    if (msgNode) msgNode.textContent = msg;

    const close = () => {
        alertElement.classList.remove("fade-in");
        alertElement.classList.add("fade-out");
        setTimeout(() => alertElement.remove(), 400);
    };

    const btn = alertElement.querySelector(".close-btn");
    if (btn) btn.addEventListener("click", close);

    alertBox.appendChild(alertElement);
    requestAnimationFrame(() => alertElement.classList.add("fade-in"));

    if (timeoutSeconds > 0) {
        setTimeout(close, timeoutSeconds * 1000);
    }
}

// Convenience wrappers
function throwWarning(msg)    { console.warn(msg);  spawnAlert("warning", msg, 6); }
function throwError(msg)      { console.error(msg); spawnAlert("error",   msg, 8); }
function throwInformation(msg){ console.info(msg);  spawnAlert("info",    msg, 5); }
function throwSuccess(msg)    { console.log(msg);   spawnAlert("success", msg, 4); }

// If you still want an init, keep it minimal:
function init(){ ensureAlertBox(); }
init();
