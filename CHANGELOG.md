# RadShield-MX - Fases recientes

# F556-F560 (2026-08-09) - Post-beta profunda: renderer, Babylon, Unity, DB y QA

- Agrega `src/lib/f556F560PostBetaDeepStack.ts` como contrato de profundizacion post-beta.
- Canvas muestra panel F556-F560 con cinco carriles: renderer base v2, Babylon real profundo, Unity WebGL real, DB tecnica y QA normativo ampliado.
- El panel se alimenta de contratos existentes: escena medica, Babylon deep runtime, Unity exported build gate, PBR/photoreal DB y QA NCRP/IAEA/UAQ F484-F490.
- Mantiene reglas de seguridad: renderer base no reemplaza canvas, Babylon no es primario, Unity no firma calculos y PBR/fotorealismo no modifica TVL/densidad/costos.
- DB tecnica queda marcada como ruta completa ENDF/XCOM/ICRU + materiales proveedor con hash/pagina/evidencia.
- Agrega contrato `npm run test:f556-f560:post-beta-deep` y E2E visual `npm run test:f556-f560:post-beta-deep:e2e`.

# F550-F555 (2026-08-09) - Functional beta closure + BIM palette

- Agrega `src/lib/f550F555FunctionalBetaClosure.ts` como contrato de cierre beta funcional.
- Canvas muestra panel F550-F555 con tracks de conexiones, paleta BIM, Three/R3F, Babylon, Unity, fotorrealismo, renderer profundo y motor de calculo.
- Agrega paleta BIM completa visible: workspace, Project Manager, panel marfil, modalidades DX/TX/NM/CY, roles de barrera, heatmap y materiales.
- Mantiene politica reversible: callbacks existentes, fallback Three/R3F, assets lazy, Unity visual-only y `canvasBaseReplacementAllowed=false`.
- Unity queda gated hasta copiar build WebGL real (`Build` + `TemplateData`); fotorrealismo pesado queda gated hasta HDRI/texturas PBR/decals reales.
- Agrega contrato `npm run test:f550-f555:functional-beta` y E2E visual `npm run test:f550-f555:functional-beta:e2e`.

# F545-F549 (2026-08-09) - Ghost source commit

- Agrega `src/lib/f545F549GhostSourceCommit.ts` para gobernar el alta real de fuentes desde el ghost.
- Canvas incorpora boton `Crear fuente`: convierte el punto ghost arrastrado en `RadiationSource` real, seleccionable y visible por el renderer existente.
- `ShieldingDesigner` mapea TX/NM/DX/CY a modalidad, workload, use factor, footprint y variante de fabricante.
- El ghost se limpia despues del commit para evitar duplicidad visual; rollback por undo/redo existente.
- La fase no escribe barreras, no cambia calculos y no reemplaza renderer base.
- Agrega contrato `npm run test:f545-f549:ghost-source-commit` y E2E `npm run test:f545-f549:ghost-source-commit:e2e`.

# F540-F544 (2026-08-09) - Ghost drag gate no persistente

- Agrega `src/lib/f540F544GhostDragGate.ts` para formalizar el arrastre seguro del ghost de equipo.
- Canvas incorpora `f540-equipment-ghost-drag-handle`: el ghost se puede mover con mouse/puntero sin capturar todo el overlay ni bloquear el canvas base.
- Mantiene `pointer-events:none` en el overlay y `pointer-events:auto` solo en el handle interno.
- El punto movido queda con `source: 'drag'`, alimenta Confirmar/3D/Memoria/Evidence, pero sigue sin escribir `floorPlan.sources`.
- Agrega contrato `npm run test:f540-f544:ghost-drag` y E2E `npm run test:f540-f544:ghost-drag:e2e`.

# F535-F539 (2026-08-09) - Equipment ghost visual QA

- Agrega E2E `e2e/f535-f539-equipment-ghost-visual.spec.ts` para validar el preview ghost en navegador real.
- Verifica boton `Preview`, accion de boton derecho `Preview equipo aqui`, boton `Confirmar`, overlay visible y captura `outputs/f535_f539_equipment_ghost_visual/01_equipment_ghost_preview.png`.
- Comprueba que el overlay sea `pointer-events:none`, que no bloquee el event harness del canvas y que siga activo `zoom-view`.
- Mantiene la politica de seguridad: ghost no persistente, sin escritura en `floorPlan.sources` y sin reemplazar renderer base.
- Agrega contratos `npm run test:f535-f539:equipment-ghost-visual` y `npm run test:f535-f539:equipment-ghost-visual:e2e`.

# F530-F534 (2026-08-09) - Equipment ghost placement preview

- Agrega `src/lib/f530F534EquipmentPlacementPreview.ts` para convertir el perfil F525-F529 en preview de equipo.
- Canvas muestra un `ghost` no persistente con footprint, etiqueta, punto candidato y estado de seguridad.
- Agrega botones `Preview` y `Confirmar`, mas accion de boton derecho `Preview equipo aqui`.
- El panel expone propiedades que alimentan 3D, Memoria IA, Evidence Pack y QA, sin escribir `floorPlan.sources`.
- Agrega contrato `npm run test:f530-f534:equipment-placement-preview`.

# F525-F529 (2026-08-09) - Clinical placement pack TX/NM/DX/CY

- Agrega `src/lib/f525F529ClinicalPlacementPack.ts` con catalogo operativo para LINAC, Gamma Knife, PET/NM, DX/CT y ciclotron.
- El canvas ahora permite seleccionar chips TX/NM/DX/CY; la seleccion queda persistida y actualiza equipo, sala, material y perfil de Memoria IA.
- `Sembrar equipos + Render 3D` usa el handoff F525-F529 para abrir Inspeccion 3D con contexto clinico, sin escribir geometria permanente.
- Update Center declara `canWriteCanvasGeometry=false` hasta validar drag/drop/editor profundo.
- Agrega contrato `npm run test:f525-f529:clinical-placement`.

# F520-F524 (2026-08-09) - Babylon profundo + renderer profundo gated

- Agrega `src/lib/f520F524DeepRendererBabylon.ts` para unir el panel visual F517-F519 con Babylon profundo y renderer v2.
- Canvas muestra estado F520-F524: instrucciones, passes y si el overlay renderer v2 puede correr sin tomar eventos.
- Inspeccion 3D muestra resumen F520-F524: entidades seleccionables Babylon, camaras, overlays y politica de activacion.
- Update Center declara la politica: `canReplaceCanvasBase=false` hasta repetir F197/F207/F229/F446, QA visual y rollback.
- Agrega contrato `npm run test:f520-f524:deep-renderer-babylon`.

# F517-F519 (2026-08-09) - Canvas Visual Reference + Project Manager palette

- Analiza las referencias visuales enviadas por el usuario y las traduce a patrones RadShield: catalogo clinico, toolbar flotante, variantes A-E, editor inline, paleta de materiales y export PDF/DXF/IFC/GLB.
- Agrega `src/lib/f517F519CanvasVisualReference.ts` con contrato de implementacion y ruta F520+ para pasar de visible-contract a interaccion real.
- Agrega panel visible en el canvas con paleta tipo Project Manager: workspace verde grisaceo, panel marfil, acento verde y swatches TX/NM/DX/CY.
- Conecta el panel a `Sembrar equipos + Render 3D` sin tocar renderer base, geometria, DB ni formulas.
- Actualiza Update Center, manuales y contrato `npm run test:f517-f519:canvas-visual`.

# F516g-F516h (2026-08-09) - Context calculation and medical 3D harness

- `Canvas CAD -> Calcular blindaje` desde boton derecho ahora pasa por el event harness como `run-calculation`.
- `Canvas CAD -> Inspeccion 3D medica` desde boton derecho ahora pasa por el event harness como `open-medical-3d`.
- Ambas acciones conservan sus callbacks estables y amplian el E2E del canvas sin tocar geometria, renderer, formulas ni DB.

# F516f (2026-08-09) - Context Evidence Pack harness

- `Canvas CAD -> Abrir evidencia` desde boton derecho ahora pasa por el event harness F515/F516.
- La accion conserva la ruta estable `onOpenEvidencePack`, registra `open-evidence` y queda cubierta por E2E.
- Mantiene la progresion segura F515b-F516c-F516d-F516e y suma evidencia sin tocar geometria, calculos ni DB.

# F516e (2026-08-02) - Context PNG export harness

- Conecta `Canvas CAD -> Exportar PNG` desde el menu de boton derecho al event harness.
- La accion conserva la ruta estable `onExportPNG`, registra `export-png` y queda cubierta por E2E.
- Mantiene la progresion segura F515b/F516c/F516d: `zoom-view`, `activate-tool`, `fit-view` y ahora `export-png`.

# F516d (2026-08-02) - Context fit view + manuales reconstruidos

- Conecta `Canvas CAD -> Ajustar vista` desde el menu de boton derecho al event harness. La accion conserva `onZoomToFit`, registra `fit-view` y queda cubierta por E2E.
- Mantiene F516c para herramientas desde boton derecho como `activate-tool` y F515b para zoom con `Ctrl/Meta + rueda` como `zoom-view`.
- Reconstruye `public/manual_usuario.html` desde cero con perfiles basico, intermedio y avanzado, tablas de botones, acciones, enlaces y flujo plano/equipo/barrera/calculo/memoria/evidencia.
- Agrega `public/manual_versiones.html` con mapa historico compacto, relacion boton-version, criterios de release y comandos de validacion.
- Sincroniza `MANUAL_USUARIO_v99.md`, `MANUAL_VERSIONES_v50.md` y Update Center.

# F515/F519 (2026-08-02) - Hardening canvas + QA numerico ampliado

- Agrega `src/lib/f515CanvasEventHardening.ts` con matriz CanvasArea/useCanvas/eventControllerV2, escenarios de rutas de eventos, rollback por flags y lista E2E siguiente.
- F515 cubre fallback estable, coordenadas no finitas, zoom, lasso, snap preview, delete y undo sin activar mutaciones productivas nuevas.
- Agrega `src/lib/f519NormativeQaExpansion.ts` con casos por rol de barrera: primaria, secundaria, laberinto, puerta, penetracion y zona controlada.
- F519 agrega comparador base/conservador para LINAC, CT/RX, Gamma Knife, PET/NM y ciclotron.
- Agrega `scripts/f515-f519-hardening-audit.mjs` y `scripts/check-f515-f519-hardening-contracts.mjs`.
- Comandos: `npm run prepare:f515-f519:hardening` y `npm run test:f515-f519:hardening`.

# F515-F520 (2026-08-02) - Plan post-beta productivo

- Agrega `src/lib/f515F520PostBetaPlan.ts`.
- Agrega `scripts/f515-f520-post-beta-plan.mjs` y `scripts/check-f515-f520-post-beta-plan-contracts.mjs`.
- Define seis tracks post-beta: renderer base/eventos del canvas, Babylon profundo real, Unity WebGL con build exportado, DB tecnica ENDF/XCOM/ICRU, QA numerico NCRP/IAEA/UAQ ampliado y memorias reales para RAG/IA.
- F515 queda como primer trabajo: endurecer eventos del canvas sin activar mutaciones profundas ni romper la ruta estable.
- F516 queda gated: Babylon debe cargar lazy, con fallback a Three/R3F y E2E visual antes de promoverlo.
- F517 queda `needs-assets`: Unity WebGL real requiere build exportado en `public/unity/radshield-medical-3d`.
- F518 queda `needs-data`: ENDF/XCOM/ICRU requiere datasets versionados y `approved-reference` antes de alimentar calculos.
- F519 puede avanzar en paralelo con casos numericos adicionales.
- F520 requiere memorias reales deduplicadas, OCR revisado y trazabilidad por hash/pagina.
- Comandos: `npm run prepare:f515-f520:post-beta-plan` y `npm run test:f515-f520:post-beta-plan`.

# F511-F514 (2026-08-02) - Cierre beta publicable

- **F511:** agrega QA final beta con evidencia F508-F510, dist, manuales y Update Center.
- **F512:** genera paquete beta estatico `radshield-mx-f511-f514-beta.zip` desde `dist/` con SHA256 y manifiesto.
- **F513:** genera checklist de smoke post-deploy para URL publica: carga, Menu Archivo, canvas/sidebar, Update Center, manual, DB QA, calculo basico y Memoria IA.
- **F514:** emite decision de release beta: permitido para prueba real de usuario y bloqueado para memoria firmada/calculo clinico certificado.
- Agrega `src/lib/f511F514BetaClosure.ts`.
- Agrega `scripts/f511-f514-beta-closure.mjs` y `scripts/check-f511-f514-beta-closure-contracts.mjs`.
- Comandos: `npm run prepare:f511-f514:beta-closure` y `npm run test:f511-f514:beta-closure`.
- Post-beta: Babylon profundo, Unity WebGL real exportado, fotorrealismo pesado y QA numerico adicional quedan fuera del cierre beta.

# F510 (2026-08-02) - Promocion TVL PET/DX a DB live

- Agrega `src/lib/f510DiagnosticPetTvlPromotion.ts`.
- Agrega `scripts/f510-diagnostic-pet-tvl-promotion.mjs` para promover dos valores exactos faltantes en `material_value_versions`: `lead-cast/tvl-primary/511keV = 11.8 mm` y `lead-cast/tvl-diagnostic/120kVp = 0.27 mm`.
- El seed live exige `F510_DB_READBACK=1`, `F510_SEED_LIVE=1`, `F510_CONFIRM_EXACT_VALUES=1`, `F510_CONFIRM_RESTORE_PROBE=1` y `DATABASE_URL`.
- La escritura es transaccional e idempotente: inserta solo filas faltantes, no pisa filas existentes y hace rollback si detecta conflicto o falla.
- Produce `outputs/f510_diagnostic_pet_tvl_promotion/f510_manifest.json`, `f510_summary.md`, `f510_supplemental_value_candidates.jsonl` y `f510_live_insert_report.csv`.
- Despues de F510 se repite `npm run prepare:f508-f509:post-seed-qa` con `F508_DB_READBACK=1` para confirmar que PET 511 keV y DX 120 kVp pasan el QA DB-backed.
- Comandos: `npm run prepare:f510:diagnostic-pet-tvl` y `npm run test:f510:diagnostic-pet-tvl`.

# F508-F509 (2026-08-02) - Post-seed readback y QA DB-backed

- Agrega `src/lib/f508F509PostSeedQa.ts`.
- Agrega `scripts/f508-f509-post-seed-qa.mjs` para leer tablas live sembradas: `regulatory_sources`, `material_constants`, `material_value_versions`, `material_source_links` y `document_chunks`.
- F508 valida conteos minimos post-seed, fuentes con page/hash y que todos los valores seeded sean `approved-reference` + `allowed_use=calculation`.
- F509 ejecuta casos QA usando valores reales de DB para LINAC 6 MV, LINAC 15 MV y Gamma Knife/Co-60; diagnostico/PET/ciclotron quedan en `review` si falta valor exacto versionado.
- Produce `outputs/f508_f509_post_seed_qa/f508_f509_manifest.json`, `f508_f509_summary.md`, CSV de valores seeded y JSONL de casos QA.
- Comandos: `npm run prepare:f508-f509:post-seed-qa` y `npm run test:f508-f509:post-seed-qa`.

# F506-F507 (2026-08-02) - Trazabilidad page/hash y seed controlado aprobado

- Agrega `src/lib/f506F507RegulatorySeedReadback.ts`.
- Agrega `scripts/f506-f507-regulatory-seed-readback.mjs` para leer `document_chunks`, resolver `page_ref`/hash por fuente y generar cola de revision.
- F506 produce fuentes resueltas, fuentes pendientes y un plan F507 con solo `approved-reference`.
- F507 ejecuta seed live solo con `F507_SEED_LIVE=1`, `F507_CONFIRM_APPROVED_ONLY=1`, `F507_CONFIRM_RESTORE_PROBE=1` y `DATABASE_URL`.
- La escritura live corre dentro de transaccion; si una tabla ya tiene filas o falla un insert, hace rollback y no borra ni actualiza datos.
- Comandos: `npm run prepare:f506-f507:regulatory-seed-readback` y `npm run test:f506-f507:regulatory-seed-readback`.

