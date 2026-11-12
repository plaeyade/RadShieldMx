# Plan de las Fases 11 y 12

Fecha: 2026-11-10 · Rama `fase10-inicio` · Propuesta para revisión del responsable. Herramienta de diseño
preliminar: todo resultado requiere revisión de un experto calificado / OSR antes de uso clínico o regulatorio.

## Fase 11 — Auditoría de los motores de cálculo

**Objetivo.** Que cada número que la app muestre como espesor, kerma o transmisión salga de un motor con
prueba contra una referencia publicada, y que no queden caminos de cálculo paralelos sin validar.

### Hallazgo previo (Fase 10)

Hay **dos botones «Calcular» con motores distintos**:

| Entrada | Función | Motor | Estado |
|---|---|---|---|
| Barra superior → Blindaje → «Calcular Blindaje», asistente «Guíame» | `runCalculations` | `useShieldingEngine.calculateAllBarriers` → `doseFieldEngine` + `normativeBarrierEngine` (NCRP 147/151, TG-108) | validado (Fases 1–9) |
| Barra lateral «Calc», tecla F5, botones «Calcular» del lienzo | `runRadShieldCalculations` | `AsyncShieldingEngine` (Web Worker) | **no validado**: serializa sólo posición, carga y factor de uso; ignora modalidad, energía, TG-108 y material por energía |

Prioridad 1 de la fase: que todos los accesos usen el motor validado (o que el worker ejecute exactamente
`calculateAllBarriers`) y una prueba que compare ambos caminos barrera por barrera.

**Estado (Fase 11, etapa 1, rama `fase11-motor-unico`): resuelto.** Todas las rutas (barra superior, «Guíame»,
paleta de comandos, barra lateral «Calc», F5, botones del lienzo, cálculo preliminar del DXF confirmado y cálculo por
lotes) llaman a `src/lib/motorProyecto.ts` (`calcularProyecto` / `calcularProyectoAsync` /
`calcularBarrerasValidadas`), que es el cuerpo que antes tenía `useShieldingEngine().calculateAllBarriers`. La
asincronía del worker (no bloquear la interfaz, progreso) la da `calcularProyectoAsync`, que cede el hilo entre
barreras y ejecuta la misma función por barrera. Se retiraron `AsyncShieldingEngine`, `ShieldingEngine`
(`lib/shieldingEngine.ts`), `workers/shieldingWorker.ts` + `useWebWorker` (worker creado al montar y nunca usado) y la
caché de resultados en IndexedDB del camino lateral (guardaba los resultados del motor retirado y no los espesores del
plano). El estado de cumplimiento es en todas las rutas el de `verificarBarrera` (instalado ≥ requerido, sólo con
traza del motor); el aviso de la barra superior que comparaba kerma sin blindaje con P ya no se usa.

Otros defectos encontrados en el camino:

- **F5 ejecutaba el cálculo del primer render** (oyente de teclado con dependencias `[]`: plano vacío → «Agregue al
  menos una fuente»); Ctrl+Z/Ctrl+Y/Ctrl+S usaban también funciones obsoletas. Ahora el oyente llama al manejador del
  último render.
- La tabla «Resultados — Máximos por barrera» del lienzo, el PDF, el reporte CNSNS y el paquete de evidencia leían
  `thicknessLead_mm`/`maxBarrierThickness_mm`, que el motor retirado no producía (mostraba «N/A» o el plomo de un TVL
  fijo de 16.6 mm). Ahora salen de la barrera calculada (`resultadoDeBarrera`).

Pruebas: `src/__tests__/auditoria/motorUnico.test.ts` (NCRP 147 §5.1 y §5.2, NCRP 151 §7.1.1 y §7.1.5, TG-108 F-18 del
ejemplo guiado, Tc-99m e I-131: mismas cifras y estados en las rutas y, en NCRP 147/151, igualdad exacta con
`calcularBarreraNormativa` sobre los mismos puntos) y `e2e/fase11-motor-unico.spec.ts` (barra superior, barra lateral,
F5 y botón del lienzo sobre el proyecto PET/CT, con una barrera corta y el resto sobradas).

### Inventario de cálculos paralelos (grep de `Math.pow(10`, `10 **`, `Math.exp(`, `Math.log10(` y tablas TVL/HVL fuera del motor)

Motor validado (referencia): `shieldingMath`, `normativeBarrierEngine`, `doseFieldEngine`, `ncrp147`, `ncrp151`,
`ncrp151Laberinto`, `tg108`, `mallaNuclear`, `calculadorasNormativas`, `motorProyecto`. `verificacionBlindaje` sólo
estima la dosis tras el margen (P·10^(−margen/TVL)); `types/ctIsodosis` interpola el perfil de TC que consume el motor.

