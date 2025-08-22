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