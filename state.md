# Estado · Bodega

Última actualización: 2026-11-04

## Dónde vamos

- **Fase 0 · Propuesta: aprobada.**
- **Fase 1 · Herramienta: v0.1.0.**

## Hecho

- Motor: escaneo por ecosistema, carpetas globales, discos, puertos, daemons, escritorio y secretos; plan con IDs; ejecutor seguro (regenerables, comandos oficiales, Papelera, mover verificado, reubicaciones con variables oficiales, bóveda cifrada); historial en SQLite.
- Servidor en `127.0.0.1:2633` con token, Host y Origin; CLI; MCP sin dependencias; LaunchAgent.
- Dashboard con Inicio, Limpieza, Proyectos, Procesos, Bóveda, Discos, Escritorio, Historial, Ajustes y Cómo funciona; modo demo.
- 15 pruebas en verde (motor, seguridad del servidor, MCP). ESLint, TypeScript y build limpios; `/frontend-review` aplicado.
- Probado en Chrome con demo y con datos reales: escaneo real (38 s), simulación del plan, limpieza real de un proyecto (433 MB), puertos; sin desbordes de 320 a 1280 px.

## Pendiente

- Traducción de la interfaz al inglés (contribuciones bienvenidas).
- Programar escaneos periódicos y avisos de macOS cuando el disco baje del umbral.
