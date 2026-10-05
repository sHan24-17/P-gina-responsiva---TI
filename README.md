# 📓 Mi Diario Personal — Página Web Responsiva & PWA

[![Validar y desplegar en GitHub Pages](https://github.com/sHan24-17/P-gina-responsiva---TI/actions/workflows/deploy.yml/badge.svg)](https://github.com/sHan24-17/P-gina-responsiva---TI/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://shan24-17.github.io/P-gina-responsiva---TI/)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG%202.2-AA%20Compliant-blue)](#-auditoría-técnica)

Aplicación web progresiva (**PWA**), responsiva y accesible para la gestión personal de diarios e historias cotidianas. Desarrollada para la asignatura **Desarrollo de Plataformas (RDA1)**.

🌐 **Demo en línea:** [https://shan24-17.github.io/P-gina-responsiva---TI/](https://shan24-17.github.io/P-gina-responsiva---TI/)

---

## 🚀 Características Principales

- 📱 **Diseño 100% Responsivo:** Adaptado para dispositivos móviles, tabletas y computadoras de escritorio.
- ⚡ **Offline-First (PWA):** Funcionamiento garantizado sin conexión a internet mediante Service Worker (`sw.js`) y manifest web (`manifest.webmanifest`).
- 💾 **Persistencia Local con IndexedDB:** Almacenamiento local seguro (`DiarioDB`) para usuarios, entradas de diario y cola de sincronización.
- 🔒 **Seguridad Basada en Web Crypto:** Hash SHA-256 para la autenticación de credenciales de usuario en el navegador.
- 🔄 **Sincronización Asíncrona:** Integración con API REST (simulación con JSONPlaceholder) para sincronizar cambios locales al recuperar conexión.
- ♿ **Accesibilidad (WCAG 2.2 AA):**
  - Navegación fluida por teclado.
  - Etiquetas ARIA y regiones semánticas (landmarks).
  - Alto contraste visual y compatibilidad con temas claro y oscuro.
- 🎨 **Soporte para Modo Claro / Oscuro:** Cambio dinámico de tema con persistencia en `localStorage`.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico:** Regiones ARIA, estructura accesible e inclusión de componentes nativos (`<dialog>`, `<main>`, `<header>`, `<article>`).
- **CSS3 Moderno:** Variables CSS (Custom Properties), Flexbox, CSS Grid y diseño fluido.
- **JavaScript Vanilla (ES6+):** Programación modular mediante patrones IIFE (`ModuloIndexedDB`, `ModuloSincronizacion`, `ModuloEntradas`, etc.).
- **IndexedDB API:** Base de datos NoSQL nativa en el navegador.
- **Service Worker API:** Estrategia de almacenamiento en caché para soporte offline.
- **GitHub Actions:** Integración y despliegue continuo (CI/CD) automático hacia GitHub Pages.

---

## 📁 Estructura del Proyecto

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # Flujo de CI/CD para GitHub Actions
├── AUDITORIA.md                # Informe completo de auditoría WCAG 2.2 AA y UX
├── index.html                  # Estructura principal del sitio y vistas
├── styles.css                  # Estilos responsivos, temas y accesibilidad visual
├── script.js                   # Lógica modular de la app, IndexedDB y sincronización
├── sw.js                       # Service Worker para funcionamiento offline (PWA)
├── manifest.webmanifest        # Manifiesto de Aplicación Web Progresiva
└── README.md                   # Documentación del proyecto
```

---

## 🧪 Pruebas y Despliegue Continuo (CI/CD)

El proyecto cuenta con un flujo automatizado en **GitHub Actions** que realiza las siguientes tareas en cada `push` a la rama `main`:

1. **Validación:** Comprueba la integridad y presencia de los archivos críticos del proyecto.
2. **Construcción y Preparación:** Empaqueta los artefactos de la web.
3. **Despliegue Automatizado:** Publica automáticamente la última versión en **GitHub Pages**.

---

## 📋 Auditoría Técnica

El proyecto incluye un informe técnico detallado en [`AUDITORIA.md`](./AUDITORIA.md) evaluando:
- **WCAG 2.2 AA:** 26 criterios analizados (jerarquía semántica, nombres accesibles, contraste de color, gestión del foco).
- **UX & Performance:** Estrategia PWA, rendimiento offline y respuesta visual.

---

## 👤 Autor

Shandé Rodríguez - Desarrollado como parte de las actividades prácticas de **Desarrollo de Plataformas**.
