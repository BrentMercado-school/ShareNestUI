const API_URL = "http://127.0.0.1:8000/api/";

const browseTitle = document.getElementById("browse-title");
const browseDescription = document.getElementById("browse-description");
const browseItemsTbody = document.getElementById("browse-items");
const categoryButtons = document.querySelectorAll(".category-btn");

const CATEGORY_CONFIG = {
    all: {
        title: "All Items",
        description: "Display all items shared by the community.",
        endpoint: "items/allitems/dashboard/"
    },
    sports: {
        title: "Sports Category",
        description: "Display all sports items shared by the community.",
        endpoint: "items/sports/"
    },
    electronics: {
        title: "Electronics Category",
        description: "Display all electronics items shared by the community.",
        endpoint: "items/electronics/"
    },
    books: {
        title: "Books Category",
        description: "Display all books shared by the community.",
        endpoint: "items/books/"
    },
    music: {
        title: "Music Category",
        description: "Display all music items shared by the community.",
        endpoint: "items/music/"
    },
    outdoor: {
        title: "Outdoor Category",
        description: "Display all outdoor items shared by the community.",
        endpoint: "items/outdoor/"
    },
    appliance: {
        title: "Appliance Category",
        description: "Display all appliance items shared by the community.",
        endpoint: "items/appliance/"
    }
};

function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

function formatMoney(value) {
    if (value === null || value === undefined || value === "") return "N/A";
    return Number(value).toFixed(2);
}

function renderEmptyState(message) {
    browseItemsTbody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 11;
    cell.textContent = message;

    row.appendChild(cell);
    browseItemsTbody.appendChild(row);
}

function createItemRow(item) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = item.name || "N/A";

    const categoryCell = document.createElement("td");
    categoryCell.textContent = item.category_name || "N/A";

    const conditionCell = document.createElement("td");
    conditionCell.textContent = item.condition || "N/A";

    const securityDepositCell = document.createElement("td");
    securityDepositCell.textContent = formatMoney(item.security_deposit);

    const noteCell = document.createElement("td");
    noteCell.textContent = item.note || "N/A";

    const borrowingFeeCell = document.createElement("td");
    borrowingFeeCell.textContent = formatMoney(item.borrowingFee ?? item.borrowing_fee);

    const statusCell = document.createElement("td");
    statusCell.textContent = item.status || "N/A";

    const ownerCell = document.createElement("td");
    ownerCell.textContent = item.owner_name || "N/A";

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.createdAt);

    const expectedReturnDateCell = document.createElement("td");
    expectedReturnDateCell.textContent =
        item.status === "BORROWED"
            ? formatDate(item.expected_return_date)
            : "N/A";

    const actionsCell = document.createElement("td");
    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View Details";
    viewBtn.addEventListener("click", () => {
        window.location.href = `item-details.html?id=${item.id}`;
    });
    actionsCell.appendChild(viewBtn);

    row.appendChild(nameCell);
    row.appendChild(categoryCell);
    row.appendChild(conditionCell);
    row.appendChild(securityDepositCell);
    row.appendChild(noteCell);
    row.appendChild(borrowingFeeCell);
    row.appendChild(statusCell);
    row.appendChild(ownerCell);
    row.appendChild(dateCell);
    row.appendChild(expectedReturnDateCell);
    row.appendChild(actionsCell);

    return row;
}

async function loadCategoryItems(categoryKey) {
    const config = CATEGORY_CONFIG[categoryKey];

    if (!config) return;

    browseTitle.textContent = config.title;
    browseDescription.textContent = config.description;
    browseItemsTbody.innerHTML = "";

    try {
        const response = await fetch(API_URL + config.endpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || data.message || "Failed to load items.");
            return;
        }

        if (!data.length) {
            renderEmptyState("No items found for this category.");
            return;
        }

        for (const item of data) {
            browseItemsTbody.appendChild(createItemRow(item));
        }
    } catch (error) {
        console.log("loadCategoryItems error:", error);
        alert("Something went wrong while loading items.");
    }
}

categoryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        categoryButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const category = button.dataset.category;
        await loadCategoryItems(category);
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    await loadCategoryItems("all");
});