#!/usr/bin/env python3
"""
Fase 11 (seguimiento de #57, hallazgo N3) — referencia independiente en Python de `src/lib/terapiaEspectroGP.ts`
para los radionúclidos diagnósticos (Tc-99m, Tl-201, In-111, Ga-67, Sm-153, Zr-89) e I-123.

Método (el mismo del módulo, implementado aquí desde cero):
  T_GP(t) = Σᵢ fᵢ · B_GP(Eᵢ, µᵢ t) · exp(−µᵢ t)
  fᵢ = Iᵢ·Eᵢ·(µ_en/ρ)_aire(Eᵢ), normalizada (kerma en aire); líneas gamma ENSDF con Iγ ≥ 0.1 %, sin rayos X.
  µᵢ = µ/ρ SIN dispersión coherente × ρ_ref (Pb 11.35, Fe 7.874, concreto ordinario 2.35 g/cm³):
    E ≤ 0.8 MeV: Elam, Ravel y Sieber 2002 (xraydb 4.6.1; fotoeléctrico + incoherente);
    E > 0.8 MeV (Elam no es fiable): NIST SRD 126 total (log-log) − coherente de Elam a 0.8 MeV × (0.8/E)².
  B_GP: fórmula de Harima (ANS-6.4.3), coeficientes de exposición de la Tabla 5.1 de NUREG/CR-5740
  (= ORNL/RSIC-49/R1, Trubey 1991), 0.03–2 MeV; b, c, X_k log-log y a, d lineales en ln E; K congelado en K(40).

Uso: python3 scripts/fase11_diagnostico_gp.py  (requiere `pip install xraydb==4.6.1` y `scripts/fase11_xcom_mu_rho.json`). Imprime los µ por línea que
se transcriben en `ESPECTROS_TERAPIA` y los valores de referencia de `src/__tests__/auditoria/diagnosticoEspectroGP.test.ts`.
"""
import json
import math
import os

import xraydb

# ── ANS-6.4.3 GP de exposición (NUREG/CR-5740, Tabla 5.1: Pb p. impresa 92, Fe 85, concreto 96) ──
GP = {
    'Pb': [
        (0.03, 1.003, 0.396, 0.248, 14.56, -0.1696), (0.04, 1.007, 0.438, 0.204, 14.26, -0.1093),
        (0.05, 1.012, 0.405, 0.244, 14.18, -0.1624), (0.06, 1.017, 0.487, 0.18, 13.37, -0.1037),
        (0.08, 1.033, 0.523, 0.153, 13.3, -0.0777), (0.1, 2.037, 1.432, 0.079, 18.37, -0.0935),
        (0.15, 1.408, 0.362, 0.281, 21.46, -0.0964), (0.2, 1.184, 0.19, 0.381, 13.27, -0.1868),
        (0.3, 1.122, 0.533, 0.137, 13.69, -0.0612), (0.4, 1.135, 0.67, 0.085, 19.56, -0.0325),
        (0.5, 1.179, 0.725, 0.072, 14.89, -0.0244), (0.6, 1.228, 0.744, 0.064, 14.47, -0.0184),
        (0.8, 1.283, 0.8, 0.05, 15.2, -0.0191), (1.0, 1.318, 0.86, 0.035, 16.49, -0.0154),
        (1.5, 1.375, 0.891, 0.029, 13.29, -0.0168), (2.0, 1.388, 0.939, 0.024, 13.33, -0.0266),
    ],
    'Fe': [
        (0.03, 1.028, 0.374, 0.19, 29.34, -0.317), (0.04, 1.058, 0.336, 0.248, 11.65, -0.1188),
        (0.05, 1.099, 0.366, 0.232, 14.01, -0.1354), (0.06, 1.148, 0.405, 0.208, 14.17, -0.1142),
        (0.08, 1.267, 0.47, 0.18, 14.48, -0.0974), (0.1, 1.389, 0.557, 0.144, 14.11, -0.0791),
        (0.15, 1.66, 0.743, 0.079, 14.12, -0.0476), (0.2, 1.839, 0.911, 0.034, 13.23, -0.0334),
        (0.3, 1.973, 1.095, -0.009, 11.86, -0.0183), (0.4, 1.992, 1.187, -0.027, 10.72, -0.014),
        (0.5, 1.967, 1.24, -0.039, 8.34, -0.0074), (0.6, 1.947, 1.247, -0.04, 8.2, -0.0096),
        (0.8, 1.906, 1.233, -0.038, 7.93, -0.011), (1.0, 1.841, 1.25, -0.048, 19.49, 0.014),
        (1.5, 1.75, 1.197, -0.04, 15.9, 0.011), (2.0, 1.712, 1.123, -0.021, 7.97, -0.0057),
    ],
    'Concreto': [
        (0.03, 1.212, 0.421, 0.201, 14.12, -0.1079), (0.04, 1.455, 0.493, 0.171, 14.53, -0.0925),
        (0.05, 1.737, 0.628, 0.115, 15.82, -0.06), (0.06, 2.125, 0.664, 0.118, 11.9, -0.0615),
        (0.08, 2.557, 0.895, 0.042, 14.37, -0.0413), (0.1, 2.766, 1.069, 0.001, 12.64, -0.0251),
        (0.15, 2.824, 1.315, -0.049, 8.66, -0.0048), (0.2, 2.716, 1.43, -0.07, 18.52, 0.0108),
        (0.3, 2.522, 1.492, -0.082, 16.59, 0.0161), (0.4, 2.372, 1.494, -0.085, 15.96, 0.0194),
        (0.5, 2.271, 1.466, -0.082, 16.25, 0.0195), (0.6, 2.192, 1.434, -0.078, 17.02, 0.0199),
        (0.8, 2.066, 1.386, -0.073, 15.07, 0.0202), (1.0, 1.982, 1.332, -0.065, 15.38, 0.0193),
        (1.5, 1.848, 1.227, -0.047, 16.41, 0.016), (2.0, 1.775, 1.154, -0.033, 14.35, 0.01),
    ],
}
RHO = {'Pb': 11.35, 'Fe': 7.874, 'Concreto': 2.35}

