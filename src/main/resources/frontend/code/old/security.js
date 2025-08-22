async function passwordChangeNeeded(){
    const response = await fetch(`/api/users/forcePassword`, {
        method: "GET"
    });

    if(!response.ok) {return}

    openForcePasswordMenu()
}

async function forceChangePassword(password, confirm){

    console.log(password)
    console.log(confirm)
    if(password.length < 3){
        return 1
    }
    if(password !== confirm){
        return 2
    }

    const response = await fetch(`/api/users/forcePassword?newPassword=${encodeURIComponent(password)}`, {
        method: "POST"
    });

    if (!response.ok) {
        if(Number(response.status) === 401){
            throwError("You are not forced to change password. Please do it through settings")
            return 3
        }
        if(Number(response.status) === 400){
            return 1
        }
        throwError("Could not change password")
        return 3
    }

    return 0
}

passwordChangeNeeded()