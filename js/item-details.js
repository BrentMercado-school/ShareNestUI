const API_URL = "http://127.0.0.1:8000/api/";

function getItemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
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

async function getItemDetails() {
    const itemId = getItemIdFromUrl();

    if (!itemId) {
        alert("No item ID found.");
        return;
    }

    try {
        const response = await fetch(API_URL + `items/${itemId}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        console.log("Item details:", data);

        if (response.ok) {
            document.getElementById("item-name").textContent = data.name || "N/A";
            document.getElementById("item-category").textContent = data.category_name || "N/A";
            document.getElementById("item-description").textContent = data.description || "N/A";
            document.getElementById("item-condition").textContent = data.condition || "N/A";
            document.getElementById("item-security-deposit").textContent = data.security_deposit || "N/A";
            document.getElementById("item-note").textContent = data.note || "N/A";
            document.getElementById("item-borrowing-fee").textContent = data.borrowingFee || "N/A";
            document.getElementById("item-status").textContent = data.status || "N/A";
            document.getElementById("item-owner").textContent = data.owner_name || "N/A";

            const expectedReturnDateElement = document.getElementById("item-expected-return-date");
            const borrowButton = document.getElementById("open-borrow-modal");

            if (data.status === "BORROWED") {
                expectedReturnDateElement.textContent = formatDate(data.expected_return_date);
                if (borrowButton) {
                    borrowButton.style.display = "none";
                }
            } else {
                expectedReturnDateElement.textContent = "N/A";
                if (borrowButton) {
                    borrowButton.style.display = "inline-block";
                }
            }
        } else {
            alert(data.detail || "Failed to load item details.");
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}

getItemDetails();

const borrowModal = document.getElementById("borrow-modal");
const openBorrowModalBtn = document.getElementById("open-borrow-modal");
const closeBorrowModalBtn = document.getElementById("close-borrow-modal");
const borrowForm = document.getElementById("borrow-form");

if (openBorrowModalBtn && borrowModal) {
    openBorrowModalBtn.addEventListener("click", () => {
        borrowModal.style.display = "block";
    });
}

if (closeBorrowModalBtn && borrowModal) {
    closeBorrowModalBtn.addEventListener("click", () => {
        borrowModal.style.display = "none";
    });
}

if (borrowForm) {
    borrowForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const itemId = getItemIdFromUrl();
        const startDate = document.getElementById("start-date").value;
        const returnDate = document.getElementById("return-date").value;

        try {
            const response = await fetch(API_URL + `items/${itemId}/borrow/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    startDate,
                    returnDate
                })
            });

            const data = await response.json();
            console.log("Borrow response:", data);

            if (response.ok) {
                alert(data.message || "Borrow request submitted.");
                borrowForm.reset();
                borrowModal.style.display = "none";
            } else {
                alert(data.detail || JSON.stringify(data) || "Failed to borrow item.");
            }
        } catch (error) {
            console.log("Borrow error:", error);
            alert("Something went wrong.");
        }
    });
}