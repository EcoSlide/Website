// // ../assets/js/contact.js
(function () {
  const form = document.getElementById("contactForm");
  const waBtn = document.getElementById("sendWhatsApp");
  const waLink = document.getElementById("waLink");

  // Tu número (sin +, sin espacios)
  const WHATSAPP_NUMBER = "50763491342";

  function getFormValues() {
    const fd = new FormData(form);
    return {
      name: (fd.get("name") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      subject: (fd.get("subject") || "").toString().trim(),
      message: (fd.get("message") || "").toString().trim(),
    };
  }

  function buildWhatsAppText(v) {
    return [
      "EcoSlides — New message",
      "",
      `Name: ${v.name}`,
      `Email: ${v.email}`,
      `Subject: ${v.subject}`,
      "",
      "Message:",
      v.message,
    ].join("\n");
  }

  function openWhatsApp(text) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // Ajusta el link del aside (Open WhatsApp)
  if (waLink) {
    waLink.setAttribute("href", `https://wa.me/${WHATSAPP_NUMBER}`);
  }

  // Botón WhatsApp: valida y abre WhatsApp con el texto del form
  if (waBtn) {
    waBtn.addEventListener("click", () => {
      if (!form) return;

      // valida campos required antes de abrir WhatsApp
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const values = getFormValues();
      const text = buildWhatsAppText(values);
      openWhatsApp(text);
    });
  }
})();
