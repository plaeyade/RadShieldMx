# RadShield-MX — Control de Cambios Completo v1-F260

## F261-F262 (2026-07-24) - DWG Provider Selection And Fixture Gate

- Se selecciona APS Design Automation como proveedor primario recomendado para DWG->DXF.
- Se deja ODA como ruta privada/enterprise y CloudConvert solo para preview.
- Se crea gate de fixtures DWG no sensibles en `fixtures/dwg/`.
- Se integra F261/F262 a F125 para Memoria IA/Evidence.
- Se agregan scripts `prepare:f261-f262:dwg` y `test:f261-f262:dwg`.

## F258-F260 (2026-07-24) - Staging CAD, DWG Boundary And DB Gate

- Se agrega event controller v2 aislado para staging; el canvas estable no se sustituye por defecto.
- Se agrega contrato DWG externo, manteniendo DXF como ruta canonica.
- Se agrega gate DB/fullstack F260 con salida `blocked-by-db-live-gates` cuando faltan variables o permisos.
- F125 reporta estado F258/F259 para Memoria IA/Evidence.
- Se agregan scripts `test:f258-f260:full` y `prepare:f260:db-gate`.

## F257-F260 (2026-07-24) - Full Execution Gate

- Se agrega `src/lib/f257ToF260FullExecution.ts` para convertir F257-F260 en evidencia ejecutable.
- Se agrega `.env.staging-cad.example` para activar CAD de alto riesgo solo en staging, dejando `VITE_CANVAS_EVENT_CONTROLLER_V2=false` al inicio.
- F257 queda ejecutado como paquete staging y rollback documentado.
- F258 queda listo para event controller v2 solo con feature flag y E2E F229.
- F259 queda bloqueado correctamente hasta seleccionar proveedor externo DWG.
- F260 queda bloqueado correctamente hasta DB live con restore probe, backend smoke y secretos productivos.
- Se agregan scripts `prepare:f257-f260:full` y `test:f257-f260:full`.

## F256-F260 (2026-07-21) - Next Phase Roadmap

- F256: smoke publico del ZIP estatico actual contra URL final.
- F257: staging CAD con flags, manteniendo el RC estable como rollback.
- F258: spike renderer/event controller v2 sin reemplazar `useCanvas` por defecto.
- F259: proveedor externo DWG->DXF/SVG/IFC; DXF sigue como ruta canonica.
- F260: retomar DB/fullstack con restore probe, backend smoke, RAG privado y secretos productivos.
- Decision: no mezclar deploy estatico, CAD alto riesgo y DB fullstack en una sola fase.

## F251-F255 (2026-07-19) - High-Risk CAD Gate

- Se aplica el RC/deploy estatico como baseline de rollback antes de iniciar CAD alto riesgo.
- Se agregan flags apagados por defecto: `VITE_CANVAS_HIGH_RISK_CAD` y `VITE_CANVAS_EVENT_CONTROLLER_V2`.
- F251-F255 organiza renderer/event controller v2, DWG externo, sync 2D/3D, booleanas CAD y heatmaps GPU.
- Regla de control: repetir F197/F207/F229/F231-F236/F200 antes y despues; si falla, apagar flags y volver al artefacto F250.

## F248-F250 (2026-07-19) - Release Candidate Final

- F248 define la repeticion del smoke contra URL publica/static y el fallback F203 manual si la red de Codex impide validar Vercel.
- F249 deja la decision formal: frontend estatico listo tras smoke; fullstack/API/DB/RAG privado bloqueado hasta restore probe real, secretos y smoke backend.
- F250 congela el release candidate final estatico y actualiza manuales/Update Center a cobertura v1-F250.
- CAD alto riesgo se difiere a post-RC con feature flag: renderer/eventos base, DWG nativo, sync 2D/3D bidireccional, booleanas CAD y heatmaps GPU/WebGL.

## F238-F247 (2026-07-19) - Release Execution

- F238-F247 cierra el bloque pre-deploy con manual F247, smoke estatico, CAD bajo riesgo, renderer con feature flag, DXF/equipos, paquete frontend, ledger TVL/HVL, QA numerico, auditoria material y checklist de anexos.
- Se agrega `src/lib/f238ToF247ReleaseExecution.ts` con funciones reutilizables para ledger TVL/HVL, auditoria de materiales y anexos.
- F125 agrega la seccion F238-F247 para que reportes y Memoria IA reciban el checklist de salida.
- Decision: deploy frontend estatico despues de F200/F230/F237/F238-F247; fullstack solo tras DB live restore probe.

