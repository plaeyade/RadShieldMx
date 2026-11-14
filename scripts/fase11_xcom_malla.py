#!/usr/bin/env python3
"""
Fase 11 (revisión del #58, H2/H4/H5) — malla fina de µ/ρ total (con dispersión coherente) de NIST XCOM para el haz
estrecho del criterio (a) de `src/lib/terapiaEspectroGP.ts` (`XCOM_MU_RHO_MALLA`).

Fuente: base de datos de NIST XCOM 3.1 (Berger MJ, Hubbell JH, Seltzer SM et al., «XCOM: Photon Cross Sections
Database», NIST Standard Reference Database 8 / NBSIR 87-3597), archivos por elemento `MDATX3.zzz` (secciones eficaces
coherente, incoherente, fotoeléctrica y de pares en barn/átomo sobre la malla de XCOM, con los bordes duplicados). Son
los mismos datos de los que sale la tabla de NIST SRD 126 (XAAMDI, Hubbell y Seltzer) que usaba el módulo: en las
energías de esa tabla este script la reproduce a ±0.03 % (se comprueba al ejecutarlo).
Los `MDATX3.zzz` se distribuyen con el programa XCOM de NIST y, p. ej., en el paquete de PyPI `xoppylib` 1.0.60
(`xoppylib/data/xcom/`): sólo se leen como datos (no se ejecuta ningún binario).

Interpolación entre los nodos de XCOM, como el propio XCOM: spline cúbico en log-log de cada proceso por separado; el
fotoeléctrico por tramos entre bordes de absorción; pares como ln[σ/(1 − E_umbral/E)³]. La malla resultante lleva:
  · la malla de NIST SRD 126 (0.01–2 MeV) y 20 puntos por década (paso ×1.122);
  · las energías de las líneas que pueden entrar en el criterio (a) y las pedidas en la revisión (171.28, 245.35,
    321.3159, 364.489, 528.97, 636.989, 722.911 keV, …);
  · los bordes K y L1–L3 de Pb (88.0045, 15.8608, 15.2, 13.0352 keV) y de W (69.525, 12.0998, 11.544, 10.2068 keV),
    duplicados (debajo / encima del borde), como en NIST.
Con esa malla la interpolación log-log lineal del módulo queda a ≤ 0.33 % del valor de XCOM en cualquier energía de
0.03–2 MeV (Pb ≤ 0.19 %; el peor caso es el concreto hacia 50 keV; se comprueba aquí) y es exacta en las líneas listadas
(antes, con la malla de SRD 126: +1.6 % en Pb a 245.35 keV, +0.8 % a 722.911 keV).

Además imprime (H4) µ/ρ del yeso CaSO₄·2H₂O (composición de PNNL-15870 Rev. 1, «Gypsum (Plaster of Paris)») frente al
concreto ordinario de NIST y (H5) el µ/ρ sin coherente de XCOM en cada línea de los espectros, para contrastarlo con el
de Elam (xraydb) que usa el GP.

Uso: python3 scripts/fase11_xcom_malla.py <directorio con MDATX3.zzz>  → escribe scripts/fase11_xcom_mu_rho.json
"""
import json
import math
import os
import sys

NA = 0.602214076  # N_A·1e-24: barn/átomo → cm²/g al dividir por A

# «Concrete, Ordinary» de NIST SRD 126 (Tabla 2, fracciones en masa); la misma del script de diagnóstico.
CONCRETO = {1: 0.0221, 6: 0.002484, 8: 0.57493, 11: 0.015208, 12: 0.001266, 13: 0.019953, 14: 0.304627, 19: 0.010045,
            20: 0.042951, 26: 0.006435}
# Yeso CaSO₄·2H₂O (PNNL-15870 Rev. 1, «Gypsum (Plaster of Paris)»; fracciones de la fórmula con pesos atómicos IUPAC).
_M = {1: 1.008, 8: 15.999, 16: 32.06, 20: 40.078}
_N = {1: 4, 8: 6, 16: 1, 20: 1}
_MT = sum(_M[z] * n for z, n in _N.items())
YESO = {z: _M[z] * n / _MT for z, n in _N.items()}
MATERIALES = {'Pb': {82: 1.0}, 'W': {74: 1.0}, 'Fe': {26: 1.0}, 'Concreto': CONCRETO}

