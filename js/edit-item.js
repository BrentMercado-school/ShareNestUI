const editItemModal = document.getElementById("edit-item-modal");
const closeEditItemModalBtn = document.getElementById("close-edit-item-modal");
const editItemForm = document.getElementById("edit-item-form");
const editCategorySelect = document.getElementById("edit-item-category");

let selectedItemId = null;

async function loadEditCategories(selectedCategoryId = "") {
    try {
        const response = await fetch(API_URL + "categories/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

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
        console.log(error);
    }
}

async function openEditItemModal(item) {
    selectedItemId = item.id;

    await loadEditCategories(item.category);

    document.getElementById("edit-item-name").value = item.name || "";
    document.getElementById("edit-item-description").value = item.description || "";
    document.getElementById("edit-item-condition").value = item.condition || "";
    document.getElementById("edit-item-security-deposit").value = item.security_deposit || "";
    document.getElementById("edit-item-note").value = item.note || "";
    document.getElementById("edit-item-borrowing-fee").value = item.borrowingFee || "";
    document.getElementById("edit-item-status").value = item.status || "AVAILABLE";

    editItemModal.classList.add("show");
}

if (closeEditItemModalBtn && editItemModal) {
    closeEditItemModalBtn.addEventListener("click", () => {
        editItemModal.classList.remove("show");
    });
}

if (editItemModal) {
    editItemModal.addEventListener("click", (e) => {
        if (e.target === editItemModal) {
            editItemModal.classList.remove("show");
        }
    });
}

if (editItemForm) {
    editItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("edit-item-name").value;
        const category = document.getElementById("edit-item-category").value;
        const description = document.getElementById("edit-item-description").value;
        const condition = document.getElementById("edit-item-condition").value;
        const security_deposit = document.getElementById("edit-item-security-deposit").value;
        const note = document.getElementById("edit-item-note").value;
        const borrowingFee = document.getElementById("edit-item-borrowing-fee").value;
        const status = document.getElementById("edit-item-status").value;

        try {
            const response = await fetch(API_URL + `items/${selectedItemId}/update/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    category,
                    description,
                    condition,
                    security_deposit,
                    note,
                    borrowingFee,
                    status
                })
            });

            const data = await response.json();
            console.log("Update item response:", data);

            if (response.ok) {
                alert("Item updated successfully.");
                editItemModal.classList.remove("show");
                await getAllUserItems();
            } else {
                alert(JSON.stringify(data));
            }
        } catch (error) {
            console.log(error);
            alert("Something went wrong.");
        }
    });
}