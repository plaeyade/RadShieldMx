# RadShield-MX v24 — Manual de Usuario

## Addendum vigente: flujo DXF guiado

1. Abra `Archivo > Importar DXF`.
2. Cargue el DXF. Si el origen es DWG, conviertalo primero a DXF/SVG con un proveedor externo autorizado.
3. Clasifique capas como barreras, equipos, zonas, cotas, referencias o revision.
4. Aplique vista ligera para inspeccion inicial o vista completa para geometria revisada.
5. En `Revision DXF`, revise escala, continuidad de muros, advertencias y la evidencia `ev-dxf-import-review`.
6. Confirme geometria antes de calcular. La accion `Calcular` queda bloqueada mientras el DXF sea preliminar.
7. Si la barra inferior muestra `DXF sin fuente`, agregue o confirme equipo/fuente radiologica.
8. Ejecute calculo y genere `Memoria IA`, PDF o `Evidence Pack`.

La evidencia `ev-dxf-import-review` conserva estado draft/reviewed, hash y notas para trazabilidad documental.

## Tabla de Contenidos
1. [Introduccion](#1-introduccion)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Interfaz de Usuario](#3-interfaz-de-usuario)
4. [Menu Calcular](#4-menu-calcular)
5. [Menu Simular](#5-menu-simular)
6. [Menu Validar](#6-menu-validar)
7. [Menu Normativas](#7-menu-normativas)
8. [Menu Industrial](#8-menu-industrial)
9. [Menu Herramientas](#9-menu-herramientas)
10. [Flujo de Trabajo](#10-flujo-de-trabajo)
11. [Referencia Rapida de Teclado](#11-referencia-rapida-de-teclado)
12. [Solucion de Problemas](#12-solucion-de-problemas)
13. [Bibliografia](#13-bibliografia)

---

## 1. Introduccion

**RadShield-MX** es una plataforma profesional web para el calculo, diseno y validacion de blindajes radiologicos en instalaciones medicas e industriales. La aplicacion implementa las metodologias de las normativas internacionales mas reconocidas:

- **NCRP 151** — Blindajes para radioterapia con haces megavoltaje
- **NCRP 147** — Blindajes para instalaciones de rayos X diagnosticos
- **ICRP 103** — Recomendaciones fundamentales de proteccion radiologica
- **CNSNS-LA-001/2018** — Guia mexicana para memorias de calculo
- **IAEA SRS 47** — Proteccion radiologica en radioterapia
- **Euratom 2013/59** — Basic Safety Standards de la UE

### Version Actual: v24
- **121+ modulos** organizados en 9 ejes funcionales
- **15 regulaciones internacionales** en base de datos
- **28 items de compliance** verificables
- **30,000+ lineas** de codigo TypeScript/React/Python

---

## 2. Primeros Pasos

### 2.1 Acceso
Abra la aplicacion en su navegador web:
```
https://kjvcxnesfwpp2.kimi.page
```

**Requisitos:**
- Navegador: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- Resolucion minima: 1280x720
- No requiere conexion para el bundle estatico. Funciones externas como AI/LLM, Cloud Sync, PACS real, Pyodide CDN u OpenCV CDN requieren configuracion explicita.

### 2.2 Pantalla de Bienvenida
Al iniciar, vera la pantalla de bienvenida con:

| Seccion | Descripcion |
|---------|-------------|
| **Hero** | Saludo personalizado, fecha, KPIs principales |
| **Acciones Rapidas** | Nuevo Proyecto, Abrir, Importar DXF/CSV |
| **Proyectos Recientes** | Ultimos 5 proyectos abiertos |
| **Templates** | 5 plantillas pre-configuradas (LINAC, PET-CT, etc.) |
| **Novedades** | Lista de nuevas funcionalidades por version |

### 2.3 Tour Guiado
Para usuarios nuevos, haga clic en **Tutorial** para iniciar un tour guiado de 7 pasos que explica la interfaz principal.

### 2.4 Crear Primer Proyecto
1. Desde la pantalla de bienvenida, haga clic en **Nuevo Proyecto**
2. Seleccione una plantilla (ej: "LINAC 6MV") o empiece en blanco
3. Configure la fuente radiactiva en el panel izquierdo
4. Trace las barreras en el canvas central
5. Ejecute el calculo con el boton **Calcular Blindaje**

---

## 3. Interfaz de Usuario

### 3.1 Layout Principal
```
+-------------------------------------------------------------+
|  [Logo] Inicio  Calcular  Simular  Validar  ...  [Ayuda]   |  <- Toolbar
+-------------------------------------------------------------+
|  +----------+  +-----------------------------------------+  |
|  |          |  |                                         |  |
|  | Sidebar  |  |                                         |  |
|  | (Fuentes,|  |        Canvas Area                      |  |
|  | Barreras,|  |        (Plano interactivo)              |  |
|  | Materia- |  |                                         |  |
|  | les)     |  |                                         |  |
|  |          |  +-----------------------------------------+  |
|  +----------+  +-----------------------------------------+  |
|                 |  Results Panel                          |  |
|                 |  (Resultados, graficos, exportacion)    |  |
+-------------------------------------------------------------+
|  Fuentes: 0  |  Barreras: 0  |  Zoom: 100%  |  v24       |  <- Status Bar
+-------------------------------------------------------------+
```

### 3.2 Toolbar — 9 Menus

| Menu | Contenido Principal |
|------|-------------------|
| **Inicio** | Pantalla de bienvenida, proyectos recientes |
| **Calcular** | Calculo de blindaje, memoria analitica, incertidumbre, Monte Carlo, NDT, validacion experimental |
| **Simular** | Monte Carlo local/cloud, equipos especificos, GATE PET/SPECT, DICOM RT, mapas de dosis, VR/AR, video tutoriales, multi-source/multi-detector |
| **Validar** | Plan validator, audit dashboard, comparacion plan vs actual, trail de auditoria, anomalias, checklist CNSNS |
| **Reportar** | Memoria analitica PDF, reporte CNSNS, exportar PDF, registro de mantenimiento |
| **Referencias** | Biblioteca de equipos, biblioteca de referencias, bibliografia validada |
| **Normativas** | International Regulations DB (15 regs), Regulatory Comparison, Compliance & Certification (28 items), Regulatory Alerts, Python Integration |
| **Industrial** | Proteccion radiologica industrial (NDT, gauging, irradiadores) |
| **Herramientas** | AI Assistant offline/opt-in, Auto-Barrier Detection, Predictive Material Optimizer, Collaboration Hub, PACS Integration opt-in, Theme Engine, Cloud Sync opt-in |

### 3.3 Canvas Area
- **Click + arrastrar** para dibujar barreras
- **Doble click** en una barrera para editar propiedades
- **Rueda del raton** para zoom
- **Click derecho** para menu contextual
- **Modos**: 2D top-down, 3D perspective, DXF overlay

---

## 4. Menu Calcular

### 4.1 Calculo de Blindaje Principal
Implementa la metodologia NCRP 151/147 completa:

**Formula principal:**
```
B = P * d^2 / (W * U * T)
```

Donde:
- **B** = Factor de transmision
- **P** = Objetivo de dosis de diseno (mSv/semana)
- **d** = Distancia fuente-barreira (m)
- **W** = Carga de trabajo (Gy/semana)
- **U** = Factor de uso
- **T** = Factor de ocupacion

**Tipos de barrera:**
- **Primaria**: Expuesta al haz principal (U < 1)
- **Secundaria**: Proteccion contra dispersion y fuga
- **Maze/Laberinto**: Entrada al bunker
- **Techo/Suelo**: Proteccion vertical

### 4.2 Memoria Analitica
Genera automaticamente la memoria analitica profesional en formato PDF con:
- Datos del proyecto y responsable
- Descripcion de la instalacion
- Calculo de blindajes primarios y secundarios
- Verificacion contra limites regulatorios
- Firmas y conclusiones

### 4.3 Incertidumbre (GUM JCGM 100)
Propagacion de incertidumbre con 5 inputs:
- Actividad (MBq) — distribuciones: Normal, Rectangular, Triangular
- Distancia (m)
- TVL (mm)
- Factor de ocupacion
- Factor de uso

### 4.4 Monte Carlo Integration
Genera macros para 3 motores:
- **Geant4** (.mac) — /gps/source/add, physics lists
- **MCNP6** (.inp) — tallies, materials, surfaces
- **FLUKA** (.inp) — BEAM, USRTRACK, BIASING

### 4.5 Validacion Experimental
Compara TVLs calculados vs 7 referencias experimentales:
- NCRP 151, NCRP 147
- Archundia 2004, McGinley 1998
- Metrica En (|En| <= 1 = PASS)

---

## 5. Menu Simular

### 5.1 Monte Carlo en Cloud
Ejecute simulaciones Monte Carlo en servidores cloud:
- Configuracion de geometria, fuente y detectores
- 10^6 - 10^9 historias
- Resultados con incertidumbre estadistica
- Comparacion vs NCRP 151

### 5.2 Multi-Source & Multi-Detector
**Nuevo en v22.** Define simultaneamente multiples fuentes y detectores:

**8 fuentes predefinidas**: Ir-192, Co-60, Cs-137, F-18, Am-241, Se-75, LINAC 6MV, LINAC 10MV

**5 tipos de detector**: Dosis equivalente H*(10), flujo de fotones, dosis absorbida (silicon), dosis ambiental, dosis direccional

**5 tecnicas de biasing**: Importance sampling, weight windows, Russian roulette, splitting, force collision

**Exporta**: Geant4 .mac, FLUKA .inp, GDML .gdml, pyg4ometry .py

### 5.3 GATE PET/SPECT
Simulacion Monte Carlo para medicina nuclear:
- 4 scanners PET (Siemens Biograph, GE Discovery, Philips Vereos, uEXPLORER)
- 4 scanners SPECT (Siemens Symbia, GE Discovery NM, Philips BrightView, Mediso NanoSPECT)
- Generacion de macros GATE v9.4+

### 5.4 VR/AR Bunker Preview
Visualizacion inmersiva del bunker:
- **WebXR** — compatible con Meta Quest 3 y Apple Vision Pro
- Renderizado Three.js con iluminacion realista
- Overlay de dimensiones y materiales

### 5.5 Animated Dose Maps
Mapas de dosis temporales con requestAnimationFrame:
- Simulacion de decaimiento F-18 (T1/2 = 109.8 min)
- Timeline de 10 horas en 60 pasos
- Colormap Jet, 20x10 grid

---

## 6. Menu Validar

### 6.1 Plan Validator
Validacion automatica del plan de blindaje:
- Verificacion de espesores minimos
- Comprobacion de limites de dosis
- Alerta de anomalias (valores negativos, distancias cero)
- Estado Pass/Fail por barrera

### 6.2 Audit Dashboard
Panel de auditoria completo:
- Trail de auditoria (quien, que, cuando)
- Logs de cambios
- Metricas de calidad

---

## 7. Menu Normativas (Eje 3)

### 7.1 International Regulations DB
Base de datos de 15 regulaciones internacionales:

| Regulacion | Autoridad | Ano | Tipo |
|-----------|-----------|-----|------|
| ICRP 103 | ICRP | 2007 | Safety Standard |
| ICRP 118 | ICRP | 2012 | Safety Standard |
| IAEA SSR-6 | IAEA | 2018 | Safety Standard |
| IAEA SRS 47 | IAEA | 2006 | Safety Standard |
| IAEA GSG-7 | IAEA | 2018 | Guideline |
| IAEA SSG-46 | IAEA | 2018 | Guideline |
| NCRP 151 | NCRP | 2005 | Safety Standard |
| NCRP 147 | NCRP | 2004 | Safety Standard |
| NCRP 144 | NCRP | 2003 | Safety Standard |
| 10 CFR 20 | NRC | 2023 | Legal Act |
| CNSNS-LA-001 | CNSNS | 2018 | Regulatory Guide |
| NOM-008-ENER | SENER | 2020 | Legal Act |
| Euratom 2013/59 | EU | 2013 | Legal Act |
| IRMER 2017 | UK | 2017 | Legal Act |
| StrlSchV 2018 | BfS | 2018 | Legal Act |

**Filtros**: Region, categoria, estado, busqueda full-text

### 7.2 Regulatory Comparison
Compare dos regulaciones side-by-side:
- Limites de dosis (publico, ocupacional, embarazo)
- Diferencias absolutas y porcentuales
- Indicador de cual es mas estricta
- Matriz de cobertura de scope

### 7.3 Compliance & Certification
**3 checklists con 28 items verificables:**

**NCRP 151 Shielding Design (15 items):**
- [ ] Barrier transmission factors calculados
- [ ] Workload (W) documentado
- [ ] Use factor (U) asignado
- [ ] Occupancy factor (T) justificado
- [ ] Barrera primaria > minimo
- [ ] Barrera secundaria > minimo
- [ ] Radiacion de fuga considerada
- [ ] Radiacion dispersa considerada
- [ ] Blindaje neutronico >10 MV
- [ ] Diseno de maze adecuado
- [ ] Skyshine evaluado
- [ ] Encuesta post-instalacion
- [ ] Re-encuesta anual
- [ ] Revision independiente
- [ ] Memoria analitica completa

**CNSNS-LA-001 Mexico (7 items):**
- [ ] Memoria analitica en espanol
- [ ] Firma del fisico medico
- [ ] Licencia CNSNS vigente
- [ ] Revision anual
- [ ] Dosimetria personal
- [ ] Reporte de incidentes
- [ ] Programa ALARA

**Euratom BSS (6 items):**
- [ ] Dose constraints establecidos
- [ ] DRLs establecidos
- [ ] Justificacion de exposiciones
- [ ] Optimizacion de blindajes
- [ ] Procedimientos embarazo
- [ ] Programa QA

**Exporta reporte** en formato Markdown.

### 7.4 Regulatory Alerts
10 alertas simuladas de actualizaciones regulatorias:
- Severidades: Critical, Warning, Info
- Filtros por categoria, severidad, no leidas
- Acciones requeridas por alerta

### 7.5 Python — Pyodide Runner
**Nuevo en v23.** Ejecute Python en el browser:

**5 ejemplos pre-cargados:**
1. Shielding Calculation (NCRP 151)
2. Point Kernel Dose Calculation
3. Radioactive Decay Calculator (F-18, Co-60, Ir-192)
4. MCNP6 Input Generator
5. TVL Reference Table Generator

**Uso:**
1. Abra Normativas > Python — Pyodide Runner
2. Haga clic en "Load Python" (carga Pyodide v0.25.0)
3. Seleccione un ejemplo del dropdown
4. Haga clic en "Run" para ejecutar
5. Use "Copy" para copiar codigo a su entorno local

**Nota**: Pyodide no se carga desde CDN por defecto. Configure `VITE_PYODIDE_URL` con un bundle local o active `VITE_ENABLE_PYODIDE_CDN=true` si acepta usar red externa. Los calculos se ejecutan localmente en WebAssembly.

---

## 8. Menu Industrial

### 8.1 Proteccion Radiologica Industrial
**8 fuentes industriales:**
- Ir-192 (HDR NDT), Co-60 (gammagraphy), Cs-137 (gauging)
- Am-241 (smoke detectors), Se-75 (NDT light), Yb-169 (NDT light)
- Ra-226 (legacy), Pu-238 (RTG)

**5 zonas de control:**
| Zona | Dosis | Color |
|------|-------|-------|
| Rojo | > 100 mSv/h | Prohibido |
| Naranja | 25-100 mSv/h | Control estricto |
| Amarillo | 2.5-25 mSv/h | Controlado |
| Verde | < 2.5 mSv/h | Supervisado |
| Azul | < 0.25 mSv/h | Libre |

**6 tecnicas NDT**: Radiografia gamma, X-ray, UT, PT/MPI, ET, ACFM

**Normativas**: NCRP 144, IAEA RS-G-1.3, 10CFR34, ISO 3999

---

## 9. Menu Herramientas

### 9.1 AI Shielding Assistant
Chatbot con RAG (Retrieval Augmented Generation):
- 8 entradas de conocimiento NCRP 151/147
- Fuzzy matching para busqueda aproximada
- Citations por respuesta
- 6 preguntas rapidas pre-configuradas

### 9.2 Auto-Barrier Detection
Carga planos (DXF/PNG/PDF) y detecta automaticamente barreras con confidence scores.

### 9.3 PACS Integration
Integracion con sistemas PACS via DICOMweb:
- 8 vendors soportados (Orthanc, dcm4chee, Siemens, GE, etc.)
- Busqueda SmartSearch por paciente, modalidad, descripcion
- 8 estudios de demostracion pre-cargados
- Descarga via WADO-RS

### 9.4 Theme Engine
Personalizacion visual completa:
- 8 presets (Ocean, Forest, Ember, Aurora, etc.)
- 10 colores de acento
- Modo claro/oscuro
- Persistencia en localStorage

---

## 10. Flujo de Trabajo

### 10.1 Calculo de Blindaje — Paso a Paso
```
Paso 1: Crear Proyecto
  └─ Seleccionar template o empezar en blanco
  └─ Definir nombre, institucion, responsable

Paso 2: Configurar Fuente
  └─ Seleccionar radionuclido o equipo (LINAC, Co-60, etc.)
  └─ Especificar energia, actividad, workload
  └─ Definir posicion y orientacion

Paso 3: Dibujar Barreras
  └─ Usar herramientas del canvas
  └─ O importar plano DXF existente
  └─ Definir material y espesor de cada barrera

Paso 4: Ejecutar Calculo
  └─ NCRP 151/147 automatico
  └─ Verificar resultados en panel derecho
  └─ Revisar indicadores Pass/Fail

Paso 5: Validar
  └─ Ejecutar Plan Validator
  └─ Revisar Anomaly Detection
  └─ Comparar vs datos experimentales

Paso 6: Generar Reporte
  └─ Memoria Analitica PDF
  └─ Reporte CNSNS
  └─ Exportar datos CSV/PDF

Paso 7: Compliance (opcional)
  └─ Verificar checklist regulatorio
  └─ Comparar con regulacion aplicable
  └-- Revisar alertas regulatorias
```

### 10.2 Simulacion Monte Carlo
```
Paso 1: Configurar geometria
Paso 2: Definir fuente (espectro, posicion)
Paso 3: Configurar detectores
Paso 4: Seleccionar motor (Geant4/MCNP6/FLUKA)
Paso 5: Generar macro/input
Paso 6: Ejecutar (local o cloud)
Paso 7: Analizar resultados
```

---

## 11. Referencia Rapida de Teclado

| Atajo | Accion |
|-------|--------|
| `?` | Mostrar atajos de teclado |
| `Ctrl+K` | Command palette |
| `Ctrl+N` | Nuevo proyecto |
| `Ctrl+O` | Abrir proyecto |
| `Ctrl+S` | Guardar proyecto |
| `Ctrl+Z` | Deshacer |
| `Ctrl+Shift+Z` | Rehacer |
| `Ctrl+Enter` | Calcular blindaje |
| `Ctrl+E` | Exportar PDF |
| `Ctrl+M` | Memoria analitica |
| `B` | Modo barrera |
| `S` | Modo fuente |
| `V` | Modo vista |
| `+` / `-` | Zoom in/out |
| `0` | Reset zoom |
| `F` | Fullscreen canvas |

---

## 12. Solucion de Problemas

### Pantalla en blanco
- **Causa**: Bloqueador de scripts o cookies deshabilitadas
- **Solucion**: Deshabilite bloqueadores para este sitio. Verifique que JavaScript este activado.

### Dialog no abre
- **Causa**: Chunk aun no descargado (code splitting)
- **Solucion**: Espere 1-2 segundos. Si usa un despliegue estatico, verifique que los assets del directorio `dist` se hayan publicado completos.

### Calculo muy lento
- **Causa**: Muchas barreras o alta complejidad
- **Solucion**: Use el Web Worker (activado por defecto). Para Monte Carlo, use la opcion Cloud.

### Python no carga
- **Causa**: Pyodide no configurado para modo offline.
- **Solucion**: Configure `VITE_PYODIDE_URL`, active `VITE_ENABLE_PYODIDE_CDN=true` solo si acepta CDN, o use Code Export como alternativa.

### Error "SelectItem value empty"
- **Causa**: Resuelto en v24.0.1
- **Solucion**: Recargue la pagina con Ctrl+F5

---

## 13. Bibliografia

1. NCRP Report No. 151 (2005) — Structural Shielding Design for Megavoltage X- and Gamma-Ray Radiotherapy Facilities
2. NCRP Report No. 147 (2004) — Structural Shielding Design for Medical X-Ray Imaging Facilities
3. ICRP Publication 103 (2007) — The 2007 Recommendations of the ICRP
4. IAEA Safety Report Series No. 47 (2006) — Radiation Protection in the Design of Radiotherapy Facilities
5. CNSNS-LA-001/2018 — Guia para la elaboracion de la memoria de calculo de blindajes
6. NOM-008-ENER-2020 — Limites maximos permisibles de exposicion a radiaciones ionizantes
7. Euratom Council Directive 2013/59/Euratom — Basic Safety Standards
8. Archundia et al. (2004) — Measurements of TVLs for Co-60, 6, 10, 15, and 18 MV
9. McGinley (1998) — Shielding Techniques for Radiation Oncology Facilities
10. Walko et al., CPC 2022 — pyg4ometry: Python library for MC radiation transport geometries

---

**Document version**: v24.0
**Last updated**: 2026-06-02
**Platform**: RadShield-MX v24
**Total modules**: 121+
