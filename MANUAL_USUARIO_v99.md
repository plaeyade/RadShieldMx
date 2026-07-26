# Addendum F73 - Estabilizacion, DB, RAG, canvas y 3D

## Addendum F331-F338 - Cierre de release estatico

F331-F338 agrupa el cierre operativo antes de probar la app con un caso real. No agrega calculos nuevos; confirma que el frontend estatico, Medical 3D, canvas, materiales, RAG/documentos y reportes tienen contratos de evidencia listos para validacion.

Flujo recomendado:

1. Revisar Medical 3D en seis perfiles: LINAC, Gamma Knife, HDR, CT, PET/CT y Radiofarmacia.
2. Confirmar que `sceneHash`, `visualEvidence` y `assetPipeline` aparecen en el JSON exportado desde Medical 3D.
3. Usar las capturas 3D como apoyo visual en Memoria IA, PDF y Evidence Pack.
4. Revisar materiales y estructura en la toolbox consolidada antes de seleccionar espesores finales.
5. Confirmar que RAG/documentos conserva `sourceHash`, `chunkHash`, pagina y fuente canonica.
6. Repetir el gate de canvas/floorplan antes de cargar un caso real.
7. Publicar o subir el paquete `outputs/f331_f338_static_release_close/radshield-mx-f338-static-release.zip` solo despues de build y gates verdes.

Decision de arquitectura: el release publico actual es frontend estatico. DB/API/RAG live quedan fuera del host publico hasta tener restore probe, secretos productivos y smoke fullstack. Babylon tambien queda fuera hasta resolver instalacion npm y pasar smoke visual.

Siguiente uso real: F339 debe tomar un caso del usuario, cargar plano/croquis, colocar equipo, calcular, generar Memoria IA/PDF/Evidence Pack y cerrar desviaciones con revision calificada.

## Addendum F325-F330 - Recorrido 3D realista y evidencia visual

F325-F330 mejora el visor `Medical 3D Floor Plan` sin cambiar el motor de calculo. La escena conserva Three/R3F como renderer estable y agrega controles para revisar una sala como recorrido interno.

Uso recomendado:

1. Abrir `Medical 3D Floor Plan`.
2. Elegir perfil de sala: LINAC, PET/CT, CT, Gamma Knife, HDR o Radiofarmacia.
3. Activar `Recorrido WASD`.
4. Mantener `Colisiones` activo para evitar atravesar muros o equipos.
5. Activar `Recorrido fotoreal` cuando se quiera inspeccionar materiales y acabados.
6. Elegir luz `Clinica`, `Inspeccion` o `Recorrido`.
7. Activar `Mouse-look` y hacer click en la escena si se desea navegar con mouse.
8. Exportar `JSON` para guardar `sceneHash`, assets esperados y evidencia visual asociada a Memoria IA/PDF/Evidence Pack.

Interpretacion:

- `Colisiones` ayuda a detectar recorridos poco realistas o equipos que bloquean paso.
- `Recorrido fotoreal` usa perfiles PBR procedurales por material: plomo, acero, vidrio plomado, concreto y mamposteria alta densidad.
- `sceneHash` identifica la version visual de la escena que debe corresponder con capturas, memoria analitica y anexos.
- `assetPipeline` prepara la futura sustitucion de modelos genericos por equipos `GLB/GLTF` reales sin romper el esquema.

Limitacion importante: esta visualizacion es apoyo de inspeccion y evidencia grafica. Los espesores firmables, advertencias clinicas, citas y justificacion normativa siguen saliendo del motor de calculo, RAG y reportes.

## Addendum F324 - Pointer-lock walkthrough

F324 mejora el recorrido 3D para que se sienta como visita interna. El modo sigue siendo opcional y no cambia calculos ni evidencia normativa.

Como usarlo:

1. Abrir `Medical 3D Floor Plan`.
2. Activar `Recorrido WASD`.
3. Activar `Mouse-look`.
4. Hacer click dentro de la escena 3D para capturar el mouse.
5. Mover el mouse para mirar alrededor.
6. Usar `W/A/S/D` o flechas para desplazarse.
7. Usar `Shift` para ir mas rapido y `Ctrl` para movimiento fino.
8. Usar `R/F` para ajustar altura de camara.
9. Presionar `Esc` para liberar el cursor.

La camara queda acotada a los limites de la sala para evitar salir del plano. Cuando el recorrido esta apagado, vuelven los controles orbitales normales.

## Addendum F317-F323 - Medical 3D release line

F317-F323 ordena el cierre del visor medico 3D sin sustituir el motor estable. Three/R3F sigue como visor activo; Babylon queda preparado para PBR/WebGPU/WebXR cuando npm permita instalar dependencias; Unity queda como visor externo por URL/handoff.

Uso actual del visor Three/R3F:

1. Elegir modalidad: LINAC, PET/CT, CT, Gamma Knife, HDR o Radiofarmacia.
2. Elegir modo: Presentacion, Tecnico o Dosis.
3. Activar inspeccion visual para etiquetas de muros, espesores, zonas y equipos.
4. Activar recorrido WASD si se requiere visita interna.
5. Exportar PNG, OBJ, JSON, AI Brief, Verify Pack, F147 pack o Unity JSON segun destino.

Mejoras WASD ya disponibles:

1. `W/A/S/D` y flechas desplazan la camara.
2. `Q/E` gira la vista.
3. `Shift` acelera el recorrido.
4. `Ctrl` activa movimiento fino para inspeccionar muros y equipos.
5. `R/F` sube o baja la altura de camara.
6. La camara se mantiene dentro de los limites de la sala para evitar perderse fuera del plano.

Ruta post-F324 para fotorealismo en modo recorrido:

1. F324: pointer-lock y mouse-look con salida clara.
2. F325: colisiones/navmesh para no atravesar muros/equipos.
3. F326: biblioteca PBR de materiales de blindaje.
4. F327: luces fisicas, sombras y presets de exposicion.
5. F328: modelos GLB validados para equipos medicos.
6. F329: modo recorrido fotorealista dedicado.
7. F330: snapshots/bookmarks vinculados a Memoria IA, PDF y Evidence Pack.

El fotorealismo es viable en modo recorrido, pero debe separarse de los calculos. La escena puede verse realista; la autoridad regulatoria sigue siendo el motor de calculo, las normas, las citas y la revision profesional.

## Addendum F316 - Babylon dependency diagnostics

F316 registra el estado real de Babylon. La app ya tiene adapter y loader dinamico, pero los paquetes `@babylonjs/core` y `@babylonjs/loaders` no estan instalados porque npm devuelve `EACCES` al consultar `registry.npmjs.org`.

Que significa para el usuario:

1. El visor 3D integrado sigue funcionando con Three/R3F.
2. Unity externo puede usarse por handoff/URL si existe un build publicado.
3. Babylon queda preparado para PBR/WebGPU/WebXR, pero no se activa hasta instalar dependencias.
4. No hay cambios parciales en dependencias ni lockfiles.

Para activar Babylon se debe corregir la salida npm o proxy hacia `https://registry.npmjs.org`, instalar los paquetes, compilar y repetir smoke visual del visor Medical 3D.

## Addendum F315 - Unity external viewer bridge

F315 agrega el puente operativo para abrir un visor Unity WebGL externo desde el dialogo Medical 3D. La app no instala Unity ni lo mete al bundle principal: exporta un paquete JSON con escena, muros, equipos, zonas, espesores y reglas clinicas, y solo abre Unity si se configura una URL externa.

Uso recomendado:

1. Abrir `Medical 3D Floor Plan`.
2. Seleccionar sala y modo de inspeccion.
3. Revisar el panel `Motor 3D`.
4. Usar `Unity JSON` para entregar el paquete al visor externo.
5. Configurar `VITE_MEDICAL_3D_UNITY_WEBGL_URL` cuando exista un build Unity publicado.
6. Usar `Abrir Unity` para recorrido externo; si no hay URL, continuar con Three/R3F.

Limite clinico: Unity es visualizacion, entrenamiento y demo. Los calculos, formulas, citas, advertencias, Memoria IA, PDF y Evidence Pack siguen saliendo de RadShield-MX.

## Addendum F314 - Babylon runtime loader

F314 deja listo el cargador runtime de Babylon. Si el entorno tiene instalados `@babylonjs/core` y `@babylonjs/loaders`, y las flags estan activas, el loader puede cargar Babylon por import dinamico. Si falla, la app conserva Three/R3F como visor activo.

Para activar Babylon en una prueba futura:

1. Ejecutar `npm install @babylonjs/core @babylonjs/loaders`.
2. Configurar `VITE_MEDICAL_3D_BABYLON_ADAPTER=true`.
3. Configurar `VITE_MEDICAL_3D_BABYLON_RUNTIME=true`.
4. Recompilar y ejecutar smoke visual del visor.
5. Confirmar que Three/R3F sigue disponible como fallback.

En este entorno el intento de instalacion no completo, asi que Babylon queda preparado pero no empaquetado. La estabilidad del frontend queda preservada.

## Addendum F313 - NIST XCOM y mezclas

F313 agrega NIST XCOM como fuente de apoyo para atenuacion fotonica y comparacion de mezclas. En el dialogo NIST XCOM se puede elegir una mezcla por fraccion en peso, energia y densidad de mezcla opcional.

Logica aplicada:

1. Normalizar fracciones por peso positivas.
2. Interpolar `mu/rho` por material y energia.
3. Combinar `mu/rho` por suma ponderada.
4. Multiplicar por densidad de mezcla para obtener `mu` lineal.
5. Calcular HVL y TVL como `ln(2)/mu` y `ln(10)/mu`.

Uso correcto: comparar materiales, estimar impacto de mezclas, alimentar Material Toolbox y respaldar Memoria IA con evidencia de fuente/hash. Uso restringido: no sustituye NCRP/IAEA/UAQ para diseno clinico, especialmente en haces MV broad-beam, neutrones, laberintos o puertas.

## Addendum F312 - Unity WebGL externo

F312 define como se conectaria Unity WebGL sin romper la app principal. Unity no se instala dentro del frontend estable. Se usa como visor externo, embebido o abierto en otra pestana, y recibe un paquete exportado desde Medical 3D.

Reglas de uso:

1. RadShield-MX calcula, cita, advierte y genera reportes.
2. Unity solo visualiza: recorrido, acabados, camara, entrenamiento o demo.
3. La conexion requiere `VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER=true`.
4. La URL se define con `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.
5. Si Unity falla, Three/R3F sigue disponible como fallback.

Antes de activarlo se requiere un build Unity WebGL externo, headers correctos para assets comprimidos y smoke visual que confirme carga, camara, geometria, equipos, zonas y snapshots.

## Addendum F311 - Babylon safe adapter

F311 prepara Babylon.js sin instalarlo todavia en el frontend estable. La app mantiene Three/R3F como visor activo y deja un contrato tecnico para que Babylon consuma la misma escena cuando se autorice.

Condiciones para activar Babylon:

1. F310 debe pasar con un proyecto real.
2. Instalar `@babylonjs/core` y `@babylonjs/loaders` en rama o entorno de prueba.
3. Activar `VITE_MEDICAL_3D_BABYLON_ADAPTER=true` y `VITE_MEDICAL_3D_BABYLON_RUNTIME=true`.
4. Usar carga dinamica y fallback automatico a Three/R3F.
5. Repetir smoke visual desktop/mobile y revisar peso de bundle.

Babylon aporta PBR, WebGPU y WebXR para inspeccion avanzada. No reemplaza calculos, normas, Memoria IA ni Evidence Pack.

## Addendum F310 - Ensayo operativo Three/R3F

F310 prepara el primer ensayo real del visor Medical 3D sin introducir dependencias de mayor riesgo. El motor activo sigue siendo Three.js/React Three Fiber.

Flujo recomendado:

1. Abrir la app estable y confirmar que menus, sidebar y canvas estan visibles.
2. Crear o cargar un proyecto real de prueba.
3. Calibrar escala y revisar unidades.
4. Colocar o validar equipo: LINAC, CT, PET, Gamma Knife, HDR o ciclotron.
5. Asignar materiales con TVL, densidad, peso, costo y fuente.
6. Ejecutar calculo y revisar advertencias clinicas.
7. Abrir Medical 3D Floor Plan con Three/R3F activo.
8. Revisar espesores, zonas controladas, heatmap y recorrido visual.
9. Exportar PNG, OBJ, JSON y handoff 3D.
10. Generar Memoria IA, PDF y Evidence Pack con citas y hashes.

Babylon.js debe activarse despues como adaptador aislado, con fallback a Three/R3F. Unity WebGL se deja como visor externo final, no como motor de calculo ni como dependencia directa del frontend estable.

## Addendum F290 - Matriz de pruebas reales

F290 define las pruebas reales antes de llamar estable a la app en uso clinico. Cubre DX, TX, NM y CY con plano, equipo, calculo, memoria, PDF y Evidence Pack.

Reglas de salida:

1. Cada caso debe tener plano real o plantilla confirmada con escala.
2. Cada calculo debe mostrar formula, norma, entradas, salidas, supuestos y advertencias.
3. Cada reporte debe incluir `citationId`, pagina, `sourceHash` y `chunkHash`.
4. Las desviaciones blocker/major impiden salida clinica firmada.

## Addendum F289 - Memoria IA con RAG approved-only

F289 genera el indice de citas que Memoria IA debe consumir. Cada cita incluye `citationId`, fuente, pagina, modalidad, `sourceHash`, `chunkHash` y una vista previa. Las memorias OCR se usan como evidencia o ejemplo; las constantes y formulas siguen saliendo de NCRP/IAEA/UAQ y fuentes canonicas.

Flujo recomendado:

1. Elegir perfil DX/TX/NM/CY.
2. Confirmar plano, escala, equipo y workload/actividad.
3. Ejecutar calculo trazable.
4. Adjuntar citas canonicas primero y evidencia approved-only despues.
5. Exportar Memoria IA/PDF/Evidence con hashes y advertencias.

## Addendum F288 - Validacion RAG approved-only

F288 valida el corpus F287 antes de conectarlo a Memoria IA o DB live. Revisa que no haya filas invalidas, duplicados, falta de paginas/hash, o perdida de exclusiones F286. Tambien ejecuta busquedas smoke para ciclotron, LINAC, Gamma Knife y Braqui.

DB readback es opcional y solo lectura: usar `F288_DB_READBACK=1` despues de un seed live controlado.

## Addendum F287 - Seed RAG solo aprobados

F287 aplica la instruccion operativa de continuar solo con contenido aprobado. Las paginas F286 marcadas `needs-reocr`, `needs-redaction` o `reject` quedan fuera. Los chunks F285 que ya estaban `chunk-seed-draft-ready` y no fueron excluidos se conservan como corpus tecnico para RAG local/privado.

Uso:

1. Ejecutar `npm run prepare:f287:approved-only-rag-seed`.
2. Revisar `outputs/f287_approved_only_rag_seed/f287_approved_only_rag_seed.json`.
3. Confirmar que `f287_excluded_by_review.jsonl` contiene las paginas no aprobadas.
4. Ejecutar live seed solo en ambiente privado con `F287_SEED_LIVE=1`, `F287_CONFIRM_APPROVED_ONLY=1` y `DATABASE_URL`.
5. Correr F170 despues del seed para validar citas, hashes y conteos.

Nota: la presencia de acentos rotos o mojibake no cambia automaticamente constantes ni metodologia. Ese texto puede ayudar como evidencia/ejemplo, pero las citas normativas siguen saliendo de fuentes canonicas y versionadas.

## Addendum F286 - Revision humana OCR

F286 crea el paquete de revision previa al seed real de memorias OCR. El objetivo es evitar que paginas con mala calidad, datos privados o texto dudoso entren a `document_chunks` sin una decision documentada.

Archivos de trabajo:

1. `outputs/f286_ocr_human_review_packet/f286_review_decisions_template.csv`: lista editable de decisiones.
2. `outputs/f286_ocr_human_review_packet/f286_sample_review_pages.json`: paginas de muestra que deben revisarse.
3. `outputs/f286_ocr_human_review_packet/f286_blocked_pages.json`: paginas bloqueadas por baja calidad o banderas.

Como usarlo:

1. Abrir el CSV de decisiones.
2. Cambiar `pending` por `approve`, `reject`, `needs-redaction` o `needs-reocr`.
3. Usar `approve` solo si la pagina es legible, trazable y no expone datos que no deban entrar al RAG.
4. Usar `needs-reocr` si hay mojibake, tablas ilegibles o perdida de formulas.
5. Usar `needs-redaction` si se conserva valor tecnico pero requiere ocultar informacion sensible.
6. No ejecutar F287 ni F285 live hasta cerrar todas las filas.

Regla de memoria analitica: las memorias OCR son evidencia/ejemplo local; no reemplazan normas canonicas NCRP/IAEA/UAQ ni autorizan constantes nuevas sin QA numerico.

## Addendum F285 - Seed RAG controlado

F285 prepara la insercion de memorias OCR al RAG sin activar escritura automatica. La salida principal es una tabla JSONL compatible con `document_chunks`; cada fila conserva modalidad, pagina, hash de fuente, hash de chunk, estado QA y localizador de cita.

Flujo operativo:

1. Revisar primero el muestreo F283 y los chunks excluidos por baja calidad.
2. Confirmar que los documentos privados no se usaran en un host publico estatico.
3. Hacer backup y restore probe de MySQL antes de cualquier seed.
4. Ejecutar `npm run prepare:f285:controlled-rag-seed` para dry-run.
5. Ejecutar live seed solo con `F285_SEED_LIVE=1`, `F285_CONFIRM_REVIEWED=1` y `DATABASE_URL`.
6. Despues del seed live, correr F170 para validar conteos, hashes, fuentes y citas en `document_chunks`.

Este paso alimenta Memoria IA y Evidence Pack con ejemplos reales, pero no reemplaza fuentes canonicas NCRP/IAEA/UAQ ni cambia constantes clinicas sin QA numerico.

## Addendum F268-F268A - Memorias Reales Y APIs Externas

F268 permite agregar memorias analiticas reales como evidencia y ejemplos para Memoria IA. Las memorias se deduplican por SHA256, se extrae texto searchable, se generan chunks RAG y se prepara un draft para `document_chunks`. Si una memoria no tiene texto, queda marcada para OCR cloud en F269.

Uso recomendado:

1. Colocar PDFs de memorias reales en Downloads.
2. Ejecutar `npm run prepare:f268:real-memory-ingestion`.
3. Revisar duplicados, documentos canonicos y chunks generados.
4. Sembrar live solo con `DATABASE_URL` y `F268_SEED_LIVE=1`, si se aprueba.
5. Usar esas memorias como ejemplos/evidencia. No reemplazan formulas normativas.

F268A prepara APIs y motores externos sin activarlos en frontend: Google Document AI, Amazon Textract, Crossref, Semantic Scholar, ODA Drawings SDK, Autodesk APS, GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy. Todos los secretos deben vivir en backend o runner externo, nunca en `VITE_*`.

Fases siguientes recomendadas:

- F269: OCR cloud con Google Document AI y Textract fallback.
- F270: smoke APS DWG con fixture no sensible.
- F271: deep dive bibliografico con Crossref y Semantic Scholar.
- F272: runner externo Monte Carlo GATE/OpenGATE/Geant4/EGSnrc.

## Addendum F269-F272 - Como Usar Los Gates Externos

F269 no ejecuta OCR por si solo. Sirve para confirmar que los documentos pendientes estan identificados, que los proveedores cloud quedan del lado backend y que el resultado esperado tenga texto, pagina, confianza y hash. Cuando se configuren credenciales, ejecutar `npm run prepare:f269:ocr-cloud` y despues revisar el manifiesto antes de sembrar nuevos chunks.

F270 no importa DWG nativo en navegador. Prepara fixtures DWG para convertirlos por Autodesk APS en backend/runner y entregar al canvas DXF/SVG con auditoria de capas y escala. El usuario final seguira usando Importar DXF hasta que el smoke APS pase.

F271 prepara busquedas bibliograficas. Crossref y Semantic Scholar ayudan a encontrar candidatos de cita, pero una cita candidata no cambia calculos. Toda referencia aceptada debe quedar con DOI/URL, fecha, hash y estado de revision.

F272 prepara Monte Carlo externo. La app exportara geometria, materiales, fuentes y scoring para GATE/OpenGATE, Geant4 o EGSnrc/egs_brachy; luego importara dosis, incertidumbre y manifiesto. No es un motor clinico certificado dentro del frontend: todo resultado requiere revision del fisico/RSO y QA numerico.

## Addendum F273-F278 - Validacion De Credenciales Y Runners

Para revisar credenciales sin exponerlas, ejecute:

```powershell
npm run prepare:f273-f278:live-integrations
npm run test:f273-f278:live-integrations
```

El resultado queda en `outputs/f273_f278_live_integration_readiness/`. La salida nunca imprime valores secretos: solo lista variables configuradas o faltantes. Google Document AI y Textract quedan deferidos por costo; no se deben usar como primer pase OCR.

Geant4 y EGSnrc/egs_brachy quedan diferidos. En esta etapa solo se valida GATE/OpenGATE si `GATE_RUNNER_URL` responde `/health`. El QA integrado F278 se cierra hasta contar con salidas reales de OCR, DWG, literatura y runner.

## Addendum F279 - OCR Libre/Local

Para evitar costo por pagina, use primero OCR local:

```powershell
npm run prepare:f279:local-free-ocr
npm run test:f279:local-free-ocr
```

El gate revisa si estan disponibles PDF.js, Poppler, Tesseract y OCRmyPDF. La ruta recomendada es: extraer texto embebido, renderizar paginas con Poppler si el PDF es escaneado, correr Tesseract local con `spa+eng`, generar JSONL por pagina y solo sembrar chunks revisados.

Google Document AI y Amazon Textract quedan como excepcion: usarlos solo si OCR local falla en calidad y se aprueba costo/privacidad.

Para una prueba local real de bajo riesgo:

```powershell
npm run prepare:f280:local-ocr-smoke
npm run test:f280:local-ocr-smoke
```

F280 procesa solo las primeras paginas de cada memoria pendiente y genera `outputs/f280_local_ocr_smoke/f280_local_ocr_pages.jsonl`. Ese archivo es borrador: revisar calidad antes de OCR completo y antes de sembrar en DB/RAG.

## Addendum F281 - OCR Completo Local De Memorias Reales

Para procesar las memorias reales completas sin costo cloud:

```powershell
npm run prepare:f281:full-local-ocr
npm run test:f281:full-local-ocr
```

F281 usa un flujo hibrido:

1. Detecta duplicados por SHA256.
2. Cuenta paginas con Poppler.
3. Extrae texto nativo cuando el PDF ya es searchable.
4. Renderiza y corre Tesseract solo en paginas escaneadas o con texto insuficiente.
5. Guarda texto por documento en `outputs/f281_full_local_ocr/text/`.
6. Guarda evidencia por pagina en `outputs/f281_full_local_ocr/f281_full_local_ocr_pages.jsonl`.

La DB no se siembra automaticamente. Primero se debe revisar calidad OCR, deduplicacion, paginas, hashes y citas. Si Tesseract no lista `spa` en `--list-langs`, el resultado se considera borrador revisable; para seed final en espanol debe quedar visible `spa.traineddata` o configurarse `TESSDATA_PREFIX` hacia la carpeta correcta.

Si `spa.traineddata` esta en Ubuntu/WSL, exponga la carpeta `tessdata` a Windows o ejecute con una ruta visible:

```powershell
$env:F281_TESSDATA_DIR='\\wsl.localhost\Ubuntu\usr\share\tesseract-ocr\5\tessdata'
npm run prepare:f281:full-local-ocr
```

Tambien funciona `TESSDATA_PREFIX` si apunta al padre de `tessdata` o a la carpeta `tessdata` directamente. El manifiesto F281 registra `tessdataSource` y `tessdataCandidates` para auditar que modelo se uso.

## Addendum F282 - Preparacion RAG Desde OCR

Despues de F281, prepare el corpus revisable para RAG:

```powershell
npm run prepare:f282:ocr-rag-readiness
npm run test:f282:ocr-rag-readiness
```

F282 no siembra la base de datos. Crea `outputs/f282_ocr_rag_readiness/f282_rag_chunks.jsonl` con chunks por pagina, cada uno con `documentId`, `sourceHash`, `page`, `modality`, `chunkHash`, `reviewStatus` y texto. Ese archivo es el puente correcto para revisar muestras de OCR, deduplicar citas y despues decidir seed controlado a `document_chunks`.

## Addendum F283 - QA De OCR Y Chunks Antes De DB

Antes de alimentar la DB/RAG, ejecute:

```powershell
npm run prepare:f283:ocr-chunk-qa
npm run test:f283:ocr-chunk-qa
```

F283 genera `outputs/f283_ocr_chunk_qa/f283_ocr_chunk_qa.json` con muestras de paginas por documento, puntaje de calidad, banderas de OCR y particion de chunks: `chunk-seed-draft-ready`, `chunk-needs-ocr-page-qa`, `chunk-needs-sample-qa` o `chunk-blocked-page-qa`. Solo los chunks de seed draft deben considerarse para la siguiente fase de seed controlado; las paginas OCR con baja calidad o senales debiles se revisan contra el PDF original.

## Addendum F284 - Corpus Candidato Para Seed RAG

Para preparar el paquete que podria alimentar `document_chunks`:

```powershell
npm run prepare:f284:rag-seed-candidate
npm run test:f284:rag-seed-candidate
```

F284 crea `outputs/f284_rag_seed_candidate/f284_document_chunks_seed_candidate.jsonl` solo con chunks `chunk-seed-draft-ready`. Tambien crea `f284_review_excluded_chunks.jsonl` con lo que no debe sembrarse todavia. Esta fase no escribe en MySQL; la escritura live requiere una fase posterior con aprobacion explicita y respaldo de DB.

## Archivo Menu Closure - Uso Del Menu Archivo

El menu Archivo queda cerrado como entrada principal para operaciones de proyecto, importacion, exportacion, auditoria y ayuda.

Flujo recomendado:

1. Use Nuevo Proyecto para reiniciar el plano con un estado limpio.
2. Use Abrir Proyecto para gestionar proyectos guardados.
3. Use Guardar para persistir el trabajo disponible en el modo actual.
4. Use Importar CSV para cargas batch.
5. Use Importar DXF para llevar un plano CAD al floorplan y mapear lineas/capas a barreras.
6. Use Importar STEP/IGES solo como compatibilidad geometrica.
7. Use Exportar CSV, Exportar PDF o Exportar Reporte CNSNS segun la salida requerida.
8. Use Compartir resultados cuando el navegador permita Web Share API.
9. Use Especificaciones Tecnicas, Audit Trail y Analisis de Logs para evidencia y trazabilidad.
10. Use Glosario y Acerca de para apoyo operativo.

Notas de alcance: DWG no se importa nativamente en navegador; debe convertirse externamente a DXF antes de usar Importar DXF. La persistencia multiusuario con DB real pertenece al carril backend/fullstack, no al cierre de Archivo frontend.

## Addendum F267 - Smoke de Casos Reales DX/TX/NM

F267 ejecuta una primera corrida operativa con tres perfiles: DX, TX y NM. Usa casos representativos derivados de F264 para poblar el CSV `outputs/f267_real_case_smoke_execution/real_case_smoke_deviation_log.csv`.

Importante: F267 no valida clinicamente la app contra una memoria firmada. Su valor es comprobar que el flujo de captura, calculo, evidencia y desviaciones ya esta listo. Antes de usar una salida firmada, el operador debe reemplazar:

- `sourceDocument`: cambiar `synthetic-F264-baseline-replace-with-signed-memory` por la memoria/reporte real.
- `expectedFromSignedMemory`: colocar el valor real esperado.
- `difference`: recalcular diferencia absoluta/relativa.
- `severity` y `disposition`: clasificar y cerrar desviaciones.

La siguiente prueba real debe iniciar con un caso tuyo DX, TX o NM y llenar el CSV F267/F266 con evidencia real.

## Addendum F266 - Kit de Evidencia Para Casos Reales

F266 agrega el paquete de captura para pruebas reales. El archivo `outputs/f266_real_case_evidence_kit/real_case_deviation_log_template.csv` se usa para registrar diferencias entre RadShield-MX y una memoria analitica previa, reporte firmado o criterio profesional.

Evidencia minima por caso:

- Captura del canvas con escala, barreras, equipos y zonas.
- Snapshot de inputs del equipo/fuente.
- Material con TVL/HVL, densidad, peso kg/m2, carga kPa, costo y cita/hash.
- Traza de calculo con formula, norma, inputs, outputs, supuestos y citationIds.
- Comparador base/conservador.
- Memoria IA exportada.
- PDF.
- Evidence Pack.
- CSV de desviaciones.

Stop rule: si el CSV tiene una desviacion `blocker` o `major` con disposition `open`, no se considera cerrada la prueba real y no debe emitirse salida clinica firmada.

## Addendum F265 - Protocolo de Pruebas Reales

F265 convierte el gate tecnico F264 en una ruta operativa para probar RadShield-MX con proyectos reales. La prueba minima antes de llamar estable una salida clinica debe cubrir al menos un caso DX, un caso TX y un caso NM. CY/ciclotron puede permanecer como gated si aun no hay datos reales completos.

Paso a paso por caso:

1. Cargar o dibujar plano, fijar escala y declarar zonas controladas/publicas.
2. Colocar equipo/fuente y confirmar modalidad, energia, workload, U, T, P y distancias.
3. Seleccionar material y validar TVL/HVL, densidad, peso kg/m2, carga kPa, costo/m2, tiempo estimado y cita/hash.
4. Ejecutar calculo y revisar formula, norma, inputs, outputs, supuestos, citationIds, warnings clinicos, comparador base/conservador y cache F196.
5. Generar Memoria IA, PDF y Evidence Pack.
6. Comparar contra memoria analitica previa o criterio firmado.
7. Registrar desviaciones como calculation, data, floorplan, material, citation, report o ui, con severidad blocker/major/minor/observation.

Regla: si existe una desviacion blocker o major sin resolver, el resultado no debe usarse como memoria firmada. Debe corregirse, documentarse como limitacion o pasar a revision de fisico medico/RSO.

## Addendum F264 - Pruebas Reales Controladas Del Motor

F264 permite empezar pruebas reales de la app con un arnes de calculo que simula casos clinicos representativos antes de usar proyectos firmados.

Casos cubiertos:

1. LINAC 6 MV: barrera primaria a area publica.
2. LINAC 18 MV: barrera secundaria con advertencia de neutrones/puerta/laberinto.
3. CT cuerpo: barrera hacia area publica.
4. PET F-18: sala de captacion/inyeccion.
5. Gamma Knife Co-60: barrera primaria de cribado.
6. HDR Ir-192: barrera hacia consola/control.

Cada caso verifica formula, norma, inputs, outputs, citas, unidades, carga estructural, comparador conservador, cache F196 y advertencias clinicas. La salida puede usarse para pruebas de flujo, pero no reemplaza la revision del fisico medico/RSO antes de firmar una memoria.

## Addendum F263 - Adaptador APS DWG Seguro

F263 agrega el puente backend para usar Autodesk Platform Services Design Automation como proveedor DWG->DXF sin prometer DWG nativo en navegador.

Flujo operativo:

1. Configurar `DWG_CONVERSION_PROVIDER=aps-design-automation` solo en backend.
2. Configurar `APS_CLIENT_ID`, `APS_CLIENT_SECRET` y `APS_BUCKET_KEY` solo como secretos de servidor.
3. Colocar DWG no sensibles en `fixtures/dwg/`.
4. Ejecutar `npm run prepare:f263:aps-dwg` y `npm run test:f263:aps-dwg`.
5. Revisar hashes, capas, unidades y escala antes de aplicar el DXF convertido al canvas.

La app mantiene fallback manual DXF. Si el proveedor falla, el floorplan activo no se modifica.

## Addendum F261-F262 - Proveedor DWG Y Fixtures

Proveedor recomendado:

- Primario: Autodesk Platform Services Design Automation para convertir DWG a DXF desde backend.
- Ruta privada futura: ODA self-hosted/private cloud si se necesita control total de planos sensibles.
- Preview: CloudConvert solo para SVG/PDF/PNG de referencia, no para calculo si no entrega capas DXF verificadas.
- Fallback: convertir manualmente a DXF con AutoCAD/ODA/local CAD y usar el importador DXF actual.

Antes de activar conversion real se requieren fixtures no sensibles en `fixtures/dwg/`:

1. `small-architectural-plan.dwg`: plano pequeno con capas de muros y escala conocida.
2. `equipment-layout.dwg`: plano con bloques o simbolos de equipos.
3. Opcional: `known-bad-or-empty.dwg` para validar fallo seguro.

Nunca aplicar un DWG directo al canvas. Flujo correcto: DWG -> proveedor backend -> DXF/SVG/IFC -> hash -> validacion de capas -> confirmacion de escala -> aplicar al canvas.

## Addendum F258-F260 - Activacion Por Carriles

F258-F260 queda implementado como carriles separados:

- Canvas CAD staging: el event controller v2 existe en codigo, pero el canvas estable sigue usando `useCanvas` si el flag esta apagado.
- DWG: la app no promete abrir DWG nativo; se usa proveedor externo controlado y salida DXF/SVG/IFC con auditoria.
- DB/fullstack: existe preflight F260; si faltan `DATABASE_URL`, backup, restore probe o backend URL, la salida correcta es `blocked-by-db-live-gates`.

Comandos utiles:

- `npm run test:f258-f260:full`
- `npm run prepare:f260:db-gate`

Para publicar frontend estatico no se requiere activar DB ni CAD alto riesgo. Para publicar fullstack si se requiere F260 listo.

## Addendum F257-F260 - Ejecucion Completa Segura

F257-F260 ya no queda solo como lista de pendientes: ahora existe un gate ejecutable con manifest, staging CAD y bloqueos claros para DWG/DB.

Estado por fase:

1. F257 ejecutado: se agrega `.env.staging-cad.example` para pruebas CAD de alto riesgo en staging. La app publica conserva los flags apagados.
2. F258 listo para staging: el renderer/event controller v2 solo puede activarse con `VITE_CANVAS_EVENT_CONTROLLER_V2=true` despues de tener patch aislado y E2E F229.
3. F259 bloqueado por proveedor: DWG debe entrar por conversion externa auditada a DXF/SVG/IFC, con fallback DXF.
4. F260 bloqueado por DB live: requiere `DATABASE_URL`, backup autorizado, restore probe, backend health y smoke fullstack antes de declarar persistencia productiva.

Comandos:

- `npm run prepare:f257-f260:full`
- `npm run test:f257-f260:full`

Regla de uso: publicar/verificar frontend estatico primero; probar CAD de alto riesgo solo en staging; retomar DB/fullstack en un carril separado.

## Addendum F256-F260 - Que Sigue Despues Del RC Estatico

Despues de F255, el orden recomendado es:

1. F256: subir el ZIP estatico actual a Vercel/Netlify y repetir smoke publico. Si Codex no tiene red, usar F203 manual.
2. F257: crear staging CAD con `VITE_CANVAS_HIGH_RISK_CAD=true`, sin activar todavia `VITE_CANVAS_EVENT_CONTROLLER_V2`.
3. F258: probar renderer/event controller v2 en staging con F229 antes y despues.
4. F259: definir proveedor externo para DWG a DXF/SVG/IFC; mantener DXF como ruta canonica.
5. F260: retomar DB/fullstack con `DATABASE_URL`, backup, restore probe, backend smoke y RAG privado.

Regla operativa: no mezclar deploy estatico, cambios profundos del canvas y DB fullstack en la misma fase. Si se rompe algo, volver al ZIP F255/F256 y apagar flags CAD.

## Addendum F251-F255 - CAD Alto Riesgo Con Feature Flag Y Rollback

El release candidate estatico F250 queda como baseline estable. Las mejoras CAD de alto riesgo se preparan sin activarse por defecto:

- `VITE_CANVAS_HIGH_RISK_CAD=false`
- `VITE_CANVAS_EVENT_CONTROLLER_V2=false`

Flujo obligatorio:
1. Ejecutar gates antes: F197, F207, F229, F231-F236 y F200.
2. Activar flags solo en staging o rama experimental.
3. Aplicar una mejora CAD a la vez.
4. Repetir los mismos gates despues.
5. Si falla canvas, sidebar, toolbar, DXF o reporte, apagar flags, limpiar `localStorage.radshield_feature_flags` y volver al artefacto F250.

Mejoras del carril:
- F251 renderer/event controller v2.
- F252 DWG por conversion externa.
- F253 sincronizacion 2D/3D bidireccional.
- F254 booleanas/solidos CAD.
- F255 heatmaps/isocontornos GPU/WebGL.

## Addendum F248-F250 - Release Candidate Final Y CAD Alto Riesgo

F248-F250 cierra el release candidate estatico sin mezclarlo con promesas fullstack. El frontend puede publicarse como demo/revision publica cuando el build y smoke pasen; DB/API/RAG privado sigue condicionado a restore probe real y secretos productivos.

Fases:
- F248: validar URL publica/static. Use `PUBLIC_DEPLOY_URL` con F202 o aplique F203 manual si la red de Codex esta bloqueada.
- F249: decision DB/fullstack. No declarar multiusuario ni persistencia clinica hasta F153/F168, restore probe, backup, secretos y smoke backend.
- F250: congelar release candidate final, manual v1-F250, Update Center y checklist de entrega.

Mejoras CAD de alto riesgo que siguen, pero no antes del RC:
- Reescritura del renderer base y del controlador de eventos.
- DWG nativo en navegador; por ahora debe seguir como conversion externa a DXF/SVG/IFC.
- Sincronizacion 2D/3D bidireccional en tiempo real.
- Booleanas/solidos CAD para puertas, penetraciones y recortes.
- Heatmaps/isocontornos GPU/WebGL con validacion numerica.

Cuando aplicarlas: despues de F250, en rama o feature flag, con rollback y repeticion de F197, F207, F229, F231-F236 y F200 antes/despues.

## Addendum F238-F247 - Cierre Pre-Deploy CAD, Calculo Y Reportes

F238-F247 ejecuta el cierre previo a deploy funcional sin reescribir de golpe el canvas ni declarar soporte fullstack antes de DB live.

Fases cerradas:
- F238: QA visual/documental final; el manual HTML debe mostrar cobertura `v1-F247`.
- F239: smoke de deploy estatico; repetir F200/F230/F237/F238-F247 antes de subir `dist`.
- F240: mejoras CAD bajo riesgo: propiedades, cotas, seleccion, etiquetas y helpers sin tocar eventos base.
- F241: renderer/eventos solo con feature flag, rollback y repeticion F198/F207/F229/F200.
- F242: DXF/DWG-convertido y simbolos de equipo; DWG nativo no se promete en navegador.
- F243: release frontend estatico; fullstack queda condicionado a DB live/restore probe.
- F244: ledger TVL/HVL versionado por material, energia, fuente, page hint, hash y estado de revision.
- F245: QA numerico por modalidad: LINAC, CT/RX, Gamma Knife, PET/NM y UAQ.
- F246: auditoria material: densidad, costo, masa, carga estructural, TVL/HVL y evidencia.
- F247: checklist de anexos para Memoria IA/PDF/Evidence: formula, norma, inputs, outputs, material ledger, unidades, comparador, warnings y hashes.

Decision de deploy:
- Frontend estatico: puede publicarse cuando pasen los gates estaticos y smoke URL.
- Fullstack/API/DB: no debe declararse productivo hasta validar DB live, restore probe, secretos y persistencia.

## Addendum F237 - Gobierno del Motor de Calculo

F237 consolida las mejoras recomendadas al motor de calculo en una capa unica de gobierno antes de Memoria IA, PDF, Evidence Pack o entrega regulatoria.

Que valida:
- Trazabilidad: `formulaId`, norma, modalidad, energia, entradas, salidas, supuestos y `citationIds`.
- Unidades: mm/cm/m, mSv/sem, uSv/h, densidad, kg/m2, costo/m2 y carga estructural.
- Advertencias: distancia menor a 0.3 m, energia >10 MV con neutrones, TVL no versionado, densidad no validada y revision RSO/fisico medico.
- Comparador: espesor base vs chequeo conservador por barrera.
- Cache: llave F196 por escala, geometria, fuentes, normas, materiales y P/T/U/W.
- QA numerico: referencias pequenas para LINAC 6 MV, LINAC 18 MV, CT/RX, Gamma Knife, PET/NM y revision UAQ.

Impacto operativo:
- Disminuye errores silenciosos por unidades mezcladas.
- Permite que cada resultado de Memoria IA tenga formula, norma, input, output y cita.
- Evita reportes firmados cuando falte comparador, cache, cita o advertencia clinica.
- Prepara el camino para mejorar kernels especificos sin tocar el canvas ni el renderer base.

Cobertura documental posterior a v116:
- F117-F130: perfiles de modalidad, menus por flujo, impacto estructural/materiales, evidencia y DB live.
- F131-F150: RAG/OCR/documentos, materiales TM Nipoll/bloques HD, Memoria IA, perfiles DX/TX/NM/CY, anexos y release candidate.
- F151-F180: Monte Carlo externo, restore probe, deploy local/static, Git/hosting, manuales, app estable y canvas recovery.
- F181-F200: hardening predeploy, Vercel/static dist, recuperacion canvas/DXF, menus, outputs y release gate.
- F201-F230: paneles movibles, import DXF, Canvas CAD E2E, tooltips, layout SketchUp-like, QA renderer/eventos y gate post-F229.
- F231-F237: release coverage visual/DXF/grips/isocontornos/3D/deploy y gobierno del motor de calculo.

## Addendum F231-F236 - Cierre Canvas Release Coverage

F231-F236 completa la cobertura pendiente posterior a F229 sin reescribir de golpe el renderer ni los eventos del canvas.

Fases cerradas:

- F231 `pixel-diff`: usa capturas F229/F207 como baseline visual para detectar canvas blanco, sidebar perdida, botones ausentes o menus que tapen el layout.
- F232 `DXF/DWG`: valida importacion DXF real con fixture sintetico. DWG sigue siendo conversion externa a DXF/SVG antes de importar.
- F233 `grip/snap`: mantiene cubierta la interaccion CAD por F229 E2E. El siguiente nivel es validar coordenadas exactas con event controller v2 bajo feature flag.
- F234 `isocontornos`: valida modo visual, leyenda y export. Para evidencia clinica firmable falta interpolacion numerica con unidades, umbrales y cita normativa.
- F235 `2D/3D`: consolida handoff de planta, equipos, espesores, zonas y snapshots. La sincronizacion bidireccional completa queda como incremento aislado.
- F236 `post-deploy`: deja paquete y URL publica para repetir smoke F154-F158/F202 despues de subir un nuevo `dist`.

Motor de calculo - mejoras recomendadas:

- Trazabilidad kernel-calculo: cada resultado debe devolver formulaId, norma, inputs, outputs, supuestos, warnings y citationIds. Impacto: Memoria IA, PDF y Evidence Pack podran sustentar cada espesor sin reconstruir manualmente la evidencia.
- Normalizacion unica de unidades: centralizar mm/cm/m, mSv/wk, Gy/wk, uSv/h, kg/m2, costos y carga estructural. Impacto: reduce errores silenciosos al comparar materiales y espesores.
- TVL/HVL versionado por fuente: cada material debe apuntar a documento, pagina, hash y vigencia. Impacto: permite comparar NCRP/IAEA/UAQ/proveedor y justificar plomo, concreto, TM Nipoll, bloques HD o multilayer.
- Comparador base/conservador: mostrar metodo base vs chequeo conservador por barrera. Impacto: identifica si domina primaria, fuga, scatter, neutrones o fuente puntual.
- QA numerico por modalidad: casos conocidos para LINAC, CT/RX, Gamma Knife, PET/NM y HDR. Impacto: aumenta confianza antes de declarar release clinico.

## Addendum F230 - Gate post-F229 para renderer base y eventos

F230 define cuando se puede modificar el renderer base y la logica de eventos del canvas.

Regla operativa:

- No tocar renderer base ni eventos si falla F198, F207, F229 o F200.
- Si los gates pasan, iniciar cambios pequenos en F231+ con feature flag y rollback a `useCanvas`.
- Despues de cada cambio de renderer/eventos, repetir F198 menus/botones, F207 flujo funcional, F229 canvas E2E y F200 release estatico.
- Si desaparecen canvas, sidebar, toolbar CAD o paneles de workflow, revertir solo el ultimo cambio de renderer/eventos y volver a correr F229.

Que valida F230:

- Menus y botones canonicos: Diseño, Equipos, Blindaje, Verificacion, Reportes, Evidencia e Integraciones.
- Funciones criticas: Archivo, import DXF, canvas, Memoria IA, PDF, Evidence Pack y CNSNS.
- Canvas CAD: dibujo, seleccion, lasso, modos visuales y export visual.
- Manuales, changelog, control de cambios, manual HTML y Update Center actualizados a la fase vigente.

Cobertura pendiente despues de F230:

- F231: baseline visual con pixel-diff para desktop/mobile.
- F232: fixture DXF/DWG dedicado dentro del E2E CAD.
- F233: grip drag y snapping por coordenadas exactas.
- F234: isocontornos numericos con etiquetas regulatorias.
- F235: sincronizacion 2D/3D de equipos, espesores, zonas y snapshots.
- F236: smoke post-deploy contra URL publica final.

## Addendum F229 - Canvas CAD E2E Harness

F229 agrega un arnes E2E dedicado para validar que el canvas profesional siga operativo despues de los cambios de renderer, botones y paneles.

Que cubre:

- Canvas, sidebar y toolbar CAD visibles al abrir la app.
- Filas F221, F222-F226, F227, F228 y F229 visibles como continuidad de QA.
- Superficie del canvas no vacia.
- Dibujo real de un muro con la herramienta `Muro`.
- Seleccion segura con inspector contextual.
- Gestos de ventana/lasso sin ocultar el layout.
- Modos visuales `Plano`, `Heat`, `Iso` y `Estruct`.
- Controles F217 para preparar export visual por escena.

Uso operativo: si el canvas, sidebar o botones desaparecen, primero ejecutar `npm run test:f229:canvas-e2e` y revisar las capturas en `outputs/f229_canvas_cad_e2e_harness/`. Esta prueba es el primer filtro antes de volver a modificar eventos base, grips o renderer.

Lo que aun falta cubrir despues de F229: baseline visual con pixel-diff, fixture DXF dedicado, validacion exacta de grip drag/snap por coordenada, isocontornos numericos y sincronizacion bidireccional 2D/3D.

## Addendum F228 - Helpers estaticos del renderer

F228 extrae helpers reales para el renderer sin cambiar la interaccion del canvas.

- `drawCanvasBackgroundGrid`: dibuja base y reticula del viewport.
- `drawFloorPlanImageLayer`: dibuja la imagen del plano importado con opacidad controlada.
- `drawCanvasScaleHud`: dibuja la escala/HUD del canvas.

Estos helpers ya son usados por `useCanvas.draw()`. La seleccion, los grips, el lasso, el preview de dibujo y los eventos base siguen en `useCanvas`, por seguridad.

Uso operativo: si la fila F228 muestra `escala OK`, la calibracion del plano esta lista para usar cotas/reportes. Si muestra `calibrar`, primero use la herramienta de calibracion antes de confiar en longitudes y escala.

## Addendum F227 - Renderer por capas

F227 inicia la mejora real del renderer con un registro de capas. Esto permite ordenar el dibujo y planear extracciones sin tocar los eventos que hacen funcionar seleccion, grips, lasso y snapping.

Capas definidas:

- `background-grid`: mesa, grid y base visual.
- `floorplan-image`: imagen del plano importado.
- `regions-zones`: zonas ocupadas/controladas.
- `barriers`: muros/barreras y etiquetas.
- `equipment-sources`: equipos/fuentes, footprint y rotacion.
- `heatmap`: mapa de dosis/kerma.
- `sample-lines`: lineas de muestreo/isocontornos.
- `cad-overlays`: preview de dibujo y snap.
- `selection-grips`: seleccion, grips, ventana y lasso.
- `hud-scale`: escala, HUD y datos de vista.

Uso operativo: la fila F227 del canvas muestra cuantas capas hay, cuantas ya estan listas para migrar, cuantas son helpers extraibles y cuantas siguen protegidas. Las primeras candidatas a extraer son `background-grid`, `floorplan-image` y `equipment-sources`. Las capas `cad-overlays` y `selection-grips` no deben migrarse hasta tener pruebas E2E.

## Addendum F222-F226 - Hardening seguro del canvas profesional

F222-F226 continua el canvas profesional sin cambiar de golpe el renderer ni los eventos base. La fila `F222-F226` del canvas resume el estado de cada frente.

- F222 Renderer layers: el siguiente trabajo seguro es extraer el dibujo por capas: grid, floorplan, muros, fuentes/equipos, zonas, heatmap, cotas, grips y overlays. Esto mejora mantenibilidad sin cambiar la forma de seleccionar o arrastrar.
- F223 Events flag: el nuevo controlador de eventos solo debe activarse con `VITE_CANVAS_EVENT_CONTROLLER_V2`. Si algo falla, la app vuelve al `useCanvas` actual.
- F224 E2E CAD: antes de tocar eventos base, deben existir pruebas de grip drag, snap endpoint/midpoint/interseccion, lasso, seleccion multiple, pan/zoom y export.
- F225 Isocontornos/footprints: los footprints por modalidad y la vista isocontours existen. Para evidencia firmable falta convertir isocontornos proxy en polilineas interpoladas con etiquetas regulatorias.
- F226 3D medico: el visor 3D puede recibir muros, equipos, zonas y export OBJ. Falta cerrar sincronizacion bidireccional de medidas, materiales, snapshots y hash de escena.

Regla operativa: si desaparece canvas, sidebar o toolbar, no continuar con renderer/eventos. Primero ejecutar smoke F207/F200 y revisar F222-F226; solo despues seguir.

## Addendum F221 - Conexiones reales del canvas

F221 verifica que las modificaciones principales del canvas esten conectadas a funciones reales, no solo a botones o textos.

Uso operativo:

- Grips arrastrables: seleccione un muro o fuente. En muros puede arrastrar vertices y punto medio; en fuentes puede mover el centro o usar el grip `R` para rotar.
- Snapping CAD: active Snap y dibuje cerca de endpoints, midpoints, perpendiculares, intersecciones, centros de equipo o angulos de 15 grados.
- Seleccion multiple: en modo seleccion, arrastre en vacio para ventana; use Ctrl/Meta+arrastre para lasso; use Shift+click para agregar o quitar objetos.
- Edicion inline: seleccione un objeto y use el inspector compacto para nombre, material, workload, T, P o isocentro.
- Footprints: coloque equipos/fuentes; el canvas muestra footprint y rotacion por modalidad. Las variantes detalladas por fabricante quedan para hardening posterior.
- Export visual: use export por escena para alimentar Memoria IA, PDF, Evidence Pack o anexos.

Limites actuales: los isocontornos siguen siendo una visualizacion proxy y requieren interpolacion regulatoria real antes de usarse como evidencia clinica final. La inspeccion 3D ya recibe handoff desde el floorplan, pero falta sincronizacion bidireccional completa de medidas, materiales y snapshots.

Renderer/eventos base: ya se pueden mejorar despues de pasar F221 y smoke funcional, pero de forma escalonada. Primero se extraen helpers/capas de render sin cambiar eventos; despues se introduce un event controller detras de feature flag y con rollback al `useCanvas` actual.

## Addendum F220 - Acciones CAD P0 a P2

F220 agrega una fila compacta dentro del panel de flujo del canvas. Su objetivo es que los pendientes CAD ya identificados no queden como lista abstracta: cada grupo tiene un boton operativo o una entrada segura hacia la siguiente microfase.

Botones F220:

- `P0 Edit`: abre el editor inline F191E para el objeto seleccionado.
- `P0 Snap`: activa o desactiva el snap CAD actual: endpoint, midpoint, perpendicular, interseccion, centro de equipo y angle15.
- `P0 Cotas`: abre calibracion/medicion para preparar cotas editables F222.
- `P1 Sel`: vuelve al modo seleccion; arrastre en vacio para ventana, Ctrl/Meta+arrastre para lasso y Shift+click para multiseleccion.
- `P1 Iso`: cambia a vista de isocontornos para revisar lineas de muestreo y preparar F224.
- `P1 Eq`: cambia a colocacion de equipo/fuente con footprint y rotacion por modalidad.
- `P2 3D`: abre la inspeccion 3D medica si el conector esta disponible.

Uso recomendado:

1. Seleccionar una barrera, fuente, zona o punto critico.
2. Usar `P0 Edit` para cambiar propiedades simples.
3. Usar `P0 Snap` y `P0 Cotas` antes de dibujar o validar dimensiones.
4. Usar `P1 Iso` despues de calcular para preparar evidencia visual.
5. Usar `P2 3D` solo como inspeccion avanzada, no como sustituto del calculo ni de la memoria analitica.

Regla de seguridad: F220 crea accesos operativos y F221 confirma las conexiones reales ya presentes. Lo que sigue como hardening es interpolacion real de isocontornos, cotas persistentes editables completas, variantes de equipos por fabricante y QA E2E de eventos.

## Addendum F219 - QA visual post-deploy y pendientes del canvas

F219 es la lista de control posterior al deploy publico. Su objetivo es confirmar que la version publicada conserve canvas, sidebar, toolbar, DXF, escenas F217 y handoff F218, y separar las mejoras de canvas que aun faltan de las que ya estan estabilizadas.

Checklist rapido en Vercel:

- Abrir `https://radshield-mx-static-dist.vercel.app/` y confirmar que no hay pantalla blanca ni cache viejo.
- Confirmar sidebar izquierda, viewport principal y toolbar CAD-clinica.
- Abrir Archivo, importar un DXF y usar `Aplicar al canvas`.
- Preparar escenas `Planta`, `Heat`, `Iso` y `Estruct`.
- Abrir Memoria IA, PDF Report y Evidence Pack para revisar F218.
- Guardar captura final del canvas como evidencia manual del operador.

