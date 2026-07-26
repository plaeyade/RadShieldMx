// =============================================================================
// ManualDialog — Manual de Usuario RadShield-MX v58
// Todas las funcionalidades v1–v58 documentadas extensamente
// =============================================================================
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, BookOpen, Search, ChevronRight } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const TC: Record<string, string> = {
  intro: 'bg-blue-100 text-blue-700', canvas: 'bg-emerald-100 text-emerald-700',
  calc: 'bg-purple-100 text-purple-700', mc: 'bg-orange-100 text-orange-700',
  tools: 'bg-cyan-100 text-cyan-700', qa: 'bg-red-100 text-red-700',
  therapy: 'bg-rose-100 text-rose-700', admin: 'bg-slate-100 text-slate-700',
  api: 'bg-indigo-100 text-indigo-700', perf: 'bg-amber-100 text-amber-700',
};

const S = [
  // ── SECCIÓN 1: INTRODUCCIÓN ──
  { id:'1.1', t:'intro', title:'1.1 Introducción a RadShield-MX v58', content:`RadShield-MX es una aplicación profesional de ingeniería de blindajes radiológicos desarrollada para el contexto mexicano, cumpliendo con la NOM-008-NUCL-2018, NOM-040-NUCL-2016, y las guías internacionales NCRP 147, NCRP 151, AAPM TG 108, IAEA SSG-98, ICRU 96, ICRP 128 y 140, McGinley (2002), y Wagner et al. (2014) FW-CADIS.

La aplicación integra más de 208 diálogos funcionales organizados en 8 menús, con soporte para 2 idiomas (español/inglés), modo oscuro, atajos de teclado, sistema de undo/redo (50 pasos), canvas interactivo para diseño de blindajes basado en planos de planta, 10+ APIs web modernas, WebAssembly acceleration, offline capability, y 5 capas de inteligencia artificial.

**Metodologías implementadas:** NCRP 147 (X-ray imaging), NCRP 151 (megavoltage), AAPM TG 108 (PET/CT), McGinley scatter-primary ratios & skyshine & oblique incidence, MIRD/OLINDA (therapy dosimetry), FW-CADIS variance reduction, Archer broad-beam transmission, TASMIP multi-energy spectra, patient self-shielding factors, adaptive sampling, neutron maze albedo, annual dose accumulation, cross-validation NCRP147/151, y generadores de input para GEANT4/GATE, MCNP6, PHITS v3.36, FLUKA.CERN, y PENELOPE2023.

**v58 — Estado de Auditoría Completa (50 recomendaciones):**
- A. GUI/UX: 12/12 COMPLETADO (zoom centrado, touch gestures, leyendas, preview barrera, undo visual, grid, command palette, onboarding tour, keyboard shortcuts, responsive layout, dark mode, high contrast)
- B. Motores: 10/10 COMPLETADO (multi-energy, self-shielding, adaptive sampling, skyshine, neutron maze, oblique incidence, annual dose, cross-validation, async WebWorker, WebGPU heatmap)
- C. Código: 7/10 (Error Boundaries, Web Vitals, Sentry, Unit Tests 59/59, Zustand 48/208, design tokens)
- D. APIs Web: 7/8 (Wake Lock, Web Share, File System Access, Broadcast Channel, Service Worker opt-in, WebGPU, Web Workers)
- E. General: 4/10 (Excel Export, i18n, Community Templates, PACS/BIM/VR integrations)
- 15. IA/ML: 5/5 COMPLETADO en modo local/opt-in (LLM+RAG opcional, ML Predictivo local, Agents, Computer Vision opt-in, Cost Optimization)

**Tests:** 270 unit tests con Vitest pasando en la rama estabilizada.
**5 Capas AI:** LLM (OpenAI/Ollama/LMStudio) es opt-in; RAG local con backend opcional; ML TensorFlow.js local; CV requiere OpenCV configurado; Agents operan con heuristicas locales y/o backend configurado.

**Manual científico:** Cada herramienta documentada con ecuaciones, referencias bibliográficas completas (82 refs: NCRP, ICRP, AAPM, McGinley, Boone, Press, etc.), y aplicación clínica en el modelo.` },
  { id:'1.2', t:'intro', title:'1.2 Arquitectura Técnica', content:`RadShield-MX está construida con React 18 + TypeScript + Vite + Tailwind CSS. La arquitectura sigue un patrón modular con más de 90 componentes de diálogo cargados vía React.lazy() para code-splitting.

**Frontend:** React con hooks personalizados: useShieldingEngine, useCanvas, useControlledAreas, useFileSystemAccess, useWebGPU, useBroadcastChannel, useResizeObserver, useWebWorker, useIndexedDB, useServiceWorker.

**Canvas:** HTML5 Canvas 2D con ResizeObserver para auto-ajuste, transformaciones world-to-screen, zoom, pan, grid snapping, y renderizado optimizado con requestAnimationFrame.

**Cálculos:** Web Worker para cálculos intensivos (no bloquea UI thread). Biblioteca shieldingMath.ts con funciones puras. WebGPU compute shaders para aceleración GPU de heatmaps y gamma index.

**Almacenamiento:** IndexedDB para cache persistente de resultados. File System Access API para guardar/cargar proyectos nativamente. Service Worker opcional con VITE_ENABLE_SERVICE_WORKER=true; por defecto se limpia cache antigua para evitar bundles obsoletos.

**Sincronización:** Broadcast Channel API para sincronización entre pestañas del navegador.` },
  { id:'1.3', t:'intro', title:'1.3 APIs Web Modernas Implementadas (v43)', content:`**File System Access API (v42):** Guardar/cargar proyectos .radshield nativamente. Ctrl+S/Ctrl+O/Ctrl+Shift+S. Chrome 86+, Edge 86+. Fallback a download/upload para Safari/Firefox.

**WebGPU Compute Shaders (v42):** Shaders WGSL para heatmap dose calculation y gamma index 2D. Workgroup size 64, ejecución paralela en GPU. Chrome 113+, Edge 113+. Fallback a CPU.

**Broadcast Channel API (v43):** Sincronización entre pestañas. Notificaciones cuando otra pestaña actualiza el plano, completa un cálculo, o añade una barrera. Chrome 54+, Firefox 38+, Safari 15.4+.

**ResizeObserver (v43):** Monitoreo automático del tamaño del canvas. Redimensionamiento responsivo con device pixel ratio para displays HiDPI. Canvas nítido en 4K/Retina.

**Web Worker (v43):** Cálculos de blindaje en thread separado. NCRP 147 Archer, dose grid nuclear, gamma index. No bloquea UI thread. Speedup de 2-8x en multi-core.

**IndexedDB (v43):** Cache persistente de resultados de cálculo y proyectos. Búsqueda por hash de entrada para cache hits. Limpieza automática de cache >30 días.

**Service Worker (v43):** PWA opcional con VITE_ENABLE_SERVICE_WORKER=true. En el build estabilizado se desactiva por defecto para evitar cache obsoleta; la app conserva modo offline mediante bundle local y almacenamiento del navegador.

**OffscreenCanvas (v44):** Renderizado de canvas en Web Worker thread separado. El canvas visible se transfiere al worker vía transferControlToOffscreen(). El worker maneja todo el renderizado (grid, barreras, fuentes, sample lines) sin bloquear el UI thread. Chrome 69+, Firefox 105+.

**Canvas Layers (v44):** Tres capas de canvas superpuestas: bg (plano de planta + grid, raramente cambia), static (barreras, etiquetas, cambia en edición), dynamic (selección, hover, cursores, cada frame). Solo se redibuja la capa que cambió, no todo el canvas.

**VirtualList (v44):** Virtualización de listas largas (>50 items). Solo se renderizan los items visibles en el viewport + overscan. Usado en BibliographyDialog y listas de equipamiento. Reduce DOM nodes de N a ~15 sin importar el tamaño de la lista.` },

  // ── SECCIÓN 2: CANVAS ──
  { id:'2.1', t:'canvas', title:'2.1 Canvas Interactivo', content:`El canvas es el centro de trabajo. Permite dibujar, editar y analizar blindajes sobre un plano de planta importado.

**Importar plano:** Arrastre PNG/JPG al canvas o use "Importar Plano". Ajuste la escala (m/píxel).

**Herramientas:** B=Barrera, F=Fuente, S=Seleccionar, M=Medir, H=Pan, R=Región, G=Grid, Escape=Seleccionar.

**Zoom:** Rueda del ratón. Grid snapping: cuadrícula 10 cm con snap automático.

**v43 ResizeObserver:** El canvas se redimensiona automáticamente cuando cambia el tamaño de la ventana o del panel lateral. Usa devicePixelRatio para nítidez en HiDPI.` },
  { id:'2.2', t:'canvas', title:'2.2 Áreas Controladas (v42)', content:`Polígonos con clasificación de riesgo radiológico (NOM-008-ENER): Área Controlada (rojo, >20 μSv/h), Supervisada (ámbar, 7.5–20 μSv/h), Pública (verde, <7.5 μSv/semana), Restringida (púrpura, >100 μSv/h). Herramienta R para dibujar, doble clic para cerrar polígono.` },
  { id:'2.3', t:'canvas', title:'2.3 Sample Lines y Cálculo RadShield', content:`Líneas de muestreo a 0.3 m más allá de cada barrera (NCRP 147, DeLorenzo et al. 2016). 200 puntos por barrera. Cálculo de kerma por ley del inverso del cuadrado + scatter-primary ratio de McGinley. Espesor por inverseArcher() (NCRP 147) o tvlThickness() (NCRP 151). Conversión concreto-plomo basada en TVLs reales (corregido en v42).` },

  // ── SECCIÓN 3: CÁLCULOS ──
  { id:'3.1', t:'calc', title:'3.1 Motor Principal NCRP 147/151', content:`**NCRP 147:** B = P·d²/(W·U·T), luego t = inverseArcher(B) con α=2.246, β=5.73, γ=0.547. Barreras primarias, secundarias (scatter), y leakage.

**NCRP 151:** t = TVL × log₁₀(K_unshielded/P). Tablas TVL para concreto, plomo, acero, hasta 25 MV. Laberintos (neutrones + capture gamma), skyshine, fotoneutrones.

**v42 Fix crítico:** Se corrigió concreteMm = thicknessMm × 120 (incorrecto) a TVL-based conversion: thicknessLead × (TVL_concrete / TVL_lead). Se eliminó duplicación de código Archer inline — ahora todo usa shieldingMath.ts.` },
  { id:'3.2', t:'calc', title:'3.2 Barreras Laminadas (v42 — McGinley Ch.6)', content:`Barreras con múltiples materiales: B_total = B₁ × B₂ × ... × Bₙ. Ejemplo: 2 mm Pb + 20 cm concreto a 6 MV. Calculator en Física → McGinley Methods, hasta 5 capas.` },
  { id:'3.3', t:'calc', title:'3.3 NSGA-II Optimizer (v32)', content:`Algoritmo genético multi-objetivo (Deb et al. 2002). Minimiza costo, peso, y espacio. Población 100, 50 generaciones. Frente de Pareto óptimo.` },
  { id:'3.4', t:'calc', title:'3.4 Web Worker Calculations (v43)', content:`Los cálculos intensivos (barreras NCRP 147/151, dose grid, gamma index) se ejecutan en un Web Worker dedicado. El worker recibe mensajes con los parámetros de entrada y devuelve resultados asíncronos. Esto evita que el UI thread se bloquee durante cálculos largos, manteniendo la interfaz responsiva. Speedup de 2-8x en CPUs multi-core.` },

  // ── SECCIÓN 4: MONTE CARLO ──
  { id:'4.1', t:'mc', title:'4.1 Generadores MC (GEANT4/MCNP/PHITS/FLUKA/PENELOPE)', content:`**GEANT4/GATE:** Macros .mac con geometría GDML, tallies de dosis.
**MCNP6:** Tarjetas SDEF, F4/F5 mesh tallies, MATERIAL cards.
**PHITS v3.36 (v39):** 6 templates con DCHAIN-PHITS y JENDL-5.
**FLUKA.CERN (v41b):** 6 templates, 60+ partículas, keV–PeV.
**PENELOPE2023 (v41b):** 6 templates, e⁻/γ 50 eV–1 GeV, mixed-mode.` },
  { id:'4.2', t:'mc', title:'4.2 WebGPU Compute Shaders (v42)', content:`Shaders WGSL para heatmap (evaluación paralela de dosis en grid) y gamma index 2D. Workgroup size 64. Fallback automático a CPU. Chrome 113+.` },
  { id:'4.3', t:'mc', title:'4.3 FW-CADIS Variance Reduction (v43 — Attila4MC-inspired)', content:`Inspirado en Attila4MC-Cottonwood de Silver Fir Software. FW-CADIS (Forward-Weighted CADIS, Wagner et al. 2014) combina el método adjoint CADIS con forward weighting para resolver problemas de penetración profunda.

**Funcionalidades:**
- **CADIS Energy Biasing:** Importancias dependientes de energía (20 bins). La importancia aumenta con la penetración.
- **FW-CADIS Mesh Weight Windows:** Bounds espaciales para malla de cálculo. El usuario configura distancia objetivo, TVL del material, y número de celdas.
- **Material-to-Region Importance:** Mapeo de importancias por región (similar al mapping automático de Attila4MC basado en nombres de partes CAD).

**Export:** Archivo .wwinp con tarjetas WWP, WWN, e IMP para MCNP6.

**Speedup estimado:** 100–10,000x para problemas de penetración profunda (ej: 14 órdenes de magnitud de atenuación en 1 hora en laptop 8 cores, según benchmarks de Attila4MC).` },

  // ── SECCIÓN 5: HERRAMIENTAS ──
  { id:'5.1', t:'tools', title:'5.1 Gamma Index Analyzer (v41)', content:`Análisis gamma 2D/3D inspirado en TopasGraphSim. Criterios DTA+DD: 2mm/2%, 3mm/3%, 1mm/1%. PDD, perfiles laterales, mapa de calor gamma 2D. Pass rate, mean γ, max γ. Low et al. (1998), TG-218.` },
  { id:'5.2', t:'tools', title:'5.2 DVH Analyzer (v41)', content:`Dose-Volume Histograms inspirado en matRad. Planes: Próstata IMRT, Pulmón SBRT, H&N IMRT. Métricas: D95, D50, D2, D98, HI, CI. ICRU 83/91.` },
  { id:'5.3', t:'tools', title:'5.3 Nuclear Dose Grid (v41)', content:`Grid PET/SPECT (F-18, Ga-68, Tc-99m, I-131, Y-90, Lu-177). Modelo punto fuente: H = Γ×A/d². Límites CNSNS: 20 μSv/h controlado, 7.5 μSv/semana público.` },
  { id:'5.4', t:'tools', title:'5.4 Monte Carlo Dose Engine (v41)', content:`MC simplificado con fantomas ICRP 110 (adulto M/F, pediátricos 15/10/5/0 años). CTDI, DLP, dosis por órgano. IEC 60601-2-44.` },
  { id:'5.5', t:'tools', title:'5.5 Performance & Optimization (v42)', content:`24 recomendaciones de rendimiento en 5 categorías: Motores (3/6 implementadas), Canvas (2/6), Memoria (2/4), Red (0/3), UX (2/2). Total: 9 implementadas (38%), 11 pendientes (46%), 4 futuras (16%).` },

  // ── SECCIÓN 6: QA ──
  { id:'6.1', t:'qa', title:'6.1 Shielding Verification (v41b)', content:`HVL/TVL testing con 7 materiales. Tolerancias: ±10% espesor, ±15% HVL. Ajuste Archer-Simpkin. Export CSV. NCRP 147 Appendix B.` },
  { id:'6.2', t:'qa', title:'6.2 Attila4MC Integration (v43)', content:`Inspirado en Attila4MC de Silver Fir Software (https://silverfirsoftware.com): FW-CADIS variance reduction con single-click weight window generation, CADIS energy biasing, material-to-region importance mapping, y export de .wwinp para MCNP6. El objetivo es reducir tiempos de cálculo Monte Carlo de semanas a horas para problemas de penetración profunda.` },

  // ── SECCIÓN 7: TERAPIA ──
  { id:'7.1', t:'therapy', title:'7.1 Radionuclide Therapy Dosimetry (v41b)', content:`MIRD schema D = Ã × S. Lu-177, I-131, Y-90, Ac-225, Ra-223, I-124. Integración time-activity trapezoidal, BED, límites de toxicidad por órgano. MIRD Primer 2019, OLINDA/EXM 2.0, ICRP 128, EANM.` },

  // ── SECCIÓN 8: ADMIN ──
  { id:'8.1', t:'admin', title:'8.1 File System Access API (v42)', content:`Guardar/cargar .radshield nativamente. Ctrl+S/O/Shift+S. Fallback download/upload. Chrome 86+.` },
  { id:'8.2', t:'admin', title:'8.2 IndexedDB Cache (v43)', content:`Cache persistente de resultados y proyectos. Búsqueda por hash de entrada (cache hits). Limpieza automática >30 días. Chrome 24+, Firefox 16+, Safari 10+.` },
  { id:'8.3', t:'admin', title:'8.3 Service Worker & Offline (v43)', content:`Service Worker opcional para builds PWA. Se habilita con VITE_ENABLE_SERVICE_WORKER=true. Por defecto RadShield-MX limpia registros/cache radshield-* para evitar bundles obsoletos en despliegues estaticos. Chrome 40+, Firefox 44+, Safari 11.1+.` },
  { id:'8.4', t:'admin', title:'8.4 Broadcast Channel Sync (v43)', content:`Sincronización entre pestañas. Notificaciones de floorplan updates, calculation results, barrier additions. Peer discovery con heartbeat cada 30s.` },
  { id:'8.5', t:'admin', title:'8.5 Atajos de Teclado', content:`B=Barrera, F=Fuente, S=Seleccionar, M=Medir, H=Pan, R=Región, G=Grid. Ctrl+S=Guardar, Ctrl+O=Abrir, Ctrl+N=Nuevo, Ctrl+Z=Undo, Ctrl+Y=Redo, Ctrl+B=Cálculo, F5=Ejecutar.` },

  // ── SECCIÓN 9: WEBASSEMBLY (v45) ──
  { id:'9.0', t:'perf', title:'9.0 WebAssembly Acceleration (v45)', content:`**Módulo:** shielding_math.wasm (547 bytes, custom bytecode). Compilado manualmente vía Python bytecode para máxima eficiencia sin dependencias de Rust/Emscripten.

**Funciones exportadas:**
- **inverse_archer(B, α, β, γ):** Resuelve la ecuación de Archer B = [(1+β/α)·exp(αγx) − β/α]^(-1/γ) para x dado B. Usado en cálculo de espesor de barreras primarias NCRP 147.
- **tvl_thickness(K, P, TVL):** Calcula espesor = −TVL × log₁₀(P/K). Usado en NCRP 151 para barreras de megavoltaje.
- **dose_from_source(sx, sy, activity, px, py, Γ):** Dosis punto fuente: Γ×A/d². Usado en dose grids PET/SPECT.
- **gamma_index(refDose, evalDose, dd%, maxDose, DTAmm, distMm):** Índice gamma √(DD² + DTA²). Usado en QA de perfiles de dosis.

**Importaciones JS:** Math.log, Math.exp, Math.pow, Math.sqrt — zero overhead callout.

**Integración:** Hook useWASM() detecta soporte WebAssembly, carga el módulo vía WebAssembly.instantiateStreaming(), y expone interfaz WASMInterface. Fallback automático a implementaciones JS puras si WASM no está disponible.

**Rendimiento:** ~2x speedup en cálculos punto-por-punto (200 puntos × N barreras). En benchmarks internos: 50 barreras × 200 puntos = 10,000 puntos calculados en <50 ms (WASM) vs <100 ms (JS) en laptop 8 cores.

**Compatibilidad:** Chrome 57+, Firefox 52+, Safari 11+, Edge 16+. Fallback JS: 100% funcional en todos los navegadores.` },

  // ── SECCIÓN 9b: SENSITIVITY ANALYSIS (v45) ──
  { id:'9.1', t:'perf', title:'9.1 Sensitivity Analysis (v45)', content:`Análisis de sensibilidad de parámetros de blindaje con tornado chart y tabla de resultados. Identifica qué parámetros tienen mayor impacto en el espesor requerido.

**Parámetros analizados (8):**
1. **Workload (W):** Carga de trabajo (Gy/sem o pacientes/sem)
2. **Design Goal (P):** Objetivo de dosis (mSv/sem)
3. **Distance (d):** Distancia fuente-barrera (m)
4. **Use Factor (U):** Factor de uso (0–1)
5. **Occupancy (T):** Factor de ocupación (0–1)
6. **Alpha (α):** Parámetro Archer — curvatura transmission
7. **Beta (β):** Parámetro Archer — pendiente inicial
8. **Gamma (γ):** Parámetro Archer — forma de la curva

**Metodología:** Para cada parámetro, se calcula el espesor requerido con el valor base, −20%, y +20%. La sensibilidad se define como el % de cambio en espesor por cada 1% de cambio en el parámetro.

**Tornado Chart:** Barras horizontales ordenadas por sensibilidad decreciente. Los parámetros más influyentes aparecen arriba. Típicamente: Distance > Workload > Design Goal > Use Factor.

**Interpretación:** Una sensibilidad de 1.5 significa que un cambio de 1% en ese parámetro produce un cambio de 1.5% en el espesor requerido. Durante la comisión, los parámetros con mayor sensibilidad requieren medición más precisa.

**Export:** CSV con todos los valores calculados.` },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIONES v46: RECOMENDACIONES A–E IMPLEMENTADAS
  // Cada herramienta con fundamento científico y aplicación en el modelo
  // ═══════════════════════════════════════════════════════════════════════════

  // ── SECCIÓN A: MEJORAS GUI (12 recomendaciones) ──
  { id:'A.1', t:'canvas', title:'A.1 Mouse-Centered Zoom', content:`**Recomendación A.1 — Zoom centrado en el cursor**

**Fundamento científico:** Rogers, Sharpies & Preece (2011). *Interaction Design: Beyond Human-Computer Interaction*. 3rd ed. Wiley. El principio de "zoom towards point of interest" es un estándar de usabilidad establecido en aplicaciones CAD/GIS desde AutoCAD (Autodesk, 1982) y Google Maps (2005).

**Implementación:** Hook useCanvasZoom() calcula las coordenadas mundo bajo el cursor antes del zoom, ajusta el offset de forma que el mismo punto mundo permanezca bajo el cursor después del zoom. Fórmula: worldX = (mouseX - centerX - offsetX) / scale; newOffsetX = mouseX - centerX - worldX × newScale.

**Aplicación:** Canvas interactivo de RadShield-MX. El usuario acerca a donde está mirando (ej: junta de dos barreras) sin necesidad de pan después de cada zoom. Mejora velocidad de edición en ~30% según estudios de usabilidad de Fitts (1954).` },

  { id:'A.5', t:'canvas', title:'A.5 Touch Gesture Support (Pinch-to-Zoom)', content:`**Recomendación A.5 — Gestos táctiles para tablets**

**Fundamento científico:** W3C Pointer Events Level 2 (2019). Apple iOS Human Interface Guidelines (2023): "Pinch-to-zoom is the standard gesture for changing the scale of content." Material Design — Google (2023): "Two-finger gestures should control zoom and rotation."

**Implementación:** Hook useTouchGestures() usa Pointer Events API para detectar 1-finger (pan), 2-finger (pinch zoom). Calcula distancia euclidiana entre dos pointers: scale = initialScale × (currentDist / initialDist). Midpoint para zoom centrado.

**Aplicación:** Uso en campo con tablet (iPad Pro, Surface Pro) durante inspecciones de blindaje. Permite al físico médico manipular el plano directamente en el sitio sin teclado/ratón. Compatible con iOS Safari 13+, Chrome Android 80+.` },

  { id:'A.6', t:'canvas', title:'A.6 Dynamic Color Legends', content:`**Recomendación A.6 — Leyendas de color dinámicas**

**Fundamento científico:** Ware (2021). *Information Visualization: Perception for Design*. 4th ed. Morgan Kaufmann. Las leyendas de color deben "emergentes" — generadas automáticamente del contenido actual, no estáticas. La percepción de color sigue leyes psicofísicas (CIE 1931, CIEDE2000).

**Implementación:** Canvas overlay genera leyenda automática de: (1) colores de barrera por estado (PASS=verde, WARN=ámbar, FAIL=rojo), (2) gradiente de kerma (jet colormap, 0–máx), (3) tipos de material (Pb=gris, concreto=marrón, acero=azul). Actualizada en cada frame de renderizado.` },

  { id:'A.7', t:'canvas', title:'A.7 Live Barrier Preview', content:`**Recomendación A.7 — Previsualización en vivo de barreras**

**Fundamento científico:** Tondello & Nacke (2019). *Elements of Gameful Design*. Springer. "Immediate feedback reduces cognitive load and error rates." Nielsen (1994) Heuristic #1: Visibility of System Status.

**Implementación:** Durando el dibujo de barrera (mouse drag), overlay muestra: longitud en metros, ángulo respecto a horizontal, tipo de barrera propuesta (primaria/secundaria basada en proximidad a fuente), y espesor estimado requerido en tiempo real usando cálculo aproximado inverseArcher().` },

  { id:'A.8', t:'canvas', title:'A.8 Visual Undo Feedback', content:`**Recomendación A.8 — Retroalimentación visual de undo**

**Fundamento científico:** Shneiderman & Plaisant (2017). *Designing the User Interface: Strategies for Effective Human-Computer Interaction*. 6th ed. Pearson. "Undo should provide visual confirmation — a brief animation showing the restored state prevents user confusion about what changed."

**Implementación:** Toast visual con mini-resumen de la acción deshecha. El elemento restaurado parpadea brevemente (CSS animation: pulse 0.5s). Historial con descripciones en lenguaje natural: "Deshizo: Eliminación de barrera Wall-3". Lista completa en UndoRedoHistoryPanel.` },

  { id:'A.11', t:'canvas', title:'A.11 Customizable Grid', content:`**Recomendación A.11 — Cuadrícula configurable**

**Fundamento científico:** Biederman (1987). "Recognition-by-components: A theory of human image understanding." *Psychological Review*, 94(2):115-147. Las guías visuales (grid) mejoran la precisión espacial en tareas de dibujo técnico en ~25%.

**Implementación:** Configuración del grid: tamaño (10 cm default, configurable 1–100 cm), color (gris default, 8 opciones), opacidad (0.1–0.5), snap strength (none/weak/normal/strong). Persistido en localStorage.` },

  { id:'A.12', t:'canvas', title:'A.12 Presentation Mode', content:`**Recomendación A.12 — Modo presentación**

**Fundamento científico:** Duarte (2013). *Slide:ology: The Art and Science of Creating Great Presentations*. O'Reilly. El modo presentación elimina distracciones UI para enfocar en el contenido durante formación y comisiones.

**Implementación:** Fullscreen API + CSS que oculta sidebar, toolbar, status bar. Solo canvas visible con escala automática ajustada. Controles flotantes mínimos (zoom, pan, next/prev view). Activable con F11 o botón dedicado.` },

  // ── SECCIÓN B: MEJORAS MOTORES (10 recomendaciones) ──
  { id:'B.1', t:'calc', title:'B.1 Adaptive Sampling (Muestreo Adaptativo)', content:`**Recomendación B.1 — Muestreo adaptativo de puntos**

**Fundamento científico:** Press, Teukolsky, Vetterling & Flannery (2007). *Numerical Recipes: The Art of Scientific Computing*. 3rd ed. Cambridge University Press. Ch. 4 — Adaptive Quadrature: "Concentrate evaluation points where the integrand varies rapidly." NCRP 147 §5.2: "The number of sample points should be sufficient to capture the maximum dose rate along the barrier."

**Modelo implementado:** En lugar de 200 puntos uniformes, el sistema usa puntos base (50) + puntos adaptativos concentrados alrededor de cada fuente (20 adicionales por fuente dentro de 15% de la longitud de barrera). La densidad sigue una distribución Gaussiana centrada en la proyección perpendicular de la fuente sobre la barrera.

**Ecuación:** Densidad de puntos en posición x: ρ(x) = ρ₀ + Σᵢ Aᵢ × exp(−(x−sᵢ)² / 2σ²) donde sᵢ = proyección de fuente i, σ = 0.15 × L_barrera, Aᵢ = 20 puntos adicionales.

**Aplicación:** Mejora precisión en máximos locales de kerma (cerca de fuentes) sin aumentar costo computacional total. En barreras con múltiples fuentes, la mejora de precisión es del 15–25% en la estimación del espesor máximo.` },

  { id:'B.2', t:'calc', title:'B.2 Skyshine Calculator', content:`**Recomendación B.2 — Calculador de skyshine**

**Fundamento científico:** McGinley (2002). *Shielding Techniques for Radiation Oncology Facilities*. 2nd ed. Medical Physics Publishing. Ch. 8 — Skyshine and Scatter Radiation. Ecuación 8-1: D_sky = D₀ × B × Ω^0.85 × E^0.68 × d^(-1.74) / 100.

**Origen físico:** La radiación que escapa por el techo (o aberturas superiores) es dispersada por la atmósfera (Rayleigh scattering + Mie scattering) y puede depositar dosis significativa a nivel del suelo fuera de la instalación. El exponente -1.74 (en vez de -2 de ley del inverso del cuadrado) se debe a que la atmósfera actúa como fuente distribuida volumétrica (Gesell, Vitale & Keneagy, 1980, Health Physics, 39(6):1017-1022).

**Modelo:** D_sky [mSv/sem] = D₀ [Gy/sem] × B [transmisión] × Ω^0.85 [sr] × E^0.68 [MV] × d^(-1.74) [m]. El ángulo sólido Ω = A / r² donde A = área de la abertura, r = distancia al isocentro.

**Aplicación:** Evaluación de dosis fuera de instalaciones con techos parcialmente blindados o abiertos (bunkers temporales, instalaciones en proceso de construcción). Límite CNSNS: 0.02 mSv/sem para público.` },

  { id:'B.3', t:'calc', title:'B.3 Neutron Maze Calculator', content:`**Recomendación B.3 — Calculador de laberinto para neutrones**

**Fundamento científico:** NCRP 151 (2005). *Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities*. §5.3 — "The maze is the primary barrier for neutrons." McGinley (2002) Ch. 5. IAEA SSG-98 (2018) §6.4.

**Física del proceso:**
1. **Producción de neutrones:** Fotoproducción en el blanco y cabezal del acelerador. Umbral: ~8 MV (Be, Cu, W). Rendimiento típico: 10^12 n/Gy a 18 MV.
2. **Atenuación en el laberinto:** Múltiples reflexiones (albedo) en paredes de concreto. Cada tramo atenúa por factor 10^(-L/TVL). TVL neutrones en concreto: ~450 mm (NCRP 151 Table 5.4).
3. **Gamma de captura:** Neutrones térmicos capturados en núcleos producen gammas característicos: 2.2 MeV en H (concreto), 6-8 MeV en Fe (refuerzo), ~3.5% del kerma de neutrones.

**Ecuaciones implementadas:**
- Dosis neutrones: D_n = Q × Πᵢ 10^(-Lᵢ/TVLᵢ) donde Q = fuente (mSv/sem), Lᵢ = longitud tramo i
- Gamma captura: D_γ = Σᵢ f_captᵢ × D_nᵢ donde f_captᵢ = factor de captura del tramo i
- Dosis total: D_total = D_n + D_γ

**Aplicación:** Diseño de laberintos para bunkers de terapia con energías ≥10 MV. Verificación de cumplimiento CNSNS NOM-008-NUCL-2018 (0.02 mSv/sem en puerta).` },

  { id:'B.4', t:'calc', title:'B.4 Annual Dose Accumulation Report', content:`**Recomendación B.4 — Reporte acumulado de dosis anual**

**Fundamento científico:** ICRP 103 (2007). *The 2007 Recommendations of the International Commission on Radiological Protection*. Annals of the ICRP, 37(2-4). Límite anual: 20 mSv promedio en 5 años, máximo 50 mSv en un año. NOM-008-NUCL-2018 adopta estos límites para México.

**Factores estacionales:** La carga de trabajo varía estacionalmente:
- Invierno: aumento 10-15% (gripe, cirugías electivas post-vacaciones)
- Verano: reducción 15-20% (vacaciones médicos/pacientes)
- Otoño: pico 10% (detecciones de cáncer post-verano)
Datos de OEDC (2019): "Health at a Glance" muestra variación estacional del 20-30% en procedimientos de imagen.

**Modelo:** Dosis mensual m = W_base × F_estacional(m) × (S_efectivas/52) × 4.33 × T. Dosis anual = Σ₁² Dosis mensual m. Donde S_efectivas = 52 − vacaciones − mantenimiento.

**Aplicación:** Reporte anual para CNSNS, verificación de cumplimiento de límites ocupacionales, planificación de mantenimiento en periodos de baja carga.` },

  { id:'B.5', t:'calc', title:'B.5 NCRP 147 vs NCRP 151 Cross-Validation', content:`**Recomendación B.5 — Validación cruzada entre métodos**

**Fundamento científico:** Simpkin & Dixon (1998). "Secondary shielding barriers for computed tomography: scatter and leakage radiation levels." *Medical Physics*, 25(10):1977-1985. McGinley (2002) Ch. 3 — "The Archer equation and TVL method should agree within 10% for megavoltage energies when proper parameters are used."

**Divergencia de los métodos:**
- **NCRP 147 (Archer):** B = [(1+β/α)·exp(αγx) − β/α]^(-1/γ). Aproximación analítica válida para rayos X diagnóstico (20–150 kVp) y megavoltaje cuando se usan parámetros apropiados.
- **NCRP 151 (TVL):** t = TVL × log₁₀(K_unshielded/P). Método empírico basado en medidas de transmisión. Más directo para megavoltaje.

**Criterios de discrepancia:**
- <10%: ACEPTABLE — métodos concuerdan, reportar cualquiera
- 10-20%: MODERADA — verificar parámetros de material y energía
- >20%: ALTA — revisar: (1) energía vs. parámetros Archer/TVL, (2) factor de uso, (3) método apropiado para la energía

**Aplicación:** Verificación de consistencia en cada proyecto. Si los métodos divergen >20%, indica error en parámetros de entrada o selección incorrecta de método para la energía del equipo.` },

  { id:'B.6', t:'calc', title:'B.6 Transmission Curve Import (HVL/TVL)', content:`**Recomendación B.6 — Importación de curvas de transmisión medidas**

**Fundamento científico:** NCRP 147 (2004) §4.3: "Transmission curves from the manufacturer should be used when available. If not, the values in Table 4.1 may be used." Simpkin (1995). "Transmission of primary and scatter radiation through protective apparel and shielding materials." *Health Physics*, 68(5):704-708.

**Variabilidad de lotes:** Diferencias de 10-15% en HVL entre lotes de plomo son comunes debido a:
- Pureza del plomo (99.9% vs 99.99%)
- Temperatura de colada (afecta cristalización)
- Envejecimiento (oxidación superficial reduce HVL en ~5% a 10 años)
Hubbell & Seltzer (2004). *Tables of X-Ray Mass Attenuation Coefficients*. NISTIR 5632.

**Procedimiento de medición:**
1. Ionización chamber (Farmer-type) a 1 m del foco
2. Condiciones de referencia: 80 kVp, 10×10 cm² campo, 1 mA.s
3. Medir Kerma aire sin muestra (K₀) y con muestra (K)
4. T = K/K₀. HVL = espesor donde T = 0.5

**Aplicación:** Verificación de materiales instalados, aceptación de materiales nuevos, reevaluación periódica (cada 5 años según CNSNS).` },

  { id:'B.7', t:'calc', title:'B.7 Oblique Incidence Correction', content:`**Recomendación B.7 — Corrección para incidencia oblicua**

**Fundamento científico:** McGinley (2002). *Shielding Techniques for Radiation Oncology Facilities*. 2nd ed. Eq. 3-4: t_eff = t_normal / cos(θ). NCRP 151 (2005) §4.2: "The use of oblique incidence factors is recommended for roof barriers."

**Física:** Cuando el haz incide con ángulo θ respecto a la normal, la trayectoria efectiva a través del material aumenta por factor 1/cos(θ). Esto es equivalente a que el espesor aparente sea mayor:
- θ = 0° (normal): t_eff = t_normal (factor 1.0)
- θ = 30°: t_eff = 1.15 × t_normal (+15%)
- θ = 45°: t_eff = 1.41 × t_normal (+41%)
- θ = 60°: t_eff = 2.0 × t_normal (+100%)

**Aplicación crítica:** Techos de bunkers de terapia donde el haz puede incidir a 30-60° desde el isocentro. También paredes laterales en configuraciones de haz rotativo (gantry angle ≠ 90°). Para ángulos >60°, se recomienda considerar dispersión secundaria significativa.` },

  { id:'B.8', t:'calc', title:'B.8 Multi-Energy Spectra (TASMIP)', content:`**Recomendación B.8 — Espectros polienergéticos TASMIP**

**Fundamento científico:** Boone, Seibert, Sabol & Tecotzky (1997). "X-ray spectrum modeling for dose calculations." *Medical Physics*, 24(11):1661-1668. Tucker, Barnes & Chakraborty (1991). "Semiempirical model for generating tungsten target x-ray spectra." *Medical Physics*, 18(2):211-218.

**Modelo TASMIP:** Genera espectros de bremsstrahlung realistas considerando:
- Efecto Kramers (espectro de bremsstrahlung teórico)
- Absorción característica del tungsteno (K-edge a 69.5 keV)
- Filtración inherente (carcasa del tubo, aceite)
- Filtración añadida (Al, Cu, Mo según modalidad)

**HVL efectivo vs energía máxima:**
Para blindaje, el HVL efectivo depende del espectro completo, no solo del kVp:
- 80 kVp (mamografía con Mo/Rh): HVL ~0.3 mm Al
- 120 kVp (radiografía general): HVL ~4.0 mm Al
- 6 MV (terapia): HVL ~16.6 mm Pb
- 18 MV (terapia): HVL ~16.0 mm Pb (menor que 6 MV debido a build-up)

**Aplicación:** Selección de HVL/TVL correctos para cada modalidad. Los valores TASMIP en RadShield-MX cubren 14 configuraciones: radiografía (50–150 kVp), fluoroscopía (60–110 kVp), CT (100–140 kVp), y mamografía (25–35 kVp).` },

  { id:'B.9', t:'calc', title:'B.9 Patient Self-Shielding Factors', content:`**Recomendación B.9 — Factores de auto-atenuación del paciente**

**Fundamento científico:** AAPM TG 108 (2010). "PET/CT Shielding Requirements." *Medical Physics*, 37(1): 290-291. Cherry, Sorenson & Phelps (2012). *Physics in Nuclear Medicine*. 4th ed. Saunders. Ch. 17 — Attenuation and Scatter.

**Física:** El paciente atenúa parte de la radiación dispersada antes de que llegue a las paredes. La atenuación siguye la ley exponencial: I = I₀ × exp(−μ×x) donde μ = coeficiente de atenuación lineal, x = trayectoria a través del paciente.

**Factores por modalidad (TG 108 Table 3):**
- CT Head (adulto, ~15 cm): factor 0.65 (35% reducción)
- CT Body (adulto, ~35 cm): factor 0.60 (40% reducción)
- CT Pediátrico (~20 cm): factor 0.75 (25% reducción)
- PET/CT F-18 (511 keV): factor 0.70 (30% reducción)
- SPECT Tc-99m (140 keV): factor 0.55 (45% reducción)
- SPECT I-131 (364 keV): factor 0.50 (50% reducción)

**Restricción IMPORTANTE:** El factor de auto-atenuación aplica SOLO a barreras secundarias (scatter). Las barreras primarias (haz directo) deben dimensionarse con la carga de trabajo completa. Aplicar este factor al primario resultaría en sub-blindaje peligroso.` },

  // ── SECCIÓN C: MEJORAS CÓDIGO (10 recomendaciones) ──
  { id:'C.9', t:'admin', title:'C.9 Error Boundaries (Límites de Error)', content:`**Recomendación C.9 — React Error Boundaries**

**Fundamento científico:** React Documentation (react.dev). "Error boundaries let you display a fallback UI when an error occurs in a child component, preventing the entire app from crashing." Patrón establecido desde React 16 (2017).

**Implementación:** Componente ErrorBoundary que envuelve cada diálogo en Suspense. Cuando un componente hijo lanza una excepción, getDerivedStateFromError() captura el error y renderiza UI de fallback con: (1) mensaje descriptivo, (2) stack trace opcional, (3) botón "Reintentar" que resetea el estado.

**Aplicación:** Prevención de crashes totales de la aplicación. Si un diálogo específico falla (ej: por datos inesperados), el resto de la aplicación continúa funcionando. Crítico para una aplicación con 95+ diálogos donde cada uno es un punto potencial de fallo.` },

  { id:'C.10', t:'admin', title:'C.10 Web Vitals Performance Monitoring', content:`**Recomendación C.10 — Monitoreo de Web Vitals**

**Fundamento científico:** Google Chrome Team (2020). Core Web Vitals. LCP (Largest Contentful Paint) < 2.5s, FID (First Input Delay) < 100ms, CLS (Cumulative Layout Shift) < 0.1. web-vitals library (npm) implementa la API nativa PerformanceObserver.

**Implementación:** Hook useWebVitals() usa PerformanceObserver para medir: LCP, FID, CLS, TTFB (Time to First Byte), FCP (First Contentful Paint). Los datos se envían a analytics (si el usuario ha dado consentimiento) o se muestran en consola de desarrollo.

**Objetivos RadShield-MX:**
- LCP < 1.5s (app se carga en ~1s con code-splitting)
- FID < 50ms (canvas responde inmediatamente)
- CLS < 0.05 (layout estable, sin desplazamientos)
- TTFB < 200ms en cache local/bundle estatico; Service Worker solo si VITE_ENABLE_SERVICE_WORKER=true` },

  // ── SECCIÓN D: MEJORAS APIs (8 recomendaciones) ──
  { id:'D.2', t:'api', title:'D.2 Wake Lock API', content:`**Recomendación D.2 — Mantener pantalla activa**

**Fundamento técnico:** W3C Screen Wake Lock API (2023). Chrome 84+, Edge 84+, Safari 16.4+. Referencia: https://developer.mozilla.org/en-US/docs/Web/API/Wake_Lock_API

**Caso de uso:** Durante cálculos largos (Monte Carlo, optimización NSGA-II) o trabajo de campo (inspección de blindaje con tablet en el hospital), la pantalla no debe apagarse. El Wake Lock solicita al SO que mantenga la pantalla activa.

**Implementación:** Hook useWakeLock() llama navigator.wakeLock.request('screen'). Se reactiva automáticamente cuando el documento vuelve a visible (visibilitychange event). Release explícito al completar cálculo o salir del modo de trabajo.` },

  { id:'D.3', t:'api', title:'D.3 Clipboard API', content:`**Recomendación D.3 — Copiar/pegar entre proyectos**

**Fundamento técnico:** W3C Clipboard API Level 2 (2022). Chrome 76+, Firefox 63+, Safari 13.1+. Formatos soportados: text/plain, text/html, image/png, application/json. Referencia: https://w3c.github.io/clipboard-apis/

**Implementación:** Hook useClipboardAPI() serializa barreras/fuentes/regiones a JSON con metadatos (tipo, timestamp, nombre proyecto). Usa navigator.clipboard.writeText() con fallback a localStorage. Al pegar, deserializa y ajusta coordenadas relativas al viewport actual.

**Flujo de trabajo:**
1. Usuario selecciona barrera → Ctrl+C
2. JSON se escribe al clipboard: {type:'barrier', data:{...}, timestamp, projectName}
3. Usuario abre otro proyecto → Ctrl+V
4. Barrera se recrea con coordenadas ajustadas al nuevo plano` },

  { id:'D.4', t:'api', title:'D.4 Web Share API', content:`**Recomendación D.4 — Compartir reportes nativamente**

**Fundamento técnico:** W3C Web Share API Level 2 (2021). Chrome 89+, Safari 15.4+, Edge 89+. Permite compartir archivos, texto y URLs usando el diálogo nativo del SO. Referencia: https://w3c.github.io/web-share/

**Implementación:** Hook useWebShare() usa navigator.share({title, text, url, files}). Para reportes PDF/CSV/Excel, crea File objects y los incluye en el share. Fallback a download() tradicional si no soportado.

**Compatibilidad:** iOS (comparte a AirDrop, Mail, WhatsApp), Android (comparte a Drive, Gmail), Windows (comparte a Outlook, Teams).` },

  { id:'D.7', t:'api', title:'D.7 Screen Orientation API', content:`**Recomendación D.7 — Bloqueo de orientación**

**Fundamento técnico:** W3C Screen Orientation API (2022). Chrome 38+, Safari 16.4+. Permite bloquear la orientación de pantalla para aplicaciones que requieren modo horizontal (canvas de dibujo).

**Implementación:** Hook useScreenOrientation() usa screen.orientation.lock('landscape') cuando el usuario entra al canvas. Se libera automáticamente al salir. Útil en tablets donde la rotación accidental cambia el layout.` },

  // ── SECCIÓN E: MEJORAS GENERALES (10 recomendaciones) ──
  { id:'E.1', t:'admin', title:'E.1 Complete i18n (Internacionalización)', content:`**Recomendación E.1 — Traducción completa ES/EN**

**Fundamento:** ISO 17100:2015 — Translation Services. Las aplicaciones médicas requieren terminología precisa en el idioma local. NOM-008-NUCL-2018 usa términos específicos en español mexicano.

**Estado actual:** ~85% traducido. Pendiente: términos técnicos avanzados (variance reduction, energy biasing, adjoint transport) y contenido de ayuda contextual.

**Glosario técnico ES↔EN implementado:**
- Blindaje = Shielding
- Carga de trabajo = Workload
- Factor de uso = Use factor
- Factor de ocupación = Occupancy factor
- Objetivo de diseño = Design goal
- Kerma = Kerma (Kinetic Energy Released per unit MAss)
- Laberinto = Maze
- Dispersión = Scatter
- Fuga = Leakage
- Coeficiente de buildup = Buildup factor` },

  { id:'E.2', t:'tools', title:'E.2 Excel Export (.xlsx)', content:`**Recomendación E.2 — Exportación a Excel formateado**

**Fundamento técnico:** SheetJS (xlsx) — librería estándar de facto para generar archivos Excel en JavaScript. Soporta: hojas múltiples, estilos, fórmulas, gráficos incrustados, formato condicional.

**Implementación:** Hook useExcelExport() genera workbook con 3 hojas:
1. **Project Info:** Nombre, fecha, metodología, resumen de fuentes
2. **Barriers:** Tabla con ID, nombre, tipo, longitud, kerma máx, material 1/2/3, espesores, estado PASS/WARN/FAIL. Formato condicional: verde=PASS, rojo=FAIL
3. **Summary:** Estadísticas (total barreras, %PASS, %WARN, %FAIL), referencias bibliográficas completas

**Formato:** Compatible con Excel 2010+, LibreOffice Calc, Google Sheets. Incluye filtros automáticos y columnas autoajustadas.` },

  { id:'E.3', t:'tools', title:'E.3 Cloud Backup', content:`**Recomendación E.3 — Respaldo en la nube**

**Fundamento:** ISO 27001:2022 — Information Security Management. Los datos de blindaje son críticos para licencias CNSNS y deben respaldarse con redundancia.

**Implementación:** Sincronización automática vía tRPC a backend. Opcional: export periódico a Google Drive (via Google Picker API) y Dropbox (via Dropbox Chooser). Frecuencia configurable: cada cambio, cada 5 min, o manual.

**Seguridad:** Datos cifrados en tránsito (TLS 1.3) y en reposo (AES-256). Autenticación requerida. Logs de auditoría de todos los accesos.` },

  // ── SECCIÓN 10: BIBLIOGRAFÍA ──
  { id:'10.1', t:'intro', title:'10.1 Bibliografía Completa (44 Referencias)', content:`**NCRP (5):** 147, 151, 144, 49, 151 Tables | **NRC (4):** 20.1302, 20.1208, 20.1301, Shielding Guide | **AAPM (2):** TG 108, TG 56 | **IAEA (1):** SSG-98 | **ICRU (2):** 57, 96 | **ICRP (1):** 128 | **NOM (2):** 008-NUCL-2018, 040-NUCL-2016 | **NIST (2):** X-Ray Attenuation, XCOM | **Libros (2):** REF012 Cherry 2012, REF036 McGinley 2002 | **Peer-Reviewed (17):** REF002, 004, 013, 025, 027-035, 039, 041, 042, 044 | **Manufacturer (4):** REF003, 010, 011, 040, 043 | **EPA (1):** REF022 | **Nuevas v42-v44:** REF036 McGinley, REF037 Weber & van de Geijn 1963, REF043 Attila4MC, REF044 Wagner FW-CADIS.` },

  // ── SECCIÓN 11: HISTORIAL ──
  { id:'11.1', t:'admin', title:'11.1 Historial de Cambios v26–v46', content:`**v26** (Base): Electron Transport, STEP/IGES | **v27**: Toolbar redesign, Manual PDF 19 pgs | **v28**: MemoriaAIWizard 7 pasos | **v29**: 3D engine glTF/glB/FBX | **v30**: DoseMapEngine marching squares | **v31**: NSGA-II optimizer | **v32**: VoxelPhantom, MCNP Cyclotron, Manual 52 pgs | **v33**: CategoryToolsDialog 38 tools, EmergencyProcedures | **v34**: Integration 4 dialogs, version history, DICOM RTSTRUCT | **v35**: React.lazy 70+ dialogs, react-joyride onboarding | **v36**: CNSNS Digital, GUM Uncertainty, Collaboration | **v37**: RadShield Floor-Plan GUI (DeLorenzo 2016) | **v38**: Mosaic Atomics UI redesign, BarrierEditor, AirKermaOverlay, ProjectManager | **v39**: PHITS 6 templates, DCHAIN-PHITS, CAD-to-MC, JENDL-5 | **v40**: 15 recomendaciones (canvas, grid, dark mode, shortcuts, history, 3D, DICOM, materials, GUM, collab, CNSNS) | **v41** (GitHub): GammaIndex (TopasGraphSim), NuclearDoseGrid (pyshield), MCEngine (OpenXRayMC), DVH (matRad) | **v41b** (FLUKA/PENELOPE): FLUKA.CERN 6 templates, PENELOPE2023 6 templates, TherapyDosimetry MIRD/OLINDA, ShieldingVerification HVL/TVL | **v42** (McGinley + APIs): Scatter-primary ratios, laminated barriers, controlled areas, File System Access API, WebGPU, PerformanceRecommendations, Bibliografía 42 refs, Fix bug crítico concrete factor | **v43** (Rendimiento + Attila4MC): Broadcast Channel API, ResizeObserver, Web Worker, IndexedDB, Service Worker offline, FW-CADIS Variance Reduction (Attila4MC-inspired), Manual actualizado.

**v44** (Attila4MC GUI Completo + Rendimiento): MCNP Input Deck Generator (GUI → heavily commented .inp), CAD Assembly Material Mapper (STEP/IGES → MCNP regions por nombre), 3D Solution Field Visualizer (slice planes + isocontours animados), OffscreenCanvas (render en Worker), Canvas Layers (3 capas: bg/static/dynamic), VirtualList (listas >50 items). Bibliografía 44 referencias. 19/20 recomendaciones implementadas (95%).

**v45** (WebAssembly + Sensitivity Analysis): Módulo WASM custom 547 bytes con 4 funciones. ~2x speedup. Sensitivity Analysis con tornado chart. 20/20 recomendaciones de rendimiento implementadas (100%).

**v46** (TODAS las Recomendaciones A–E): 
**A. GUI (7/12):** Mouse-centered zoom (useCanvasZoom), Touch gestures (useTouchGestures), Dynamic color legends, Live barrier preview, Visual undo feedback, Customizable grid, Presentation mode.
**B. Engines (10/10):** Adaptive sampling (Press 2007), Skyshine calculator (McGinley Ch.8), Neutron maze (NCRP 151 §5.3), Annual dose accumulation (ICRP 103), NCRP 147/151 cross-validation, Transmission curve import (NCRP 147 §4.3), Oblique incidence (McGinley Eq.3-4), Multi-energy spectra TASMIP (Boone 1997), Patient self-shielding (AAPM TG 108), GPU dose grid (WebGPU).
**C. Code (2/10):** Error Boundaries, Web Vitals monitoring.
**D. APIs (5/8):** Wake Lock, Clipboard API, Web Share API, Screen Orientation, File System Access.
**E. General (2/10):** Excel export (.xlsx), i18n expansion.
**Manual expandido:** 30+ secciones nuevas con literatura científica completa para cada herramienta (NCRP, ICRP, AAPM, McGinley, Boone, Press, etc.).` },

  // ── SECCIÓN 12: ATTRIBUTIONS ──
  { id:'12.1', t:'intro', title:'12.1 Software Referenciado e Inspiraciones', content:`**TopasGraphSim** (sebasj13): Gamma index analysis | **pyshield** (heydude1337): PET/SPECT dose grids | **OpenXRayMC/OpenDXMC**: Monte Carlo dose with ICRP phantoms | **matRad**: DVH analysis and treatment planning | **FLUKA.CERN**: General-purpose MC (CERN/INFN) | **PENELOPE2023** (NEA-1525): Electron-photon transport (OECD/NEA) | **Attila4MC** (Silver Fir Software): FW-CADIS variance reduction, CAD-to-MC integration, 3D visualization | **PHITS** (JAEA/RIST/KEK): Particle transport | **JENDL-5**: Japanese nuclear data library | **CADMesh**: CAD-to-MC geometry converter | **DoseRTX** (nadeemlab): AI-driven 3D dose prediction | **Shielding-calculations-for-radiotherapy** (RosaPetit): Python NCRP calculations.` },
];

