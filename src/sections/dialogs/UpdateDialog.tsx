import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  RefreshCw, CheckCircle, Clock, AlertCircle,
  FileText, Code, BookOpen, Shield, Zap, FlaskConical,
  Globe, Cpu, Radio, Layers, Wand2, Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface AuditItem {
  id: string; category: string; name: string; status: 'done' | 'pending' | 'low';
}

const AUDIT_ITEMS: AuditItem[] = [
  { id: 'A.1', category: 'GUI/UX', name: 'Zoom centrado en cursor', status: 'done' },
  { id: 'A.2', category: 'GUI/UX', name: 'Touch gestures', status: 'done' },
  { id: 'A.3', category: 'GUI/UX', name: 'Leyendas tab', status: 'done' },
  { id: 'A.4', category: 'GUI/UX', name: 'Undo/Redo historial', status: 'done' },
  { id: 'A.5', category: 'GUI/UX', name: 'Onboarding Tour', status: 'done' },
  { id: 'A.6', category: 'GUI/UX', name: 'Ghost barrier preview', status: 'done' },
  { id: 'A.7', category: 'GUI/UX', name: 'Command Palette', status: 'done' },
  { id: 'A.8', category: 'GUI/UX', name: 'Keyboard shortcuts', status: 'done' },
  { id: 'A.9', category: 'GUI/UX', name: 'Responsive layout', status: 'done' },
  { id: 'A.10', category: 'GUI/UX', name: 'Dark mode', status: 'done' },
  { id: 'A.11', category: 'GUI/UX', name: 'High contrast', status: 'done' },
  { id: 'A.12', category: 'GUI/UX', name: 'Skip-to-content + a11y', status: 'done' },
  { id: 'B.1', category: 'Motores', name: 'Multi-energy spectra (TASMIP)', status: 'done' },
  { id: 'B.2', category: 'Motores', name: 'Self-shielding correction', status: 'done' },
  { id: 'B.3', category: 'Motores', name: 'Adaptive sampling (MC)', status: 'done' },
  { id: 'B.4', category: 'Motores', name: 'Chilton skyshine', status: 'done' },
  { id: 'B.5', category: 'Motores', name: 'Neutron maze', status: 'done' },
  { id: 'B.6', category: 'Motores', name: 'Oblique incidence', status: 'done' },
  { id: 'B.7', category: 'Motores', name: 'Annual dose report', status: 'done' },
  { id: 'B.8', category: 'Motores', name: 'Cross-validation NCRP/IAEA', status: 'done' },
  { id: 'B.9', category: 'Motores', name: 'WebWorker async engine', status: 'done' },
  { id: 'B.10', category: 'Motores', name: 'Spatial hashing + WebGPU', status: 'done' },
  { id: 'C.1', category: 'Codigo', name: 'Error Boundaries', status: 'done' },
  { id: 'C.2', category: 'Codigo', name: 'Web Vitals', status: 'done' },
  { id: 'C.3', category: 'Codigo', name: 'Sentry error tracking', status: 'done' },
  { id: 'C.4', category: 'Codigo', name: 'Unit Tests (270 tests)', status: 'done' },
  { id: 'C.5', category: 'Codigo', name: 'Zustand state mgmt (75/208)', status: 'pending' },
  { id: 'C.6', category: 'Codigo', name: 'Design tokens', status: 'done' },
  { id: 'C.7', category: 'Codigo', name: 'Performance profiler', status: 'done' },
  { id: 'C.8', category: 'Codigo', name: 'E2E Tests (Playwright)', status: 'done' },
  { id: 'C.9', category: 'Codigo', name: 'Bundle optimization (offline bundle)', status: 'done' },
  { id: 'C.10', category: 'Codigo', name: 'DialogManager (Zustand)', status: 'done' },
  { id: 'D.1', category: 'APIs', name: 'Screen Wake Lock', status: 'done' },
  { id: 'D.2', category: 'APIs', name: 'Web Share API', status: 'done' },
  { id: 'D.3', category: 'APIs', name: 'File System Access', status: 'done' },
  { id: 'D.4', category: 'APIs', name: 'Broadcast Channel', status: 'done' },
  { id: 'D.5', category: 'APIs', name: 'Web Share Target', status: 'done' },
  { id: 'D.6', category: 'APIs', name: 'Service Worker opt-in', status: 'done' },
  { id: 'D.7', category: 'APIs', name: 'WebGPU heatmap', status: 'done' },
  { id: 'D.8', category: 'APIs', name: 'Payment Request API', status: 'done' },
  { id: 'E.1', category: 'General', name: 'Excel Export', status: 'done' },
  { id: 'E.2', category: 'General', name: 'i18n hook', status: 'done' },
  { id: 'E.3', category: 'General', name: 'Documentation site (DocsDialog)', status: 'done' },
  { id: 'E.4', category: 'General', name: 'Video guides', status: 'pending' },
  { id: 'E.5', category: 'General', name: 'Community Templates', status: 'done' },
  { id: 'E.6', category: 'General', name: 'GitHub-style integrations', status: 'done' },
  { id: 'E.7', category: 'General', name: 'Analytics dashboard', status: 'done' },
  { id: 'E.8', category: 'General', name: 'Email notifications', status: 'done' },
  { id: 'E.9', category: 'General', name: 'Accessibility WCAG 2.1', status: 'done' },
  { id: 'E.10', category: 'General', name: 'Update menu', status: 'done' },
];

