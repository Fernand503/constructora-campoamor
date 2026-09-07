import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { collection, addDoc, serverTimestamp, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { element, safeImageUrl } from "./property-card.js";

const byId = (id) => document.getElementById(id);
const loginBox = byId("loginBox");
const loginForm = byId("loginForm");
const adminBox = byId("adminBox");
const logoutBtn = byId("logoutBtn");
const pdfBtn = byId("pdfBtn");
const loginMsg = byId("loginMsg");
const list = byId("list");
const listStatus = byId("listStatus");
const pDestacada = byId("pDestacada");
const pTitulo = byId("pTitulo");
const pZona = byId("pZona");
const pPrecio = byId("pPrecio");
const pImg = byId("pImg");
const pDetalles = byId("pDetalles");
const addBtn = byId("addBtn");
const saveMsg = byId("saveMsg");
const pImgFile = byId("pImgFile");
const uploadImgBtn = byId("uploadImgBtn");
const uploadMsg = byId("uploadMsg");
const propertiesQuery = query(collection(db, "propiedades"), orderBy("createdAt", "desc"));
let unsubscribeProperties = null;

function busy(button, label) {
  const previous = button.textContent;
  button.disabled = true;
  button.textContent = label;
  return () => {
    button.disabled = false;
    button.textContent = previous;
  };
}

function resetPropertyForm() {
  for (const input of [pTitulo, pZona, pPrecio, pImg, pDetalles, pImgFile]) input.value = "";
  pDestacada.checked = false;
  uploadMsg.textContent = "";
}

pImgFile.addEventListener("change", () => {
  pImg.value = "";
  uploadMsg.textContent = "";
});

uploadImgBtn.addEventListener("click", async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  const file = pImgFile.files[0];
  if (!file) {
    uploadMsg.textContent = "Selecciona una imagen primero.";
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    uploadMsg.textContent = "Usa una imagen JPG, PNG o WebP de hasta 10 MB.";
    return;
  }
  const restore = busy(uploadImgBtn, "Subiendo…");
  pImgFile.disabled = true;
  addBtn.disabled = true;
  uploadMsg.textContent = "";
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "campoamor_upload");
    form.append("folder", "propiedades");
    const response = await fetch("https://api.cloudinary.com/v1_1/dzbtg9p9x/image/upload", { method: "POST", body: form });
    if (!response.ok) throw new Error(`Carga de imagen: HTTP ${response.status}`);
    const data = await response.json();
    if (!safeImageUrl(data.secure_url)) throw new Error("URL de imagen inválida");
    if (auth.currentUser?.uid !== userId) return;
    pImg.value = data.secure_url;
    uploadMsg.textContent = "Imagen subida y lista para guardar.";
  } catch (error) {
    console.error(error);
    uploadMsg.textContent = "No se pudo subir la imagen. Inténtalo de nuevo.";
  } finally {
    restore();
    pImgFile.disabled = false;
    addBtn.disabled = false;
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('[type="submit"]');
  if (button.disabled) return;
  const restore = busy(button, "Entrando…");
  loginMsg.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, byId("email").value.trim(), byId("password").value);
    byId("password").value = "";
  } catch (error) {
    console.error(error);
    loginMsg.textContent = "No se pudo iniciar sesión. Revisa tus datos y tu conexión.";
  } finally {
    restore();
  }
});

// Esta comprobación controla la interfaz. Los permisos reales deben validarse
// mediante las reglas de Firestore, que se administran fuera de este repositorio.
onAuthStateChanged(auth, (user) => {
  unsubscribeProperties?.();
  unsubscribeProperties = null;
  list.replaceChildren();
  listStatus.textContent = "";
  loginBox.classList.toggle("hidden", Boolean(user));
  for (const item of [adminBox, logoutBtn, pdfBtn]) item.classList.toggle("hidden", !user);
  if (user) {
    listStatus.textContent = "Cargando propiedades…";
    unsubscribeProperties = onSnapshot(propertiesQuery, (snapshot) => {
      if (auth.currentUser?.uid !== user.uid) return;
      renderProperties(snapshot);
    }, (error) => {
      if (auth.currentUser?.uid !== user.uid) return;
      console.error("No se pudo cargar la administración:", error);
      listStatus.textContent = "No pudimos cargar las propiedades. Revisa la conexión y los permisos de tu cuenta; después vuelve a iniciar sesión.";
    });
  } else {
    resetPropertyForm();
    saveMsg.textContent = "";
    byId("confirmModal").close();
  }
});

logoutBtn.addEventListener("click", async () => {
  const restore = busy(logoutBtn, "Cerrando sesión…");
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    saveMsg.textContent = "No se pudo cerrar la sesión. Inténtalo de nuevo.";
  } finally {
    restore();
  }
});