# F505 (2026-08-01) - Aplicacion controlada de schema DB regulatoria/materiales

- Agrega `src/lib/f505RegulatoryMaterialsSchemaApply.ts` y `scripts/f505-regulatory-materials-schema-apply.mjs`.
- El script valida `db/f501_f504_regulatory_materials_schema.sql`, bloquea keywords destructivos y exige `F505_APPLY_SCHEMA=1`, `F505_CONFIRM_RESTORE_PROBE=1` y `DATABASE_URL` para live apply.
- Solo permite `CREATE TABLE IF NOT EXISTS`; no hace seed, inserts, deletes, drops ni alters.
- Produce `outputs/f505_regulatory_materials_schema_apply/f505_schema_apply_manifest.json` y `f505_schema_apply.md`.
- Siguiente paso: repetir F500 con `F500_DB_READBACK=1` y preparar F506/F507 seed transaccional.

# F501-F504 (2026-08-01) - DB schema y assets pesados reales

- **F501:** agrega `db/f501_f504_regulatory_materials_schema.sql` con schema revisable para `regulatory_sources`, `material_constants`, `material_value_versions` y `material_source_links`.
- **F502:** agrega manifiesto de intake para assets pesados en `public/medical3d/photoreal/ASSET_MANIFEST_F501_F504.json` y carpetas `hdri`, `textures`, `decals`.
- **F503:** agrega README de Unity WebGL real en `public/unity/radshield-medical-3d/README_UNITY_WEBGL_BUILD.md`; el build real sigue pendiente hasta copiar `index.html`, `Build/*.loader.js`, `Build/*.framework.js`, `Build/*.data`, `Build/*.wasm` y `TemplateData`.
- **F504:** agrega `scripts/f501-f504-heavy-assets-db-prep.mjs` y contrato para auditar schema, assets pesados y Unity sin seed live ni inserts/deletes.
- Comandos: `npm run prepare:f501-f504:heavy-assets-db` y `npm run test:f501-f504:heavy-assets-db`.

# F500 (2026-08-01) - Live gate DB regulatoria/materiales

- Agrega `src/lib/f500RegulatoryMaterialsLiveGate.ts` como contrato de preflight posterior a F499.
- Agrega `scripts/f500-regulatory-materials-live-gate.mjs` para verificar integridad de artefactos F499, duplicados, restore probe F153 y readback opcional de DB.
- Produce `outputs/f500_regulatory_materials_live_gate/f500_live_gate_manifest.json` y `f500_live_gate.md`.
- F500 no ejecuta `INSERT` ni `DELETE`; la escritura live queda para F501 con flags explicitos, restore probe y revision aprobada.
- Si se define `F500_DB_READBACK=1` y `DATABASE_URL`, consulta `information_schema.tables` y conteos de tablas requeridas.

# F499 (2026-08-01) - Seed dry-run DB regulatoria/materiales

- Agrega `src/lib/f499RegulatoryMaterialsSeedDryRun.ts` para transformar el registro F491-F498 en filas candidatas de seed.
- Genera `regulatory_sources`, `material_constants`, `material_value_versions` y `material_source_links`.
- Agrega `scripts/f499-regulatory-materials-seed-dry-run.mjs` para escribir JSONL, CSV, SQL draft, Markdown y manifiesto en `outputs/f499_regulatory_materials_seed_dry_run`.
- Bloquea escritura live en F499: si se intenta `F499_SEED_LIVE=1`, el script aborta y remite a F500.
- Siguiente fase: F500 DB live readback con aprobacion explicita, restore probe, revision de duplicados y F484-F490 post-seed.

# F491-F498 (2026-08-01) - DB regulatoria/materiales versionada

- **F491:** crea registro de fuentes regulatorias/materiales con autoridad, prioridad canonica, hash, page_ref, estado de revision y usos permitidos.
- **F492:** normaliza materiales desde `MATERIALS_DB` con densidad, TVL primaria/secundaria, TVL neutronica, costo, espesores comerciales y warnings.
- **F493:** aplica politica de deduplicacion/canon: NCRP/IAEA/UAQ gobiernan calculo; proveedor/lab/memorias quedan como evidencia hasta revision.
- **F494:** define ruta DB dry-run-first con tablas `regulatory_sources`, `material_constants`, `material_value_versions` y `material_source_links`.
- **F495:** integra guardrail de calculo: solo `approved-reference` puede alimentar constantes finales; materiales comerciales quedan fuera hasta aprobacion.
- **F496:** conecta Memoria IA, PDF y Evidence Pack con fuente/pagina/hash/estado.
- **F497:** conecta Material Toolbox, carga estructural, costo/tiempo y Medical 3D con la misma fuente versionada.
- **F498:** bloquea release clinico hasta `DATABASE_URL`, seed/readback, restore probe, `document_chunks` canonico y F484-F490 post-seed.

# F484-F490 (2026-08-01) - Motor calculo QA NCRP/IAEA/UAQ

- **F484:** agrega caso QA LINAC 6 MV barrera primaria con TVL NCRP151 y cita UAQ.
- **F485:** agrega caso de alta energia LINAC 15 MV con advertencia neutronica y margen conservador.
- **F486:** agrega caso CT/RX diagnostico NCRP147 para plomo equivalente.
- **F487:** agrega caso Gamma Knife/Co-60 con trazabilidad IAEA-SRS47/UAQ.
- **F488:** agrega caso PET/NM TG-108 511 keV y advertencias de workflow.
- **F489:** agrega caso ciclotron 18 MeV con concreto alta densidad y contribucion neutronica.
- **F490:** agrega gate de release: permite beta preliminar si los fixtures pasan, pero bloquea uso clinico hasta TVL/densidad/fuente versionada por pagina/hash y revision FM/RSO.
- Ruta de assets pesados: `public/medical3d/photoreal` para PBR/HDRI/decals y `public/unity/radshield-medical-3d` para Unity WebGL exportado. Deben entrar como lazy/gated y probarse con QA visual/post-deploy sin cambiar el calculo.

# F479-F483 (2026-08-01) - Fotorrealismo avanzado con texturas/HDRI/decals

- **F479:** agrega paquete de texturas PBR versionadas y carpeta `public/medical3d/photoreal` para assets opcionales.
- **F480:** prepara HDRI local `clinical_softbox.hdr` con fallback a luces procedurales Three/R3F.
- **F481:** agrega decals visuales de radiacion/acceso controlado, rol de barrera, zona, footprint de equipo y penetraciones/MEP.
- **F482:** define presets de render **Inspeccion**, **Presentacion** y **Cinematico**; el modo cinematografico queda gated para assets pesados.
- **F483:** agrega panel, export JSON, auditoria, contratos, E2E y manuales. La apariencia visual no sustituye TVL, densidad, costo, carga estructural ni citas.

# F475-F478 (2026-08-01) - Unity WebGL real con carpeta exportada

- **F475:** agrega contrato y carpeta destino `public/unity/radshield-medical-3d` para recibir un export WebGL real de Unity.
- **F476:** agrega shell de iframe/new-tab para cargar URL externa o build local con `VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true`.
- **F477:** refuerza el handoff JSON de caso con contrato F475-F478, query params y frontera visual-only.
- **F478:** agrega auditoria de archivos esperados, scripts, E2E y documentacion. Si falta el build real, la app lo muestra como gate pendiente y mantiene Three/R3F como fallback.

# F470-F474 (2026-08-01) - Babylon profundo interactivo

- **F470:** Babylon pasa de tarjeta de paridad a runtime interactivo visual-only conectado a `MedicalScene`.
- **F471:** agrega picking de muros, bandas, zonas, equipos y guia de haz con HUD de propiedades sin modificar calculos ni plano.
- **F472:** agrega camaras de inspeccion **Iso**, **Planta** y **Frente** para revisar barreras, equipos y zonas.
- **F473:** expone overlays activos de rol de barrera, zonas controladas, footprints de equipos y guia de haz.
- **F474:** agrega auditoria, contratos y E2E con capturas en `outputs/f470_f474_babylon_deep_runtime`; Three/R3F sigue como renderer productivo/fallback.

# F469 (2026-08-01) - Visual beta publicable

- Cierra la beta visual como paquete estatico publicable: ZIP de `dist`, manifiesto con hash, checklist post-deploy y backlog post-beta.
- Define claims permitidos: frontend estatico, Medical 3D visual, Babylon parity card, Unity handoff, DB PBR visual y evidencia para Memoria IA/PDF.
- Bloquea claims no listos: calculo clinico certificado, Babylon profundo como renderer principal, Unity embebido real, DB regulatoria completa y memoria firmable.
- Artefactos: `outputs/f469_visual_beta_publication_close/radshield-mx-f469-visual-beta-publicable.zip`, manifiesto JSON, checklist CSV y backlog MD.

# F464-F468 (2026-08-01) - RC visual beta 3D

- **F464:** agrega contrato y panel de QA visual beta para Three/R3F, Babylon, WASD, PBR y Unity handoff.
- **F465:** conecta la DB PBR con barreras del plano para mostrar material, densidad, espesor y carga kg/m2 estimada.
- **F466:** agrega mapa auditable canvas/3D con targets `barrier/source/region` y acciones de seleccion, inspeccion y captura.
- **F467:** prepara secciones de Memoria IA/PDF/Evidence con capturas visuales, anexos y disclaimers.
- **F468:** agrega export JSON de RC visual beta y E2E con capturas en `outputs/f464_f468_visual_beta`.

# F459-F463 (2026-08-01) - Unity bridge, photoreal stack, PBR DB and WASD visuals

- **F459-F460:** formaliza el puente Unity WebGL como handoff realista: geometria, materiales PBR, bookmarks y boundary visual-only; requiere `VITE_MEDICAL_3D_UNITY_WEBGL_URL` para abrir build externo.
- **F461:** agrega preset visible de recorrido fotoreal WASD y consolida el perfil ACES/PBR/sombras/luces para Three/R3F y preview Babylon.
- **F462:** agrega galeria de materiales PBR con swatches/fotos procedurales: concreto alta densidad, plomo, acero, vidrio plomado, polimero borado y TM/NIPOLL.
- **F463:** agrega DB PBR local versionada y actualizable en `localStorage`, export JSON y guia WASD visual para operador.
- Agrega scripts `prepare/test:f459-f463:visual-stack` y E2E `test:f459-f463:visual-stack:e2e` con capturas de stack visual, Babylon y materiales.

# F456-F458 (2026-08-01) - Babylon scene parity, performance and export

- **F456:** el preview Babylon deja de ser maqueta fija y dibuja entidades reales de `MedicalScene`: barreras con tamano/rotacion/rol/material, equipos con footprint y zonas controladas.
- **F457:** agrega gate visible de rendimiento: primer frame, FPS aproximado, numero de meshes y regla de fallback a Three/R3F si Babylon falla.
- **F458:** agrega boton **Export PNG Babylon** para capturas visuales de Evidence/Memoria; se mantiene como evidencia visual no firmable hasta QA completo de paridad.
- Agrega scripts `prepare/test:f456-f458:babylon-parity` y E2E `test:f456-f458:babylon-parity:e2e`.

# F455 (2026-08-01) - Babylon runtime smoke visual

- Verifica que `@babylonjs/core`, `@babylonjs/loaders`, `@babylonjs/materials` y `@babylonjs/gui` ya puedan usarse desde el bundle local.
- Agrega un preview Babylon aislado dentro de **Medical 3D** con canvas propio, carga dinamica, sala cutaway, concreto PBR, equipo medico proxy, haz visual y zona controlada translucida.
- Mantiene **Three/R3F** como renderer principal y fallback productivo; Babylon queda en modo smoke post-beta hasta completar paridad, rendimiento y export visual.
- Agrega contrato `radshield-mx.medical3d.babylon-runtime-smoke.f455.v1`, scripts `prepare/test:f455:babylon-runtime` y E2E `test:f455:babylon-runtime:e2e`.

# F454 (2026-08-01) - Post-beta heavy engines gate

- Cierra el frente F449-F453 como beta estable y separa las mejoras pesadas en carriles post-beta.
- Mantiene **Three/R3F** como visor 3D productivo y fallback obligatorio.
- Define gate para **Babylon real PBR/WebGPU/WebXR**: requiere `@babylonjs/core`, `@babylonjs/loaders`, import dinamico, feature flag, smoke visual y fallback a Three/R3F.
- Define gate para **Unity WebGL avanzado**: requiere build externo/URL `VITE_MEDICAL_3D_UNITY_WEBGL_URL`, handoff JSON/GLTF, headers correctos y smoke visual; Unity queda como visual-only.
- Define gate para **fotorrealismo pesado**: assets PBR, GLB/texturas, lazy loading, presupuesto de bundle, capturas reportables y rollback.
- Agrega scripts `prepare:f454:post-beta-engines` y `test:f454:post-beta-engines`; el prepare genera `outputs/f454_post_beta_heavy_engines/f454_local_dependency_probe.json`.

# F449-F453 (2026-08-01) - BIM memory visual

- **F449:** agrega trazabilidad grafica calculo -> formula -> norma -> seccion de Memoria IA para barrera primaria, secundaria, laberinto/puerta, penetraciones MEP y carga estructural.
- **F450:** agrega bindings de cita/evidencia para NCRP 151, IAEA SRS-47, materiales TVL/densidad y fichas de fabricante con regla de hash/pagina/chunk.
- **F451:** adapta las ultimas imagenes y frames BIM/CAD: sala visible vs bunker real, cada muro con rol, diseno respaldado por normas, ribbon/Project Manager/Properties y coordinacion MEP.
- **F452:** integra un tablero SVG BIM dentro del canvas con corte 2.5D, roles de muros, panel de propiedades, evidence chips y flujo plano -> equipo -> barreras -> calculo -> citas -> PDF.
- **F453:** agrega handoff de release y E2E dedicado `f449-f453-bim-memory-visual.spec.ts` para validar que el tablero no oculte canvas/sidebar ni rompa F446-F448.

# F446-F448 (2026-08-01) - Canvas strong QA

- **F446:** agrega compuerta de superficies criticas: sidebar estable, canvas principal, dock CAD y overlay renderer v2 no bloqueante.
- **F447:** agrega compuerta de interacciones: boton derecho, accesos rapidos, ventanas controlables y seguridad de seleccion legacy.
- **F448:** agrega gates de regresion para release beta: canvas visible despues de acciones, overlay `pointer-events:none`, ventanas minimizables/cerrables y E2E obligatorio.
- Agrega testids a acciones del menu contextual del canvas para validar cada funcion por separado.
- Agrega E2E `f446-f448-canvas-strong-qa.spec.ts` con quick actions, boton derecho y overlay v2.

# F442-F445 (2026-08-01) - Renderer v2 runtime overlay

- **F442:** genera instrucciones de render desde el geometry core F439-F441: polylines, poligonos, footprints, badges, estilos, labels, evidencias y advertencias.
- **F443:** agrupa instrucciones en passes por capa usando el helper puro `drawF442ToF445RendererV2Overlay`.
- **F444:** monta un canvas overlay runtime `pointer-events:none`; si `VITE_CANVAS_HIGH_RISK_CAD` esta apagado funciona como preview, si esta activo queda en modo flagged.
- **F445:** agrega rollback explicito: apagar overlay, apagar flag alto riesgo y mantener `VITE_CANVAS_EVENT_CONTROLLER_V2=false`.
- Mantiene renderer base, seleccion, grips, snapping, boton derecho y event controller en la ruta estable `CanvasArea/useCanvas`.

# F439-F441 (2026-08-01) - Renderer geometry core

- **F439:** agrega normalizador real de geometria desde `floorPlan`: barreras, fuentes/equipos, zonas, penetraciones y overlay de evidencia.
- **F440:** genera un plan de overlays por capa: barreras por rol, equipos, ocupacion, MEP/penetraciones y estado Evidence/Memoria.
- **F441:** agrega preflight antes de activar renderer profundo: entidades, overlays, puente F436-F438, flag `VITE_CANVAS_HIGH_RISK_CAD` y garantia de eventos legacy intactos.
- El geometry core queda observable en el canvas, pero no sustituye renderer, seleccion, grips, boton derecho ni event controller.
- Agrega scripts `prepare/test:f439-f441:renderer-geometry` y E2E `f439-f441-renderer-geometry-core.spec.ts`.

