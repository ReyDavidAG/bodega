# Plan · Bodega

Qué sigue y en qué orden. El avance real vive en `state.md`.

## Hecho

- **Fase 0 · Propuesta** en `propuesta/`, aprobada.
- **Fase 1 · Herramienta · v0.1.0**: motor TypeScript, servidor en `127.0.0.1:2633`, CLI, MCP, dashboard React y LaunchAgent. Detalle en el historial de git y en `CHANGELOG.md`.

## Fase 2 · Escritorio · v0.2.0

Una app de macOS hecha con **Tauri v2** (Rust) que abre el dashboard actual en su propia ventana y vive en la barra de menú. Es una ventana más hacia el mismo motor, no un segundo motor: el servidor Node, la CLI y el MCP siguen igual.

### Objetivos

1. Abrir Bodega como app (`Bodega.app`), sin pestaña de navegador, con ícono propio.
2. Ver el espacio libre desde la barra de menú y escanear sin abrir la ventana.
3. Recibir un aviso de macOS cuando el disco baje del umbral.
4. Si el motor no está corriendo, la app lo dice y lo arranca con un clic.

### Lo que no cambia

- `web/` no se toca: la app carga el mismo dashboard que sirve el motor, con su token y su CSP.
- La lógica que borra, mueve o detiene vive sólo en el motor. Rust nunca toca archivos del usuario ni procesos.
- Todo local: sin nube, sin cuentas, sin telemetría y sin actualizador automático.

### Arquitectura

```
Bodega.app (Tauri · Rust)                 Motor (Node · ya existe)
├─ Ventana principal ── http://127.0.0.1:2633 ──► servidor + dashboard
├─ Página de respaldo (local) ── «Iniciar motor» ──► launchctl kickstart
├─ Barra de menú ── GET /api/summary cada 60 s ──► df + último escaneo
│                └─ POST /api/scan
└─ Avisos de macOS ◄── umbral `alertFreeGB` de config.json
```

- **Ventana principal**: carga `http://127.0.0.1:2633` como URL remota. Host y Origin son los que el servidor ya acepta, y el token llega en el `<meta>` del `index.html`. Esa página no tiene acceso a la IPC de Tauri (sin capabilities remotas, `withGlobalTauri: false`).
- **Candado de navegación**: sólo se navega dentro de `127.0.0.1:2633`. Cualquier otro enlace se abre en el navegador predeterminado.
- **Página de respaldo**: HTML local empaquetado en la app que la misma ventana muestra si el motor no responde. Sólo ella tiene IPC, con dos comandos: `engine_status` (cada 2 s; cuando el motor responde, Rust lleva la ventana al dashboard) y `start_engine`.
- **Rust habla con el motor por HTTP**, leyendo `~/.bodega/token` (0600, mismo usuario) igual que la CLI. Usa un cliente HTTP bloqueante en un hilo aparte y no hace llamadas fuera de `127.0.0.1`.
- Cerrar la ventana la oculta y la app sigue en la barra de menú. Salir sólo desde el menú o con ⌘Q.

### Ramas

| Orden | Rama | Qué incluye |
|---|---|---|
| 1 | `feature/desktop-plan` | Este plan y `state.md`. |
| 2 | `feature/summary` | Motor: `GET /api/summary` y umbral en la configuración. Pruebas. |
| 3 | `feature/desktop` | `desktop/` con Tauri: ventana, candado de navegación, respaldo, barra de menú, avisos, inicio con la sesión, tamaño recordado, íconos. Pruebas en Rust. |
| 4 | `feature/desktop-ci` | Job de Rust en CI y documentación (README, CONTRIBUTING, CLAUDE.md, CHANGELOG). |
| 5 | `release/0.2.0` | `main` + tag `v0.2.0`. Sólo código: no se publica ejecutable. |

### 0 · Preparación (antes de la rama 2)

