# RadShield-MX - Manual de Versiones

# F375 (2026-07-30) - Modo canvas limpio / guia

- Nuevo modo **CAD Limpio:** oculta overlays auxiliares grandes y deja una tira compacta con estado del flujo.
- Nuevo modo **CAD Guia:** restaura paneles de estudio, escenas, mini vistas y export visual para QA.
- El cambio se persiste en localStorage y no reescribe el renderer ni eventos base.
- Al entrar a modo limpio se ocultan paneles flotantes `workflow/qa/continuity` y se colapsa la leyenda.
- Objetivo: reducir obstrucciones sobre el floorplan y mantener rutas de inspeccion cuando se necesiten.
- Scripts: `npm run test:f375:clean-workspace` y `npm run test:f375:clean-workspace-smoke`.

# F374 (2026-07-30) - Acciones rapidas y dock CAD

- Sidebar: los accesos **Calc**, **UAQ**, **Mem**, **Mat** y **DXF** ahora tienen ejecucion directa, fallback de dialogo y confirmacion visible.
- Toolbar: favoritos persistentes **Memoria**, **Evidencia**, **Validar** y **Heatmap** muestran confirmacion al enviarse.
- Canvas: nuevo dock CAD inferior con **Plano**, **Muro**, **Fuente**, **Zona**, **Calc**, **3D** y **Evid**.
- Objetivo: reducir botones desconectados y dar al usuario una ruta operacional clara desde plano a calculo/evidencia.
- Guardrail: no se reescribe el renderer base ni el sistema de eventos profundo en esta fase.
- Scripts: `npm run test:f374:quick-canvas` y `npm run test:f374:quick-canvas-smoke`.

# F371-F372 (2026-07-28) - Smoke beta visual y paquete estatico

- F371 valida en navegador la superficie principal antes de publicar: canvas visible, sidebar estable, menu Archivo alineado, boton derecho del canvas, Memoria IA, PDF Report, Evidence Pack y Medical 3D.
- El smoke guarda capturas PNG en `outputs/f371_f372_beta_visuals/`.
- Tambien genera `f371_f372_three_unity_memoria_flow.html`, una lamina visual que explica como conviven Three/R3F, Unity WebGL externo, motores externos y memoria analitica.
- F372 genera `outputs/f372_beta_static_package/radshield-mx-f372-static-beta.zip` desde `dist/`.
- El paquete es frontend beta estatico. No afirma Monte Carlo clinico certificado, Unity embebido, Babylon activo, DWG nativo ni memoria firmada.
- Scripts: `npm run test:f371-f372:beta-visual`, `npm run prepare:f372:beta-package` y `npm run test:f371-f372:beta-contracts`.

# F367-F370 (2026-07-28) - Integracion beta: evidencia 3D, Unity, motores externos y fotorrealismo

- F367 conecta la evidencia visual 3D con Memoria IA, PDF Report, Evidence Pack y Update Center.
- F368 formaliza Unity WebGL como visor externo por URL/handoff, con fallback Three/R3F.
- F369 formaliza runners externos GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy; tambien consolida fotorrealismo avanzado en Three/R3F y deja Babylon pendiente.
- F370 define release beta frontend con claims bloqueados: MC clinico certificado, DWG nativo en navegador, Babylon runtime y memoria firmada sin revision profesional.
- Artefactos: `outputs/f367_f370_release_integration/f367_f370_release_integration.json` y `.md`.
- Scripts: `npm run prepare:f367-f370:release-integration` y `npm run test:f367-f370:release-integration`.

# F365-F366 (2026-07-28) - Paquete de evidencia visual 3D

- F365 convierte cada captura PNG de Medical 3D en evidencia trazada con preset, hash visual, checklist y estacion activa.
- F366 agrega compuerta QA visual para saber si faltan capturas de vista general, barreras, equipos o dosis.
- Exporta `medical_3d_visual_evidence_pack_*.json` con capturas, checklist, bookmarks, politica minima y disclaimer.
- Uso: anexar a Memoria IA, PDF Report, Evidence Pack o CNSNS/UAQ como evidencia visual no certificable.
- Guardrail: no cambia calculos, citas, renderer base, import DXF/IFC ni motores externos.
- Script: `npm run test:f365-f366:visual-evidence-pack`.

# F364 (2026-07-28) - Three/R3F flujo visual de revision

- Agrega presets visuales 3D para revisar sala completa, barreras, equipos, dosis y recorrido.
- Dibuja dentro de Three/R3F la ruta de estaciones F147 con marcadores numerados.
- Muestra checklist de captura visual para evitar que Memoria IA/PDF/Evidence Pack queden sin evidencia basica.
- Exporta `medical_3d_visual_workflow_*.json` con secuencia de captura, bookmarks, checklist y hash visual.
- No agrega dependencias ni cambia el motor de calculo.
- Script: `npm run test:f364:three-visual-workflow`.

# F363 (2026-07-28) - Three/R3F inspeccion y Babylon readiness

- Medical 3D conserva Three/R3F como runtime estable y agrega overlays de inspeccion visual para materiales, equipos, haces y cotas.
- El operador puede activar o apagar ayudas visuales sin cambiar el calculo base ni romper el canvas principal.
- El paquete de revision exporta readiness de Babylon para saber si esta listo, bloqueado o pendiente de dependencias.
- Rutas recomendadas para Babylon: `npm install @babylonjs/core @babylonjs/loaders`, cache local `.npm-cache-babylon`, `pnpm add` via Corepack o tarballs locales cuando la red/registry falle.
- Unity WebGL queda diferido a una fase posterior por riesgo de peso, build y hosting.
- Script: `npm run test:f363:three-babylon-readiness`.

# F361 (2026-07-26) - Reparacion post-beta

- Artefactos: `outputs/f361_post_beta_repair/f361_post_beta_repair.json`, `f361_kiube_document_chunks.jsonl`, `f361_kiube_document_chunks_db_draft.json` y `f361_manual_update_matrix.csv`.
- Repara menu contextual de canvas con boton derecho, ventanas arrastrables/minimizables/expandibles, fallbacks de acceso rapido y alineacion del menu Archivo.
- El boton Update Center debe abrir `updateCenter`; no usar `updateApp` como dialog name.
- El PDF Cyclone KIUBE MID 55672 Rev G se conserva como evidencia RAG cuando el modelo tecnico ya existe en codigo, evitando duplicar calculos.
- La beta F356-F360 queda condicionada a validar F361 en navegador antes de llamarla beta publicable.
- Scripts: `npm run prepare:f361:post-beta-repair` y `npm run test:f361:post-beta-repair`.

# F356-F360 (2026-07-26) - Release beta operativo

- Artefactos: `outputs/f356_f360_beta_release/f356_f360_beta_release.json`, `f356_f360_beta_release_visual.svg`, `f356_f360_beta_release.html`, `f356_user_test_checklist.csv`, `f357_missing_data_capture.csv`, `f358_traceable_preliminary_calculations.csv`, `f359_memoria_beta_preliminar.md` y `radshield_f356_f360_beta_release.zip`.
- F356 define la prueba real de usuario: abrir app, menu Archivo, carga de plano, canvas, Memoria IA, Evidence Pack, Medical 3D y reportes.
- F357 lista datos faltantes que el usuario debe completar: geometria definitiva, fuente, workload, TVL/densidad, penetraciones, estructura y revision final.
- F358 genera calculos preliminares trazables con formula, norma, inputs, outputs, supuestos, advertencias y hash, sin espesor firmado.
- F359 prepara memoria beta preliminar y F360 formaliza release como beta operativa no certificada.
- Scripts: `npm run prepare:f356-f360:beta-release` y `npm run test:f356-f360:beta-release`.

# F350-F355 (2026-07-26) - Paquete real preliminar de operador

- Artefactos: `outputs/f350_f355_real_test_package/f350_f355_real_test_package.json`, `f350_f355_visual_smoke.svg`, `f350_f355_visual_smoke.html`, `f351_memoria_preliminar.md`, `f352_missing_data_closeout.csv`, `f353_report_evidence_draft.html`, `f354_consistency_matrix.csv`, `f355_operator_package_manifest.csv` y `radshield_f350_f355_real_test_package.zip`.
- Usa etiquetas fuente/proveedor reales cuando estan disponibles, geometria de flujo Centro Neuro 1:100, TVL/densidad candidata con hash y penetraciones estandar derivadas de memorias.
- La revision FM/RSO queda omitida solo para prueba de flujo; bloquea memoria firmada y mantiene `signedCalculationProduced=false`.
- Resultado esperado: `real-test-package-ready-preliminary-not-certified`.
- Scripts: `npm run prepare:f350-f355:real-test-package` y `npm run test:f350-f355:real-test-package`.

# F349 (2026-07-26) - QA cierre superficies de evidencia

- Artefactos: `outputs/f349_evidence_surface_qa_close/f349_evidence_surface_qa_close.json`, `f349_qa_checks.csv`, `f349_evidence_surface_qa.svg` y `outputs/fase_349_evidence_surface_qa_close.md`.
- Valida manifiesto F348, cinco superficies, veinte bindings, Canvas, Memoria IA, Evidence Pack, visuales y ausencia de calculo firmado.
- Resultado esperado: `evidence-surface-qa-ready`.
- Scripts: `npm run prepare:f349:evidence-surface-qa-close` y `npm run test:f349:evidence-surface-qa-close`.

# F348 (2026-07-26) - Handoff a superficies de app/reporte

- Artefactos: `outputs/f348_app_surface_evidence_handoff/f348_app_surface_evidence_handoff.json`, `f348_surface_bindings.csv`, `f348_app_surface_handoff.svg`, `f348_app_surface_handoff.html` y `outputs/fase_348_app_surface_evidence_handoff.md`.
- Conecta F347 a cinco superficies: Canvas evidence sidebar, Memoria IA, Evidence Pack, PDF draft y Medical 3D.
- Genera veinte bindings preliminares no firmables.
- Scripts: `npm run prepare:f348:app-surface-evidence-handoff` y `npm run test:f348:app-surface-evidence-handoff`.

# F347 (2026-07-26) - Bloques de evidencia para Memoria IA

- Artefactos: `outputs/f347_memoria_evidence_blocks/f347_memoria_evidence_blocks.json`, `f347_memoria_blocks.csv`, `f347_memoria_checklist.csv`, `f347_memoria_evidence_visual.svg`, `f347_memoria_evidence_visual.html` y `outputs/fase_347_memoria_evidence_blocks.md`.
- Convierte F346 en cuatro bloques preliminares: LINAC Versa HD, Gamma Knife Esprit, Cyclone KIUBE y radiofarmacia/hot lab.
- Cada bloque incluye resumen, metodo, entradas, salidas esperadas, supuestos, advertencias, citas pendientes y checklist.
- Habilita handoff a Memoria IA, PDF y Evidence Pack, pero conserva `signedCalculationProduced=false`.
- Scripts: `npm run prepare:f347:memoria-evidence-blocks` y `npm run test:f347:memoria-evidence-blocks`.

# F346 (2026-07-25) - Parametros estandar draft

