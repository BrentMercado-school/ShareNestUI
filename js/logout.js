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
                if (typeof showToast === "function") {
                    showToast(data.message || "Logged out successfully.", "success");

                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 1200);
                } else {
                    alert(data.message || "Logged out successfully.");
                    window.location.href = "login.html";
                }
            } else {
                if (typeof showToast === "function") {
                    showToast(data.message || data.detail || "Logout failed.", "error");
                } else {
                    alert(data.message || data.detail || "Logout failed.");
                }
            }
        } catch (error) {
            console.log(error);

            if (typeof showToast === "function") {
                showToast("Something went wrong.", "error");
            } else {
                alert("Something went wrong.");
            }
        }
    });
}