- [x] Instalar Rust estable con `rustup` (no está en esta Mac). Xcode ya está.
- [x] Probar el dashboard completo en **Safari**: la app usa WKWebView (motor de Safari) y v0.1.0 sólo se probó en Chrome. Revisar sobre todo el progreso en streaming (`fetch` + `ReadableStream`), las fuentes Geist, el tema claro/oscuro y los drawers. Lo que falle se arregla en `web/` antes de empezar.

### 2 · `feature/summary` · motor

- [x] `GET /api/summary` con token: `{ disks: [{ name, mount, free, total, internal }], scannedAt, scanning, reclaimable, alerts }`. Ligero: `df` en vivo y lo demás del último escaneo, sin escanear.
- [x] `config.json` gana `alertFreeGB` (entero, por omisión **20**, 0 = sin avisos). Se valida en `loadConfig` y se edita en Ajustes y en `PUT /api/config`.
- [x] `bodega status` en la CLI usa el mismo resumen.
- [x] Pruebas: el resumen exige token, no dispara escaneo y respeta el umbral; la configuración rechaza valores fuera de rango.
- **Listo cuando** `curl -H "x-bodega-token: …" 127.0.0.1:2633/api/summary` responde en menos de 300 ms con el escaneo hecho.

### 3 · `feature/desktop` · app

Estructura:

```
desktop/
├─ art/                        SVG de origen de los íconos
├─ fallback/                   página de respaldo (HTML, CSS y JS sin dependencias)
└─ src-tauri/
   ├─ Cargo.toml / Cargo.lock
   ├─ tauri.conf.json           identificador com.reydavidag.bodega, sólo aarch64
   ├─ capabilities/fallback.json
   ├─ icons/                    generados con `tauri icon` desde la caja naranja
   └─ src/
      ├─ main.rs
      ├─ engine.rs              token, /api/summary, /api/scan, kickstart
      ├─ tray.rs                menú de la barra
      ├─ alerts.rs              umbral y avisos sin repetir
      ├─ text.rs                GB y «hace 2 h» como la CLI
      └─ nav.rs                 candado de navegación
```

- [x] **Andamiaje**: `@tauri-apps/cli` como devDependency fijada; scripts `npm run desktop:dev` y `npm run desktop:build`. `desktop/src-tauri/target/` en `.gitignore`; `Cargo.lock` sí se versiona.
- [x] **Ventana**: 1280×820, mínimo 960×600, título «Bodega», barra de título del sistema. Tamaño y posición recordados (`tauri-plugin-window-state`).
- [x] **Candado de navegación** (`nav.rs`): permite `http://127.0.0.1:2633/*` y `http://localhost:2633/*`; lo demás va al navegador con `open`. Sin `devtools` en el build de release.
- [x] **Motor caído**: si `/api/summary` no responde al abrir, la ventana muestra la página de respaldo. «Iniciar motor» ejecuta `launchctl kickstart gui/<uid>/dev.bodega.agent`; si el LaunchAgent no está instalado, explica `npm link && bodega install` y lo copia al portapapeles.
- [x] **Barra de menú** (`tray.rs`), ícono de plantilla monocromo (la caja):
  - «114 GB libres en Macintosh HD» (sólo texto, se actualiza cada 60 s)
  - «Último escaneo: hace 2 h»
  - Abrir Bodega
  - Escanear ahora (deshabilitado mientras escanea, con «Escaneando…»)
  - Abrir en el navegador
  - Iniciar con la sesión ✓
  - Salir de Bodega
