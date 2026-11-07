# Estado · Bodega

Última actualización: 2026-11-07

## Dónde vamos

- **Fase 0 · Propuesta: aprobada.**
- **Fase 1 · Herramienta: v0.1.0 publicada.**
- **Fase 2 · Escritorio (Tauri): plan aprobado y decisiones cerradas.** Sigue la preparación.

## Hecho

### Fase 1 · v0.1.0

- Motor: escaneo por ecosistema, carpetas globales, discos, puertos, daemons, escritorio y secretos; plan con IDs; ejecutor seguro (regenerables, comandos oficiales, Papelera, mover verificado, reubicaciones con variables oficiales, bóveda cifrada); historial en SQLite.
- Servidor en `127.0.0.1:2633` con token, Host y Origin; CLI; MCP sin dependencias; LaunchAgent.
- Dashboard con Inicio, Limpieza, Proyectos, Procesos, Bóveda, Discos, Escritorio, Historial, Ajustes y Cómo funciona; modo demo.
- 15 pruebas en verde (motor, seguridad del servidor, MCP). ESLint, TypeScript y build limpios; `/frontend-review` aplicado.
- Probado en Chrome con demo y con datos reales: escaneo real (38 s), simulación del plan, limpieza real de un proyecto (433 MB), puertos; sin desbordes de 320 a 1280 px.

### Fase 2 · Escritorio

- Plan detallado en `plan.md`: arquitectura, ramas, criterios de listo, reglas de seguridad y riesgos.
- Decisiones cerradas (2026-11-07): motor por el LaunchAgent existente, firma ad-hoc, barra de menú + Dock al abrir, aviso a 20 GB, sin escaneos periódicos, sólo Apple Silicon, identificador `com.reydavidag.bodega`.

- Rust 1.99.1 con `rustup` (clippy y rustfmt).
- Dashboard probado en WebKit (motor de Safari y de la ventana de Tauri) con Playwright: 10 pantallas en 1280, 960 y 375 px, claro y oscuro, progreso en streaming y simulación del plan. Único hallazgo: el drawer quedaba debajo de la barra superior (también en Chrome); ahora se monta con un portal.
- `GET /api/summary` (8–21 ms con datos reales), `alertFreeGB` en la configuración y en Ajustes, `bodega status` con el resumen. 20 pruebas en verde.

- App de escritorio en `desktop/` con Tauri 2.12: ventana al dashboard con candado de navegación, página de respaldo que arranca el motor, barra de menú con espacio libre y escaneo, avisos de disco con histéresis, inicio con la sesión, Dock sólo con la ventana abierta y tamaño recordado. `Bodega.app` de 3.6 MB, firma ad-hoc.
- 17 pruebas en Rust; `cargo fmt` y `clippy -D warnings` limpios. Probado contra un motor demo con registro de peticiones: el dashboard carga con token dentro de WKWebView, el respaldo salta al dashboard cuando el motor responde, la IPC queda negada a la página remota (`start_engine not allowed … URL: local`), escaneo desde el menú y arranque oculto.
- CI con job `desktop` (fmt, clippy, pruebas). README, CONTRIBUTING y CLAUDE.md con la app; `npm run desktop:dev` verificado.
- Hallazgos corregidos en el camino: el motor mandaba bytes con decimales en modo demo (ahora redondea) y `location.replace` de `tauri://` a `http://` no navega en WKWebView (ahora navega Rust).

## Siguiente

1. `release/0.2.0`.
2. Prueba manual con datos reales: requiere instalar el LaunchAgent del motor (`bodega install`).

## Avance Fase 2

| Paso | Estado |
|---|---|
| 0 · Preparación (Rust, prueba en Safari) | Hecho |
| 2 · `feature/summary` | Hecho |
| 3 · `feature/desktop` | Hecho; falta la prueba manual con datos reales |
| 4 · `feature/desktop-ci` | Hecho |
| 5 · `release/0.2.0` | Pendiente |

## Pendiente fuera de la Fase 2

- Traducción de la interfaz al inglés (contribuciones bienvenidas).
- Escaneos periódicos programados (ver decisión 5).
