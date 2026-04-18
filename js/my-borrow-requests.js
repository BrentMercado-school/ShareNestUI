const API_URL = "http://127.0.0.1:8000/api/";

function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {
            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }

    return cookieValue;
}

function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {
            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }

    return cookieValue;
}

async function cancelBorrowRequest(requestId) {
    try {
        const response = await fetch(API_URL + `borrow-forms/${requestId}/cancel/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            credentials: "include",
            body: JSON.stringify({
                status: "CANCELLED"
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Borrow request cancelled successfully.");
            await getMyBorrowRequests();
        } else {
            alert(data.detail || data.message || "Failed to cancel request.");
            console.log(data);
        }
    } catch (error) {
        console.log("cancelBorrowRequest error:", error);
        alert("Something went wrong while cancelling the request.");
    }
}

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

        if (!data.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 9;
            cell.textContent = "No borrow requests found.";
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        for (const request of data) {
            const row = document.createElement("tr");

            const itemCell = document.createElement("td");
            itemCell.textContent = request.item_name || "N/A";

            const ownerCell = document.createElement("td");
            ownerCell.textContent = request.owner_name || "N/A";

            const startDateCell = document.createElement("td");
            startDateCell.textContent = formatDate(request.startDate);

            const returnDateCell = document.createElement("td");
            returnDateCell.textContent = formatDate(request.returnDate);

            const statusCell = document.createElement("td");
            statusCell.textContent = request.status || "N/A";

            const declineReasonCell = document.createElement("td");
            declineReasonCell.textContent = request.declineReason || "N/A";

            const borrowingFeeCell = document.createElement("td");
            borrowingFeeCell.textContent = request.borrowingFeeSnapshot || "N/A";

            const securityDepositCell = document.createElement("td");
            securityDepositCell.textContent = request.securityDepositSnapshot || "N/A";

            const actionCell = document.createElement("td");
            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Cancel Request";

            if (request.status === "PENDING") {
                cancelBtn.addEventListener("click", async () => {
                    const isConfirmed = confirm(`Cancel your request for "${request.item_name}"?`);
                    if (!isConfirmed) return;

                    await cancelBorrowRequest(request.id);
                });
            } else {
                cancelBtn.disabled = true;
                cancelBtn.title = "Only pending requests can be cancelled";
            }

            actionCell.appendChild(cancelBtn);

            row.appendChild(itemCell);
            row.appendChild(ownerCell);
            row.appendChild(startDateCell);
            row.appendChild(returnDateCell);
            row.appendChild(statusCell);
            row.appendChild(declineReasonCell);
            row.appendChild(borrowingFeeCell);
            row.appendChild(securityDepositCell);
            row.appendChild(actionCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

getMyBorrowRequests();