| Archivo | Qué calcula | Dónde se ve | Estado |
|---|---|---|---|
| `lib/engine/AsyncShieldingEngine.ts` | Espesor con TVL fijo de Pb 16.6 mm | Barra lateral, F5, lienzo, DXF | **Retirado** (Fase 11) |
| `lib/shieldingEngine.ts` (`ShieldingEngine`) | Igual, en el hilo principal | Nadie (importación sin uso) | **Retirado** |
| `workers/shieldingWorker.ts`, `hooks/useWebWorker.ts` | Archer/TVL propios en un worker | Nadie (worker creado al montar) | **Retirado** |
| `hooks/useSmartBarrier.ts` | TVL fijos; «primaria» si d < 6 m | Aviso flotante del diseñador (nunca se invocaba) | **Retirado del diseñador**; el gancho queda sólo con sus pruebas |
| `hooks/useWASM.ts`, `hooks/useWorkerCalculation.ts` | Archer/TVL y kerma propios | Nadie (instanciados sin uso) | **Retirados del diseñador**; archivos con pruebas propias, sin uso en la interfaz |
| `hooks/useCostOptimizer.ts`, `lib/skyshine/ChiltonSkyshine.ts`, `lib/ct/CTScatterDatabase.ts`, `lib/mcginleyData.ts` | n = log₁₀(K/P), skyshine, dispersión TC | Nadie (sin importadores) | Código muerto: borrar en la Fase 12 |
| `sections/dialogs/MemoriaAnaliticaWizard.tsx` (vía `uaqProtocol`) | Primaria/secundaria LINAC | Asistente de memoria (texto y PDF) | **Corregido**: `barreraMV` (NCRP 151); antes concreto aunque se eligiera plomo/acero, C₁ de IMRT aplicado a la primaria y una sola componente secundaria |
| `lib/agents/tools.ts` (`checkSkyshine`, `compareMaterials`, `validateTVL`) | Transmisión con tabla TVL propia | Diálogo del agente de diseño | **Corregido**: Tabla B.2 de `ncrp151` (TVL₁/TVLₑ); las barreras ya usaban `barreraMV` (Fase 8a) |
| `lib/uaqProtocol.ts` vía `controlledZoneCalculationAdapter` | LINAC, PET/CT, Gamma Knife, HDR (preliminar F55) | `LayoutBunkerDialog` | **Corregido** (depuración, etapa 8): `lib/zonaControladaMotor.ts` con `barreraMV`, `dosisSemanalTG108` y TVL del catálogo como `motorProyecto`; `f149NormativeNumericQa` apunta al motor |
| `lib/materialDatabase.ts` (`getRecommendedMaterial`) | Espesor equivalente por TVL de catálogo | Asistentes de equipo/memoria (lista de materiales) | Pendiente de contrastar con Tabla B.2 |
| `lib/nuclearMedicine.ts` | n TVL con Γ·A·t/d² | `NuclearMedicineAdvanced`, herramientas por categoría, GATE | Revisado en 8c (β+ por TG-108 Tabla V); el resto de radionúclidos, pendiente de contraste |
| `lib/therapy/TherapeuticRadionuclideShielding.ts`, `lib/spect/IPEMReport109.ts` | TVL por radionúclido (I-131, Lu-177, SPECT) | Diálogos de terapia e IPEM 109 | Revisados en 8c (TVL que eran HVL); pendientes de caso publicado |
| `lib/bimRAD.ts` | Transmisión por capas BIM | Diálogo BIM-RAD | Revisado en 8c (β+); pendiente de caso publicado |
| `sections/dialogs/BuildupFactorDialog`, `NeutronRemovalDialog`, `MaterialPropertyCalculator`, `ConcreteActivationDialog`, `lib/phyXData`, `lib/xcomAttenuation`, `lib/electronEngine` | µ, buildup, remoción de neutrones, activación | Diálogos de física de materiales | Física de apoyo (no dimensionan la barrera del plano); los de 8c llevan aviso de resultado sintético |
| `VersaHD15MVDialog`, `ElectronApplicatorDialog`, `CrossValidationDialog`, `ModelingToolboxDialog` | Barreras MV | Diálogos | Ya delegan en `calculadorasNormativas`/`ncrp151` (Fase 8a/8c) |
| `CycloneKIUBEWizard`, `MCNPCyclotronDialog` | Término fuente de ciclotrón | Diálogos de ciclotrón | Fuera del motor por diseño (el motor no publica espesor de ciclotrón); contraste con MC en esta fase |
| `DoseMapDialog`, `SpatialDoseMapDialog`, `lib/doseMapEngine`, `lib/visoresDosis`, `lib/medical3D/sceneBuilder`, `Isosurface3DDialog` | Escala logarítmica de color | Mapas y visores | Sólo visualización (el campo sale de `doseFieldEngine`); visores tras `VISORES_EN_REVISION` |
| `batemanSolver`, `decay/DecayChains`, `proyeccionDecaimiento`, `ventilacionBunker`, `gumUncertainty`, `GammaIndexAnalyzer`, `DVHAnalyzer`, `Attila4MCVarianceReduction`, `MonteCarlo*`, `nativeMCEngine`, `monteCarloEngine`, `DCHAINActivationCalculator`, `PythonIntegrationDialog` | Decaimiento, incertidumbre, índice gamma, MC | Diálogos de investigación | No son cálculo de barrera |
| `f149NormativeNumericQa`, `f484F490NormativeQa`, `f519NormativeQaExpansion`, `f581F585ExpandedNormativeNumericQa`, `validationEngine` | Casos de QA numérico | Paneles de QA y actualización | Contratos de QA; revisar que comparen contra el motor y no contra fórmulas propias |

