# AUDITORÍA — WCAG 2.2 AA · UX · Responsive

**Alcance:** `index.html`, `styles.css`, `script.js` · **Tipo:** estática, no destructiva (0 archivos fuente modificados)
**Base:** WCAG 2.2 AA (26 criterios) · **Fecha:** 2026-10-01

---

## 1. Resumen ejecutivo

**Veredicto: NO conforme con WCAG 2.2 AA.** Estructura semántica sólida (etiquetado de formularios impecable, jerarquía de encabezados sin saltos, landmarks correctos), pero 4 defectos invalidantes:

| # | Problema | Consecuencia |
|---|---|---|
| 1 | `aria-labelledby` roto + `aria-label` que sobrescribe el texto de las entradas | **El diario es ilegible con lector de pantalla.** La función principal de la app es inaccesible |
| 2 | `role="button"` con `tabindex="0"` y **cero** listeners de teclado | Control enfocable pero no activable con teclado |
| 3 | `--border-color` = `--bg-surface-alt` en tema oscuro | **Campos de formulario invisibles** (1.00:1) |
| 4 | 14 combinaciones de color bajo el mínimo; foco destruido al cambiar de vista | Falla 1.4.3, 1.4.11, 2.4.3 |

**Además (fuera de WCAG):** el Service Worker se registra desde una URL `blob:`, que los navegadores rechazan → la app **no es PWA offline-first** pese a anunciarlo en el título (`index.html:6`) y el pie (`:357`).

**Esfuerzo estimado:** 8–12 h para conformidad AA.

| Severidad | Cantidad |
|---|---|
| Críticos | 7 |
| Altos | 5 |
| Medios | 14 |
| Bajos | 15 |
| **Criterios conformes verificados** | **22** |

---

## 2. Hallazgos

### 2.1 Críticos (7)

| ID | Hallazgo | WCAG |
|---|---|---|
| **C1** | Referencia ARIA rota: la vista principal del diario no tiene nombre accesible | 1.3.1 A · 4.1.2 A · 2.4.6 AA |
| **C2** | Tema oscuro: los campos de formulario quedan sin borde visible | 1.4.11 AA · 1.4.1 A |
| **C3** | El texto de cada entrada es inaccesible al lector de pantalla | 4.1.2 A · 1.3.1 A |
| **C4** | `role="button"` sin activación por teclado | 2.1.1 A · 4.1.2 A |
| **C5** | Contraste insuficiente en 14 combinaciones de color | 1.4.3 AA |
| **C6** | El foco se destruye al cambiar de vista y al re-renderizar la lista | 2.4.3 A · 4.1.2 A |
| **C7** | El Service Worker nunca se registra → no hay PWA offline-first | — (UX) |

### 2.2 Altos (5)

| ID | Hallazgo | WCAG |
|---|---|---|
| **A1** | `.error-message` con `aria-live` sobre un nodo en `display:none` → nunca se anuncia | 4.1.3 AA |
| **A2** | Errores críticos sólo en un toast que desaparece a los 4 s, sin control; `role="status"` + `aria-live="assertive"` en conflicto | 4.1.3 AA · 2.2.1 A · 4.1.2 A |
| **A3** | Cabecera `sticky` sin `scroll-margin-top` → puede tapar el elemento enfocado | 2.4.11 AA · 2.4.7 AA |
| **A4** | `.card-form-entrada` `sticky` con `top: 5.5rem` desacoplado de la altura real de la cabecera (~5.2 rem) | 2.4.11 AA · 1.4.4 AA · 1.4.10 AA |
| **A5** | `aria-live` sobre un contenedor que se reconstruye entero en cada tecla del buscador | 4.1.3 AA · 2.2.2 A |

### 2.3 Medios (14)

