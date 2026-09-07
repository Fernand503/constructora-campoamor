// Los datos de Firestore se muestran como texto, nunca como HTML ejecutable.
export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

export function safeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  try {
    const url = new URL(raw, "https://constructoracampoamor.com/");
    if (url.protocol !== "https:") return null;
    // Conservar rutas locales para que también funcionen durante el desarrollo.
    if (!/^[a-z][a-z\d+.-]*:/i.test(raw) && url.origin === "https://constructoracampoamor.com") {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return url.href;
  } catch {
    return null;
  }
}

export function whatsappUrl(property) {
  const title = String(property.titulo || "esta propiedad");
  const zone = property.zona ? ` en ${property.zona}` : "";
  const price = property.precioTexto ? ` (${property.precioTexto})` : "";
  return `https://wa.me/50374681990?text=${encodeURIComponent(`Hola, me interesa ${title}${zone}${price}. ¿Me pueden dar más información?`)}`;
}

export function propertyCard(property, heading = "h2") {
  const card = element("article", "property-card");
  const media = element("div", "property-media");
  const placeholder = element("p", "image-placeholder", "Fotografía no disponible");
  const imageUrl = safeImageUrl(property.img);
  if (imageUrl) {
    const image = element("img");
    image.alt = String(property.titulo || "Propiedad en venta");
    image.width = 640;
    image.height = 420;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => media.replaceChildren(placeholder), { once: true });
    image.src = imageUrl;
    media.append(image);
  } else {
    media.append(placeholder);
  }
  const body = element("div", "property-body");
  body.append(
    element("p", "property-zone", property.zona || "Consulta la ubicación"),
    element(heading, "property-title", property.titulo || "Propiedad disponible"),
    element("p", "property-price", property.precioTexto || "Consultar precio"),
    element("p", "property-details", property.detalles || "Escríbenos para conocer los detalles.")
  );
  const contact = element("a", "btn btn-success", "Consultar por WhatsApp");
  contact.href = whatsappUrl(property);
  contact.target = "_blank";
  contact.rel = "noopener noreferrer";
  body.append(contact);
  card.append(media, body);
  return card;
}