Limitación conocida: el cálculo por lotes no recibe el perfil de isodosis de TC seleccionado en el diseñador (sólo
afecta a TC con perfil cargado). Y una barrera que no necesita blindaje (kerma·T ≤ P) queda con `requiredThickness_mm`
vacío y `verificarBarrera` la marca «sin cálculo»: corregir en la etapa 2 (requerido = 0, salvo ciclotrón).

### Alcance y referencias

| Motor / módulo | Referencia | Casos de prueba |
|---|---|---|
| Diagnóstico (`ncrp147`, Archer, TC por DLP) | NCRP 147 Tablas 4.5, 4.7, B.1, C.1; ejemplos §5 y Ap. A | Ejemplos resueltos del cap. 5 y transmisiones del Ap. A |
| Teleterapia (`ncrp151`, laberinto, IMRT, dos fuentes) | NCRP 151 Ec. 2.1–2.8, 3.6, cap. 2.4–2.5, Tablas B.2–B.7 | §7.1.1–7.1.5; laberinto y puerta ≥ 10 MV (neutrones y captura) |
| Skyshine | NCRP 151 Ec. 5.1–5.3, Tabla 5.1 | Columna calculada de la Tabla 5.1 |
| PET / medicina nuclear (`tg108`) | AAPM TG-108 Ec. 2–3, 9–10, Tablas IV–V | Ejemplos del informe (captación, imagen, cuarto de control) |
| Ciclotrón (`ciclotron`, término fuente) | IAEA SRS-47, NCRP 144; Monte Carlo de Cyclotron-SIM | Tasas por dirección frente a los mapas MC de Cyclotron-SIM; Ar-41 |
| Campo de dosis 2D (`doseFieldEngine`) | Igual que los motores anteriores, punto a punto | Igualdad con los motores por barrera en los puntos de muestreo |
| Calculadoras de diálogo (Fases 7–9) | Las mismas | Cada calculadora contra su motor (no fórmulas propias) |

### Método y entregables

1. Inventario de funciones que producen espesor/kerma/transmisión (grep + grafo de llamadas) y retirada o
   redirección de las que dupliquen un motor.
2. Suite `src/__tests__/auditoria/` con un caso publicado por fila de la tabla, tolerancias explícitas y la
   cita (norma, tabla, página).
3. Comparación con casos publicados de terceros (artículos de diseño de búnker y PET/CT) y con el MC de
   Cyclotron-SIM para el ciclotrón; las discrepancias > 10 % se documentan o se corrigen.
4. Informe `docs/auditoria-motores.md`: motor por motor, referencia, resultado, decisión.

**Criterio de salida:** un solo camino de cálculo por modalidad; 100 % de los casos de la tabla en verde;
ningún diálogo con fórmula propia.

## Fase 12 — Reorganización del frontend

**Objetivo.** Un flujo único y corto (el del asistente «Guíame»: proyecto → plano → fuentes → ocupación →
cálculo → cumplimiento → reporte) con una entrada por herramienta y sin menús ni diálogos duplicados.

### Inventario de duplicidad encontrado hoy (2026-11-10)

Contado en el build de Pages con Playwright (8 menús visibles, 82 elementos; 223 claves de diálogo en
`appStore`, 51 de ellas montadas por estado local y no por el store).

