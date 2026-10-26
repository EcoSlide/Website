import { supabase } from "./services/supabase-client.js";
import { createCart } from "./cart.js";
import { getLanguage, saveLanguage } from "./language.js";

const grid = document.querySelector("#products");
const status = document.querySelector("#status");
const languageButton = document.querySelector("#language");
const retryButton = document.querySelector("#retry");

let language = getLanguage();
let products = [];

const t = (es, en) => language === "es" ? es : en;
const cart = createCart({
  getProducts: () => products,
  getLanguage: () => language
});

function updateTexts() {
  document.documentElement.lang = language;

  document.querySelector("#title").textContent =
    t("Nuestros modelos", "Our models");

  document.querySelector("#intro").textContent =
    t("Calzado artesanal hecho en Panamá.", "Handcrafted footwear from Panama.");

  languageButton.textContent = language === "es" ? "EN" : "ES";
  languageButton.setAttribute(
    "aria-label",
    t("Switch to English", "Cambiar a español")
  );

  retryButton.textContent = t("Reintentar", "Retry");
  grid.setAttribute("aria-label", t("Productos", "Products"));

  document.querySelectorAll("[data-es][data-en]").forEach(element => {
    element.textContent = element.dataset[language];
  });

}

function render() {
  updateTexts();
  grid.replaceChildren();

  for (const product of products) {
    const name = language === "es"
      ? product.name_es
      : product.name_en;

    const description = language === "es"
      ? product.description_es
      : product.description_en;

    const article = document.createElement("article");
    article.id = `product-${product.id}`;
    const placeholder = document.createElement("div");
    placeholder.className = "photo-placeholder";
    placeholder.textContent = t("Sin foto disponible", "No photo available");

    if (product.photoUrl) {
      const image = document.createElement("img");
      image.className = "product-photo";
      image.src = product.photoUrl;
      image.alt = (
        language === "es"
          ? product.photoAltEs
          : product.photoAltEn
      ) || name;
      image.loading = "lazy";

      image.addEventListener("error", () => {
        image.replaceWith(placeholder);
      });

      article.append(image);
    } else {
      article.append(placeholder);
    }

    const content = document.createElement("div");
    content.className = "product-content";

    const title = document.createElement("h2");
    title.textContent = name;

    const text = document.createElement("p");
    text.textContent = description;

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = new Intl.NumberFormat(
      language === "es" ? "es-PA" : "en-US",
      { style: "currency", currency: product.currency }
    ).format(product.price);

    content.append(title, text, price);

    const sizes = [...(product.product_sizes || [])].sort((a, b) =>
      a.size_system.localeCompare(b.size_system) ||
      a.sort_order - b.sort_order ||
      Number(a.size_label) - Number(b.size_label)
    );

    if (product.is_available && sizes.some(size => size.is_available)) {
      const label = document.createElement("label");
      label.textContent = t("Selecciona tu talla", "Select your size");

      const select = document.createElement("select");
      select.setAttribute("aria-label", `${label.textContent}: ${name}`);

      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = t("Elegir talla", "Choose a size");
      select.append(empty);

      for (const size of sizes) {
        const option = document.createElement("option");
        option.value = size.id;
        option.disabled = !size.is_available;
        option.textContent =
          `${size.size_system} ${size.size_label}` +
          (size.is_available
            ? ""
            : t(" — No disponible", " — Unavailable"));

        select.append(option);
      }

      label.append(select);
      content.append(label);

      const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = t("Agregar al carrito", "Add to cart");
        addButton.disabled = true;
        addButton.style.marginTop = "12px";

        select.addEventListener("change", () => {
        addButton.disabled = !select.value;
        });

        addButton.addEventListener("click", () => {
        cart.add(product.id, select.value);
        });

        content.append(addButton);

    } else {
      const availability = document.createElement("p");
      availability.textContent = product.is_available
        ? t("Sin tallas disponibles por el momento.", "No sizes currently available.")
        : t("No disponible por el momento.", "Currently unavailable.");

      content.append(availability);
    }

    if (product.production_days) {
      const delivery = document.createElement("p");
      delivery.textContent = t(
        `Elaboración: ${product.production_days} día(s).`,
        `Production: ${product.production_days} day(s).`
      );
      content.append(delivery);
    }

    article.append(content);
    grid.append(article);
  }

  status.textContent = products.length
    ? ""
    : t("Pronto tendremos modelos disponibles.", "New models coming soon.");
}

async function loadProducts() {
  retryButton.hidden = true;
  languageButton.disabled = true;
  grid.replaceChildren();
  status.textContent = t("Cargando productos…", "Loading products…");

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name_es, name_en,
        description_es, description_en,
        price, currency, is_available, production_days,
        product_sizes (
          id, size_label, size_system, is_available, sort_order
        ),
        product_images (
          id, storage_path, alt_es, alt_en, sort_order, created_at
        )
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = await Promise.all(data.map(async (product) => {
      const photos = [...(product.product_images || [])].sort((a, b) =>
        a.sort_order - b.sort_order ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id)
      );

      // Usar la primera foto que pueda abrirse.
      for (const photo of photos) {
        try {
          const { data: signed, error } = await supabase.storage
            .from("product-images")
            .createSignedUrl(photo.storage_path, 3600);

          if (!error && signed?.signedUrl) {
            return {
              ...product,
              photoUrl: signed.signedUrl,
              photoAltEs: photo.alt_es,
              photoAltEn: photo.alt_en
            };
          }
        } catch {
          // Si una foto falla, intentar con la siguiente.
        }
      }

      return product;
    }));

    render();
    cart.render();

    const targetId = window.location.hash.slice(1);
    if (targetId.startsWith("product-")) {
        document.getElementById(targetId)?.scrollIntoView({
            block: "start"
        });
    }

  } catch (error) {
    console.error("Error al cargar la tienda:", error);
    status.textContent = t(
      "No se pudo cargar la tienda. Intenta de nuevo.",
      "The store could not load. Please try again."
    );
    retryButton.hidden = false;
  } finally {
    languageButton.disabled = false;
  }
}

