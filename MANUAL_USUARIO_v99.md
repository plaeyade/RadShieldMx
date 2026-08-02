# Addendum F73 - Estabilizacion, DB, RAG, canvas y 3D

## Addendum F499 - Seed dry-run regulatorio/materiales

F499 toma la DB regulatoria/materiales versionada de F491-F498 y genera archivos de seed revisables sin escribir en DB live.

Comandos:

```text
npm run prepare:f499:regulatory-materials-seed
npm run test:f499:regulatory-materials-seed
```

Artefactos:

```text
outputs/f499_regulatory_materials_seed_dry_run/
  f499_regulatory_sources.jsonl
  f499_material_constants.jsonl
  f499_material_value_versions.jsonl
  f499_material_source_links.jsonl
  f499_regulatory_sources.csv
  f499_material_constants.csv
  f499_material_value_versions.csv
  f499_material_source_links.csv
  f499_seed_dry_run.sql
  f499_seed_manifest.json
  f499_seed_dry_run.md
```

Regla de seguridad: F499 es dry-run. Si se intenta activar `F499_SEED_LIVE=1`, el script aborta. La escritura real queda para F500, despues de revisar duplicados, confirmar restore probe y aprobar fuentes comerciales/laboratorio por pagina/hash.

## Addendum F491-F498 - DB regulatoria/materiales versionada

F491-F498 consolida la base tecnica que debe alimentar Material Toolbox, Memoria IA, Evidence Pack, PDF, Medical 3D y calculo. El objetivo es que TVL, HVL, densidad, peso, costo, carga estructural, fuente, pagina y hash salgan de un registro controlado, no de constantes dispersas.

Flujo de uso:

1. Registrar fuente en `regulatory_sources`: NCRP, IAEA, UAQ, proveedor, laboratorio o memoria previa.
2. Registrar material en `material_constants`: nombre, categoria, densidad, estado y fabricante si aplica.
3. Registrar cada valor en `material_value_versions`: TVL/HVL/densidad/costo/espesor por energia, unidad, fuente, page_ref, hash y estado.
4. Ligar material-fuente en `material_source_links` con uso permitido: calculo, reporte/evidencia, visual o estructura/costo.
5. Ejecutar seed dry-run y revisar duplicados antes de escribir DB live.
6. Ejecutar readback y F484-F490 despues del seed.

Reglas:

- `approved-reference` puede alimentar calculo preliminar y reportes.
- `review-required` puede alimentar anexos, comparadores y evidencia, pero no constantes finales.
- `candidate` sirve para revision tecnica, nunca para memoria firmable.
- `blocked` no debe usarse hasta corregir fuente, valor, unidad o hash.

Ruta DB recomendada:

```text
regulatory_sources
material_constants
material_value_versions
material_source_links
document_chunks
```

Antes de activar live se requiere `DATABASE_URL`, restore probe, `document_chunks` con fuente/pagina/hash, seed dry-run aprobado y revision profesional de materiales comerciales o de laboratorio.

## Addendum F484-F490 - Motor calculo QA NCRP/IAEA/UAQ

F484-F490 agrega una compuerta de QA numerico para el motor de calculo antes de seguir cargando assets pesados o publicar otra version visual. La idea es sencilla: primero comprobar que el motor responde de forma estable en casos pequenos y trazables; despues se agregan texturas, HDRI, Unity WebGL o modelos pesados como capa visual.

Casos incluidos:

1. LINAC 6 MV, barrera primaria, TVL NCRP151.
2. LINAC 15 MV, secundaria con revision neutronica.
3. CT/RX diagnostico, plomo equivalente NCRP147.
4. Gamma Knife / Co-60, revision IAEA-SRS47 y memorias UAQ.
5. PET/NM 511 keV, screening TG-108.
6. Ciclotron 18 MeV, concreto alta densidad y contribucion neutronica.

Comandos de validacion:

```text
npm run prepare:f484-f490:normative-qa
npm run test:f484-f490:normative-qa
npm run test:f484-f490:normative-qa:unit
```

Ruta para meter assets pesados reales:

```text
public/medical3d/photoreal/
  hdri/clinical_softbox.hdr
  textures/<material>/albedo.webp
  textures/<material>/normal.webp
  textures/<material>/roughness.webp
  textures/<material>/ao.webp
  decals/radiation-warning.webp
  decals/controlled-area.webp

public/unity/radshield-medical-3d/
  index.html
  Build/*.loader.js
  Build/*.framework.js
  Build/*.data
  Build/*.wasm
  TemplateData/
```

Cuando meterlos: despues de que F484-F490 pase y antes de un deploy visual nuevo. Como meterlos: copiarlos en esas rutas, activar solo carga lazy/gated desde Medical 3D, correr QA visual, build y smoke post-deploy. Regla de seguridad: un asset pesado mejora inspeccion, comunicacion y evidencia visual; no cambia calculos, TVL, densidad, costos, cargas estructurales ni citas normativas.

## Addendum F479-F483 - Fotorrealismo avanzado

F479-F483 mejora Medical 3D para inspeccion visual y presentacion con texturas, HDRI, decals y presets.

Uso:

1. Abra **Medical 3D**.
2. Active **Recorrido WASD** y despues **Preset recorrido fotoreal WASD**.
3. Revise el panel **F479-F483 fotorrealismo avanzado**.
4. Confirme el plan de texturas PBR, HDRI local y decals.
5. Use los decals visibles para explicar acceso controlado, rol de barrera, zonas y footprint de equipo.
6. Exporte **F479-F483** para anexar el contrato visual al Evidence Pack o Memoria IA.

Assets opcionales:

```text
public/medical3d/photoreal/
  hdri/clinical_softbox.hdr
  textures/<material>/albedo.webp
  textures/<material>/normal.webp
  textures/<material>/roughness.webp
  decals/radiation-warning.webp
```

Regla de uso: el fotorrealismo ayuda a revisar, comunicar y documentar. No cambia TVL, densidad, costo, carga estructural, espesores ni citas normativas.

## Addendum F475-F478 - Unity WebGL real con carpeta exportada

F475-F478 prepara la app para abrir un visor Unity WebGL real cuando exista una carpeta exportada desde Unity.

Estructura requerida:

```text
public/unity/radshield-medical-3d/
  index.html
  Build/
    *.loader.js
    *.framework.js
    *.data
    *.wasm
  TemplateData/
```

Uso recomendado:

1. Compile/exporte el proyecto Unity como **WebGL**.
2. Copie el contenido exportado dentro de `public/unity/radshield-medical-3d`.
3. Para build local, configure `VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true`.
4. Para build publicado, configure `VITE_MEDICAL_3D_UNITY_WEBGL_URL=https://.../index.html`.
5. Abra **Medical 3D** y revise **F475-F478 Unity WebGL real**.
6. Use **Unity case** para exportar el paquete JSON que Unity debe consumir.
7. Use **Abrir/preview** solo cuando el gate indique URL o build local disponible.

Regla de uso: Unity es recorrido visual/fotorealista. No calcula, no modifica espesores firmables y no reemplaza Evidence Pack, Memoria IA ni revision profesional. Si la carpeta real no existe, la app queda en gate pendiente sin romper Three/R3F.

## Addendum F470-F474 - Babylon profundo interactivo

F470-F474 agrega una segunda vista Babylon dentro de **Medical 3D** para inspeccion visual avanzada.

Uso recomendado:

1. Abra **Medical 3D** desde el canvas.
2. Localice la tarjeta **F456-F458 Babylon parity** dentro del panel de motor 3D.
3. Use **Iso**, **Planta** o **Frente** para cambiar la camara de inspeccion.
4. Haga clic sobre muros, bandas, zonas, equipos o la guia de haz para ver el HUD **F471 HUD seleccion**.
5. Revise **F473 overlays activos** para confirmar que estan presentes roles de barrera, zonas controladas, footprints de equipos y guia de haz.
6. Use **Export PNG Babylon** para anexar una captura visual a Evidence Pack o Memoria IA.

Regla de uso: Babylon profundo es una herramienta visual de inspeccion. No reemplaza el calculo trazable, no firma espesores y no sustituye la revision del fisico medico/RSO. Three/R3F continua como visor productivo principal y fallback.

## Addendum F469 - Beta visual publicable

F469 empaqueta la beta visual como frontend estatico publicable.

Uso:

1. Ejecute `npm run build`.
2. Ejecute `npm run prepare:f469:visual-beta-publication`.
3. Revise `outputs/f469_visual_beta_publication_close/README_F469_VISUAL_BETA_PUBLICABLE.md`.
4. Suba el contenido de `dist/` o el ZIP `radshield-mx-f469-visual-beta-publicable.zip` a Vercel, Netlify o servidor estatico.
5. Despues de publicar, use `f469_post_deploy_checklist.csv` contra la URL publica.

Alcance permitido: demo/beta visual estatica con canvas, Medical 3D, evidencia visual, Babylon parity card, Unity handoff y DB PBR visual. Alcance bloqueado: calculo clinico certificado, DB regulatoria completa, Unity WebGL real embebido, Babylon profundo como renderer principal y memoria analitica firmable.

Backlog inmediato post-beta: Babylon profundo, Unity WebGL real, fotorrealismo avanzado, QA numerico NCRP/IAEA/UAQ y DB regulatoria/materiales versionada.

## Addendum F464-F468 - RC visual beta 3D

F464-F468 cierra la beta visual de Medical 3D antes de publicar otra version estatica.

Flujo recomendado:

1. Abra **Medical 3D Floor Plan** desde el canvas o acceso 3D.
2. Active **Preset recorrido fotoreal WASD** para encender recorrido, fotorrealismo y guia WASD.
3. Revise **F464-F468 RC visual beta**. El panel resume estado de Three/R3F, Babylon, WASD, PBR y Unity handoff.
4. Revise **F465 materiales vinculados** para ver barrera, material PBR, densidad, espesor y carga kg/m2. Esta vista es visual/estructural preliminar; TVL/cita/hash tecnico siguen en Material Toolbox/RAG/calculo.
5. Revise **F466 sync canvas/3D** para confirmar que cada barrera/equipo/zona tenga target auditable entre plano y escena.
6. Revise **F467 Memoria IA visual** para saber que secciones se exportaran como evidencia: resumen visual BIM/3D, anexo de materiales, sincronizacion plano-3D, capturas y gate beta.
7. Use **Export F464-F468 beta** para generar JSON de cierre visual con escena, hash, capturas, DB PBR, Babylon, Unity y targets de reporte.

Regla de uso: F464-F468 permite publicar una beta visual estable. No convierte PBR, Babylon o Unity en calculo clinico certificado; los espesores firmables deben salir del motor trazable con NCRP/IAEA/UAQ, citas, entradas, salidas y revision profesional.

## Addendum F459-F463 - Unity, fotorealismo, materiales PBR y recorrido

F459-F463 agrupa las salidas visuales avanzadas de Medical 3D.

Uso recomendado:

1. Abra **Medical 3D**.
2. Revise **F459-F463 visual stack** para confirmar Unity/Babylon/fotoreal/PBR/WASD.
3. Use **Unity JSON** para exportar el paquete que un build Unity WebGL externo puede consumir.
4. Active **Preset recorrido fotoreal WASD** para inspeccion navegable.
5. Revise la galeria **F462 materiales PBR** para concreto alta densidad, plomo, acero, vidrio plomado, polimero borado y TM/NIPOLL.
6. Use **Actualizar DB** para incorporar el registro TM/NIPOLL HD y persistir la base en el navegador.
7. Use **Export DB** para obtener el JSON de materiales visuales.

Limites:

- Unity WebGL necesita una URL real en `VITE_MEDICAL_3D_UNITY_WEBGL_URL`. Sin esa URL, RadShield entrega handoff JSON pero no abre un build Unity.
- La DB PBR es visual/evidencia; no reemplaza TVL, densidad firmable, citas OCR/RAG ni calculo regulatorio.
- El modo fotoreal sirve para inspeccion y comunicacion. La memoria firmable sigue usando calculos trazables, normas, citas y revision profesional.

## Addendum F456-F458 - Babylon paridad, rendimiento y export

F456-F458 convierte la prueba Babylon en una superficie util de revision visual. Babylon ahora lee la escena medica real y muestra muros/barreras, equipos, zonas y roles con materiales PBR ligeros.

Como usarlo:

1. Abra **Medical 3D**.
2. Revise la tarjeta **F456-F458 Babylon parity**.
3. Confirme que el estado sea `ready`.
4. Lea el gate de rendimiento: FPS, primer frame y meshes.
5. Use **Export PNG Babylon** para capturar una imagen visual para Evidence Pack o revision interna.

Interpretacion de la vista:

- Las barreras provienen de `MedicalScene`, no de un ejemplo fijo.
- Las bandas superiores indican rol de barrera: primaria, secundaria, laberinto, puerta u otro.
- Las zonas se renderizan como overlays translucidos para revisar control/ocupacion.
- Los equipos se muestran como footprints y volumen medico proxy hasta integrar modelos GLB reales.

Limite operativo: la captura Babylon es evidencia visual. El calculo firmable, citas, espesores y PDF regulatorio siguen dependiendo del motor de calculo, Memoria IA y Evidence Pack. Three/R3F sigue siendo fallback obligatorio.

## Addendum F455 - Babylon runtime smoke visual

F455 agrega una prueba visual real de Babylon dentro de **Medical 3D**. No reemplaza el motor principal: Three/R3F sigue siendo la escena productiva, y Babylon aparece como una tarjeta de smoke aislada para validar que el runtime local carga correctamente.

Como revisarlo:

1. Abra la app y entre al workspace.
2. Use el acceso **3D** o el dialogo **Medical 3D**.
3. En el panel lateral, revise la tarjeta **F455 Babylon runtime**.
4. El estado debe pasar a `ready` cuando el canvas Babylon cargue.
5. La vista muestra un corte de bunker con concreto PBR, barreras, equipo medico, guia de haz y zona controlada.

Interpretacion:

- Si aparece `ready`, Babylon esta instalado y el smoke visual funciona.
- Si aparece `loading`, espere unos segundos; el runtime se carga bajo demanda.
- Si aparece `failed`, Three/R3F sigue funcionando y debe revisarse la instalacion local de `@babylonjs/core`, `@babylonjs/loaders`, `@babylonjs/materials` y `@babylonjs/gui`.

Uso recomendado: utilizar Babylon para pruebas visuales post-beta, escenas PBR mas robustas, posible WebGPU/WebXR y recorridos futuros. No usarlo todavia para calculo, firma normativa ni reemplazo del export de evidencia hasta completar QA de paridad.

## Addendum F454 - Cierre beta y motores pesados post-beta

F454 cierra la beta actual sin activar dependencias pesadas dentro del flujo principal. La regla es simple: la app debe seguir abriendo rapido, con canvas/sidebar/menus estables, y los motores pesados entran solo cuando pasen su smoke dedicado.

Estado operativo:

1. **Three/R3F:** sigue como visor 3D principal integrado. Es el fallback obligatorio para Medical 3D, recorridos, capturas, evidencia y revision visual.
2. **Babylon real:** se habilita post-beta cuando `@babylonjs/core` y `@babylonjs/loaders` esten instalados localmente en este repo, no solo globalmente en Windows. Debe cargar por import dinamico, con flag, fallback a Three/R3F y smoke visual.
3. **Unity WebGL avanzado:** se usa como visor externo pesado. Requiere build Unity publicado, URL `VITE_MEDICAL_3D_UNITY_WEBGL_URL`, handoff JSON/GLTF y prueba visual. Unity no calcula blindaje ni sustituye citas, PDF o Memoria IA.
4. **Fotorrealismo pesado:** se activa despues con assets PBR, GLB/texturas, lazy loading, presupuesto de bundle y rollback.

Como validar dependencias:

1. Ejecute `npm run prepare:f454:post-beta-engines`.
2. Revise `outputs/f454_post_beta_heavy_engines/f454_local_dependency_probe.json`.
3. Si Babylon aparece faltante, instale en la carpeta del repo: `npm install @babylonjs/core @babylonjs/loaders`.
4. Si Unity aparece faltante, configure un build externo y `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.
5. No publique Babylon/Unity como productivos hasta correr sus pruebas post-beta.

Decision: F454 deja cerrado el release beta estable y prepara F455-F458 para Babylon local, Babylon PBR, Unity WebGL externo y fotorrealismo pesado.

## Addendum F449-F453 - Tablero BIM grafico para Memoria IA

F449-F453 agrega una vista BIM dentro del canvas para explicar y revisar el blindaje como un modelo clinico-constructivo, no solo como lineas de plano.

Que muestra:

1. **Project Manager:** lista conceptual de plano, equipos, muros, MEP y evidencia.
2. **Corte del bunker:** compara la sala visible con la estructura real de blindaje.
3. **Roles de muros:** primaria, secundaria, laberinto, puerta, penetraciones y carga estructural.
4. **Propiedades:** cada rol se conecta con formula, norma, seccion de memoria y evidencia.
5. **Evidencia normativa:** NCRP, IAEA, AAPM/UAQ, fuente de material y fabricante.
6. **Flujo a memoria:** plano -> equipo -> barreras -> calculo -> citas -> PDF.

Uso practico para disenar una memoria analitica:

1. Cargue o dibuje el plano base.
2. Coloque el equipo/fuente: LINAC, Gamma Knife, ciclotron, PET/CT, braquiterapia u otra modalidad.
3. Clasifique barreras: primaria, secundaria, laberinto, puerta y penetraciones MEP.
4. Revise el tablero BIM: confirme que cada superficie tenga rol, calculo esperado, norma y evidencia.
5. Ejecute calculo y revise advertencias: TVL sin fuente, material sin densidad validada, penetracion sin continuidad o carga estructural pendiente.
6. Abra Memoria IA/Evidence Pack para generar el texto tecnico, anexos, capturas y citas.

Interpretacion visual:

- Rojo: barrera primaria y direccion del haz.
- Ambar: laberinto o trayectoria indirecta.
- Azul/cian: ductos, sleeves, penetraciones y continuidad MEP.
- Morado/indigo: evidencia, citas y estado de memoria.
- Verde: trazas listas para memoria o QA.

La vista BIM no reemplaza la revision del fisico medico/RSO ni certifica por si sola el blindaje. Sirve como tablero de coordinacion para que el plano, calculo, materiales, citas y reporte hablen el mismo idioma.

## Addendum F446-F448 - QA fuerte del canvas antes de release

F446-F448 no agrega una herramienta nueva; agrega una compuerta para confirmar que el canvas sigue usable despues de los overlays y mejoras CAD/BIM.

1. **F446 - Superficies criticas:** revisa sidebar, canvas principal, dock CAD y overlay renderer v2.
2. **F447 - Interacciones reales:** valida boton derecho, accesos rapidos, ventanas controlables y seleccion legacy.
3. **F448 - Gates de regresion:** bloquea release si desaparece el canvas, si el overlay roba eventos, si una ventana no puede cerrarse/minimizarse o si no corre el E2E dedicado.

Uso practico:

1. Abra el canvas en modo **CAD Guia**.
2. Confirme que se ve la tarjeta **F446-F448 Canvas QA**.
3. Pruebe el dock inferior: Plano, Muro, Fuente, Zona, Calc, 3D y Evid.
4. Haga clic derecho sobre el canvas y use acciones como **Dibujar barrera**, **Medir / cota** o **Calcular blindaje**.
5. Si una ventana tapa el plano, use minimizar/cerrar antes de continuar.

Regla: si el canvas, la sidebar o el dock desaparecen, no se publica beta. Primero se repite el E2E F446-F448 y se apagan overlays auxiliares si hace falta.

## Addendum F442-F445 - Runtime visual renderer v2

F442-F445 convierte el geometry core de F439-F441 en una capa visual dibujada sobre el canvas.

1. **F442 - Instrucciones de render:** cada barrera, zona, equipo, penetracion u overlay se transforma en una instruccion de dibujo con capa, estilo, orden visual, evidencia y advertencias.
2. **F443 - Passes por capa:** las instrucciones se ordenan para dibujar barreras, fuentes, zonas, penetraciones y evidencia sin mezclar responsabilidades.
3. **F444 - Overlay runtime:** el sistema monta un canvas overlay no interactivo. Este overlay puede verse en modo guia/estructura o bajo flag, pero no reemplaza el canvas estable.
4. **F445 - Rollback:** si el overlay oculta informacion o afecta la operacion, se apaga el overlay/flag y se conserva el renderer base.

Uso practico:

1. Cambie a modo **CAD Guia**, **Estruct** o active staging con `VITE_CANVAS_HIGH_RISK_CAD=true`.
2. Revise la tarjeta **F442-F445 Renderer v2 runtime**.
3. Confirme instrucciones, passes, gates y rollback.
4. Si necesita trabajar sin ayudas visuales, use **CAD Limpio** para despejar overlays auxiliares.

Importante: F442-F445 no cambia calculos, seleccion, grips, snapping, boton derecho ni guardado del proyecto. Es una capa visual para preparar el renderer profundo v2 con menor riesgo.

## Addendum F439-F441 - Geometry core observable para renderer profundo

F439-F441 agrega una capa tecnica visible para preparar el renderer profundo sin romper la operacion diaria del canvas.

1. **F439 - Entidades normalizadas:** el sistema toma el plano activo y convierte barreras, equipos/fuentes, zonas, penetraciones y estado de evidencia en entidades con ID, tipo, capa, puntos, bounds, material, espesor, modalidad, evidencias y advertencias.
2. **F440 - Plan de overlays:** esas entidades se agrupan en capas visuales: barreras por rol, equipos, zonas/ocupacion, penetraciones MEP y estado Evidence/Memoria. Cada capa declara su salida esperada para Memoria IA, PDF o Evidence Pack.
3. **F441 - Preflight:** antes de activar cualquier renderer profundo se revisa que existan entidades, overlays, puente F436-F438, flag controlado y eventos legacy intactos.

Uso practico:

1. Abra el canvas y trabaje normalmente con plano, muros, fuentes y zonas.
2. En el panel BIM revise la tarjeta **F439-F441 Geometry core**.
3. Use los conteos para detectar si el plano realmente tiene barreras, fuentes, zonas o penetraciones reconocidas.
4. Si el preflight marca el flag apagado, significa que el core ya se puede inspeccionar, pero todavia no reemplaza el renderer estable.

Regla de seguridad: F439-F441 no cambia seleccion, boton derecho, grips, snapping ni eventos. Si se activa un renderer experimental en staging, debe conservarse rollback inmediato hacia `CanvasArea/useCanvas`.

## Addendum F436-F438 - Bridge seguro hacia renderer v2

F436-F438 prepara el renderer profundo sin sustituir todavia el canvas estable.

1. **F436 - Baseline visual:** genera capturas desktop y mobile/tablet. Deben verse canvas, sidebar, ribbon BIM y paneles F426-F435 en escritorio; en mobile debe conservarse canvas y toolbar.
2. **F437 - Link PDF/Evidence:** conecta tabla de roles, anexo de penetraciones, carga estructural y baseline visual con Memoria IA, PDF Report y Evidence Pack.
3. **F438 - Geometry core:** normaliza barreras, fuentes, zonas, penetraciones y overlays para que un renderer v2 pueda consumir datos sin leer directamente componentes React.

Politica de seguridad:

- `VITE_CANVAS_HIGH_RISK_CAD` controla el inicio del renderer geometry core.
- `VITE_CANVAS_EVENT_CONTROLLER_V2` permanece apagado en esta fase.
- Si falla canvas, sidebar o seleccion, apagar flags y volver a `CanvasArea/useCanvas`.
- No mezclar renderer v2 y reescritura de eventos en la misma fase.

## Addendum F431-F435 - Gate de release del renderer profundo

F431-F435 no agrega botones nuevos al operador: agrega verificacion para asegurar que lo implementado en F426-F430 se pueda usar sin romper canvas, sidebar, ribbon BIM ni export visual.

1. **F431 - Smoke visual:** confirma que el panel F426-F430, los roles, penalizaciones, carga estructural, QA normativo, flujo de Memoria IA y plan del renderer son visibles.
2. **F432 - Manifest Evidence/Memoria:** lista que debe viajar a Evidence Pack y Memoria IA: tabla de roles, anexo de penetraciones, anexo estructural, ledger QA y export visual BIM.
3. **F433 - Bloqueos de release:** clasifica pendientes como informativos, advertencias o bloqueantes. Si faltan escala, fuente, barreras, penetraciones o fixtures QA, la memoria se mantiene preliminar.
4. **F434 - Decision renderer base v2:** si hay bloqueos, solo se mantienen contratos. Si F229 y F431 pasan, el renderer v2 puede entrar despues bajo flag y con rollback.
5. **F435 - Handoff:** prepara F436 baseline visual, F437 conexion PDF/Evidence y F438 geometry core del renderer.

Regla practica: si el canvas o sidebar desaparecen, no se debe tocar el renderer base. Primero repetir F229 y F431. El renderer profundo debe avanzar por capas, con captura visual y rollback, no como reescritura completa de eventos.

## Addendum F426-F430 - Calculo, renderer profundo y Memoria IA desde canvas

F426-F430 cierra el puente entre el plano editable, el motor de calculo, la inspeccion visual BIM y la Memoria IA.

1. **F426 - Calculo por rol de superficie:** cada barrera se interpreta como primaria, secundaria, laberinto, puerta o penetracion. El panel BIM muestra cuantos elementos existen por rol, la familia de formula, norma aplicable y overlay visual esperado.
2. **F427 - Penalizacion por penetraciones:** ductos, sleeves, huecos, puertas y cruces MEP generan penalizacion o bloqueo QA. Un hueco sin mitigacion no debe pasar a memoria firmable aunque el muro base cumpla.
3. **F428 - Carga estructural:** el sistema estima kg/m2 y kPa por espesor/material/equipo. Esto sirve para revisar impacto estructural, costo y tiempo de obra antes de decidir plomo, concreto, bloque HD, TM Nipoll, Contuplex u otro material.
4. **F429 - QA normativo:** quedan definidos casos conocidos por modalidad: LINAC 6 MV, LINAC 15/18 MV con neutrones, CT/RX NCRP 147, Gamma Knife/Co-60, PET/NM TG-108 e instalaciones de ciclotron 18 MeV.
5. **F430 - Memoria IA automatica:** el flujo esperado es plano -> equipo -> barreras -> calculo -> evidencia -> PDF. Cada resultado debe incluir formula, norma, entradas, salidas, advertencias, cita y hash/pagina.

Uso en canvas:

1. Cargue o trace el plano y calibre la escala.
2. Coloque equipo/fuente con modalidad, energia/actividad/workload e isocentro.
3. Dibuje barreras, zonas y puntos criticos.
4. Asigne o revise roles de superficie en el panel BIM.
5. Revise penalizaciones MEP, carga estructural y bloqueos.
6. Ejecute calculo y genere Memoria IA solo cuando los bloqueos de escala, fuente, barrera, material, penetraciones y QA esten resueltos.

Nota operativa: F426-F430 no sustituye la revision del fisico medico/RSO. El renderer profundo queda preparado para usar geometry core, cutaway 2.5D, MEP real, export visual y QA E2E, pero el cambio de renderer base debe hacerse despues de validar estos contratos.

## Addendum F421-F425 - Exportacion, intake y handoff BIM

F421-F425 prepara la salida y entrada BIM antes de tocar el renderer profundo.

1. **F421 - Export visual BIM:** prepara capturas PNG, anexo PDF, JSON reproducible y Evidence visual pack.
2. **F422 - Intake pipeline:** DXF/SVG/IFC/GLB pueden entrar con validacion; DWG/RFA/RVT requieren proveedor externo o add-in.
3. **F423 - Normalizacion RS_*:** convierte IfcWall/IfcSpace/Equipment/Openings/Specs a barreras, zonas, fuentes, penetraciones, puntos y evidencia.
4. **F424 - Product/Spec Library:** liga equipo, material, puerta, MEP o especificacion con proveedor, documento, version, pagina/hash y campos obligatorios.
5. **F425 - Handoff:** genera contrato para Revit Schedule, IFC PropertySet, Evidence Pack, Memoria IA BIM y QA manifest.

Cuándo tocar renderer profundo:

- Despues de F425.
- Motivo: el renderer debe pintar geometria real y campos ya normalizados. Si se cambia antes, puede verse mejor pero no garantiza calculo, evidencia, export ni handoff.
- La siguiente etapa ideal es F426-F430: renderer/base geometry + calculo por rol + penalizacion por penetraciones + export BIM visual comprobable.

## Addendum F416-F420 - Secuencia BIM del canvas

F416-F420 agrega una secuencia operativa para convertir referencias externas y objetos BIM en decisiones de diseno radiologico.

1. **F416 - Proveedores BIM:** MEPcontent, ProdLib, ARCAT y RevitCity se registran con formatos, uso esperado y riesgo QA. RevitCity queda como referencia no canonica.
2. **F417 - Biblioteca visual:** LINAC, Gamma Knife, ciclotron, barrera primaria/secundaria, laberinto, puerta blindada y ducto/penetracion quedan definidos como plantillas del canvas.
3. **F418 - Cutaway 2.5D:** el canvas calcula metricas de espacio visible, huella blindada estimada y relacion visible/real.
4. **F419 - Roles de superficie:** cada barrera debe clasificarse como primaria, secundaria, laberinto o puerta para poder justificar memoria.
5. **F420 - Cruces MEP/blindaje:** ductos, puertas, charolas y objetos MEP sin clasificar generan candidatos de revision antes de exportar.

Uso recomendado:

- Primero importe o dibuje el plano.
- Calibre escala.
- Coloque equipos/fuentes.
- Clasifique barreras por rol.
- Revise cutaway y MEP clash.
- Genere Memoria IA solo cuando cada superficie tenga formula, norma, material, TVL, cita y evidencia.

## Addendum F415 - Coordinacion BIM-MEP para blindaje

F415 usa los frames extraidos de los videos BIM para agregar una metodologia de coordinacion entre proteccion radiologica, arquitectura, estructura y obra/MEP.

Las imagenes agregadas se traducen a una secuencia de diseno:

1. **Visible vs real:** el cuarto clinico es solo la parte visible; el bunker completo incluye el volumen y masa del blindaje.
2. **Cada muro tiene trabajo diferente:** barrera primaria, secundaria, laberinto y puerta se calculan y justifican de forma distinta.
3. **Antes del primer paciente:** definir haz/energia, espesor, ocupacion, fuga/dispersion, MEP/penetraciones y seguridad.
4. **Respaldado por estandares:** IAEA, AAPM, ICRU, NCRP y normativa local deben aparecer con cita/pagina/hash en memoria y Evidence Pack.

En el canvas BIM, revise:

1. **Muros/losas de blindaje:** espesor requerido, densidad/TVL, carga kg/m2 y continuidad.
2. **HVAC/ductos:** cruces de barrera, compensacion de blindaje, sleeves/laberintos y evidencia.
3. **Tuberias/gases/agua:** diametro, material, trayectoria, sello de penetracion y distancia a fuente.
4. **Charolas/cableado:** pasamuros, canalizacion, blindaje local y acceso de mantenimiento.
5. **Penetraciones/puertas:** ubicacion, dimensiones, equivalente de blindaje y revision fisico-medica.

Gates de salida antes de memoria firmable:

- Registro de penetraciones en Evidence Pack.
- Clash MEP/blindaje.
- Carga estructural de materiales HD y equipos.
- Acceso de mantenimiento sin rutas directas de fuga radiologica.

## Addendum F414 - Referencia visual BIM / videos

F414 agrega una capa de referencia para que el canvas conserve una logica tipo AutoCAD Plant 3D/Revit sin perder las acciones reales de RadShield-MX.

Al usar el canvas BIM:

1. Revise el **ribbon disciplinar** para entrar por Proyecto, Modelo, Equipos, Blindaje, Anotar, Verificar, Reportar y Evidencia.
2. Use **Project Manager** para ubicar planos, modelos, equipos, barreras, zonas, reportes y fuentes de evidencia.
3. Use **Propiedades/Capas** para confirmar visibilidad, bloqueo, color, opacidad, material, TVL, carga estructural y estado de revision.
4. Use el **viewport anotado** para revisar etiquetas, flechas, leyenda, zonas, heatmap/isocontornos y capturas exportables.
5. Use **View cube / navegacion** para alternar planta, ajuste, pan, zoom y recorrido medico 3D.
6. Lea la **linea de comando** para ver herramienta activa, accion reciente, advertencias de escala, DXF, memoria y evidencia.

Nota: los videos enviados quedan como referencia operativa. La ruta WinGet de `ffmpeg.exe` fue localizada, pero el sandbox de Codex no puede ejecutar/copiar ese binario desde el paquete. Para generar frames reales, ejecute desde PowerShell normal:

```powershell
cd C:\Users\carlo\Documents\Codex\2026-07-03\ana\work\recovery-app
.\scripts\extract-f414-bim-video-frames.ps1
```

Los frames quedaran en `outputs\f414_bim_video_reference` para revision visual y ajuste posterior del canvas.

## Addendum F413 - BIM Execution Plan

F413 agrega una secuencia BIM de trabajo para usar RadShield-MX con disciplina similar a Revit/Plant 3D:

1. **Acquire:** recibir plano DXF/IFC/PDF, registrar fuente, escala, revision y hash.
2. **Normalize:** revisar unidades, ejes, niveles, origen y escala.
3. **Classify:** clasificar muros, zonas, fuentes/equipos, penetraciones, puntos criticos y capas.
4. **Bind RS_*:** asignar parametros compartidos RadShield a cada entidad.
5. **Calculate:** ejecutar calculo trazable con geometria, fuente, material, P/T/U/W, TVL y citas.
6. **Coordinate:** revisar carga estructural, interferencias, penetraciones, obra, costos y tiempos.
7. **Publish:** generar memoria, PDF, anexos, snapshots, JSON reproducible y Evidence Pack.

Worksets recomendados:

- **Arquitectura:** muros, puertas, espacios, capas y dimensiones.
- **Proteccion radiologica:** fuentes, barreras, puntos criticos, zonas y resultados.
- **Estructura/obra:** materiales, peso, carga superficial, costos y tiempos.
- **Evidencia:** normas, PDFs, hashes, paginas, memoria y decisiones.

Nuevos parametros RS_*:

- `RS_BimEntityId`: identificador persistente de entidad.
- `RS_ControlledZone`: zona publica/controlada/no ocupada.
- `RS_StructuralLoad_kg_m2`: carga superficial estimada por material.
- `RS_CalculationHash`: hash reproducible de entradas de calculo.
- `RS_RevisionStatus`: Draft, RSO Review o Approved.

## Addendum F412 - Metodologia BIM en RadShield-MX

F412 define como se debe usar BIM dentro del producto.

Entidades principales:

- **Barreras / IfcWall:** cada muro de blindaje debe tener tipo radiologico, material, espesor requerido, resultado pass/fail y evidencia.
- **Zonas / IfcSpace:** cada sala, area publica, zona controlada o colindancia debe tener ocupacion, meta de diseno y relacion con puntos criticos.
- **Fuentes / RadShieldSource:** cada equipo o fuente debe conservar modalidad, energia, workload, termino fuente, fabricante y cita.
- **Puntos criticos / RadShieldControlPoint:** cada punto debe conservar posicion, meta P, ocupacion T, resultado y advertencias.
- **Capas / IfcPresentationLayerAssignment:** cada disciplina debe conservar visibilidad, bloqueo, color, opacidad y funcion operativa.

Parametros compartidos para Revit/Add-in:

- `RS_ShieldingType`: primaria, secundaria, fuga, nuclear u otra clasificacion.
- `RS_DesignGoal_mSv`: meta de diseno usada en memoria.
- `RS_MaterialCode`: material normalizado para calculo.
- `RS_RequiredThickness`: espesor requerido calculado.
- `RS_PassFail`: cumplimiento preliminar o final.
- `RS_EvidencePackId`: evidencia que sustenta el resultado.
- `RS_SourceTrace`: origen del objeto BIM/importacion/fuente.

Flujo BIM recomendado:

1. Importar DXF/IFC o usar plano base calibrado.
2. Clasificar muros, espacios, equipos y puntos criticos.
3. Asignar materiales versionados con TVL/HVL, densidad, peso, costo y hash documental.
4. Ejecutar calculo y revisar advertencias.
5. Exportar memoria, PDF, Evidence Pack y snapshot visual.
6. Para roundtrip Revit, usar parametros RS_* en un Add-in o export JSON/IFC controlado.

Limites actuales:

- IFC/DXF tienen ruta operativa parcial/funcional.
- RVT nativo requiere Revit API, Add-in o Autodesk Platform Services.
- DWG nativo requiere conversion externa APS/ODA a DXF/SVG/IFC.
- BIM multiusuario serio requiere DB/API versionada con permisos, restore, revisiones y control de cambios.

## Addendum F411 - Canvas tipo BIM / Revit

F411 agrega una capa de trabajo tipo BIM al canvas para que el plano se lea como una estacion CAD/BIM y no como un lienzo aislado.

Como usarlo:

1. En el canvas, active **Guia** desde el boton superior si esta en modo limpio.
2. Use el ribbon **BIM Studio** para entrar al flujo: **Proyecto**, **Modelo**, **Equipos**, **Blindaje**, **Anotar**, **Verificar**, **Reportar** y **Evidencia**.
3. Use **Project Manager** para revisar si el proyecto ya tiene plano base, modelo, equipos, barreras, zonas, puntos criticos, reportes y evidencia.
4. Use **Details** para verificar escala, seleccion, capas visibles y readiness BIM.
5. Use **Layers** para revisar visibilidad, bloqueo, color y opacidad por disciplina.
6. Use la navegacion lateral para acercar, alejar, ajustar, pan, vista planta o inspeccion 3D.
7. Use la linea **Command** para confirmar la ultima accion real enviada al canvas.

Logica operativa:

- **Proyecto** importa o actualiza el plano base.
- **Modelo** abre la inspeccion 3D medica si esta conectada.
- **Equipos** activa colocacion de fuente/equipo.
- **Blindaje** activa dibujo de barrera.
- **Anotar** activa medicion/cotas.
- **Verificar** ejecuta calculo de blindaje.
- **Reportar** exporta snapshot visual.
- **Evidencia** abre el Evidence Pack.

Que falta para metodologia BIM completa:

- IDs persistentes por objeto y categorias tipo IFC/Revit.
- Geometria 2D/3D normalizada con unidades, escala, niveles y elevaciones.
- Materiales versionados con densidad, TVL/HVL, peso, costo, tiempo, proveedor, pagina y hash.
- Relaciones trazables entre equipo, termino fuente, barrera, punto critico, formula, cita, memoria y Evidence Pack.
- Importadores auditados: DXF/SVG hoy; DWG/IFC/Revit mediante proveedor externo con hash, validacion de capas y confirmacion de escala.
- DB/API multiusuario para permisos, revisiones, restore y versionado.

## Addendum F410 - QA funcional de salidas F409

F410 verifica que las salidas F409 aparezcan en la app real.

Superficies probadas:

1. **Memoria IA:** debe mostrar la tarjeta **F409 salidas reales F405-F408** con conteo de listas, revision, bloqueadas y estado 3D.
2. **Evidence Pack:** debe mostrar la tarjeta **F409 salidas reales** y el boton **Exportar F409 JSON**.
3. **Medical 3D:** debe mostrar el bloque **F409 / F408 salida 3D** con muros, equipos, zonas y advertencias.

Uso manual:

1. Active controles E2E si requiere prueba directa: `localStorage.radshield-e2e-controls = "true"`.
2. Abra **Memoria**, **Evidence** y **3D** desde los controles inferiores de QA.
3. Confirme que las tres tarjetas F409/F408 sean visibles.
4. En Evidence Pack, exporte el JSON F409 si necesita anexarlo a evidencia de QA.

Uso automatizado:

1. `npm run prepare:f410:output-surface-qa`
2. `npm run test:f410:output-surface-qa`
3. `npm run test:f410:output-surface-qa:e2e`

La prueba E2E genera:

- `outputs/f410_output_surface_qa/f410_output_surface_qa.json`
- `outputs/f410_output_surface_qa/f410_output_surface_qa.md`
- capturas PNG de Memoria IA, Evidence Pack y Medical 3D.

## Addendum F409 - Salidas reales F405-F408

F409 es la compuerta que revisa si los avances de calculo, heatmap y 3D ya aparecen en superficies reales de trabajo.

Que integra:

1. **F405 calculo trazable:** formula, norma, entradas, salidas, advertencias, citas, unidades, comparador y cache por barrera.
2. **F407 heatmap reportable:** puntos/lineas de muestreo, leyenda regulatoria, umbrales y evidencia minima.
3. **F408 salida 3D:** escena en metros para Three/R3F, Unity externo, OBJ/glTF y paquetes de revision visual.

Donde se usa:

1. **Memoria IA:** revise la seccion **7.13 INTEGRACION F409** antes de exportar una memoria. Si aparece `review` o `blocked`, use la salida solo como borrador.
2. **Evidence Pack:** abra la tarjeta **F409 salidas reales**. Desde ahi puede exportar `f409_output_surface_*.json`.
3. **Medical 3D:** revise el bloque **F409 / F408 salida 3D** para verificar muros, equipos, zonas y advertencias antes de usar el recorrido como evidencia visual.
4. **Update Center:** confirme que F409 aparece como `integrated`.

Lectura de estado:

- `ready`: la superficie esta lista para QA/export controlado.
- `review`: hay datos utiles, pero faltan advertencias, citas, puntos, trazas o geometria antes de firmar.
- `blocked`: no debe usarse en una memoria firmable.

Validacion:

1. `npm run prepare:f409:output-surfaces`
2. `npm run test:f409:output-surfaces`
3. `npm run build`

## Addendum F405-F408 - Calculo trazable, Canvas QA, Heatmap y Unity

F405-F408 cierra una compuerta tecnica previa a nuevas mejoras de alto riesgo del renderer.

1. **Calculo trazable F405:** cada barrera calculada debe conservar formula, norma, entradas, salidas, supuestos, advertencias clinicas, citas, unidades normalizadas, comparador base/conservador y cache. Si falta alguno, la Memoria IA puede usarlo como borrador, pero no como salida firmable.
2. **Canvas QA F406:** las herramientas minimas del canvas son Seleccionar, Muro, Fuente, Zona, Medir, Pan, Plano, Heat, Iso, Estructura, dock CAD, canvas principal y boton derecho. Cada boton debe conservar `title`/`aria-label` y accion real.
3. **Heatmap reportable F407:** el mapa de calor solo se considera exportable cuando existen escala, lineas de muestreo a 0.3 m, resultados de barrera, leyenda regulatoria F212 y snapshot visual.
4. **Unity/3D F408:** el handoff 3D usa metros, eje Y arriba y mapea el plano 2D a X/Z. Unity, Three o glTF pueden mejorar materiales, recorrido y acabados, pero no deben modificar geometria, espesores ni resultados sin generar nuevo hash.

Comandos de validacion:

1. `npm run prepare:f405-f408:calc-canvas-unity`
2. `npm run test:f405-f408:calc-canvas-unity`
3. `npm run test:f405-f408:unit`

## Addendum F404 - Menu Archivo funcional

F404 valida el menu **Archivo** desde la interfaz real.

Flujo operativo:

1. Abra **Archivo** en la barra superior.
2. Use **Nuevo Proyecto** para reiniciar el workspace actual.
3. Use **Abrir Proyecto** para abrir el administrador local/cloud.
4. Use **Importar CSV**, **Importar DXF** o **Importar STEP/IGES** para traer datos externos al flujo de plano/blindaje.
5. Use **Exportar CSV** o **Exportar Reporte CNSNS** para salidas estructuradas.
6. Use **Especificaciones Tecnicas**, **Audit Trail** y **Analisis de Logs** para revision tecnica y trazabilidad.
7. Use **Glosario** y **Acerca de** para ayuda y version.

Notas:

- **Especificaciones Tecnicas** ya no es una pantalla vacia; ahora muestra ficha tecnica real F404.
- **Compartir resultados** depende de Web Share API del navegador.
- **Exportar PDF** puede ejecutar descarga directa en lugar de abrir un dialog visible.
- **Guardar** requiere revisar persistencia local/DB segun modo de ejecucion.

QA:

1. `npm run prepare:f404:file-menu-functional`
2. `npm run test:f404:file-menu-functional`
3. `npm run test:f404:file-menu-functional:e2e`

## Addendum F399-F403 - QA visual y beta controlada

F399-F403 cierra la pasada de ventanas amplias antes de seguir con renderer/canvas.

Uso operativo:

1. Abra Evidence Pack, Manual, Memoria Analitica, Layout Bunker, Dashboard, Checklist CNSNS o NCRP 151 Tables.
2. Use el encabezado superior comun para **cerrar**, **minimizar contenido** o alternar **vista contenida/fullscreen**.
3. En Evidence Pack, Manual, Memoria y Layout Bunker, las cabeceras internas quedan para busqueda, filtros, exportacion o seleccion; ya no deben mostrar un segundo boton de cierre.
4. Compare Scenarios, Tutorial y Version History usan ventana movible `DialogShell`: se pueden arrastrar, minimizar, expandir/restaurar y cerrar.
5. Para QA, active `localStorage.radshield-e2e-controls=true`; apareceran botones compactos de apertura que permiten probar las superficies sin depender de menus.

Validacion:

1. `npm run build`
2. `npm run prepare:f399-f403:window-beta`
3. `npm run test:f399-f403:window-beta`
4. `npm run test:f399-f403:e2e`

Resultado esperado: 7 fullscreen controladas, 3 DialogShell controladas, 4 pantallas complejas sin cierre duplicado y manifiesto beta en `outputs/f399_f403_window_beta_audit/`.

## Addendum F392-F398 - Fullscreen controlado

F392-F398 conserva los workflows amplios, pero centraliza sus controles.

Pantallas cubiertas:

1. **Evidence Pack:** revision de fuentes y ledger de citas.
2. **Manual de Usuario:** lector extenso con indice y busqueda.
3. **Memoria Analitica:** wizard documental con export TXT/PDF.
4. **Layout Bunker:** dimensiones, layout detallado y factibilidad de zona controlada.
5. **Dashboard:** KPIs ejecutivos.
6. **Checklist CNSNS:** validacion regulatoria.
7. **NCRP 151 Tables:** consulta de tablas amplias.

Controles comunes:

1. **Cerrar:** sale de la pantalla.
2. **Minimizar contenido:** deja visible solo el encabezado.
3. **Vista contenida/fullscreen:** permite revisar el workflow como panel contenido o pantalla completa.

Nota operativa: Dashboard, Checklist y NCRP 151 Tables ya usan solo el encabezado nuevo. Evidence Pack, Manual, Memoria Analitica y Layout Bunker mantienen controles internos mientras se valida visualmente que no se rompan exports, formularios y wizards.

QA recomendado:

1. `npm run prepare:f392-f398:fullscreen-shell`
2. `npm run test:f392-f398:fullscreen-shell`

## Addendum F389-F391 - Ventanas movibles restantes

F389-F391 cierra la migracion de ventanas que debian convivir con el canvas.

Estado final F378:

1. **15 superficies clasificadas:** completo.
2. **7 fullscreen conservadas:** siguen fullscreen por politica funcional o documental.
3. **6 candidatas a ventana:** completo, 6/6 migradas a `DialogShell`.
4. **Nuevas migradas:** Compare Scenarios, Tutorial y Version History.

Uso:

1. Abra **Compare Scenarios** para contrastar dos escenarios de blindaje. Puede mover, minimizar o expandir la ventana y exportar CSV.
2. Abra **Tutorial** para seguir el paso a paso mientras practica sobre el floorplan.
3. Abra **Version History** para revisar versiones y restaurar una version previa sin monopolizar toda la pantalla.

QA recomendado:

1. `npm run prepare:f389-f391:dialogshell-migration`
2. `npm run test:f389-f391:dialogshell-migration`

## Addendum F387-F388 - Renderer base v2 y fotorrealismo avanzado

F387-F388 avanza el canvas y la inspeccion 3D sin cambiar la logica de eventos.

Estado de ventanas F378:

1. **15 superficies clasificadas:** completado por auditoria F378.
2. **7 fullscreen conservadas:** completado por politica; permanecen fullscreen Memoria Analitica, Evidence Pack, Manual, Dashboard, Layout Bunker, Checklist CNSNS y NCRP 151 Tables.
3. **6 candidatas a migrar:** 3 ya migradas por F379-F382 y 3 quedan para fases no P0.
4. **Migradas:** Barrier Editor, Air Kerma Overlay y Control Points.
5. **Pendientes no P0:** Compare Scenarios, Tutorial y Version History.

Uso del renderer base v2:

1. Abra el canvas.
2. Revise la fila **F387 Render v2**.
3. Verifique que aparezcan helpers de heatmap y muestras.
4. Use el canvas normalmente; eventos, grips, seleccion, snapping y dibujo siguen en el controlador estable.

Uso de fotorrealismo avanzado:

1. Abra **Medical 3D**.
2. Active **Recorrido WASD** y, si desea inspeccion visual, **Recorrido fotoreal**.
3. Seleccione luz clinica, inspeccion o recorrido.
4. Revise el panel **F388 fotorrealismo avanzado**: muestra calidad, DPR, tone mapping ACES, sombras y preset visual.
5. Exporte PNG/OBJ/JSON como evidencia visual. La imagen no reemplaza calculos, citas, PDF ni revision del fisico medico/RSO.

QA recomendado:

1. `npm run prepare:f387-f388:renderer-photoreal`
2. `npm run test:f387-f388:renderer-photoreal`

## Addendum F385-F386 - Capacidades productivas 3D

F385-F386 agrega una compuerta visible para distinguir capacidades reales del build actual contra integraciones preparadas pero no activas.

Estado operativo:

1. **Three/R3F:** es la ruta productiva activa para inspeccion 3D medica. Renderiza sala/bunker, equipos, espesores, materiales, zonas, recorrido visual y evidencia para Memoria IA/PDF/Evidence Pack.
2. **Babylon:** no esta instalado en el bundle actual. La app conserva el contrato/adapter, pero no debe tratarse como motor productivo hasta instalar `@babylonjs/core` y `@babylonjs/loaders`, activar flag y pasar smoke visual.
3. **Unity WebGL:** esta preparado como visor externo por URL. Para probarlo use `VITE_MEDICAL_3D_UNITY_WEBGL_URL` o `F386_UNITY_WEBGL_URL`; para release estricto use `F386_REQUIRE_UNITY_LIVE=true`.
4. **DWG provider y motores Monte Carlo externos:** siguen gateados por proveedor, credenciales, fixtures, runners y smoke live. No sustituyen el motor deterministico ni la evidencia normativa hasta validacion formal.

Uso recomendado:

1. Abra **Medical 3D / Inspeccion 3D**.
2. Revise el panel **F385-F386 capacidades productivas**.
3. Si Three/R3F aparece activo, puede usarlo para recorrido visual, capturas y evidencia.
4. Si Unity URL esta pendiente, configure la URL externa antes de usarla como evidencia visual.
5. Si Babylon aparece como no instalado, continue con Three/R3F; no fuerce el flujo Babylon en produccion.

QA recomendado:

1. `npm run prepare:f385:production-capability-audit`
2. `npm run prepare:f386:three-unity-smoke`
3. `npm run test:f385-f386:productive-capabilities`

## Addendum F384 - Backlog post-beta

F384 separa lo que ya esta cerrado de lo que sigue gateado.

Cerrado:

1. Las tres ventanas P0 del canvas definidas en F378.
2. `BarrierEditor`, `AirKermaOverlay` y `ControlPointsDialog` ya conviven con el plano mediante `DialogShell`.

No cerrado como producto final:

1. **Babylon runtime activo:** existe adapter/loader, pero falta dependencia activa y smoke visual.
2. **Unity WebGL real externo:** existe handoff/URL gate, pero falta build Unity publicado y prueba visual.
3. **DWG provider live:** existe contrato APS/ODA, pero falta fixture DWG no sensible, credenciales, conversion y auditoria de capas/escala.
4. **GATE/EGSnrc/Geant4 runners:** existen contratos/preflight, pero faltan motores/runners reales, datasets versionados y casos conocidos.
5. **Renderer base v2:** sigue diferido por riesgo; requiere rama/flag, pixel diff y rollback.
6. **Fotorrealismo avanzado:** Three/R3F tiene presets/PBR readiness; Babylon/Unity-grade realism sigue pendiente.

Regla operacional: no anunciar Babylon, Unity real, DWG live ni Monte Carlo clinico como terminados hasta pasar sus smoke live.

## Addendum F383 - QA de integracion de ventanas P0

F383 verifica que las herramientas P0 migradas no solo existan como codigo, sino que sigan conectadas al flujo principal.

Cobertura:

1. Importacion lazy desde `ShieldingDesigner`.
2. Estados de apertura/cierre.
3. Callbacks de toolbar.
4. Ramas render de `BarrierEditor`, `AirKermaOverlay` y `ControlPointsDialog`.
5. Trazabilidad por `data-testid` de cada dialog.

QA recomendado: ejecute `npm run test:f383:p0-integration-qa` despues de modificar toolbar, layout principal o cualquiera de esas tres herramientas.

## Addendum F382 - Cierre de ventanas P0 del canvas

F382 confirma que las tres herramientas espaciales prioritarias ya no bloquean el plano completo.

Herramientas cerradas:

1. **Barrier Editor:** supuestos, materiales y espesores.
2. **Air Kerma Overlay:** curvas de kerma y export visual.
3. **Control Points:** puntos de control y metas de diseno sobre el floorplan.

Regla operacional: estas tres herramientas deben poder convivir con el canvas. Si una tapa el area de trabajo, use arrastrar, minimizar, expandir o cerrar; no debe ser necesario abandonar el plano.

QA recomendado: ejecute `npm run test:f382:p0-dialogshell-closure` antes de publicar un build donde se modifiquen estas ventanas.

## Addendum F381 - Puntos de control

F381 convierte los puntos de control y metas de diseno en una ventana controlable.

Uso:

1. Abra **Control Points & Design Goals** desde el flujo de verificacion o herramientas del canvas.
2. Revise la vista mini del floorplan para ubicar los puntos existentes.
3. Use **Add Control Point** para crear un nuevo punto.
4. Asigne nombre, posicion X/Y, meta de diseno y ocupacion.
5. Use los puntos numerados para revisar su correspondencia visual con el plano.
6. Use **Minimizar** para regresar al canvas sin perder la lista de puntos.

Regla operacional: los puntos de control representan lugares de evaluacion, colindancias o posiciones de interes; deben definirse antes de cerrar memoria analitica o evidencia regulatoria.

## Addendum F380 - Overlay de Air Kerma

F380 convierte el overlay de distribucion de kerma en aire en una ventana controlable.

Uso:

1. Abra **Air Kerma Overlay** desde el flujo de blindaje o herramientas de verificacion.
2. Seleccione la barrera en la lista izquierda.
3. Revise la curva roja de kerma sin blindaje y la curva verde de kerma blindada.
4. Active o desactive **Show Shielded** para comparar visualmente el efecto de la barrera.
5. Revise meta de diseno, maximo kerma, espesor maximo y material.
6. Use **Export PDF** para generar evidencia visual del overlay.
7. Use **Minimizar** si necesita volver al canvas sin cerrar el analisis.

Regla operacional: Air Kerma Overlay debe funcionar como instrumento de revision junto al plano; si tapa el layout, arrastrelo, minimicelo o expandalo segun la tarea.

## Addendum F379 - Editor de barreras

F379 convierte el editor de barreras en una ventana controlable.

Uso:

1. Abra **Barrier Editor** desde la barra de herramientas o flujo de blindaje.
2. Seleccione una barrera en la lista izquierda.
3. Edite supuestos: nombre, tipo, factor de uso, ocupacion, meta de diseno y workload.
4. Edite material y espesores equivalentes.
5. Use **Minimizar** si necesita revisar el canvas sin cerrar el editor.
6. Use **Expandir** cuando necesite revisar la tabla completa.
7. Pulse **Generate Recommendations** para recalcular/recomendar con los datos actuales.

Regla operacional: el editor ya no debe bloquear permanentemente el floorplan; si tapa una zona de dibujo, arrastrelo o minimicelo.

## Addendum F378 - Modales fullscreen legacy

F378 no cambia el comportamiento clinico ni de calculo. Su funcion es ordenar que ventanas antiguas deben seguir a pantalla completa y cuales deben migrarse en fases posteriores.

Reglas:

1. **Se quedan fullscreen:** Memoria Analitica, Evidence Pack, Manual, Dashboard, Layout Bunker, Checklist CNSNS y tablas NCRP extensas.
2. **Deben migrar primero:** Barrier Editor, Air Kerma Overlay y Control Points, porque son herramientas espaciales que deben verse junto al canvas.
3. **Cada migracion futura debe incluir:** cerrar, minimizar, restaurar, etiqueta accesible y prueba smoke.
4. **No se deben migrar todos los dialogs a la vez:** el riesgo de romper flujos de reporte o memoria es alto.

Uso para QA:

1. Ejecute `npm run prepare:f378:legacy-modal-audit`.
2. Revise `outputs/f378_legacy_modal_audit/f378_legacy_modal_audit.md`.
3. Use la lista P0 para planear las siguientes mejoras visuales del canvas.

## Addendum F377 - Paneles laterales

F377 mejora los paneles que aparecen desde la derecha y pueden tapar el plano.

Paneles cubiertos:

1. **Preguntas Frecuentes.**
2. **Extension Warehouse / Plugins.**
3. **RAG Vector Database.**
4. **Memorias de Calculo.**

Uso:

1. Abra el panel desde su menu o boton correspondiente.
2. Use **Minimizar** para dejarlo como pastilla compacta y revisar el canvas.
3. Pulse la pastilla minimizada para restaurar.
4. Use **Cerrar** para retirar el panel por completo.
5. En RAG, el boton de refrescar se conserva en el encabezado del panel.

Regla operacional: minimizar un panel lateral no borra datos, filtros ni documentos cargados; solo despeja el area del floorplan.

## Addendum F376 - Ventanas flotantes sobre el canvas

F376 mejora el trabajo cuando una herramienta queda encima del plano.

Uso general de ventanas:

1. Arrastre la ventana desde el encabezado cuando tape el layout.
2. Pulse **Minimizar** para liberar el canvas sin perder la herramienta.
3. Mientras esta minimizada, puede seguir usando el dock CAD y el plano.
4. Pulse la pastilla minimizada para restaurar la ventana.
5. Use **Expandir** para revisar listas o tablas amplias.
6. Use **Cerrar** para terminar esa herramienta.

Selector de fuentes:

1. Abra **Fuente** desde el dock CAD.
2. Busque o filtre por modalidad: diagnostico, terapia, radiocirugia, medicina nuclear, braquiterapia o ciclotron.
3. Si el selector tapa el plano, minimicelo o arrastrelo.
4. Seleccione la fuente/equipo para que el flujo use su energia, norma y carga de trabajo base.

Regla operacional: minimizar una ventana no cancela la accion; solo despeja el canvas. Cerrar la ventana si termina el paso.

## Addendum F375 - Modo limpio y modo guia del canvas

F375 agrega un control superior del canvas para alternar entre dos modos de trabajo:

1. **CAD Limpio:** recomendado para dibujar, revisar el plano, seleccionar objetos y evitar que paneles auxiliares tapen el layout.
2. **CAD Guia:** recomendado para QA, export visual, revisar escenas, mini vistas y estados tecnicos.

Uso:

1. Abra la app y ubique el boton **Limpio/Guia** en la barra superior del canvas.
2. En **Limpio**, trabaje con el dock CAD principal: **Plano**, **Muro**, **Fuente**, **Zona**, **Calc**, **3D** y **Evid**.
3. Si necesita paneles de apoyo, pulse el boton para cambiar a **Guia**.
4. En **Guia** aparecen los paneles F214 Studio, F215 Scenes, F216 View y F217 Export.
5. Para volver a trabajar sin obstrucciones, pulse de nuevo y regrese a **Limpio**.

Regla operacional: el modo limpio no elimina herramientas; solo oculta overlays auxiliares. Los calculos, seleccion, importacion de plano, 3D, evidencia y menus siguen conectados.

## Addendum F374 - Accesos rapidos y dock CAD operativo

F374 corrige el problema reportado donde los botones de acceso rapido se abrian visualmente pero no ejecutaban una accion clara.

Accesos rapidos de la sidebar:

1. **Calc:** ejecuta el calculo de blindaje del proyecto actual; si el callback no esta disponible, abre el dialogo de calculo.
2. **UAQ:** abre el flujo de atenuacion/blindaje asociado.
3. **Mem:** abre Memoria IA.
4. **Mat:** abre la toolbox de materiales con TVL, densidad, peso, costo, tiempo y carga estructural.
5. **DXF:** abre el visor/importador DXF o fallback DWG externo cuando aplique.

Despues de cada clic la sidebar muestra **Ultima accion**. Si una accion no esta disponible, la app debe mostrar un aviso en lugar de quedarse muda.

Dock CAD del canvas:

1. **Plano:** importar plano base.
2. **Muro:** activar dibujo de barreras.
3. **Fuente:** colocar equipo o fuente radiologica.
4. **Zona:** trazar zona controlada, publica u ocupada.
5. **Calc:** ejecutar calculo con geometria, fuentes, materiales y factores actuales.
6. **3D:** abrir inspeccion medica 3D.
7. **Evid:** abrir Evidence Pack.

El dock CAD no reemplaza el renderer; organiza acciones de uso frecuente sin tapar completamente el layout. La reescritura del renderer/eventos base queda para una fase posterior con pruebas E2E dedicadas.

## Addendum F361 - Reparacion post-beta de operacion visual

F361 corrige los puntos que impedian usar la beta con confianza: botones de acceso rapido sin accion, menu Archivo desfasado, canvas sin boton derecho, ventanas que tapaban el plano y Update Center sin reflejar los cambios recientes.

Uso del canvas con boton derecho:

1. Haga clic derecho sobre el plano o area de trabajo.
2. Seleccione una accion: **Seleccionar/editar**, **Dibujar barrera**, **Colocar fuente/equipo**, **Medir/cota**, **Ajustar vista**, **Exportar PNG**, **Calcular blindaje**, **Abrir evidencia** o **Inspeccion 3D medica**.
3. Si existe un objeto seleccionado, el menu tambien permite **Duplicar seleccionado** o **Borrar seleccionado** con confirmacion.
4. Presione `Esc` o haga clic fuera del menu para cerrarlo.

Uso de ventanas:

1. Arrastre cualquier dialogo desde su encabezado.
2. Use **Minimizar** para liberar visual del canvas sin cerrar la herramienta.
3. Use **Expandir** para revisar tablas o reportes amplios.
4. Use **Cerrar** para terminar la herramienta activa.

Menu Archivo:

1. **Nuevo Proyecto:** reinicia el flujo de trabajo.
2. **Abrir Proyecto:** abre el administrador de proyectos.
3. **Guardar:** conserva el estado local o backend segun configuracion.
4. **Importar CSV (Batch):** carga datos de barreras/equipos.
5. **Importar DXF:** abre visor DXF o ruta DWG externa cuando exista proveedor.
6. **Importar STEP/IGES:** prepara geometria 3D.
7. **Exportar CSV/PDF/CNSNS:** genera salidas tecnicas y regulatorias preliminares.
8. **Especificaciones, Audit Trail y Logs:** sirven para diagnostico, trazabilidad y soporte.

Accesos rapidos:

- **Memoria:** abre Memoria IA con el perfil activo.
- **Evidencia:** abre Evidence Pack.
- **Validar:** abre NCRP Validation.
- **Heatmap:** abre mapa de dosis/isodosis.
- **DB diferida** y **Smoke pendiente:** abren Update Center.
- Si un handler del contenedor principal no esta conectado, F361 usa fallback al registro de dialogs para evitar botones muertos.

Documento Cyclone KIUBE MID 55672 Rev G:

- Si el hash del PDF ya coincide con una fuente previamente registrada, se descarta como duplicado.
- Si el motor tecnico del KIUBE ya existe en `cycloneKIUBEData.ts`, el PDF no reemplaza calculos; se agrega como evidencia documental RAG con hash, paginas y chunks.
- Si no hay texto extraible, el documento queda marcado para OCR o re-subida searchable.

Estado de beta:

- La beta F356-F360 no debe considerarse completa hasta que F361 pase build y contratos.
- Ningun flujo F361 habilita memoria firmada, espesor certificado ni dictamen final sin revision profesional.

## Cobertura F99-F360 - Resumen operativo para usuario

Este manual conserva el esquema previo, pero la cobertura v99-F360 se agrupa por bloques funcionales para evitar repetir cientos de entradas.

1. **F99-F124 Canvas, menus y materiales:** se consolidan herramientas CAD, perfiles DX/TX/NM/CY, Material Comparison, costo/tiempo/peso/carga estructural y menus por flujo real.
2. **F125-F150 calculo, evidencia y release candidate:** cada resultado debe transportar formula, norma, inputs, outputs, citas, advertencias y evidencia; se agregan comparador base/conservador, anexos de materiales, Memoria IA por perfil y QA numerico.
3. **F151-F181 deploy, DB y prepublicacion:** se separan carriles local, estatico y full-stack; MySQL/backup/restore y smoke URL final quedan como gates antes de release productivo.
4. **F182-F230 recuperacion visual y canvas CAD:** se estabilizan sidebar, menu Archivo, paneles movibles, herramientas CAD, inspector contextual, duplicar/borrar, heatmap, cotas, seleccion y harness E2E de canvas.
5. **F231-F260 manuales, staging y deploy estatico:** se actualizan manuales, control de cambios, staging/feature flags, paquetes ZIP y rutas de deploy publico estatico.
6. **F261-F292 RAG/OCR/APIs/memorias reales:** se preparan proveedores DWG, OCR local con Tesseract, deduplicacion por hash, memorias analiticas reales, chunks y trazabilidad por pagina.
7. **F293-F330 rediseño 3D y motores externos:** se mejora inspeccion 3D con Three/R3F, recorrido WASD, PBR, colisiones, handoff Unity externo y Babylon como runtime futuro con fallback.
8. **F331-F360 caso real Centro Neuro y beta:** se prepara prueba con ciclotron, Gamma Knife y LINAC, escala 1:100, cargas conservadoras, concreto alta densidad y memoria beta preliminar no certificada.

Regla general: si el sistema muestra una cita, hash o valor como **candidato**, **derivado**, **draft** o **preliminar**, debe verificarse contra documento, pagina y revision profesional antes de usarse en una memoria analitica final.

## Addendum F356-F360 - Prueba real y release beta

F356-F360 cambia el modo de trabajo: deja de agregar fases por inercia y prepara la app para prueba real de usuario.

Flujo:

1. **F356:** abrir la app y revisar menu Archivo, carga de plano, canvas, sidebar, Memoria IA, Evidence Pack, Medical 3D y reportes.
2. **F357:** completar datos faltantes: geometria definitiva, fuente/proveedor, workload, TVL/densidad, penetraciones, costo/estructura y condiciones de uso.
3. **F358:** generar calculo preliminar trazable. Cada calculo debe conservar formula, norma, inputs, outputs, supuestos, advertencias y hash.
4. **F359:** preparar memoria beta preliminar con marca **NO CERTIFICADO**.
5. **F360:** liberar como beta operativa para pruebas reales, no como release clinico/constructivo final.

Uso permitido: probar el flujo completo con un plano real, revisar donde fallan menus/canvas/reportes, capturar datos faltantes y producir borradores tecnicos.

Uso bloqueado: emitir memoria analitica firmada, espesores certificados, dictamen final o liberacion clinica/constructiva sin revision profesional.

## Addendum F350-F355 - Paquete real preliminar Centro Neuro

F350-F355 empaqueta la prueba operativa del caso Centro Neuro usando los bloques de evidencia F347 y el cierre QA F349.

Incluye:

1. Visual smoke del flujo Canvas/Floorplan, Memoria IA, Evidence Pack, PDF draft, Medical 3D y Update Center.
2. Memoria preliminar marcada como **NO CERTIFICADO**.
3. Cierre de datos faltantes con valores estandar o derivados de memorias analiticas.
4. Matriz de consistencia para confirmar que cada superficie muestra el mismo estado.
5. ZIP de operador para revisar el paquete antes de continuar.

Uso correcto: abrir el HTML visual, revisar por equipo la fuente/proveedor, geometria, material, TVL, densidad, penetraciones y estado. En esta fase la revision FM/RSO se omite solo para no detener la prueba, pero esto no habilita memoria firmada ni espesores certificados.

Regla operativa: si un dato aparece como candidato, estandar o derivado, debe sustituirse por dato versionado con documento, pagina y hash antes de emitir memoria analitica final.

## Addendum F349 - QA cierre de superficies de evidencia

F349 verifica que el handoff F348 este listo antes de smoke visual/browser:

1. Manifiesto F348 presente.
2. Cinco superficies enlazadas.
3. Veinte bindings listos.
4. Canvas evidence sidebar definido.
5. Memoria IA definida.
6. Evidence Pack definido.
7. Visuales HTML/SVG presentes.
8. Sin calculo firmado.
9. Update Center/documentacion actualizados.

Resultado: la app queda lista para una fase siguiente de smoke visual/browser sobre Canvas, Memoria IA, Evidence Pack, PDF y Medical 3D.

## Addendum F348 - Superficies de app y reporte

F348 conecta los bloques F347 con las superficies donde el usuario debe ver la evidencia:

1. Canvas evidence sidebar: muestra bloque seleccionado, advertencias y citas pendientes.
2. Memoria IA wizard: arma secciones preliminares.
3. Evidence Pack: empaqueta hash, supuestos, warnings y checklist.
4. PDF report draft: render preliminar con marca no firmable.
5. Medical 3D inspection: muestra contexto visual por sala/equipo.

Uso correcto: revisar el visual F348, confirmar que cada equipo aparece en todas las superficies y no interpretar ningun resultado como espesor firmado.

## Addendum F347 - Bloques de evidencia para Memoria IA

F347 toma los parametros estandar de F346 y los convierte en bloques narrativos que Memoria IA puede usar para preparar una memoria preliminar.

Cada bloque incluye:

1. Equipo o area.
2. Perfil de modalidad.
3. Escala, colindancia y ocupacion.
4. Metodo preliminar y norma/metodologia.
5. Material candidato, densidad y TVL candidate.
6. Carga estructural draft.
7. Entradas requeridas.
8. Citas pendientes.
9. Advertencias.
10. Estado no firmable.

Bloques creados:

1. LINAC Elekta Versa HD 15 MeV.
2. Gamma Knife Esprit.
3. Cyclone KIUBE 18 MeV.
4. Radiofarmacia / hot lab.

Uso correcto: revisar el visual de F347, completar las citas, sustituir parametros estandar por datos reales y despues generar la memoria draft. La memoria firmable sigue bloqueada hasta geometria, fuente, material, penetraciones y revision FM/RSO final.

## Addendum F346 - Parametros estandar para draft

F346 permite avanzar con parametros estandar cuando todavia no se tienen todos los datos del proveedor o del trazado CAD. Estos valores sirven para probar flujo, memoria y visualizacion, no para firmar.

Parametros aplicados:

1. Geometria:
   - LINAC: bunker draft `8.5 x 7.5 x 3.8 m`.
   - Gamma Knife: sala draft `6.5 x 6.0 x 3.4 m`.
   - Ciclotron: vault draft `9.0 x 8.0 x 4.5 m`.
   - Radiofarmacia/hot lab: area draft `5.0 x 4.0 x 3.0 m`.
2. Termino fuente:
   - Versa HD 15 MeV: workload draft maximo y revision de neutrones.
   - Gamma Knife Esprit: Co-60 con inventario y decaimiento pendientes.
   - Cyclone KIUBE 18 MeV: corriente/horas draft, neutrones, activacion y exhaust.
   - Hot lab: inventario de radionuclidos pendiente.
3. Material:
   - Concreto alta densidad con densidad draft `3200 kg/m3`.
   - TVL candidato solo para pruebas; requiere pagina/hash antes de uso final.
4. Penetraciones:
   - HVAC, conduits, puerta/laberinto, sleeve piso/techo y exhaust ciclotron se asumen presentes hasta descartarlas.
5. Revision:
   - FM/RSO queda como gate final de memoria analitica firmable.

Uso correcto: usar F346 para preparar captura, comparar impacto estructural/costo y alimentar Memoria IA con advertencias. No usar como resultado regulatorio.

## Addendum F345 - Paquete draft visual de calculo

F345 convierte el marcado de F344 en una matriz draft de calculo por barrera. El objetivo es ver el avance y preparar la entrada para Memoria IA/PDF/Evidence Pack sin inventar espesores.

Que genera:

1. 24 filas de barrera: norte, sur, este, oeste, piso y techo por area.
2. Metodos sugeridos por modalidad:
   - Versa HD 15 MeV: NCRP 151 primario/secundario y revision de neutrones.
   - Gamma Knife Esprit: Co-60, actividad, decaimiento y TVL por material.
   - Cyclone KIUBE 18 MeV: neutrones, gamma prompt, activacion, ductos y exhaust.
   - Radiofarmacia/hot lab: inventario NM, hot cells y flujo controlado.
3. Una vista visual HTML/SVG con salas, compuertas y estado del paquete.

Como usarlo:

1. Abrir el visual `f345_visual_progress.html` para revisar que las areas y compuertas coinciden con el caso.
2. Usar `f345_barrier_draft_calculation_matrix.csv` como lista de captura en canvas.
3. Completar para cada barrera: geometria, distancia, rol de barrera, penetraciones, material, TVL/densidad y cita.
4. Mantener el resultado como draft hasta que las compuertas pasen.

Regla: F345 prepara calculo, pero no calcula espesor firmable.

## Addendum F344 - Colindancias publico en general

F344 permite avanzar el trazado del caso Centro Neuro con los criterios ya indicados:

1. Escala del plano: `1:100`.
2. Colindancias preliminares: `publico en general`.
3. Factor de ocupacion conservador inicial: `T=1`.
4. Revision FM/RSO: al final, antes de memoria firmable y entrega regulatoria.

Uso en canvas:

1. Mantener el PDF base bloqueado.
2. Dibujar salas/equipos en la capa `Rooms and equipment footprints`.
3. Dibujar barreras norte, sur, este, oeste, piso y techo por cada sala.
4. Asignar a cada barrera la colindancia `publico en general`.
5. Marcar penetraciones en capa separada: HVAC, charolas/conduits, gases, puerta/laberinto y exhaust del ciclotron.
6. Mantener citas, supuestos, formulas y hashes en la capa de evidencia.

Interpretacion:

1. Este criterio permite dibujar y preparar el calculo draft.
2. No sustituye el termino fuente del proveedor, TVL/densidad versionada, ni el workload clinico real.
3. No produce espesor firmable.
4. La revision FM/RSO queda como gate final para memoria analitica, construccion y entrega CNSNS/UAQ.

## Addendum F343 - Preflight Centro Neuro con equipos reales

F343 toma los datos confirmados por el usuario y arma la hoja de entrada operativa antes del calculo:

1. LINAC: Elekta Versa HD, energia maxima 15 MeV.
2. Gamma Knife: Elekta Gamma Knife Esprit.
3. Ciclotron: IBA Cyclone KIUBE, energia 18 MeV.
4. Material preliminar: concreto alta densidad.
5. Carga maxima: supuesto conservador para preflight, no resultado firmable.

Uso en el flujo de diseno:

1. Importar el plano Centro Neuro y confirmar escala 1:100 contra una cota conocida.
2. Colocar cada equipo en su sala con isocentro, footprint y orientacion.
3. Trazar zonas controladas, supervisadas y publicas alrededor de cada barrera.
4. Registrar ocupacion `T` y limite de diseno `P` por area adyacente.
5. Marcar penetraciones como objetos propios: HVAC, electricidad, gases, cableado, puerta, laberinto y pasos especiales.
6. Seleccionar material real y anexar TVL/HVL, densidad, costo, tiempo de obra, peso/carga estructural y cita/hash.
7. Correr calculos preliminares solo cuando las compuertas esten completas.

Advertencias activas:

1. Versa HD 15 MeV requiere revision de neutrones.
2. Cyclone KIUBE 18 MeV requiere revision de neutrones, activacion, ductos y exhaust.
3. Gamma Knife Esprit requiere actividad Co-60, fecha de referencia y decaimiento.
4. Distancias menores a 0.3 m deben bloquearse o justificarse.
5. TVL sin version, pagina y hash no debe alimentar memoria final.
6. Todo resultado queda preliminar hasta revision RSO/fisico medico.

## Addendum F342 - Evidencia visual Centro Neuro

F342 genera resultados visuales para revisar el caso Centro Neuro antes de ingresar datos finales. La fase produce una lamina HTML y capturas del navegador para verificar que la app conserva canvas, menus, Medical 3D, Memoria IA y Evidence Pack.

Resultados visuales esperados:

1. Canvas principal con sidebar y toolbar CAD visibles.
2. Update Center mostrando F342/F341 como fases actuales.
3. Medical 3D abierto con escena navegable.
4. Memoria IA abierta para flujo de reporte.
5. Evidence Pack abierto para trazabilidad.
6. Tablero visual del caso con overlay del plano, fuentes, escala, material y pendientes.

Como interpretar los visuales:

1. El overlay muestra regiones de trabajo, no geometria calculada.
2. La escala 1:100 se usa como preflight; se debe confirmar con cota real.
3. Concreto alta densidad queda como material draft; se debe elegir ficha documentada con TVL/densidad.
4. Penetraciones y ocupacion aparecen como pendientes intencionales.
5. Medical 3D es evidencia visual; el calculo firmable debe venir del motor con formula, norma, inputs, outputs y citas.

## Addendum F341 - Centro Neuro con escala 1:100

F341 toma los datos iniciales del usuario para preparar una prueba mas cercana al uso real:

1. Escala de plano: `1:100`.
2. Fuentes/equipos: ciclotron, Gamma Knife y LINAC.
3. Material inicial: concreto alta densidad.
4. Penetraciones: pendientes de marcar en canvas.
5. Ocupacion: pendiente de confirmar por areas adyacentes.

La escala 1:100 permite una conversion provisional del render: `0.01693333 m/px` si el PDF fue ploteado fielmente a 150 dpi. Esta conversion ayuda a preparar el trazado, pero antes de memoria firmable debe comprobarse contra una dimension conocida del plano o contra archivo CAD/DXF/DWG.

Fuentes a completar:

1. Ciclotron: modelo, energia de protones, corriente, targets, workload, self-shielding y reporte de termino fuente del proveedor.
2. Gamma Knife/LGK: modelo, numero de fuentes, actividad Co-60, fecha de referencia, decaimiento, pacientes/semana e isocentro.
3. LINAC: modelo, energia MV, workload Gy/semana, factores de uso, ocupacion, isocentro, laberinto y puerta.

Materiales:

1. Usar `Concreto alta densidad` como valor de arranque.
2. Seleccionar la ficha exacta antes del calculo: baritado, magnetita, TM NIPOLL, CONTUPLEX, Nelco/VeriShield u otro.
3. Adjuntar TVL/HVL, densidad, costo, tiempo de obra, peso/carga estructural y fuente documental.

Penetraciones a revisar:

1. Ductos HVAC.
2. Charolas electricas y conduits.
3. Gases/plomeria.
4. Cables hacia control.
5. Marcos de puerta/laberinto.
6. Pasos piso/techo.
7. Lineas de target/extraccion del ciclotron.

Ocupacion:

1. No se debe adivinar para calculo final.
2. Como borrador se pueden marcar control/consultorios/salas de espera como ocupacion alta, pasillos como ocupacion parcial, escaleras/transito como baja y exteriores/servicio como menor.
3. Cada zona debe quedar trazada con factor `T`, limite de diseno `P`, clasificacion controlada/supervisada/publica y cita normativa.

Regla de seguridad: F341 sigue siendo preflight. El sistema debe mantener resultados como preliminares mientras falten penetraciones, ocupacion, TVL/densidad versionada o termino fuente completo.

## Addendum F340 - Prueba operativa Centro Neuro

F340 transforma el caso real de F339 en una secuencia de trabajo para probar la app con el plano Centro Neuro. La prueba no cambia el motor de calculo; organiza la captura y evita que se produzcan resultados firmables sin datos completos.

Capas de trabajo:

1. `PDF base`: fondo bloqueado del plano renderizado.
2. `Controlled zones`: zonas controladas, supervisadas y publicas.
3. `Equipment rooms`: habitaciones y huellas de ciclotron, Gamma Knife y LINAC.
4. `Shielding barriers`: muros, puertas, techo, piso, laberintos y penetraciones.
5. `Annotations and citations`: notas, supuestos, formulas y fuentes.
6. `Heatmap/isodose`: visualizacion de dosis solo despues de calculo valido.
7. `Structural load`: peso de equipo y carga por blindaje/material.

Uso recomendado en app:

1. Abrir el canvas/floorplan.
2. Cargar `outputs/f339_real_case_centro_neuro/centro_neuro_page-1.png` como fondo.
3. Bloquear la capa del fondo para no mover el plano por accidente.
4. Calibrar escala con dos puntos arquitectonicos conocidos y distancia real en metros.
5. Trazar las salas CYCLOTRON, RADIOFARMACIA, LGK/GAMAKNIFE y LINAC.
6. Colocar simbolos de equipo con orientacion, huella, peso y punto fuente/isocentro.
7. Registrar metadatos por equipo: energia/actividad, workload, ocupacion, puertas, laberinto, penetraciones y material.
8. Ejecutar preflight de calculo por modalidad: CY para ciclotron, TX para Gamma Knife y TX para LINAC.
9. Revisar Medical 3D con capturas por sala y guardar `sceneHash`.
10. Generar Memoria IA/PDF/Evidence Pack como borrador trazable.

Bloqueos intencionales: si falta escala, fuente, ocupacion, material, penetraciones o revision calificada, la app debe mantener el resultado como preliminar. La visualizacion 3D y el heatmap sirven para inspeccion y comunicacion, no para sustituir el calculo normativo.

## Addendum F339 - Caso real Centro Neuro

F339 usa el plano `CENTRO NEURO PLANTA BAJA 040626.pdf` como primer caso real de operador. El archivo se trata como plano visual generado desde AutoCAD: se renderiza a PNG para fondo de canvas y se registra con hash. El texto extraido no es la fuente principal; la evidencia viene del PDF, la imagen renderizada y la trazabilidad del operador.

Zonas preparadas:

1. `CYCLOTRON`: perfil CY para boveda de ciclotron, neutrones/gamma, activacion, laberinto, penetraciones y relacion con radiofarmacia.
2. `RADIOFARMACIA`: perfil NM como contexto de hot lab, areas controladas, flujo operativo y adyacencias.
3. `LGK (GAMAKNIFE)`: perfil TX para Gamma Knife, inventario Co-60, fuga/dispersion, carga estructural y anexos.
4. `LINAC`: perfil TX para NCRP 151, primaria/secundaria, neutrones si energia mayor a 10 MV, laberinto/puerta y evidencia 3D.

Flujo recomendado:

1. Ejecutar F339 o abrir el PNG renderizado `outputs/f339_real_case_centro_neuro/centro_neuro_page-1.png`.
2. Importar la imagen como fondo de canvas/floorplan.
3. Calibrar escala con una dimension arquitectonica conocida antes de calcular.
4. Trazar habitaciones y barreras en capas separadas.
5. Colocar simbolos de ciclotron, Gamma Knife y LINAC con huella, orientacion, peso y punto fuente/isocentro.
6. Asignar materiales desde la toolbox: TVL, densidad, peso, costo, tiempo y carga estructural.
7. Ejecutar calculos por modalidad solo cuando esten confirmados workload, ocupacion, energia/actividad y fuente normativa.
8. Abrir Medical 3D para revisar espesores, equipos, zonas controladas y generar `sceneHash`.
9. Generar Memoria IA, PDF y Evidence Pack con citas, advertencias y checklist de revision.

Regla de seguridad: F339 no certifica blindajes desde imagen. Cualquier resultado se mantiene preliminar hasta tener escala calibrada, terminos fuente, ocupacion, materiales versionados y revision por fisico medico/RSO.

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

## Addendum F363 - Three/R3F Inspeccion Visual Y Babylon Readiness

F363 mejora el visor Medical 3D sin cambiar el motor estable. Three/R3F sigue activo y agrega ayudas visuales de inspeccion que se pueden encender o apagar desde el panel lateral del visor:

1. Bandas de material y espesor: muestran sobre cada muro una lectura rapida del material, espesor candidato y familia de blindaje.
2. Footprints de equipos: dibujan la huella de LINAC, Gamma Knife, ciclotron u otros equipos para revisar si el sembrado coincide con el plano.
3. Guias de haz o fuente: muestran vectores visuales no dosimetricos para entender direccion, campo principal y zonas que requieren revision.
4. Cotas de sala: ayudan a inspeccionar dimensiones generales durante el recorrido.

Estas ayudas son visuales y no sustituyen el calculo firmado. Sirven para revisar coherencia entre plano, equipo, material, zonas controladas y narrativa de la memoria analitica.

El export de revision 3D incluye dos bloques nuevos: `threeR3fInspection`, con las ayudas visuales activas y su proposito, y `babylonReadiness`, con el estado del carril Babylon.

Para reparar o instalar Babylon en una fase posterior, las rutas recomendadas son:

1. Instalacion normal: `npm install @babylonjs/core @babylonjs/loaders`.
2. Cache local del repo: `npm install @babylonjs/core @babylonjs/loaders --cache .npm-cache-babylon --prefer-online`.
3. Gestor alterno: `corepack enable && pnpm add @babylonjs/core @babylonjs/loaders`.
4. Tarballs locales: descargar o generar paquetes `.tgz` y luego instalarlos desde disco.

Unity WebGL queda reservado para una etapa posterior de recorrido hiperrealista, porque requiere pipeline de assets, build mas pesado, politicas de hosting y QA visual independiente.

## Addendum F364 - Flujo Visual 3D Para Revision Y Evidencia

F364 agrega un flujo visual guiado dentro de Medical 3D. El objetivo es que el usuario no tenga que improvisar capturas: la app propone presets para revisar el mismo plano desde cinco perspectivas.

Presets disponibles:

1. Vista general: muestra sala completa, zonas y lectura rapida del caso.
2. Barreras: enfoca materiales, espesores, cotas y tipo de barrera.
3. Equipos: muestra footprints, posicion de fuente/isocentro y espacio libre.
4. Dosis: activa visual de dosis/zonas y guias de fuente.
5. Recorrido: activa WASD, colisiones, PBR ligero, techo y estaciones.

La escena muestra una ruta de inspeccion con estaciones F147 numeradas. Al seleccionar una estacion, la camara salta al punto de revision y se abre una tarjeta con proposito, posicion y evidencia esperada.

El checklist visual confirma:

1. Geometria cargada.
2. Materiales visibles.
3. Equipos sembrados.
4. Contexto de dosis y zonas.
5. Estaciones/bookmarks disponibles.

El boton `Exportar tour visual` genera `medical_3d_visual_workflow_*.json`. Ese archivo debe adjuntarse a Memoria IA, PDF o Evidence Pack cuando se requiera explicar como se reviso visualmente el bunker/sala.

Este flujo no sustituye el motor de calculo ni la revision profesional. Su valor es ordenar evidencia visual, capturas y narrativa tecnica antes de cerrar una memoria analitica.

## Addendum F365-F366 - Capturas Guiadas Y Paquete De Evidencia Visual

F365-F366 agrega una compuerta de evidencia visual dentro de Medical 3D. Cada vez que se usa el boton `Capturar`, la app descarga un PNG y registra un manifiesto con:

1. Preset visual activo.
2. Nombre del archivo PNG.
3. Hash visual de escena.
4. Checklist listo/total.
5. Estacion F147 activa, si aplica.
6. Fecha de captura.

La compuerta F366 revisa si existen capturas minimas para:

1. Vista general.
2. Barreras.
3. Equipos.
4. Dosis.

El recorrido es recomendado cuando se necesita documentar inspeccion visual de sala, pero no bloquea el paquete minimo.

Estados:

1. `pending`: no hay capturas.
2. `review`: hay capturas, pero faltan presets o checklist.
3. `ready`: estan cubiertas las capturas minimas y el checklist visual esta completo.

El boton `Pack` exporta `medical_3d_visual_evidence_pack_*.json`. Ese archivo resume capturas, checklist, bookmarks, faltantes y politica minima de captura. Debe adjuntarse a Memoria IA, PDF Report o Evidence Pack como soporte visual no certificable.

La evidencia visual no reemplaza calculos, citas normativas, trazabilidad de formulas ni revision profesional.

## Addendum F367-F370 - Integracion Beta, Unity, Motores Externos Y Fotorealismo

F367-F370 cierra la linea actual como integracion beta. La evidencia visual 3D deja de vivir solo en Medical 3D y aparece tambien en:

1. Memoria IA.
2. PDF Report.
3. Evidence Pack.
4. Update Center.

Unity WebGL queda implementado como visor externo formal. Para usarlo se requiere publicar un build Unity WebGL aparte y configurar:

1. `VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER`.
2. `VITE_MEDICAL_3D_UNITY_WEBGL_URL`.

La app exporta `medical_3d_unity_handoff_*.json` y `medical_3d_f367_f370_release_integration_*.json`. Unity solo puede devolver capturas, bookmarks o referencia de recorrido; no sustituye calculos, citas ni revision profesional.

Los motores externos quedan formalizados como runners:

1. GATE/OpenGATE para NM/PET/SPECT y escenarios medicos Geant4.
2. Geant4 para transporte general, ciclotron, neutrones y scoring independiente.
3. EGSnrc/egs_brachy para fotones, electrones y braquiterapia.

Cada runner debe devolver version, fisica/dataset, seed, historias, incertidumbre, hash de entrada, hash de salida y manifiesto de corrida.

Fotorealismo avanzado:

1. Ahora: Three/R3F con PBR, luces, materiales, footprints, bandas y capturas.
2. Despues: assets GLB/GLTF reales de equipos y acabados.
3. Pendiente: Babylon PBR/WebGPU/WebXR, solo cuando pase instalacion, build y smoke visual.

F370 permite publicar frontend beta, pero bloquea afirmar: Monte Carlo clinico certificado, DWG nativo en navegador, Babylon runtime activo o memoria firmada sin revision profesional.

## Addendum F371-F372 - Smoke Visual Beta Y Paquete Estatico

F371-F372 sirve para revisar la app como usuario antes de publicar o entregar un ZIP beta. No cambia calculos ni agrega dependencias pesadas; valida que las superficies criticas sigan visibles y exporta evidencia visual.

El smoke F371 revisa:

1. Shell principal: barra superior, sidebar estable y canvas visible.
2. Menu Archivo: debe abrir debajo de su boton, con ancho acotado y estilo consistente.
3. Boton derecho del canvas: debe mostrar menu contextual CAD.
4. Memoria IA: debe mostrar la tarjeta F367-F370 con Three/R3F, Unity externo, motores MC y claims bloqueados.
5. PDF Report: debe incluir el bloque F367-F370 para anexar evidencia 3D.
6. Evidence Pack: debe mostrar la trazabilidad F367-F370.
7. Medical 3D: debe abrir la escena Three/R3F y mostrar el panel de integracion F367-F370.

Las capturas se guardan en `outputs/f371_f372_beta_visuals/`. La imagen `08_three_unity_memoria_flow_visual.png` resume visualmente el flujo:

1. El plano/canvas define geometria, escala, equipos y zonas.
2. Three/R3F permite inspeccion visual inmediata dentro de la app.
3. Unity WebGL queda como visor externo para recorrido fotorrealista si existe una URL configurada.
4. Los motores externos reciben paquetes de entrada versionados y devuelven resultados con hash/incertidumbre.
5. Memoria IA, PDF Report y Evidence Pack usan esas evidencias como anexos, no como calculo firmado automatico.

F372 genera el ZIP `outputs/f372_beta_static_package/radshield-mx-f372-static-beta.zip`. Ese ZIP es apropiado para Vercel/Netlify/manual static hosting cuando se quiere probar frontend sin backend live.

El paquete beta no debe presentarse como release clinico certificado. Para una memoria firmable aun se requiere revisar geometria final, cargas de trabajo, TVL/densidad versionadas, penetraciones, colindancias, formula/norma/cita y revision profesional.