- Artefactos: `outputs/f346_standard_parameter_draft/f346_standard_parameter_draft.json`, `f346_parameterized_barrier_matrix.csv`, `f346_gate_status.csv`, `f346_standard_parameter_visual.svg`, `f346_standard_parameter_visual.html` y `outputs/fase_346_standard_parameter_draft.md`.
- Agrega geometria estandar por modalidad: bunker LINAC, sala Gamma Knife, vault ciclotron y radiofarmacia/hot lab.
- Agrega termino fuente estandar draft para Versa HD 15 MeV, Gamma Knife Esprit, Cyclone KIUBE 18 MeV y hot lab.
- Agrega concreto alta densidad como material candidato: densidad draft, TVL candidato y carga estructural por m2.
- Agrega penetraciones tipicas: HVAC, conduits, puerta/laberinto, sleeves piso/techo y exhaust ciclotron.
- Mantiene calculos firmables bloqueados hasta citas versionadas y revision FM/RSO final.
- Scripts: `npm run prepare:f346:standard-parameter-draft` y `npm run test:f346:standard-parameter-draft`.

# F345 (2026-07-25) - Paquete draft de calculo visual

- Artefactos: `outputs/f345_centro_neuro_draft_calculation_packet/f345_centro_neuro_draft_calculation_packet.json`, `f345_barrier_draft_calculation_matrix.csv`, `f345_calculation_gate_status.csv`, `f345_visual_progress.svg`, `f345_visual_progress.html` y `outputs/fase_345_centro_neuro_draft_calculation_packet.md`.
- Crea 24 filas draft de barrera: norte, sur, este, oeste, piso y techo para LINAC, Gamma Knife, ciclotron y radiofarmacia/hot lab.
- Cada fila incluye escala, colindancia, ocupacion, metodo, norma, entradas requeridas, advertencias y estado de salida.
- No produce espesor firmable; fuente, material, geometria, penetraciones y revision final siguen como compuertas.
- Scripts: `npm run prepare:f345:centro-neuro-draft-calculation-packet` y `npm run test:f345:centro-neuro-draft-calculation-packet`.

# F344 (2026-07-25) - Marcado de colindancias publico en general

- Artefactos: `outputs/f344_centro_neuro_public_occupancy_markup/f344_centro_neuro_public_occupancy_markup.json`, `f344_canvas_layers.csv`, `f344_barrier_public_adjacencies.csv` y `outputs/fase_344_centro_neuro_public_occupancy_markup.md`.
- Escala: `1:100` confirmada para trazado y preflight. La verificacion con cota conocida sigue recomendada antes de calculo firmable.
- Colindancia por defecto: `publico en general`.
- Ocupacion draft: `T=1` para criterio conservador inicial.
- Revision FM/RSO: se difiere al gate final y no bloquea el dibujo, las capas ni el marcado operativo.
- Scripts: `npm run prepare:f344:centro-neuro-public-occupancy-markup` y `npm run test:f344:centro-neuro-public-occupancy-markup`.

# F343 (2026-07-25) - Preflight Centro Neuro con equipos reales

- Artefactos: `outputs/f343_centro_neuro_preflight/f343_centro_neuro_preflight.json`, `f343_equipment_preflight.csv`, `f343_occupancy_penetration_worksheet.csv` y `outputs/fase_343_centro_neuro_preflight.md`.
- Equipos recibidos: Elekta Versa HD con energia maxima 15 MeV, Elekta Gamma Knife Esprit e IBA Cyclone KIUBE 18 MeV.
- Carga maxima: se usa solo como supuesto conservador de planeacion; no genera memoria firmable.
- Compuertas obligatorias: termino fuente, ocupacion, penetraciones, TVL/densidad versionada, escala verificada y revision RSO/fisico medico.
- Material inicial: concreto alta densidad en estado draft, pendiente de ficha TVL/densidad/peso/costo/tiempo/cita/hash.
- Scripts: `npm run prepare:f343:centro-neuro-preflight` y `npm run test:f343:centro-neuro-preflight`.

# F342 (2026-07-25) - Evidencia visual Centro Neuro

- Artefactos: `outputs/f342_centro_neuro_visual_evidence/f342_centro_neuro_visual_evidence.json`, `f342_visual_review.html`, `outputs/fase_342_centro_neuro_visual_evidence.md` y capturas en `outputs/f342_centro_neuro_browser_smoke/`.
- Resume visualmente escala 1:100, concreto alta densidad draft, fuentes por modalidad y pendientes.
- El smoke visual captura canvas, Update Center, Medical 3D, Memoria IA, Evidence Pack y tablero visual del caso.
- Uso permitido: revision visual, comunicacion con operador y evidencia de QA.
- Uso no permitido: certificacion de blindaje sin entradas clinicas/normativas completas.
- Scripts: `npm run prepare:f342:centro-neuro-visual-evidence`, `npm run test:f342:centro-neuro-visual-evidence` y `npm run test:f342:browser-smoke`.

# F341 (2026-07-25) - Centro Neuro con escala/material/fuentes

- Artefactos: `outputs/f341_centro_neuro_calibrated_trial/f341_centro_neuro_calibrated_trial.json`, `f341_source_terms.json`, `f341_penetrations_occupancy_todo.json`, `f341_operator_inputs.csv` y `outputs/fase_341_centro_neuro_calibrated_trial.md`.
- Escala recibida: `1:100`. Escala provisional del render: `0.01693333 m/px` a 150 dpi.
- Fuentes preparadas: ciclotron/CY, Gamma Knife-LGK/TX y LINAC/TX.
- Material por defecto de prueba: concreto alta densidad, con TVL/densidad versionada pendiente antes de calculo firmable.
- Penetraciones y ocupacion quedan abiertas como entradas obligatorias de operador.
- Scripts: `npm run prepare:f341:centro-neuro-calibrated-trial`, `npm run test:f341:centro-neuro-calibrated-trial` y `npm run test:f341:browser-smoke`.

# F340 (2026-07-25) - Prueba operativa Centro Neuro

- Artefactos: `outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_operator_trial.json`, `f340_canvas_import_plan.json`, `f340_calculation_dry_runs.csv`, `f340_centro_neuro_overlay.svg` y `outputs/fase_340_centro_neuro_operator_trial.md`.
- Convierte F339 en una prueba de operador lista para canvas/floorplan.
- Capas definidas: PDF base, zonas controladas, salas/equipos, barreras, anotaciones/citas, heatmap/isodosis y carga estructural.
- Prepara placeholders de ciclotron, Gamma Knife y LINAC con metadatos obligatorios por equipo.
- Prepara dry-runs de calculo, pero bloquea resultados firmables hasta calibrar escala y confirmar fuente, ocupacion, material, puertas/laberintos/penetraciones y revision calificada.
- Scripts: `npm run prepare:f340:centro-neuro-operator-trial` y `npm run test:f340:centro-neuro-operator-trial`.

# F339 (2026-07-25) - Caso real Centro Neuro

- Artefactos: `outputs/f339_real_case_centro_neuro/f339_real_case_centro_neuro.json`, `f339_floorplan_seed_candidate.json`, `f339_trial_scenarios.csv`, `centro_neuro_page-1.png` y `outputs/fase_339_real_case_centro_neuro.md`.
- Fuente: `CENTRO NEURO PLANTA BAJA 040626.pdf`, PDF AutoCAD de una pagina.
- SHA256 esperado: `52b5fb7179fd62b849abcbcc1bf94c807dae71a58f219c6095a713e0a32c713c`.
- Escenarios preparados: ciclotron/CY, Gamma Knife-LGK/TX y LINAC/TX.
- Radiofarmacia queda como contexto NM para flujo de area controlada, hot lab y adyacencias.
- Uso permitido: prueba operativa de importacion visual, trazado, equipos, Medical 3D, Memoria IA y Evidence Pack.
- Uso no permitido: emitir espesores firmables sin calibracion de escala, source terms, ocupacion, materiales y revision calificada.
- Scripts: `npm run prepare:f339:real-case-centro-neuro` y `npm run test:f339:real-case-centro-neuro`.

# F331-F338 (2026-07-25) - Static release close

- Artefactos: `outputs/f331_f338_static_release_close/f331_f338_static_release_close.json`, `outputs/f331_f338_static_release_close/f331_f338_modality_visual_qa.csv`, `outputs/f331_f338_static_release_close/radshield-mx-f338-static-release.zip` y `outputs/fase_331_338_static_release_close.md`.
- F331: QA visual Medical 3D por modalidad.
- F332: contrato de capturas/`sceneHash` hacia Memoria IA, PDF y Evidence Pack.
- F333: cola de QA numerico clinico antes de uso firmado.
- F334: consolidacion materiales + estructura para release.
- F335: cierre RAG/documentos con hashes y chunks.
- F336: superficies finales de reportes y evidencia.
- F337: gate canvas/floorplan con F229/F231-F236.
- F338: paquete estatico listo para deploy/manual upload.
- Scripts: `npm run prepare:f331-f338:static-release-close` y `npm run test:f331-f338:static-release-close`.

# F325-F330 (2026-07-25) - Medical 3D photoreal readiness

- Artefactos: `outputs/f325_f330_medical_3d_photoreal/f325_f330_medical_3d_photoreal.json` y `outputs/fase_325_330_medical_3d_photoreal.md`.
- F325: recorrido WASD con colisiones contra muros y equipos para no atravesar barreras.
- F326: perfiles PBR por familia de material: plomo, acero, vidrio plomado, mamposteria alta densidad y concreto.
- F327: presets de iluminacion clinica, inspeccion y recorrido.
- F328: contrato de assets `GLB/GLTF/PNG/SVG` para equipos y handoff de visor.
- F329: recorrido fotoreal dentro de Three/R3F, sin activar Babylon todavia.
- F330: evidencia visual con `sceneHash` para Memoria IA, PDF y Evidence Pack.
- Scripts: `npm run prepare:f325-f330:medical-3d-photoreal` y `npm run test:f325-f330:medical-3d-photoreal`.

# F324 (2026-07-25) - Pointer-lock walkthrough

- Artefactos: `outputs/f324_pointer_lock_walkthrough/f324_pointer_lock_walkthrough.json` y `outputs/fase_324_pointer_lock_walkthrough.md`.
- Medical 3D agrega `Mouse-look` opcional dentro de `Recorrido WASD`.
- Flujo: activar recorrido, activar Mouse-look, hacer click dentro de la escena, usar mouse para mirar y `Esc` para liberar cursor.
- Conserva `Shift`, `Ctrl`, `R/F`, limites de sala y OrbitControls fuera de recorrido.
- No modifica calculos, RAG, reportes ni exportaciones.
- Scripts: `npm run prepare:f324:pointer-lock-walkthrough` y `npm run test:f324:pointer-lock-walkthrough`.

# F317-F323 (2026-07-25) - Medical 3D release line

- Artefactos: `outputs/f317_f323_medical_3d_release_line/f317_f323_medical_3d_release_line.json` y `outputs/fase_317_323_medical_3d_release_line.md`.
- F317: matriz de smoke visual Three/R3F para seis modalidades y tres modos.
- F318: desbloqueo de dependencias Babylon; sigue bloqueado por `EACCES` npm/registry.
- F319-F321: prototipo Babylon bajo runtime gate, materiales PBR y compuerta WebGPU/WebXR.
- F322: prueba de Unity WebGL externo cuando exista URL publicada.
- F323: snapshots, bookmarks y hashes de escena para Memoria IA, PDF y Evidence Pack.
- WASD mejora con Shift, Ctrl, R/F y limites de sala.
- Scripts: `npm run prepare:f317-f323:medical-3d-release-line` y `npm run test:f317-f323:medical-3d-release-line`.

# F316 (2026-07-25) - Babylon dependency diagnostics

