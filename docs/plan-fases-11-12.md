# Plan de las Fases 11 y 12

Fecha: 2026-11-10 · Rama `fase10-inicio` · Propuesta para revisión del responsable. Herramienta de diseño
preliminar: todo resultado requiere revisión de un experto calificado / OSR antes de uso clínico o regulatorio.

## Fase 11 — Auditoría de los motores de cálculo

**Objetivo.** Que cada número que la app muestre como espesor, kerma o transmisión salga de un motor con
prueba contra una referencia publicada, y que no queden caminos de cálculo paralelos sin validar.

### Hallazgo previo (Fase 10)

Hay **dos botones «Calcular» con motores distintos**:

| Entrada | Función | Motor | Estado |
|---|---|---|---|
| Barra superior → Blindaje → «Calcular Blindaje», asistente «Guíame» | `runCalculations` | `useShieldingEngine.calculateAllBarriers` → `doseFieldEngine` + `normativeBarrierEngine` (NCRP 147/151, TG-108) | validado (Fases 1–9) |
| Barra lateral «Calc», tecla F5, botones «Calcular» del lienzo | `runRadShieldCalculations` | `AsyncShieldingEngine` (Web Worker) | **no validado**: serializa sólo posición, carga y factor de uso; ignora modalidad, energía, TG-108 y material por energía |

Prioridad 1 de la fase: que todos los accesos usen el motor validado (o que el worker ejecute exactamente
`calculateAllBarriers`) y una prueba que compare ambos caminos barrera por barrera.

**Estado (Fase 11, etapa 1, rama `fase11-motor-unico`): resuelto.** Todas las rutas (barra superior, «Guíame»,
paleta de comandos, barra lateral «Calc», F5, botones del lienzo, cálculo preliminar del DXF confirmado y cálculo por
lotes) llaman a `src/lib/motorProyecto.ts` (`calcularProyecto` / `calcularProyectoAsync` /
`calcularBarrerasValidadas`), que es el cuerpo que antes tenía `useShieldingEngine().calculateAllBarriers`. La
asincronía del worker (no bloquear la interfaz, progreso) la da `calcularProyectoAsync`, que cede el hilo entre
barreras y ejecuta la misma función por barrera. Se retiraron `AsyncShieldingEngine`, `ShieldingEngine`
(`lib/shieldingEngine.ts`), `workers/shieldingWorker.ts` + `useWebWorker` (worker creado al montar y nunca usado) y la
caché de resultados en IndexedDB del camino lateral (guardaba los resultados del motor retirado y no los espesores del
plano). El estado de cumplimiento es en todas las rutas el de `verificarBarrera` (instalado ≥ requerido, sólo con
traza del motor); el aviso de la barra superior que comparaba kerma sin blindaje con P ya no se usa.

Otros defectos encontrados en el camino:

- **F5 ejecutaba el cálculo del primer render** (oyente de teclado con dependencias `[]`: plano vacío → «Agregue al
  menos una fuente»); Ctrl+Z/Ctrl+Y/Ctrl+S usaban también funciones obsoletas. Ahora el oyente llama al manejador del
  último render.
- La tabla «Resultados — Máximos por barrera» del lienzo, el PDF, el reporte CNSNS y el paquete de evidencia leían
  `thicknessLead_mm`/`maxBarrierThickness_mm`, que el motor retirado no producía (mostraba «N/A» o el plomo de un TVL
  fijo de 16.6 mm). Ahora salen de la barrera calculada (`resultadoDeBarrera`).

Pruebas: `src/__tests__/auditoria/motorUnico.test.ts` (NCRP 147 §5.1 y §5.2, NCRP 151 §7.1.1 y §7.1.5, TG-108 F-18 del
ejemplo guiado, Tc-99m e I-131: mismas cifras y estados en las rutas y, en NCRP 147/151, igualdad exacta con
`calcularBarreraNormativa` sobre los mismos puntos) y `e2e/fase11-motor-unico.spec.ts` (barra superior, barra lateral,
F5 y botón del lienzo sobre el proyecto PET/CT, con una barrera corta y el resto sobradas).

### Inventario de cálculos paralelos (grep de `Math.pow(10`, `10 **`, `Math.exp(`, `Math.log10(` y tablas TVL/HVL fuera del motor)

Motor validado (referencia): `shieldingMath`, `normativeBarrierEngine`, `doseFieldEngine`, `ncrp147`, `ncrp151`,
`ncrp151Laberinto`, `tg108`, `mallaNuclear`, `calculadorasNormativas`, `motorProyecto`. `verificacionBlindaje` sólo
estima la dosis tras el margen (P·10^(−margen/TVL)); `types/ctIsodosis` interpola el perfil de TC que consume el motor.

