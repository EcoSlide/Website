// ==============================
// VARIABLES GLOBALES CARRUSEL
// ==============================
let currentSlide = 0;
let slideInterval;
const SLIDE_INTERVAL = 5000; // 5 segundos


// ==============================
// CARGAR HEADER + FOOTER (HF_Home.html)
// ==============================
async function loadHeaderFooter() {
    const headerMount = document.getElementById("siteHeader");
    const footerMount = document.getElementById("siteFooter");

    if (!headerMount && !footerMount) return;

    try {
        // Ruta correcta según tu estructura
        const res = await fetch("../pages/header_footer.html");
        const htmlText = await res.text();

        // Parsear el HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const header = doc.querySelector(".headerHome");
        const footer = doc.querySelector(".footerHome");

        if (headerMount && header) {
        headerMount.innerHTML = header.innerHTML;
        }

        if (footerMount && footer) {
        footerMount.innerHTML = footer.innerHTML;
        }

        // Inicializaciones que dependen del header/footer
        initNavbar();
        setYear();

    } catch (err) {
        console.error("Error loading HF_Home.html:", err);
    }
}

// ==============================
// NAVBAR + MOBILE + SEARCH
// ==============================
function initNavbar() {
    const burger = document.getElementById("burger");
    const mobileMenu = document.getElementById("mobileMenu");

    const desktopNav = document.querySelector(".nav");
    const desktopSearch = document.querySelector(".search-container");

    const mobileSearchSlot = document.getElementById("mobileSearchSlot");
    const mobileLinksSlot = document.getElementById("mobileLinksSlot");

    // --- Burger toggle ---
    if (burger && mobileMenu) {
        burger.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("is-open");
            burger.setAttribute("aria-expanded", String(isOpen));
        });
    }

    // --- Clonar buscador a mobile ---
    if (desktopSearch && mobileSearchSlot) {
        mobileSearchSlot.innerHTML = "";
        const searchClone = desktopSearch.cloneNode(true);
        searchClone.classList.add("is-mobile");
        mobileSearchSlot.appendChild(searchClone);
    }

    if (desktopSearch && mobileSearchSlot) {
        mobileSearchSlot.innerHTML = "";
        const searchClone = desktopSearch.cloneNode(true);
        searchClone.classList.add("is-mobile");

        // FIX: asegurar action correcto SIEMPRE
        const form = searchClone.querySelector("form.search-form");
        if (form) form.setAttribute("action", "../pages/search.html");
        mobileSearchSlot.appendChild(searchClone);
    }

    // --- Clonar links desktop → mobile ---
    if (desktopNav && mobileLinksSlot) {
        mobileLinksSlot.innerHTML = "";

        const desktopLinks = desktopNav.querySelectorAll(".nav__link");
        desktopLinks.forEach(link => {
            const a = document.createElement("a");
            a.className = "mobile-menu__link";
            a.href = link.getAttribute("href");
            a.textContent = link.textContent;
            mobileLinksSlot.appendChild(a);
        });
    }

    // --- Active link (robusto) ---
    const currentPath = new URL(window.location.href).pathname.replace(/\/$/, "");
    const allLinks = document.querySelectorAll(".nav__link, .mobile-menu__link");

    function setActiveLink() {
        let matched = false;

        allLinks.forEach(link => {
            const href = link.getAttribute("href");
            if (!href || href.startsWith("#")) return;

            const linkPath = new URL(href, window.location.href)
                .pathname.replace(/\/$/, "");

            const isHome =
                linkPath.endsWith("/index.html") &&
                (currentPath.endsWith("/") ||
                currentPath.endsWith("/index.html") ||
                currentPath === "");

            const isMatch = linkPath === currentPath || isHome;

            link.classList.toggle("is-active", isMatch);
            if (isMatch) matched = true;
        });

        // fallback Home
        if (!matched) {
            const homeLink = Array.from(allLinks).find(a => {
                const p = new URL(a.getAttribute("href"), window.location.href).pathname;
                return p.endsWith("/index.html");
            });
            homeLink?.classList.add("is-active");
        }
    }

    setActiveLink();

    // --- Click: activar y cerrar mobile ---
    allLinks.forEach(link => {
        link.addEventListener("click", () => {
            allLinks.forEach(l => l.classList.remove("is-active"));
            link.classList.add("is-active");

            if (mobileMenu?.classList.contains("is-open")) {
                mobileMenu.classList.remove("is-open");
                burger?.setAttribute("aria-expanded", "false");
            }
        });
    });
}

// ==============================
// AÑO AUTOMÁTICO
// ==============================
function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
}

// ==============================
// INIT GENERAL
// ==============================
window.addEventListener("DOMContentLoaded", async () => {
    await loadHeaderFooter(); // ⬅️ header primero
});
document.addEventListener("DOMContentLoaded", initNavbar);