NIST126 = [0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.25, 1.5, 2.0]
# Líneas del criterio (a) (la más energética con Iγ ≥ 0.1 % de cada espectro) y energías pedidas en la revisión.
LINEAS = [0.103180, 0.140511, 0.159, 0.16743, 0.17128, 0.24535, 0.3213159, 0.364489, 0.52897, 0.53854, 0.636989,
          0.722911, 0.887688, 1.7445]
BORDES = {'Pb': [0.0880045, 0.0158608, 0.0152, 0.0130352], 'W': [0.069525, 0.0120998, 0.011544, 0.0102068]}
# Referencia NIST SRD 126 (µ/ρ total con coherente) para el control.
SRD126 = {
    'Pb': {0.1: 5.549, 0.15: 2.014, 0.2: 0.9985, 0.3: 0.4031, 0.4: 0.2323, 0.5: 0.1614, 0.6: 0.1248, 0.8: 0.0887, 1.0: 0.07102, 1.25: 0.05876, 1.5: 0.05222, 2.0: 0.04606},
    'Fe': {0.08: 0.5952, 0.1: 0.3717, 0.15: 0.1964, 0.2: 0.146, 0.3: 0.1099, 0.4: 0.094, 0.5: 0.08414, 0.6: 0.07704, 0.8: 0.06699, 1.0: 0.05995, 1.25: 0.0535, 1.5: 0.04883, 2.0: 0.04265},
    'Concreto': {0.08: 0.2014, 0.1: 0.1738, 0.15: 0.1436, 0.2: 0.1282, 0.3: 0.1097, 0.4: 0.09783, 0.5: 0.08915, 0.6: 0.08236, 0.8: 0.07227, 1.0: 0.06495, 1.25: 0.05807, 1.5: 0.05288, 2.0: 0.04557},
    'W': {1.0: 0.06618, 1.25: 0.05577, 1.5: 0.05, 2.0: 0.04433, 3.0: 0.04075, 6.0: 0.0421, 10.0: 0.04747, 20.0: 0.05893},
}
SRD126_PB_ALTA = {3.0: 0.04234, 6.0: 0.04391, 10.0: 0.04972, 20.0: 0.06206}
# Equivalencia W↔Pb (revisión del #58): µ/ρ total de Pb, W y de los aglutinantes de las aleaciones pesadas de W
# (ASTM B777: W-Ni-Fe / W-Ni-Cu, 90–97 % W) de 30 keV a 20 MeV.
ENERGIAS_W = [0.03, 0.04, 0.05, 0.06, 0.069525, 0.08, 0.0880045, 0.1, 0.103180, 0.140511, 0.15, 0.16743, 0.17128, 0.2,
              0.24535, 0.3, 0.3213159, 0.364489, 0.4, 0.5, 0.511, 0.6, 0.636989, 0.722911, 0.8, 0.887688, 1.0, 1.1732,
              1.25, 1.3325, 1.5, 1.7445, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 15.0, 18.0, 20.0]
BORDES_W = {0.069525, 0.0880045}
# Espectros (ENSDF, Iγ ≥ 0.1 %) de `ESPECTROS_TERAPIA`: energías en keV.
ESPECTROS = {
    'I131': [80.185, 177.214, 284.305, 325.789, 364.489, 503.004, 636.989, 642.719, 722.911],
    'Lu177': [71.6418, 112.9498, 208.3662, 249.6742, 321.3159],
    'I123': [159.0, 346.36, 440.02, 505.33, 528.97, 538.54],
    'Tc99m': [140.511],
    'Tl201': [30.6, 32.19, 135.34, 165.88, 167.43],
    'In111': [171.28, 245.35],
    'Ga67': [91.265, 93.31, 184.576, 208.95, 300.217, 393.527, 887.688],
    'Sm153': [69.673, 75.42213, 83.36717, 89.48595, 97.431, 103.18012],
    'Zr89': [511.0, 909.15, 1657.3, 1713.0, 1744.5],
}


def leer(dirx, z):
    t = open(os.path.join(dirx, 'MDATX3.%03d' % z)).read().split()
    it = iter(t)
    iz, A, nedg, ne = int(next(it)), float(next(it)), int(next(it)), int(next(it))
    [next(it) for _ in range(nedg)]  # índices de los bordes en la malla
    [next(it) for _ in range(nedg)]  # nombres de los bordes
    bordes = [float(next(it)) for _ in range(nedg)]
    E = [float(next(it)) for _ in range(ne)]
    d = {'z': iz, 'A': A, 'E': E, 'bordes': bordes}
    for k in ('coh', 'incoh', 'photo', 'pairn', 'paire'):
        d[k] = [float(next(it)) for _ in range(ne)]
    assert iz == z
    return d


