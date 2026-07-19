# RadShield-MX - Fases recientes

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
