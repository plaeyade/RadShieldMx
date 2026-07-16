# RadShield-MX - Fases recientes

## F183 (2026-07-16) - CAD recovery + material toolbox

- Se desactiva la autocarga historica del demo R&F que aparecia al abrir canvas vacio.
- Se agrega boton explicito `Cargar croquis MA` con un ejemplo LINAC 6 MV para memoria analitica.
- Se refuerza la sidebar con ancho minimo visible y leyendas hover para herramientas/botones.
- Se agrega acceso rapido `Mat` para abrir la toolbox unificada de materiales.
- Se consolida en `MaterialComparisonDialog` el resumen de TVL, densidad, peso, costo, tiempo de obra y gatillo de revision estructural.
- Validacion: `npm run test:f182:canvas-workspace`, `npm run build` y preview HTTP local.

## F182 (2026-07-16) - Canvas professional workspace

- Se apaga la pantalla de bienvenida/ejemplo al abrir la app para no cubrir el floorplan.
- Se agrega empty-state limpio dentro del canvas con acciones de importar plano, plantillas y capas.
- Se repliegan los paneles de QA/continuidad en un dock `CAD workspace` para que no tapen el layout.
- Se repliega el panel de flujo `Layout - blindaje - memoria` y queda disponible como chip compacto.
- Se hace la barra superior del canvas tolerante a overflow horizontal en pantallas estrechas.
- Validacion: `npm run build`, smoke HTTP local y `npm run test:f182:canvas-workspace`.

## F181 (2026-07-16) - Deploy now handoff

- Se intenta deploy por Sites usando el proyecto existente, pero el push de source queda bloqueado por `git.chatgpt-team.site:443`.
- Por seguridad no se guarda version ni se despliega si no se pudo empujar el source exacto.
- Se genera paquete estatico `radshield-mx-static-dist.zip` para carga manual en Vercel/Netlify/Cloudflare.
- Se mantiene la regla: al tener URL final, configurar `PUBLIC_DEPLOY_URL` y repetir F154-F158.
- Nuevos comandos: `npm run prepare:f181:deploy-now` y `npm run test:f181:deploy-now`.

## F180 (2026-07-16) - Static publish runbook

- Se agrega runbook operativo para publicar frontend estatico en `vercel-static`, `netlify-static` o `cloudflare-pages`.
- Se mantiene `vps-fullstack` como ruta clinica para API, DB, secretos, RAG privado, backups y auditoria.
- Se documenta politica de secretos: no publicar `.env`, `DATABASE_URL`, dumps DB, corpus privado ni documentos clinicos en hosting estatico.
- Se define smoke posterior al deploy: configurar `PUBLIC_DEPLOY_URL` y repetir F154-F158.
- Nuevos comandos: `npm run prepare:f180:static-publish` y `npm run test:f180:static-publish`.

## F179 (2026-07-16) - Deploy lane decision

- Se formaliza el carril primario `vercel-static` para obtener una URL publica de frontend con bajo riesgo.
- Se conserva `vps-fullstack` como carril clinico/multiusuario con API, DB, secretos, RAG privado, backups y auditoria.
- `local-offline` queda como fallback validado por F175-F176 mientras Sites siga bloqueado por `git.chatgpt-team.site:443`.
- Politica: despues de cualquier URL publica, configurar `PUBLIC_DEPLOY_URL` y repetir F154-F158.
- Nuevos comandos: `npm run prepare:f179:deploy-lane` y `npm run test:f179:deploy-lane`.

## F178 (2026-07-16) - Alternate deploy readiness

- Se agregan `vercel.json`, `netlify.toml`, `public/_redirects` y `public/_headers` para deploy estatico alterno con fallback SPA.
- Se documentan opciones: Vercel, Netlify, Cloudflare Pages, VPS full-stack y paquete local/offline.
- Politica: static hosting sirve para frontend/demo; release clinico multiusuario requiere backend, DB, secretos, backup y auth.
- Nuevos comandos: `npm run prepare:f178:alternate-deploy` y `npm run test:f178:alternate-deploy`.

