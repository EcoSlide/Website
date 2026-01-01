// Variables globales para el carrusel
let currentSlide = 0;
let slideInterval;
const SLIDE_INTERVAL = 5000; // 5 segundos

// Función para cargar el encabezado
async function loadHeader() {
    const mount = document.getElementById("siteHeader");
    if (!mount) return;

    try {
        const res = await fetch("./pages/header.html");
        mount.innerHTML = await res.text();

        // Burger menu
        const burger = document.getElementById("burger");
        const mobileMenu = document.getElementById("mobileMenu");

        if (burger && mobileMenu) {
            burger.addEventListener("click", () => {
                const isOpen = mobileMenu.classList.toggle("is-open");
                burger.setAttribute("aria-expanded", String(isOpen));
            });
        }
    } catch (e) {
        console.error("Header load failed:", e);
    }
}

//Función para cargar el footer
async function loadFooter() {
    const mount = document.getElementById("siteFooter");
    if (!mount) return;

    try {
        const res = await fetch("./pages/footer.html");
        mount.innerHTML = await res.text();
    } catch (e) {
        console.error("Footer load failed:", e);
    }
}

// Función para configurar el año actual
function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
}

// Funcionalidad del carrusel
function initSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.querySelector('.hero-control.prev');
    const nextBtn = document.querySelector('.hero-control.next');
    
    if (slides.length === 0) return;

    // Mostrar el primer slide
    slides[0].classList.add('active');
    if (dots.length > 0) dots[0].classList.add('active');

    // Función para cambiar de slide
    function goToSlide(index) {
        // Si el índice está fuera de rango, ajustar
        if (index >= slides.length) {
            index = 0;
        } else if (index < 0) {
            index = slides.length - 1;
        }
        
        // Actualizar el slide actual
        currentSlide = index;
        
        // Actualizar las clases de los slides
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        // Actualizar los puntos de navegación
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Reiniciar el temporizador
        resetInterval();
    }
    
    // Función para ir al siguiente slide
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }
    
    // Función para ir al slide anterior
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }
    
    // Función para reiniciar el intervalo de transición
    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }
    
    // Event listeners para los botones de navegación
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    // Event listeners para los puntos de navegación
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Iniciar el carrusel automático
    resetInterval();
    
    // Pausar el carrusel cuando el mouse está sobre él
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        hero.addEventListener('mouseleave', () => {
            resetInterval();
        });
    }
}

// Inicializar todo cuando el DOM esté listo
window.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    setYear();
    initSlider();
});
