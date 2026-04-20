const openAddItemModalBtn = document.getElementById("open-add-item-modal");
const closeAddItemModalBtn = document.getElementById("close-add-item-modal");
const addItemModal = document.getElementById("add-item-modal");
const addItemForm = document.getElementById("add-item-form");
const categorySelect = document.getElementById("item-category");

async function getCategories() {
    try {
        const response = await fetch(API_URL + "categories/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });

        const data = await response.json();

        categorySelect.innerHTML = `<option value="">Select category</option>`;

        for (const category of data) {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        }
    } catch (error) {
        console.log(error);
    }
}

function resetAddItemForm() {
    addItemForm.reset();

    const borrowingFeeInput = document.getElementById("item-borrowing-fee");
    if (borrowingFeeInput) {
        borrowingFeeInput.value = 50;
    }
}

if (openAddItemModalBtn && addItemModal) {
    openAddItemModalBtn.addEventListener("click", async () => {
        await getCategories();
        resetAddItemForm();
        addItemModal.classList.add("show");
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

let toastTimeout;

function showToast(message = "Success", type = "success") {
    const toast = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");
    const toastTitle = document.getElementById("toast-title");
    const toastIcon = document.getElementById("toast-icon");

    if (!toast) return;

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
    if (toast) toast.classList.remove("show");
}

if (addItemForm) {
    addItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("item-name").value;
        const category = document.getElementById("item-category").value;
        const description = document.getElementById("item-description").value;
        const condition = document.getElementById("item-condition").value;
        const security_deposit = document.getElementById("item-security-deposit").value;
        const note = document.getElementById("item-note").value;
        const borrowingFee = 20;

        // ✅ CREATE FORMDATA
        const formData = new FormData();

        formData.append("name", name);
        formData.append("category", category);
        formData.append("description", description);
        formData.append("condition", condition);
        formData.append("security_deposit", security_deposit);
        formData.append("note", note);
        formData.append("borrowingFee", borrowingFee);

        // 🔥 ADD IMAGE
        const imageInput = document.getElementById("item-image");
        if (imageInput.files.length > 0) {
            formData.append("image", imageInput.files[0]);
        }

        try {
            const response = await fetch(API_URL + "items/create/", {
                method: "POST",
                credentials: "include",
                body: formData   // ✅ IMPORTANT
            });

            const data = await response.json();

            if (response.ok) {
                alert("Item added successfully.");
                addItemModal.classList.remove("show");

                if (typeof getAllUserItems === "function") {
                    await getAllUserItems();
                }

            } else {
                alert(data.message || data.detail || "Failed to add item.");
                console.log(data);
            }

        } catch (error) {
            console.log(error);
            alert("Something went wrong.");
        }
    });
}