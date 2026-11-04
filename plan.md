# Plan · Bodega

Qué sigue y en qué orden. El avance real vive en `state.md`.

## Hecho

- **Fase 0 · Propuesta** en `propuesta/`, aprobada.

## Fase 1 · Herramienta · v0.1.0

Un motor local en TypeScript (Node ≥ 22.18, sin compilar: Node ejecuta los `.ts`) con tres caras: dashboard en `http://localhost:2633`, CLI `bodega` y servidor MCP para Claude Code.

| Orden | Rama | Qué incluye |
|---|---|---|
| 1 | `feature/plan` | Este plan y `state.md`. |
| 2 | `feature/core` | Escaneo: discos (df + diskutil), proyectos por ecosistema (Flutter, .NET, Node, Rust, Gradle, Xcode, Python), compilados regenerables, carpetas globales de desarrollo (Xcode, simuladores, AVD, cachés), puertos (lsof), daemons, escritorio, inventario de secretos. Plan de acciones con IDs. Ejecutor: borrar regenerables, comandos oficiales, Papelera, mover entre discos con verificación, reubicar con variables oficiales, respaldo cifrado de la bóveda. Historial en SQLite. Pruebas con `node --test`. |
| 3 | `feature/server` | HTTP en `127.0.0.1:2633`: token por instalación, revisión de Host y Origin, sólo IDs del último plan (nunca rutas libres), progreso en streaming. CLI y servidor MCP sin dependencias. LaunchAgent para que siempre esté arriba. |
| 4 | `feature/web` | Dashboard React 19 + Vite + TanStack Query con el diseño aprobado: Inicio, Limpieza, Proyectos (con mover entre discos), Procesos y puertos, Bóveda, Discos, Escritorio, Historial, Ajustes. Modo demo con datos ficticios. `/frontend-review`. |
| 5 | `feature/community` | README, licencia MIT, guía de contribución, CI en macOS. |
| 6 | `release/0.1.0` | `main` + tag `v0.1.0`, repo público. |

### Reglas de seguridad

- Lo **regenerable** (compilados y cachés) se borra: vuelve solo con la siguiente compilación o descarga. Lo **tuyo** (proyectos, archivos, archives) nunca se borra: se mueve o va a la Papelera.
- Sólo se borra una carpeta si su nombre es de compilado **y** su carpeta padre tiene el archivo del ecosistema (`bin` sólo junto a un `.csproj`, `node_modules` sólo junto a `package.json`).
- Nada fuera de la carpeta de usuario o de un volumen externo; nunca `/`, `~` ni carpetas del sistema.
- Detener procesos: sólo PIDs del último listado, del mismo usuario y nunca a Bodega; SIGTERM y a los 5 s SIGKILL.
- Secretos: se copian con su SHA-256, nunca se leen para mostrarse ni salen de la máquina. Sólo a un volumen cifrado o a una imagen cifrada cuya contraseña no se guarda.