- Artefactos: `outputs/f316_babylon_install_diagnostics/f316_babylon_install_diagnostics.json` y `outputs/fase_316_babylon_install_diagnostics.md`.
- Se agrega diagnostico repetible para activar Babylon sin dejar cambios parciales si npm falla.
- Estado actual: el loader y adapter estan listos, pero la instalacion de paquetes queda bloqueada por `EACCES` hacia `registry.npmjs.org`.
- Accion requerida: corregir salida npm/registry o proxy, instalar `@babylonjs/core` y `@babylonjs/loaders`, repetir F314/F316/build/smoke visual.
- Scripts: `npm run prepare:f316:babylon-install-diagnostics` y `npm run test:f316:babylon-install-diagnostics`.

# F315 (2026-07-25) - Unity external viewer bridge

- Artefactos: `outputs/f315_unity_external_viewer_bridge/f315_unity_external_viewer_bridge.json` y `outputs/fase_315_unity_external_viewer_bridge.md`.
- `src/lib/medical3D/unityExternalViewerBridge.ts` crea el paquete de lanzamiento Unity con URL opcional, resumen de sala, conteo de muros/equipos/zonas y fallback Three/R3F.
- Medical 3D muestra el estado de Unity externo, exporta `medical_3d_unity_handoff_*.json` y habilita `Abrir Unity` solo si existe `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.
- Unity sigue fuera del bundle React; se permite para inspeccion, recorrido y demo visual, no para calculo certificado.
- Scripts: `npm run prepare:f315:unity-external-viewer-bridge` y `npm run test:f315:unity-external-viewer-bridge`.

# F314 (2026-07-25) - Babylon runtime loader

- Artefactos: `outputs/f314_babylon_runtime_loader/f314_babylon_runtime_loader.json` y `outputs/fase_314_babylon_runtime_loader.md`.
- Se agrega `src/lib/medical3D/babylonRuntimeLoader.ts` con carga dinamica y fallback obligatorio a Three/R3F.
- Intento de instalacion: `npm install @babylonjs/core @babylonjs/loaders`; no completo en este entorno restringido.
- Activacion futura: instalar paquetes, activar `VITE_MEDICAL_3D_BABYLON_ADAPTER=true` y `VITE_MEDICAL_3D_BABYLON_RUNTIME=true`, repetir smoke visual.
- Scripts: `npm run prepare:f314:babylon-runtime-loader` y `npm run test:f314:babylon-runtime-loader`.

# F313 (2026-07-25) - NIST XCOM mixture/RAG

- Artefactos: `outputs/f313_nist_xcom_mixture_rag/f313_nist_xcom_mixture_rag.json`, `f313_xcom_rag_seed_candidate.jsonl` y `outputs/fase_313_nist_xcom_mixture_rag.md`.
- `src/lib/xcomAttenuation.ts` agrega `XCOM_SOURCE_TRACE`, normalizacion de fracciones por peso y calculo de mezcla XCOM.
- `NistXcomDialog` muestra comparador de mezcla con densidad, `mu/rho`, `mu` lineal y TVL derivado.
- Uso permitido: apoyo de atenuacion fotonica, comparacion de materiales y evidencia RAG con hash.
- Uso no permitido: reemplazar metodologia NCRP/IAEA/UAQ o certificar TVL broad-beam MV sin validacion normativa.
- Scripts: `npm run prepare:f313:nist-xcom-mixture-rag` y `npm run test:f313:nist-xcom-mixture-rag`.

# F312 (2026-07-25) - Unity external handoff

- Artefactos: `outputs/f312_unity_external_handoff/f312_unity_external_handoff.json` y `outputs/fase_312_unity_external_handoff.md`.
- Se agrega `src/lib/medical3D/unityWebglHandoff.ts` para definir el puente externo Unity WebGL.
- Unity no se instala en el frontend ni en `package.json`; debe publicarse como build externo y consumirse por URL.
- Flags futuros: `VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER=true` y `VITE_MEDICAL_3D_UNITY_WEBGL_URL=<url-del-build>`.
- RadShield-MX sigue siendo la fuente de verdad para calculos, citas, advertencias, Memoria IA, PDF y Evidence Pack.
- Scripts: `npm run prepare:f312:unity-external-handoff` y `npm run test:f312:unity-external-handoff`.

# F311 (2026-07-25) - Babylon safe adapter

- Artefactos: `outputs/f311_babylon_safe_adapter/f311_babylon_safe_adapter.json` y `outputs/fase_311_babylon_safe_adapter.md`.
- Se agrega `src/lib/medical3D/babylonAdapter.ts` como contrato de integracion sin importar Babylon en runtime.
- Flags futuros: `VITE_MEDICAL_3D_BABYLON_ADAPTER=true` y `VITE_MEDICAL_3D_BABYLON_RUNTIME=true`.
- Politica: instalar `@babylonjs/core` y `@babylonjs/loaders` solo despues de F310 operativo, en rama/flag, con fallback obligatorio a Three/R3F.
- Scripts: `npm run prepare:f311:babylon-safe-adapter` y `npm run test:f311:babylon-safe-adapter`.

# F310 (2026-07-25) - Real operator Three/R3F trial

- Artefactos: `outputs/f310_real_operator_trial_three_r3f/f310_real_operator_trial_three_r3f.json`, `f310_operator_checklist.csv` y `outputs/fase_310_real_operator_three_r3f.md`.
- Objetivo: preparar una corrida operativa real del visor Medical 3D manteniendo Three.js/React Three Fiber como motor activo.
- Checklist: cargar plano/proyecto, calibrar escala, sembrar equipo, asignar material, calcular blindaje, revisar 3D, exportar PNG/OBJ/JSON/handoff y generar Memoria IA/PDF/Evidence Pack.
- Babylon.js se instala despues en rama/flag con dynamic import, fallback a Three/R3F y smoke visual.
- Unity WebGL queda como visor externo final con bridge JSON/GLTF; no se instala dentro del frontend estable.
- Scripts: `npm run prepare:f310:real-operator-three-r3f` y `npm run test:f310:real-operator-three-r3f`.

# F307-F309 (2026-07-25) - 3D engine release

- Artefactos: `outputs/f307_f309_3d_engine_release/f307_f309_3d_engine_release.json`, `f307_f309_3d_engine_strategy_preview.html` y `outputs/fase_307_309_3d_engine_release.md`.
- F307: Three.js/React Three Fiber queda como motor activo en `MedicalFloorPlan3DDialog`.
- F308: Babylon.js PBR/WebGPU/WebXR queda como adapter futuro, no cargado en el bundle principal hasta feature flag y E2E.
- F309: Unity WebGL queda al final como visor externo pesado con bridge JSON/GLTF; no sustituye calculo ni reporte regulatorio.
- Medical 3D agrega selector de motor y export `medical_3d_engine_handoff_*.json`.
- Scripts: `npm run prepare:f307-f309:3d-engine-release` y `npm run test:f307-f309:3d-engine-release`.

# F301-F306 (2026-07-25) - Functional release close

- Artefactos: `outputs/f301_f306_functional_release_close/f301_f306_functional_release_close.json`, `external_engines_3d_process_preview.html` y `outputs/fase_301_306_functional_release_close.md`.
- F301: panel docking real y persistente, manteniendo sidebar visible y paneles pesados controlados.
- F302: renderer/eventos base solo bajo gate E2E y rollback; no se reemplaza `useCanvas` sin smoke antes/despues.
- F303: E2E visual completo para toolbar, sidebar, DXF/floorplan, escala, capas, cotas, equipos, heatmap y export.
- F304: Memoria IA de caso completo: plano, equipo, material, calculo, citas, advertencias, PDF y Evidence Pack.
- F305: DB/RAG readback final: hashes, paginas, deduplicacion, OCR aprobado y prioridad de fuentes.
- F306: release/deploy final: frontend estatico listo tras smoke; fullstack clinico gated por DB, secretos, API y RAG readback.
- 3D realista: Three.js/R3F es primario; Babylon.js/WebGPU/WebXR queda como fase 2; Unity WebGL solo como visor externo pesado.
- Scripts: `npm run prepare:f301-f306:functional-release-close` y `npm run test:f301-f306:functional-release-close`.

# F296-F300 (2026-07-25) - Canvas 3D workbench

- Artefactos: `outputs/f296_f300_canvas_3d_workbench/f296_f300_canvas_3d_workbench.json`, `medical_3d_navigable_preview.html` y `outputs/fase_296_300_canvas_3d_workbench.md`.
- Sidebar principal inicia visible con ancho acotado al area de trabajo: 260 px por defecto, minimo 244 px y maximo 300 px.
- Canvas conserva arranque limpio: paneles workflow/QA/continuidad cerrados por defecto y barra rapida CAD colapsada.
- Preview 3D navegable con sala, muros, equipo, barrera primaria, zona controlada, heatmap y controles de camara.
- Contrato externo: GATE/OpenGATE para NM/PET/SPECT, EGSnrc/egs_brachy para fotones/electrones/braqui, Geant4 para neutrones/ciclotron/activacion y APS/ODA para conversion DWG.
- Scripts: `npm run prepare:f296-f300:canvas-3d-workbench` y `npm run test:f296-f300:canvas-3d-workbench`.

# F295 (2026-07-25) - Smoke de rediseno de canvas

- Artefactos: `outputs/f295_canvas_redesign_smoke/f295_canvas_redesign_smoke.json`, `f295_medical_3d_preview.html` y `outputs/fase_295_canvas_redesign_smoke.md`.
- Corrige el desfase visual de `Archivo`: queda como primer menu de la toolbar principal.
- Oculta la zona legacy de menus para eliminar duplicidad visible.
- Canvas inicia en modo limpio: paneles workflow/QA/continuidad cerrados por defecto y recuperables.
- Sidebar rapida CAD inicia colapsada para no cubrir el layout.
- Supersedida por F296: sidebar principal inicia visible con ancho estable acotado y conserva boton de colapso manual.
- Deja arquitectura para conectar GATE/OpenGATE, EGSnrc/egs_brachy, Geant4 y conversion DWG APS/ODA mediante runners/proveedores externos.
- Scripts: `npm run prepare:f295:canvas-redesign-smoke` y `npm run test:f295:canvas-redesign-smoke`.

# F294 (2026-07-25) - Smoke guiado real

- Artefactos: `outputs/f294_real_guided_smoke/f294_real_guided_smoke.json`, `f294_operator_evidence_checklist.csv`, `f294_deviation_log_template.csv` y `outputs/fase_294_real_guided_smoke.md`.
- Selecciona por defecto `TX-LINAC-6MV-001`, porque F291 lo marco como caso listo para prueba real.
- Convierte el protocolo F293 en una compuerta de evidencia: canvas visible, plano/import, escala, trazado, equipo, materiales, calculo, visuales, reportes y cierre de desviaciones.
- No ejecuta escrituras live en DB ni certifica uso clinico automaticamente.
- Scripts: `npm run prepare:f294:real-guided-smoke` y `npm run test:f294:real-guided-smoke`.

# F293 (2026-07-25) - Refresh release estatico y protocolo de prueba real

- Artefactos: `outputs/f293_static_release_refresh_real_trial/f293_static_release_refresh_real_trial.json`, `f293_real_trial_operator_protocol.csv` y `outputs/fase_293_static_release_refresh_real_trial.md`.
- Verifica F200/F291/F292, paquete estatico, dist, URL publica y protocolo operativo para primera prueba real guiada.
- Mantiene alcance frontend estatico; backend/DB/uso clinico firmado siguen sujetos a smoke publico, citas DB y revision profesional.
- Scripts: `npm run prepare:f293:static-release-refresh` y `npm run test:f293:static-release-refresh`.

# F292 (2026-07-25) - QA floorplan para proyecto real

- Artefactos: `outputs/f292_real_project_floorplan_qa/f292_real_project_floorplan_qa.json`, `f292_floorplan_operator_checklist.csv` y `outputs/fase_292_real_project_floorplan_qa.md`.
- Valida la ruta operativa de proyecto real: importar plano/DXF convertido, calibrar escala, trazar areas, sembrar equipos, asignar materiales, calcular, revisar heatmap/isocontornos y exportar evidencia.
- Bloquea reescrituras de renderer/event controller hasta que canvas/sidebar/import/escala/capas/cotas/simbolos/export/3D esten listos.
- Scripts: `npm run prepare:f292:real-project-floorplan-qa` y `npm run test:f292:real-project-floorplan-qa`.

# F291 (2026-07-25) - Hardening de calculo contra casos reales

- Artefactos: `outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json`, `f291_case_deviation_guardrails.csv` y `outputs/fase_291_calculation_real_case_hardening.md`.
- Cruza F290 con F192-F196/F237: validacion numerica, normalizacion de unidades, comparador base/conservador, cache segura, trazabilidad y warnings.
- Mantiene DX/NM en `operator-input-required` cuando falta memoria/plano firmado, sin inventar evidencia.
- Scripts: `npm run prepare:f291:calculation-real-case-hardening` y `npm run test:f291:calculation-real-case-hardening`.

# F290 (2026-07-25) - Matriz de pruebas reales

- Artefactos: `outputs/f290_real_clinical_testing_matrix/f290_real_clinical_testing_matrix.json`, `outputs/f290_real_clinical_testing_matrix/f290_real_case_matrix.csv` y `outputs/fase_290_real_clinical_testing_matrix.md`.
- Cubre perfiles DX/TX/NM/CY y exige plano, equipo, calculo trazable, citas y cierre de desviaciones.
- Scripts: `npm run prepare:f290:real-clinical-matrix` y `npm run test:f290:real-clinical-matrix`.

# F289 (2026-07-25) - Handoff Memoria IA/RAG

- Artefactos: `outputs/f289_memoria_ia_rag_handoff/f289_memoria_ia_rag_handoff.json`, `f289_citation_index.jsonl`, `f289_profile_bundles.json` y `outputs/fase_289_memoria_ia_rag_handoff.md`.
- Genera bundles DX/TX/NM/CY y policy de citas con prioridad normativa.
- Scripts: `npm run prepare:f289:memoria-rag-handoff` y `npm run test:f289:memoria-rag-handoff`.

# F288 (2026-07-25) - Validacion RAG approved-only

- Artefactos: `outputs/f288_rag_approved_validation/f288_rag_approved_validation.json`, `f288_retrieval_smoke.json` y `outputs/fase_288_rag_approved_validation.md`.
- Valida filas F287, exclusiones F286, duplicados, trazabilidad y smoke retrieval. No escribe DB.
- Scripts: `npm run prepare:f288:rag-approved-validation` y `npm run test:f288:rag-approved-validation`.

# F287 (2026-07-25) - Seed RAG solo aprobados

- Artefactos: `outputs/f287_approved_only_rag_seed/f287_approved_only_rag_seed.json`, `outputs/f287_approved_only_rag_seed/f287_document_chunks_approved_only.jsonl`, `outputs/f287_approved_only_rag_seed/f287_excluded_by_review.jsonl` y `outputs/fase_287_approved_only_rag_seed.md`.
- Resultado esperado: `approved-only-rag-seed-dry-run` salvo seed live autorizado.
- Politica: se excluyen decisiones F286 `needs-reocr`, `needs-redaction` y `reject`; se conservan chunks F285 QA-ready no excluidos.
- Live DB: requiere `F287_SEED_LIVE=1`, `F287_CONFIRM_APPROVED_ONLY=1`, `DATABASE_URL`, backup/restore probe y validacion F170 posterior.
- Scripts: `npm run prepare:f287:approved-only-rag-seed` y `npm run test:f287:approved-only-rag-seed`.

# F286 (2026-07-25) - Revision humana OCR

- Artefactos: `outputs/f286_ocr_human_review_packet/f286_ocr_human_review_packet.json`, `outputs/f286_ocr_human_review_packet/f286_review_decisions_template.csv`, `outputs/f286_ocr_human_review_packet/f286_sample_review_pages.json`, `outputs/f286_ocr_human_review_packet/f286_blocked_pages.json` y `outputs/fase_286_ocr_human_review_packet.md`.
- Resultado esperado: `ocr-human-review-packet-ready`.
- Seguridad: F287 seed live queda bloqueado hasta documentar decision para cada pagina de muestra o bloqueada.
- Decisiones permitidas: `approve`, `reject`, `needs-redaction`, `needs-reocr`.
- Scripts: `npm run prepare:f286:ocr-human-review` y `npm run test:f286:ocr-human-review`.

# F285 (2026-07-25) - Seed RAG controlado

- Artefactos: `outputs/f285_controlled_rag_seed/f285_controlled_rag_seed.json`, `outputs/f285_controlled_rag_seed/f285_document_chunks_db_rows.jsonl`, `outputs/f285_controlled_rag_seed/f285_seed_report.json` y `outputs/fase_285_controlled_rag_seed.md`.
- Resultado esperado: `controlled-rag-seed-dry-run` hasta que el operador confirme revision documental.
- Seguridad: la app no escribe en `document_chunks` sin `F285_SEED_LIVE=1`, `F285_CONFIRM_REVIEWED=1` y `DATABASE_URL`.
- Uso recomendado: revisar muestras F283, respaldar/restaurar DB, ejecutar seed live solo en ambiente privado y luego correr F170 para gobierno de citas.
- Scripts: `npm run prepare:f285:controlled-rag-seed` y `npm run test:f285:controlled-rag-seed`.

# F279 (2026-07-25) - OCR libre/local

- Se revierte la ruta OCR cloud como primera opcion por posible costo de Google Document AI y Amazon Textract.
- Se agrega `prepare:f279:local-free-ocr` para detectar herramientas gratuitas/locales: PDF.js, Poppler, Tesseract y OCRmyPDF.
- Las memorias escaneadas se mantienen locales; el pipeline recomendado es extraer texto embebido, renderizar paginas si hace falta, correr Tesseract y generar JSONL por pagina antes de seed.
- Cloud OCR queda solo como excepcion con aprobacion de costo y privacidad.
- F280 ejecuta smoke OCR local solo en primeras paginas para revisar calidad antes de procesar documentos completos.
- F281 ejecuta OCR/text completo local sobre memorias reales, deduplica por hash, guarda texto por documento y JSONL por pagina, y mantiene `seedDbAutomatically=false`.
- Si Tesseract no muestra `spa` en `--list-langs`, los resultados quedan como borrador revisable; instalar o enrutar `spa.traineddata` es requisito antes de seed RAG productivo.
- F281 ahora acepta `F281_TESSDATA_DIR`/`TESSDATA_PREFIX` y registra `tessdataSource`; esto permite usar modelos `tessdata_best` instalados en Ubuntu/WSL si Windows puede leer la ruta UNC.
- F282 transforma F281 en corpus RAG draft: chunks por pagina con documentId, sourceHash, page, modality, chunkHash y reviewStatus. El seed DB sigue bloqueado hasta QA.
- F283 agrega QA de OCR/chunks: muestra paginas representativas, calcula score de calidad, separa seed draft vs revision y bloquea chunks dudosos antes de `document_chunks`.
- F284 genera paquete de seed candidato para `document_chunks` sin escribir DB: incluye solo chunks `chunk-seed-draft-ready` y conserva excluidos para revision.

# F273-F278 (2026-07-25) - live readiness

- F273 valida credenciales con salida redacted y sin escribir secretos en logs.
- F274 queda redirigida a OCR libre/local por rollback de costo; no requiere SDK Google/AWS.
- F275 queda listo para smoke APS DWG: fixtures hasheados y credenciales revisadas; no se sube DWG sin autorizacion live.
- F276 queda listo para consultas bibliograficas; Crossref/Semantic Scholar solo crean candidatos de cita.
- F277 valida GATE/OpenGATE como runner inmediato; Geant4 y EGSnrc quedan pendientes para fase posterior.
- F278 se mantiene esperando salidas live de OCR, APS, literatura y runner antes de QA integrado.

# F269-F272 (2026-07-25) - gates externos ejecutables

- F269 cierra el diseno de OCR cloud: Google Document AI como ruta primaria, Amazon Textract como fallback, dos memorias pendientes y salidas con pagina/confianza/hash.
- F270 deja DWG listo para smoke APS: fixtures locales detectados/hasheados, contrato DWG->DXF/SVG, auditoria de capas/escala y ODA como opcion privada posterior.
- F271 estructura investigacion profunda con Crossref/Semantic Scholar para Memoria IA y Evidence Pack, manteniendo normas NCRP/IAEA/UAQ y documentos versionados como fuente superior.
- F272 formaliza Monte Carlo externo: GATE/OpenGATE para medicina nuclear/radioterapia, Geant4 para transporte/ingenieria y EGSnrc/egs_brachy para fotones/electrones/braqui.
- Validacion: `prepare:test` por fase, build, F200 static release gate y commit limpio antes de publicar otro dist.

# F268-F268A (2026-07-25) - memorias reales y APIs externas

- F268 ingesta memorias analiticas reales de LINAC Versa HD, Gamma Knife, Braqui Co-60 y Ciclotron/KIUBE desde Downloads.
- Se detectan duplicados por SHA256 y solo se chunkearn documentos canonicos para RAG/DB draft.
- F268A prepara proveedores: Google Document AI y Amazon Textract para OCR; Crossref y Semantic Scholar para literatura; APS/ODA para CAD/DWG; GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy para Monte Carlo externo validado.
- Las llamadas live quedan apagadas hasta configurar secretos backend, fixtures no sensibles, hashes y smoke por proveedor.
- Siguientes fases: F269 OCR cloud, F270 APS DWG smoke, F271 literature deep dive y F272 MC external runner.

# Archivo Menu Closure (2026-07-25) - cierre funcional de Archivo

- Archivo queda cerrado para frontend estatico como menu de proyecto, importacion, exportacion, auditoria y ayuda.
- Submenus cubiertos: Nuevo Proyecto, Abrir Proyecto, Guardar, Importar CSV, Importar DXF, Importar STEP/IGES, Exportar CSV, Exportar PDF, Compartir resultados, Exportar Reporte CNSNS, Especificaciones Tecnicas, Audit Trail, Analisis de Logs, Glosario y Acerca de.
- Validacion asociada: F197, F198, F204, F207 y F200.
- Limitaciones: persistencia DB multiusuario y conversion DWG live no forman parte del cierre de Archivo; DWG se convierte externamente a DXF antes de importar.

# F267 (2026-07-25) - real-case-smoke-execution

- Se ejecuta smoke DX/TX/NM con casos representativos CT, LINAC 6 MV y PET F-18.
- Se crea CSV `real_case_smoke_deviation_log.csv` con baseline sintetico F264.
- Regla: el smoke permite continuar pruebas de app, pero no sustituye memorias reales firmadas. Antes de release clinico, reemplazar `expectedFromSignedMemory` y `sourceDocument`.

# F266 (2026-07-24) - real-case-evidence-kit

- Se agrega kit operativo para capturar pruebas reales: checklist por perfil, evidencia minima y CSV de desviaciones.
- Evidencia minima: captura canvas/escala/zonas, inputs de equipo, material TVL/densidad/carga, trace de calculo, comparador, Memoria IA, PDF, Evidence Pack y log de desviaciones.
- Stop rules: blocker/major abierto, escala ausente, material sin evidencia, calculo sin formula/norma/cita o exportes incompletos.

# F265 (2026-07-24) - real-app-testing-protocol

- Se formaliza protocolo de pruebas reales de la app despues de F264.
- Perfiles obligatorios antes de release clinico firmado: DX, TX y NM; CY queda gated hasta contar con datos reales de ciclotron.
- Cada prueba debe capturar canvas con escala/zonas, snapshot de fuente/equipo, material con TVL/densidad/peso/costo/carga, traza de calculo, comparador conservador, Memoria IA, PDF, Evidence Pack y bitacora de desviaciones.
- Si aparece desviacion blocker/major, no se firma reporte: se corrige, se documenta o se marca como limitacion explicita.

# F264 (2026-07-24) - real-clinical-trial-gate

- Se habilita gate de prueba real controlada para el motor de calculo con escenarios DX/TX/NM: LINAC 6 MV, LINAC 18 MV, CT, PET F-18, Gamma Knife Co-60 y HDR Ir-192.
- Cada escenario debe producir traza, norma, cita, unidades normalizadas, carga estructural, comparador conservador, cache F196 y warnings clinicos.
- Se agrega validacion de unidades: mm/cm, g/cm3->kg/m3, kg/m2, kPa, uSv/h y espesor negativo/cero.
- Esta fase permite empezar pruebas reales manuales de la app sin seguir modificando el canvas de alto riesgo.

# F263 (2026-07-24) - aps-dwg-adapter

- Se integra `cad.apsDwgStatus` y `cad.apsDwgPlan` en el backend para preparar conversion DWG->DXF con Autodesk Platform Services Design Automation.
- El adaptador solo genera estado/plan y hashes; no ejecuta conversion live sin credenciales, fixtures y confirmacion.
- Regla de seguridad: `APS_CLIENT_ID`, `APS_CLIENT_SECRET` y `APS_BUCKET_KEY` viven solo en backend. Nunca en variables `VITE_`.
- Siguiente fase: F264 smoke live con DWG no sensible y verificacion de capas/escala antes de aplicar al canvas.

# F261-F262 (2026-07-24) - dwg-provider-fixtures

- F261: proveedor recomendado para DWG->DXF: Autodesk Platform Services Design Automation, ejecutado desde backend con secretos seguros.
- Alternativas: ODA self-hosted para privacidad enterprise; CloudConvert solo preview/overlay; DXF manual como fallback.
- F262: se crea `fixtures/dwg/` y manifest de fixtures. Se requieren dos DWG no sensibles antes de activar conversion real.
- Nuevos comandos: `npm run prepare:f261-f262:dwg` y `npm run test:f261-f262:dwg`.
- Regla: ningun DWG se aplica al canvas sin hash, conversion, validacion de capas, confirmacion de escala y confirmacion del operador.

# F258-F260 (2026-07-24) - staging-cad-dwg-db-gates

- F258: se agrega controlador de eventos v2 aislado. No sustituye el canvas estable; solo reporta/rutea acciones cuando el flag esta activo.
- F259: se agrega contrato de proveedor DWG externo con salida DXF/SVG/IFC, hashes, timeout, auditoria de capas y fallback seguro.
- F260: se agrega manifest DB/fullstack para validar URL MySQL, alcance TCP, permisos de backup/restore probe y URL backend.
- Nuevos comandos: `npm run test:f258-f260:full` y `npm run prepare:f260:db-gate`.
- Publicacion estatica: sigue permitida. Fullstack productivo: sigue bloqueado hasta que F260 sea `fullstack-db-gate-ready-to-smoke`.

# F257-F260 (2026-07-24) - full-execution-gate

- F257: queda ejecutado el paquete staging CAD con `.env.staging-cad.example`; produccion conserva flags apagados.
- F258: renderer/event controller v2 queda preparado para implementar solo con `VITE_CANVAS_EVENT_CONTROLLER_V2=true`, sin reemplazar `useCanvas` por defecto.
- F259: DWG se mantiene como conversion externa, con contrato de proveedor, auditoria, hash, timeout y fallback DXF.
- F260: DB/fullstack queda listo para volver cuando existan credenciales y permisos; no se declara produccion multiusuario sin backup hash, restore probe y smoke backend.
- Validacion nueva: `npm run prepare:f257-f260:full` y `npm run test:f257-f260:full`.
- Regla de operacion: deploy estatico, CAD alto riesgo y DB/fullstack son tres carriles separados.

# F256-F260 (2026-07-21) - next-phase-roadmap-post-rc

- F256: subir/verificar el ZIP estatico actual contra URL publica y repetir F202 o F203 manual.
- F257: activar staging CAD con `VITE_CANVAS_HIGH_RISK_CAD=true` sin activar aun el event controller v2.
- F258: prototipo renderer/event controller v2 solo en staging, con F229 antes/despues.
- F259: proveedor externo DWG->DXF/SVG/IFC con auditoria de archivos y fallback DXF.
- F260: retomar DB/fullstack: backup, restore probe, backend smoke, RAG privado y secretos productivos.
- Regla: no mezclar publicacion estatica, renderer alto riesgo y DB fullstack en una sola fase.

# F251-F255 (2026-07-19) - high-risk-cad-feature-flag-gate

- F251: renderer/event controller v2 queda como staging-only bajo `VITE_CANVAS_EVENT_CONTROLLER_V2`.
- F252: DWG se mantiene como pipeline de conversion externa a DXF/SVG/IFC, no DWG nativo de navegador.
- F253: sync 2D/3D bidireccional queda detras de `VITE_CANVAS_HIGH_RISK_CAD`.
- F254: booleanas/solidos CAD quedan bloqueados hasta QA geometrica/unidades/hash.
- F255: heatmaps/isocontornos GPU quedan bloqueados hasta comparacion CPU y export QA.
- Antes y despues de activar cualquier flag se deben repetir F197, F207, F229, F231-F236 y F200.
- Rollback: apagar flags, limpiar `radshield_feature_flags`, regresar al artefacto F250 y repetir los gates.

# F248-F250 (2026-07-19) - static-release-candidate-final

- F248: smoke publico/static contra la URL final; si Codex queda network-gated, aplicar F203 manual desde navegador con red abierta.
- F249: decision fullstack: frontend estatico puede publicarse, pero DB/API/RAG multiusuario requiere F153/F168 restore probe, secretos y smoke backend.
- F250: release candidate final estatico con manual v1-F250, Update Center actualizado y scope freeze.
- CAD alto riesgo post-RC: renderer/eventos base, DWG nativo, sync 2D/3D bidireccional, booleanas solidas y heatmaps GPU/WebGL.
- Regla: no aplicar esas mejoras antes del deploy estatico salvo bugfix pequeno cubierto por F197/F207/F229/F200.

# F238-F247 (2026-07-19) - release-execution-cad-calculation-report

- F238: QA visual/documental final y manual con cobertura v1-F247.
- F239: smoke de deploy estatico; frontend listo despues de gates, fullstack condicionado a DB live restore probe.
- F240: canvas CAD bajo riesgo: propiedades, cotas, seleccion, etiquetas y helpers sin reescritura del renderer.
- F241: renderer/event controller solo detras de feature flag y rollback.
- F242: import DXF/DWG-convertido y simbolos de equipos con footprint, rotacion y variante de fabricante.
- F243: paquete frontend estatico listo para Vercel/static host despues de smoke.
- F244: ledger TVL/HVL versionado por material/energia/fuente/hash.
- F245: matriz QA numerica por modalidad.
- F246: auditoria material de densidad, costo, tiempo/carga estructural y estado de evidencia.
- F247: checklist de anexos para Memoria IA, PDF y Evidence Pack.

# F237 (2026-07-19) - calculation-engine-governance

- Cierre documental de la brecha detectada en el manual HTML: la cobertura visible se actualiza de v1-v116 a v1-F237.
- Se agrega gobierno de motor de calculo para validar trazabilidad, unidades, advertencias, comparador, cache y casos numericos antes de salida regulatoria.
- F125 incorpora el resumen F237 para Memoria IA, PDF y Evidence Pack.
- Prioridad deploy: frontend estatico puede publicarse cuando F200/F230/F231-F236/F237 pasen; fullstack requiere DB live validada.

## F231-F236 (2026-07-19) - canvas-release-coverage

- F231: baseline visual con screenshots F229/F207 para evitar regresiones de canvas blanco, sidebar oculta o menus superpuestos.
- F232: fixture DXF/DWG cubierto por F207; DWG se mantiene como conversion externa a DXF/SVG.
- F233: grip/snap cubierto por F229 E2E; coordenadas exactas se dejan para event controller v2 con flag.
- F234: isocontornos/leyenda exportable validados como superficie visual; interpolacion numerica queda como mejora siguiente.
- F235: handoff 2D/3D consolidado con escenas, equipos, espesores y snapshots; sync bidireccional queda como incremento aislado.
- F236: paquete post-deploy listo con F200 y URL publica para repetir F154-F158/F202.
- Validacion: `npm run prepare:f231-f236:canvas-release-coverage` y `npm run test:f231-f236:canvas-release-coverage`.

## F230 (2026-07-19) - post-f229-coverage-gate

- Objetivo: cerrar el criterio de seguridad posterior a F229 antes de modificar renderer base o eventos.
- Nuevo: `f230PostF229CoverageGate.ts` con gates F198, F207, F229, F200, shell y documentacion.
- UI: fila F230 en canvas muestra si menus, funcionalidad, canvas E2E, release, shell y docs estan listos.
- Scripts: `npm run prepare:f230:post-f229-gate` y `npm run test:f230:post-f229-gate`.
- Decision: renderer base y logica de eventos solo deben cambiarse en F231+ con feature flag, rollback y repeticion de F198/F207/F229/F200.
- Pendientes siguientes: pixel-diff, fixture DXF/DWG, grip/snap exacto, isocontornos numericos, sync 2D/3D y smoke post-deploy.

## F229 (2026-07-19) - canvas-cad-e2e-harness

- Objetivo: cubrir el canvas profesional con un E2E dedicado antes de seguir tocando renderer/eventos.
- Nuevo: `e2e/canvas-cad-e2e-harness.spec.ts` valida shell, dibujo, seleccion, lasso, modos visuales y superficie de export.
- Nuevo: `f229CanvasCadE2EHarness.ts` declara cobertura y pendientes posteriores.
- UI: fila F229 en canvas muestra conteo de cobertura y chips `shell/sidebar`, `dibujar muro`, `seleccion`, `snap/lasso`, `modos`, `export` y `escala`.
- Guardrail: el arnes no sustituye el renderer, no cambia eventos base y no reorganiza sidebar/toolbar.
- Validacion: `npm run prepare:f229:canvas-e2e`, `npm run test:f229:canvas-e2e-contracts` y `npm run test:f229:canvas-e2e`.

## F228 (2026-07-19) - static-render-helpers

- Objetivo: extraer helpers puros de render para capas estaticas/HUD.
- Nuevo: `renderStaticHelpers.ts` con `drawCanvasBackgroundGrid`, `drawFloorPlanImageLayer` y `drawCanvasScaleHud`.
- Integracion: `useCanvas.draw()` usa los helpers para grid/base, imagen de plano y HUD de escala.
- UI: fila F228 en canvas muestra helpers activos y estado de calibracion.
- Guardrail: no toca barreras, seleccion, lasso, grips, overlays CAD ni eventos base.
- Validacion: `npm run prepare:f228:static-render-helpers` y `npm run test:f228:static-render-helpers`.

## F227 (2026-07-19) - renderer-layer-extraction

- Objetivo: iniciar la mejora real del renderer sin romper eventos ni dibujo.
- Nuevo: `renderLayerRegistry.ts` define capas, orden, dirty triggers, estado de migracion y guardrails.
- Capas: `background-grid`, `floorplan-image`, `regions-zones`, `barriers`, `equipment-sources`, `heatmap`, `sample-lines`, `cad-overlays`, `selection-grips`, `hud-scale`.
- UI: fila F227 en canvas con total de capas, listas, helpers extraibles y protegidas.
- Guardrail: `cad-overlays` y `selection-grips` siguen en `useCanvas` hasta tener E2E de drag/snap/lasso.
- Validacion: `npm run prepare:f227:renderer-layers` y `npm run test:f227:renderer-layers`.

## F222-F226 (2026-07-19) - canvas-hardening

- Objetivo: continuar F222 a F226 sin romper canvas, sidebar ni toolbar.
- F222 renderer layers: separar responsabilidades de render en grid, floorplan, muros, fuentes, zonas, heatmap, cotas, grips y overlays antes de sustituir `useCanvas.draw()`.
- F223 event controller gate: cualquier controlador nuevo debe ir detras de `VITE_CANVAS_EVENT_CONTROLLER_V2` y conservar rollback al flujo actual.
- F224 E2E CAD: matriz obligatoria para grip drag, snap endpoint/midpoint/interseccion, lasso, seleccion multiple, pan/zoom y export.
- F225 iso/footprints: isocontornos proxy y footprints por modalidad se mantienen; isocontornos firmables requieren interpolacion, etiquetas regulatorias y QA numerico.
- F226 3D sync: escena 3D recibe muros, equipos, zonas y OBJ; queda pendiente sincronizacion bidireccional completa.
- Artefactos: `outputs/f222_f226_canvas_hardening/f222_f226_canvas_hardening.json` y `outputs/fase_222_226_canvas_hardening.md`.
- Validacion: `npm run prepare:f222-f226:canvas-hardening` y `npm run test:f222-f226:canvas-hardening`.

## F221 (2026-07-19) - canvas-real-connections

- Objetivo: verificar que las modificaciones del canvas sean funcionales y no solo cosmeticas.
- Alcance: fila F221 en el canvas con chips para grips arrastrables, snap CAD, ventana/lasso, editor inline, footprints, isocontornos, 3D medico y export visual.
- Estado real: grips, snapping avanzado, seleccion ventana/lasso, editor inline, footprints y export visual quedan conectados a funciones existentes.
- Estado parcial: isocontornos son proxy visual pendiente de interpolacion regulatoria; 3D medico tiene handoff pero requiere sincronizacion bidireccional y QA visual.
- Artefactos: `outputs/f221_canvas_real_connections/f221_canvas_real_connections.json` y `outputs/fase_221_canvas_real_connections.md`.
- Guardrail renderer/eventos: primero extraer helpers/capas de render; despues normalizar eventos detras de feature flag con smoke de drag/snap/lasso.

## F220 (2026-07-19) - canvas-cad-priority-actions

- Objetivo: convertir los pendientes P0-P2 del canvas en acciones visibles y seguras.
- Alcance: panel F220 en el flujo del canvas con botones `P0 Edit`, `P0 Snap`, `P0 Cotas`, `P1 Sel`, `P1 Iso`, `P1 Eq` y `P2 3D`.
- Guardrail: usa funciones existentes; no cambia renderer, eventos base, calculos, DXF, DB ni sidebar.
- Siguientes microfases: hardening de cotas editables persistentes, isocontornos interpolados, footprints por fabricante, inspeccion 3D bidireccional y pruebas E2E de eventos.
- Validacion: `npm run prepare:f220:canvas-cad-actions` y `npm run test:f220:canvas-cad-actions`.

## F219 (2026-07-19) - canvas-post-deploy-qa

- Objetivo: cerrar QA visual post-deploy y ordenar pendientes reales del canvas antes de seguir modificando UI.
- Alcance: URL publica, canvas/sidebar/toolbar, DXF aplicado, escenas F217, handoff F218 y checklist de operador.
- Pendientes priorizados: `cad-direct-edit`, `advanced-snapping`, `editable-dimensions`, `lasso-multiselect`, `true-isocontours`, `equipment-footprints`, `visual-3d-inspection`.
- Guardrail: F219 no toca renderer, eventos, geometria, DXF, calculos, DB ni sidebar; solo genera matriz y contrato.
- Validacion: `npm run prepare:f219:canvas-postdeploy` y `npm run test:f219:canvas-postdeploy`.

## F218 (2026-07-19) - report-handoff

- Objetivo: cerrar el puente entre canvas y entregables indicando que snapshots visuales deben anexarse.
- Alcance: Memoria IA, PDF Report y Evidence Pack muestran capturas listas, en revision y faltantes.
- Adjuntos: `01-planta-clinica`, `02-heatmap-regulatorio`, `03-isodosis-lineas-muestreo`, `04-material-peso-carga`.
- Guardrail: reutiliza F217; no cambia renderer, floorplan, DXF, DB, calculos ni sidebar.
- Validacion: `npm run test:f218:report-handoff`, `npm run test:f207:functional-app-qa-smoke`.

## F217 (2026-07-19) - visual-export-by-scene

- Objetivo: convertir las vistas del canvas en evidencia visual lista para documentos.
- Alcance: panel F217 con escenas `Planta`, `Heat`, `Iso`, `Estruct`, destino documental y botones `PNG`.
- Guardrail: usa export PNG y modos visuales existentes; no cambia renderer, calculos, floorplan, DXF, DB ni report generator.
- Validacion: `npm run test:f217:visual-export-scenes`, `npm run test:f207:functional-app-qa-smoke`.

## F216 (2026-07-19) - mini-view-manager

- Objetivo: permitir guardar y recuperar vistas del canvas sin alterar el floorplan.
- Alcance: panel F216 con zoom, pan, escena activa, slots A/B/C, guardar, restaurar y borrar.
- Guardrail: persistencia local en navegador; no cambia calculos, DB, DXF, geometria, sidebar, renderer ni eventos CAD.
- Validacion: `npm run test:f216:mini-view-manager`, `npm run test:f207:functional-app-qa-smoke`.

## F215 (2026-07-19) - canvas-scene-presets

- Objetivo: facilitar navegacion visual tipo SketchUp con presets de escena dentro del viewport.
- Alcance: botones compactos `Planta`, `Heat`, `Iso`, `Estruct` y `Extents`, conectados al modo visual F191 y a zoom-to-fit.
- Guardrail: no cambia renderer, handlers, calculos, DXF ni sidebar; solo reutiliza acciones existentes con una entrada mas ergonomica.
- Validacion: `npm run test:f215:canvas-scenes`, `npm run test:f207:functional-app-qa-smoke`.

## F214 (2026-07-18) - sketchup-canvas-reorg

- Objetivo: reorganizar el area de trabajo del canvas con una apariencia tipo SketchUp/CAD sin alterar la operacion estable.
- Alcance: viewport con mesa gris, reglas mas visibles, chips de escena, cubo de vista, triada XYZ y tooltips de controles flotantes.
- Guardrail: no cambia renderer, handlers de mouse/touch, import DXF, sidebar, calculos ni persistencia; es una capa visual de orientacion.
- Validacion: `npm run test:f214:sketchup-canvas`, `npm run test:f207:functional-app-qa-smoke`.

## F213 (2026-07-18) - dxf-layer-mapping-qa

- Objetivo: hacer transparente como se interpretan las capas DXF antes de aplicarlas al floorplan.
- Alcance: clasificacion por capa en muros/barreras, equipos, zonas, cotas, referencias, texto o no mapeadas; tooltips CAD mas explicativos.
- Guardrail: no cambia parser DXF, geometria importada ni calculos; agrega QA visible y documentacion de uso.
- Validacion: `npm run test:f213:dxf-layer-mapping`, `npm run test:f204:canvas-dxf-smoke`.

## F212 (2026-07-18) - heatmap-regulatory-legend

- Objetivo: hacer reportable la lectura de heatmap/isocontornos con umbrales regulatorios visibles.
- Alcance: ALARA, publico, controlado, P min/max proyecto, niveles de color, maximo proxy semanal y columnas de export.
- Guardrail: no modifica renderer, calculos ni limites normativos; solo agrega leyenda de QA/exportabilidad.
- Validacion: `npm run test:f212:heatmap-legend`, `npm run test:f207:functional-app-qa-smoke`.

## F211 (2026-07-18) - canvas-equipment-symbol-schedule

- Objetivo: auditar simbolos/equipos colocados en el floorplan antes de inspeccion 3D o memoria analitica.
- Alcance: modalidad, norma, variante/fabricante, footprint, rotacion CAD y workload por fuente.
- Guardrail: no modifica fuentes, calculos, renderer ni eventos CAD; solo agrega agenda de QA visual.
- Validacion: `npm run test:f211:equipment-symbols`, `npm run test:f207:functional-app-qa-smoke`.

## F210 (2026-07-18) - canvas-layer-manager-polish

- Objetivo: hacer mas claro el estado de capas CAD sin abrir dialogos ni tapar el plano.
- Alcance: capa activa, visibles/totales, bloqueadas, opacidad, color, rol y advertencias por capa.
- Guardrail: no modifica renderer, eventos CAD, geometria, DXF ni calculos; solo agrega lectura operacional.
- Validacion: `npm run test:f210:canvas-layers`, `npm run test:f207:functional-app-qa-smoke`.

## F209 (2026-07-18) - canvas-dimension-schedule

- Objetivo: mejorar el canvas como plano CAD revisable con agenda de cotas y capas.
- Alcance: longitud total de barreras, filas por muro, material, espesor, escala m/pixel y cobertura de resultados por barrera.
- Guardrail: no modifica el editor ni el renderer; es una capa de lectura para QA y reporte.
- Validacion: `npm run test:f209:canvas-dimensions`, `npm run test:f207:functional-app-qa-smoke`.

## F208 (2026-07-18) - canvas-reporting-layer

- Objetivo: convertir el canvas/floorplan en evidencia exportable para Memoria IA, PDF y Evidence Pack.
- Alcance: plano, cotas, capas, simbolos, heatmap/isocontornos, export PNG/CAD JSON y acciones faltantes antes de reporte firmable.
- Superficies: CanvasArea, MemoriaAIWizard, PdfReportDialog y EvidencePackDialog.
- Guardrail: no modifica geometria ni eventos CAD; solo agrega trazabilidad visual/reportable.
- Validacion: `npm run test:f208:canvas-reporting`, `npm run test:f199:outputs-smoke` y `npm run test:f207:functional-app-qa-smoke`.

## F207 (2026-07-18) - functional-app-qa

- Objetivo: confirmar que el frontend estatico es funcional como app de revision antes de nuevo deploy publico.
- Alcance: arranque directo al canvas, sidebar estable, toolbar CAD, menu Archivo, importacion DXF aplicada al floorplan, Reportes, Memoria IA, PDF analitico y Evidence Pack.
- Estado esperado: `functional-app-qa-pass`.
- Guardrail: no certifica uso clinico ni backend live; confirma que el shell principal y las salidas tecnicas no desaparecen ni se bloquean.
- Validacion: `npm run test:f207:functional-app-qa-smoke` y `npm run test:f207:functional-app-qa`.

## F204 (2026-07-18) - canvas-dxf-recovery

- Objetivo: resolver el bloqueo reportado de canvas no visible e importacion DXF que no afectaba el floorplan.
- Cambio UX: la app abre directo al canvas/floorplan salvo que el operador fuerce bienvenida con `radshield_force_welcome=true`.
- Cambio DXF: el visor incorpora `Aplicar al canvas`, genera barreras desde LINE/LWPOLYLINE y reemplaza el floorplan activo con el plano importado.
- DWG: se mantiene por conversion externa a DXF; no hay promesa de DWG nativo browser.
- Validacion: `npm run test:f204:canvas-dxf-recovery` y `npm run test:f204:canvas-dxf-smoke`.

## F203 (2026-07-18) - manual-public-verification

- Objetivo: completar la verificacion publica cuando F202 no puede salir a Vercel desde Codex.
- Artefactos: `outputs/f203_manual_public_verification/f203_manual_public_verification.json`, `CHECKLIST_OPERADOR_F203_PUBLICO.md` y plantilla JSON editable.
- Alcance: URL HTTPS, shell, sidebar, canvas/floorplan, toolbar CAD, panel Layout-blindaje-memoria, menus canonicos y salidas Memoria IA/PDF/Evidence/CNSNS.
- Estado esperado si F202 sigue bloqueado por red: `manual-public-verification-required`.
- Validacion: `npm run prepare:f203:manual-public-verification` y `npm run test:f203:manual-public-verification`.

## F202 (2026-07-18) - public Vercel smoke

- Objetivo: validar el frontend publicado en Vercel sin depender de backend ni DB live.
- URL por defecto: `https://radshield-mx-static-dist.vercel.app/`; se puede sustituir con `PUBLIC_DEPLOY_URL`.
- Alcance: respuesta HTTPS, sidebar/canvas/toolbar CAD visibles, panel Layout-blindaje-memoria desplazable/compactable y menus canonicos de Diseno, Reportes y Evidencia.
- Salidas verificadas: Memoria IA, PDF analitico, Evidence Pack y Reporte CNSNS desde controles e2e.
- Si Codex/Playwright no puede salir a internet, la fase se documenta como `public-vercel-smoke-network-gated`; para tratarlo como fallo duro usar `F202_STRICT_PUBLIC_SMOKE=1`.
- Validacion: `npm run test:f202:public-vercel-contracts` y `npm run test:f202:public-vercel-smoke`.

