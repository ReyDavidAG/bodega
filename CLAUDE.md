# CLAUDE.md

Guía para Claude Code en este repositorio. `plan.md` dice **qué sigue** y `state.md` **dónde vamos** (se crean al aprobar la propuesta).

## Qué es Bodega

La herramienta local para administrar el espacio de esta Mac de desarrollo: qué pesa, qué se puede regenerar, qué está abierto, qué vive en el disco externo y dónde están las llaves que no se pueden perder. La usa una persona en `localhost` y la opera también Claude Code por MCP.

Repo **público** para la comunidad (MIT). Todo corre local: nada de nube, cuentas ni telemetría. Nunca datos personales en el repo: el modo demo y `scripts/sample_data.mjs` son ficticios.

### Objetivos

1. Saber en 10 segundos cuánto espacio hay, qué lo ocupa y cuánto se recupera sin perder nada.
2. Limpiar con planes revisables: qué, por qué, cuánto y con qué comando. Nada se borra sin pasar por la Papelera.
3. Ver qué proyecto tiene servidores y daemons abiertos, y detenerlos con confirmación.
4. Usar el disco externo con reubicaciones oficiales (variables de cada herramienta), no con enlaces frágiles.
5. Respaldar en una imagen cifrada las llaves de firma, `key.properties`, certificados y `.env`, sin leerlos.

### Vocabulario

| Pantalla | Código | Qué es |
|---|---|---|
| Compilados | `regen` | Carpetas que la compilación vuelve a crear: `build`, `bin`, `obj`, `.dart_tool`, `node_modules`, `DerivedData`. |
| Plan | `plan` | Lista de acciones con tamaño, comando y forma de regresar. |
| Reubicación | `relocation` | Carpeta que vive en el disco externo con su variable oficial (`ANDROID_AVD_HOME`, `GRADLE_USER_HOME`, `NUGET_PACKAGES`, `PUB_CACHE`). |
| Bóveda | `vault` | Imagen cifrada en el disco externo con los secretos y llaves de firma. |
| Proyecto activo | `active` | Con cambios en los últimos 14 días; no se limpia por omisión. |

## Fases

| Fase | Qué | Dónde corre |
|---|---|---|
| 0 · Propuesta | Prototipo navegable con datos del escaneo real. | `propuesta/` |
| 1 · Herramienta | Motor TypeScript (`src/core`), servidor (`src/server`), CLI (`src/cli`), MCP (`src/mcp`) y dashboard React (`web/`). | `http://localhost:2633` (launchd) |

### Correr

```bash
npm ci && npm run build
node src/cli/main.ts serve                 # http://localhost:2633
npm run dev                                # + Vite en 2634 con proxy y token
BODEGA_DEMO=1 BODEGA_PORT=2635 node src/cli/main.ts serve
npm test && npm run lint
```

Node ejecuta los `.ts` directo: sólo sintaxis borrable (nada de `enum`, `namespace` ni propiedades en el constructor) e imports con extensión `.ts`. El estado vive en `~/.bodega/` (`token`, `config.json`, `scan.json`, `bodega.db`, `relocations.json`, `moves.json`).

### Ver el prototipo

```bash
cd propuesta && python3 -m http.server 5187
# http://localhost:5187 · teléfono: /herramientas/marco.html?w=375&p=/
```

Carga `js/data.local.js` (escaneo real, fuera de git) o `js/data.sample.js` (anonimizado).

## Convenciones

- Respuestas en español; código en inglés. Sin comentarios en el código. Commits de una sola línea.
- El front pasa por `/frontend-review` antes de cada commit.
- **Seguridad, no se negocia:** el servidor escucha sólo en `127.0.0.1`, con token por sesión; ninguna acción destructiva sin plan confirmado; nunca `rm` (Papelera o mover); nunca leer el contenido de secretos; detener procesos con SIGTERM y luego SIGKILL; Bodega no se detiene a sí misma.

### Diseño

- Herramienta de escritorio primero (1280 px), sin romper en 375 px.
- Interfaz monocroma; el color es sólo para datos: compilados naranja, simuladores azul, emuladores verde, cachés morado, código gris. Paleta validada para daltonismo.
- Tipografía Geist y Geist Mono. Pieza de identidad: la caja naranja.

## Git (gitflow)

`main`, `develop`, `feature/*` con `--no-track`, `release/*` con tag. Lo privado va en `CLAUDE.local.md`, `docs/local/` y `.git/info/exclude`.
