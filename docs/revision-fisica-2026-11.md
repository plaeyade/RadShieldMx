# Revisión física del motor de cálculo — noviembre 2026

Alcance: `src/lib/shieldingMath.ts`, `src/hooks/useShieldingEngine.ts`, worker de blindaje, `useWASM`,
`cycloneKIUBEData.ts`, `nuclearMedicine.ts`, `nativeMCEngine.ts` (Compton) y catálogo de modalidades
(`src/types/radshield.ts`). Referencias: NCRP 147 (2004), NCRP 151 (2005), AAPM TG-108 (2006),
IAEA SRS-47, NRC RG 8.39, IBA Cyclone KIUBE SRG (MID 55672 Rev G).

Toda salida sigue siendo un **tamizaje de diseño**: requiere revisión de un físico médico calificado
y levantamiento radiométrico. Nada de esto sustituye la memoria analítica firmada.

## Corregido en este PR

| # | Severidad | Hallazgo | Efecto antes | Corrección |
|---|---|---|---|---|
| F1 | **Crítica** (sobre-diseño ×10) | Archer: α y β están en mm⁻¹ (NCRP 147) pero `archerTransmission` usaba x en cm. La inversa del worker y de `useWASM` además tenía mal la fórmula cerrada (sin γ). | 1 mm Pb transmitía 48 % (real ~2 %); espesores diagnósticos ~10× más gruesos. La prueba «concreto HVL 144 mm» fijaba el error (real ~14 mm). | x en mm; inversa cerrada correcta `x = ln[(B^−γ + β/α)/(1+β/α)]/(αγ)` en worker y WASM. |
| F2 | **Crítica** (sobre-diseño ×800–3000) | TC: faltaba κ. Se multiplicaba el DLP (mGy·cm) por f(θ) y d^1.5. | Kerma secundario a 1 m de 105 mGy/paciente (cuerpo) en vez de 0.126. | `K = κ·DLP·(1 m/d)²·g(θ)`, κ = 9×10⁻⁵ cm⁻¹ (cabeza) y 1.2 × 3×10⁻⁴ cm⁻¹ (cuerpo); g(θ) ≤ 1 sólo con perfil del fabricante. |
| F3 | **Crítica** (sub-diseño) | Ciclotrón en el motor genérico: Γ·A/d² con «1000–1200 μSv/h a 1 m» y TVL de fotones. IBA: 1.2×10⁸ μSv/h a 0° (KIUBE 180). | Muro de ~1.1 m donde se requieren ~2.2 m. El proyecto clínico (Centro Neuro) usa esa modalidad. | El motor genérico ya no publica espesor para ciclotrón y emite error de auditoría: usar el módulo de ciclotrón (Tabla 9 IBA) y el Monte Carlo de Cyclotron-SIM. |
| F4 | **Alta** (sub-diseño ×70) | Alta de paciente: la tasa a 1 m se comparaba con 5 mSv/h (5 mSv es una DOSIS total al público). | Un paciente con I-131 a 0.3 mSv/h pasaba el criterio secundario. | Límite = Γ × umbral de actividad (RG 8.39; I-131 ≈ 0.072 mSv/h). |
| F5 | **Alta** (MC sesgado) | Compton (Kahn) reutilizaba r1 para elegir rama y aceptar. | ⟨cosθ⟩ a 0.511 MeV = 0.47 (Klein-Nishina 0.29); a 0.1 MeV −0.57 (KN 0.12). | Kahn estándar (Everett-Cashwell/MCNP) con tres aleatorios; prueba contra KN integrado. |
| F6 | Media (sub-diseño ×2.4 en Cs-137) | Braquiterapia: Γ en «Gy·cm²/h» con un /100 sin unidades. | Ir-192 −10 %, Cs-137 −58 %. | Γδ kerma en aire: Ir-192 0.111, Cs-137 0.0779 μGy·m²/(MBq·h); actividad en Ci → MBq. |
| F7 | Media (sobre-diseño ×1000) | Medicina nuclear: `workloadValue` (MBq) se tomaba como GBq cuando faltaba `nuclearActivity_GBq`. | ×1000 de kerma. | MBq → GBq. |
| F8 | Media (sobre-diseño) | Factor de ocupación T nunca se aplicaba. | Espesor de más en áreas con T < 1. | `B = P / (K·T)` (NCRP 147/151); T inválido → 1 y aviso. |
| F9 | Media | `calculateCycloneConcreteThickness` ignoraba la dirección; extrapolaba en silencio; no reconocía «Cyclone KIUBE 180». | — (no se usaba en la app). | Escala por Tabla 8 (90°/180° vs 0°), marca extrapolación fuera de 200–230 cm, normaliza el modelo; 5 pruebas. |