## F201 (2026-07-18) - Workflow panel controls

- Objetivo: evitar que el panel `Layout - blindaje - memoria` obstruya el canvas.
- Controles: desplazar arriba/derecha/abajo, compactar/expandir y cerrar.
- Persistencia: posicion en `radshield_canvas_workflow_dock_f188`, visibilidad en `radshield_canvas_panels_f188` y compacto en `radshield_canvas_workflow_compact_f201`.
- Guardrail: no cambia herramientas de dibujo, geometria, calculos, floorplan ni estados de seleccion.
- Validacion: `npm run test:f201:workflow-panel` y `npm run test:f201:workflow-panel-smoke`.

## F200 (2026-07-18) - Static frontend release gate

- Objetivo: cerrar un release candidate estatico del frontend con artefacto reproducible.
- Gate: F197 menu/canvas, F198 menus canonicos, F199 salidas Memoria/PDF/CNSNS/Evidence, configuracion Vercel/Netlify y paquete `dist`.
- Estado esperado: `static-frontend-release-ready`.
- Alcance: no incluye API, MySQL, seeds RAG live ni certificacion clinica; esos quedan para release full-stack.
- URL sugerida: `https://radshield-mx-static-dist.vercel.app/` o la URL final en `PUBLIC_DEPLOY_URL`.
- Validacion: `npm run prepare:f200:static-release-gate` y `npm run test:f200:static-release-gate`.
- Siguiente fase: F201 public URL smoke.

