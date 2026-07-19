# RadShield-MX - Manual de Versiones

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