# F436-F438 (2026-07-31) - Renderer v2 bridge

- **F436:** agrega baseline visual desktop y mobile/tablet para confirmar canvas, sidebar, ribbon y paneles F426-F435 antes de tocar renderer base.
- **F437:** conecta manifest vivo para Memoria IA, PDF Report y Evidence Pack con roles, penetraciones, carga estructural y baseline visual.
- **F438:** define geometry core normalizado para barreras, fuentes, regiones, penetraciones y overlays bajo `VITE_CANVAS_HIGH_RISK_CAD`.
- Mantiene `VITE_CANVAS_EVENT_CONTROLLER_V2=false`; eventos, seleccion, grips y snapping siguen en la ruta estable `CanvasArea/useCanvas`.
- Agrega E2E `f436-f438-renderer-v2-bridge.spec.ts` con baseline desktop y mobile.

# F431-F435 (2026-07-31) - Renderer release gate

- **F431:** agrega smoke visual dedicado para comprobar que F426-F430 aparece sin ocultar canvas, sidebar ni ribbon BIM.
- **F432:** define manifest Evidence/Memoria para roles de barrera, penetraciones, carga estructural, QA normativo y export visual BIM.
- **F433:** agrega revision de bloqueos de release derivados de escala, fuentes, barreras, MEP, materiales y QA.
- **F434:** agrega decision explicita de renderer base v2: contrato solamente, renderer v2 detras de flag o bloqueo de reescritura.
- **F435:** deja handoff para F436-F438: baseline visual, PDF/Evidence live link y primer renderer geometry core detras de flag.
- Agrega E2E `f431-f435-renderer-release-gate.spec.ts` y scripts `prepare/test:f431-f435:renderer-release`.

# F426-F430 (2026-07-31) - Calc/Renderer closure

- **F426 motor:** agrega calculo por rol de superficie: primaria, secundaria, laberinto, puerta y penetracion con formula/norma/inputs/outputs/overlays.
- **F427 motor:** agrega penalizaciones de penetraciones para sleeves, ductos, puertas, huecos y continuidad de blindaje.
- **F428 motor:** integra carga estructural kg/m2/kPa por barrera/material/equipo para revisar impacto constructivo.
- **F429 motor:** define QA normativo por casos conocidos NCRP/IAEA/UAQ para LINAC, CT/RX, Gamma Knife, PET/NM y ciclotron.
- **F430 motor:** define flujo automatico Memoria IA desde canvas: plano -> equipo -> barreras -> calculo -> evidencia -> PDF.
- **F426-F430 renderer profundo:** agrega contrato de geometry core, cutaway 2.5D visible/real, penetraciones MEP, export visual conectado a Evidence/Memoria y QA visual/E2E.
- Alcance: esta fase cierra contratos y panel UI sin reescribir eventos base del canvas; el renderer profundo v2 debe usar estos contratos como entrada estable.

# F421-F425 (2026-07-31) - BIM handoff / intake / export

- **F421:** agrega contrato de export visual BIM: snapshot PNG, anexo PDF, handoff JSON y Evidence visual pack.
- **F422:** define intake pipeline para DXF/SVG/IFC/GLB como rutas navegables y DWG/RFA/RVT como rutas externas/futuras con riesgo alto.
- **F423:** normaliza categorias BIM a entidades RadShield: barreras, zonas, fuentes, puntos criticos, penetraciones MEP y EvidenceAsset.
- **F424:** agrega Product/Spec Library para equipos, materiales, puertas, MEP y especificaciones con campos obligatorios y regla de evidencia.
- **F425:** define entregables de handoff: Revit Schedule RS_*, IFC PropertySet RadShield, Evidence Pack, Memoria IA BIM y QA manifest.
- Declara que el renderer profundo debe tocarse **despues de F425**, cuando ya estan definidos export/import/normalizacion/productos/handoff.
- Scripts: `npm run prepare:f421-f425:bim-handoff` y `npm run test:f421-f425:bim-handoff`.

# F416-F420 (2026-07-31) - BIM canvas sequence

- **F416:** agrega `f416ToF420BimCanvasSequence.ts` con registro de proveedores BIM: MEPcontent, ProdLib, ARCAT y RevitCity, incluyendo formatos, riesgo QA e integracion externa.
- **F417:** define biblioteca visual de objetos para canvas: LINAC, Gamma Knife, ciclotron, barrera primaria/secundaria, laberinto, puerta blindada y ducto/penetracion.
- **F418:** agrega metricas cutaway 2.5D: espacio visible, huella blindada estimada, relacion visible/real y superficies calculadas.
- **F419:** mapea roles reales de superficie contra barreras existentes y estados: listo, falta geometria o falta calculo.
- **F420:** agrega candidatos iniciales de clash MEP/blindaje: ducto en primaria, continuidad de puerta, charola en secundaria y MEP sin clasificar.
- El panel BIM del canvas muestra `f416-provider-registry`, `f417-object-library`, `f418-cutaway-metrics`, `f419-surface-role-assignments` y `f420-mep-clash-candidates`.
- Scripts: `npm run prepare:f416-f420:bim-canvas` y `npm run test:f416-f420:bim-canvas`.

# F415 (2026-07-31) - BIM MEP coordination

- Agrega `f415BimMepCoordination.ts` para convertir los videos BIM en metodologia clinica/constructiva: muros/losas de blindaje, HVAC/ductos, tuberias, charolas/cableado y penetraciones/puertas.
- Cada sistema declara categoria IFC, color, riesgo radiologico y checks obligatorios: TVL/densidad, cruce de barrera, compensacion de blindaje, sello de penetracion, distancia a fuente, carga kg/m2 y evidencia.
- El canvas muestra `f415-bim-mep-coordination` dentro del panel BIM con capas MEP y gates bloqueantes.
- Gates F415: registro de penetraciones, clash MEP/blindaje, carga estructural y acceso/mantenimiento.
- Integra las imagenes de divulgacion/explicacion como secuencia operativa: visible vs real, cada muro tiene una funcion, antes del primer paciente y respaldo por estandares.
- Agrega roles de superficie para Memoria IA: barrera primaria, barrera secundaria, laberinto y puerta blindada, cada uno con requisito de evidencia/calculo.
- Agrega preguntas de diseno: donde va la radiacion, que espesor requiere cada barrera, quien necesita proteccion, como se controla fuga/dispersion y si es seguro antes de construir.
- Agrega referencias de trazabilidad: IAEA SR-47, AAPM TG-108, ICRU 83, NCRP 151 y normativa local CNSNS/UAQ.
- Scripts: `npm run prepare:f415:bim-mep` y `npm run test:f415:bim-mep`.

# F414 (2026-07-31) - BIM video reference alignment

- Agrega `f414BimVideoReference.ts` con patrones de interfaz observados en la referencia AutoCAD Plant 3D/Revit: ribbon disciplinar, Project Manager, propiedades/capas, viewport anotado, view cube/navegacion y linea de comando.
- El canvas muestra `f414-bim-video-reference` dentro del panel BIM con reglas de aplicacion y release para que futuras iteraciones no rompan el flujo visual.
- Se agrega `scripts/extract-f414-bim-video-frames.ps1` para extraer frames con la ruta WinGet de FFmpeg a `outputs/f414_bim_video_reference`; Codex puede ver la ruta, pero el sandbox no puede ejecutar/copiar el binario desde el paquete WinGet.
- Scripts: `npm run prepare:f414:bim-video-reference` y `npm run test:f414:bim-video-reference`.

# F413 (2026-07-31) - BIM Execution Plan

- Agrega `f413BimExecutionPlan.ts` con pasos BIM operativos: Acquire, Normalize, Classify, Bind RS_*, Calculate, Coordinate y Publish.
- Amplia parametros Revit `RS_*` con `RS_BimEntityId`, `RS_ControlledZone`, `RS_StructuralLoad_kg_m2`, `RS_CalculationHash` y `RS_RevisionStatus`.
- El canvas muestra `f413-bim-execution-plan` para revisar avance BIM desde geometria hasta memoria, evidencia y coordinacion estructural.
- Define worksets de arquitectura, proteccion radiologica, estructura/obra y evidencia; cada uno tiene regla operativa para QA.
- Scripts: `npm run prepare:f413:bim-execution` y `npm run test:f413:bim-execution`.

# F412 (2026-07-31) - Metodologia BIM operable

- Extiende F411 con un catalogo BIM interno: barreras `IfcWall`, zonas `IfcSpace`, fuentes `RadShieldSource`, puntos criticos `RadShieldControlPoint` y capas `IfcPresentationLayerAssignment`.
- El panel BIM muestra entidades, conteos, parametros compartidos `RS_*` y compuertas de roundtrip: IFC/DXF, parametros RS, RVT externo, DWG externo y DB/API versionada.
- La metodologia liga objetos de canvas con calculo, memoria, evidencia y Revit/IFC: `RS_ShieldingType`, `RS_MaterialCode`, `RS_RequiredThickness`, `RS_PassFail`, `RS_EvidencePackId` y `RS_SourceTrace`.
- RVT y DWG nativos siguen externos por diseno: requieren Revit API/Add-in/APS/ODA, fixtures, hashes, validacion de capas/unidades y confirmacion del operador.
- Scripts: `npm run prepare:f412:bim-methodology` y `npm run test:f412:bim-methodology`.

# F411 (2026-07-31) - Adaptacion BIM del canvas

- El canvas incorpora un modo guia tipo BIM inspirado en AutoCAD Plant 3D/Revit: ribbon disciplinar, Project Manager, Details, Layers, navegacion, cubo de vista, leyenda y linea de comando.
- La UI no reemplaza el renderer ni promete DWG/IFC/Revit nativo; se conecta a acciones reales ya existentes: importar plano, fuente/equipo, barrera, medir, calcular, snapshot, evidencia e inspeccion 3D.
- Se agrega `f411BimCanvasMethodology.ts` para declarar que necesita RadShield-MX para operar con metodologia BIM real: IDs persistentes, categorias tipo IFC, geometria normalizada, materiales versionados, relaciones calculo-evidencia y proveedores externos DWG/IFC/Revit.
- Se agrega smoke E2E `e2e/f411-bim-canvas.spec.ts` para verificar que la estacion BIM aparezca en modo guia y que los botones de ribbon cambien herramientas reales del canvas.
- Scripts: `npm run prepare:f411:bim-canvas`, `npm run test:f411:bim-canvas` y `npm run test:f411:bim-canvas:e2e`.

# F410 (2026-07-31) - QA funcional de salidas F409

- Agrega smoke Playwright `e2e/f410-output-surfaces.spec.ts` para abrir Memoria IA, Evidence Pack y Medical 3D desde controles E2E.
- Memoria IA agrega tarjeta visible `f409-output-surface-integration-memoria` para revisar F409 sin buscar dentro del texto generado.
- Los controles E2E incorporan `e2e-open-medical-3d`, lo que permite probar directamente la superficie 3D.
- El smoke genera `outputs/f410_output_surface_qa/f410_output_surface_qa.json`, Markdown y capturas PNG.
- Scripts: `npm run prepare:f410:output-surface-qa`, `npm run test:f410:output-surface-qa` y `npm run test:f410:output-surface-qa:e2e`.

# F409 (2026-07-31) - Integracion de salidas F405-F408

- Agrega `f409OutputSurfaceIntegration`: une trazabilidad F405, heatmap reportable F407 y escena Unity/3D F408 en una sola matriz de salida.
- Memoria IA ahora incluye seccion 7.13 con estado de superficies reales: Memoria IA, Evidence Pack, PDF/heatmap, Medical 3D y Update Center.
- Evidence Pack agrega tarjeta visible F409 y export JSON dedicado para auditar salidas listas, en revision o bloqueadas.
- Medical 3D muestra estado F409/F408 con muros, equipos, zonas y advertencias de handoff externo.
- Update Center refleja F409 como fase integrada.
- Scripts: `npm run prepare:f409:output-surfaces` y `npm run test:f409:output-surfaces`.

# F405-F408 (2026-07-31) - Trazabilidad calculo, canvas QA, heatmap reportable y Unity handoff

- F405 agrega `f405CalculationTraceabilityBundle`: empaqueta formula, norma, inputs, outputs, supuestos, warnings, citas, unidades, comparador y cache por barrera para Memoria IA, PDF y Evidence Pack.
- F406 agrega `f406CanvasToolQa`: contrato verificable de herramientas CAD, modos visuales, command dock, canvas principal y boton derecho.
- F407 agrega `f407ReportableHeatmap`: convierte la leyenda F212 e isocontornos en snapshot exportable con umbrales regulatorios y evidencia requerida.
- F408 agrega `f408UnitySceneExport`: export 3D en metros, eje Y arriba, muros/equipos/zonas/dosis para Three/R3F, Unity WebGL, glTF/OBJ y runners externos.
- Nuevas validaciones: `npm run prepare:f405-f408:calc-canvas-unity`, `npm run test:f405-f408:calc-canvas-unity` y `npm run test:f405-f408:unit`.

# F404 (2026-07-31) - Archivo menu funcional real

- Agrega `data-testid` estable a los 15 items reales del menu Archivo.
- Repara `TechSpecsDialog`: deja de ser stub/null y muestra una ficha tecnica real con trazabilidad F404.
- Agrega smoke Playwright que abre el menu Archivo normal y valida superficies reales para proyectos, CSV, DXF, STEP/IGES, export CSV, CNSNS, audit trail, logs, tech specs, glosario y acerca de.
- Declara diferidos de runtime para acciones con APIs externas o descarga directa: nuevo proyecto visual/reset, guardar/persistencia, PDF directo y Web Share API.
- Scripts: `npm run prepare:f404:file-menu-functional`, `npm run test:f404:file-menu-functional` y `npm run test:f404:file-menu-functional:e2e`.

# F399-F403 (2026-07-31) - QA visual y paquete beta controlado

- F399 agrega auditoria de superficies controladas: 7 `FullscreenShell` y 3 `DialogShell` migradas.
- F400 limpia cierres internos duplicados en Evidence Pack, Manual, Memoria Analitica y Layout Bunker; las acciones utiles internas se conservan.
- F401 agrega smoke Playwright dedicado para abrir, minimizar, alternar vista contenida y cerrar workflows fullscreen, ademas de abrir/cerrar Compare, Tutorial y Version History.
- F402 amplia controles E2E ocultos para abrir superficies controladas sin depender de Archivo, sidebar ni accesos rapidos.
- F403 genera manifiesto beta con estado de superficies y build `dist`.
- Scripts: `npm run build`, `npm run prepare:f399-f403:window-beta`, `npm run test:f399-f403:window-beta` y `npm run test:f399-f403:e2e`.

# F392-F398 (2026-07-31) - Control comun para las 7 fullscreen

- Agrega `FullscreenShell`, un contenedor comun para workflows de pantalla amplia con cerrar, minimizar contenido y alternar vista contenida/fullscreen.
- Migra las 7 superficies que F378 habia dejado fullscreen por politica: Evidence Pack, Manual, Memoria Analitica, Layout Bunker, Dashboard, Checklist CNSNS y NCRP 151 Tables.
- Estas pantallas siguen siendo de lectura/trabajo amplio, pero ya no poseen overlays `fixed inset-0` propios; el comportamiento de ventana queda centralizado y trazable.
- Dashboard, Checklist y NCRP 151 Tables quedan normalizados con shell unico y sin encabezado legacy.
- Evidence Pack, Manual, Memoria Analitica y Layout Bunker quedan con shell superior comun; los cierres internos duplicados se retiran en F400.
- Scripts: `npm run prepare:f392-f398:fullscreen-shell` y `npm run test:f392-f398:fullscreen-shell`.

# F389-F391 (2026-07-31) - Cierre completo de migracion DialogShell

