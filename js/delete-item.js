async function deleteItem(itemId) {
    try {
        const response = await fetch(API_URL + `items/${itemId}/delete/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        const rawText = await response.text();
        console.log("Delete status:", response.status);
        console.log("Delete raw response:", rawText);

        let data = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            data = { detail: rawText || "Non-JSON response from server." };
        }

        if (response.ok) {
            alert(data.message || "Item deleted successfully.");
            if (typeof loadMyItems === "function") {
                await loadMyItems();
            } else if (typeof getAllUserItems === "function") {
                await getAllUserItems();
            }
        } else {
            alert(data.message || data.detail || "Failed to delete item.");
        }
    } catch (error) {
        console.log("deleteItem error:", error);
        alert("Something went wrong.");
    }
}