| ID | Hallazgo | WCAG |
|---|---|---|
| **M1** | Sin `prefers-reduced-motion` (4 animaciones + `scroll-behavior: smooth`) | *best practice* (2.3.3 es AAA) |
| **M2** | `html { font-size: 16px }` anula el tamaño de fuente preferido del navegador | 1.4.4 AA |
| **M3** | Riesgo de scroll horizontal a 320 px con usuario largo | 1.4.10 AA |
| **M4** | Requisitos de contraseña sólo en `placeholder` (desaparece al escribir) | 3.3.2 A |
| **M5** | `::placeholder` sin estilo → valor del navegador ≈4.41:1 | 1.4.3 AA |
| **M6** | Contenido desenfocado sin afordancia visual (sólo `title`, inútil en táctil) | 1.4.1 A |
| **M7** | `.tarjeta-body` no expone su estado revelar/ocultar | 4.1.2 A |
| **M8** | Los `<article>` de las entradas no tienen nombre accesible | 4.1.2 A · 1.3.1 A |
| **M9** | Emoji decorativos dentro del texto que **sí** forma el nombre accesible (9 sitios) | 1.1.1 A · 4.1.2 A |
| **M10** | Toast «se ha perdido la conexión» en cada carga offline, aunque nunca se perdió | — (UX) |
| **M11** | `.status-dot` existe en el HTML pero no tiene regla CSS (indicador nunca pintado) | 1.1.1 A |
| **M12** | Sin `<noscript>`: la app entera depende de JS | progressive enh. |
| **M13** | Sin `<meta name="color-scheme">` | 1.4.11 (indirecto) |
| **M14** | Doble anuncio: `<small>` con `aria-live` **y** destino de `aria-describedby` | 4.1.3 AA |

### 2.4 Bajos (15)

| ID | Hallazgo |
|---|---|
| **B1** | `href="#login"` / `href="#registro"` no corresponden a ningún `id` (`vistaLogin` / `vistaRegistro`) |
| **B2** | `#inputBuscarEntrada` con `<label class="visually-hidden">` **y** `aria-label` redundantes |
| **B3** | `aria-required="true"` redundante con `required` (10 campos) |
| **B4** | Sin *skip link* ni `<nav>` (2.4.1 se cumple sólo por landmarks) |
| **B5** | Destello del tema claro: `alternarTema` se aplica en `DOMContentLoaded`, sin script anti-FOUC |
| **B6** | `min-height: 100vh` desborda con la barra de direcciones móvil (`100dvh`) |
| **B7** | Falta `theme-color` y `apple-mobile-web-app-*` |
| **B8** | Data-URI del favicon con `<`/`>` sin codificar dentro del atributo |
| **B9** | `scroll-behavior: smooth` global sin alternativa |
| **B10** | Checkbox nativo ≈13×13 px (2.5.8 se cumple por la etiqueta implícita, pero frágil) |
| **B11** | `idEntradaAEliminar` no se limpia al cerrar el `<dialog>` con `Esc` |
| **B12** | `title` del botón «ojo» congelado mientras `aria-label` cambia |
| **B13** | `user-select: none` impide copiar el diario hasta revelarlo |
| **B14** | `.card-lista-entradas` y `.connection-status-wrapper` sin regla CSS |
| **B15** | Sin `<meta name="author">` (entregable académico) |

---

## 3. Evidencia concreta

### 3.1 Referencias y estructura

| ID | Archivo:línea | Elemento | Comprobación |
|---|---|---|---|
| C1 | `index.html:246` | `<section id="vistaDiario" aria-labelledby="tituloDiario">` | `id="tituloDiario"` **no existe**; el real es `tituloDiarioForm` (`:252`). `tituloRegistro` (`:59`) y `tituloLogin` (`:184`) sí resuelven |
| C4 | `script.js:795` / `:1180` | `.tarjeta-body` con `tabindex="0" role="button"` | En todo `script.js`: `keydown` = **0**, `keyup` = **0**, `event.key/code` = **0**, `aria-pressed/expanded` = **0** |
| C6 | `script.js:727-746` | `mostrarVista()` | `contiene .focus(): false` · `contiene scroll: false` · `document.title: false` |
| C6 | `script.js:761` | `tarjetas.forEach(t => t.remove())` en `renderizarEntradas` | `se restaura el foco tras re-render: false` |
| C6 | `script.js:1239` | `dialogoConfirmacion.close()` | Devuelve el foco al `.btn-eliminar`, que ya fue borrado → foco a `<body>` |
| A5 | `index.html:324-329` + `script.js:1253-1258` | `#contenedorEntradas` con `aria-live="polite"` | Se repuebla en **cada tecla** del buscador; `aria-busy` true/false síncrono (`:757`/`:813`), sin cesión al hilo |
| B1 | `index.html:173`, `:238` | `href="#login"`, `href="#registro"` | 2/2 destinos inexistentes |
| M11 | `index.html:26` | `<span class="status-dot" aria-hidden="true"></span>` vacío | `.status-dot tiene regla CSS: NO` → 0×0 px, nunca se ve |
| B4 | — | — | `<nav>: 0` · `skip-link`: 0 |