- Migra las 3 candidatas no P0 restantes de F378 a ventanas `DialogShell`: `CompareScenariosDialog`, `TutorialDialog` y `VersionHistoryDialog`.
- La cola F378 `migrate-window` queda cerrada: 6/6 candidatas migradas. Las 7 superficies que permanecen fullscreen quedan por politica funcional/regulatoria, no por omision.
- `Compare Scenarios` conserva comparacion A/B y export CSV, ahora como ventana movible/minimizable/expandible.
- `Tutorial` queda como guia flotante para practicar sobre el canvas sin bloquearlo.
- `Version History` conserva seleccion, restore y toast, ahora en ventana controlable.
- Scripts: `npm run prepare:f389-f391:dialogshell-migration` y `npm run test:f389-f391:dialogshell-migration`.

# F387-F388 (2026-07-31) - Renderer base v2 y fotorrealismo avanzado

- F378 queda cuantificado: 15 superficies clasificadas, 7 permanecen fullscreen por politica, 6 candidatas a migrar, 3 P0 migradas y 3 candidatas no P0 pendientes.
- F387 conecta renderer base v2 real para capas dinamicas seguras: `drawCanvasHeatmapLayer` y `drawCanvasSampleLinesLayer`; eventos, grips, snapping y seleccion quedan intactos.
- F388 activa perfil avanzado Three/R3F con ACES tone mapping, sombras PCF soft, DPR acotado, PBR procedural y panel visible de evidencia visual.
- Babylon sigue no instalado y Unity sigue gateado por URL externa; Three/R3F permanece como motor visual productivo.
- Scripts: `npm run prepare:f387-f388:renderer-photoreal` y `npm run test:f387-f388:renderer-photoreal`.

# F385-F386 (2026-07-31) - Capacidades productivas 3D

- Agrega auditoria ejecutable de capacidades productivas: Three/R3F, Babylon, Unity WebGL externo, DWG provider y runners Monte Carlo.
- Confirma que Babylon no esta instalado/activo en el bundle actual; se mantiene como adapter gateado.
- Refuerza Medical 3D con panel visible `F385-F386 capacidades productivas`: Three/R3F productivo, Babylon no instalado y Unity URL pendiente/configurada.
- Agrega smoke F386 para validar Three/R3F y probar Unity externo cuando exista `F386_UNITY_WEBGL_URL` o `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.
- Scripts: `npm run prepare:f385:production-capability-audit`, `npm run prepare:f386:three-unity-smoke` y `npm run test:f385-f386:productive-capabilities`.

# F384 (2026-07-31) - Estado honesto del backlog post-beta

- Agrega manifest de estado para Babylon, Unity WebGL externo, proveedor DWG, runners GATE/EGSnrc/Geant4, renderer base v2 y fotorrealismo avanzado.
- Declara que F378 P0 de ventanas espaciales si esta cerrado por F379-F382.
- Declara que Babylon runtime activo, Unity real publicado, DWG live provider y Monte Carlo externo clinico siguen gateados hasta smoke live.
- Scripts: `npm run prepare:f384:post-beta-backlog` y `npm run test:f384:post-beta-backlog`.

# F383 (2026-07-31) - QA de integracion P0 DialogShell

- Agrega contrato de integracion para las tres herramientas P0 migradas desde F378.
- Verifica lazy imports, estados de apertura/cierre, callbacks de toolbar y ramas render de `BarrierEditor`, `AirKermaOverlay` y `ControlPointsDialog`.
- Complementa los smokes visuales existentes de canvas/ventanas sin cambiar renderer ni menus.
- Script: `npm run test:f383:p0-integration-qa`.

# F382 (2026-07-31) - Cierre P0 DialogShell

- Cierra la cola P0 de la auditoria F378.
- Verifica que `BarrierEditor`, `AirKermaOverlay` y `ControlPointsDialog` ya usan `DialogShell`.
- Agrega guardrail para impedir que cualquiera de esas tres herramientas vuelva al overlay `fixed inset-0 z-50 bg-black/50`.
- Script: `npm run test:f382:p0-dialogshell-closure`.

# F381 (2026-07-31) - Control Points en ventana controlable

- Migra `ControlPointsDialog` del overlay fullscreen legacy a `DialogShell`.
- Conserva vista mini del floorplan, puntos numerados, alta de punto de control, meta de diseno, posicion y ocupacion.
- El dialog ahora hereda arrastre, minimizar, expandir/restaurar, cerrar y pass-through al minimizar.
- Cierra el tercer candidato P0 de la auditoria F378 sin tocar la logica de puntos ni actualizacion.
- Script: `npm run test:f381:control-points`.

# F380 (2026-07-30) - Air Kerma Overlay en ventana controlable

- Migra `AirKermaOverlay` del overlay fullscreen legacy a `DialogShell`.
- Conserva selector de barreras, grafica canvas, curva sin blindaje, curva blindada, meta de diseno, metricas y accion **Export PDF**.
- El overlay ahora hereda arrastre, minimizar, expandir/restaurar, cerrar y pass-through al minimizar.
- Cierra el segundo candidato P0 de la auditoria F378 sin tocar formulas ni distribuciones de kerma.
- Script: `npm run test:f380:air-kerma-overlay`.

# F379 (2026-07-30) - Barrier Editor en ventana controlable

- Migra `BarrierEditor` del overlay fullscreen legacy a `DialogShell`.
- Conserva seleccion de barrera, supuestos, factores U/T/P, material, espesores equivalentes y accion **Generate Recommendations**.
- Agrega estado vacio trazable cuando no hay barreras creadas.
- El editor ahora hereda arrastre, minimizar, expandir/restaurar, cerrar y pass-through al minimizar.
- Cierra el primer candidato P0 de la auditoria F378 sin tocar renderer base ni calculos.
- Script: `npm run test:f379:barrier-editor`.

# F378 (2026-07-30) - Auditoria de modales fullscreen legacy

- Agrega politica `F378_FULLSCREEN_DIALOG_POLICY` para clasificar dialogs legacy antes de migrarlos.
- Genera reporte JSON/CSV/MD en `outputs/f378_legacy_modal_audit/`.
- Define que workflows de documentos, evidencia, dashboard, tablas y checklist pueden quedarse fullscreen con encabezado formal.
- Prioriza migracion P0 a ventana controlable para herramientas espaciales/canvas: Barrier Editor, Air Kerma Overlay y Control Points.
- Evita migraciones masivas riesgosas sobre ~100 dialogs; cada migracion futura debe tener close/minimize/restore y smoke.
- Scripts: `npm run prepare:f378:legacy-modal-audit` y `npm run test:f378:legacy-modal-audit`.

# F377 (2026-07-30) - Paneles laterales controlables

- Agrega `SidePanelShell` reutilizable para paneles laterales con minimizar, restaurar y cerrar.
- Migra FAQ y Extension Warehouse al shell lateral uniforme.
- Refuerza RAG Vector Database y Memorias de Calculo con controles F377 de minimizar/restaurar/cerrar sin tocar su logica interna.
- Reduce paneles laterales que obstruyen el canvas al revisar plano, evidencia, RAG o memoria de calculo.
- Guardrail: no cambia renderer base, eventos CAD ni motores de calculo.
- Script: `npm run test:f377:side-panels`.

# F376 (2026-07-30) - Controles de ventanas sobre canvas

- Refuerza `DialogShell` para que sus controles de minimizar, expandir y cerrar sean trazables y accesibles.
- Cuando una ventana comun queda minimizada, el overlay deja pasar eventos al canvas para no bloquear el floorplan.
- Convierte `SourceSelector` en una ventana CAD operable: arrastrable, minimizable, expandible, restaurable y cerrable.
- Agrega cierre con etiqueta accesible para evitar overlays sin salida clara al usar **Fuente** desde el dock CAD.
- Smoke F376 valida abrir Fuente, minimizar, volver a usar el dock del canvas, restaurar, expandir y cerrar.
- Scripts: `npm run test:f376:window-controls` y `npm run test:f376:window-controls-smoke`.

# F375 (2026-07-30) - Canvas limpio / guia

- Agrega modo persistente **CAD Limpio** para liberar el plano ocultando overlays auxiliares grandes.
- Agrega modo **CAD Guia** para recuperar paneles de estado, escenas, mini vistas y export visual.
- Mantiene una tira compacta F375 con estados F214/F217 para compatibilidad con smokes y trazabilidad sin ensuciar el canvas.
- El dock CAD F374 muestra el modo actual y sigue disponible en ambos modos.
- Al activar modo limpio se ocultan paneles flotantes, se colapsa leyenda y se conserva acceso por controles superiores.
- Scripts: `npm run test:f375:clean-workspace` y `npm run test:f375:clean-workspace-smoke`.

# F374 (2026-07-30) - Accesos rapidos ejecutables + dock CAD del canvas

- Repara accesos rapidos de Sidebar para que ejecuten callback real o abran un dialog fallback: Calcular, UAQ, Memoria IA, Materiales y DXF/DWG.
- Agrega confirmacion visible y toast de accion enviada para evitar botones mudos.
- Refuerza favoritos superiores F112 con confirmacion y `data-testid` de prueba.
- Agrega dock CAD F374 sobre el canvas con comandos reales: Plano, Muro, Fuente, Zona, Calc, 3D y Evidencia.
- No cambia renderer base ni eventos profundos; prepara ese trabajo para una fase separada de bajo control.
- Scripts: `npm run test:f374:quick-canvas` y `npm run test:f374:quick-canvas-smoke`.

# F371-F372 (2026-07-28) - Beta visual smoke + static package

- F371 agrega smoke Playwright visual para shell, canvas, sidebar, menu Archivo, boton derecho, Memoria IA, PDF Report, Evidence Pack y Medical 3D.
- Genera capturas reales de la app y una lamina visual Three/R3F + Unity WebGL externo + motores MC + flujo de memoria analitica.
- F372 empaqueta `dist/` como beta frontend estatica en ZIP, con manifiesto de alcance, commit, screenshots y claims bloqueados.
- Mantiene Unity WebGL como visor externo por handoff y Babylon como pendiente.
- Scripts: `npm run test:f371-f372:beta-visual`, `npm run prepare:f372:beta-package` y `npm run test:f371-f372:beta-contracts`.

# F367-F370 (2026-07-28) - Release integration: 3D evidence, Unity, external engines and beta gate

- Conecta evidencia visual 3D a Memoria IA, PDF Report y Evidence Pack.
- Formaliza Unity WebGL como visor externo por URL/handoff; no se empaqueta dentro del bundle React.
- Formaliza GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy como runners externos con manifiesto, hash, version, fisica, seed, historias e incertidumbre.
- Agrega `src/lib/f367F370ReleaseIntegration.ts` y export F367-F370 desde Medical 3D.
- Fotorrealismo avanzado queda en Three/R3F PBR + capturas; Babylon sigue pendiente hasta resolver dependencia/smoke.
- Genera `outputs/f367_f370_release_integration/f367_f370_release_integration.json`.
- Scripts: `npm run prepare:f367-f370:release-integration` y `npm run test:f367-f370:release-integration`.

# F365-F366 (2026-07-28) - Visual evidence pack + QA gate

- Medical 3D convierte el boton PNG en captura trazada: workflow, filename, `sceneHash`, checklist y estacion activa.
- Agrega panel F365-F366 con historial de capturas, faltantes por preset y estado `pending/review/ready`.
- Nuevo export `medical_3d_visual_evidence_pack_*.json` para Memoria IA, PDF, Evidence Pack y anexos CNSNS/UAQ.
- El JSON general de revision ahora incluye `visualEvidenceGate` y `visualEvidenceCaptures`.
- No cambia calculos, geometria, renderer base ni dependencias.
- Script: `npm run test:f365-f366:visual-evidence-pack`.

# F364 (2026-07-28) - Three/R3F visual workflow

- Medical 3D agrega presets de flujo visual: vista general, barreras, equipos, dosis y recorrido.
- La escena Three/R3F dibuja ruta de estaciones F147 con marcadores numerados y resalta la estacion activa.
- Se agrega checklist visual de geometria, materiales, equipos, contexto dosis/zonas y bookmarks.
- El JSON de revision incluye `visualWorkflow`, `visualWorkflowChecklist` y `stationBookmarks`.
- Nuevo export: `medical_3d_visual_workflow_*.json` para Memoria IA, PDF y Evidence Pack.
- Script: `npm run test:f364:three-visual-workflow`.

# F363 (2026-07-28) - Three/R3F inspection aids + Babylon repair lane

- Medical 3D agrega ayudas visuales activables en Three/R3F: bandas de material/espesor, footprints de equipos, guias visuales de haz/fuente y cotas de sala.
- El export JSON de revision ahora incluye `threeR3fInspection` y `babylonReadiness` para dejar trazabilidad del visor activo y del carril Babylon.
- Se documentan alternativas de instalacion/reparacion de Babylon: npm normal, cache local del repo, pnpm/corepack y tarballs locales.
- Babylon permanece desactivado como dependencia runtime hasta resolver instalacion; Three/R3F sigue como motor estable.
- Script: `npm run test:f363:three-babylon-readiness`.

# F361 (2026-07-26) - Reparacion post-beta: canvas, ventanas, Archivo, RAG y manuales

- Corrige regresiones visibles de la beta: boton derecho del canvas ahora abre menu contextual CAD con seleccionar, barrera, fuente, medicion, ajustar vista, exportar PNG, calcular, evidencia, 3D, duplicar y borrar seleccionado.
- `DialogShell` agrega arrastre por encabezado, minimizar, expandir/restaurar y cerrar para que las ventanas no bloqueen permanentemente el floorplan.
- Accesos rapidos y chips F112 usan fallback al registro real de dialogs; se corrige `updateApp` por `updateCenter`.
- Menu Archivo F295 usa ancho estable, colision con viewport y fallbacks para Abrir, DXF, STEP, PDF, CNSNS, auditoria, logs, glosario y acerca de.
- El PDF `MID_55672_F_Cyclone_KIUBE_SRG_Rev G_No drawings.pdf` se deduplica por SHA-256 e indexa como evidencia RAG/chunks si contiene texto extraible.
- Actualiza `MANUAL_USUARIO_v99.md`, `MANUAL_VERSIONES_v50.md` y Update Center con cobertura F99-F360 y reparacion F361.
- Scripts: `npm run prepare:f361:post-beta-repair` y `npm run test:f361:post-beta-repair`.

# F356-F360 (2026-07-26) - Beta release gate

- Closes the current stabilization line as an operational beta, not a certified clinical/engineering release.
- Adds F356 user-test checklist, F357 missing-data capture, F358 traceable preliminary calculations, F359 beta Memoria draft and F360 beta release decision.
- Keeps all calculations unsigned with no final thickness output until geometry, workload, citations, penetrations and final professional review are locked.
- Generates visual HTML/SVG, CSV gates, beta Memoria draft and `radshield_f356_f360_beta_release.zip`.
- Scripts: `npm run prepare:f356-f360:beta-release` and `npm run test:f356-f360:beta-release`.

# F350-F355 (2026-07-26) - Real preliminary test package

- Builds an operator-ready preliminary package from F347 evidence blocks and F349 QA.
- Applies real/provider source labels where available, 1:100 traced-geometry placeholder, standard or memory-derived penetrations, and candidate TVL/density fingerprints.
- Explicitly bypasses FM/RSO only for workflow testing while keeping `signedCalculationProduced=false`.
- Generates visual smoke HTML/SVG, preliminary Memoria IA draft, missing-data closeout CSV, report evidence draft, consistency matrix and operator package ZIP.
- Scripts: `npm run prepare:f350-f355:real-test-package` and `npm run test:f350-f355:real-test-package`.

# F349 (2026-07-26) - Evidence surface QA close

- Adds QA closure for the F348 app/report evidence surfaces.
- Verifies five surfaces, twenty bindings, visual artifacts, docs/update-center readiness and unsigned calculation status.
- Generates `f349_evidence_surface_qa.svg` and QA checks CSV.
- Scripts: `npm run prepare:f349:evidence-surface-qa-close` and `npm run test:f349:evidence-surface-qa-close`.

# F348 (2026-07-26) - App surface evidence handoff

- Binds F347 evidence blocks to Canvas, Memoria IA, Evidence Pack, PDF draft and Medical 3D inspection surfaces.
- Creates 20 preliminary bindings: 4 evidence blocks x 5 app/report surfaces.
- Generates `f348_app_surface_handoff.svg`, `f348_app_surface_handoff.html` and `f348_surface_bindings.csv`.
- Scripts: `npm run prepare:f348:app-surface-evidence-handoff` and `npm run test:f348:app-surface-evidence-handoff`.

# F347 (2026-07-26) - Memoria IA evidence blocks

- Converts F346 standard-parameter rows into preliminary Memoria IA evidence blocks for LINAC, Gamma Knife, cyclotron and radiofarmacia/hot lab.
- Adds narrative sections with method, inputs, outputs, assumptions, warnings, required citations and final-review gates.
- Adds report handoff flags for Memoria IA, PDF and Evidence Pack while keeping signed calculations disabled.
- Generates visual progress artifacts: `f347_memoria_evidence_visual.svg` and `f347_memoria_evidence_visual.html`.
- Scripts: `npm run prepare:f347:memoria-evidence-blocks` and `npm run test:f347:memoria-evidence-blocks`.

# F346 (2026-07-25) - Standard parameter draft

- Applies standard draft geometry, source terms, material density/TVL candidates, typical penetrations and final FM/RSO review gates to the F345 barrier matrix.
- Adds draft values for Versa HD 15 MeV, Gamma Knife Esprit, Cyclone KIUBE 18 MeV and radiofarmacia/hot lab context.
- Computes draft structural load from high-density concrete density and standard wall thickness, while keeping all signed use blocked.
- Generates visual progress artifacts: `f346_standard_parameter_visual.svg` and `f346_standard_parameter_visual.html`.
- Scripts: `npm run prepare:f346:standard-parameter-draft` and `npm run test:f346:standard-parameter-draft`.

# F345 (2026-07-25) - Centro Neuro draft calculation packet

- Adds a visual-first draft calculation packet for Centro Neuro with 24 barrier rows across LINAC, Gamma Knife, cyclotron and radiofarmacia/hot lab context.
- Carries `1:100`, `publico en general` and `T=1` into calculation inputs while keeping every thickness blocked.
- Adds method IDs for NCRP 151 LINAC, Co-60/Gamma Knife, 18 MeV cyclotron and nuclear medicine hot lab checks.
- Generates visual progress artifacts: `f345_visual_progress.svg` and `f345_visual_progress.html`.
- Scripts: `npm run prepare:f345:centro-neuro-draft-calculation-packet` and `npm run test:f345:centro-neuro-draft-calculation-packet`.

# F344 (2026-07-25) - Centro Neuro public occupancy markup

- Confirms the Centro Neuro scale as `1:100` for draft canvas markup while keeping final calculation scale check explicit.
- Applies all unknown adjacencies as `publico en general` with conservative draft `T=1`.
- Moves FM/RSO review to the final signed-calculation release gate; it does not block drawing, layer setup or operator markup.
- Adds canvas layer, room and barrier draft artifacts for Versa HD, Gamma Knife Esprit, KIUBE and radiofarmacia/hot lab context.
- Scripts: `npm run prepare:f344:centro-neuro-public-occupancy-markup` and `npm run test:f344:centro-neuro-public-occupancy-markup`.

# F343 (2026-07-25) - Centro Neuro source/occupancy preflight

- Adds an operator preflight for the real Centro Neuro case using the provided equipment set: Elekta Versa HD 15 MeV, Elekta Gamma Knife Esprit and IBA Cyclone KIUBE 18 MeV.
- Uses maximum workload only as a conservative planning assumption; no signed shielding calculation is emitted.
- Adds equipment, occupancy and penetration worksheets plus material evidence gates for high-density concrete.
- Requires source-term report, approved occupancy, penetration markup, versioned TVL/density, scale check and qualified review before final calculations.
- Scripts: `npm run prepare:f343:centro-neuro-preflight` and `npm run test:f343:centro-neuro-preflight`.

# F342 (2026-07-25) - Centro Neuro visual evidence

- Adds a visual review HTML for the Centro Neuro case using the F340 overlay, F341 scale/material/source data and pending inputs.
- Adds browser smoke targets for canvas shell, Update Center, Medical 3D, Memoria IA, Evidence Pack and the visual review board.
- Keeps the visual outputs as review/evidence artifacts only; they do not certify shielding without final source, occupancy, penetration and material evidence.
- Scripts: `npm run prepare:f342:centro-neuro-visual-evidence`, `npm run test:f342:centro-neuro-visual-evidence` and `npm run test:f342:browser-smoke`.

# F341 (2026-07-25) - Centro Neuro calibrated trial

- Accepts the user-provided 1:100 scale for the Centro Neuro real-case dry run and derives a provisional 0.01693333 m/px render scale at 150 dpi.
- Adds source-term templates for Cyclotron/CY, Gamma Knife-LGK/TX and LINAC/TX.
- Sets `Concreto alta densidad` as the draft default material while keeping TVL/density evidence gated before signed calculations.
- Adds explicit penetration and occupancy TODOs instead of guessing final values.
- Adds a browser smoke for shell, canvas and Update Center evidence.
- Scripts: `npm run prepare:f341:centro-neuro-calibrated-trial`, `npm run test:f341:centro-neuro-calibrated-trial` and `npm run test:f341:browser-smoke`.

# F340 (2026-07-25) - Centro Neuro operator trial

- Converts the F339 seed into an operator dry-run package for canvas import, scale calibration, room tracing, equipment placement, calculation preflight, Medical 3D snapshots and report exports.
- Adds a visual SVG overlay for the Centro Neuro plan with Cyclotron/CY, Radiofarmacia/NM, Gamma Knife-LGK/TX and LINAC/TX regions.
- Defines locked background, working layers, structural-load layer, heatmap/isodose layer and explicit calculation blockers.
- Keeps all calculations draft-only until scale, source terms, occupancy, materials, penetrations and qualified review are complete.
- Scripts: `npm run prepare:f340:centro-neuro-operator-trial` and `npm run test:f340:centro-neuro-operator-trial`.

# F339 (2026-07-25) - Centro Neuro real case trial

- Adds a real-case operator package from `CENTRO NEURO PLANTA BAJA 040626.pdf`.
- Renders the AutoCAD PDF to a canvas background seed and records source SHA256, PDF metadata and render evidence.
- Defines three trial scenarios: cyclotron/CY, Gamma Knife-LGK/TX and LINAC/TX, with Radiofarmacia as NM workflow context.
- Captures visible structural load clues from the plan: LGK 36,502 kg and LINAC 3,341 kg.
- Keeps calculations gated until scale, source terms, occupancy, materials and qualified review are confirmed.
- Scripts: `npm run prepare:f339:real-case-centro-neuro` and `npm run test:f339:real-case-centro-neuro`.

# F331-F338 (2026-07-25) - Static release close

- Adds a release-close manifest for Medical 3D modality QA, 3D visual evidence, calculation QA queue, material/structural readiness, RAG/document closure, reports, canvas QA and static package.
- Copies the current F200 static package as `outputs/f331_f338_static_release_close/radshield-mx-f338-static-release.zip` when the F200 gate is ready.
- Records six modality checks: LINAC, Gamma Knife, HDR, CT, PET/CT and Radiofarmacia.
- Keeps DB/API/RAG live outside the public static host until restore probe, secrets and fullstack smoke pass.
- Scripts: `npm run prepare:f331-f338:static-release-close` and `npm run test:f331-f338:static-release-close`.

# F325-F330 (2026-07-25) - Medical 3D photoreal readiness

- Adds collision-aware WASD walkthrough for walls and equipment in Medical 3D.
- Adds material PBR profiles, clinical/inspection/warm lighting presets and a photoreal walkthrough toggle on the stable Three/R3F path.
- Adds `sceneHash`, `visualEvidence` and `assetPipeline` fields to Medical 3D review JSON for Memoria IA, PDF and Evidence Pack traceability.
- Keeps Babylon as a retry-after-install path; no Babylon runtime is bundled until dependencies install and visual smoke passes.
- Scripts: `npm run prepare:f325-f330:medical-3d-photoreal` and `npm run test:f325-f330:medical-3d-photoreal`.

# F324 (2026-07-25) - Pointer-lock walkthrough

- Adds optional mouse-look for Medical 3D walkthrough: enable `Recorrido WASD`, then enable `Mouse-look` and click inside the scene.
- Supports browser-native `Esc` release, yaw/pitch mouse control, pitch clamp, Shift/Ctrl speed modifiers, R/F eye height and room bounds.
- Keeps OrbitControls available whenever walkthrough is disabled and does not affect calculations, RAG, reports or exports.
- Scripts: `npm run prepare:f324:pointer-lock-walkthrough` and `npm run test:f324:pointer-lock-walkthrough`.

# F317-F323 (2026-07-25) - Medical 3D release line

- Adds release-line contracts for Three/R3F modality smoke, Babylon dependency unlock, Babylon staged prototype, PBR materials, WebGPU/WebXR gate, Unity external proof and 3D exports to reports.
- Improves WASD walkthrough with Shift speed, Ctrl precision, R/F eye height and bounded room navigation.
- Documents the post-F324 photorealistic walkthrough roadmap.
- Scripts: `npm run prepare:f317-f323:medical-3d-release-line` and `npm run test:f317-f323:medical-3d-release-line`.

# F316 (2026-07-25) - Babylon dependency diagnostics

- Adds an explicit diagnostics phase for Babylon dependency activation.
- Confirms the code path is ready but package installation is currently blocked by `EACCES` on `https://registry.npmjs.org/*`.
- Keeps Three/R3F as the active stable fallback and avoids partial dependency changes.
- Scripts: `npm run prepare:f316:babylon-install-diagnostics` and `npm run test:f316:babylon-install-diagnostics`.