# NIST SRD 126 (Hubbell y Seltzer): µ/ρ total con coherente (Pb z82, Fe z26, «Concrete, Ordinary») y µ_en/ρ del aire.
NIST_MU = {
    'Pb': [(0.8, 0.0887), (1.0, 0.07102), (1.25, 0.05876), (1.5, 0.05222), (2.0, 0.04606)],
    'Fe': [(0.8, 0.06699), (1.0, 0.05995), (1.25, 0.0535), (1.5, 0.04883), (2.0, 0.04265)],
    'Concreto': [(0.8, 0.07227), (1.0, 0.06495), (1.25, 0.05807), (1.5, 0.05288), (2.0, 0.04557)],
}
MUEN_AIRE = [(0.03, 0.1537), (0.04, 0.06833), (0.05, 0.04098), (0.06, 0.03041), (0.08, 0.02407), (0.1, 0.02325),
             (0.15, 0.02496), (0.2, 0.02672), (0.3, 0.02872), (0.4, 0.02949), (0.5, 0.02966), (0.6, 0.02953),
             (0.8, 0.02882), (1.0, 0.02789), (1.25, 0.02666), (1.5, 0.02547), (2.0, 0.02345)]

# «Concrete, Ordinary» de NIST SRD 126 (Tabla 2, fracciones en masa); con ella µ coincide con el módulo a 1e-5.
CONCRETO = {'H': 0.0221, 'C': 0.002484, 'O': 0.57493, 'Na': 0.015208, 'Mg': 0.001266, 'Al': 0.019953, 'Si': 0.304627,
            'K': 0.010045, 'Ca': 0.042951, 'Fe': 0.006435}
ELEM = {'Pb': {'Pb': 1.0}, 'Fe': {'Fe': 1.0}, 'Concreto': CONCRETO}


def loglog(tab, E):
    if E <= tab[0][0]:
        return tab[0][1]
    for (e0, v0), (e1, v1) in zip(tab, tab[1:]):
        if E <= e1:
            w = math.log(E / e0) / math.log(e1 / e0)
            return math.exp(math.log(v0) + w * math.log(v1 / v0))
    return tab[-1][1]


def elam(mat, E_MeV, kind):
    return sum(w * float(xraydb.mu_elam(el, E_MeV * 1e6, kind=kind)) for el, w in ELEM[mat].items())