## F199 (2026-07-18) - Output smoke QA

- Objetivo: validar salidas criticas antes de release o deploy estatico/full stack.
- Superficies: Memoria IA, PDF analitico, Reporte CNSNS, Evidence Pack, Checklist CNSNS, Regulatory Report y Batch Report Exporter.
- Evidencia minima: cards F125/F146/F149/F149c en Memoria/PDF/Evidence, bloque F76 en reportes regulatorios y titulos CNSNS/Batch.
- Guardrail: F199 no descarga archivos ni cambia la metodologia de calculo; solo confirma que los dialogos y evidencia se montan sin perder canvas/sidebar.
- Validacion: `npm run test:f199:outputs` y `npm run test:f199:outputs-smoke`.

## F198 (2026-07-18) - Full menu function QA

- Objetivo: validar todos los grupos canonicos por funcion antes de tocar reportes/exportacion o eliminar fallbacks.
- Alcance: Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia e Integraciones.
- Superficies: `Toolbar`, `F92_REAL_WORKFLOW`, menu triggers F96/F97/F107/F108/F109/F110/F116, sidebar F186, canvas F100 y toolbar CAD F191.
- Smoke visual: abre cada dropdown en `dist`, valida labels criticos y comprueba que canvas/sidebar no desaparezcan despues de cada grupo.
- Guardrail: no se abre cada dialogo pesado en esta fase; F198 valida visibilidad/ruta superficial. F199 queda para export, Memoria IA, PDF y Evidence Pack.
- Validacion: `npm run test:f198:menus` y `npm run test:f198:menus-smoke`.

