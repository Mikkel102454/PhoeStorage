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