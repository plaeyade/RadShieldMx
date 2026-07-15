# RadShield-MX vs RayXpert — Analisis Comparativo Detallado

> Documento generado: 2026-06-02 | RadShield-MX v24 | RayXpert v1.9+

---

## 1. Ficha Tecnica de RayXpert

**Desarrollador**: TRAD Tests & Radiations (Francia, Toulouse)
**Sitio web**: www.rayxpert.com
**Primera version**: ~2000s (fisica redevelop desde Geant4)
**Version actual**: v1.9 (mayo 2023)
**Licencia**: Comercial, anual, dongle USB (EUR 50 reemplazo)
**Plataforma**: Windows nativo (cliente), Servidor opcional (cloud)
**Releases**: 1 major release cada 18 meses + updates continuos
**Soporte**: Incluido en licencia, tiempo promedio resolucion 1 hora

### Motor de Calculo
- **Metodo**: Monte Carlo 3D propio (fisica basada en Geant4, redevelop completo por TRAD)
- **Geometria**: Boundary Representation (B-Rep) — NO Constructive Solid Geometry (CSG)
- **Ventaja B-Rep**: Importa STEP files directamente, modela geometrias complejas imposibles en CSG, no requiere world cell
- **Particulas**: Fotones, electrones, positrones, neutrones (ENDF/B-VII.1)
- **Procesos fisicos**: Rayleigh scattering, Compton, fotoeléctrico, produccion de pares, bremsstrahlung, aniquilacion
- **Energia**: 1 keV - 100 GeV para fotones; 1 keV - 100 GeV para electrones/positrones

### Librerias Integradas
- **Materiales**: NIST (National Institute of Standards and Technology)
- **Radioelementos**: JEFF-3.1.1 y EAF-2010
- **Personalizacion**: Usuario puede crear materiales y fuentes custom

---

## 2. Matriz Comparativa — Features

