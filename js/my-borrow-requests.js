const API_URL = "http://127.0.0.1:8000/api/";

async function getMyBorrowRequests() {
    try {
        const response = await fetch(API_URL + "users/my-borrow-requests/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        console.log("My borrow requests:", data);

        const tbody = document.getElementById("my-borrow-requests");
        tbody.innerHTML = "";

        for (const request of data) {
            const row = document.createElement("tr");

            const itemCell = document.createElement("td");
            itemCell.textContent = request.item_name || "N/A";

            const ownerCell = document.createElement("td");
            ownerCell.textContent = request.owner_name || "N/A";

            const startDateCell = document.createElement("td");
            startDateCell.textContent = request.startDate || "N/A";

            const returnDateCell = document.createElement("td");
            returnDateCell.textContent = request.returnDate || "N/A";

            const statusCell = document.createElement("td");
            statusCell.textContent = request.status || "N/A";

            const declineReasonCell = document.createElement("td");
            declineReasonCell.textContent = request.declineReason || "N/A";

            const borrowingFeeCell = document.createElement("td");
            borrowingFeeCell.textContent = request.borrowingFeeSnapshot || "N/A";

            const securityDepositCell = document.createElement("td");
            securityDepositCell.textContent = request.securityDepositSnapshot || "N/A";

            row.appendChild(itemCell);
            row.appendChild(ownerCell);
            row.appendChild(startDateCell);
            row.appendChild(returnDateCell);
            row.appendChild(statusCell);
            row.appendChild(declineReasonCell);
            row.appendChild(borrowingFeeCell);
            row.appendChild(securityDepositCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

getMyBorrowRequests();