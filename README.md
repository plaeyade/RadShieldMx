# RadShield-MX

RadShield-MX es una aplicacion React/TypeScript para diseno, calculo y documentacion de blindajes radiologicos en instalaciones medicas. Integra canvas 2D, floorplan 3D, calculos NCRP/IAEA/AAPM, Evidence Pack, memoria analitica y backend tRPC/Drizzle opcional.

## Estado actual

- F73 documenta el estado de estabilizacion, Update App, DB/IA/RAG y reorganizacion de menus.
- Frontend Vite/React validado con build de produccion.
- Canvas con herramientas de barrera, fuente, region, medicion, zoom, snap y export PNG.
- Fuentes visuales por equipo: LINAC, Gamma Knife, CT, PET/CT, HDR, ciclotron, SPECT y mastografia.
- Visor Medical 3D con footprints de equipo y export OBJ/JSON.
- Evidence Pack, Memoria AI, Regulatory Report y PDF Report conectados a evidencia F76/F77.
- DB live validada con MySQL/Drizzle en F168: migracion, seed, validacion, backup y restore probe OK.
- RAG local con roadmap de busqueda hibrida, ledger de citas y deep-dive planner.
- Node/npm validados en Windows: Node v24.18.0 y npm 11.16.0.

## Comandos principales

```bash
npm run check:app
npm run build
npm run test:f72:rag-dwg-canvas3d
npm run test:f78:document-smoke
npm run build:backend
npm run test:backend:health
npm run test:backend:contracts
npm run test:f168:db-live-final
```

## Base de datos

La DB live local quedo validada en F168 contra MySQL Windows. Para repetir la validacion o reconstruir una DB local/test:

```powershell
$env:DATABASE_URL="mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test"
npm run db:migrate
npm run db:seed
npm run db:validate:live
npm run test:f168:db-live-final
```

Sin `DATABASE_URL`, la app opera en modo local/offline y los health checks esperan `/api/health/db = 503`. Con `DATABASE_URL` activo, F168 espera `db-live-ready`.

Si una sesion de Codex/PowerShell no hereda el PATH tras instalar Node, anteponer temporalmente:

```powershell
$env:PATH="C:\Program Files\nodejs;" + $env:PATH
```

## Documentacion tecnica

- `DB_RECONSTRUCTION_RUNBOOK.md`
- `outputs/fase_71_db_reconstruction_preflight.md`
- `outputs/fase_72_rag_dwg_canvas3d.md`
- `outputs/fase_73_documentacion_update_app_roadmap.md`
- `outputs/fase_168_db_live_finalization.md`
- `MANUAL_USUARIO_v99.md`
- `CHANGELOG.md`
