# Auditoria Tecnica RadShield-MX v46
## Analisis exhaustivo de gaps, riesgos y recomendaciones faltantes

**Fecha:** 2026-06-03 | **Version auditada:** v46 | **Auditor:** Analisis automatico

---

## 1. RESUMEN EJECUTIVO

RadShield-MX v46 tiene **104+ dialogs funcionales**, **33 hooks**, **15MB bundle**, y TypeScript strict activado. Sin embargo, hay **gaps criticos** en:

| Area | Estado | Riesgo |
|------|--------|--------|
| Tests | 2 archivos para 164 dialogs | **CRITICO** |
| API integration | Hooks instanciados pero NO usados en logica | **ALTO** |
| Canvas architecture | 51 funciones, 168 estados en un archivo | **ALTO** |
| Accesibilidad (a11y) | Cero soporte ARIA/screen reader | **MEDIO** |
| Bundle size | 15MB total, chunks >1MB | **MEDIO** |
| Offline real | Service Worker basico sin cache de calculos | **MEDIO** |

---

## 2. GUI / INTERFAZ GRAFICA — Recomendaciones Faltantes (5 de 12 implementadas)

### A.2 Minimap / Navigator [FALTA] — Prioridad: HIGH
**Fundamento:** Plaisant et al. (2002) "SpaceTree: supporting exploration in large node-link tree" — las vistas de overview mejoran navegacion en espacios grandes en ~40%.
**Implementacion:** Canvas secundario de 150x100px en esquina inferior derecha. Dibuja todo el plano en miniatura con rectangulo de viewport. Sync bidireccional (click en minimap mueve viewport).

### A.3 Floating Draggable Toolbar [FALTA] — Prioridad: LOW
**Fundamento:** Tondello & Nacke (2019) — toolbars fijas ocupan espacio vertical valioso en pantallas <1080px.
**Implementacion:** CSS position: fixed + pointer events para drag. Persistir posicion en localStorage.

### A.4 Rich Tooltips [FALTA] — Prioridad: MEDIUM
**Fundamento:** Nielsen (1994) Heuristic #10 — "Help and documentation should be easy to search." Cada herramienta necesita tooltip con: descripcion, shortcut de teclado, ecuacion clave, referencia bibliografica.
**Implementacion:** Componente RichTooltip que carga contenido del ManualDialog por ID de herramienta.

### A.9 Canvas Search (Ctrl+F) [FALTA] — Prioridad: HIGH
**Fundamento:** Card et al. (1999) "Readings in Information Visualization" — busqueda visual es esencial para planos con >20 barreras.
**Implementacion:** Input flotante que busca por nombre de barrera/fuente, resalta matches en canvas con anillo pulsante. Auto-scroll al match.

### A.10 Responsive Tablet Layout [FALTA] — Prioridad: MEDIUM
**Fundamento:** iPad Pro 12.9" = 1024px width. Sidebar de 320px deja solo 704px para canvas — insuficiente.
**Implementacion:** Media query <1024px: sidebar colapsable con iconos, canvas full-width, toolbar vertical.

---

## 3. MOTORES DE CALCULO — Recomendaciones Faltantes (0 de 10 nuevas)

Las 10 de v46 estan implementadas. Nuevas recomendaciones emergentes:

### B.11 Dose Rate from Scattered Radiation (St-Germain method) [NUEVA] — Prioridad: HIGH
**Fundamento:** St-Germain & Al Kafi (2016) "A practical method for calculating shielding requirements for scattered radiation" — metodo alternativo al de McGinley con validacion clinica de 50+ instalaciones.
**Ecuacion:** H_s = (W × a × d_scatter^2) / (400 × d_sec^2) donde a = scatter fraction (NCRP 147 Table B.1)

### B.12 Secondary Barrier Albedo Method [NUEVA] — Prioridad: MEDIUM
**Fundamento:** NCRP 144 (2003) §4.3 — calculo de blindajes secundarios considerando albedo (reflexion) de superficies. Metodo necesario para salas complejas con multiples superficies reflectantes.

### B.13 Concrete Barrier Activation [NUEVA] — Prioridad: LOW
**Fundamento:** IAEA SSG-98 §7.2 — activacion inducida en concreto por neutrones en energias >10 MV. Relevante para mantenimiento de bunkers.

---

