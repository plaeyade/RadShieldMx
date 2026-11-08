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

## Regla de diseño vigente en RadShield

TVL₁ y TVLₑ del concreto de NCRP 151 (Tabla B.2; fuga con Tabla B.7) escalados por masa: `TVL × 2.35/ρ`.
Es conservador para mezclas con hierro: a 18 MV el acero es ≈ 15 % mejor por masa que el concreto.

| ρ (g/cm³) | 6 MV TVL₁ / TVLₑ | 18 MV TVL₁ / TVLₑ | Co-60 |
|---|---|---|---|
| 3.5 | 24.8 / 22.2 | 30.2 / 28.9 | 14.1 |
| 4.0 | 21.7 / 19.4 | 26.4 / 25.3 | 12.3 |
| 5.0 | 17.4 / 15.5 | 21.2 / 20.2 | 9.9 |
| **5.5** | **15.8 / 14.1** | **19.2 / 18.4** | **9.0** |

Diferencia con el certificado a 5.0 g/cm³ y 18 MV: 20.2 cm frente a 15.2 cm, es decir +33 % de espesor.
Con la cota del acero el TVLₑ sería 17.3 cm. Lo que se ganaría al validar es como mucho ≈ 15 %, no 33 %.

## Protocolo de validación pendiente (5.5 g/cm³ para linac)

1. **Densidad gravimétrica** de al menos 10 bloques por lote (masa / volumen medido), con su dispersión.
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
