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

# Etapa 2 (2026-11-01)

| Cambio | Antes | Después |
| --- | --- | --- |
| Diálogos `Stub` que devolvían `null` con entrada en menús | 16 (12 con hasta 6 accesos cada uno): el clic no hacía nada | Aviso explícito «función no disponible; no se ha calculado nada» (`UnavailableFeatureDialog`) y 3 pruebas |
| Imports sin uso | ~600 | 0 (codemod ts-morph + `unused-imports --fix`, sin reordenar) |
| Problemas de ESLint | 1.399 | 371 errores + 366 avisos de `any` |
| ESLint en CI | no | `npm run lint:ci`: el trinquete falla si un archivo suma errores (`.eslint-baseline.json`) |
| Índice de scripts | — | `scripts/README.md`: 206 scripts en 6 grupos, con su comando npm |

`any` pasa a aviso: es deuda visible que se reduce por módulo. Variables con prefijo `_` se
consideran intencionalmente no usadas.

Validado: `tsc` de app y servidor, Vitest 340/340, `vite build`, `build-backend`, trinquete ESLint.

Pendiente para la etapa 3:
- implementar o retirar del menú las 16 funciones anunciadas (decisión de producto);
- bajar los 243 `no-unused-vars` restantes (variables locales, no imports);
- tipar los 335 `any` de cálculo (`src/lib`) antes que los de UI.

# Evidencia de GAMMA y funciones pendientes (2026-11-01)

**Biblioteca de referencias (antes Stub) → consumidor de `gamma/evidencia@1`.**
- Carga el JSON que entrega GAMMA-AI y verifica cada cita: SHA-256 del texto citado e identidad
  de la fuente (`source_` + hash del documento).
- Las citas alteradas se marcan y no se pueden copiar.
- Las verificadas se copian a la memoria con su identificador.
- La evidencia que se declare validada o apta para firma se rechaza.
- Pruebas: 5, con una fixture generada por el propio GAMMA-AI.

**Propuesta para las 15 funciones de menú que siguen sin implementar** (decisión de producto):

| Función | Propuesta | Motivo |
| --- | --- | --- |
| Calculadora de blindaje | Retirar del menú | Duplica la calculadora de barrera y el asistente de equipos, que sí calculan |
| Barrera rápida | Retirar del menú | Igual que la anterior |
| Verificación de blindaje | Implementar | Recalcular la dosis tras el blindaje propuesto en puntos de control; base para firma |
| Análisis de incertidumbre | Implementar | El MC de Cyclotron-SIM ya da error estadístico; propagar ±σ de W, U, T y TVL |
| Calculadora de skyshine | Implementar | NCRP 151 §4 (fotones) y McGinley (neutrones); necesaria para techos de baja ocupación |
| Ventilación del búnker | Implementar (ciclotrón) | Activación de aire (Ar-41, N-13) en la bóveda KIUBE; dato de Cyclotron-SIM |
| Dosimetría de terapia con radionúclidos | Retirar | Fuera del alcance de blindaje estructural |
| Ajuste estacional de carga | Retirar | Sin base normativa; la carga se declara anual o semanal |
| Manual de Shleien | Retirar | Lo cubre la biblioteca de referencias con evidencia de GAMMA |
| Gestor de proyectos (mosaico) | Retirar | Ya existe el gestor de proyectos principal |
| Campo de solución 3D | Retirar | Lo cubre el visor 3D existente |
| Motor de temas | Retirar | Basta el modo oscuro existente |
| Historial deshacer/rehacer | Implementar (UI) | El historial ya existe en el estado; sólo falta el panel |
| Vista previa VR/AR | Retirar | Fuera de alcance |
| Tablero de validación | Implementar | Reunir las validaciones NCRP y numéricas que hoy están dispersas |


# Etapa 3: funciones de menú resueltas (2026-11-01)

No queda ningún Stub. Las 16 funciones anunciadas que no hacían nada quedaron así:

| Función | Resultado |
| --- | --- |
| Verificación de blindaje | **Implementada**: espesor instalado frente al requerido por barrera, margen, dosis estimada con TVL y estado (`lib/verificacionBlindaje.ts`) |
| Ventilación del búnker | **Implementada**: Ar-41 en el aire (NCRP 144) con saturación, concentración al entrar, espera hasta quedar bajo el DAC y emisión por chimenea, comparadas con 10 CFR 20 Ap. B (`lib/ventilacionBunker.ts`) |
| Historial de deshacer/rehacer | **Implementado**: lista de acciones, salto a cualquiera, deshacer y rehacer |
| Calculadora de skyshine | Abre la calculadora Chilton existente (`ChiltonSkyshineDialog`) |
| Análisis de incertidumbre | Abre el análisis GUM existente |
| Tablero de validación | Abre la validación NCRP existente |
| Calculadora de blindaje, Barrera rápida, UAQ | Abren la calculadora de barrera existente |
| Manual de Shleien | Abre la biblioteca de referencias (evidencia de GAMMA) |
| Campo de solución 3D | Abre el visor 3D existente |
| Gestor de proyectos (mosaico) | Abre el gestor de proyectos principal |
| Ajuste estacional, Motor de temas, VR/AR, Dosimetría de terapia | **Retiradas** del menú |

Las redirecciones viven en `DIALOGOS_REDIRIGIDOS` (`stores/appStore.ts`). Los atajos, accesos
rápidos y menús existentes siguen funcionando. Se quitaron 2 entradas duplicadas «(fallback F107)».

Validado: `tsc` OK, Vitest 353/353 (+11 pruebas nuevas), `vite build` OK y trinquete de ESLint sin
errores nuevos.
