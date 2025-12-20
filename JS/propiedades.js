import { db } from "./firebase.js";
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const grid = document.getElementById("propGrid");

async function cargarPropiedades() {
    const q = query(collection (db, "propiedades"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
        grid.innerHTML = "<p>No hay propiedades publicadas aún.</p>";
        return;
    }

    grid.innerHTML = snap.docs.map(doc => {
    const p = doc.data();

    return `
    <article class="card">
        <img 
        src="${p.img || "img/casa1.jpg"}"
        alt="${p.titulo || "Propiedad"}"
        onerror="this.src='img/casa1.jpg'"
        >
        <div class="card-body">
        <h2>${p.precioTexto || ""}</h2>
        <p><strong>Zona:</strong> ${p.zona || ""}</p>
        <p>${p.detalles || ""}</p>
        <a class="btn" target="_blank" href="contacto.html">
            Consultar por WhatsApp
        </a>
        </div>
    </article>
    `;
}).join("");
}

cargarPropiedades();