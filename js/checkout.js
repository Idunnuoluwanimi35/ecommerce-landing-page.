const storageKey = "megamart-guest-cart-v1";
const checkoutForm = document.querySelector("#checkout-form");
const checkoutLayout = document.querySelector("#checkout-layout");
const checkoutEmpty = document.querySelector("#checkout-empty");
const summaryLines = document.querySelector("#summary-lines");
const summaryItemCount = document.querySelector("#summary-item-count");
const summarySubtotal = document.querySelector("#summary-subtotal");
const summaryDelivery = document.querySelector("#summary-delivery");
const summaryTotal = document.querySelector("#summary-total");
const demoReview = document.querySelector("#demo-review");

function loadCart() {
    try {
        const lines = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (!Array.isArray(lines)) return [];

        return lines.filter((line) => (
            line
            && typeof line.id === "string"
            && typeof line.name === "string"
            && Number.isFinite(Number(line.price))
            && Number(line.price) >= 0
            && Number.isInteger(Number(line.quantity))
            && Number(line.quantity) > 0
        )).map((line) => ({
            id: line.id,
            name: line.name,
            price: Number(line.price),
            quantity: Number(line.quantity),
        }));
    } catch {
        return [];
    }
}

const cart = loadCart();
const subtotal = cart.reduce((total, line) => total + line.price * line.quantity, 0);

function formatAmount(amount) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

function renderSummary() {
    summaryLines.replaceChildren();
    const itemCount = cart.reduce((total, line) => total + line.quantity, 0);
    summaryItemCount.textContent = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
    summarySubtotal.textContent = formatAmount(subtotal);

    cart.forEach((line) => {
        const row = document.createElement("div");
        row.className = "summary-line";

        const details = document.createElement("div");
        const name = document.createElement("div");
        name.className = "summary-line-name";
        name.textContent = line.name;
        const quantity = document.createElement("div");
        quantity.className = "summary-line-quantity";
        quantity.textContent = `${formatAmount(line.price)} × ${line.quantity}`;
        details.append(name, quantity);

        const lineTotal = document.createElement("strong");
        lineTotal.className = "summary-line-total";
        lineTotal.textContent = formatAmount(line.price * line.quantity);
        row.append(details, lineTotal);
        summaryLines.append(row);
    });
}

function updateDeliveryTotal() {
    const selectedDelivery = checkoutForm.querySelector('input[name="delivery"]:checked');
    const deliveryFee = Number(selectedDelivery?.dataset.fee || 0);
    summaryDelivery.textContent = formatAmount(deliveryFee);
    summaryTotal.textContent = formatAmount(subtotal + deliveryFee);
}

if (cart.length === 0) {
    checkoutLayout.hidden = true;
    checkoutEmpty.hidden = false;
} else {
    renderSummary();
    updateDeliveryTotal();
}

checkoutForm.querySelectorAll('input[name="delivery"]').forEach((option) => {
    option.addEventListener("change", updateDeliveryTotal);
});

checkoutForm.addEventListener("input", () => {
    demoReview.hidden = true;
});

checkoutForm.addEventListener("change", (event) => {
    if (event.target.name !== "delivery") demoReview.hidden = true;
});

checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (cart.length === 0 || !checkoutForm.reportValidity()) return;

    demoReview.hidden = false;
    demoReview.focus();
});