# RadShield-MX

Diseño, cálculo y documentación de blindajes radiológicos para instalaciones médicas: radioterapia
(LINAC, Gamma Knife, HDR), medicina nuclear y PET/CT, ciclotrones, rayos X diagnósticos y
mastografía. Corresponde a la fase **B.18 (RadShield & Radiation Protection)** del plan canónico de
GAMMA.

> Repositorio privado, de uso interno. Los cálculos y memorias que produce son herramientas de
> ingeniería: la firma y la responsabilidad regulatoria (CNSNS) son del físico médico responsable.

## Objetivos

1. **Plano → modelo → cálculo → memoria**, de forma trazable:
   - importar el plano (DXF/DWG/PDF) y verificar sus dimensiones;
   - colocar fuentes y barreras;
   - calcular espesores con NCRP 147/151, AAPM TG-108 e IAEA SRS-47;
   - generar la memoria CNSNS (.docx) y el reporte PDF.
2. **Cada número con su fuente.** Las referencias documentales salen de GAMMA-AI, el motor
   científico del ecosistema, con documento, página y fragmento verificables por SHA-256.
3. **Datos físicos de la instalación real.** El flujo térmico en el aire de la bóveda del KIUBE
   proviene de la simulación Monte Carlo de Cyclotron-SIM (contrato `cyclotron-sim/flujo_aire@1`).

## Funciones principales

| Área | Qué hace |
|---|---|
| Canvas 2D | Barreras, fuentes, regiones, medición, ajuste a la cuadrícula, importación DXF con mapeo de capas, exportación PNG |
| Visor 3D | Three.js / React-Three-Fiber, con adaptador Babylon.js; huellas de equipos y exportación OBJ/JSON |
| Cálculo | Espesor por barrera y material (TVL/HVL, XCOM), kerma en puntos de control, cielo (skyshine) por Chilton, incertidumbre GUM |
| Verificación | Espesor instalado frente al requerido, barrera por barrera (`src/lib/verificacionBlindaje.ts`) |
| Ventilación | Ar-41 en la bóveda: concentración, DAC, tiempo de espera y emisión por la chimenea, con el flujo del MC (`src/lib/ventilacionBunker.ts`) |
| Materiales | Registro técnico (densidad, TVL, masa, costo, carga estructural) y fichas de tabiques (Contuplex, Nipol) |
| Documentos | Memoria CNSNS con la sección **6.1 Evidencia documental citada (GAMMA-AI)**, reporte PDF y Evidence Pack |

## Arquitectura y versiones

| Componente | Tecnología | Versión |
|---|---|---|
| Aplicación | `radshield-mx` | **86.0.0** (`package.json`) |
| Escritorio | Tauri (`src-tauri`) | 13.4.0 |
| Frontend | React · TypeScript · Vite · Zustand · Tailwind | 19.2 · 5.9 · 7.2 · 5.0 · 3.4 |
| API opcional | Hono + tRPC + Drizzle (`api/`) | 4.8 · 11.8 · 0.45 |
| Base de datos opcional | MySQL | 8.0 |
| Pruebas | Vitest · Playwright | 4.0 · 1.60 |
| Node | CI: 20 · contenedores: 24 (Alpine) | |

Sin `DATABASE_URL`, la aplicación funciona completa en modo local u offline; `/api/health/db`
responde 503. La base sólo se necesita para la persistencia en el servidor.

```
src/            aplicación (sections/, components/, hooks/, lib/, stores/, data/, types/)
api/            backend Hono + tRPC (routers por dominio)
db/             esquema y migraciones Drizzle
src-tauri/      empaquetado de escritorio
data/pdf/       normas fuente (NCRP 151, TG-108, NOM-008-ENER, Room Shield Design) → GAMMA
scripts/        utilidades (ver scripts/README.md)
e2e/            pruebas Playwright
docs/           auditorías, planes, runbooks y manuales anteriores
```

## Contenedores

`docker-compose.yml` levanta la pila local completa:

| Servicio | Imagen / Dockerfile | Puerto | Función |
|---|---|---|---|
| `frontend` | `Dockerfile.frontend` (node:24-alpine → nginx) | 8080 | Build estático offline-first |
| `api` | `Dockerfile.api` (node:24-alpine) | 3000 | Hono + tRPC; depende de `db` |
| `db` | `mysql:8.0` | 3306 | Persistencia; volumen `mysql-data` |

`docker-compose.db.yml` levanta sólo la base de pruebas (`radshield_mx_test`). El `Dockerfile` de
la raíz es el build de producción en una sola imagen.

```bash
docker compose up -d --build                         # pila completa
docker compose -f docker-compose.db.yml up -d        # sólo la base de pruebas
```

## Uso

```bash
npm ci
npm run dev            # desarrollo (Vite)
npm run build          # build de producción
npm test               # Vitest
npm run lint:ci        # ESLint con trinquete (.eslint-baseline.json: no se aceptan errores nuevos)
npx tsc --noEmit       # tipos
npm run tauri:dev      # escritorio
```

Base de datos (opcional):

```bash
export DATABASE_URL="mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test"
npm run db:migrate && npm run db:seed && npm run db:validate:live
```

Los scripts `prepare:fNNN` y `test:fNNN` de `package.json` son verificaciones de fases anteriores.
Siguen funcionando, pero no forman parte del flujo diario.

## Integración con el ecosistema

| Con | Contrato | Dónde |
|---|---|---|
| **GAMMA-AI** (evidencia) | `gamma/evidencia@1`, `gamma/paquete_evidencia@1` | `src/lib/gammaEvidence.ts`, `src/lib/gammaCliente.ts` |
| **GAMMA-AI** (ingesta de normas) | `gamma/ingesta@1` | `scripts/manifiesto_gamma.py` → `gamma-ingesta.json` |
| **Cyclotron-SIM** (MC) | `cyclotron-sim/flujo_aire@1` | `src/data/flujo_aire_kiube.json`, `ventilacionBunker.ts` |

- **Consulta en vivo:** `VITE_GAMMA_URL=http://127.0.0.1:8765`, con GAMMA corriendo
  `gamma ecosistema servir --origen http://localhost:5173`.
- **Sin servicio:** se usa el paquete versionado `src/data/gamma-evidencia-memoria.json`, que se
  regenera con `scripts/gamma-consultas-memoria.json`.

Toda cita se verifica contra su SHA-256, y la memoria declara que la evidencia es experimental y
no apta para firma.

## Calidad

La CI (`.github/workflows/ci.yml`) corre en cada PR: TypeScript, ESLint con trinquete, Vitest,
build de producción, Playwright E2E y despliegue estático. Ningún cambio entra a `main` sin la CI
en verde.

## Documentación

- `CHANGELOG.md`: historial de fases.
- `MANUAL_USUARIO_v99.md`, `MANUAL_VERSIONES_v50.md`, `CONTROL_DE_CAMBIOS_v99.md`: manuales
  vigentes; las pruebas los referencian.
- `DB_RECONSTRUCTION_RUNBOOK.md`, `F81_DOCKER_DESKTOP_DB_RUNBOOK.md`: operación de la base.
- `TECH_DEBT_QUARANTINE.md`: deuda técnica en cuarentena.
- `docs/auditorias/`, `docs/planes/`, `docs/runbooks/`: documentos anteriores, sin cambios.
