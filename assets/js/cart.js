export function createCart({ getProducts, getLanguage }) {
    const key = "ecoslidespty-cart-v1";
    const itemsContainer = document.querySelector("#cart-items");
    const message = document.querySelector("#cart-message");

    const cartDialog = document.querySelector("#cart-dialog");
    const cartLink = document.querySelector("#cart-link");
    const closeCartButton = document.querySelector("#close-cart");
    const checkoutButton = document.querySelector("#cart-checkout");

    function openCart() {
    if (!cartDialog.open) {
        cartDialog.showModal();
    }
    }

    cartLink.addEventListener("click", event => {
    event.preventDefault();
    openCart();
    });

    closeCartButton.addEventListener("click", () => {
    cartDialog.close();
    });

    checkoutButton.addEventListener("click", () => {
    if (!canCheckout()) {
        message.textContent = t(
        "Agrega productos disponibles y retira las selecciones no disponibles.",
        "Add available products and remove unavailable selections."
        );
        return;
    }

    cartDialog.close();

    const checkoutTitle = document.querySelector("#checkout-title");
    checkoutTitle.setAttribute("tabindex", "-1");
    checkoutTitle.focus({ preventScroll: true });

    document.querySelector("#checkout").scrollIntoView({
        block: "start"
    });
    });

  let items = [];

  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");

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
        const previous = combined.get(id);

        combined.set(id, {
          productId: item.productId,
          sizeId: item.sizeId,
          quantity: Math.min(
            99,
            item.quantity + (previous?.quantity || 0)
          )
        });
      }

      items = [...combined.values()];
    }
  } catch {
    items = [];
  }

  const t = (es, en) => getLanguage() === "es" ? es : en;

  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch {
      message.textContent = t(
        "El navegador no pudo guardar el carrito. La selección podría perderse al recargar.",
        "Your browser could not save the cart. Your selection may be lost when reloading."
      );
      return false;
    }
  }

  function resolve(item) {
    const product = getProducts().find(p => p.id === item.productId);
    const size = product?.product_sizes?.find(s => s.id === item.sizeId);

    return {
      product,
      size,
      available: Boolean(
        product?.is_available && size?.is_available
      )
    };
  }

  function render() {
    const language = getLanguage();

    closeCartButton.textContent = t("Cerrar", "Close");
    closeCartButton.setAttribute(
    "aria-label",
    t("Cerrar carrito", "Close cart")
    );

    checkoutButton.textContent = t(
    "Continuar con el pedido",
    "Continue with your order"
    );

    const money = cents => new Intl.NumberFormat(
      language === "es" ? "es-PA" : "en-US",
      { style: "currency", currency: "USD" }
    ).format(cents / 100);

    document.querySelector("#cart-title").textContent =
      t("Tu carrito", "Your cart");

    document.querySelector("#cart-link").textContent =
      `${t("Carrito", "Cart")} (` +
      items.reduce((sum, item) => sum + item.quantity, 0) + ")";

    itemsContainer.replaceChildren();

    let totalCents = 0;
    let hasUnavailable = false;

    if (!items.length) {
      itemsContainer.textContent =
        t("Tu carrito está vacío.", "Your cart is empty.");
    }

    for (const item of items) {
      const { product, size, available } = resolve(item);

      const row = document.createElement("article");
      row.style.padding = "16px";
      row.style.marginBottom = "12px";

      const title = document.createElement("h3");
      title.textContent = product
        ? (language === "es" ? product.name_es : product.name_en)
        : t("Producto no disponible", "Product unavailable");

      const details = document.createElement("p");
      details.textContent = size
        ? `${t("Talla", "Size")}: ${size.size_system} ${size.size_label}`
        : t("Talla no disponible", "Size unavailable");

      const quantityLabel = document.createElement("label");
      quantityLabel.textContent = t("Cantidad ", "Quantity ");

      const quantity = document.createElement("input");
      quantity.type = "number";
      quantity.min = "1";
      quantity.max = "99";
      quantity.step = "1";
      quantity.value = item.quantity;
      quantity.disabled = !available;
      quantity.style.width = "75px";

      quantity.addEventListener("change", () => {
        const value = Number(quantity.value);

        if (!Number.isInteger(value) || value < 1 || value > 99) {
          quantity.value = item.quantity;
          message.textContent =
            t("Usa una cantidad de 1 a 99.", "Use a quantity from 1 to 99.");
          return;
        }

        item.quantity = value;
        persist();
        render();
      });

      quantityLabel.append(quantity);

      const amount = document.createElement("p");

      if (available) {
        const cents = Math.round(Number(product.price) * 100);
        totalCents += cents * item.quantity;

        amount.textContent =
          `${money(cents)} × ${item.quantity} = ` +
          money(cents * item.quantity);
      } else {
        hasUnavailable = true;
        amount.textContent = t(
          "Esta selección ya no está disponible. Retírala del carrito.",
          "This selection is no longer available. Remove it from your cart."
        );
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = t("Eliminar", "Remove");

      remove.addEventListener("click", () => {
        items = items.filter(existing => existing !== item);
        message.textContent = "";
        persist();
        render();
      });

      row.append(title, details, quantityLabel, amount, remove);
      itemsContainer.append(row);
    }

    document.querySelector("#cart-total").textContent =
      `${t("Subtotal", "Subtotal")}: ${money(totalCents)}`;

    document.querySelector("#cart-note").textContent = hasUnavailable
      ? t(
          "El subtotal solo incluye las selecciones disponibles. Envío no incluido.",
          "Subtotal includes available selections only. Shipping is excluded."
        )
      : t(
          "Envío no incluido. Precio y disponibilidad se verificarán antes de confirmar el pedido.",
          "Shipping is excluded. Price and availability will be checked before confirming your order."
        );
  }

  function add(productId, sizeId) {
    const candidate = { productId, sizeId };
    const { available } = resolve(candidate);

    if (!available) {
      message.textContent =
        t("Selecciona una talla disponible.", "Select an available size.");
      return;
    }

    const existing = items.find(item =>
      item.productId === productId && item.sizeId === sizeId
    );

    if (existing?.quantity >= 99 || (!existing && items.length >= 100)) {
      message.textContent =
        t("Se alcanzó el límite del carrito.", "The cart limit has been reached.");
      return;
    }

    if (existing) {
      existing.quantity++;
    } else {
      items.push({ productId, sizeId, quantity: 1 });
    }

    message.textContent = t("Producto agregado.", "Product added.");
    persist();
    render();
    openCart();
  }

  function canCheckout() {
    return items.length > 0 &&
        items.every(item => resolve(item).available);
    }

    function getItems() {
    return items.map(item => ({ ...item }));
    }

    function removeSubmitted(submitted) {
        for (const sent of submitted) {
            const current = items.find(item =>
            item.productId === sent.productId &&
            item.sizeId === sent.sizeId
            );

            if (current) {
            current.quantity = Math.max(0, current.quantity - sent.quantity);
            }
        }

        items = items.filter(item => item.quantity > 0);
        persist();
        render();
    }

    if (window.location.hash === "#cart") {
        openCart();
    }

    return { add, render, canCheckout, getItems, removeSubmitted };
}