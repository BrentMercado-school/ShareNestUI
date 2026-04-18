const API_URL = "http://127.0.0.1:8000/api/";

const tbody = document.getElementById("owned-items");
const availableTbody = document.getElementById("available-owned-items");
const borrowedTbody = document.getElementById("borrowed-owned-items");

// EDIT ITEM MODAL ELEMENTS
const editItemModal = document.getElementById("edit-item-modal");
const closeEditItemModalBtn = document.getElementById("close-edit-item-modal");
const editItemForm = document.getElementById("edit-item-form");
const editCategorySelect = document.getElementById("edit-item-category");

let selectedEditItemId = null;

// RETURN ITEM MODAL ELEMENTS
const returnItemModal = document.getElementById("return-item-modal");
const closeReturnItemModalBtn = document.getElementById("close-return-item-modal");
const returnItemForm = document.getElementById("return-item-form");

const actualReturnDateInput = document.getElementById("actual-return-date");
const damageFeeInput = document.getElementById("damage-fee");
const latePenaltyFeeInput = document.getElementById("late-penalty-fee");
const refundAmountInput = document.getElementById("refund-amount");
const expectedReturnDateDisplay = document.getElementById("expected-return-date-display");

let selectedReturnItem = null;

// HELPERS
function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function parseLocalDate(dateString) {
    if (!dateString) return null;

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatMoney(value) {
    if (value === null || value === undefined || value === "") return "N/A";
    return Number(value).toFixed(2);
}

function renderEmptyRow(targetTbody, message) {
    targetTbody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.textContent = message;

    row.appendChild(cell);
    targetTbody.appendChild(row);
}

/* =========================
   DELETE ITEM
========================= */
async function deleteItem(itemId) {
    try {
        const response = await fetch(API_URL + `items/${itemId}/delete/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.ok) {
            alert(data.message || "Item deleted successfully.");
            await getAllUserItems();
        } else {
            alert(data.detail || data.message || "Failed to delete item.");
        }
    } catch (error) {
        console.log("deleteItem error:", error);
        alert("Something went wrong while deleting the item.");
    }
}

// EDIT ITEM FLOW
async function loadEditCategories(selectedCategoryId = "") {
    try {
        const response = await fetch(API_URL + "categories/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
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
        console.log("loadEditCategories error:", error);
    }
}

async function openEditItemModal(item) {
    selectedEditItemId = item.id;

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

function closeEditItemModal() {
    editItemModal.classList.remove("show");
    editItemForm.reset();
    selectedEditItemId = null;
}

if (closeEditItemModalBtn) {
    closeEditItemModalBtn.addEventListener("click", closeEditItemModal);
}

if (editItemModal) {
    editItemModal.addEventListener("click", (e) => {
        if (e.target === editItemModal) {
            closeEditItemModal();
        }
    });
}

if (editItemForm) {
    editItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!selectedEditItemId) {
            alert("No selected item.");
            return;
        }

        const name = document.getElementById("edit-item-name").value;
        const category = document.getElementById("edit-item-category").value;
        const description = document.getElementById("edit-item-description").value;
        const condition = document.getElementById("edit-item-condition").value;
        const security_deposit = document.getElementById("edit-item-security-deposit").value;
        const note = document.getElementById("edit-item-note").value;
        const borrowingFee = document.getElementById("edit-item-borrowing-fee").value;
        const status = document.getElementById("edit-item-status").value;

        try {
            const response = await fetch(API_URL + `items/${selectedEditItemId}/update/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
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
                alert(data.message || "Item updated successfully.");
                closeEditItemModal();
                await getAllUserItems();
            } else {
                alert(data.detail || data.message || JSON.stringify(data));
            }
        } catch (error) {
            console.log("edit submit error:", error);
            alert("Something went wrong while updating the item.");
        }
    });
}

// RETURN ITEM FLOW
function updateReturnCalculations() {
    if (!selectedReturnItem) return;

    const securityDeposit = parseFloat(selectedReturnItem.security_deposit || 0);
    const damageFee = parseFloat(damageFeeInput.value || 0);
    const expectedReturnDate = selectedReturnItem.expected_return_date;
    const actualReturnDate = actualReturnDateInput.value;

    let latePenaltyFee = 0;

    if (expectedReturnDate && actualReturnDate) {
        const expectedDate = parseLocalDate(expectedReturnDate);
        const actualDate = parseLocalDate(actualReturnDate);

        const diffMs = actualDate - expectedDate;
        const lateDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        latePenaltyFee = lateDays * 50;
    }

    const refundAmount = securityDeposit - latePenaltyFee - damageFee;

    latePenaltyFeeInput.value = latePenaltyFee.toFixed(2);
    refundAmountInput.value = refundAmount.toFixed(2);
}

