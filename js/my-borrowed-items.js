const API_URL = "http://127.0.0.1:8000/api/";

async function getMyBorrowedItems() {
    try {
        const response = await fetch(API_URL + "users/my-borrowed-items/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        console.log("My borrowed items:", data);

        const tbody = document.getElementById("my-borrowed-items");
        tbody.innerHTML = "";

        for (const borrow of data) {
            const row = document.createElement("tr");

            const itemCell = document.createElement("td");
            itemCell.textContent = borrow.item_name || "N/A";

            const ownerCell = document.createElement("td");
            ownerCell.textContent = borrow.owner_name || "N/A";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = borrow.category_name || "N/A";

            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = borrow.item_description || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = borrow.item_condition || "N/A";

            const startDateCell = document.createElement("td");
            startDateCell.textContent = borrow.startDate || "N/A";

            const returnDateCell = document.createElement("td");
            returnDateCell.textContent = borrow.returnDate || "N/A";

            const borrowingFeeCell = document.createElement("td");
            borrowingFeeCell.textContent = borrow.borrowingFeeSnapshot || "N/A";

            const securityDepositCell = document.createElement("td");
            securityDepositCell.textContent = borrow.securityDepositSnapshot || "N/A";

            const statusCell = document.createElement("td");
            statusCell.textContent = borrow.status || "N/A";

            row.appendChild(itemCell);
            row.appendChild(ownerCell);
            row.appendChild(categoryCell);
            row.appendChild(descriptionCell);
            row.appendChild(conditionCell);
            row.appendChild(startDateCell);
            row.appendChild(returnDateCell);
            row.appendChild(borrowingFeeCell);
            row.appendChild(securityDepositCell);
            row.appendChild(statusCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

getMyBorrowedItems();