## F197 (2026-07-18) - Menu/canvas/output QA

- Objetivo: revisar el primer menu funcion por funcion y cerrar el diagnostico de canvas/sidebar/botones invisibles antes de seguir con QA de release.
- Alcance: menu Archivo, sidebar estable F186, canvas principal F100, toolbar CAD F191, paneles movibles/restaurables F188 y salidas Memoria IA/Evidence/PDF.
- Correccion puntual: `Nuevo Proyecto` en Archivo ahora ejecuta reset seguro de floorplan y seleccion, cierra welcome y mantiene el canvas listo.
- Diagnostico visual: el smoke F197 elimina estados locales `radshield_canvas_panels_f188`, `radshield_canvas_workflow_dock_f188` y `radshield_sidebar_width_f188` antes de validar; si la UI reaparece, el problema era estado persistido y no perdida del renderer.
- Guardrail: no se mueve layout ni se eliminan fallbacks; la validacion completa de todos los grupos queda para F198.
- Validacion: `npm run test:f197:menu-canvas` y `npm run test:f197:menu-canvas-smoke`.

## F196 (2026-07-18) - Safe calculation cache

- Objetivo: evitar resultados obsoletos cuando cambian escala, geometria, material, fuente, norma, P/T/U/W, regiones o puntos criticos.
- Alcance: `calculationCacheKey.ts` versiona la cache como `f196-cache-v1` y conserva marcador legacy F193 para trazabilidad.
- Salida tecnica: cada entrada IndexedDB guarda `cacheVersion`, `payload`, resultados, sample lines y timestamp.
- Diagnostico: `explainCalculationCacheInvalidation()` reporta categorias y rutas cambiadas; `useCalculationCache().lastAudit()` expone el ultimo dictamen.
- Guardrail: entradas sin payload F196 o con version distinta no se aceptan como hit; se recalcula antes de usar en Memoria IA/PDF/Evidence.
- Validacion: `npm run test:f196:cache`.

