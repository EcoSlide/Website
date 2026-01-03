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
        const res = await fetch("pages/HF_Home.html");
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
// CARRUSEL HERO
// ==============================
function initSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.querySelector('.hero-control.prev');
    const nextBtn = document.querySelector('.hero-control.next');

    if (slides.length === 0) return;

    slides[0].classList.add('active');
    if (dots.length > 0) dots[0].classList.add('active');

    function goToSlide(index) {
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;

        currentSlide = index;

        slides.forEach((slide, i) =>
            slide.classList.toggle('active', i === index)
        );

        dots.forEach((dot, i) =>
            dot.classList.toggle('active', i === index)
        );

        resetInterval();
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    nextBtn?.addEventListener('click', nextSlide);
    prevBtn?.addEventListener('click', prevSlide);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    resetInterval();

    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('mouseenter', () => clearInterval(slideInterval));
        hero.addEventListener('mouseleave', resetInterval);
    }
}

// ==============================
// CARRUSEL PROBLEM
// ==============================
function initProblemCarousel() {
    const track = document.querySelector('.problem__media .carousel-track');
    const slides = document.querySelectorAll('.problem__media .carousel-slide');
    const dots = document.querySelectorAll('.problem__media .carousel-dot');
    
    if (!track || slides.length === 0) return;

    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        // Update slides
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        currentSlide = index;
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
    }

    function startCarousel() {
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    function stopCarousel() {
        clearInterval(slideInterval);
    }

    // Add click event to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopCarousel();
            startCarousel();
        });
    });

    // Start the carousel
    showSlide(0);
    startCarousel();

    // Pause on hover
    track.addEventListener('mouseenter', stopCarousel);
    track.addEventListener('mouseleave', startCarousel);
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Your existing initialization code
    initProblemCarousel(); // Add this line
});

// ==============================
// INIT GENERAL
// ==============================
window.addEventListener("DOMContentLoaded", async () => {
    await loadHeaderFooter(); // ⬅️ header primero
    initSlider();             // luego hero
});