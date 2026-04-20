const MY_ITEMS_API_URL =
    window.API_URL ||
    (typeof API_URL !== "undefined" ? API_URL : "http://127.0.0.1:8000/api/");

const MY_ITEMS_BASE_URL = "http://127.0.0.1:8000";

const myItemsList = document.getElementById("my-items-list");
const myItemsSearch = document.getElementById("my-items-search");
const myItemsFilterNote = document.getElementById("my-items-filter-note");

let ownedItems = [];
let currentFilter = "all";
let currentSearch = "";
let toastTimeout = null;

/* =========================
   HELPERS
========================= */
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
    if (item?.images && item.images.length > 0 && item.images[0]?.image) {
        return normalizeMediaUrl(item.images[0].image);
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
                        <button type="button" class="my-item-icon-btn" onclick="handleEditItem(${item.id})" aria-label="Edit item">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button type="button" class="my-item-icon-btn delete" onclick="handleDeleteItem(${item.id})" aria-label="Delete item">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
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

function handleDeleteItem(itemId) {
    if (typeof window.deleteItem === "function") {
        window.deleteItem(itemId);
        return;
    }

    if (typeof window.removeItem === "function") {
        window.removeItem(itemId);
        return;
    }

    console.warn("No delete handler found for item:", itemId);
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