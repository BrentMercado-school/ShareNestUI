const API_URL = "http://127.0.0.1:8000/api/";

const editProfileModal = document.getElementById("edit-profile-modal");
const openEditProfileModalBtn = document.getElementById("open-edit-profile-modal");
const closeEditProfileModalBtn = document.getElementById("close-edit-profile-modal");
const editProfileForm = document.getElementById("edit-profile-form");

async function getCurrentUserProfile() {
    try {
        const response = await fetch(API_URL + "users/me/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        console.log("Profile:", data);

        if (response.ok) {
            document.getElementById("profile-name").textContent = data.name || "N/A";
            document.getElementById("profile-email").textContent = data.email || "N/A";
            document.getElementById("profile-address").textContent = data.address || "N/A";
            document.getElementById("profile-contact-number").textContent = data.contactNumber || "N/A";
            document.getElementById("profile-image-url").textContent = data.imageUrl || "N/A";

            document.getElementById("edit-profile-name").value = data.name || "";
            document.getElementById("edit-profile-email").value = data.email || "";
            document.getElementById("edit-profile-address").value = data.address || "";
            document.getElementById("edit-profile-contact-number").value = data.contactNumber || "";
            document.getElementById("edit-profile-image-url").value = data.imageUrl || "";
        } else {
            alert(data.detail || "Failed to load profile.");
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

if (openEditProfileModalBtn && editProfileModal) {
    openEditProfileModalBtn.addEventListener("click", () => {
        editProfileModal.classList.add("show");
    });
}

if (closeEditProfileModalBtn && editProfileModal) {
    closeEditProfileModalBtn.addEventListener("click", () => {
        editProfileModal.classList.remove("show");
    });
}

if (editProfileModal) {
    editProfileModal.addEventListener("click", (e) => {
        if (e.target === editProfileModal) {
            editProfileModal.classList.remove("show");
        }
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("edit-profile-name").value;
        const email = document.getElementById("edit-profile-email").value;
        const address = document.getElementById("edit-profile-address").value;
        const contactNumber = document.getElementById("edit-profile-contact-number").value;
        const imageUrl = document.getElementById("edit-profile-image-url").value;

        try {
            const response = await fetch(API_URL + "users/me/update/", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    email,
                    address,
                    contactNumber,
                    imageUrl
                })
            });

            const data = await response.json();
            console.log("Update profile response:", data);

            if (response.ok) {
                alert("Profile updated successfully.");
                editProfileModal.classList.remove("show");
                await getCurrentUserProfile();
            } else {
                alert(JSON.stringify(data));
            }
        } catch (error) {
            console.log(error);
            alert("Something went wrong.");
        }
    });
}

getCurrentUserProfile();