## F237 (2026-07-19) - Calculation Engine Governance

- Se implementa una capa unica de gobierno para el motor de calculo.
- Verifica formula, norma, inputs, outputs, supuestos, warnings, citas, snapshot de unidades, comparador base/conservador y cache F196.
- F125 agrega la seccion F237 para que Memoria IA, Evidence Pack y PDF no queden desconectados del motor.
- Se corrige el manual HTML para cubrir v1-F237, incluyendo las fases posteriores a v116.
- Decision: frontend estatico puede pasar a deploy cuando F200/F230/F231-F236/F237 pasen; fullstack espera DB live/restore probe.

## F230 (2026-07-19) - Gate post-F229 renderer/eventos

- Se formaliza que renderer base y logica de eventos del canvas solo pueden modificarse despues de pasar F198, F207, F229 y F200.
- Se agrega fila F230 en canvas para mostrar estado de menus/botones, flujo funcional, canvas E2E, release, shell y documentacion.
- Se actualizan Update Center, changelog, manual de usuario, manual de versiones y `public/manual_usuario.html`.
- Pendientes siguientes: F231 pixel-diff visual, F232 DXF/DWG fixture, F233 grip/snap exacto, F234 isocontornos numericos, F235 sync 2D/3D y F236 post-deploy.

## F231-F236 (2026-07-19) - Canvas Release Coverage

- F231 baseline visual: capturas F229/F207 para prevenir canvas blanco, sidebar oculta y menus superpuestos.
- F232 DXF/DWG fixture: DXF validado por smoke; DWG sigue como conversion externa.
- F233 grip/snap: interaccion CAD cubierta por E2E; coordenadas exactas pasan a event controller v2 con flag.
- F234 isocontornos: superficie visual/leyenda exportable validada; interpolacion numerica queda separada.
- F235 sync 2D/3D: handoff de planta/equipos/espesores/snapshots listo; sincronizacion bidireccional queda aislada.
- F236 post-deploy: paquete y URL publica listos para repetir F154-F158/F202.

## Estadisticas del Proyecto (v99)

| Metrica | Valor |
|---------|-------|
| Version actual | v99 |
| Dialogos/Componentes | 208+ |
| Tests unitarios | 240+ pasando |
| Referencias bibliograficas | 82+ |
| Lineas de codigo | ~80,000+ |
| Modulos | 180+ |
| Capas AI | 5 (LLM, RAG, ML, CV, Agentes) |
| APIs Web | 7+ implementadas |
| Idiomas | 2 (es/en) |

---

## v110 (2026-06-08 19:30 CST)

### Automated Regulatory Report Generator
- **RegulatoryReportDialog.tsx**: Memoria Analitica conforme NOM-008/NUCL-2018, NOM-040/NUCL-2016
- Datos: instalacion, direccion, fisico responsable, cedula, licencia CNSNS
- Resumen automatico: barreras CUMPLE/NO CUMPLE, conteos, conclusion
- Normativa incluida: NOM-008, NOM-040, NOM-013, CNSNS-L-010-2015
- Export JSON estructurado para sistemas regulatorios mexicanos
- Boton Toolbar: Rep (icono FileText, color amber)

## v109 (2026-06-08 19:15 CST)

### Neutron Shielding Calculator
- **NeutronShieldingDialog.tsx**: calculadora dedicada blindaje neutronico > 10 MV
- 6 materiales: Concreto, PE, BPE, Acero+BPE, Agua, Tierra
- 5 energias MV: 10/15/18/20/25 con produccion neutronica (McGinley 1998)
- Formula: n = log10(H_w/P), t = n x TVL
- Referencia: NCRP 151 Table B.7
- Boton Toolbar: Neu (icono Atom, color cyan)

## v108 (2026-06-08 19:00 CST)

### Spatial Dose Map 2D
- **SpatialDoseMapDialog.tsx**: mapa de calor de dosis espacial 80x60 celdas
- Canvas 700x400px con barreras y fuentes superpuestas
- Colores: azul (baja) → amarillo (media) → rojo (alta)
- Atenuacion por barrera: exp(-mu*t) segun material
- Ley inversa cuadrado para fuentes
- Leyenda con escala y valor maximo
- Referencia: NCRP 147 Eq. 4.1
- Boton Toolbar: Map (icono Crosshair, color red)

