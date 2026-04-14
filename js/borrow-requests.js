const API_URL = "http://127.0.0.1:8000/api/";

async function acceptBorrowRequest(requestId) {
    try {
        const response = await fetch(API_URL + `borrow-requests/${requestId}/accept/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Borrow request approved.");
            await getBorrowRequests();
        } else {
            alert(data.detail || data.message || "Failed to approve request.");
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

async function declineBorrowRequest(requestId, declineReason) {
    try {
        const response = await fetch(API_URL + `borrow-requests/${requestId}/decline/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                declineReason
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Borrow request declined.");
            await getBorrowRequests();
        } else {
            alert(data.detail || data.message || "Failed to decline request.");
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

async function getBorrowRequests() {
    try {
        const response = await fetch(API_URL + "users/owned-item-borrow-requests/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        console.log("Borrow requests:", data);

        const tbody = document.getElementById("borrow-requests");
        tbody.innerHTML = "";

        for (const request of data) {
            const row = document.createElement("tr");

            const borrowerCell = document.createElement("td");
            borrowerCell.textContent = request.borrower_name || request.borrower || "N/A";

            const itemCell = document.createElement("td");
            itemCell.textContent = request.item_name || request.item || "N/A";

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

            const actionsCell = document.createElement("td");

            if (request.status === "PENDING") {
                const acceptBtn = document.createElement("button");
                acceptBtn.textContent = "Accept";
                acceptBtn.addEventListener("click", async () => {
                    const isConfirmed = confirm("Approve this borrow request?");
                    if (!isConfirmed) return;

                    await acceptBorrowRequest(request.id);
                });

                const declineBtn = document.createElement("button");
                declineBtn.textContent = "Decline";
                declineBtn.addEventListener("click", async () => {
                    const isConfirmed = confirm("Decline this borrow request?");
                    if (!isConfirmed) return;

                    const declineReason = prompt("Enter decline reason:") || "";

                    await declineBorrowRequest(request.id, declineReason);
                });

                actionsCell.appendChild(acceptBtn);
                actionsCell.appendChild(declineBtn);
            } else {
                actionsCell.textContent = "-";
            }

            row.appendChild(borrowerCell);
            row.appendChild(itemCell);
            row.appendChild(startDateCell);
            row.appendChild(returnDateCell);
            row.appendChild(statusCell);
            row.appendChild(declineReasonCell);
            row.appendChild(borrowingFeeCell);
            row.appendChild(securityDepositCell);
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

getBorrowRequests();