## 4. CALIDAD DE CODIGO — Estado Real

### C.1 Unit Tests [CRITICO] — 2 archivos para ~500 funciones
**Hallazgo:** Solo `shieldingMath.test.ts` (241 lineas) y `nuclearMedicine.test.ts`. 
**Funciones SIN tests:**
- 12 funciones en shieldingMath.ts (solo algunas testeadas)
- 33 hooks personalizados (0 tests)
- 164 dialogs (0 tests)
- useCanvas.ts con 51 funciones (0 tests)
- useShieldingEngine.ts (0 tests)

**Riesgo:** Cambios en shieldingMath.ts pueden romper calculos sin detection. El bug de `concreteMm = thicknessMm * 120` (v41) demostro esto.

**Plan de tests prioritario:**
1. **P0 — shieldingMath.ts completo:** TODAS las 12 funciones con casos edge (B=0, B=1, valores negativos, materiales sin parametros)
2. **P1 — useShieldingEngine.ts:** Mock de floorplan, verificar output contra valores NCRP 147 tabulados
3. **P2 — Hooks criticos:** useWASM (fallback), useUndoRedo (50 operaciones), useIndexedDB (CRUD)
4. **P3 — Componentes UI:** VirtualList, ErrorBoundary

### C.2 Integration Tests [CRITICO]
**Falta:** Test end-to-end que simule: importar plano → dibujar barrera → calcular → verificar espesor contra tabla NCRP 147.
**Implementacion:** Vitest + React Testing Library para componentes. Playwright/Cypress para E2E.

### C.5 Bundle Analysis [MEDIO]
**Hallazgo:** Bundle total 15MB. Chunks mas grandes:
- `index-B6cFzCqS.js`: 1.29MB (gzip: 391KB) — MAIN BUNDLE DEMASIADO GRANDE
- `3d-vendor-CZsjVi26.js`: 1.22MB (gzip: 349KB) — Three.js completo
- `html2canvas.esm`: 201KB
- `ui-vendor`: 135KB
- `index.es`: 159KB

**Problema:** El main bundle de 391KB gzip incluye logica de 100+ dialogs que deberian ser lazy-loaded.
**Solucion:** Revisar imports estaticos que evitan code-splitting. Verificar que no haya imports de dialogs en el main chunk.

### C.9 Error Boundaries [PARCIAL] — Implementado componente, NO aplicado
**Hallazgo:** El componente ErrorBoundary existe en `src/components/ErrorBoundary.tsx` pero NO envuelve los dialogs en ShieldingDesigner.tsx. Los dialogs se renderizan directamente en Suspense sin ErrorBoundary.
**Fix:** `<ErrorBoundary><Dialog/></ErrorBoundary>` alrededor de cada dialog.

---

## 5. APIs WEB — Integracion REAL vs Instanciacion

### Hallazgo critico: Hooks importados pero NO integrados en logica

| Hook | Importado | Usado en calculos | Uso real |
|------|-----------|-------------------|----------|
| useWASM | ✅ | ✅ | Si usado en runRadShieldCalculations |
| useBroadcastChannel | ✅ | ❌ | Solo instanciado, nada se publica/suscribe |
| useWebGPU | ✅ | ❌ | Solo instanciado, no se pasan datos |
| useIndexedDB | ✅ | ❌ | Solo instanciado, no se cachean resultados |
| useServiceWorker | ✅ | ❌ | Solo instanciado, no se usa para offline |
| useWebWorker | ✅ | ❌ | Solo instanciado, no se delegan calculos |
| useFileSystemAccess | ✅ | ❌ | Solo instanciado |

**Impacto:** Estas APIs fueron "checkbox features" — implementadas como hooks pero NO integradas en el flujo de trabajo real del usuario. El Broadcast Channel no sincroniza nada. IndexedDB no cachea. WebGPU no acelera.

**Plan de integracion:**
1. **BroadcastChannel:** Publicar floorPlan updates, resultados de calculo, notificar cuando otra pestaña modifique
2. **IndexedDB:** Cachear resultados de calculo por hash de floorplan (key: `calc:${hash}`, value: results)
3. **WebGPU:** Integrar en calculateHeatmapGrid para computo paralelo de grid 2D
4. **WebWorker:** Delegar runRadShieldCalculations completo al worker
5. **FileSystemAccess:** Conectar Ctrl+S/Ctrl+O para guardar .radshield nativo

