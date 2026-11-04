# Contribuir a Bodega

¡Gracias! Bodega toca el disco de la gente, así que la regla número uno es **no perder nada de nadie**.

## Cómo trabajamos

- **Gitflow:** `main` es lo publicado, `develop` la integración. Abre tu rama desde `develop` (`feature/<nombre>`) y manda el PR contra `develop`.
- **Commits de una sola línea**, en inglés, en imperativo: `Add pnpm store to global caches`.
- Código en inglés; texto en pantalla en español.
- Sin comentarios en el código salvo una línea que explique algo que el código no puede (un límite de macOS, un bug de una herramienta).

## Antes del PR

```bash
npm test
npm run lint
npm run build
```

Si agregas un ecosistema o una caché:

1. Su regla va en `src/core/ecosystems.ts` (carpeta + archivo que la confirma) o en `src/core/globals.ts` (ruta, comando oficial, cómo vuelve).
2. Agrega una prueba en `test/` que demuestre que **no** marca una carpeta parecida sin el archivo del ecosistema.
3. Si la herramienta tiene comando oficial para limpiar, úsalo en vez de borrar.

## Reglas de seguridad que no se negocian

- Nada fuera de `~` o de `/Volumes/<disco>`; nunca `/`, `~` ni carpetas del sistema (`assertSafe`).
- Nunca borrar a través de un enlace simbólico.
- El navegador nunca manda rutas: sólo IDs del último plan.
- Lo que no es regenerable se mueve o va a la Papelera.
- Los secretos nunca se leen para mostrarse ni salen de la máquina.

## Modo demo

`BODEGA_DEMO=1` levanta el servidor con datos ficticios y acciones simuladas. Úsalo para capturas y para trabajar en la interfaz sin tocar tu disco.
