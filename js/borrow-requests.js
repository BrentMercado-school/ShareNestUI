const API_URL = window.API_URL || "http://127.0.0.1:8000/api/";
const BASE_URL = "http://127.0.0.1:8000";

const requestList = document.getElementById("request-list");
const requestSearch = document.getElementById("request-search");
const requestFilterNote = document.getElementById("request-filter-note");

const acceptConfirmModal = document.getElementById("accept-confirm-modal");
const acceptRequestItemName = document.getElementById("accept-request-item-name");
const cancelAcceptRequestBtn = document.getElementById("cancel-accept-request-btn");
const confirmAcceptRequestBtn = document.getElementById("confirm-accept-request-btn");

const declineReasonModal = document.getElementById("decline-reason-modal");
const declineRequestItemName = document.getElementById("decline-request-item-name");
const declineReasonInput = document.getElementById("decline-reason-input");
const cancelDeclineRequestBtn = document.getElementById("cancel-decline-request-btn");
const submitDeclineRequestBtn = document.getElementById("submit-decline-request-btn");

const REQUEST_FILTERS = new Set(["all", "my-borrow-request", "ongoing", "history"]);
const REQUEST_STATUS_FILTERS = new Set(["all", "pending", "approved"]);

const requestUrlParams = new URLSearchParams(window.location.search);

let currentFilter = REQUEST_FILTERS.has(requestUrlParams.get("tab"))
    ? requestUrlParams.get("tab")
    : "all";

let currentMyBorrowStatus = REQUEST_STATUS_FILTERS.has(requestUrlParams.get("status"))
    ? requestUrlParams.get("status")
    : "all";

let pendingAcceptRequest = null;
let pendingDeclineRequest = null;
let ownedBorrowRequests = [];
let myBorrowRequests = [];
let currentSearch = "";
let toastTimeout = null;

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
function updateActiveFilterButtons() {
    document.querySelectorAll(".categories button").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === currentFilter);
    });
}

function syncRequestUrl() {
    const params = new URLSearchParams();

    if (currentFilter !== "all") {
        params.set("tab", currentFilter);
    }

    if (currentFilter === "my-borrow-request" && currentMyBorrowStatus !== "all") {
        params.set("status", currentMyBorrowStatus);
    }

    const query = params.toString();
    const nextUrl = query ? `borrow-requests.html?${query}` : "borrow-requests.html";

    window.history.replaceState({}, "", nextUrl);
}

function getBorrowTrackingStatus(returnDate) {
    if (!returnDate) {
        return {
            label: "No return date",
            detail: "",
            className: "neutral"
        };
    }

    const today = new Date();
    const dueDate = new Date(returnDate);

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffMs = dueDate - today;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        return {
            label: "Overdue",
            detail: `${overdueDays} day${overdueDays !== 1 ? "s" : ""} overdue`,
            className: "overdue"
        };
    }

    if (diffDays === 0) {
        return {
            label: "On Track",
            detail: "Due today",
            className: "ontrack"
        };
    }

    return {
        label: "On Track",
        detail: `${diffDays} day${diffDays !== 1 ? "s" : ""} left`,
        className: "ontrack"
    };
}

function findOwnedRequestById(requestId) {
    return ownedBorrowRequests.find(request => String(request.id) === String(requestId));
}

function openAcceptConfirmModal(requestId) {
    const request = findOwnedRequestById(requestId);

    if (!request) {
        showToast("Request not found.", "error");
        return;
    }

    pendingAcceptRequest = request;
    acceptRequestItemName.textContent = `"${request.item_name || "Item"}"`;

    if (acceptConfirmModal) {
        acceptConfirmModal.classList.add("show");
    }
}

function closeAcceptConfirmModal() {
    pendingAcceptRequest = null;
    if (acceptRequestItemName) acceptRequestItemName.textContent = `"Item"`;
    if (acceptConfirmModal) acceptConfirmModal.classList.remove("show");
}

function openDeclineReasonModal(requestId) {
    const request = findOwnedRequestById(requestId);

    if (!request) {
        showToast("Request not found.", "error");
        return;
    }

    pendingDeclineRequest = request;
    declineRequestItemName.textContent = `"${request.item_name || "Item"}"`;

    if (declineReasonInput) {
        declineReasonInput.value = "";
    }

    if (declineReasonModal) {
        declineReasonModal.classList.add("show");
    }
}

function closeDeclineReasonModal() {
    pendingDeclineRequest = null;
    if (declineRequestItemName) declineRequestItemName.textContent = `"Item"`;
    if (declineReasonInput) declineReasonInput.value = "";
    if (declineReasonModal) declineReasonModal.classList.remove("show");
}

