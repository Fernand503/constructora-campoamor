// Un Menú móvil: abrir/cerrar
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const navMenu = document.getElementById("mainNav");

    if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("open");
    });
    }
});

// Filtro de propiedades por zona
const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".card[data-zona]");

filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const zona = btn.dataset.zona;

        cards.forEach(card => {
            const cardZona = card.dataset.zona;
            const show = (zona === "todas" || cardZona === zona);
            card.style.display = show ? "" : "none";
        });
    });
});