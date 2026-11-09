# Revisión de diálogos (Fase 6)

Fecha: 2026-11-08 · Rama `fase6` · Alcance: los 202 archivos de `src/sections/dialogs/` más `src/components/DialogShell.tsx`, `src/components/UnavailableFeatureDialog.tsx` y los paneles de `src/sections/` que se montan con `LazyDialog`.

## Método

1. **Barrido automático** de cada archivo (script de análisis estático, no versionado): mecanismo de apertura (`dialogs[nombre]` del store o props `open/onOpenChange`), si está montado y si algún menú/atajo llama `open('<nombre>')`, imports de motores (`doseFieldEngine`, `normativeBarrierEngine`, `shieldingMath`, `xcomAttenuation`, `ncrp151`, `ncrpOccupancy`), física local (`Math.exp(-…)`, `10^-…`, tablas TVL/HVL/μ), `Math.random()`, palabras de demostración (mock, demo, simulated…), textos en inglés en JSX y etiquetas, `DialogTitle`/`DialogDescription`, imports sin uso, `any` y referencias en pruebas (`src/**/*.test.*`, `e2e/`, `scripts/`).
2. **Revisión manual** de los 20 diálogos que nunca abrían (corregidos en esta fase), de las calculadoras de blindaje (BarrierCalculator, Maze, FloorCeiling, Neutron, VersaHD, Gamma Knife, Co-60, ScenarioAnalysis, BatchCalculation) y de todos los diálogos con `Math.random()`.
3. Lo trivial y seguro se corrigió en este PR (ver abajo); lo demás queda como propuesta. Las filas marcadas "Sin hallazgos automáticos; no revisado a fondo" no tienen errores detectables por el barrido, pero su física no se revisó línea por línea.

## Resumen

| | Cantidad |
|---|---|
| Diálogos revisados | 202 |
| Estado OK / riesgo / error | 95 / 90 / 17 |
| Prioridad alta / media / baja / sin acción | 9 / 28 / 94 / 71 |
| Usan algún motor común (doseFieldEngine, normativeBarrierEngine, xcom, ncrp151…) | 15 |
| Sin ninguna prueba que los mencione | 151 |
| Con ≥ 2 textos visibles en inglés | 73 |
| `DialogContent` sin `DialogDescription` ni `aria-describedby` | 157 |

### Los cinco hallazgos más graves

1. **`BarrierCalculatorDialog` (calculadora principal, destino de `shieldingCalculator` y `quickBarrier`)**: trata dispersión y fuga como haz primario, un solo TVL, P = 0.02 fijo, da por "cumple CNSNS" hasta 1.2·P y no usa `normativeBarrierEngine`.
2. **Tablas TVL locales erróneas** en `ParetoOptimizerDialog`, `MultiLayerShieldDialog` y `SensitivityAnalysisDialog`: a 150 kVp se usan HVL como TVL (≈ 3.3× menos espesor) y a 6 MV Pb 4.9 mm (NCRP 151, tabla B.2: 57 mm), W 2.1 mm y PE 45 mm (valores de fotones físicamente imposibles para esas densidades). Sensitivity además omite el rendimiento K¹.
3. **`BatchCalculationDialog`** muestra kerma `Math.random()` y el espesor actual como "requerido": parece un cálculo y no lo es.
4. **`DxfExportDialog`** exporta un plano de ejemplo fijo, no el proyecto (y "DWG" sale como JSON); ahora que el diálogo abre, el usuario podría entregar un DXF que no es su diseño.
5. **Optimizadores/predictores con W = actividad × 1000** (`OnnxPredictorDialog`, `MultiObjectiveOptimizerDialog`, `Geant4McDialog`) sin constante Γ ni rendimiento del equipo, y `ScenarioAnalysisDialog` con P = 0.1 mSv/sem rotulado como "público".

### Hallazgos transversales

- **Apertura (`?.open` sobre booleano)**: 20 diálogos leían `s.dialogs.x?.open ?? false`; `dialogs[x]` es booleano y el resultado siempre era `false`. Montados por `LazyDialog`, se cargaban y no se mostraban. *Corregido* con `dialogoAbierto()` en `appStore.ts` y prueba `src/__tests__/dialogs/dialogosAbren.test.tsx` (falla con el código anterior).
- **Inaccesibles**: `Parametric3DDialog`, `MaterialLibraryDialog`, `ReportManagerDialog` y `MCResultsDialog` están montados pero ningún menú ni atajo llama su `open()`. Otros 31 componentes sin `open()` del store se abren por props/estado local de `ShieldingDesigner` o de otro diálogo (no es error).
- **Motor común**: sólo 15 de 202 diálogos importan un motor compartido; el resto calcula con tablas propias o es informativo. Las calculadoras deberían converger en `normativeBarrierEngine` (barreras) y `doseFieldEngine` (campos).
- **Accesibilidad**: 157 `DialogContent` sin `DialogDescription` (Radix avisa en consola "Missing Description or aria-describedby"). Propuesta: añadir `DialogDescription` (o `aria-describedby={undefined}` explícito) en `components/ui/dialog.tsx`/`DialogShell`; no se cambió el componente base aquí porque afecta a todos los diálogos. Inputs con `<label>` sin `htmlFor` y botones de icono sin `aria-label` son frecuentes.
- **Idioma**: 73 diálogos con ≥ 2 textos visibles en inglés (títulos tipo "Batch Calculation Tool", "Export CSV", "Material"). Muchos textos en español carecen de acentos ("Configuracion", "atenuacion").
- **Pruebas**: 151 diálogos sin ninguna prueba. Prioridad: calculadoras (BarrierCalculator, Maze, FloorCeiling, Neutron) con casos de la suite NCRP 151 de la Fase 4.
- **Código muerto**: 47 diálogos con `import '@/components/ui/…'` de efecto lateral sin uso (restos de una limpieza de imports).