function normalizeMediaUrl(url) {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${BASE_URL}${url}`;
    }

    return url;
}

function formatDate(dateString) {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString("en-PH");
}

function escapeHtml(text = "") {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function highlightText(text, query) {
    if (!query) return escapeHtml(text);

    const safeText = escapeHtml(text);
    const words = query
        .toLowerCase()
        .trim()
        .split(" ")
        .filter(word => word.length > 0);

    let highlighted = safeText;

    words.forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        highlighted = highlighted.replace(regex, "<mark>$1</mark>");
    });

    return highlighted;
}

function getRequestItemImage(request) {
    if (request?.item_images && request.item_images.length > 0 && request.item_images[0]?.image) {
        return normalizeMediaUrl(request.item_images[0].image);
    }

    if (request?.images && request.images.length > 0 && request.images[0]?.image) {
        return normalizeMediaUrl(request.images[0].image);
    }

    if (request?.item_image) return normalizeMediaUrl(request.item_image);
    if (request?.image) return normalizeMediaUrl(request.image);

    return "./images/default-item.png";
}

function getIncomingStatusLabel(status) {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "PENDING") return "Pending";
    if (normalized === "APPROVED") return "Ongoing";
    if (normalized === "DECLINED") return "Declined";
    if (normalized === "CANCELLED") return "Cancelled";
    if (normalized === "RETURNED") return "Returned";

    return status || "Unknown";
}

function getMyBorrowStatusHtml(status) {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "PENDING") {
        return `<span class="my-borrow-status-pill pending"><i class="fa-regular fa-clock"></i> Pending</span>`;
    }

    if (normalized === "APPROVED" || normalized === "ACCEPTED") {
        return `<span class="my-borrow-status-pill accepted"><i class="fa-regular fa-circle-check"></i> Accepted</span>`;
    }

    if (normalized === "DECLINED") {
        return `<span class="my-borrow-status-pill declined"><i class="fa-regular fa-circle-xmark"></i> Declined</span>`;
    }

    if (normalized === "CANCELLED") {
        return `<span class="my-borrow-status-pill cancelled"><i class="fa-regular fa-circle-minus"></i> Cancelled</span>`;
    }

    if (normalized === "RETURNED") {
        return `<span class="my-borrow-status-pill returned"><i class="fa-regular fa-circle-check"></i> Returned</span>`;
    }

    return `<span class="my-borrow-status-pill">${escapeHtml(status || "Unknown")}</span>`;
}

/* =========================
   TOAST
========================= */
function showToast(message = "Something went wrong.", type = "success") {
    const toast = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");
    const toastTitle = document.getElementById("toast-title");
    const toastIcon = document.getElementById("toast-icon");

    if (!toast || !toastText || !toastTitle || !toastIcon) return;

    toast.classList.remove("success", "error");
    toast.classList.add(type);

    if (type === "error") {
        toastTitle.textContent = "Error";
        toastIcon.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
    } else {
        toastTitle.textContent = "Success";
        toastIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
    }

    toastText.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function hideToast() {
    const toast = document.getElementById("toast-message");
    if (toast) toast.classList.remove("show");
}

window.hideToast = hideToast;

/* =========================
   CURRENT USER
========================= */
function setAvatar(elementId, user) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (user.image) {
        el.innerHTML = `<img src="${normalizeMediaUrl(user.image)}" alt="Profile Image" />`;
    } else {
        const initials = user.name
            ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
            : "U";

        el.innerHTML = `<span>${initials}</span>`;
    }

    el.addEventListener("click", () => {
        window.location.href = "profile.html";
    });
}

async function loadCurrentUser() {
    try {
        const response = await fetch(API_URL + "users/me/", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();
        if (!response.ok) return;

        setAvatar("requests-avatar", data);
    } catch (error) {
        console.error("loadCurrentUser error:", error);
    }
}

/* =========================
   REQUEST ACTIONS
========================= */
async function acceptBorrowRequest(requestId) {
    const response = await fetch(API_URL + `borrow-requests/${requestId}/accept/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to approve request.");
    }

    return data;
}

