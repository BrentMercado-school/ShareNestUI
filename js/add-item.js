const ADD_ITEM_API_URL = window.API_URL || "http://127.0.0.1:8000/api/";

const openAddItemModalBtn = document.getElementById("open-add-item-modal");
const closeAddItemModalBtn = document.getElementById("close-add-item-modal");
const addItemModal = document.getElementById("add-item-modal");
const addItemForm = document.getElementById("add-item-form");
const categorySelect = document.getElementById("item-category");

let addItemToastTimeout;

async function getCategories() {
    try {
        const response = await fetch(ADD_ITEM_API_URL + "categories/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok || !Array.isArray(data) || !categorySelect) {
            return;
        }

        categorySelect.innerHTML = `<option value="">Select category</option>`;

        for (const category of data) {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        }
    } catch (error) {
        console.log("getCategories error:", error);
    }
}

function resetAddItemForm() {
    if (!addItemForm) return;

    addItemForm.reset();

    const borrowingFeeInput = document.getElementById("item-borrowing-fee");
    if (borrowingFeeInput) {
        borrowingFeeInput.value = 50;
    }
}

function showAddItemToast(message = "Success", type = "success") {
    if (typeof showToast === "function") {
        showToast(message, type);
        return;
    }

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

    clearTimeout(addItemToastTimeout);
    addItemToastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

if (openAddItemModalBtn && addItemModal) {
    openAddItemModalBtn.addEventListener("click", async () => {
        resetAddItemForm();
        addItemModal.classList.add("show");
        await getCategories();
    });
}

if (closeAddItemModalBtn && addItemModal) {
    closeAddItemModalBtn.addEventListener("click", () => {
        addItemModal.classList.remove("show");
        resetAddItemForm();
    });
}

if (addItemModal) {
    addItemModal.addEventListener("click", (e) => {
        if (e.target === addItemModal) {
            addItemModal.classList.remove("show");
            resetAddItemForm();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && addItemModal?.classList.contains("show")) {
        addItemModal.classList.remove("show");
        resetAddItemForm();
    }
});

if (addItemForm) {
    addItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("item-name").value.trim();
        const category = parseInt(document.getElementById("item-category").value, 10);
        const description = document.getElementById("item-description").value.trim();
        const condition = document.getElementById("item-condition").value.trim();
        const securityDepositRaw = document.getElementById("item-security-deposit").value;
        const note = document.getElementById("item-note").value.trim();
        const borrowingFee = 50;
        const imageFile = document.getElementById("item-image").files[0];

        if (!category) {
            showAddItemToast("Please select a category.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("category", category);
        formData.append("description", description);
        formData.append("condition", condition);
        formData.append("security_deposit", securityDepositRaw || 0);
        formData.append("note", note);
        formData.append("borrowingFee", borrowingFee);

        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            const response = await fetch(ADD_ITEM_API_URL + "items/create/", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showAddItemToast("Item added successfully!", "success");
                resetAddItemForm();
                addItemModal.classList.remove("show");

                if (typeof getAllUserItems === "function") await getAllUserItems();
                if (typeof getAllItems === "function") await getAllItems();
                if (typeof getLatestItems === "function") await getLatestItems();
            } else {
                showAddItemToast(data.message || data.detail || "Failed to add item.", "error");
            }
        } catch (error) {
            console.log("Add item error:", error);
            showAddItemToast("Something went wrong.", "error");
        }
    });
}