def spline(x, y):
    """Spline cúbico natural."""
    n = len(x)
    h = [x[i + 1] - x[i] for i in range(n - 1)]
    al = [0.0] * n
    for i in range(1, n - 1):
        al[i] = 3 / h[i] * (y[i + 1] - y[i]) - 3 / h[i - 1] * (y[i] - y[i - 1])
    l, mu, zz = [1.0] + [0.0] * (n - 1), [0.0] * n, [0.0] * n
    for i in range(1, n - 1):
        l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1]
        mu[i] = h[i] / l[i]
        zz[i] = (al[i] - h[i - 1] * zz[i - 1]) / l[i]
    c, b, dd = [0.0] * n, [0.0] * (n - 1), [0.0] * (n - 1)
    for j in range(n - 2, -1, -1):
        c[j] = zz[j] - mu[j] * c[j + 1]
        b[j] = (y[j + 1] - y[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3
        dd[j] = (c[j + 1] - c[j]) / (3 * h[j])

    def ev(v):
        j = 0
        while j < n - 2 and x[j + 1] <= v:
            j += 1
        s = v - x[j]
        return y[j] + b[j] * s + c[j] * s * s + dd[j] * s ** 3
    return ev


def _nodos(E, v, lo, hi, transf=lambda e, y: y):
    """Nodos (ln E, ln v) en [lo, hi]; en un borde duplicado se toma el valor del lado del tramo."""
    xs, ys = [], []
    for e, y in zip(E, v):
        if not (lo * (1 - 1e-6) <= e <= hi * (1 + 1e-6)) or y <= 0:
            continue
        lx, ly = math.log(e), math.log(transf(e, y))
        if xs and abs(lx - xs[-1]) < 2e-5:
            if abs(e - lo) <= 1e-5 * lo:  # borde inferior del tramo: el valor de encima del borde
                xs[-1], ys[-1] = lx, ly
            continue
        xs.append(lx)
        ys.append(ly)
    return xs, ys


def sigma(d, E_eV, k, lado=+1):
    """σ (barn/átomo); `lado` = −1 toma el valor justo debajo de un borde y +1 el de encima."""
    E, v = d['E'], d[k]
    if k == 'photo':
        lo, hi = E[0], E[-1]
        for b in d['bordes']:
            en_borde = abs(b - E_eV) < 1e-6 * b
            if (en_borde and lado > 0) or (not en_borde and b < E_eV):
                lo = max(lo, b)
            else:
                hi = min(hi, b)
        xs, ys = _nodos(E, v, lo, hi)
        return math.exp(spline(xs, ys)(math.log(E_eV)))
    if k in ('pairn', 'paire'):
        th = 1.022e6 if k == 'pairn' else 2.044e6
        if E_eV <= th:
            return 0.0
        xs, ys = _nodos(E, v, th * 1.0001, E[-1], lambda e, y: y / (1 - th / e) ** 3)
        return math.exp(spline(xs, ys)(math.log(E_eV))) * (1 - th / E_eV) ** 3
    xs, ys = _nodos(E, v, E[0], E[-1])
    return math.exp(spline(xs, ys)(math.log(E_eV)))


def mu_rho(datos, comp, E_MeV, coh=True, lado=+1):
    s = 0.0
    for z, w in comp.items():
        d = datos[z]
        x = sum(sigma(d, E_MeV * 1e6, k, lado) for k in ('incoh', 'photo', 'pairn', 'paire'))
        if coh:
            x += sigma(d, E_MeV * 1e6, 'coh', lado)
        s += w * x * NA / d['A']
    return s


def main(dirx):
    zs = sorted({z for c in list(MATERIALES.values()) + [YESO, {28: 1, 29: 1}] for z in c})
    datos = {z: leer(dirx, z) for z in zs}
    # Control contra NIST SRD 126.
    peor = 0.0
    for m, ref in SRD126.items():
        for E, v in ref.items():
            peor = max(peor, abs(mu_rho(datos, MATERIALES[m], E) / v - 1))
    print(f'control frente a NIST SRD 126: desviación máxima {100 * peor:.3f} %')
    for E, v in SRD126_PB_ALTA.items():
        peor = max(peor, abs(mu_rho(datos, {82: 1.0}, E) / v - 1))
    print(f'control frente a NIST SRD 126 (incl. 3–20 MeV): desviación máxima {100 * peor:.3f} %')
    assert peor < 5e-4

    geo = [round(10 ** (k / 20), 12) / 1000 for k in range(20, 67)]  # 10 keV … 2 MeV (los extremos los da NIST126)
    geo = [e for e in geo if 0.01 <= e <= 2.0]
    bordes = sorted(e for v in BORDES.values() for e in v)
    base = sorted({round(e, 9) for e in NIST126 + LINEAS + geo} - {round(b, 9) for b in bordes})
    filas = []
    for E in sorted(base + bordes):
        if any(abs(E - b) < 1e-12 for b in bordes):
            for lado in (-1, +1):
                filas.append([E] + [float('%.5g' % mu_rho(datos, MATERIALES[m], E, True, lado)) for m in ('Pb', 'W', 'Fe', 'Concreto')])
        else:
            filas.append([E] + [float('%.5g' % mu_rho(datos, MATERIALES[m], E)) for m in ('Pb', 'W', 'Fe', 'Concreto')])

    # Error de la interpolación log-log lineal de la malla frente a XCOM, 30 keV–2 MeV (fuera de los bordes).
    def ll(col, E):
        for a, b in zip(filas, filas[1:]):
            if a[0] < E <= b[0] and b[0] > a[0]:
                w = math.log(E / a[0]) / math.log(b[0] / a[0])
                return math.exp(math.log(a[col]) + w * math.log(b[col] / a[col]))
        raise ValueError(E)
    err = 0.0
    for i in range(400):
        E = 0.03 * (2.0 / 0.03) ** (i / 399)
        if any(abs(E / b - 1) < 0.002 for b in bordes):
            continue
        for col, m in enumerate(('Pb', 'W', 'Fe', 'Concreto'), start=1):
            err = max(err, abs(ll(col, E) / mu_rho(datos, MATERIALES[m], E) - 1))
    print(f'interpolación log-log de la malla frente a XCOM (0.03–2 MeV): {100 * err:.3f} %')

    sincoh = {n: [[E, *(float('%.5g' % mu_rho(datos, MATERIALES[m], E / 1000, False)) for m in ('Pb', 'Fe', 'Concreto'))] for E in ls]
              for n, ls in ESPECTROS.items()}
    yeso = [[E, float('%.5g' % mu_rho(datos, YESO, E)), float('%.5g' % mu_rho(datos, CONCRETO, E))]
            for E in (0.03, 0.05, 0.07, 0.1, 0.14, 0.2, 0.3, 0.4, 0.511, 0.6, 1.0)]
    filas_w = []
    for E in ENERGIAS_W:
        for lado in ((-1, +1) if E in BORDES_W else (+1,)):
            filas_w.append([E] + [float('%.5g' % mu_rho(datos, {z: 1.0}, E, True, lado)) for z in (82, 74, 28, 26, 29)])
    out = {
        'muRhoWPb': {'columnas': ['E_MeV', 'Pb', 'W', 'Ni', 'Fe', 'Cu'], 'filas': filas_w},
        'fuente': 'NIST XCOM 3.1 (Berger et al., NIST SRD 8), MDATX3.zzz; spline cúbico log-log por proceso',
        'columnas': ['E_MeV', 'Pb', 'W', 'Fe', 'Concreto'],
        'muRhoTotal': filas,
        'muRhoSinCohLineas': sincoh,
        'yesoVsConcreto': {'columnas': ['E_MeV', 'yeso CaSO4·2H2O', 'concreto ordinario'], 'filas': yeso,
                           'fracciones': {str(z): round(w, 6) for z, w in YESO.items()}},
        'errorInterpolacion': round(err, 6),
    }
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fase11_xcom_mu_rho.json')
    with open(ruta, 'w') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print('escrito', ruta, len(filas), 'filas')
    for r in yeso:
        print(f'  yeso/concreto {r[0]} MeV: {r[1]} / {r[2]} = {r[1] / r[2]:.3f}')


if __name__ == '__main__':
    main(sys.argv[1])