async function declineBorrowRequest(requestId, declineReason) {
    const response = await fetch(API_URL + `borrow-requests/${requestId}/decline/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ declineReason })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to decline request.");
    }

    return data;
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
            body: JSON.stringify({ status: "CANCELLED" })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message || "Cancelled.", "success");
            await loadAllRequestData();
        } else {
            showToast(data.detail || data.message || "Failed to cancel request.", "error");
        }
    } catch (error) {
        console.log(error);
        showToast("Something went wrong.", "error");
    }
}

window.acceptBorrowRequest = acceptBorrowRequest;
window.declineBorrowRequest = declineBorrowRequest;
window.cancelBorrowRequest = cancelBorrowRequest;

/* =========================
   FILTERS
========================= */
function setRequestFilter(filter) {
    currentFilter = filter;

    if (filter !== "my-borrow-request") {
        currentMyBorrowStatus = "all";
    } else {
        currentMyBorrowStatus = "all";
    }

    updateActiveFilterButtons();
    syncRequestUrl();
    renderBorrowRequests();
}

window.setRequestFilter = setRequestFilter;

function getFilteredRequests() {
    let items = [];

    if (currentFilter === "my-borrow-request") {
        items = [...myBorrowRequests];

        if (currentMyBorrowStatus === "pending") {
            items = items.filter(
                request => String(request.status || "").toUpperCase() === "PENDING"
            );
        } else if (currentMyBorrowStatus === "approved") {
            items = items.filter(
                request => String(request.status || "").toUpperCase() === "APPROVED"
            );
        }

    } else if (currentFilter === "history") {
        items = myBorrowRequests.filter(
            request => String(request.status || "").toUpperCase() === "RETURNED"
        );

    } else {
        items = [...ownedBorrowRequests];

        if (currentFilter === "all") {
            items = items.filter(
                request => String(request.status || "").toUpperCase() === "PENDING"
            );
        } else if (currentFilter === "ongoing") {
            items = items.filter(
                request => String(request.status || "").toUpperCase() === "APPROVED"
            );
        }
    }

    if (currentSearch) {
        const words = currentSearch
            .split(" ")
            .filter(word => word.length > 0);

        items = items.filter(request => {
            const haystack = [
                request.item_name,
                request.item_category_name,
                request.category_name,
                request.borrower_name,
                request.owner_name,
                request.status
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return words.every(word => haystack.includes(word));
        });
    }

    return items;
}

function updateFilterNote(count) {
    let label = "All";

    if (currentFilter === "my-borrow-request") {
        if (currentMyBorrowStatus === "approved") {
            label = "Items Borrowed";
        } else if (currentMyBorrowStatus === "pending") {
            label = "Pending Request";
        } else {
            label = "My Borrow Request";
        }
    } else if (currentFilter === "ongoing") {
        label = "Ongoing";
    } else if (currentFilter === "history") {
        label = "Borrowing History";
    }

    if (!requestFilterNote) return;

    if (currentSearch) {
        requestFilterNote.textContent = `Filtered: ${label} • Search: "${currentSearch}" • ${count} result${count !== 1 ? "s" : ""}`;
    } else {
        requestFilterNote.textContent = `Filtered: ${label}`;
    }
}

/* =========================
   DETAILS
========================= */
function viewBorrowRequestDetails(requestId) {
    const allRequests = [...ownedBorrowRequests, ...myBorrowRequests];
    const request = allRequests.find(entry => String(entry.id) === String(requestId));

    if (!request) {
        showToast("Request details not found.", "error");
        return;
    }

    const itemId = request.item_id || request.item;
    if (!itemId) {
        showToast("No item details available.", "error");
        return;
    }

    window.location.href = `item-details.html?id=${itemId}`;
}

window.viewBorrowRequestDetails = viewBorrowRequestDetails;

/* =========================
   CARD RENDER - INCOMING
========================= */
function createIncomingRequestCard(request) {
    const imageUrl = getRequestItemImage(request);
    const status = String(request.status || "").toUpperCase();
    const borrowerName = request.borrower_name || request.borrower || "Unknown Borrower";
    const tracking = currentFilter === "ongoing"
        ? getBorrowTrackingStatus(request.returnDate)
        : null;

    const ongoingClass = currentFilter === "ongoing" ? "ongoing-request-card" : "";

    return `
        <article class="request-card ${ongoingClass}">
            <div class="request-card-inner">
                <div class="request-thumb" style="background-image: url('${imageUrl}')"></div>

                <div class="request-content">
                    <div class="request-header">
                        <div>
                            <h3 class="request-title">${highlightText(request.item_name || "Unnamed Item", currentSearch)}</h3>
                            <p class="request-category">${escapeHtml(request.item_category_name || "Category")}</p>
                        </div>

                        <span class="request-status-chip request-status-${status.toLowerCase()}">
                            ${getIncomingStatusLabel(status)}
                        </span>
                    </div>

                    <p class="request-date-line">Start Date: ${formatDate(request.startDate)}</p>
                    <p class="request-date-line">Return Date: ${formatDate(request.returnDate)}</p>
                    <p class="request-deposit">Deposit: ₱${formatMoney(request.securityDepositSnapshot)}</p>

                    ${
                        tracking
                            ? `
                                <div class="request-track-row">
                                    <span class="request-track-pill ${tracking.className}">${tracking.label}</span>
                                    <span class="request-track-detail">${tracking.detail}</span>
                                </div>
                            `
                            : ``
                    }

                    <div class="request-borrower">
                        <i class="fa-solid fa-circle-user"></i>
                        <span>${highlightText(borrowerName, currentSearch)}</span>
                    </div>

                    <div class="request-actions">
                        ${
                            status === "PENDING"
                                ? `
                                    <button type="button" class="request-accept-btn" onclick="handleAcceptRequest(${request.id})">Accept</button>
                                    <button type="button" class="request-secondary-btn" onclick="handleDeclineRequest(${request.id})">Decline</button>
                                    <button type="button" class="request-secondary-btn" onclick="viewBorrowRequestDetails(${request.id})">Details</button>
                                `
                                : `
                                
                                `
                        }
                    </div>
                </div>
            </div>
        </article>
    `;
}

/* =========================
   CARD RENDER - MY REQUESTS
========================= */
function createMyBorrowRequestCard(request) {
    const imageUrl = getRequestItemImage(request);
    const status = String(request.status || "").toUpperCase();
    const categoryName = request.item_category_name || request.category_name || "Category";
    const canCancel = ["PENDING", "DECLINED"].includes(status);

    return `
        <article class="my-borrow-card">
            <div class="my-borrow-card-inner">
                <div class="my-borrow-thumb" style="background-image: url('${imageUrl}')"></div>

                <div class="my-borrow-content">
                    <h3 class="my-borrow-title">${highlightText(request.item_name || "Unnamed Item", currentSearch)}</h3>
                    <p class="my-borrow-category">${escapeHtml(categoryName)}${request.condition ? ` • ${escapeHtml(request.condition)}` : ""}</p>

                    <p class="my-borrow-date-line">Start Date: ${formatDate(request.startDate)}</p>
                    <p class="my-borrow-date-line">Return Date: ${formatDate(request.returnDate)}</p>
                    <p class="my-borrow-deposit">Deposit: ₱${formatMoney(request.securityDepositSnapshot)}</p>

                    ${
                        status === "DECLINED" && request.declineReason
                            ? `
                                <div class="my-borrow-decline-box">
                                    <span class="my-borrow-decline-label">Decline Reason</span>
                                    <p>${escapeHtml(request.declineReason)}</p>
                                </div>
                            `
                            : ``
                    }

                    <div class="my-borrow-bottom-row">
                        ${getMyBorrowStatusHtml(status)}

                        ${
                            canCancel
                                ? `<button type="button" class="my-borrow-cancel-btn" onclick="handleMyBorrowCancel(${request.id}, '${escapeHtml(request.item_name || "Item").replaceAll("&#039;", "\\'")}')">Cancel</button>`
                                : ``
                        }
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderBorrowRequests() {
    if (!requestList) return;

    const filteredRequests = getFilteredRequests();
    console.log("filteredRequests:", filteredRequests);

    updateFilterNote(filteredRequests.length);

    if (!filteredRequests.length) {
        requestList.innerHTML = `
            <div class="request-empty">
                No requests found${currentSearch ? ` for "${escapeHtml(currentSearch)}"` : ""}.
            </div>
        `;
        return;
    }

    requestList.innerHTML = filteredRequests
        .map(request => {
            if (currentFilter === "my-borrow-request" || currentFilter === "history") {
                return createMyBorrowRequestCard(request);
            }

            return createIncomingRequestCard(request);
        })
        .join("");
}

/* =========================
   ACTION WRAPPERS
========================= */
function handleAcceptRequest(requestId) {
    openAcceptConfirmModal(requestId);
}

function handleDeclineRequest(requestId) {
    openDeclineReasonModal(requestId);
}

async function handleMyBorrowCancel(requestId, itemName) {
    const isConfirmed = confirm(`Cancel request for "${itemName}"?`);
    if (!isConfirmed) return;

    await cancelBorrowRequest(requestId);
}

window.handleAcceptRequest = handleAcceptRequest;
window.handleDeclineRequest = handleDeclineRequest;
window.handleMyBorrowCancel = handleMyBorrowCancel;

/* =========================
   LOAD
========================= */
async function getBorrowRequests() {
    const response = await fetch(API_URL + "users/owned-item-borrow-requests/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include"
    });

    const data = await response.json();
    console.log("owned-item-borrow-requests:", data);

    if (!response.ok) {
        throw new Error(data.detail || "Failed to load owned item borrow requests.");
    }

    ownedBorrowRequests = (Array.isArray(data) ? data : []).map(request => ({
        ...request,
        _requestType: "incoming"
    }));
}

async function getMyBorrowRequests() {
    const response = await fetch(API_URL + "users/my-borrow-requests/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include"
    });

    const data = await response.json();
    console.log("my-borrow-requests:", data);

    if (!response.ok) {
        throw new Error(data.detail || "Failed to load my borrow requests.");
    }

    myBorrowRequests = (Array.isArray(data) ? data : []).map(request => ({
        ...request,
        _requestType: "mine"
    }));
}

