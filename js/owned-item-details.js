const API_URL = "http://127.0.0.1:8000/api/";

const returnItemModal = document.getElementById("return-item-modal");
const returnItemBtn = document.getElementById("return-item-btn");
const closeReturnItemModalBtn = document.getElementById("close-return-item-modal");
const returnItemForm = document.getElementById("return-item-form");

const actualReturnDateInput = document.getElementById("actual-return-date");
const damageFeeInput = document.getElementById("damage-fee");
const latePenaltyFeeInput = document.getElementById("late-penalty-fee");
const refundAmountInput = document.getElementById("refund-amount");
const expectedReturnDateDisplay = document.getElementById("expected-return-date-display");

let selectedItem = null;

function getItemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

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

function updateReturnCalculations() {
    if (!selectedItem) return;

    const securityDeposit = parseFloat(selectedItem.security_deposit || 0);
    const damageFee = parseFloat(damageFeeInput.value || 0);
    const expectedReturnDate = selectedItem.expected_return_date;
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

function openReturnItemModal() {
    if (!selectedItem) return;

    expectedReturnDateDisplay.textContent = formatDate(selectedItem.expected_return_date);
    actualReturnDateInput.value = "";
    damageFeeInput.value = "0";
    latePenaltyFeeInput.value = "0.00";
    refundAmountInput.value = parseFloat(selectedItem.security_deposit || 0).toFixed(2);

    returnItemModal.style.display = "block";
}

function closeReturnItemModal() {
    returnItemModal.style.display = "none";
    returnItemForm.reset();
    expectedReturnDateDisplay.textContent = "N/A";
    latePenaltyFeeInput.value = "0.00";
    refundAmountInput.value = "0.00";
}

async function getItemDetails() {
    const itemId = getItemIdFromUrl();
    console.log("itemId from URL:", itemId);

    if (!itemId) {
        alert("No item ID found.");
        return;
    }

    try {
        const response = await fetch(API_URL + `items/${itemId}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        console.log("details response status:", response.status);

        const data = await response.json();
        console.log("details response data:", data);

        if (!response.ok) {
            alert(data.detail || "Failed to load item details.");
            return;
        }

        selectedItem = data;

        document.getElementById("item-name").textContent = data.name || "N/A";
        document.getElementById("item-category").textContent = data.category_name || "N/A";
        document.getElementById("item-description").textContent = data.description || "N/A";
        document.getElementById("item-condition").textContent = data.condition || "N/A";
        document.getElementById("item-security-deposit").textContent = data.security_deposit || "N/A";
        document.getElementById("item-note").textContent = data.note || "N/A";
        document.getElementById("item-borrowing-fee").textContent = data.borrowingFee || "N/A";
        document.getElementById("item-status").textContent = data.status || "N/A";
        document.getElementById("item-owner").textContent = data.owner_name || "N/A";

        const expectedReturnDateElement = document.getElementById("item-expected-return-date");

        if (data.status === "BORROWED") {
            expectedReturnDateElement.textContent = formatDate(data.expected_return_date);
            returnItemBtn.style.display = "inline-block";
        } else {
            expectedReturnDateElement.textContent = "N/A";
            returnItemBtn.style.display = "none";
        }
    } catch (error) {
        console.log("getItemDetails error:", error);
        alert("Something went wrong while loading item details.");
    }
}

if (returnItemBtn) {
    returnItemBtn.addEventListener("click", openReturnItemModal);
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

        if (!selectedItem) {
            alert("No selected item.");
            return;
        }

        const actualReturnDate = actualReturnDateInput.value;
        const damageFee = damageFeeInput.value;

        try {
            const response = await fetch(API_URL + `items/${selectedItem.id}/return/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    actualReturnDate,
                    damageFee
                })
            });

            const data = await response.json();
            console.log("Return form response:", data);

            if (response.ok) {
                alert(data.message || "Return form created successfully.");
                closeReturnItemModal();
                await getItemDetails();
            } else {
                alert(JSON.stringify(data));
            }
        } catch (error) {
            console.log("return submit error:", error);
            alert("Something went wrong while submitting the return form.");
        }
    });
}

document.addEventListener("DOMContentLoaded", getItemDetails);