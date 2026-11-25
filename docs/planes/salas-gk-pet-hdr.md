# Salas nuevas: Gamma Knife Icon, Biograph Trinion (PET/CT) y Elekta Studio (HDR)

Fase 13, 23-11-2026. El cálculo está en `src/lib/salasGkPetHdr.ts` y las pruebas en `src/__tests__/validacion/salasGkPetHdr.test.ts`. Las cifras de este documento son las de `disenoProyecto()`.

## Criterios del propietario

- Todos los perímetros se diseñan con el objetivo de público: P = 0.02 mSv/semana (NCRP 147 §1.3, NCRP 151 §1.2, AAPM TG-108). La fuente única de ese valor es `limitesDosis.ts`.
- El edificio no tiene sótanos. La planta baja (PB) mide 5.40 m y los pisos tipo 5.00 m.
- Los puntos protegidos quedan a 0.5 m sobre el piso superior y a 1.7 m sobre el inferior. Las tres salas van en PB sobre terreno, así que no hay punto debajo y no se calcula barrera de piso. El punto del techo queda a +5.90 m, 0.5 m sobre la cara superior de la losa de N1 a +5.40.
- En los muros, el punto queda a 0.3 m de la cara exterior, a la altura de la fuente.
- T = 1 en todos los perímetros [supuesto]. La única excepción es el pasillo interior del laberinto HDR, con T = 1/8; ese pasillo es zona controlada y no es perímetro.
- Excepción al objetivo de público: el pasillo del laberinto HDR es zona controlada (decisión del 24-11-2026, sección «Decisión: pasillo del laberinto HDR»). Su P es el de área controlada, 0.1 mSv/semana, también de `limitesDosis.ts`.

## Método

Se resuelve T · Σᵢ Kᵢ(1 m) · Bᵢ(t) / d(t)² ≤ P por bisección y se redondea al paso constructivo: concretos 1 cm, acero 0.5 cm, plomo 1 mm. En los muros, d(t) = d_interior + t + 0.3 m; en el techo, d es fija.

| Término | Fuente de K | Transmisión |
|---|---|---|
| Gamma Knife Icon (tratamiento y reposo) | Horas × tasa del fabricante (McDermott, JACMP 2007, Ec. 4–6) | Co-60 primario, NCRP 151 Tabla B.2 (conservador para la radiación dispersa) |
| PET F-18 (sala de imagen) | AAPM TG-108 Ec. 9–10 (0.36 de autoabsorción, 0.85 de vaciado, F_U, R_tI) | TG-108 Tabla V (ajuste de Archer) |
| TC del PET/CT e ImagingRing | NCRP 147 §5.6.1, K¹ = κ·DLP | NCRP 147 Figs. A.2 y A.3 |
| HDR Ir-192 | Γδ = 0.111 μGy·m²/(MBq·h) × A × horas | TVL de IAEA SRS-47 (concreto 15.2, acero 4.3, plomo 1.6 cm) |
| Laberinto HDR | Dispersión simple K₁·α·A/(dᵢ²·d_r²) | Ir-192 primario (conservador) |

El concreto baritado (3.5 g/cm³ [supuesto]) se calcula por equivalencia másica con el concreto 2.35. En kV esa equivalencia sobrestima el espesor del baritado, así que queda del lado seguro.

## Gamma Knife Icon

La unidad de radiación tiene autoblindaje (192 fuentes de Co-60, ≤ 6600 Ci según la guía de licencia de la NRC, ML23038A070 §4.1). Fuera de la unidad no hay haz primario. Con las puertas abiertas y la camilla dentro, la dispersión del paciente sale por la abertura a lo largo del eje de la camilla. Elekta predice ≈ 240 μSv/h al final de la camilla con fuentes nuevas; con 4122 Ci se midieron 53 μSv/h. Con las puertas cerradas, las tasas son menores de 0.5 μSv/h (McDermott et al., JACMP 2026).

Por eso la sala no necesita muros de búnker de teleterapia. Sólo el muro que queda frente a la camilla supera los 21 cm de concreto.