| Feature | RadShield-MX v24 | RayXpert v1.9 | Ventaja |
|---------|-------------------|---------------|---------|
| **PLATAFORMA** |
| Web-based (sin instalacion) | SI | NO | RadShield |
| Windows nativo | NO | SI | RayXpert |
| macOS | SI | NO | RadShield |
| Linux | SI | NO | RadShield |
| Mobile/tablet | SI (responsive) | NO | RadShield |
| Offline capability | Parcial (PWA) | SI completo | RayXpert |
| **GEOMETRIA** |
| Modelado 3D CAD | Import STEP/IGES (plan) | Import STEP nativo + B-Rep | RayXpert |
| Modelado 2D top-down | SI completo | Limitado | RadShield |
| Import DXF | SI completo | Parcial | RadShield |
| Import DICOM RT | SI | NO | RadShield |
| Import point cloud (LiDAR) | SI | NO | RadShield |
| Overlap detection | Planificado | SI automatico + correccion | RayXpert |
| **MOTOR DE CALCULO** |
| Monte Carlo nativo | NO (macro generation) | SI completo 3D | RayXpert |
| Semi-empirico (NCRP 151/147) | SI completo | NO (solo MC) | RadShield |
| Point kernel | SI | SI | Empate |
| Neutron transport | Planificado (v25) | SI (ENDF/B-VII.1) | RayXpert |
| Time decay (Bateman eqs) | Parcial (F-18 decay map) | SI completo con solver | RayXpert |
| **PARTICULAS** |
| Fotones (gamma/X-ray) | SI | SI | Empate |
| Electrones/positrones | Planificado | SI (line + beta spectrum) | RayXpert |
| Neutrones | Planificado | SI (opcional) | RayXpert |
| Multi-source simultaneo | SI (v22, 8 fuentes) | SI | Empate |
| Multi-detector simultaneo | SI (v22, 5 tipos) | SI | Empate |
| **BIASING / OPTIMIZACION** |
| Weight window biasing | SI (v22, 5 tecnicas) | SI (automatico) | Empate |
| Importance map generation | NO | En desarrollo | RayXpert |
| Russian roulette | SI (v22) | SI (weight windows) | Empate |
| Splitting | SI (v22) | SI (weight windows) | Empate |
| Force collision | SI (v22) | NO | RadShield |
| TTB approximation | NO | SI | RayXpert |
| **RESULTADOS Y MAPEO** |
| 3D dose mapping | SI (Three.js, v21) | SI (tetrahedral mesh) | Empate* |
| Animated dose maps | SI (v21, requestAnimationFrame) | NO | RadShield |
| Flux mapping | SI | SI | Empate |
| VR/AR preview | SI (WebXR, v21) | NO | RadShield |
| Point cloud comparison | SI (v21) | NO | RadShield |
| **REGULACIONES** |
| Base de datos regulatoria | 15 regulaciones (v23) | NO | RadShield |
| Regulatory comparison tool | SI (v23) | NO | RadShield |
| Compliance checklists | 28 items, 3 checklists (v23) | NO | RadShield |
| Regulatory alerts | 10 alertas simuladas (v23) | NO | RadShield |
| Memoria analitica auto (PDF) | SI completo | NO | RadShield |
| Reporte CNSNS | SI | NO | RadShield |
| **AUTOMATIZACION E IA** |
| AI Assistant (RAG) | SI (v21, 8 refs NCRP) | NO | RadShield |
| Auto-barrier detection | SI (v21) | NO | RadShield |
| Predictive material optimizer | SI (v21) | NO | RadShield |
| Anomaly detection | SI (v21) | NO | RadShield |
| Auto-fill equipment (10 equipos) | SI (v21) | NO | RadShield |
| Scripting engine | NO | SI (ChaiScript) | RayXpert |
| **INTEGRACIONES** |
| Python (Pyodide/WebAssembly) | SI (v23, 5 ejemplos) | NO | RadShield |
| PACS DICOM | SI (v22, 8 vendors) | NO | RadShield |
| Geant4 macro export | SI (v21) | NO | RadShield |
| MCNP6 input export | SI (v21) | NO | RadShield |
| FLUKA input export | SI (v21) | NO | RadShield |
| GDML export (pyg4ometry) | SI (v22) | NO | RadShield |
| BIM connector | SI (v20, BIMRAD 9 pasos) | NO | RadShield |
| Real-time collaboration | SI (v20) | NO | RadShield |
| Video tutorial generator | SI (v21) | NO | RadShield |
| **VALIDACION** |
| Validacion vs MCNP | Referenciado | Validado por IRSN (Francia) | Empate |
| Validacion experimental | SI (7 refs TVL, v21) | Limitada | RadShield |
| Experimental validation dialog | SI (metrica En, v21) | NO | RadShield |
| Plan validator | SI completo | Basico | RadShield |
| Audit trail | SI | SI (v1.9+) | Empate |
| **PRECIO Y ACCESO** |
| Precio | Gratuito | Licencia anual (EUR ~5k-15k) | RadShield |
| Dongle USB | NO | SI (EUR 50 reemplazo) | RadShield |
| Soporte tecnico | Documentacion + manual | 1h tiempo respuesta promedio | RayXpert |
| Training incluido | Tutorial interactivo | SI (con licencia activa) | Empate |

*Nota: El 3D mapping de RayXpert usa malla tetrahedral fisica; el de RadShield-MX usa Three.js con decaimiento simulado.

---

## 3. Ventajas Competitivas de RadShield-MX

### 3.1 Accesibilidad y Plataforma
- **Multiplataforma**: Web, macOS, Linux, tabletas (RayXpert solo Windows)
- **Sin instalacion**: Accede desde cualquier navegador
- **Sin dongle USB**: No depende de hardware fisico
- **Gratuito**: Costo cero vs EUR 5,000-15,000 anuales

### 3.2 Metodologia Semi-Empirica (NCRP)
- **NCRP 151/147 integrados**: RayXpert no tiene metodologia semi-empirica; solo MC puro
- **Memoria analitica CNSNS auto-generada**: RayXpert no genera reportes regulatorios
- **Workflow medico optimizado**: Diseñado para fisicos medicos, no ingenieros nucleares

### 3.3 Regulaciones y Compliance
- **15 regulaciones en DB**: ICRP, IAEA, NCRP, CNSNS, Euratom — unico en el mercado
- **Comparacion regulatoria**: Side-by-side con dose limits
- **Compliance checklists**: 28 items verificables con progreso
- **Regulatory alerts**: Alertas de actualizaciones regulatorias

