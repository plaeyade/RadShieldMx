# Referencias (citas) y trazabilidad constante → fuente

Sólo citas bibliográficas: ningún PDF ni texto con licencia se versiona (ver `docs/fuentes-locales.md`).
La lista completa que muestra la app está en `src/lib/bibliography.ts`; este archivo dice qué fuente
respalda cada constante del motor y qué referencias están sustituidas o sin verificar.
Revisión: 2026-11-13.

## 1. Trazabilidad constante → fuente

| Módulo | Constante / dato | Fuente | Acceso |
|---|---|---|---|
| `src/lib/transmisionTG108.ts` | α, β, γ de transmisión de banda ancha a 511 keV (Pb, concreto 2.35 g/cm³, hierro) | Madsen MT et al. AAPM Task Group 108: PET and PET/CT Shielding Requirements. Med Phys 2006;33(1):4–15, Tabla V | Artículo (Med Phys) |
| `src/lib/tg108.ts`, `src/lib/autoatenuacionPaciente.ts` | Γ de F-18, absorción del paciente 0.36, R_t, F_U, vaciado vesical 0.85 | AAPM TG-108 (2006), Ec. 2–3 y 9–10 | ídem |
| `src/lib/ncrp151.ts`, `ncrp151Tables.ts`, `materialDatabase.ts` | TVL₁/TVLₑ primarios (Tabla B.2), a(θ) (B.4), TVL de dispersión (B.5a), TVL de fuga (B.7) | NCRP Report No. 151 (2005) | De pago (NCRP) |
| `src/lib/ncrp151Laberinto.ts` | Laberinto y puerta: Ec. 2.9–2.21; albedo (B.8a/B.8b); Q_n y H₀ (B.9) | NCRP 151 §2.4; McGinley y James 1997; Kersey 1979; Wu RK, McGinley PH. J Appl Clin Med Phys 2003;4:162–171 | NCRP de pago; Wu–McGinley abierto |
| `src/lib/ncrp147.ts` | K¹_P y W_norm (Tabla 4.5), K¹_sec (Tabla 4.7), mastografía (§5.5) | NCRP Report No. 147 (2004) | De pago (NCRP) |
| `src/lib/ncrpOccupancy.ts` | Factores de ocupación T | NCRP 147 Tabla 4.1 y tabla de factores de ocupación de NCRP 151 (cotejar el número de tabla: el código la cita de dos formas) | De pago |
| `src/lib/limitesDosis.ts` | POE 20 mSv/a (5 a), público 1 mSv/a; objetivos de diseño 0.1 y 0.02 mSv/semana | ICRP Publication 103 (2007); NCRP 147 §1.3; NCRP 151 §1.2; AAPM TG-108 | ICRP 103 abierto |
| `src/lib/terapiaEspectroGP.ts` | Coeficientes GP de exposición de Pb, Fe y concreto, filas de 0.03–0.05 y 1.5–2 MeV (seguimiento de #57: Tl-201, Ga-67, Zr-89) | Trubey DK. *New Gamma-Ray Buildup Factor Data for Point Kernel Calculations: ANS-6.4.3 Standard Reference Data*. NUREG/CR-5740, ORNL/RSIC-49/R1, 1991, Tabla 5.1 (Pb p. impresa 92, Fe 85, concreto 96; mismos datos que ANSI/ANS-6.4.3-1991); las filas de 0.06–1 MeV coinciden con las de ORNL/RSIC-49 | Informe NRC/ORNL (abierto, OSTI doi:10.2172/7032799) |
| `src/lib/terapiaEspectroGP.ts` | Coeficientes GP de exposición (b, c, a, X_k, d) de Pb, Fe y concreto NBS, 0.06–1 MeV; fórmula GP; validez 0.5–40 mfp; µ sin coherente para contar mfp y para el haz estrecho del criterio (a) (la dispersión coherente no cuenta ni como atenuación ni como buildup) | Trubey DK. *New Gamma-Ray Buildup Factor Data for Point Kernel Calculations: ANS-6.4.3 Standard Reference Data*. ORNL/RSIC-49, Oak Ridge National Laboratory, 1988: Ap. II (borrador ANSI/ANS-6.4.3, base de ANSI/ANS-6.4.3-1991) sec. 2 (fórmula) y 4.1, Tabla 5.1 (coeficientes); verificación contra la Tabla 3 (37 valores, ≤ 2.2 %; en Pb, además, las 48 filas de 0.1, 0.15 y 0.2 MeV, PDF p. 63: ≤ 1.2 % a 0.15–0.2 MeV y ±11 % a 0.1 MeV, calidad del ajuste junto al borde K) | Informe ORNL (abierto) |
| `src/lib/terapiaEspectroGP.ts` | Líneas γ de I-131 (9 líneas ≥ 0.1 %, sin rayos X de Xe) | Khazov Yu, Mitropolsky I, Rodionov A. Nuclear Data Sheets for A = 131. Nucl Data Sheets 2006;107:2715 (ENSDF/NNDC) | Abierto |
| `src/lib/terapiaEspectroGP.ts` | Líneas γ de Lu-177 ≥ 0.1 %: 71.6418 keV 0.164 %, 112.9498 keV 6.23 %, 208.3662 keV 10.41 % (normalización, NR = 0.1041), 249.6742 keV 0.1997 %, 321.3159 keV 0.2186 % | Kondev FG. Nuclear Data Sheets for A = 177. Nucl Data Sheets 2019;159:1; ENSDF, desintegración β⁻ de 177Lu (6.6443 d), NNDC `ensnds/177/Hf/beta_decay_6.6443_d` | Abierto |
| `src/lib/terapiaEspectroGP.ts`, `nuclearMedicine.ts` | Líneas γ de I-123 ≥ 0.1 % (159.00 keV 83.6 %, 346.36 keV 0.120 %, 440.02 keV 0.388 %, 505.33 keV 0.288 %, 528.97 keV 1.27 %, 538.54 keV 0.31 %; NR = 0.8360) | Chen J. Nuclear Data Sheets for A = 123. Nucl Data Sheets 2021;174:1; ENSDF, desintegración ε de 123I (13.2230 h), NNDC `ensnds/123/Te/ec_decay_13.2230_h` | Abierto |
| `src/lib/terapiaEspectroGP.ts`, `nuclearMedicine.ts`, `spect/IPEMReport109.ts` | Líneas γ de Tc-99m (140.511 keV 89 %) | Browne E, Tuli JK. Nuclear Data Sheets for A = 99. Nucl Data Sheets 2017;145:25; ENSDF (NuDat 3), TI de 99mTc | Abierto |
| ídem | Líneas γ de Tl-201 ≥ 0.1 % (30.60 0.258 %, 32.19 0.263 %, 135.34 2.605 %, 165.88 0.147 %, 167.43 10.0 %; sin rayos X del Hg) | Kondev FG. Nuclear Data Sheets for A = 201. Nucl Data Sheets 2023;187:355; ENSDF, desintegración ε de 201Tl | Abierto |
| ídem | Líneas γ de In-111 (171.28 keV 90.7 %, 245.35 keV 94.1 %) | Blachot J. Nuclear Data Sheets for A = 111. Nucl Data Sheets 2009;110:1239; ENSDF, desintegración ε de 111In | Abierto |
| `terapiaEspectroGP.ts`, `IPEMReport109.ts` | Líneas γ de Ga-67 ≥ 0.1 % (91.265 3.11 %, 93.310 38.81 %, 184.576 21.41 %, 208.950 2.46 %, 300.217 16.64 %, 393.527 4.56 %, 887.688 0.148 %) | Huo J, Huang X, Tuli JK. Nuclear Data Sheets for A = 67. Nucl Data Sheets 2005;106:159; ENSDF | Abierto |
| ídem | Líneas γ de Sm-153 ≥ 0.1 % (69.673 4.67 %, 75.422 0.19 %, 83.367 0.191 %, 89.486 0.157 %, 97.431 0.763 %, 103.180 29.14 %) | Nica N. Nuclear Data Sheets for A = 153. Nucl Data Sheets 2020;170:1; ENSDF, β⁻ de 153Sm | Abierto |
| `terapiaEspectroGP.ts`, `nuclearMedicine.ts` | Líneas de Zr-89 ≥ 0.1 % (aniquilación 511 keV 45.5 %, 909.15 keV 99.04 %, 1657.3 0.106 %, 1713.0 0.745 %, 1744.5 0.123 %) | Singh B. Nuclear Data Sheets for A = 89. Nucl Data Sheets 2013;114:1; ENSDF | Abierto |
| `src/lib/terapiaEspectroGP.ts` | Umbral de líneas único (Iγ ≥ 0.1 %, también en la biblioteca, antes 1 %) y línea del criterio (a) = la más energética que lo cumple (I-131 722.9 keV; Lu-177 321.3 keV); en diagnóstico, (a) sólo si esa línea pesa ≥ 50 % del kerma (Tc-99m, Tl-201, In-111, Sm-153; no I-123, Ga-67, Zr-89) | Decisión del proyecto (revisiones del PR #57) | — |
| `src/lib/terapiaEspectroGP.ts` | µ/ρ con coherente (`XCOM_MU_RHO_MALLA`: W↔Pb y controles; el haz estrecho del criterio (a) usa desde la 2.ª revisión del #58 el µ/ρ SIN coherente de la línea dura, como ORNL/RSIC-49, contrastado con la columna «sin coherente» de XCOM, `muRhoSinCohLineas`) de Pb, W, Fe y concreto ordinario en malla fina (20/década, líneas duras, bordes K/L de Pb y W), generada por `scripts/fase11_xcom_malla.py` desde la base de datos de XCOM (`MDATX3.zzz`, spline cúbico log-log por proceso; reproduce SRD 126 a ±0.05 %); µ_en/ρ del aire (peso por kerma) | Berger MJ, Hubbell JH, Seltzer SM et al. XCOM: Photon Cross Sections Database, NIST SRD 8 (NBSIR 87-3597); Hubbell JH, Seltzer SM. NIST SRD 126 | Abierto |
| `src/lib/spect/IPEMReport109.ts` | Yeso tratado como concreto ordinario de la misma masa: µ/ρ del CaSO₄·2H₂O (H 2.34, O 55.76, S 18.62, Ca 23.28 % en masa) ≥ concreto en 0.03–1 MeV (×1.10 a 100 keV, ×1.004 a 1 MeV, XCOM): conservador | McConn RJ Jr, Gesh CJ, Pagh RT, Rucker RA, Williams RG III. Compendium of Material Composition Data for Radiation Transport Modeling. PNNL-15870 Rev. 1, Pacific Northwest National Laboratory, 2011 («Gypsum (Plaster of Paris)»); NIST SRD 8 | Abierto |
| `src/lib/terapiaEspectroGP.ts` | µ/ρ sin coherente (fotoeléctrico + incoherente) por línea; por encima de 0.8 MeV, NIST SRD 126 total − coherente de Elam a 0.8 MeV·(0.8/E)² (`scripts/fase11_diagnostico_gp.py`) | Elam WT, Ravel BD, Sieber JR. Radiat Phys Chem 2002;63:121–128 (tablas de xraydb 4.6.1; = NIST ±1 %); concreto con la composición «Concrete, Ordinary» de NIST SRD 126 | Artículo / tablas abiertas |
| `src/lib/terapiaEspectroGP.ts` | Ajuste de Archer de haz ancho de I-131 (Pb α 0.1082, β 0.2072, γ 0.5385; concreto α 0.02062, β −0.01220, γ 0.4179; x en mm) | Oumano M et al. J Appl Clin Med Phys 2025;26(5):e70084 | Abierto (PMC) |
| `src/lib/terapiaEspectroGP.ts` | Regla adoptada: espesor = mayor entre haz estrecho a la línea más energética (CNSNS) y haz ancho del espectro con GP; en concreto, max(Oumano, 1.2·GP) | Decisión del proyecto (análisis I-131 GP vs MC, 2026-11) | — |
| `src/lib/materialDatabase.ts` | Piso por masa de las TVL no tabuladas (envolvente concreto/acero; tungsteno por plomo) | NCRP 151 Tablas B.2 y B.7 (equivalencia por masa) | De pago (NCRP) |
| `src/lib/materialDatabase.ts`, `src/lib/equivalenciaWPb.ts` | Equivalencia W↔Pb por masa DEPENDIENTE DE LA ENERGÍA y de la aleación (revisión del #58; antes factor único 1.054–1.059 con W puro): F = máx. de (µ/ρ)_Pb/(µ/ρ)_aleación en las energías que rigen (líneas del espectro; MV de 1.0 MeV a la nominal, 2.ª revisión del #58; Co-60 sus dos líneas), regla de mezcla de Bragg; aleación del catálogo 17.0 g/cm³ = peor caso de la clase 1 (90W-7Ni-3Fe / 90W-6Ni-4Cu): Co-60 1.064, 6 MV 1.082, 18 MV 1.098, 511 keV 1.21, 140.5 keV 1.39; entre los bordes K de W y Pb (69.5–88 keV) f < 1 | Berger MJ et al. NIST XCOM (SRD 8), µ/ρ de Pb, W, Ni, Fe y Cu (`scripts/fase11_xcom_malla.py`); Hubbell JH, Seltzer SM, NIST SRD 126 (control ±0.05 %); ASTM B777-15, Standard Specification for Tungsten Base, High-Density Metal (clases 1–4: 90–97 % W, 16.85–18.85 g/cm³) | Abierto (ASTM de pago: sólo W % y densidad) |
| `src/lib/nuclearMedicine.ts`, `src/lib/spect/IPEMReport109.ts` | HVL/TVL mostradas de los nucleidos con espectro (I-131, Lu-177, I-123, Tc-99m, Tl-201, In-111, Zr-89; IPEM 109 además Ga-67 y Sm-153) = primer espesor de la regla espectral (B = 0.5 y 0.1); el cálculo usa la curva entera. IPEM 109 (2014) no se pudo contrastar (de pago): sus valores no se copian | Las de `terapiaEspectroGP.ts` (arriba). Sustituyen a las citas anteriores de Tl-201 (Kondev 2007;108:365) y Tc-99m (Browne y Tuli 2011;112:275), que eran evaluaciones ENSDF previas | Abierto |
| `src/lib/xcomAttenuation.ts` | µ/ρ y µ_en/ρ | Berger MJ et al. XCOM: Photon Cross Sections Database (NIST SRD 8); Hubbell JH, Seltzer SM, NIST SRD 126 | Abierto |
| `src/lib/phyXData.ts` | Zeff, EABF, EBF, FNRCS | Şakar E et al. Phy-X/PSD. Radiat Phys Chem 2020;166:108496 | Artículo |
| `src/lib/normativaMx.ts` | Zonas de radiación y contaminación | NOM-008-NUCL-2024 (DOF 24-05-2024) | Abierto (DOF) |
| `src/lib/normativaMx.ts`, `controlledZoneFeasibility.ts` | Requisitos de medicina nuclear | NOM-040-NUCL-2016 (DOF 04-08-2016) | Abierto (DOF) |
| `src/lib/normativaMx.ts` | Egreso de pacientes | NOM-013-NUCL-2009 | Abierto (DOF) |
| `src/lib/normativaMx.ts` | Teleterapia con aceleradores | NOM-033-NUCL-2016 (DOF 04-08-2016) | Abierto (DOF) |
| `src/lib/ventilacionBunker.ts` | Aviso por debajo de 3 renovaciones/h en la bóveda | Decisión del proyecto. ANSI/ASHRAE/ASHE Standard 170-2021, *Ventilation of Health Care Facilities*. ASHRAE, Peachtree Corners (GA), 2021 (sustituye a la 170-2017), no tiene fila para bóveda de ciclotrón ni búnker de linac; la más cercana, «Cancer treatment area» (Tabla 8-1), pide 6 renovaciones/h totales y 2 de aire exterior. El hot lab de medicina nuclear (Tabla 7-1) pide presión negativa, 6 renovaciones/h y todo el aire extraído al exterior | De pago (ASHRAE) |
| Bloques HD (`docs/validacion-bloques-hd.md`) | Atenuación medida de bloques de alta densidad | ININ, informe técnico LSCD-589 (2024) | Informe de laboratorio |

Datos de buildup del método punto-kernel: Trubey DK, ORNL/RSIC-49, 1988, y su revisión NUREG/CR-5740 (ORNL/RSIC-49/R1,
1991) (en uso en `terapiaEspectroGP.ts`; la norma
ANSI/ANS-6.4.3-1991 está retirada); Shimizu A, Onda T, Sakamoto Y. J Nucl Sci Technol 2004;41(4):413–424 (sin GP de
barita ni de concreto pesado: queda abierto).

## 2. Guías de diseño citadas (no transcritas)

- IAEA. *Radiation Protection in the Design of Radiotherapy Facilities*. Safety Reports Series No. 47. Viena, 2006.
- IAEA. *Radiation Protection and Safety in Medical Uses of Ionizing Radiation*. SSG-46. Viena, 2018 (sustituye a RS-G-1.5, 2002).
- IAEA. *Radiation Protection and Safety of Radiation Sources: International Basic Safety Standards*. GSR Part 3. Viena, 2014.
- NCRP Report No. 144, *Radiation Protection for Particle Accelerator Facilities* (2003).
- IPEM Report 75, 2.ª ed. (2017) e IPEM Report 109 (2014) (de pago).
- McGinley PH. *Shielding Techniques for Radiation Oncology Facilities*, 2.ª ed. Medical Physics Publishing, 2002.
- NRC. NUREG-1556 vol. 9 rev. 3, *Program-Specific Guidance About Medical Use Licenses* (2019).
- ANSI/ASHRAE/ASHE Standard 170-2021, *Ventilation of Health Care Facilities*. ASHRAE, Peachtree Corners (GA), 2021 (sustituye a la 170-2017) (de pago; sustituye a la 170-2013).

## 3. Sustituidas o por verificar

| Referencia en el código | Estado | Acción |
|---|---|---|
| NOM-008-NUCL-2011 (`internationalRegulations.ts`, `normativaMx.ts`) | Sustituida por NOM-008-NUCL-2024 | Ya marcada como derogada; mantener sólo como antecedente |
| NOM-033-NUCL-1999 | Sustituida por NOM-033-NUCL-2016 | Ya marcada |
| Reglamento General de Seguridad Radiológica (1988): POE 50 / público 5 mSv | Histórico frente a ICRP 103 | `limitesDosis.ts` ya lo marca |
| «NOM-036-NUCL-2020, uso de radiofármacos en seres humanos» (`bibliography.ts`) | **Sin verificar**: la NOM-036-NUCL vigente que se localiza es la 2001 (instalaciones de desechos radiactivos) | Revisar contra el DOF antes de citar |
| «NOM-012-NUCL-2015, instalaciones de ciclotrón» (`bibliography.ts`) | **Sin verificar**: no se localizó con ese título | Revisar contra el DOF antes de citar |
| «NOM-003-NUCL-1999 radiofarmacia», «NOM-036-NUCL-2013 residuos» (`bunkerLayouts.ts`) | **Sin verificar** (año y título) | Revisar contra el catálogo de NOM de Economía |
| NOM-002-SSA3-2007 (radioterapia), si se cita | Sustituida por NOM-002-SSA3-2017 | Citar la 2017 |
