/* =====================================================
   ABOUT.JS
   - "Lazy down" reveal on scroll
   - Lazy-load hero video on visibility (mobile-friendly)
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     1) Auto-mark reveal targets
  ========================= */
  const autoTargets = [
    "main > section",
    ".story__image",
    ".story__text",
    ".timeline",
    ".mvv-circle",
    ".team-card",
    ".why-band__visual",
    ".why-band__banner",
    ".why-band__item",
    ".about-cta__container",
    ".about-hero__content",
    ".about-hero__media"
  ].join(",");

  document.querySelectorAll(autoTargets).forEach((el) => {
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
  });

  const revealTargets = [...document.querySelectorAll(".reveal")];

  // If IntersectionObserver isn't supported, just show everything.
  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    // Also load any lazy video immediately.
    document.querySelectorAll("video[data-src]").forEach((v) => {
      v.src = v.dataset.src;
      v.removeAttribute("data-src");
      v.load();
      v.play().catch(() => {});
    });
    return;
  }

  /* =========================
     2) Reveal on scroll
  ========================= */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach((el) => revealIO.observe(el));

  /* =========================
     3) Lazy-load + play/pause videos
  ========================= */
  const videos = [...document.querySelectorAll("video[data-src]")];

  if (!videos.length) return;

  const videoIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;

        if (entry.isIntersecting) {
          // Lazy set src only once
          const src = v.dataset.src;
          if (src) {
            v.src = src;
            v.removeAttribute("data-src");
            v.load();
          }

          // Autoplay can fail on some devices; ignore errors
          v.play().catch(() => {});
        } else {
          // Pause when offscreen to save battery
          v.pause();
        }
      });
    },
    { rootMargin: "250px 0px", threshold: 0.15 }
  );

  videos.forEach((v) => videoIO.observe(v));
});
