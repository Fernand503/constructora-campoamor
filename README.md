# Constructora Campoamor — Bitácora de cambios

Sitio web inmobiliario para publicar, administrar y consultar propiedades en El Salvador.

## Convenciones

- Este README funciona como **bitácora** del estado y cambios principales.
- Si agregas nuevos cambios, añade una nueva fecha arriba con el resumen.
- Se omite intencionalmente la carpeta `/img`.

## 2026-02-08 — Estado actual documentado

### Resumen

- Se consolidó el sitio público con navegación hacia páginas principales.
- Se dejó operativo el panel admin con flujo completo de alta y gestión de propiedades.
- Se integró almacenamiento de datos e imágenes y la exportación de reportes.

### Cambios por módulo

- **Inicio**
  - Sección de propiedades destacadas.
- **Propiedades**
  - Catálogo con tarjetas dinámicas.
- **Ubicaciones**
  - Página de proyectos/ubicaciones.
- **Nosotros**
  - Información institucional de la empresa.
- **Contacto**
  - Acceso directo a WhatsApp y teléfono.
- **Términos**
  - Página informativa.
- **Admin**
  - Inicio de sesión de administrador.
  - Alta de propiedades con formulario.
  - Carga de imágenes a Cloudinary.
  - Archivar/activar propiedades.
  - Eliminar propiedades.
  - Exportar listado a PDF.

### Integraciones y stack

- **HTML5**, **CSS3**, **JavaScript (ES Modules)**.
- **Firebase**
  - Authentication (sesión admin)
  - Firestore (almacenamiento de propiedades)
  - Storage (inicializado en proyecto)
- **Cloudinary** para carga de imágenes desde admin.
- **pdfMake** para generar PDF desde el panel admin.

### Estructura del repositorio (resumen)

```text
.
├── index.html
├── admin.html
├── propiedades.html
├── contacto.html
├── nosotros.html
├── ubicaciones.html
├── terminos.html
├── CNAME
├── favicon.ico
├── CSS/
│   └── style.css
├── JS/
│   ├── firebase.js
│   ├── app.js
│   ├── nav-auth.js
│   ├── home.js
│   ├── propiedades.js
│   └── admin.js
├── propiedades/
│   └── index.html
├── contacto/
│   └── index.html
├── nosotros/
│   └── index.html
├── ubicaciones/
│   └── index.html
└── terminos/
    └── index.html
```

### Flujo funcional principal

1. El admin inicia sesión en `admin.html`.
2. Desde el panel, sube imagen a Cloudinary.
3. Completa formulario y guarda propiedad en Firestore.
4. Las propiedades aparecen en:
   - inicio (si están marcadas como destacadas y activas),
   - listado general de propiedades.
5. Desde admin se puede archivar, activar, eliminar y exportar PDF.

## Próximos cambios sugeridos

- Documentar variables de entorno y credenciales públicas/privadas.
- Agregar instrucciones de despliegue (Firebase Hosting / Vercel / Netlify).
- Incluir validaciones de formularios más estrictas y manejo de errores centralizado.
