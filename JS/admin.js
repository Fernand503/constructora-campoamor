import { auth, db } from "./firebase.js?";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// DOM
const loginBox  = document.getElementById("loginBox");
const loginForm = document.getElementById("loginForm");
const adminBox  = document.getElementById("adminBox");
const logoutBtn = document.getElementById("logoutBtn");
const pdfBtn = document.getElementById("pdfBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMsg = document.getElementById("loginMsg");
const list = document.getElementById("list");
const pDestacada = document.getElementById("pDestacada");
const pTitulo = document.getElementById("pTitulo");
const pZona = document.getElementById("pZona");
const pPrecio = document.getElementById("pPrecio");
const pImg = document.getElementById("pImg");
const pDetalles =document.getElementById("pDetalles");
const addBtn =document.getElementById("addBtn");
const saveMsg =document.getElementById("saveMsg");

// ==== CLOUDINARY UPLOAD ====
const CLOUD_NAME = "dzbtg9p9x";
const UPLOAD_PRESET = "campoamor_upload";

// input file (debes crearlo en el HTML)
const pImgFile = document.getElementById("pImgFile");
const uploadImgBtn = document.getElementById("uploadImgBtn");
const uploadMsg = document.getElementById("uploadMsg");

async function uploadPropertyImageToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "propiedades");

  const res = await fetch(url, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  return data.secure_url;
}

uploadImgBtn?.addEventListener("click", async () => {
  const old = uploadImgBtn.textContent;

  uploadImgBtn.classList.add("loading");
  uploadImgBtn.textContent = "Subiendo..."; // ✅ texto mientras sube
  uploadMsg.textContent = "";

  try {
    const file = pImgFile?.files?.[0];
    if (!file) throw new Error("No file selected");

    const url = await uploadPropertyImageToCloudinary(file);

    pImg.value = url;
    uploadMsg.textContent = "✅ Imagen subida y lista.";
  } catch (err) {
    console.error(err);
    uploadMsg.textContent = "❌ Error al subir imagen.";
  } finally {
    uploadImgBtn.classList.remove("loading");
    uploadImgBtn.textContent = "Subir imagen"; // ✅ vuelve a normal (NO se queda “Subiendo…”)
  }
});



// LOGIN
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = e.submitter;
    loginMsg.textContent = "";

  // animación click
    btn.classList.add("press");
    setTimeout(() => btn.classList.remove("press"), 120);

  // estado cargando
    btn.classList.add("loading");
    btn.textContent = "Entrando...";

    try {
    await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value
    );

    loginMsg.textContent = "✅ Sesión iniciada";

    // animar salida del login
    loginBox.classList.add("fade-out");

    } catch (err) {
    console.error(err);

    loginMsg.textContent = "❌ Correo o contraseña incorrectos";
    loginBox.classList.add("shake");
    setTimeout(() => loginBox.classList.remove("shake"), 300);

    } finally {
    btn.classList.remove("loading");
    btn.textContent = "Entrar";
    }
});


// Mostrar/ocultar según sesión
onAuthStateChanged(auth, (user) => {

        if (user) {
    loginBox.classList.add("hidden");
    adminBox.classList.remove("hidden");
    logoutBtn.classList.remove("hidden"); // 👈 mostrar
    pdfBtn.classList.remove("hidden");

    // animar y luego ocultar
    loginBox.classList.add("fade-out");
    setTimeout(() => {
        loginBox.classList.add("hidden");
        loginBox.classList.remove("fade-out");
        adminBox.classList.remove("hidden");
    }, 400);

    } else {
        adminBox.classList.add("hidden");
        logoutBtn.classList.add("hidden");
        pdfBtn.classList.add("hidden");

        // reset visual del login
        loginBox.classList.remove("hidden");
        loginBox.classList.remove("fade-out");
        loginBox.style.opacity ="";
        loginBox.style.transform = "";
    }
});

// Logout
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});


addBtn.addEventListener("click", async () => {
    saveMsg.textContent = "";

    const data = {
        titulo: pTitulo.value.trim(),
        zona: pZona.value.trim(),
        precioTexto: pPrecio.value.trim(),
        img: pImg.value.trim(),
        detalles: pDetalles.value.trim(),

        // Esto sera un extra útil desde ya
        estado: "activa", //activa | vendida | archivada
        destacada: pDestacada.checked, // Luego esto se va a utilizar
        createdAt: serverTimestamp()
    };

    if (!data.titulo || !data.zona || !data.precioTexto) {
        saveMsg.textContent = "❌ Completa Título, Zona y Precio.";
        adminBox.classList.add("shake");
        setTimeout(() => adminBox.classList.remove("shake"), 300);
        return;
    }

    if (!pImg.value.trim()) {
        saveMsg.textContent = "❌ Sube una imagen antes de guardar.";
        return;
    }


    // UI: loading
    addBtn.classList.add("loading");
    const oldText = addBtn.textContent;
    addBtn.textContent = "Guardando...";

    try {
        await addDoc(collection(db, "propiedades"), data);

        saveMsg.textContent = "✅ Propiedad guardada"
        // limpiar inputs
        pTitulo.value = "";
        pZona.value = "";
        pPrecio.value = "";
        pImg.value = "";
        pDetalles.value = "";
        pDestacada.checked = false;
        pImgFile.value = "";
        uploadMsg.textContent = "";
    } catch (error) {
        console.error(error);
        saveMsg.textContent = "❌ Error al guardar. Revisa consola.";
    } finally {
        addBtn.classList.remove("loading");
        addBtn.textContent = oldText;
    }
});