Pendientes del canvas priorizados:

- P0: edicion CAD directa.
- P0: snapping avanzado visual.
- P0: cotas persistentes, editables y exportables.
- P1: seleccion multiple/lasso con hover preselection.
- P1: isocontornos reales con etiquetas y leyenda regulatoria.
- P1: simbolos de equipo con footprints y variantes por fabricante.
- P2: inspeccion 3D con recorrido, acabados, espesores y export visual.

Regla de seguridad: cada mejora debe entrar en microfase con smoke visual antes/despues. Si el canvas, sidebar o toolbar desaparecen, detener y aplicar recuperacion F197/F204 antes de seguir.

## Addendum F218 - Handoff visual a reportes

F218 ayuda a cerrar una memoria o expediente con evidencia visual explicita. Toma las escenas preparadas en F217 y muestra si cada captura requerida esta lista, falta o requiere revision.

Uso recomendado:

- En el canvas, preparar las escenas `Planta`, `Heat`, `Iso` y `Estruct`.
- Exportar PNG por escena cuando el plano, calculo, cotas o barreras esten listos.
- Abrir Memoria IA para revisar la seccion 7.11 `HANDOFF VISUAL F218`.
- Abrir PDF Report para confirmar que el JSON incluya `f218_report_handoff`.
- Abrir Evidence Pack y verificar que el panel F218 no tenga faltantes antes de cerrar expediente.

