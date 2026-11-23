# Plan de migración: MySQL 8 + Drizzle → PostgreSQL 16 + Drizzle

Estado: **propuesta** (23-11-2026). No cambia código ni datos; describe el trabajo para decidir cuándo hacerlo.

## 1. Situación actual

- Motor: MySQL 8.0 (imagen `mysql:8.0` en `docker-compose.yml` y `docker-compose.db.yml`), sólo como base
  local o de prueba (`radshield_mx_test`). El frontend funciona sin base de datos (offline-first); la API
  (`api/`, tRPC + Hono) es la única que la usa.
- ORM: `drizzle-orm` 0.45 con el driver `drizzle-orm/mysql2` (`api/queries/connection.ts`, modo
  `planetscale`) y `drizzle-kit` 0.31 (`drizzle.config.ts`, `dialect: "mysql"`).
- Esquema: `db/schema.ts`, 21 tablas `mysqlTable` con 16 `mysqlEnum`, 21 `serial`, 35 `timestamp`
  (varios con `.onUpdateNow()`), `varchar`, `float` y `text`. Los JSON se guardan como `text`
  (`floorPlanJson`, `geometry_json`, `result_summary_json`) y los embeddings del RAG como texto JSON de 1536
  números (`db/schema.ts`, `api/lib/vectorStore.ts`).
- Código con dependencia de dialecto:
  - `result[0].insertId` tras `insert` en 8 sitios (`project-`, `calculation-`, `simulation-`, `material-`,
    `report-`, `ml-`, `controlled-zone-router.ts` y `api/lib/vectorStore.ts`).
  - `.onDuplicateKeyUpdate()` en `api/queries/users.ts` y `db/seed.ts`.
  - SQL suelto en `db/f501_f504_regulatory_materials_schema.sql` (`ON UPDATE CURRENT_TIMESTAMP`, `int`).
  - Scripts de operación con MySQL: `scripts/db-preflight.mjs`, `scripts/db-reconstruction-plan.mjs`,
    `scripts/f81-*`, respaldo/restauración con `mysqldump`/`mysql` (`MYSQL_BIN_DIR`), y los runbooks
    `DB_RECONSTRUCTION_RUNBOOK.md` y `F81_DOCKER_DESKTOP_DB_RUNBOOK.md`.
- Migraciones: `db/migrations/meta/` tiene el journal y las instantáneas 0000–0002, pero los `.sql` no están en
  el repositorio (el preflight lo marca). No hay datos de producción: sólo bases de prueba que se pueden
  recrear con `db/seed.ts`.

## 2. Por qué migrar

1. **Búsqueda vectorial nativa.** Los embeddings del RAG hoy son texto y la similitud se calcula en Node.
   PostgreSQL con `pgvector` (columna `vector(1536)` e índice HNSW) hace la búsqueda en la base, con menos
   memoria y latencia, y sin servicio aparte.
2. **JSON con tipo.** `jsonb` valida y permite consultar e indexar planos, geometrías y resúmenes de
   resultados, que hoy son `text` sin validar en la base.
3. **Integridad y tipos.** Enums reales (`CREATE TYPE`), `CHECK`, DDL transaccional (una migración que falla no
   deja el esquema a medias), `timestamptz` y `double precision`/`numeric` en lugar de `float` de 32 bits para
   magnitudes físicas (espesores, tasas de dosis).
4. **`RETURNING`.** Las inserciones devuelven la fila o el id sin depender de `insertId`, y
   `ON CONFLICT ... DO UPDATE` es el upsert estándar.
5. **Ecosistema y despliegue.** Más opciones administradas (incluido Supabase/Neon/RDS), extensiones
   (`pgcrypto`, `pg_trgm` para buscar texto en normas) y mejor soporte de Drizzle para `pg`.
6. **Momento barato.** Sin datos de producción y con pocas tablas, el costo es casi sólo de código; crecerá con
   cada tabla y cada despliegue que use MySQL.

## 3. Pasos

### Fase 0 — Preparación (sin cambiar el motor)
1. Inventario confirmado de lo de §1 con `grep` (`insertId`, `onDuplicateKeyUpdate`, `mysql-core`, `mysql2`,
   `mysqldump`) y lista de pruebas de la API que tocan la base.
2. Recuperar o regenerar los `.sql` de las migraciones 0000–0002 para tener el punto de partida exacto, o
   declarar formalmente que se parte de cero en PostgreSQL (recomendado: no hay datos que conservar).
3. Encapsular las inserciones que leen `insertId` en una función `insertarYDevolverId(tabla, valores)` en
   `api/queries/`, para que el cambio de dialecto toque un solo lugar.

### Fase 1 — Esquema en PostgreSQL
1. Rama `migracion-postgresql`. Dependencias: `pg` (o `postgres`) en lugar de `mysql2`; `drizzle-orm` y
   `drizzle-kit` siguen.
2. `db/schema.ts`: `mysqlTable` → `pgTable` (`drizzle-orm/pg-core`); `mysqlEnum` → `pgEnum` declarado aparte;
   `serial` → `integer().generatedAlwaysAsIdentity()`; `timestamp` → `timestamp({ withTimezone: true })`;
   `.onUpdateNow()` → `$onUpdate(() => new Date())` (o trigger); `float` → `doublePrecision`; columnas JSON →
   `jsonb`; `embedding` → `vector(1536)` con `CREATE EXTENSION vector`.
3. `drizzle.config.ts`: `dialect: "postgresql"`; generar una migración inicial nueva (`0000_inicial_pg`) en
   `db/migrations-pg/` y conservar las de MySQL como histórico hasta cerrar la migración. Esta migración se genera
   ya con `drizzle-kit` en su versión mayor nueva (ver el paso de cierre de la Fase 13 en la sección 5).
