const API_URL = "http://127.0.0.1:8000/api/";

const browseTitle = document.getElementById("browse-title");
const browseDescription = document.getElementById("browse-description");
const container = document.getElementById("browse-items");
const searchInput = document.getElementById("search-input");

let allItems = [];
let currentSearch = "";

const CATEGORY_CONFIG = {
    all: {
        title: "All Items",
        description: "Display all items",
        endpoint: "items/allitems/dashboard/"
    },
    sports: { title: "Sports", endpoint: "items/sports/" },
    electronics: { title: "Tech", endpoint: "items/electronics/" },
    books: { title: "Books", endpoint: "items/books/" },
    music: { title: "Music", endpoint: "items/music/" },
    outdoor: { title: "Outdoor", endpoint: "items/outdoor/" },
    appliance: { title: "Appliances", endpoint: "items/appliance/" }
};

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

/* CARD */
function createCard(item, searchValue) {

    let imageUrl = "./images/default-item.png";

    if (item.images && item.images.length > 0 && item.images[0].image) {
        imageUrl = item.images[0].image; // ✅ NO base URL
    }

    return `
        <div class="card">

            <div class="card-img" style="background-image: url('${imageUrl}')"></div>

            <div class="card-body">
                <h4>${highlightText(item.name || "No Name", currentSearch)}</h4>

                <p class="owner">
                    <i class="fa fa-user"></i> ${item.owner_name || "Unknown"}
                </p>

                <p class="${item.status === "AVAILABLE" ? "available" : "borrowed"}">
                    ${item.status || "N/A"}
                </p>

                <button onclick="viewItem(${item.id})">
                    View Details
                </button>
            </div>

        </div>
    `;
}

/* NAV */
function viewItem(id) {
    window.location.href = `item-details.html?id=${id}`;
}

function goToCategory(category) {
    window.location.href = `browse-items.html?category=${category}`;
}

/* LOAD */
async function loadCategoryItems(categoryKey) {
    const config = CATEGORY_CONFIG[categoryKey];
    if (!config) return;

    browseTitle.textContent = config.title;
    browseDescription.textContent = config.description || "";

    try {
        const res = await fetch(API_URL + config.endpoint, {
            credentials: "include" // 🔥 IMPORTANT FIX
        });

        const data = await res.json();

        console.log("API DATA:", data);

        if (!res.ok) {
            container.innerHTML = "<p>Error loading items</p>";
            return;
        }

        allItems = data;
        renderItems(data);

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Failed to load items</p>";
    }
}

/* RENDER */
function renderItems(items) {
    const searchInput = document.getElementById("search-input");
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
        html += createCard(item, searchValue);
    });

    container.innerHTML = html;
}

function setAvatar(elementId, user) {
    const el = document.getElementById(elementId);

    if (!el) return;

    if (user.image) {
        el.innerHTML = `<img src="http://127.0.0.1:8000${user.image}" />`;
    } else {
        const initials = user.name
            ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
            : "U";

        el.innerHTML = `<span>${initials}</span>`;
    }

    // click → profile
    el.addEventListener("click", () => {
        window.location.href = "profile.html";
    });
}

