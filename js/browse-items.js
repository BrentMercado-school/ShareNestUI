const BROWSE_API_URL =
    window.API_URL ||
    (typeof API_URL !== "undefined" ? API_URL : "http://127.0.0.1:8000/api/");

const BROWSE_BASE_URL = "http://127.0.0.1:8000";

const browseTitle = document.getElementById("browse-title");
const browseDescription = document.getElementById("browse-description");
const container = document.getElementById("browse-items");
const searchInput = document.getElementById("search-input");

const itemDetailsModal = document.getElementById("item-details-modal");
const closeItemDetailsModalBtn = document.getElementById("close-item-details-modal");
const showBorrowFormBtn = document.getElementById("show-borrow-form-btn");
const cancelBorrowFormBtn = document.getElementById("cancel-borrow-form");
const borrowForm = document.getElementById("borrow-form");
const borrowedInfoCard = document.getElementById("borrowed-info-card");
const borrowedDisabledBtn = document.getElementById("borrowed-disabled-btn");

let allItems = [];
let currentSearch = "";
let currentCategory = "all";
let selectedItemId = null;
let toastTimeout = null;

const CATEGORY_CONFIG = {
    all: {
        title: "All Items",
        description: "Display all items",
        endpoint: "items/allitems/dashboard/"
    },
    sports: {
        title: "Sports",
        description: "Display sports items",
        endpoint: "items/sports/"
    },
    electronics: {
        title: "Tech",
        description: "Display tech items",
        endpoint: "items/electronics/"
    },
    books: {
        title: "Books",
        description: "Display book items",
        endpoint: "items/books/"
    },
    music: {
        title: "Music",
        description: "Display music items",
        endpoint: "items/music/"
    },
    outdoor: {
        title: "Outdoor",
        description: "Display outdoor items",
        endpoint: "items/outdoor/"
    },
    appliance: {
        title: "Appliances",
        description: "Display appliance items",
        endpoint: "items/appliance/"
    }
};

/* =========================
   HELPERS
========================= */
function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

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

function normalizeMediaUrl(url) {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${BROWSE_BASE_URL}${url}`;
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

function highlightText(text, query) {
    if (!query) return text;

    const words = query
        .toLowerCase()
        .trim()
        .split(" ")
        .filter(word => word.length > 0);

    let highlighted = text;

    words.forEach(word => {
        const regex = new RegExp(`(${word})`, "gi");
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
    if (toast) {
        toast.classList.remove("show");
    }
}

window.hideToast = hideToast;

/* =========================
   USER AVATAR
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

async function loadUserAvatar() {
    try {
        const res = await fetch(BROWSE_API_URL + "users/me/", {
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Failed to load browse user:", data);
            return;
        }

        setAvatar("browse-avatar", data);
        setAvatar("dashboard-avatar", data);
    } catch (err) {
        console.error(err);
    }
}

/* =========================
   CARD
========================= */
function createCard(item) {
    const isBorrowed = item.status === "BORROWED";
    const imageUrl = getItemImage(item);

    return `
        <div class="card">
            <div class="card-img" style="background-image: url('${imageUrl}')"></div>

            <div class="card-body">
                <h4>${highlightText(item.name || "No Name", currentSearch)}</h4>

                <p class="owner">
                    <i class="fa fa-user"></i> ${item.owner_name || "Unknown"}
                </p>

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

function renderItems(items) {
    const searchValue = searchInput ? searchInput.value : "";

    if (!items.length) {
        container.innerHTML = `
            <p style="padding:20px;">
                No results found ${searchValue ? `for "${searchValue}"` : ""}
            </p>
        `;
        return;
    }

    let html = "";
    items.forEach(item => {
        html += createCard(item);
    });

    container.innerHTML = html;
}

function filterItems(query) {
    currentSearch = query.toLowerCase().trim();

    if (!currentSearch) {
        return allItems;
    }

    const words = currentSearch
        .split(" ")
        .filter(word => word.length > 0);

    return allItems.filter(item => {
        const itemName = item.name?.toLowerCase() || "";
        return words.some(word => itemName.includes(word));
    });
}

function updateSearchDescription() {
    if (!browseDescription) return;

    const config = CATEGORY_CONFIG[currentCategory];

    if (currentSearch) {
        browseDescription.textContent = `Results for "${currentSearch}"`;
    } else {
        browseDescription.textContent = config?.description || "Display all items";
    }
}

function updateUrlSearch(value) {
    const params = new URLSearchParams(window.location.search);
    params.set("category", currentCategory);

    if (value) {
        params.set("search", value);
    } else {
        params.delete("search");
    }

    window.history.replaceState({}, "", `?${params.toString()}`);
}

/* =========================
   NAV
========================= */
function goToCategory(category) {
    window.location.href = `browse-items.html?category=${category}`;
}

window.goToCategory = goToCategory;

/* =========================
   LOAD CATEGORY ITEMS
========================= */
async function loadCategoryItems(categoryKey) {
    const config = CATEGORY_CONFIG[categoryKey];
    if (!config) return;

    currentCategory = categoryKey;

    if (browseTitle) browseTitle.textContent = config.title;
    if (browseDescription) browseDescription.textContent = config.description || "";

    try {
        const res = await fetch(BROWSE_API_URL + config.endpoint, {
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            container.innerHTML = "<p>Error loading items</p>";
            return;
        }

        allItems = Array.isArray(data) ? data : [];
        renderItems(allItems);
    } catch (err) {
        console.error("loadCategoryItems error:", err);
        container.innerHTML = "<p>Failed to load items</p>";
    }
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

window.openItemDetailsModal = openItemDetailsModal;

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

async function getItemDetails(itemId) {
    try {
        const response = await fetch(BROWSE_API_URL + `items/${itemId}/`, {
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
        console.error("Browse item details error:", error);
        showToast("Something went wrong.", "error");
        closeItemDetailsModal();
    }
}

/* =========================
   EVENT SETUP
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
            const response = await fetch(BROWSE_API_URL + `items/${selectedItemId}/borrow/`, {
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

                await loadCategoryItems(currentCategory);

                const filtered = filterItems(searchInput?.value || "");
                renderItems(filtered);
                updateSearchDescription();
            } else {
                showToast(data.detail || "Failed to borrow item.", "error");
            }
        } catch (error) {
            console.error("Browse borrow error:", error);
            showToast("Something went wrong.", "error");
        }
    });
}

function highlightActiveCategory(category) {
    const buttons = document.querySelectorAll(".categories button");

    buttons.forEach(btn => {
        const text = btn.textContent.toLowerCase();

        if (
            text === category ||
            (category === "electronics" && text === "tech") ||
            (category === "appliance" && text === "appliances")
        ) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

/* =========================
   INITIAL LOAD
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    setupModalEvents();
    setupBorrowForm();
    await loadUserAvatar();

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "all";
    const search = params.get("search") || "";

    await loadCategoryItems(category);

    if (searchInput) {
        searchInput.value = search;
        currentSearch = search.toLowerCase().trim();

        const filtered = filterItems(search);
        renderItems(filtered);
        updateSearchDescription();

        if (search) {
            searchInput.focus();
        }

        searchInput.addEventListener("input", () => {
            const filteredItems = filterItems(searchInput.value);
            renderItems(filteredItems);
            updateSearchDescription();
            updateUrlSearch(searchInput.value.trim());
        });
    }

    highlightActiveCategory(category);
});