## F177 (2026-07-16) - Sites deploy retry

- Se agrega compuerta F177 para reintentar Sites/Git hosting despues de F176.
- La fase valida proyecto Sites, commit SHA, F159, F176 y conectividad a `git.chatgpt-team.site:443`.
- Si la red esta bloqueada, no guarda version ni despliega; conserva el paquete local y documenta alternativas.
- Nuevos comandos: `npm run prepare:f177:sites-deploy` y `npm run test:f177:sites-deploy`.

## F176 (2026-07-16) - Local smoke final

- Se agrega compuerta local sobre `LOCAL_SMOKE_URL` para validar HTML, `reset-cache.html`, assets JS/CSS y evidencias F175/F174A.
- La fase confirma que el paquete recuperado esta listo para revision visual y para reintentar deploy publico.
- Nuevos comandos: `npm run prepare:f176:local-smoke` y `npm run test:f176:local-smoke`.

## F175 (2026-07-16) - Local delivery + cache recovery

- Se agrega `public/reset-cache.html` para desregistrar service workers antiguos y borrar caches `radshield-*` cuando desaparezcan menus/canvas tras un build.
- `index.html` limpia service workers/caches por defecto, salvo que se abra con `?enable-sw=1`.
- Se agrega paquete local F175 con URLs de recuperacion, evidencia F153/F156/F172/F173/F174A y artefactos de build.
- Nuevos comandos: `npm run prepare:f175:local-package` y `npm run test:f175:local-package`.

## F174A (2026-07-16) - Predeploy low-risk hardening

- Se agregan guardas no invasivas al motor: `isFinitePositive`, `clampTransmission` y `getCalculationInputWarnings`.
- `archerTransmission` y `tvlTransmission` acotan salidas forward al intervalo fisico 0..1 para evitar propagacion de NaN/Infinity en datos corruptos.
- Se agrega politica RAG de fuente: canonica, investigacion, evidencia de materiales, memoria analitica y externa.
- Update Center muestra el estado F174A antes de deploy, sin migracion de DB ni dependencias nuevas.
- Nuevos comandos: `npm run prepare:f174a:predeploy-hardening`, `npm run test:f174a:predeploy-hardening` y `npm run test:f174a:predeploy-hardening:unit`.

## F173 (2026-07-16) - Canvas low-risk polish

- Se agrega HUD compacto `f173-canvas-hud` dentro del overlay existente del canvas para mostrar seleccion, snap, objetos, evidencia, heatmap y estado de export.
- La mejora evita nuevos paneles flotantes y no modifica formulas, constantes de materiales, limites regulatorios ni motor de snapping.
- Nuevos comandos: `npm run prepare:f173:canvas-polish` y `npm run test:f173:canvas-polish`.

## F172 (2026-07-16) - Release candidate final

- Se agrega compuerta final de release candidate con estado `controlled-offline-ready` o `public-deploy-ready` segun evidencia local y disponibilidad del deploy target.
- Reune F168 DB live, F169 QA numerico, F170/F170B RAG canonico, F171 canvas polish, F172A investigacion arXiv, build frontend/backend y estado F154-F167.
- Politica: app estable para RC controlado si las compuertas locales pasan; deploy publico requiere F154-F158 contra URL final.
- Nuevos comandos: `npm run prepare:f172:release-final` y `npm run test:f172:release-final`.

## F172A (2026-07-16) - arXiv research methodology

- Se indexan `2601.10336v2.pdf` y `2407.12991v2.pdf` como fuentes de investigacion no canonicas en `document_chunks`, con hash, pagina y tags de metodologia.
- Se integra la revision de concretos avanzados al comparador/toolbox de materiales y el paper PET 511 keV al calculador AAPM TG-108 como nota QA de buildup/Monte Carlo.
- Politica: estas fuentes apoyan metodologia, costo/estructura y advertencias; no sustituyen NCRP/IAEA/AAPM/UAQ ni cambian constantes del motor de calculo.
- Nuevos comandos: `npm run prepare:f172a:arxiv-research` y `npm run test:f172a:arxiv-research`.