# F315 (2026-07-25) - Unity external viewer bridge

- Adds `src/lib/medical3D/unityExternalViewerBridge.ts` to build a Unity launch packet and optional external viewer URL.
- Medical 3D now exposes Unity readiness, export `medical_3d_unity_handoff_*.json` and an `Abrir Unity` action gated by `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.
- Unity remains outside the React bundle and cannot replace calculations, citations, warnings, PDF or Evidence Pack.
- Scripts: `npm run prepare:f315:unity-external-viewer-bridge` and `npm run test:f315:unity-external-viewer-bridge`.

# F314 (2026-07-25) - Babylon runtime loader

- Adds `src/lib/medical3D/babylonRuntimeLoader.ts` with dynamic runtime loading and mandatory fallback to Three/R3F.
- Records the Babylon install command and activation flags while keeping the current build stable if packages are unavailable.
- `npm install @babylonjs/core @babylonjs/loaders` was attempted but did not complete in this restricted environment.
- Scripts: `npm run prepare:f314:babylon-runtime-loader` and `npm run test:f314:babylon-runtime-loader`.

# F313 (2026-07-25) - NIST XCOM mixture/RAG

- Adds NIST XCOM source trace and mixture attenuation helpers for weight-fraction material comparisons.
- NIST XCOM dialog now exposes a mixture panel with density, mass attenuation, linear attenuation and mixture TVL.
- Generates a hashed RAG/DB seed candidate for XCOM source policy and mixture method without writing to live DB.
- Scripts: `npm run prepare:f313:nist-xcom-mixture-rag` and `npm run test:f313:nist-xcom-mixture-rag`.

# F312 (2026-07-25) - Unity external handoff

- Adds `src/lib/medical3D/unityWebglHandoff.ts` as the Unity WebGL external viewer contract.
- Adds explicit external-viewer flags: `VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER` and `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.
- Keeps Unity outside the React bundle; Unity can receive JSON/OBJ/future GLTF and return snapshots/camera bookmarks only after dedicated visual smoke.
- Scripts: `npm run prepare:f312:unity-external-handoff` and `npm run test:f312:unity-external-handoff`.

# F311 (2026-07-25) - Babylon safe adapter

- Adds `src/lib/medical3D/babylonAdapter.ts` as a runtime-free Babylon integration contract.
- Adds explicit feature flags for future Babylon activation: `VITE_MEDICAL_3D_BABYLON_ADAPTER` and `VITE_MEDICAL_3D_BABYLON_RUNTIME`.
- Keeps Babylon packages out of `package.json` until the real Three/R3F operator trial passes and a dedicated visual smoke is available.
- Scripts: `npm run prepare:f311:babylon-safe-adapter` and `npm run test:f311:babylon-safe-adapter`.

# F310 (2026-07-25) - Real operator Three/R3F trial

- Adds an operator-ready trial gate for the Medical 3D viewer with Three/R3F as the active engine.
- Generates a real-use checklist covering project load, scale, equipment, materials, shielding calculation, 3D inspection, exports, Memoria IA, PDF and Evidence Pack.
- Keeps Babylon.js and Unity WebGL out of the runtime bundle for now; Babylon remains the next staged adapter and Unity remains a final external viewer.
- Scripts: `npm run prepare:f310:real-operator-three-r3f` and `npm run test:f310:real-operator-three-r3f`.

# F307-F309 (2026-07-25) - 3D engine release

- Adds `src/lib/medical3D/renderStrategy.ts` with ordered engine strategy: Three/R3F active, Babylon PBR/WebGPU/WebXR adapter-ready and Unity WebGL deferred.
- Medical 3D dialog now exposes a render engine selector and exports a 3D handoff JSON for external viewers/adapters.
- Babylon is intentionally not bundled yet; it is a future feature-flag adapter with fallback to Three/R3F.
- Unity WebGL is explicitly deferred to the final stage as an external heavy viewer, not a clinical calculation engine.
- Scripts: `npm run prepare:f307-f309:3d-engine-release` and `npm run test:f307-f309:3d-engine-release`.

# F301-F306 (2026-07-25) - Functional release close

- Adds final six-phase closure plan: panel docking, renderer/event gate, canvas E2E, Memoria IA full case, DB/RAG readback and release/deploy decision.
- Documents realistic 3D strategy: Three.js/R3F as primary, Babylon.js/WebGPU/WebXR as phase 2, Unity WebGL as optional external heavy viewer and Unreal Pixel Streaming outside static release scope.
- Adds external motor process preview: floorplan, materials, case pack, runner, results and evidence.
- Keeps high-risk CAD renderer work behind future E2E/rollback path.
- Scripts: `npm run prepare:f301-f306:functional-release-close` and `npm run test:f301-f306:functional-release-close`.

# F296-F300 (2026-07-25) - Canvas 3D workbench

- Main sidebar now starts visible with bounded workspace width: 260 px default, 244 px minimum and 300 px maximum.
- Keeps clean canvas startup: workflow, QA and continuity panels hidden by default, with quick CAD rail collapsed.
- Adds a local navigable medical 3D preview with room, shielded walls, equipment footprint, controlled zone, dose heatmap and camera sliders.
- Defines external runner contracts for GATE/OpenGATE, EGSnrc/egs_brachy, Geant4 standalone and APS/ODA DWG conversion.
- Adds F296-F300 manifest and contracts for the next renderer/event redesign pass.

# F295 (2026-07-25) - Canvas redesign smoke

- Moved `Archivo` to the beginning of the main toolbar and hid the legacy duplicated menu zone.
- Changed canvas startup to a clean workspace: workflow, QA and continuity panels are hidden by default and recoverable from compact chips.
- Collapsed the quick CAD sidebar by default to protect floorplan visibility.
- Superseded by F296: the main sidebar now starts visible with bounded width and still preserves manual collapse.
- Added F295 manifest, contract and a static medical 3D preview for the next redesign pass.

# F294 (2026-07-25) - Real guided smoke

- Added F294 guided smoke package for the first real operator-run case.
- Selects `TX-LINAC-6MV-001` by default because F291 marks it ready.
- Generates operator evidence checklist and deviation log template without DB live writes.
- Keeps output blocked from clinical certification until qualified review closes deviations.

# F293 (2026-07-25) - Static release refresh + real trial protocol

- Added F293 release refresh gate over F200/F291/F292.
- Freezes static package evidence and adds a 10-step operator protocol for the first real guided project test.
- Keeps publish path static/frontend-only and requires post-deploy public smoke before clinical/regulatory use.

