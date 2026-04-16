const API_URL = "http://127.0.0.1:8000/api/"

async function getAllUserItems() {
    try {
        const response = await fetch(API_URL + "users/owned-items/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await response.json();
        const tbody = document.getElementById("owned-items");
        tbody.innerHTML = "";

        for (const item of data) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name || "N/A";

            const conditionCell = document.createElement("td");
            conditionCell.textContent = item.condition || "N/A";

            const secDepoCell = document.createElement("td");
            secDepoCell.textContent = item.security_deposit || "N/A";

            const noteCell = document.createElement("td");
            noteCell.textContent = item.note || "N/A";

            const borrowFeeCell = document.createElement("td");
            borrowFeeCell.textContent = item.borrowing_fee || item.borrowingFee || "N/A";

            const statusCell = document.createElement("td");
            statusCell.textContent = item.status || "N/A";

            const actionsCell = document.createElement("td");

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.style.marginRight = "8px";

            if (item.status === "BORROWED") {
                editBtn.disabled = true;
                editBtn.title = "Borrowed items cannot be edited";
            } else {
                editBtn.addEventListener("click", () => {
                    window.location.href = `edit-item.html?id=${item.id}`;
                });
            }

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.style.marginRight = "8px";

            if (item.status === "BORROWED") {
                deleteBtn.disabled = true;
                deleteBtn.title = "Borrowed items cannot be deleted";
            } else {
                deleteBtn.addEventListener("click", async () => {
                    const isConfirmed = confirm(`Are you sure you want to delete "${item.name}"?`);
                    if (!isConfirmed) return;

                    await deleteItem(item.id);
                });
             }   
            const viewBtn = document.createElement("button");
            viewBtn.textContent = "View Details";

            viewBtn.addEventListener("click", () => {
                window.location.href = `owned-item-details.html?id=${item.id}`;
            });

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            actionsCell.appendChild(viewBtn);

            if (item.status === "BORROWED") {
                const returnBtn = document.createElement("button");
                returnBtn.textContent = "Return";
                returnBtn.addEventListener("click", () => {
                    openReturnItemModal(item);
                });

                actionsCell.appendChild(returnBtn);
            }

            row.appendChild(nameCell);
            row.appendChild(conditionCell);
            row.appendChild(secDepoCell);
            row.appendChild(noteCell);
            row.appendChild(borrowFeeCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        }
    } catch (error) {
        console.log(error);
    }
}

async function getAllBorrowedUserItems() {

}

getAllBorrowedUserItems()
getAllUserItems()