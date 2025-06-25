let warningTemplate;
let errorTemplate;
let infoTemplate;
let successTemplate;

let alertBox

function spawnAlert(templateId, msg, timeout) {
    if (!alertBox) {
        alertBox = document.getElementById("alertBox");
    }

    if (!window[templateId]) {
        window[templateId] = document.getElementById(templateId);
    }

    const template = window[templateId];
    const fragment = template.content.cloneNode(true);
    const wrapper = document.createElement("div");
    wrapper.appendChild(fragment);
    const alertElement = wrapper.firstElementChild;

    alertElement.querySelector(".alert-msg").textContent = msg;

    // Manual close with fade-out
    alertElement.querySelector('.close-btn').addEventListener('click', () => {
        alertElement.classList.remove('fade-in');
        alertElement.classList.add('fade-out');
        setTimeout(() => alertElement.remove(), 400); // Match transition time
    });

    // Append and trigger fade-in
    alertBox.appendChild(alertElement);
    requestAnimationFrame(() => {
        alertElement.classList.add('fade-in');
    });

    // Auto close with fade-out after 5s
    setTimeout(() => {
        alertElement.classList.remove('fade-in');
        alertElement.classList.add('fade-out');
        setTimeout(() => alertElement.remove(), 400);
    }, timeout * 1000);
}

// Specific alert types
function throwWarning(msg) {
    console.warn(msg)
    spawnAlert("alertWarningTemp", msg, 6);
}
function throwError(msg) {
    console.error(msg)
    spawnAlert("alertErrorTemp", msg, 8);
}
function throwInformation(msg) {
    console.info(msg)
    spawnAlert("alertInfoTemp", msg, 5);
}
function throwSuccess(msg) {
    console.log(msg)
    spawnAlert("alertSuccessTemp", msg, 4);
}