## v104 (2026-06-08 17:30 CST)

### Revit Add-in C# (BIM Bidireccional)
- **RevitAddinDialog.tsx**: 3 tabs — C# Add-in / Shared Params / Guia
- **ImportShieldingCmd.cs**: Template completo con codigo copiable (Copy to Clipboard)
- **Shared Parameters XML**: 9 parametros RS_* (ShieldingType, DesignGoal_mSv, MaterialCode, RequiredThickness_mm, ActualThickness_mm, PassFail, NCRPReference, CalculatedDate, Version)
- **Guia paso a paso**: 5 pasos de instalacion del Add-in en Revit 2024
- Requisitos documentados: Revit 2024, .NET Framework 4.8, Visual Studio 2022

## v107 (2026-06-08 18:30 CST)

### Batch Report Exporter
- **BatchReportExporterDialog.tsx**: Export JSON/CSV con todas las barreras, fuentes, regiones
- Resumen automatico: conteo de barreras, fuentes, regiones con metadatos NCRP
- Formatos: JSON completo (reporte analitico) o CSV (solo barreras para Excel)
- Integrado con useCanvasStore: datos en tiempo real del proyecto activo
- Boton Toolbar: Exp (icono FileDown, color pink)

## v106 (2026-06-08 18:15 CST)

### Material Comparison Tool
- **MaterialComparisonDialog.tsx**: tabla comparativa de 7 materiales de blindaje
- Columnas: ρ, Zeff, HVL, TVL, kg@HVL, $@HVL, kg@2TVL, $@2TVL
- 8 energias seleccionables: 0.05-10 MeV con datos NIST XCOM interpolados
- 6 areas configurables: 5-50 m²
- Costos USD/kg: Pb $2.5, Concrete $0.15, Steel $1.2, GYPSUM $0.4, PE $3.5, BPE $8.0, W $45.0
- Boton Toolbar: Comp (icono GitCompareArrows, color orange)

## v105 (2026-06-08 18:00 CST)

### Multi-Objective Shielding Optimizer
- **MultiObjectiveOptimizerDialog.tsx**: minimiza costo + peso + espacio con restriccion dosis < P
- 3 pesos configurables: Costo $, Peso kg, Espacio mm (suma = 1.0)
- Resultados ordenados por score multi-objetivo — primer resultado = OPTIMO
- Badge OPTIMO (teal) + PASS/FAIL por tolerancia NCRP 5%
- Materiales evaluados: CONCRETE, PB, STEEL (configurable)
- Boton Toolbar: Opt (icono TrendingDown, color teal)

## v103 (2026-06-08 17:00 CST)

### Geant4 Monte Carlo Gold Standard
- **Geant4McDialog.tsx**: Simulacion Monte Carlo con validacion vs NCRP
- 3 niveles de precision: 10⁵ (rapido), 10⁶ (estandar), 10⁷ (preciso)
- Resultados: dosis MC, transmision B, diferencia % vs NCRP, PASS/FAIL (5% tol)
- HVL/TVL automaticos por material y energia desde xcomAttenuation.ts
- Progreso visual con Progress bar durante simulacion
- Placeholder cliente — Docker Geant4/GATE API REST planificado para backend
- Referencias: G4-Med (2020) Med Phys 48(1):19-56, NCRP 151 Sec. B.1

## v102 (2026-06-08 16:30 CST)

### Revit IFC Import (BIM Integration)
- **RevitIfcImportDialog.tsx**: Parser IFC2X3/IFC4 que extrae muros (IFCWALL) y espacios (IFCSPACE)
- Export JSON con barreras + regiones con factores NCRP automaticos (suggestOccupancyProfile)
- Decodificacion de nombres unicode IFC (\\X\\HHHH)
- 7 materiales de blindaje en xcomAttenuation.ts para referencia cruzada
- Parametros compartidos RS_* documentados para futuro Revit Add-in C#

### v101 (2026-06-08 15:30 CST)

### ML Shielding Predictor (ONNX)
- **OnnxPredictorDialog.tsx**: ANN [6→64→32→16→1] simulado con formula NCRP B=Pd²/(WUT)
- 6 inputs: energia_MeV, actividad_GBq, distancia_m, T_occ, U_use, materialCode
- Badge de confianza: verde >90%, ambar <90% (energia fuera de rango 0.01-10 MeV)
- TVL por material y energia calculado dinamicamente
- Referencias: Ickecan IntechOpen 2026 (R²=0.9885), PMC12686668 (error <1% vs MC)

