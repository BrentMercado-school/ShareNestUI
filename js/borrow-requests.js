const API_URL = "http://127.0.0.1:8000/api/";

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

function statusBadge(status) {
    const map = {
        PENDING:  `<span class="badge badge-pending">Pending</span>`,
        ACCEPTED: `<span class="badge badge-accepted">Accepted</span>`,
        DECLINED: `<span class="badge badge-declined">Declined</span>`,
    };
    return map[status] || `<span class="badge">${status}</span>`;
}

/* =========================
   ACCEPT
========================= */
async function acceptBorrowRequest(requestId) {
    try {
        const response = await fetch(API_URL + `borrow-requests/${requestId}/accept/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

/* =========================
   DECLINE
========================= */
async function declineBorrowRequest(requestId, declineReason) {
    try {
        const response = await fetch(API_URL + `borrow-requests/${requestId}/decline/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ declineReason })
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

/* =========================
   LOAD REQUESTS
========================= */
async function getBorrowRequests() {
    try {
        const response = await fetch(API_URL + "users/owned-item-borrow-requests/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        const data = await response.json();
        console.log("Borrow requests:", data);

        const tbody = document.getElementById("borrow-requests");
        tbody.innerHTML = "";

        const pendingRequests = data.filter(r => r.status === "PENDING");

        if (!pendingRequests.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding: 30px; color: #777;">
                        No pending borrow requests found.
                    </td>
                </tr>`;
            return;
        }

        for (const request of pendingRequests) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${request.borrower_name || request.borrower || "N/A"}</td>
                <td>${request.item_name || request.item || "N/A"}</td>
                <td>${formatDate(request.startDate)}</td>
                <td>${formatDate(request.returnDate)}</td>
                <td>${statusBadge(request.status)}</td>
                <td>${request.declineReason || "N/A"}</td>
                <td>${request.borrowingFeeSnapshot || "N/A"}</td>
                <td>${request.securityDepositSnapshot || "N/A"}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-accept" data-id="${request.id}">Accept</button>
                        <button class="btn-decline" data-id="${request.id}">Decline</button>
                    </div>
                </td>
            `;

            // Accept
            row.querySelector(".btn-accept").addEventListener("click", async () => {
                if (!confirm("Approve this borrow request?")) return;
                await acceptBorrowRequest(request.id);
            });

            // Decline
            row.querySelector(".btn-decline").addEventListener("click", async () => {
                if (!confirm("Decline this borrow request?")) return;
                const declineReason = prompt("Enter decline reason:") || "";
                await declineBorrowRequest(request.id, declineReason);
            });

            tbody.appendChild(row);
        }

    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", getBorrowRequests);