---

## 6. ACCESIBILIDAD (a11y) — COMPLETAMENTE FALTANTE

### Prioridad: HIGH (obligatorio para software medico)

**Regulaciones:**
- **WCAG 2.1 AA** requerido por ley en Mexico (NOM-037-SECT-2023 para sitios web gubernamentales)
- **Section 508** (US) aplica si el software se usa en instalaciones con fondos US
- **EN 301 549** (EU) estandar para accesibilidad de software

**Gaps especificos:**
- Zero atributos ARIA en canvas (role="img", aria-label para barreras)
- No hay modo de alto contraste
- No hay navegacion por teclado para canvas (tab order, focus indicators)
- No hay anuncios screen reader para resultados de calculo
- Los color-coded status (PASS=verde, FAIL=rojo) no tienen alternativa no-visual

**Implementacion urgente:**
1. `aria-live="polite"` region para anunciar resultados de calculo
2. `role="application"` + `aria-label` para canvas con descripcion de cada elemento
3. High contrast mode (media query `prefers-contrast: high`)
4. Focus visible indicators para todos los elementos interactivos
5. Skip-to-content link

---

## 7. BUNDLE SIZE OPTIMIZATION

### Acciones inmediatas:

1. **Three.js tree-shaking:** Solo se usa para Viewer3D pero se importa completo (1.2MB). Usar imports especificos de `three/examples/jsm/`.
2. **html2canvas lazy:** Solo se necesita para export PDF. Mover a chunk separado.
3. **Vendor UI split:** Radix UI components probablemente se importan todos. Verificar tree-shaking.
4. **ManualDialog split:** 47KB gzip — la seccion mas pesada no-lazy. Considerar virtualizacion del contenido.

---

## 8. SEGURIDAD

### Gaps:
1. **No Content Security Policy (CSP)** — headers de seguridad HTTP faltantes
2. **No input sanitization** en imports de CSV/DXF — potencial XSS via archivo malicioso
3. **localStorage sin encripcion** — proyectos de blindaje pueden contener informacion sensible de instalaciones
4. **No rate limiting** en tRPC endpoints
5. **WASM module integrity** — no se verifica hash del .wasm file

---

## 9. RECOMENDACIONES PRIORIZADAS — Plan v47

### Fase 1: Correctivo (v47a) — 1-2 semanas
| # | Item | Esfuerzo | Impacto |
|---|------|----------|---------|
| 1 | ErrorBoundary aplicado a cada dialog | 4h | Alto |
| 2 | Tests shieldingMath.ts completo (12 funciones) | 8h | Critico |
| 3 | Integrar IndexedDB cache de calculos | 6h | Alto |
| 4 | Integrar WebWorker para calculos | 8h | Alto |
| 5 | Fix bundle: Three.js tree-shaking | 4h | Medio |

### Fase 2: API Integration (v47b) — 2-3 semanas
| # | Item | Esfuerzo | Impacto |
|---|------|----------|---------|
| 6 | BroadcastChannel sync funcional | 6h | Medio |
| 7 | FileSystemAccess para Ctrl+S/O | 6h | Alto |
| 8 | WebGPU heatmap acceleration | 12h | Medio |
| 9 | a11y: ARIA labels + screen reader | 16h | Alto |
| 10 | Canvas search (Ctrl+F) | 8h | Alto |

### Fase 3: Expansion (v47c) — 3-4 semanas
| # | Item | Esfuerzo | Impacto |
|---|------|----------|---------|
| 11 | Minimap navigator | 8h | Medio |
| 12 | B.11 St-Germain scatter method | 8h | Alto |
| 13 | High contrast mode | 4h | Medio |
| 14 | CSP headers + input sanitization | 6h | Medio |
| 15 | Tests integration: calc E2E | 12h | Critico |

---

## 10. METRICAS OBJETIVO v47

| Metrica | v46 Actual | v47 Target |
|---------|-----------|------------|
| Cobertura tests | ~5% | >60% |
| APIs integradas en logica | 1/7 (14%) | 5/7 (71%) |
| Bundle main chunk | 391KB gzip | <250KB gzip |
| a11y WCAG | 0% | AA compliant |
| Dialogs con ErrorBoundary | 0% | 100% |
| IndexedDB cache hits | 0% | >80% |