**Superficies de mando que repiten acciones** (siete a la vez en pantalla): menús superiores (Archivo,
Diseño, Equipos, Blindaje, Verificación, Reportes, Evidencia, Integraciones); fila de acceso rápido
(DX/TX/NM/CY, Memoria, Evidencia, Validar, Heatmap); bloques «Acciones», «Herramientas de dibujo»,
«Cálculo NCRP» y «Análisis» de la barra lateral; barra del lienzo (Sel, Muro, Fuente, Zona, Medir, Pan, Plano,
Escala, Punto, Material, Calcular, Snapshot); barra inferior «CAD» (Plano, Muro, Fuente, Zona, Calc, 3D,
Evid); botón flotante «Calcular»; paleta de comandos. «Calcular» aparece en 5 sitios con 2 motores.

**Menús duplicados**

| Función | Dónde aparece | Nota |
|---|---|---|
| Árbol completo de menús | `Toolbar.tsx`: menús visibles y zona oculta `f114-deduped-legacy-menu-zone` | ~300 líneas sólo para contratos de pruebas antiguas |
| Audit Trail, análisis de logs, especificaciones técnicas | Archivo y Evidencia | mismas acciones |
| Importar DXF / DXF Viewer | Archivo y Diseño | mismo diálogo |
| PDF | Archivo «Exportar PDF» (memoria jsPDF) y Reportes «PDF analítico» (misma función); diálogo `pdfReport` que descarga **JSON** | renombrar o unificar |
| Reporte CNSNS | Archivo y Reportes (`cnsns`, .docx) más `cnsnsAutoReport` (HTML) y `cnsnsDigital` (XML) | tres salidas CNSNS |
| Checklist CNSNS | `cnsnsChecklist` (30 ítems) y `checklistCNSNS` (23 requeridos) | dos listas distintas |
| Integraciones | 7 elementos abren el mismo Performance Dashboard; 2 abren Performance Recommendations | entradas cosméticas |
| `keyboardShortcuts` | dos veces en `DIALOG_NAMES` | |

**Diálogos que se solapan**

| Grupo | Diálogos |
|---|---|
| Memoria analítica | `memoriaAI`, `memoriaWizard`, `reportManager`, `batchReportExporter`, `regulatoryReport` |
| Tableros | `dashboard`, `dashboardCalc`, `cnsnsDashboard`, `auditDashboard`, `analytics`, `analytics47`, `performanceDashboard` |
| 3D | `viewer3d`, `realTime3D`, `medicalFloorPlan3D`, `parametric3d`, `isosurface3d` (en revisión), `dose3D` |
| Equipos y fuentes | `equipmentDB`, `equipmentLibrary`, `equipmentManager`, `sourceLibrary`, `sourceSelector`, `autoFillEquipment` |
| Monte Carlo | `mc`, `mcConfig`, `mcCloud`, `monteCarloSim`, `monteCarloIntegration`, `nativeMC`, `mcEngine`, `geant4Mc`, generadores PHITS/FLUKA/PENELOPE/MCNP |
| Calculadoras de barrera | `barrierCalculator` (ya recibe `shieldingCalculator` y `quickBarrier`), `equipmentShieldingWizard`, `multiLayerShield`/`laminatedBarrier`, `floorCeiling` |
| Ayuda | `tutorial`, `onboardingTour`, `videoTutorial`, `helpPanel`, `manual`, `docs` y ahora «Guíame» |
| Historial | `versionHistory` (sin almacén), `historyPanel`, `undoRedoHistory` |

**Estado compartido.** El plano vivía en `useUndoRedo` del diseñador y en `canvasStore` sin sincronizar (los
diálogos que leen `canvasStore` veían siempre un plano vacío): corregido en la Fase 10 con una sincronización
de un solo sentido; la Fase 12 debe dejar **un** almacén del proyecto.

### Propuesta

1. Barra superior de 5 menús por etapa del flujo (Proyecto, Plano, Cálculo, Verificación, Reportes) más Ayuda;
   Integraciones, Monte Carlo y herramientas de investigación en un menú «Avanzado» detrás de una bandera.
2. Una sola barra de herramientas del lienzo; la barra lateral sólo para propiedades del elemento
   seleccionado; retirar la fila de acceso rápido y la barra «CAD» inferior.
3. Unificar por grupo de la tabla anterior (un diálogo por función; las claves antiguas se redirigen con
   `DIALOGOS_REDIRIGIDOS`, como en la etapa 3), migrar los 51 diálogos de estado local al store y borrar la
   zona de menús oculta tras actualizar sus pruebas.
4. Un único almacén del proyecto (zustand) con deshacer/rehacer; `ShieldingDesigner.tsx` (≈ 2 900 líneas) se
   divide por etapa.
5. Pruebas: el recorrido de «Guíame» como prueba E2E de referencia, más el barrido de diálogos y menús en vacío
   de la Fase 10 sin errores de consola.

**Criterio de salida:** cada acción con una sola entrada en menús, ≤ 2 superficies de mando visibles, ningún
diálogo huérfano y el recorrido guiado en verde.
