# Etapa 0 — Contención (31/10/2026)

Objetivo: que la app no muestre resultados inventados ni sugiera un aval que no existe, y que instale desde el registro oficial. **No cambia el cálculo**; eso es la etapa 1 (núcleo único validado).

| Cambio | Archivos |
|---|---|
| Banner "DEMOSTRACIÓN — resultados sintéticos" en los 7 diálogos que generan datos con `Math.random()` o curvas paramétricas | `Geant4McDialog`, `MCCloudDialog`, `MonteCarloEngine`, `MonteCarloSimulationWizard`, `Attila4MCVarianceReduction`, `GammaIndexAnalyzer`, `DVHAnalyzer` |
| `Geant4McDialog` sin ruido aleatorio (queda el valor analítico, rotulado como tal) | `Geant4McDialog.tsx` |
| Aviso global "no válido para firma" en la interfaz | `App.tsx`, `components/SyntheticResultBanner.tsx` |
| Leyenda "PRELIMINAR — no válido para firma" en cada página de los PDF | `hooks/usePDFGenerator.ts`, `MemoriaAnaliticaWizard.tsx` |
| Se quita "Respaldado por instituciones internacionales" y los logos de OIEA, NCRP, CNSNS, AAPM, ICRP, ICRU; queda "Normas de referencia (sin aval de estas instituciones)" | `SplashScreen.tsx`, `Login.tsx` |
| Un solo lockfile (`package-lock.json`) contra registry.npmjs.org; se eliminan `npm-shrinkwrap.json` (804 paquetes en registry.npmmirror.com), `pnpm-lock.yaml`, `pnpm-workspace.yaml`; `.npmrc` fija el registro | raíz |
| Se borran respaldos versionados | `ShieldingDesigner.tsx.backup`, `.bak2` |

Verificación: `tsc -p tsconfig.app.json` sin errores; vitest 335/337 (las 2 fallas son previas: gate de casos clínicos y carga estructural de materiales).

Pendiente para etapa 1: retirar estos diálogos o conectarlos a resultados reales (Cyclotron-SIM), y sustituir el núcleo de cálculo (ver "RadShieldMx — revisión técnica y plan de validación").