| Archivo | Qué calcula | Dónde se ve | Estado |
|---|---|---|---|
| `lib/engine/AsyncShieldingEngine.ts` | Espesor con TVL fijo de Pb 16.6 mm | Barra lateral, F5, lienzo, DXF | **Retirado** (Fase 11) |
| `lib/shieldingEngine.ts` (`ShieldingEngine`) | Igual, en el hilo principal | Nadie (importación sin uso) | **Retirado** |
| `workers/shieldingWorker.ts`, `hooks/useWebWorker.ts` | Archer/TVL propios en un worker | Nadie (worker creado al montar) | **Retirado** |
| `hooks/useSmartBarrier.ts` | TVL fijos; «primaria» si d < 6 m | Aviso flotante del diseñador (nunca se invocaba) | **Retirado del diseñador**; el gancho queda sólo con sus pruebas |
| `hooks/useWASM.ts`, `hooks/useWorkerCalculation.ts` | Archer/TVL y kerma propios | Nadie (instanciados sin uso) | **Retirados del diseñador**; archivos con pruebas propias, sin uso en la interfaz |
| `hooks/useCostOptimizer.ts`, `lib/skyshine/ChiltonSkyshine.ts`, `lib/ct/CTScatterDatabase.ts`, `lib/mcginleyData.ts` | n = log₁₀(K/P), skyshine, dispersión TC | Nadie (sin importadores) | **Borrados** (depuración, `docs/DEPURACION.md`); comprobado en la rama `fase11-terapia-gp`: ya no existen ni tienen importadores |
| `sections/dialogs/MemoriaAnaliticaWizard.tsx` (vía `uaqProtocol`) | Primaria/secundaria LINAC | Asistente de memoria (texto y PDF) | **Corregido**: `barreraMV` (NCRP 151); antes concreto aunque se eligiera plomo/acero, C₁ de IMRT aplicado a la primaria y una sola componente secundaria |
| `lib/agents/tools.ts` (`checkSkyshine`, `compareMaterials`, `validateTVL`) | Transmisión con tabla TVL propia | Diálogo del agente de diseño | **Corregido**: Tabla B.2 de `ncrp151` (TVL₁/TVLₑ); las barreras ya usaban `barreraMV` (Fase 8a) |
| `lib/uaqProtocol.ts` vía `controlledZoneCalculationAdapter` | LINAC, PET/CT, Gamma Knife, HDR (preliminar F55) | `LayoutBunkerDialog` | **Corregido** (depuración, etapa 8): `lib/zonaControladaMotor.ts` con `barreraMV`, `dosisSemanalTG108` y TVL del catálogo como `motorProyecto`; `f149NormativeNumericQa` apunta al motor |
| `lib/materialDatabase.ts` (`getRecommendedMaterial`) | Espesor equivalente por TVL de catálogo | Asistentes de equipo/memoria (lista de materiales) | **Contrastado** (rama `fase11-terapia-gp`): concreto/acero/plomo = Tabla B.2/B.7; el resto con piso por masa (envolvente concreto/acero, tungsteno por plomo), `isNCRP151` sólo en los tres tabulados; `getRecommendedMaterial` devolvía el mismo espesor para todo material (corregido; sin importadores) |
| `lib/nuclearMedicine.ts` | n TVL con Γ·A·t/d² | `NuclearMedicineAdvanced`, herramientas por categoría, GATE | Revisado en 8c (β+ por TG-108 Tabla V). **Fase 11 (`fase11-terapia-gp`)**: I-131, Lu-177 e I-123 por `terapiaEspectroGP` (HVL/TVL mostradas = primer espesor de la regla: I-123 Pb 0.59/2.1 mm, concreto 83/164 mm). **Seguimiento de #57 (`fase11-diagnostico-gp`, N3)**: Tc-99m, Tl-201, In-111 y Zr-89 también por `terapiaEspectroGP` (antes n·TVL sin buildup, 1.6–2.2× corto en concreto); umbral de línea único 0.1 % (antes 1 %; en Zr-89 entran 1657, 1713 y 1744.5 keV). Sólo Y-90, Ra-223 y Ac-225 siguen con n·TVL (alineados con la revisión 8c del módulo de terapia) |
| `lib/therapy/TherapeuticRadionuclideShielding.ts`, `lib/spect/IPEMReport109.ts` | TVL por radionúclido (I-131, Lu-177, SPECT) | Diálogos de terapia e IPEM 109 | Revisados en 8c (TVL que eran HVL). **Fase 11**: I-131 y Lu-177 de terapia por `terapiaEspectroGP` (casos: tablas GP/MC/Oumano). **Seguimiento de #57 (N3)**: IPEM 109 ya no es n·TVL: transmisión de pared, espesores y sala completa por `terapiaEspectroGP` para sus 7 nucleidos (Tc-99m, Tl-201, I-123, I-131, Ga-67, In-111, Sm-153); I-123 da lo mismo que en Medicina Nuclear (antes 4.0/140 mm frente a 15.7/273 mm a B = 0.01). IPEM 109 es de pago: no se pudieron contrastar sus valores. Pendiente: Y-90 (bremsstrahlung) sin caso publicado |
| `lib/bimRAD.ts` | Transmisión por capas BIM | Diálogo BIM-RAD | Revisado en 8c (β+); pendiente de caso publicado |
| `sections/dialogs/BuildupFactorDialog`, `NeutronRemovalDialog`, `MaterialPropertyCalculator`, `ConcreteActivationDialog`, `lib/phyXData`, `lib/xcomAttenuation`, `lib/electronEngine` | µ, buildup, remoción de neutrones, activación | Diálogos de física de materiales | Física de apoyo (no dimensionan la barrera del plano); los de 8c llevan aviso de resultado sintético |
| `VersaHD15MVDialog`, `ElectronApplicatorDialog`, `CrossValidationDialog`, `ModelingToolboxDialog` | Barreras MV | Diálogos | Ya delegan en `calculadorasNormativas`/`ncrp151` (Fase 8a/8c) |
| `CycloneKIUBEWizard`, `MCNPCyclotronDialog` | Término fuente de ciclotrón | Diálogos de ciclotrón | Fuera del motor por diseño (el motor no publica espesor de ciclotrón); contraste con MC en esta fase |
| `DoseMapDialog`, `SpatialDoseMapDialog`, `lib/doseMapEngine`, `lib/visoresDosis`, `lib/medical3D/sceneBuilder`, `Isosurface3DDialog` | Escala logarítmica de color | Mapas y visores | Sólo visualización (el campo sale de `doseFieldEngine`); visores tras `VISORES_EN_REVISION` |
| `batemanSolver`, `decay/DecayChains`, `proyeccionDecaimiento`, `ventilacionBunker`, `gumUncertainty`, `GammaIndexAnalyzer`, `DVHAnalyzer`, `Attila4MCVarianceReduction`, `MonteCarlo*`, `nativeMCEngine`, `monteCarloEngine`, `DCHAINActivationCalculator`, `PythonIntegrationDialog` | Decaimiento, incertidumbre, índice gamma, MC | Diálogos de investigación | No son cálculo de barrera |
| `f149NormativeNumericQa`, `f484F490NormativeQa`, `f519NormativeQaExpansion`, `f581F585ExpandedNormativeNumericQa`, `validationEngine` | Casos de QA numérico | Paneles de QA y actualización | Contratos de QA; revisar que comparen contra el motor y no contra fórmulas propias |

