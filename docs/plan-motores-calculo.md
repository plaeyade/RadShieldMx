# Plan de motores de cálculo — campo de dosis unificado

Estado: Fases 1 (PR #26) y 2 (PR #27) fusionadas; Fase 3 en revisión (rama `motor-dosis-fase3`). Herramienta de diseño preliminar; todo resultado
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

## Fase 5 — Reactivar visores uno por uno

Entrada: Fase 4 fusionada.

Trabajo, por visor (Heat Map Avanzado → Isodosis → Isosuperficie 3D → 3D Dose Mapping): conectarlo al
motor, añadir su prueba contra el motor y retirarlo de `IDS_VISORES_EN_REVISION` (o una bandera propia).

Salida / pruebas: prueba unitaria visor ↔ motor; E2E que abre el visor desde menú/paleta; revisión física.

## Fase 6 — Consolidación de bundle y 3D (sólo r3f)

Entrada: Fase 5 al menos para los visores 3D.

Trabajo: un único stack 3D (three / @react-three/*); eliminar el código Babylon (`MedicalFloorPlan3DDialog`
F455–F474, `src/lib/medical3D/babylon*`) y `@babylonjs/*` de `package.json`; portar o eliminar el shader
WebGPU (`HEATMAP_GPU`); `manualChunks` y más `lazy()` hasta que el chunk de entrada quede < 1500 kB.

Salida / pruebas: `vite build` sin advertencias de tamaño; E2E de Medical 3D en verde con r3f.

## Medidas de bundle

| | Chunk de entrada | JS total en `dist/assets` | Chunks Babylon |
|---|---|---|---|
| Antes (main `fab96e5`) | 3 987 kB | 18 MB | sí (core 4 874 kB, texture 1 014 kB, …) |
| Después de Fase 1 | 2 900 kB | 8.3 MB | no |
