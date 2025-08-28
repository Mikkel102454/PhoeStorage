async function forceChangePassword(password, confirm){
    if(password.length < 3){return handleServerReturnAlert(400, "Password must be 3 character or more")}
    if(password !== confirm){return handleServerReturnAlert(400, "Passwords dont match")}

    const response = await fetch(`/api/users/forcePassword?newPassword=${encodeURIComponent(password)}`, {
        method: "POST"
    });

    return handleServerReturnAlert(response.status, await response.text())
}

async function passwordChangeNeeded(){
    const response = await fetch(`/api/users/forcePassword`, {
        method: "GET"
    });

    if(!response.ok) {return}

    openForcePasswordResetModal()
}

onload = async () => {
    await passwordChangeNeeded()
}