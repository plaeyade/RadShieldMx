# RadShield-MX - Manual de Versiones

## F177 (2026-07-16) - Sites deploy retry

- Objetivo: reintentar deploy publico mediante Sites despues de F176 sin comprometer el paquete local.
- Prerrequisitos: `F159 sites-deploy-ready`, `F176 local-smoke-ready`, worktree limpio y salida HTTPS a `git.chatgpt-team.site:443`.
- Artefactos: `outputs/f177_sites_deploy_retry/f177_sites_deploy_retry.json` y `outputs/fase_177_sites_deploy_retry.md`.
- Uso: `npm run prepare:f177:sites-deploy` y `npm run test:f177:sites-deploy`.
- Guardrail: si no puede empujar el source exacto, no se ejecuta `save_site_version` ni deploy; se debe usar retry de red o deploy alterno.

## F176 (2026-07-16) - Local smoke final

- Objetivo: validar que el paquete local recuperado sirve el shell, reset de cache y assets actuales antes de volver al deploy publico.
- URL por defecto: `http://127.0.0.1:4175/`; puede cambiar con `LOCAL_SMOKE_URL`.
- Artefactos: `outputs/f176_local_smoke_final/f176_local_smoke_final.json` y `outputs/fase_176_local_smoke_final.md`.
- Uso: `npm run prepare:f176:local-smoke` y `npm run test:f176:local-smoke`.
- Guardrail: valida disponibilidad HTTP y evidencias, no sustituye el smoke visual humano ni F154-F158 contra URL final.

## F175 (2026-07-16) - Local delivery + cache recovery

- Objetivo: recuperar visualizacion de menus/canvas cuando un service worker viejo mezcle assets de builds distintos y cerrar paquete local antes del deploy publico.
- Superficie: `reset-cache.html` limpia service workers y caches `radshield-*`; `index.html` ejecuta limpieza defensiva salvo `?enable-sw=1`.
- Artefactos: `outputs/f175_local_delivery_package/f175_local_delivery_package.json`, `outputs/f175_local_delivery_package/README_F175_LOCAL_DELIVERY.md` y `outputs/fase_175_local_delivery_package.md`.
- Uso: abrir `http://127.0.0.1:4175/reset-cache.html` si `http://127.0.0.1:4174/` queda sin menus/canvas.
- Comandos: `npm run prepare:f175:local-package` y `npm run test:f175:local-package`.
- Guardrail: no cambia calculos, RAG, DB, menus canonicos ni rutas de reporte; solo limpia cache y documenta entrega local.

## F174A (2026-07-16) - Predeploy low-risk hardening

- Objetivo: agregar una capa pequena de seguridad antes del deploy sin cambiar metodologia validada ni schema DB.
- Calculo: `shieldingMath` expone validacion de entradas finitas y acota transmisiones forward al rango fisico 0..1.
- RAG: `f174aPredeployHardening` clasifica fuentes canonicas, investigacion, materiales, memorias analiticas y externas con advertencias de cita.
- Frontend: Update Center muestra `F174A Predeploy hardening` para que el estado sea visible al operador.
- Artefactos: `outputs/f174a_predeploy_hardening/f174a_predeploy_hardening.json` y `outputs/fase_174a_predeploy_hardening.md`.
- Uso: `npm run prepare:f174a:predeploy-hardening`, `npm run test:f174a:predeploy-hardening` y `npm run test:f174a:predeploy-hardening:unit`.
- Guardrail: no cambia TVL, materiales, objetivos regulatorios, formulas canonicas, migraciones DB ni seed.

## F173 (2026-07-16) - Canvas low-risk polish

- Objetivo: mejorar la lectura operativa del canvas antes del smoke visual local sin tocar calculos ni geometria.
- Superficie: `src/sections/CanvasArea.tsx` muestra `f173-canvas-hud` con seleccion, snap, objetos, evidencia, heatmap y export.
- Artefactos: `outputs/f173_canvas_low_risk_polish/f173_canvas_low_risk_polish.json` y `outputs/fase_173_canvas_low_risk_polish.md`.
- Uso: `npm run prepare:f173:canvas-polish` y `npm run test:f173:canvas-polish`.
- Guardrail: solo HUD/UX compacto; no cambia formulas, TVL, materiales ni limites regulatorios.

## F172 (2026-07-16) - Release candidate final

- Objetivo: congelar cambios grandes, reconstruir evidencia local y declarar decision formal antes del deploy final.
- Artefactos: `outputs/f172_release_candidate_final/f172_release_candidate_final.json` y `outputs/fase_172_release_candidate_final.md`.
- Uso: `npm run prepare:f172:release-final` y `npm run test:f172:release-final`.
- Criterio local: F168, F169, F170, F170B, F171, F172A, build frontend y backend deben estar listos.
- Criterio publico: repetir F154-F158 contra URL final; si el deploy target no esta disponible, F172 puede quedar `controlled-offline-ready`.
- Politica: despues de F172 no se agregan funcionalidades grandes salvo correcciones derivadas de smoke test.

