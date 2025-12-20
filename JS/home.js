import { db } from "./firebase.js";
import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const grid = document.getElementById("featuredGrid");

const q = query(
    collection(db, "propiedades"),
    where("estado", "==", "activa"),
    where("destacada", "==", true)
);

onSnapshot(q, (snap) => {
    if (snap.empty) {
        grid.innerHTML = `<p class="mini">Aún no hay propiedades destacadas.</p>`;
        return;
    }

    grid.innerHTML = snap.docs.map((d) => {
        const p = d.data();

        return `
        <article class="card" data-zona="${p.zona || ""}">
        <img src="${p.img || "img/casa1.jpg"}" alt="${p.titulo || "propiedad"}" onerror="this.src='img/casa1.jpg'">
        <div class="card-body">
            <h3>${p.precioTexto || ""}</h3>
            <p><strong>Zona:</strong> ${p.zona || ""}</p>
            <p>${p.detalles || ""}</p>
            <a class="btn" target="_blank" href="contacto.html">
            Contáctanos por WhatsApp
            </a>
        </div>
    </article>
    `;
    }).join("");
});