### v100 (2026-06-08 14:30 CST)

### NIST XCOM Attenuation Database
- **xcomAttenuation.ts**: 7 materiales (Pb, Concrete, Steel, Gypsum, PE, BPE, Tungsten)
- 15 energias por material (0.01-10 MeV): μ, μ_en, HVL, TVL
- **NistXcomDialog.tsx**: tabla interactiva con interpolacion logaritmica
- Calculadora B=exp(-μt): transmision para espesor dado
- Calculadora t=-ln(B)/μ: espesor para transmision objetivo
- **getMaterialOptions()**, **interpolateAttenuation()**, **calculateRequiredThickness()**, **calculateTransmission()**
- Fuente: NIST Standard Reference Database 8 (Berger et al. 2010)

---

## v99 (2026-06-08 14:00 CST)

### Botones NCRP Rapidos (Prim/Sec/Neut/Sky)
- 4 botones de acceso rapido en Toolbar para calculos NCRP 147/151
- **Prim** (ShieldPlus): Barrera primaria B=Pd²/(WUT) — NCRP 147 Eq. 4.1
- **Sec** (ShieldAlert): Barrera secundaria scatter+leakage — NCRP 147 Sec. 4.4
- **Neut** (Atom): Blindaje neutronico >10 MV — NCRP 151 Sec. B.4
- **Sky** (Wind): Skyshine Chilton — NCRP 151 Sec. 5.4
- Conectados a dialogos existentes: barrierCalculator, neutronShielding, chiltonSkyshine

### Manual de Usuario Actualizado
- MANUAL_USUARIO_v99.md: 17 secciones con metodologia completa
- Formulas matematicas con referencias NCRP especificas
- Tablas de factores de ocupacion NCRP 147 Table A.1
- Procedimiento paso a paso para cada modulo

### Control de Cambios Completo
- CONTROL_DE_CAMBIOS_v99.md: historial detallado v1-v99 con fechas

### Versiones Actualizadas
- Toolbar: v99 badge
- StatusBar: RadShield-MX v99
- SplashScreen: v99
- UpdateDialog: CHANGELOG v96-v99 + badge v99

---

## v98 (2026-06-08 12:30 CST)

### Factores de Ocupacion NCRP 147/151
- **ncrpOccupancy.ts**: 12 perfiles estandar (control_room, corridor, waiting_room, parking, etc.)
- **suggestOccupancyProfile()**: deteccion automatica de T segun nombre de barrera/región
- **NCRP_DESIGN_GOALS**: P=0.1 mSv/sem (controlado), P=0.02 mSv/sem (publico)
- **formatOccupancy()**: formato legible "1/5 (parcial)", "1/20 (ocasional)"
- Referencias: NCRP 147 Table A.1 para todos los perfiles

### Demo R&F Room con NCRP
- Barreras: T automatico segun tipo (Control Room T=1.0, Corridor T=0.2)
- Regiones: P automatico segun tipo (controlado/publico)
- Toast tutorial: guia interactiva con factores NCRP aplicados

### Toast Informativo al Importar Plano
- Dimensiones de imagen (px), escala estimada (m/px)
- Instrucciones para usar OpenCV
- Recordatorio de factores NCRP aplicados a barreras detectadas

---

## v97 (2026-06-08 10:00 CST)

### OpenCV.js Integrado al Canvas
- **useOpenCV hook**: detectWalls() con pipeline completo
- **Canny Edge Detection**: cv.Canny() para deteccion de bordes
- **Hough Line Transform**: cv.HoughLinesP() para lineas rectas
- **Find Contours**: cv.findContours() para habitaciones cerradas
- **handleOpenCVDetect()**: convierte lineas → Barrier, contornos → OccupiedRegion

### Handlers conectados
- onOpenCVDetect pasado desde ShieldingDesigner a Toolbar
- Validacion: error controlado si no hay imagen cargada
- Loading toast con progreso del analisis

---

## v96 (2026-06-08 08:30 CST)

