async function getAllItems() {

    try {
        const response = await fetch(API_URL + "items/allitems/dashboard/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("items");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

            const statusCell = document.createElement("td");
            statusCell.textContent = item.status || "N/A";

            const ownerCell = document.createElement("td");
            ownerCell.textContent = item.owner_name || "N/A";

            const actionsCell = document.createElement("td");

            const viewBtn = document.createElement("button");
            viewBtn.textContent = "View Details";

            viewBtn.addEventListener("click", () => {
                window.location.href = `item-details.html?id=${item.id}`;
            });

            actionsCell.appendChild(viewBtn);

            const expectedReturnDateCell = document.createElement("td");
            expectedReturnDateCell.textContent =
                item.status === "BORROWED"
                    ? formatDate(item.expected_return_date)
                    : "N/A";

            row.appendChild(nameCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(actionsCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log(error);
    }
}

async function getAllUserItems() {
    try {
        const response = await fetch(API_URL + "users/owned-items/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("owned-items");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowing_fee || item.borrowingFee || "N/A";

            const statusCell = document.createElement("td");
            statusCell.textContent = item.status || "N/A";

            const actionsCell = document.createElement("td");

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.style.marginRight = "8px";
            editBtn.addEventListener("click", () => {
                openEditItemModal(item);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.style.marginRight = "8px";
            deleteBtn.addEventListener("click", async () => {
                const isConfirmed = confirm(`Are you sure you want to delete "${item.name}"?`);

                if (!isConfirmed) return;

                await deleteItem(item.id);
            });

            const viewBtn = document.createElement("button");
            viewBtn.textContent = "View Details";

            viewBtn.addEventListener("click", () => {
                window.location.href = `owned-item-details.html?id=${item.id}`;
            });

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            actionsCell.appendChild(viewBtn);

            if (item.status === "BORROWED") {
                const returnBtn = document.createElement("button");
                returnBtn.textContent = "Return";
                returnBtn.addEventListener("click", () => {
                    openReturnItemModal(item);
                });

                actionsCell.appendChild(returnBtn);
            }

            row.appendChild(nameCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log(error);
    }
}

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

async function getLatestItems() {
    try {
        const response = await fetch(API_URL + "items/latest/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("latest-items");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

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

            row.appendChild(nameCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(dateCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log("getLatestItems error:", error);
    }
}

async function getSportsItems() {
    try {
        const response = await fetch(API_URL + "items/sports/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("sports-category");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = item.category_name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

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

            row.appendChild(nameCell);
            row.appendChild(categoryCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(dateCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log("getLatestItems error:", error);
    }
}

async function getElectronicsItems() {
    try {
        const response = await fetch(API_URL + "items/electronics/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("electronics-category");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = item.category_name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

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

            row.appendChild(nameCell);
            row.appendChild(categoryCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(dateCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log("getLatestItems error:", error);
    }
}

async function getBooksItems() {
    try {
        const response = await fetch(API_URL + "items/books/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("books-category");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = item.category_name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

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

            row.appendChild(nameCell);
            row.appendChild(categoryCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(dateCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log("getLatestItems error:", error);
    }
}

async function getMusicItems() {
    try {
        const response = await fetch(API_URL + "items/music/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("music-category");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = item.category_name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

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

            row.appendChild(nameCell);
            row.appendChild(categoryCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(dateCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log("getLatestItems error:", error);
    }
}

async function getOutdoorItems() {
    try {
        const response = await fetch(API_URL + "items/outdoor/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("outdoor-category");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = item.category_name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

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

            row.appendChild(nameCell);
            row.appendChild(categoryCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(dateCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log("getLatestItems error:", error);
    }
}

async function getApplianceItems() {
    try {
        const response = await fetch(API_URL + "items/appliance/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("appliance-category");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = item.category_name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowingFee || "N/A";

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

            row.appendChild(nameCell);
            row.appendChild(categoryCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(ownerCell);
            row.appendChild(dateCell);
            row.appendChild(expectedReturnDateCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log("getLatestItems error:", error);
    }
}

getApplianceItems()
getOutdoorItems()
getMusicItems()
getBooksItems()
getElectronicsItems()
getSportsItems()
getLatestItems();
getAllItems();
getAllUserItems();