- Sala interior de 7.20 m × 5.60 m. El foco está a 2.40 m del muro trasero, centrado, a 0.967 m de altura (estimado del GLB).
- Carga [supuesto]: 30 h/semana de tratamiento a 6600 Ci (6 pacientes/día × 5 días × 60 min) y 138 h/semana en reposo.
- Tasas de diseño a 1 m [supuesto derivado]: frontal 3100 μSv·m²/h (240 μSv/h a 3.4 m × 1.1), lateral y techo 50, trasero 10, reposo 5.
- No lleva laberinto. La puerta va en un muro lateral, detrás del foco.

## Biograph Trinion (PET/CT)

- Sala interior de 7.60 m × 5.00 m. El isocentro está a 2.00 m del muro detrás del gantry, a 1.064 m de altura.
- Carga [supuesto]: 60 pacientes/semana con 370 MBq de F-18, 60 min de captación fuera de la sala y 30 min en la sala.
- TC [supuesto]: 60 estudios/semana de cuerpo, DLP 600 mGy·cm, 140 kVp.
- Las salas de captación, el baño del paciente inyectado y el laboratorio caliente no se diseñan aquí. Hay que calcularlos aparte con TG-108 (captación, Ec. 2–3).

## Elekta Studio (Flexitron HDR Ir-192 + ImagingRing)

- Sala interior de 6.00 m × 5.00 m. La fuente está en el centro, a 1.117 m de altura.
- Fuente [supuesto]: 12 Ci (444 GBq) y 5 h/semana de fuente expuesta.
- ImagingRing [supuesto]: 20 estudios/semana, DLP 500 mGy·cm, 120 kVp.
- Laberinto en L por el sur: boca de 1.20 m en el extremo oeste, pasillo de 1.20 m y puerta al este. Se usa α = 0.03 [supuesto] y A = 3.6 m².

### Decisión: pasillo del laberinto HDR = zona controlada (24-11-2026)

El propietario decidió el 24-11-2026 declarar el pasillo del laberinto de la sala HDR de Elekta Studio como **zona controlada**.