addBtn.addEventListener("click", async () => {
  if (!auth.currentUser || addBtn.disabled) return;
  saveMsg.textContent = "";
  const data = {
    titulo: pTitulo.value.trim(), zona: pZona.value.trim(),
    precioTexto: pPrecio.value.trim(), img: pImg.value.trim(),
    detalles: pDetalles.value.trim(), estado: "activa",
    destacada: pDestacada.checked, createdAt: serverTimestamp()
  };
  if (!data.titulo || !data.zona || !data.precioTexto) {
    saveMsg.textContent = "Completa título, zona y precio.";
    return;
  }
  if (!safeImageUrl(data.img)) {
    saveMsg.textContent = "Sube una imagen antes de guardar.";
    return;
  }
  const restore = busy(addBtn, "Guardando…");
  uploadImgBtn.disabled = true;
  pImgFile.disabled = true;
  try {
    await addDoc(collection(db, "propiedades"), data);
    saveMsg.textContent = "Propiedad guardada.";
    resetPropertyForm();
  } catch (error) {
    console.error(error);
    saveMsg.textContent = "No se pudo guardar. Revisa la conexión y los permisos de tu cuenta.";
  } finally {
    restore();
    uploadImgBtn.disabled = false;
    pImgFile.disabled = false;
  }
});

function renderProperties(snapshot) {
  listStatus.textContent = snapshot.empty ? "No hay propiedades todavía." : `${snapshot.size} propiedades en el panel.`;
  const cards = snapshot.docs.map((entry) => {
    const property = entry.data();
    const active = (property.estado || "activa") === "activa";
    const card = element("article", `map-card admin-property${active ? "" : " is-archived"}`);
    const info = element("div", "admin-property-info");
    const badges = element("div", "admin-badges");
    const label = active ? "Activa" : property.estado === "vendida" ? "Vendida" : "Archivada";
    badges.append(element("span", `badge ${active ? "badge-ok" : "badge-off"}`, label));
    if (property.destacada) badges.append(element("span", "badge badge-star", "Destacada"));
    info.append(element("h3", "", property.titulo || "Propiedad"), badges,
      element("p", "mini", `Zona: ${property.zona || ""} · Precio: ${property.precioTexto || ""}`));
    const actions = element("div", "admin-property-actions");
    const toggle = element("button", "btn btn-outline-primary", active ? "Archivar" : "Activar");
    toggle.type = "button";
    toggle.addEventListener("click", async () => {
      if (!auth.currentUser) return;
      const restore = busy(toggle, "Procesando…");
      try {
        await updateDoc(doc(db, "propiedades", entry.id), { estado: active ? "archivada" : "activa" });
      } catch (error) {
        console.error(error);
        listStatus.textContent = "No se pudo cambiar el estado. Inténtalo de nuevo.";
      } finally {
        restore();
      }
    });
    const remove = element("button", "btn danger", "Eliminar");
    remove.type = "button";
    remove.addEventListener("click", async () => {
      const userId = auth.currentUser?.uid;
      if (!userId || !(await confirmDelete(property.titulo || "esta propiedad"))) return;
      if (auth.currentUser?.uid !== userId) return;
      const restore = busy(remove, "Eliminando…");
      try {
        await deleteDoc(doc(db, "propiedades", entry.id));
      } catch (error) {
        console.error(error);
        listStatus.textContent = "No se pudo eliminar. Inténtalo de nuevo.";
      } finally {
        restore();
      }
    });
    actions.append(toggle, remove);
    card.append(info, actions);
    return card;
  });
  list.replaceChildren(...cards);
}

function confirmDelete(title) {
  const dialog = byId("confirmModal");
  if (dialog.open) return Promise.resolve(false);
  byId("confirmText").textContent = `¿Eliminar «${title}»? Esta acción no se puede deshacer.`;
  dialog.returnValue = "";
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "delete"), { once: true });
    dialog.showModal();
  });
}

pdfBtn.addEventListener("click", async () => {
  if (!auth.currentUser) return;
  const restore = busy(pdfBtn, "Generando PDF…");
  try {
    const snapshot = await getDocs(propertiesQuery);
    const rows = snapshot.docs.map((entry, index) => {
      const property = entry.data();
      return [index + 1, String(property.titulo || ""), String(property.zona || ""),
        String(property.precioTexto || ""), property.destacada ? "Sí" : "No", String(property.estado || "activa")];
    });
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    window.pdfMake.createPdf({
      pageSize: "A4", pageMargins: [30, 40, 30, 40],
      content: [
        { text: "CONSTRUCTORA CAMPOAMOR", style: "title" },
        { text: `Listado de propiedades (${date})`, margin: [0, 0, 0, 12] },
        { text: `Total: ${rows.length}`, margin: [0, 0, 0, 10] },
        { table: { headerRows: 1, widths: [22, "*", 80, 85, 65, 60],
          body: [["#", "Título", "Zona", "Precio", "Destacada", "Estado"], ...rows] }, layout: "lightHorizontalLines" }
      ],
      styles: { title: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] } }
    }).download(`propiedades_${date}.pdf`);
  } catch (error) {
    console.error(error);
    listStatus.textContent = "No se pudo generar el PDF. Revisa la conexión e inténtalo de nuevo.";
  } finally {
    restore();
  }
});