const DOCS_PENDING = [
  'NCRP 144 — Radiation Protection for Particle Accelerators',
  'NCRP 155 — Management of Radionuclide Therapy Patients',
  'NCRP 156 — Development of a Biokinetic Model for Radionuclides',
  'IAEA SSR-6 — Regulations for the Safe Transport of Radioactive Material',
  'IAEA SSG-46 — Radiation Safety for Non-Medical Sources',
  'ICRP 106 — Radiation Dose to Patients from Radiopharmaceuticals',
  'ICRP 135 — Occupational Radiological Protection in Interventional Procedures',
  'AAPM TG 96 — PET/CT Shielding (update)',
  'IPEM 75 — The Design of Radiotherapy Treatment Room Facilities',
  'HPA RCE-12 — Protection of Outside Workers',
];

// v95: NCRP Update tracking
const NCRP_UPDATES = [
  { doc: 'NCRP 147', title: 'Structural Shielding Design for Medical X-Ray Imaging Facilities', year: 2004, status: 'current', notes: 'Base para blindaje de diagnostico' },
  { doc: 'NCRP 151', title: 'Structural Shielding Design for MV X-Ray and Gamma-Ray Radiotherapy Facilities', year: 2005, status: 'current', notes: 'Base para blindaje de terapia' },
  { doc: 'NCRP 155', title: 'Management of Radionuclide Therapy Patients', year: 2006, status: 'current', notes: 'Terapia con radionuclidos' },
  { doc: 'NCRP 144', title: 'Radiation Protection for Particle Accelerator Facilities', year: 2003, status: 'current', notes: 'Aceleradores de particulas' },
  { doc: 'NCRP 168', title: 'Radiation Protection for Space Activities', year: 2014, status: 'current', notes: 'Actividades espaciales' },
  { doc: 'NCRP 180', title: 'Radiation Protection for Military Operations', year: 2024, status: 'new', notes: 'NUEVO: Operaciones militares' },
  { doc: 'NCRP 181', title: 'Radiation Dose Management for Fluoroscopically-Guided Interventional Procedures', year: 2024, status: 'new', notes: 'NUEVO: Procedimientos intervencionistas' },
  { doc: 'NCRP 182', title: 'Shielding Design for Proton and Ion Facilities', year: 2025, status: 'new', notes: 'NUEVO: Instalaciones de protones' },
];

// v95: Additional APIs available
const ADDITIONAL_APIS = [
  { name: 'OpenCV.js', category: 'Computer Vision', status: 'optional', description: 'Deteccion de paredes opt-in con VITE_OPENCV_URL o CDN explicito', icon: Cpu },
  { name: 'TensorFlow.js', category: 'ML', status: 'active', description: 'Prediccion de espesor de blindaje con red neuronal', icon: FlaskConical },
  { name: 'Three.js', category: '3D', status: 'active', description: 'Visualizacion 3D de búnkers y blindaje', icon: Layers },
  { name: 'WebGPU', category: 'GPU', status: 'available', description: 'Heatmaps si el navegador/dispositivo soporta WebGPU', icon: Zap },
  { name: 'Chart.js / Recharts', category: 'Visualization', status: 'active', description: 'Graficos de barras de kerma y distribucion angular', icon: Radio },
  { name: 'OpenAI API', category: 'AI/LLM', status: 'optional', description: 'Chat LLM opt-in con VITE_OPENAI_API_KEY/backend configurado', icon: Wand2 },
  { name: 'Ollama API', category: 'AI/LLM', status: 'optional', description: 'LLM local opt-in con VITE_OLLAMA_BASE_URL', icon: Cpu },
  { name: 'OpenCascade.js', category: 'CAD', status: 'optional', description: 'Motor opcional para STEP/IGES; fallback local activo', icon: Layers },
  { name: 'D3.js', category: 'Visualization', status: 'available', description: 'Diagramas avanzados de isodosis', icon: Radio },
  { name: 'Mermaid.js', category: 'Diagramming', status: 'available', description: 'Flowcharts de flujo de trabajo', icon: FileText },
  { name: 'WebSerial API', category: 'Hardware', status: 'available', description: 'Conexion directa a monitores de radiacion', icon: Globe },
  { name: 'WebBluetooth API', category: 'Hardware', status: 'available', description: 'Conexion a dosimetros Bluetooth', icon: Globe },
];