# F292 (2026-07-25) - Real project floorplan QA

- Added floorplan QA gate for real project entry before renderer/event-controller changes.
- Checks canvas/sidebar visibility, plan/DXF import path, scale calibration, layers, dimensions, equipment symbols, heatmap/isocontour legend, visual export, medical 3D handoff and movable workflow panels.

# F291 (2026-07-25) - Calculation real-case hardening

- Added real-case calculation hardening layer over F290 matrix.
- Maps each DX/TX/NM/CY test case to numeric QA cases, required warnings, evidence policy and release decision.
- Keeps DX/NM operator-input-required where signed floorplan/memory evidence is still missing.

# F290 (2026-07-25) - Real clinical testing matrix

- Added DX/TX/NM/CY real-case testing matrix with floorplan/equipment/report acceptance criteria.
- Keeps clinical signed release blocked until real signed memories, citations and blocker/major deviations are closed.

# F289 (2026-07-25) - Memoria IA RAG handoff

- Added citation index and modality bundles for Memoria IA using F287 approved-only evidence.
- Each citation keeps `citationId`, `pageRef`, `sourceHash` and `chunkHash`.
- NCRP/IAEA/UAQ remain canonical; OCR memories are examples/evidence only.

# F288 (2026-07-25) - RAG approved validation

- Added approved-only corpus validation for F287 rows without writing DB.
- Checks traceability, duplicates, review exclusions and retrieval smoke by modality.
- DB readback is optional/read-only with `F288_DB_READBACK=1`.

# F287 (2026-07-25) - Approved-only RAG seed

- Added an approved-only seed lane after F286 review.
- F286 rows marked `needs-reocr`, `needs-redaction` or `reject` are excluded from insertion.
- F285 QA-ready chunks remain prepared for local/private RAG when not explicitly excluded by review.
- Live DB writes remain gated by `F287_SEED_LIVE=1`, `F287_CONFIRM_APPROVED_ONLY=1` and `DATABASE_URL`.

# F286 (2026-07-25) - OCR human review packet

- Added an operator review packet before any live RAG seed from OCR memories.
- Exports sample-review pages, blocked pages and a CSV decision template with source/page/chunk hashes.
- Keeps F287 live seed blocked until all review rows are documented as approve, reject, needs-redaction or needs-reocr.
- Outputs: `outputs/f286_ocr_human_review_packet/f286_ocr_human_review_packet.json`, `f286_review_decisions_template.csv`, `f286_sample_review_pages.json` and `f286_blocked_pages.json`.

# F285 (2026-07-25) - Controlled RAG seed gate

- Added a controlled `document_chunks` seed phase for the F284 OCR/RAG candidate corpus.
- The default path is dry-run only and prepares DB-compatible rows with source/page/chunk hashes, modality and citation tags.
- Live DB writes require all three operator conditions: `F285_SEED_LIVE=1`, `F285_CONFIRM_REVIEWED=1` and `DATABASE_URL`.
- Outputs: `outputs/f285_controlled_rag_seed/f285_controlled_rag_seed.json`, `f285_document_chunks_db_rows.jsonl` and `f285_seed_report.json`.

# F279 (2026-07-25) - rollback OCR cloud por costo y ruta libre/local

- Google Document AI y Amazon Textract quedan desactivados/deferidos para OCR inicial porque pueden generar costo por pagina.
- Se agrega gate F279 para probar OCR libre/local con PDF.js, Poppler (`pdftotext`/`pdftoppm`), Tesseract y OCRmyPDF.
- Las dos memorias pendientes de OCR siguen como fixtures, pero no se envian a nube ni se procesan automaticamente.
- Regla nueva: usar OCR local/free primero; usar cloud OCR solo como excepcion aprobada si la calidad local falla.
- F280 agrega smoke OCR local de bajo riesgo: renderiza las primeras paginas de las memorias pendientes, corre Tesseract y genera JSONL draft para revision.
- F281 agrega OCR local completo/hibrido para memorias reales: usa texto nativo cuando el PDF ya es searchable y Tesseract solo en paginas escaneadas o con texto insuficiente. La salida no siembra DB automaticamente y queda como evidencia revisable para QA/dedupe/RAG.
- Nota operativa: Tesseract debe listar `spa` para considerar operativo el OCR en espanol. Si solo lista `eng/osd`, F281 sigue siendo util como borrador, pero no como seed final sin revision.
- F281 agrega soporte para `F281_TESSDATA_DIR`/`TESSDATA_PREFIX` y rutas WSL UNC comunes, de modo que puede usar `spa.traineddata`/`tessdata_best` instalado en Ubuntu cuando Windows lo exponga.
- F282 prepara chunks RAG desde F281 con hash de documento, pagina, modalidad inferida, hash de chunk y estado de revision. La DB sigue sin seed automatico hasta QA de paginas y gobierno de fuentes.
- F283 agrega QA de OCR/chunks: puntua paginas, selecciona muestras por documento, separa chunks listos para seed draft y chunks que requieren revision, sin activar seed automatico.
- F284 prepara un corpus candidato para `document_chunks` usando solo chunks seed-draft-ready y exporta aparte los chunks excluidos. No ejecuta escrituras live en DB.

# F273-F278 (2026-07-25) - validacion live controlada

- Agrega gate consolidado para validar credenciales OCR, APS/DWG, literatura y runners sin imprimir secretos.
- Confirma que Google/AWS/APS/Semantic/Crossref/GATE se revisan desde `.env`; Geant4 y EGSnrc quedan diferidos por decision operativa.
- No procesa PDFs, no sube DWG y no ejecuta Monte Carlo automaticamente; solo hace preflight y probe seguro de health cuando hay URL de GATE.
- OCR cloud queda deferido por costo. La prueba recomendada pasa a F279 local/free OCR.

# F269-F272 (2026-07-25) - OCR, DWG, literatura y Monte Carlo externo

- F269 agrega gate OCR cloud para Google Document AI y Amazon Textract sobre las dos memorias reales pendientes de OCR, sin llamadas live ni secretos en frontend.
- F270 agrega smoke de fixtures DWG para APS Design Automation: archivos DWG locales hasheados, ruta esperada a DXF/SVG, layer-map y scale-audit.
- F271 agrega deep-dive bibliografico con Crossref y Semantic Scholar como candidatos de evidencia; no modifica formulas, TVL ni constantes sin QA normativo.
- F272 agrega contrato de runners externos Monte Carlo para GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy con forward/reverse MC, hashes, version de motor, fisica, seed, historias e incertidumbre.
- Regla: estas fases preparan integracion backend/runner; el frontend publico sigue estable y sin proveedores vivos.

# F268-F268A (2026-07-25) - Real memories and external API readiness

- F268 agrega ingesta controlada de memorias analiticas reales desde Downloads: Versa HD 15 MV, Gamma Knife, Braqui Co-60 y Ciclotron/KIUBE.
- F268 deduplica por SHA256, conserva documentos canonicos, prepara chunks RAG y draft `document_chunks` sin sembrar live salvo `F268_SEED_LIVE=1`.
- F268A agrega gate de readiness para Google Document AI, Amazon Textract, Crossref, Semantic Scholar, ODA Drawings SDK, APS Design Automation, GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy.
- Regla: memorias reales son ejemplos/evidencia; normas NCRP/IAEA/UAQ siguen siendo canonicas para formulas. APIs/motores externos quedan backend/runner-only, sin secretos en frontend.

# Archivo Menu Closure (2026-07-25) - cierre funcional de Archivo

- Se cierra el menu Archivo como utilidad superior estable para frontend estatico.
- Submenus validados e integrados: Nuevo Proyecto, Abrir Proyecto, Guardar, Importar CSV, Importar DXF, Importar STEP/IGES, Exportar CSV, Exportar PDF, Compartir resultados, Exportar Reporte CNSNS, Especificaciones Tecnicas, Audit Trail, Analisis de Logs, Glosario y Acerca de.
- Se limpian rotulos internos de migracion/fallback en Archivo; los accesos quedan presentados como funciones finales.
- Alcance explicito: DB multiusuario y DWG nativo quedan fuera de este cierre. DWG continua como conversion externa a DXF.

# F267 (2026-07-25) - Real case smoke execution

- Se agrega `src/lib/f267RealCaseSmokeExecution.ts` para ejecutar smoke DX/TX/NM sobre el protocolo F265 y el kit F266.
- Se genera `outputs/f267_real_case_smoke_execution/real_case_smoke_deviation_log.csv` con filas iniciales para CT, LINAC 6 MV y PET F-18.
- Las filas usan baseline sintetico F264 y quedan marcadas para reemplazo por memoria analitica firmada antes de release clinico.

# F266 (2026-07-24) - Real case evidence kit

- Se agrega `src/lib/f266RealCaseEvidenceKit.ts` con checklist por perfil, evidencia minima, stop rules y plantilla CSV para desviaciones reales.
- Se generan `outputs/f266_real_case_evidence_kit/f266_real_case_evidence_kit.json` y `real_case_deviation_log_template.csv`.
- Se define que una desviacion blocker/major abierta detiene release clinico firmado, aunque el frontend estatico siga estable.

# F265 (2026-07-24) - Real app testing protocol

- Se agrega `src/lib/f265RealAppTestingProtocol.ts` para convertir F264 en protocolo operativo de pruebas reales por perfil DX/TX/NM/CY.
- Se definen pasos verificables: plano/escala/zonas, equipo/fuente, material, evidencia de calculo, Memoria IA/PDF/Evidence Pack y bitacora de desviaciones.
- Se agregan `prepare:f265:real-app-testing` y `test:f265:real-app-testing` para generar manifiesto JSON/Markdown antes de probar proyectos reales.
- Regla de release: no salida clinica firmada hasta probar DX/TX/NM reales sin desviaciones blocker/major; CY puede quedar gated si no hay caso real disponible.

# F264 (2026-07-24) - Real clinical trial gate and calculation engine hardening

- Se agrega `src/lib/realClinicalTrialCases.ts` con casos sinteticos de prueba real para LINAC 6 MV, LINAC 18 MV, CT, PET F-18, Gamma Knife Co-60 y HDR Ir-192.
- Se agrega validacion unificada de unidades en `unitNormalization.ts`: mm/cm, densidad, kg/m2, kPa, uSv/h y espesor negativo/cero.
- Se valida que cada caso tenga trazabilidad formula/norma/input/output, citas, comparador base-vs-conservador, cache F196, carga estructural y advertencias clinicas.
- Se agregan `prepare:f264:real-trial` y `test:f264:real-trial` para iniciar pruebas reales controladas sin tocar el canvas estable.

# F263 (2026-07-24) - APS DWG adapter gate

- Se agrega `api/cad-router.ts` con procedimientos `cad.apsDwgStatus` y `cad.apsDwgPlan` para preparar la ruta DWG->APS->DXF->importador DXF existente.
- Se agrega `api/lib/dwgApsDesignAutomationAdapter.ts` como adaptador backend seguro: calcula estado, fixtures faltantes, hashes de entrada y plan de conversion sin exponer secretos en frontend.
- Se agrega `src/lib/dwgApsDesignAutomationContract.ts` para documentar el contrato F263 en Memoria IA/Evidence/Update Center.
- La conversion live queda diferida a F264 hasta contar con `DWG_CONVERSION_PROVIDER=aps-design-automation`, credenciales APS, fixtures DWG no sensibles, validacion de capas/escala y confirmacion del operador.

# F261-F262 (2026-07-24) - DWG provider selection and fixture gate

- Se selecciona **Autodesk Platform Services Design Automation** como proveedor primario recomendado para DWG->DXF por fidelidad AutoCAD/capas/bloques.
- Se deja **ODA self-hosted** como ruta privada/enterprise de mediano plazo y **CloudConvert** solo como preview SVG/PDF/PNG, no como geometria canonica para calculo.
- Se conserva **manual DXF fallback** como ruta inmediata y rollback.
- Se agregan `dwgProviderSelection.ts`, `dwgFixtureGate.ts`, `fixtures/dwg/README.md` y scripts `prepare:f261-f262:dwg` / `test:f261-f262:dwg`.
- F262 queda esperando 2 DWG no sensibles: `small-architectural-plan.dwg` y `equipment-layout.dwg`.

# F258-F260 (2026-07-24) - Staging CAD, DWG boundary and DB gate

- F258 agrega `src/lib/canvas/eventControllerV2.ts`: controlador de eventos aislado para select/drag/snap/lasso/pan/zoom/delete/undo; por defecto enruta al `useCanvas` estable.
- F259 agrega `src/lib/dwgExternalProviderGate.ts`: contrato ejecutable para proveedor externo DWG->DXF/SVG/IFC, sin prometer DWG nativo en navegador.
- F260 agrega `scripts/f260-fullstack-db-gate.mjs`: manifest de DB/fullstack que valida `DATABASE_URL`, TCP, permisos de backup/restore probe y backend URL.
- Se agrega `test:f258-f260:full` y `prepare:f260:db-gate`.
- F125 incluye F258/F259 para que Memoria IA/Evidence reporte estado de event controller y boundary DWG.

# F257-F260 (2026-07-24) - Full execution gate

- F257 se ejecuta como paquete staging: `.env.staging-cad.example` activa `VITE_CANVAS_HIGH_RISK_CAD=true` y mantiene `VITE_CANVAS_EVENT_CONTROLLER_V2=false`.
- F258 queda listo para spike aislado de renderer/event controller v2, pero solo con E2E F229 y rollback a `useCanvas`.
- F259 define el limite seguro para proveedor externo DWG->DXF/SVG/IFC: hash, timeout, limite de archivo, auditoria y fallback DXF.
- F260 queda listo como gate DB/fullstack, pero bloqueado hasta `DATABASE_URL`, permisos de backup/restore probe, health backend y smoke live.
- Se agrega manifest ejecutable `outputs/f257_f260_full_execution/f257_f260_full_execution.json` y evidencia markdown `outputs/fase_257_260_full_execution.md`.
- Decision: frontend estatico queda como carril estable; CAD alto riesgo y DB/fullstack no se mezclan con el deploy publico.

# F256-F260 (2026-07-21) - Next phase roadmap post-RC

- Se define el orden posterior a F255: F256 smoke publico del ZIP actual, F257 staging con flags CAD, F258 spike renderer/event controller v2, F259 proveedor DWG externo y F260 regreso a DB/fullstack.
- Decision: publicar/verificar frontend estatico primero; CAD alto riesgo solo en staging/feature flag; fullstack solo con DB restore probe y backend smoke.
- F125 agrega la seccion F256-F260 para que Memoria IA/PDF/Evidence conozcan el estado del roadmap.

# F251-F255 (2026-07-19) - High-risk CAD feature-flag gate

- Se agrega el carril CAD alto riesgo con `VITE_CANVAS_HIGH_RISK_CAD=false` y `VITE_CANVAS_EVENT_CONTROLLER_V2=false` por defecto.
- F251-F255 prepara renderer/event controller v2, DWG externo, sync 2D/3D bidireccional, booleanas CAD y heatmaps GPU sin alterar el canvas estable del RC.
- Rollback: apagar ambos flags, limpiar `localStorage.radshield_feature_flags`, volver al artefacto F250 y repetir F197/F207/F229/F231-F236/F200.
- Se repitieron gates base antes de abrir el carril: F197, F207, F229, F231-F236 y F200.

# F248-F250 (2026-07-19) - Release candidate final estatico

- F248: se formaliza smoke contra URL publica/static; repetir F200 y F202/F203 despues de subir `dist` a Vercel/static host.
- F249: se separa frontend estable de fullstack real; DB/API/RAG privado quedan bloqueados hasta restore probe, secretos productivos y smoke backend.
- F250: se congela release candidate final estatico con manual v1-F250 y checklist de publicacion.
- Las mejoras CAD de alto riesgo quedan diferidas a rama/feature flag post-RC: rewrite renderer/eventos, DWG nativo, sync 2D/3D bidireccional, booleanas solidas y heatmaps GPU.

# F238-F247 (2026-07-19) - Release execution CAD/calculation/report gates