function openReturnItemModal(item) {
    selectedReturnItem = item;

    expectedReturnDateDisplay.textContent = formatDate(item.expected_return_date);
    actualReturnDateInput.value = "";
    damageFeeInput.value = "0";
    latePenaltyFeeInput.value = "0.00";
    refundAmountInput.value = parseFloat(item.security_deposit || 0).toFixed(2);

    returnItemModal.classList.add("show");
}

function closeReturnItemModal() {
    returnItemModal.classList.remove("show");
    returnItemForm.reset();
    expectedReturnDateDisplay.textContent = "N/A";
    latePenaltyFeeInput.value = "0.00";
    refundAmountInput.value = "0.00";
    selectedReturnItem = null;
}

if (closeReturnItemModalBtn) {
    closeReturnItemModalBtn.addEventListener("click", closeReturnItemModal);
}

if (returnItemModal) {
    returnItemModal.addEventListener("click", (e) => {
        if (e.target === returnItemModal) {
            closeReturnItemModal();
        }
    });
}

if (actualReturnDateInput) {
    actualReturnDateInput.addEventListener("change", updateReturnCalculations);
}

if (damageFeeInput) {
    damageFeeInput.addEventListener("input", updateReturnCalculations);
}

if (returnItemForm) {
    returnItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!selectedReturnItem) {
            alert("No selected item.");
            return;
        }

        const actualReturnDate = actualReturnDateInput.value;
        const damageFee = damageFeeInput.value;

        try {
            const response = await fetch(API_URL + `items/${selectedReturnItem.id}/return/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    actualReturnDate,
                    damageFee
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Return form submitted successfully.");
                closeReturnItemModal();
                await getAllUserItems();
            } else {
                alert(data.detail || data.message || JSON.stringify(data));
            }
        } catch (error) {
            console.log("return submit error:", error);
            alert("Something went wrong while submitting the return form.");
        }
    });
}

function createItemRow(item) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = item.name || "N/A";

    const conditionCell = document.createElement("td");
    conditionCell.textContent = item.condition || "N/A";

    const secDepoCell = document.createElement("td");
    secDepoCell.textContent = formatMoney(item.security_deposit);

    const noteCell = document.createElement("td");
    noteCell.textContent = item.note || "N/A";

    const borrowFeeCell = document.createElement("td");
    borrowFeeCell.textContent = formatMoney(item.borrowingFee ?? item.borrowing_fee);

    const statusCell = document.createElement("td");
    statusCell.textContent = item.status || "N/A";

    const actionsCell = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";

    if (item.status === "BORROWED") {
        editBtn.disabled = true;
        editBtn.title = "Borrowed items cannot be edited";
    } else {
        editBtn.addEventListener("click", async () => {
            await openEditItemModal(item);
        });
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";

    if (item.status === "BORROWED") {
        deleteBtn.disabled = true;
        deleteBtn.title = "Borrowed items cannot be deleted";
    } else {
        deleteBtn.addEventListener("click", async () => {
            const isConfirmed = confirm(`Are you sure you want to delete "${item.name}"?`);
            if (!isConfirmed) return;

            await deleteItem(item.id);
        });
    }

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View Details";
    viewBtn.addEventListener("click", () => {
        window.location.href = `owned-item-details.html?id=${item.id}`;
    });

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);
    actionsCell.appendChild(viewBtn);

    if (item.status === "BORROWED") {
        const returnBtn = document.createElement("button");
        returnBtn.textContent = "Return";
        returnBtn.addEventListener("click", () => {
            openReturnItemModal(item);
        });

        actionsCell.appendChild(returnBtn);
    }

    row.appendChild(nameCell);
    row.appendChild(conditionCell);
    row.appendChild(secDepoCell);
    row.appendChild(noteCell);
    row.appendChild(borrowFeeCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);

    return row;
}

// LOAD USER ITEMS
async function getAllUserItems() {
    try {
        const response = await fetch(API_URL + "users/owned-items/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to load items.");
            return;
        }

        tbody.innerHTML = "";
        availableTbody.innerHTML = "";

        if (!data.length) {
            renderEmptyRow(tbody, "No owned items found.");
            renderEmptyRow(availableTbody, "No available items found.");
            renderEmptyRow(borrowedTbody, "No borrowed items found.");
            return;
        }

        for (const item of data) {
            tbody.appendChild(createItemRow(item));
        }

        const availableItems = data.filter((item) => item.status === "AVAILABLE");

        if (!availableItems.length) {
            renderEmptyRow(availableTbody, "No available items found.");
        } else {
            for (const item of availableItems) {
                availableTbody.appendChild(createItemRow(item));
            }
        }
        
        const borrowedItems = data.filter((item) => item.status === "BORROWED");

        if (!borrowedItems.length) {
            renderEmptyRow(borrowedTbody, "No borrowed items found.");
        } else {
            for (const item of borrowedItems) {
                borrowedTbody.appendChild(createItemRow(item));
            }
        }
    } catch (error) {
        console.log("getAllUserItems error:", error);
        alert("Something went wrong while loading items.");
    }
}

document.addEventListener("DOMContentLoaded", getAllUserItems);