### Corregido en este PR (trivial y seguro)

| Diálogo | Cambio |
|---|---|
| 20 diálogos (AlaraWizard, DarkMode, DesignCompare, DoseSweep, DxfExport, Geant4Mc, Isosurface3D, MaterialComparison, MultiLayerShield, MultiObjectiveOptimizer, NeutronShielding, NistXcom, NuclideLibrary500, OnnxPredictor, Parametric3D, ParetoOptimizer, RevitAddin, SensitivityAnalysis, SourceLibrary, SpatialDoseMap) | Abren: `dialogoAbierto(s.dialogs.x)` en lugar de `s.dialogs.x?.open`; prueba de apertura/cierre por store. |
| BatchCalculation, Pareto, MultiLayerShield, Sensitivity, OnnxPredictor, MultiObjectiveOptimizer, NeutronShielding, DxfExport, DesignCompare, DoseSweep, SourceLibrary | `SyntheticResultBanner` con el motivo concreto (los diálogos ahora visibles no deben pasar por cálculo validado). |
| ParetoOptimizer | Se quitó la dosis `Math.random()` (no se mostraba). |
| NeutronShielding | Texto "energias 003E 10 MV" → "energías ≥ 10 MV". |
| CommandPalette | `DialogTitle` `sr-only` (Radix registraba un error en consola). |

## Otros diálogos del app

| Componente | Estado | Hallazgo | Propuesta | Prioridad |
|---|---|---|---|---|
| `components/DialogShell.tsx` | OK | Envoltorio con título y descripción; usado por UpdateAppDialog. | Usarlo como base para resolver la falta de `DialogDescription`. | baja |
| `components/UnavailableFeatureDialog.tsx` | OK | Con prueba. | — | — |
| `components/LazyDialog.tsx` | riesgo | Pasa `open`/`onOpenChange` a todos; los diálogos que leen el store deben usar `dialogoAbierto` (causa del error de apertura). | Documentar el contrato y migrar los diálogos a props. | media |
| `sections/RoomTemplatePanel`, `DxfImportReviewPanel`, `ContextualHelpPanel`, `CanvasLayersPanel` | OK | Ahora `lazy()` (Fase 6, chunk de entrada). | — | — |

## Tabla completa

Ordenada por prioridad. "*Corregido aquí*" indica lo resuelto en este PR.

