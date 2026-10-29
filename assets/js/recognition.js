"use strict";
// The shared home-language.js module owns language selection and persistence.
// Keep the page title in sync with the language applied by that module.
(() => {
  const updateTitle = () => {
    document.title = document.documentElement.lang === "en"
      ? "Recognition & media | EcoSlidespty"
      : "Reconocimientos y medios | EcoSlidespty";
  };
  new MutationObserver(updateTitle).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });
  updateTitle();
})();
