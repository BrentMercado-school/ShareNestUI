const API_URL = "http://127.0.0.1:8000/api/";

/* COOKIE */
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

/* DATE FORMAT */
function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

/* CANCEL REQUEST */
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
            alert(data.message || "Cancelled.");
            await getMyBorrowRequests();
        } else {
            alert(data.detail || "Failed.");
        }

    } catch (error) {
        console.log(error);
    }
}

/* CARD TEMPLATE */
function createCard(request) {
    return `
        <div class="card">

            <h3>${request.item_name || "N/A"}</h3>

            <p><i class="fa fa-user"></i> ${request.owner_name || "N/A"}</p>

            <p><b>Start:</b> ${formatDate(request.startDate)}</p>
            <p><b>Return:</b> ${formatDate(request.returnDate)}</p>

            <p class="status ${request.status.toLowerCase()}">
                ${request.status || "N/A"}
            </p>

            ${
                request.declineReason
                ? `<p><b>Reason:</b> ${request.declineReason}</p>`
                : ""
            }

            <p>Fee: ₱${request.borrowingFeeSnapshot || 0}</p>
            <p>Deposit: ₱${request.securityDepositSnapshot || 0}</p>

            <button 
                class="btn"
                ${request.status !== "PENDING" ? "disabled" : ""}
                onclick="handleCancel(${request.id}, '${request.item_name}')"
            >
                Cancel Request
            </button>

        </div>
    `;
}

/* HANDLE CANCEL */
function handleCancel(id, itemName) {
    const confirmCancel = confirm(`Cancel request for "${itemName}"?`);
    if (!confirmCancel) return;

    cancelBorrowRequest(id);
}

/* LOAD DATA */
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

        const container = document.getElementById("requests-container");
        container.innerHTML = "";

        if (!data.length) {
            container.innerHTML = "<p>No borrow requests found.</p>";
            return;
        }

        container.innerHTML = data.map(createCard).join("");

    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

getMyBorrowRequests();