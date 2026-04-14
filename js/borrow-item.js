function getItemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

const itemId = getItemIdFromUrl()