### 3.2 Contraste (fórmula de luminancia relativa WCAG sobre los literales de `styles.css`)

| ID | Elemento | Combinación | Obtenido | Mínimo |
|---|---|---|---|---|
| C5 | `.tarjeta-fecha` (12.4 px) | `#94a3b8` / `#f8fafc` | **2.45:1** | 4.5 |
| C5 | `.app-footer` (13.2 px) | `#94a3b8` / `#ffffff` | **2.56:1** | 4.5 |
| C5 | `.tarjeta-fecha` oscuro | `#64748b` / `#334155` | **2.18:1** | 4.5 |
| C5 | `.toast-success` blanco / oscuro | `#16a34a`/`#22c55e` / `#ffffff` | **3.30 / 2.28:1** | 4.5 |
| C5 | `.toast-warning` | `#d97706` / `#ffffff` | **3.19:1** | 4.5 |
| C5 | `.badge-status.online` (12.8 px) | `#16a34a` / `#f0fdf4` | **3.15:1** | 4.5 |
| C5 | `.badge-status.offline` (12.8 px) | `#ea580c` / `#fff7ed` | **3.35:1** | 4.5 |
| C5 | `.banner-sync` (14 px) y `.tarjeta-badge-pendiente` (11.2 px) | `#d97706` / `#fffbeb` | **3.07:1** | 4.5 |
| C5 | `.link` oscuro | `#6366f1` / `#1e293b` | **3.27:1** | 4.5 |
| C5 | `.btn-primary` oscuro | `#6366f1` / `#ffffff` | **4.47:1** | 4.5 |
| C5 | `.btn-danger` oscuro | `#ef4444` / `#ffffff` | **3.76:1** | 4.5 |
| C5 | `.error-message` sobre `.input.error` | `#dc2626` / `#fef2f2` | **4.41:1** | 4.5 |
| **C2** | **Bordes de `input`/`textarea` — tema oscuro** | **`#334155` / `#334155`** | **1.00:1** | **3** |
| C2 | Bordes de campo — tema claro | `#e2e8f0` / `#f8fafc` | **1.18:1** | 3 |
| C5 | `--color-offline` / `--color-offline-bg` | no redefinidas en `body.dark-theme` | quedan los valores del tema claro | — |
| M5 | `::placeholder` | valor por defecto del navegador | ≈**4.41:1** | 4.5 |

### 3.3 Layout, teclado y otros

