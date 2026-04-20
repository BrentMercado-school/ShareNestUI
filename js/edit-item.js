const EDIT_ITEM_API_URL = window.API_URL || "http://127.0.0.1:8000/api/";

const editItemModal = document.getElementById("edit-item-modal");
const closeEditItemModalBtn = document.getElementById("close-edit-item-modal");
const editItemForm = document.getElementById("edit-item-form");
const editCategorySelect = document.getElementById("edit-item-category");

let selectedEditItemId = null;

/* =========================
   HELPERS
========================= */
function closeEditItemModal() {
    if (editItemModal) {
        editItemModal.classList.remove("show");
    }

    if (editItemForm) {
        editItemForm.reset();
    }

    selectedEditItemId = null;
}

function setEditFormValues(item) {
    document.getElementById("edit-item-name").value = item.name || "";
    document.getElementById("edit-item-description").value = item.description || "";
    document.getElementById("edit-item-condition").value = item.condition || "";
    document.getElementById("edit-item-security-deposit").value = item.security_deposit || "";
    document.getElementById("edit-item-note").value = item.note || "";
    document.getElementById("edit-item-borrowing-fee").value = item.borrowingFee || "";
    document.getElementById("edit-item-status").value = item.status || "AVAILABLE";

    const editImageInput = document.getElementById("edit-item-image");
    if (editImageInput) {
        editImageInput.value = "";
    }
}

/* =========================
   LOAD CATEGORIES
========================= */
async function loadEditCategories(selectedCategoryId = "") {
    try {
        const response = await fetch(EDIT_ITEM_API_URL + "categories/", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok || !Array.isArray(data) || !editCategorySelect) {
            return;
        }

        editCategorySelect.innerHTML = `<option value="">Select category</option>`;

        for (const category of data) {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;

            if (String(category.id) === String(selectedCategoryId)) {
                option.selected = true;
            }

            editCategorySelect.appendChild(option);
        }
    } catch (error) {
        console.log("loadEditCategories error:", error);
    }
}

/* =========================
   GET ITEM DETAILS
========================= */
async function getItemForEdit(itemId) {
    const response = await fetch(EDIT_ITEM_API_URL + `items/${itemId}/`, {
        method: "GET",
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to load item details.");
    }

    return data;
}

/* =========================
   OPEN EDIT MODAL
========================= */
async function openEditItemModal(itemId) {
    try {
        selectedEditItemId = itemId;

        const item = await getItemForEdit(itemId);
        await loadEditCategories(item.category);
        setEditFormValues(item);

        if (editItemModal) {
            editItemModal.classList.add("show");
        }
    } catch (error) {
        console.log("openEditItemModal error:", error);

        if (typeof showToast === "function") {
            showToast(error.message || "Failed to load item.", "error");
        } else {
            alert(error.message || "Failed to load item.");
        }
    }
}

window.openEditItemModal = openEditItemModal;

/* =========================
   CLOSE EVENTS
========================= */
if (closeEditItemModalBtn && editItemModal) {
    closeEditItemModalBtn.addEventListener("click", closeEditItemModal);
}

if (editItemModal) {
    editItemModal.addEventListener("click", (e) => {
        if (e.target === editItemModal) {
            closeEditItemModal();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editItemModal?.classList.contains("show")) {
        closeEditItemModal();
    }
});

/* =========================
   SUBMIT EDIT
========================= */
if (editItemForm) {
    editItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!selectedEditItemId) {
            if (typeof showToast === "function") {
                showToast("No item selected.", "error");
            } else {
                alert("No item selected.");
            }
            return;
        }

        const name = document.getElementById("edit-item-name").value.trim();
        const category = document.getElementById("edit-item-category").value;
        const description = document.getElementById("edit-item-description").value.trim();
        const condition = document.getElementById("edit-item-condition").value.trim();
        const security_deposit = document.getElementById("edit-item-security-deposit").value;
        const note = document.getElementById("edit-item-note").value.trim();
        const borrowingFee = document.getElementById("edit-item-borrowing-fee").value;
        const status = document.getElementById("edit-item-status").value;
        const imageFile = document.getElementById("edit-item-image").files[0];

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("description", description);
            formData.append("condition", condition);
            formData.append("security_deposit", security_deposit || 0);
            formData.append("note", note);
            formData.append("borrowingFee", borrowingFee);
            formData.append("status", status);

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const response = await fetch(EDIT_ITEM_API_URL + `items/${selectedEditItemId}/update/`, {
                method: "PUT",
                credentials: "include",
                body: formData
            });

            const data = await response.json();
            console.log("Update item response:", data);

            if (response.ok) {
                if (typeof showToast === "function") {
                    showToast("Item updated successfully.", "success");
                } else {
                    alert("Item updated successfully.");
                }

                closeEditItemModal();

                if (typeof getAllUserItems === "function") {
                    await getAllUserItems();
                }
            } else {
                if (typeof showToast === "function") {
                    showToast(data.detail || data.message || "Failed to update item.", "error");
                } else {
                    alert(data.detail || data.message || "Failed to update item.");
                }
            }
        } catch (error) {
            console.log("Edit item error:", error);

            if (typeof showToast === "function") {
                showToast("Something went wrong.", "error");
            } else {
                alert("Something went wrong.");
            }
        }
    });
}