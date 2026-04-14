const API_URL = "http://127.0.0.1:8000/api/"
async function getCurrentUser() {
    const usernameElement = document.getElementById("username")

    const response = await fetch (API_URL + "users/me/", {
        method: "GET",
        credentials: "include"
    })

    const data = await response.json()

    usernameElement.textContent = data.name
}

getCurrentUser();