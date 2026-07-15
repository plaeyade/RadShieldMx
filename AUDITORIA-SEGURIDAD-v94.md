# AUDITORIA TECNICA — RadShield-MX v94
## Seguridad | Confiabilidad | Correctness | Coverage

**Fecha:** 2026-06-07  
**Version auditada:** v94  
**Auditor:** Analisis estatico automatizado + revision manual  
**Archivos analizados:** 400+ (src/, api/, db/, contracts/)  
**Lineas totales:** ~75,000 (frontend) + ~5,000 (backend)

---

## RESUMEN EJECUTIVO

| Categoria | Puntuacion | Estado |
|-----------|:----------:|:------:|
| **Seguridad** | 7.5 / 10 | 🟡 MEDIO |
| **Confiabilidad** | 6.5 / 10 | 🟡 MEDIO |
| **Correctness** | 7.0 / 10 | 🟡 MEDIO |
| **Coverage** | 4.5 / 10 | 🔴 BAJO |
| **TOTAL** | **6.1 / 10** | 🟡 **MEJORABLE** |

### Hallazgos criticos: 2  
### Hallazgos altos: 5  
### Hallazgos medios: 12  
### Hallazgos bajos: 8

---

## 1. SEGURIDAD (7.5/10)

### 1.1 HALLAZGOS CRITICOS

#### [SEC-001] Routers de backend sin autenticacion — 6 routers expuestos
**Severidad:** CRITICO  
**Archivos:** `api/calculation-router.ts`, `api/material-router.ts`, `api/report-router.ts`, `api/ai-router.ts`, `api/rag-router.ts`, `api/ml-router.ts`

Seis routers del backend usan `publicQuery` en lugar de `authedQuery`. Esto permite a cualquier usuario (autenticado o no) acceder a:

- `calculation.list/create/delete/stats` — historial completo de calculos
- `material.list/create/delete` — biblioteca de materiales personalizada
- `report.list/create/delete` — memorias analiticas
- `ai.chat/chatRAG/embedding` — llamadas a LLM (con costo API)
- `rag.queryChat/ingest` — base de datos vectorial
- `ml.record/history/dataset/stats` — datos de entrenamiento ML

**Impacto:** Cualquier visitante puede consumir cuota de API de OpenAI, leer datos de otros usuarios (el userId se pasa como parametro pero no se valida contra la sesion), y modificar datos en la base de datos.

**Recomendacion:** Migrar todos los routers a `authedQuery` y usar `ctx.user.unionId` para filtrar datos, como ya hace `project-router.ts`.

**Ejemplo correcto (project-router.ts:14):**
```typescript
// ✅ Siempre filtra por ctx.user.unionId
return db.select().from(projects).where(eq(projects.userId, ctx.user.unionId));
```

---

#### [SEC-002] Token de auth en localStorage — vulnerable a XSS
**Severidad:** CRITICO  
**Archivo:** `src/providers/trpc.tsx:54`

```typescript
const token = localStorage.getItem("radshield_session_token");
return token ? { Authorization: `Bearer ${token}` } : {};
```

El token de autenticacion se lee de `localStorage` y se envia en cada request. Si un atacante logra inyectar JavaScript en la aplicacion (XSS), puede robar este token y hacer peticiones autenticadas en nombre del usuario.

**Recomendacion:** Usar cookies httpOnly (ya implementado en `api/lib/cookies.ts`) en lugar de localStorage. El frontend ya usa `credentials: "include"` en el fetch, pero el header manual de Authorization con token de localStorage anula este beneficio.

**Impacto:** Robo de sesion via XSS → acceso completo a datos del usuario.

---

### 1.2 HALLAZGOS ALTO

#### [SEC-003] userId pasado como parametro sin validacion
**Severidad:** ALTO  
**Archivos:** `api/calculation-router.ts`, `api/material-router.ts`, `api/report-router.ts`

Los routers aceptan `userId` como parametro de input pero no lo validan contra `ctx.user.unionId`. Un usuario autenticado podria pasar `userId: "otro_usuario"` y acceder a sus datos.

```typescript
// ❌ calculation-router.ts
.list({ userId: z.string() })  // Acepta CUALQUIER userId
// No hay: if (input.userId !== ctx.user.unionId) throw FORBIDDEN
```

**Recomendacion:** En todos los routers, reemplazar `input.userId` por `ctx.user.unionId` para escrituras, y validar `input.userId === ctx.user.unionId` para lecturas.

---

#### [SEC-004] LLM client sin rate limiting
**Severidad:** ALTO  
**Archivo:** `src/lib/llm/client.ts`

