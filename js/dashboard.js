/* FORMAT DATE */
function formatDate(dateString) {
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

async function getCurrentUserForDashboard() {
    try {
        const res = await fetch(API_URL + "users/me/", {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();

        const avatar = document.getElementById("dashboard-avatar");

        if (avatar) {
            avatar.src = data.image
                ? "http://127.0.0.1:8000" + data.image
                : "images/default-profile.png";
        }

    } catch (err) {
        console.error("Error fetching user:", err);
    }
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

/* CARD TEMPLATE */
function createCard(item) {
    let imageUrl = "./images/default-item.png";
    if (item.images && item.images.length > 0 && item.images[0].image) {
        imageUrl = item.images[0].image;
    }
    return `
        <div class="card">

            <div class="card-img" style="background-image: url('${imageUrl}')"></div>

            <div class="card-body">
                <h4>${item.name || "No Name"}</h4>

                <p class="owner">
                    <i class="fa fa-user"></i> ${item.owner_name || "Unknown"}
                </p>

                <p class="${item.status === "AVAILABLE" ? "available" : "borrowed"}">
                    ${item.status || "N/A"}
                </p>

                ${
                    item.status === "BORROWED"
                    ? `<p>Return: ${formatDate(item.expected_return_date)}</p>`
                    : ""
                }

                <button onclick="viewItem(${item.id})">
                    View Details
                </button>
            </div>

        </div>
    `;
}

/* VIEW ITEM */
function viewItem(id) {
    window.location.href = `item-details.html?id=${id}`;
}

/* 🔥 NEW FUNCTION (IMPORTANT) */
function goToCategory(category) {
    window.location.href = `browse-items.html?category=${category}`;
}

/* ALL ITEMS */
async function getAllItems() {
    try {
        const res = await fetch(API_URL + "items/allitems/dashboard/", {
            credentials: "include"
        });

        const data = await res.json();

        const container = document.getElementById("items");

        let html = "";

        data.forEach(item => {
            console.log(item.images);
            html += createCard(item);
        });

        container.innerHTML = html;

    } catch (err) {
        console.error("Error fetching all items:", err);
    }
}

/* LATEST ITEMS */
async function getLatestItems() {
    try {
        const res = await fetch(API_URL + "items/latest/", {
            credentials: "include"
        });

        const data = await res.json();

        const container = document.getElementById("latest-items");

        let html = "";

        data.forEach(item => {
            html += createCard(item);
        });

        container.innerHTML = html;

    } catch (err) {
        console.error("Error fetching latest items:", err);
    }
}

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


/* LOAD */
getAllItems();
getLatestItems();
getCurrentUserForDashboard();
loadUserAvatar();

/* OPTIONAL */
if (typeof getAllUserItems === "function") {
    getAllUserItems();
}