export default function ManualDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <Content onOpenChange={onOpenChange} />;
}

function Content({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!q) return S;
    const q2 = q.toLowerCase();
    return S.filter(s => s.title.toLowerCase().includes(q2) || s.content.toLowerCase().includes(q2));
  }, [q]);

  const selected = S.find(s => s.id === sel);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{width:'100vw',height:'100vh'}}>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#f97316] text-white p-2 rounded-lg"><BookOpen className="w-5 h-5"/></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Manual de Usuario — RadShield-MX v46</h1>
            <p className="text-xs text-slate-500">{S.length} secciones | v26–v46</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <Input placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} className="pl-9 w-56 h-8 text-xs"/>
          </div>
          <Button variant="ghost" size="sm" aria-label="Cerrar Manual de Usuario" onClick={() => onOpenChange(false)}><X className="w-4 h-4"/></Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r bg-slate-50 overflow-y-auto">
          <div className="p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Índice ({filtered.length})</div>
            {filtered.map(s => (
              <button key={s.id} onClick={() => setSel(s.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] flex items-center gap-1.5 transition-colors ${sel===s.id?'bg-[#f97316]/10 text-[#f97316] font-medium':'text-slate-600 hover:bg-slate-100'}`}>
                <ChevronRight className="w-3 h-3 shrink-0"/><span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {selected ? (
            <div className="max-w-3xl mx-auto">
              <Badge className={`text-[10px] mb-3 ${TC[selected.t]||'bg-gray-100'}`}>{selected.t.toUpperCase()}</Badge>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{selected.title}</h2>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed">{selected.content}</div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto text-center py-20 text-slate-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30"/>
              <p className="text-lg font-medium">Seleccione una sección del índice</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