const propsQ = query(
    collection(db, "propiedades"),
    orderBy("createdAt", "desc")
);

onSnapshot(propsQ, (snap) => {
    if (!list) return;

    if (snap.empty) {
    list.innerHTML = `<p class="mini">No hay propiedades aún.</p>`;
    return;
    }

    list.innerHTML = snap.docs.map((d) => {
    const p = d.data();
    const id = d.id;

    const estado = p.estado || "activa";
    const esActiva = estado === "activa";

return `
    <div class="map-card ${!esActiva ? "is-archived" : ""}" style="padding:14px;">
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
        <div>
        <h3 style="margin:0;">${p.titulo || "Propiedad"}</h3>

        <div style="display:flex; gap:8px; align-items:center; margin-top:6px; flex-wrap:wrap;">
            <span class="badge ${esActiva ? "badge-ok" : "badge-off"}">
            ${esActiva ? "Activa" : "Archivada"}
            </span>

            ${p.destacada ? `<span class="badge badge-star">⭐ Destacada</span>` : ""}
        </div>

        <p class="mini" style="margin:6px 0 0;">
            <strong>Zona:</strong> ${p.zona || ""} ·
            <strong>Precio:</strong> ${p.precioTexto || ""}
        </p>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
        <button class="btn ${esActiva ? "" : "success"}" data-toggle="${id}">
            ${esActiva ? "Archivar" : "Activar"}
        </button>

        <button class="btn danger" data-del="${id}">
            Eliminar
        </button>
        </div>
    </div>
    </div>
`;
    }).join("");

  // Archivar/Activar
    list.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle");

        btn.classList.add("loading");
            const old = btn.textContent;
            btn.textContent = "Procesando...";

        const d = snap.docs.find((x) => x.id === id);
        const p = d?.data();
        const estado = p?.estado || "activa";
        const nuevoEstado = (estado === "activa") ? "archivada" : "activa";

        try {
        await updateDoc(doc(db, "propiedades", id), { estado: nuevoEstado });
        } catch (err) {
        console.error(err);
        alert("Error cambiando estado. Revisa consola.");
        }
    });
    });

  // Eliminar
    list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del");
        if (!(await confirmUI("¿Eliminar esta propiedad?"))) return;
        
        // 🔹 Loading
        btn.classList.add("loading");
        const old = btn.textContent;
        btn.textContent = "Eliminando...";

        try {
        await deleteDoc(doc(db, "propiedades", id));
        } catch (err) {
        console.error(err);
        alert("Error eliminando. Revisa consola.");
        } finally {
            //🔹 Siempre se ejecuta
            btn.classList.remove("loading");
            btn.textContent = old;
        }
    });
    });
});

function confirmUI(message) {
    const modal = document.getElementById("confirmModal");
    const text = document.getElementById("confirmText");
    const ok = document.getElementById("confirmOk");
    const cancel = document.getElementById("confirmCancel");

    text.textContent = message;
    modal.classList.remove("hidden");

    return new Promise((resolve) => {
    const cleanup = () => {
        modal.classList.add("hidden");
        ok.onclick = null;
        cancel.onclick = null;
    };

    ok.onclick = () => { cleanup(); resolve(true); };
    cancel.onclick = () => { cleanup(); resolve(false); };
    });
}

function formatDateYYYYMMDD(d = new Date()) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

pdfBtn?.addEventListener("click", async () => {
    try {
    pdfBtn.classList.add("loading");
    const old = pdfBtn.textContent;
    pdfBtn.textContent = "Generando PDF...";

    // ✅ Cambiá esto si querés incluir archivadas también:
    const q = query(
    collection(db, "propiedades"),
    orderBy("createdAt", "desc")
);

    const snap = await getDocs(q);

    const rows = snap.docs.map((d, i) => {
        const p = d.data();
        return [
        i + 1,
        p.titulo || "",
        p.zona || "",
        p.precioTexto || "",
        p.destacada ? "Sí" : "No",
        p.estado || "activa"
        ];
    });

    const hoy = formatDateYYYYMMDD();
    const docDefinition = {
        pageSize: "A4",
        pageMargins: [30, 40, 30, 40],
        content: [
        { text: "CONSTRUCTORA CAMPOAMOR", style: "title" },
        { text: `Listado de propiedades (${hoy})`, style: "subtitle" },
        { text: `Total: ${rows.length}`, margin: [0, 0, 0, 10] },

        {
            table: {
            headerRows: 1,
            widths: [22, "*", 80, 85, 65, 60],
            body: [
                ["#", "Título", "Zona", "Precio", "Destacada", "Estado"],
                ...rows
            ]
            },
            layout: "lightHorizontalLines"
        }
        ],
        styles: {
        title: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
        subtitle: { fontSize: 12, color: "#444", margin: [0, 0, 0, 12] }
        }
    };

    // pdfMake es global por los <script> del HTML
    window.pdfMake.createPdf(docDefinition).download(`propiedades_${hoy}.pdf`);

    pdfBtn.textContent = old;
    pdfBtn.classList.remove("loading");
    } catch (err) {
    console.error(err);
    alert("No se pudo generar el PDF. Revisa la consola.");
    pdfBtn.classList.remove("loading");
    pdfBtn.textContent = "Descargar PDF";
    }
});