## F171 (2026-07-16) - Canvas polish predeploy

- Se agrega panel visible `f171-canvas-polish-predeploy` dentro de `CanvasArea` para revisar grips, cotas, snap, seleccion, heatmap, propiedades y export antes del deploy.
- La fase enlaza canvas con F170 sin cambiar calculos, constantes de materiales ni objetivos regulatorios.
- Nuevos comandos: `npm run prepare:f171:canvas-polish` y `npm run test:f171:canvas-polish`.

## F170B (2026-07-16) - Canonical NCRP147/TG108 reindex

- Se agrega reindexacion canonica para `f170b-ncrp147` y `f170b-aapm-tg108` desde PDFs locales, con hash SHA-256 del documento completo, chunks por pagina y tags compatibles con F170.
- Se registran `2601.10336v2.pdf` y `2407.12991v2.pdf` como detectados no indexados; quedan para revision tecnica posterior y no se promueven como fuente normativa canonica.
- Nuevos comandos: `npm run prepare:f170b:canonical-reindex` y `npm run test:f170b:canonical-reindex`.

## F170 (2026-07-16) - RAG citation governance DB-backed

- Se agrega compuerta DB-backed para `document_chunks`: conteo de chunks/fuentes/modalidades, calidad de source/content/page_ref/tags y cobertura canonica NCRP/IAEA/TG/UAQ.
- Se enlaza F168 DB live, F169 QA numerico y F144 gobierno de fuentes como prerequisitos del RAG de citas.
- La fase diferencia corpus semilla de corpus amplio: permite deploy funcional con advertencias, pero exige re-seed f138/f143 antes de depender de citas documentales extensas.

## F169 (2026-07-16) - Predeploy numeric QA + DB live gate

- Se agrega compuerta predeploy que regenera F149, valida contratos F149/F168, ejecuta `shieldingMath.test.ts` y confirma DB live.
- La fase bloquea deploy funcional si falla el QA numerico normativo minimo, DB live o contratos de evidencia.
- Siguiente paso recomendado: F170 RAG/citas DB-backed o F171 canvas polish predeploy antes de reintentar deploy publico.

## F168 (2026-07-16) - DB live finalization

- Se cerro la DB live real con MySQL 8.0.46, autenticacion valida, migraciones/seed aplicados y `db-live-validation` OK.
- Se valido backup/restore probe de F153: dump con hash SHA-256, restauracion temporal 22/22 tablas y cleanup correcto.
- Se valido Node/npm instalado en Windows: Node v24.18.0, npm 11.16.0, `npm run test:f168:db-live-final`, `npm run db:validate:live` y `npm run build` OK.
- Decision: la DB ya no bloquea release local/full stack; el deploy publico sigue bloqueado por F167 hasta habilitar push a `git.chatgpt-team.site:443`.
- Siguiente paso tras URL publica: repetir F154-F158 contra HTTPS final.

## F167 (2026-07-15) - Deploy target recovery

- Se intento recuperar el flujo Sites con `project_id` existente, HEAD exacto y paquete F159 `sites-deploy-ready`.
- Codex obtuvo credencial temporal de escritura Sites, pero el push al repositorio remoto quedo bloqueado por salida a `git.chatgpt-team.site:443`.
- Por seguridad, no se ejecuto `save_site_version` ni deploy porque Sites exige fuente empujada antes de guardar version.
- Siguiente paso: habilitar egreso Codex a `git.chatgpt-team.site:443`, repetir F167, desplegar version privada y correr F154-F159 contra URL HTTPS final.

## F166 (2026-07-15) - Roadmap de siguientes fases

- Se agrega roadmap versionado con fases F167-F172.
- Se separa lo ya implementado (F159/F161/F163/F164/F165) de pendientes reales: deploy publico, DB live, QA numerico, RAG/citas, sync canvas/3D y export visual runtime.
- Decision: avanzar F167 si el target Git/hosting esta listo; si no, continuar F168/F169 localmente sin bloquear estabilizacion UI.

