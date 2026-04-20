const API_URL = "http://127.0.0.1:8000/api/";
const DEFAULT_PROFILE_IMAGE = "images/default-profile.png";

const editProfileModal = document.getElementById("edit-profile-modal");
const openEditProfileModalBtn = document.getElementById("open-edit-profile-modal");
const closeEditProfileModalBtn = document.getElementById("close-edit-profile-modal");
const closeEditProfileModalSecondaryBtn = document.getElementById("close-edit-profile-modal-secondary");
const editProfileForm = document.getElementById("edit-profile-form");
const profileAvatar = document.getElementById("profile-avatar");

let currentProfileData = null;
let toastTimeout;

function populateEditProfileForm(profile) {
    if (!profile) return;

    document.getElementById("edit-profile-name").value = profile.name || "";
    document.getElementById("edit-profile-email").value = profile.email || "";
    document.getElementById("edit-profile-address").value = profile.address || "";
    document.getElementById("edit-profile-contact-number").value = profile.contactNumber || "";
}

function resetEditProfileForm() {
    populateEditProfileForm(currentProfileData);
}

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
        currentProfileData = {
            name: data.name || "",
            email: data.email || "",
            address: data.address || "",
            contactNumber: data.contactNumber || "",
        };

        const profileImg = document.getElementById("profile-avatar");

        if (profileImg) {
            profileImg.src = data.image
                ? "http://127.0.0.1:8000" + data.image
                : "./images/default-profile.png";
        }

            document.getElementById("profile-name").textContent = data.name || "N/A";
            document.getElementById("profile-email").textContent = data.email || "N/A";
            document.getElementById("profile-address").textContent = data.address || "No address added";
            document.getElementById("profile-contact-number").textContent = data.contactNumber || "No contact number added";
            document.getElementById("profile-email-details").textContent = data.email || "No email added";

            if (profileAvatar) {
                profileAvatar.src = data.image
                    ? "http://127.0.0.1:8000" + data.image
                    : DEFAULT_PROFILE_IMAGE;
            }

            populateEditProfileForm(currentProfileData);
        } else {
            showToast(data.detail || "Failed to load profile.", "error");
        }
    } catch (error) {
        console.log(error);
        showToast("Something went wrong.", "error");
    }
}

if (profileAvatar) {
    profileAvatar.addEventListener("error", () => {
        profileAvatar.src = DEFAULT_PROFILE_IMAGE;
    });
}

if (openEditProfileModalBtn && editProfileModal) {
    openEditProfileModalBtn.addEventListener("click", () => {
        resetEditProfileForm();
        editProfileModal.classList.add("show");
    });
}

if (closeEditProfileModalBtn && editProfileModal) {
    closeEditProfileModalBtn.addEventListener("click", () => {
        resetEditProfileForm();
        editProfileModal.classList.remove("show");
    });
}

if (closeEditProfileModalSecondaryBtn && editProfileModal) {
    closeEditProfileModalSecondaryBtn.addEventListener("click", () => {
        resetEditProfileForm();
        editProfileModal.classList.remove("show");
    });
}

if (editProfileModal) {
    editProfileModal.addEventListener("click", (e) => {
        if (e.target === editProfileModal) {
            resetEditProfileForm();
            editProfileModal.classList.remove("show");
        }
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const name = document.getElementById("edit-profile-name").value;
            const email = document.getElementById("edit-profile-email").value;
            const address = document.getElementById("edit-profile-address").value;
            const contactNumber = document.getElementById("edit-profile-contact-number").value;

            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);
            formData.append("address", address);
            formData.append("contactNumber", contactNumber);

            // 👇 image
            const imageInput = document.getElementById("edit-profile-image");
            if (imageInput.files[0]) {
                formData.append("image", imageInput.files[0]);
            }

            const response = await fetch(API_URL + "users/me/update/", {
                method: "PUT",
                credentials: "include",
                body: formData
            });

            const data = await response.json();
            console.log("Update profile response:", data);

            if (response.ok) {
                showToast("Profile updated successfully.", "success");
                editProfileModal.classList.remove("show");
                await getCurrentUserProfile();
            } else {
                let errorMessage = "Failed to update profile.";

                if (data.email) {
                    errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;

                    if (errorMessage.toLowerCase().includes("already")) {
                        errorMessage = "This email is already being used by another user.";
                    }
                } else if (data.detail) {
                    errorMessage = data.detail;
                }

                showToast(errorMessage, "error");
            }

        } catch (error) {
            console.log(error);
            showToast("Something went wrong.", "error");
        }
    });
}

function showToast(message = "Success", type = "success") {
    const toast = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");
    const toastTitle = document.getElementById("toast-title");
    const toastIcon = document.getElementById("toast-icon");

    if (!toast || !toastText || !toastTitle || !toastIcon) return;

    toast.classList.remove("success", "error");
    toast.classList.add(type);

    if (type === "error") {
        toastTitle.textContent = "Error";
        toastIcon.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
    } else {
        toastTitle.textContent = "Success";
        toastIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
    }

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

document.addEventListener("DOMContentLoaded", () => {
    getCurrentUserProfile();
});