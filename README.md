# Constructora Campoamor — Bitácora de cambios

Sitio web inmobiliario para publicar, administrar y consultar propiedades en El Salvador.

## Convenciones

- Este README funciona como **bitácora** del estado y cambios principales.
- Si agregas nuevos cambios, añade una nueva fecha arriba con el resumen.
- Se omite intencionalmente la carpeta `/img`.

## 2026-09-07 — Navegación, catálogo y presentación

### Cambios

- Menú móvil común en las ocho páginas principales, con estado accesible, cierre con Escape y enlaces desde cualquier carpeta.
- Cabecera clara, colores y botones consistentes, tarjetas con título, zona, precio y contacto. Se conserva HTML/CSS/JavaScript, Firebase y GitHub Pages.
- Las rutas públicas canónicas son `/propiedades/`, `/ubicaciones/`, `/nosotros/`, `/contacto/` y `/terminos/`. Los archivos `.html` antiguos redirigen a estas páginas para evitar mantener dos versiones de cada sección.
- El catálogo consulta solo `estado == "activa"` y muestra 12 resultados por tanda, con botón para cargar más y para reintentar si falla la conexión. El orden público ahora es estable por ID de Firestore, en lugar de fecha; así no se exige desplegar un índice compuesto nuevo. Se lee un resultado adicional para saber si hay otra tanda. Inicio muestra como máximo seis destacadas activas.
- `JS/property-card.js` comparte las tarjetas públicas y los enlaces de WhatsApp, y trata los valores de Firestore como texto. Las URL de imágenes se validan y los errores muestran un aviso sin recargas infinitas.
- Galería de Buenaventura con cuatro indicadores, imágenes completas (`object-fit: contain`), contador y navegación manual circular. Se quitó el avance automático para permitir observar cada imagen con calma.
- Brochure cargado al abrir el modal. Copia para pantalla en `PDF/buenaventura-web.pdf`: **637.001 bytes**, frente a **10.859.761 bytes** del original (**94,1 % menos**). Conserva las dos páginas, sus dimensiones y todo el texto extraíble; las imágenes se redujeron a 160 ppp. El original sigue disponible para descargar e imprimir.
- Panel: suscripción a propiedades después del inicio de sesión, cancelación al salir, listado sin interpolar HTML, botones deshabilitados mientras trabajan y recuperación después de un error. El diálogo de eliminación admite teclado. La carga de imágenes acepta JPG, PNG y WebP hasta 10 MB, con validación del lado del cliente.
- Rutas de favicon y manifest corregidas; imágenes con dimensiones y carga diferida bajo el contenido inicial; nombres accesibles para mapas, controles y formularios.

### Comprobaciones reproducibles

Desde la raíz del repositorio, con Python 3 y Node.js 24:

```bash
python tests/check_site.py
node --experimental-vm-modules --test tests/behavior.test.mjs
```

La primera comprobación revisa 13 documentos HTML, rutas y recursos locales, anclas, IDs duplicados, etiquetas, referencias accesibles, importaciones y sintaxis JavaScript. La segunda ejecuta cinco pruebas con datos y servicios simulados: tarjetas y URL, paginación y reintentos, catálogo vacío, menú móvil y ciclo de sesión del panel. No se instalan dependencias de pruebas.

También se consultaron, sin autenticación ni escrituras, los filtros públicos de activas y destacadas en Firestore: ambos respondieron HTTP 200 y no devolvieron propiedades al momento de esta revisión.

El PDF optimizado se renderizó y se inspeccionaron sus dos páginas; el texto extraído y las dimensiones coinciden con el original. Esta revisión no incluye pruebas visuales del sitio en navegador ni operaciones reales de alta, archivo, eliminación, login o subida de imágenes.

### Revisión antes de publicar

- Revisar el aspecto en móvil y escritorio, la cuarta imagen y el regreso a la primera, el brochure y los enlaces de contacto.
- Probar con una cuenta autorizada el flujo de administración y la exportación del listado.
- Comprobar en Firebase las reglas de Firestore: ocultar el enlace Admin y revisar la sesión en JavaScript solo controla la interfaz. Las reglas reales no están incluidas en este repositorio y no se han modificado. La validación de carga también debe reforzarse en el preset de Cloudinary.

### Dónde editar

- `CSS/style.css`: diseño compartido; `Buenaventura/style.css`: presentación del proyecto.
- `JS/app.js`: menú; `JS/property-card.js`: tarjeta y WhatsApp; `JS/propiedades.js`: catálogo; `JS/home.js`: destacadas; `JS/admin.js`: panel; `JS/buenaventura.js`: brochure y contador de galería.
- Editar las páginas de cada carpeta; conservar los `.html` de la raíz como redirecciones. La cabecera y el pie siguen siendo HTML estático compartido por convención: aplicar cambios de navegación en las ocho páginas principales.

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
- Documentar la configuración de publicación actual de GitHub Pages.
- Versionar y probar las reglas de Firestore y las restricciones del preset de Cloudinary.