### 3.4 Inteligencia Artificial y Automatizacion
- **AI Assistant con RAG**: 8 referencias NCRP con fuzzy matching
- **Auto-barrier detection**: Deteccion automatica en planos DXF/PNG
- **Predictive material optimizer**: Optimizacion multi-criterio
- **Anomaly detection**: 8 checks automaticos

### 3.5 Integraciones Modernas
- **Python Pyodide**: Ejecuta Python en el browser
- **PACS DICOM**: 8 vendors soportados
- **VR/AR**: Preview inmersivo con WebXR
- **Video tutorials**: Generacion automatica
- **Real-time collaboration**: Multi-usuario
- **BIM connector**: BIMRAD 9 pasos

---

## 4. Gaps vs RayXpert — Que Falta Implementar

### 4.1 CRITICO — Motor Monte Carlo Nativo

**Gap**: RadShield-MX solo GENERA macros para Geant4/MCNP6/FLUKA. No ejecuta MC nativamente.

**Impacto**: Los usuarios necesitan instalar y ejecutar el codigo MC externamente.

**Sugerencia de implementacion**:
```
Eje 6: Native Monte Carlo Engine
- Motor MC simplificado en TypeScript/WebAssembly
- Fisica limitada: fotones (rayleigh, compton, fotoeléctrico)
- Geometria B-Rep via Three.js meshes
- 10^6 - 10^7 historias en ~30s (WebAssembly)
- Resultados: H*(10), flux, dosis absorbida
- Convergence indicators en tiempo real
```

**Prioridad**: ALTA | **Esfuerzo estimado**: 2-3 semanas | **Referencia**: paper EPJ N 2024 (Dray et al.)

### 4.2 CRITICO — STEP File Import Nativo

**Gap**: El import STEP esta planificado pero no implementado completamente.

**Impacto**: No se pueden importar modelos CAD complejos (CATIA, SolidWorks) directamente.

**Sugerencia**:
```
- Usar OCC.js (OpenCascade en WebAssembly) para parsear STEP
- Convertir B-Rep a Three.js mesh
- Validar geometria importada (overlap detection)
```

**Prioridad**: ALTA | **Esfuerzo**: 1 semana | **Ref**: pyg4ometry STEP import

### 4.3 ALTO — Neutron Transport

**Gap**: RayXpert soporta neutrones con ENDF/B-VII.1. RadShield-MX no.

**Impacto**: No se pueden calcular blindajes para instalaciones con neutrones (LINAC >10 MV, reactores).

**Sugerencia**:
```
- Integrar datos ENDF/B-VII.1 (archivo ~500 MB, usar lazy loading)
- Procesos: scattering elastico/inelastico, captura radiativa, fision
- Fisica simplificada con punto de vista de proteccion radiologica
```

**Prioridad**: ALTA | **Esfuerzo**: 2 semanas | **Ref**: NCRP 144, IAEA SRS 47

### 4.4 ALTO — Time Decay Solver (Bateman Equations)

**Gap**: RayXpert tiene solver completo de Bateman. RadShield-MX solo tiene decaimiento simple F-18.

**Impacto**: No se puede modelar evolucion temporal de fuentes complejas (equilibrio secular).

**Sugerencia**:
```
- Implementar cadena de decaimiento para 100+ radionuclidos
- Solver Bateman con cadena de hasta 10 generaciones
- Visualizacion temporal con timeline interactivo
```

**Prioridad**: ALTO | **Esfuerzo**: 1 semana | **Ref**: ICRP 107

### 4.5 ALTO — Librerias NIST + JEFF/EAF

**Gap**: RayXpert tiene librerias NIST (materiales) y JEFF/EAF (radioelementos) integradas.

**Impacto**: El usuario debe definir materiales manualmente.

**Sugerencia**:
```
- Integrar base de datos NIST XCOM (attenuation coefficients)
- 3,000+ materiales pre-definidos
- 2,500+ radionuclidos con espectros de ICRP 107
- Busqueda por nombre, formula, densidad
```

**Prioridad**: ALTO | **Esfuerzo**: 1 semana

### 4.6 MEDIO — Convergence Indicators Reales

**Gap**: RadShield-MX muestra incertidumbre estimada. RayXpert tiene convergence indicators en tiempo real.

**Sugerencia**:
```
- Grafico en vivo de dosis vs numero de historias
- Bandas de incertidumbre (1 sigma, 2 sigma)
- Criterio de parada automatico (rel. unc. < target)
- Test de convergencia (reduced chi-square)
```

