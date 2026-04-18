const returnItemModal = document.getElementById("return-item-modal");
const closeReturnItemModalBtn = document.getElementById("close-return-item-modal");
const returnItemForm = document.getElementById("return-item-form");

let selectedReturnItemId = null;

function openReturnItemModal(item) {
    selectedReturnItemId = item.id;
}

if (closeReturnItemModalBtn && returnItemModal) {
    closeReturnItemModalBtn.addEventListener("click", () => {
        returnItemForm.reset();
        selectedReturnItemId = null;
    });
}

if (returnItemModal) {
    returnItemModal.addEventListener("click", (e) => {
        if (e.target === returnItemModal) {
            returnItemModal.classList.remove("show");
            returnItemForm.reset();
            selectedReturnItemId = null;
        }
    });
}

if (returnItemForm) {
    returnItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const actualReturnDate = document.getElementById("actual-return-date").value;
        const damageFee = document.getElementById("damage-fee").value;
        const latePenaltyFee = document.getElementById("late-penalty-fee").value;
        const refundAmount = document.getElementById("refund-amount").value;

        try {
            const response = await fetch(API_URL + `items/${selectedReturnItemId}/return/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    actualReturnDate,
                    damageFee,
                    latePenaltyFee,
                    refundAmount
                })
            });

            const data = await response.json();
            console.log("Return form response:", data);

            if (response.ok) {
                alert(data.message || "Return form submitted successfully.");
                returnItemModal.classList.remove("show");
                returnItemForm.reset();
                selectedReturnItemId = null;

                if (typeof getAllUserItems === "function") {
                    await getAllUserItems();
                }
            } else {
                alert(JSON.stringify(data));
            }
        } catch (error) {
            console.log(error);
            alert("Something went wrong.");
        }
    });
}