# Plan de depuración del código (por etapas)

Fecha: 2026-11-11. Punto de partida: `main` con #40 (retiro de material confidencial), #41 (Fase 10) y #42
(Fase 11 etapa 1: motor único `motorProyecto`) fusionados.

**Reglas que valen para todas las etapas**

- Babylon se mantiene. Las banderas `VISOR_*`, `VISORES_EN_REVISION` y `HEATMAP_GPU` siguen apagadas; ninguna
  etapa las enciende ni borra el código que protegen.
- No se versionan PDF con licencia ni material confidencial (ver #40).
- Una etapa = una rama = un PR pequeño contra `main`; no se mezcla borrado con cambios de comportamiento.
- Todo lo borrado queda en el historial de git; si algo hace falta se recupera con `git log --diff-filter=D`.

**Criterio de aceptación común** (además del propio de cada etapa)

| Verificación | Comando | Condición |
|---|---|---|
| Tipos | `npm run check:app` y `npm run check:server` (`tsc --noEmit` vía `noEmit: true`) | 0 errores, antes y después |
| Build | `VITE_BASE_PATH=/RadShieldMx/ CI=true npm run build` | termina; JS total de `dist/assets` **no crece** |
| Vitest | `npx vitest run` | todos en verde; sólo bajan pruebas que probaban el código borrado |
| Lint | `npm run lint:ci` (trinquete `.eslint-baseline.json`) | ningún error nuevo; si bajan, `--update` |
| Humo | `npx playwright test e2e/humo-calculo-referencia.spec.ts --project=chromium` (job «Humo» del CI) | ejemplo «Guíame»: muro norte 18.9 mm Pb / 200 mm concreto y las 7 barreras iguales a la referencia |
| Pages | tras fusionar: abrir `https://plaeyade.github.io/RadShieldMx/`, «Guíame» → Calcular | sin errores de consola, mismo resultado |

## Inventario (2026-11-11)

Medido con un recorrido de importaciones desde `src/main.tsx` (750 archivos en `src/`; 28 de producción no
alcanzables) y búsquedas de nombre en todo el repositorio (pruebas, `scripts/`, `e2e/`, `api/`).

**Hooks y módulos sin ningún importador** (ni producción ni pruebas reales)

| Archivo | Líneas | Nota | Etapa |
|---|---|---|---|
| `src/hooks/useSmartBarrier.ts` | 174 | TVL fijos; retirado del diseñador en #42; sólo su prueba lo usaba | 1 |
| `src/hooks/useWorkerCalculation.ts` | 219 | kerma propio en un worker Blob; #42 lo desconectó | 1 |
| `src/hooks/useWASM.ts` | 112 | Archer/TVL en WASM; #42 lo desconectó | 1 |
| `src/hooks/useCalculationCache.ts` | 137 | caché de cálculo sin consumidores | 1 |
| `src/hooks/useCostOptimizer.ts` | 79 | n = log₁₀(K/P) propio | 1 |
| `src/lib/mcginleyData.ts` | 155 | tablas McGinley sin uso | 1 |

`src/hooks/hooks.test.ts` tenía bloques «useCalculationCache» y «useWorkerCalculation» que no importaban los
hooks (reimplementaban la lógica dentro de la prueba): se retiran con ellos.

**Módulos usados sólo por sus pruebas** (etapa 2): `lib/skyshine/ChiltonSkyshine.ts`,
`lib/ct/CTScatterDatabase.ts`, `lib/performance/{AlgorithmAnalyzer,BenchmarkSuite,CPUMemoryProfiler,FunctionProfiler}.ts`,
`components/UnavailableFeatureDialog.tsx`, `lib/f174aPredeployHardening.ts`, `lib/f406CanvasToolQa.ts`;
`lib/multiSourceDetector.ts` (801 líneas, sólo citado en el texto del diálogo desactivado).

**Módulos sólo leídos por scripts de contrato** (etapa 3): `lib/f197…`, `f265…`, `f266…`, `f267…`, `f292…`,
`f378…`, `medical3D/babylonRuntimeLoader.ts` (Babylon: se conserva), `sections/CanvasQuickActionsSidebar.tsx`.
En total `src/lib/f[0-9]*.ts` son 181 archivos / ≈ 24 300 líneas de «puertas» de fases antiguas; `package.json`
tiene ≈ 250 scripts `prepare:f…`/`test:f…` y `e2e/` 53 specs `f…` que el CI corre con `continue-on-error`.

**Restos de WASM** (etapa 2): `public/wasm/shielding_math.wasm` ya no lo carga nadie, pero lo exigen
`e2e/static-deploy.spec.ts`, `nginx.conf` y la sección 9.0 del manual (`ManualDialog.tsx`), que además describe
`useWASM()` como si estuviera en uso.

**Duplicados del motor** (etapa 6, = Fase 11 etapa 2): el cálculo de barreras ya pasa sólo por
`lib/motorProyecto.ts` (prueba `src/__tests__/auditoria/motorUnico.test.ts`), pero siguen en paralelo
`doseFieldEngine` (13 importadores), `doseMapEngine` (3), `doseMappingEngine` (2), `normativeBarrierEngine` (3),
`hooks/useShieldingEngine.ts` y `lib/shieldingMath.ts`, con su propio TVL/Archer en algunos casos
(inventario detallado en `docs/plan-fases-11-12.md`).

**Dependencias**

| Paquete | Uso | Acción |
|---|---|---|
| `recharts` | ninguna importación | quitar (etapa 1) |
| `pdfjs-dist` 3.x | ninguna importación (sólo `scripts/f279…` mira si existe la carpeta); la 3.x tiene un aviso de seguridad conocido | quitar (etapa 1) |
| `@babylonjs/gui` | ninguna importación | **se conserva** (regla «mantener Babylon»); decisión del propietario |
| `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` | visores 3D (algunos detrás de `VISOR_*`) | etapa 7, sólo con decisión del propietario |
| `@tensorflow/tfjs` | `lib/ml/models/shieldingThicknessModel.ts` | etapa 7: revisar si la ruta está viva |
| `@types/three` | está en `dependencies` | mover a `devDependencies` (etapa 7) |

**Tipos y lint**: 200 apariciones de `any` en 61 archivos de producción (más en `MemoriaAnaliticaWizard.tsx`
y `stepImporter.ts`, 12 cada uno); `tsconfig.app.json` con `strict: false`. Línea base de ESLint: 126 errores
(76 `no-unused-vars`, 11 `react-hooks/immutability`, 10 `react-refresh/only-export-components`,
7 `react-hooks/set-state-in-effect`, 5 `react-hooks/purity`, 5 `no-unused-expressions`, 4
`no-unsafe-function-type` — los 4 de `useWASM.ts` desaparecen en la etapa 1). `@ts-nocheck`: 0.

**Pruebas faltantes**: no había una prueba E2E que fijara un **valor** del cálculo en la app construida
(`fase11-motor-unico.spec.ts` compara rutas entre sí, no contra una referencia) → la etapa 1 añade
`e2e/humo-calculo-referencia.spec.ts` y un job bloqueante «Humo» en el CI. El job `e2e` del CI corre las 68
specs con `continue-on-error`, así que hoy no bloquea nada (etapa 3). Cobertura mínima de Vitest: 30 %.
Archivos grandes sin pruebas unitarias propias: `pages/ShieldingDesigner.tsx` (2 874 líneas),
`sections/Toolbar.tsx` (1 205) — se tratan en la Fase 12.

## Etapas

### Etapa 0 — Arranque en GitHub Pages (PR propio `fase10-pages-arranque`, prioridad)

Antes de seguir depurando: en Pages la app seguía abriendo con el plano de ejemplo antiguo (R&F de DeLorenzo) y
sin el asistente «Guíame» a la vista. Causas, arreglo y prueba E2E en ese PR (ver su descripción). Aceptación:
criterio común + `e2e/fase10-pages-arranque.spec.ts` (navegador con datos y service worker de la versión anterior).

### Etapa 1 — Hooks y código muerto sin referencias, dependencias sin uso (riesgo **bajo**) — esta PR

- Borrar los 6 archivos de la primera tabla, `src/__tests__/hooks/useSmartBarrier.test.ts` y los dos bloques
  tautológicos de `src/hooks/hooks.test.ts`; quitar la aserción de `fase9Despliegue.test.tsx` que leía
  `useWASM.ts`.
- Quitar `recharts` y `pdfjs-dist` de `package.json` / `package-lock.json`.
- Añadir `e2e/humo-calculo-referencia.spec.ts` y el job «Humo» (build de Pages + Playwright, bloqueante).
- Aceptación: criterio común; `tsc` y Vitest iguales antes/después salvo las pruebas retiradas; el JS de
  `dist/assets` no crece; humo con los mismos espesores medidos antes del cambio.
- Riesgo: un import dinámico o por texto no detectado → mitigado por la búsqueda en todo el repo y por el build.

### Etapa 2 — Módulos sólo usados por sus pruebas y restos de WASM (riesgo **bajo-medio**)

- Borrar los módulos de la lista «usados sólo por sus pruebas» junto con sus pruebas; corregir el texto de
  `MultiSourceDetectorDialog` y la sección 9.0 del manual; retirar `public/wasm/`, su `location` de
  `nginx.conf` y la entrada de `e2e/static-deploy.spec.ts`.
- Aceptación: criterio común; el conteo de pruebas baja sólo en las borradas; `dist/` sin `wasm/`.
- Riesgo: el manual en la app cambia (texto); la carpeta `wasm/` desaparece de Pages (nadie la pide).

### Etapa 3 — Puertas de fases antiguas y pruebas E2E que no bloquean (riesgo **medio**)

- Inventariar qué specs `e2e/f…` pasan hoy contra el build de Pages; las que pasan, a un job bloqueante; las
  que no, se reparan o se borran con su script `test:f…`.
- Borrar `src/lib/f*.ts` que sólo alimentan scripts `prepare:f…`/`check-f…` (y esos scripts), por lotes de
  ≤ 20 archivos por PR; `UpdateAppDialog.tsx` deja de listar fases.
- Aceptación: criterio común + el job E2E sin `continue-on-error` en verde.
- Riesgo: algunos `lib/f…` también los importa la interfaz (p. ej. `f111`/`f112` de acceso rápido): cada lote
  se decide con el recorrido de importaciones, no por nombre.

### Etapa 4 — Lint (riesgo **bajo** en 4a, **medio** en 4b)

- 4a: `no-unused-vars`, `no-unused-expressions`, `no-empty`, `no-case-declarations` (mecánico, sin cambio de
  comportamiento).
- 4b: reglas `react-hooks/*` y `react-refresh/*`, archivo por archivo, con prueba del componente tocado.
- Aceptación: criterio común; la línea base baja y se fija con `lint:ci --update`.
- Riesgo 4b: cambiar efectos o refs puede alterar renders; por eso va separado.

### Etapa 5 — Tipos `any` y `strict` gradual (riesgo **medio**)

- Primero los archivos que tocan cálculo, importación o reportes (`stepImporter.ts`, `MemoriaAnaliticaWizard.tsx`,
  importadores DXF/IFC); luego `noUnusedLocals` y `strict` por carpeta con `tsconfig.stable.json`.
- Aceptación: criterio común; el conteo de `any` sólo baja.
- Riesgo: tipos más estrictos destapan errores reales; se corrigen en PR aparte si cambian comportamiento.

### Etapa 6 — Duplicados del motor (riesgo **medio-alto**; coincide con la Fase 11 etapa 2)

- Que `doseFieldEngine`, `doseMapEngine`, `doseMappingEngine`, `normativeBarrierEngine`, `useShieldingEngine` y
  `shieldingMath` deleguen en las mismas funciones físicas que `motorProyecto`, o se borren si quedan sin uso.
- Aceptación: criterio común + `motorUnico.test.ts`, `ejemploGuiado.test.ts`, la suite de validación normativa
  y `fase11-motor-unico.spec.ts` sin cambios de valores (o con cambio justificado contra la referencia publicada).
- Riesgo: cambia resultados físicos; requiere revisión del propietario.

### Etapa 7 — Dependencias pesadas (riesgo **medio-alto**; decisión del propietario)

- Evaluar `three`/`@react-three/*` frente a Babylon (dos motores 3D en el bundle), `@tensorflow/tfjs` y
  `@babylonjs/gui`; mover `@types/three` a `devDependencies`.
- Aceptación: criterio común; el bundle baja; visores con banderas apagadas siguen sin montarse.
- Riesgo: romper visores que hoy están apagados; no se toca sin decisión explícita.

### Etapas 8–10 — Cierre de la Fase 11 (riesgo **medio-alto**: cambian resultados; revisión del propietario)

Pendientes de `docs/plan-fases-11-12.md` («Inventario de cálculos paralelos»). Van después de la etapa 1 y antes
de la Fase 12; cada una en su PR.

- **8 — `uaqProtocol` en `LayoutBunkerDialog`.** `lib/uaqProtocol.ts` (vía `controlledZoneCalculationAdapter`)
  sigue calculando LINAC, PET/CT, Gamma Knife y HDR con fórmulas propias. Migrar a `barreraMV` (NCRP 151) y
  `tg108` (las mismas funciones que `motorProyecto`), conservar el contrato de `f149NormativeNumericQa` apuntándolo al motor.
  Aceptación: criterio común + el diálogo da, para los casos §7.1.1/§7.1.5 de NCRP 151 y el ejemplo «Guíame»,
  el mismo espesor que `motorProyecto` (prueba Vitest nueva) y un E2E que abre el diálogo y compara.
- **9 — Cálculo por lotes con el perfil de isodosis de TC.** `BatchCalculationDialog` no recibe el perfil de
  isodosis de TC elegido en el diseñador (limitación conocida). Pasar el perfil por el almacén del proyecto y
  usarlo en `calcularProyecto`. Aceptación: criterio común + prueba de que lote y diseñador dan el mismo
  espesor con un perfil de TC cargado (y sin él, igual que hoy).
- **10 — Contraste con casos publicados.** Suite `src/__tests__/auditoria/` con un caso por fila de la tabla
  «Alcance y referencias» (NCRP 147 cap. 5 y Ap. A, NCRP 151 §7.1.1–7.1.5 y Tabla 5.1, TG-108 captación /
  imagen / control, ciclotrón contra el MC de Cyclotron-SIM), tolerancias y cita explícitas; discrepancias
  > 10 % documentadas o corregidas en `docs/auditoria-motores.md`. Sólo valores numéricos y citas de las
  normas: no se versionan los PDF con licencia. Aceptación: 100 % de los casos en verde.

La reorganización de menús y diálogos duplicados es la Fase 12 (`docs/plan-fases-11-12.md`) y va después.

## Estado

| Etapa | Estado |
|---|---|
| 0 | PR `fase10-pages-arranque` (independiente de esta rama) |
| 1 | fusionada (#43) |
| 2 | PR `depuracion-etapa-2` (ver medidas abajo) |
| 3–7 | pendientes |
| 8 | PR `fase11-etapa8-uaq`, apilada sobre la etapa 2 (ver abajo); requiere revisión del propietario |
| 9–10 | pendientes |

### Medidas de la etapa 1

Medido en este contenedor (Node 20, `CI=true`, `VITE_BASE_PATH=/RadShieldMx/`), `main` 23eb3d2 frente a la rama:

| Verificación | Antes (main) | Después (etapa 1) |
|---|---|---|
| `tsc -p tsconfig.app.json` / `tsconfig.server.json` | 0 / 0 errores | 0 / 0 errores |
| Build | OK (4 min 56 s) | OK |
| `dist/` | 17 682 609 B | 17 682 609 B (**idéntico byte a byte**, `diff -r`: el código borrado ya no entraba en el bundle) |
| JS de `dist/assets` | 7 456 594 B | 7 456 594 B |
| Vitest | 85 archivos, 735 pruebas (+3 todo) | 84 archivos, 730 pruebas (+3 todo): −1 archivo (`useSmartBarrier.test.ts`, 3 pruebas) y −2 bloques tautológicos de `hooks.test.ts` |
| ESLint (trinquete) | 126 errores | 121 (−4 de `useWASM.ts`, −1 de `hooks.test.ts`); línea base actualizada |
| Humo «Guíame» | 7 barreras; muro norte 18.85 mm Pb / 199.88 mm concreto | idénticas (tolerancia 0.01 mm) |
| Dependencias | — | −`recharts`, −`pdfjs-dist` (≈ 37 MB menos en `node_modules`; 80 paquetes menos en el lock) |

### Medidas de la etapa 2

Medido en contenedor (Node 20, 2 núcleos, `CI=true`, `VITE_BASE_PATH=/RadShieldMx/`,
`NODE_OPTIONS=--max-old-space-size=6144` como en el CI), `main` a7bafb1 frente a la rama:

| Verificación | Antes (main) | Después (etapa 2) |
|---|---|---|
| `tsc -p tsconfig.app.json` / `tsconfig.server.json` | 0 / 0 errores | 0 / 0 errores |
| Build | OK | OK |
| `dist/` | 17 683 950 B (con `wasm/`) | 17 682 652 B (−1 298 B; sin `wasm/`) |
| JS de `dist/assets` | 7 456 925 B | 7 456 245 B (−680 B: texto más corto de la sección 9.0 del manual; el código borrado ya no entraba en el bundle) |
| Vitest | 85 archivos, 734 pruebas (+3 todo) | 79 archivos, 672 pruebas (+3 todo): −62, todas de código borrado (ver abajo) |
| ESLint (trinquete) | 121 errores | 121 (los archivos borrados no tenían errores en la línea base) |
| Humo «Guíame» | 7 barreras; muro norte 18.85 mm Pb | job «Humo» del CI (tolerancia 0.01 mm) |

Borrado: `lib/skyshine/ChiltonSkyshine.ts`, `lib/ct/CTScatterDatabase.ts`,
`lib/performance/{AlgorithmAnalyzer,BenchmarkSuite,CPUMemoryProfiler,FunctionProfiler}.ts` (se conserva
`Profiler.ts`, que usa el diseñador), `components/UnavailableFeatureDialog.tsx`, `lib/f174aPredeployHardening.ts`,
`lib/f406CanvasToolQa.ts`, `lib/multiSourceDetector.ts` y `public/wasm/shielding_math.wasm`. Pruebas retiradas:
`benchmark.test.ts`, `algorithmAnalyzer.test.ts`, `chiltonSkyshine.test.ts`, `ctScatter.test.ts`,
`UnavailableFeatureDialog.test.tsx`, `f174aPredeployHardening.test.ts` (57 en total en esos 6 archivos), los
4 casos Skyshine/TC de `visual.test.ts` y el caso F406 de `f405ToF408ReleaseContracts.test.ts`. Texto: la sección
9.0 del manual en la app dice que WebAssembly se retiró y que el cálculo es el motor único; el diálogo
multi-fuente ya no cita `lib/multiSourceDetector`. Despliegue: sin `location /wasm/` en `nginx.conf` y sin
`wasm/shielding_math.wasm` en `e2e/static-deploy.spec.ts`; el ejemplo de `rutaPublica` ya no usa una ruta wasm.
La CSP de `index.html` conserva `'wasm-unsafe-eval'` (Babylon puede cargar decodificadores WASM).

### Etapa 8 — `uaqProtocol` fuera del diálogo «Layout de búnker»

`controlledZoneCalculationAdapter` (lo llama «Enviar a calculo» del panel de factibilidad de `LayoutBunkerDialog`) ya no
usa `uaqProtocol`. El nuevo `lib/zonaControladaMotor.ts` usa las mismas funciones que `motorProyecto`:

| Familia | Antes (`uaqProtocol`) | Ahora |
|---|---|---|
| LINAC primaria/secundaria | TVL único; secundaria con modelo propio; IMRT 75 % | `barreraMV` (NCRP 151 Ec. 2.1, 2.3, 2.7, 2.8; TVL₁/TVLₑ; dos fuentes y suma directa); U = 0.25, θ = 30°, IMRT 50 % con C_I = 5 (los mismos valores por omisión que el motor) |
| PET/CT | K = Γ·A·N·t/d² sin decaimiento ni absorción; **TVL de 6 MV** (37 cm de concreto) para 511 keV | `dosisSemanalTG108` (captación, F-18, tU = 1 h) y TVL de 511 keV del catálogo |
| Gamma Knife | B = P/K **sin T** | B = P/(T·K) con TVL de Co-60 del catálogo (`tvlThickness`) |
| HDR Ir-192 | Γ = 4.69 «R·m²/(Ci·h)» y R → mSv × 0.00876 (≈ 100× menos kerma) | Γδ = 0.111 μGy·m²/(MBq·h) del catálogo y TVL de Ir-192 (`tvlThickness`) |

Cambian los resultados del plan preliminar de zona controlada (PET, HDR y Gamma Knife suben mucho; LINAC cambia
poco). `f149NormativeNumericQa` conserva sus IDs de caso, pero sus casos LINAC/PET/Gamma Knife/HDR apuntan ahora al
motor: el LINAC es el caso publicado NCRP 151 §7.1.1 (149.6 cm, `canonical-reference`); 8/8 casos pasan.
Prueba: `src/__tests__/auditoria/zonaControladaMotor.test.ts` (NCRP 151 §7.1.1 → 149.6 cm y §7.1.5 → 66.4 cm, ±1.5 %;
mismo espesor que `motorProyecto` en §7.1.1, §7.1.5, plomo/acero, «Guíame» captación norte con una fuente, Gamma Knife
y HDR; todas las barreras de todas las opciones del perfil por omisión del diálogo). De `uaqProtocol` sólo queda
la tabla `C1_IMRT_FACTORS` que lee `MemoriaAnaliticaWizard` (su cálculo ya es `barreraMV`); ninguna ruta de
cálculo usa sus fórmulas. Falta el E2E que abre el diálogo: el
selector de vista es un Select de Radix y no hay navegador local para escribirlo con garantías.

Medidas (mismo entorno que la etapa 2, rama apilada sobre la etapa 2): `tsc` 0/0; Vitest 80 archivos / 680 pruebas
(+1 archivo y +8 pruebas sobre la etapa 2); lint 121 sin nuevos; JS de `dist/assets` 7 456 245 → 7 453 897 B
(−2 348 B respecto a la etapa 2).
