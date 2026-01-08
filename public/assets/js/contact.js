// (function () {
//   const form = document.getElementById("contactForm");
//   const waBtn = document.getElementById("sendWhatsApp");
//   const waLink = document.getElementById("waLink");

//   // Cambia aquí tu número real en formato internacional (Panamá +507XXXXXXXX)
//   const WHATSAPP_NUMBER = "5076XXXXXXXX";

//   function getFormData() {
//     if (!form) return null;
//     const data = new FormData(form);
//     return {
//       name: (data.get("name") || "").toString().trim(),
//       email: (data.get("email") || "").toString().trim(),
//       subject: (data.get("subject") || "").toString().trim(),
//       message: (data.get("message") || "").toString().trim(),
//     };
//   }

//   function buildMessage(d) {
//     return `EcoSlides Contact\n\nName: ${d.name}\nEmail: ${d.email}\nSubject: ${d.subject}\n\nMessage:\n${d.message}`;
//   }

//   function openWhatsApp(d) {
//     const text = encodeURIComponent(buildMessage(d));
//     const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
//     window.open(url, "_blank", "noopener,noreferrer");
//   }

//   // Click WhatsApp button
//   waBtn?.addEventListener("click", () => {
//     const d = getFormData();
//     if (!d || !d.name || !d.email || !d.subject || !d.message) {
//       alert("Please complete the form before sending via WhatsApp.");
//       return;
//     }
//     openWhatsApp(d);
//   });

//   // Link “Open WhatsApp”
//   waLink?.addEventListener("click", (e) => {
//     e.preventDefault();
//     const url = `https://wa.me/${WHATSAPP_NUMBER}`;
//     window.open(url, "_blank", "noopener,noreferrer");
//   });

//   // Submit form -> open mailto
//   form?.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const d = getFormData();
//     if (!d) return;

//     const subject = encodeURIComponent(`[EcoSlides] ${d.subject}`);
//     const body = encodeURIComponent(buildMessage(d));
//     const mailto = `mailto:info.ecoslide@gmail.com?subject=${subject}&body=${body}`;
//     window.location.href = mailto;
//   });
// })();
