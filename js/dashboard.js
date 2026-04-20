const DASHBOARD_API_URL = window.API_URL || "http://127.0.0.1:8000/api/";

let selectedItemId = null;
let toastTimeout = null;

const itemDetailsModal = document.getElementById("item-details-modal");
const closeItemDetailsModalBtn = document.getElementById("close-item-details-modal");
const showBorrowFormBtn = document.getElementById("show-borrow-form-btn");
const cancelBorrowFormBtn = document.getElementById("cancel-borrow-form");
const borrowForm = document.getElementById("borrow-form");

const borrowedInfoCard = document.getElementById("borrowed-info-card");
const borrowedDisabledBtn = document.getElementById("borrowed-disabled-btn");

/* =========================
   DATE HELPERS
========================= */
function formatDateTime(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
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

/* =========================
   TOAST
========================= */
function showToast(message = "Success", type = "success") {
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

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function hideToast() {
    const toast = document.getElementById("toast-message");
    if (toast) {
        toast.classList.remove("show");
    }
}

window.hideToast = hideToast;

/* =========================
   CATEGORY NAV
========================= */
function goToCategory(category) {
    window.location.href = `browse-items.html?category=${category}`;
}

window.goToCategory = goToCategory;

/* =========================
   CARD TEMPLATE
========================= */
function createCard(item) {
    const isBorrowed = item.status === "BORROWED";

    return `
        <div class="card">
            <div class="card-img"></div>

            <div class="card-body">
                <h4>${item.name || "No Name"}</h4>

                <p class="owner">
                    <i class="fa fa-user"></i> ${item.owner_name || "Unknown"}
                </p>

                <p class="${item.status === "AVAILABLE" ? "available" : "borrowed"}">
                    ${item.status || "N/A"}
                </p>

                ${
                    isBorrowed
                        ? `<p>Return: ${formatDateTime(item.expected_return_date)}</p>`
                        : ""
                }

                <button onclick="openItemDetailsModal(${item.id})">
                    View Details
                </button>
            </div>
        </div>
    `;
}

/* =========================
   DETAILS MODAL
========================= */
async function openItemDetailsModal(itemId) {
    selectedItemId = itemId;

    if (borrowForm) {
        borrowForm.reset();
        borrowForm.style.display = "none";
    }

    if (borrowedInfoCard) borrowedInfoCard.style.display = "none";
    if (borrowedDisabledBtn) borrowedDisabledBtn.style.display = "none";
    if (showBorrowFormBtn) showBorrowFormBtn.style.display = "block";

    if (itemDetailsModal) {
        itemDetailsModal.classList.add("show");
    }

    await getItemDetails(itemId);
}

function closeItemDetailsModal() {
    selectedItemId = null;

    if (itemDetailsModal) {
        itemDetailsModal.classList.remove("show");
    }

    if (borrowForm) {
        borrowForm.reset();
        borrowForm.style.display = "none";
    }

    if (borrowedInfoCard) borrowedInfoCard.style.display = "none";
    if (borrowedDisabledBtn) borrowedDisabledBtn.style.display = "none";
    if (showBorrowFormBtn) showBorrowFormBtn.style.display = "block";
}

window.openItemDetailsModal = openItemDetailsModal;

async function getItemDetails(itemId) {
    try {
        const response = await fetch(DASHBOARD_API_URL + `items/${itemId}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        console.log("Item details:", data);

        if (!response.ok) {
            showToast(data.detail || "Failed to load item details.", "error");
            closeItemDetailsModal();
            return;
        }

        const modalItemName = document.getElementById("modal-item-name");
        const modalItemCategory = document.getElementById("modal-item-category");
        const modalItemDescription = document.getElementById("modal-item-description");
        const modalItemCondition = document.getElementById("modal-item-condition");
        const modalItemSecurityDeposit = document.getElementById("modal-item-security-deposit");
        const modalItemNote = document.getElementById("modal-item-note");
        const modalItemBorrowingFee = document.getElementById("modal-item-borrowing-fee");
        const modalItemStatus = document.getElementById("modal-item-status");
        const modalItemOwner = document.getElementById("modal-item-owner");
        const modalItemExpectedReturnDate = document.getElementById("modal-item-expected-return-date");
        const imageBox = document.getElementById("modal-item-image");

        if (modalItemName) modalItemName.textContent = data.name || "N/A";
        if (modalItemCategory) modalItemCategory.textContent = data.category_name || "Uncategorized";
        if (modalItemDescription) modalItemDescription.textContent = data.description || "No description added.";
        if (modalItemCondition) modalItemCondition.textContent = data.condition || "N/A";
        if (modalItemSecurityDeposit) modalItemSecurityDeposit.textContent = data.security_deposit || "0";
        if (modalItemNote) modalItemNote.textContent = data.note || "No note added.";
        if (modalItemBorrowingFee) modalItemBorrowingFee.textContent = data.borrowingFee || "0";

        if (modalItemStatus) {
            modalItemStatus.textContent = data.status || "N/A";
            modalItemStatus.style.color = data.status === "AVAILABLE" ? "#2e7d32" : "#ea580c";
            modalItemStatus.style.fontWeight = "700";
        }

        if (modalItemOwner) modalItemOwner.textContent = data.owner_name || "N/A";

        const imageUrl = data.imageUrl || data.image || "";
        if (imageBox) {
            if (imageUrl) {
                imageBox.style.backgroundImage = `url('${imageUrl}')`;
            } else {
                imageBox.style.backgroundImage =
                    "linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08)), linear-gradient(135deg, #dcdcdc, #cfcfcf)";
            }
        }

        if (data.status === "BORROWED") {
            if (modalItemExpectedReturnDate) {
                modalItemExpectedReturnDate.textContent = formatDate(data.expected_return_date);
            }

            if (borrowedInfoCard) borrowedInfoCard.style.display = "flex";
            if (showBorrowFormBtn) showBorrowFormBtn.style.display = "none";
            if (borrowedDisabledBtn) borrowedDisabledBtn.style.display = "block";
            if (borrowForm) borrowForm.style.display = "none";
        } else {
            if (modalItemExpectedReturnDate) {
                modalItemExpectedReturnDate.textContent = "N/A";
            }

            if (borrowedInfoCard) borrowedInfoCard.style.display = "none";
            if (showBorrowFormBtn) showBorrowFormBtn.style.display = "block";
            if (borrowedDisabledBtn) borrowedDisabledBtn.style.display = "none";
        }
    } catch (error) {
        console.log("Item details error:", error);
        showToast("Something went wrong.", "error");
        closeItemDetailsModal();
    }
}

/* =========================
   LOADERS
========================= */
async function getAllItems() {
    const container = document.getElementById("items");
    if (!container) return;

    try {
        const res = await fetch(DASHBOARD_API_URL + "items/allitems/dashboard/", {
            credentials: "include"
        });

        const data = await res.json();
        console.log("All items response:", data);

        if (!res.ok) {
            container.innerHTML = "<p>Failed to load items.</p>";
            return;
        }

        if (!Array.isArray(data)) {
            container.innerHTML = "<p>No items found.</p>";
            return;
        }

        let html = "";
        data.forEach(item => {
            html += createCard(item);
        });

        container.innerHTML = html || "<p>No items found.</p>";
    } catch (err) {
        console.error("Error fetching all items:", err);
        container.innerHTML = "<p>Something went wrong.</p>";
    }
}

async function getLatestItems() {
    const container = document.getElementById("latest-items");
    if (!container) return;

    try {
        const res = await fetch(DASHBOARD_API_URL + "items/latest/", {
            credentials: "include"
        });

        const data = await res.json();
        console.log("Latest items response:", data);

        if (!res.ok) {
            container.innerHTML = "<p>Failed to load latest items.</p>";
            return;
        }

        if (!Array.isArray(data)) {
            container.innerHTML = "<p>No latest items found.</p>";
            return;
        }

        let html = "";
        data.forEach(item => {
            html += createCard(item);
        });

        container.innerHTML = html || "<p>No latest items found.</p>";
    } catch (err) {
        console.error("Error fetching latest items:", err);
        container.innerHTML = "<p>Something went wrong.</p>";
    }
}

/* =========================
   SEARCH REDIRECT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");

    if (searchInput) {
        searchInput.addEventListener("focus", () => {
            const value = searchInput.value.trim();

            if (value) {
                window.location.href = `browse-items.html?category=all&search=${encodeURIComponent(value)}`;
            } else {
                window.location.href = "browse-items.html?category=all";
            }
        });
    }
});

/* =========================
   MODAL EVENTS
========================= */
if (closeItemDetailsModalBtn) {
    closeItemDetailsModalBtn.addEventListener("click", closeItemDetailsModal);
}

if (itemDetailsModal) {
    itemDetailsModal.addEventListener("click", (e) => {
        if (e.target === itemDetailsModal) {
            closeItemDetailsModal();
        }
    });
}

if (showBorrowFormBtn && borrowForm) {
    showBorrowFormBtn.addEventListener("click", () => {
        borrowForm.style.display = "block";
    });
}

if (cancelBorrowFormBtn && borrowForm) {
    cancelBorrowFormBtn.addEventListener("click", () => {
        borrowForm.reset();
        borrowForm.style.display = "none";
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && itemDetailsModal?.classList.contains("show")) {
        closeItemDetailsModal();
    }
});

/* =========================
   BORROW FORM SUBMIT
========================= */
if (borrowForm) {
    borrowForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!selectedItemId) {
            showToast("No item selected.", "error");
            return;
        }

        const startDate = document.getElementById("start-date")?.value;
        const returnDate = document.getElementById("return-date")?.value;

        try {
            const response = await fetch(DASHBOARD_API_URL + `items/${selectedItemId}/borrow/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    startDate,
                    returnDate
                })
            });

            const data = await response.json();
            console.log("Borrow response:", data);

            if (response.ok) {
                showToast(data.message || "Borrow request submitted successfully.", "success");
                borrowForm.reset();
                closeItemDetailsModal();
                await getAllItems();
                await getLatestItems();
            } else {
                showToast(data.detail || JSON.stringify(data) || "Failed to borrow item.", "error");
            }
        } catch (error) {
            console.log("Borrow error:", error);
            showToast("Something went wrong.", "error");
        }
    });
}

/* =========================
   INITIAL LOAD
========================= */
getAllItems();
getLatestItems();

if (typeof getAllUserItems === "function") {
    getAllUserItems();
}