# RadShield-MX v50 — Manual de Usuario

## Contenido
1. Introduccion
2. Calculo de Blindaje NCRP 147/151
3. Analisis de Sensibilidad (Tornado) — NUEVO v50
4. Comparacion de Escenarios — NUEVO v50
5. Validacion NCRP — NUEVO v50
6. Blindaje PET (AAPM TG 108) — NUEVO v50
7. Blindaje SPECT (IPEM 109) — NUEVO v50
8. Blindaje Terapia Radionuclida — NUEVO v50
9. Skyshine (Chilton) — NUEVO v50
10. Cadenas de Decaimiento — NUEVO v50
11. Certificacion GMP Ciclotron — NUEVO v50
12. CT Scatter por Modelo — NUEVO v50
13. Bibliografia

---

## 1. Introduccion

RadShield-MX es un sistema profesional de calculo de blindajes radiologicos para Mexico, conforme a NOM-008-NUCL-2018, NOM-040-NUCL-2016, NCRP 147 (2004) y NCRP 151 (2005).

**Stack**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
**Version**: v50.3 | **Referencias**: 74 | **Modulos**: 180+

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
- **Meta de diseño**: uSv/semana (tipico: 100 para areas controladas)

---

## 3. Analisis de Sensibilidad (Tornado) — NUEVO v50

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

## 4. Comparacion de Escenarios — NUEVO v50

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

## 5. Validacion NCRP — NUEVO v50

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

## 6. Blindaje PET (AAPM TG 108) — NUEVO v50

**Menu**: Med. Nuclear → PET Shielding (v50) → AAPM TG 108 PET Shielding

Calculador dedicado para salas PET/CT con:
- 5 procedimientos pre-configurados (FDG oncologico, neurologico, cardiaco, DOTATATE, PSMA)
- 4 radionucleidos (F-18, Ga-68, Cu-64, Zr-89)
- Componente CT scatter (Dixon & Frey 2023)
- TVL especificos para PET (Concrete=170mm, Pb=5.8mm)

### Formula
Kerma semanal = N_pacientes × A_admin(GBq) × Γ(uSv·m²/GBq·h) × t_escaneo(h) / d²(m²)

---

## 7. Blindaje SPECT (IPEM 109) — NUEVO v50

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

## 8. Blindaje Terapia Radionuclida — NUEVO v50

**Menu**: Med. Nuclear → Therapy Shielding (v50) → Therapy Radionuclide Shielding

Para preparacion y administracion de:
- **Lu-177** (Lutathera, Pluvicto): Clase L
- **Y-90** (SIRT): Clase M
- **Ac-225** (Clase H)
- **I-131** (terapia tiroidea): Clase M
- **Ra-223** (Xofigo): Clase H
- **Pb-212** (Clase H)

### Clasificacion de salas
- **L** (Low): Lu-177 — Blindaje minimo
- **M** (Medium): Y-90, I-131 — Blindaje moderado
- **H** (High): Ac-225, Ra-223, Pb-212 — Blindaje pesado

---

## 9. Skyshine (Chilton) — NUEVO v50

**Menu**: Fisica → Chilton Skyshine

Calcula la dosis por dispersion atmosferica (skyshine) para instalaciones de radioterapia MV.

### Parametros
- Energia del haz (4-25 MV)
- Altura de la barrera sobre el techo
- Espesor del techo de concreto
- Angulo del haz respecto a la vertical

### Salida
- Grafica de dosis vs distancia
- Dosis maxima y distancia donde ocurre
- Correccion angular

---

## 10. Cadenas de Decaimiento — NUEVO v50

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

## 11. Certificacion GMP Ciclotron — NUEVO v50

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

## 12. CT Scatter por Modelo — NUEVO v50

**Menu**: (Integrado en calculo CT) → Seleccion de modelo

22 modelos de CT con factor kappa especifico:
- **GE**: LightSpeed VCT, Discovery CT750 HD, Revolution CT, Revolution Apex
- **Siemens**: Sensation 64, Definition AS+, Somatom Force, Somatom X.cite
- **Philips**: Brilliance 64, iCT 256, IQon Spectral, Incisive CT
- **Canon**: Aquilion 64, Aquilion ONE, Aquilion Prime, Aquilion Exceed LB

### Nota
El factor kappa varia 82% entre marcas. Usar el modelo especifico mejora la precision 0.5-13%.

---

## 13. Bibliografia

74 referencias indexadas:
- NCRP 147, 151, 144
- ICRP 103, 116, 128, 140
- IAEA SSG-46, TCS-88, STI/PUB/1342
- AAPM TG 108, TG 377
- IPEM Report 109
- WHO TRS 1025 Annex 2
- EMA CHMP/QWP/363827/2025
- EANM cGRPP 2021, QRM 2022
- ININ LANIDER (Mexico)

---

*Manual generado el 2025-06-03*
*Para soporte tecnico: incluir version v50.3 y captura de pantalla*
