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

/* CARD TEMPLATE */
function createCard(item) {
    return `
        <div class="card">

            <div class="card-img"></div>

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

/* VIEW ITEM (cleaner than inline href) */
function viewItem(id) {
    window.location.href = `item-details.html?id=${id}`;
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

/* LOAD */
getAllItems();
getLatestItems();

/* OPTIONAL (only if you actually have this function) */
if (typeof getAllUserItems === "function") {
    getAllUserItems();
}


// function formatDate(dateString) {
//     if (!dateString) return "N/A";

//     const date = new Date(dateString);

//     return date.toLocaleString("en-PH", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         hour: "numeric",
//         minute: "2-digit"
//     });
// }

// /* CARD TEMPLATE */
// function createCard(item) {
//     return `
//         <div class="item-card">

//             <div class="item-img"></div>

//             <div class="item-content">
//                 <h4>${item.name}</h4>

//                 <p class="owner">👤 ${item.owner_name}</p>

//                 <p class="${item.status === "AVAILABLE" ? "available" : "borrowed"}">
//                     ${item.status}
//                 </p>

//                 ${
//                     item.status === "BORROWED"
//                     ? `<p>Return: ${formatDate(item.expected_return_date)}</p>`
//                     : ""
//                 }

//                 <button onclick="window.location.href='item-details.html?id=${item.id}'">
//                     View Details
//                 </button>
//             </div>

//         </div>
//     `;
// }

// /* ALL ITEMS */
// async function getAllItems() {
//     try {
//         const res = await fetch(API_URL + "items/allitems/dashboard/", {
//             credentials: "include"
//         });

//         const data = await res.json();

//         const container = document.getElementById("items");
//         container.innerHTML = "";

//         data.forEach(item => {
//             container.innerHTML += createCard(item);
//         });

//     } catch (err) {
//         console.log(err);
//     }
// }

// /* LATEST ITEMS */
// async function getLatestItems() {
//     try {
//         const res = await fetch(API_URL + "items/latest/", {
//             credentials: "include"
//         });

//         const data = await res.json();

//         const container = document.getElementById("latest-items");
//         container.innerHTML = "";

//         data.forEach(item => {
//             container.innerHTML += createCard(item);
//         });

//     } catch (err) {
//         console.log(err);
//     }
// }

// /* LOAD */
// getAllItems();
// getLatestItems();
// getAllUserItems();