# Referencias (citas) y trazabilidad constante → fuente

Sólo citas bibliográficas: ningún PDF ni texto con licencia se versiona (ver `docs/fuentes-locales.md`).
La lista completa que muestra la app está en `src/lib/bibliography.ts`; este archivo dice qué fuente
respalda cada constante del motor y qué referencias están sustituidas o sin verificar.
Revisión: 2026-11-12.

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
| `src/lib/terapiaEspectroGP.ts` | Coeficientes GP de exposición (b, c, a, X_k, d) de Pb, Fe y concreto NBS, 0.06–1 MeV; fórmula GP; validez 0.5–40 mfp; µ sin coherente para contar mfp | Trubey DK. *New Gamma-Ray Buildup Factor Data for Point Kernel Calculations: ANS-6.4.3 Standard Reference Data*. ORNL/RSIC-49, Oak Ridge National Laboratory, 1988: Ap. II (borrador ANSI/ANS-6.4.3, base de ANSI/ANS-6.4.3-1991) sec. 2 (fórmula) y 4.1, Tabla 5.1 (coeficientes); verificación contra la Tabla 3 (37 valores, ≤ 2.2 %) | Informe ORNL (abierto) |
| `src/lib/terapiaEspectroGP.ts` | Líneas γ de I-131 (9 líneas ≥ 0.1 %, sin rayos X de Xe) | Khazov Yu, Mitropolsky I, Rodionov A. Nuclear Data Sheets for A = 131. Nucl Data Sheets 2006;107:2715 (ENSDF/NNDC) | Abierto |
| `src/lib/terapiaEspectroGP.ts` | Líneas γ de Lu-177 (112.95 keV 6.23 %, 208.37 keV 10.41 %) | Kondev FG. Nuclear Data Sheets for A = 177. Nucl Data Sheets 2019;159:1 (ENSDF/NNDC) | Abierto |
| `src/lib/terapiaEspectroGP.ts` | µ/ρ con coherente (haz estrecho) de Pb, Fe y concreto ordinario; µ_en/ρ del aire (peso por kerma) | Hubbell JH, Seltzer SM. NIST SRD 126 (X-Ray Mass Attenuation Coefficients) | Abierto |
| `src/lib/terapiaEspectroGP.ts` | µ/ρ sin coherente (fotoeléctrico + incoherente) por línea | Elam WT, Ravel BD, Sieber JR. Radiat Phys Chem 2002;63:121–128 (tablas de xraydb 4.6.1; = NIST ±1 %) | Artículo / tablas abiertas |
| `src/lib/terapiaEspectroGP.ts` | Ajuste de Archer de haz ancho de I-131 (Pb α 0.1082, β 0.2072, γ 0.5385; concreto α 0.02062, β −0.01220, γ 0.4179; x en mm) | Oumano M et al. J Appl Clin Med Phys 2025;26(5):e70084 | Abierto (PMC) |
| `src/lib/terapiaEspectroGP.ts` | Regla adoptada: espesor = mayor entre haz estrecho a la línea más energética (CNSNS) y haz ancho del espectro con GP; en concreto, max(Oumano, 1.2·GP) | Decisión del proyecto (análisis I-131 GP vs MC, 2026-11) | — |
| `src/lib/materialDatabase.ts` | Piso por masa de las TVL no tabuladas (envolvente concreto/acero; tungsteno por plomo) | NCRP 151 Tablas B.2 y B.7 (equivalencia por masa) | De pago (NCRP) |
| `src/lib/xcomAttenuation.ts` | µ/ρ y µ_en/ρ | Berger MJ et al. XCOM: Photon Cross Sections Database (NIST SRD 8); Hubbell JH, Seltzer SM, NIST SRD 126 | Abierto |
| `src/lib/phyXData.ts` | Zeff, EABF, EBF, FNRCS | Şakar E et al. Phy-X/PSD. Radiat Phys Chem 2020;166:108496 | Artículo |
| `src/lib/normativaMx.ts` | Zonas de radiación y contaminación | NOM-008-NUCL-2024 (DOF 24-05-2024) | Abierto (DOF) |
| `src/lib/normativaMx.ts`, `controlledZoneFeasibility.ts` | Requisitos de medicina nuclear | NOM-040-NUCL-2016 (DOF 04-08-2016) | Abierto (DOF) |
| `src/lib/normativaMx.ts` | Egreso de pacientes | NOM-013-NUCL-2009 | Abierto (DOF) |
| `src/lib/normativaMx.ts` | Teleterapia con aceleradores | NOM-033-NUCL-2016 (DOF 04-08-2016) | Abierto (DOF) |
| Bloques HD (`docs/validacion-bloques-hd.md`) | Atenuación medida de bloques de alta densidad | ININ, informe técnico LSCD-589 (2024) | Informe de laboratorio |

Datos de buildup del método punto-kernel: Trubey DK, ORNL/RSIC-49, 1988 (en uso en `terapiaEspectroGP.ts`; la norma
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