async function loadAllRequestData() {
    if (!requestList) return;

    try {
        await getBorrowRequests();
    } catch (error) {
        console.log("owned-item-borrow-requests error:", error);
        ownedBorrowRequests = [];
    }

    try {
        await getMyBorrowRequests();
    } catch (error) {
        console.log("my-borrow-requests error:", error);
        myBorrowRequests = [];
    }

    renderBorrowRequests();
}

if (cancelAcceptRequestBtn) {
    cancelAcceptRequestBtn.addEventListener("click", closeAcceptConfirmModal);
}

if (acceptConfirmModal) {
    acceptConfirmModal.addEventListener("click", (e) => {
        if (e.target === acceptConfirmModal) {
            closeAcceptConfirmModal();
        }
    });
}

if (confirmAcceptRequestBtn) {
    confirmAcceptRequestBtn.addEventListener("click", async () => {
        if (!pendingAcceptRequest) return;

        try {
            const acceptedRequest = pendingAcceptRequest;
            const itemId = acceptedRequest.item || acceptedRequest.item_id;

            const data = await acceptBorrowRequest(acceptedRequest.id);

            const siblingPendingRequests = ownedBorrowRequests.filter(request =>
                String(request.id) !== String(acceptedRequest.id) &&
                String(request.item || request.item_id) === String(itemId) &&
                String(request.status || "").toUpperCase() === "PENDING"
            );

            for (const request of siblingPendingRequests) {
                try {
                    await declineBorrowRequest(request.id, "Item is borrowed already.");
                } catch (error) {
                    console.error("Auto-decline failed:", error);
                }
            }

            closeAcceptConfirmModal();
            showToast(
                siblingPendingRequests.length
                    ? (data.message || "Borrow request approved.") + " Other pending requests were automatically declined."
                    : (data.message || "Borrow request approved."),
                "success"
            );

            await loadAllRequestData();
        } catch (error) {
            console.error("Accept request error:", error);
            showToast(error.message || "Failed to approve request.", "error");
        }
    });
}