Logica de adjuntos:

- `01-planta-clinica`: plano base con barreras, equipos, zonas y escala para Memoria IA.
- `02-heatmap-regulatorio`: mapa visual de dosis/umbrales para Evidence Pack.
- `03-isodosis-lineas-muestreo`: isocontornos y lineas de evaluacion para PDF.
- `04-material-peso-carga`: material, espesor, peso y carga para anexo estructural.

Advertencia: F218 no recalcula ni certifica resultados. Es un control documental para evitar entregar memorias sin capturas visuales trazables.

## Addendum F217 - Export visual por escena

F217 organiza la exportacion de imagenes del canvas por escena. Su objetivo es producir evidencia visual consistente para Memoria IA, PDF, Evidence Pack y anexos estructurales.

Escenas:

1. `Planta`: layout, escala, barreras, equipos, zonas y puntos criticos. Destino principal: Memoria IA.
2. `Heat`: mapa de calor, maximo proxy, umbrales regulatorios y leyenda F212. Destino principal: Evidence Pack.
3. `Iso`: lineas de muestreo/isodosis, gradientes y puntos maximos. Destino principal: PDF.
4. `Estruct`: material, espesor, peso, carga estructural y comparador costo/tiempo. Destino principal: anexo estructural.

Uso recomendado:

- Prepare la escena con el boton de su nombre.
- Verifique escala, leyenda y que el panel no tape una barrera critica.
- Use `PNG` para exportar la imagen.
- Adjunte la imagen exportada en Memoria IA, PDF o Evidence Pack segun el destino sugerido.
- F217 no recalcula ni certifica resultados; solo ordena la evidencia visual.