| ID | Archivo:línea | Comprobación |
|---|---|---|
| C2 | `styles.css:82` + `:59` + `:329` | `--border-color` = `#334155` y `--bg-surface-alt` = `#334155`; el borde se aplica en los 12 campos |
| C2 | `styles.css:18` / `:64` | `--text-muted` = `#94a3b8` (claro) / `#64748b` (oscuro) |
| C7 | `script.js:926-931` | `new Blob(...)` → `URL.createObjectURL` → `navigator.serviceWorker.register(blobUrl)`; el `catch` silencia el rechazo con `console.warn` |
| C7 | `index.html:3-12` | `manifest: 0` · `theme-color: 0` · `noscript: 0` · `color-scheme: 0` |
| A3 | `styles.css:139-147` + `:152-159` | `.app-header { position: sticky; z-index: 100 }`; `scroll-margin-top`/`scroll-padding-top` en el archivo = **0**; `overflow-x: hidden` = **no** → el desbordamiento sí produce scroll real. Cabecera ≈139 px en móvil |
| A4 | `styles.css:511-521` vs `:149-167` | `top: 5.5rem` (88 px) vs cabecera calculada ≈83 px → **~5 px de margen**; cualquier aumento de fuente la tapa |
| A1 | `styles.css:392` + `:399` + `script.js:265` | `.error-message { display: none }` → `:not(:empty) { display: block }`; el texto se inserta **mientras** sigue oculto |
| A2 | `index.html:48` + `script.js:834` + `:735` | `role="status"` + `aria-live="assertive"`; `}, 4000);` → `toast.remove()`; `.toast-container { pointer-events: none }` |
| A2 | `script.js:1077`, `:1107` | «usuario ya registrado», «El usuario no existe», «Contraseña incorrecta» → **sólo** toast |
| M3 | `styles.css:199-208` | `.user-greeting` sin `word-break`/`min-width: 0`; `.user-info-header` sin `flex-wrap` |
| M4 | `index.html:137` | `placeholder="Mínimo 8 caract., 1 mayús., 1 minús., 1 número"`; el patrón completo de `script.js:187` no aparece en el HTML |
| M9 | `index.html:40,168,233,293,296,252,305,346` + `script.js:792` | 9 sitios; contrastados: esos botones **no** llevan `aria-label`, luego el emoji se anuncia («puerta», «llave», «flecha») |
| B10 | `index.html:227` + `styles.css` | `#chkRecordarme` sin regla `input[type=checkbox]`; control nativo ≈13×13 px |
| B11 | `script.js:1177`, `:1233-1248` | El `<dialog>` nativo cierra con `Esc` **sin** pasar por los manejadores de cancelar/confirmar |

### 3.4 Lo que SÍ cumple (verificado — no tocar)

| Área | Verificación |
|---|---|
| **1.1.1** | 0 elementos `<img>` → no hay `alt` que revisar. Emoji decorativos de soporte visual con `aria-hidden="true"`: `.brand-icon` (`:18`), `#iconoTema` (`:33`), `.status-dot` (`:26`), `.empty-icon` (`:332`) |
| **1.3.1 / 2.4.6** | Jerarquía `h1 → h2 → h3` **sin saltos** en los 6 encabezados (salvo C1) |
| **1.3.4 / 1.3.5** | **11/11** campos con `<label for>` o `aria-label`; **22/22** `for` resuelven |
| **1.4.1** | Estados `.ok`/`.error` nunca por color solo: siempre `aria-invalid` + texto |
| **1.4.3** parcial | `.text-secondary` 4.76:1 · texto principal 13.99:1 · `.btn-primary` claro 6.29:1 · `.toast-error` 4.83:1 · `.link` claro 6.29:1 · `.btn-danger` claro 4.83:1 |
| **1.4.10** parcial | Mobile-first: 1 columna hasta 900 px (`.diario-layout`) y hasta 600 px (`.entradas-grid`); `box-sizing: border-box` global; `.toast-container { width: calc(100% - 3rem) }` encaja a 320 px |
| **1.4.11** parcial | Anillo `:focus-visible` global (`outline: 3px` + `offset: 3px`) = 5.81:1 claro / 4.00:1 oscuro. **0** `outline: none` en el archivo |
| **1.4.12** | Ningún contenedor con altura fija recorta texto; `overflow: hidden` sólo en `.visually-hidden`; `textarea` con `resize: vertical` |
| **2.1.1** parcial | Todos los controles nativos son operables por teclado. Única excepción: C4 |
| **2.4.1 / 2.4.2** | Landmarks (`<header>`/`<main>`/`<footer>` + 3 `<section aria-labelledby>`); `lang="es"`; título descriptivo |
| **2.4.11** parcial | `<dialog showModal()>` aporta trampa de foco, fondo `inert` y cierre con `Esc`; el foco inicial cae en **«Cancelar»** (opción segura) |
| **2.5.3** | «Editar» ⊂ «Editar entrada: {título}»; «Eliminar» ⊂ «Eliminar entrada: {título}» |
| **2.5.8** | `.btn` ≈47 px · `.btn-icon` ≈41 px · `.btn-sm` ≈33 px · `.btn-toggle-password` ≈41 px — todos ≥24×24. *Links* en línea exentos. Caso borderline: B10 |
| **3.3.1 / 3.3.3 / 3.3.4** | 13 mensajes de error textuales y específicos con sugerencia; unicidad de usuario comprobada antes de insertar (`script.js:318-321`) |
| **4.1.2 / 4.1.3** parcial | Roles nativos; `aria-busy` en la lista; `aria-describedby` en los 10 campos con error |
| **XSS** | `escaparHTML` (`script.js:866-874`) escapa `& < > " '` y se aplica a **todo** el contenido de usuario interpolado |
| **Integridad DOM** | **32/32** `getElementById` resuelven · **27/28** referencias `for`/`aria-*` resuelven (la 1 rota es C1) · **0** `id` duplicados · etiquetas balanceadas · `node --check` sin errores |

