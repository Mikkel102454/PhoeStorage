let warningTemplate;
let errorTemplate;
let infoTemplate;
let successTemplate;

let alertBox

function init(){
    alertBox = document.createElement("div")
    alertBox.id = "alertBox"

    warningTemplate = `<div class="alert warning"><span class="icon"><i class="fa-solid fa-triangle-exclamation"></i></span><div class="text"><span>Warning!</span><span class="alert-msg">Some example warning message text here</span></div><button class="close-btn">&times;</button></div>`
    errorTemplate = `<div class="alert error"><span class="icon"><i class="fa-solid fa-circle-xmark"></i></span><div class="text"><span>Error!</span><span class="alert-msg">Some example error message text here</span></div><button class="close-btn">&times;</button></div>`
    infoTemplate = `<div class="alert info"><span class="icon"><i class="fa-solid fa-circle-info"></i></span><div class="text"><span>Information</span><span class="alert-msg">Some example message text here</span></div><button class="close-btn">&times;</button></div>`
    warningTemplate = `<div class="alert success"><span class="icon"><i class="fa-solid fa-circle-check"></i></span><div class="text"><span>Success</span><span class="alert-msg">Your action was successful</span></div><button class="close-btn">&times;</button></div>`
}
function spawnAlert(templateId, msg, timeout) {
    const template = window[templateId];
    const wrapper = document.createElement("div");
    wrapper.innerHTML = template;
    const alertElement = wrapper.firstElementChild;

    alertElement.querySelector(".alert-msg").textContent = msg;

    alertElement.querySelector('.close-btn').addEventListener('click', () => {
        alertElement.classList.remove('fade-in');
        alertElement.classList.add('fade-out');
        setTimeout(() => alertElement.remove(), 400);
    });

    alertBox.appendChild(alertElement);
    requestAnimationFrame(() => alertElement.classList.add('fade-in'));

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

init()