**Motivo.** El MC preliminar de Cyclotron-SIM (PR #38, rama `mc-hdr-fotoneutrones-20261123`, `docs/mc-hdr-studio-fotoneutrones-versa.md`) da en el pasillo, con el muro interior de 34 cm:

| magnitud en el pasillo | valor |
|---|---:|
| analítico de este documento (kerma, μGy cada semana) | 145 |
| MC kerma (μGy cada semana) | 389 ± 6 (2.7 veces el analítico) |
| MC H*(10) (μSv cada semana) | 584 ± 8 |
| T · H*(10) con T = 1/8 (μSv cada semana) | 73 |

El analítico sólo cuenta la transmisión por el muro interior. El MC añade la radiación que entra por la boca y se dispersa en el pasillo, y esa parte no baja al engrosar el muro. Con T = 1/8 el pasillo supera el objetivo de público con que se dimensionó, pero cumple el de área controlada (0.1 mSv/semana).

**Qué cambia en el cálculo.**

- `salasGkPetHdr.ts`: la barrera `laberinto` lleva `zona: 'controlada'` y `disenoProyecto()` le aplica `P_ZONA_mSv_semana.controlada` (= `P_CONTROLADA_mSv_semana`). T sigue en 1/8 [supuesto].
- Todos los demás puntos (GK, PET/CT y el resto del HDR, incluidos el muro exterior del laberinto, el techo y la puerta) siguen con el objetivo de público.
- Con el objetivo de área controlada el analítico pide 24 cm de concreto (16 de baritado, 2.6 cm de Pb). **Se construyen 34 cm** (`MURO_INTERIOR_LABERINTO_HDR_cm`): es el espesor que modela el MC, y el MC preliminar sólo cumple con ese espesor. Adelgazar el muro sube la parte transmitida, y la geometría del muro exterior y de la puerta se calculó con 34 cm.

**Requisitos de la zona** (`REQUISITOS_PASILLO_LABERINTO_HDR`, en la nota de la fila):

- Señal de advertencia de radiación (trébol) y la leyenda «Zona controlada: sólo personal autorizado» en la entrada del pasillo, por fuera de la puerta.
- Acceso restringido: puerta con control de acceso (cerradura o tarjeta) y enclavamiento con la fuente; luz de «irradiando» en la entrada y en el pasillo.
- **El pasillo no puede ser paso de público ni de pacientes no acompañados.** Sólo entran el POE y el paciente de la sesión acompañado por el POE.
- Durante la exposición de la fuente nadie permanece en el pasillo. T = 1/8 es el de paso del POE [supuesto].
- Dosimetría personal para el POE que lo cruza y vigilancia de área en el pasillo con la fuente expuesta.

**Pendiente.** Confirmar con la corrida completa del MC de Cyclotron-SIM #38 en la PC de 24 hilos (error esperado ≈ 3 % en muros y laberinto). Si el T · H*(10) del pasillo superara la cifra de área controlada, habría que engrosar el muro interior, cerrar la boca o revisar T. También falta el criterio de la CNSNS sobre la zona controlada en la licencia.

## Espesores

| Sala | Barrera | Concreto 2.35 (cm) | Baritado 3.5 (cm) | Plomo | Acero (cm) |
|---|---|---:|---:|---:|---:|
| Gamma Knife | Frontal (eje de la camilla) | 46 | 32 | 9.0 cm | 16 |
| Gamma Knife | Laterales | 21 | 15 | 4.2 cm | 7.5 |
| Gamma Knife | Trasero | 17 | 12 | 3.3 cm | 6 |
| Gamma Knife | Techo | 14 | 10 | 2.7 cm | — |
| Gamma Knife | Puerta (T = 1) | — | — | 3.9 cm | 7 |
| Gamma Knife | Puerta, variante con T = 1/5 | — | — | 1.2 cm | — |
| PET/CT | Detrás del gantry | 17 | 11 | 12 mm | — |
| PET/CT | Pies de la mesa | 9 | 6 | 2 mm | — |
| PET/CT | Laterales (incl. control) | 15 | 10 | 9 mm | — |
| PET/CT | Ventana de control | — | — | 9 mm Pb eq. | — |
| PET/CT | Techo | 11 | 7 | 2 mm | — |
| PET/CT | Puerta | — | — | 2 mm | — |
| HDR | Muros oeste y este | 45 | 31 | 4.9 cm | — |
| HDR | Muro norte | 47 | 32 | 5.1 cm | — |
| HDR | Muro interior del laberinto (T = 1/8, zona controlada; se construyen 34 cm de concreto) | 24 | 16 | 2.6 cm | — |
| HDR | Muro exterior del laberinto | 40 | 28 | 4.3 cm | — |
| HDR | Techo | 42 | 28 | 4.4 cm | — |
| HDR | Puerta del laberinto | — | — | 6 mm | — |

La tasa instantánea más alta detrás de un perímetro (muros del HDR) es ≈ 3.9 μSv/h, menor de 20 μSv en cualquier hora. La fila del muro interior del laberinto da el mínimo analítico con el objetivo de área controlada. Con los 34 cm que se construyen, el analítico deja en el pasillo los mismos valores que antes de la decisión. La cifra que manda es la del MC (sección «Decisión»).

## Datos que faltan para cerrar el diseño

- Gamma Knife: los mapas de tasa del «site planning» de Elekta para el Icon (puertas abiertas y cerradas), la actividad de carga, la carga de pacientes, los tiempos por paciente y la carga de piso (unidad de ≈ 20 t).
- PET/CT: pacientes por día, actividad por paciente, tiempo en la sala y protocolo de TC (kVp, DLP), además de la distribución de captación, laboratorio caliente y baño.
- HDR: actividad máxima de la fuente y fracciones por semana, protocolo del ImagingRing y si se usará también como sala de procedimientos (ocupación del personal).
- Todos: el uso y la ocupación de cada colindancia y del piso de N1, la densidad certificada del concreto y del baritado, y el criterio de la CNSNS en la licencia.
- La NOM-027-NUCL-2021 excluye en su §1.2 las instalaciones de medicina nuclear. El PET/CT se rige por la NOM-040-NUCL-2016 (§5.2.1, memoria analítica de blindaje) y la parte de TC por la regulación de rayos X de diagnóstico. Hay que confirmar con la CNSNS qué norma de diseño aplica al Gamma Knife y al HDR, que son fuentes selladas.
