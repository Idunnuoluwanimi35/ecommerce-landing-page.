const imageElements = document.querySelectorAll(".media-frame img[data-placeholder]");

function showImagePlaceholder(image) {
    const frame = image.closest(".media-frame");
    if (!frame) return;

    frame.dataset.placeholder = image.dataset.placeholder;
    frame.classList.add("is-missing");
    image.hidden = true;
}

imageElements.forEach((image) => {
    image.addEventListener("error", () => showImagePlaceholder(image));
    image.addEventListener("load", () => {
        image.hidden = false;
        image.closest(".media-frame")?.classList.remove("is-missing");
    });
    if (image.complete && image.naturalWidth === 0) showImagePlaceholder(image);
});

const hero = document.querySelector(".hero");
const heroImage = hero.querySelector(".media-hero img");
const heroSlides = [
    {
        eyebrow: "Best deal online on smart watches",
        firstLine: "SMART",
        secondLine: "WEARABLE.",
        discount: "80% OFF",
        image: "images/smart-watch-hero.webp.png",
        alt: "Featured smartwatch promotion",
        placeholder: "Smartwatch image",
    },
    {
        eyebrow: "Bring every beat a little closer",
        firstLine: "PURE",
        secondLine: "SOUND.",
        discount: "60% OFF",
        image: "images/phone image 2.png",
        alt: "Featured mobile promotion",
        placeholder: "Mobile image",
    },
    {
        eyebrow: "More power for everything you do",
        firstLine: "SMART",
        secondLine: "PHONES.",
        discount: "50% OFF",
        image: "images/galaxy-s22-ultra.webp.png",
        alt: "Featured smartphone promotion",
        placeholder: "Smartphone image",
    },
];
const heroDots = [...hero.querySelectorAll(".hero-dots button")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeHeroSlide = 0;
let heroTimer;
let slideshowPaused = false;

function showHeroSlide(index) {
    activeHeroSlide = (index + heroSlides.length) % heroSlides.length;
    const slide = heroSlides[activeHeroSlide];

    hero.querySelector("#hero-eyebrow").textContent = slide.eyebrow;
    hero.querySelector("#hero-title-first").textContent = slide.firstLine;
    hero.querySelector("#hero-title-second").textContent = slide.secondLine;
    hero.querySelector("#hero-discount").textContent = slide.discount;
    heroImage.alt = slide.alt;
    heroImage.dataset.placeholder = slide.placeholder;
    heroImage.hidden = false;
    heroImage.closest(".media-frame").classList.remove("is-missing");
    heroImage.src = slide.image;

    heroDots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeHeroSlide;
        dot.classList.toggle("is-active", isActive);
        if (isActive) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
    });
}

function stopHeroTimer() {
    window.clearInterval(heroTimer);
}

function startHeroTimer() {
    stopHeroTimer();
    if (reducedMotion || slideshowPaused || document.hidden || hero.matches(":hover") || hero.contains(document.activeElement)) return;
    heroTimer = window.setInterval(() => showHeroSlide(activeHeroSlide + 1), 2000);
}

hero.querySelector(".hero-arrow-prev").addEventListener("click", () => {
    showHeroSlide(activeHeroSlide - 1);
    startHeroTimer();
});
hero.querySelector(".hero-arrow-next").addEventListener("click", () => {
    showHeroSlide(activeHeroSlide + 1);
    startHeroTimer();
});
heroDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        showHeroSlide(index);
        startHeroTimer();
    });
});

const heroPauseButton = hero.querySelector(".hero-pause");
heroPauseButton.addEventListener("click", () => {
    slideshowPaused = !slideshowPaused;
    heroPauseButton.setAttribute("aria-label", slideshowPaused ? "Play slideshow" : "Pause slideshow");
    heroPauseButton.title = slideshowPaused ? "Play slideshow" : "Pause slideshow";
    heroPauseButton.innerHTML = slideshowPaused
        ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 7 5-7 5z"></path></svg>'
        : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10"></path></svg>';
    startHeroTimer();
});

hero.addEventListener("mouseenter", stopHeroTimer);
hero.addEventListener("mouseleave", startHeroTimer);
hero.addEventListener("focusin", stopHeroTimer);
hero.addEventListener("focusout", (event) => {
    if (!hero.contains(event.relatedTarget)) startHeroTimer();
});
document.addEventListener("visibilitychange", startHeroTimer);
startHeroTimer();

