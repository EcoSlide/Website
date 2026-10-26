import { getLanguage, saveLanguage } from "./language.js";

let language = getLanguage();

function applyLanguage() {
  document.documentElement.lang = language;

  document.querySelectorAll("[data-es][data-en]").forEach(element => {
    element.textContent = element.dataset[language];
  });

  const button = document.querySelector("#home-language");

  if (button) {
    button.textContent = language === "es" ? "EN" : "ES";

    button.setAttribute(
      "aria-label",
      language === "es" ? "Switch to English" : "Cambiar a español"
    );
  }

  updateCartLabel();
}

function updateCartLabel() {
  document.querySelectorAll("[data-cart-label]").forEach(label => {
    const match = label.textContent.match(/\((\d+)\)/);
    const count = match ? match[1] : "0";

    label.textContent =
      `${language === "es" ? "Carrito" : "Cart"} (${count})`;
  });
}

document.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest("#home-language")) return;

  language = language === "es" ? "en" : "es";
  saveLanguage(language);
  applyLanguage();
});

// Aplicar también al header que se carga mediante fetch.
const headerMount = document.querySelector("#siteHeader");

if (headerMount) {
  const observer = new MutationObserver(applyLanguage);

  observer.observe(headerMount, {
    childList: true
  });
}

window.addEventListener("pageshow", () => {
  language = getLanguage();
  applyLanguage();
});

applyLanguage();