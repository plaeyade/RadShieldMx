<!-- encabezado-gamma -->
<div align="center">

<img src="docs/assets/RadShield.svg" width="88" height="88" alt="Logotipo de RadShield-MX">

# RadShield-MX

**Diseño, cálculo y memoria de blindajes radiológicos para instalaciones médicas**

[![ci](https://github.com/plaeyade/RadShieldMx/actions/workflows/ci.yml/badge.svg)](https://github.com/plaeyade/RadShieldMx/actions/workflows/ci.yml) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![React](https://img.shields.io/badge/React-19-61DAFB) ![normas](https://img.shields.io/badge/normas-NCRP%20147%20%C2%B7%20151%20%C2%B7%20TG--108%20%C2%B7%20SRS--47-informational) ![licencia](https://img.shields.io/badge/licencia-propietaria-lightgrey)

**[Abrir la aplicación](https://plaeyade.github.io/RadShieldMx/)** · [Qué es](#qué-es) · [Estado](#estado) · [Instalación](#instalación-y-uso) · [Arquitectura](#arquitectura) · [Documentación](#documentación) · [Licencia](#licencia-y-datos)

</div>

> [!IMPORTANT]
> **No contiene datos reales** de pacientes ni planos de una instalación identificable: los
> proyectos, planos y cargas de trabajo del repositorio son de ejemplo. Los cálculos y memorias
> son herramientas de ingeniería; la firma y la responsabilidad ante la CNSNS son del físico
> médico responsable.
<!-- /encabezado-gamma -->

## Qué es

RadShield-MX es el módulo de **blindajes** de GAMMA OS. Diseña, calcula y documenta blindajes de
instalaciones médicas: rayos X diagnósticos, tomografía, mastografía, fluoroscopía, medicina
nuclear y PET/CT, teleterapia de megavoltaje, braquiterapia HDR y ciclotrones. Del plano
arquitectónico sale un modelo, del modelo el cálculo por barrera, y del cálculo la memoria
analítica para la CNSNS con cada número citado.

| Área | Qué hace |
|---|---|
| Plano | Importación DXF/DWG/PDF con mapeo de capas y verificación de escala; lienzo CAD 2D con barreras, fuentes, regiones y puntos de control |
| Diagnóstico (NCRP 147) | Barreras primarias y secundarias por distribución de carga; varias fuentes a la vez; TC por método DLP |
| Teleterapia (NCRP 151) | Primaria con TVL₁/TVLₑ, fuga con carga IMRT, dispersión del paciente por ángulo, regla de las dos fuentes |
| Medicina nuclear y PET (TG-108) | Kerma por constante Γ, TVL a 511 keV, criterios de alta de paciente (NRC RG 8.39) |
| Ciclotrón | Tasas por dirección de la guía del fabricante; término fuente y flujo de neutrones del Monte Carlo de Cyclotron-SIM; ventilación del Ar-41 |
| Materiales | Densidad, TVL citados, masa, costo y carga estructural por material |
| Verificación | Espesor instalado frente al requerido, barrera por barrera |
| Visualización | Mapa de dosis 2D y visor 3D |
| Documentos | Memoria CNSNS (.docx) con evidencia citada, reporte PDF y paquete de evidencia |

**Validación contra los informes**

| Caso | Informe | RadShield |
|---|---|---|
| Unidad de tórax, muro primario, 300 pacientes/semana a 3 m | 2.2 mm Pb (NCRP 147 §5.2) | 2.2 mm |
| Transmisión de 1.66 mm Pb, Rad Room (chest bucky) | 9.3 × 10⁻⁴ (NCRP 147 Ap. A) | 9.3 × 10⁻⁴ |
| Primaria 18 MV, punto C a 7.2 m | 149.6 cm concreto (NCRP 151 §7.1.1) | 149.6 cm |
| Dispersión 18 + 6 MV a 30°, punto A | 55.6 cm (NCRP 151 §7.1.5) | 55.6 cm |
| Fuga 18 + 6 MV, punto A | 48 cm (NCRP 151 §7.1.5) | 48 cm |

## Estado

- **Beta de ingeniería**, publicada en GitHub Pages en cada push a `main`
  (pausable con la variable de repositorio `PAGES_HABILITADO=false`).
- Sin validación regulatoria: cada memoria debe revisarla y firmarla el físico médico.
- Siguiente: beta con el equipo de física médica sobre planos reales, laberinto y puerta para
  ≥ 10 MV (NCRP 151 §2.4–2.5), importación BIM (IFC) y recorrido WebXR con el mapa de dosis.

## Instalación y uso

Requisitos: Node 20 o superior. Docker sólo para la API opcional.

```bash
npm ci
npm run dev          # desarrollo en http://localhost:5173
npm test             # pruebas (Vitest)
npm run lint:ci      # ESLint sin errores nuevos
npm run build        # producción en dist/
docker compose up -d --build   # pila completa: frontend, API y base de datos
```

La aplicación funciona completa en el navegador, sin servidor.

## Arquitectura

Documento de referencia: **[GAMMA OS — arquitectura](https://claude.ai/artifact/Lcv9Kscf4kYn8cqWrd46UQ)**.

| Componente | Tecnología |
|---|---|
| Aplicación web y escritorio | React 19 · TypeScript · Vite · Zustand · Tailwind · Tauri |
| API opcional | Hono · tRPC · Drizzle · MySQL 8 |
| Pruebas | Vitest · Playwright · ESLint con trinquete |

```
src/lib/        motores de cálculo (ncrp147, ncrp151, normativeBarrierEngine, cyclone, nuclear…)
src/sections/   lienzo, paneles y diálogos
src/data/       paquete de evidencia de GAMMA y datos del Monte Carlo
api/, db/       backend y esquema opcionales
public/         recursos servidos por la aplicación (incluidos manuales en PDF)
site/           página de presentación independiente
docs/           revisión física, manuales, planes y runbooks
```

Las tablas normativas están transcritas en `src/lib/ncrp147.ts` y `src/lib/ncrp151.ts`, con informe
y página en cada constante; la revisión física está en
[docs/revision-fisica-2026-11.md](docs/revision-fisica-2026-11.md).

Integración con GAMMA OS (contratos JSON versionados, no imports):

| Con | Contrato | Para qué |
|---|---|---|
| [GAMMA-AI](https://github.com/plaeyade/GAMMA-AI) | `gamma/evidencia@1`, `gamma/paquete_evidencia@1`, `gamma/ingesta@1` | Citas de la memoria y registro de las normas indexadas |
| [Cyclotron-SIM](https://github.com/plaeyade/Cyclotron-SIM) | `cyclotron-sim/flujo_aire@1` | Flujo de neutrones en el aire de la bóveda (Ar-41) |
| Zumaya-AI (privado) | planos y presupuesto operativo | Geometría y carga del edificio |

## Documentación

| Tema | Dónde |
|---|---|
| Manual de usuario | [MANUAL_USUARIO_v99.md](MANUAL_USUARIO_v99.md) |
| Cambios | [CHANGELOG.md](CHANGELOG.md), [CONTROL_DE_CAMBIOS_v99.md](CONTROL_DE_CAMBIOS_v99.md) |
| Revisión física y validación de bloques | [docs/revision-fisica-2026-11.md](docs/revision-fisica-2026-11.md), [docs/validacion-bloques-hd.md](docs/validacion-bloques-hd.md) |
| Plan de motores de cálculo | [docs/plan-motores-calculo.md](docs/plan-motores-calculo.md) |
| Base de datos y respaldo | [DB_RECONSTRUCTION_RUNBOOK.md](DB_RECONSTRUCTION_RUNBOOK.md), [docs/runbooks/](docs/runbooks/) |
| Auditorías, planes y manuales anteriores | [docs/historico/](docs/historico/README.md) |

## Licencia y datos

- **Licencia propietaria, todos los derechos reservados.** El código es visible públicamente para
  consulta; publicarlo no concede licencia de uso, copia, modificación ni distribución.
- **Sin datos reales:** ningún dato de pacientes entra en este repositorio; planos y cargas de
  trabajo son de ejemplo.
- Las normas (NCRP, AAPM, OIEA, NRC) pertenecen a sus editores; aquí sólo se citan y se transcriben
  los valores necesarios para el cálculo, con su referencia.