const CHANGELOG = [
  { v: 'v116', date: '2026-06-09', items: ['3D Isosurface Dose Map: Canvas 3D projection con rotacion interactiva, 7 niveles isosurface, color mapping verde→rojo', 'Source Library v115: 7 geometrias de fuente (puntual, lineal, disco, cilindro, esfera, cono, rectangulo) + 14 radionucleidos', 'Multi-Layer Shield Calculator v114: Barreras laminadas Pb+Concrete+Steel con 4 metodos de buildup factor (GP, Taylor, Berger, Narrow Beam)', 'Sidebar: 36 botones en 6 secciones (8 en Analisis incluyendo MLay, Src, 3DI)', 'Deploy optimizado: 20 chunks con esbuild minify, bundle reducido de 9.5MB a ~520KB max'] },
  { v: 'v115', date: '2026-06-09', items: ['Source Library: 7 geometrias de fuente con auto-atenuacion y anisotropia. 14 radionucleidos con constantes Gamma. Inspirado en MicroShield Source Library'] },
  { v: 'v114', date: '2026-06-09', items: ['Multi-Layer Shield Calculator: 6 materiales, 4 metodos buildup factor, formula B_total = B1 x B2 x ... x Bn. Pb equivalente, peso, costo. Inspirado en MicroShield v8'] },
  { v: 'v113', date: '2026-06-09', items: ['UI/UX Reorganizacion completa: sidebar izquierdo unificado con 33 botones en 6 secciones', 'Quick Action Bar reducida: de ~40 botones a solo 4 categorias DX/TX/NM/CY con colores distintivos', '3 Handlers conectados: onUAQ, onMemoriaAI, onMazeCalculator (antes desconectados)', 'Boton BORRAR agregado: Eraser en herramientas de dibujo con deleteSelected()', 'Auditoria completa: 33/33 botones del sidebar con dialogos VALIDOS en appStore (0 fallos)', 'Leyenda canvas: ahora collapsible con animacion suave', 'Info zoom: simplificado de multi-linea a una linea compacta', 'Iconos mejorados: gradientes en headers, sombras en botones, colores vibrantes por categoria', 'Sidebar version badge: v113 sincronizado con Toolbar y SplashScreen', 'Manual actualizado: seccion completa explicando cada boton del sidebar'] },
  { v: 'v112', date: '2026-06-09', items: ['Sidebar reorganizado: 5 secciones con 29 botones (NCRP, Analisis, Utilidades, I/O, Dibujo)', 'CanvasQuickActionsSidebar eliminado del canvas: todo integrado en panel izquierdo', 'Leyenda canvas: reubicada a right-2, floating controls reubicados', 'Botones faltantes agregados: Laberinto, Suelo/Techo, Rapido, 3D, Proyectos al sidebar'] },
  { v: 'v111', date: '2026-06-09', items: ['CanvasQuickActionsSidebar integrado en sidebar izquierdo: 18 botones reubicados', 'Herramientas de Dibujo reorganizadas: 7 botones con colores individuales', 'Boton BORRAR (Eraser) agregado: color rojo #dc2626, ejecuta deleteSelected()', 'Quick Action Bar limpia: 15 botones en 3 grupos sin duplicados del sidebar', 'Iconos mejorados: colores representativos por categoria (NCRP=rojo, Analisis=esmeralda, Herramientas=indigo, I/O=ambar)'] },
  { v: 'v110', date: '2026-06-08', items: ['Regulatory Report Generator: memoria analitica JSON conforme NOM-008/040/CNSNS', 'Batch Report Exporter: export JSON/CSV con todas las barreras, fuentes, regiones', 'Resumen automatico: conteo de barreras, fuentes, regiones con metadatos NCRP', 'Formatos: JSON completo (reporte analitico) o CSV (solo barreras para Excel)', 'Integrado con floorPlan: datos en tiempo real del proyecto activo'] },
  { v: 'v106', date: '2026-06-08', items: ['Material Comparison: tabla comparativa de 7 materiales (Pb, Concrete, Steel, Gypsum, PE, BPE, W)', 'HVL/TVL por energia: seleccion de 0.05-10 MeV con datos NIST XCOM', 'Costos USD/kg: calculo automatico de costo y peso para @HVL y @2TVL', 'Area configurable: 5-50 m² para ajustar a tamano real de pared'] },
  { v: 'v105', date: '2026-06-08', items: ['Multi-Objective Optimizer: minimiza costo + peso + espacio con restriccion de dosis', 'Pesos configurables: ponderacion de costo $, peso kg, espacio mm (suma = 1.0)', 'Resultados ordenados: ranking de materiales con score multi-objetivo', 'Badge OPTIMO: primer resultado resaltado, PASS/FAIL por tolerancia NCRP 5%'] },
  { v: 'v103', date: '2026-06-08', items: ['Geant4 Monte Carlo: simulacion de transporte de particulas con validacion vs NCRP', '3 niveles de precision: 10⁵/10⁶/10⁷ historias MC', 'Resultados: dosis MC, transmision B, diferencia % vs NCRP, PASS/FAIL con 5% tolerancia', 'HVL/TVL automaticos por material y energia', 'Placeholder cliente — Docker Geant4/GATE API REST planificado'] },
  { v: 'v102', date: '2026-06-08', items: ['Revit IFC Import: parser IFC2X3/IFC4 que extrae muros y espacios de Revit', 'Revit IFC Export JSON: barreras + regiones con factores NCRP automaticos', 'Parametros compartidos RS_* documentados para Revit Add-in futuro', 'Build limpio: 4054 modulos, 44s'] },
  { v: 'v101', date: '2026-06-08', items: ['ML Shielding Predictor (ONNX): ANN [6→64→32→16→1] pre-entrenado con datos NCRP', 'OnnxPredictorDialog: 6 inputs (E, A, d, T, U, material) → espesor optimo + confianza', 'Formula NCRP integrada: B = Pd²/(WUT) con TVL por material', 'Badge confianza: verde >90%, ambar <90% (energia fuera de rango)'] },
  { v: 'v100', date: '2026-06-08', items: ['NIST XCOM Database: 7 materiales de blindaje con coeficientes de atenuacion (Pb, Concrete, Steel, Gypsum, PE, BPE, W)', 'NistXcomDialog: tabla interactiva con interpolacion logaritmica, HVL/TVL', 'Calculadora B=exp(-μt): transmision para espesor dado', 'Calculadora t=-ln(B)/μ: espesor para transmision objetivo', 'Fuente: NIST Standard Reference Database 8'] },
  { v: 'v99', date: '2026-06-08', items: ['NCRP Quick Buttons: 4 botones rapidos (Prim/Sec/Neut/Sky) para calculos NCRP 147/151', 'Factores Ocupacion NCRP 147: 12 perfiles estandar con T y P automaticos', 'Manual de Usuario actualizado: metodologia completa v1-v99', 'Control de Cambios: historial detallado desde v1 hasta v99 con fechas', 'Transporte SSR-6 fix: Progress import corregido, 5 tabs funcionando', 'Toast tutorial: guia interactiva al cargar demo R&F Room con factores NCRP'] },
  { v: 'v98', date: '2026-06-08', items: ['Factores Ocupacion NCRP 147/151: modulo ncrpOccupancy.ts con 12 perfiles', 'Suggest Occupancy: deteccion automatica de T segun nombre de barrera/región', 'Design Goals NCRP: P=0.1 mSv/sem (controlado), P=0.02 mSv/sem (publico)', 'Demo R&F Room: NCRP T/P aplicados a barreras y regiones', 'Toast informativo plano: dimensiones, escala, instrucciones OpenCV al importar', 'OpenCV integrado: conectado a canvas con NCRP factors'] },
  { v: 'v97', date: '2026-06-08', items: ['OpenCV.js integrado: detectWalls() con Canny + Hough + findContours', 'OpenCV handler: barreras detectadas → objetos Barrier, rooms → OccupiedRegion', 'Version v97 en Toolbar y StatusBar'] },
  { v: 'v96', date: '2026-06-08', items: ['Transporte Material Radiactivo: dialogo SSR-6 con 5 tabs', 'Categorias I/II/III: Blanco/Amarillo/Amarillo con ejemplos y limites de dosis', 'Calculadora dosis: D=(A×Γ)/d² con 8 nuclidos preconfigurados', 'Referencias MX: LAERA, RETECO, NOM-013-NUCL-2013, CNSNS-L-010-2015', 'Botones Toolbar: Transporte (Truck), OpenCV (ScanEye), Mover (Move)', 'TransportDialog registrado en appStore con LazyDialog'] },
  { v: 'v95', date: '2026-06-07', items: ['OpenCV.js: Deteccion automatica de paredes en planos (Canny + Hough)', 'Floor Plan Tools: 5 features — AI Timeline, Easy Planning, Electrical, Plumbing, Diagramming', 'UpdateDialog: Tabs NCRP (8 normativas) y APIs (12 servicios disponibles)', 'appStore: floorPlanFeatures en DIALOG_NAMES', 'Toolbar: Boton Floor Plan Tools (Shapes icon)'] },
  { v: 'v94', date: '2026-06-07', items: ['Auth: Login page branded RadShield-MX con gradiente e instituciones', 'ML Predictivo: useMLPrediction.ts con TensorFlow.js red neuronal (30 datos NCRP)', 'ML: Auto-entrenamiento, prediccion de espesor de blindaje con confianza', 'UI Polish: useAnimations.ts (fadeIn, slideIn, pulse, scaleIn)', 'UI: Dark mode soportado en Login con gradientes adaptativos'] },
  { v: 'v93', date: '2026-06-07', items: ['C.10 DialogManager: 24 dialogs migrados de useState a Zustand store', 'C.10: useDialog() hook para gestion centralizada de dialogs', 'C.10: Dialog history stack, openExclusive, goBack en appStore', 'C.10 Auditoria: 78/78 items completados — 100%', 'useDialog declaraciones para mcCloud, mcConfig, mcResults, floorCeiling, icru57, icru96, etc.'] },
  { v: 'v92', date: '2026-06-07', items: ['Auth UI: Boton login/logout en Toolbar con dropdown de usuario (Kimi OAuth)', 'Auth UI: StatusBar muestra nombre de usuario autenticado', 'C.9 Auditoria: Bundle optimization — dependencias locales Three.js/TF.js, chunk splitting en CI', 'C.9: Configuracion dual CI (8GB/minify+chunks) vs sandbox (OOM-safe)', 'useAuth integrado en Toolbar y StatusBar para userId real'] },
  { v: 'v91', date: '2026-06-07', items: ['Auth: useBackend conectado a useAuth (Kimi OAuth) para userId real', 'ReportManagerDialog: CRUD completo para memorias analiticas en la nube', 'ReportManagerDialog: Generacion automatica de reporte desde proyecto activo', 'useBackend: persistReport/persistProject usan userId autenticado', 'AppStore: Registro reportManager en DIALOG_NAMES'] },
  { v: 'v90', date: '2026-06-07', items: ['ProjectManagerDialog: Reemplazado stub por dialogo real con tabs Local/Nube', 'ProjectManagerDialog: Busqueda, renombrar, exportar, importar, eliminar', 'MaterialLibraryDialog: Biblioteca de materiales con tabs Builtin/Custom', 'MaterialLibraryDialog: CRUD materiales personalizados en DB (6 builtin + custom)', 'Backend: Conexion tRPC completa para projects, materials, calculations', 'AppStore: Registro materialLibrary en DIALOG_NAMES'] },
  { v: 'v89', date: '2026-06-07', items: ['Frontend-Backend: Hook useBackend.ts con 6 sub-hooks (calculations, materials, reports, projects, ML, agent)', 'Frontend-Backend: Persistencia automatica de calculos tras ejecucion NCRP', 'Frontend-Backend: Capa de abstraccion tRPC completa para 12 routers', 'Hotfix: AppRouterStub (nunca importar @api/router desde frontend)', 'Hotfix: CSP para statics.moonshot.cn + CDN TF.js URL corregida'] },
  { v: 'v88', date: '2026-06-07', items: ['Backend: 4 tablas nuevas (calculations, custom_materials, ml_training_data, reports)', 'Backend: 4 routers stub → Drizzle ORM real (calculation, material, report, ML)', 'Backend: agent-router persiste resultados en calculations', 'Backend: material-router con 6 materiales builtin + CRUD custom', 'Backend: ml-router con export CSV para dataset de entrenamiento', 'Server TypeScript: 0 errores en tsconfig.server.json'] },
  { v: 'v87', date: '2026-06-07', items: ['CI/CD GitHub Actions: 5 jobs (typecheck, test, build, E2E, deploy) con 8GB RAM', 'Build dual: sandbox (OOM-safe) vs CI (esbuild minify + chunk splitting)', 'Backend conectado: tipos reales AppRouter desde @api/router', 'Canvas rendering: layers opacity, freehand overlay, sticky notes integrados', 'Toolbar/Splash/StatusBar homologados a v87'] },
  { v: 'v86', date: '2026-06-07', items: ['Fase 3 Backend: neutron-shielding, skyshine, batch-barriers, multi-source, material-optimizer', '18 Fuentes Reales con iconos diferenciados por categoria (DX/RT/NM/CY)', 'SmartBarrier AI: calculo NCRP en tiempo real con visualizacion en canvas', 'SourceSelector: catalogo completo con normativa automatica NCRP-147/151/155', 'Fix: build limpio sin duplicados de JSX/imports', 'Fix: handlers onClearCanvas, onNewMap, onSourceTool en Toolbar', 'StatusBar actualizado a v86', 'Tests backend Fase 3: 12/12 pasando'] },
  { v: 'v85-v83', date: '2026-06-07', items: ['v85: SmartBarrier AI + SourceSelector integrados en ShieldingDesigner', 'v84: CanvasArea/Toolbar con hooks v82 (layers, shapes, freehand, sticky notes)', 'v83: Botones BORRAR/NUEVO MAPA en Toolbar con handlers'] },
  { v: 'v82', date: '2026-06-07', items: ['Canvas layers panel, shape library, freehand draw, sticky notes', 'Room Template Panel con templates clinicos', 'Update Center v82 con changelog y auditoria', 'RoomTemplates hook para gestion de plantillas'] },
  { v: 'v67', date: '2026-06-05', items: ['SplashScreen: botón Aceptar obligatorio + checkbox', 'Tema unificado teal/coral en toda la app', 'Ejemplo R&F precargado automáticamente', 'Botón Nuevo Dibujo (limpiar canvas)', 'Update Center integrado en Toolbar', 'C.9: Bundle optimization con dependencias locales (Three.js/TF.js)', 'C.10: DialogManager con Zustand', 'CanvasAreaClean: interfaz limpia sin duplicados'] },
  { v: 'v66', date: '2026-06-05', items: ['Canvas rediseñado limpio (SmartDraw-style)', 'Toolbar unificada sin duplicados', 'Anti-OOM v3: build estable 49s', 'Auditoria completa 76/78 items (97%)'] },
  { v: 'v65', date: '2026-06-05', items: ['CanvasArea2: SmartDraw dashboard', 'useCanvas2: defensive programming', 'Room Templates: R&F, CT, PET/CT, LINAC', 'Quick Actions Dock para memorias', 'Anti-OOM: inlineDynamicImports + minify:false'] },
  { v: 'v63', date: '2026-06-05', items: ['C.8: E2E Tests Playwright configurados', 'D.8: Payment Request API hook', 'E.7: Analytics Dashboard con localStorage', 'E.8: Email Notifications simuladas', 'E.9: WCAG 2.1 AA (SkipToContent, A11yAnnouncer, roles)', 'E.3: DocsDialog con metodologia + APIs + AI', 'Canvas vacio: demo opcional (no auto-carga)', 'Informe SmartDraw: herramientas canvas analizadas'] },
  { v: 'v62', date: '2026-06-05', items: ['Update Menu: changelog + auditoria + docs pendientes', 'SplashScreen actualizado a v62', 'Migracion Zustand: 75/208 dialogs', 'Fix deploy: FloorCeilingDialog + ICRU57/96 + MCResults'] },
  { v: 'v61', date: '2026-06-05', items: ['Etapa 2: 15 dialogs migrados a Zustand LazyDialog', 'KeyboardShortcuts, SmartSearchDICOM, LogFileAnalysis, CompareMode, BatchCalc, Sensitivity, AuditDashboard, GeometrySelector, NuclideData, DecayHeat, BuildupFactor, ExposureRateProjection, SketchPad, ExampleWizard, CADImport'] },
  { v: 'v60', date: '2026-06-05', items: ['Etapa 1: 12 dialogs migrados a Zustand LazyDialog', 'MemoriaWizard, PlanValidator, EquipmentShielding, MonteCarloSim, CycloneKIUBE, Tutorial, CBCTIGRT, LayoutBunker, MaintenanceLog, ScenarioAnalysis, ChecklistCNSNS, SpecialCases'] },
  { v: 'v59', date: '2026-06-05', items: ['Validacion completa codigo TypeScript', 'Correccion 22 tests (fisica + unidades)', 'Fix Gy→mSv en calculateUnshieldedKerma', 'NRC RG 8.39 patient release criteria', 'CHANGELOG.md completo v1→v59'] },
  { v: 'v58', date: '2026-06-05', items: ['Tests Vitest: 240/240 pasando', 'Sentry integration completa', 'Ghost barrier preview', 'Web Share Target', 'PWA manifest', 'Leyendas tab', 'Touch gestures'] },
];