Pruebas nuevas: `src/__tests__/lib/cycloneKIUBEData.test.ts`, `src/__tests__/lib/comptonKahn.test.ts` y
valores de referencia en `src/__tests__/lib/shieldingMath.test.ts` (Archer, κ de TC, HDR, PET).

## Pendiente (no se cambia aquí)

| # | Severidad | Hallazgo | Propuesta |
|---|---|---|---|
| P1 | Alta | Teleterapia: todas las barreras se calculan como primarias (`2 Gy × fracciones × U / d²`); no hay fuga (10⁻³·W, sin U), dispersión del paciente (a·W·F/400) ni factor IMRT; 2 Gy/fracción fijo. Conservador en secundarias, pero no es NCRP 151. | Implementar NCRP 151 §2–3 completo: W con factor IMRT, primaria/fuga/dispersión por barrera, TVL₁ + (n−1)·TVLₑ (hoy se usa sólo TVL₁: conservador). |
| P2 | Alta | Gamma Knife modelado como haz abierto de 15 Gy. Es autoblindado: lo que cuenta es la fuga del fabricante. | Datos de fuga del fabricante (Elekta) y cálculo de fuga. |
| P3 | Alta | Parámetros Archer de plomo inconsistentes: `MATERIALS` (2.246, 6.31, 0.629), worker (2.246, 5.73, 0.547), NCRP 147 cuarto de rayos X (2.346, 15.90, 0.4982). No está documentada la distribución de carga de cada juego. | Tabla A.1/C de NCRP 147 por distribución de carga y barrera (primaria/secundaria), con la fuente citada en GAMMA. Requiere el PDF íntegro de NCRP 147. |
| P4 | Media | Diagnóstico: K¹ por modalidad sin trazabilidad a NCRP 147 Tabla 4.5; no distingue primaria/secundaria ni aplica U; fluoroscopia `K1/3 × h × N` ad hoc. | Reemplazar por las tablas 4.5–4.7 con distribución de carga. |
| P5 | Media (conservador) | Medicina nuclear sin atenuación del paciente (0.36 en F-18, TG-108) ni decaimiento (Rₜ); actividad × 40 h continuas. | Modelo TG-108 por paciente: A₀, tiempos de captación/estudio, Rₜ y atenuación. |
| P6 | Media | Puntos de muestreo a 0.3 m sobre una normal fija: puede caer del lado de la fuente; no descuenta el espesor del muro. | Normal hacia el lado opuesto a la fuente y desplazamiento desde la cara exterior. |
| P7 | Media (no conservador) | MC nativo: la producción de pares deposita localmente y no emite los dos fotones de 511 keV; Rayleigh aproximado. | Emitir los fotones de aniquilación; usar el MC nativo sólo como ilustración hasta validarlo. |
| P8 | Media | `multiSourceDetector`: TVL por tramos fijos y buildup «1 + mfp·2/(1+mfp)» sin referencia. | Buildup GP (ANSI/ANS-6.4.3) o tablas de Berger con fuente. |
| P9 | Media | Criterio de alta basado en NRC; en México rige la normativa CNSNS/NOM. | Agregar el criterio nacional como perfil seleccionable. |
| P10 | **Bloqueante para evidencia** | `data/pdf/ncrp_151.pdf` está truncado (933 KB, sin páginas): por eso NCRP 151 nunca aparece en las citas de GAMMA. | Reponer el PDF original y reindexar en GAMMA. |

## Referencia cruzada con el Monte Carlo

La Tabla 9 de IBA (concreto 2350 kg/m³) da 0.40 μSv/h tras 230 cm para el KIUBE 180 a 0°. Los espesores
interinos del búnker (este 2.08 m, oeste 1.95 m, sur 1.82 m, techo 1.95 m) provienen del Monte Carlo
de Cyclotron-SIM con su propio término fuente, materiales y geometría; no son comparables uno a uno
con la Tabla 9 y se fijarán con el MC F90 completo.

