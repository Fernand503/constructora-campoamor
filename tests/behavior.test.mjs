import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Doble mínimo de elementos: prueba lógica sin navegador ni servicios externos.
class Element {
  constructor(tag = "div") {
    this.tagName = tag; this.children = []; this.events = new Map();
    this.attrs = {}; this.dataset = {}; this.disabled = false;
    this.value = ""; this.files = []; this.checked = false;
    const classes = new Set();
    this.classList = { contains: (c) => classes.has(c), add: (c) => classes.add(c),
      toggle: (c, force = !classes.has(c)) => force ? classes.add(c) : classes.delete(c) };
  }
  set innerHTML(_) { throw new Error("Los datos no deben inyectarse como HTML"); }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return (this.text || "") + this.children.map((x) => x.textContent).join(""); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.text = ""; this.children = children; }
  setAttribute(k, v) { this.attrs[k] = v; }
  hasAttribute(k) { return k in this.attrs; }
  addEventListener(name, callback, options = {}) {
    const events = this.events.get(name) || []; events.push({ callback, once: options.once }); this.events.set(name, events);
  }
  async emit(name, event = {}) {
    const handlers = this.events.get(name) || [];
    this.events.set(name, handlers.filter((x) => !x.once));
    for (const handler of handlers) await handler.callback(event);
  }
  focus() { this.focused = true; }
  close() { this.open = false; }
  showModal() { this.open = true; }
}
function environment(ids = []) {
  const nodes = Object.fromEntries(ids.map((id) => [id, new Element()]));
  const document = new Element();
  document.documentElement = new Element();
  document.getElementById = (id) => nodes[id] || null;
  document.createElement = (tag) => new Element(tag);
  const breakpoint = new Element();
  const context = vm.createContext({ document, window: { matchMedia: () => breakpoint }, URL,
    console: { error() {} }, FormData, Date, setTimeout });
  return { nodes, document, breakpoint, context };
}
async function load(name, env, modules = {}) {
  const module = new vm.SourceTextModule(await readFile(new URL(`../JS/${name}`, import.meta.url), "utf8"), { context: env.context });
  await module.link(async (specifier) => {
    if (specifier === "./property-card.js") return load("property-card.js", env);
    const exports = modules[specifier] || modules[specifier.split('/').at(-1)];
    assert.ok(exports, `Dependencia de prueba: ${specifier}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context: env.context });
  });
  await module.evaluate();
  return module;
}
const firestore = {
  collection: (_, name) => name, query: (name, ...clauses) => ({ name, clauses }),
  where: (...args) => ({ where: args }), limit: (n) => ({ limit: n }),
  startAfter: (doc) => ({ cursor: doc.id }), orderBy: (...args) => ({ orderBy: args })
};
const tick = () => new Promise((resolve) => setImmediate(resolve));
const entry = (id, data = {}) => ({ id, data: () => ({ titulo: id, estado: "activa", ...data }) });
const snapshot = (docs) => ({ docs, size: docs.length, empty: !docs.length });

test("Tarjetas: texto sin ejecutar HTML, URL segura y mensaje de WhatsApp íntegro", async () => {
  const env = environment();
  const { namespace: cards } = await load("property-card.js", env);
  for (const value of [null, "", "javascript:alert(1)", "data:image/svg+xml,<svg/>", "http://unsafe.test/a.jpg"]) {
    assert.equal(cards.safeImageUrl(value), null);
  }
  assert.equal(cards.safeImageUrl("img/casa1.jpg"), "/img/casa1.jpg");
  assert.equal(cards.safeImageUrl("https://res.cloudinary.com/a.jpg"), "https://res.cloudinary.com/a.jpg");
  const property = { titulo: '<img src=x onerror="alert(1)">', zona: "Ilopango & centro", precioTexto: "$100,000", img: "javascript:alert(1)" };
  const card = cards.propertyCard(property);
  assert.ok(card.textContent.includes(property.titulo));
  assert.equal(card.children[0].children[0].tagName, "p");
  const contact = card.children[1].children.at(-1);
  const url = new URL(contact.href);
  assert.equal(url.hostname, "wa.me");
  assert.ok(url.searchParams.get("text").includes(property.zona));
  assert.ok(url.searchParams.get("text").includes(property.precioTexto));
  const withImage = cards.propertyCard({ img: "/img/missing.jpg" });
  await withImage.children[0].children[0].emit("error");
  assert.equal(withImage.children[0].textContent, "Fotografía no disponible");
});

test("Catálogo: filtro activo, cursor sin duplicados y recuperación después de error", async () => {
  const env = environment(["propGrid", "catalogStatus", "loadMore"]);
  const calls = []; let fail = false;
  const docs = Array.from({ length: 14 }, (_, i) => entry(String(i)));
  await load("propiedades.js", env, {
    "./firebase.js": { db: {} },
    "firebase-firestore.js": { ...firestore, getDocs: async (q) => {
      calls.push(q);
      if (fail) { fail = false; throw new Error("offline"); }
      const cursor = q.clauses.find((c) => c.cursor)?.cursor;
      const start = cursor === undefined ? 0 : Number(cursor) + 1;
      return snapshot(docs.slice(start, start + 13));
    } }
  });
  await tick();
  assert.equal(env.nodes.propGrid.children.length, 12);
  assert.deepEqual(Array.from(calls[0].clauses[0].where), ["estado", "==", "activa"]);
  assert.equal(env.nodes.loadMore.hidden, false);
  fail = true;
  await env.nodes.loadMore.emit("click");
  assert.equal(env.nodes.loadMore.textContent, "Reintentar");
  assert.equal(env.nodes.loadMore.disabled, false);
  assert.equal(env.nodes.propGrid.children.length, 12);
  await env.nodes.loadMore.emit("click");
  assert.equal(env.nodes.propGrid.children.length, 14);
  assert.equal(env.nodes.loadMore.hidden, true);
  assert.equal(calls.at(-1).clauses.find((c) => c.cursor).cursor, "11");
  assert.equal(new Set(env.nodes.propGrid.children.map((c) => c.textContent)).size, 14);
});

test("Catálogo vacío: mensaje útil y ninguna propiedad de ejemplo", async () => {
  const env = environment(["propGrid", "catalogStatus", "loadMore"]);
  await load("propiedades.js", env, { "./firebase.js": { db: {} },
    "firebase-firestore.js": { ...firestore, getDocs: async () => snapshot([]) } });
  await tick();
  assert.equal(env.nodes.propGrid.children.length, 0);
  assert.equal(env.nodes.loadMore.hidden, true);
  assert.match(env.nodes.catalogStatus.textContent, /no hay propiedades/);
});

test("Menú: abrir, cerrar con Escape y reiniciar al cambiar de ancho", async () => {
  const env = environment(["menuBtn", "mainNav"]);
  await load("app.js", env);
  await env.nodes.menuBtn.emit("click");
  assert.equal(env.nodes.mainNav.classList.contains("open"), true);
  assert.equal(env.nodes.menuBtn.attrs["aria-expanded"], "true");
  await env.document.emit("keydown", { key: "Escape" });
  assert.equal(env.nodes.mainNav.classList.contains("open"), false);
  assert.equal(env.nodes.menuBtn.focused, true);
  await env.nodes.menuBtn.emit("click");
  await env.breakpoint.emit("change");
  assert.equal(env.nodes.menuBtn.attrs["aria-expanded"], "false");
});

test("Admin: suscribirse después del login, recuperar botón al fallar y cancelar al salir", async () => {
  const ids = ["loginBox", "loginForm", "adminBox", "logoutBtn", "pdfBtn", "loginMsg", "list", "listStatus", "pDestacada", "pTitulo", "pZona", "pPrecio", "pImg", "pDetalles", "addBtn", "saveMsg", "pImgFile", "uploadImgBtn", "uploadMsg", "confirmModal", "email", "password"];
  const env = environment(ids);
  let authChanged, received, subscriptions = 0, cancellations = 0;
  const auth = { currentUser: null };
  await load("admin.js", env, {
    "./firebase.js": { auth, db: {} },
    "firebase-auth.js": { onAuthStateChanged: (_, callback) => { authChanged = callback; }, signOut() {}, signInWithEmailAndPassword() {} },
    "firebase-firestore.js": { ...firestore, addDoc() {}, serverTimestamp() {}, deleteDoc() {}, doc: (_, name, id) => id,
      updateDoc: async () => { throw new Error("permission-denied"); }, getDocs() {},
      onSnapshot: (_, callback) => { subscriptions++; received = callback; return () => cancellations++; } }
  });
  authChanged(null);
  assert.equal(subscriptions, 0);
  auth.currentUser = { uid: "admin" }; authChanged(auth.currentUser);
  assert.equal(subscriptions, 1);
  received(snapshot([entry("house", { titulo: "<script>malicious()</script>" })]));
  assert.ok(env.nodes.list.textContent.includes("<script>malicious()</script>"));
  const archive = env.nodes.list.children[0].children[1].children[0];
  await archive.emit("click");
  assert.equal(archive.disabled, false);
  assert.equal(archive.textContent, "Archivar");
  auth.currentUser = null; authChanged(null);
  assert.equal(cancellations, 1);
  assert.equal(env.nodes.list.children.length, 0);
  received(snapshot([entry("late")]));
  assert.equal(env.nodes.list.children.length, 0);
});
