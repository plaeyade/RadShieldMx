# Addendum F73 - Estabilizacion, DB, RAG, canvas y 3D

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