## Addendum F216 - Mini View Manager

F216 agrega un gestor compacto de vistas dentro del canvas. Sirve para regresar rapidamente a un encuadre de trabajo sin perder tiempo buscando el plano despues de zoom, pan, heatmap o revision estructural.

Funciones:

1. `Z`: muestra el zoom actual en porcentaje.
2. `Pan`: muestra el desplazamiento actual del viewport.
3. `+A`, `+B`, `+C`: guarda la vista actual en uno de tres slots locales.
4. `Ir`: restaura una vista guardada con su modo visual, zoom y pan.
5. `x`: borra el slot de vista guardada.

Uso recomendado:

- Guarde `A` como vista general de planta.
- Guarde `B` como vista de barrera critica o acceso.
- Guarde `C` como vista de heatmap/isodosis o estructura.
- Si el canvas parece vacio, use primero `Extents`; despues guarde una vista nueva.
- Las vistas se guardan en el navegador local; no son parte de la DB ni reemplazan el guardado del proyecto.

## Addendum F215 - Presets de escena del canvas

F215 agrega una tira de escenas dentro del viewport para cambiar rapidamente la lectura del floorplan sin abrir menus adicionales. Los presets reutilizan funciones ya existentes, por lo que no alteran escala, calculo, DXF ni trazado.

Presets disponibles:

1. `Planta`: vista limpia para dibujar barreras, colocar equipos, zonas y puntos criticos.
2. `Heat`: activa la lectura de mapa de calor para revisar intensidad relativa y maxima proxy semanal.
3. `Iso`: muestra lineas/isocontornos de evaluacion para revisar gradientes y puntos maximos.
4. `Estruct`: prioriza material, espesor, peso y carga estructural del blindaje.
5. `Extents`: centra todo el plano cuando el layout parece fuera de pantalla o la vista quedo desplazada.

Flujo recomendado:

- Use `Planta` al iniciar el croquis o al revisar un DXF importado.
- Use `Extents` inmediatamente si no ve el canvas, si cargo un plano grande o si hizo zoom/pan excesivo.
- Use `Heat` e `Iso` despues de calcular blindaje para preparar Memoria IA y Evidence Pack.
- Use `Estruct` cuando compare plomo, concreto, tabiques HD, TM/Nipoll, multilayer, peso, costo y tiempos de obra.

## Addendum F214 - Canvas tipo SketchUp / estudio CAD medico

F214 reorganiza el area del floorplan para que se lea como una mesa de trabajo CAD tipo SketchUp: fondo gris de estudio, reglas superior/lateral, chips de escena, cubo de vista y triada XYZ. Es una mejora visual y de orientacion; no cambia escala, calculos, importacion DXF ni eventos de dibujo.

Elementos nuevos:

1. `F214 Studio`: muestra escena activa, estilo visual, snap, capas visibles y conteo de objetos.
2. `Cubo de vista`: orienta la planta con etiquetas TOP/N/E para preparar revision 2D y futura inspeccion 3D.
3. `Ejes XYZ`: X este, Y norte y Z altura/espesor; util para hablar de espesores, recorridos y acabados.
4. `Reglas`: refuerzan lectura metrica del canvas sin reemplazar cotas editables ni calibracion de escala.
5. `Controles flotantes`: zoom extents, acercar, alejar, snap y export PNG ahora explican su funcion al posicionar el cursor.

Uso recomendado:

- Empiece con `Plano` o `Importar DXF` y confirme que el cubo/triada no obstruyen barreras ni menus.
- Use `Ajustar vista` para recuperar el floorplan si queda fuera de pantalla.
- Active `Snap` al trazar muros, cotas, equipos o puntos de control.
- Cambie entre `Plano`, `Heat`, `Iso` y `Estruct` para comparar el mismo layout con distintas lecturas.
- Exporte PNG cuando necesite evidencia visual para Memoria IA, PDF, Evidence Pack o revision CNSNS/UAQ.

## Addendum F213 - Mapeo DXF y leyendas de botones CAD

F213 agrega una revision de capas al visor DXF antes de aplicar el plano al canvas. Cada capa se clasifica como muro/barrera, equipo, zona, cota, referencia, texto o no mapeada. Solo LINE/LWPOLYLINE utilizables se aplican como barreras; equipos, zonas y cotas quedan como referencia para que el usuario los coloque o valide.

Logica recomendada para diseno de areas:

1. `Plano`: cargue imagen, PDF raster o DXF para iniciar el floorplan.
2. `Escala`: calibre con una distancia conocida antes de calcular espesores.
3. `Muro`: trace barreras primarias/secundarias o revise las importadas desde DXF.
4. `Fuente`: coloque equipo o fuente radiologica con modalidad, workload, fabricante y footprint.
5. `Zona`: marque zona controlada, publica u ocupada para definir objetivo P y ocupacion T.
6. `Punto`: agregue puntos criticos en accesos, colindancias o areas sensibles.
7. `Material`: asigne concreto, plomo, acero, tabiques HD o configuraciones multilayer.
8. `Calcular`: ejecute el motor analitico con geometria, escala, fuente, P/T/U/W y material.
9. `Heat`/`Iso`: revise mapa de calor, lineas 0.3 m, maximos y leyenda regulatoria.
10. `Snapshot`: exporte evidencia visual para Memoria IA, PDF o Evidence Pack.

Uso del visor DXF:

- `Importar DXF`: carga el archivo y muestra capas, entidades y vista previa.
- `F213 Mapeo DXF`: indica que capas se trataran como muros, equipos, zonas, cotas o referencia.
- `Aplicar al canvas`: aplica las barreras detectadas al floorplan principal.
- Si hay capas `Rev` o no mapeadas, revise el nombre de capa o convierta/remapee en CAD antes de usar el plano como base firmable.

Las leyendas al posicionarse sobre cada boton explican su funcion y el momento recomendado dentro del flujo de diseno.

## Addendum F212 - Leyenda regulatoria de heatmap/isocontornos

F212 agrega una leyenda compacta para interpretar mapas de calor e isocontornos en el canvas. Resume umbrales ALARA, publico y controlado, metas minima/maxima del proyecto, niveles de color y el valor maximo proxy semanal detectado.

Uso recomendado:

1. Ejecute calculos o active heatmap.
2. Revise el chip `F212 Heat`.
3. Confirme que existan lineas 0.3 m e isocontornos antes de anexar la imagen a una memoria.
4. Si aparece advertencia, complete resultados, heatmap o lineas de muestreo.
5. Use la leyenda como apoyo de QA visual; la validacion final sigue requiriendo revision del fisico medico/RSO.

F212 no certifica mediciones ni cambia limites regulatorios. Ordena la evidencia visual para Memoria IA, PDF y Evidence Pack.

## Addendum F211 - Agenda de simbolos de equipos

F211 resume los equipos y fuentes colocados en el floorplan. Muestra modalidad, norma/metodologia, variante o fabricante, footprint, rotacion y workload. Su proposito es detectar metadatos faltantes antes de generar inspeccion 3D, Memoria IA o anexos visuales.

Uso recomendado:

1. Coloque o importe el equipo/fuente en el plano.
2. Revise el chip `F211 Eq`.
3. Si `FP` no cubre todos los equipos, agregue footprint real antes de inspeccion 3D.
4. Si `Fab` esta incompleto, seleccione variante/fabricante para mejorar citas, simbolo y memoria.
5. Verifique rotacion CAD antes de exportar imagen o anexo.

F211 no cambia calculos; ayuda a evitar memorias con equipos mal identificados o sin dimensiones reales.

## Addendum F210 - Gestor compacto de capas

F210 muestra un resumen de capas directamente en el panel del canvas. Permite confirmar si el plano, blindajes, fuentes, heatmap, anotaciones y UI estan visibles, bloqueados o con baja opacidad.

Uso recomendado:

1. Si el canvas parece vacio, revise primero F210.
2. Confirme que `Blindaje` y `Fuentes` no esten ocultos.
3. Si una capa aparece con opacidad baja, abra el panel de capas para ajustarla.
4. Use el chip `Activa` para saber en que capa esta trabajando antes de editar.

F210 no edita capas directamente; sirve como indicador rapido para evitar perder contexto del floorplan.

## Addendum F209 - Agenda de cotas del canvas

F209 muestra una agenda compacta de cotas dentro del panel del canvas. Permite revisar rapidamente cuantas barreras hay, la longitud total del blindaje, la escala activa, el material/espesor de cada muro y si cada barrera ya tiene resultado de calculo.

Interpretacion rapida:

- `F209 100%`: todas las barreras listadas tienen resultado asociado.
- `L`: longitud total estimada en metros.
- `Muros`: numero de barreras del floorplan.
- Cada chip de muro muestra nombre corto y longitud; verde indica que ya tiene resultado.

Si F209 queda en revision, revise escala, barreras de longitud cero o calculos faltantes antes de anexar el plano a una memoria.

## Addendum F208 - Canvas reportable

F208 agrega una capa de revision para saber si el plano ya puede anexarse a una memoria analitica. El panel resume seis rubros: plano, cotas, capas, simbolos, heatmap/isocontornos y export. Cada rubro puede estar listo, parcial o faltante.

Uso recomendado:

1. Dibujar o importar el plano.
2. Colocar el equipo/fuente.
3. Verificar cotas, lineas 0.3 m y puntos de evaluacion.
4. Activar capas necesarias y revisar heatmap/isocontornos.
5. Exportar PNG/CAD JSON o abrir Memoria IA/PDF/Evidence Pack.

Si F208 marca parcial, la app todavia puede usarse para revision, pero no conviene firmar o entregar una memoria hasta cerrar las advertencias indicadas.

## Addendum F207 - QA funcional antes de publicar

F207 valida el recorrido minimo que debe funcionar para considerar la app usable como frontend estatico: abrir al canvas, mantener sidebar y toolbar CAD, abrir Archivo, importar un DXF y aplicarlo al floorplan, abrir Reportes y verificar Memoria IA, PDF analitico y Evidence Pack.

Comandos:

- `npm run test:f207:functional-app-qa-smoke`
- `npm run test:f207:functional-app-qa`

Si F207 falla, no conviene subir un nuevo ZIP a Vercel. Primero revise el check fallido en `outputs/f207_functional_app_qa_smoke_result.json` y la captura correspondiente en `outputs/f207_functional_app_qa_*.png`.

## Addendum F204 - Canvas y DXF al floorplan

La app abre directamente el canvas/floorplan para evitar que la pantalla de bienvenida o cache impidan ver el plano. Si se requiere mostrar bienvenida para capacitacion, definir `radshield_force_welcome=true` en localStorage.

Para importar DXF:

1. Abrir `Archivo > Importar DXF` o el acceso DXF.
2. Seleccionar archivo `.dxf`.
3. Revisar entidades/capas/barreras detectadas.
4. Pulsar `Aplicar al canvas`.

El sistema convierte LINE y LWPOLYLINE en barreras del floorplan. Para DWG, convertir primero a DXF con AutoCAD, ODA File Converter u otra herramienta CAD; RadShield-MX no declara soporte DWG nativo en navegador.

## Addendum F203 - Verificacion publica manual

Cuando F202 queda como `public-vercel-smoke-network-gated`, el operador debe abrir la URL publica desde un navegador sin bloqueo y completar `outputs/f203_manual_public_verification/CHECKLIST_OPERADOR_F203_PUBLICO.md`.

La lista pide evidencia de: URL HTTPS, barra superior, sidebar, canvas/floorplan, toolbar CAD, panel Layout-blindaje-memoria movible/compactable, menus canonicos y salidas Memoria IA, PDF analitico, Evidence Pack y CNSNS.

Comandos:

- `npm run prepare:f203:manual-public-verification`
- `npm run test:f203:manual-public-verification`

La decision final se registra como `GO-static-frontend`, `GO-with-minor-notes` o `NO-GO-fix-required`.

## Addendum F202 - Smoke publico Vercel

F202 valida la app publicada como frontend estatico en `https://radshield-mx-static-dist.vercel.app/`. La prueba abre la URL real en navegador, confirma que el canvas, sidebar, toolbar CAD y panel Layout-blindaje-memoria se rendericen, y abre las salidas principales: Memoria IA, PDF analitico, Evidence Pack y Reporte CNSNS.

Comandos de validacion:

- `npm run test:f202:public-vercel-contracts`
- `npm run test:f202:public-vercel-smoke`

Si se publica en otra URL, definir `PUBLIC_DEPLOY_URL` antes de ejecutar el smoke. Si el entorno de Codex bloquea la salida a internet, el resultado queda como `public-vercel-smoke-network-gated`; para forzar fallo duro usar `F202_STRICT_PUBLIC_SMOKE=1`. Esta fase no sustituye el deploy full-stack con DB live; confirma que el frontend publico estable no perdio menus, canvas ni salidas criticas.

## Addendum F201 - Panel Layout Blindaje Memoria

El panel `Layout - blindaje - memoria` ahora puede desplazarse para no tapar el plano. Use el boton con icono de mover en la cabecera para alternar entre arriba, derecha y abajo. Use el boton de flecha para compactar o expandir el panel. Use la X para cerrarlo; si se cierra, el restaurador de paneles permite volver a mostrar `Flujo`.

El modo compacto deja visible solo la cabecera con el avance del flujo. Es util cuando se requiere revisar cotas, muros, equipos o heatmaps sin perder la referencia de progreso.

## Addendum F200 - Release estatico del frontend

F200 deja el frontend como release candidate estatico: el paquete se puede publicar en Vercel, Netlify u otro hosting SPA que sirva el directorio `dist`. La URL sugerida para validacion es `https://radshield-mx-static-dist.vercel.app/`, salvo que el operador defina otra con `PUBLIC_DEPLOY_URL`.

Antes de considerar estable la publicacion, F200 exige que hayan pasado las compuertas de recuperacion visual/menu/canvas, menus canonicos y salidas principales. Esta fase no activa backend, MySQL ni DB clinica; para multiusuario serio y trazabilidad DB-backed falta release full-stack.

Comandos para repetir la compuerta:

- `npm run prepare:f200:static-release-gate`
- `npm run test:f200:static-release-gate`

Despues de publicar, continuar con F201 public URL smoke para abrir la URL real y validar canvas, menus, Memoria IA, PDF, Evidence Pack y CNSNS en produccion.

## Addendum F199 - Validacion de salidas

