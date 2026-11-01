# Depuración 2026-10-31

Estado previo completo: rama `archivo/pre-depuracion-2026-10-31` (main antes de la etapa 0).
Todo lo retirado se recupera con `git show archivo/pre-depuracion-2026-10-31:<ruta>`.

## Retirado

| Grupo | Archivos | Criterio |
| --- | --- | --- |
| Scripts de «contrato» `check-fNNN-*` y auditorías de fase | 385 (~29.000 líneas) | Sólo leen archivos y buscan cadenas de texto en el código: no validan comportamiento, se rompen con cualquier renombrado y no corren en CI. Se conservan los que invocan scripts npm de núcleo o scripts activos. |
| Entradas de `package.json` → scripts retirados | 384 (661 → 277) | Apuntaban a los scripts anteriores |
| Código de `src/` inalcanzable | 129 (~17.000 líneas) | Ningún import estático desde la app, las pruebas, el backend ni los scripts conservados (análisis knip + verificación). Se conservan 8 que leen scripts de gate activos, `src/types/compat.d.ts` (declaraciones globales) y `src/lib/llm/prompts.ts` (lo importa el backend). |
| Dependencias sin uso | 34 | Sin importadores en `src`, `api`, `scripts`, `e2e`, configuración ni CSS: 12 de Radix UI, AWS S3, Sentry, TensorFlow layers, OpenCV, PWA, react-hook-form, date-fns, entre otras. |

## Corregido

- **Aviso de neutrones, laberinto y puerta (>10 MV):** nunca se activaba porque el catálogo declara la
  energía del LINAC sólo en la etiqueta («18 MV X-rays»). `getModalityEnergy_MeV()` la resuelve.
- Prueba de materiales a 15 MV: la masa por m² de NIPOL350 y NIPOL500 es equivalente, no mayor
  (la atenuación escala con ρ·x).

## Verificado

- `tsc` de app y servidor: OK.
- Vitest: 337/337 (antes 335/337).
- `vite build` y `build-backend`: OK.
- ESLint: 1.527 → 1.399 problemas. Lo restante es deuda previa, que no ejecuta el CI.

## Pendiente

- 161 scripts activos de fase (`fNNN-*.mjs`): son gates y smoke tests que ejecutan cosas reales.
  Conviene consolidarlos en pocos comandos (`npm run qa:*`) en una etapa posterior.
- 219 diálogos en `src/sections/dialogs`: varios son variantes del mismo flujo.
- ESLint en CI.
- 7 PDF/DXF marcados como LFS que no son punteros (`git lfs migrate import` cuando se active LFS).