---

## 4. Recomendación de corrección

### 4.1 Críticos

| ID | Corrección |
|---|---|
| **C1** | `index.html:246` → `aria-labelledby="tituloDiarioForm"` (una línea) |
| **C2** | Separar el token del borde de campo: añadir `--border-field: #94a3b8` (claro) / `#cbd5e1` (oscuro, 7.6:1) y en `styles.css:329` usar `border: 1.5px solid var(--border-field)` |
| **C3** | En `script.js:795`, quitar `aria-label` del `div` y dejar el contenido como texto legible; añadir un `<button class="btn-revelar" aria-pressed="false" aria-controls="cuerpo-{id}">` real en `.tarjeta-header`; `aria-label` único por tarjeta en vez de repetido |
| **C4** | Resuelto por C3 (botón nativo). Si se conserva el `div`: delegación `keydown` para `e.key === 'Enter' \|\| e.key === ' '` con `preventDefault()` + actualización de `aria-pressed` |
| **C5** | Ajustar **sólo tokens**: `--text-muted: #64748b` · `--color-success: #0f7a37` · `--color-offline: #9a3412` · `--color-warning: #92400e` · `--color-error: #b91c1c`; oscuro: `--color-brand: #a5b4fc` (con texto `#1e1b4b` en `.btn-primary`), `--color-error: #fca5a5`, `--color-success: #86efac`. Separar `*-text` de `*-bg` en chips y toasts |
| **C6** | `mostrarVista()`: enfocar el primer campo de la vista destino + `scrollTo({top:0, behavior:'instant'})`. `renderizarEntradas`: mover el foco fuera de `#contenedorEntradas` tras repoblar. En el `<dialog`, añadir `autofocus` a «Cancelar» y enfocar explícitamente tras `close()` |
| **C7** | Extraer el Service Worker a `sw.js` en la raíz y registrar `./sw.js` (las URL `blob:` están prohibidas). Añadir `manifest.webmanifest` + `theme-color`, **o** retirar «PWA / Offline-First» del título y del pie |

### 4.2 Altos

| ID | Corrección |
|---|---|
| **A1** | `styles.css:391` — quitar `display: none` de `.error-message` y usar sólo `.error-message:empty { display: none }`, de modo que la región live esté siempre renderizada. `aria-describedby` ya cubre la segunda vía |
| **A2** | `index.html:48` → `role="alert"` + `aria-live="assertive"` (elimina el conflicto de rol). Añadir botón «Cerrar» por toast y subir `error`/`warning` a 8–10 s en lugar de borrado automático |
| **A3** | `:root { --header-h: 8.75rem }` (≈140 px móvil) / `@media (min-width:768px) { --header-h: 5.25rem }` + `html { scroll-padding-top: calc(var(--header-h) + .75rem) }` y `scroll-margin-top` en `:is(input, textarea, button, a, [tabindex])` |
| **A4** | `styles.css:519` → `top: calc(var(--header-h) + 1rem)` (reutiliza A3; elimina el número mágico) |
| **A5** | Quitar `aria-live` de `#contenedorEntradas`; crear un `<p id="resumenBusqueda" role="status" aria-live="polite" class="visually-hidden">` con «N entrada(s) encontrada(s)» y eliminar el `aria-busy` síncrono |

