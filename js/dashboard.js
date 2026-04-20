const DASHBOARD_API_URL =
    window.API_URL ||
    (typeof API_URL !== "undefined" ? API_URL : "http://127.0.0.1:8000/api/");

const DASHBOARD_BASE_URL = "http://127.0.0.1:8000";

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
   URL / IMAGE HELPERS
========================= */
function normalizeMediaUrl(url) {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${DASHBOARD_BASE_URL}${url}`;
    }

    return url;
}

function getOwnerImage(item) {
    if (item?.owner_image) return normalizeMediaUrl(item.owner_image);
    if (item?.owner?.image) return normalizeMediaUrl(item.owner.image);
    return "";
}

function getOwnerInitials(item) {
    const ownerName = item?.owner_name || item?.owner?.name || "U";
    return ownerName
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getItemImage(item) {
    if (item?.images && item.images.length > 0 && item.images[0]?.image) {
        return normalizeMediaUrl(item.images[0].image);
    }

    if (item?.imageUrl) return normalizeMediaUrl(item.imageUrl);
    if (item?.image) return normalizeMediaUrl(item.image);

    return "./images/default-item.png";
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
window.showToast = showToast;

/* =========================
   USER
========================= */
function setAvatar(elementId, user) {
    const el = document.getElementById(elementId);

    if (!el) return;

    if (user.image) {
        el.innerHTML = `<img src="${normalizeMediaUrl(user.image)}" alt="Profile Image" />`;
    } else {
        const initials = user.name
            ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
            : "U";

        el.innerHTML = `<span>${initials}</span>`;
    }

    el.addEventListener("click", () => {
        window.location.href = "profile.html";
    });
}

async function loadCurrentUser() {
    try {
        const res = await fetch(DASHBOARD_API_URL + "users/me/", {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Failed to load current user:", data);
            return;
        }

        const username = document.getElementById("username");
        if (username) {
            username.textContent = data.name || "User";
        }

        setAvatar("dashboard-avatar", data);
        setAvatar("browse-avatar", data);
    } catch (err) {
        console.error("Error fetching user:", err);
    }
}

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
    const imageUrl = getItemImage(item);
    const ownerImage = getOwnerImage(item);
    const ownerName = item.owner_name || item?.owner?.name || "Unknown";

    return `
        <div class="card">
            <div class="card-img" style="background-image: url('${imageUrl}')"></div>

            <div class="card-body">
                <h4>${item.name || "No Name"}</h4>

                <div class="owner">
                    ${
                        ownerImage
                            ? `<img src="${ownerImage}" alt="${ownerName}" class="owner-avatar-img">`
                            : `<div class="owner-avatar-fallback">${getOwnerInitials(item)}</div>`
                    }
                    <span>${ownerName}</span>
                </div>

                ${
                    isBorrowed
                        ? `<p class="borrowed-until">Borrowed until ${formatDate(item.expected_return_date)}</p>`
                        : `<p class="available">Available</p>`
                }

                <button onclick="openItemDetailsModal(${item.id})">
                    View Details
                </button>
            </div>
        </div>
    `;
}

/* =========================
   ITEM DETAILS MODAL
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
        if (modalItemOwner) modalItemOwner.textContent = data.owner_name || "N/A";

        if (modalItemStatus) {
            modalItemStatus.textContent = data.status || "N/A";
            modalItemStatus.style.color = data.status === "AVAILABLE" ? "#2e7d32" : "#ea580c";
            modalItemStatus.style.fontWeight = "700";
        }

        if (imageBox) {
            const detailImageUrl = getItemImage(data);

            if (detailImageUrl) {
                imageBox.style.backgroundImage = `url('${detailImageUrl}')`;
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
        console.error("Item details error:", error);
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

        if (!res.ok) {
            container.innerHTML = "<p>Failed to load items.</p>";
            return;
        }

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = "<p>No items found.</p>";
            return;
        }

        let html = "";
        data.slice(0, 8).forEach(item => {
            html += createCard(item);
        });

        container.innerHTML = html;
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

        if (!res.ok) {
            container.innerHTML = "<p>Failed to load latest items.</p>";
            return;
        }

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = "<p>No latest items found.</p>";
            return;
        }

        let html = "";
        data.slice(0, 4).forEach(item => {
            html += createCard(item);
        });

        container.innerHTML = html;
    } catch (err) {
        console.error("Error fetching latest items:", err);
        container.innerHTML = "<p>Something went wrong.</p>";
    }
}

/* =========================
   SEARCH REDIRECT
========================= */
function setupSearchRedirect() {
    const searchInput = document.getElementById("search-input");

    if (!searchInput) return;

    searchInput.addEventListener("focus", () => {
        const value = searchInput.value.trim();

        if (value) {
            window.location.href = `browse-items.html?category=all&search=${encodeURIComponent(value)}`;
        } else {
            window.location.href = "browse-items.html?category=all";
        }
    });
}

/* =========================
   MODAL EVENTS
========================= */
function setupModalEvents() {
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
}

/* =========================
   BORROW FORM SUBMIT
========================= */
function setupBorrowForm() {
    if (!borrowForm) return;

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

            if (response.ok) {
                showToast(data.message || "Borrow request submitted successfully.", "success");
                borrowForm.reset();
                closeItemDetailsModal();
                await getAllItems();
                await getLatestItems();
            } else {
                showToast(data.detail || "Failed to borrow item.", "error");
            }
        } catch (error) {
            console.error("Borrow error:", error);
            showToast("Something went wrong.", "error");
        }
    });
}

/* =========================
   INITIAL LOAD
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    setupSearchRedirect();
    setupModalEvents();
    setupBorrowForm();

    await loadCurrentUser();
    await getAllItems();
    await getLatestItems();

    if (typeof getAllUserItems === "function") {
        getAllUserItems();
    }
});