**Prioridad**: MEDIO | **Esfuerzo**: 3 dias

### 4.7 MEDIO — Scripting Engine (ChaiScript-like)

**Gap**: RayXpert tiene ChaiScript para automatizacion. RadShield-MX no.

**Sugerencia**:
```
- Usar Lua o JavaScript como lenguaje de scripting
- API expuesta: crear fuentes, barreras, ejecutar calculos
- Macros grabables (record user actions)
- Batch processing via scripts
```

**Prioridad**: MEDIO | **Esfuerzo**: 1 semana

### 4.8 MEDIO — Audit Trail Completo

**Gap**: RadShield-MX tiene audit trail basico. RayXpert v1.9 tiene tracking completo de modificaciones.

**Sugerencia**:
```
- Timestamp + usuario para cada modificacion
- Diff entre versiones del modelo
- Export de audit log (CSV/PDF)
- Firma digital de memoria analitica
```

**Prioridad**: MEDIO | **Esfuerzo**: 3 dias

### 4.9 BAJO — TTB Approximation

**Gap**: RayXpert tiene Thick Target Bremsstrahlung approximation.

**Impacto**: Mejora velocidad para fuentes de electrones.

**Sugerencia**: Implementar como opcion en motor MC nativo.

**Prioridad**: BAJO | **Esfuerzo**: 3 dias

---

## 5. Hoja de Ruta Recomendada para Cerrar Gaps

### v25 (Jul 2026) — Native Monte Carlo Foundation
| Modulo | Prioridad | Esfuerzo |
|--------|-----------|----------|
| Motor MC nativo (fotones, WebAssembly) | CRITICO | 3 semanas |
| STEP file import (OpenCascade.js) | CRITICO | 1 semana |
| Convergence indicators en tiempo real | MEDIO | 3 dias |
| Libreria NIST materials + JEFF radionuclidos | ALTO | 1 semana |

### v26 (Ago 2026) — Particulas Avanzadas
| Modulo | Prioridad | Esfuerzo |
|--------|-----------|----------|
| Neutron transport (ENDF/B-VII.1) | ALTO | 2 semanas |
| Electron/positron transport | ALTO | 2 semanas |
| Time decay solver (Bateman equations) | ALTO | 1 semana |
| TTB approximation | BAJO | 3 dias |

### v27 (Sep 2026) — Automatizacion y Validacion
| Modulo | Prioridad | Esfuerzo |
|--------|-----------|----------|
| Scripting engine (JavaScript/Lua) | MEDIO | 1 semana |
| Audit trail completo | MEDIO | 3 dias |
| Importancia map generation | MEDIO | 1 semana |
| Overlap detection automatico | ALTO | 1 semana |

---

## 6. Conclusion

### Posicionamiento Estrategico

**RayXpert** es un software de Monte Carlo 3D profesional para ingenieros nucleares. Su fortaleza esta en el motor MC nativo con geometria B-Rep y fisica de particulas completa. Es una herramienta de calculo puro.

**RadShield-MX** es una plataforma integral de proteccion radiologica para fisicos medicos. Su fortaleza esta en el workflow completo: calculo semi-empirico + regulaciones + compliance + IA + integraciones modernas. Es una plataforma de trabajo, no solo de calculo.

### Recomendacion

**Para cerrar la brecha critica** con RayXpert, RadShield-MX necesita implementar un **motor Monte Carlo nativo simplificado** (Eje 6). Esto convertiria a RadShield-MX en la unica plataforma web que combina:

1. Metodologia semi-empirica (NCRP) para calculos rapidos
2. Monte Carlo nativo para validacion detallada
3. Base de datos regulatoria completa
4. Compliance y certificacion
5. IA y automatizacion
6. Integraciones modernas (PACS, Python, VR)

Esta combinacion no existe en ningun software comercial hoy.

---

**Referencias**:
- Dray N. et al., "An overview of last decade's developments in RayXpert", EPJ Nuclear Sciences & Technologies, 2024
- Derreumaux S. et al., "Evaluation of RayXpert for shielding design of medical facilities", EPJ Web of Conferences, 2017
- www.rayxpert.com — Official website and documentation
- TRAD Tests & Radiations — Company information
