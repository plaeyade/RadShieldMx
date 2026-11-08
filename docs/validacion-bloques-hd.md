# Validación de bloques de alta densidad (HD) TM NIPOL para linac

Fuente: certificado ININ **CE.CB.LSCD-589/TD/2024** (servicio LSCD-493/24, 21-11-2024), Laboratorio
Secundario de Calibración Dosimétrica. Bloques 13 × 13 × 26 cm de densidad nominal 3.5, 4.0 y 5.0 g/cm³;
Co-60 (Picker C9) y 6 y 18 MV (Varian Clinac iX SN6120). Datos transcritos en `src/lib/ininBloquesHD.ts`.
El PDF (escaneado, sin capa de texto) está en el corpus local de GAMMA, no en git.

## Lo que mide el certificado (Tabla 5)

| ρ nominal (g/cm³) | TVL Co-60 (cm) | TVL 6 MV (cm) | TVL 18 MV (cm) | ρ «radiológica» |
|---|---|---|---|---|
| 3.5 | 12.4 ± 0.2 | 16.4 ± 0.4 | 20.6 ± 0.3 | 4.80 |
| 4.0 | 11.7 ± 0.1 | 15.6 ± 0.4 | 19.8 ± 0.4 | 5.97 |
| 5.0 | 9.9 ± 0.1 | 12.4 ± 0.4 | 15.2 ± 0.4 | 5.80 |

Incertidumbre expandida informada para TVL: ±25 % (k = 2).

## Por qué no se adoptan como TVL de diseño (todavía)

1. **Por debajo de la cota física del acero.** Una mezcla Fe–Ca–Si no atenúa por unidad de masa mejor que
   el acero en MV (NCRP 151 Tabla B.2: acero 10 cm a 6 MV y 11 cm a 18 MV, ρ = 7.87). A 5.0 g/cm³ la cota es
   15.7 cm (6 MV) y 17.3 cm (18 MV); el certificado da 12.4 y 15.2. Para ser ciertos, exigirían
   ρ ≥ 6.3 g/cm³ (6 MV) o ≥ 5.7 g/cm³ (18 MV). Lo mismo ocurre a 4.0 g/cm³.
2. **Geometría no de haz amplio.** Campo de 5 × 5 cm en isocentro (8.5 cm a 170 cm), espesores de 13, 26 y
   30–40 cm (≈ 2.5–3 TVL). Así se mide algo cercano al primer TVL con poca dispersión, no el TVLₑ de
   equilibrio en haz amplio que usa NCRP 151.
3. **Densidad no gravimétrica.** La «densidad» se deduce de μ medido entre μ/ρ calculado. Los bloques
   nominales 5.0 resultan menos densos (5.80) que los 4.0 (5.97).
4. **Inconsistencias internas.** ln10/μ' de la Tabla 4 da TVL 4–9 % mayores que la Tabla 5. Además, las
   hojas 7–11 (con B(x) de ANSI/ANS-6.4.3 para Fe) dan a 6 MV TVL mayores que a 18 MV.
5. **Sin O ni H en la composición (XRF).** A ≥ 10 MV el hidrógeno del muro decide el blindaje de
   neutrones; sin él no se puede evaluar el muro ni la puerta.
6. **No hay medición a 5.5 g/cm³**, la densidad recomendada para linac.
7. **La densidad real es menor que la nominal** (IMCYC, sección siguiente).

## Densidad real: IMCYC (OT-521, 2022)

Masa específica por NMX-C-263-ONNCCE sobre tres tabiques de cada densidad (lote EYMSA):

| Nominal | Seca (g/cm³) | Sin poros, «aparente» (g/cm³) | Vacíos permeables |
|---|---|---|---|
| 3.5 | 3.31–3.32 | 3.78–3.82 | 12–13 % |
| 4.0 | 3.66–3.70 | 4.61–4.70 | 20–22 % |
| 5.0 | 3.96–4.02 | 5.05–5.16 | 22 % |

Un muro seco blinda con la densidad **seca**. La nominal «5.0» es en realidad ≈ 4.0 g/cm³. Las densidades
«radiológicas» del ININ (4.80, 5.97 y 5.80) superan incluso la del sólido sin poros, lo que confirma que
sus TVL son demasiado bajos.

La ficha CONTUPLEX TD-550 (mismo fabricante) se contradice:
- dice ρ = 5.50 g/cm³ en un lugar, «densidad nominal 5,00» en otro y «aparente típica 2,7» en un tercero;
- da para 18 MV un TVL de 13.6 cm y también de 20.4 cm.

Su peso por pieza (23.6 kg en 13 × 13 × 25.4 cm) corresponde a 5.50 g/cm³: se usa de forma provisional
hasta pesar un lote. Para el TD-250 del ciclotrón, la ficha da 10.7 kg por pieza, que corresponde a
2.49 g/cm³ y es coherente con lo usado en el MC F90. Pesar piezas del lote en obra cierra la duda en
ambos casos.

## Regla de diseño vigente en RadShield

TVL₁ y TVLₑ del concreto de NCRP 151 (Tabla B.2; fuga con Tabla B.7) escalados por masa con la densidad de
diseño (seca medida si existe): `TVL × 2.35/ρ`. Es conservador para mezclas con hierro: a 18 MV el acero
es ≈ 15 % mejor por masa que el concreto.

| Nominal | ρ de diseño | 6 MV TVL₁ / TVLₑ (cm) | 18 MV TVL₁ / TVLₑ (cm) | Co-60 (cm) |
|---|---|---|---|---|
| 3.5 | 3.32 (IMCYC seca) | 26.2 / 23.4 | 31.9 / 30.5 | 14.9 |
| 4.0 | 3.68 (IMCYC seca) | 23.6 / 21.1 | 28.7 / 27.4 | 13.4 |
| 5.0 | 3.99 (IMCYC seca) | 21.8 / 19.5 | 26.5 / 25.3 | 12.4 |
| 5.5 (TD-550) | 5.50 (peso de ficha, provisional) | 15.8 / 14.1 | 19.2 / 18.4 | 9.0 |

Diferencia con el certificado para el bloque nominal 5.0 a 18 MV: 25.3 cm frente a 15.2 cm de TVLₑ.

## Protocolo de validación pendiente (5.5 g/cm³ para linac)

1. **Densidad gravimétrica** de al menos 10 bloques por lote (masa / volumen medido) y NMX-C-263 sobre 3 piezas; es el paso más barato y el que más cambia el resultado.
2. **Composición completa**, incluidos O y H (análisis químico o PGNAA); el contenido de H en % en masa
   se necesita para neutrones a ≥ 10 MV.
3. **Transmisión en haz amplio** a 6 y 18 MV:
   - campo de 40 × 40 cm o barrera completa;
   - espesores hasta ≥ 4 TVL (≈ 75–80 cm a 5.5 g/cm³);
   - detector a ≥ 30 cm de la cara de salida;
   - ajuste separado de TVL₁ y TVLₑ.
4. **Monte Carlo de verificación** con la geometría real del ensayo y con la de haz amplio (ver Cyclotron-SIM,
   «MC linac»). El MC debe reproducir las lecturas del ININ en su geometría antes de usarse para extrapolar.
5. **Fotoneutrones a 18 MV**: TVL de neutrones del bloque y efecto en el laberinto y la puerta (NCRP 151
   §2.4.4–2.4.5).
6. Aceptación: el TVLₑ validado sustituye al escalado por masa sólo si su incertidumbre (k = 2) cabe por
   encima de la cota del acero. Lo firma el físico médico responsable.