async function loadUserAvatar() {
    try {
        const res = await fetch(API_URL + "users/me/", {
            credentials: "include"
        });

        const data = await res.json();

        setAvatar("dashboard-avatar", data);
        setAvatar("browse-avatar", data); // for category page

    } catch (err) {
        console.log(err);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);

    const category = params.get("category") || "all";
    const search = params.get("search") || ""; // 🔥 FIX HERE

    await loadCategoryItems(category);

    if (search) {
        browseDescription.textContent = `No results found for "${search}"`;
    } else {
        browseDescription.textContent = "Display all items";
    }

    const searchInput = document.getElementById("search-input");

    if (searchInput) {
        searchInput.value = search;

        // auto focus
        searchInput.focus();

        // 🔥 APPLY SEARCH FROM URL
        if (search) {
            const filtered = allItems.filter(item =>
                item.name?.toLowerCase().includes(search.toLowerCase())
            );

            renderItems(filtered);
        }

        // 🔥 LIVE SEARCH
        searchInput.addEventListener("input", () => {
            const value = searchInput.value.toLowerCase();
            currentSearch = value;
            const filtered = allItems.filter(item => {
                const itemName = item.name?.toLowerCase() || "";

                const words = value
                    .toLowerCase()
                    .trim()
                    .split(" ")
                    .filter(word => word.length > 0); // 🔥 remove empty words

                return words.some(word => itemName.includes(word));
            });

            renderItems(filtered);

            // 🔥 update URL AFTER render
            const params = new URLSearchParams(window.location.search);

            if (value) {
                params.set("search", value);
            } else {
                params.delete("search"); // 🔥 remove when empty
            }

            window.history.replaceState({}, "", `?${params}`);
        });
    }

    // ✅ CATEGORY HIGHLIGHT
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

loadUserAvatar();

// const API_URL = "http://127.0.0.1:8000/api/";

// const browseTitle = document.getElementById("browse-title");
// const browseDescription = document.getElementById("browse-description");
// const browseItemsTbody = document.getElementById("browse-items");
// const categoryButtons = document.querySelectorAll(".category-btn");

// const CATEGORY_CONFIG = {
//     all: {
//         title: "All Items",
//         description: "Display all items shared by the community.",
//         endpoint: "items/allitems/dashboard/"
//     },
//     sports: {
//         title: "Sports Category",
//         description: "Display all sports items shared by the community.",
//         endpoint: "items/sports/"
//     },
//     electronics: {
//         title: "Electronics Category",
//         description: "Display all electronics items shared by the community.",
//         endpoint: "items/electronics/"
//     },
//     books: {
//         title: "Books Category",
//         description: "Display all books shared by the community.",
//         endpoint: "items/books/"
//     },
//     music: {
//         title: "Music Category",
//         description: "Display all music items shared by the community.",
//         endpoint: "items/music/"
//     },
//     outdoor: {
//         title: "Outdoor Category",
//         description: "Display all outdoor items shared by the community.",
//         endpoint: "items/outdoor/"
//     },
//     appliance: {
//         title: "Appliance Category",
//         description: "Display all appliance items shared by the community.",
//         endpoint: "items/appliance/"
//     }
// };

// function formatDate(dateString) {
//     if (!dateString) return "N/A";

//     const date = new Date(dateString);

//     return date.toLocaleString("en-PH", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "numeric",
//         minute: "2-digit",
//         hour12: true
//     });
// }

// function formatMoney(value) {
//     if (value === null || value === undefined || value === "") return "N/A";
//     return Number(value).toFixed(2);
// }

// function renderEmptyState(message) {
//     browseItemsTbody.innerHTML = "";

//     const row = document.createElement("tr");
//     const cell = document.createElement("td");
//     cell.colSpan = 11;
//     cell.textContent = message;

//     row.appendChild(cell);
//     browseItemsTbody.appendChild(row);
// }

// function createItemRow(item) {
//     const row = document.createElement("tr");

//     const nameCell = document.createElement("td");
//     nameCell.textContent = item.name || "N/A";

//     const categoryCell = document.createElement("td");
//     categoryCell.textContent = item.category_name || "N/A";

//     const conditionCell = document.createElement("td");
//     conditionCell.textContent = item.condition || "N/A";

//     const securityDepositCell = document.createElement("td");
//     securityDepositCell.textContent = formatMoney(item.security_deposit);

//     const noteCell = document.createElement("td");
//     noteCell.textContent = item.note || "N/A";

//     const borrowingFeeCell = document.createElement("td");
//     borrowingFeeCell.textContent = formatMoney(item.borrowingFee ?? item.borrowing_fee);

//     const statusCell = document.createElement("td");
//     statusCell.textContent = item.status || "N/A";

//     const ownerCell = document.createElement("td");
//     ownerCell.textContent = item.owner_name || "N/A";

//     const dateCell = document.createElement("td");
//     dateCell.textContent = formatDate(item.createdAt);

//     const expectedReturnDateCell = document.createElement("td");
//     expectedReturnDateCell.textContent =
//         item.status === "BORROWED"
//             ? formatDate(item.expected_return_date)
//             : "N/A";

//     const actionsCell = document.createElement("td");
//     const viewBtn = document.createElement("button");
//     viewBtn.textContent = "View Details";
//     viewBtn.addEventListener("click", () => {
//         window.location.href = `item-details.html?id=${item.id}`;
//     });
//     actionsCell.appendChild(viewBtn);

//     row.appendChild(nameCell);
//     row.appendChild(categoryCell);
//     row.appendChild(conditionCell);
//     row.appendChild(securityDepositCell);
//     row.appendChild(noteCell);
//     row.appendChild(borrowingFeeCell);
//     row.appendChild(statusCell);
//     row.appendChild(ownerCell);
//     row.appendChild(dateCell);
//     row.appendChild(expectedReturnDateCell);
//     row.appendChild(actionsCell);

//     return row;
// }

// async function loadCategoryItems(categoryKey) {
//     const config = CATEGORY_CONFIG[categoryKey];

//     if (!config) return;

//     browseTitle.textContent = config.title;
//     browseDescription.textContent = config.description;
//     browseItemsTbody.innerHTML = "";

//     try {
//         const response = await fetch(API_URL + config.endpoint, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             credentials: "include"
//         });

//         const data = await response.json();

//         if (!response.ok) {
//             alert(data.detail || data.message || "Failed to load items.");
//             return;
//         }

//         if (!data.length) {
//             renderEmptyState("No items found for this category.");
//             return;
//         }

//         for (const item of data) {
//             browseItemsTbody.appendChild(createItemRow(item));
//         }
//     } catch (error) {
//         console.log("loadCategoryItems error:", error);
//         alert("Something went wrong while loading items.");
//     }
// }

// categoryButtons.forEach((button) => {
//     button.addEventListener("click", async () => {
//         categoryButtons.forEach((btn) => btn.classList.remove("active"));
//         button.classList.add("active");

//         const category = button.dataset.category;
//         await loadCategoryItems(category);
//     });
// });

// document.addEventListener("DOMContentLoaded", async () => {
//     await loadCategoryItems("all");
// });