## F165/F161 (2026-07-15) - Salidas clinicas y manuales predeploy

- F161 agrega manual operativo in extenso predeploy con flujo real de proyecto, canvas, calculo, RAG/OCR, DB/deploy y control de versiones.
- F165 cierra pendientes utiles del mapa clinico: export SVG/PNG, clasificacion de salas OCR-ready, rutas de flujo y sincronizacion 2D/3D/reportes/evidencia.
- Se mantiene el criterio: el mapa clinico complementa el canvas CAD y no sustituye calculo normativo ni QA numerico.


## F73 (2026-07-12) - Documentacion, Update App y roadmap tecnico

- README reemplazado por documentacion tecnica real de RadShield-MX.
- Manual de usuario actualizado con F71-F73: DB, RAG, DWG, canvas y 3D.
- Update App reorganizado para mostrar estado, plataforma, normativas, DB/IA/RAG y roadmap.
- Se documenta que DWG requiere conversion externa a DXF/SVG antes de importar.
- Se formaliza que NCRP no debe reingresarse si ya existe dataset/documentos versionados; debe revalidarse por hash/version.
- Se propone estrategia de aprendizaje con memorias analiticas validadas y anonimizadas.
- Se documenta mejora de render: renderer 2D por capas, cache de assets, hit-testing espacial y 3D con LOD.

## F72 (2026-07-12) - RAG, DWG, equipos visuales, 3D y canvas

- Perfiles visuales por equipo/modalidad: LINAC, Gamma Knife, CT, PET/CT, HDR, ciclotron, SPECT y mastografia.
- Canvas renderiza fuentes con footprint e icono vectorial, no solo circulo generico.
- Medical 3D recibe footprint, asset hint y tags RAG por equipo.
- Se agrega roadmap RAG: busqueda hibrida, ledger de citas, reranking regulatorio, fingerprints y deep-dive planner.
- Se agrega declaracion de capacidades CAD: DXF/OBJ nativo, SVG/PNG overlay, DWG por conversion externa.

## F71 (2026-07-12) - Gate de reconstruccion DB

- Se agrega db:validate:live para validar tablas y seed contra MySQL real.
- Runbook DB actualizado con validacion post-seed.
- Backend health y contratos validados en modo sin DB.
- Reconstruccion real bloqueada solo por infraestructura: falta DATABASE_URL, Docker CLI y MySQL CLI.

---
# RadShield-MX — Control de Cambios

## v62 (2026-06-05) — Update Center + Zustand Etapas 1-2

### Nuevo: Update Center Dialog
- **4 tabs**: Changelog, Auditoría (55 items), Docs pendientes (10), Estado plataforma
- Progreso visual con barras de progreso
- Estado de cada item de auditoría: Completado/Pendiente/Baja prioridad
- Lista de documentos pendientes por vectorizar para RAG v70
- Estadísticas en vivo: Zustand 75/208, Tests 240/240, Auditoría 45/55 (82%)

### SplashScreen Actualizado v58 → v62
- Versión: v62 | 240 Tests | Zustand 75/208 | Auditoría 82%
- 2 nuevos features: Update Menu, Auditoria 82%
- Tests corregidos: 59 → 240 (tests pasando tras corrección de física)

### Zustand Migración: 75/208 dialogs (+27 en esta sesión)
**Etapa 1 (v60) — 12 dialogs**: memoriaWizard, planValidator, equipmentShieldingWizard, monteCarloSim, cycloneKIUBE, tutorial, cbctIgrt, layoutBunker, maintenanceLog, scenarioAnalysis, checklistCNSNS, specialCases

**Etapa 2 (v61) — 15 dialogs**: keyboardShortcuts, smartSearchDICOM, logFileAnalysis, compareMode, batchCalc, sensitivity, auditDashboard, geometrySelector, nuclideData, decayHeat, buildupFactor, exposureRateProjection, sketchPad, exampleWizard, cadImport