## F195 (2026-07-17) - Base/conservative comparison gate

- Objetivo: hacer visible y auditable el comparador base vs conservador antes de emitir Memoria IA, Evidence Pack o PDF.
- Alcance: cada resultado de barrera se cruza contra `calculationComparison` del `FloorPlan` endurecido por F193.
- Salida tecnica: `buildF195CalculationComparisonGate()` devuelve espesor base, espesor conservador, delta, severidad, estado y recomendacion.
- Integracion: `F125CalculationEvidenceGate` ahora reporta comparaciones faltantes y comparaciones con revision requerida.
- Guardrail: si una barrera no tiene comparador, queda como `missing-comparison`; no se inventan margenes ni se libera automaticamente.
- Validacion: `npm run test:f195:comparison-gate`.

## F194 (2026-07-16) - Numeric QA NCRP/IAEA/UAQ

- Objetivo: convertir los casos de referencia de F193 en verificaciones ejecutables con tolerancias y resultados auditables.
- Alcance: LINAC 6 MV, LINAC 18 MV, CT/RX, Gamma Knife/Co-60, PET/NM y control local UAQ/CNSNS.
- Salida tecnica: `runNumericQaValidationCases()` devuelve checks, estado `pass/review-required/fail`, advertencias y citas por caso.
- Uso operativo: Memoria IA, Evidence Pack y reportes pueden distinguir referencia numerica aprobada, revision requerida y fallo de QA.
- Guardrail: esta fase no declara Monte Carlo clinico certificado ni aprobacion regulatoria automatica; toda memoria final requiere revision de experto calificado.
- Validacion: `npm run test:f194:numeric-qa`.

## F193 (2026-07-16) - Calculation hardening extendido

- Objetivo: completar los pendientes de F192 sin cambiar formulas base ni interfaz.
- Incluye: normalizacion de unidades, hash seguro de cache, casos numericos conocidos, advertencias clinicas especificas, comparador base/conservador y cobertura en worker/motor legacy.
- Salidas nuevas por barrera: `calculationUnitSnapshot`, `calculationComparison`, `calculationCacheKey`, ademas de `calculationTrace` y `calculationWarnings`.
- Casos de referencia: LINAC 6 MV, LINAC 18 MV, CT/RX, Gamma Knife/Co-60 y PET/NM.
- Guardrail: el comparador conservador es screening; no reemplaza validacion NCRP/IAEA/UAQ ni revision de RSO/fisico medico.
- Validacion: `npm run test:f193:calculation-hardening-extended`.

## F192 (2026-07-16) - Calculation Engine Hardening

- Objetivo: endurecer el motor sin cambiar la experiencia visual ni reescribir formulas.
- Alcance: trazabilidad por barrera con `calculationTrace`, advertencias `calculationWarnings`, normalizacion de formula/norma/energia/citas.
- Uso operativo: los resultados calculados quedan listos para Memoria IA, Evidence Pack y PDF con fuente metodologica e inputs/outputs auditables.
- Guardrails: no declara Monte Carlo clinico certificado; los calculos siguen siendo de diseno y requieren revision de experto calificado.
- Validacion: `npm run test:f192:calculation-hardening`.

## F191G (2026-07-16) - Duplicar/borrar con confirmacion

- Objetivo: permitir duplicar y borrar objetos seleccionados desde el inspector CAD sin introducir acciones destructivas accidentales.
- Alcance: fuentes, barreras, puntos criticos y zonas ocupadas; duplicado con desplazamiento visible y seleccion automatica de la copia.
- Seguridad: ambas acciones piden confirmacion; borrar informa que se puede deshacer con Ctrl+Z.
- Persistencia de estado: el borrado sincroniza `occupiedRegions` y `regions` para evitar zonas residuales en overlays.
- Validacion: `npm run test:f191g:duplicate-delete-contracts` y `npm run test:f191g:duplicate-delete-smoke`.
- Evidencia: `outputs/f191g_duplicate_delete_smoke/f191g-duplicate-delete-confirm.png`.

## F191F (2026-07-16) - Smoke real de inline editor

- Objetivo: comprobar que F191E funciona con seleccion real del floorplan antes de agregar mas CAD.
- Superficies: Playwright, `CanvasArea`, inspector F191C/F191E y evidencia visual.
- Uso: `npm run test:f191f:inline-editor-contracts` y `npm run test:f191f:inline-editor-smoke`.
- Incluye: seleccion de objeto del demo, apertura de `Edit`, cambio de nombre, confirmacion del inspector y verificacion de canvas/sidebar.
- Evidencia: `outputs/f191f_inline_editor_smoke/f191f-inline-editor-real-selection.png`.
- Guardrail: no agrega funcionalidad nueva; es una barrera QA antes de duplicar/borrar o edicion inline mas profunda.

