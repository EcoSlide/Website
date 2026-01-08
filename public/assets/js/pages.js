document.addEventListener("DOMContentLoaded", () => {
    const targets = document.querySelectorAll(
        ".card, .pillar, .metric, .roadmap__item, .impact-note"
    );

    if (!("IntersectionObserver" in window)) {
        targets.forEach(el => el.classList.add("is-visible"));
        return;
    }

    const io = new IntersectionObserver(
        entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
            }
        });
        },
        { threshold: 0.12 }
    );

    targets.forEach(el => io.observe(el));
});

/* =====================================================
    PROCESS.JS
    - Smooth scroll rail
    - Active rail on scroll
    - Lazy-load images & videos
    - Play/pause videos on visibility
    - Reveal animation
    ===================================================== */

    document.addEventListener("DOMContentLoaded", () => {

    /* =========================
        1) Smooth scroll (rail)
    ========================= */
    document.querySelectorAll('.rail__item[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
            });
        }
        });
    });

    /* =========================
        2) Active rail item on scroll
    ========================= */
    const railItems = [...document.querySelectorAll('.rail__item')];
    const steps = [...document.querySelectorAll('[id^="step-"]')];

    if (railItems.length && steps.length) {
        const railMap = new Map(
        railItems.map(item => [item.getAttribute('href').slice(1), item])
        );

        const railObserver = new IntersectionObserver(entries => {
        const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        railItems.forEach(i => i.classList.remove('is-active'));
        const active = railMap.get(visible.target.id);
        if (active) active.classList.add('is-active');

        }, { threshold: [0.35, 0.55, 0.7] });

        steps.forEach(step => railObserver.observe(step));
    }

    /* =========================
        3) Lazy load images & videos + reveal
    ========================= */
    const lazyImages = [...document.querySelectorAll('img[data-src]')];
    const lazyVideos = [...document.querySelectorAll('video.lazy-video[data-src]')];
    const revealItems = [...document.querySelectorAll('.reveal')];

    const mediaObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
        const el = entry.target;

        if (entry.isIntersecting) {

            /* Reveal animation */
            if (el.classList.contains('reveal')) {
            el.classList.add('is-visible');
            }

            /* Lazy image */
            if (el.tagName === 'IMG') {
            const src = el.dataset.src;
            if (src) {
                el.src = src;
                el.removeAttribute('data-src');
            }
            }

            /* Lazy video */
            if (el.tagName === 'VIDEO') {
            const src = el.dataset.src;
            if (src && !el.querySelector('source')) {
                const source = document.createElement('source');
                source.src = src;
                el.appendChild(source);
                el.load();
            }
            el.play().catch(() => {});
            }

        } else {
            /* Pause video when offscreen */
            if (el.tagName === 'VIDEO') {
            el.pause();
            }
        }
        });
    }, {
        rootMargin: '250px 0px',
        threshold: 0.15
    });

    [...lazyImages, ...lazyVideos, ...revealItems]
        .forEach(el => mediaObserver.observe(el));

});