4. `db/f501_f504_regulatory_materials_schema.sql`: reescribir en dialecto PostgreSQL o convertirlo en
   migración de Drizzle.

### Fase 2 — Código de la API
1. `api/queries/connection.ts`: `drizzle-orm/node-postgres` con `Pool`; quitar `mode: "planetscale"`.
2. Sustituir `insertId` por `.returning({ id: tabla.id })` (vía la función de la Fase 0).
3. Sustituir `.onDuplicateKeyUpdate()` por `.onConflictDoUpdate({ target, set })` en `users.ts` y `seed.ts`.
4. `api/lib/vectorStore.ts`: búsqueda por `<=>` (distancia coseno) con índice HNSW; conservar el cálculo en Node
   detrás de una bandera hasta comparar resultados.
5. Revisar comparaciones de texto: PostgreSQL distingue mayúsculas (usar `ilike` o `citext` donde MySQL
   dependía de la intercalación `_ci`) y es más estricto con `GROUP BY` y conversiones implícitas.

### Fase 3 — Infraestructura y operación
1. `docker-compose*.yml`: servicio `db` con `postgres:16` (o `pgvector/pgvector:pg16`), puerto
   `127.0.0.1:5432:5432`, credenciales `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` desde `.env`,
   healthcheck `pg_isready`. `.env.example` con marcadores nuevos; `DATABASE_URL=postgres://...`.
2. Scripts: `db-preflight`, `db-reconstruction-plan`, `check-deploy-config`, respaldo/restauración con
   `pg_dump`/`pg_restore` (sustituye `mysqldump` y `MYSQL_BIN_DIR`).
3. Actualizar runbooks (`DB_RECONSTRUCTION_RUNBOOK.md`, `F81_DOCKER_DESKTOP_DB_RUNBOOK.md`) y la sección de
   base de datos del README.

### Fase 4 — Verificación y corte
1. Pruebas de la API contra PostgreSQL real en CI (servicio `postgres:16` en el workflow) además de `vitest`,
   `tsc` y `eslint` actuales.
2. Pruebas de humo: `db:migrate`, `db/seed.ts`, alta y lectura de proyecto, cálculo, reporte y RAG.
3. Si hubiera datos que conservar en ese momento: exportación por tabla (CSV/JSON) desde MySQL e importación
   con `COPY`, verificando conteos y sumas por tabla; si no, recrear con el seed.
4. Retirar `mysql2`, la imagen `mysql:8.0` y los scripts de MySQL cuando PostgreSQL lleve un ciclo estable.

## 4. Riesgos y mitigación

| Riesgo | Efecto | Mitigación |
| --- | --- | --- |
| `insertId` / `onDuplicateKeyUpdate` olvidados | Errores en tiempo de ejecución en altas | Inventario por `grep` en la Fase 0, función única de inserción y prueba por router |
| Diferencias de intercalación y mayúsculas | Búsquedas que dejan de encontrar resultados | `ilike`/`citext` donde aplique; pruebas de búsqueda |
| `float` → `double precision` | Cambio en los últimos decimales de valores guardados | Es una mejora; los cálculos de blindaje viven en el frontend y no dependen de la base. Comparar memorias de referencia («Guíame» 17.96 mm Pb / 213.77 mm concreto) antes y después |
| Faltan los `.sql` de migraciones MySQL | No se puede reconstruir el estado exacto previo | Partir de cero en PostgreSQL con migración inicial nueva (no hay datos de producción) |
| `pgvector` no disponible en el proveedor elegido | Sin búsqueda vectorial en la base | Elegir imagen/proveedor con `pgvector`; mantener el cálculo en Node como respaldo |
| Scripts y runbooks de MySQL desactualizados | Operación confusa durante la transición | Actualizarlos en la misma rama; mantener los de MySQL marcados como históricos hasta el retiro |
| Driver/ORM: diferencias de tipos (`bigint` como string, fechas con zona) | Fallos sutiles en serialización tRPC | Configurar parsers de `pg`; pruebas de contrato de la API |
| Despliegues que aún apunten a MySQL | Caída de la API | Corte en una sola versión con `DATABASE_URL` nueva y verificación de esquema al arrancar |

## 5. Propuesta de cuándo

- **No ahora**, mientras siga abierta la Fase 13 (motor de cálculo: laberinto, puerta, techos y pisos): la
  migración no toca el cálculo y no debe competir con su revisión.
- **Sí antes de**: (a) el primer despliegue de la API con datos reales de clientes, o (b) activar la búsqueda
  vectorial del RAG en un servidor, lo que ocurra primero. Después de cualquiera de los dos la migración pasa a
  requerir traslado de datos y ventana de corte.
- Esfuerzo estimado: Fases 0–2 en 3 a 5 días de trabajo; Fases 3–4 en 2 a 3 días, más un ciclo de uso estable
  antes de retirar MySQL.
- Decisión que se pide al propietario: aprobar el plan y fijar la ventana (propuesta: al cerrar la Fase 13).

### Paso obligatorio al cerrar la Fase 13 (dentro de esta migración)

- **Actualizar drizzle-kit a la versión mayor (resuelve las 5 vulnerabilidades moderadas restantes: drizzle-kit →
  @esbuild-kit → esbuild, y @hono/node-server) y regenerar las migraciones con esa versión dentro de la migración a
  PostgreSQL. Decisión del propietario 23-11-2026: no antes de esta fase.**
