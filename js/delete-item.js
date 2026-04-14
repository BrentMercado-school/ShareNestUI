async function deleteItem(itemId) {
    try {
        const response = await fetch(API_URL + `items/${itemId}/delete/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
            alert("Item deleted successfully.");
            await getAllUserItems();
        } else {
            alert(data.message || data.detail || "Failed to delete item.");
            console.log(data);
        }
    } catch (error) {
        console.log(error);
        alert("Something went wrong.");
    }
}