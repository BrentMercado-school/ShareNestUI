const API_URL = "http://127.0.0.1:8000/api/";

/* =========================
   GLOBAL
========================= */
let selectedItem = null;

/* =========================
   GET ITEM ID
========================= */
function getItemIdFromUrl() {
    return new URLSearchParams(window.location.search).get("id");
}

/* =========================
   FORMAT DATE
========================= */
function formatDate(dateString) {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

/* =========================
   LOAD ITEM DETAILS
========================= */
async function getItemDetails() {
    const itemId = getItemIdFromUrl();

    if (!itemId) {
        alert("No item ID found.");
        return;
    }

    try {
        const response = await fetch(API_URL + `items/${itemId}/`, {
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to load item details.");
            return;
        }

        selectedItem = data;

        // BASIC INFO
        document.getElementById("item-name").textContent = data.name || "N/A";
        document.getElementById("item-category").textContent = data.category_name || "N/A";
        document.getElementById("item-description").textContent = data.description || "N/A";
        document.getElementById("item-condition").textContent = data.condition || "N/A";
        document.getElementById("item-security-deposit").textContent = data.security_deposit || "N/A";
        document.getElementById("item-note").textContent = data.note || "N/A";

        document.getElementById("item-borrowing-fee").textContent =
            data.borrowing_fee ?? data.borrowingFee ?? "N/A";

        document.getElementById("item-status").textContent = data.status || "N/A";
        document.getElementById("item-owner").textContent = data.owner_name || "N/A";

        const returnDateEl = document.getElementById("item-expected-return-date");
        const returnBtn = document.getElementById("return-item-btn");
        const editBtn = document.getElementById("edit-btn");
        const deleteBtn = document.getElementById("delete-btn");

        if (data.status === "BORROWED") {
            returnDateEl.textContent = formatDate(data.expected_return_date);
            if (returnBtn) returnBtn.style.display = "inline-block";
            if (editBtn) editBtn.style.display = "none";
            if (deleteBtn) deleteBtn.style.display = "none";
        } else {
            returnDateEl.textContent = "N/A";
            if (returnBtn) returnBtn.style.display = "none";
            if (editBtn) editBtn.style.display = "inline-block";
            if (deleteBtn) deleteBtn.style.display = "inline-block";
        }

    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

/* =========================
   DELETE
========================= */
async function handleDelete() {
    if (!selectedItem) return;

    if (!confirm(`Delete "${selectedItem.name}"?`)) return;

    try {
        const res = await fetch(API_URL + `items/${selectedItem.id}/delete/`, {
            method: "DELETE",
            credentials: "include"
        });

        if (res.ok) {
            alert("Deleted successfully");
            window.location.href = "my-items.html";
        } else {
            alert("Delete failed");
        }

    } catch (err) {
        console.log(err);
        alert("Error deleting");
    }
}

/* =========================
   EDIT
========================= */
function handleEdit() {
    if (!selectedItem) return;
    openEditItemModal(selectedItem); // from edit-item.js
}

/* =========================
   RETURN CALCULATIONS
========================= */
function parseLocalDate(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function updateReturnCalculations() {
    if (!selectedItem) return;

    const securityDeposit = parseFloat(selectedItem.security_deposit || 0);
    const damageFee = parseFloat(document.getElementById("damage-fee").value || 0);

    const expected = selectedItem.expected_return_date;
    const actual = document.getElementById("actual-return-date").value;

    let latePenalty = 0;

    if (expected && actual) {
        const diff = parseLocalDate(actual) - parseLocalDate(expected);
        const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        latePenalty = days * 50;
    }

    document.getElementById("late-penalty-fee").value = latePenalty.toFixed(2);
    document.getElementById("refund-amount").value =
        (securityDeposit - latePenalty - damageFee).toFixed(2);
}

/* =========================
   RETURN MODAL
========================= */
function openReturnItemModal() {
    if (!selectedItem) return;

    document.getElementById("expected-return-date-display").textContent =
        formatDate(selectedItem.expected_return_date);

    document.getElementById("return-item-modal").style.display = "block";
}

function closeReturnItemModal() {
    document.getElementById("return-item-modal").style.display = "none";
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    getItemDetails();

    const returnBtn = document.getElementById("return-item-btn");
    if (returnBtn) returnBtn.addEventListener("click", openReturnItemModal);

    const actualDate = document.getElementById("actual-return-date");
    if (actualDate) actualDate.addEventListener("change", updateReturnCalculations);

    const damageFee = document.getElementById("damage-fee");
    if (damageFee) damageFee.addEventListener("input", updateReturnCalculations);
});