# RadShield-MX

RadShield-MX es una aplicacion React/TypeScript para diseno, calculo y documentacion de blindajes radiologicos en instalaciones medicas. Integra canvas 2D, floorplan 3D, calculos NCRP/IAEA/AAPM, Evidence Pack, memoria analitica y backend tRPC/Drizzle opcional.

## Estado actual

- F73 documenta el estado de estabilizacion, Update App, DB/IA/RAG y reorganizacion de menus.
- Frontend Vite/React validado con build de produccion.
- Canvas con herramientas de barrera, fuente, region, medicion, zoom, snap y export PNG.
- Fuentes visuales por equipo: LINAC, Gamma Knife, CT, PET/CT, HDR, ciclotron, SPECT y mastografia.
- Visor Medical 3D con footprints de equipo y export OBJ/JSON.
- Evidence Pack, Memoria AI, Regulatory Report y PDF Report conectados a evidencia F76/F77.
- DB preparada para MySQL/Drizzle, pero la reconstruccion real requiere `DATABASE_URL`.
- RAG local con roadmap de busqueda hibrida, ledger de citas y deep-dive planner.

## Comandos principales

```bash
npm run check:app
npm run build
npm run test:f72:rag-dwg-canvas3d
npm run test:f78:document-smoke
npm run build:backend
npm run test:backend:health
npm run test:backend:contracts
```

## Base de datos

La reconstruccion DB debe hacerse solo contra una DB local/test.

```powershell
$env:DATABASE_URL="mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test"
npm run db:migrate
npm run db:seed
npm run db:validate:live
```

Sin `DATABASE_URL`, la app opera en modo local/offline y los health checks esperan `/api/health/db = 503`.

## Documentacion tecnica

- `DB_RECONSTRUCTION_RUNBOOK.md`
- `outputs/fase_71_db_reconstruction_preflight.md`
- `outputs/fase_72_rag_dwg_canvas3d.md`
- `outputs/fase_73_documentacion_update_app_roadmap.md`
- `MANUAL_USUARIO_v99.md`
- `CHANGELOG.md`
