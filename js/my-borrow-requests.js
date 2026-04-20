const API_URL = "http://127.0.0.1:8000/api/";

/* =========================
   COOKIE
========================= */
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

/* =========================
   HELPERS
========================= */
function formatDate(dateString) {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function statusBadge(status) {
    const map = {
        PENDING:   `<span class="badge badge-pending">Pending</span>`,
        ACCEPTED:  `<span class="badge badge-accepted">Accepted</span>`,
        DECLINED:  `<span class="badge badge-declined">Declined</span>`,
        CANCELLED: `<span class="badge badge-cancelled">Cancelled</span>`,
    };
    return map[status] || `<span class="badge">${status}</span>`;
}

/* =========================
   CANCEL REQUEST
========================= */
async function cancelBorrowRequest(requestId) {
    try {
        const response = await fetch(API_URL + `borrow-forms/${requestId}/cancel/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            credentials: "include",
            body: JSON.stringify({ status: "CANCELLED" })
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

/* =========================
   CUSTOM CONFIRM MODAL
========================= */
function showConfirm(message, onConfirm) {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("confirm-message").textContent = message;

    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    const okBtn = document.getElementById("confirm-ok-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");

    // Clone buttons to remove old listeners
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.replaceWith(newOkBtn);
    cancelBtn.replaceWith(newCancelBtn);

    function closeModal() {
        modal.classList.remove("show");
        document.body.style.overflow = "";
    }

    newOkBtn.addEventListener("click", () => {
        closeModal();
        onConfirm();
    });

    newCancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
}

/* =========================
   HANDLE CANCEL (updated)
========================= */
function handleCancel(id, itemName) {
    showConfirm(`Cancel request for "${itemName}"?`, () => {
        cancelBorrowRequest(id);
    });
}

/* =========================
   CARD TEMPLATE
========================= */
function createCard(request) {
    return `
        <div class="card">

            <h3>${request.item_name || "N/A"}</h3>

            <p><i class="fa fa-user"></i> ${request.owner_name || "N/A"}</p>

            <p><b>Start:</b> ${formatDate(request.startDate)}</p>
            <p><b>Return:</b> ${formatDate(request.returnDate)}</p>

            ${statusBadge(request.status)}

            ${
                request.declineReason
                ? `<p><b>Reason:</b> ${request.declineReason}</p>`
                : ""
            }

            <p>Fee: ₱${request.borrowingFeeSnapshot || 0}</p>
            <p>Deposit: ₱${request.securityDepositSnapshot || 0}</p>

            ${
                request.status === "PENDING"
                ? `<button class="btn" onclick="handleCancel(${request.id}, '${request.item_name}')">
                       Cancel Request
                   </button>`
                : ""
            }

        </div>
    `;
}

/* =========================
   LOAD DATA
========================= */
async function getMyBorrowRequests() {
    try {
        const response = await fetch(API_URL + "users/my-borrow-requests/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
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

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", getMyBorrowRequests);