## Segunda ronda — con NCRP 147 y NCRP 151 originales (02-11-2026)

Con los informes íntegros en inglés (indexados en GAMMA) se verificaron los datos del motor:

| # | Severidad | Hallazgo | Corrección |
|---|---|---|---|
| F10 | **Alta** (sub-diseño) | TVL del plomo para Co-60 = 11.3 mm; NCRP 151 Tabla B.2 da **4.0 cm** (3.5× bajo). Plomo a 511 keV 11.8 mm vs 16.6 mm. | Valores de NCRP 151 B.2 y TG-108. |
| F11 | Media (sub-diseño 7–10 %) | Concreto: TVL a 10 MV = 370 mm y a 15 MV = 410 mm; NCRP 151 B.2: TVL₁ 41 y 44 cm. Acero: 85–110 mm y Co-60 55 mm vs 10–11 cm y 7.0 cm. Acero a 511 keV 42 mm vs 6.5 cm (TG-108). | Valores de las tablas. |
| F12 | Alta (sub-diseño) | Plomo para Ir-192, Tc-99m e I-131: 3.0, 0.3 y 2.0 mm (valores de HVL o menores). | Provisionales de manual (16, 1.0 y 11 mm) hasta verificarlos con fuente en GAMMA. |
| F13 | **Alta** | Las «distribuciones de carga» diagnósticas del catálogo no son las de NCRP 147 (TG9): p. ej. «Tórax PA» K¹ = 0.17 mGy/paciente vs Chest Room **1.2** (Tabla 4.5, 7× bajo). | Nuevo módulo `src/lib/ncrp147.ts` con las Tablas 4.5, 4.6, 4.7, B.1 y C.1 transcritas, barreras primaria y secundaria, y pruebas que reproducen el ejemplo §5.2 (2.2 mm Pb) y la transmisión del Apéndice A (9.3×10⁻⁴ en 1.66 mm). **Pendiente: conectar el motor del lienzo a este módulo** (siguiente PR). |

Confirmado contra el original: κ de TC (9×10⁻⁵ y 1.2 × 3×10⁻⁴ cm⁻¹, NCRP 147 pp. 107–109), cuyo arreglo entró en F2.

Pendiente: hay otras tablas de materiales (`materialDatabase.ts`, `f510DiagnosticPetTvlPromotion.ts`) con valores propios; deben converger en una sola fuente con cita.

## Tercera ronda — motor normativo en el lienzo (02-11-2026)

- **P1 resuelto (teleterapia):** `src/lib/ncrp151.ts` + `normativeBarrierEngine.ts`. Primaria con TVL₁/TVLₑ;
  secundaria con fuga (carga IMRT, por omisión 50 % con C_I = 5) y dispersión del paciente por ángulo
  (por omisión 30°, conservador; `scatterAngle_deg` por barrera), combinadas con la regla de dos fuentes.
  Las pruebas reproducen NCRP 151 §7.1.1 (149.6 cm), §7.1.5 (55.6, 48 y 66.4 cm) y §7.1.4 (IMRT).
- **P3/P4 resueltos (diagnóstico):** el lienzo usa NCRP 147 por distribución TG9 (primaria Tabla 4.5/B.1,
  secundaria Tabla 4.7/C.1, columna de 135° por conservadurismo), resolviendo Σ Kᵢ·Bᵢ(x) = P/T con varias
  fuentes. Fluoroscopía y mastografía, sólo secundaria. Reproduce NCRP 147 §5.2 (2.2 mm Pb) en el lienzo.
- **P6 resuelto (muestreo):** puntos del lado opuesto a las fuentes y desde la cara exterior cuando se
  conoce el espesor.
- **Materiales:** `materialDatabase.ts` toma concreto, acero y plomo de las tablas de NCRP 151; la
  promoción F510 de plomo a 511 keV pasa a 16.6 mm.
- Siguen en el motor anterior: TC (κ), medicina nuclear, braquiterapia, Gamma Knife y ciclotrón (módulo
  propio). Pendiente: laberinto y puerta ≥ 10 MV, fotoneutrones.
