const API_URL = "http://127.0.0.1:8000/api/"
const login_form = document.getElementById("login-form")

if (login_form) {

    login_form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch (API_URL + "users/login/", {
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
                window.location.href = "dashboard.html"
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.log(error)
            alert("Something went wrong.")
        }
    })
}