import { db } from "./firebase.js";
import { collection, query, where, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { propertyCard } from "./property-card.js";

const grid = document.getElementById("featuredGrid");
const status = document.getElementById("featuredStatus");
const featured = query(
  collection(db, "propiedades"),
  where("estado", "==", "activa"),
  where("destacada", "==", true),
  limit(6)
);

onSnapshot(featured, (snapshot) => {
  grid.replaceChildren(...snapshot.docs.map((entry) => propertyCard(entry.data(), "h3")));
  grid.setAttribute("aria-busy", "false");
  status.textContent = snapshot.empty
    ? "Pronto tendremos nuevas propiedades destacadas. Mientras tanto, conoce Residencial Buenaventura."
    : "";
}, (error) => {
  console.error("No se pudieron cargar las destacadas:", error);
  grid.setAttribute("aria-busy", "false");
  status.textContent = "No pudimos actualizar las propiedades destacadas. Puedes consultar el catálogo o contactarnos.";
});