if (cancelDeclineRequestBtn) {
    cancelDeclineRequestBtn.addEventListener("click", closeDeclineReasonModal);
}

if (declineReasonModal) {
    declineReasonModal.addEventListener("click", (e) => {
        if (e.target === declineReasonModal) {
            closeDeclineReasonModal();
        }
    });
}

if (submitDeclineRequestBtn) {
    submitDeclineRequestBtn.addEventListener("click", async () => {
        if (!pendingDeclineRequest) return;

        const declineReason = declineReasonInput?.value.trim() || "";

        if (!declineReason) {
            showToast("Please enter a decline reason.", "error");
            return;
        }

        try {
            const data = await declineBorrowRequest(pendingDeclineRequest.id, declineReason);
            closeDeclineReasonModal();
            showToast(data.message || "Borrow request declined.", "success");
            await loadAllRequestData();
        } catch (error) {
            console.error("Decline request error:", error);
            showToast(error.message || "Failed to decline request.", "error");
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (acceptConfirmModal?.classList.contains("show")) {
            closeAcceptConfirmModal();
        }

        if (declineReasonModal?.classList.contains("show")) {
            closeDeclineReasonModal();
        }
    }
});

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    if (requestSearch) {
        requestSearch.addEventListener("input", () => {
            currentSearch = requestSearch.value.trim().toLowerCase();
            renderBorrowRequests();
        });
    }

    updateActiveFilterButtons();

    await loadCurrentUser();
    await loadAllRequestData();

    syncRequestUrl();
});