### Fixes Deploy
- FloorCeilingDialog import faltante
- ICRU57Dialog/ICRU96Dialog imports faltantes
- showMCResultsDialog useState eliminado accidentalmente

---

## v58 (2026-06-05) — Validación Completa + Media/Baja Prioridad

### Auditoría Implementada (50 recomendaciones)
- **A. GUI/UX 12/12 COMPLETADO**
  - A.1 Zoom centrado en cursor (mouse wheel)
  - A.2 Touch gestures: pinch zoom + two-finger pan + double-tap zoom
  - A.3 Leyendas mejoradas: tab "Leyendas" en ResultsPanel (semáforo, tipos barrera, materiales, símbolos, refs NCRP)
  - A.4 Undo/Redo visual con historial (50 pasos)
  - A.5 Onboarding Tour (react-joyride 6 pasos)
  - A.6 Preview de barrera: ghost crosshair punteado rojo + coordenadas snap
  - A.7 Command Palette (Cmd+K, 40+ comandos)
  - A.8 Keyboard shortcuts (B/F/S/M/H/G/Ctrl+Z/Ctrl+Y/Ctrl+K/Ctrl+Enter)
  - A.9 Responsive layout (useResponsiveLayout)
  - A.10 Dark mode toggle
  - A.11 High contrast mode
  - A.12 Skip-to-content + a11y announcer

- **B. Motores 10/10 COMPLETADO**
  - B.1 Multi-energy spectra support (TASMIP)
  - B.2 Self-shielding correction
  - B.3 Adaptive sampling (Monte Carlo)
  - B.4 Chilton skyshine roof scatter
  - B.5 Neutron maze calculations
  - B.6 Oblique incidence correction
  - B.7 Annual dose report
  - B.8 Cross-validation NCRP vs IAEA
  - B.9 Async WebWorker calculation engine
  - B.10 Spatial hashing + WebGPU heatmap

- **C. Código 7/10**
  - C.1 Error Boundaries (LazyDialog + ErrorBoundary)
  - C.2 Web Vitals (connected in App.tsx)
  - C.3 Sentry error tracking (@sentry/react + ErrorBoundary)
  - C.4 Unit Tests: 59 tests Vitest (shieldingMath 25, appStore 17, useCanvas 17)
  - C.5 Zustand state management: 75/208 dialogs migrados (36%)
  - C.6 Design tokens (designTokens.ts)
  - C.7 Performance profiler + dashboard

- **D. APIs Web 7/8**
  - D.1 Screen Wake Lock API (cálculos)
  - D.2 Web Share API (compartir resultados nativos)
  - D.3 File System Access API (Ctrl+S/Ctrl+O)
  - D.4 Broadcast Channel (cross-tab sync)
  - D.5 Web Share Target (manifest.json)
  - D.6 Service Worker
  - D.7 WebGPU heatmap renderer

- **E. General 4/10**
  - E.1 Excel Export (.xls multi-hoja)
  - E.2 i18n hook (useI18n)
  - E.5 Community Templates
  - E.6 GitHub-style integrations

### 5 Capas AI (Completado en v52)
1. LLM Integration (OpenAI/Ollama/LMStudio)
2. RAG (vector DB + cosine similarity, 50+ chunks)
3. ML Predictivo (TensorFlow.js NN [8→64→32→16→1])
4. Computer Vision (Canny + Hough wall detection)
5. Agentes Autónomos (ShieldingDesign + Validation + CostOptimization)

### Componentes Implementados
- **Sentry**: `src/lib/sentry.ts` — SDK completo con ErrorBoundary, breadcrumbs, user tracking
- **Ghost Barrier Preview**: `useCanvas.ts` — crosshair punteado rojo + coordenadas en tiempo real
- **Web Share Target**: `manifest.json` — share_target con accept de imágenes/JSON/DXF/STEP
- **PWA Manifest**: shortcuts, categories, theme, display:standalone
- **Unit Tests**: `src/__tests__/` — 59 tests pasando

