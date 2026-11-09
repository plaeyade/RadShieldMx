# Plan de motores de cálculo — campo de dosis unificado

Estado: Fases 1 (PR #26), 2 (PR #27), 3 (PR #28) y 4 (PR #29) fusionadas; Fase 5 en revisión (rama `fase5`). Herramienta de diseño preliminar; todo resultado
requiere revisión de un experto calificado / OSR antes de uso clínico o regulatorio.

## Diagnóstico de partida

- Seis cálculos distintos dibujan mapas de dosis. Sólo el heat map del lienzo usaba `shieldingMath`
  (`calculateHeatmapGrid`) y aun así ignoraba las barreras; ninguno usaba `normativeBarrierEngine`.
- El heat map WebGPU (`HEATMAP_SHADER` en `src/hooks/useWebGPU.ts`) calcula W·U/d² en píxeles y no
  coincide con el cálculo de CPU; además se intentaba antes que el de CPU.
- `src/lib/doseMappingEngine.ts` tiene errores conocidos: Γ con un factor ×1000, TVL de F-18 erróneos,
  Σ_R de neutrones incorrecto y mezcla cm/m.
- Los visores HeatMapViewer, IsodosisViewer, Isosurface3DDialog y DoseMapping3D muestran dosis no físicas.
- Babylon (`@babylonjs/*`) y `react-unity-webgl` no aportan al producto; `chunkSizeWarningLimit: 5000`
  ocultaba un chunk de entrada de 3.9 MB; HUD de depuración dibujados sobre el plano.

Decisión del responsable: **no borrar** los visores problemáticos. Quedan **inactivos** detrás de
banderas en `src/lib/featureFlags.ts` y se reactivan uno por uno cuando pasen pruebas contra el motor.

## Banderas (`src/lib/featureFlags.ts`)

Banderas de compilación (variables `VITE_*`), todas `false` por omisión; no se alternan desde
localStorage para que una preferencia guardada no reabra visores con dosis no físicas.

| Bandera | Variable | Efecto con `false` |
|---|---|---|
| `VISORES_EN_REVISION` | `VITE_VISORES_EN_REVISION` | Isodosis, 3D Dose Mapping, Heat Map Avanzado e Isosuperficie 3D sin entrada en paleta/barra lateral y sin montarse |
| `HEATMAP_GPU` | `VITE_HEATMAP_GPU` | Heat map siempre en CPU con `doseFieldEngine` |
| `DEPURACION_RENDER` | `VITE_DEPURACION_RENDER` | No se dibujan los HUD F442–F445/F621–F640 sobre el plano (el `<canvas>` overlay sigue montado). Los paneles DOM F621–F695 ya sólo aparecen en modo «guiado» (opt-in) y los usan pruebas E2E: se conservan |
| `VISOR_3D_BABYLON` | `VITE_VISOR_3D_BABYLON` | Inspección 3D no monta la vista previa Babylon; muestra «En revisión: se reactivará con el motor de dosis unificado» |
| `VISOR_HEATMAP_AVANZADO` | `VITE_VISOR_HEATMAP_AVANZADO` | Fase 5: Heat Map Avanzado (ya conectado al motor) sigue inactivo |
| `VISOR_ISODOSIS` | `VITE_VISOR_ISODOSIS` | Fase 5: Curvas Isodosis (ya conectado) sigue inactivo |
| `VISOR_ISOSUPERFICIE_3D` | `VITE_VISOR_ISOSUPERFICIE_3D` | Fase 5: Isosuperficie 3D (ya conectado) sigue inactivo |
| `VISOR_DOSE_MAPPING_3D` | `VITE_VISOR_DOSE_MAPPING_3D` | Fase 5: 3D Dose Mapping (ya conectado) sigue inactivo |

Un visor en revisión se monta y aparece en menús si `VISORES_EN_REVISION` **o** su bandera propia está en `true`
(`visorDisponible`, `BANDERAS_VISOR`). Todas siguen en `false` hasta que el responsable autorice cada visor.

## Fase 1 — Motor de campo único y desactivación controlada (PR #26, fusionada)

Entrada: diagnóstico anterior aceptado; `shieldingMath`, `ncrp147`, `ncrp151`, `normativeBarrierEngine` con pruebas en verde.

Trabajo:
1. `src/lib/doseFieldEngine.ts`: `dosisEnPunto`, `kermaEnPunto`, `calcularMallaDosis`.
   - K₀ = `calculateUnshieldedKerma` (sin fórmulas nuevas).
   - Por cada barrera cruzada por el segmento fuente → punto: transmisión con la maquinaria existente
     (LINAC: TVL₁/TVLₑ de NCRP 151 Tabla B.2 primaria / B.7 fuga vía `transmisionTVL`, inversa exacta de
     `espesorTVL`; diagnóstico: Archer NCRP 147 Tablas B.1/C.1; resto: `tvlTransmission`).
   - Oblicuidad: recorrido t / cos θ, crédito limitado a θ ≤ 60° (conservador).
   - Espesor de la barrera: `shieldingLayers` → `thickness_mm` → `requiredThickness_mm[materialCode]`.
2. El heat map del lienzo (`useShieldingEngine.calculateHeatmap`) llama al motor y pasa `floorPlan.barriers`;
   `calculateHeatmapGrid` queda `@deprecated` y comparte la malla (`heatmapGridPoints`).
3. GPU desactivada (`HEATMAP_GPU`), visores en revisión inactivos, HUD de depuración ocultos, Babylon fuera
   del bundle, `react-unity-webgl` eliminado, `CanvasRenderer.ts` (sin uso) eliminado, visores a `lazy()`,
   `chunkSizeWarningLimit` 1500.

Salida / pruebas:
- `src/__tests__/lib/doseFieldEngine.test.ts`: sin barreras = `calculateUnshieldedKerma` y
  `calculateHeatmapGrid` (idéntico); inverso del cuadrado; una barrera con t = `espesorTVL(10⁻³)` da
  B = 10⁻³; fuga B.7; oblicuidad 45° (t·√2) y tope a 60°; Archer C.1; TVL de material; dos barreras y capas.
- `src/__tests__/lib/featureFlagsMotorDosis.test.ts`: banderas apagadas por omisión, filtro de menús y paleta.
- `tsc -p tsconfig.app.json`, `vitest run`, `lint:ci` (sin errores nuevos) y `vite build` en verde.
- E2E: las pruebas Babylon F455/F456/F470 se omiten salvo `E2E_VISOR_3D_BABYLON=1` (build con la bandera);
  F459 valida la tarjeta «en revisión». Ninguna prueba E2E apuntaba a los cuatro visores desactivados.

## Fase 2 — Campo consciente de barreras completo

Entrada: Fase 1 fusionada.

Trabajo:
- Separar el campo por componentes: primaria (con U y orientación del haz/gantry), fuga y dispersión del
  paciente (NCRP 151 Ec. 2.7/2.8, regla de dos fuentes) y, en diagnóstico, primaria vs. secundaria por
  Tabla 4.5/4.7, en lugar del K₀ único de `calculateUnshieldedKerma`.
- TVL₁/TVLₑ por componente y material para todos los materiales (incluidos barita/hierro con datos propios
  en lugar de equivalencia másica), preblindaje NCRP 147 Tabla 4.6.
- Oblicuidad con datos de incidencia oblicua (NCRP 151 §2.4) en lugar del tope fijo de 60°; espesor
  geométrico de la barrera (no sólo línea).
- `calculateAllBarriers` y `normativeBarrierEngine` consultan el mismo motor para el kerma en los puntos de
  muestreo (una sola fuente de verdad para tabla de resultados y mapa).

Salida / pruebas: el kerma del motor en los puntos de muestreo detrás de la barrera calculada es ≤ P/T
(tolerancia de redondeo) para los casos de `normativeBarrierEngine.test.ts`; regresión de Fase 1 en verde.

### Estado de la Fase 2 (PR #27, fusionada)

Hecho:
- **Componentes** (`doseFieldEngine.ts`, `contribucionFuente` → `componentes`):
  - Teleterapia NCRP 151 (`linac-*` y `tele-co60*`; Gamma Knife sigue fuera, es autoblindado): `primaria`
    W·U/d² (Ec. 2.1, B.2 TVL₁/TVLₑ), `fuga` 10⁻³·W_L/d² (Ec. 2.8; W_L con IMRT vía `cargaFuga`, Ec. 3.6;
    B.7 en concreto, B.2 en acero/plomo) y `dispersion` a(θ)·W·U·(F/400)/d² (Ec. 2.7, B.4; un TVL de B.5a).
    W = fracciones × Gy/fracción (`fuenteTeleterapiaDe`, el mismo que el motor normativo; antes el campo
    usaba 2 Gy fijos). Las expresiones de K₀ (`kermaPrimaria`, `kermaFuga`, `kermaDispersion`) y de TVL
    (`tvlPrimaria`, `tvlFuga`, `tvlDispersion`) están en `ncrp151.ts` y las usan tanto el espesor
    (B = P/(T·K)) como el campo (K·B).
  - Dónde llega la primaria: con `RadiationSource.ejeGantry_deg` (nuevo, opcional), en la franja que barre
    el haz (semidiagonal del campo 40×40 cm: 0.283·(d + SAD)); sin orientación, en los rayos que cruzan una
    barrera primaria o ninguna (interior de la sala). U y θ salen de la barrera cruzada (`useFactor`,
    `scatterAngle_deg`, 30° por omisión) o de la fuente.
  - Diagnóstico TG9: `primaria147` (Tabla 4.5, Archer B.1) y `secundaria147` (Tabla 4.7 a 135°, C.1) con
    `terminoNCRP147`, compartido con el motor normativo; preblindaje de la Tabla 4.6 opcional
    (`preblindaje`, sin acreditar por omisión, como el normativo).
  - TC, medicina nuclear (TG-108 por paciente), braquiterapia y resto: K₀ único de `calculateUnshieldedKerma`.
  - En el campo las componentes se suman; la regla de las dos fuentes es sólo de diseño.
- **Oblicuidad** (NCRP 151 §2.2, p. 24: para θ > 45°, ≈ 2 HVL en baja energía y ≈ 1 HVL en alta energía,
  concreto): primaria y fuga con espesor oblicuo; para θ > 45° y B < 10⁻³ se descuenta 1 HVL (MV) o 2 HVL
  (Co-60) (`correccionOblicuidad`), sin superar la transmisión normal y sin crédito más allá de 70°. El umbral
  B < 10⁻³ y el tope de 70° son criterios conservadores del motor (en la Fase 3 se corrigió la cita, que
  remitía a Biggs/AAPM en lugar de NCRP 151 §2.2). Dispersión del paciente: espesor normal, sin crédito (el informe no da
  un criterio único). Diagnóstico y resto: tope de 60° de la Fase 1.
- **Espesor geométrico**: la barrera es una banda de espesor t desde la línea (cara interior) hacia el lado
  opuesto a las fuentes (convención de `generateSamplePoints`); el recorrido es la cuerda real del rayo
  (`cuerdaEnBarrera`): t/cos θ al cruzarla, parcial dentro del muro, recortada en los extremos.
- **Una sola fuente de verdad**: `calculateAllBarriers` toma el kerma sin blindaje de los puntos de muestreo de
  `dosisEnPunto`; `normativeBarrierEngine` usa las mismas funciones de K₀/TVL y, además de la regla de NCRP 151,
  resuelve la suma directa Σ K·B = P/T (`espesorSumaDirecta`) y toma el mayor espesor: con fuga + dispersión
  de un equipo de doble energía (4 componentes) la regla de dos fuentes dejaba el campo ~1 % sobre P/T.

Pruebas (`src/__tests__/lib/doseFieldEngineFase2.test.ts`): componentes contra NCRP 151 §7.1.1 (149.6 cm →
B = 3.69×10⁻⁴, primaria = P/T), §7.1.5 (dispersión 46.1/30.7 cm, fuga 37.3/25 cm, total 66.4 cm ≤ P/T) y
§7.1.4 (W_L = 945 Gy/semana); consistencia campo ↔ normativo en los puntos de muestreo (primaria = P/T,
total ≤ P/T + 1 %; secundaria 6+18 MV con IMRT en concreto/plomo/acero ≤ P/T; NCRP 147 §5.2 = P/T y K₀ igual
al normativo; fluoroscopía con dos fuentes ≤ P/T, = P/T sin crédito de oblicuidad); oblicuidad §2.4;
(cita corregida a §2.2, p. 24, en la Fase 3); cuerda geométrica; presencia de la primaria con y sin `ejeGantry_deg`; preblindaje. Las pruebas de la Fase 1
que suponían un K₀ único para LINAC/diagnóstico TG9 ahora comprueban la componente correspondiente.

Pendiente (no se inventan datos):
- Barita/hierro con TVL propios: NCRP 151 Tabla B.2 sólo tabula concreto, acero y plomo; los TVL de
  `CONCRETEBARITE`/`CONCRETEIRON` del catálogo no tienen fuente. Siguen por equivalencia másica.
- Interfaz para capturar `ejeGantry_deg` en el panel de la fuente.
- Laberinto/puerta y fotoneutrones en el campo (sólo existen en `ncrp151Laberinto.ts`).
- `HEATMAP_GPU` y `VISORES_EN_REVISION` siguen en `false`.

## Fase 3 — Reconectar DoseMapDialog, SpatialDoseMap y modo dosis de Medical 3D

Entrada: Fase 2 fusionada.

Trabajo: `DoseMapDialog`, `SpatialDoseMapDialog` y el modo dosis de `MedicalFloorPlan3DDialog` consumen
`calcularMallaDosis`/`dosisEnPunto`; retirar `doseMapEngine`/`doseMappingEngine` de esos caminos (corrigiendo
o aislando Γ ×1000, TVL F-18, Σ_R y cm/m) y unificar unidades (mSv/semana, m).

Salida / pruebas: prueba por visor que compara su malla con el motor en ≥ 10 puntos (diferencia < 1 %);
prueba de unidades (m vs. px) con dos escalas.

### Estado de la Fase 3 (rama `motor-dosis-fase3`)

Entrada cumplida: Fase 2 fusionada (PR #27).

Hecho:
- **API de mallas** en `doseFieldEngine.ts`: `calcularMallaRegular` (celdas cuadradas sobre un rectángulo en px,
  valor = `dosisEnPunto` en el centro de cada celda, `paso_px` y `paso_m`), `centroCelda`, `limitesDelPlano`,
  `kermaFiltrado` / `componentesPresentes` / `COMPONENTES_CAMPO` / `ETIQUETA_COMPONENTE` (componentes
  seleccionables). `src/lib/visoresDosis.ts` (`mallaDoseMap`, `mallaSpatialDoseMap`) es lo único que llaman
  los diálogos; selector común `SelectorComponentesDosis`.
- **DoseMapDialog**: fuentes, barreras reales y escala del plano (`canvasStore`) en lugar de una sala 8×8 m con
  tres barreras sintéticas y una sola TVL; componentes seleccionables; kerma en mSv/semana sin T (antes
  multiplicaba por T) y P/T como isodosis; color y altura 3D en log₁₀. `doseMapEngine.ts` queda sólo de
  presentación (mapas de color, isodosis, malla 3D, estadísticas, `resultadoDesdeMalla`): se retiraron
  `TVL_PRIMARY_CONCRETE_MM`, `TVL_SECONDARY_CONCRETE_MM`, `HVL_LEAD_MM`, `calculatePointDose` y `calculateDoseGrid`.
- **SpatialDoseMapDialog**: `mallaSpatialDoseMap` (80 columnas sobre el plano, misma escala en x e y) en lugar
  de Γ = 0.5 fijo, μ inventados, 23.5 cm de concreto en toda barrera y «µSv» mal rotulado.
- **Medical 3D, modo dosis**: `buildMedicalScene(plano, preset, { dosis: { componentes } })` genera
  `dosePoints` como malla del motor (24 columnas sobre la escena; m = px × escala) con `kerma_mSv_semana` y
  nivel (> 0.1 controlada, > 0.02 supervisada); antes eran tres anillos fijos por equipo. Sin la opción no se
  calcula (el lienzo construye la escena en cada render) y `dosePoints` queda vacío.
- **doseMappingEngine** (usado sólo por DoseMapping3D, que sigue en revisión): la tasa de cada vóxel sale de
  `dosisEnPunto` con una fuente sintética `pet-f18`. Corregidos: Γ ×1000 (0.143 µSv·m²/(MBq·h), no por GBq),
  TVL de 511 keV (37 cm de concreto y 0.5 cm de plomo → catálogo TG-108: 17.6 cm, 1.66 cm, acero 6.5 cm), y
  cm/m (el muro estaba a `shieldThickness_cm` metros; ahora a `shieldDistance_m` m con espesor en cm → mm).
  Neutrones (Σ_R ~10× bajos) y electrones quedan fuera de alcance (malla vacía con `nota`); positrones = 511 keV.
- Cita de oblicuidad de la Fase 2 corregida a NCRP 151 §2.2, p. 24 (`ncrp151.ts`, `doseFieldEngine.ts`,
  pruebas, `docs/revision-fisica-2026-11.md`).
- Banderas sin cambios: `VISORES_EN_REVISION = false` (Heat Map Avanzado, Isodosis, Isosuperficie 3D,
  3D Dose Mapping siguen inactivos hasta la Fase 5) y `HEATMAP_GPU = false`.

Salida cumplida (`src/__tests__/lib/doseFieldEngineFase3.test.ts`, 15 pruebas):
- DoseMapDialog, SpatialDoseMapDialog y Medical 3D: ≥ 10 puntos por visor, diferencia con `dosisEnPunto`
  < 1 % (en la práctica, redondeo Float32), con todas las componentes y con selecciones (sólo fuga, NCRP 147,
  fuga + dispersión); se comprueba que las barreras reales atenúan.
- Unidades: el mismo plano a 0.01 y 0.02 m/px da la misma malla (nx, ny, paso en m) y el mismo kerma; la escena
  3D da las mismas celdas en metros.
- doseMappingEngine: 1 GBq de F-18 a 2 m = 143/4 µSv/h; 1.66 cm de plomo y 17.6 cm de concreto = 1 TVL; el
  muro a `shieldDistance_m`; vóxeles = motor; neutrones/electrones fuera de alcance.
- `tsc -p tsconfig.app.json`, `vitest run` (63 archivos, 478 pruebas), ESLint de los archivos tocados sin
  errores nuevos (quedan los previos de DoseMapDialog/MedicalFloorPlan3DDialog) y `vite build` en verde;
  Playwright en CI.

Pendiente: Interfaz para `ejeGantry_deg`; laberinto/puerta y fotoneutrones en el campo; DoseMapping3D sigue
con su sala sintética (se reconectará al plano en la Fase 5, junto con su reactivación).

## Fase 4 — Suite de validación normativa

Entrada: Fase 3 fusionada.

Trabajo: casos de NCRP 147 cap. 5 (radiografía, fluoroscopía, mastografía, TC) y NCRP 151 cap. 7 (primaria,
secundaria, laberinto/puerta, neutrones) como pruebas de extremo a extremo del motor; un plano DWG/DXF real
importado de punta a punta (geometría → barreras → campo → reporte).

Salida / pruebas: cada ejemplo reproduce el valor publicado dentro de la tolerancia documentada; el caso
DWG real queda como prueba E2E en CI.

### Estado de la Fase 4 (PR #29, fusionada)

Entrada cumplida: Fase 3 fusionada (PR #28). Fuentes: NCRP 147 (Sección 5, pp. 69–101; Tabla 4.7, pp. 46–47;
Figs. A.2/A.3, pp. 123–124) y NCRP 151 (§7.1, pp. 105–148; Tablas B.8a/B.8b, pp. 168–169), versiones con licencia
locales (`data/pdf/`, fuera de git); en las pruebas sólo se transcriben los números necesarios.

Suite (`src/__tests__/validacion/`, 43 pruebas + 3 `it.todo` documentados):
- `ncrp147Capitulo5.test.ts` — vía `calcularBarreraNormativa` y `dosisEnPunto`: §5.1 angiografía cardiaca (K = 5.9,
  1.3 mm Pb), §5.2 tórax primaria (40 mGy/semana, 2.2 mm; neto 1.4 mm con preblindaje) y secundaria (0.18, 0.42 mm),
  §5.3.1 piso (39 → 107 mm concreto, 35 mm netos; 0.47 → 33 mm), §5.3.2 techo (0.84 → 44 mm), §5.3.4 cuarto oscuro
  (1.1 → 0.53 mm), §5.3.6 control (1.3 → 0.27 mm), §5.5 mastografía (1.2 → 9.8 mm de yeso), §5.6.1 TC método DLP
  (5.2 → 1.5 mm Pb). Con `ncrp147` (distribuciones sin modalidad en el catálogo o con d_L ≠ d_S): §5.3.3 (46 → 1.3 mm,
  0.45 netos; 1.1 → 0.35 mm), §5.3.5 (7.5 y 0.72; K_tot(0.8 mm) = 0.014), §5.4.1 (1 + 0.29 = 1.3 → 62 mm),
  §5.4.2 (18.6 y 7; 0.017 a 72 mm; 69 mm), §5.6 CTDI (0.12/0.38 → 3.1 → 1.3 mm).
  Tolerancias: kerma ±4 % (redondeo a 2 cifras), espesor ±5 % (lectura de figuras / Ec. 4.10 a 2 cifras), campo con
  el espesor publicado ±10 % de P/T.
- `ncrp151Capitulo7.test.ts` — primarias §7.1.1 (149.6 cm; 6 MV 1 µSv), §7.1.3 (dispersión a 10°: 0.51 µSv), §7.1.4
  (fuga 2.2×10⁻³ µSv), §7.1.7 (188.6 cm; 2.7 µSv), §7.1.14 (163 cm); secundarias §7.1.5 (66.4 cm; 2.8/4.6/0.8/0.8 →
  9 µSv; IMRT 73 cm → 10 µSv), §7.1.8 (94.7 cm → 47 µSv; IMRT 102.4 cm → 48.5 µSv), §7.1.9 (87 cm; IMRT 101.2 cm →
  12.8 µSv), §7.1.15 (19 µSv tras 73 cm; IMRT 20.5 µSv tras 80.1 cm y 91 cm → 9.3 µSv); laberinto §7.1.10
  (H_S 2.2, H_LS 1.7, H_ps 34.9, H_LT 0.6 → H_Tot 100 µSv; IMRT 113), §7.1.11 (φ_A 7.88×10⁹, h_φ 1.45×10⁻⁷,
  65.3/170 µSv), §7.1.12 (Kersey 1.7×10⁻⁶ → 765/1 989 µSv; Wu–McGinley 0.8×10⁻⁶), §7.1.13 (puerta 54 mm BPE + 7 mm
  Pb; IMRT 72 + 32 mm), §7.1.17 (fuga 80.2/69 → 91 cm, 67 µSv). Tolerancias: espesor ±1.5 % (y ≥ publicado − 0.5 cm),
  dosis por componente ±5 %, totales ±3 %.
- `dxfPuntaAPunta.test.ts` — `e2e/fixtures/sample-floorplan.dxf` (el de la prueba Playwright) por las funciones de la
  app: `importDXFToFloorPlan` → `useShieldingEngine().calculateAllBarriers` (NCRP 147) → `dosisEnPunto` y
  `mallaDoseMap` → `verificarPlano` (4 × CUMPLE; un muro adelgazado da NO_CUMPLE y campo > P). Corre en el job de
  Vitest de CI (el job Playwright sigue con `continue-on-error`).

Correcciones al motor (con cita):
- **Regla de dos fuentes en secundaria NCRP 151** (`combinarPorTipo`): por tipo (dispersión entre energías, fuga entre
  energías) y después entre tipos, como §7.1.5 (pp. 114–115) y §7.1.8 (p. 123). Antes una sola pasada sobre las
  cuatro componentes daba 56.9 cm en §7.1.5 (publicado 66.4) y 85.7 cm en §7.1.8 (94.7). Se mantiene la suma directa.
- **TVL de dispersión a θ < 15°**: max(B.5a a 15°, TVL₁ primario de B.2), como §7.1.3 (p. 110: 45 cm a ~10° con
  18 MV). Antes 44 cm (no conservador; 0.42 frente a 0.51 µSv).
- **α₁ del laberinto** (Ec. 2.10/2.11): Tabla B.8b (45°) como §7.1.10.2–3 (pp. 130–131); antes B.8a (hasta 17 %
  menos, no conservador). Nueva `dsecFuga_m` (d_LS = 7.9 m en H_LS frente a d_sec = 7.3 m en H_ps); antes una sola
  distancia sobrestimaba H_LS un 15 %.
- **TC**: transmisión de la secundaria de TC de las Figs. A.2/A.3 (120 y 140 kVp; sin kVp fijo, la mayor) en el campo
  y en el normativo (`tomografia`: κ·DLP con el perfil de isodosis si lo hay). Antes Archer genérico del material.
- **Mastografía**: K¹_sec = 3.6×10⁻² mGy/paciente a 1 m del isocentro (Tabla 4.7 nota f; §5.5, p. 92). Antes la
  columna de 135° de la Tabla 4.7 (4.9×10⁻², medida desde tubo y paciente).
- **NCRP 147 secundaria**: columna de 90° de la Tabla 4.7 si la barrera tiene 60° ≤ `scatterAngle_deg` ≤ 120°; si
  no, 135° (por omisión, como antes). Tabla 4.7 completa (fuga, 90°, 135° por separado). Ids `angio-cardiac` y
  `angio-peripheral` en `DISTRIBUCION_POR_MODALIDAD` (el catálogo aún no los expone).
- **DXF**: los códigos del importador CAD («concreto», «plomo»…) se resuelven al catálogo (`codigoCatalogo`) en el
  campo, en `calculateAllBarriers` y en la verificación: antes los muros importados no atenuaban (B = 1) y el reporte
  quedaba «SIN_CALCULO». El espesor declarado en la capa con unidad («…_300MM») pasa a `thickness_mm` (instalado);
  el espesor ya no se lee del nombre «DXF n (…)», que daba «n mm».

No reproducidos / pendientes (`it.todo`, sin ajustar la prueba):
- §7.1.9 sin IMRT: el informe da 8.8 µSv (18 MV) detrás de 87 cm; la Ec. 2.8 con la Tabla B.7 da 9.8 µSv (el caso con
  IMRT, misma fórmula, sí coincide). Total ≤ P en ambos casos.
- §7.1.15: el informe aplica la regla de dos fuentes sólo al par mayor (73 cm); la regla por tipo da 83.5 cm
  (conservador). La dosis detrás de 73 cm sí se reproduce.
- §5.5 puerta de madera (41 mm): sin madera en el catálogo ni ajuste de madera transcrito de la Tabla C.1.
- No cubiertos: §7.1.2/§7.1.6/§7.1.16 (TADR en cualquier hora: el motor no calcula R_h), §7.1.17 neutrones directos
  (Fig. A.2 de NCRP 151, lectura gráfica), §7.2 (CyberKnife, sin modalidad), §5.7 (densitometría).
- Limitaciones del campo halladas con el DXF: el heat map del lienzo (`calculateHeatmap`) sólo muestrea ±200 px
  alrededor de las fuentes (±0.2 m en un DXF en mm); la banda de cada muro no cubre el cuadrado t × t de la esquina
  exterior (el campo ahí sobrestima: conservador). Ambas corregidas en la Fase 5. Laberinto/puerta siguen fuera del campo.
- `VISORES_EN_REVISION` y `HEATMAP_GPU` siguen en `false`.

## Fase 5 — Reactivar visores uno por uno

Entrada: Fase 4 fusionada.

Trabajo, por visor (Heat Map Avanzado → Isodosis → Isosuperficie 3D → 3D Dose Mapping): conectarlo al
motor, añadir su prueba contra el motor y retirarlo de `IDS_VISORES_EN_REVISION` (o una bandera propia).

Salida / pruebas: prueba unitaria visor ↔ motor; E2E que abre el visor desde menú/paleta; revisión física.

### Estado de la Fase 5 (rama `fase5`)

Entrada cumplida: Fase 4 fusionada (PR #29).

Visores conectados al motor (todos vía `src/lib/visoresDosis.ts` → `doseFieldEngine`, sin física propia; plano,
barreras y escala del lienzo de `canvasStore`; kerma en mSv/semana). **Siguen inactivos**: cada uno tiene su bandera en
`featureFlags.ts`, en `false`; `VISORES_EN_REVISION` y `HEATMAP_GPU` siguen en `false` (el shader GPU no se tocó).
Ningún visor se borró.
1. **Heat Map Avanzado** (`HeatMapViewer`): `mallaHeatMapAvanzado` (120 columnas); escalas lineal/raíz/log₁₀ relativas al
   máximo (`valorEscala`, 6 décadas), isodosis absolutas `NIVELES_ISODOSIS`, fuentes/barreras reales y selector de
   componentes. Antes: tres fuentes ficticias («LINAC A/B, HDR») con una exponencial sin unidades.
2. **Curvas Isodosis** (`IsodosisViewer`): `isodosisPlano` (80 columnas) con niveles absolutos P/T ∪ 0.02…5 mSv/semana
   (P y T editables) y marching squares de `doseMapEngine.extractContours` sobre los valores del motor. Antes: fuente en
   el centro del lienzo y niveles «%» de una exponencial.
3. **Isosuperficie 3D** (`Isosurface3DDialog`): `malla3DPlano` — un corte `calcularMallaRegular` por altura (0.25…2.75 m);
   la fuente queda a su `isocenterHeight_m` y el motor recibe la distancia vertical |h − z| (a z = 0 es exactamente el campo
   2D); sin crédito de oblicuidad vertical (conservador); se omiten puntos a < 0.3 m de una fuente. Niveles en
   mSv/semana. Antes: Γ = 0.11 sobre «Ci» en una sala fija de 10×8×6 m. Corregido además que el diálogo nunca abría
   (`dialogs.isosurface3d?.open` sobre un booleano; el mismo patrón está en otros 18 diálogos fuera de alcance).
4. **3D Dose Mapping** (`DoseMapping3D`): origen por omisión «Plano del lienzo» (`meshDoseMapping3D`: vóxeles de
   `malla3DPlano`, x/altura/y en m); la zonificación del visor es por tasa, así que se usa la tasa media = kerma semanal /
   40 h (`tasaMedia_uSv_h`). La sala sintética de la Fase 3 queda como opción.

Limitaciones de la Fase 4 corregidas:
- **Dominio del heat map del lienzo en metros** (`dominioHeatmap`, `calcularMallaDosis`): antes ±200 px alrededor de cada
  fuente (±0.2 m en un DXF en mm). Ahora: fuentes y barreras + 1 m, unido al radio R donde el kerma sin blindaje de cada
  fuente cae bajo `UMBRAL_DOMINIO_HEATMAP_mSv_semana` = 0.002 mSv/semana (P/10 de zona no controlada), R = √(K(1 m)/umbral)
  acotado a [1, 10] m. Paso = máx(`gridSize` px, lado mayor / 80): el número de puntos no depende de la escala. Los puntos
  son centros de celda (`paso_px`, que usa el lienzo para el radio del círculo). `calculateHeatmapGrid`/`heatmapGridPoints`
  (`@deprecated`) conservan su malla antigua.
- **Uniones de muros en esquina** (`unionesDeBarreras`, `cuerdaEnBarrera(…, uniones)`): dos barreras que comparten extremo
  (±1 cm) se cortan en inglete por la recta vértice interior → intersección de las caras exteriores (espesores distintos
  incluidos). Esquina exterior: se cubre el hueco t₁ × t₂ (en el DXF de la Fase 4 el campo en la diagonal bajaba de
  0.699 mGy/semana a ≤ P/T = 0.02); esquina entrante: sin doble crédito en el solape. Se omiten (corte recto, como antes):
  3+ barreras en un extremo, uniones en T, muros colineales y ángulos con inglete > 4·t. Las uniones se calculan una vez por
  malla (caché por arreglo de barreras + firma geométrica).

Pruebas (`src/__tests__/lib/doseFieldEngineFase5.test.tsx`, 17): banderas por visor en `false` y habilitación individual;
por visor, ≥ 10 puntos frente a `dosisEnPunto` (< 1 %; en la práctica redondeo Float32) con todas las componentes y con
selecciones, y montaje del visor en jsdom con el plano del lienzo aunque su bandera esté apagada; dominio del heat map con
el mismo plano a 0.01 y 0.001 m/px (mismo dominio en m, mismo kerma, puntos acotados) y radio de umbral; esquina exterior
(transmisión idéntica a un muro continuo en ±0.06 rad alrededor de la diagonal), esquina entrante (igual a un solo muro) y
cuerda con/sin unión. `dxfPuntaAPunta.test.ts` ahora exige ≤ P/T en todos los puntos fuera de la sala (diagonales incluidas)
y que el heat map del lienzo cubra la sala y los muros con el valor del motor. Las pruebas de Fase 1 que comparaban la malla
con `calculateHeatmapGrid` comparan ahora punto a punto con `calculateUnshieldedKerma`.
`tsc -p tsconfig.app.json`, `vitest run` (67 archivos, 538 pruebas), ESLint de los archivos tocados sin errores y
`vite build` en verde.

Pendiente: E2E que abra cada visor desde menú/paleta (requiere build con su bandera) y revisión física por el responsable
antes de encender cada `VISOR_*`; uniones en T; laberinto/puerta y fotoneutrones en el campo; interfaz para `ejeGantry_deg`.

## Fase 6 — Consolidación de bundle y apertura de diálogos (hecha)

Entrada: Fase 5 al menos para los visores 3D.

Decisión del propietario (2026-11-08): **se conserva Babylon** (código de `MedicalFloorPlan3DDialog`
F455–F474, `src/lib/medical3D/babylon*` y `@babylonjs/*` en `package.json`); el plan original de eliminarlo
y quedarse sólo con r3f queda descartado. `VISORES_EN_REVISION`, `VISOR_*` y `HEATMAP_GPU` siguen en `false`.

Trabajo hecho:

- Chunk de entrada < 1500 kB sin quitar Babylon: `docx` y `jspdf` (reportes CNSNS/PDF) y `useMCBridge`
  se cargan con `import()` al generar; `UpdateAppDialog`, `SmartSearchDICOMDialog`, `LogFileAnalysisDialog`,
  `ContextualHelpPanel`, `RoomTemplatePanel` y `DxfImportReviewPanel` pasan a `lazy()`; el shader WebGPU
  (`useWebGPU`/`useWebGPUHeatmap`) sólo se monta con `HEATMAP_GPU` vía `WebGPUHeatmapBridge` (lazy).
- `manualChunks` en `vite.config.ts`: `vendor-three`, `vendor-r3f`, `gpu-heatmap` y `vendor-babylon`
  (este último sólo si `VITE_VISOR_3D_BABYLON=true`; apagado, Babylon es rama muerta y no se emite chunk vacío).
  Las dependencias compartidas con la entrada (react, react-dom, scheduler, zustand, sonner, ayudantes de
  Rollup) se fijan en `vendor-react`: sin eso Rollup las metía en `vendor-r3f`/`gpu-heatmap` y la entrada
  importaba esos chunks de forma estática (se descargaban al arrancar).
- 20 diálogos leían `s.dialogs.x?.open` sobre un booleano y nunca abrían; ahora usan `dialogoAbierto()`
  (`appStore.ts`), con prueba `src/__tests__/dialogs/dialogosAbren.test.tsx`.
- Revisión exhaustiva de diálogos: `docs/revision-dialogos.md` (tabla diálogo · función · estado · hallazgo ·
  propuesta · prioridad). Lo trivial se corrigió aquí; las calculadoras con física local quedan como propuesta.

Salida / pruebas: `vite build` sin advertencias de tamaño; tsc, vitest y eslint (sin errores nuevos en
archivos tocados) en verde.

Pendiente (Fase 7 propuesta): migrar `BarrierCalculatorDialog` y las calculadoras de prioridad alta de
`docs/revision-dialogos.md` a `normativeBarrierEngine`; E2E de Medical 3D con r3f y con Babylon activado.

## Fase 7 — Calculadoras de diálogo sobre los motores normativos (hecha)

Entrada: Fase 6 (diálogos que abren) y la revisión de `docs/revision-dialogos.md`.

Trabajo hecho:

- `src/lib/calculadorasNormativas.ts`, núcleo común de las calculadoras:
  - `barreraMV` (NCRP 151): primaria (Ec. 2.1), dispersión del paciente (Ec. 2.7) y fuga (Ec. 2.8) por separado,
    TVL₁/TVLₑ (Tablas B.2, B.5a, B.7), una o dos energías, regla de las dos fuentes por tipo (§1.4.3) y suma
    directa; se adopta el mayor y cumple sólo si T·K ≤ P.
  - Carga de haz (`kermaSinBlindajeHaz`, `espesorHaz`, `transmisionHaz`): NCRP 151 primaria o NCRP 147 con K¹
    (Tablas 4.5/4.7) y Archer (B.1/C.1); `blindajeMulticapa` (Π Bᵢ) y `compararMateriales` (frente de Pareto).
  - `blindajePET` (AAPM TG-108): Γ, absorción del paciente, decaimiento (Ec. 2–3 y 9–10) y Tabla V a 511 keV.
- Reescritos sobre ese núcleo: BarrierCalculator, ScenarioAnalysis, Sensitivity, ParetoOptimizer, MultiLayerShield,
  OnnxPredictor (ahora «Espesor PET TG-108»), MultiObjectiveOptimizer (materiales PET) y Geant4Mc (referencia
  analítica, sin Monte Carlo simulado). BatchCalculation usa `useShieldingEngine` sobre el plano real y DxfExport
  exporta el proyecto con `lib/dxfExport` (sin rotular JSON como DWG). Sin aviso de resultados sintéticos en ellos.

Salida / pruebas: `src/__tests__/validacion/calculadorasNormativas.test.ts` (NCRP 151 §7.1.1 149.6 cm, §7.1.5
66.4 cm; NCRP 147 §5.3.1.1 107 mm, §5.3.3.1 1.3 mm; TG-108 Ejemplos 1–2 y Tablas IV/V) y
`src/__tests__/dialogs/calculadorasFase7.test.tsx` (cada diálogo muestra lo que calcula el motor; DXF de la
Fase 4 calculado por lotes y exportado → reimportado sin cambios).

## Fase 8 — Resto de calculadoras (8a, 8b y MultiEnergySpectra hechas; 8c propuesta)

La revisión a fondo (`docs/revision-dialogos.md`, Fase 7) encontró 16 diálogos de prioridad alta fuera de las 9 ya
migradas y 65 de prioridad media. Orden propuesto:

1. **8a — errores de unidades y fórmulas que dan espesores no conservadores** (prioridad alta): patrón
   `B = P(mSv)·d²/W(Gy)` sin ×10⁻³ en VersaHD15MV, ElectronApplicator, EquipmentShieldingWizard, `lib/agents/tools`
   (ShieldingDesignAgent) y `lib/ml/trainingData` (MLPrediction); `useFloorCeilingCalc` (kerma 1000× bajo),
   `useNeutronCalc` (n TVL × HVL), CrossValidation, TornadoSensitivity (inversa de Archer), MultiEnergySpectra,
   NuclearDoseGrid y AAPMTG108PET. Todas pasan a `barreraMV`/`espesorRequeridoHaz`/`blindajePET` con prueba contra
   un ejemplo publicado.
2. **8b — información falsa o fija presentada como real** (alta): NCRPValidation (casos `calc: () => expected`;
   sustituir por la suite de la Fase 4), CNSNSAutoReport (resultados fijos), ComplianceCertification
   (certificaciones inexistentes) y RegulatoryAlerts (alertas inventadas).
3. **8c — prioridad media**: datos de demostración en auditoría/logs/tableros/comparadores, diálogos inaccesibles
   (MaterialLibrary, ReportManager, MCResults, ParametricBunker sin `onGenerate`), modelos propios sin validación
   (skyshine Ec. 5.1, albedo, oblicuidad §2.2, CBCT, IPEM 109, terapia, BIMRAD, optimizadores), textos normativos
   erróneos (EPA, transporte SSR-6, Gamma Knife, Manual §3.1) y unificación de límites de dosis en una tabla citada.

Hecho (8a + 8b): todos los de 8a, con prueba contra ejemplo publicado
(`src/__tests__/validacion/fase8.test.tsx`: NCRP 151 §7.1.1/§7.1.5 y Tablas B.2/B.9, NCRP 147 §5.3.3.1, TG-108
Ejemplo 2 y Tablas IV/V); 8b completo (`NCRPValidationSuite` con 17 casos publicados recalculados por el motor,
`lib/reporteCNSNSHtml`, sin certificaciones ni alertas inventadas). El «Failed to fetch» de DoseMapping3D era la fuente
de `<Text>` (troika) pedida a un CDN; se usa `<Html>`. Nota: `tsc -p .` no comprueba nada (tsconfig raíz con
`files: []`); la comprobación real es `tsc -p tsconfig.app.json` (`npm run check:app`).

MultiEnergySpectra (PR aparte): ya no usa un TVL «TASMIP» por kVp (sin fuente; 0.30 mm Pb a 120 kVp, un HVL) sino
`espesorRequeridoHaz` con la distribución de carga NCRP 147 (Archer B.1/C.1, que ya integra el espectro) y, para TC,
`blindajeTC` (§5.6.1, κ·DLP·1.4 y Figs. A.2/A.3). Prueba: §5.3.3.1 (1.3 mm Pb), §5.3.1.1 (107 mm de concreto) y §5.6.1
(K = 5.2 mGy/semana, 1.5 mm Pb). Con esto no queda ningún diálogo de prioridad alta.

Salida esperada de 8c: ningún diálogo con física local sin prueba contra NCRP 147/151 o TG-108; cada diálogo de
cálculo con una prueba de componente.

## Medidas de bundle

| | Chunk de entrada | JS total en `dist/assets` | Chunks Babylon |
|---|---|---|---|
| Antes (main `fab96e5`) | 3 987 kB | 18 MB | sí (core 4 874 kB, texture 1 014 kB, …) |
| Después de Fase 1 | 2 900 kB | 8.3 MB | no |
| Antes de Fase 6 (main `2dcc424`) | 2 914 kB | 8.1 MB | no |
| Después de Fase 6 (precarga: `vendor-react` 219 kB) | 1 395 kB | 8.1 MB | no (rama muerta tras `VISOR_3D_BABYLON`; `vendor-babylon` sólo si se activa) |
