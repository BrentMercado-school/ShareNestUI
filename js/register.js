const API_URL = "http://127.0.0.1:8000/api/";
const registerForm = document.getElementById("register-form");

let toastTimeout;

function showToast(message = "Something went wrong.") {
    const toast = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");

    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function hideToast() {
    const toast = document.getElementById("toast-message");
    if (toast) {
        toast.classList.remove("show");
    }
}

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (password !== confirmPassword) {
            showToast("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(API_URL + "users/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = "login.html";
            } else {
                showToast(data.message || data.detail || "Failed to register.");
            }
        } catch (error) {
            console.log(error);
            showToast("Something went wrong.");
        }
    });
}