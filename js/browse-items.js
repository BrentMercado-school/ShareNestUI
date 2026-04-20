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

function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
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

/* CARD */
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
        html += createCard(item);
    });

    container.innerHTML = html;
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


// });