Limitación conocida: el cálculo por lotes no recibe el perfil de isodosis de TC seleccionado en el diseñador (sólo
afecta a TC con perfil cargado). ~~Una barrera que no necesita blindaje (kerma·T ≤ P) queda con `requiredThickness_mm`
vacío~~ **Etapa 2 resuelta** (rama `fase11-terapia-gp`): `motorProyecto` y `normativeBarrierEngine` publican requerido
0 en cada material evaluado (ciclotrón sigue sin espesor); la referencia de la etapa 6 sólo cambia en esos ceros (muro
norte de «Guíame» 17.96 mm Pb / 213.77 mm de concreto, sin cambio).

### Terapia con I-131 y Lu-177: espectro completo con buildup GP (rama `fase11-terapia-gp`)

Motor validado: `motorProyecto` dimensiona las fuentes `radioiodine-i131` y `lu177` (todas las fuentes del plano con
modelo espectral; con I-131 presente rige I-131) con `src/lib/terapiaEspectroGP.ts`, en lugar del TVL único de 364 keV
del catálogo (11 mm Pb, 140 mm de concreto):

- (a) haz estrecho a la línea más energética con Iγ ≥ 0.1 % (el mismo umbral que el espectro: I-131 722.9 keV, lo que
  pide la CNSNS; Lu-177 321.3 keV, 0.2186 %), µ SIN dispersión coherente de esa línea, como ORNL/RSIC-49 y el propio
  GP (desde la 2.ª revisión del #58, M1; antes µ total de XCOM; criterio único del 2 % del kerma, ver más abajo);
- (b) haz ancho del espectro completo (ENSDF, líneas ≥ 0.1 %: I-131 9, Lu-177 5, peso por kerma en aire) con buildup GP de ANSI/ANS-6.4.3 (ORNL/RSIC-49,
  Tabla 5.1; µ sin coherente); en concreto, con el ajuste de Oumano et al. 2025 (sólo I-131), (b) = max(Oumano, 1.2·GP);
- espesor = el mayor de (a) y (b); la traza (`ANS643_GP_ESPECTRO_MAX_HAZ_ESTRECHO`) dice cuál rige por material.
  Acero → Fe; el resto por equivalencia másica con concreto 2.35 (conservador para Z alto; sin GP de barita).

Resultado: en plomo rige (a) (I-131: 1.27–5.4 veces el GP en 2–35 mm, que coincide ±2 % con el MC de losa); en concreto rige (b)
(1.2·GP; el GP de medio infinito es 1.7–2.0 veces el MC de losa: cota superior). Lu-177 (revisión del PR #57: faltaban
las líneas de 71.6, 249.7 y 321.3 keV, y el plomo salía corto con B pequeño): en plomo rige (a) a 321.3 keV (6.25 mm por
TVL con µ sin coherente; 5.78 con el µ total de XCOM y 5.74 con la malla de SRD 126; ≈ 2.3× el GP del espectro, 5.43 mm a
B = 0.01); en concreto rige (b). I-123 (diálogos): sólo (b), GP de sus 6 líneas
≥ 0.1 %; el haz estrecho a 529 keV desde B = 1 sobrediseñaba el plomo a B ≥ 0.1 y quedaba corto en concreto.
Pruebas: `src/__tests__/auditoria/terapiaEspectroGP.test.ts` (Tabla 3 de ORNL/RSIC-49, transmisión de Pb 2–35 mm y
concreto 15–30 cm contra el cálculo independiente en Python, GP vs MC, Oumano, motor y diálogos),
`materialDatabaseB2.test.ts` y `e2e/fase11-terapia-gp.spec.ts` (Medicina Nuclear, I-131 en plomo 29.0 mm desde la 2.ª revisión del #58 —µ sin coherente—; 27.4 con el µ total de XCOM, antes 27.2; no se pudo
ejecutar en la primera versión; ejecutada en la revisión con el Chromium del sistema). Citas en `docs/REFERENCIAS.md`.

### Diagnóstico por espectro GP (rama `fase11-diagnostico-gp`, seguimiento de #57)

Segunda revisión de #57 (aprobado con observaciones N1–N4). Cambios:

- **N3 (media).** Tc-99m, Tl-201, In-111 y Zr-89 (`nuclearMedicine`), los 7 nucleidos de IPEM 109 (Tc-99m, Tl-201,
  I-123, I-131, Ga-67, In-111, Sm-153) y la modalidad `spect-tc99m` del motor (antes TVL de catálogo a 140 keV: 45 mm de
  concreto, 1 mm de Pb) usan `terapiaEspectroGP`: espectro ENSDF (NuDat 3) con Iγ ≥ 0.1 %, buildup GP de exposición de
  ANS-6.4.3 y µ sin coherente. Coeficientes GP ampliados a 0.03–2 MeV con la Tabla 5.1 de NUREG/CR-5740 (ORNL/RSIC-49/R1,
  1991; las filas de 0.06–1 MeV coinciden con las de ORNL/RSIC-49); µ por encima de 0.8 MeV = NIST total − coherente de
  Elam·(0.8/E)². Criterio (a) (haz estrecho a la línea más energética ≥ 0.1 %, peso 1 desde B = 1): en la primera
  versión, en terapia siempre y en diagnóstico sólo con peso ≥ 50 %; desde la revisión del #58, criterio único del 2 %
  (ver «Revisión independiente del #58»). En la práctica, entre los diagnósticos sólo rige en In-111/Pb: con µ sin coherente (2.ª revisión del #58, M1),
  en todo B = 0.5–1e-3 (3.50 frente a 3.13 mm a B = 0.1; 7.01 frente a 6.64 a B = 0.01; con el µ total de XCOM eran 3.26
  y 6.52, y a B = 0.01 regía el GP). No se aplica a I-123 (538.5 keV, 1.3 % del kerma),
  Ga-67 (887.7 keV, 0.9 %) ni Zr-89 (1744.5 keV, 0.16 %): con peso 1 multiplicaba el plomo ≈ 6× (I-123) y ≈ 5× (Ga-67) a
  B = 0.1 sin base física. Omitir los rayos X sigue siendo conservador: en Tl-201 (rayos X K del Hg ≈ 76 % del kerma),
  T_X/T_γ ≤ 1.005 hasta 1 cm de concreto y < 1 después.

  | Nucleido | Antes, n·TVL concreto (mm/TVL) | GP del espectro, concreto B = 0.1 / 0.01 (mm) | Pb B = 0.1 / 0.01 (mm) |
  |---|---|---|---|
  | Tc-99m | 76 | 148.0 / 236.6 | 1.16 / 2.14 |
  | Tl-201 | 72 | 156.4 / 251.5 | 1.53 / 2.95 |
  | In-111 | 149 | 176.0 / 284.0 | 3.50 (a) / 7.01 (a) |
  | Zr-89 | 662 (Pb 26.0) | 261.3 / 445.3 | 31.3 / 62.3 |
  | Ga-67 (IPEM 109) | 92 (Pb 6) | 177.4 / 299.5 | 5.04 / 14.04 |
  | Sm-153 (IPEM 109) | 58 (Pb 0.55) | 119.5 / 194.5 | 0.85 / 1.67 |

  El concreto de Zr-89 baja (la TVL de 662 mm no tenía fuente) y el plomo sube (26.0 → 31.3 mm a B = 0.1).
- **N1/N2 (baja).** Corregidos los comentarios de `nuclearMedicine.ts` y el título de la prueba de I-123: el haz estrecho
  a 529 keV desde B = 1 da MÁS plomo que el GP en todo el rango útil (27.3 frente a 15.7 mm a B = 0.01); el GP sólo lo
  supera por debajo de B ≈ 1e-7. El método mostrado (`metodoEspectro`) dice «vs haz estrecho» sólo si hay criterio (a).
- **N4 (baja).** Factor del W frente al Pb por haz (`factorWPb`), con µ/ρ de NIST SRD 126 de W y Pb interpolados
  log-log: Co-60 = máximo a 1.1732/1.3325 MeV = 1.0591 (antes 1.054 para todo, 0.5 % corto); MV = máximo en 1.25 MeV–
  nominal = 1.0536. Sustituido en la revisión del #58 por la equivalencia de la aleación (ver abajo).

Referencia independiente: `scripts/fase11_diagnostico_gp.py` (Python, xraydb 4.6.1; reproduce los µ y los espesores de
I-123 del módulo a 1e-5). Pruebas: `src/__tests__/auditoria/diagnosticoEspectroGP.test.ts`, `materialDatabaseB2.test.ts`
y `e2e/fase11-diagnostico-gp.spec.ts` (Medicina Nuclear, Tc-99m en concreto 152.2 mm, antes 79.4 mm). Verificado:
`fase11-terapia-gp`, `fase11-motor-unico` y «Guíame» (17.96 mm Pb / 213.77 mm de concreto) sin cambio.
~~Pendiente: el mapa de dosis sigue atenuando Tc-99m con la TVL de catálogo.~~ Resuelto en la revisión del #58 (H1).

### Revisión independiente del #58: criterio único, µ de XCOM y mapa ↔ barrera

La revisión independiente aprobó con observaciones (H1–H5). Cambios en la misma rama:

- **Criterio único del haz estrecho (H3).** El criterio (a) se aplica a TODO el catálogo, sin separar terapia y
  diagnóstico, cuando la línea más energética con Iγ ≥ 0.1 % («línea dura») aporta ≥ 2 % del kerma en aire sin blindaje
  (`PESO_MIN_LINEA_DURA`). `hazEstrecho` ya no se escribe a mano: se deriva de `criterioHazEstrecho` (peso por
  `fraccionesKerma`), y `diagnosticoEspectroGP.test.ts` falla si cambia la clasificación de algún nucleido o si el
  umbral sale del intervalo que la conserva. Misma clasificación y mismos espesores que la versión anterior (columna de
  la derecha actualizada con el µ sin coherente de la 2.ª revisión, M1):

  | Nucleido | Línea dura (keV) | Peso en kerma | (a) | Pb a B = 0.1 si (a) se aplicara siempre / regla (mm) |
  |---|---|---|---|---|
  | Tc-99m | 140.5 | 100 % | sí | 0.90 / 1.16 (rige el GP) |
  | Sm-153 | 103.2 | 85.9 % | sí | 0.41 / 0.85 (GP) |
  | Tl-201 | 167.4 | 78.9 % | sí | 1.40 / 1.53 (GP) |
  | In-111 | 245.4 | 61.5 % | sí | 3.50 / 3.50 (rige (a); GP 3.13) |
  | I-131 | 722.9 | 3.36 % | sí | 21.68 / 21.68 (rige (a); GP 10.99) |
  | Lu-177 | 321.3 | 2.58 % | sí | 6.25 / 6.25 (rige (a); GP 2.48) |
  | I-123 | 538.5 | 1.33 % | no | 14.0 / 2.1 (×6.6) |
  | Ga-67 | 887.7 | 0.91 % | no | 25.5 / 5.0 (×5.1) |
  | Zr-89 | 1744.5 | 0.16 % | no | 41.9 / 31.3 (×1.34) |

  Margen: cualquier umbral en (1.33 %, 2.58 %] da la misma clasificación; es estrecho y queda probado. No sirve
  «la línea más energética con peso ≥ X %»: en I-123 caería en 529 keV (5.35 %) y volvería el ×6.6.
- **µ de haz estrecho en malla fina de XCOM (H2).** `XCOM_MU_RHO_MALLA` (Pb, W, Fe, concreto ordinario; µ/ρ total con
  coherente) generada por `scripts/fase11_xcom_malla.py` desde la base de datos de NIST XCOM 3.1 (`MDATX3.zzz`, spline
  cúbico log-log por proceso, como XCOM): malla de SRD 126, 20 puntos por década, las líneas duras y las energías 171.28,
  245.35, 321.3159, 364.489, 528.97, 636.989, 722.911 keV, y los bordes K y L1–L3 de Pb y W duplicados. Reproduce SRD 126
  a ±0.05 %; la interpolación log-log del módulo queda a ≤ 0.33 % de XCOM entre nodos y es exacta en las líneas duras.
  Efecto: In-111/Pb a B = 0.1 pasa de 3.21 a 3.26 mm (antes 1.6 % corto); I-131 a 722.9 keV µ/ρ = 0.09924 cm²/g (antes
  0.1001, +0.8 %): TVL de Pb 20.27 → 20.44 mm y el e2e de Medicina Nuclear 27.2 → 27.4 mm; Lu-177 5.74 → 5.78 mm por TVL.
  Concreto y el GP (µ sin coherente de Elam, ≤ 1.5 % de XCOM línea por línea) no cambian. Referencias de Python
  (`fase11_diagnostico_gp.py`) regeneradas con la misma malla. **Sustituido en la 2.ª revisión (M1, ver abajo):** el
  haz estrecho ya no usa esta malla (con coherente), sino el µ sin coherente de la línea dura; la malla queda para W↔Pb
  y los controles.
- **Mapa de dosis ↔ barrera (H1).** `doseFieldEngine.transmisionCapa` usa para medicina nuclear la misma transmisión
  que dimensiona la barrera: I-131, Lu-177 y Tc-99m con `transmisionRegla` de `terapiaEspectroGP` (por radionúclido y
  material, con la equivalencia másica de `materialGPCatalogo`; caché por nucleido/material/espesor a 0.1 µm) y PET de
  511 keV (F-18, Ga-68) con la curva de TG-108 (Tabla V), igual que `espesorPET511`. Antes la TVL de catálogo (Tc-99m 45 mm
  de concreto) daba detrás de la barrera de diseño ≈ 200× menos dosis que la meta. `mapaBarreraCoherencia.test.ts`:
  con el espesor requerido instalado, el kerma del mapa en el punto de máximo kerma es la meta P/T con diferencia
  ≤ 0.4 % (Tc-99m, I-131, F-18 y, desde la 2.ª revisión (B1), Lu-177 a 7.4 GBq; concreto y plomo; prueba a ±1 %, antes ±5 %). Los visores siguen tras sus banderas; sólo cambia el cálculo.
  «Guíame» (F-18, TG-108) no cambia: 17.96 mm Pb / 213.77 mm de concreto (la barrera sólo toma del campo el kerma sin
  blindaje).
- **Yeso de IPEM 109 (H4).** Se mantiene la equivalencia másica con concreto, ahora citada: con la composición del yeso
  CaSO₄·2H₂O de PNNL-15870 Rev. 1 y XCOM, su µ/ρ es mayor que el del concreto ordinario en 0.03–1 MeV (×1.10 a 100 keV,
  ×1.05 a 140 keV, ×1.004 a 1 MeV): conservador. Nota en el método del diálogo (`NOTA_YESO_IPEM`).
- **Verificación independiente (H5).** `verificacionIndependienteGP.test.ts`, sin código del autor: µ de XCOM, fórmula
  GP con las filas de la Tabla 5.1 copiadas e interpolación del buildup (no de los coeficientes) en log-log: Tc-99m
  concreto B = 0.0901 → 152.2 mm; In-111 Pb B = 0.1 → 3.50 mm (a, µ sin coherente; 3.26 con el total) frente a 3.13 mm
  GP; I-131 y Lu-177 en Pb, haz estrecho (TVL 21.67 y 6.25 mm; e2e 29.0 mm); Zr-89 Pb B = 0.1 → 31.3 mm. El módulo
  coincide a < 1 %.

- **Equivalencia W↔Pb por energía y aleación (hallazgo adicional).** El factor único W/Pb (1.054–1.059) sólo valía para W
  puro en Co-60/MV. `src/lib/equivalenciaWPb.ts` calcula F = máx. de (µ/ρ)_Pb/(µ/ρ)_aleación (NIST XCOM por elemento,
  regla de mezcla) sobre las energías que rigen, para las aleaciones de ASTM B777 (W-Ni-Fe/Cu, 90–97 % W); el material
  «Tungsteno» de 17.0 g/cm³ usa el peor caso de la clase 1. MV (de 1.0 MeV a la nominal desde la 2.ª revisión, B2):
  6 MV 1.082, 10 MV 1.084, 18 MV 1.098, 25 MV 1.100, Co-60 1.064 (TVL de W hasta ≈ 4 % más). Medicina nuclear (sólo
  referencia; el motor usa para el W la equivalencia másica con concreto): 1.21 a 511 keV, 1.39 a 140.5 keV; entre 69.5
  y 88 keV (bordes K de W y Pb) el W atenúa más por gramo. Conservador por construcción: en cada energía que rige, la aleación equivalente atenúa al menos lo que el Pb
  sustituido (`equivalenciaWPb.test.ts`: 140, 511 y 1250 keV, 6 y 18 MV; y F(MV) ≥ f(E) en todo 1 MeV–nominal).

### Segunda revisión del #58: µ del haz estrecho sin dispersión coherente (M1, B1, B2, I1)

- **M1 (media).** El criterio (a) usa el µ/ρ SIN dispersión coherente de la línea dura (`muRhoSinCoh`, el mismo de (b);
  coincide con XCOM a ≤ 0.06 %), como ORNL/RSIC-49 (Trubey 1988, Ap. II, borrador de ANSI/ANS-6.4.3), que no cuenta la
  coherente ni como atenuación ni como buildup. Con el µ total, (a) quedaba por debajo de la componente sin colisión de
  (b) (en Tc-99m, e^(−µ_tot·t) < e^(−µ_sc·t) en todo t) y la cota inferior perdía un 5–8 % de µ que no retira fotones del
  punto. Efecto (Pb): In-111 B = 0.1 3.26 → 3.50 mm y B = 0.01 6.52 (regía el GP, 6.64) → 7.01 mm (rige (a)); I-131 TVL
  20.44 → 21.68 mm y e2e de Medicina Nuclear 27.4 → 29.0 mm; Lu-177 TVL 5.78 → 6.25 mm; Tc-99m / Tl-201 (a) 0.86 / 1.32
  → 0.90 / 1.40 mm, sigue rigiendo el GP. Concreto sin cambio ((a) nunca rige). «Guíame» (F-18, TG-108) sin cambio.
- **B1.** `mapaBarreraCoherencia.test.ts`: tolerancia 5 % → 1 % (medido ≤ 0.34 %) y Lu-177 con carga que exige espesor.
- **B2.** `equivalenciaWPb.ts`: la lista de MV empieza en 1.0 MeV (antes 1.25 MeV), de modo que F(MV) ≥ f(E) en todo
  1 MeV–nominal (f(1 MeV) = 1.082 > 1.069, el F(6 MV) anterior), F(MV) ≥ F(Co-60) = 1.064 y F no decrece con la energía
  nominal: 6 MV 1.082, 10 MV 1.084, 15 MV 1.094, 18 MV 1.098, 25 MV 1.100 (TVL de W de 6 MV +1.2 %). Corte en 1 MeV:
  tras la primera TVL de Pb de 6 MV (5.7 cm) un fotón de 1 MeV conserva ≈ 15 % del peso relativo del mínimo de µ del Pb
  (≈ 4 MeV) y se cuenta; uno de 0.8 MeV, ≈ 5 %, con f sólo 3 % mayor (efecto ≤ 0.2 %). Prueba en `equivalenciaWPb.test.ts`
  (malla de 1 MeV a la nominal, monotonía y Co-60).
- **I1.** `factorWPbNuclido` (sin uso en producción, y excesivo: el máximo lo fijan las líneas blandas, 1.39 en I-131
  frente a 1.136 a 722.9 keV) se elimina con su prueba; el W en medicina nuclear sigue la equivalencia másica con
  concreto de `materialGPCatalogo`, más conservadora (por gramo el W atenúa más que el concreto).

#### Criterio regulatorio (texto para la memoria ante la CNSNS)

> El espesor de blindaje para radionúclidos se calcula con el espectro gamma completo de la evaluación ENSDF vigente
> (todas las líneas con intensidad ≥ 0.1 %), ponderado por kerma en aire y con factores de acumulación de haz ancho
> de la norma ANSI/ANS-6.4.3 (forma de progresión geométrica). Además, cuando la línea más energética del espectro con
> intensidad ≥ 0.1 % aporta al menos el 2 % del kerma en aire sin blindaje, el espesor no puede ser menor que el que
> atenúa esa línea en haz estrecho como si fuera la única emisión, con el coeficiente de atenuación SIN dispersión
> coherente (NIST XCOM, «total attenuation without coherent scattering»), como en ANSI/ANS-6.4.3 (ORNL/RSIC-49): la
> dispersión coherente desvía el fotón pocos grados sin cambiarle la energía y, con una fuente puntual y un muro
> extenso, no lo retira del haz que llega al punto de cálculo; contarla rebajaría la cota inferior entre 5 y 8 %. Este
> criterio es único para todos los radionúclidos, terapéuticos o diagnósticos, y conserva el requisito de la CNSNS para
> I-131 (línea de 722.9 keV, 3.4 % del kerma; en plomo 21.7 mm por décimo, 1.3–2.0 veces el haz ancho) y lo extiende a Lu-177
> (321.3 keV, 2.6 %). No se aplica a I-123 (538.5 keV, 1.3 %), Ga-67 (887.7 keV, 0.9 %) ni Zr-89 (1744.5 keV, 0.16 %):
> tratar como emisión única una línea que aporta menos del 2 % del kerma no tiene base física y, a una transmisión de
> 0.1, multiplicaría el plomo por 6.6 en I-123 (14.0 frente a 2.1 mm), por 5.1 en Ga-67 (25.5 frente a 5.0 mm) y por
> 1.34 en Zr-89 (41.9 frente a 31.3 mm; 83.7 frente a 62.3 mm a 0.01). Esas líneas sí se incluyen, con su peso real y
> su acumulación, en el cálculo de haz ancho. El umbral del 2 % separa los dos grupos con poco margen (cualquier valor
> entre 1.33 % y 2.58 % da la misma clasificación), y la herramienta lo verifica en cada versión. En Zr-89 el sobrecosto
> de aplicar siempre el haz estrecho sería moderado (+33 % de plomo, del orden del que se acepta en I-131); se excluye
> por coherencia del criterio, no por costo.

### Alcance y referencias

| Motor / módulo | Referencia | Casos de prueba |
|---|---|---|
| Diagnóstico (`ncrp147`, Archer, TC por DLP) | NCRP 147 Tablas 4.5, 4.7, B.1, C.1; ejemplos §5 y Ap. A | Ejemplos resueltos del cap. 5 y transmisiones del Ap. A |
| Teleterapia (`ncrp151`, laberinto, IMRT, dos fuentes) | NCRP 151 Ec. 2.1–2.8, 3.6, cap. 2.4–2.5, Tablas B.2–B.7 | §7.1.1–7.1.5; laberinto y puerta ≥ 10 MV (neutrones y captura) |
| Skyshine | NCRP 151 Ec. 5.1–5.3, Tabla 5.1 | Columna calculada de la Tabla 5.1 |
| PET / medicina nuclear (`tg108`) | AAPM TG-108 Ec. 2–3, 9–10, Tablas IV–V | Ejemplos del informe (captación, imagen, cuarto de control) |
| Ciclotrón (`ciclotron`, término fuente) | IAEA SRS-47, NCRP 144; Monte Carlo de Cyclotron-SIM | Tasas por dirección frente a los mapas MC de Cyclotron-SIM; Ar-41 |
| Campo de dosis 2D (`doseFieldEngine`) | Igual que los motores anteriores, punto a punto | Igualdad con los motores por barrera en los puntos de muestreo |
| Calculadoras de diálogo (Fases 7–9) | Las mismas | Cada calculadora contra su motor (no fórmulas propias) |

### Método y entregables

1. Inventario de funciones que producen espesor/kerma/transmisión (grep + grafo de llamadas) y retirada o
   redirección de las que dupliquen un motor.
2. Suite `src/__tests__/auditoria/` con un caso publicado por fila de la tabla, tolerancias explícitas y la
   cita (norma, tabla, página).
3. Comparación con casos publicados de terceros (artículos de diseño de búnker y PET/CT) y con el MC de
   Cyclotron-SIM para el ciclotrón; las discrepancias > 10 % se documentan o se corrigen.
4. Informe `docs/auditoria-motores.md`: motor por motor, referencia, resultado, decisión.

**Criterio de salida:** un solo camino de cálculo por modalidad; 100 % de los casos de la tabla en verde;
ningún diálogo con fórmula propia.

## Fase 12 — Reorganización del frontend

**Objetivo.** Un flujo único y corto (el del asistente «Guíame»: proyecto → plano → fuentes → ocupación →
cálculo → cumplimiento → reporte) con una entrada por herramienta y sin menús ni diálogos duplicados.

### Inventario de duplicidad encontrado hoy (2026-11-10)

Contado en el build de Pages con Playwright (8 menús visibles, 82 elementos; 223 claves de diálogo en
`appStore`, 51 de ellas montadas por estado local y no por el store).

**Superficies de mando que repiten acciones** (siete a la vez en pantalla): menús superiores (Archivo,
Diseño, Equipos, Blindaje, Verificación, Reportes, Evidencia, Integraciones); fila de acceso rápido
(DX/TX/NM/CY, Memoria, Evidencia, Validar, Heatmap); bloques «Acciones», «Herramientas de dibujo»,
«Cálculo NCRP» y «Análisis» de la barra lateral; barra del lienzo (Sel, Muro, Fuente, Zona, Medir, Pan, Plano,
Escala, Punto, Material, Calcular, Snapshot); barra inferior «CAD» (Plano, Muro, Fuente, Zona, Calc, 3D,
Evid); botón flotante «Calcular»; paleta de comandos. «Calcular» aparece en 5 sitios con 2 motores.

**Menús duplicados**

| Función | Dónde aparece | Nota |
|---|---|---|
| Árbol completo de menús | `Toolbar.tsx`: menús visibles y zona oculta `f114-deduped-legacy-menu-zone` | ~300 líneas sólo para contratos de pruebas antiguas |
| Audit Trail, análisis de logs, especificaciones técnicas | Archivo y Evidencia | mismas acciones |
| Importar DXF / DXF Viewer | Archivo y Diseño | mismo diálogo |
| PDF | Archivo «Exportar PDF» (memoria jsPDF) y Reportes «PDF analítico» (misma función); diálogo `pdfReport` que descarga **JSON** | renombrar o unificar |
| Reporte CNSNS | Archivo y Reportes (`cnsns`, .docx) más `cnsnsAutoReport` (HTML) y `cnsnsDigital` (XML) | tres salidas CNSNS |
| Checklist CNSNS | `cnsnsChecklist` (30 ítems) y `checklistCNSNS` (23 requeridos) | dos listas distintas |
| Integraciones | 7 elementos abren el mismo Performance Dashboard; 2 abren Performance Recommendations | entradas cosméticas |
| `keyboardShortcuts` | dos veces en `DIALOG_NAMES` | |

**Diálogos que se solapan**

| Grupo | Diálogos |
|---|---|
| Memoria analítica | `memoriaAI`, `memoriaWizard`, `reportManager`, `batchReportExporter`, `regulatoryReport` |
| Tableros | `dashboard`, `dashboardCalc`, `cnsnsDashboard`, `auditDashboard`, `analytics`, `analytics47`, `performanceDashboard` |
| 3D | `viewer3d`, `realTime3D`, `medicalFloorPlan3D`, `parametric3d`, `isosurface3d` (en revisión), `dose3D` |
| Equipos y fuentes | `equipmentDB`, `equipmentLibrary`, `equipmentManager`, `sourceLibrary`, `sourceSelector`, `autoFillEquipment` |
| Monte Carlo | `mc`, `mcConfig`, `mcCloud`, `monteCarloSim`, `monteCarloIntegration`, `nativeMC`, `mcEngine`, `geant4Mc`, generadores PHITS/FLUKA/PENELOPE/MCNP |
| Calculadoras de barrera | `barrierCalculator` (ya recibe `shieldingCalculator` y `quickBarrier`), `equipmentShieldingWizard`, `multiLayerShield`/`laminatedBarrier`, `floorCeiling` |
| Ayuda | `tutorial`, `onboardingTour`, `videoTutorial`, `helpPanel`, `manual`, `docs` y ahora «Guíame» |
| Historial | `versionHistory` (sin almacén), `historyPanel`, `undoRedoHistory` |

**Estado compartido.** El plano vivía en `useUndoRedo` del diseñador y en `canvasStore` sin sincronizar (los
diálogos que leen `canvasStore` veían siempre un plano vacío): corregido en la Fase 10 con una sincronización
de un solo sentido; la Fase 12 debe dejar **un** almacén del proyecto.

### Propuesta

1. Barra superior de 5 menús por etapa del flujo (Proyecto, Plano, Cálculo, Verificación, Reportes) más Ayuda;
   Integraciones, Monte Carlo y herramientas de investigación en un menú «Avanzado» detrás de una bandera.
2. Una sola barra de herramientas del lienzo; la barra lateral sólo para propiedades del elemento
   seleccionado; retirar la fila de acceso rápido y la barra «CAD» inferior.
3. Unificar por grupo de la tabla anterior (un diálogo por función; las claves antiguas se redirigen con
   `DIALOGOS_REDIRIGIDOS`, como en la etapa 3), migrar los 51 diálogos de estado local al store y borrar la
   zona de menús oculta tras actualizar sus pruebas.
4. Un único almacén del proyecto (zustand) con deshacer/rehacer; `ShieldingDesigner.tsx` (≈ 2 900 líneas) se
   divide por etapa.
5. Pruebas: el recorrido de «Guíame» como prueba E2E de referencia, más el barrido de diálogos y menús en vacío
   de la Fase 10 sin errores de consola.

**Criterio de salida:** cada acción con una sola entrada en menús, ≤ 2 superficies de mando visibles, ningún
diálogo huérfano y el recorrido guiado en verde.
