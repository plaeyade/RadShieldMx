# Plan de motores de cálculo — campo de dosis unificado

Estado: Fase 1 en curso (rama `motor-dosis-fase1`). Herramienta de diseño preliminar; todo resultado
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

## Fase 1 — Motor de campo único y desactivación controlada (este PR)

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

## Fase 3 — Reconectar DoseMapDialog, SpatialDoseMap y modo dosis de Medical 3D

Entrada: Fase 2 fusionada.

Trabajo: `DoseMapDialog`, `SpatialDoseMapDialog` y el modo dosis de `MedicalFloorPlan3DDialog` consumen
`calcularMallaDosis`/`dosisEnPunto`; retirar `doseMapEngine`/`doseMappingEngine` de esos caminos (corrigiendo
o aislando Γ ×1000, TVL F-18, Σ_R y cm/m) y unificar unidades (mSv/semana, m).

Salida / pruebas: prueba por visor que compara su malla con el motor en ≥ 10 puntos (diferencia < 1 %);
prueba de unidades (m vs. px) con dos escalas.

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