## F191E (2026-07-16) - Inline editor seguro

- Objetivo: permitir edicion rapida de propiedades basicas desde el inspector sin redisenar el canvas.
- Superficies: `CanvasArea`, `ShieldingDesigner`, `useCanvas`, smoke F191 y `UpdateAppDialog`.
- Uso: `npm run test:f191e:inline-editor` y `npm run test:f191:pyrate-toolbar-smoke`.
- Incluye: boton `Edit`, editor contextual compacto, nombre, material, workload, isocentro, U, T y P.
- Guardrail: no hay borrar/duplicar; los cambios aplican al perder foco; numeros invalidos se rechazan con toast.
- Operacion: seleccionar objeto, abrir `Edit`, ajustar campos y salir del campo para aplicar. Para cambios profundos usar sidebar o dialogos especializados.
- Posterior: F191F podria agregar borrar/duplicar con confirmacion, historial undo/redo y prueba visual dedicada.

## F191D (2026-07-16) - Context actions seguros

- Objetivo: dar acciones inmediatas al inspector de objeto sin abrir menus flotantes sobre el canvas.
- Superficies: `CanvasArea`, smoke F191, `UpdateAppDialog`.
- Uso: `npm run test:f191d:context-actions` y `npm run test:f191:pyrate-toolbar-smoke`.
- Incluye: `Mat`, `Calc`, `Evid`, `Ver` y `X` para materiales, recalculo, evidencia, centrar objeto y limpiar seleccion.
- Guardrail: las acciones aparecen solo en ancho `2xl`; no hay borrar/duplicar hasta tener undo/redo fino, confirmacion y smoke visual dedicado.
- Operacion: seleccionar objeto; usar `Ver` para centrarlo, `Mat` para presets/materiales, `Calc` para recalcular y `Evid` para abrir el paquete de evidencia.
- Posterior: agregar editar propiedades/duplicar/borrar solo como F191E o posterior, con confirmacion y pruebas de recuperacion.

## F191C (2026-07-16) - Object inspector contextual

- Objetivo: dar lectura inmediata del objeto seleccionado en el canvas sin abrir paneles adicionales.
- Superficies: `CanvasArea`, smoke F191, `UpdateAppDialog`.
- Uso: `npm run test:f191c:object-inspector` y `npm run test:f191:pyrate-toolbar-smoke`.
- Incluye: inspector de muro/fuente/zona/punto critico con chips de material, espesor, workload, ocupacion, meta de diseno, snap y capas.
- Guardrail: no modifica formulas, renderer, seleccion, eventos del canvas, sidebar, demo R&F ni F188/F189.
- Operacion: seleccionar un objeto del plano y revisar la banda F191C; usar los botones de la misma banda para abrir material/calculo/evidencia si se requiere edicion profunda.
- Posterior: convertir los chips en entradas editables solo despues de smoke visual dedicado y undo/redo fino.

## F191 (2026-07-16) - pyrateShield-inspired toolbar

- Objetivo: adaptar el flujo operativo de pyrateShield al frontend actual sin sustituir la interfaz estable.
- Superficies: `CanvasArea`, `ShieldingDesigner`, `UpdateAppDialog`.
- Uso: `npm run test:f191:pyrate-toolbar` y `npm run test:f191:pyrate-toolbar-smoke`.
- Incluye: herramientas CAD-clinicas `Sel`, `Muro`, `Fuente`, `Zona`, `Medir`, `Pan`; acciones `Plano`, `Escala`, `Punto`, `Material`, `Calcular`, `Snapshot`; y selector visual `Plano`, `Heat`, `Iso`, `Estruct`.
- Guardrail: no cambia formulas, motor, persistencia, eventos base, demo R&F, F188 ni smoke F189.
- Operacion: usar la banda F191 para acciones frecuentes del canvas; usar `Estruct` para revisar carga/materiales con el panel de flujo acoplado a la derecha.
- Posterior: evaluar context menu sobre muros, inspector por objeto seleccionado y estilos de isocontorno con QA visual.

## F189 (2026-07-16) - Visual smoke layout canvas/sidebar

- Objetivo: validar visualmente que F188 no rompa sidebar, canvas ni demo R&F.
- Superficies: `CanvasArea`, `Sidebar`, preview local y evidencia Playwright.
- Uso: `npm run test:f189:visual-smoke`.
- Incluye: prueba en 1366x768 y 1920x1080, cierre/restauracion del panel QA, dock derecho del panel de flujo y ajuste de ancho de sidebar.
- Evidencia: capturas en `outputs/f189_visual_smoke` con estados inicial, QA oculto y final.
- Guardrail: si falla esta prueba, no avanzar a mas cambios de layout antes de corregir visibilidad de canvas/sidebar.

## F188 (2026-07-16) - Panel layout controls

- Objetivo: recuperar area util del canvas sin eliminar funciones ni mover la arquitectura principal.
- Superficies: `Sidebar` y `CanvasArea`.
- Uso: `npm run test:f188:panel-layout`.
- Incluye: ancho persistente de sidebar, botones de cierre para paneles de flujo/QA/continuidad, restaurador de paneles ocultos y dock seguro superior/derecho para el panel de flujo.
- Guardrail: no cambia eventos del canvas, formulas, resultados, demo R&F, topbar ni modo colapsado de sidebar.
- Operacion: usar los chips `Flujo`, `QA` y `Cont` en la barra del canvas para ocultar/mostrar paneles; usar el icono de mover del panel de flujo para alternar entre arriba y derecha.
- Posterior: si F188 se mantiene estable, evaluar drag libre solo para paneles no criticos y con limites de viewport.

## F186 (2026-07-16) - Sidebar estable + Mat toolbox

- Objetivo: mejorar operacion del espacio lateral sin mover el canvas principal.
- Superficies: `Sidebar`, `MaterialComparisonDialog`, `UpdateAppDialog`.
- Uso: `npm run test:f186:sidebar-materials`.
- Incluye: ancho estable, leyendas hover/accesibles, acceso rapido `Mat` y toolbox material unica con TVL, densidad, peso, costo, tiempo y carga estructural.
- Guardrail: no cambia calculos, eventos del canvas, demo R&F ni menus superiores.
- Posterior: validar visualmente que el ancho estable no tape el layout en 1366px/1920px antes de agregar grips/cotas reales.

## F185 (2026-07-16) - Canvas micro assist

- Objetivo: mejorar el canvas profesional sin cambios destructivos de layout.
- Superficies: `CanvasArea` y `src/lib/f185CanvasMicroAssist.ts`.
- Uso: `npm run test:f185:canvas-assist`.
- Incluye: herramienta activa, seleccion, snap, capas, evidencia, heatmap y siguiente accion recomendada.
- Guardrail: no cambia eventos del canvas, geometria, formulas, topbar, sidebar ni demo R&F.
- Posterior: si F185 se mantiene estable, avanzar a microcambios CAD reales: cotas editables, grips y snapping avanzado con smoke visual por cambio.

## F184 (2026-07-16) - Safe quality workflow

- Objetivo: mejorar motor/calidad, memoria, materiales, RAG y export sin tocar el layout sensible del canvas/sidebar.
- Superficies: `MemoriaAIWizard`, `EvidencePackDialog`, `MaterialComparisonDialog` y `src/lib/f184ReleaseQualityWorkflow.ts`.
- Uso: `npm run test:f184:safe-quality`.
- Guardrail: F184 no modifica demo R&F, topbar, sidebar ni shell del canvas; las mejoras CAD visuales deben entrar en microcambios con smoke.
- Posterior: pulir canvas profesional por incrementos pequenos: grips, cotas editables, snapping, seleccion/lasso y heatmaps con prueba visual antes/despues.

## F181 (2026-07-16) - Deploy now handoff

- Objetivo: ejecutar deploy inmediato si Sites permite push; si no, dejar paquete estatico listo para publicacion alterna.
- Resultado esperado en entorno actual: `sites-deploy-blocked-static-package-ready` por bloqueo de red hacia `git.chatgpt-team.site:443`.
- Artefactos: `outputs/f181_deploy_now_handoff/f181_deploy_now_handoff.json`, `outputs/f181_deploy_now_handoff/README_F181_DEPLOY_NOW.md`, `outputs/f181_deploy_now_handoff/radshield-mx-static-dist.zip` y `outputs/fase_181_deploy_now_handoff.md`.
- Uso: `npm run prepare:f181:deploy-now` y `npm run test:f181:deploy-now`.
- Guardrail: no guardar version Sites ni ejecutar deploy si no se pudo empujar el source exacto.
- Posterior: subir paquete/repo a `vercel-static` o similar, configurar `PUBLIC_DEPLOY_URL` y repetir F154-F158.

## F180 (2026-07-16) - Static publish runbook

- Objetivo: convertir F179 en instrucciones operativas para publicar una URL publica de frontend.
- Proveedores cubiertos: `vercel-static`, `netlify-static`, `cloudflare-pages` y `vps-fullstack`.
- Artefactos: `outputs/f180_static_publish_runbook/f180_static_publish_runbook.json`, `outputs/f180_static_publish_runbook/README_F180_STATIC_PUBLISH.md` y `outputs/fase_180_static_publish_runbook.md`.
- Uso: `npm run prepare:f180:static-publish` y `npm run test:f180:static-publish`.
- Guardrail: el hosting estatico es solo demo/revision publica; release clinico multiusuario requiere `vps-fullstack` o equivalente.
- Posterior: configurar `PUBLIC_DEPLOY_URL=https://<url-final>/` y repetir F154-F158.

## F179 (2026-07-16) - Deploy lane decision

- Objetivo: decidir formalmente el carril de publicacion despues de F177/F178.
- Decision: `vercel-static` como carril primario para URL publica rapida de frontend; `vps-fullstack` como carril clinico; `local-offline` como fallback.
- Artefactos: `outputs/f179_deploy_lane_decision/f179_deploy_lane_decision.json`, `outputs/f179_deploy_lane_decision/README_F179_DEPLOY_LANE.md` y `outputs/fase_179_deploy_lane_decision.md`.
- Uso: `npm run prepare:f179:deploy-lane` y `npm run test:f179:deploy-lane`.
- Guardrail: no subir `.env`, `DATABASE_URL`, dumps DB, corpus RAG privado ni documentos clinicos a hosting estatico.
- Posterior: cuando exista URL final, configurar `PUBLIC_DEPLOY_URL` y repetir F154-F158.

## F178 (2026-07-16) - Alternate deploy readiness

- Objetivo: dejar lista una ruta de publicacion alterna si Sites/Git continua bloqueado por red.
- Superficies: `vercel.json`, `netlify.toml`, `public/_redirects` y `public/_headers`.
- Opciones: Vercel/Netlify/Cloudflare Pages para frontend estatico; VPS para full-stack con API, MySQL, RAG y secretos.
- Artefactos: `outputs/f178_alternate_deploy_readiness/f178_alternate_deploy_readiness.json`, `outputs/f178_alternate_deploy_readiness/README_F178_ALTERNATE_DEPLOY.md` y `outputs/fase_178_alternate_deploy_readiness.md`.
- Uso: `npm run prepare:f178:alternate-deploy` y `npm run test:f178:alternate-deploy`.
- Guardrail: no subir `.env`, `DATABASE_URL`, dumps DB ni corpus documental privado a proveedores estaticos.

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
