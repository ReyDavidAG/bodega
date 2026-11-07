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

## Siguiente

1. Preparación: instalar Rust con `rustup` y probar el dashboard en Safari.
2. `feature/summary`.

## Avance Fase 2

| Paso | Estado |
|---|---|
| 0 · Preparación (Rust, prueba en Safari) | Pendiente |
| 2 · `feature/summary` | Pendiente |
| 3 · `feature/desktop` | Pendiente |
| 4 · `feature/desktop-ci` | Pendiente |
| 5 · `release/0.2.0` | Pendiente |

## Pendiente fuera de la Fase 2

- Traducción de la interfaz al inglés (contribuciones bienvenidas).
- Escaneos periódicos programados (ver decisión 5).
