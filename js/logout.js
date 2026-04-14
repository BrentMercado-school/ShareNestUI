const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            const response = await fetch(API_URL + "users/logout/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.href = "login.html";
            } else {
                alert(data.message || data.detail || "Logout failed.");
            }
        } catch (error) {
            console.log(error);
            alert("Something went wrong.");
        }
    });
}