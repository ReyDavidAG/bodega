---
name: frontend-review
description: Revisa, corrige y deja limpio el código de web/ (React 19 + TS + Vite + TanStack Query). Recorta archivos largos en componentes, borra comentarios de relleno, deja nombres en inglés, aplica reglas de rendimiento y cierra con prettier + eslint + build. Úsala antes de cada commit de front o cuando pidan revisar, limpiar u optimizar el front.
---

# Revisión de front · Bodega

Deja el código más corto que como lo encontraste.

## Alcance

- Sin argumento: los archivos de `web/src` que salgan en `git status --porcelain`.
- Con argumento: esa ruta o ese glob.
- Antes de tocar nada, di qué archivos vas a revisar.

## Cierre obligatorio (desde la raíz del repo)

```bash
npx prettier --write <archivos tocados>
npx eslint <archivos tocados>
npm run build        # debe terminar en "✓ built"
npm test             # si tocaste core, utils o schemas
```

## Reglas, en orden

1. **Tamaño:** archivo ≤ 300 líneas, `return` de JSX ≤ 100, función ≤ 40, anidación de JSX ≤ 4. Extrae componentes con un solo trabajo; sube a `components/ui/` sólo lo que tenga dos consumidores.
2. **Comentarios:** se borran por omisión. Sobrevive una línea sólo si registra algo que el código no puede enseñar (un bug del navegador, un límite de macOS).
3. **Idioma:** archivos, variables, tipos y rutas en inglés; texto en pantalla en español.
4. **Estructura:** `pages/<feature>/<feature>_page.tsx`, `components/<feature>/<name>.tsx`, `components/ui/<name>.tsx`, `hooks/<domain>/use_<name>.tsx`, `types/<name>_type.ts`, `utils/<name>.ts`. Un componente público por archivo. Validación con Zod.
5. **Rendimiento:** listas y columnas memorizadas; `Map` en vez de `.find()` en renders; `memo()` en renglones; búsquedas con debounce de 300 ms; modales cerrados no se montan.
6. **Datos:** la `queryKey` es la petición; claves compartidas en `constants/`; escrituras con `useMutation` y luego invalidar.
7. **Estilos:** sólo tokens de `styles/tokens.css`; nada de hex sueltos; el color nunca es la única señal.
8. **TypeScript:** cero `any`, cero `as` para callar al compilador; los tipos de la API viven en `types/` y espejean los del servidor.
9. **Accesibilidad:** todo control con etiqueta; botón de sólo icono con `title` y `sr-only`; foco visible.

## Salida

Una línea por hallazgo aplicado (`archivo:línea · antes → después`) y al final:

```
-<N> líneas · <M> archivos · <K> componentes extraídos
prettier ✓  eslint ✓  build ✓
pendiente: <lo que no tocaste y por qué>
```