- F238: manual HTML y documentos pasan a cobertura v1-F247.
- F239/F243: se declara frontend estatico listo tras smoke F200/F230/F237/F238-F247; fullstack sigue bloqueado hasta DB live restore probe.
- F240/F241/F242: se formaliza mejora CAD bajo riesgo, renderer/eventos detras de feature flag y DWG solo por conversion externa a DXF/SVG con simbolos de equipo versionables.
- F244: se crea ledger TVL/HVL versionado con fuente, prioridad, page hint, hash y estado de revision por material/energia.
- F245: matriz numerica LINAC/CT/Gamma Knife/PET/UAQ queda conectada al cierre.
- F246: auditoria de materiales resume densidad, costo, carga estructural, TVL/HVL y revision de fuente.
- F247: checklist de anexos para PDF, Memoria IA y Evidence Pack: formula, norma, inputs, outputs, TVL/HVL, unidades, comparador, warnings y hashes.

# F237 (2026-07-19) - Calculation engine governance

- Se agrega `src/lib/f237CalculationEngineGovernance.ts` como capa unica de gobierno para el motor de calculo.
- La fase verifica trazabilidad formula/norma/input/output/citas, normalizacion de unidades, advertencias clinicas, comparador base/conservador, cache F196 y casos numericos conocidos.
- F125 ahora incluye la seccion F237 para que Memoria IA, PDF y Evidence Pack puedan reportar si un resultado esta listo, requiere revision o queda bloqueado.
- Se corrige el manual HTML: la cobertura visible ya no termina en v116; queda marcada como v1-F237 y se documentan las fases posteriores.
- Impacto: menos riesgo de resultados sin fuente, unidades mezcladas, TVL no versionado o reportes firmados sin revision RSO/fisico medico.

## F231-F236 (2026-07-19) - Canvas release coverage

- F231: se consolidan baselines visuales con capturas F229/F207 para detectar canvas blanco, sidebar perdida o menus sobrepuestos.
- F232: se cierra fixture DXF/DWG mediante smoke F207; DWG permanece como conversion externa a DXF/SVG.
- F233: se cubre grip/snap con F229 E2E; coordenadas exactas quedan para event controller v2 con feature flag.
- F234: se valida superficie de isocontornos/leyenda exportable; interpolacion numerica firmable queda como mejora del motor.
- F235: se consolida handoff 2D/3D con escenas, equipos, espesores y snapshots; sync bidireccional queda aislado.
- F236: se deja paquete post-deploy con F200 y URL publica para repetir F154-F158/F202.
- Se agregan recomendaciones priorizadas para motor de calculo: trazabilidad, unidades, TVL/HVL versionados, comparador conservador y QA numerico por modalidad.

## F230 (2026-07-19) - post-F229 coverage gate

- Se agrega `f230PostF229CoverageGate.ts` para decidir cuando es seguro modificar renderer base y logica de eventos.
- Criterio obligatorio antes de tocar renderer/eventos: F198 menus/botones, F207 flujo funcional, F229 canvas E2E y F200 release estatico deben estar en verde.
- Canvas muestra fila `F230 Gate` con estado de menus, funcional, canvas E2E, release, shell y documentacion.
- Update Center, manuales, control de cambios y `public/manual_usuario.html` documentan la version vigente.
- Pendientes convertidos en fases: F231 pixel-diff visual, F232 fixture DXF/DWG, F233 grip/snap exacto, F234 isocontornos numericos, F235 sync 2D/3D y F236 post-deploy URL smoke.

## F229 (2026-07-19) - Canvas CAD E2E Harness

- Se agrega `e2e/canvas-cad-e2e-harness.spec.ts` como arnes Playwright dedicado para el canvas profesional.
- Cobertura: canvas/sidebar/toolbar visibles, filas F221-F229, superficie no vacia, dibujo de muro, seleccion/inspector, ventana/lasso, modos Plano/Heat/Iso/Estructura y controles F217 de export visual.
- Se agrega `src/lib/f229CanvasCadE2EHarness.ts` y fila F229 en el canvas para auditar cobertura E2E y pendientes.
- Artefactos: `outputs/f229_canvas_cad_e2e_harness/f229_canvas_cad_e2e_harness.json` y `outputs/fase_229_canvas_cad_e2e_harness.md`.
- Pendiente posterior: pixel-diff visual, fixture DXF dedicado, grip drag con coordenadas exactas, isocontornos numericos y sync 2D/3D.

## F228 (2026-07-19) - Static render helpers

- Se agrega `src/lib/canvas/renderStaticHelpers.ts` con helpers puros `drawCanvasBackgroundGrid`, `drawFloorPlanImageLayer` y `drawCanvasScaleHud`.
- `useCanvas.draw()` ahora usa esos helpers para grid/base, imagen del plano y HUD de escala.
- Se agrega `f228StaticRendererHelpers.ts` y fila F228 en el canvas para auditar helpers activos y calibracion.
- Guardrail: no se mueven barreras, seleccion, grips, lasso, overlays CAD ni eventos base.
- Artefactos: `outputs/f228_static_render_helpers/f228_static_render_helpers.json` y `outputs/fase_228_static_render_helpers.md`.

## F227 (2026-07-19) - Renderer layer extraction

- Se agrega `src/lib/canvas/renderLayerRegistry.ts` como primer corte real del renderer por capas.
- El registro define orden, grupo, dirty triggers, estado de migracion y guardrails para `background-grid`, `floorplan-image`, `regions-zones`, `barriers`, `equipment-sources`, `heatmap`, `sample-lines`, `cad-overlays`, `selection-grips` y `hud-scale`.
- Se agrega `f227CanvasRendererLayerExtraction.ts` y una fila F227 en el canvas para mostrar capas listas, helpers extraibles y capas protegidas.
- Decision: `background-grid`, `floorplan-image` y `equipment-sources` son candidatas iniciales; `cad-overlays` y `selection-grips` permanecen en `useCanvas` hasta E2E de drag/snap/lasso.
- Artefactos: `outputs/f227_renderer_layer_extraction/f227_renderer_layer_extraction.json` y `outputs/fase_227_renderer_layer_extraction.md`.

## F222-F226 (2026-07-19) - Canvas hardening bridge

- Se agrega `f222ToF226CanvasHardening.ts` para organizar el cierre del canvas profesional en cinco frentes: renderer layers, event controller gate, E2E CAD, isocontornos/footprints y sincronizacion 3D.
- El canvas muestra una fila `F222-F226` con chips auditables para cada frente y su estado `ready`, `partial` o `guarded`.
- F222: registra la ruta segura para extraer helpers/capas de render sin tocar eventos.
- F223: deja el event controller futuro condicionado a `VITE_CANVAS_EVENT_CONTROLLER_V2`, con rollback al `useCanvas` actual.
- F224: fija la matriz E2E requerida para grip drag, snap, lasso, seleccion y export.
- F225: consolida hardening de isocontornos y footprints; los isocontornos firmables siguen requiriendo interpolacion y QA numerico.
- F226: consolida handoff 3D medico con scene builder/OBJ y deja pendiente la sincronizacion bidireccional completa.
- Artefactos: `outputs/f222_f226_canvas_hardening/f222_f226_canvas_hardening.json` y `outputs/fase_222_226_canvas_hardening.md`.

## F221 (2026-07-19) - Canvas real connections

- Se agrega `f221CanvasRealConnections.ts` para auditar conexiones reales del canvas.
- El canvas muestra una fila F221 con estado de grips arrastrables, snapping CAD, seleccion ventana/lasso, editor inline, footprints, isocontornos, 3D y export visual.
- Se corrige F220 para no tratar como pendiente lo que ya existe en `useCanvas.ts`: endpoint, midpoint, perpendicular, interseccion, centro-equipo, angle15, ventana/lasso y footprints por modalidad.
- Quedan marcados como parciales: isocontornos por interpolacion regulatoria real y sincronizacion 3D bidireccional.
- Decision renderer/eventos base: se pueden mejorar despues de pasar F221, pero primero extraer capas de render y despues event controller con feature flag; no reescribir renderer y eventos juntos.
- Artefactos: `outputs/f221_canvas_real_connections/f221_canvas_real_connections.json` y `outputs/fase_221_canvas_real_connections.md`.

## F220 (2026-07-19) - Canvas CAD Priority Actions P0-P2

- Se agrega panel F220 dentro del flujo del canvas con acciones P0, P1 y P2.
- P0: abrir editor inline, alternar snap y calibrar/medir cotas usando herramientas existentes.
- P1: preparar seleccion, vista isocontornos y colocacion de equipos/footprints.
- P2: abrir inspeccion medica 3D cuando exista conector disponible.
- No se reescribe renderer, eventos base, calculos, DXF, DB ni sidebar.
- Nuevos comandos: `npm run prepare:f220:canvas-cad-actions` y `npm run test:f220:canvas-cad-actions`.

## F219 (2026-07-19) - Canvas Post-Deploy QA

- Se agrega matriz F219 para validar la URL publica, canvas, DXF, escenas F217 y handoff F218 despues del deploy.
- Se identifican pendientes reales del canvas por prioridad: edicion directa, snapping avanzado, cotas editables, lasso, isocontornos, footprints y 3D.
- La fase genera artefactos en `outputs/f219_canvas_post_deploy_qa/` y `outputs/fase_219_canvas_post_deploy_qa.md`.
- Nuevos comandos: `npm run prepare:f219:canvas-postdeploy` y `npm run test:f219:canvas-postdeploy`.

## F218 (2026-07-19) - Visual Report Handoff

- Se agrega contrato F218 para declarar que snapshots F217 deben adjuntarse a Memoria IA, PDF, Evidence Pack y anexo estructural.
- Memoria IA incluye la seccion 7.11 con estado de adjuntos listos, en revision y faltantes.
- PDF Report exporta `f218_report_handoff` dentro del JSON y muestra la lista de capturas requeridas.
- Evidence Pack muestra el cierre visual F218 antes de cerrar expediente.
- Nuevo comando: `npm run test:f218:report-handoff`.

## F217 (2026-07-19) - Visual Export by Scene

- Se agrega panel F217 para preparar/exportar PNG por escena: Planta, Heat, Iso y Estruct.
- Cada escena queda asociada a un destino documental: Memoria IA, Evidence Pack, PDF o anexo estructural.
- Reutiliza `onExportPNG` y modos visuales existentes; no cambia renderer, calculos, geometria, DXF ni DB.
- Nuevo comando: `npm run test:f217:visual-export-scenes`.

## F216 (2026-07-19) - Mini View Manager

- Se agrega panel F216 para mostrar zoom, pan, escena activa y hasta tres vistas guardadas A/B/C.
- Permite guardar, restaurar y borrar vistas locales del canvas para recuperar rapidamente layout, heatmap, isodosis o estructura.
- Usa `localStorage`; no toca DB, calculos, geometria, importacion DXF ni renderer.
- Nuevo comando: `npm run test:f216:mini-view-manager`.

## F215 (2026-07-19) - Canvas Scene Presets

- Se agrega tira F215 de escenas tipo SketchUp dentro del viewport: Planta, Heat, Iso, Estruct y Extents.
- Los presets reutilizan el selector visual existente y `Zoom Extents`; no cambian renderer, eventos, calculos ni importacion DXF.
- El panel advierte si faltan geometria o resultados para que heatmap/isodosis tengan evidencia clinica.
- Nuevo comando: `npm run test:f215:canvas-scenes`.

## F214 (2026-07-18) - SketchUp-inspired Canvas Reorg

- Se reorganiza visualmente el canvas como estudio CAD medico: mesa gris, reglas tipo dibujo, chips de escena, cubo de vista y ejes XYZ.
- La mejora no toca el renderer, eventos de dibujo, importacion DXF, sidebar ni calculos; agrega orientacion visual y lectura de estado.
- Se traducen tooltips de zoom/snap/export para explicar su funcion en diseno de areas, memoria analitica y Evidence Pack.
- Nuevo comando: `npm run test:f214:sketchup-canvas`.

## F213 (2026-07-18) - DXF Layer Mapping QA + tooltips CAD

- Se agrega panel F213 al visor DXF para clasificar capas como muros/barreras, equipos, zonas, cotas, referencias, texto o no mapeadas.
- El visor DXF muestra conteos por rol y advertencias antes de aplicar LINE/LWPOLYLINE al canvas.
- Se refuerzan leyendas hover en botones principales del canvas y toolbar CAD para explicar funcion y logica de uso.
- Nuevo comando: `npm run test:f213:dxf-layer-mapping`.

## F212 (2026-07-18) - Heatmap Regulatory Legend

- Se agrega leyenda regulatoria compacta para heatmap/isocontornos: ALARA, publico, controlado, P min/max del proyecto, niveles de color y maximo proxy semanal.
- La leyenda queda preparada para export visual, Memoria IA, PDF y Evidence Pack con columnas de reporte.
- La mejora es de lectura/QA; no cambia calculos, renderer de heatmap ni limites normativos.
- Nuevo comando: `npm run test:f212:heatmap-legend`.

## F211 (2026-07-18) - Canvas Equipment Symbol Schedule

- Se agrega agenda compacta de equipos/fuentes en el canvas: modalidad, norma, fabricante/variante, footprint, rotacion y workload.
- Advierte si faltan metadatos necesarios para inspeccion 3D, memoria analitica o anexo visual de equipos.
- La mejora es de lectura/QA; no cambia colocacion de fuentes, calculos ni eventos CAD.
- Nuevo comando: `npm run test:f211:equipment-symbols`.

## F210 (2026-07-18) - Canvas Layer Manager Polish

- Se agrega resumen compacto de capas CAD dentro del canvas: activa, visibles/totales, bloqueadas, opacidad, color y estado por capa.
- Advierte si blindaje/fuentes quedan ocultos para evitar diagnosticar falsamente que el floorplan desaparecio.
- La mejora es de lectura y QA visual; no cambia eventos de dibujo, seleccion, importacion DXF ni layout principal.
- Nuevo comando: `npm run test:f210:canvas-layers`.

## F209 (2026-07-18) - Canvas Dimension Schedule

- Se agrega agenda CAD de cotas/capas en el canvas: longitud total, numero de muros, escala, filas por barrera, material, espesor y cobertura de calculo.
- La mejora es solo de lectura/reportabilidad; no cambia eventos de dibujo, seleccion, snapping ni layout principal.
- Nuevo comando: `npm run test:f209:canvas-dimensions`.

## F208 (2026-07-18) - Canvas Reporting Layer

- Se agrega capa F208 para volver reportable el canvas sin mover layout: plano, cotas/lineas 0.3m, capas, simbolos de equipo, heatmap/isocontornos y export visual.
- F208 aparece en el canvas, Memoria IA, PDF analitico y Evidence Pack con score, estado y acciones pendientes.
- Los smokes F199/F207 ahora validan que F208 no desaparezca de las salidas criticas.
- Nuevo comando: `npm run test:f208:canvas-reporting`.

## F207 (2026-07-18) - Functional App QA

- Se agrega una compuerta funcional integrada sobre el build `dist`: arranque sin bienvenida bloqueante, sidebar/canvas/toolbar, Archivo, DXF aplicado al floorplan, Reportes, Memoria IA, PDF y Evidence Pack.
- La prueba no mueve layout ni modifica calculos; sirve para detectar regresiones antes de volver a publicar en Vercel.
- Estado esperado: `functional-app-qa-pass`.
- Nuevos comandos: `npm run test:f207:functional-app-qa-smoke` y `npm run test:f207:functional-app-qa`.

## F204 (2026-07-18) - Canvas visible y DXF aplicado al floorplan

- El canvas/floorplan abre por defecto en usuarios nuevos; la pantalla de bienvenida solo aparece si `radshield_force_welcome=true`.
- El visor DXF deja de ser solo visor: agrega `Aplicar al canvas`, mapea LINE/LWPOLYLINE a barreras mediante el puente CAD/BIM existente y refresca el floorplan principal.
- DWG se mantiene como flujo honesto de conversion externa a DXF; no se promete parser DWG nativo en navegador.
- Nuevos comandos: `npm run test:f204:canvas-dxf-recovery` y `npm run test:f204:canvas-dxf-smoke`.