### 4.3 Medios

| ID | Corrección |
|---|---|
| **M1** | `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto } * { animation: none !important; transition-duration: .01ms !important } }` + `behavior: 'instant'` en `script.js:1210` |
| **M2** | `styles.css:98` → `font-size: 100%` |
| **M3** | `.user-greeting { min-width: 0; overflow-wrap: anywhere }` + `.user-info-header { flex-wrap: wrap }`. **No** usar `overflow-x: hidden` (ocultaría contenido) |
| **M4** | Añadir `<p id="ayudaPassword">` con las reglas y apuntar con `aria-describedby="ayudaPassword error-regPassword"` |
| **M5** | `input::placeholder, textarea::placeholder { color: var(--text-secondary); opacity: 1 }` |
| **M6** | Sustituir el `title` por el botón «👁 Mostrar contenido» siempre visible (mismo cambio que C3) |
| **M7** | `btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true'))` |
| **M8** | Dar `id` al `<h3>` de la tarjeta y `tarjeta.setAttribute('aria-labelledby', eseId)` |
| **M9** | Envolver los 9 emojis en `<span aria-hidden="true">` |
| **M10** | Añadir parámetro `esEvento = false` a `actualizarEstadoConexion` y no notificar en la invocación inicial (`script.js:951`) |
| **M11** | Añadir `.status-dot { width: .55rem; height: .55rem; border-radius: 50%; background: currentColor }` o eliminar el elemento |
| **M12** | `<noscript>` con aviso explícito de que la app requiere JavaScript |
| **M13** | `<meta name="color-scheme" content="light dark">` |
| **M14** | Quitar `aria-live` del `<small>` y dejar `aria-describedby` como mecanismo único |

### 4.4 Bajos

| ID | Corrección |
|---|---|
| **B1** | `href="#vistaLogin"` / `href="#vistaRegistro"` y actualizar el hash en `mostrarVista()` |
| **B2** | Dejar sólo el `<label class="visually-hidden">` |
| **B3** | Eliminar `aria-required` de los 10 campos |
| **B4** | `<a href="#main" class="skip-link">` + patrón `.visually-hidden:focus { … }` |
| **B5** | `<script>` inline en `<head>` que aplique `.dark-theme` antes del primer pintado |
| **B6** | `min-height: 100dvh` con fallback `100vh` |
| **B7** | `theme-color` + `apple-mobile-web-app-*` (tras C7) |
| **B8** | `encodeURIComponent` sobre el SVG, o moverlo a archivo `.svg` |
| **B9** | Dejar `scroll-behavior: smooth` sólo donde haga falta (o limpiarlo al aplicar M1) |
| **B10** | `input[type=checkbox] { width: 1.25rem; height: 1.25rem; accent-color: var(--color-brand) }` |
| **B11** | `dialogoConfirmacion.addEventListener('close', () => { idEntradaAEliminar = null })` |
| **B12** | Actualizar `title` junto a `aria-label`, o eliminarlo |
| **B13** | Quitar `user-select: none` de `.tarjeta-body` |
| **B14** | Estilar o eliminar `.card-lista-entradas` y `.connection-status-wrapper` |
| **B15** | `<meta name="author">` (sólo si lo exige la rúbrica) |

### 4.5 Orden sugerido

`C1`+`C2` (1 línea HTML + 4 CSS) → `C3`+`C4`+`M6`+`M7`+`M8` → `C5` → `A3`+`A4` → `C6`+`A5` → `A1`+`A2` → resto.

---

## 5. Pruebas que deben repetirse tras la corrección