languageButton.addEventListener("click", () => {
  language = language === "es" ? "en" : "es";
  saveLanguage(language);
  render();
  cart.render();
});

const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");
const submitOrderButton = checkoutForm.querySelector('[type="submit"]');

let pendingOrder = null;
let sendingOrder = false;
let orderCompleted = false;

function lockCustomerFields(locked) {
  checkoutForm.querySelectorAll("input, textarea, select").forEach(field => {
    field.disabled = locked;
  });
}

checkoutForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (sendingOrder || orderCompleted) return;

  // Si hubo un fallo de conexión, reenviar exactamente el mismo pedido.
  if (!pendingOrder) {
    if (!cart.canCheckout()) {
      checkoutMessage.textContent = t(
        "Agrega productos disponibles y retira las selecciones no disponibles.",
        "Add available products and remove unavailable selections."
      );
      return;
    }

    const values = new FormData(checkoutForm);
    const customer = {};

    for (const field of [
      "name", "email", "phone", "region", "city", "address", "notes"
    ]) {
      customer[field] = String(values.get(field) || "").trim();
    }

    if ([
      "name", "email", "phone", "region", "city", "address"
    ].some(field => !customer[field])) {
      checkoutMessage.textContent = t(
        "Completa todos los campos obligatorios.",
        "Complete all required fields."
      );
      return;
    }

    pendingOrder = {
      requestId: crypto.randomUUID(),
      customer,
      items: cart.getItems()
    };
  }

  const turnstileToken = window.turnstile?.getResponse();

    if (!turnstileToken) {
    checkoutMessage.textContent = t(
        "Completa la verificación de seguridad antes de enviar.",
        "Complete the security check before submitting."
    );
    return;
    }

  sendingOrder = true;
  submitOrderButton.disabled = true;
  lockCustomerFields(true);

  checkoutMessage.textContent = t(
    "Enviando pedido de prueba…",
    "Submitting test order…"
  );

  try {
    const { data, error } = await supabase.functions.invoke(
        "create-order",
        {
            body: {
            ...pendingOrder,
            turnstileToken
            }
        }
    );

    if (error) {
      const httpStatus = error.context?.status;

      if (httpStatus === 422) {
        checkoutMessage.textContent = t(
            "Completa nuevamente la verificación de seguridad y vuelve a enviar. Conservamos el mismo pedido para el reintento.",
            "Complete the security check again and resubmit. We kept the same order for your retry."
        );
        return;
    }

      // Estos errores rechazan el envío antes de guardar el pedido.
      if ([400, 401, 403, 413, 415].includes(httpStatus)) {
        pendingOrder = null;
        lockCustomerFields(false);

        checkoutMessage.textContent = [401, 403].includes(httpStatus)
          ? t(
              "Esta prueba requiere tu sesión administradora. Inicia sesión y vuelve a intentarlo.",
              "This test requires your administrator session. Sign in and try again."
            )
          : t(
              "El envío fue rechazado. Revisa los datos y actualiza la tienda para comprobar la disponibilidad.",
              "Submission was rejected. Check your details and refresh the store to check availability."
            );

        return;
      }

      throw error;
    }

    if (!data?.order_number) {
      throw new Error("Missing order confirmation");
    }

    orderCompleted = true;

    const submittedItems = pendingOrder.items;
    pendingOrder = null;

    checkoutForm.reset();

    // El pedido ya está confirmado: un fallo local no debe reenviarlo.
    try {
      cart.removeSubmitted(submittedItems);
    } catch {
      console.warn("El carrito no pudo actualizarse tras confirmar el pedido.");
    }

    checkoutMessage.textContent = t(
      `Pedido de prueba #${data.order_number} recibido. Envío por cotizar y pago pendiente. No se realizó ningún cobro.`,
      `Test order #${data.order_number} received. Shipping requires a quote and payment is pending. No payment was taken.`
    );
  } catch {
    checkoutMessage.textContent = t(
      "No se pudo confirmar la respuesta. Pulsa el botón para reintentar el mismo envío sin duplicarlo. Conserva esta página abierta; los datos quedan bloqueados hasta confirmar.",
      "The response could not be confirmed. Press the button to retry the same submission without duplicating it. Keep this page open; details stay locked until confirmation."
    );
  } finally {
    sendingOrder = false;
    submitOrderButton.disabled = orderCompleted;

    if (!orderCompleted && window.turnstile) {
        window.turnstile.reset();
    }
    }
});

retryButton.addEventListener("click", loadProducts);

// Renovar los enlaces temporales si la página sigue abierta.
setInterval(() => {
  if (document.visibilityState === "visible") loadProducts();
}, 50 * 60 * 1000);

updateTexts();
loadProducts();