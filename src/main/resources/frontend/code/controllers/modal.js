let modalContainer

function getModalParent(){
    if(modalContainer) {return modalContainer}
    const temp = document.createElement("div");
    temp.id = "modalContainer"
    document.body.appendChild(temp)

    modalContainer = document.getElementById("modalContainer")
    return modalContainer
}