| # | Prueba | Herramienta / método | Aceptación |
|---|---|---|---|
| 1 | **Recorrido completo sólo con teclado**: registro → login → crear → revelar → editar → eliminar → logout | Sin ratón: `Tab` / `Shift+Tab` / `Enter` / `Espacio` / `Esc` | Flujo completable. El control de revelar responde a `Enter` y `Espacio`. Foco visible en los 4 anchos |
| 2 | **Foco en 3 rutas**: (a) `Enter` en «Iniciar sesión»; (b) confirmar eliminación; (c) «Editar» | Grabación + panel *Accessibility* | El foco **nunca** queda en `<body>` ni en un nodo `display:none` |
| 3 | **Foco no tapado (A3/A4)** | `Tab` hasta `#entradaTitulo`/`#entradaContenido` tras scroll, a 320/390/768/1440 px y con zoom 200 % y 400 % | Ningún elemento enfocado oculto bajo la cabecera |
| 4 | **Reflow / scroll horizontal (M3)** | Emulate a 320 px y 1280 px @400 %; `scrollWidth <= clientWidth` | Sin scroll horizontal en los 4 anchos, con usuario de 60 caracteres |
| 5 | **Objetivos táctiles (2.5.8)** | `getBoundingClientRect()` de los 11 botones y el checkbox | ≥24×24 CSS px en los 4 anchos |
| 6 | **Contraste (C5, C2)** | Recalcular la tabla §3.2 con el *contrast picker* de DevTools + checker externo | ≥4.5:1 en las 14 combinaciones de texto; ≥3:1 en bordes |
| 7 | **Temas claro/oscuro** | Recorrer los 4 anchos en ambos | En oscuro los campos tienen borde visible y los chips usan el fondo del tema |
| 8 | **`prefers-reduced-motion` (M1)** | DevTools → *Rendering → Emulate* | Desaparecen `fadeIn`, `slideUp`, `scale()` y el scroll suave |
| 9 | **Service Worker (C7)** | Servir por HTTP + DevTools *Application → Service Workers*; luego *Offline* y recargar | SW registrado, la app funciona sin red y es instalable |
| 10 | **Lector de pantalla** (obligatorio: C1, C3, A1, A2) | **NVDA+Firefox**, **Narrator+Edge**, **VoiceOver+Safari/iOS** | Se anuncia el nombre de `#vistaDiario` · **el texto de cada entrada es audible** · los errores se anuncian al enfocar · el login incorrecto se puede leer sin prisa |
| 11 | **Alto contraste / forced-colors** | Windows Alto Contraste | Cabecera, badges y `<dialog>` distinguibles; ningún estado depende sólo de `box-shadow` |
| 12 | **`noscript` (M12)** | DevTools → *Disable JavaScript* | Aviso comprensible, no un formulario inerte |
| 13 | **axe DevTools** | 3 vistas × 2 temas × 4 anchos = 24 pasadas | **0** violaciones `critical`/`serious` |
| 14 | **Lighthouse** | Categoría Accessibility | ≥ 95 en las 3 vistas |
| 15 | **Re-chequeo estático** | `node --check script.js` + script de referencias DOM + script de contraste | 0 errores de sintaxis · 0 `id` duplicados · **28/28** referencias `for`/`aria-*` resuelven · **32/32** `getElementById` resuelven · 0 combinaciones bajo el mínimo |
| 16 | **Flujo end-to-end** | Playwright: registrar → login → 3 entradas → editar 1 → eliminar 1 → logout, interceptando la red | Sin errores de consola; las 3 entradas aparecen; el badge «Pendiente de Sync» aparece tras un POST fallido y desaparece al sincronizar |
| 17 | **Estrés de contenido** | Usuario 60 car., título 500 car., contenido 5 000 car., búsqueda con 0 resultados | Reflow, sin truncamiento, `aria-label` de «Editar/Eliminar» coherentes |
| 18 | **Estrés de cola** | 50 operaciones `pendientes` fallidas | Banner y resumen de búsqueda (`role="status"`) correctos |

---

