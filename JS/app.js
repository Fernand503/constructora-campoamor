// Un Menú móvil: abrir/cerrar
const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

if (menuBtn && mainNav)
{
    menuBtn.addEventListener("click", () => {
        mainNav.classList.toggle("open");
    });
}

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

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav");

  if (!menuBtn || !nav) return;

  menuBtn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
});

