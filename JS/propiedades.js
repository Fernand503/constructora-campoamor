import { db } from "./firebase.js";
import { collection, query, where, limit, startAfter, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { propertyCard } from "./property-card.js";

const grid = document.getElementById("propGrid");
const status = document.getElementById("catalogStatus");
const moreButton = document.getElementById("loadMore");
const pageSize = 12;
let cursor = null;
let loading = false;
let count = 0;
let hasMore = true;

async function loadProperties() {
  if (loading || !hasMore) return;
  loading = true;
  moreButton.disabled = true;
  moreButton.textContent = "Cargando…";
  grid.setAttribute("aria-busy", "true");
  status.textContent = "Cargando propiedades…";
  try {
    // El orden predeterminado por ID permite paginar sin un índice compuesto nuevo.
    const constraints = [where("estado", "==", "activa"), limit(pageSize + 1)];
    if (cursor) constraints.push(startAfter(cursor));
    const snapshot = await getDocs(query(collection(db, "propiedades"), ...constraints));
    const page = snapshot.docs.slice(0, pageSize);
    grid.append(...page.map((entry) => propertyCard(entry.data())));
    count += page.length;
    if (page.length) cursor = page[page.length - 1];
    hasMore = snapshot.size > pageSize;
    moreButton.hidden = !hasMore;
    moreButton.textContent = "Ver más propiedades";
    status.textContent = count
      ? `${count} propiedades mostradas.${hasMore ? " Puedes cargar más." : " Has visto todas las disponibles."}`
      : "Por ahora no hay propiedades publicadas. Contáctanos para conocer los proyectos disponibles.";
  } catch (error) {
    console.error("No se pudo cargar el catálogo:", error);
    status.textContent = "No pudimos cargar las propiedades. Inténtalo de nuevo o escríbenos por WhatsApp.";
    moreButton.hidden = false;
    moreButton.textContent = "Reintentar";
  } finally {
    loading = false;
    moreButton.disabled = false;
    grid.setAttribute("aria-busy", "false");
  }
}

moreButton.addEventListener("click", loadProperties);
loadProperties();