## Anexo · Cambios realizados y pruebas ejecutadas

### Cambios

| Archivo | Acción | SHA-256 |
|---|---|---|
| `index.html` | **Sin modificar** (18 647 B) | `EB2A93371F1E597BB7E0A3981272B92AA80969C2205DF6D38157445739ED7629` |
| `styles.css` | **Sin modificar** (18 505 B) | `561EBE7EFEC701CBFEA8A046BD767BEA00D2911A6279E3B8A44D0CEBA542E5D2` |
| `script.js` | **Sin modificar** (51 029 B) | `1E9C0B3A7E0AD37213D2FD2D5A599F9A6EBECD0F1AB2ADCE3DA53AD94EEDA281` |
| `AUDITORIA.md` | **Creado** | — |

Los scripts de verificación se escribieron en `C:\Users\lenovo\AppData\Local\Temp\opencode\`, **fuera del proyecto**. Los 3 hashes son idénticos antes y después de la auditoría.

### Pruebas ejecutadas

| # | Prueba | Resultado |
|---|---|---|
| 1 | Existencia de los 3 archivos objetivo | ✅ |
| 2 | **`node --check script.js`** | ✅ sin errores de sintaxis |
| 3 | Hash SHA-256 antes/después | ✅ sin cambios |
| 4 | Balance de etiquetas (`header`×5, `footer`×3, `main`, `dialog`) | ✅ |
| 5 | IDs duplicados | ✅ 0 de 54 |
| 6 | `getElementById` → `id` del HTML | ✅ 32/32 |
| 7 | `for` / `aria-describedby` / `aria-labelledby` → `id` | ⚠️ 27/28 — **1 rota (C1)** |
| 8 | Patrón `error-${id}` vs `<small>` declarado | ✅ 10/10 (3 sin `<small>` correctos) |
| 9 | `href="#…"` vs `id` | ⚠️ 2/2 rotos (B1) |
| 10 | Jerarquía h1–h6 | ✅ sin saltos |
| 11 | Nombre accesible de los 11 botones | ✅ 11/11 |
| 12 | Etiquetado de los 12 campos | ✅ 12/12 |
| 13 | Contraste — 26 pares, ambos temas | ❌ **14 bajo el mínimo** |
| 14 | `--color-offline*` redefinidas en tema oscuro | ❌ no |
| 15 | Clases CSS usadas vs definidas | ⚠️ 4 sin estilo útil |
| 16 | Metadatos PWA (`manifest`, `theme-color`, `noscript`, `color-scheme`) | ❌ 0 cada uno |
| 17 | Registro de Service Worker | ❌ URL `blob:` |
| 18 | `prefers-reduced-motion`, `scroll-margin/padding-top`, `overflow-x` | ❌ ninguna presente |
| 19 | Supresión de foco (`outline: none/0`) | ✅ ninguna |
| 20 | Listeners de teclado en `script.js` | ❌ 0 `keydown`/`keyup` |
| 21 | `aria-pressed` / `aria-expanded` | ❌ ninguno |
| 22 | Gestión de foco en `mostrarVista` / `renderizarEntradas` | ❌ ausente en ambas |
| 23 | Breakpoints 320 / 390 / 768 / 1440 px | ✅ 600/768/900 bien elegidos |

### Límites de esta auditoría

**Auditoría estática.** No había navegador headless disponible (`no puppeteer`, `no playwright`), por lo que **no se midieron alturas reales de layout, ni se ejecutó un test de scroll horizontal real, ni se probó un lector de pantalla físico**. Los ratios de contraste **sí** son exactos (fórmula de luminancia relativa de WCAG sobre los literales de `styles.css`). El rechazo de la URL `blob:` procede de la especificación y debe confirmarse empíricamente (prueba 9). Los tamaños táctiles y la altura de la cabecera se **derivaron por cálculo** de `padding` + `font-size` + `line-height` declarados, no midiendo el render.

---

**36 hallazgos** (7 críticos · 5 altos · 14 medios · 15 bajos) · **22 criterios verificados como conformes**