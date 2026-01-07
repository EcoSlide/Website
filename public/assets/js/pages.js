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
