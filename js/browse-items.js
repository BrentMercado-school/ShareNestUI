const BROWSE_API_URL = window.API_URL || "http://127.0.0.1:8000/api/";

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

function createCard(item) {
    const isBorrowed = item.status === "BORROWED";

    return `
        <div class="card">
            <div class="card-img"></div>

            <div class="card-body">
                <h4>${highlightText(item.name || "No Name", currentSearch)}</h4>

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

function goToCategory(category) {
    window.location.href = `browse-items.html?category=${category}`;
}

window.goToCategory = goToCategory;

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
        console.log("Browse API data:", data);

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
        console.log("Browse item details:", data);

        if (!response.ok) {
            showToast(data.detail || "Failed to load item details.", "error");
            closeItemDetailsModal();
            return;
        }

        document.getElementById("modal-item-name").textContent = data.name || "N/A";
        document.getElementById("modal-item-category").textContent = data.category_name || "Uncategorized";
        document.getElementById("modal-item-description").textContent = data.description || "No description added.";
        document.getElementById("modal-item-condition").textContent = data.condition || "N/A";
        document.getElementById("modal-item-security-deposit").textContent = data.security_deposit || "0";
        document.getElementById("modal-item-note").textContent = data.note || "No note added.";
        document.getElementById("modal-item-borrowing-fee").textContent = data.borrowingFee || "0";
        document.getElementById("modal-item-owner").textContent = data.owner_name || "N/A";

        const modalStatus = document.getElementById("modal-item-status");
        if (modalStatus) {
            modalStatus.textContent = data.status || "N/A";
            modalStatus.style.color = data.status === "AVAILABLE" ? "#2e7d32" : "#ea580c";
            modalStatus.style.fontWeight = "700";
        }

        const imageBox = document.getElementById("modal-item-image");
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
            document.getElementById("modal-item-expected-return-date").textContent =
                formatDate(data.expected_return_date);

            if (borrowedInfoCard) borrowedInfoCard.style.display = "flex";
            if (showBorrowFormBtn) showBorrowFormBtn.style.display = "none";
            if (borrowedDisabledBtn) borrowedDisabledBtn.style.display = "block";
            if (borrowForm) borrowForm.style.display = "none";
        } else {
            document.getElementById("modal-item-expected-return-date").textContent = "N/A";

            if (borrowedInfoCard) borrowedInfoCard.style.display = "none";
            if (showBorrowFormBtn) showBorrowFormBtn.style.display = "block";
            if (borrowedDisabledBtn) borrowedDisabledBtn.style.display = "none";
        }
    } catch (error) {
        console.log("Browse item details error:", error);
        showToast("Something went wrong.", "error");
        closeItemDetailsModal();
    }
}

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
            console.log("Browse borrow response:", data);

            if (response.ok) {
                showToast(data.message || "Borrow request submitted successfully.", "success");
                borrowForm.reset();
                closeItemDetailsModal();

                await loadCategoryItems(currentCategory);

                const filtered = filterItems(searchInput?.value || "");
                renderItems(filtered);
                updateSearchDescription();
            } else {
                showToast(data.detail || JSON.stringify(data) || "Failed to borrow item.", "error");
            }
        } catch (error) {
            console.log("Browse borrow error:", error);
            showToast("Something went wrong.", "error");
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
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

        searchInput.addEventListener("input", () => {
            const filteredItems = filterItems(searchInput.value);
            renderItems(filteredItems);
            updateSearchDescription();
            updateUrlSearch(searchInput.value.trim());
        });
    }

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
});