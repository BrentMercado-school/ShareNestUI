const openAddItemModalBtn = document.getElementById("open-add-item-modal");
const closeAddItemModalBtn = document.getElementById("close-add-item-modal");
const addItemModal = document.getElementById("add-item-modal");
const addItemForm = document.getElementById("add-item-form");
const categorySelect = document.getElementById("item-category");

/* LOAD CATEGORIES */
async function getCategories() {
    try {
        const response = await fetch(API_URL + "categories/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        const data = await response.json();

        categorySelect.innerHTML = `<option value="">Select category</option>`;

        data.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

    } catch (error) {
        console.log(error);
    }
}

/* RESET FORM */
function resetAddItemForm() {
    addItemForm.reset();

    const fee = document.getElementById("item-borrowing-fee");
    if (fee) fee.value = 50;
}

/* OPEN MODAL */
openAddItemModalBtn?.addEventListener("click", async () => {
    await getCategories();
    resetAddItemForm();
    addItemModal.classList.add("show");
});

/* CLOSE MODAL */
closeAddItemModalBtn?.addEventListener("click", () => {
    addItemModal.classList.remove("show");
});

/* CLOSE OUTSIDE */
addItemModal?.addEventListener("click", (e) => {
    if (e.target === addItemModal) {
        addItemModal.classList.remove("show");
    }
});

/* SUBMIT */
addItemForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        name: document.getElementById("item-name").value,
        category: document.getElementById("item-category").value,
        description: document.getElementById("item-description").value,
        condition: document.getElementById("item-condition").value,
        security_deposit: document.getElementById("item-security-deposit").value,
        note: document.getElementById("item-note").value,
        borrowingFee: document.getElementById("item-borrowing-fee").value
    };

    try {
        const response = await fetch(API_URL + "items/create/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const resData = await response.json();

        if (response.ok) {
            alert("Item added successfully");

            addItemModal.classList.remove("show");
            resetAddItemForm();

            // 🔥 REFRESH UI
            if (typeof getAllItems === "function") await getAllItems();
            if (typeof getLatestItems === "function") await getLatestItems();

        } else {
            alert(resData.message || resData.detail || "Failed to add item");
        }

    } catch (error) {
        console.log(error);
        alert("Something went wrong");
    }
});


// const openAddItemModalBtn = document.getElementById("open-add-item-modal");
// const closeAddItemModalBtn = document.getElementById("close-add-item-modal");
// const addItemModal = document.getElementById("add-item-modal");
// const addItemForm = document.getElementById("add-item-form");
// const categorySelect = document.getElementById("item-category");

// async function getCategories() {
//     try {
//         const response = await fetch(API_URL + "categories/", {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             credentials: "include"
//         });

//         const data = await response.json();

//         categorySelect.innerHTML = `<option value="">Select category</option>`;

//         for (const category of data) {
//             const option = document.createElement("option");
//             option.value = category.id;
//             option.textContent = category.name;
//             categorySelect.appendChild(option);
//         }
//     } catch (error) {
//         console.log(error);
//     }
// }

// function resetAddItemForm() {
//     addItemForm.reset();

//     const borrowingFeeInput = document.getElementById("item-borrowing-fee");
//     if (borrowingFeeInput) {
//         borrowingFeeInput.value = 50;
//     }
// }

// if (openAddItemModalBtn && addItemModal) {
//     openAddItemModalBtn.addEventListener("click", async () => {
//         await getCategories();
//         resetAddItemForm();
//         addItemModal.classList.add("show");
//     });
// }

// if (closeAddItemModalBtn && addItemModal) {
//     closeAddItemModalBtn.addEventListener("click", () => {
//         addItemModal.classList.remove("show");
//         resetAddItemForm();
//     });
// }

// if (addItemModal) {
//     addItemModal.addEventListener("click", (e) => {
//         if (e.target === addItemModal) {
//             addItemModal.classList.remove("show");
//             resetAddItemForm();
//         }
//     });
// }

// if (addItemForm) {
//     addItemForm.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         const name = document.getElementById("item-name").value;
//         const category = document.getElementById("item-category").value;
//         const description = document.getElementById("item-description").value;
//         const condition = document.getElementById("item-condition").value;
//         const security_deposit = document.getElementById("item-security-deposit").value;
//         const note = document.getElementById("item-note").value;
//         const borrowingFee = 20;

//         try {
//             const response = await fetch(API_URL + "items/create/", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 credentials: "include",
//                 body: JSON.stringify({
//                     name,
//                     category,
//                     description,
//                     condition,
//                     security_deposit,
//                     note,
//                     borrowingFee
//                 })
//             });

//             const data = await response.json();

//             if (response.ok) {
//                 alert("Item added successfully.");
//                 resetAddItemForm();
//                 addItemModal.classList.remove("show");

//                 if (typeof getAllUserItems === "function") {
//                     await getAllUserItems();
//                 }
//             } else {
//                 alert(data.message || data.detail || "Failed to add item.");
//                 console.log(data);
//             }
//         } catch (error) {
//             console.log(error);
//             alert("Something went wrong.");
//         }
//     });
// }