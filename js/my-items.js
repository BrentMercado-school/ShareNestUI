const API_URL = "http://127.0.0.1:8000/api/";
const itemsMap = {};

let ownedContainer;
let availableContainer;
let borrowedContainer;

// ... all your functions stay the same ...

document.addEventListener("DOMContentLoaded", () => {
    ownedContainer = document.getElementById("owned-items");
    availableContainer = document.getElementById("available-owned-items");
    borrowedContainer = document.getElementById("my-borrowed-items");

    loadItems();
});

/* =========================
   HELPERS
========================= */
function formatDate(dateString) {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

/* =========================
   CARD UI
========================= */
function createItemCard(item) {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
        <div class="card-img"></div>

        <div class="card-body">
            <h4>${item.name || "No Name"}</h4>

            <p class="owner">${item.category_name || "N/A"}</p>

            <p class="${item.status === "AVAILABLE" ? "available" : "borrowed"}">
                ${item.status}
            </p>

            ${
                item.status === "BORROWED"
                ? `<p>Return: ${formatDate(item.expected_return_date)}</p>`
                : ""
            }

            <div class="card-actions">
    <button onclick="viewItem(${item.id})">View</button>

    ${
        item.status !== "BORROWED"
        ? `
            <button onclick="editItem(${item.id})">Edit</button>
            <button onclick="deleteItemConfirm(${item.id})">Delete</button>
          `
        : ""
    }
</div>
        </div>
    `;

    return card;
}

/* =========================
   ACTIONS
========================= */
function viewItem(id) {
    window.location.href = `owned-item-details.html?id=${id}`;
}

function editItem(id) {
    const item = itemsMap[id];
    if (!item) return;
    openEditItemModal(item); // from edit-item.js
}

async function deleteItemConfirm(id) {
    const item = itemsMap[id];                          // ✅ look up from map
    const name = item?.name || "this item";

    const confirmDelete = confirm(`Delete "${name}"?`);
    if (!confirmDelete) return;

    try {
        const res = await fetch(API_URL + `items/${id}/delete/`, {
            method: "DELETE",
            credentials: "include"
        });

        if (res.ok) {
            alert("Deleted successfully");
            loadItems();
        } else {
            alert("Delete failed");
        }

    } catch (err) {
        console.log(err);
        alert("Error deleting");
    }
}

function returnItem(id) {
    alert("Hook this to your existing return modal");
}

/* =========================
   LOAD ITEMS
========================= */
async function loadItems() {
    try {
        const res = await fetch(API_URL + "users/owned-items/", {
            credentials: "include"
        });

        const data = await res.json();

        ownedContainer.innerHTML = "";
        availableContainer.innerHTML = "";
        borrowedContainer.innerHTML = "";

        if (!data.length) {
            ownedContainer.innerHTML = "<p>No items found.</p>";
            return;
        }

        data.forEach(item => {
    itemsMap[item.id] = item;

    ownedContainer.appendChild(createItemCard(item));

    console.log(item.name, "→ status:", item.status); // ✅ add this

    if (item.status === "AVAILABLE") {
        availableContainer.appendChild(createItemCard(item));
    }

    if (item.status === "BORROWED") {
        borrowedContainer.appendChild(createItemCard(item));
    }
});

    } catch (err) {
        console.log(err);
        alert("Failed to load items");
    }
}

/* =========================
   ITEM UPDATED EVENT (from edit-item.js)
========================= */
document.addEventListener("itemUpdated", () => {
    loadItems();
});