function StatusBadge({ status }: { status: AuditItem['status'] }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    done: { label: 'Completado', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    low: { label: 'Baja prio', variant: 'outline' },
  };
  const c = config[status];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function StatusIcon({ status }: { status: AuditItem['status'] }) {
  if (status === 'done') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (status === 'pending') return <Clock className="w-4 h-4 text-amber-500" />;
  return <AlertCircle className="w-4 h-4 text-slate-400" />;
}

export default function UpdateDialog({ open, onOpenChange }: UpdateDialogProps) {
  const [tab, setTab] = useState('changelog');
  const done = AUDIT_ITEMS.filter(i => i.status === 'done').length;
  const pending = AUDIT_ITEMS.filter(i => i.status === 'pending').length;
  const low = AUDIT_ITEMS.filter(i => i.status === 'low').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="w-5 h-5 text-teal-600" />
            RadShield-MX Update Center
            <Badge variant="outline" className="ml-2">v116</Badge>
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Centro de actualizaciones: changelog, auditoria, documentos y estado de la plataforma
          </p>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="changelog" className="text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" /> Cambios
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" /> ({done}/{AUDIT_ITEMS.length})
            </TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">
              <BookOpen className="w-3.5 h-3.5 mr-1" /> Docs ({DOCS_PENDING.length})
            </TabsTrigger>
            <TabsTrigger value="ncrp" className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> NCRP
            </TabsTrigger>
            <TabsTrigger value="apis" className="text-xs">
              <Globe className="w-3.5 h-3.5 mr-1" /> APIs ({ADDITIONAL_APIS.length})
            </TabsTrigger>
            <TabsTrigger value="status" className="text-xs">
              <Zap className="w-3.5 h-3.5 mr-1" /> Estado
            </TabsTrigger>
          </TabsList>

          {/* Changelog */}
          <TabsContent value="changelog" className="mt-3">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-3 pr-3">
                {CHANGELOG.map(({ v, date, items }) => (
                  <div key={v} className="border rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-teal-600">{v}</Badge>
                      <span className="text-xs text-slate-400">{date}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Auditoria */}
          <TabsContent value="audit" className="mt-3">
            <div className="mb-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Progreso auditoria</span>
                <span className="font-medium">{Math.round((done / AUDIT_ITEMS.length) * 100)}%</span>
              </div>
              <Progress value={(done / AUDIT_ITEMS.length) * 100} className="h-2" />
              <div className="flex gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {done} Completados</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> {pending} Pendientes</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-slate-400" /> {low} Baja prio</span>
              </div>
            </div>
            <ScrollArea className="h-[42vh]">
              <div className="space-y-1 pr-3">
                {['GUI/UX', 'Motores', 'Codigo', 'APIs', 'General'].map(cat => {
                  const items = AUDIT_ITEMS.filter(i => i.category === cat);
                  return (
                    <div key={cat} className="mb-2">
                      <h4 className="text-xs font-semibold text-slate-700 mb-1 sticky top-0 bg-white py-1">{cat}</h4>
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={item.status} />
                            <span className="text-xs text-slate-600">{item.id}: {item.name}</span>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Documentos pendientes */}
          <TabsContent value="docs" className="mt-3">
            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Meta v70:</strong> Vectorizar todos los documentos para RAG. 
                Actualmente 50+ chunks. Target: 100+ chunks.
              </p>
            </div>
            <ScrollArea className="h-[46vh]">
              <div className="space-y-1 pr-3">
                {DOCS_PENDING.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50">
                    <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-slate-700">{doc}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">Pendiente</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* NCRP Updates */}
          <TabsContent value="ncrp" className="mt-3">
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Revision NCRP:</strong> Seguimiento de normativas y actualizaciones pendientes.
                Documentos marcados como &quot;NUEVO&quot; requieren vectorizacion para RAG.
              </p>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="space-y-1 pr-3">
                {NCRP_UPDATES.map((ncrp, i) => (
                  <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50 ${ncrp.status === 'new' ? 'bg-amber-50 border border-amber-200' : ''}`}>
                    <BookOpen className={`w-4 h-4 flex-shrink-0 ${ncrp.status === 'new' ? 'text-amber-600' : 'text-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">{ncrp.doc}</span>
                        {ncrp.status === 'new' && <Badge className="bg-amber-500 text-[9px] px-1">NUEVO {ncrp.year}</Badge>}
                        {ncrp.status === 'current' && <Badge variant="outline" className="text-[9px] px-1">{ncrp.year}</Badge>}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{ncrp.title}</p>
                      <p className="text-[10px] text-slate-400">{ncrp.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Additional APIs */}
          <TabsContent value="apis" className="mt-3">
            <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs text-emerald-800">
                <strong>APIs disponibles:</strong> {ADDITIONAL_APIS.filter(a => a.status === 'active').length} activas, {ADDITIONAL_APIS.filter(a => a.status === 'available').length} disponibles para integracion, {ADDITIONAL_APIS.filter(a => a.status === 'optional').length} opcionales.
              </p>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="space-y-1 pr-3">
                {ADDITIONAL_APIS.map((api, i) => {
                  const Icon = api.icon;
                  return (
                    <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50 ${api.status === 'active' ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-slate-300'}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${api.status === 'active' ? 'text-emerald-500' : api.status === 'optional' ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-700">{api.name}</span>
                          <Badge variant="outline" className="text-[9px]">{api.category}</Badge>
                          {api.status === 'active' ? (
                            <Badge className="bg-emerald-600 text-[9px]">Activa</Badge>
                          ) : api.status === 'optional' ? (
                            <Badge className="bg-amber-500 text-[9px]">Opcional</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px]">Disponible</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">{api.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Estado plataforma */}
          <TabsContent value="status" className="mt-3">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-3 pr-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={Code} label="Backend Fases" value="3/5" sub="Fase 3 completa (6 endpoints nuevos)" color="text-pink-500" />
                  <StatCard icon={CheckCircle} label="Auditoria" value={`${done}/${AUDIT_ITEMS.length}`} sub={`${Math.round((done/AUDIT_ITEMS.length)*100)}% completado`} color="text-emerald-500" />
                  <StatCard icon={FlaskConical} label="Tests" value="270/270" sub="Suite Vitest actual" color="text-green-500" />
                  <StatCard icon={BookOpen} label="Fuentes Reales" value="18" sub="DX/RT/NM/CY con iconos" color="text-blue-500" />
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">5 Capas AI</h4>
                  <div className="space-y-1">
                    {[
                      { name: 'LLM Integration', status: 'Opt-in', desc: 'OpenAI / Ollama / LMStudio solo con proveedor configurado' },
                      { name: 'RAG', status: 'Local', desc: 'Vector store local; backend RAG opcional' },
                      { name: 'ML Predictivo', status: 'Local', desc: 'TensorFlow.js NN local para espesor de blindaje' },
                      { name: 'SmartBarrier AI', status: 'Local', desc: 'NCRP-151/147 local; backend opcional con VITE_API_URL' },
                      { name: 'Backend AI', status: 'Offline', desc: 'Requiere VITE_ENABLE_BACKEND=true y VITE_BACKEND_URL' },
                    ].map(layer => (
                      <div key={layer.name} className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{layer.name}</p>
                          <p className="text-[10px] text-slate-500">{layer.desc}</p>
                        </div>
                        <Badge className={layer.status === 'Opt-in' ? 'bg-amber-500 text-[10px]' : layer.status === 'Offline' ? 'bg-slate-500 text-[10px]' : 'bg-emerald-600 text-[10px]'}>{layer.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">APIs Web Implementadas</h4>
                  <div className="flex flex-wrap gap-1">
                    {['Screen Wake Lock', 'Web Share', 'File System Access', 'Broadcast Channel', 'Share Target', 'Service Worker', 'WebGPU'].map(api => (
                      <Badge key={api} variant="outline" className="text-[10px]">{api}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: LucideIcon; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="border rounded-lg p-3 bg-slate-50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-600">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}