## F203 (2026-07-18) - Verificacion publica manual

- Se agrega una compuerta manual para cerrar el caso `public-vercel-smoke-network-gated` de F202.
- Genera checklist del operador para revisar en navegador sin bloqueo: URL HTTPS, shell, sidebar, canvas, toolbar CAD, panel Layout-blindaje-memoria, menus canonicos y salidas Memoria IA/PDF/Evidence/CNSNS.
- Nuevos comandos: `npm run prepare:f203:manual-public-verification` y `npm run test:f203:manual-public-verification`.

## F202 (2026-07-18) - public Vercel smoke

- Se agrega smoke F202 contra `https://radshield-mx-static-dist.vercel.app/` o `PUBLIC_DEPLOY_URL`.
- La compuerta valida URL HTTPS, respuesta publica, sidebar estable, canvas, toolbar CAD, panel Layout-blindaje-memoria movible/compactable, menus canonicos y salidas Memoria IA/PDF/Evidence/CNSNS.
- Si el runner bloquea la salida publica, la evidencia queda como `public-vercel-smoke-network-gated` y se puede exigir fallo estricto con `F202_STRICT_PUBLIC_SMOKE=1`.
- El paquete F200 ahora apunta a F202 como smoke publico post-deploy, no al texto historico F201.
- Nuevos comandos: `npm run test:f202:public-vercel-contracts` y `npm run test:f202:public-vercel-smoke`.

## F201 (2026-07-18) - Workflow panel controls

- El panel `Layout - blindaje - memoria` agrega controles explicitos para desplazar, compactar/expandir y cerrar.
- El control de mover ahora alterna entre posiciones arriba, derecha y abajo para liberar visibilidad del canvas.
- La posicion derecha baja a `top-14` para evitar colision con la leyenda del canvas.
- El modo compacto se persiste en `radshield_canvas_workflow_compact_f201` y deja visible solo la cabecera hasta expandir.
- Nuevos comandos: `npm run test:f201:workflow-panel` y `npm run test:f201:workflow-panel-smoke`.

## F200 (2026-07-18) - Static frontend release gate

- Se agrega compuerta F200 para congelar el frontend estatico como release candidate controlado.
- F200 consolida F197, F198 y F199, valida configuracion Vercel/Netlify/SPA, empaqueta `dist` y deja artefacto `radshield-mx-f200-static-dist.zip`.
- La fase declara alcance: frontend estatico listo para revision publica; backend, DB live y uso clinico certificado siguen fuera de este gate.
- Siguiente paso recomendado: F201 public URL smoke contra `https://radshield-mx-static-dist.vercel.app/` o la URL final definida en `PUBLIC_DEPLOY_URL`.
- Nuevos comandos: `npm run prepare:f200:static-release-gate` y `npm run test:f200:static-release-gate`.

## F199 (2026-07-18) - Output smoke QA

- Se agrega matriz `f199OutputSmokeQa.ts` para validar salidas release-facing: Memoria IA, PDF analitico, Reporte CNSNS, Evidence Pack, Checklist CNSNS, Regulatory Report y Batch Report Exporter.
- Se agregan controles e2e ocultos para abrir CNSNS, Checklist y Batch Exporter sin depender de menus pesados; solo aparecen con `radshield-e2e-controls=true`.
- El smoke de navegador abre cada salida en una pagina fresca, valida senales de evidencia/citas/anexos/QA y confirma que sidebar, canvas y toolbar CAD sigan montados.
- Nuevos comandos: `npm run test:f199:outputs` y `npm run test:f199:outputs-smoke`.

## F198 (2026-07-18) - Full menu function QA

- Se agrega matriz F198 para validar funcion por funcion los grupos canonicos: Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia e Integraciones.
- Nuevo contrato revisa que cada trigger/menu exista, que sus funciones criticas sigan en el toolbar y que Archivo permanezca como unico legacy visible.
- Nuevo smoke visual abre cada dropdown canonico en el build `dist`, valida funciones criticas y confirma que sidebar, canvas principal y toolbar CAD F191 sigan visibles despues de cada grupo.
- Esta fase no elimina fallbacks ni mueve layout; prepara F199 para smoke de export/reportes.
- Nuevos comandos: `npm run test:f198:menus` y `npm run test:f198:menus-smoke`.

## F197 (2026-07-18) - Menu/canvas/output QA

- Se agrega una compuerta F197 para diagnosticar por que podrian no verse menus, sidebar, canvas o botones despues de cambios de layout.
- `Nuevo Proyecto` en Archivo queda conectado al reset seguro de proyecto/lienzo y deja de depender de un handler ausente.
- Nuevo contrato valida el primer menu funcion por funcion: proyecto, importar/exportar, auditoria, glosario y acerca de.
- Nuevo smoke visual limpia estados persistidos F188/sidebar/welcome antes de comprobar sidebar, canvas principal, toolbar CAD F191 y restauracion de paneles.
- `f197OutputIntegrationQa.ts` vincula F125/F195/F196 con Memoria IA, Evidence Pack, PDF, Update Center y manuales.
- Nuevos comandos: `npm run test:f197:menu-canvas` y `npm run test:f197:menu-canvas-smoke`.

## F196 (2026-07-18) - Safe calculation cache

- Se actualiza la cache de calculo a `f196-cache-v1` con payload auditable por escala, geometria, materiales, fuentes, normas, P/T/U/W, regiones y puntos criticos.
- `calculationCacheKey.ts` agrega explicacion de invalidacion con categorias: scale, geometry, material, source, norms, P/T/U/W, regions y criticalPoints.
- `useCalculationCache` guarda `cacheVersion` y `payload` junto al resultado y rechaza hits sin metadatos F196 o con payload no coincidente.
- La cache expone `lastAudit()` para diagnosticar si un resultado vino de cache o fue invalidado por cambios del plano.
- Nuevo comando: `npm run test:f196:cache`.

## F195 (2026-07-17) - Base/conservative comparison gate

- Se agrega `f195CalculationComparisonGate.ts` para revisar por barrera el comparador base vs conservador.
- El gate clasifica cada barrera como `complete`, `review-required` o `missing-comparison` y asigna severidad `none/low/medium/high`.
- La evidencia incluye espesor base, espesor conservador, delta en mm, delta porcentual, metodo dominante y recomendacion operativa.
- `F125CalculationEvidenceGate` ahora incorpora contadores F195 y anexa la seccion del comparador en Memoria IA, Evidence Pack y PDF.
- Nuevo comando: `npm run test:f195:comparison-gate`.

## F194 (2026-07-16) - Numeric QA NCRP/IAEA/UAQ

- Se agrega `numericQaValidation.ts` como suite ejecutable de casos numericos conocidos para el motor de calculo.
- Casos cubiertos: LINAC 6 MV TVL primaria, LINAC 18 MV con advertencia de neutrones, CT/RX NCRP 147, Gamma Knife/Co-60, PET/NM TG-108 y compuerta local UAQ/CNSNS.
- Cada caso devuelve `status`, checks observables, tolerancias, advertencias y `citationIds` para alimentar Memoria IA, Evidence Pack y PDF.
- La compuerta UAQ/CNSNS queda como `review-required`: no certifica automaticamente memorias analiticas ni reemplaza revision RSO/fisico medico.
- Nuevo comando: `npm run test:f194:numeric-qa`.

## F193 (2026-07-16) - Calculation hardening extendido

- Se agrega `unitNormalization.ts` para unificar mm/cm/m, mSv/semana, uSv/h, densidad, kg/m2, costo por m2 y carga estructural.
- El cache de calculo usa `calculationCacheKey.ts` con hash que invalida por escala, geometria, material, fuente, modalidad, P/T/U/W, regiones y puntos criticos.
- `useShieldingEngine` agrega `calculationUnitSnapshot`, `calculationComparison` y `calculationCacheKey` por barrera.
- `shieldingEngine.ts` y `shieldingWorker.ts` reciben validacion numerica y advertencias clinicas para cubrir caminos legacy/worker.
- Se agregan casos conocidos de referencia en `numericValidationCases.ts`: LINAC 6 MV, LINAC 18 MV, CT/RX, Gamma Knife/Co-60 y PET/NM.
- Advertencias nuevas: distancia <0.3 m, TVL no versionado, densidad de material no validada y revision RSO/fisico medico.
- Nuevo comando: `npm run test:f193:calculation-hardening-extended`.

## F192 (2026-07-16) - Calculation Engine Hardening

- Se agrega una capa conservadora de auditoria para calculos: formula, norma, energia, citas, entradas, salidas y supuestos.
- Cada barrera calculada por `useShieldingEngine` puede incluir `calculationTrace` y `calculationWarnings` sin romper reportes existentes.
- Se normalizan formula/estandar por modalidad: NCRP 147, NCRP 151, AAPM TG-108 e IAEA SRS-47.
- Se agregan advertencias para entradas no finitas, escala invalida, T/U fuera de rango, ausencia de fuentes/materiales/puntos y energia >10 MV.
- Nuevo comando: `npm run test:f192:calculation-hardening`.

## F191G (2026-07-16) - Duplicar/borrar con confirmacion

- El inspector contextual del canvas agrega acciones `Dup` y `Del` solo cuando existe seleccion real.
- `Dup` crea una copia desplazada de fuentes, barreras, puntos criticos o zonas ocupadas y selecciona el duplicado.
- `Del` reutiliza el borrado existente con confirmacion explicita y conserva el flujo de undo/redo via `setFloorPlan`.
- Se corrige el borrado de zonas para sincronizar `occupiedRegions` y el alias `regions`.
- Nuevo smoke visual: crea un punto critico, duplica, borra la copia y valida que canvas/sidebar sigan visibles.
- Nuevos comandos: `npm run test:f191g:duplicate-delete-contracts` y `npm run test:f191g:duplicate-delete-smoke`.
- Evidencia visual: `outputs/f191g_duplicate_delete_smoke/f191g-duplicate-delete-confirm.png`.

## F191F (2026-07-16) - Smoke real de inline editor

- Se agrega smoke Playwright dedicado para validar edicion real sobre objeto seleccionado del demo.
- La prueba selecciona un objeto del floorplan, abre `Edit`, cambia el nombre y confirma que el inspector F191C se actualiza.
- Tambien valida que canvas y sidebar sigan visibles despues de editar.
- Evidencia visual: `outputs/f191f_inline_editor_smoke/f191f-inline-editor-real-selection.png`.
- Guardrail: fase de QA; no agrega nuevas acciones destructivas ni cambia formulas.
- Nuevos comandos: `npm run test:f191f:inline-editor-contracts` y `npm run test:f191f:inline-editor-smoke`.

## F191E (2026-07-16) - Inline editor seguro

- Se agrega editor contextual compacto para propiedades basicas del objeto seleccionado.
- El editor se abre desde `Edit` en la action rail F191D y permanece cerrado por defecto.
- Campos soportados: nombre, material de barrera, workload/isocentro de fuente, U, T y P.
- `useCanvas.updateSelected` ahora tambien actualiza regiones ocupadas, manteniendo alias `regions` cuando existe.
- Guardrail: no agrega borrar, duplicar ni edicion destructiva; los cambios se aplican al perder foco y validan numeros finitos.
- Nuevo comando: `npm run test:f191e:inline-editor`.

## F191D (2026-07-16) - Context actions seguros

- Se agrega una banda de acciones contextuales dentro del inspector F191C.
- Acciones disponibles: materiales, recalcular, Evidence Pack, centrar seleccion y limpiar seleccion.
- Las acciones se muestran solo en ancho `2xl` para no comprimir ni tapar el floorplan.
- Se evita borrar o duplicar desde esta fase porque son acciones destructivas y requieren undo/redo dedicado.
- Guardrail: no cambia motor de calculo, geometria, renderer, sidebar, topbar ni demo R&F.
- Nuevo comando: `npm run test:f191d:context-actions`.

## F191C (2026-07-16) - Object inspector contextual

- Se agrega inspector compacto de objeto seleccionado en la banda CAD F191.
- El inspector identifica muro, fuente, punto critico o zona y muestra atributos clave sin abrir dialogos.
- Para muros muestra tipo, material, espesor calculado/pendiente y meta de diseno.
- Para fuentes muestra modalidad, workload, factor de uso e isocentro.
- Para zonas/puntos muestra ocupacion, meta de diseno y estado.
- En ausencia de seleccion muestra herramienta activa, snap, seleccion multiple y capas visibles.
- Guardrail: no cambia motor de calculo, geometria, eventos del canvas, sidebar ni demo R&F.
- Nuevo comando: `npm run test:f191c:object-inspector`.

## F191 (2026-07-16) - pyrateShield-inspired toolbar

- Se agrega toolbar CAD-clinica compacta inspirada en pyrateShield debajo de la toolbar principal.
- La toolbar agrupa herramientas de seleccion, muro, fuente, zona, medir y pan.
- Se agregan acciones clinicas directas: plano, escala, punto critico, material, calcular y snapshot.
- Se agrega selector de modo visual `Plano / Heat / Iso / Estruct` usando toggles existentes sin modificar formulas.
- Guardrail: no cambia motor de calculo, eventos base del canvas, F188 ni F189.
- Nuevo comando: `npm run test:f191:pyrate-toolbar`.
- Nuevo smoke visual: `npm run test:f191:pyrate-toolbar-smoke`.

## F189 (2026-07-16) - Visual smoke layout canvas/sidebar

- Se agrega smoke visual Playwright para validar F188 en `1366x768` y `1920x1080`.
- La prueba entra directo al demo R&F, verifica sidebar visible, canvas workflow, panel QA, panel continuidad y controles F188.
- Se valida cerrar/restaurar QA, mover el panel de flujo al dock derecho y aumentar ancho de sidebar.
- Se generan capturas en `outputs/f189_visual_smoke`.
- Nuevo comando: `npm run test:f189:visual-smoke`.

## F188 (2026-07-16) - Panel layout controls

- Se agrega control persistente para ajustar el ancho de la sidebar expandida sin cambiar el modo colapsado.
- El canvas permite mostrar/ocultar los paneles de flujo, QA y continuidad offline desde la barra superior.
- Los paneles cerrados pueden restaurarse desde un control compacto dentro del canvas.
- El panel de flujo puede moverse entre posicion superior y dock derecho para liberar el floorplan.
- Guardrail: no cambia demo R&F, eventos del canvas, formulas, topbar ni resultados.
- Nuevo comando: `npm run test:f188:panel-layout`.

## F186 (2026-07-16) - Sidebar estable + Mat toolbox

- Se refuerza la sidebar con ancho visible estable en modo expandido y colapsado.
- Los botones de herramientas/sidebar exponen `title` y `aria-label` para leyendas hover/accesibilidad.
- Se agrega acceso rapido `Mat` hacia `materialComparison`.
- Material Comparison consolida una toolbox unica con TVL, densidad, kg/m2, peso total, costo, tiempo estimado y carga estructural.
- Nuevo comando: `npm run test:f186:sidebar-materials`.

## F185 (2026-07-16) - Canvas micro assist

- Se agrega asistencia compacta en el HUD del canvas: herramienta activa, seleccion, snap, capas, evidencia y heatmap.
- La asistencia sugiere la siguiente accion operativa sin cambiar eventos, geometria, calculos, sidebar ni topbar.
- Se mantiene intacto el demo R&F y el shell actual del canvas.
- Nuevo comando: `npm run test:f185:canvas-assist`.

## F184 (2026-07-16) - Safe quality workflow

- Se agrega un workflow seguro de calidad release para motor de calculo, canvas, Memoria IA, materiales, RAG y export.
- Memoria IA incluye seccion F184 en el texto exportable y un panel visible con score/listo/parcial/faltante.
- Evidence Pack muestra el estado F184 para decidir si el expediente esta listo antes de firma o publicacion.
- Material Comparison agrega sintesis integrada de TVL, kg/m2, costo, dias estimados y estado estructural sin alterar el motor.
- Guardrail: no se mueve sidebar, topbar, demo R&F ni shell del canvas en esta fase.
- Nuevo comando: `npm run test:f184:safe-quality`.

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
