    import { supabase } from "./services/supabase-client.js";
import { getLanguage } from "./language.js";

const grid = document.querySelector("#home-products");
const status = document.querySelector("#home-products-status");

let language = getLanguage();
let products = [];
let loading = false;
let failed = false;

const t = (es, en) => language === "es" ? es : en;

function renderProducts() {
  grid.replaceChildren();

  status.textContent = loading
    ? t("Cargando modelos…", "Loading models…")
    : failed
      ? t(
          "No pudimos cargar los modelos. Puedes consultar el catálogo completo.",
          "We could not load the models. You can visit the full collection."
        )
      : products.length
        ? ""
        : t(
            "Pronto tendremos modelos disponibles.",
            "Available models are coming soon."
          );

  for (const product of products) {
    const name = (
      language === "es" ? product.name_es : product.name_en
    ) || product.name_es;

    const card = document.createElement("article");
    card.className = "current-model-card";

    const placeholder = document.createElement("div");
    placeholder.className = "current-model-card__placeholder";
    placeholder.textContent = t(
      "Foto no disponible",
      "Photo unavailable"
    );

    if (product.photoUrl) {
      const image = document.createElement("img");
      image.className = "current-model-card__photo";
      image.src = product.photoUrl;
      image.alt = (
        language === "es" ? product.altEs : product.altEn
      ) || name;
      image.loading = "lazy";
      image.decoding = "async";

      image.addEventListener("error", () => {
        image.replaceWith(placeholder);
      }, { once: true });

      card.append(image);
    } else {
      card.append(placeholder);
    }

    const body = document.createElement("div");
    body.className = "current-model-card__body";

    const title = document.createElement("h3");
    title.textContent = name;

    const price = document.createElement("p");
    price.className = "current-model-card__price";
    price.textContent = new Intl.NumberFormat(
      language === "es" ? "es-PA" : "en-US",
      {
        style: "currency",
        currency: product.currency
      }
    ).format(Number(product.price));

    const link = document.createElement("a");
    link.className = "current-model-card__link";

    const url = new URL("../../pages/shop.html", import.meta.url);
    url.hash = `product-${product.id}`;
    link.href = url.href;

    const hasSizes = product.product_sizes?.some(
      size => size.is_available
    );

    link.textContent = hasSizes
      ? t("Elegir talla", "Choose your size")
      : t("Ver modelo", "View model");

    link.setAttribute("aria-label", `${link.textContent}: ${name}`);

    body.append(title, price, link);
    card.append(body);
    grid.append(card);
  }
}

async function loadHomeProducts() {
  if (loading) return;

  loading = true;
  failed = false;
  renderProducts();

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name_es, name_en, price, currency,
        product_sizes (
          is_available
        ),
        product_images (
          id, storage_path, alt_es, alt_en,
          sort_order, created_at
        )
      `)
      .eq("is_published", true)
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) throw error;

    products = await Promise.all(data.map(async product => {
      const photos = [...(product.product_images || [])].sort(
        (a, b) =>
          a.sort_order - b.sort_order ||
          a.created_at.localeCompare(b.created_at) ||
          a.id.localeCompare(b.id)
      );

      for (const photo of photos) {
        try {
          const { data: signed, error: photoError } =
            await supabase.storage
              .from("product-images")
              .createSignedUrl(photo.storage_path, 3600);

          if (!photoError && signed?.signedUrl) {
            return {
              ...product,
              photoUrl: signed.signedUrl,
              altEs: photo.alt_es,
              altEn: photo.alt_en
            };
          }
        } catch {
          // Intentar con la siguiente foto.
        }
      }

      return product;
    }));
  } catch {
    products = [];
    failed = true;
  } finally {
    loading = false;
    renderProducts();
  }
}

if (grid && status) {
  window.addEventListener("languagechange", event => {
    language = event.detail.language;
    renderProducts();
  });

  window.addEventListener("pageshow", event => {
    language = getLanguage();
    renderProducts();

    if (event.persisted) loadHomeProducts();
  });

  // Renovar las fotos temporales en páginas abiertas mucho tiempo.
  setInterval(loadHomeProducts, 50 * 60 * 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      loadHomeProducts();
    }
  });

  loadHomeProducts();
}