const productSearch = document.querySelector("#product-search");
const productSearchForm = document.querySelector("#product-search-form");
const productCards = [...document.querySelectorAll("[data-product-card]")];
const productGrid = document.querySelector("#featured-products");
const searchEmpty = document.querySelector("#search-empty");

function filterProducts() {
    const query = productSearch.value.trim().toLowerCase();
    let visibleProducts = 0;

    productCards.forEach((card) => {
        const matches = card.dataset.search.includes(query);
        card.hidden = !matches;
        if (matches) visibleProducts += 1;
    });

    productGrid.hidden = visibleProducts === 0;
    searchEmpty.hidden = visibleProducts !== 0;
}

productSearch.addEventListener("input", filterProducts);
productSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
    document.querySelector("#smartphones").scrollIntoView({ behavior: "smooth", block: "start" });
});

const catalog = new Map(
    [...document.querySelectorAll("[data-add-to-cart]")].map((button) => [
        button.dataset.id,
        { id: button.dataset.id, name: button.dataset.name, price: Number(button.dataset.price) },
    ]),
);
const cartCount = document.querySelector("#cart-count");
const cartDialog = document.querySelector("#cart-dialog");
const cartLines = document.querySelector("#cart-lines");
const cartEmpty = document.querySelector("#cart-empty");
const cartFooter = document.querySelector("#cart-footer");
const cartSubtotal = document.querySelector("#cart-subtotal");
const checkoutButton = document.querySelector("#checkout-button");
const clearCartButton = document.querySelector("#clear-cart");
const cartFooterActions = document.querySelector(".cart-footer-actions");
const storageKey = "megamart-guest-cart-v1";

function readCart() {
    try {
        const storedCart = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (!Array.isArray(storedCart)) return [];

        return storedCart.flatMap((line) => {
            const product = catalog.get(line.id);
            const quantity = Number(line.quantity);
            if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return [];
            return [{ ...product, quantity }];
        });
    } catch {
        return [];
    }
}

let cart = readCart();

function formatAmount(amount) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

function saveCart() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
        // The in-memory cart still works when browser storage is unavailable.
    }
}

function renderCart() {
    const itemCount = cart.reduce((total, line) => total + line.quantity, 0);
    const subtotal = cart.reduce((total, line) => total + line.price * line.quantity, 0);

    cartCount.textContent = String(itemCount);
    document.querySelector("#cart-trigger").setAttribute("aria-label", `Cart, ${itemCount} items`);
    cartLines.replaceChildren();
    cartEmpty.hidden = cart.length > 0;
    cartFooter.hidden = false;
    checkoutButton.disabled = cart.length === 0;
    clearCartButton.hidden = cart.length === 0;
    cartFooterActions.classList.toggle("is-empty", cart.length === 0);
    cartSubtotal.textContent = formatAmount(subtotal);

    cart.forEach((line) => {
        const row = document.createElement("div");
        row.className = "cart-line";

        const details = document.createElement("div");
        const name = document.createElement("div");
        name.className = "cart-line-name";
        name.textContent = line.name;
        const price = document.createElement("div");
        price.className = "cart-line-detail";
        price.textContent = `${formatAmount(line.price)} × ${line.quantity} = ${formatAmount(line.price * line.quantity)}`;
        details.append(name, price);

        const removeButton = document.createElement("button");
        removeButton.className = "cart-remove";
        removeButton.type = "button";
        removeButton.dataset.removeId = line.id;
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${line.name} from cart`);
        row.append(details, removeButton);
        cartLines.append(row);
    });
}

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
        const product = catalog.get(button.dataset.id);
        const existingLine = cart.find((line) => line.id === product.id);

        if (existingLine) existingLine.quantity = Math.min(99, existingLine.quantity + 1);
        else cart.push({ ...product, quantity: 1 });

        saveCart();
        renderCart();
        const originalLabel = "Add to cart";
        button.firstChild.textContent = "Added ";
        window.setTimeout(() => { button.firstChild.textContent = originalLabel; }, 1000);
    });
});

cartLines.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-id]");
    if (!removeButton) return;

    cart = cart.filter((line) => line.id !== removeButton.dataset.removeId);
    saveCart();
    renderCart();
});

document.querySelector("#cart-trigger").addEventListener("click", () => cartDialog.showModal());
document.querySelector("#cart-close").addEventListener("click", () => cartDialog.close());
checkoutButton.addEventListener("click", () => {
    if (cart.length > 0) window.location.assign("checkout.html");
});
clearCartButton.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
});
cartDialog.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
});

document.querySelectorAll(".favorite-button").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
        const isSaved = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!isSaved));
    });
});

renderCart();