F199 agrega una prueba de salida para confirmar que las pantallas de entrega se abren correctamente antes de publicar o empacar la app. Las superficies cubiertas son Memoria IA, PDF analitico, Reporte CNSNS, Evidence Pack, Checklist CNSNS, Regulatory Report y Batch Report Exporter.

La validacion busca evidencia visible o montada: snapshot de calculo, gate calculo-memoria-evidencia, anexo de materiales, QA numerico normativo, gateway Monte Carlo, evidencia F76 y checklist CNSNS. Esta fase no sustituye la revision profesional del fisico medico/RSO; es una puerta tecnica para evitar entregar reportes sin secciones criticas.

Comandos para operadores tecnicos:

- `npm run test:f199:outputs`
- `npm run test:f199:outputs-smoke`

## Addendum F198 - Validacion de menus canonicos

La barra superior queda organizada por flujo real:

- Diseno: plano, escala, DXF, 3D medico, nube de puntos y deteccion de barreras.
- Equipos: biblioteca de equipos/fuentes, Gamma Knife, braquiterapia, CBCT/IGRT, medicina nuclear y ciclotron.
- Blindaje: calculo global, UAQ, barrera rapida, suelo/techo, multilayer, neutrones, skyshine y blindajes por modalidad.
- Verificacion: NCRP/IAEA/UAQ, cross-validation, sensibilidad, incertidumbre, mapas de dosis y performance.
- Reportes: Memoria IA, PDF analitico, Reporte CNSNS, dashboard, costos, checklist y puente a Evidence Pack.
- Evidencia: Evidence Pack, RAG deep dive, biblioteca, bibliografia, auditoria, logs y revision de fuentes IA.
- Integraciones: performance, auditoria tecnica, CAD/MC, agentes y conversiones controladas.

F198 valida que abrir cada grupo no oculte sidebar, canvas ni toolbar CAD. Archivo se conserva como unico menu legacy visible para operaciones de proyecto/import/export/ayuda.

## Addendum F197 - Recuperacion visual de menus, sidebar y canvas

Si al abrir la app no aparece el canvas, la sidebar o los botones, primero use el flujo de recuperacion F197 antes de asumir fallo del motor grafico:

- Recargar la app despues de abrir `reset-cache.html` cuando se use paquete estatico/local.
- Confirmar que el splash/welcome se cerro con `Continuar` o `Nuevo Proyecto en Blanco`.
- Si persiste, limpiar estados locales de paneles: `radshield_canvas_panels_f188`, `radshield_canvas_workflow_dock_f188` y `radshield_sidebar_width_f188`.
- Volver a abrir Archivo y ejecutar `Nuevo Proyecto`; esto reinicia el floorplan sin borrar codigo ni configuracion global.
- Validar que se vean: sidebar izquierda, canvas principal, toolbar CAD-clinica F191 y panel de flujo o boton restaurar paneles.

F197 no cambia formulas ni layout principal. Su funcion es distinguir entre estado persistido oculto, onboarding/cache y fallo real de render.

## Addendum F161 - Manuales in extenso predeploy

F161 consolida el manual operativo antes del deploy final en `outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md`.

Uso recomendado:
- Seguir el flujo real: proyecto, plano, escala, modalidad, equipos, barreras, calculo, evidencia, Memoria IA, PDF y Evidence Pack.
- Usar el canvas/floorplan como superficie principal; el mapa clinico F164 es una salida ejecutiva derivada, no reemplaza edicion CAD ni QA numerico.
- Repetir contratos F161/F164/F165/F159 y smoke post-deploy antes de declarar release publico.
- Mantener `DATABASE_URL` y secretos fuera del repo y fuera de paquetes entregables.

## Estado operativo recomendado

RadShield-MX puede usarse en modo local/offline para dibujar planos, colocar fuentes, calcular blindajes, generar Evidence Pack y preparar memoria analitica. La persistencia en servidor requiere habilitar backend y MySQL.

## Reconstruccion de DB

La DB no debe reconstruirse contra produccion. Use una base local/test:

```powershell
$env:DATABASE_URL="mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test"
npm run db:migrate
npm run db:seed
npm run db:validate:live
```

El validador vivo confirma tablas base, dosimetria, workflow, usuario seed, proyecto seed, chunks RAG y workspace de dosimetria.

## RAG y sustento de memorias analiticas

Las mejoras prioritarias del RAG son busqueda hibrida, ledger de citas, reranking regulatorio, fingerprints de documentos y deep-dive planner. No es necesario reingresar NCRP si ya esta cargado y versionado; si se agrega una version nueva, debe tratarse como documento nuevo con hash, fecha, fuente y cobertura.

## DWG, SVG, PNG y planos

DXF es el formato vectorial preferido para importacion directa. DWG debe convertirse externamente a DXF o SVG usando AutoCAD, ODA File Converter, LibreDWG o un servicio CAD autorizado. SVG/PNG/JPG pueden usarse como overlays de referencia si se calibra escala antes de calcular.

## Equipos en canvas

Al colocar una fuente, RadShield-MX usa perfiles visuales por modalidad: LINAC, Gamma Knife, CT, PET/CT, HDR, ciclotron, SPECT y mastografia. Cada perfil aporta footprint, icono, etiqueta corta, color, asset sugerido y tags RAG.

## Visualizacion 3D

El visor Medical 3D usa las barreras del floorplan, fuentes colocadas, footprint de equipos y tags RAG. El objetivo es revisar relaciones espaciales, barreras primarias/secundarias y evidencia visual; no sustituye CAD/BIM firmado.

## Aprendizaje con memorias analiticas

Para mejorar IA y ML se recomiendan memorias analiticas anonimizadas y revisadas. Rango practico: 20-30 para prompts y plantillas; 50-100 para busqueda y sugerencias RAG; 200+ para entrenamiento/fine-tuning o modelos predictivos internos; 500+ para analitica estadistica robusta por modalidad/equipo/regulacion.

---
# RadShield-MX v104 — Manual de Usuario

## Contenido
1. Introduccion
2. Calculo de Blindaje NCRP 147/151
3. Botones NCRP Rapidos (Prim/Sec/Neut/Sky) — v99
4. Factores de Ocupacion NCRP 147 — v98
5. Transporte de Material Radiactivo (SSR-6) — v96
6. OpenCV.js Deteccion Automatica — v97
7. NIST XCOM Attenuation Database — NUEVO v100
8. ML Shielding Predictor (ONNX) — NUEVO v101
9. Revit IFC Import (BIM) — NUEVO v102
10. Analisis de Sensibilidad (Tornado) — v50
11. Comparacion de Escenarios — v50
12. Validacion NCRP — v50
13. Blindaje PET (AAPM TG 108) — v50
14. Blindaje SPECT (IPEM 109) — v50
15. Blindaje Terapia Radionuclida — v50
16. Skyshine (Chilton) — v50
17. Cadenas de Decaimiento — v50
18. Certificacion GMP Ciclotron — v50
19. CT Scatter por Modelo — v50
20. Bibliografia

---

## 1. Introduccion

RadShield-MX es un sistema profesional de calculo de blindajes radiologicos para Mexico, conforme a NOM-008-NUCL-2018, NOM-040-NUCL-2016, NCRP 147 (2004), NCRP 151 (2005) e IAEA SSR-6 (2018).

**Stack**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + tRPC + Drizzle ORM + MySQL
**Version**: v99 | **Referencias**: 82+ | **Modulos**: 208+ dialogos y componentes

---

## 2. Calculo de Blindaje NCRP 147/151

### Procedimiento
1. Seleccione el equipo (RX, CT, LINAC, etc.)
2. Defina la carga de trabajo (mA·min/semana o Gy/semana)
3. Establezca la distancia fuente-barrera
4. Seleccione el material de blindaje
5. Ejecute el calculo (F5 o boton "Calcular Blindaje")

### Parametros de entrada
- **Tension (kVp)**: 50-150 kV para diagnostico, 4-25 MV para terapia
- **Carga de trabajo**: mA·min/semana (diagnostico) o Gy/semana (terapia)
- **Campo**: cm² de irradiacion
- **Distancia**: metros desde la fuente a la barrera
- **Meta de diseño (P)**: mSv/semana — 0.1 (areas controladas), 0.02 (publico)

### Formula barrera primaria (NCRP 147 Eq. 4.1, NCRP 151 Eq. B.1)
```
B = (P × d²) / (W × U × T)
```
Donde:
- **B** = Factor de transmision requerido
- **P** = Meta de diseño (mSv/semana)
- **d** = Distancia fuente-barrera (m)
- **W** = Carga de trabajo semanal
- **U** = Factor de uso (direccion del haz)
- **T** = Factor de ocupacion del area protegida

---

## 3. Botones NCRP Rapidos (Prim/Sec/Neut/Sky) — NUEVO v99

**Ubicacion**: Toolbar principal, despues de los botones DX/TX/NM/CY

### Uso
| Boton | Color | Funcion | Referencia |
|-------|-------|---------|------------|
| **Prim** | Rojo | Calculo barrera primaria: B = Pd²/(WUT) | NCRP 147 Eq. 4.1, NCRP 151 Eq. B.1 |
| **Sec** | Naranja | Calculo barrera secundaria: Scatter + Leakage | NCRP 147 Sec. 4.4, NCRP 151 Sec. B.3 |
| **Neut** | Azul | Blindaje neutronico para energias > 10 MV | NCRP 151 Sec. B.4, McGinley 1998 |
| **Sky** | Cielo | Skyshine Chilton: dispersion atmosferica | NCRP 151 Sec. 5.4, Chilton 1963 |

### Metodologia
1. Dibuje las barreras en el canvas
2. Asigne fuentes con carga de trabajo
3. Haga clic en el boton correspondiente
4. Revise los resultados en el panel de resultados

---

## 4. Factores de Ocupacion NCRP 147 — NUEVO v98

### Perfiles NCRP 147 Table A.1

| Perfil | T | Area tipica | Uso |
|--------|---|-------------|-----|
| Control Room | 1.0 | Sala de control, oficina | Personal tiempo completo |
| Patient Room | 1.0 | Cuarto paciente, ICU | Pacientes internados |
| Corridor | 0.2 (1/5) | Pasillo, vestibulo | Transito parcial |
| Waiting Room | 0.05 (1/20) | Sala espera, cafeteria | Ocasional |
| Elevator | 0.05 (1/20) | Elevador, escaleras | Circulacion vertical |
| Restroom | 0.05 (1/20) | Baño, vestidor | Breve occupacion |
| Parking | 0.025 (1/40) | Estacionamiento, exterior | Raro |
| Store | 0.05 (1/20) | Tienda, comercial | Comercial |
| Public Street | 0.05 (1/20) | Calle publica, banqueta | Exposicion breve |
| Darkroom | 0.025 (1/40) | Cuarto oscuro, archivo | Raramente ocupado |
| Attic | 0.0 | Atico, no ocupado | Sin acceso personas |

### Deteccion automatica
Al crear una barrera o region, el sistema sugiere automaticamente el factor T segun el nombre (ej: "Corridor" → T=0.2).

### Objetivos de diseno P
- **Areas controladas**: 0.1 mSv/semana (5 mSv/año / 50 semanas)
- **Areas no controladas/publicas**: 0.02 mSv/semana (1 mSv/año / 50 semanas)

---

## 5. Transporte de Material Radiactivo (SSR-6) — NUEVO v96

**Boton**: Toolbar → Transporte (icono Truck)

### Categorias IAEA SSR-6 Rev.1

| Categoria | Color | Dosis superficie | Dosis a 1m | Ejemplos |
|-----------|-------|------------------|------------|----------|
| I-BLANCO | Blanco | < 5 uSv/h | — | Fuentes de calibracion debil |
| II-AMARILLO | Amarillo | 5-500 uSv/h | < 10 mSv/h | Mo-99/Tc-99m, Ir-192 braqui |
| III-AMARILLO | Amarillo | > 500 uSv/h | > 10 mSv/h | Co-60 teleterapia, Ir-192 alta |

### Calculadora de dosis
Formula: **D = (A x Γ) / d²**
- 8 nuclidos pre-configurados: Co-60, Ir-192, Cs-137, I-131, Tc-99m, F-18, Mo-99, Ra-226
- Categorizacion automatica segun limite de dosis

### Referencias regulatorias Mexico
- LAERA (Ley Federal de Riesgos Ambientales)
- RETECO (Reglamento de Transporte de Combustibles)
- NOM-013-NUCL-2013 (Transporte de materiales radiactivos)
- CNSNS-L-010-2015 (Autorizaciones de transporte)

---

## 6. OpenCV.js Deteccion Automatica — NUEVO v97

**Boton**: Toolbar → OpenCV (icono ScanEye)

### Pipeline de deteccion
1. **Canny Edge Detection**: Detecta bordes en el plano arquitectonico
2. **Hough Line Transform**: Convierte bordes en lineas rectas
3. **Find Contours**: Encuentra contornos cerrados (habitaciones)

### Resultado
- Lineas detectadas → Barreras (`Barrier`) con factores NCRP automaticos
- Contornos cerrados → Regiones ocupadas (`OccupiedRegion`)

### Requisito
Debe cargar primero una imagen PNG/JPG del plano arquitectonico (boton "Importar Plano").

---

## 7. NIST XCOM Attenuation Database — NUEVO v100

**Boton**: Toolbar → NIST (icono Database)

Base de datos NIST Standard Reference Database 8 con coeficientes de atenuacion para 7 materiales de blindaje comunes.

### Materiales incluidos
| Material | ρ (g/cm³) | Z_eff | Uso tipico |
|----------|-----------|-------|------------|
| Lead (Pb) | 11.34 | 82 | Blindaje diagnostico, HDR |
| Concrete (2.35) | 2.35 | 14.0 | Blindaje primario MV |
| Steel (7.87) | 7.87 | 26.0 | Blindaje secundario, puertas |
| Gypsum Wallboard | 0.70 | 13.5 | Muros interiores, separacion |
| Polyethylene | 0.94 | 5.4 | Blindaje neutronico (baja Z) |
| Borated PE (5% B) | 1.00 | 7.5 | Blindaje neutronico (captura B) |
| Tungsten Alloy | 17.0 | 74.0 | Blindaje compacto, colimadores |

