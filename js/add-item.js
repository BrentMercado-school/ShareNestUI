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

    const statusInput = document.getElementById("item-status");
    if (statusInput) {
        statusInput.value = "AVAILABLE";
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

if (addItemForm) {
    addItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("item-name").value;
        const category = document.getElementById("item-category").value;
        const description = document.getElementById("item-description").value;
        const condition = document.getElementById("item-condition").value;
        const security_deposit = document.getElementById("item-security-deposit").value;
        const note = document.getElementById("item-note").value;
        const borrowingFee = document.getElementById("item-borrowing-fee").value;

        try {
            const response = await fetch(API_URL + "items/create/", {
                method: "POST",
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
                    borrowingFee
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Item added successfully.");
                resetAddItemForm();
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