Las funciones `chatCompletion`, `generateEmbedding`, y `checkLLMHealth` hacen llamadas directas a APIs de OpenAI/Ollama/LMStudio sin rate limiting ni proteccion contra abuso. Un atacante podria:

1. Llamar repetidamente a `ai.chat` para consumir cuota de API
2. Causar denegacion de servicio por costos excesivos
3. Exfiltrar datos usando el chat (prompt injection)

**Recomendacion:** Implementar rate limiting por usuario (Redis/counter) y maximo de tokens por request en el backend.

---

#### [SEC-005] CSP permite scripts de terceros
**Severidad:** ALTO  
**Archivo:** `index.html`

```html
<script-src 'self' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://www.kimi.com https://statics.moonshot.cn>
```

La Content Security Policy permite scripts de:
- `cdn.jsdelivr.net` — cualquier paquete NPM podria cargarse
- `www.kimi.com` y `statics.moonshot.cn` — scripts del portal
- `'unsafe-inline'` — inline scripts permitidos

Si cualquiera de estos CDN es comprometido, un atacante podria inyectar codigo malicioso.

**Recomendacion:** Usar nonces o hashes para inline scripts. Limitar el CDN a URLs especificas (ej: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`).

---

#### [SEC-006] Errores de backend silenciados
**Severidad:** ALTO  
**Archivos:** `api/ai-router.ts:52`, `api/ai-router.ts:107`, `api/agent-router.ts:97-103`, `api/rag-router.ts:58`

```typescript
catch { /* silent fail for history */ }
```

Los errores de base de datos se silencian sin logging. Esto oculta problemas de infraestructura y dificulta la deteccion de ataques (ej: intentos de inyeccion SQL que fallan).

**Recomendacion:** Loggear errores con nivel WARN/ERROR (sin exponer detalles al cliente).

---

#### [SEC-007] API key de OpenAI en variable de entorno sin rotacion
**Severidad:** ALTO  
**Archivo:** `src/lib/llm/client.ts`

```typescript
const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
```

La API key se lee de variables de entorno que podrian ser expuestas:
- `VITE_OPENAI_API_KEY` — cualquier variable con prefijo `VITE_` es incluida en el bundle por Vite
- Sin validacion de que la key no este expuesta al frontend

**Recomendacion:** Usar solo variables sin prefijo `VITE_` en el backend. Nunca incluir API keys en el bundle del frontend.

---

### 1.3 HALLAZGOS MEDIO

#### [SEC-008] AppRouterStub usa `any` — type safety reducida
**Severidad:** MEDIO  
**Archivo:** `src/providers/trpc.tsx:14-27`

El stub tiene 12 propiedades tipo `any`, eliminando la verificacion de tipos en llamadas tRPC. Errores de tipo en params/returns no se detectan en tiempo de compilacion.

**Recomendacion:** Definir interfaces parciales para cada router o usar `Pick<AppRouter, 'project' | 'auth'>` si se puede importar el tipo sin bundlear el codigo.

---

#### [SEC-009] cloudSync.ts usa localStorage para tokens sensibles
**Severidad:** MEDIO  
**Archivo:** `src/lib/cloudSync.ts`

```typescript
localStorage.setItem('radshield_auth_token', token);
```

Aunque el flujo principal usa cookies httpOnly, la sincronizacion en la nube almacena el token en localStorage, vulnerable a XSS.

**Recomendacion:** Eliminar este flujo legacy o migrar a cookies httpOnly.

---

#### [SEC-010] Session ID de chat sin validacion de propiedad
**Severidad:** MEDIO  
**Archivo:** `api/ai-router.ts:136-153`

Cualquier usuario puede leer/eliminar el historial de chat de CUALQUIER sessionId.

```typescript
history: publicQuery.input(z.object({ sessionId: z.string() }))
```

**Recomendacion:** Asociar sessionId al userId y filtrar por `ctx.user.unionId`.

---

### 1.4 HALLAZGOS BAJO

- **[SEC-011]** Feature flags almacenados en localStorage sin firma — podrian ser manipulados por el usuario (`src/lib/featureFlags.ts`)
- **[SEC-012]** URL de backend configurable via localStorage — permite phishing (`trpc.tsx:32`)
- **[SEC-013]** `broadcastChannel` sin validacion de origen — cualquier pestana podria enviar mensajes maliciosos

---

## 2. CONFIABILIDAD (6.5/10)

### 2.1 HALLAZGOS CRITICOS

*Sin hallazgos criticos*

### 2.2 HALLAZGOS ALTO

#### [REL-001] ShieldingDesigner.tsx — 2,180 lineas de complejidad extrema
**Severidad:** ALTO  
**Archivo:** `src/pages/ShieldingDesigner.tsx`

Metricas de complejidad:
- 2,180 lineas (limite recomendado: 300)
- 245 hooks React (useState/useEffect/useCallback/useMemo)
- 178 lazy imports de dialogs
- 30+ handlers de comandos
- Estado mezclado: Zustand + useState locales

**Riesgos:**
- Re-renders innecesarios (245 hooks = 245 dependencias)
- Stack traces imposibles de debuggear
- Regresiones al modificar cualquier parte
- Testing unitario impracticable

**Recomendacion:** Dividir en 5-6 sub-componentes por feature (Canvas, Calculations, Dialogs, Auth, etc.)

---

#### [REL-002] Errores silenciados en persistencia de datos
**Severidad:** ALTO  
**Archivos:** `api/ai-router.ts`, `api/agent-router.ts`, `api/rag-router.ts`

```typescript
try {
  await db.insert(chatMessages).values([...]);
} catch { /* silent fail for history */ }
```

Si la DB esta caida o hay un error de schema, la aplicacion continua como si nada hubiera pasado. Los datos se pierden silenciosamente.

**Recomendacion:** Loggear al menos el mensaje de error:
```typescript
catch (e) { console.warn('[DB] Failed to save chat history:', e.message); }
```

---

#### [REL-003] No hay health check del backend
**Severidad:** ALTO  
**Archivo:** `src/providers/trpc.tsx`

El frontend no verifica que el backend este disponible antes de hacer llamadas. Si el servidor esta caido, las mutaciones fallan silenciosamente (solo muestran toast si el componente maneja el error).

**Recomendacion:** Implementar `trpc.ping.useQuery()` en un wrapper que muestre estado de conexion.

---

### 2.3 HALLAZGOS MEDIO

#### [REL-004] Auto-save sin retry ni manejo de errores
**Severidad:** MEDIO  
**Archivo:** `src/pages/ShieldingDesigner.tsx:~889`

```typescript
const iv = setInterval(() => { saveCurrent(floorPlan); setLastSaved(new Date()); setIsDirty(false); }, 30000);
```

El auto-save ejecuta cada 30 segundos pero:
- No tiene retry en caso de fallo
- No verifica si hay cambios antes de guardar
- No maneja race conditions (guardar mientras se calcula)

**Recomendacion:** Implementar backoff exponencial, verificar `isDirty`, y cancelar save durante calculaciones.

---

#### [REL-005] ML model sin persistencia
**Severidad:** MEDIO  
**Archivo:** `src/hooks/useMLPrediction.ts`

El modelo de TensorFlow.js se entrena en memoria y se pierde al recargar la pagina. No hay:
- Persistencia en IndexedDB
- Versionado de modelos
- Fallback si el entrenamiento falla

**Recomendacion:** Guardar modelo con `await model.save('indexeddb://radshield-ml')`.

---

#### [REL-006] setTimeout sin cleanup en calculaciones
**Severidad:** MEDIO  
**Archivo:** `src/pages/ShieldingDesigner.tsx:1052`

```typescript
setTimeout(async () => { /* calculacion progresiva */ }, 0);
```

El setTimeout no se limpia si el componente se desmonta durante el calculo.

---

### 2.4 HALLAZGOS BAJO

- **[REL-007]** 40+ useState comentados pero presentes en ShieldingDesigner.tsx — confusion para developers
- **[REL-008]** `wakeLock` API puede fallar en navegadores no compatibles sin try/catch
- **[REL-009]** `BroadcastChannel` no disponible en Safari < 15.4 — necesita fallback

---

## 3. CORRECTNESS (7.0/10)

### 3.1 HALLAZGOS CRITICOS

*Sin hallazgos criticos*

### 3.2 HALLAZGOS ALTO

#### [COR-001] `any` en AppRouterStub elimina type safety de tRPC
**Severidad:** ALTO  
**Archivo:** `src/providers/trpc.tsx`

12 propiedades `any` hacen que TODO el sistema de tipos de tRPC sea inutil. Errores como `trpc.auth.me.useKiwi()` (typo) no se detectan en compilacion.

**Recomendacion:** Definir tipos minimos:
```typescript
interface AppRouterStub {
  auth: { me: { useQuery: () => { data: { unionId: string; name: string } | null } } };
  project: { list: { useQuery: () => { data: Project[] } } };
  // ...
}
```

---

#### [COR-002] Zod validation incompleta en algunos routers
**Severidad:** ALTO  
**Archivo:** `api/calculation-router.ts`

```typescript
.parametersJson: z.string()  // Acepta cualquier string, no valida JSON
.resultsJson: z.string()     // Lo mismo
```

Los campos JSON aceptan cualquier string sin validar que sea JSON parseable o que tenga la estructura esperada.

**Recomendacion:** Usar `z.string().transform(s => JSON.parse(s)).pipe(z.object({...}))`

---

#### [COR-003] useBackend.ts — persistReport/persistProject usan userId hardcodeado
**Severidad:** ALTO  
**Archivo:** `src/hooks/useBackend.ts`

```typescript
const persistReport = useCallback((data) => {
  reports.createReport({ userId: "anonymous", ...data });  // ❌ Siempre "anonymous"
}, [reports]);
```

El userId se cambio a "anonymous" en el refactor pero deberia usar el userId autenticado. Esto rompe la funcionalidad de auth.

**Recomendacion:** Usar `useUserId()` hook o pasar userId como parametro.

---

### 3.3 HALLAZGOS MEDIO

#### [COR-004] ML training data no normalizada para valores fuera de rango
**Severidad:** MEDIO  
**Archivo:** `src/hooks/useMLPrediction.ts:54-62`

```typescript
const normalize = (input) => [
  input.energy / 25,       // Si energy=50 → 2.0 (fuera de [0,1])
  input.distance / 10,     // Si distance=20 → 2.0
  // ...
];
```

La normalizacion no maneja valores fuera de rango, produciendo predicciones incorrectas para energias >25MV.

**Recomendacion:** Usar `Math.min(1, value / max)` o manejar overflow.

---

#### [COR-005] TODO sin issue reference
**Severidad:** MEDIO  
**Archivo:** `src/lib/nativeMCEngine.ts:780`

```typescript
// TODO: Integrate opencascade.js for real STEP parsing
```

TODO sin issue number = trabajo olvidado.

---

### 3.4 HALLAZGOS BAJO

- **[COR-006]** 14 archivos de test desorganizados en carpetas inconsistentes (`__tests__/`, `tests/`, raiz)
- **[COR-007]** `useCanvasLayers.ts` exporta tipos que no se usan en ningun lado
- **[COR-008]** `useStickyNotes.ts` tiene funcion `addComment` que no se usa

---

## 4. COVERAGE (4.5/10)

### 4.1 ESTADISTICAS

| Metrica | Valor | Estado |
|---------|-------|:------:|
| Archivos de test | 14 | 🟡 |
| Lineas testeadas (estimado) | ~2,500 / 75,000 | 🔴 3.3% |
| Cobertura backend | 0% | 🔴 |
| Cobertura hooks principales | ~10% | 🔴 |
| Cobertura calculos NCRP | ~30% | 🟡 |
| Cobertura UI/UX | 0% | 🔴 |
| Tests que pasan (desconocido) | ? | ⚪ |

### 4.2 HALLAZGOS ALTO

#### [COV-001] Backend sin tests
**Severidad:** ALTO  
**Archivos:** `api/*.ts`

Cero tests para 12 routers, 6 routers de queries, middleware, autenticacion, y manejo de errores.

**Riesgos:**
- Cambios en schema pueden romper queries sin detection
- Regresiones en auth (usuario accede a datos de otros)
- Errores de logica de negocio (calculos NCRP en backend)

**Recomendacion:** Crear tests de integracion con Vitest + MySQL de prueba.

---

#### [COV-002] useBackend.ts sin tests
**Severidad:** ALTO  
**Archivo:** `src/hooks/useBackend.ts`

254 lineas de logica de conexion al backend sin test unitario. Los 6 sub-hooks no tienen cobertura.

---

#### [COV-003] useMLPrediction.ts sin tests
**Severidad:** ALTO  
**Archivo:** `src/hooks/useMLPrediction.ts`

El modelo de ML no tiene tests de:
- Precision de predicciones vs datos NCRP
- Manejo de valores fuera de rango
- Convergencia del entrenamiento

---

#### [COV-004] Login.tsx sin tests
**Severidad:** ALTO  
**Archivo:** `src/pages/Login.tsx`

Flujo critico de autenticacion sin tests de:
- Generacion correcta de OAuth URL
- Manejo de error de callback
- Redireccion post-login

---

### 4.3 HALLAZGOS MEDIO

#### [COV-005] Tests existentes no ejecutados durante CI
**Severidad:** MEDIO  
**Archivo:** `.github/workflows/ci.yml`

El workflow CI corre `npx vitest run` pero:
- No se verifico que pasen en esta auditoria
- No hay reporte de cobertura
- No hay cobertura minima requerida

**Recomendacion:** Agregar `coverage: { thresholds: { lines: 30, functions: 30 } }` a vitest.config.

---

### 4.4 ARCHIVOS QUE NECESITAN URGENTEMENTE TESTS

| Prioridad | Archivo | Lineas | Riesgo |
|:---------:|---------|:------:|--------|
| 1 | `api/project-router.ts` | 120 | Auth bypass |
| 2 | `api/ai-router.ts` | 155 | Costos API |
| 3 | `src/hooks/useBackend.ts` | 254 | Perdida de datos |
| 4 | `src/hooks/useMLPrediction.ts` | 180 | Precision ML |
| 5 | `src/pages/Login.tsx` | 80 | Auth fallido |
| 6 | `api/middleware.ts` | 43 | Auth/Autorizacion |

---

## 5. TABLA RESUMEN DE HALLAZGOS

| ID | Categoria | Severidad | Archivo | Descripcion |
|:--:|:---------:|:---------:|---------|-------------|
| SEC-001 | Seguridad | CRITICO | 6 routers | Backend sin autenticacion |
| SEC-002 | Seguridad | CRITICO | trpc.tsx | Token en localStorage (XSS) |
| SEC-003 | Seguridad | ALTO | 3 routers | userId sin validacion |
| SEC-004 | Seguridad | ALTO | llm/client.ts | Sin rate limiting |
| SEC-005 | Seguridad | ALTO | index.html | CSP permisiva |
| SEC-006 | Seguridad | ALTO | ai/agent-router | Errores silenciados |
| SEC-007 | Seguridad | ALTO | llm/client.ts | API key en VITE_ |
| SEC-008 | Seguridad | MEDIO | trpc.tsx | AppRouterStub con any |
| SEC-009 | Seguridad | MEDIO | cloudSync.ts | Token en localStorage |
| SEC-010 | Seguridad | MEDIO | ai-router.ts | Chat history sin auth |
| REL-001 | Confiab. | ALTO | ShieldingDesigner | 2,180 lineas |
| REL-002 | Confiab. | ALTO | ai/agent-router | Errores silenciados |
| REL-003 | Confiab. | ALTO | trpc.tsx | No health check |
| REL-004 | Confiab. | MEDIO | ShieldingDesigner | Auto-save sin retry |
| REL-005 | Confiab. | MEDIO | useMLPrediction | Modelo sin persistencia |
| REL-006 | Confiab. | MEDIO | ShieldingDesigner | setTimeout sin cleanup |
| COR-001 | Correct. | ALTO | trpc.tsx | 12x `any` |
| COR-002 | Correct. | ALTO | calculation-router | Zod incompleto |
| COR-003 | Correct. | ALTO | useBackend.ts | userId hardcodeado |
| COR-004 | Correct. | MEDIO | useMLPrediction | Normalizacion rota |
| COV-001 | Coverage | ALTO | api/*.ts | 0% backend |
| COV-002 | Coverage | ALTO | useBackend.ts | Sin tests |
| COV-003 | Coverage | ALTO | useMLPrediction | Sin tests |
| COV-004 | Coverage | ALTO | Login.tsx | Sin tests |
| COV-005 | Coverage | MEDIO | ci.yml | Sin cobertura minima |

---

## 6. RECOMENDACIONES PRIORITARIAS

### Inmediatas (antes de produccion)

1. **SEC-001 + SEC-003:** Migrar todos los routers a `authedQuery` y usar `ctx.user.unionId`
2. **SEC-002:** Eliminar localStorage token, usar cookies httpOnly exclusivamente
3. **COR-003:** Corregir userId hardcodeado en useBackend.ts
4. **SEC-004:** Implementar rate limiting en LLM client

### Corto plazo (1-2 semanas)

5. **REL-001:** Refactorizar ShieldingDesigner.tsx (dividir en componentes)
6. **SEC-005:** Restringir CSP a URLs especificas
7. **SEC-006 + REL-002:** Loggear errores de DB (no silenciar)
8. **COV-001-004:** Crear tests para backend + hooks principales
9. **COR-001:** Tipar AppRouterStub correctamente

### Medio plazo

10. **REL-004:** Implementar retry con backoff en auto-save
11. **REL-005:** Persistir modelo ML en IndexedDB
12. **COR-004:** Validar rango en normalizacion ML

---

*Fin del reporte. 27 hallazgos documentados. No se modifico codigo durante la auditoria.*