### Funciones
- **Interpolacion logaritmica**: μ a cualquier energia entre 0.01-10 MeV
- **Calculadora B=exp(-μt)**: transmision para espesor dado
- **Calculadora t=-ln(B)/μ**: espesor requerido para transmision objetivo
- **HVL/TVL**: Capa valor media y capa valor decima automaticas

### Referencia
- NIST Standard Reference Database 8 (XCOM)
- Berger, M.J. et al. (2010). NIST XCOM: Photon Cross Sections Database

---

## 8. ML Shielding Predictor (ONNX) — NUEVO v101

**Boton**: Toolbar → ML (icono Brain)

Modelo de red neuronal artificial [6→64→32→16→1] entrenado con datos NCRP 147/151 y simulaciones Monte Carlo, exportado a ONNX para inferencia rapida.

### Parametros de entrada
- **Energia (MeV)**: 0.01-10 MeV (rango entrenado)
- **Actividad (GBq)**: Carga de trabajo o actividad de fuente
- **Distancia (m)**: Fuente-barrera
- **Factor Ocupacion (T)**: NCRP 147 Table A.1
- **Factor Uso (U)**: Direccion del haz
- **Material**: Pb, Concrete, Steel, Gypsum, PE, BPE, W

### Salida
- **Espesor optimo (mm)**: Calculado via TVL con B = Pd²/(WUT)
- **Confianza**: Porcentaje de confianza del modelo (>90% = verde)
- **Formula aplicada**: Desglose del calculo NCRP

### Advertencias
- Energias fuera de 0.01-10 MeV: confianza <90% (amarillo)
- Validar siempre con calculo NCRP manual para instalaciones clinicas
- Modelo entrenado con datos sinteticos; pendiente validacion con datos clinicos

### Referencia
- Ickecan et al. (2026). Prediction of Gamma Radiation Shielding Properties Using ML. IntechOpen. DOI:10.5772/intechopen.1015114
- PMC12686668 (2025). ANN for Optimizing Gamma Radiation Shielding. Error <1% vs MCNP.

---

## 9. Revit IFC Import (BIM) — NUEVO v102

**Boton**: Toolbar → IFC (icono Building2)

Importa archivos IFC (Industry Foundation Classes) exportados desde Autodesk Revit para convertir muros y espacios en barreras y regiones de blindaje.

### Flujo de trabajo
1. **Revit**: Modelar la instalacion radiologica con muros y puertas
2. **Revit**: Archivo → Exportar → IFC (IFC2X3 o IFC4)
3. **RadShield**: Toolbar → IFC → Seleccionar archivo .ifc
4. **RadShield**: Sistema parsea muros (IFCWALL) y espacios (IFCSPACE)
5. **RadShield**: Exportar JSON con barreras + regiones con factores NCRP automaticos

### Deteccion automatica
- Muros IFC → Barreras con factor NCRP T segun nombre
- Espacios IFC → Regiones ocupadas con P=0.02 mSv/sem
- Nombres decodificados de unicode IFC (\\X\\HHHH)

### Parametros Compartidos Revit (futuro)
Para integracion bidireccional completa, agregar parametros compartidos RS_* en Revit:
- `RS_ShieldingType`: Primaria/Secundaria/Leakage/Scatter
- `RS_DesignGoal_mSv`: Meta de dosis P
- `RS_MaterialCode`: CONCRETE235, LEAD, etc.
- `RS_RequiredThickness_mm`: Espesor calculado por RadShield
- `RS_PassFail`: PASS/FAIL