- [x] **Avisos** (`tauri-plugin-notification`): cuando el disco interno baja de `alertFreeGB`, un aviso «Quedan 18 GB libres en Macintosh HD · 42 GB se pueden recuperar sin perder nada. Abre Bodega › Limpieza.» No se repite hasta que el disco vuelva a subir del umbral más 5 GB. Aviso de «Escaneo terminado» sólo si la ventana está oculta.
- [x] **Inicio con la sesión** (`tauri-plugin-autostart`, LaunchAgent propio `com.reydavidag.bodega.launcher`), apagado por omisión y se activa desde el menú.
- [x] **Dock**: la app vive en la barra de menú; el ícono del Dock aparece sólo mientras la ventana está abierta (`ActivationPolicy::Accessory` ↔ `Regular`).
- [x] **Pruebas Rust**: candado de navegación (permitidas, rechazadas, trucos como `127.0.0.1:2633@evil.com`), lógica de avisos (cruza umbral, no repite, histéresis) lectura del token (falta, vacío, inválido), resumen del motor, fin del escaneo y textos del menú.
- [ ] **Prueba manual** en esta Mac con datos reales: abrir, escanear desde el menú, simular y aplicar un plan, detener el motor → respaldo → iniciar, aviso con un umbral alto a propósito, cerrar y reabrir con el tamaño recordado.
- **Listo cuando** `npm run desktop:build` deja `Bodega.app` en `desktop/src-tauri/target/release/bundle/macos/`, y la prueba manual pasa completa.

### 4 · `feature/desktop-ci` · CI y documentación

- [x] CI: job `desktop` en `macos-latest` con `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` y `cargo test`; caché de Cargo. Sin compilar el bundle: no se publica ejecutable.
- [x] README: sección «App de escritorio» con qué hace y cómo compilarla desde el código (no se publica ejecutable).
- [x] CONTRIBUTING: requisitos de Rust y cómo correr `desktop:dev`.
- [x] CLAUDE.md: Fase 2 en la tabla, `desktop/` en Correr y la regla de que Rust no opera archivos ni procesos.
- [x] CHANGELOG 0.2.0 y versión `0.2.0` en `package.json`, `tauri.conf.json` y `Cargo.toml`.

### 5 · `release/0.2.0`

- [x] `npm test && npm run lint && npm run build`, `cargo test`, `npm run desktop:build`.
- [x] Merge a `main`, tag `v0.2.0`, merge de regreso a `develop`.

### Reglas de seguridad de la app

- Rust no lee, borra, mueve ni firma archivos del usuario y no detiene procesos: todo eso pasa por el motor y su plan con IDs.
- La página remota no tiene IPC. La única IPC es `start_engine` en la ventana de respaldo y sólo ejecuta `launchctl kickstart` sobre la etiqueta fija.
- Sólo hay conexiones a `127.0.0.1:2633`. El token nunca se escribe en logs ni en la URL.
- Se aplican las reglas de la Fase 1 sin cambios.

### Decisiones

Cerradas el 2026-11-07.

| # | Decisión | Elegido |
|---|---|---|
| 1 | Quién corre el motor | El LaunchAgent existente (`dev.bodega.agent`). Empaquetar Node queda para después. |
| 2 | Firma | Ad-hoc. Developer ID y notarización cuando haya cuenta de Apple. |
| 3 | Dónde vive | Barra de menú siempre; Dock sólo mientras la ventana está abierta. |
| 4 | Umbral por omisión del aviso | 20 GB, editable en Ajustes. |
| 5 | Escaneos periódicos | Fuera de esta fase; el aviso usa `df` en vivo. |
| 6 | Arquitectura | Sólo Apple Silicon (aarch64). |
| 7 | Identificador | `com.reydavidag.bodega`; el LaunchAgent de la app es `com.reydavidag.bodega.launcher`. |

### Riesgos

- **WKWebView ≠ Chrome**: por eso va la prueba en Safari antes de todo.
- **Gatekeeper**: no aplica mientras cada quien compile la app en su Mac; no se publican binarios.
- **Motor sin LaunchAgent**: la ventana de respaldo lo cubre con instrucciones claras.
- **Rust nuevo en el repo**: la CI con `clippy -D warnings` y `fmt` mantiene el mismo estándar que ESLint y Prettier.