def mu_sin_coh(mat, E_MeV):
    if E_MeV <= 0.8:
        return elam(mat, E_MeV, 'photo') + elam(mat, E_MeV, 'incoh')
    return loglog(NIST_MU[mat], E_MeV) - elam(mat, 0.8, 'coh') * (0.8 / E_MeV) ** 2


def coef(mat, E):
    f = GP[mat]
    if E <= f[0][0]:
        return f[0][1:]
    if E >= f[-1][0]:
        return f[-1][1:]
    i = 0
    while i < len(f) - 2 and f[i + 1][0] < E:
        i += 1
    r0, r1 = f[i], f[i + 1]
    w = math.log(E / r0[0]) / math.log(r1[0] / r0[0])
    lg = lambda k: math.exp(math.log(r0[k]) + w * math.log(r1[k] / r0[k]))
    li = lambda k: r0[k] + w * (r1[k] - r0[k])
    return (lg(1), lg(2), li(3), lg(4), li(5))


T2 = math.tanh(-2)


def bxe(p, x):
    """B_GP(x)·e^(−x), K congelado en K(40), en logaritmos si desborda."""
    if x <= 0:
        return 1.0
    b, c, a, Xk, d = p
    xk = min(x, 40)
    K = c * xk ** a + d * (math.tanh(xk / Xk - 2) - T2) / (1 - T2)
    if abs(K - 1) < 1e-9:
        return (1 + (b - 1) * x) * math.exp(-x)
    try:
        return (1 + (b - 1) * (K ** x - 1) / (K - 1)) * math.exp(-x)
    except OverflowError:
        return math.exp(math.log(b - 1) + x * math.log(K) - math.log(K - 1) - x)


# ── Espectros ENSDF (Iγ ≥ 0.1 %, sin rayos X) ──
ESPECTROS = {
    'Tc99m': [(140.511, 89.0)],  # Browne y Tuli, NDS 145:25 (2017)
    'Tl201': [(30.60, 0.258), (32.19, 0.263), (135.34, 2.605), (165.88, 0.147), (167.43, 10.0)],  # Kondev, NDS 187:355 (2023)
    'In111': [(171.28, 90.7), (245.35, 94.1)],  # Blachot, NDS 110:1239 (2009)
    'Ga67': [(91.265, 3.11), (93.31, 38.81), (184.576, 21.41), (208.95, 2.46), (300.217, 16.64), (393.527, 4.56),
             (887.688, 0.148)],  # Huo, Huang y Tuli, NDS 106:159 (2005)
    'Sm153': [(69.673, 4.67), (75.42213, 0.19), (83.36717, 0.191), (89.48595, 0.157), (97.431, 0.763),
              (103.18012, 29.14)],  # Nica, NDS 170:1 (2020)
    'Zr89': [(511.0, 45.5), (909.15, 99.04), (1657.3, 0.106), (1713.0, 0.745), (1744.5, 0.123)],  # Singh, NDS 114:1 (2013)
    'I123': [(159.0, 83.6), (346.36, 0.12), (440.02, 0.388), (505.33, 0.288), (528.97, 1.27), (538.54, 0.31)],
    # Terapia (para el criterio único y el haz estrecho; su GP está en `terapiaEspectroGP.test.ts`).
    'I131': [(80.185, 2.62), (177.214, 0.269), (284.305, 6.12), (325.789, 0.273), (364.489, 81.5), (503.004, 0.359),
             (636.989, 7.16), (642.719, 0.217), (722.911, 1.77)],  # Khazov et al., NDS 107:2715 (2006)
    'Lu177': [(71.6418, 0.164), (112.9498, 6.23), (208.3662, 10.41), (249.6742, 0.1997), (321.3159, 0.2186)],  # Kondev, NDS 159:1 (2019)
}


# Haz estrecho (criterio (a)): µ/ρ total NIST XCOM con coherente, malla fina de `scripts/fase11_xcom_malla.py`
# (`fase11_xcom_mu_rho.json`; exacta en las líneas duras), log-log. Revisión del #58, H2: con la malla de SRD 126
# (0.2/0.3 MeV) In-111/Pb quedaba un 1.6 % corto y 722.9 keV un 0.8 %.
_MALLA = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fase11_xcom_mu_rho.json')))['muRhoTotal']
NIST_MU_ESTRECHO = {'Pb': [(r[0], r[1]) for r in _MALLA], 'Concreto': [(r[0], r[4]) for r in _MALLA]}
# Criterio único (revisión del #58): (a) si la línea dura (la más energética con Iγ ≥ 0.1 %) aporta ≥ 2 % del kerma.
PESO_MIN_LINEA_DURA = 0.02