### Transporte de Material Radiactivo (SSR-6)
- **RadioactiveTransportDialog.tsx**: 5 tabs completas
- **Tab Categorias**: I-BLANCO, II-AMARILLO, III-AMARILLO con colores y badges
- **Tab Requisitos**: 12-item checklist SSR-6
- **Tab UN/TIPI**: Numeros UN2910-UN3332 con limites A1/A2
- **Tab Calculadora**: D=(A×Γ)/d² con 8 nuclidos preconfigurados
- **Tab Referencias**: LAERA, RETECO, NOM-013-NUCL-2013, CNSNS-L-010-2015

### Botones Toolbar
- Transporte (Truck icon), OpenCV (ScanEye), Mover (Move)
- Registro en appStore: transportDialog en DIALOG_NAMES
- LazyDialog en ShieldingDesigner para carga diferida

---

## v95 (2026-06-07 22:00 CST)

### OpenCV.js Computer Vision
- **useOpenCV.ts**: hook para carga dinamica de OpenCV.js desde CDN
- **Canny + Hough pipeline**: planAnalyzer.ts con deteccion automatica
- Floor Plan Tools: 5 features — AI Timeline, Easy Planning, Electrical, Plumbing, Diagramming
- **FloorPlanFeaturesPanel.tsx**: panel de herramientas SmartDraw-style
- appStore: floorPlanFeatures registrado en DIALOG_NAMES

---

## v94 (2026-06-07)

### Auth + ML Predictivo
- Login page branded RadShield-MX con gradiente e instituciones
- **useMLPrediction.ts**: TensorFlow.js red neuronal [8→64→32→16→1]
- 30+ datos de entrenamiento NCRP para prediccion de espesores
- UI animations: fadeIn, slideIn, pulse, scaleIn
- Dark mode soportado en Login

---

## v93 (2026-06-07)

### DialogManager Zustand + Auditoria 100%
- 24 dialogs migrados de useState a Zustand store
- useDialog() hook para gestion centralizada
- Dialog history stack, openExclusive, goBack
- **Auditoria: 78/78 items completados (100%)**

---

## v92 (2026-06-07)

### Auth UI + Backend Integration
- Boton login/logout en Toolbar con dropdown (Kimi OAuth)
- StatusBar muestra nombre de usuario autenticado
- useAuth integrado en Toolbar y StatusBar
- Auditoria C.9: Bundle optimization

---

## v91 (2026-06-07)

### Report Manager + Backend
- ReportManagerDialog: CRUD memorias analiticas en la nube
- Generacion automatica de reporte desde proyecto activo
- useBackend con persistReport/persistProject con userId real

---

## v90 (2026-06-07)

### Project Manager + Material Library
- ProjectManagerDialog: tabs Local/Nube, busqueda, CRUD
- MaterialLibraryDialog: 6 builtin + materiales personalizados en DB
- Backend tRPC completo: projects, materials routers

---

## v89 (2026-06-07)

### Frontend-Backend Integration
- useBackend.ts: 6 sub-hooks (calculations, materials, reports, projects, ML, agent)
- Persistencia automatica de calculos tras ejecucion NCRP
- 12 tRPC routers conectados

---

## v88 (2026-06-07)

### Backend Real (Drizzle ORM)
- 4 tablas nuevas: calculations, custom_materials, ml_training_data, reports
- 4 routers: calculation, material, report, ML
- agent-router persiste resultados en calculations

---

## v87 (2026-06-07)

### CI/CD + Canvas Rendering
- GitHub Actions: 5 jobs (typecheck, test, build, E2E, deploy)
- Build dual: sandbox vs CI (8GB RAM)
- Canvas: layers opacity, freehand overlay, sticky notes

---

## v86 (2026-06-07)

### Fase 3 Backend + 18 Fuentes
- Backend: neutron-shielding, skyshine, batch-barriers, multi-source
- 18 Fuentes Reales con iconos diferenciados (DX/RT/NM/CY)
- SmartBarrier AI: calculo NCRP en tiempo real en canvas
- SourceSelector: catalogo completo con normativa NCRP-147/151/155

---

## v85-v83 (2026-06-07)

### SmartBarrier AI + Canvas Tools
- v85: SmartBarrier AI + SourceSelector integrados
- v84: CanvasArea/Toolbar con hooks (layers, shapes, freehand, sticky)
- v83: Botones BORRAR/NUEVO MAPA en Toolbar

---

## v82 (2026-06-07)

### Canvas Tools + Update Center
- Canvas layers panel, shape library, freehand draw, sticky notes
- Room Template Panel con templates clinicos
- Update Center v82 con changelog y auditoria