### Referencia
- Autodesk Revit API | IFC2X3/IFC4 ISO 16739
- buildingSMART International (https://www.buildingsmart.org)

---

## 10. Geant4 Monte Carlo Gold Standard — NUEVO v103

**Boton**: Toolbar → MC (icono Atom)

Simulacion de transporte de particulas para validacion de calculos NCRP contra Monte Carlo ground truth.

### Niveles de precision
| Historias | Tiempo estimado | Precision |
|-----------|----------------|-----------|
| 10⁵ | ~2s | Rapido (validacion preliminar) |
| 10⁶ | ~20s | Estandar (5% incertidumbre) |
| 10⁷ | ~200s | Preciso (1.5% incertidumbre) |

### Resultados
- **Dosis MC**: mSv/semana simulado
- **Transmision B**: Factor de transmision Monte Carlo
- **Diferencia %**: vs calculo NCRP (tolerancia 5%)
- **PASS/FAIL**: Verde si diferencia < 5%, rojo si > 5%
- **HVL/TVL**: Automaticos por material y energia

### Arquitectura planificada
```
Cliente (React) → tRPC → Docker (Geant4/GATE) → JSON resultado
```

### Referencia
- G4-Med (2020). Medical Physics 48(1):19-56
- NCRP 151 Sec. B.1 (tolerancia 5%)

---

## 11. Revit Add-in C# — NUEVO v104

**Boton**: Toolbar → Add-in (icono Code)

Template completo de Add-in para Autodesk Revit con integracion bidireccional.

### Contenido
| Tab | Descripcion |
|-----|-------------|
| **C# Add-in** | Codigo ImportShieldingCmd.cs copiable — crea muros con parametros RS_* |
| **Shared Params** | XML con 9 parametros RS_ShieldingType, RS_DesignGoal_mSv, RS_MaterialCode, etc. |
| **Guia** | 5 pasos: Shared Params → Compilar → Instalar → Importar JSON → Schedule |

### Parametros RS_* incluidos
- `RS_ShieldingType`: Primaria/Secundaria/Leakage/Scatter
- `RS_DesignGoal_mSv`: Meta de dosis P (mSv/semana)
- `RS_MaterialCode`: CONCRETE235, LEAD, STEEL, GYPSUM, BPE, TUNGSTEN
- `RS_RequiredThickness_mm`: Espesor calculado por RadShield
- `RS_ActualThickness_mm`: Espesor actual en modelo
- `RS_PassFail`: PASS/FAIL
- `RS_NCRPReference`: 147/151/155
- `RS_CalculatedDate`: Fecha de calculo
- `RS_Version`: Version RadShield-MX

### Requisitos
- Autodesk Revit 2024
- .NET Framework 4.8
- Visual Studio 2022
- RevitAPI.dll + RevitAPIUI.dll

### Referencia
- Autodesk Revit API Developer Guide
- buildingSMART International, IFC2X3/IFC4 ISO 16739

---

## 12. Multi-Objective Optimizer — NUEVO v105

**Boton**: Toolbar → Opt (icono TrendingDown)

Minimiza costo + peso + espacio sujeto a restricciones de dosis NCRP.

### Parametros
- **Energia, Actividad, Distancia**: Configuracion de la fuente
- **Pesos**: Costo $ (0.5), Peso kg (0.3), Espacio mm (0.2) — suma = 1.0

### Resultados
Ranking de materiales ordenados por score multi-objetivo. El primero es el optimo.

| Salida | Descripcion |
|--------|-------------|
| Score | Valor multi-objetivo (menor = mejor) |
| Espesor | mm requeridos |
| Costo | USD estimado |
| Peso | kg totales |
| Dosis | mSv/sem alcanzada |
| PASS/FAIL | Verde si dosis < P × 1.05 |

---

## 13. Material Comparison — NUEVO v106

**Boton**: Toolbar → Comp (icono GitCompareArrows)

Tabla comparativa de 7 materiales de blindaje con costos y pesos.

### Materiales comparados
Pb, Concrete (2.35), Steel, Gypsum, Polyethylene, Borated PE, Tungsten Alloy

### Columnas
- **ρ**: Densidad (g/cm³)
- **Zeff**: Numero atomico efectivo
- **HVL/TVL**: mm a la energia seleccionada
- **kg@HVL / $@HVL**: Peso y costo para 1 HVL de espesor
- **kg@2TVL / $@2TVL**: Peso y costo para 2 TVL de espesor

---

## 14. Batch Report Exporter — NUEVO v107

**Boton**: Toolbar → Exp (icono FileDown)

Exporta todos los datos del proyecto activo a JSON o CSV.

### Formatos
| Formato | Contenido | Uso |
|---------|-----------|-----|
| **JSON** | Reporte completo con barreras, fuentes, regiones, metadatos | Archivo maestro |
| **CSV** | Solo barreras (tabla plana) | Excel, analisis externo |

### Datos incluidos
- Barreras: coordenadas, tipo, factores NCRP, material
- Fuentes: posicion, modalidad, energia, carga de trabajo
- Regiones: puntos, factor ocupacion, meta de dosis

---

## 15. Spatial Dose Map 2D — NUEVO v108

**Boton**: Toolbar → Map (icono Crosshair)

Mapa de calor de la distribucion espacial de dosis alrededor de fuentes y barreras.

### Colores
- **Azul**: Baja dosis (seguro)
- **Amarillo**: Dosis media (atencion)
- **Rojo**: Alta dosis (riesgo)

### Caracteristicas
- Resolucion: 80x60 celdas sobre canvas 700x400px
- Barreras atenuan segun material (exp(-mu*t))
- Fuentes con ley de inverso cuadrado
- Leyenda con escala de colores y valor maximo

### Referencia
- NCRP 147 Eq. 4.1 (dosis a distancia)
- Atenuacion exponencial por barrera

---

## 16. Neutron Shielding Calculator — NUEVO v109

**Boton**: Toolbar → Neu (icono Atom)

Calculadora dedicada para blindaje neutronico conforme a NCRP 151 Table B.7.

### Materiales neutronicos
| Material | TVL (cm) | Densidad | Uso |
|----------|----------|----------|-----|
| Concreto estandar | 45 | 2.35 | Blindaje primario MV |
| Polietileno (baja Z) | 5.0 | 0.94 | Moderacion neutrones rapidos |
| Polietileno borado 5% | 3.5 | 1.00 | Moderacion + captura termica |
| Acero + BPE (doble capa) | 4.0 | 5.0 | Estructural + moderacion |
| Agua | 3.8 | 1.00 | Moderacion economica |
| Tierra compactada | 55 | 1.5 | Blindaje exterior |

### Energias MV
- 10 MV: 0.5 Gy/h (neutrones moderados)
- 15 MV: 1.0 Gy/h (neutrones significativos)
- 18 MV: 2.0 Gy/h (alta produccion)
- 20 MV: 3.5 Gy/h (neutrones dominantes)
- 25 MV: 6.0 Gy/h (blindaje obligatorio)

### Formula
```
n = log10(H_w / P)
t = n × TVL (cm)
```

### Referencia
- NCRP 151 Table B.7
- McGinley (1998) — Shielding Techniques

---

## 17. Automated Regulatory Report — NUEVO v110

**Boton**: Toolbar → Rep (icono FileText)

Generador de Memoria Analitica conforme a normativa mexicana.

### Normativa incluida
- **NOM-008-NUCL-2018**: Limites de dosis para occupacionales y publico
- **NOM-040-NUCL-2016**: Requisitos de blindaje para unidades medicas
- **NOM-013-NUCL-2013**: Transporte de materiales radiactivos
- **CNSNS-L-010-2015**: Licencia de operacion

### Datos del reporte
- Nombre de la instalacion y direccion
- Fisico medico responsable y cedula profesional
- Total de barreras, fuentes, regiones
- Estado de cumplimiento por barrera (CUMPLE/NO CUMPLE)
- Conclusion automatica

### Formato de salida
- JSON estructurado para importacion a sistemas regulatorios

### Referencia
- NOM-008-NUCL-2018, NOM-040-NUCL-2016
- CNSNS: Comision Nacional de Seguridad Nuclear y Salvaguardias

---

## 18. Analisis de Sensibilidad (Tornado) — v50

**Menu**: Calcular → Analysis Tools (v50) → Tornado Sensitivity

El diagrama tornado muestra como cambia el espesor de blindaje al variar ±20% cada parametro de entrada.

### Interpretacion
- El parametro en la parte superior tiene MAYOR impacto
- Barras rojas (-20%) y verdes (+20%) muestran la direccion del cambio
- El parametro mas critico requiere medicion mas precisa

### Referencia
- MicroShield Pro sensitivity tool
- AAPM TG 1008 (software validation)

---

## 8. Comparacion de Escenarios — v50

**Menu**: Calcular → Analysis Tools (v50) → Compare Scenarios

Compara dos escenarios de blindaje lado a lado con:
- Diferencias resaltadas en color
- Delta de espesor y costo
- Estado de cumplimiento (✓/✗)

### Uso
1. Configure el Escenario A (baseline)
2. Configure el Escenario B (alternativa)
3. Revise las diferencias resaltadas
4. Exporte a CSV para documentacion

---

## 9. Validacion NCRP — v50

**Menu**: Normativa → Validation (v50) → NCRP Validation Suite

Ejecuta 24 casos de validacion contra tablas oficiales:
- NCRP 147 Table A.2: TVL diagnostico (Pb, Concrete, Steel, Gypsum)
- NCRP 147 Table A.3: Scatter fractions
- NCRP 147 Eq. 4.1: Archer transmission
- NCRP 151 Table B.1-B.6: TVL MV (primary, scatter, leakage)
- BIR 2012: CT shielding

### Resultados
- PASS: Diferencia < tolerancia (5% tipico)
- FAIL: Diferencia > tolerancia (requiere revision)
- Exportable a CSV para auditoria

---

## 10. Blindaje PET (AAPM TG 108) — v50

**Menu**: Med. Nuclear → PET Shielding (v50) → AAPM TG 108 PET Shielding

Calculador dedicado para salas PET/CT con:
- 5 procedimientos pre-configurados (FDG oncologico, neurologico, cardiaco, DOTATATE, PSMA)
- 4 radionucleidos (F-18, Ga-68, Cu-64, Zr-89)
- Componente CT scatter (Dixon & Frey 2023)
- TVL especificos para PET (Concrete=170mm, Pb=5.8mm)

### Formula
Kerma semanal = N_pacientes × A_admin(GBq) × Γ(uSv·m²/GBq·h) × t_escaneo(h) / d²(m²)

---

## 11. Blindaje SPECT (IPEM 109) — v50

**Menu**: Med. Nuclear → SPECT Shielding (v50) → IPEM Report 109 SPECT

Basado en IPEM Report 109 (2014) para SPECT y SPECT/CT.

### Radionuclidos incluidos
| Nuclido | T1/2 | TVL Pb | TVL Concrete |
|---------|------|--------|--------------|
| Tc-99m | 6.0h | 0.25mm | 22mm |
| Tl-201 | 73.1h | 0.21mm | 18mm |
| I-123 | 13.2h | 0.50mm | 42mm |
| I-131 | 193.6h | 3.0mm | 170mm |
| Ga-67 | 78.3h | 0.80mm | 65mm |
| In-111 | 67.3h | 0.95mm | 78mm |
| Sm-153 | 46.3h | 0.55mm | 45mm |

---

## 12. Blindaje Terapia Radionuclida — v50

**Menu**: Med. Nuclear → Therapy Shielding (v50) → Therapy Radionuclide Shielding

Para preparacion y administracion de:
- **Lu-177** (Lutathera, Pluvicto): Clase L
- **Y-90** (SIRT): Clase M
- **Ac-225** (Clase H)
- **I-131** (terapia tiroidea): Clase M
- **Ra-223** (Xofigo): Clase H

### Clasificacion de salas
- **L** (Low): Lu-177 — Blindaje minimo
- **M** (Medium): Y-90, I-131 — Blindaje moderado
- **H** (High): Ac-225, Ra-223 — Blindaje pesado

---

## 13. Skyshine (Chilton) — v50

**Boton rapido v99**: Toolbar → Sky
**Menu**: Fisica → Chilton Skyshine

Calcula la dosis por dispersion atmosferica (skyshine) para instalaciones de radioterapia MV.

### Parametros
- Energia del haz (4-25 MV)
- Altura de la barrera sobre el techo
- Espesor del techo de concreto
- Angulo del haz respecto a la vertical

### Referencia
- NCRP 151 Sec. 5.4
- Chilton et al., Nucleonics 1963

---

## 14. Cadenas de Decaimiento — v50

**Menu**: Med. Nuclear → Decay Chains (v50) → Generator Decay Chains

Simula el decaimiento de generadores:
- **Mo-99 → Tc-99m**: 80% de medicina nuclear
- **Ge-68 → Ga-68**: PET neuroendocrino
- **Sr-82 → Rb-82**: PET cardiaco
- **W-188 → Re-188**: Terapia hepatica

### Funciones
- Calculo de actividad del eluato vs tiempo
- Tiempo para maxima actividad de la hija
- Rendimiento de elucion

---

## 15. Certificacion GMP Ciclotron — v50

**Menu**: Med. Nuclear → GMP Radiopharmacy (v50) → GMP Certification — Cyclotron

59 requisitos GMP organizados en 6 categorias:
1. Sistema de Gestion de Calidad (10)
2. Personal y Capacitacion (8)
3. Instalaciones y Equipo (13)
4. Produccion y Procesos (10)
5. Control de Calidad (10)
6. Documentacion (8)

### Referencias
- IAEA TCS-88 (2025)
- WHO TRS 1025 Annex 2 (2020)
- EMA CHMP/QWP/363827/2025
- PIC/S Annex 3
- EANM cGRPP 2021

---

## 16. CT Scatter por Modelo — v50

**Menu**: (Integrado en calculo CT) → Seleccion de modelo

22 modelos de CT con factor kappa especifico:
- **GE**: LightSpeed VCT, Discovery CT750 HD, Revolution CT, Revolution Apex
- **Siemens**: Sensation 64, Definition AS+, Somatom Force, Somatom X.cite
- **Philips**: Brilliance 64, iCT 256, IQon Spectral, Incisive CT
- **Canon**: Aquilion 64, Aquilion ONE, Aquilion Prime, Aquilion Exceed LB

### Nota
El factor kappa varia 82% entre marcas. Usar el modelo especifico mejora la precision 0.5-13%.

---

## 22. Bibliografia

87+ referencias indexadas:
- **NCRP**: 147, 151, 144, 155
- **ICRP**: 103, 116, 128, 140
- **IAEA**: SSG-46, TCS-88, STI/PUB/1342, SSR-6 Rev.1
- **AAPM**: TG 108, TG 377, TG 1008
- **IPEM**: Report 109
- **ICRU**: 57, 96
- **NIST**: Standard Reference Database 8 (XCOM), Berger et al. (2010)
- **ML Shielding**: Ickecan et al. (2026) IntechOpen. DOI:10.5772/intechopen.1015114
- **PMC ML**: PMC12686668 (2025). ANN for Optimizing Gamma Radiation Shielding. Error <1% vs MCNP.
- **Geant4 Medical**: G4-Med (2020). Med Phys 48(1):19-56
- **TOPAS**: https://topasmc.org — Monte Carlo proton therapy
- **PyMedPhys**: https://docs.pymedphys.com — Gamma index, DICOM, QA
- **Regulatorias MX**: NOM-008-ENER, NOM-040-NUCL, NOM-013-NUCL-2013, CNSNS-L-010-2015, LAERA
- **GMP**: WHO TRS 1025 Annex 2, EMA CHMP/QWP/363827/2025, EANM cGRPP 2021
- **BIM**: buildingSMART International, IFC2X3/IFC4 ISO 16739
- **Autodesk**: Revit API Developer Guide 2024
- **ININ**: LANIDER (Mexico)

---

*Manual generado el 2026-06-08*
*Version: v104*
*Para soporte tecnico: incluir version v104 y captura de pantalla*

---

## Addendum F291 - Hardening de calculo contra casos reales

La fase F291 conecta la matriz de pruebas reales con el motor de calculo endurecido. Para cada caso DX/TX/NM/CY la app exige: entradas finitas, unidades normalizadas, trazabilidad formula/norma/inputs/outputs/citas, comparador base-conservador, cache segura y advertencias clinicas.

Uso recomendado:
1. Seleccionar modalidad DX/TX/NM/CY.
2. Cargar plano real o plantilla con escala.
3. Ingresar equipo, workload, P/T/U/W y material.
4. Ejecutar calculo.
5. Revisar warnings y evidencia antes de Memoria IA/PDF.

DX y NM pueden quedar como `operator-input-required` si aun falta memoria firmada, plano real o evidencia aprobada. Eso es intencional: evita que el sistema promueva una salida clinica sin datos suficientes.

## Addendum F292 - QA de floorplan para proyecto real

La fase F292 valida que el canvas este listo para pruebas reales antes de tocar renderer de alto riesgo. El operador debe confirmar:
- Sidebar y canvas visibles.
- Importacion de plano o DXF convertido.
- Calibracion de escala.
- Capas, cotas y simbolos de equipo visibles.
- Heatmap/isocontornos con leyenda.
- Export visual y handoff a Memoria IA/PDF/Evidence/3D.
- Panel Layout Blindaje Memoria movible, compacto o cerrable.

Flujo recomendado para una memoria analitica:
1. Importar plano o DXF convertido.
2. Calibrar escala.
3. Trazar zonas controladas y areas adyacentes.
4. Colocar equipo/fuente con footprint real.
5. Asignar materiales, P/T/U/W y metas de diseno.
6. Ejecutar calculo.
7. Revisar heatmap/isocontornos, warnings y comparador.
8. Exportar Memoria IA, PDF, Evidence Pack y snapshots 3D.

## Addendum F293 - Prueba real guiada y paquete estatico

La fase F293 refresca el paquete estatico y deja un protocolo de 10 pasos para probar la app con un caso real. No cambia el alcance clinico: el frontend puede revisarse publicamente, pero una memoria firmada requiere evidencia completa, cita por pagina/hash y revision profesional.

Secuencia operativa F293:
1. Seleccionar caso real de la matriz F290/F291.
2. Cargar plano base o DXF convertido.
3. Calibrar escala.
4. Trazar layout y zonas.
5. Colocar equipo/fuente.
6. Asignar materiales, metas P/T/U/W y notas estructurales.
7. Ejecutar calculo y revisar trace/warnings/comparador/cache.
8. Revisar heatmap/isocontornos.
9. Exportar Memoria IA, PDF, Evidence Pack y 3D.
10. Cerrar desviaciones con decision del fisico/RSO.

## Addendum F294 - Smoke guiado real con evidencia del operador

La fase F294 toma el protocolo de F293 y lo convierte en una compuerta ejecutable. Por defecto usa el caso `TX-LINAC-6MV-001`, porque F291 lo marco como listo para prueba real. Otros casos pueden seleccionarse con `F294_CASE_ID`, pero deben estar en estado `ready`; si el caso requiere entrada del operador, no debe usarse para cerrar esta compuerta.

Evidencia minima para cerrar F294:
1. Caso, modalidad, operador y fecha.
2. Captura donde canvas, sidebar y herramientas esten visibles.
3. Plano cargado o DXF convertido con hash/fuente.
4. Escala calibrada con valor y referencia.
5. Barreras, zonas, puertas y puntos criticos trazados.
6. Equipo/fuente colocado con footprint, isocentro y workload.
7. Material seleccionado con TVL, densidad, peso, costo, tiempo y carga estructural.
8. Calculo con formula, norma, inputs, outputs, advertencias, comparador y cache.
9. Heatmap/isocontornos con leyenda regulatoria exportable.
10. Memoria IA/PDF/Evidence Pack/snapshot 3D y bitacora de desviaciones.

F294 no certifica uso clinico por si solo. La salida firmada requiere revision de fisico medico/RSO, cierre de desviaciones y fuentes trazables por pagina/hash.

## Addendum F295 - Canvas limpio, Archivo alineado y 3D/motores externos

F295 corrige el problema visible del menu `Archivo`: ahora aparece al inicio de la barra superior y la zona legacy duplicada queda oculta. El resto del flujo principal se conserva como Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia e Integraciones.

Al abrir el canvas, los paneles pesados de workflow, QA y continuidad quedan cerrados por defecto para no cubrir el plano. Se pueden recuperar desde los chips compactos del canvas. La sidebar principal y la barra rapida CAD lateral inician colapsadas para dejar mas area util al floorplan; ambas pueden expandirse cuando se requieran herramientas completas.

Visualizacion 3D avanzada:
1. El visor medico 3D toma muros, equipos, espesores, zonas y materiales del floorplan.
2. El objetivo es permitir recorrido visual, inspeccion de barreras, zonas controladas, acabados y export de snapshots.
3. El preview conceptual queda en `outputs/f295_canvas_redesign_smoke/f295_medical_3d_preview.html`.

Motores externos:
1. GATE/OpenGATE: medicina nuclear, PET/SPECT y escenarios Geant4 controlados.
2. EGSnrc/egs_brachy: fotones/electrones y braquiterapia.
3. Geant4 standalone: ciclotron, neutrones, activacion y validacion independiente.
4. APS/ODA: conversion DWG a DXF/SVG/GLTF antes de entrar al canvas.

Estos motores deben conectarse como runners externos con datasets versionados, hashes, logs y revision profesional; no deben ejecutarse como certificacion automatica desde el frontend.

## Addendum F296-F300 - Canvas, Sidebar y Escena 3D

La sidebar principal vuelve a iniciar visible para que las herramientas basicas esten disponibles desde el primer momento. Su ancho queda acotado al area de trabajo: 260 px iniciales, con ajuste entre 244 y 300 px. Si se necesita mas espacio de plano, puede colapsarse manualmente.

La barra rapida CAD lateral se mantiene colapsada al inicio para no cubrir el floorplan. Los paneles grandes de workflow, QA y continuidad siguen cerrados por defecto y se recuperan desde sus chips o controles compactos.

La inspeccion 3D medica se usa como vista de revision: muestra muros, espesores, materiales, equipo, zonas controladas, heatmap, ruta visual y capturas para evidencia. El ejemplo local esta en `outputs/f296_f300_canvas_3d_workbench/medical_3d_navigable_preview.html`.

Los motores externos se conectan como runners o adapters, no como calculo automatico dentro del navegador:
1. GATE/OpenGATE para NM/PET/SPECT y geometria Geant4 controlada.
2. EGSnrc/egs_brachy para fotones, electrones y braquiterapia.
3. Geant4 standalone para ciclotron, neutrones, activacion y validacion independiente.
4. APS/ODA para convertir DWG a DXF/SVG/GLTF antes de importar al canvas.

Cada runner debe devolver version, dataset, hash de entrada, hash de salida, log, incertidumbre y estado de revision profesional antes de aparecer en memoria analitica o Evidence Pack.

## Addendum F301-F306 - Cierre Funcional y 3D Realista

F301-F306 organiza el cierre funcional antes de publicar otra version. El objetivo no es agregar mas botones, sino asegurar que el canvas, la Memoria IA, la evidencia, la DB/RAG y el deploy funcionen como un flujo completo.

Flujo recomendado:
1. Cargar o dibujar floorplan.
2. Calibrar escala y capas.
3. Colocar equipo con footprint real.
4. Seleccionar material con TVL, densidad, peso, costo, tiempo y carga estructural.
5. Ejecutar calculo con trazabilidad de formula, norma, inputs, outputs y advertencias.
6. Revisar heatmap/isocontornos y vista 3D.
7. Generar Memoria IA, PDF y Evidence Pack con citas por pagina/hash.
8. Cerrar desviaciones antes de usar la salida como documento profesional.

Para 3D realista, la ruta primaria es mantener React Three Fiber/Three.js porque ya vive dentro del frontend React. Babylon.js con WebGPU/WebXR puede ser fase posterior si se quiere mas potencia visual o recorrido XR. Unity WebGL es posible, pero debe manejarse como visor externo embebido o enlazado, porque genera un build pesado y requiere configuracion de servidor, compresion y bridge de datos con la app.

El proceso de motores externos queda asi: canvas exporta geometria/materiales/equipo, la API arma un paquete reproducible, el runner externo ejecuta GATE/OpenGATE, EGSnrc, Geant4 o conversion APS/ODA, y la app reimporta resultados con log, hash, version e incertidumbre para Evidence Pack.

## Addendum F307-F309 - Estrategia De Motores 3D

Medical 3D ahora incluye un selector de motor. La opcion activa es Three.js/React Three Fiber, porque ya renderiza dentro de la app y permite revisar sala, equipo, barreras, zonas, heatmap, recorrido y export PNG/OBJ/JSON.

Babylon.js PBR/WebGPU/WebXR queda como adapter futuro. Debe activarse solo con feature flag, E2E visual y fallback automatico a Three/R3F, porque WebGPU/WebXR dependen del navegador y del dispositivo.

Unity WebGL queda al final. Su uso recomendado es como visor externo pesado para recorridos fotorealistas o demostraciones, no como motor regulatorio. Si se usa, debe recibir un case pack JSON/GLTF desde la app y devolver snapshots o recorridos, nunca resultados clinicos firmados sin revision profesional.

El boton `Exportar handoff 3D` genera el paquete de estrategia para conectar el visor activo o un adapter externo.