## F172A (2026-07-16) - arXiv research methodology

- Objetivo: cerrar los dos documentos arXiv pendientes e integrarlos como evidencia de investigacion/metodologia sin promoverlos a norma canonica.
- Fuentes: `f172a-arxiv-2601-10336v2` para concretos de blindaje y `f172a-arxiv-2407-12991v2` para PET 511 keV concreto/plomo.
- Superficies: `MaterialComparisonDialog` muestra metodologia de concretos avanzados; `AAPMTG108PETDialog` muestra nota PET 511 keV sobre buildup/MC.
- Artefactos: `outputs/f172a_arxiv_research/f172a_arxiv_research.json` y `outputs/fase_172a_arxiv_research.md`.
- Uso: `npm run prepare:f172a:arxiv-research` y `npm run test:f172a:arxiv-research`.
- Politica: uso `research-methodology-only`; los valores de calculo siguen gobernados por NCRP, IAEA, AAPM TG-108 y UAQ.

## F171 (2026-07-16) - Canvas polish predeploy

- Objetivo: cerrar una mejora visual y contractual del canvas antes del deploy, manteniendo bajo riesgo operativo.
- Superficie: `src/sections/CanvasArea.tsx` muestra `f171-canvas-polish-predeploy` con estado de grips, cotas, snapping, seleccion, heatmap, propiedades y export.
- Artefactos: `outputs/f171_canvas_polish_predeploy/f171_canvas_polish_predeploy.json` y `outputs/fase_171_canvas_polish_predeploy.md`.
- Uso: `npm run prepare:f171:canvas-polish` y `npm run test:f171:canvas-polish`.
- Criterio: F170 debe estar listo y sin warnings; F171 no modifica formulas ni valores normativos.

## F170B (2026-07-16) - Reindexacion canonica NCRP147/TG108

- Objetivo: cerrar la brecha detectada por F170 para `NCRP147` y `TG108` con fuentes PDF versionadas por hash en `document_chunks`.
- Fuentes: `f170b-ncrp147` y `f170b-aapm-tg108`.
- Artefactos: `outputs/f170b_canonical_reindex/f170b_canonical_reindex.json` y `outputs/fase_170b_canonical_reindex.md`.
- Uso: `npm run prepare:f170b:canonical-reindex`, `npm run test:f170b:canonical-reindex`, luego repetir `npm run prepare:f170:rag-citations`.
- Nota: los PDFs arXiv subidos se registran como detectados no indexados hasta tener politica documental y utilidad clinica definida.

## F170 (2026-07-16) - RAG citation governance DB-backed

- Artefactos: `outputs/f170_rag_citation_governance/f170_rag_citation_governance.json` y `outputs/fase_170_rag_citation_governance.md`.
- Resultado esperado: `rag-citation-governance-ready` con DB live, F169 y F144 listos, mas corpus minimo en `document_chunks`.
- Uso: `npm run prepare:f170:rag-citations` y `npm run test:f170:rag-citations`.
- Nota: un corpus `minimum-seed-corpus` permite deploy funcional, pero no reemplaza la reingesta amplia f138/f143 para memorias documentales completas.

## F169 (2026-07-16) - Predeploy numeric QA + DB live gate

- Artefactos: `outputs/f169_predeploy_numeric_db_qa/f169_predeploy_numeric_db_qa.json` y `outputs/fase_169_predeploy_numeric_db_qa.md`.
- Resultado esperado: `predeploy-numeric-ready` si pasan F149, F168 y pruebas `shieldingMath`.
- Uso: `npm run prepare:f169:numeric-db-qa` y `npm run test:f169:numeric-db-qa`.
- Criterio: bloquea deploy funcional si hay fallo numerico normativo, DB live o contrato de evidencia.

## F168 (2026-07-16) - DB live finalization

- Artefactos: `outputs/f168_db_live_finalization/f168_db_live_finalization.json` y `outputs/fase_168_db_live_finalization.md`.
- Resultado esperado: `db-live-ready` cuando MySQL, migracion/seed, validacion live, backup, restore probe y cleanup pasen.
- Seguridad: no se publica password ni `DATABASE_URL`; solo host, puerto, base y presencia de credenciales.
- Entorno Windows validado: Node v24.18.0, npm 11.16.0 y build productivo via `npm run build`.
- Scripts: `npm run prepare:f168:db-live-final` y `npm run test:f168:db-live-final`.

## F167 (2026-07-15) - Deploy target recovery

- Artefactos: `outputs/f167_deploy_target_recovery/f167_deploy_target_recovery.json` y `outputs/fase_167_deploy_target_recovery.md`.
- Resultado: `deploy-network-gated`; F159 esta listo, pero Codex no alcanza `git.chatgpt-team.site:443`.
- No se guarda version ni se despliega porque el source commit no pudo empujarse al repositorio Sites.
- Scripts: `npm run prepare:f167:deploy-target` y `npm run test:f167:deploy-target`.

