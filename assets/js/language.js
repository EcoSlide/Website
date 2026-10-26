const LANGUAGE_KEY = "ecoslidespty-language";

export function getLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

export function saveLanguage(language) {
  if (!["es", "en"].includes(language)) return;

  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // La página puede cambiar de idioma aunque no pueda guardarlo.
  }

  window.dispatchEvent(new CustomEvent("languagechange", {
    detail: { language }
  }));
}