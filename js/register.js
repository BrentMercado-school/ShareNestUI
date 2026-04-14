const API_URL = "http://127.0.0.1:8000/api/"
const register_form = document.getElementById("register-form")

if (register_form) {
    register_form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value
        const password = document.getElementById("password").value
        
        try {
            const response = await fetch (API_URL + "users/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    password
                })
            })

            const data = await response.json();

            if(response.ok){
                window.location.href = "login.html"
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.log(error)
            alert("Something went wrong.")
        }
        
    })
}