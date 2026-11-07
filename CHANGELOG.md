# Cambios

## 0.2.0 · 2026-11-07

- App de escritorio con Tauri (`desktop/`): abre el dashboard en su propia ventana, vive en la barra de menú con el espacio libre, el último escaneo y «Escanear ahora», avisa cuando el disco baja del umbral y arranca el motor si está apagado. Sólo código: se compila en cada Mac.
- `GET /api/summary`: resumen ligero del disco y de lo recuperable, sin escanear.
- Umbral de aviso de espacio libre en Ajustes (`alertFreeGB`, 20 GB por omisión; 0 los apaga).
- `bodega status` usa el mismo resumen y avisa si el disco está bajo.
- Los drawers ya no quedan debajo de la barra superior.
- CI revisa también la app de escritorio (fmt, clippy y pruebas en Rust).

## 0.1.0 · 2026-11-04

- Escaneo de proyectos por ecosistema (Flutter, .NET, Node, Rust, Gradle, Xcode, Python) y de carpetas globales de desarrollo.
- Plan de limpieza con simulación, comandos oficiales y progreso en vivo.
- Proyectos: limpiar, ver en Finder, mover a disco externo con acceso y regresar.
- Procesos y puertos por proyecto, daemons de compilación y detener con confirmación.
- Reubicaciones al disco externo con variables oficiales.
- Bóveda: inventario de llaves y secretos, aviso de los versionados en git y respaldo cifrado AES-256.
- Ordenar Escritorio y Descargas.
- Servidor local con token, CLI, servidor MCP y LaunchAgent.