---

## v67 (2026-06-05)

### SplashScreen + Tema + Auditoria
- SplashScreen: boton Aceptar obligatorio + checkbox
- Tema unificado teal/coral
- Ejemplo R&F precargado automaticamente
- Boton Nuevo Dibujo
- Auditoria: 76/78 items (97%)

---

## v66 (2026-06-05)

### Canvas Redisenado
- Canvas redisenado limpio (SmartDraw-style)
- Toolbar unificada sin duplicados
- Anti-OOM v3: build estable 49s

---

## v65 (2026-06-05)

### SmartDraw Dashboard + Room Templates
- CanvasArea2: SmartDraw dashboard
- Room Templates: R&F, CT, PET/CT, LINAC
- Quick Actions Dock para memorias

---

## v63 (2026-06-05)

### E2E + APIs + WCAG
- E2E Tests Playwright configurados
- Payment Request API hook
- Analytics Dashboard con localStorage
- WCAG 2.1 AA (SkipToContent, A11yAnnouncer)

---

## v62 (2026-06-05)

### Update Menu + Zustand
- Update Menu: changelog + auditoria + docs pendientes
- SplashScreen actualizado a v62
- Migracion Zustand: 75/208 dialogs

---

## v61 (2026-06-05)

### Zustand Etapa 2
- 15 dialogs migrados a Zustand
- KeyboardShortcuts, SmartSearchDICOM, LogFileAnalysis, CompareMode, BatchCalc, Sensitivity, AuditDashboard, GeometrySelector, NuclideData, DecayHeat, BuildupFactor, ExposureRateProjection, SketchPad, ExampleWizard, CADImport

---

## v60 (2026-06-05)

### Zustand Etapa 1
- 12 dialogs migrados a Zustand
- MemoriaWizard, PlanValidator, EquipmentShielding, MonteCarloSim, CycloneKIUBE, Tutorial, CBCTIGRT, LayoutBunker, MaintenanceLog, ScenarioAnalysis, ChecklistCNSNS, SpecialCases

---

## v59 (2026-06-05)

### Validacion TypeScript + Tests
- Validacion completa codigo TypeScript
- Correccion 22 tests (fisica + unidades)
- Fix Gy→mSv en calculateUnshieldedKerma
- NRC RG 8.39 patient release criteria

---

## v58 (2026-06-05)

### Tests + Integraciones Web
- Tests Vitest: 240/240 pasando
- Sentry integration completa
- Ghost barrier preview
- Web Share Target + PWA manifest
- Leyendas tab, touch gestures

---

## v52 (2026-05)

### 5 Capas AI Completadas
1. **LLM Integration**: OpenAI/Ollama/LMStudio + streaming chat
2. **RAG**: Vector store con cosine similarity, 50+ chunks
3. **ML Predictivo**: TensorFlow.js NN [8→64→32→16→1], 3,000+ datos
4. **Computer Vision**: Canny + Hough wall detection
5. **Agentes Autonomos**: ShieldingDesign + Validation + CostOptimization

---

## v50 (2026-04)

### Core Platform + Auditoria
- NCRP Validation Suite: 24 casos vs tablas oficiales
- CT Scatter Database: 22 modelos por scanner
- AAPM TG 108 PET, IPEM 109 SPECT, Therapy Shielding
- Chilton Skyshine, Decay Chains, GMP Certification
- Spatial hashing con Morton codes (50x mas rapido)
- WebWorker async calculations

---

## v46-v49 (2026-Q1)

### Pre-AI Foundation
- WebGPU compute shaders
- File System Access API
- Broadcast Channel cross-tab sync
- Service Worker con cache de calculos
- Community templates

---

## v26-v45 (2025-Q4)

### Feature Expansion
- Gamma Knife, HDR, Cyclotron
- CNSNS reportes y checklist
- Monte Carlo integration (GATE, TOPAS)
- Biblioteca de materiales expandida
- Sistema de proyectos con gestion completa

---

## v1-v25 (2025-Q3)

### Prototipo Inicial
- Canvas interactivo basico con HTML5 Canvas 2D
- Calculos NCRP 147/151 iniciales (Archer transmission)
- Primeros 50 dialogos
- Sistema de menu 8-categorias
- Soporte DX/TX/NM/CY basico

---

*Documento generado el 2026-06-08*
*Version: v99*
*RadShield-MX — Professional Radiation Shielding Design*
