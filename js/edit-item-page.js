const API_URL = "http://127.0.0.1:8000/api/";

const editItemForm = document.getElementById("edit-item-form");
const categorySelect = document.getElementById("edit-item-category");

function getItemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadCategories(selectedCategoryId = "") {
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

            if (String(category.id) === String(selectedCategoryId)) {
                option.selected = true;
            }

            categorySelect.appendChild(option);
        }
    } catch (error) {
        console.log("loadCategories error:", error);
    }
}

async function loadItemDetails() {
    const itemId = getItemIdFromUrl();

    if (!itemId) {
        alert("No item ID found.");
        return;
    }

    try {
        const response = await fetch(API_URL + `items/${itemId}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });

        const data = await response.json();
        console.log("Item details:", data);

        if (!response.ok) {
            alert(data.detail || "Failed to load item.");
            return;
        }

        await loadCategories(data.category);

        document.getElementById("edit-item-name").value = data.name || "";
        document.getElementById("edit-item-description").value = data.description || "";
        document.getElementById("edit-item-condition").value = data.condition || "";
        document.getElementById("edit-item-security-deposit").value = data.security_deposit || "";
        document.getElementById("edit-item-note").value = data.note || "";
        document.getElementById("edit-item-borrowing-fee").value = data.borrowingFee || "";
        document.getElementById("edit-item-status").value = data.status || "AVAILABLE";
    } catch (error) {
        console.log("loadItemDetails error:", error);
        alert("Something went wrong.");
    }
}

if (editItemForm) {
    editItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const itemId = getItemIdFromUrl();

        const name = document.getElementById("edit-item-name").value;
        const category = document.getElementById("edit-item-category").value;
        const description = document.getElementById("edit-item-description").value;
        const condition = document.getElementById("edit-item-condition").value;
        const security_deposit = document.getElementById("edit-item-security-deposit").value;
        const note = document.getElementById("edit-item-note").value;
        const borrowingFee = document.getElementById("edit-item-borrowing-fee").value;
        const status = document.getElementById("edit-item-status").value;

        try {
            const response = await fetch(API_URL + `items/${itemId}/update/`, {
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
            console.log("Update response:", data);

            if (response.ok) {
                alert("Item updated successfully.");
                window.location.href = "my-items.html";
            } else {
                alert(JSON.stringify(data));
            }
        } catch (error) {
            console.log("update error:", error);
            alert("Something went wrong.");
        }
    });
}

loadItemDetails();