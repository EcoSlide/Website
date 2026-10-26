import { getLanguage } from "./language.js";

const storeUrl = new URL("../../pages/shop.html", import.meta.url);
storeUrl.hash = "cart";

function updateHomeCart() {
  let count = 0;

  try {
    const saved = JSON.parse(
      localStorage.getItem("ecoslidespty-cart-v1") || "[]"
    );

    if (Array.isArray(saved)) {
      const combined = new Map();

      for (const item of saved.slice(0, 100)) {
        if (
          !item ||
          typeof item.productId !== "string" ||
          typeof item.sizeId !== "string" ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 99
        ) continue;

        const id = `${item.productId}:${item.sizeId}`;

        combined.set(
          id,
          Math.min(99, (combined.get(id) || 0) + item.quantity)
        );
      }

      count = [...combined.values()]
        .reduce((sum, quantity) => sum + quantity, 0);
    }
  } catch {
    count = 0;
  }

  document.querySelectorAll("[data-store-cart]").forEach(link => {
    link.href = storeUrl.href;

    const label = link.querySelector("[data-cart-label]");

    if (label) {
        label.textContent =
        `${getLanguage() === "es" ? "Carrito" : "Cart"} (${count})`;
    }
  });
}

// El header se inserta después mediante fetch.
const headerMount = document.querySelector("#siteHeader");

if (headerMount) {
  const observer = new MutationObserver(updateHomeCart);

  observer.observe(headerMount, {
    childList: true
  });
}

window.addEventListener("storage", event => {
  if (
    event.key === "ecoslidespty-cart-v1" ||
    event.key === null
  ) {
    updateHomeCart();
  }
});

window.addEventListener("pageshow", updateHomeCart);

updateHomeCart();