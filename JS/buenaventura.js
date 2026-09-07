const brochureModal = document.getElementById("modalPlanoA");
const brochureFrame = document.getElementById("brochureFrame");

// El documento se descarga al abrir el brochure, no al entrar al proyecto.
brochureModal.addEventListener("show.bs.modal", () => {
  if (!brochureFrame.hasAttribute("src")) {
    brochureFrame.src = brochureFrame.dataset.src;
  }
});

const gallery = document.getElementById("bvCarousel");
const galleryStatus = document.getElementById("galleryStatus");
gallery.addEventListener("slid.bs.carousel", (event) => {
  galleryStatus.textContent = `Imagen ${event.to + 1} de ${gallery.querySelectorAll(".carousel-item").length}`;
});
