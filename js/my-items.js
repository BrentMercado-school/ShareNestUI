const MY_ITEMS_API_URL = window.API_URL || "http://127.0.0.1:8000/api/";

const MY_ITEMS_BASE_URL = "http://127.0.0.1:8000";

const myItemsList = document.getElementById("my-items-list");
const myItemsSearch = document.getElementById("my-items-search");
const myItemsFilterNote = document.getElementById("my-items-filter-note");

const deleteItemModal = document.getElementById("delete-item-modal");
const deleteItemName = document.getElementById("delete-item-name");
const cancelDeleteItemBtn = document.getElementById("cancel-delete-item");
const confirmDeleteItemBtn = document.getElementById("confirm-delete-item");

const returnItemModal = document.getElementById("return-item-modal");
const cancelReturnBtn = document.getElementById("cancel-return-btn");
const confirmReturnBtn = document.getElementById("confirm-return-btn");
const actualReturnDateInput = document.getElementById("actual-return-date");
const damageFeeInput = document.getElementById("damage-fee");

let selectedReturnItem = null;

const LATE_PENALTY_PER_DAY = 50; 

let pendingDeleteItemId = null;

let ownedItems = [];
let currentFilter = "all";
let currentSearch = "";
let toastTimeout = null;

/* =========================
   HELPERS
========================= */
function formatLongDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function getInitials(name = "U") {
    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getDaysLate(expectedReturnDate, actualReturnDate) {
    if (!expectedReturnDate || !actualReturnDate) return 0;

    const expected = new Date(expectedReturnDate);
    const actual = new Date(actualReturnDate);

    expected.setHours(0, 0, 0, 0);
    actual.setHours(0, 0, 0, 0);

    const diff = actual - expected;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
}

function updateReturnSummary() {
    if (!selectedReturnItem) return;

    const securityDeposit =
        Number(
            selectedReturnItem.securityDepositSnapshot ??
            selectedReturnItem.security_deposit ??
            0
        );

    const damageFee = Number(damageFeeInput?.value || 0);
    const actualReturnDate = actualReturnDateInput?.value || "";
    const expectedReturnDate = selectedReturnItem.expected_return_date;

    const daysLate = getDaysLate(expectedReturnDate, actualReturnDate);
    const latePenalty = daysLate * LATE_PENALTY_PER_DAY;
    const refundAmount = Math.max(0, securityDeposit - damageFee - latePenalty);

    document.getElementById("summary-security-deposit").textContent = `₱${formatMoney(securityDeposit)}`;
    document.getElementById("summary-damage-fee").textContent = `-₱${formatMoney(damageFee)}`;
    document.getElementById("summary-penalty-label").textContent = `Penalties (${daysLate} day${daysLate !== 1 ? "s" : ""} late)`;
    document.getElementById("summary-late-penalty").textContent = `-₱${formatMoney(latePenalty)}`;
    document.getElementById("summary-refund-amount").textContent = `₱${formatMoney(refundAmount)}`;

    return {
        daysLate,
        latePenalty,
        refundAmount,
        damageFee,
        actualReturnDate
    };
}

function normalizeMediaUrl(url) {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${MY_ITEMS_BASE_URL}${url}`;
    }

    return url;
}

function getItemImage(item) {
    if (item?.images && item.images.length > 0) {
        const primaryImage = item.images.find(img => img.isPrimary && img.image);

        if (primaryImage) {
            return normalizeMediaUrl(primaryImage.image);
        }

        if (item.images[0]?.image) {
            return normalizeMediaUrl(item.images[0].image);
        }
    }

    if (item?.imageUrl) return normalizeMediaUrl(item.imageUrl);
    if (item?.image) return normalizeMediaUrl(item.image);

    return "./images/default-item.png";
}

function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatMoney(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString("en-PH");
}

function escapeHtml(text = "") {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function highlightText(text, query) {
    if (!query) return escapeHtml(text);

    const safeText = escapeHtml(text);
    const words = query
        .toLowerCase()
        .trim()
        .split(" ")
        .filter(word => word.length > 0);

    let highlighted = safeText;

    words.forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        highlighted = highlighted.replace(regex, "<mark>$1</mark>");
    });

    return highlighted;
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
    if (toast) toast.classList.remove("show");
}

window.showToast = showToast;
window.hideToast = hideToast;

/* =========================
   CURRENT USER
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
        const res = await fetch(MY_ITEMS_API_URL + "users/me/", {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) return;

        const username = document.getElementById("my-items-username");
        if (username) {
            username.textContent = data.name || "My Items";
        }

        setAvatar("my-items-avatar", data);
    } catch (err) {
        console.error("Error fetching current user:", err);
    }
}

/* =========================
   FILTER + SEARCH
========================= */
function setOwnedFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll(".categories button").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === filter);
    });

    renderOwnedItems();
}

window.setOwnedFilter = setOwnedFilter;

function getFilteredItems() {
    let items = [...ownedItems];

    if (currentFilter === "available") {
        items = items.filter(item => item.status === "AVAILABLE");
    } else if (currentFilter === "borrowed") {
        items = items.filter(item => item.status === "BORROWED");
    } else if (currentFilter === "latest") {
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    if (currentSearch) {
        const words = currentSearch
            .split(" ")
            .filter(word => word.length > 0);

        items = items.filter(item => {
            const haystack = [
                item.name,
                item.category_name,
                item.condition,
                item.note,
                item.description
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return words.every(word => haystack.includes(word));
        });
    }

    return items;
}

function updateFilterNote(count) {
    const filterLabelMap = {
        all: "All",
        available: "Available",
        borrowed: "Borrowed",
        latest: "Latest"
    };

    const label = filterLabelMap[currentFilter] || "All";

    if (!myItemsFilterNote) return;

    if (currentSearch) {
        myItemsFilterNote.textContent = `Filtered: ${label} • Search: "${currentSearch}" • ${count} result${count !== 1 ? "s" : ""}`;
    } else {
        myItemsFilterNote.textContent = `Filtered: ${label}`;
    }
}

/* =========================
   CARD RENDER
========================= */
function createOwnedItemCard(item) {
    const imageUrl = getItemImage(item);
    const isBorrowed = item.status === "BORROWED";

    const showReturnButton = currentFilter === "borrowed" && isBorrowed;
    const showManageButtons = currentFilter !== "borrowed";

    return `
        <article class="my-item-card">
            <div class="my-item-thumb" style="background-image: url('${imageUrl}')"></div>

            <div class="my-item-content">
                <div class="my-item-header">
                    <div>
                        <h3 class="my-item-title">${highlightText(item.name || "No Name", currentSearch)}</h3>
                        <p class="my-item-meta">
                            ${escapeHtml(item.category_name || "Uncategorized")} • ${escapeHtml(item.condition || "No condition")}
                        </p>
                    </div>

                    <div class="my-item-actions">
                        ${
                            showReturnButton
                                ? `<button type="button" class="my-item-return-btn" onclick="openReturnItemModal(${item.id})">Return</button>`
                                : ``
                        }

                        ${
                            showManageButtons
                                ? `
                                    <button type="button" class="my-item-icon-btn" onclick="handleEditItem(${item.id})" aria-label="Edit item">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>

                                    <button type="button" class="my-item-icon-btn delete" onclick="handleDeleteItem(${item.id})" aria-label="Delete item">
                                        <i class="fa-regular fa-trash-can"></i>
                                    </button>
                                `
                                : ``
                        }
                    </div>
                </div>

                <p class="my-item-deposit">Deposit: ₱${formatMoney(item.security_deposit)}</p>

                <div class="my-item-status-row">
                    ${
                        isBorrowed
                            ? `<p class="borrowed-until">Borrowed until ${formatDate(item.expected_return_date)}</p>`
                            : `<p class="available">Available</p>`
                    }
                </div>
            </div>
        </article>
    `;
}

function renderOwnedItems() {
    if (!myItemsList) return;

    const filteredItems = getFilteredItems();
    updateFilterNote(filteredItems.length);

    if (!filteredItems.length) {
        myItemsList.innerHTML = `
            <div class="my-item-empty">
                No items found${currentSearch ? ` for "${escapeHtml(currentSearch)}"` : ""}.
            </div>
        `;
        return;
    }

    myItemsList.innerHTML = filteredItems
        .map(item => createOwnedItemCard(item))
        .join("");
}
function populateReturnModal(item) {
    selectedReturnItem = item;

    const borrowerName = item.borrower_name || "Unknown Borrower";
    const borrowerEmail = item.borrower_email || "N/A";
    const borrowerAddress = item.borrower_address || "N/A";
    const borrowerImage = item.borrower_image ? normalizeMediaUrl(item.borrower_image) : "";

    const borrowerAvatar = document.getElementById("return-borrower-avatar");
    if (borrowerAvatar) {
        if (borrowerImage) {
            borrowerAvatar.innerHTML = `<img src="${borrowerImage}" alt="${borrowerName}">`;
        } else {
            borrowerAvatar.textContent = getInitials(borrowerName);
        }
    }

    document.getElementById("return-borrower-name").textContent = borrowerName;
    document.getElementById("return-borrower-email").textContent = borrowerEmail;
    document.getElementById("return-borrower-address-text").textContent = borrowerAddress;

    document.getElementById("return-item-name").textContent = item.name || "Item";
    document.getElementById("return-item-category").textContent = item.category_name || "Category";
    document.getElementById("return-item-condition").textContent = `Condition: ${item.condition || "N/A"}`;
    document.getElementById("return-item-security-deposit-text").textContent =
        `Security Deposit: ₱${formatMoney(item.securityDepositSnapshot ?? item.security_deposit ?? 0)}`;

    const returnItemImage = document.getElementById("return-item-image");
    if (returnItemImage) {
        returnItemImage.style.backgroundImage = `url('${getItemImage(item)}')`;
    }

    document.getElementById("return-start-date").textContent =
        formatLongDate(item.startDate || item.start_date || item.borrow_start_date || "");
    document.getElementById("return-expected-date").textContent =
        formatLongDate(item.expected_return_date || "");
    document.getElementById("return-borrowing-fee").textContent =
        `₱${formatMoney(item.borrowingFeeSnapshot ?? item.borrowingFee ?? 0)}`;
    document.getElementById("return-security-deposit").textContent =
        `₱${formatMoney(item.securityDepositSnapshot ?? item.security_deposit ?? 0)}`;

    if (actualReturnDateInput) {
        actualReturnDateInput.value = new Date().toISOString().split("T")[0];
    }

    if (damageFeeInput) {
        damageFeeInput.value = "";
    }

    updateReturnSummary();
}

function openReturnItemModal(itemId) {
    const item = ownedItems.find(entry => String(entry.id) === String(itemId));

    if (!item || !returnItemModal) return;

    populateReturnModal(item);
    returnItemModal.classList.add("show");
}

function closeReturnItemModal() {
    selectedReturnItem = null;

    if (returnItemModal) {
        returnItemModal.classList.remove("show");
    }
}

window.openReturnItemModal = openReturnItemModal;

if (cancelReturnBtn) {
    cancelReturnBtn.addEventListener("click", closeReturnItemModal);
}

if (returnItemModal) {
    returnItemModal.addEventListener("click", (e) => {
        if (e.target === returnItemModal) {
            closeReturnItemModal();
        }
    });
}

if (actualReturnDateInput) {
    actualReturnDateInput.addEventListener("input", updateReturnSummary);
}

if (damageFeeInput) {
    damageFeeInput.addEventListener("input", updateReturnSummary);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && returnItemModal?.classList.contains("show")) {
        closeReturnItemModal();
    }
});

/* =========================
   EDIT / DELETE WRAPPERS
========================= */
function handleEditItem(itemId) {
    if (typeof window.openEditItemModal === "function") {
        window.openEditItemModal(itemId);
        return;
    }

    if (typeof window.editItem === "function") {
        window.editItem(itemId);
        return;
    }

    console.warn("No edit handler found for item:", itemId);
}


function openDeleteItemModal(itemId) {
    const item = ownedItems.find(entry => String(entry.id) === String(itemId));

    if (!item || !deleteItemModal || !deleteItemName) return;

    pendingDeleteItemId = item.id;
    deleteItemName.textContent = `"${item.name || "Item"}"`;
    deleteItemModal.classList.add("show");
}

function closeDeleteItemModal() {
    pendingDeleteItemId = null;

    if (deleteItemModal) {
        deleteItemModal.classList.remove("show");
    }

    if (deleteItemName) {
        deleteItemName.textContent = `"Item"`;
    }
}

function handleDeleteItem(itemId) {
    openDeleteItemModal(itemId);
}

window.handleEditItem = handleEditItem;
window.handleDeleteItem = handleDeleteItem;

/* =========================
   LOAD OWNED ITEMS
========================= */
async function loadOwnedItems() {
    if (!myItemsList) return;

    try {
        const response = await fetch(MY_ITEMS_API_URL + "users/owned-items/", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            myItemsList.innerHTML = `<div class="my-item-empty">Failed to load items.</div>`;
            return;
        }

        ownedItems = Array.isArray(data) ? data : [];
        renderOwnedItems();
    } catch (error) {
        console.error("loadOwnedItems error:", error);
        myItemsList.innerHTML = `<div class="my-item-empty">Something went wrong.</div>`;
    }
}

window.getAllUserItems = loadOwnedItems;

if (cancelDeleteItemBtn) {
    cancelDeleteItemBtn.addEventListener("click", closeDeleteItemModal);
}

if (deleteItemModal) {
    deleteItemModal.addEventListener("click", (e) => {
        if (e.target === deleteItemModal) {
            closeDeleteItemModal();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && deleteItemModal?.classList.contains("show")) {
        closeDeleteItemModal();
    }
});

if (confirmDeleteItemBtn) {
    confirmDeleteItemBtn.addEventListener("click", async () => {
        if (!pendingDeleteItemId) return;

        try {
            const response = await fetch(
                MY_ITEMS_API_URL + `items/${pendingDeleteItemId}/delete/`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            let data = {};
            const rawText = await response.text();

            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                data = {};
            }

            if (response.ok) {
                closeDeleteItemModal();
                showToast(data.message || "Item deleted successfully.", "success");
                await loadOwnedItems();
            } else {
                closeDeleteItemModal();
                showToast(data.detail || data.message || "Failed to delete item.", "error");
            }
        } catch (error) {
            console.error("Delete item error:", error);
            closeDeleteItemModal();
            showToast("Something went wrong.", "error");
        }
    });
}

if (confirmReturnBtn) {
    confirmReturnBtn.addEventListener("click", async () => {
        if (!selectedReturnItem) {
            showToast("No return item selected.", "error");
            return;
        }

        const summary = updateReturnSummary();

        if (!summary || !summary.actualReturnDate) {
            showToast("Please select the actual return date.", "error");
            return;
        }

        try {
            // use this if your backend route is items/<id>/return/
            const endpoint = `${MY_ITEMS_API_URL}items/${selectedReturnItem.id}/return/`;

            console.log("selectedReturnItem:", selectedReturnItem);
            console.log("return endpoint:", endpoint);

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    actualReturnDate: summary.actualReturnDate,
                    damageFee: Number(summary.damageFee || 0),
                    latePenaltyFee: Number(summary.latePenalty || 0),
                    refundAmount: Number(summary.refundAmount || 0)
                })
            });

            const rawText = await response.text();
            console.log("return response status:", response.status);
            console.log("return response body:", rawText);

            let data = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                data = { detail: rawText || "Non-JSON response from server." };
            }

            if (response.ok) {
                closeReturnItemModal();
                showToast(data.message || "Return processed successfully.", "success");
                await loadOwnedItems();
            } else {
                showToast(
                    data.detail || data.message || `Failed to process return. (${response.status})`,
                    "error"
                );
            }
        } catch (error) {
            console.error("Return item error:", error);
            showToast("Something went wrong.", "error");
        }
    });
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    if (myItemsSearch) {
        myItemsSearch.addEventListener("input", () => {
            currentSearch = myItemsSearch.value.trim().toLowerCase();
            renderOwnedItems();
        });
    }

    await loadCurrentUser();
    await loadOwnedItems();
});