### Zustand Migration (75 dialogs)
Batches 1-4: export, cnsns, mc, projects, maze, quickBarrier, viewer3d, equipmentDB, mcCloud, mcConfig, barrierCalculator, floorCeiling, dashboardCalc, costEstimator, cnsnsChecklist, batchImport, costOptimizer, neutron, seasonal, uncertainty, ventilation, dicom, techSpecs, cnsnsDashboard, auditTrail, epaGuidance, shleien, gammaKnife, braquiCo60, versaHD, icru57, icru96, equipmentLibrary, referenceLibrary, ncrp151Tables, shieldingCalculator, dxfViewer, dashboard, bibliography, about, glossary, themeEngine, bimConnector, cloudSync, validationDashboard, externalConnector, aiAssistant, manual

Etapa 1 (v60): memoriaWizard, planValidator, equipmentShieldingWizard, monteCarloSim, cycloneKIUBE, tutorial, cbctIgrt, layoutBunker, maintenanceLog, scenarioAnalysis, checklistCNSNS, specialCases

Etapa 2 (v61): keyboardShortcuts, smartSearchDICOM, logFileAnalysis, compareMode, batchCalc, sensitivity, auditDashboard, geometrySelector, nuclideData, decayHeat, buildupFactor, exposureRateProjection, sketchPad, exampleWizard, cadImport

Nuevo v62: updateCenter

---

## v52 (2026-05) — 5 Capas AI Completadas

### Fase 1: LLM + RAG
- Multi-provider LLM client (OpenAI, Ollama, LMStudio)
- Vector store with cosine similarity
- 50+ knowledge chunks from NCRP 151, NCRP 147, IAEA 47
- tRPC routers: ai-router.ts, rag-router.ts
- AIAssistantDialog with streaming chat

### Fase 2: ML Predictivo
- TensorFlow.js neural network [8→64→32→16→1]
- 3,000+ training data points
- Anomaly detection with Isolation Forest
- useAutoML hook with feedback loop

### Fase 3: Agentes Autónomos
- ShieldingDesignAgent: multi-step planning
- ValidationAgent: cross-reference NCRP
- CostOptimizationAgent: minimize material cost

### Fase 4: Computer Vision
- planAnalyzer.ts with Canny edge detection + Hough transform
- Automatic wall detection from floor plan images

### Fase 5: Cost Optimization Agent
- Linear programming for material selection
- Multi-objective: cost × weight × thickness

---

## v50 (2026-04) — Core Platform

### Canvas System
- HTML5 Canvas 2D with world-to-screen transforms
- Zoom, pan, grid snapping
- Barrier drawing, source placement, occupancy regions
- Selection, dragging, deletion

### Calculation Engine
- NCRP 147 Archer broad-beam transmission
- NCRP 151 TVL method for megavoltage
- AAPM TG 108 PET/CT shielding
- WebWorker async calculations
- Spatial hashing for dose grid

### UI Framework
- 8-menú toolbar system
- 208+ dialog components
- React.lazy() code splitting
- Dark mode, i18n, undo/redo
- Command palette, keyboard shortcuts

---

## v1–v49 (2025-2026) — Foundation

### v1-v25: Prototipo Inicial
- Canvas interactivo básico
- Cálculos NCRP 147/151 iniciales
- Primeros 50 diálogos

### v26-v45: Feature Expansion
- Más modalidades (Gamma Knife, HDR, Cyclotron)
- Reportes CNSNS
- Monte Carlo integration
- Biblioteca de materiales
- Sistema de proyectos

### v46-v49: Pre-AI
- WebGPU compute shaders
- File System Access API
- Broadcast Channel
- Service Worker
- Community templates

---

## Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Versión actual | v58 |
| Diálogos | 208+ |
| Tests unitarios | 59 pasando |
| Referencias bibliográficas | 82 |
| Capas AI | 5 |
| Recomendaciones auditoría | 35/50 completadas |
| APIs Web | 7 implementadas |
| Idiomas | 2 (es/en) |
| Commits desde v1 | ~500+ |
