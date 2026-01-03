// ==============================
// VARIABLES GLOBALES CARRUSEL
// ==============================
let currentSlide = 0;
let slideInterval;
const SLIDE_INTERVAL = 5000; // 5 segundos


// ==============================
// CARGAR HEADER
// ==============================
async function loadHeader() {
    const mount = document.getElementById("siteHeader");
    if (!mount) return;

    try {
        const basePath = window.location.pathname.includes('pages/') ? '../' : '/';
        const res = await fetch(`pages/header.html`);
        mount.innerHTML = await res.text();

        initNavbar(); // inicializa navbar luego de cargar HTML
    } catch (e) {
        console.error("Header load failed:", e);
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
// CARGAR FOOTER
// ==============================
async function loadFooter() {
    const mount = document.getElementById("siteFooter");
    if (!mount) return;

    try {
        const basePath = window.location.pathname.includes('pages/') ? '../' : '/';
        const res = await fetch(`${basePath}pages/footer.html`);
        mount.innerHTML = await res.text();
    } catch (e) {
        console.error("Footer load failed:", e);
    }
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
window.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    setYear();
});