| Diálogo | Función | Estado | Hallazgo | Propuesta | Prioridad |
|---|---|---|---|---|---|
| `BarrierCalculatorDialog` | Calculadora de Blindajes -- NCRP 151 / 147 | error | Calculadora principal (destino de `shieldingCalculator` y `quickBarrier`): trata dispersión y fuga como haz primario (sin fracción de fuga 10⁻³ ni fracción de dispersión a(θ)), un solo TVL (sin TVL₁/TVLₑ), P = 0.02 mSv/sem fijo para todo tipo de área, acepta como "cumple CNSNS" hasta 1.2·P y da espesor negativo si B > 1. No usa normativeBarrierEngine. (sin pruebas) | Reescribir el cálculo sobre `calcularBarreraNormativa`/`terminoNCRP147` y `ncrp151` (primaria, fuga y dispersión por separado, TVL₁/TVLₑ), P según área controlada/no controlada, criterio de cumplimiento ≤ P y espesor ≥ 0; añadir pruebas contra la suite NCRP 151. | alta |
| `BatchCalculationDialog` | Batch Calculation Tool seleccionadas | error | El "cálculo por lotes" asigna a cada barrera un kerma `Math.random()` y como espesor requerido el espesor actual; no calcula nada. *Corregido aquí:* aviso de resultados sintéticos. (sin pruebas) | Calcular cada barrera con `calcularBarreraNormativa` sobre el `floorPlan` del proyecto o retirar el diálogo del menú. | alta |
| `DxfExportDialog` | Exportar Plano DXF / DWG / SVG / JSON | error | Exporta un plano de ejemplo fijo (`mockFloorPlan`), no el proyecto; DWG cae en JSON y SVG es un dibujo fijo; los campos `points`/`position` no existen en el tipo `Barrier`/`RadiationSource` (x1..y2, x, y). *Corregido aquí:* aviso. | Leer `useCanvasStore().floorPlan` y exportar con el escritor DXF ya validado en la Fase 4 (escala m/px); quitar DWG. | alta |
| `MultiLayerShieldDialog` | Multi-Layer Shield B_total = B1 x B2 x ... x Bn | error | Misma tabla TVL errónea que Pareto (HVL como TVL a 150 kVp; Pb/W/PE a 6 MV ×10 por debajo), área fija de 10 m² en la masa, factores de buildup heurísticos sin referencia, equivalente Pb con TVL erróneo. ESLint: reasignación tras render. *Corregido aquí:* aviso. | Usar `capasDeBarrera`/transmisión por capas de doseFieldEngine (`CapaBlindaje`) y área como entrada; prueba con caso NCRP 151 de barrera laminada. | alta |
| `MultiObjectiveOptimizerDialog` | Multi-Objective Optimizer (v105) Costo+Peso+Espacio | error | W = actividad (GBq) × 1000 sin constante Γ; la "dosis" se calcula dividiendo entre exp(−μt) (aumenta con el espesor). Costos por material fijos en el código. *Corregido aquí:* aviso. | Calcular B con Γ (`nuclearMedicine`) o con NCRP 151 según la modalidad y transmisión con `calculateTransmission`; costos desde la biblioteca de materiales. | alta |
| `OnnxPredictorDialog` | ML Shielding Predictor (v101) ONNX Runtime | error | Se anuncia como "ONNX Runtime" pero es una regla TVL heurística (TVL 30–40 mm de concreto para 1–10 MeV, ~10× menor que NCRP 151) con confianza fija 0.92; W = GBq × 1000. *Corregido aquí:* aviso. | Retirar la etiqueta ML o cargar un modelo real; mientras tanto, delegar en normativeBarrierEngine. | alta |
| `ParetoOptimizerDialog` | NSGA-III Pareto Optimizer Multi-objective ranking | error | Tabla TVL local errónea: los valores "150 kVp" son HVL (Pb 0.29 mm, concreto 23 mm) y los de 6 MV para Pb (4.9 mm), W (2.1 mm) y PE (45 mm) están un orden de magnitud por debajo de NCRP 151; "NSGA-III" es una suma ponderada. *Corregido aquí:* se quitó la dosis `Math.random()` (no se mostraba) y se añadió aviso. | Obtener espesores de `normativeBarrierEngine`/`xcomAttenuation` y documentar el método real (ranking ponderado). | alta |
| `ScenarioAnalysisDialog` | Análisis de Escenarios — What-If | error | Usa P = 0.1 mSv/sem rotulado como "público" (0.1 es área controlada; público = 0.02) y TVL por densidad (37/27/20 cm). (sin pruebas) | P desde `NCRP_DESIGN_GOALS` según el área y TVL desde ncrp151. | alta |
| `SensitivityAnalysisDialog` | Sensitivity Analysis Tornado charts ±20% | error | B = P·d²/(W·U·T) sin rendimiento K¹ (mGy/(mA·min) a 1 m): dimensionalmente incorrecto; TVL fijo de concreto (23 mm = HVL a 150 kVp; 370 mm para todo > 150 kVp). *Corregido aquí:* aviso. | Derivar el tornado perturbando entradas de `terminoNCRP147` (diagnóstico) o `ncrp151` (MV) en lugar de una fórmula propia. | alta |
| `AAPMTG108PETDialog` | AAPM TG 108 — PET Shielding Calculator | riesgo | física local (μ/TVL/exp propios) sin motor común (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation | media |
| `Attila4MCVarianceReduction` | FW-CADIS Variance Reduction Attila4MC-inspired | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Material», «Neutron», «Particle Type» (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español | media |
| `BuildupFactorDialog` | Multi-Layer Buildup Factor Calculator MicroShield Pro | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Material», «Total»; import de efecto lateral sin uso (`import '@/components/ui/…'`) (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español; Quitar import | media |
| `ConcreteActivationDialog` | Concrete Activation by Neutrons B.13 | riesgo | física local (μ/TVL/exp propios) sin motor común (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation | media |
| `CrossValidationDialog` | NCRP 147 vs NCRP 151 Cross-Validation B.5 | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Export CSV», «Material» (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español | media |
| `CycloneKIUBEWizard` | Wizard Ciclotrón IBA KIUBE — RadSHIELD Mx | riesgo | física local (μ/TVL/exp propios) sin motor común; 5 usos de `any` (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Tipar | media |
| `DCHAINActivationCalculator` | DCHAIN-PHITS Activation Calculator | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Calculate Activation», «Target Material»; import de efecto lateral sin uso (`import '@/components/ui/…'`) (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español; Quitar import | media |
| `DesignCompareDialog` | Design Compare Before / After optimization | riesgo | Compara tres versiones fijas en el código, no versiones del proyecto. *Corregido aquí:* aviso. | Conectar con `VersionHistoryDialog`/escenarios guardados. | media |
| `ElectronApplicatorDialog` | Electron Applicator Shielding — NCRP 151 Appendix B v32 | riesgo | física local (μ/TVL/exp propios) sin motor común (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation | media |
| `ExposureRateProjectionDialog` | Exposure Rate vs Time Projection MicroShield Pro | riesgo | física local (μ/TVL/exp propios) sin motor común; import de efecto lateral sin uso (`import '@/components/ui/…'`) (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Quitar import | media |
| `Geant4McDialog` | Geant4 Monte Carlo (v103)Gold Standard | error | No ejecuta Geant4: fórmula analítica sin sentido dimensional (P·(P·d²/(W·0.25·0.2))/T), W = GBq × 1000; ya tiene aviso de resultado sintético. | Generar sólo la macro Geant4 (como MCDialog) o calcular la referencia con doseFieldEngine; renombrar. | media |
| `LaminatedBarrierCalculator` | Laminated Barrier Calculator McGinley Ch.6 | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Add Layer», «Barrier Layers», «Export CSV» (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español | media |
| `MCCloudDialog` | Monte Carlo Cloud — Resultados | riesgo | Progreso y resultados (dosis antes/después, discrepancia) con `Math.random()`; ya muestra aviso sintético. (sin pruebas) | Conectar a un backend MC real o retirar. | media |
| `MCResultsDialog` | Resultados Monte Carlo | error | Montado como `mcResults` pero nada lo abre; `lastMCResult` nunca se asigna (`setLastMCResult` sin uso). (sin pruebas) | Abrirlo al importar resultados MC o retirar. | media |
| `MaterialLibraryDialog` | Biblioteca de Materiales | error | Montado como `materialLibrary` pero nada llama `open('materialLibrary')`: inaccesible. (sin pruebas) | Enlazar desde la barra de herramientas (Materiales) o retirar. | media |
| `MaterialPropertyCalculator` | Material Property Calculator — Phy-X/PSD | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Add», «Calculate Properties», «Compound Name»; import de efecto lateral sin uso (`import '@/components/ui/…'`) (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español; Quitar import | media |
| `MedicalFloorPlan3DDialog` | Medical 3D Floor Plan Offline CAD/BIM Fase 42 | riesgo | 3 121 líneas; Babylon tras VISOR_3D_BABYLON=false (rama muerta, `vendor-babylon` sólo si se activa); botón "Export PNG Babylon". | Dividir el archivo y decidir el stack 3D definitivo. | media |
| `MonteCarloSimulationWizard` | Simulación Monte Carlo — RadSHIELD Mx | riesgo | Mapa de dosis gaussiano con ruido `Math.random()`; tiene aviso sintético. (sin pruebas) | Sustituir por `mallaDosis` de doseFieldEngine para el pre-cálculo. | media |
| `NeutronMazeDialog` | Neutron Maze Calculator B.3 | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Export CSV», «Neutron Maze Calculator», «Shielding Techniques for Radiation Oncology Facilities» (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español | media |
| `NeutronShieldingDialog` | Neutron Shielding (v109) NCRP 151 Table B.7 | error | Multiplica un "rendimiento" en Gy/h a 1 m por una carga en Gy/sem; TVL de neutrones fijos (concreto 45 cm) sin la fórmula NCRP 151 §2.4/B.7; si no "pasa" no muestra nada. *Corregido aquí:* texto "003E" → "≥" y aviso. | Reutilizar `useNeutronCalc`/`ncrp151Laberinto` (ya usados por NeutronDialog y el laberinto) y mostrar siempre el resultado. | media |
| `NuclearDoseGrid` | Nuclear Medicine Dose Grid Calculator pyshield-inspired | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Dose Grid Map», «Export CSV», «Grid Configuration» (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español | media |
| `Parametric3DDialog` | 3D Parametric Primitives Box / Cylinder / Sphere | error | Sin acceso desde ningún menú (sólo `<LazyDialog name="parametric3d">`); ESLint `no-unused-expressions` (l. 50, 67); posición aleatoria al añadir primitiva (aceptable). | Añadir entrada de menú o retirar; corregir las expresiones sueltas. | media |
| `PythonIntegrationDialog` | Python Integration — Pyodide (WebAssembly) Run Python in Browser | riesgo | física local (μ/TVL/exp propios) sin motor común; textos en inglés: «Copy», «Current Implementation», «Load Python» (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation; Traducir al español | media |
| `ReportManagerDialog` | Administrador de Reportes en nube | error | Montado como `reportManager` pero nada lo abre: inaccesible. (sin pruebas) | Enlazar desde el menú Reportes o retirar. | media |
| `ShapesReconstructionDialog` | Shapes Reconstruction — DICOM RTSTRUCT / Point Cloud v33 | riesgo | 1 uso(s) de `Math.random()` en datos mostrados; textos en inglés: «Export», «Export Formats», «Point cloud data» (sin pruebas) | Sustituir por cálculo real o marcar con SyntheticResultBanner; Traducir al español | media |
| `ShieldingOptimizerDialog` | Shielding Optimizer — Algoritmo Genetico (NSGA-II) v32 | riesgo | física local (μ/TVL/exp propios) sin motor común (sin pruebas) | Delegar en normativeBarrierEngine/doseFieldEngine o xcomAttenuation | media |
| `SourceLibraryDialog` | Source Library 7 geometries / 14 radionuclides | error | Tasa "DR @ 1 m" = A·Γ·1000 ignora la geometría elegida y la distancia; constantes Γ sin unidades (Co-60 1.11, Ra-226 0.825) y unidad mR/h no usada en el resto del app. *Corregido aquí:* aviso. | Tomar Γ de `nuclearMedicine`/biblioteca de nucleidos (mSv·m²/(GBq·h)) e integrar las geometrías (línea, disco) como en GeometrySelectorDialog. | media |
| `VersaHD15MVDialog` | Elekta Versa HD 15 MV - Bunker Acelerador Lineal | riesgo | Cálculo local TVL 44 cm (15 MV) coherente con NCRP 151, pero fuera del motor normativo. (sin pruebas) | Delegar en ncrp151. | media |
| `AIAssistantDialog` | Asistente de IA RadShield | riesgo | contiene datos de demostración (simulated) | Verificar que no se presenten como resultado | baja |
| `AdaptiveSamplingDialog` | Adaptive Sampling Configuration B.1 | riesgo | textos en inglés: «Export Sampling Points CSV», «Total puntos de muestreo» | Traducir al español | baja |
| `AirKermaOverlay` | Air Kerma Distribution Overlay | riesgo | textos en inglés: «Export PDF», «Material», «Show Shielded» | Traducir al español | baja |
| `AlaraWizardDialog` | ALARA Cost-Benefit Wizard As Low As Reasonably Achievable | riesgo | Cambios de costo/espacio/peso fijos por sustitución; `costDelta` se calcula y nunca se muestra; título en inglés; cita "Mosaics Atomics Material Advisor" (producto de terceros). | Calcular espesores equivalentes con xcomAttenuation y mostrar costo real; retirar la cita comercial. | baja |
| `AnalyticsDialog` | Analytics Dashboard LOCAL | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `AnimatedDoseMapsDialog` | Animated Dose Maps | riesgo | textos en inglés: «Animated Dose Maps», «High», «Low»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `AnnualDoseReport` | Annual Dose Accumulation Report B.4 | riesgo | textos en inglés: «Annual Dose Accumulation Report», «Export CSV» | Traducir al español | baja |
| `AnomalyDetectionDialog` | Anomaly Detection | riesgo | textos en inglés: «Extreme Distance», «Extreme Energy», «Extreme Thickness» | Traducir al español | baja |
| `AuditDashboardDialog` | Audit Dashboard — Timeline de Cambios eventos | riesgo | textos en inglés: «Export», «Import» | Traducir al español | baja |
| `AuditLogDialog` | Audit Log — Regulatory Inspection E.9 | riesgo | contiene datos de demostración (simulated); textos en inglés: «Export CSV», «Export PDF» | Verificar que no se presenten como resultado; Traducir al español | baja |
| `AutoFillEquipmentDialog` | Auto-fill from Equipment Database | riesgo | textos en inglés: «Apply to Shielding Calculator», «Leakage», «Workload»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `BIMConnectorDialog` | BIM Connector — Building Information Modeling | riesgo | textos en inglés: «Import», «Project Name», «Run shielding calculations with extracted wall dimensions»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `BIMRADDialog` | BIMRAD — BIM-based Radiation Modeling BIMRAD / NET 2025 | riesgo | textos en inglés: «Avg Dose», «Export Report», «Max Dose»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `BarrierEditor` | Barrier Assumptions & Materials Editor | riesgo | textos en inglés: «Barrier Assumptions», «Barrier Name», «Barrier Type» | Traducir al español | baja |
| `BatemanDecayDialog` | Bateman Decay Solver v26 ICRP 107 | riesgo | textos en inglés: «Search Nuclides», «Select a nuclide and click Solve to see the decay chain»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `BraquiterapiaCo60Dialog` | Braquiterapia HDR Co-60 — Datos Tecnicos y de Blindaje CNSNS A00.200/2 | riesgo | Mismos HVL/TVL Co-60 fijos que Gamma Knife; P = 0.1 (POE) correcto. | Tomar valores de ncrp151. | baja |
| `CADAssemblyMapper` | CAD Assembly Material Mapper Attila4MC-style | riesgo | contiene datos de demostración (demo); textos en inglés: «Export MCNP», «Export Summary», «Import»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Verificar que no se presenten como resultado; Traducir al español; Quitar import | baja |
| `CADImportDialog` | Importar Geometrias CAD 6 formatos | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `CADToMCImport` | CAD-to-MC Geometry Import | riesgo | textos en inglés: «Download», «Import CAD File», «Import a CAD file and select MC code»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `CBCTIGRTDialog` | Blindaje CBCT / IGRT | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `CNSNSAutoReportDialog` | Generador de Reporte CNSNS Automatico PDF Profesional | riesgo | textos en inglés: «Material», «Material de blindaje» | Traducir al español | baja |
| `CNSNSDashboardDialog` | Dashboard CNSNS — Cumplimiento Normativo | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `CNSNSDigitalSubmission` | CNSNS Digital Submission | riesgo | textos en inglés: «Close», «Export XML» | Traducir al español | baja |
| `CategoryToolsDialog` | Herramientas por categoría (CBCT, FDG, MCNP ciclotrón…) | riesgo | textos en inglés: «CBCT Shielding», «FDG Production Shielding», «MCNP Cyclotron Input»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `ChiltonSkyshineDialog` | Chilton Skyshine Calculator | OK | Usa `lib/skyshine/ChiltonSkyshine`. | Prueba de componente. | baja |
| `CloudSyncDialog` | Cloud Sync & Backup | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`); 4 usos de `any` | Quitar import; Tipar | baja |
| `CompareModeDialog` | Compare Mode — Escenarios Lado a Lado | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `ComplianceCertificationDialog` | Compliance & Certification Eje 3.3 % Overall | riesgo | textos en inglés: «Export», «Overall Compliance», «Total Items»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `ControlPointsDialog` | Control Points & Design Goals | riesgo | textos en inglés: «Add», «Add Control Point», «Cancel» | Traducir al español | baja |
| `CostEstimatorDialog` | Estimador de Costos -- CAPEX / OPEX | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `CostOptimizerDialog` | Optimizador de Costos | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `DICOMRTIntegrationDialog` | DICOM RT Integration | riesgo | textos en inglés: «Apply T factor», «Calculate shielding», «Distance ref»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `DICOMRTSTRUCTDialog` | DICOM RTSTRUCT Import | riesgo | textos en inglés: «Export to Shielding», «Import a DICOM RTSTRUCT file to view contours», «Volume» | Traducir al español | baja |
| `DVHAnalyzer` | DVH Analyzer matRad-inspired | riesgo | DVH con ruido aleatorio; aviso sintético presente. | Importar RTDOSE/RTSTRUCT reales. | baja |
| `DXFViewerDialog` | Visor DXF — Importar plano de blindaje | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `DarkModeDialog` | Apariencia Tema y colores | riesgo | Aplica tema/acento por `localStorage`; nunca abría (*corregido aquí*); duplica el conmutador de tema de la barra. | Unificar con `toggleDarkMode` del store. | baja |
| `DecayHeatCalculator` | Decay Heat Calculator — MicroShield Pro Calor de decaimiento | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `DoseMapping3D` | 3D Dose Mapping — Virtual Detector Mesh Three.js | riesgo | Visor en revisión (three/r3f, chunk `vendor-r3f` diferido); textos "Avg/Max Dose" en inglés. | Traducir y activar tras validación. | baja |
| `DoseSweepDialog` | Animated Dose Sweep 360deg rotation visualization | riesgo | Animación con isodosis decorativas (círculos de radio fijo); texto "deg"/"SOURCE". *Corregido aquí:* aviso. | Dibujar la isodosis con `mallaDosis` del motor para cada ángulo de gantry o marcarla como ilustrativa. | baja |
| `ElectronTransportDialog` | Electron & Positron Transport Engine | riesgo | textos en inglés: «Energy Sweep», «Export CSV», «Material» | Traducir al español | baja |
| `EmergencyProceduresDialog` | Procedimientos de emergencia | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`); 6 usos de `any` | Quitar import; Tipar | baja |
| `EquipmentManagerDialog` | Equipment Manager — Commercial Radiotherapy Database v33 models | riesgo | textos en inglés: «Category», «Energy», «Export JSON»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `EquipmentShieldingWizard` | Wizard de Blindaje por Equipo — RadSHIELD Mx | riesgo | textos en inglés: «Material», «Material de blindaje»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `ExampleWizardDialog` | Wizard de Ejemplos — Paso a Paso | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `ExperimentalValidationDialog` | Experimental Data Cross-Validation | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `ExternalConnectorDialog` | External Software Connector | riesgo | textos en inglés: «Connection Type», «Export», «Status»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `FLUKAInputGenerator` | FLUKA.CERN Input Generator fluka.cern | riesgo | textos en inglés: «Beam Energy», «Copy», «Energy Cutoff» | Traducir al español | baja |
| `FloorCeilingDialog` | Fase 9 — Blindaje Suelo y Techo (NCRP 151 §5.2.3) | OK | Usa `useFloorCeilingCalc` (NCRP 151 §5.2.3). | Prueba de componente. | baja |
| `GATESimulationDialog` | GATE Simulation — PET / SPECT OpenGATE v9.4+ | riesgo | textos en inglés: «Add noise», «Command to Run», «Copy» | Traducir al español | baja |
| `GammaIndexAnalyzer` | Gamma Index Analyzer TopasGraphSim-inspired | riesgo | Distribuciones de referencia/evaluada con ruido aleatorio; aviso sintético presente. | Permitir importar dos distribuciones reales. | baja |
| `GammaKnifeDialog` | Gamma Knife — Datos Tecnicos y de Blindaje Elekta Esprit / Perfexion | riesgo | HVL/TVL Co-60 en texto fijo (Pb TVL 4.0 cm, concreto 20.6 cm vs 21.8 cm NCRP 151). | Tomar valores de ncrp151. | baja |
| `GeometrySelectorDialog` | Geometry Selector — 16 Geometrias (tipo MicroShield) MicroShield v13 | riesgo | textos en inglés: «Disk Source», «Line Source», «Point Source»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `HeatMapViewer` | Heat Map Avanzado — kerma semanal del plano Motor de campo | riesgo | Visor en revisión (VISOR_HEATMAP=false); conectado al motor en Fase 5. | Activar tras validación visual. | baja |
| `IndustrialRadiationDialog` | Industrial Radiation Protection NCRP 144 / IAEA RS-G-1.3 | riesgo | textos en inglés: «Energy», «Transport containers meet Type A or Type B specifications»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `InternationalRegulationsDialog` | International Regulations Database Eje 3.1 | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `IsodosisViewer` | Curvas Isodosis — kerma semanal del plano Motor de campo | riesgo | Visor en revisión (VISOR_ISODOSIS=false); conectado al motor. | Activar tras validación visual. | baja |
| `JENDL5DataViewer` | JENDL-5 Nuclear Data Viewer | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `KeyboardConfigDialog` | Configuracion de Atajos de Teclado | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `MCConfigDialog` | Configurar Simulación Monte Carlo | OK | 5 usos de `any` | Tipar | baja |
| `MCNPCyclotronDialog` | MCNP ciclotrón y blindaje de neutrones | riesgo | textos en inglés: «Material», «Materials», «Neutron Shielding Materials» | Traducir al español | baja |
| `MCNPGUIDeckGenerator` | MCNP Input Deck Generator Attila4MC-inspired GUI | riesgo | textos en inglés: «Copy», «Source» | Traducir al español | baja |
| `MLPredictionDialog` | ML Shielding Predictor | riesgo | textos en inglés: «Material», «Predicted Thickness» | Traducir al español | baja |
| `ManualDialog` | Manual de Usuario | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `MaterialComparisonDialog` | Material Comparison (v106) 7 Materiales | OK | Usa xcomAttenuation y la matriz F123; nunca abría. *Corregido aquí.* | Pruebas de valores. | baja |
| `MazeCalculatorDialog` | Laberinto y puerta — NCRP 151 §2.4 | OK | Usa `ncrp151`/`ncrp151Laberinto`. | Prueba de componente. | baja |
| `MemoriaAIWizard` | Asistente AI — Memoria Analitica de Blindaje v30 AI | OK | import de efecto lateral sin uso (`import '@/components/ui/…'`) | Quitar import | baja |
| `MemoriaAnaliticaWizard` | Memoria Analitica de Blindaje | OK | 21 usos de `any` | Tipar | baja |
| `ModelingToolboxDialog` | Modeling Toolbox v26 | riesgo | textos en inglés: «Activity», «Barrier Transmission», «Distance»; import de efecto lateral sin uso (`import '@/components/ui/…'`) | Traducir al español; Quitar import | baja |
| `MonteCarloEngine` | Monte Carlo Dose Engine OpenXRayMC-inspired | riesgo | Progreso simulado con `Math.random()`; física local (μ propias); aviso sintético presente; sin acceso desde menús. | Unificar con NativeMCDialog o retirar. | baja |
| `MonteCarloIntegrationDialog` | Monte Carlo Integration | riesgo | textos en inglés: «Copy», «Download», «Generate Macro» | Traducir al español | baja |
| `MultiSourceDetectorDialog` | Multi-Source & Multi-Detector MC pyg4ometry-inspired src / det | riesgo | textos en inglés: «Absorbed Dose», «Add», «Copy»; 4 usos de `any` | Traducir al español; Tipar | baja |
| `NISTLibraryDialog` | NIST Material Library + JEFF Isotopes v26 materials | riesgo | textos en inglés: «Cost», «Select a material to view details» | Traducir al español | baja |
| `NativeMCDialog` | Native Monte Carlo Engine v25 Photon Transport | riesgo | contiene datos de demostración (demo); textos en inglés: «Detector Results», «Export JSON», «Photon Transport» | Verificar que no se presenten como resultado; Traducir al español | baja |
| `NeutronRemovalDialog` | Fast Neutron Removal Cross Section (Σᵣ) Calculator | riesgo | textos en inglés: «Calculate», «Export», «Fast Neutron Removal Cross Section» | Traducir al español | baja |
| `NistXcomDialog` | NIST XCOM — Coeficientes de Atenuacion (v100) NIST Standard Reference  | riesgo | Usa xcomAttenuation; nunca abría (*corregido aquí*); 3 advertencias `exhaustive-deps` (falta `mat`). | Añadir `mat` a las dependencias. | baja |
| `NuclearMedicineAdvanced` | Advanced Nuclear Medicine Shielding Module | riesgo | textos en inglés: «Advanced Nuclear Medicine Shielding Module», «Export Report», «Select Radionuclide» | Traducir al español | baja |
| `NuclideLibrary500Dialog` | Extended Radionuclide Library nuclidos | riesgo | Se anuncia "500+" pero contiene ~40 nucleidos; columna "gamma" mezcla energía de fotón con aniquilación; nunca abría (*corregido aquí*). | Cargar la biblioteca ICRP 107 existente (`NuclideDataViewer`) o renombrar. | baja |
| `PACSIntegrationDialog` | PACS Integration — SmartSearch DICOM Real v1.1 | riesgo | contiene datos de demostración (simulated); textos en inglés: «Default Port», «Import to Project», «Patient Name» | Verificar que no se presenten como resultado; Traducir al español | baja |
| `PACSRealDialog` | PACS Real Integration — Orthanc + DICOMweb v32 | riesgo | contiene datos de demostración (demo, mock) | Verificar que no se presenten como resultado | baja |
| `PENELOPEInputGenerator` | PENELOPE2023 Input Generator NEA-1525 | riesgo | textos en inglés: «CBCT Dose Characterization», «Copy», «Generated Input» | Traducir al español | baja |
| `PHITSInputGenerator` | PHITS Input Generator v3.36 | riesgo | textos en inglés: «Beam Parameters», «Generate PHITS Input», «Options» | Traducir al español | baja |
| `PerformanceDashboardDialog` | Performance Dashboard | riesgo | Memoria y tiempos de cálculo (NCRP, skyshine, CT) con `Math.random()`; chunk de 469 kB. | Medir con `performance.now()`/`performance.memory` o retirar. | baja |
| `PredictiveMaterialDialog` | Predictive Material Optimization | riesgo | textos en inglés: «Optimize Material», «Predictive Material Optimization» | Traducir al español | baja |
| `RealTime3DDialog` | Real-Time 3D Design Exploration | riesgo | textos en inglés: «Enscape Asset Library», «Export», «Reset»; 7 usos de `any` | Traducir al español; Tipar | baja |
| `RegulatoryAlertsDialog` | Alertas de actualización regulatoria | riesgo | textos en inglés: «Total», «Warning» | Traducir al español | baja |
| `STEPImporterDialog` | STEP / IGES Native Importer | riesgo | textos en inglés: «Error», «Export JSON» | Traducir al español | baja |
| `SecondaryBarrierAlbedoDialog` | Secondary Barrier Albedo Method B.12 | riesgo | textos en inglés: «Export CSV», «Material», «Secondary Barrier Albedo Method» | Traducir al español | baja |
| `ShieldingDesignAgentDialog` | Shielding Design Agent Fase 3 | riesgo | textos en inglés: «Barrier Design», «Neutron Shielding Required», «Shielding Design Agent» | Traducir al español | baja |
| `SpecialCasesDialog` | Casos Especiales y Verificación del Sistema | riesgo | contiene datos de demostración (demo) | Verificar que no se presenten como resultado | baja |
| `TherapyShieldingDialog` | Therapy Radionuclide Shielding | OK | Usa `lib/therapy`; título en inglés. | Traducir título. | baja |
| `UpdateAppDialog` | Centro de Actualizaciones | riesgo | 1 347 líneas y ~50 módulos f*; estaba en el chunk de entrada (230 kB). *Corregido aquí:* `lazy()`. | Reducir contratos de evidencia embebidos. | baja |
| `VersionHistoryDialog` | Version History | riesgo | textos en inglés: «MC Simulation», «Material Update», «Version History» | Traducir al español | baja |
| `VideoTutorialGenerator` | Video Tutorial Generator | riesgo | textos en inglés: «GUM Uncertainty Propagation», «How to Calculate a Primary Barrier», «Scatter Barrier Calculation» | Traducir al español | baja |
| `VoxelPhantomDialog` | Voxel Phantom Library — ICRP 110/143/144/145 v33 | riesgo | textos en inglés: «Export CSV», «Export Organ CSV» | Traducir al español | baja |
| `AboutDialog` | Acerca de RadShield-MX | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `AuditTrailDialog` | Audit Trail — Trazabilidad CNSNS | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `AutoBarrierDetectionDialog` | Auto-Barrier Detection CV v3 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `BatchImportDialog` | Importar batch CSV/Excel | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `BatchReportExporterDialog` | Batch Report Exporter (v107) JSON/CSV | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `BibliographyDialog` | Bibliografía Validada | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `CADGeometryConverterDialog` | CATIA-GDML & CAD-to-ROOT Geometry Converter | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `CNSNSChecklistDialog` | Checklist CNSNS -- Dictamen Tecnico | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `CNSNSDialog` | Generar Memoria Analitica CNSNS | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `CertificationModeDialog` | Modo Certificación CNSNS E.7 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ChecklistCNSNSDialog` | Checklist Pre-CNSNS | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `CollaborationHub` | Real-time Collaboration Hub | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `CommandPalette` | Paleta de comandos (Ctrl+K) | error | `DialogContent` sin `DialogTitle`: Radix registra un error en consola y el lector de pantalla no anuncia el diálogo. *Corregido aquí* (título `sr-only`). | — | — |
| `CommunityTemplatesDialog` | Community Bunker Templates E.8 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `CompareScenariosDialog` | Comparacion de Escenarios | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `DICOMDialog` | Importar DICOM / PACS | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `DashboardCalcDialog` | Dashboard Ejecutivo -- Sistema de Blindajes | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `DashboardDialog` | Dashboard Ejecutivo | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `DecayChainsDialog` | Decay Chain Calculator | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `DoseMapDialog` | Dose Map Visualization HEATMAP 2D/3D | OK | Usa doseFieldEngine (Fase 3) y metas NCRP; con pruebas. | — | — |
| `EPAGuidanceDialog` | EPA FGR 14 — Guia Federal Proteccion Radiologica (2014) Reemplaza FGR  | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `EquipmentDBDialog` | Base de datos de equipos | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `EquipmentLibraryDialog` | Biblioteca de Equipos Medicos — RadShield-MX | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `EvidencePackDialog` | Evidence Pack | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ExportDialog` | Exportar Resultados | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `FloorPlanFeaturesPanel` | Floor Plan Tools 5 features | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `GMPCyclotronCertificationDialog` | Certificación GMP de ciclotrón | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `GlossaryDialog` | Glosario de Terminologia | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ICRU57Dialog` | ICRU Report 57 (1998) - Coeficientes de Conversion para Proteccion Rad | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ICRU96Dialog` | ICRU Report 96 (2021) - Dosimetry-Guided Radiopharmaceutical Therapy | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `IPEMReport109Dialog` | IPEM Report 109 — SPECT Shielding | OK | Usa `lib/spect/IPEMReport109`. | — | — |
| `Isosurface3DDialog` | Isosuperficie 3D — kerma semanal del plano Motor de campo | OK | Usa `malla3DPlano` (motor de campo); nunca abría. *Corregido aquí.* | — | — |
| `KeyboardShortcutsDialog` | Atajos de Teclado Personalizables | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `LayoutBunkerDialog` | Layouts de Bunkers | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `LogFileAnalysisDialog` | Log File Analysis — Planificado vs Entregado | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `MCDialog` | Exportar Macro Monte Carlo GEANT4/GATE | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `MaintenanceLogDialog` | Registro de Mantenimiento | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `MultiEnergySpectraDialog` | Multi-Energy Spectra (TASMIP) B.8 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `NCRP151TablesDialog` | Tablas NCRP 151 - Referencia Rapida | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `NCRPValidationDialog` | NCRP Validation Suite | OK | Ejecuta la suite NCRPValidationSuite. | — | — |
| `NeutronDialog` | Blindaje de neutrones (>10 MV) | OK | Usa `useNeutronCalc`. | — | — |
| `NuclideDataViewer` | Nuclide Data Viewer — ICRP 38 & 107 nuclidos | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ObliqueIncidenceDialog` | Oblique Incidence Correction B.7 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ParametricBunkerDesigner` | Parametric Bunker Designer 6 templates | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `PdfReportDialog` | PDF Report Generator CNSNS LA-007/01 / IAEA SSG-46 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `PerformanceRecommendations` | Recomendaciones de Rendimiento y Optimización v42 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `PlanValidatorDialog` | Validador de Planos — RadSHIELD Mx | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `PointCloudImportDialog` | Point Cloud Import (LiDAR) | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ProjectManagerDialog` | Administrador de proyectos | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `RadioactiveTransportDialog` | Transporte de Material Radiactivo IAEA SSR-6 Rev.1 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ReferenceLibraryDialog` | Biblioteca de referencias | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `RegulatoryComparisonDialog` | Regulatory Comparison Tool Eje 3.2 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `RegulatoryReportDialog` | Regulatory Report (v110) NOM-008/040 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `RevitAddinDialog` | Revit Add-in C# (v104) BIM Bidireccional | OK | Plantillas C#/XML estáticas para copiar; nunca abría (*corregido aquí*). | — | — |
| `RevitIfcImportDialog` | Revit IFC Import (v102) BIM Integration | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `SelectorComponentesDosis` | Selector de componentes del campo (doseFieldEngine) | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `SelfShieldingDialog` | Patient Self-Shielding Factors B.9 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `ShieldingVerification` | Verificación de blindaje | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `SketchPadDialog` | Croquis / Sketch Pad — Plano de Bunker Template incluido | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `SmartSearchDICOMDialog` | Búsqueda inteligente DICOM | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `SpatialDoseMapDialog` | Spatial Dose Map 2D (v108) Heatmap | OK | Usa doseFieldEngine (`mallaDosis`) y metas NCRP; nunca abría (lectura `?.open`). *Corregido aquí.* | — | — |
| `SplashScreen` | RadShield-MX | OK | Pantalla de inicio; textos institucionales en inglés (nombres propios). | — | — |
| `StGermainScatterDialog` | St-Germain Scatter Method 3.12 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `TechSpecsDialog` | Especificaciones Tecnicas | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `TornadoSensitivityDialog` | Tornado Sensitivity Analysis | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `TransmissionCurveDialog` | Transmission Curve Import (HVL/TVL Certificates) B.6 | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `TutorialDialog` | Tutorial guiado | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `UncertaintyQuantificationDialog` | Uncertainty Quantification — GUM (JCGM 100:2008) | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `UndoRedoHistoryPanel` | Historial de acciones | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `VentilationDialog` | Ventilación del búnker | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
| `Viewer3DDialog` | Visualizador 3D — Geometria GEANT4 Exportar .mac | OK | Sin hallazgos automáticos; no revisado a fondo | — | — |
