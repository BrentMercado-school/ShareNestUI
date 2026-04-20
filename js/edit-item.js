// edit-item.js
// ✅ Lazy getters — grabbed at call time, not at script load
const getEditModal = () => document.getElementById("edit-item-modal");
const getEditForm = () => document.getElementById("edit-item-form");
const getEditCategorySelect = () => document.getElementById("edit-item-category");
const getCloseEditBtn = () => document.getElementById("close-edit-item-modal");
let selectedItemId = null;

async function loadEditCategories(selectedCategoryId = "") {
    try {
        const response = await fetch(API_URL + "categories/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        const editCategorySelect = getEditCategorySelect(); // ✅ grabbed here

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
    document.getElementById("edit-item-borrowing-fee").value = item.borrowing_fee ?? item.borrowingFee ?? "";
    document.getElementById("edit-item-status").value = item.status || "AVAILABLE";

    getEditModal().classList.add("show"); // ✅
}

// ✅ Attach listeners inside DOMContentLoaded so elements are guaranteed to exist
document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = getCloseEditBtn();
    const modal = getEditModal();
    const form = getEditForm();

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.classList.remove("show"));
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("show");
        });
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
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
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ name, category, description, condition, security_deposit, note, borrowingFee, status })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Item updated successfully.");
                    modal.classList.remove("show");
                    document.dispatchEvent(new CustomEvent("itemUpdated", { detail: { id: selectedItemId } }));
                } else {
                    alert(JSON.stringify(data));
                }
            } catch (error) {
                console.log(error);
                alert("Something went wrong.");
            }
        });
    }
});