## F166 (2026-07-15) - Roadmap de siguientes fases

- Artefactos: `outputs/f166_next_phases_roadmap/f166_next_phases_roadmap.json` y `outputs/fase_166_next_phases_roadmap.md`.
- Fases recomendadas: F167 deploy public smoke, F168 DB live, F169 QA numerico, F170 RAG/citas live, F171 canvas clinical sync y F172 release candidate final.
- Puntos ya implementados: F159, F161, F163, F164 y F165.
- Scripts: `npm run prepare:f166:roadmap` y `npm run test:f166:roadmap`.

## F161 (2026-07-15) - Manuales in extenso predeploy

- Se agrega outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md como runbook unico de operacion antes del deploy final.
- Cubre flujo operativo, canvas/floorplan, calculo/evidencia, RAG/OCR, DB/deploy, Update App y control de versiones.
- Scripts: npm run prepare:f161:manuales y npm run test:f161:manuales.
- Criterio de salida: manuals-ready, build productivo, F164/F165/F159 validados y smoke post-deploy contra URL final.


## v50.3 (2025-06-03) — Implementacion Completa Auditoria

### Nuevas Funciones (9 modulos)

| Modulo | Archivo | Descripcion | Referencia |
|--------|---------|-------------|------------|
| NCRP Validation Suite | `NCRPValidationSuite.ts` + `NCRPValidationDialog.tsx` | 24 casos de validacion vs tablas NCRP 147/151 | NCRP 147, NCRP 151, Simpkin 1996, BIR 2012 |
| CT Scatter Database | `CTScatterDatabase.ts` | 22 modelos de CT (GE/Siemens/Philips/Canon) con kappa especifico | Larson 2007, AAPM TG 293 |
| AAPM TG 108 PET | `AAPMTG108PETDialog.tsx` | Calculador PET con kerma semanal por procedimiento | AAPM TG 108 (2006) |
| IPEM Report 109 SPECT | `IPEMReport109.ts` + `IPEMReport109Dialog.tsx` | Blindaje SPECT/SPECT-CT con 7 radionuclidos | IPEM Report 109 (2014) |
| Chilton Skyshine | `ChiltonSkyshine.ts` + `ChiltonSkyshineDialog.tsx` | Skyshine para radioterapia MV con graficas | NCRP 151 Sec. 5.4, Chilton 1963 |
| Therapy Shielding | `TherapeuticRadionuclideShielding.ts` + `TherapyShieldingDialog.tsx` | Blindaje Y-90, Lu-177, Ac-225, I-131, Ra-223 | ICRP 128, 140; AAPM TG 377 |
| Decay Chains | `DecayChains.ts` + `DecayChainsDialog.tsx` | Mo-99/Tc-99m, Ge-68/Ga-68, Sr-82/Rb-82, W-188/Re-188 | ICRP 107 |
| Compare Scenarios | `CompareScenariosDialog.tsx` | Comparacion side-by-side con delta resaltado | — |
| Tornado Sensitivity | `TornadoSensitivityDialog.tsx` | Analisis de sensibilidad +/-20% por parametro | MicroShield Pro, AAPM TG 1008 |

### Nuevas Referencias Bibliograficas (+30)
- REF045-REF074: Radiofarmacia GMP, IAEA TCS-88, WHO TRS 1025, EMA CHMP/QWP, EANM cGRPP, ININ LANIDER

### Total de Referencias: 74

---

## v50.2 (2025-06-03) — 5 Recomendaciones Criticas

### Implementadas
1. **VV-01**: NCRP Validation Suite — 24 casos vs tablas oficiales
2. **VV-03**: CT Scatter Database por modelo (22 scanners)
3. **MC-01**: AAPM TG 108 PET Shielding Calculator
4. **UI-01**: Compare Scenarios side-by-side
5. **VV-11**: Tornado Sensitivity Analysis

---

## v50.1 (2025-06-02) — Optimizaciones y GMP

### Implementadas
- AsyncShieldingEngine con Morton code spatial hashing
- CanvasRenderer con 3 capas (bg/static/dynamic)
- Profiler de rendimiento en tiempo real
- GMP Certification para laboratorios de ciclotron (59 requisitos)
- 30 nuevas referencias bibliograficas de radiofarmacia GMP
- Service Worker v50 con cache de calculos
- GlobalErrorBoundary a nivel top-level

---

## v50 (2025-05-28) — Auditoria de Rendimiento

### Optimizaciones
- Spatial hashing con Morton codes (50x mas rapido)
- WebWorker offload para calculos
- Object pooling y HeatmapLUT
- Canvas layer architecture con dirty tracking
- Responsive layout hook
- Skip-to-content (WCAG 2.1)

---

*Documento generado el 2025-06-03*
*Total de modulos: 180+ dialogos y componentes*
*Total de lineas de codigo: ~76,000*
*Total de referencias bibliograficas: 74*