def loglog_malla(tab, E):
    for (e0, v0), (e1, v1) in zip(tab, tab[1:]):
        if E <= e1 and e1 > e0:
            w = math.log(E / e0) / math.log(e1 / e0)
            return math.exp(math.log(v0) + w * math.log(v1 / v0))
    return tab[-1][1]


def linea_dura(nuc):
    ls = ESPECTROS[nuc]
    i = max((k for k in range(len(ls)) if ls[k][1] >= 0.1), key=lambda k: ls[k][0])
    return ls[i][0], fracciones(nuc)[i]


def haz_estrecho(nuc):
    return linea_dura(nuc)[1] >= PESO_MIN_LINEA_DURA


def estrecho_mm(nuc, mat, B):
    """Haz estrecho a la línea dura (se calcule o no el criterio: sirve también para el caso hipotético)."""
    E = linea_dura(nuc)[0] / 1000
    return -math.log(B) / (loglog_malla(NIST_MU_ESTRECHO[mat], E) * RHO[mat]) * 10


def fracciones(nuc):
    k = [I / 100 * E * loglog(MUEN_AIRE, E / 1000) for E, I in ESPECTROS[nuc]]
    s = sum(k)
    return [v / s for v in k]


MU = {nuc: [{m: round(mu_sin_coh(m, E / 1000), 5) for m in RHO} for E, _ in ESPECTROS[nuc]] for nuc in ESPECTROS}


def T_gp(nuc, mat, t_cm):
    f = fracciones(nuc)
    return sum(fi * bxe(coef(mat, E / 1000), MU[nuc][i][mat] * RHO[mat] * t_cm) for i, ((E, _), fi) in enumerate(zip(ESPECTROS[nuc], f)))


def espesor_mm(nuc, mat, B):
    lo, hi = 0.0, 1.0
    while T_gp(nuc, mat, hi) > B:
        hi *= 2
    for _ in range(200):
        m = (lo + hi) / 2
        if T_gp(nuc, mat, m) > B:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2 * 10


if __name__ == '__main__':
    # Control: los µ de I-131 364.489 keV del módulo (0.25409 / 0.09541 / 0.10076).
    print('control I-131 364.489 keV (módulo 0.25409 / 0.09541 / 0.10076):', {m: round(mu_sin_coh(m, 0.364489), 5) for m in RHO})
    for nuc, ls in ESPECTROS.items():
        print(f'\n== {nuc}')
        for (E, I), mu in zip(ls, MU[nuc]):
            print(f'  L({E}, {I}, {mu["Pb"]}, {mu["Fe"]}, {mu["Concreto"]}),')
        print('  fracciones:', [round(x, 5) for x in fracciones(nuc)])
        f = fracciones(nuc)
        Ed, peso = linea_dura(nuc)
        print(f'  línea dura {Ed} keV, peso {100 * peso:.2f} % → criterio (a): {haz_estrecho(nuc)}')
        for mat in ('Pb', 'Concreto'):
            print(f'  {mat} GP: ' + ' '.join(f'B={B:g}:{espesor_mm(nuc, mat, B):.3f}' for B in (0.5, 0.1, 0.01, 1e-3)))
            print(f'  {mat} estrecho{"" if haz_estrecho(nuc) else " (hipotético: no aplica)"}: ' + ' '.join(f'B={B:g}:{estrecho_mm(nuc, mat, B):.3f}' for B in (0.5, 0.1, 0.01, 1e-3)))
        for mat, ts in (('Pb', (0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.2, 2.0, 3.5)), ('Concreto', (5, 10, 15, 20, 25, 30))):
            print(f'  T {mat}: ' + ' '.join(f'{t}:{T_gp(nuc, mat, t):.6g}' for t in ts))
            E = linea_dura(nuc)[0] / 1000
            mu = loglog_malla(NIST_MU_ESTRECHO[mat], E) * RHO[mat]
            print(f'  T estrecho {mat}: ' + ' '.join(f'{t}:{math.exp(-mu * t):.7g}' for t in ts))
