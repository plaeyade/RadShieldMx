import { useMemo, useState, type ComponentType } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Database,
  FileText,
  LayoutGrid,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import DialogShell from '@/components/DialogShell';
import { buildF94DropdownParitySummary } from '@/lib/f94DropdownParity';
import { buildF95DropdownSmokeSummary } from '@/lib/f95DropdownSmoke';
import { buildF105FinalMenuSmokeGate } from '@/lib/f105FinalMenuSmokeGate';
import { buildF106PhysicalMenuMigration } from '@/lib/f106PhysicalMenuMigration';
import { buildF107ShieldingMenuMigration } from '@/lib/f107ShieldingMenuMigration';
import { buildF108VerificationQuickAccessPlan } from '@/lib/f108VerificationQuickAccessPlan';
import { buildF109ReportsMenuMigration } from '@/lib/f109ReportsMenuMigration';
import { buildF110EvidenceMenuMigration } from '@/lib/f110EvidenceMenuMigration';
import { buildF111QuickAccessImplementation } from '@/lib/f111QuickAccessImplementation';
import { buildF112QuickAccessCadIntegration } from '@/lib/f112QuickAccessCadIntegration';
import { buildF113ModalityProfileImplementation } from '@/lib/f113ModalityProfiles';
import { buildF114TopBarDeduplication } from '@/lib/f114TopBarDeduplication';
import { buildF115VisualMenuSmoke } from '@/lib/f115VisualMenuSmoke';
import { buildF116UtilityMenuConsolidation } from '@/lib/f116UtilityMenuConsolidation';
import { buildF117ImplementationSummary } from '@/lib/f117ModalityHandoff';
import { buildF118ProfileAwarePreselectionSummary } from '@/lib/f118ProfileAwarePreselection';
import { buildF119ProfileSmokeSummary } from '@/lib/f119ProfileSmoke';
import { buildF120RuntimeProfileSmokeSummary } from '@/lib/f120RuntimeProfileSmoke';
import { buildF121StructuralShieldingImpactSummary } from '@/lib/f121StructuralShieldingImpact';
import { buildF122StructuralOverlayPhaseSummary } from '@/lib/f122CanvasStructuralOverlay';
import { buildF123MaterialDecisionSummary } from '@/lib/f123MaterialDecisionMatrix';
import { buildF124MaterialToolboxSummary } from '@/lib/f124MaterialToolboxConsolidation';
import { buildF125CalculationEvidenceGate } from '@/lib/f125CalculationEvidenceGate';
import { buildF126ReleaseEvidenceHardening } from '@/lib/f126ReleaseEvidenceHardening';
import { buildF127CypeDbAlternatives } from '@/lib/f127CypeDbAlternatives';
import { buildF128MysqlWindowsValidation } from '@/lib/f128MysqlWindowsValidation';
import { buildF129DocumentSeedReadiness } from '@/lib/f129DocumentSeedReadiness';
import { buildF130DbLiveRelease } from '@/lib/f130DbLiveRelease';
import { buildF131FullstackLiveSmoke } from '@/lib/f131FullstackLiveSmoke';
import { buildF132RcPersistenceSmoke } from '@/lib/f132RcPersistenceSmoke';
import { buildF133ApiAuthenticatedSmoke } from '@/lib/f133ApiAuthenticatedSmoke';
import { buildF134BrowserRcSmoke } from '@/lib/f134BrowserRcSmoke';
import { buildF135ReleaseCandidatePackage } from '@/lib/f135ReleaseCandidatePackage';
import { buildF136ProductionDeployRehearsal } from '@/lib/f136ProductionDeployRehearsal';
import { buildF137ProductionCutoverChecklist } from '@/lib/f137ProductionCutoverChecklist';
import { buildF138MaterialRagRobotSummary } from '@/lib/f138MaterialRagRobot';
import { buildF139MaterialCitationOcrAudit } from '@/lib/f139MaterialCitationOcrAudit';
import { buildF141MaterialOcrRecoverySummary } from '@/lib/f141MaterialOcrRecovery';
import { buildF141ProfessionalCanvasSummary } from '@/lib/f141CanvasProfessionalPolish';
import { buildF142MemoriaIaMaterialEvidence } from '@/lib/f142MemoriaIaMaterialEvidence';
import { buildF143ZumayaDocumentIngestionSummary } from '@/lib/f143ZumayaDocumentIngestion';
import { buildF144SourceGovernance } from '@/lib/f144SourceGovernance';
import { buildF146MaterialReportAppendix } from '@/lib/f146MaterialReportAppendix';
import { buildF147Medical3DInspection } from '@/lib/f147Medical3DInspection';
import { buildF145CanvasCadProfessionalSummary } from '@/lib/f145CanvasCadProfessional';
import { buildMedicalScene } from '@/lib/medical3D/sceneBuilder';
import { buildF148MemoryProfileSelector } from '@/lib/f148MemoryProfileSelector';
import { buildF149NormativeNumericQa } from '@/lib/f149NormativeNumericQa';
import { buildF149bFastradClinicalUtility } from '@/lib/f149bFastradClinicalUtility';
import { buildF149cMonteCarloGateway } from '@/lib/f149cMonteCarloGateway';
import { buildF150ReleaseCandidateControlled } from '@/lib/f150ReleaseCandidateControlled';
import { buildF151PrepublishHardening } from '@/lib/f151PrepublishHardening';
import { buildF152ProductionEnvironmentPrep } from '@/lib/f152ProductionEnvironmentPrep';
import { buildF153DbBackupRestore } from '@/lib/f153DbBackupRestore';
import { buildF154PublicUrlSmoke } from '@/lib/f154PublicUrlSmoke';
import { buildF155ControlledReleaseDecision } from '@/lib/f155ControlledReleaseDecision';
import { buildF156FinalPackage } from '@/lib/f156FinalPackage';
import { buildF157OperationalClosure } from '@/lib/f157OperationalClosure';
import { buildF158DeployTargetPostSmoke } from '@/lib/f158DeployTargetPostSmoke';
import { buildF159SitesHostingPrep } from '@/lib/f159SitesHostingPrep';
import { buildF163CanvasClosureSummary } from '@/lib/f163CanvasClosure';
import { buildF164ClinicalProjectMap } from '@/lib/f164ClinicalProjectMap';
import { buildF96DropdownMigrationSummary } from '@/lib/f96DropdownMigration';
import { buildF97DropdownMigrationSummary } from '@/lib/f97DropdownMigration';
import { summarizeF98ReleaseGaps } from '@/lib/f98UnifiedIconography';

type Status = 'current' | 'update' | 'critical' | 'blocked';
type TabKey = 'platform' | 'deps' | 'regs' | 'dbai' | 'menus';

interface UpdateItem {
  name: string;
  current: string;
  latest: string;
  status: Status;
  description: string;
  action?: string;
}

const PLATFORM_UPDATES: UpdateItem[] = [
  { name: 'F411 BIM canvas studio', current: 'guided mode ready', latest: 'CAD/Revit-style ribbon + project manager + layers', status: 'current', description: 'Adapta el canvas al estilo BIM de AutoCAD Plant 3D/Revit: ribbon disciplinar, Project Manager, Details, Layers, navegacion, leyenda y linea de comando. Mantiene acciones reales conectadas y declara los requisitos para BIM completo: IDs persistentes, categorias IFC/Revit, geometria normalizada, materiales versionados, proveedores DWG/IFC/Revit y DB/API.' },
  { name: 'F410 Output surface QA', current: 'browser smoke ready', latest: 'Memoria + Evidence + Medical 3D F409 verified', status: 'current', description: 'Agrega QA funcional de navegador para F409: abre Memoria IA, Evidence Pack y Medical 3D con controles E2E, valida tarjetas F409/F408 visibles y genera JSON/Markdown/capturas en outputs/f410_output_surface_qa.' },
  { name: 'F409 Output surfaces', current: 'integrated', latest: 'F405-F408 visible in Memoria/Evidence/3D', status: 'current', description: 'Integra la trazabilidad F405, heatmap reportable F407 y escena Unity/3D F408 en superficies reales: Memoria IA, Evidence Pack, PDF/heatmap y Medical 3D. Agrega fuente ev-f409, export JSON y estado visible para revisar salidas listas, en revision o bloqueadas.' },
  { name: 'F405-F408 Calc/Canvas/Unity', current: 'contracts ready', latest: 'trace bundle + canvas QA + reportable heatmap + Unity handoff', status: 'current', description: 'Agrega bundle F405 para calculo trazable, auditoria F406 de herramientas reales del canvas, snapshot F407 de heatmap/isocontornos reportables y contrato F408 para Three/R3F, Unity WebGL, glTF/OBJ y runners externos sin alterar geometria ni espesores sin nuevo hash.' },
  { name: 'F404 Archivo funcional', current: 'menu QA real', latest: '15 items trazados + Tech Specs real + smoke UI', status: 'current', description: 'Archivo ahora tiene testids estables por item, Especificaciones Tecnicas deja de ser stub y el smoke navegador abre superficies reales desde el menu normal: proyectos, CSV, DXF, STEP, export CSV, CNSNS, auditoria, logs, glosario y acerca de.' },
  { name: 'F399-F403 Beta controlado', current: 'window QA + beta manifest', latest: '10 superficies validadas + cierres duplicados retirados', status: 'current', description: 'Agrega QA visual, smoke Playwright y manifiesto beta para 7 FullscreenShell y 3 DialogShell; Evidence Pack, Manual, Memoria y Layout ya no muestran cierres internos duplicados.' },
  { name: 'F392-F398 FullscreenShell control', current: '7/7 controlled', latest: 'Evidence/Manual/Memoria/Layout/Dashboard/Checklist/NCRP under common shell', status: 'current', description: 'Las 7 pantallas fullscreen conservadas por politica ahora usan FullscreenShell con cerrar, minimizar contenido y alternar vista contenida/fullscreen. Dashboard, Checklist y NCRP quedan normalizadas; Evidence Pack, Manual, Memoria y Layout conservan controles funcionales internos sin cierre duplicado desde F400.' },
  { name: 'F389-F391 DialogShell migration close', current: '6/6 migrated', latest: 'Compare Scenarios + Tutorial + Version History controlled', status: 'current', description: 'Cierra la cola F378 migrate-window: Compare Scenarios, Tutorial y Version History pasan a DialogShell con mover, minimizar, expandir/restaurar y cerrar. Las 7 superficies restantes conservan fullscreen por politica funcional/regulatoria.' },
  { name: 'F387-F388 Renderer v2 + Photoreal', current: 'enabled', latest: 'dynamic render helpers + ACES/soft-shadow Three profile', status: 'current', description: 'Cierra la lectura F378 con numeros reales: 15 superficies clasificadas, 7 fullscreen por politica, 6 candidatas, 3 P0 migradas y 3 no P0 pendientes. F387 extrae heatmap/isocontornos y sample-lines a renderer helpers v2 sin tocar eventos; F388 aplica ACES, PCFSoftShadowMap, DPR acotado y PBR procedural en Three/R3F.' },
  { name: 'F385-F386 Productive 3D gate', current: 'Three/R3F active', latest: 'Unity URL smoke + Babylon claim guard', status: 'current', description: 'Audita capacidades productivas: Three/R3F queda como motor visual activo; Babylon no se declara completo porque no esta instalado; Unity WebGL se prueba solo si hay URL configurada; DWG/MC externos siguen gateados hasta smoke live.' },
  { name: 'F384 Post-beta backlog status', current: 'truth table ready', latest: 'Babylon/Unity/DWG/MC/renderer/photoreal gates classified', status: 'current', description: 'Separa lo cerrado de lo gateado: F378 P0 de ventanas queda cerrado; Babylon runtime activo, Unity WebGL real, DWG live provider, runners GATE/EGSnrc/Geant4, renderer base v2 y fotorrealismo avanzado siguen como backlog con gates live antes de declarar producto final.' },
  { name: 'F383 P0 integration QA', current: 'enabled', latest: 'P0 DialogShell integration contract', status: 'current', description: 'Valida que Barrier Editor, Air Kerma Overlay y Control Points esten conectados desde ShieldingDesigner con lazy imports, estados, callbacks, cierre y trazas DialogShell, complementando los smokes de canvas/ventanas.' },
  { name: 'F382 P0 DialogShell closure', current: 'complete', latest: 'Barrier + Air Kerma + Control Points on DialogShell', status: 'current', description: 'Cierra la cola P0 de F378. Barrier Editor, Air Kerma Overlay y Control Points ya usan DialogShell y quedan protegidos por contrato para no regresar al overlay fullscreen legacy.' },
  { name: 'F381 Control Points window', current: 'enabled', latest: 'ControlPointsDialog migrated to DialogShell', status: 'current', description: 'Migra Control Points desde overlay fullscreen legacy hacia DialogShell. Mantiene vista mini del floorplan, puntos numerados, alta de punto de control, meta de diseno, posicion y ocupacion, pero ahora permite arrastrar, minimizar, expandir y cerrar sin bloquear el canvas.' },
  { name: 'F380 Air Kerma window', current: 'enabled', latest: 'AirKermaOverlay migrated to DialogShell', status: 'current', description: 'Migra Air Kerma Overlay desde overlay fullscreen legacy hacia DialogShell. Mantiene selector de barreras, grafica de kerma, curva blindada, meta de diseno, metricas y Export PDF, pero ahora permite arrastrar, minimizar, expandir y cerrar sin bloquear el canvas.' },
  { name: 'F379 Barrier Editor window', current: 'enabled', latest: 'BarrierEditor migrated to DialogShell', status: 'current', description: 'Migra Barrier Editor desde overlay fullscreen legacy hacia DialogShell. Mantiene supuestos, materiales, espesores y Generate Recommendations, pero ahora permite arrastrar, minimizar, expandir y cerrar sin bloquear el canvas.' },
  { name: 'F378 Legacy modal audit', current: 'ready', latest: 'fullscreen policy + migration priority report', status: 'current', description: 'Clasifica modales fullscreen legacy: workflows documentales/regulatorios pueden seguir fullscreen; herramientas espaciales del canvas como Barrier Editor, Air Kerma Overlay y Control Points pasan a cola P0 para migrar a ventanas controlables.' },
  { name: 'F377 Side panel controls', current: 'enabled', latest: 'FAQ/plugins/RAG/memory side panels minimizable', status: 'current', description: 'Agrega SidePanelShell y controles de minimizar/restaurar/cerrar para paneles laterales. FAQ, Extension Warehouse, RAG Vector Database y Memorias de Calculo pueden despejar el canvas sin perder estado.' },
  { name: 'F376 Window controls', current: 'enabled', latest: 'non-blocking minimized windows + draggable SourceSelector', status: 'current', description: 'Refuerza ventanas flotantes con minimizar, expandir y cerrar trazables. Al minimizar, el overlay deja pasar clics al canvas. Fuente ahora abre como ventana arrastrable, minimizable, expandible y restaurable.' },
  { name: 'F375 Clean canvas workspace', current: 'enabled', latest: 'CAD Limpio / CAD Guia toggle', status: 'current', description: 'Agrega modo CAD Limpio para ocultar overlays auxiliares grandes y modo CAD Guia para recuperarlos cuando se requiera QA, escenas, mini vistas y export visual. Mantiene dock CAD operativo y tira compacta de estado F375.' },
  { name: 'F374 Quick actions + CAD dock', current: 'repaired', latest: 'sidebar callbacks + toolbar feedback + canvas dock', status: 'current', description: 'Repara accesos rapidos para que ejecuten accion real o dialog fallback, agrega confirmacion visible y crea dock CAD sobre el canvas con Plano, Muro, Fuente, Zona, Calc, 3D y Evidencia. Mantiene renderer base sin reescritura.' },
  { name: 'F371-F372 Beta visual + static package', current: 'ready', latest: 'screenshots + ZIP beta', status: 'current', description: 'Valida en navegador canvas, sidebar, Archivo, boton derecho, Memoria IA, PDF Report, Evidence Pack y Medical 3D. Genera capturas reales, lamina Three/R3F + Unity + memoria y paquete ZIP estatico para beta frontend.' },
  { name: 'F367-F370 Release integration', current: 'beta integrated', latest: '3D evidence + Unity external + external MC + photoreal pack', status: 'current', description: 'Conecta la evidencia visual 3D con Memoria IA, PDF Report y Evidence Pack; formaliza Unity WebGL como visor externo por URL/handoff, GATE/OpenGATE/Geant4/EGSnrc como runners externos y fotorrealismo avanzado sobre Three/R3F con Babylon pendiente.' },
  { name: 'F365-F366 3D visual evidence pack', current: 'enabled', latest: 'guided PNG captures + QA gate', status: 'current', description: 'Medical 3D convierte cada captura PNG en evidencia trazada por preset, hash de escena, checklist y estacion activa. Agrega compuerta QA visual y export de paquete para Memoria IA, PDF, Evidence Pack y anexos CNSNS/UAQ.' },
  { name: 'F364 Three/R3F visual workflow', current: 'enabled', latest: '3D tour presets + station route + visual checklist', status: 'current', description: 'Medical 3D agrega presets de flujo visual para vista general, barreras, equipos, dosis y recorrido. Dibuja ruta de estaciones F147 dentro de Three/R3F, muestra checklist de captura y exporta un paquete de tour visual para Memoria IA, PDF y Evidence Pack.' },
  { name: 'F363 Three/R3F inspection aids', current: 'enabled', latest: 'material bands + footprints + beam guides + Babylon repair lane', status: 'current', description: 'Medical 3D mejora el recorrido Three/R3F con bandas de material/espesor, footprints de equipos, guias visuales de haz/fuente y cotas de sala. Exporta readiness de Babylon y documenta rutas de instalacion/reparacion sin activar dependencia inestable.' },
  { name: 'F362 UI regression repair', current: 'smoke gated', latest: 'Archivo + right click + quick actions', status: 'current', description: 'Corrige la regresion visible post-beta: desactiva render legacy de Archivo, alinea el menu primario con ancho estable, conecta accesos rapidos a callbacks/fallbacks reales y valida con smoke Playwright que boton derecho abre menu contextual en el viewport del canvas.' },
  { name: 'F361 Post-beta repair', current: 'repair ready', latest: 'canvas context + windows + quick access + KIUBE evidence', status: 'current', description: 'Repara regresiones post-beta: menu contextual de canvas con boton derecho, DialogShell arrastrable/minimizable/expandible, accesos rapidos con fallback real al registro de dialogs, menu Archivo con alineacion/ancho estable y PDF Cyclone KIUBE MID 55672 Rev G indexado como evidencia RAG si no esta duplicado por hash.' },
  { name: 'F356-F360 Beta release', current: 'beta ready', latest: 'real user test + preliminary memory', status: 'current', description: 'Cierra estabilizacion como beta operativa: checklist de prueba real, datos faltantes, calculo preliminar trazable, memoria beta y decision de release no certificado. Bloquea memoria firmada y espesores certificados hasta cierre profesional.' },
  { name: 'F350-F355 Real test package', current: 'preliminary package ready', latest: 'source + geometry + TVL + penetrations', status: 'current', description: 'Genera paquete preliminar Centro Neuro con proveedor/fuente cuando existe, geometria 1:100, TVL/densidad candidata con hash, penetraciones estandar y bypass FM/RSO solo para prueba. Mantiene calculo no firmado/no certificado.' },
  { name: 'F349 Evidence surface QA', current: 'QA ready', latest: 'bindings + visuals checked', status: 'current', description: 'Cierra QA de superficies F348: Canvas, Memoria IA, Evidence Pack, PDF y Medical 3D quedan enlazados a los bloques F347, con visuales y sin calculo firmado.' },
  { name: 'F348 App evidence surfaces', current: 'handoff ready', latest: 'Canvas + Memoria + PDF + Evidence + 3D', status: 'current', description: 'Expone los bloques F347 como contrato visual para Canvas, Memoria IA, Evidence Pack, PDF draft y Medical 3D. Genera 20 bindings preliminares no firmables.' },
  { name: 'F347 Memoria IA evidence', current: 'evidence ready', latest: '4 modality blocks + checklist', status: 'current', description: 'Convierte F346 en bloques preliminares para Memoria IA/PDF/Evidence Pack: resumen, metodo, entradas, citas pendientes, advertencias y checklist final por LINAC, Gamma Knife, ciclotron y radiofarmacia.' },
  { name: 'F346 Standard parameter draft', current: 'draft only', latest: 'geometry + source + material + penetrations', status: 'current', description: 'Aplica parametros estandar de geometria, termino fuente, concreto alta densidad, TVL/densidad candidata, penetraciones tipicas y revision FM/RSO final. Mantiene todo bloqueado para memoria firmable hasta citas/versiones y revision.' },
  { name: 'F345 Centro Neuro draft packet', current: 'visual draft ready', latest: '24 barrier rows + gate map', status: 'current', description: 'Genera matriz draft de calculo por barrera y avance visual HTML/SVG para Centro Neuro. Usa escala 1:100, publico en general y T=1, pero bloquea espesores firmables hasta fuente, material, geometria, penetraciones y revision final.' },
  { name: 'F344 Centro Neuro public markup', current: 'markup-ready', latest: '1:100 + publico en general', status: 'current', description: 'Confirma escala 1:100 para trazado draft, aplica colindancias publico en general con T=1 como criterio conservador inicial y mueve la revision FM/RSO al gate final de memoria firmable.' },
  { name: 'F343 Centro Neuro preflight', current: 'draft-blocked', latest: 'Versa HD 15 MeV + LGK Esprit + KIUBE 18 MeV', status: 'current', description: 'Prepara entrada operativa para Versa HD 15 MeV, Gamma Knife Esprit y Cyclone KIUBE 18 MeV con cargas maximas conservadoras. Mantiene el calculo bloqueado hasta fuente, ocupacion, penetraciones, TVL/densidad y revision calificada.' },
  { name: 'F342 Centro Neuro visual evidence', current: 'ready', latest: 'Canvas + 3D + reports screenshots', status: 'current', description: 'Genera tablero visual del caso Centro Neuro y smoke con capturas de canvas, Update Center, Medical 3D, Memoria IA y Evidence Pack. Los visuales son evidencia de revision, no certificacion de blindaje.' },
  { name: 'F341 Centro Neuro calibrated trial', current: 'scale/material seeded', latest: '1:100 + concrete HD + source templates', status: 'current', description: 'Integra la escala 1:100 del plano real, deriva escala provisional 0.01693333 m/px, define fuentes para ciclotron/Gamma Knife/LINAC, usa concreto alta densidad como material draft y deja penetraciones/ocupacion como entradas obligatorias antes de calcular.' },
  { name: 'F340 Centro Neuro operator trial', current: 'ready', latest: 'Canvas + 3D + reports dry-run', status: 'current', description: 'Convierte el seed F339 en prueba operativa: fondo bloqueado del plano, capas de trabajo, colocacion de ciclotron/Gamma Knife/LINAC, preflight de calculo, capturas Medical 3D y salida Memoria IA/PDF/Evidence Pack con calculos bloqueados hasta escala/fuentes/materiales.' },
  { name: 'F339 Centro Neuro real case', current: 'operator trial ready', latest: 'Cyclotron + LGK + LINAC seed', status: 'current', description: 'Prepara el plano real Centro Neuro como seed trazable: PDF AutoCAD renderizado a canvas, hash de fuente, escenarios CY/TX para ciclotron, Gamma Knife-LGK y LINAC, y compuerta de seguridad para no calcular sin escala, fuentes, ocupacion y materiales confirmados.' },
  { name: 'F331-F338 Static release close', current: 'ready', latest: 'Medical 3D QA + static package', status: 'current', description: 'Cierra el release estatico con QA visual por modalidad, sceneHash/evidencia 3D, cola QA numerica, materiales/estructura, RAG/documentos, reportes, canvas gates y paquete F338 para deploy manual/publico.' },
  { name: 'F325-F330 Medical 3D photoreal readiness', current: 'enabled', latest: 'collisions + PBR + visual evidence', status: 'current', description: 'Medical 3D adds collision-aware WASD, PBR material profiles, clinical/inspection/warm lighting, photoreal walkthrough, GLB asset pipeline contract and sceneHash evidence for Memoria IA/PDF/Evidence Pack.' },
  { name: 'F324 Pointer-lock walkthrough', current: 'enabled', latest: 'mouse-look + Esc release', status: 'current', description: 'Medical 3D now supports optional pointer-lock mouse-look inside WASD walkthrough, with Shift/Ctrl speed, R/F eye height, room bounds and OrbitControls fallback outside walkthrough.' },
  { name: 'F317-F323 Medical 3D release line', current: '3D closure staged', latest: 'Three/R3F modality smoke + Babylon/Unity/report path', status: 'current', description: 'Three/R3F remains stable, WASD gains speed/precision/height/bounds, Babylon remains gated by npm EACCES, Unity is ready as external URL handoff, and 3D exports are mapped to Memoria IA/PDF/Evidence Pack.' },
  { name: 'F316 Babylon dependency diagnostics', current: 'blocked by npm EACCES', latest: 'diagnostic manifest + stable fallback', status: 'blocked', description: 'Babylon code path is ready, but dependency installation is blocked by EACCES on registry.npmjs.org. Three/R3F remains active and no partial dependency changes are committed.' },
  { name: 'F315 Unity external viewer bridge', current: 'bridge ready', latest: 'external URL launcher + handoff JSON', status: 'current', description: 'Medical 3D now exports a Unity launch packet and can open a configured Unity WebGL URL. Unity remains external and visual-only; Three/R3F remains the stable fallback.' },
  { name: 'F314 Babylon runtime loader', current: 'loader ready', latest: 'dynamic import + fallback', status: 'current', description: 'Se agrega cargador runtime Babylon con import dinamico y fallback obligatorio a Three/R3F. El intento npm install no completo en este entorno; la app queda estable y lista para activar cuando los paquetes existan.' },
  { name: 'F313 NIST XCOM mixture', current: 'ready', latest: 'mixtures + RAG seed candidate', status: 'current', description: 'NIST XCOM queda como fuente de apoyo para atenuacion fotonica y mezclas por fraccion en peso. El dialogo XCOM muestra TVL de mezcla y genera seed candidato con hashes; NCRP/IAEA/UAQ siguen como metodologia de diseno.' },
  { name: 'F312 Unity external handoff', current: 'deferred external', latest: 'URL/iframe contract', status: 'current', description: 'Unity WebGL queda definido como visor externo: recibe handoff JSON/OBJ/futuro GLTF y devuelve evidencia visual. No se instala en React ni sustituye calculos, citas, PDF o Evidence Pack.' },
  { name: 'F311 Babylon safe adapter', current: 'staged', latest: 'runtime-free contract + flags', status: 'current', description: 'Babylon queda preparado como adapter PBR/WebGPU/WebXR sin instalar paquetes ni cargar runtime. Se activara solo con flags, dynamic import, fallback a Three/R3F y smoke visual dedicado.' },
  { name: 'F310 Real operator Three/R3F', current: 'ready', latest: 'operator checklist + staged Babylon/Unity', status: 'current', description: 'Medical 3D queda listo para una prueba operativa real con Three/R3F activo. Babylon se mantiene como adapter futuro y Unity WebGL como visor externo final para no afectar estabilidad.' },
  { name: 'F81 DB gate', current: 'superseded by F130/F131', latest: 'Windows MySQL live ready', status: 'current', description: 'The earlier Docker/MySQL blocker was resolved by direct Windows MySQL. F130 validated DB live; F131 validates full-stack API/frontend smoke.' },
  { name: 'F82 DB-deferred mode', current: 'enabled', latest: 'continue offline-safe phases', status: 'current', description: 'The app can continue UI, canvas, RAG manifests, documentation, render and QA work while live MySQL is deferred.' },
  { name: 'F83 Canvas continuity panel', current: 'enabled', latest: 'offline workflow visible', status: 'current', description: 'Canvas shows a direct bridge to 3D inspection, Evidence/RAG and deferred DB state so stabilization can continue without MySQL live.' },
  { name: 'F84 External canvas benchmark', current: 'documented', latest: 'IDEA/pyrate/RS patterns mapped', status: 'update', description: 'Next canvas work should prioritize scale calibration, critical points, shielding presets, contextual wall editing, heatmap/isocontours and audit snapshots.' },
  { name: 'F85 Canvas QA tools', current: 'enabled', latest: 'scale/critical/preset/snapshot base', status: 'current', description: 'Canvas exposes scale calibration, critical point drafts, shielding preset readiness and auditable PNG snapshot metadata without requiring live MySQL.' },
  { name: 'F86 Shielding preset workflow', current: 'enabled', latest: 'apply/edit/evidence', status: 'current', description: 'Shielding presets can be applied to selected/all barriers, critical points can be edited from the sidebar, and F86 QA metadata flows into Evidence Pack, Memoria AI and regulatory JSON.' },
  { name: 'F87 Canvas QA export', current: 'enabled', latest: 'visual presets + JSON/CSV', status: 'current', description: 'Selected barriers expose a visual preset selector, and the canvas snapshot exports PNG plus QA JSON/CSV for review, audit and analytic-memory handoff.' },
  { name: 'F88 Layer coverage overlay', current: 'enabled', latest: 'canvas layer labels', status: 'current', description: 'Preset layers are rendered directly over barriers and the canvas QA panel shows F88 coverage percentage for visual validation.' },
  { name: 'F89 Risk heatmap QA', current: 'enabled', latest: 'heat maps + PASS/WARN/FAIL badges', status: 'current', description: 'Canvas can toggle dose heat maps from the main calculation flow, render barrier risk badges and export heatmap metrics in QA JSON/CSV snapshots.' },
  { name: 'F90 End-to-end QA', current: 'enabled', latest: 'release smoke checklist', status: 'current', description: 'Canvas now exposes an offline-safe release smoke checklist for layout, scale, equipment, controlled zone, barriers, calculation, heatmap, evidence and DB decision.' },
  { name: 'F91 Advanced canvas roadmap', current: 'enabled', latest: 'CAD readiness + Memoria IA priorities', status: 'current', description: 'Canvas shows contextual edit, measurement, layer and heatmap readiness while the prioritized release roadmap feeds Memoria IA improvement guidance.' },
  { name: 'F92 Real workflow + 3D inspection', current: 'enabled', latest: 'Design to Integrations flow', status: 'current', description: 'Toolbar exposes the real workflow sequence: Design, Equipment, Shielding, Verification, Reports, Evidence and Integrations, while Medical 3D reports inspection readiness.' },
  { name: 'F93 Citation ledger + dropdown decision', current: 'enabled', latest: 'RAG claim ledger + safe menu migration gate', status: 'current', description: 'Evidence Pack now tracks claimId, documentId, page/section, excerpt hash and verification status. Physical dropdown relocation is deferred until handler parity smoke tests are complete.' },
  { name: 'F94 Dropdown parity map', current: 'enabled', latest: 'ready for staged smoke, not moved', status: 'current', description: 'Critical dropdown commands are mapped to the real F92 workflow and dialog registry before any physical relocation.' },
  { name: 'F95 Dropdown smoke by group', current: 'enabled', latest: 'staged migration allowed after smoke', status: 'current', description: 'Critical commands are smoke-checked by F92 group before starting physical dropdown migration.' },
  { name: 'F96 Design dropdown migration', current: 'enabled', latest: 'design migrated with legacy fallback', status: 'current', description: 'The Design workflow group now has a migrated dropdown near the real F92 flow while legacy menus remain available.' },
  { name: 'F97 Equipment dropdown migration', current: 'enabled', latest: 'equipment migrated with legacy fallback', status: 'current', description: 'The Equipment workflow group now has a migrated dropdown for libraries and clinical sources while legacy menus remain available.' },
  { name: 'F105 Final menu smoke gate', current: 'staged', latest: 'runtime smoke required before removal', status: 'current', description: 'Final workflow is mapped, but physical menu removal remains gated by all-submenus Playwright smoke.' },
  { name: 'F106 Physical menu migration', current: 'controlled', latest: 'Design + Equipment canonical', status: 'current', description: 'Design and Equipment are canonical workflow dropdowns. Legacy duplicate entries remain only as explicit rollback F106 paths while the next groups wait for visual/runtime evidence.' },
  { name: 'F107 Shielding menu migration', current: 'controlled', latest: 'Blindaje canonical', status: 'current', description: 'Blindaje is now the third canonical dropdown. Legacy calculation and nuclear-medicine shielding entries remain as explicit fallback F107 paths.' },
  { name: 'F108 Verification + quick access plan', current: 'controlled', latest: 'Verificacion canonical; quick access F111+', status: 'current', description: 'Verificacion is canonical. Acceso Rapido alternatives are scheduled after menu smoke, starting with favorites and status chips because they do not disrupt current operation.' },
  { name: 'F109 Reports menu migration', current: 'controlled', latest: 'Reportes canonical', status: 'current', description: 'Reportes is now the fifth canonical dropdown. Legacy export/report entries remain labeled fallback F109 until report and evidence smoke pass.' },
  { name: 'F110 Evidence menu migration', current: 'controlled', latest: 'Evidencia canonical', status: 'current', description: 'Evidencia is now the sixth canonical dropdown. Evidence Pack, RAG deep dive, libraries, audit, logs and source review are grouped while legacy entries remain fallback F110.' },
  { name: 'F111 Quick Access implementation', current: 'enabled', latest: 'favorites + status chips', status: 'current', description: 'Acceso Rapido now has additive favorites and status chips. DX/TX/NM/CY, canvas sidebar and legacy fallbacks remain untouched.' },
  { name: 'F112 Quick Access + mini CAD', current: 'enabled', latest: 'persistent favorites + smart chips + mini CAD', status: 'current', description: 'Favorites persist in localStorage, chips reflect project readiness, and CanvasQuickActionsSidebar includes a mini CAD block without replacing DX/TX/NM/CY.' },
  { name: 'F113 Modality profiles', current: 'enabled', latest: 'DX/TX/NM/CY active persistent profiles', status: 'current', description: 'DX/TX/NM/CY now select persistent modality profiles that drive standards, equipment family, calculations, memoria hints and canvas hints while preserving CategoryToolsDialog.' },
  { name: 'F114 Top bar deduplication', current: 'enabled', latest: 'canonical menus clean; Archivo/Eficiencia retained', status: 'current', description: 'Duplicate legacy triggers are hidden from the top bar. Archivo and Eficiencia remain visible because project I/O and performance tools are not fully absorbed yet.' },
  { name: 'F115 Visual menu smoke', current: 'runtime smoke', latest: 'canonical top bar verified', status: 'current', description: 'Build output is opened in a browser smoke to verify canonical workflow dropdowns, active modality profiles and retained Archivo/Eficiencia utilities.' },
  { name: 'F116 Utility consolidation', current: 'enabled', latest: 'Archivo only; Eficiencia moved to Integraciones', status: 'current', description: 'Eficiencia is no longer a separate top-bar utility. Its performance, audit and CAD/MC tools are available from canonical Integraciones.' },
  { name: 'F117 Modality handoff', current: 'enabled', latest: 'profiles feed Memoria/Report/Evidence', status: 'current', description: 'DX/TX/NM/CY active profiles now route suggested standards, report templates, Evidence Pack objectives and RAG queries into the documentation flow.' },
  { name: 'F118 Profile-aware preselection', current: 'enabled', latest: 'confirmed suggestions', status: 'current', description: 'Memoria IA, PDF Report and Evidence Pack now expose apply buttons for active-profile suggestions while avoiding silent regulatory defaults.' },
  { name: 'F119 Profile smoke matrix', current: 'contract smoke', latest: 'DX/TX/NM/CY checked', status: 'current', description: 'All modality profiles are mapped across Memoria IA equipment suggestions, PDF templates and Evidence Pack objectives with explicit apply controls preserved.' },
  { name: 'F120 Runtime profile smoke', current: 'browser smoke', latest: 'screenshots by profile', status: 'current', description: 'Playwright opens Memoria IA, PDF Report and Evidence Pack after selecting DX/TX/NM/CY, records evidence and keeps explicit apply controls visible.' },
  { name: 'F121 Structural shielding impact', current: 'planning layer', latest: 'material load/cost/schedule model', status: 'current', description: 'Adds a CYPECAD-inspired structural impact layer for shielding materials: kg/m2, kg/ml, cost, schedule, constructability and radiological fit without replacing formal structural design.' },
  { name: 'F122 Canvas structural overlay', current: 'canvas ready', latest: 'load/risk chips', status: 'current', description: 'Canvas now computes structural impact overlay readiness from floorplan barriers, material codes, thicknesses and shielding layers.' },
  { name: 'F123 Material decision matrix', current: 'comparison dialog', latest: 'cost/schedule/structure ranking', status: 'current', description: 'Material comparison now includes a decision matrix for shielding material tradeoffs before applying changes to selected barriers.' },
  { name: 'F124 Material toolbox consolidation', current: 'canonical materialComparison', latest: 'one toolbox, no material duplicate route', status: 'current', description: 'Material editor, lead-free alternatives, cost/time/structure comparison and optimizers are consolidated around one stable toolbox entry point.' },
  { name: 'F125 Calculation evidence gate', current: 'Memoria/PDF/Evidence', latest: 'formula-standard-input-output-citation-evidence', status: 'current', description: 'Each calculation result now has a minimum QA contract before analytic-memory or report release.' },
  { name: 'F126 Release evidence hardening', current: 'citation ledger gate', latest: 'RC evidence readiness', status: 'current', description: 'Evidence Pack now distinguishes release-ready citations from draft items by documentId, page/section, hash and verification status.' },
  { name: 'F127 CYPECAD + DB alternatives', current: 'gap review', latest: 'MySQL Windows Service preferred', status: 'current', description: 'CYPECAD-inspired gaps are tracked without claiming structural-solver parity; DB alternatives outside Docker are ranked with MySQL 8 direct on Windows as first option.' },
  { name: 'F128 MySQL Windows validation', current: 'TCP/auth ready', latest: 'migrate/seed allowed', status: 'current', description: 'Windows MySQL responds on 127.0.0.1:3306 and DATABASE_URL authenticates with radshield@localhost.' },
  { name: 'F129 Document seed readiness', current: 'dry-run manifest', latest: 'canonical docs + OCR blockers', status: 'current', description: 'RAG/OCR documents are frozen into a DB-ready manifest while MySQL is installed: seed-ready IDs, duplicate suppressions, OCR blockers and live-seed steps are explicit.' },
  { name: 'F130 DB live release', current: 'live ready', latest: 'auth/migrate/seed/validate passed', status: 'current', description: 'Windows MySQL live path passed: grants, DATABASE_URL auth, Drizzle migration, seed and live validation with release evidence.' },
  { name: 'F131 Full-stack live smoke', current: 'frontend+API+MySQL', latest: 'backend health/contracts + backend-enabled build', status: 'current', description: 'The release path now validates MySQL live schema/seed, Hono/tRPC backend health, protected route contracts and Vite build with backend mode enabled.' },
  { name: 'F132 RC persistence smoke', current: 'DB persistence chain', latest: 'project/calc/report/evidence readback', status: 'current', description: 'Release-candidate DB persistence now writes and reads project, calculation, controlled-zone, analytic memory, report export and audit rows under an isolated F132 smoke user.' },
  { name: 'F133 API authenticated smoke', current: 'tRPC session path', latest: 'auth/ownership/API persistence OK', status: 'current', description: 'Authenticated tRPC calls now create and read project, calculation, report and controlled-zone evidence using a signed kimi_sid cookie and DB ownership readback.' },
  { name: 'F134 Browser RC smoke', current: 'Playwright browser gate', latest: 'shell/canvas/update evidence visible', status: 'current', description: 'Release-candidate UI now has a browser smoke that opens the built app, validates CAD-like canvas panels and confirms F131-F133 evidence cards in Update Center.' },
  { name: 'F135 Release candidate package', current: 'package manifest', latest: 'RC package + deploy decision', status: 'current', description: 'F130-F134 evidence, production build inventory, deploy config and cutover checklist are frozen into an auditable RC package directory.' },
  { name: 'F136 Production deploy rehearsal', current: 'local production-like smoke', latest: 'F135 package served and browser-smoked', status: 'current', description: 'The packaged F135 dist is served by a local static server, deep-link fallback and public artifacts are checked, and Chromium captures deployment evidence.' },
  { name: 'F137 Production cutover checklist', current: 'controlled GO / public NO-GO', latest: 'hosting/secrets/backup gates', status: 'current', description: 'F130-F136 are accepted as the release basis while public launch remains gated by target URL smoke, production secrets and MySQL backup/restore.' },
  { name: 'F138 Material RAG + Robot', current: 'index draft', latest: 'TM NIPOLL/CONTUPLEX + FEM backlog', status: 'current', description: 'High-density block PDFs are prepared as RAG/DB chunks with OCR blockers, and Autodesk Robot-inspired structural checks are mapped beyond CYPECAD coverage.' },
  { name: 'F139 Material citation/OCR audit', current: 'DB readback + OCR closed', latest: 'page/hash/vendor evidence policy', status: 'current', description: 'F138 chunks are validated in DB with page refs and hash tags, duplicate warnings are explicit, and F141 closes the OCR blockers.' },
  { name: 'F141 Material OCR recovery', current: 'searchable PDFs received', latest: 'OCR blockers closed', status: 'current', description: 'CARACTERIZACION DE BLOQUES HD and ScanPRO were re-read as searchable PDFs, reindexed into material RAG and audited against DB chunks.' },
  { name: 'F141 Canvas profesional', current: 'readiness UI', latest: 'CAD/material/estructura/quick access', status: 'current', description: 'Canvas exposes professional polish score, material evidence chip, partial OCR warning and CAD/structural/quick-access status without disrupting current drawing operations.' },
  { name: 'F142 Memoria IA material evidence', current: 'implemented', latest: 'material citations in MA', status: 'current', description: 'Memoria IA now includes recovered material evidence, page/chunk sources, OCR warnings and a reviewed-value policy for vendor/lab data.' },
  { name: 'F143 ZUMAYA document DB ingestion', current: 'live seed', latest: 'NCRP-144/NCRP-49/memorias/vendor docs', status: 'current', description: 'New ZUMAYA PDFs are ingested as f143-* RAG sources, resolving historical NCRP-144/NCRP-49/Memoria AL blockers.' },
  { name: 'F144 Source governance', current: 'implemented', latest: 'canonical sources + MA profiles', status: 'current', description: 'Memoria IA now separates normative references, prior memories, vendor guides and material evidence; LINAC/Gamma Knife profiles are routed without silent formula changes.' },
  { name: 'F145 Canvas CAD professional', current: 'implemented', latest: 'grips/lasso/intersection snap', status: 'current', description: 'Canvas now exposes draggable grips, advanced snapping including intersections, multi/window/lasso selection, inline edit handoff and CAD JSON export evidence.' },
  { name: 'F148 Memory profile selector', current: 'implemented', latest: 'LINAC/Gamma/Braqui/Cyclotron', status: 'current', description: 'Memoria IA now lets the user select the analytic-memory modality profile and exports profile-specific sources, inputs and warnings.' },
  { name: 'F149 Normative numeric QA', current: 'implemented', latest: 'NCRP/TG108/IAEA/UAQ gate', status: 'current', description: 'Release now has a numeric QA gate separating canonical reference checks, engine cross-checks and protocol-internal review cases before F150.' },
  { name: 'F149b FASTRAD export smoke', current: 'implemented', latest: 'sector QA + six-face + export smoke', status: 'current', description: 'FASTRAD-inspired sector ray QA and six-face equivalent thickness are adopted as QA/report patterns, while full Monte Carlo remains an external validated integration.' },
  { name: 'F149c Monte Carlo Gateway', current: 'implemented', latest: 'external MC export/import contract', status: 'current', description: 'GATE/OpenGATE, Geant4, EGSnrc, OpenMC and licensed engines are mapped as external validated integrations with manifest, artifacts, result-import schema and release guardrails.' },
  { name: 'F150 Release candidate controlado', current: 'implemented', latest: 'GO RC / NO-GO publico', status: 'current', description: 'Cierra estabilizacion como release candidate local/full-stack controlado y bloquea publicacion publica hasta URL smoke, secretos productivos y backup/restore DB.' },
  { name: 'F151 Prepublicacion', current: 'implemented', latest: '5 gates before public launch', status: 'blocked', description: 'Target deploy, secretos, backup/restore DB, smoke URL final y freeze quedan como gates ejecutables antes de publicar.' },
  { name: 'F152 Ambiente real', current: 'implemented', latest: 'hosting/runtime/env prep', status: 'blocked', description: 'Detecta URL final, artefactos, backend bridge, secretos y herramientas MySQL para pasar a F153 backup/restore.' },
  { name: 'F153 Backup/restore DB', current: 'implemented', latest: 'dump + restore probe', status: 'current', description: 'Ejecuta backup MySQL real, restore en base temporal, hash SHA-256 y cleanup antes de pasar a smoke URL final.' },
  { name: 'F154 Smoke URL final', current: 'implemented', latest: 'public/staging Playwright gate', status: 'blocked', description: 'Ejecuta el smoke browser contra la URL final solo si F153 restore esta listo y PUBLIC_DEPLOY_URL esta configurado.' },
  { name: 'F155 Decision release', current: 'implemented', latest: 'GO/NO-GO controlled release', status: 'blocked', description: 'Consolida F150-F154 y decide si procede publicacion, paquete RC offline o bloqueo por restore/smoke pendiente.' },
  { name: 'F156 Paquete final', current: 'implemented', latest: 'conditional final package', status: 'blocked', description: 'Genera manifiesto, hashes, README operativo y carriles de entrega sin copiar secretos ni promover deploy publico si F155 esta bloqueado.' },
  { name: 'F157 Cierre operativo', current: 'implemented', latest: 'local/staging release runbook', status: 'current', description: 'Congela evidencia F153-F156, runbook operativo y riesgo residual de repetir smoke al publicar en URL HTTPS externa.' },
  { name: 'F158 Deploy target', current: 'implemented', latest: 'post-deploy F154 smoke', status: 'current', description: 'Valida target local/staging post-deploy y documenta bloqueos para Sites/URL publica externa.' },
  { name: 'F159 Sites hosting prep', current: 'implemented', latest: 'hosting metadata + package', status: 'update', description: 'Crea metadata Sites y paquete compatible; deploy remoto queda pendiente hasta tener Git/source state disponible.' },
  { name: 'F161 Manuales in extenso', current: 'implemented', latest: 'predeploy runbook', status: 'current', description: 'Consolida manual operativo, versiones, control de cambios, DB/deploy, RAG/OCR, canvas/floorplan y checklist antes del deploy final.' },
  { name: 'F163 Canvas/floorplan cierre', current: 'implemented', latest: 'RS Designer parity + release closure', status: 'current', description: 'Cierra el canvas para release local: plano, fuentes/equipos, muros, dosis ambiente, heatmap/isocontornos y export a Memoria IA/Evidence.' },
  { name: 'F164 Clinical project map', current: 'implemented', latest: 'NuviaTech-style map from floorplan', status: 'current', description: 'Agrega visualizacion clinica derivada del plano: departamentos, equipos, proteccion, monitoreo, residuos, construccion blindada y evidencia.' },
  { name: 'F165 Clinical outputs closure', current: 'implemented', latest: 'SVG/PNG + OCR-ready + sync', status: 'current', description: 'Cierra pendientes utiles del mapa clinico: export visual, clasificacion de salas, rutas de flujo y sincronizacion 2D/3D/reporte/evidencia.' },
  { name: 'F174A Predeploy hardening', current: 'implemented', latest: 'calculation/frontend/RAG guardrails', status: 'current', description: 'Agrega guardas de entradas finitas, transmision acotada, politica de citas RAG por tipo de fuente y estado visible antes de deploy sin migrar DB.' },
  { name: 'F175 Local delivery', current: 'implemented', latest: 'cache reset + local package', status: 'current', description: 'Agrega reset-cache.html, limpiador defensivo de service workers y paquete local para recuperar menus/canvas antes del deploy publico.' },
  { name: 'F176 Local smoke', current: 'implemented', latest: '4175 app/reset/assets verified', status: 'current', description: 'Valida la URL local fresca, reset-cache.html, assets JS/CSS actuales y evidencia F175/F174A antes de repetir F154-F158.' },
  { name: 'F177 Sites deploy', current: 'network gated', latest: 'push/save/deploy pending', status: 'blocked', description: 'Reintenta deploy Sites sobre F176. Si git.chatgpt-team.site:443 no responde, no guarda version ni despliega y conserva paquete local.' },
  { name: 'F178 Alternate deploy', current: 'implemented', latest: 'Vercel/Netlify/Cloudflare/VPS ready', status: 'current', description: 'Agrega configs de deploy alterno, SPA fallback, headers de cache y guia para publicar frontend estatico o full-stack VPS.' },
  { name: 'F179 Deploy lane', current: 'deploy-lane-decided', latest: 'Vercel static now; VPS full-stack next', status: 'current', description: 'Formaliza Vercel static como carril primario de URL publica rapida, VPS full-stack como carril clinico y local-offline como fallback mientras Sites siga condicionado por git.chatgpt-team.site:443.' },
  { name: 'F180 Static publish', current: 'static-publish-runbook-ready', latest: 'provider runbook + F154-F158 smoke', status: 'current', description: 'Convierte la decision F179 en pasos operativos para Vercel/Netlify/Cloudflare, politica de secretos y repeticion de F154-F158 con PUBLIC_DEPLOY_URL.' },
  { name: 'F181 Deploy now', current: 'sites-deploy-blocked-static-package-ready', latest: 'static package ready; Sites push blocked', status: 'blocked', description: 'Intenta deploy Sites, detecta bloqueo a git.chatgpt-team.site:443 y deja paquete estatico listo para Vercel/Netlify con repeticion F154-F158.' },
  { name: 'F184 Safe quality workflow', current: 'enabled', latest: 'motor/memoria/materiales/evidencia sin tocar canvas shell', status: 'current', description: 'Agrega score integral para calculo, canvas, Memoria IA, materiales, RAG y export; Material Comparison consolida TVL, kg/m2, costo, tiempo y carga estructural sin mover sidebar/topbar/demo R&F.' },
  { name: 'F185 Canvas micro assist', current: 'enabled', latest: 'HUD compacto sin cambiar geometria', status: 'current', description: 'Agrega asistencia compacta en canvas para herramienta activa, seleccion, snap, capas, evidencia, heatmap y siguiente accion sin tocar eventos ni layout principal.' },
  { name: 'F186 Sidebar + Mat toolbox', current: 'enabled', latest: 'sidebar estable + materiales consolidados', status: 'current', description: 'Fija ancho visible de sidebar, agrega leyendas hover/accesibles, incorpora acceso rapido Mat y consolida Material Comparison con TVL, densidad, peso, costo, tiempo y carga estructural.' },
  { name: 'F188 Panel layout controls', current: 'enabled', latest: 'sidebar ajustable + paneles canvas movibles/cerrables', status: 'current', description: 'Agrega ancho persistente de sidebar, controles para ocultar/restaurar paneles de flujo/QA/continuidad y dock seguro superior/derecho para que los menus no tapen el floorplan.' },
  { name: 'F189 Visual smoke layout', current: 'passed', latest: '1366/1920 canvas-sidebar evidence', status: 'current', description: 'Playwright valida demo R&F, sidebar, controles F188, cerrar/restaurar QA, dock derecho de flujo y ajuste de ancho con capturas en outputs/f189_visual_smoke.' },
  { name: 'F191 pyrateShield-inspired toolbar', current: 'enabled', latest: 'CAD-clinical toolbar + visual modes', status: 'current', description: 'Canvas agrega una banda operativa inspirada en pyrateShield con herramientas CAD-clinicas, acciones frecuentes y selector Plano/Heat/Iso/Estruct sin cambiar formulas ni eventos base.' },
  { name: 'F191C Object inspector', current: 'enabled', latest: 'selected object context chips', status: 'current', description: 'La banda CAD muestra inspector contextual para muro, fuente, punto critico o zona con material, espesor, workload, ocupacion, meta de diseno, snap y capas sin mover el canvas.' },
  { name: 'F191D Context actions', current: 'enabled', latest: 'safe selected-object action rail', status: 'current', description: 'Agrega acciones seguras Mat/Calc/Evid/Ver/X al inspector contextual, visibles solo en ancho amplio para no tapar el plano; borrar/duplicar queda diferido hasta undo/redo dedicado.' },
  { name: 'F191E Inline editor', current: 'enabled', latest: 'safe selected-object property editor', status: 'current', description: 'Agrega editor contextual compacto para nombre, material, workload, isocentro, U, T y P usando updateSelected; no incorpora borrar/duplicar ni acciones destructivas.' },
  { name: 'F191F Inline editor smoke', current: 'passed', latest: 'real selected-object edit QA', status: 'current', description: 'Agrega smoke Playwright que selecciona un objeto real del demo, abre Edit, cambia nombre, valida inspector y confirma que canvas/sidebar siguen visibles.' },
  { name: 'F191G Duplicate/delete confirmed', current: 'enabled', latest: 'safe dup/delete QA', status: 'current', description: 'Agrega Dup/Del confirmados al inspector contextual; duplica fuentes, barreras, puntos criticos y zonas, borra con confirmacion y valida que canvas/sidebar sigan visibles.' },
  { name: 'F192 Calculation hardening', current: 'enabled', latest: 'trace/warnings/citations', status: 'current', description: 'El motor agrega trazabilidad por barrera con formula, norma, energia, citas, entradas, salidas, supuestos y advertencias clinicas sin cambiar layout ni formulas base.' },
  { name: 'F193 Calculation hardening extended', current: 'enabled', latest: 'units/cache/cases/comparator', status: 'current', description: 'Completa hardening con normalizacion de unidades, hash seguro de cache, casos NCRP/IAEA/UAQ de referencia, advertencias clinicas especificas y comparador base/conservador por barrera.' },
  { name: 'F194 Numeric QA known cases', current: 'enabled', latest: 'executable NCRP/TG108/UAQ checks', status: 'current', description: 'Convierte los casos de referencia en una suite ejecutable con checks, tolerancias, advertencias y citas para Memoria IA, Evidence Pack y PDF; UAQ/CNSNS queda review-required.' },
  { name: 'F195 Base/conservative comparison gate', current: 'enabled', latest: 'comparison evidence in F125', status: 'current', description: 'Memoria IA, Evidence Pack y PDF reciben un gate por barrera con espesor base, espesor conservador, delta, severidad, recomendacion y estado missing/review/complete.' },
  { name: 'F196 Safe calculation cache', current: 'enabled', latest: 'hash payload + invalidation audit', status: 'current', description: 'La cache de calculo usa payload F196 y se invalida por escala, geometria, material, fuentes, normas, P/T/U/W, regiones y puntos criticos antes de alimentar reportes.' },
  { name: 'F197 Menu/canvas/output QA', current: 'enabled', latest: 'Archivo + canvas visibility + output guardrails', status: 'current', description: 'Valida el primer menu funcion por funcion, conecta Nuevo Proyecto al reset seguro, diagnostica canvas/sidebar/botones invisibles por estado persistido y enlaza F125/F195/F196 con Memoria IA, Evidence Pack y PDF.' },
  { name: 'F198 Full menu function QA', current: 'enabled', latest: 'all canonical menus opened and checked', status: 'current', description: 'Valida Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia e Integraciones funcion por funcion a nivel de visibilidad/ruta y confirma que canvas/sidebar/F191 sigan visibles.' },
  { name: 'F199 Output smoke QA', current: 'enabled', latest: 'Memoria/PDF/CNSNS/Evidence outputs checked', status: 'current', description: 'Abre Memoria IA, PDF analitico, Reporte CNSNS, Evidence Pack, Checklist CNSNS, Regulatory Report y Batch Exporter con navegador real, valida evidencia/citas/anexos/QA y confirma que canvas/sidebar siguen montados.' },
  { name: 'F200 Static frontend release gate', current: 'ready', latest: 'static-frontend-release-ready', status: 'current', description: 'Consolida F197-F199, valida configuracion Vercel/Netlify SPA, empaqueta dist y deja el frontend listo para revision publica estatica; backend/DB quedan fuera de este gate.' },
  { name: 'F201 Workflow panel controls', current: 'enabled', latest: 'move/compact/close layout-blindaje-memoria', status: 'current', description: 'El panel Layout-blindaje-memoria ahora se desplaza arriba/derecha/abajo, se compacta o se cierra para no obstruir el canvas durante edicion CAD, heatmaps o revision de plano.' },
  { name: 'F202 Public Vercel smoke', current: 'ready/network-gated aware', latest: 'public-vercel-smoke-ready', status: 'current', description: 'Valida la URL publica de Vercel con Playwright: HTTPS, canvas/sidebar/toolbar, panel de flujo movible/compactable, menus canonicos y salidas Memoria IA, PDF, Evidence Pack y CNSNS; si Codex no puede salir, deja evidencia network-gated.' },
  { name: 'F203 Manual public verification', current: 'operator checklist', latest: 'manual-public-verification-required', status: 'update', description: 'Si F202 queda network-gated, genera checklist manual para validar Vercel desde navegador externo: URL, shell, sidebar, canvas, toolbar CAD, panel movible, menus y salidas criticas.' },
  { name: 'F204 Canvas + DXF recovery', current: 'enabled', latest: 'canvas-default + apply DXF to floorplan', status: 'current', description: 'La app abre directo al canvas y el visor DXF puede aplicar LINE/LWPOLYLINE al floorplan principal como barreras; DWG sigue por conversion externa a DXF.' },
  { name: 'F207 Functional App QA', current: 'enabled', latest: 'functional-app-qa-pass', status: 'current', description: 'Smoke integrado sobre dist: arranque al canvas, sidebar/toolbar, Archivo, DXF aplicado al floorplan, Reportes, Memoria IA, PDF y Evidence Pack antes de republicar.' },
  { name: 'F208 Canvas Reporting Layer', current: 'enabled', latest: 'canvas-reporting-layer-ready', status: 'current', description: 'Canvas, Memoria IA, PDF y Evidence Pack exponen plano/cotas/capas/simbolos/heatmap/export como evidencia reportable sin mover layout ni eventos CAD.' },
  { name: 'F209 Canvas Dimension Schedule', current: 'enabled', latest: 'dimension schedule + layer QA', status: 'current', description: 'El canvas agrega agenda CAD compacta con longitudes por barrera, escala, material, espesor y cobertura de calculo, sin tocar eventos ni layout.' },
  { name: 'F210 Canvas Layer Manager Polish', current: 'enabled', latest: 'compact layer manager QA', status: 'current', description: 'El canvas muestra capa activa, visibles/totales, bloqueadas, opacidad, color y advertencias si blindaje/fuentes quedan ocultos para evitar falsos canvas vacios.' },
  { name: 'F211 Canvas Equipment Symbol Schedule', current: 'enabled', latest: 'equipment symbol QA', status: 'current', description: 'El canvas audita fuentes/equipos con modalidad, norma, fabricante/variante, footprint, rotacion y workload para preparar inspeccion 3D y Memoria IA.' },
  { name: 'F212 Heatmap Regulatory Legend', current: 'enabled', latest: 'exportable heatmap/isocontour legend', status: 'current', description: 'El canvas muestra umbrales ALARA/publico/controlado, P min/max del proyecto, niveles de color y maximo proxy semanal para export visual y evidencia.' },
  { name: 'F213 DXF Layer Mapping QA', current: 'enabled', latest: 'DXF layers + CAD button legends', status: 'current', description: 'El visor DXF clasifica capas como muros, equipos, zonas, cotas, referencias o revision; el canvas refuerza tooltips por boton para guiar el diseno de areas.' },
  { name: 'F214 SketchUp-inspired Canvas Reorg', current: 'enabled', latest: 'medical CAD studio viewport', status: 'current', description: 'El canvas adopta una apariencia tipo SketchUp con mesa gris, reglas, chips de escena, cubo de vista, ejes XYZ y tooltips de controles sin tocar renderer, DXF, sidebar ni calculos.' },
  { name: 'F215 Canvas Scene Presets', current: 'enabled', latest: 'Planta/Heat/Iso/Estruct/Extents', status: 'current', description: 'El viewport agrega presets de escena tipo SketchUp para alternar planta clinica, heatmap, isodosis, estructura y zoom extents usando acciones existentes sin afectar dibujo ni calculos.' },
  { name: 'F216 Mini View Manager', current: 'enabled', latest: 'saved viewport slots A/B/C', status: 'current', description: 'El canvas muestra zoom, pan y escena activa; permite guardar, restaurar y borrar tres vistas locales para recuperar encuadres de planta, barrera critica, heatmap o estructura.' },
  { name: 'F217 Visual Export by Scene', current: 'enabled', latest: 'scene PNG evidence queue', status: 'current', description: 'El canvas prepara export visual por escena: Planta para Memoria IA, Heat para Evidence Pack, Iso para PDF y Estruct para anexo estructural, usando export PNG existente.' },
  { name: 'F218 Visual Report Handoff', current: 'enabled', latest: 'Memoria/PDF/Evidence attachment gate', status: 'current', description: 'Memoria IA, PDF Report y Evidence Pack muestran que snapshots F217 deben anexarse, cuales estan listos, cuales faltan y que accion falta antes de cerrar expediente.' },
  { name: 'F219 Canvas Post-Deploy QA', current: 'ready', latest: 'pending CAD roadmap P0/P1/P2', status: 'update', description: 'Define checklist manual/automatizado para Vercel y prioriza pendientes reales del canvas: edicion directa, snapping avanzado, cotas editables, lasso, isocontornos reales, footprints y 3D.' },
  { name: 'F220 Canvas CAD Priority Actions', current: 'enabled', latest: 'P0/P1/P2 actions in canvas flow', status: 'current', description: 'El panel de flujo del canvas agrega botones P0 Edit/Snap/Cotas, P1 Sel/Iso/Eq y P2 3D usando funciones existentes, sin tocar renderer ni eventos base.' },
  { name: 'F221 Canvas real connections', current: 'verified', latest: 'grips, snap, lasso, inline edit, footprints', status: 'current', description: 'Verifica que las modificaciones del canvas sean reales: grips arrastrables, snapping endpoint/midpoint/perpendicular/interseccion, seleccion ventana/lasso, editor inline, footprints y export. Isocontornos y 3D quedan marcados como parciales para hardening.' },
  { name: 'F222-F226 Canvas hardening', current: 'enabled', latest: 'renderer helpers + guarded events + iso/3D path', status: 'current', description: 'Avanza renderer helpers, gate de eventos con feature flag, matriz E2E CAD, hardening de isocontornos/footprints e inspeccion 3D sin reescribir el renderer ni los eventos base por defecto.' },
  { name: 'F227 Renderer layer extraction', current: 'enabled', latest: 'render layer registry', status: 'current', description: 'Extrae el contrato de capas del renderer: grid, imagen, zonas, barreras, equipos, heatmap, lineas, overlays, grips y HUD. Mantiene overlays/grips protegidos en useCanvas hasta E2E.' },
  { name: 'F228 Static render helpers', current: 'enabled', latest: 'grid/imagen/HUD helpers', status: 'current', description: 'Extrae helpers puros para background grid, imagen de plano y HUD de escala, usados ya por useCanvas.draw sin tocar barreras, seleccion, lasso, grips ni eventos.' },
  { name: 'F229 Canvas CAD E2E Harness', current: 'enabled', latest: 'Playwright dedicado canvas', status: 'current', description: 'Agrega arnes E2E dedicado para canvas: shell/sidebar, filas F221-F229, superficie no vacia, dibujo de muro, seleccion, ventana/lasso, modos visuales y superficie de export F217.' },
  { name: 'F230 Post-F229 coverage gate', current: 'enabled', latest: 'renderer/eventos gate', status: 'current', description: 'Agrupa F198, F207, F229 y F200 como condicion previa para tocar renderer base o logica de eventos; cualquier cambio posterior debe ir con feature flag, rollback y repeticion de gates.' },
  { name: 'F231-F236 Canvas release coverage', current: 'complete', latest: 'visual/DXF/grip/iso/3D/deploy gates', status: 'current', description: 'Cierra F231 pixel-diff visual, F232 DXF/DWG fixture, F233 grip/snap harness, F234 isocontornos, F235 sync 2D/3D y F236 post-deploy package con evidencia y recomendaciones para motor de calculo.' },
  { name: 'F237 Calculation governance', current: 'enabled', latest: 'trace/units/warnings/comparison/cache gate', status: 'current', description: 'Consolida las mejoras del motor: formula-norma-input-output-citas, normalizacion de unidades, advertencias clinicas, TVL/HVL versionado, comparador base/conservador y cache F196 antes de Memoria IA/PDF/Evidence.' },
  { name: 'F238-F247 Release execution', current: 'enabled', latest: 'manual/deploy/CAD/TVL/material/report gates', status: 'current', description: 'Cierra manual F247, smoke deploy estatico, CAD bajo riesgo, renderer con feature flag, DXF/equipos, paquete frontend, ledger TVL/HVL, QA numerico, auditoria materiales y checklist de anexos.' },
  { name: 'F248-F250 Release candidate', current: 'static-frontend-release-candidate', latest: 'public smoke + DB gate + RC final', status: 'current', description: 'F248 repite smoke contra URL publica/static; F249 separa frontend estable de fullstack y bloquea DB/API hasta restore probe real; F250 congela RC final y difiere CAD alto riesgo a rama/feature flag post-release.' },
  { name: 'F251-F255 High-risk CAD gate', current: 'disabled-by-default', latest: 'feature flags + rollback + before/after gates', status: 'update', description: 'Prepara renderer/event controller v2, DWG externo, sync 2D/3D, booleanas y heatmaps GPU solo con VITE_CANVAS_HIGH_RISK_CAD/VITE_CANVAS_EVENT_CONTROLLER_V2 apagados por defecto y repeticion F197/F207/F229/F231-F236/F200 antes/despues.' },
  { name: 'F256-F260 Next phases', current: 'roadmap-ready', latest: 'public smoke -> CAD staging -> DB fullstack', status: 'update', description: 'Orden recomendado: F256 smoke publico del ZIP actual, F257 staging con flags CAD, F258 spike renderer/event controller v2, F259 proveedor DWG externo y F260 retomar DB/fullstack con restore probe y backend smoke.' },
  { name: 'F257-F260 Full execution', current: 'staging-gated', latest: 'CAD staging + DWG boundary + DB restore probe gate', status: 'update', description: 'F257 queda ejecutado como paquete staging con .env.staging-cad.example; F258 queda listo solo detras de VITE_CANVAS_EVENT_CONTROLLER_V2; F259 queda bloqueado hasta proveedor DWG externo; F260 queda bloqueado hasta DATABASE_URL, backup, restore probe y backend smoke.' },
  { name: 'F258-F260 Executable lanes', current: 'implemented-gated', latest: 'event controller v2 + DWG contract + DB gate', status: 'update', description: 'Agrega eventControllerV2 aislado, contrato DWG externo y manifest F260 DB/fullstack. Frontend estatico puede publicarse; CAD alto riesgo y fullstack productivo siguen por staging/gates.' },
  { name: 'F261-F262 DWG provider + fixtures', current: 'provider-selected', latest: 'APS primary; fixtures pending', status: 'update', description: 'Selecciona Autodesk Platform Services Design Automation como proveedor primario DWG->DXF, ODA como ruta privada enterprise, CloudConvert solo para preview y DXF manual como fallback. Espera fixtures DWG no sensibles en fixtures/dwg.' },
  { name: 'F263 APS DWG adapter', current: 'backend-adapter-ready', latest: 'cad.apsDwgStatus + cad.apsDwgPlan', status: 'update', description: 'Agrega adaptador seguro APS Design Automation en backend para planear DWG->DXF sin exponer secretos en frontend. Conversion live bloqueada hasta credenciales APS, fixtures DWG no sensibles, hash, capas, escala y confirmacion del operador.' },
  { name: 'F264 Real clinical trial gate', current: 'ready-for-real-testing', latest: 'DX/TX/NM calculation harness', status: 'current', description: 'Agrega pruebas reales sinteticas para LINAC 6 MV, LINAC 18 MV, CT, PET F-18, Gamma Knife Co-60 y HDR Ir-192. Valida trazabilidad, citas, unidades, comparador conservador, cache F196, carga estructural y warnings clinicos antes de probar proyectos reales.' },
  { name: 'F265 Real app testing protocol', current: 'operator-ready', latest: 'DX/TX/NM/CY real-case checklist', status: 'current', description: 'Convierte F264 en protocolo operativo: plano/escala/zonas, equipo, materiales, calculo trazable, Memoria IA/PDF/Evidence y bitacora de desviaciones. DX/TX/NM sin blocker/major antes de salida clinica firmada; CY puede quedar gated.' },
  { name: 'F266 Real case evidence kit', current: 'ready', latest: 'deviation CSV + stop rules', status: 'current', description: 'Agrega kit de evidencia para pruebas reales: checklist por modalidad, evidencia minima, CSV de desviaciones y stop rules. Cualquier blocker/major abierto detiene salida clinica firmada aunque el frontend estatico este estable.' },
  { name: 'F267 Real case smoke execution', current: 'ready-for-replacement', latest: 'DX/TX/NM synthetic baseline CSV', status: 'current', description: 'Ejecuta smoke CT/LINAC/PET y genera CSV inicial de desviaciones. El baseline es sintetico F264 y debe reemplazarse por memoria/reporte real antes de salida clinica firmada.' },
  { name: 'F268 Real memory ingestion', current: 'ready', latest: 'real analytic memories deduped and chunked', status: 'current', description: 'Deduplica e indexa memorias reales LINAC Versa HD, Gamma Knife, Braqui Co-60 y Ciclotron/KIUBE desde Downloads. Genera chunks RAG/DB draft como fuentes de ejemplo/evidencia, sin reemplazar normas NCRP/IAEA/UAQ.' },
  { name: 'F268A External API readiness', current: 'implemented-gated', latest: 'OCR/literature/CAD/MC provider gate', status: 'current', description: 'Prepara Google Document AI, Amazon Textract, Crossref, Semantic Scholar, ODA Drawings SDK, APS, GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy como proveedores backend/externos sin activar secretos ni llamadas live en frontend.' },
  { name: 'F269 OCR cloud adapter gate', current: 'rolled-back-cost', latest: 'local/free OCR preferred; Google/Amazon deferred', status: 'current', description: 'Identifica las dos memorias pendientes de OCR, pero Google Document AI y Textract quedan deferidos por posible costo por pagina. La ruta preferida ahora es OCR libre/local.' },
  { name: 'F270 APS DWG fixture smoke', current: 'ready-no-live-conversion', latest: 'DWG fixtures hashed for APS backend smoke', status: 'current', description: 'Prepara fixtures DWG locales para conversion APS a DXF/SVG con auditoria de capas, escala y hashes. ODA queda como proveedor privado/deferido y el navegador sigue consumiendo DXF/SVG.' },
  { name: 'F271 Literature deep dive gate', current: 'ready-no-live-query', latest: 'Crossref + Semantic Scholar evidence candidates', status: 'current', description: 'Crea consultas por modalidad para LINAC, Gamma Knife, Braqui Co-60, Ciclotron/KIUBE y materiales HD. Solo produce candidatos de cita; no cambia constantes ni metodologia sin QA normativo.' },
  { name: 'F272 External Monte Carlo runner gate', current: 'contract-ready', latest: 'GATE/OpenGATE + Geant4 + EGSnrc runners', status: 'current', description: 'Define contrato export/import para Monte Carlo forward/reverse con version de motor, fisica, seed, historias, incertidumbre y hashes. La app estatica no integra motores ni reclama certificacion clinica.' },
  { name: 'F273-F278 Live integration readiness', current: 'validated-redacted', latest: 'credentials checked; Geant4/EGSnrc deferred', status: 'current', description: 'Valida credenciales sin imprimir secretos, verifica servicio Google, AWS, APS, literatura y GATE, conserva Geant4/EGSnrc como pendientes por decision operativa y evita procesar PDFs/DWG sin aprobacion live.' },
  { name: 'F279 Local/free OCR rollback', current: 'cost-safe', latest: 'Tesseract/OCRmyPDF/Poppler/PDF.js preflight', status: 'current', description: 'Revierte el primer pase OCR cloud por costo y agrega prueba local gratuita para las dos memorias pendientes. Revisa Tesseract, OCRmyPDF, Poppler y pdfjs antes de considerar Google/Amazon como excepcion.' },
  { name: 'F280 Local OCR smoke', current: 'draft-evidence', latest: 'first pages OCR for real memories', status: 'current', description: 'Ejecuta OCR local de prueba sobre las primeras paginas de las dos memorias pendientes. Genera JSONL por pagina con hash, motor, idioma y estado draft-needs-review antes de OCR completo o seed DB.' },
  { name: 'F281 Full local OCR', current: 'draft-evidence', latest: 'hybrid OCR/text for real memories', status: 'current', description: 'Procesa memorias reales completas con texto nativo cuando existe y Tesseract solo en paginas escaneadas. No siembra DB automaticamente; requiere QA, dedupe y confirmacion de spa.traineddata antes de RAG productivo.' },
  { name: 'F282 OCR RAG readiness', current: 'draft-corpus', latest: 'page-hash chunks for reviewed seed', status: 'current', description: 'Convierte las salidas F281 en chunks RAG deduplicados con documentId, pagina, hash, modalidad y estado de revision. Mantiene seed DB apagado hasta QA de paginas y gobierno de fuentes.' },
  { name: 'F283 OCR chunk QA', current: 'qa-gate', latest: 'sampled pages and seed/review partition', status: 'current', description: 'Evalua calidad OCR por pagina, selecciona muestras representativas, separa chunks listos para seed draft de chunks que requieren revision y bloquea seed automatico hasta aprobar la muestra.' },
  { name: 'F284 RAG seed candidate', current: 'dry-run', latest: 'approved-only candidate corpus', status: 'current', description: 'Genera un corpus candidato para document_chunks usando solo chunks seed-draft-ready y exporta los chunks excluidos para revision. No escribe en DB; deja accion explicita para seed posterior.' },
  { name: 'F285 Controlled RAG seed', current: 'dry-run-gated', latest: 'document_chunks rows ready with reviewed-only gate', status: 'current', description: 'Convierte los candidatos F284 en filas compatibles con document_chunks y mantiene la escritura DB apagada salvo F285_SEED_LIVE=1, F285_CONFIRM_REVIEWED=1 y DATABASE_URL despues de backup/restore probe.' },
  { name: 'F286 OCR human review', current: 'operator-pending', latest: 'sample/blocked pages review packet', status: 'update', description: 'Genera paquete de revision humana para las paginas OCR: 38 muestras y 24 paginas bloqueadas con CSV de decisiones. F287 seed live queda bloqueado hasta documentar aprobar/rechazar/re-OCR/redactar cada fila.' },
  { name: 'F287 Approved-only RAG seed', current: 'dry-run-approved-only', latest: 'F286 needs-reocr excluded', status: 'current', description: 'Prepara el seed aprobado solamente: conserva chunks F285 QA-ready, excluye filas F286 marcadas needs-reocr/needs-redaction/reject y mantiene escritura live protegida por F287_SEED_LIVE, F287_CONFIRM_APPROVED_ONLY y DATABASE_URL.' },
  { name: 'F288 RAG approved validation', current: 'ready', latest: 'approved-only corpus smoke', status: 'current', description: 'Valida el corpus F287 sin escribir DB: trazabilidad, duplicados, fuentes, modalidades y smoke retrieval para ciclotron, LINAC, Gamma Knife y Braqui. DB readback queda opcional con F288_DB_READBACK=1.' },
  { name: 'F289 Memoria IA RAG handoff', current: 'ready', latest: 'citation index + DX/TX/NM/CY bundles', status: 'current', description: 'Crea indice de citas para Memoria IA con citationId, pageRef, sourceHash y chunkHash. Mantiene NCRP/IAEA/UAQ como canonicos y usa memorias OCR solo como evidencia/ejemplo.' },
  { name: 'F290 Real clinical testing matrix', current: 'ready', latest: 'DX/TX/NM/CY real-case checklist', status: 'current', description: 'Define matriz de pruebas reales con casos DX, LINAC, Gamma Knife, Braqui Co-60, PET/NM y Ciclotron/KIUBE, criterios de aceptacion y bloqueo de salida clinica hasta cerrar desviaciones.' },
  { name: 'F291 Calculation real-case hardening', current: 'ready', latest: 'numeric QA mapped to real cases', status: 'current', description: 'Cruza la matriz F290 con guardas F192-F196/F237: cada caso real queda ligado a validacion numerica, warnings clinicos, evidencia canonica y decision de salida. DX/NM siguen requiriendo memoria/plano firmado cuando F290 lo exige.' },
  { name: 'F292 Real project floorplan QA', current: 'ready', latest: 'canvas entry checklist', status: 'current', description: 'Cierra QA de entrada de proyecto real: canvas/sidebar visible, importacion de plano/DXF, escala, capas, cotas, simbolos de equipo, heatmap/isocontornos, export visual, 3D y paneles movibles antes de tocar renderer de alto riesgo.' },
  { name: 'F293 Static release refresh', current: 'ready', latest: 'real trial protocol + static package', status: 'current', description: 'Refresca el paquete estatico con F291/F292, verifica F200/F291/F292 y deja protocolo operatorio de prueba real: cargar plano, calibrar escala, trazar areas, colocar equipo, calcular, exportar y cerrar desviaciones.' },
  { name: 'F294 Real guided smoke', current: 'ready', latest: 'TX-LINAC default evidence runbook', status: 'current', description: 'Prepara smoke guiado real con caso TX-LINAC-6MV-001: checklist de evidencia, bitacora de desviaciones, politicas de no certificacion clinica automatica y siguiente paso F295 para ejecucion con capturas del operador.' },
  { name: 'F295 Canvas redesign smoke', current: 'ready', latest: 'Archivo aligned + clean canvas defaults', status: 'current', description: 'Corrige Archivo como menu primario al inicio, oculta la zona legacy duplicada, abre canvas con paneles pesados cerrados por defecto y deja preview/arquitectura para 3D medico y motores externos.' },
  { name: 'F296-F300 Canvas 3D workbench', current: 'ready', latest: 'visible bounded sidebar + navigable 3D preview', status: 'current', description: 'Deja la sidebar principal visible por defecto con ancho estable acotado, conserva paneles pesados cerrados, genera preview navegable de inspeccion medica 3D y formaliza el contrato de runners externos GATE/OpenGATE, EGSnrc, Geant4 y APS/ODA.' },
  { name: 'F301-F306 Functional release close', current: 'ready', latest: '3D engine decision + external runner flow', status: 'current', description: 'Cierra el bloque funcional con docking/renderer gates, E2E canvas, Memoria IA, DB/RAG readback y release decision. Recomienda Three.js como visor primario, Babylon/WebGPU como fase 2 y Unity WebGL solo como visor externo pesado.' },
  { name: 'F307-F309 3D engine release', current: 'ready', latest: 'R3F active, Babylon adapter, Unity deferred', status: 'current', description: 'Implementa selector de motor en Medical 3D: Three/R3F queda activo, Babylon PBR/WebGPU/WebXR queda como adapter futuro y Unity WebGL se deja al final como visor externo pesado con handoff JSON.' },
  { name: 'Archivo Menu Closure', current: 'closed', latest: 'submenus validated and integrated', status: 'current', description: 'Cierra el menu Archivo como utilidad superior estable: Nuevo/Abrir/Guardar, importacion CSV/DXF/STEP, exportacion CSV/PDF/CNSNS, compartir, especificaciones, auditoria, logs, glosario y acerca quedan conectados al frontend y cubiertos por F197/F198/F204/F207/F200.' },
  { name: 'F98 Unified iconography + release gaps', current: 'enabled', latest: 'canvas/equipment icons unified', status: 'current', description: 'Canvas buttons and active tool indicator now share one icon profile, while release gaps are counted explicitly for final stabilization.' },
  { name: 'F72 Canvas equipment visuals', current: 'enabled', latest: 'validated', status: 'current', description: 'Canvas renders LINAC, Gamma Knife, CT, PET/CT, HDR, cyclotron, SPECT and mammography source profiles.' },
  { name: 'Medical 3D Floor Plan', current: 'enabled', latest: 'footprint metadata', status: 'current', description: '3D scene receives equipment footprint, asset hint and RAG tags from floorplan sources.' },
  { name: 'DWG workflow', current: 'external conversion', latest: 'DXF/SVG bridge', status: 'current', description: 'DWG is treated as external conversion to avoid false native support in browser.', action: 'Convert DWG to DXF/SVG before import' },
  { name: 'Evidence chain', current: 'F76/F77/F78', latest: 'runtime smoke OK', status: 'current', description: 'Evidence Pack, Memoria AI, Regulatory Report and PDF Report show live floorplan evidence.' },
];

const DEP_UPDATES: UpdateItem[] = [
  { name: 'React', current: '19.x', latest: 'pinned by lockfile', status: 'current', description: 'UI framework. Keep pinned until release candidate.' },
  { name: 'Vite', current: '7.x', latest: 'validated build', status: 'current', description: 'Build passes; preview may need static server under sandbox.' },
  { name: 'Drizzle ORM', current: 'installed', latest: 'MySQL live validation passed', status: 'current', description: 'ORM migrations and seed now pass against direct Windows MySQL; F131 extends the gate through backend health and frontend build.' },
  { name: 'Three.js', current: 'bundled', latest: 'LOD/cache roadmap', status: 'update', description: 'Renderer can improve with instancing, LOD, asset cache and canvas pixel QA.' },
  { name: 'TensorFlow/ML', current: 'local', latest: 'dataset governance', status: 'update', description: 'Model quality depends on curated anonymized analytic memories and calculation cases.' },
];

const REG_UPDATES: UpdateItem[] = [
  { name: 'NCRP 151', current: 'loaded/versioned', latest: 'verify hash/version', status: 'current', description: 'Do not re-enter if dataset is already versioned. Re-ingest only for new edition or corrected source.' },
  { name: 'NCRP 147', current: 'loaded/versioned', latest: 'verify hash/version', status: 'current', description: 'Keep as authoritative source for diagnostic shielding with citation ledger.' },
  { name: 'AAPM TG-108', current: 'loaded', latest: 'RAG citation ledger', status: 'update', description: 'Useful for PET/CT shielding and nuclear medicine workflows.' },
  { name: 'IAEA SRS-47', current: 'loaded', latest: 'rerank by modality', status: 'update', description: 'Prioritize for radiotherapy facility design and international cross-checks.' },
  { name: 'CNSNS/UAQ', current: 'local docs', latest: 'controlled citations', status: 'update', description: 'Use document fingerprints and page references for Mexican regulatory reports.' },
];

const DBAI_UPDATES: UpdateItem[] = [
  { name: 'DB reconstruction', current: 'completed on Windows MySQL', latest: 'migrations + seed + live validation OK', status: 'current', description: 'DATABASE_URL is configured, Windows MySQL is reachable, migrations are applied and live DB validation passes.' },
  { name: 'F128 MySQL Windows validation', current: 'installed/reachable', latest: 'auth OK', status: 'current', description: 'MySQL Windows is installed, reachable and DATABASE_URL authentication succeeds for radshield_mx_test.' },
  { name: 'Deferred DB continuity', current: 'active', latest: 'safe to continue', status: 'current', description: 'Do not block stabilization. Continue with non-DB phases and keep RAG chunks/seed drafts ready for later insertion.' },
  { name: 'RAG hybrid search', current: 'planned', latest: 'keyword + vector', status: 'update', description: 'Combine lexical search with embeddings to improve recall for TVL, workload, maze and standards.' },
  { name: 'Citation ledger', current: 'enabled in Evidence Pack', latest: 'claim-level evidence', status: 'current', description: 'Each analytic-memory claim now keeps source, documentId, page/section, hash, confidence and verification status for RAG deep dives.' },
  { name: 'F129 Document seed readiness', current: 'dry-run', latest: 'seed-ready manifest', status: 'current', description: 'Six canonical documents and 229 chunks are ready for later MySQL seed; NCRP-49 and Memoria AL remain OCR blockers, and inaccessible H: drive duplicates are suppressed.' },
  { name: 'F130 DB live release', current: 'ready', latest: 'migrate + seed + validate OK', status: 'current', description: 'Release DB gate passed with table count, seed and live validation evidence.' },
  { name: 'F131 Full-stack live smoke', current: 'ready', latest: 'DB/API/frontend OK', status: 'current', description: 'Live MySQL, backend health, protected tRPC contracts and backend-enabled frontend build are checked together before RC persistence smoke.' },
  { name: 'F132 RC persistence smoke', current: 'ready', latest: 'write/read chain OK', status: 'current', description: 'Project, calculation, report, controlled-zone plan/calculations, analytic memory snapshot, export hash and audit trail are persisted and read back in MySQL.' },
  { name: 'F133 API authenticated smoke', current: 'ready', latest: 'signed-session tRPC OK', status: 'current', description: 'API smoke verifies unauthenticated 401, signed-session user, spoofed userId protection and DB readback of API-created evidence.' },
  { name: 'F134 Browser RC smoke', current: 'ready', latest: 'Playwright evidence OK', status: 'current', description: 'Browser smoke validates canonical menus, floorplan canvas, CAD-like panels and Update Center release cards, and stores screenshot/JSON/MD evidence.' },
  { name: 'F135 Release candidate package', current: 'ready', latest: 'package/deploy decision OK', status: 'current', description: 'RC manifest copies F130-F134 evidence, records dist hashes and keeps production deployment gated by secrets, DB backup and target smoke.' },
  { name: 'F136 Production deploy rehearsal', current: 'ready', latest: 'static package smoke OK', status: 'current', description: 'F135 packaged dist is served locally like production, artifacts and SPA fallback are checked, and Chromium verifies the app shell.' },
  { name: 'F137 Production cutover checklist', current: 'ready', latest: 'controlled cutover gates', status: 'current', description: 'Local release train is ready for controlled production cutover preparation, with public launch still gated by final URL smoke, secrets and DB backup.' },
  { name: 'F138 Material RAG + Robot', current: 'ready-with-ocr-blockers', latest: 'material evidence chunks', status: 'current', description: 'CONTUPLEX/TM NIPOLL documents are converted to a RAG/DB draft and Robot structural gaps are added for FEM, sequence loads, API bridge and BIM roundtrip.' },
  { name: 'F139 Material citation/OCR audit', current: 'ready', latest: 'material chunks DB verified', status: 'current', description: 'Material chunks are read back from DB, citation metadata is checked, exact duplicates are reviewed, and OCR blockers are closed by F141.' },
  { name: 'F141 Material OCR recovery', current: 'ready', latest: '2 recovered PDFs added', status: 'current', description: 'The two formerly blocked high-density material PDFs are now RAG/DB-ready; ScanPRO keeps a partial-page OCR review warning.' },
  { name: 'F142 Memoria IA material evidence', current: 'ready', latest: '111 material chunks usable', status: 'current', description: 'Material RAG is available to Memoria IA with citation policy, source/page/chunk references and remaining partial-page warnings.' },
  { name: 'F143 ZUMAYA document DB ingestion', current: 'ready', latest: '7 PDFs indexed', status: 'current', description: 'NCRP-144, NCRP-49, IAEA SRS-47, Gamma Knife memories/vendor guide and Braqui Co-60 example are added to document_chunks.' },
  { name: 'F144 Source governance', current: 'ready', latest: 'LINAC/Gamma Knife governed', status: 'current', description: 'Canonical hierarchy is explicit: normative sources define formulas, analytic memories are examples, vendor guides are planning evidence, and material PDFs remain reviewed/unreviewed evidence.' },
  { name: 'F148 Memory profile selector', current: 'ready', latest: 'profile-aware Memoria IA', status: 'current', description: 'LINAC, Gamma Knife, Braqui Co-60 and Cyclotron profile routes are selectable before export and preserve F144/F125 source rules.' },
  { name: 'F149 Normative numeric QA', current: 'ready', latest: 'release numeric gate', status: 'current', description: 'NCRP 147/151, TG-108, IAEA/HDR and UAQ protocol paths are summarized with tolerances, release blockers and review cases.' },
  { name: 'F149b FASTRAD utility', current: 'ready', latest: 'export smoke + external MC guardrail', status: 'current', description: 'FASTRAD modules are mapped into clinical/constructive/operational utility, export surfaces and post-RC backlog.' },
  { name: 'F149c MC Gateway', current: 'ready', latest: 'GATE/Geant4/EGSnrc/OpenMC bridge', status: 'current', description: 'Forward MC is packaged for external execution; reverse MC is limited to deterministic QA until an external validated adjoint/reverse engine is commissioned.' },
  { name: 'Deep-dive planner', current: 'planned', latest: 'multi-pass review', status: 'update', description: 'Split investigations into regulation, physics, equipment, calculation, QA and report checks.' },
  { name: 'AI learning dataset', current: 'manual', latest: 'curated memories', status: 'update', description: '20-30 memories help prompts; 50-100 help RAG; 200+ help ML/fine-tuning; 500+ enable robust analytics.' },
];

const MENU_UPDATES: UpdateItem[] = [
  { name: 'F94 Paridad de handlers', current: 'mapped', latest: 'staged smoke first', status: 'current', description: 'Do not move dropdowns yet. First validate command parity by F92 group: Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia and Integraciones.' },
  { name: 'F95 Smoke por grupo', current: 'pass checklist', latest: 'allow staged migration', status: 'current', description: 'Smoke validates handlers, dialog registry and workflow mapping. Physical relocation remains deferred to the next phase.' },
  { name: 'F96 Diseno migrado', current: 'design dropdown duplicated', latest: 'legacy fallback kept', status: 'current', description: 'Design commands moved into the F92 workflow area while the original legacy menu remains as rollback.' },
  { name: 'F97 Equipos migrado', current: 'equipment dropdown duplicated', latest: 'legacy fallback kept', status: 'current', description: 'Equipment commands moved into the F92 workflow area while Med. Nuclear and Herramientas remain as rollback.' },
  { name: 'F105 Gate final', current: 'staged', latest: 'Playwright smoke required', status: 'current', description: 'Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia and Integraciones are covered. Do not remove legacy fallback until runtime smoke passes.' },
  { name: 'F106 Migracion fisica controlada', current: 'rollback F106', latest: 'one group at a time', status: 'current', description: 'Diseno queda canonico y Equipos queda canonico con fallback rotulado. Blindaje sera el siguiente grupo candidato.' },
  { name: 'F107 Blindaje canonico', current: 'fallback F107', latest: 'Verificacion siguiente', status: 'current', description: 'Blindaje queda en dropdown principal. Los botones anteriores se conservan como rollback y las alternativas de Acceso Rapido quedan documentadas para mejora gradual.' },
  { name: 'F108 Verificacion canonica', current: 'fallback F108', latest: 'Reportes siguiente', status: 'current', description: 'Verificacion queda en dropdown principal. Acceso Rapido se implementa despues: F111 favoritos/chips, F112 paleta contextual con feature flag.' },
  { name: 'F109 Reportes canonicos', current: 'fallback F109', latest: 'Evidencia siguiente', status: 'current', description: 'Reportes queda en dropdown principal con memoria IA, PDF, CNSNS, dashboards, costos, checklist, reporte anual y puente a Evidence Pack.' },
  { name: 'F110 Evidencia canonica', current: 'fallback F110', latest: 'Integraciones siguiente', status: 'current', description: 'Evidencia queda en dropdown principal con Evidence Pack, RAG deep dive, biblioteca, bibliografia, auditoria, logs, especificaciones y revision IA.' },
  { name: 'F111 Acceso Rapido', current: 'favoritos + chips', latest: 'F112 paleta contextual', status: 'current', description: 'Se agregan favoritos y chips de estado como capa adicional. Persistencia de favoritos y sugerencias por seleccion quedan para F112.' },
  { name: 'F112 Acceso Rapido + Mini CAD', current: 'persistente/inteligente', latest: 'F113 perfiles DX/TX/NM/CY', status: 'current', description: 'Favoritos persistentes, chips inteligentes y mini CAD quedan activos. DX/TX/NM/CY siguen como launchers hasta validar smoke.' },
  { name: 'F113 Perfiles DX/TX/NM/CY', current: 'perfil activo persistente', latest: 'F114 deduplicar barra superior', status: 'current', description: 'DX/TX/NM/CY dejan de ser solo launchers: seleccionan perfil activo por modalidad y conservan fallback CategoryToolsDialog.' },
  { name: 'F114 Barra superior deduplicada', current: 'legacy duplicado oculto', latest: 'F115 smoke visual total', status: 'current', description: 'Se ocultan los triggers legacy duplicados: Calcular, Fisica, Med. Nuclear, Normativa, Reportes y Herramientas. Archivo y Eficiencia permanecen visibles.' },
  { name: 'F115 Smoke visual menus', current: 'smoke runtime', latest: 'F116 decision Archivo/Eficiencia', status: 'current', description: 'Se valida en navegador que la barra visible contenga canónicos, perfiles DX/TX/NM/CY y solo Archivo/Eficiencia como legacy visible.' },
  { name: 'F116 Consolidacion utilidades', current: 'Archivo unico legacy', latest: 'F117 perfiles a Memoria IA', status: 'current', description: 'Archivo queda como unica utilidad superior visible. Eficiencia pasa a Integraciones con sus herramientas de performance, auditoria y agentes.' },
  { name: 'F117 Perfiles a documentos', current: 'Memoria/Reporte/Evidencia', latest: 'F118 auto-preseleccion opcional', status: 'current', description: 'El perfil activo DX/TX/NM/CY alimenta defaults de Memoria IA, PDF Report y Evidence Pack sin imponer calculos ni equipo.' },
  { name: 'F118 Preseleccion confirmada', current: 'botones aplicar', latest: 'F119 smoke por perfil', status: 'current', description: 'Memoria IA, Reporte PDF y Evidence Pack pueden aplicar sugerencias del perfil activo solo con confirmacion explicita.' },
  { name: 'F119 Smoke por perfil', current: 'matriz DX/TX/NM/CY', latest: 'F120 smoke runtime', status: 'current', description: 'La matriz valida que cada perfil conecte Memoria IA, Reporte PDF y Evidence Pack sin autoaplicar cambios regulatorios o de equipo.' },
  { name: 'F120 Smoke runtime perfiles', current: 'Playwright + screenshots', latest: 'F121 checklist release', status: 'current', description: 'Se seleccionan DX/TX/NM/CY en navegador y se abren Memoria IA, PDF Report y Evidence Pack para verificar sugerencias visibles sin autoaplicar.' },
  { name: 'F121 Impacto estructural blindaje', current: 'modelo materiales', latest: 'F122 overlay canvas', status: 'current', description: 'Se modelan materiales de blindaje por peso, costo, rapidez, constructibilidad y necesidad de revision estructural para conectar seguridad radiologica con obra.' },
  { name: 'F122 Overlay estructural canvas', current: 'chips riesgo/carga', latest: 'F123 editor materiales', status: 'current', description: 'El canvas resume kg/m2, kg/ml, masa total, revision estructural y fichas de proveedor requeridas para cada barrera del plano.' },
  { name: 'F123 Matriz decision materiales', current: 'comparador obra/estructura', latest: 'F124 aplicar a barrera', status: 'current', description: 'El comparador de materiales agrega ranking por peso, costo relativo, rapidez de obra, revision estructural y ficha tecnica requerida.' },
  { name: 'F124 Toolbox materiales', current: 'comparador canonico', latest: 'subherramientas trazables', status: 'current', description: 'Se elimina el montaje duplicado materialComparison/LeadFree y se conserva lead-free, propiedades, costos y optimizadores como subherramientas del flujo de decision.' },
  { name: 'F125 Gate calculo-memoria', current: 'contrato por resultado', latest: 'F126 release evidence hardening', status: 'current', description: 'Memoria IA, Evidence Pack y PDF reportan formula, norma, inputs, outputs, cita, evidencia y estado QA por cada resultado disponible.' },
  { name: 'F126 Evidencia release', current: 'ledger endurecido', latest: 'F127 release candidate smoke', status: 'current', description: 'El Evidence Pack marca como listo solo lo que tiene claimId, documentId, pagina/seccion, hash y estado reviewed/verified.' },
  { name: 'F127 CYPECAD + DB sin Docker', current: 'brechas documentadas', latest: 'MySQL Windows Service recomendado', status: 'current', description: 'Se revisa CYPECAD contra RadShield: datos generales, plantas, cargas, isovalores, mediciones, IFC/DWG y listados. DB sin Docker prioriza MySQL 8 directo en Windows.' },
  { name: 'F128 MySQL Windows', current: 'TCP OK', latest: 'auth OK', status: 'current', description: 'La base responde en puerto 3306 y el usuario de DATABASE_URL autentica correctamente.' },
  { name: 'F129 Seed documental DB', current: 'manifest dry-run', latest: 'canonical IDs + OCR blockers', status: 'current', description: 'Queda listo el manifiesto de seed documental para cuando MySQL Windows este activo, evitando reingestar duplicados NCRP/IAEA.' },
  { name: 'F130 DB live release', current: 'ready', latest: 'seed live validado', status: 'current', description: 'Ejecuta grants, migraciones, seed y validacion DB real con evidencia de release.' },
  { name: 'F131 Full-stack live smoke', current: 'ready', latest: 'API + frontend con backend', status: 'current', description: 'Valida DB live, health del backend, contratos tRPC protegidos y build Vite con VITE_ENABLE_BACKEND=true.' },
  { name: 'F132 RC persistence smoke', current: 'ready', latest: 'persistencia RC validada', status: 'current', description: 'Inserta y relee proyecto, calculo, memoria, zona controlada, export de evidencia y auditoria en MySQL real.' },
  { name: 'F133 API authenticated smoke', current: 'ready', latest: 'API autenticada validada', status: 'current', description: 'Usa cookie kimi_sid firmada para validar auth.me, routers tRPC, ownership y persistencia DB desde la API.' },
  { name: 'F134 Browser RC smoke', current: 'ready', latest: 'UI release candidate validada', status: 'current', description: 'Playwright abre el build real, valida canvas, menus canonicos y tarjetas F131-F133/F134 del Update Center con captura de evidencia.' },
  { name: 'F135 Release candidate package', current: 'ready', latest: 'paquete RC auditable', status: 'current', description: 'Congela evidencia F130-F134, inventario de build y checklist de cutover; deploy publico queda separado hasta confirmar hosting, secretos y backup DB.' },
  { name: 'F136 Production deploy rehearsal', current: 'ready', latest: 'ensayo local productivo OK', status: 'current', description: 'Sirve el paquete F135 desde dist empaquetado, valida artefactos/fallback SPA y captura smoke Chromium; deploy publico sigue condicionado a hosting, secretos y backup DB.' },
  { name: 'F137 Production cutover checklist', current: 'ready', latest: 'GO controlado / NO-GO publico', status: 'current', description: 'Acepta F130-F136 como base de release, pero bloquea lanzamiento publico hasta smoke de URL final, secretos de host y backup/restore de MySQL.' },
  { name: 'F138 Material RAG + Robot', current: 'draft indexado', latest: 'materiales + estructura avanzada', status: 'current', description: 'Prepara PDFs de tabiques TM NIPOLL/CONTUPLEX como evidencia RAG y agrega brechas Autodesk Robot: FEM, cargas por secuencia, API estructural y roundtrip BIM.' },
  { name: 'F139 Material citation/OCR audit', current: 'DB validada + OCR cerrado', latest: 'citas/hashes/duplicados', status: 'current', description: 'Valida chunks F138 en DB, revisa page refs, hashes, duplicados y conserva la politica de evidencia de fabricante/laboratorio.' },
  { name: 'F141 Material OCR recovery', current: 'implementado', latest: 'bloqueos OCR cerrados', status: 'current', description: 'Recupera los dos PDFs de materiales, actualiza RAG/DB y deja advertencia parcial para paginas sin texto de ScanPRO.' },
  { name: 'F141 Canvas profesional', current: 'implementado', latest: 'CAD + materiales + estructura', status: 'current', description: 'Agrega score F141, chip Material RAG, advertencia OCR parcial y estado CAD/materiales/overlay/acceso rapido en el canvas.' },
  { name: 'F142 Memoria IA materiales', current: 'implementado', latest: 'citas materiales', status: 'current', description: 'La Memoria IA incorpora evidencia de materiales TM NIPOLL/CONTUPLEX con politica de revision antes de usar constantes de calculo.' },
  { name: 'F143 Ingesta ZUMAYA DB', current: 'implementado', latest: 'documentos f143-*', status: 'current', description: 'Agrega NCRP-144, NCRP-49, IAEA SRS-47, memorias Gamma Knife/AL/Braqui y guia Elekta Esprit a RAG/DB.' },
  { name: 'F144 Gobierno de fuentes', current: 'implementado', latest: 'fuente canonica + perfiles MA', status: 'current', description: 'Ordena normas, memorias previas, guias de fabricante y evidencia de materiales; integra perfiles LINAC/Gamma Knife en Memoria IA sin cambiar formulas silenciosamente.' },
  { name: 'F145 Canvas CAD profesional', current: 'implementado', latest: 'grips/lasso/snap interseccion', status: 'current', description: 'Completa la capa CAD-like: grips, cotas exportables, snap avanzado, seleccion multiple/lasso, hover e inputs inline por sidebar.' },
  { name: 'F148 Perfil de Memoria IA', current: 'implementado', latest: 'selector por modalidad', status: 'current', description: 'Permite escoger ruta LINAC, Gamma Knife, Braqui Co-60 o Ciclotron antes de exportar la memoria analitica.' },
  { name: 'Archivo', current: 'closed', latest: 'Project I/O validated', status: 'current', description: 'Nuevo/Abrir/Guardar, importacion CSV/DXF/STEP, exportacion CSV/PDF/CNSNS, compartir, especificaciones, auditoria, logs, glosario y acerca quedan integrados al frontend. DWG continua como conversion externa a DXF.' },
  { name: 'Diseno', current: '3D/CAD/layout mixed', latest: 'Floorplan + CAD/BIM', status: 'update', description: 'Group Smart Rooms, controlled zone, DWG conversion guidance, Medical 3D, Revit/IFC, point cloud after parity smoke.' },
  { name: 'Calcular', current: 'modality buttons', latest: 'calculation families', status: 'update', description: 'Group primary, secondary, leakage, scatter, neutron, skyshine, floor/ceiling and quick barrier after parity smoke.' },
  { name: 'Normativa', current: 'documents + validation', latest: 'standards workspace', status: 'update', description: 'Group NCRP, IAEA, AAPM, CNSNS/UAQ, validation suite and citation ledger after parity smoke.' },
  { name: 'IA/RAG', current: 'scattered tools', latest: 'AI evidence workspace', status: 'update', description: 'Create a clear area for RAG ingestion, source review, deep dive, Memoria AI and Evidence Pack after parity smoke.' },
];

const tabs: Array<[TabKey, string, ComponentType<{ className?: string }>]> = [
  ['platform', 'Estado', ShieldCheck],
  ['deps', 'Deps', Package],
  ['regs', 'Normas', BookOpen],
  ['dbai', 'DB/IA', Database],
  ['menus', 'Menus', LayoutGrid],
];

function StatusIcon({ status }: { status: Status }) {
  if (status === 'current') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (status === 'critical' || status === 'blocked') return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <RefreshCw className="w-4 h-4 text-amber-500" />;
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    current: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    update: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
  };
  return <span className={`text-[9px] px-1.5 py-0.5 rounded border ${map[status]}`}>{status.toUpperCase()}</span>;
}

function itemsForTab(tab: TabKey) {
  if (tab === 'platform') return PLATFORM_UPDATES;
  if (tab === 'deps') return DEP_UPDATES;
  if (tab === 'regs') return REG_UPDATES;
  if (tab === 'dbai') return DBAI_UPDATES;
  return MENU_UPDATES;
}

export default function UpdateAppDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>('platform');
  const items = itemsForTab(tab);
  const f94Parity = useMemo(() => buildF94DropdownParitySummary(), []);
  const f95Smoke = useMemo(() => buildF95DropdownSmokeSummary(), []);
  const f105Gate = useMemo(() => buildF105FinalMenuSmokeGate(), []);
  const f106Migration = useMemo(() => buildF106PhysicalMenuMigration(), []);
  const f107Migration = useMemo(() => buildF107ShieldingMenuMigration(), []);
  const f108Plan = useMemo(() => buildF108VerificationQuickAccessPlan(), []);
  const f109Migration = useMemo(() => buildF109ReportsMenuMigration(), []);
  const f110Migration = useMemo(() => buildF110EvidenceMenuMigration(), []);
  const f111QuickAccess = useMemo(() => buildF111QuickAccessImplementation(), []);
  const f112Integration = useMemo(() => buildF112QuickAccessCadIntegration(), []);
  const f113Profiles = useMemo(() => buildF113ModalityProfileImplementation(), []);
  const f114Dedup = useMemo(() => buildF114TopBarDeduplication(), []);
  const f115Smoke = useMemo(() => buildF115VisualMenuSmoke(), []);
  const f116Utility = useMemo(() => buildF116UtilityMenuConsolidation(), []);
  const f117Handoff = useMemo(() => buildF117ImplementationSummary(), []);
  const f118Preselection = useMemo(() => buildF118ProfileAwarePreselectionSummary(), []);
  const f119Smoke = useMemo(() => buildF119ProfileSmokeSummary(), []);
  const f120RuntimeSmoke = useMemo(() => buildF120RuntimeProfileSmokeSummary(), []);
  const f121StructuralImpact = useMemo(() => buildF121StructuralShieldingImpactSummary(), []);
  const f122StructuralOverlay = useMemo(() => buildF122StructuralOverlayPhaseSummary(), []);
  const f123MaterialDecision = useMemo(() => buildF123MaterialDecisionSummary(), []);
  const f124MaterialToolbox = useMemo(() => buildF124MaterialToolboxSummary(), []);
  const f125EvidenceGate = useMemo(() => buildF125CalculationEvidenceGate(undefined, [], []), []);
  const f126ReleaseEvidence = useMemo(() => buildF126ReleaseEvidenceHardening([], []), []);
  const f127CypeDb = useMemo(() => buildF127CypeDbAlternatives(), []);
  const f128MysqlWindows = useMemo(() => buildF128MysqlWindowsValidation(), []);
  const f129DocumentSeed = useMemo(() => buildF129DocumentSeedReadiness(), []);
  const f130DbLive = useMemo(() => buildF130DbLiveRelease('ready'), []);
  const f131FullstackLive = useMemo(() => buildF131FullstackLiveSmoke('ready'), []);
  const f132RcPersistence = useMemo(() => buildF132RcPersistenceSmoke('ready'), []);
  const f133ApiAuthenticated = useMemo(() => buildF133ApiAuthenticatedSmoke('ready'), []);
  const f134BrowserRc = useMemo(() => buildF134BrowserRcSmoke('ready'), []);
  const f135ReleasePackage = useMemo(() => buildF135ReleaseCandidatePackage('ready'), []);
  const f136DeployRehearsal = useMemo(() => buildF136ProductionDeployRehearsal('ready'), []);
  const f137Cutover = useMemo(() => buildF137ProductionCutoverChecklist('ready'), []);
  const f138MaterialRagRobot = useMemo(() => buildF138MaterialRagRobotSummary(), []);
  const f139MaterialAudit = useMemo(() => buildF139MaterialCitationOcrAudit(), []);
  const f141MaterialOcr = useMemo(() => buildF141MaterialOcrRecoverySummary(), []);
  const f141ProfessionalCanvas = useMemo(() => buildF141ProfessionalCanvasSummary(), []);
  const f142MemoriaMaterials = useMemo(() => buildF142MemoriaIaMaterialEvidence(), []);
  const f143ZumayaDocs = useMemo(() => buildF143ZumayaDocumentIngestionSummary(), []);
  const f144SourceGovernance = useMemo(() => buildF144SourceGovernance(), []);
  const f146MaterialAppendix = useMemo(() => buildF146MaterialReportAppendix(), []);
  const f147Medical3D = useMemo(() => buildF147Medical3DInspection(buildMedicalScene({
    id: 'update-app-f147',
    name: 'Update App F147 sample',
    imageUrl: null,
    scale_m_per_pixel: 0.01,
    width_pixels: 700,
    height_pixels: 700,
    barriers: [],
    sources: [],
    occupiedRegions: [],
  }, 'linac')), []);
  const f145CadProfessional = useMemo(() => buildF145CanvasCadProfessionalSummary({}), []);
  const f148MemoryProfiles = useMemo(() => buildF148MemoryProfileSelector(), []);
  const f149NormativeQa = useMemo(() => buildF149NormativeNumericQa(), []);
  const f149bFastradUtility = useMemo(() => buildF149bFastradClinicalUtility(), []);
  const f149cMonteCarloGateway = useMemo(() => buildF149cMonteCarloGateway(), []);
  const f150ReleaseCandidate = useMemo(() => buildF150ReleaseCandidateControlled(), []);
  const f151Prepublish = useMemo(() => buildF151PrepublishHardening(), []);
  const f152Environment = useMemo(() => buildF152ProductionEnvironmentPrep(), []);
  const f153DbBackupRestore = useMemo(() => buildF153DbBackupRestore('ready'), []);
  const f154PublicUrlSmoke = useMemo(() => buildF154PublicUrlSmoke(), []);
  const f155ReleaseDecision = useMemo(() => buildF155ControlledReleaseDecision(), []);
  const f156FinalPackage = useMemo(() => buildF156FinalPackage(), []);
  const f157OperationalClosure = useMemo(() => buildF157OperationalClosure(), []);
  const f158DeployTarget = useMemo(() => buildF158DeployTargetPostSmoke(), []);
  const f159SitesHosting = useMemo(() => buildF159SitesHostingPrep(), []);
  const f163CanvasClosure = useMemo(() => buildF163CanvasClosureSummary(), []);
  const f164ClinicalMap = useMemo(() => buildF164ClinicalProjectMap(), []);
  const f96Migration = useMemo(() => buildF96DropdownMigrationSummary(), []);
  const f97Migration = useMemo(() => buildF97DropdownMigrationSummary(), []);
  const f98Gaps = useMemo(() => summarizeF98ReleaseGaps(), []);
  const allItems = useMemo(() => [...PLATFORM_UPDATES, ...DEP_UPDATES, ...REG_UPDATES, ...DBAI_UPDATES, ...MENU_UPDATES], []);
  const pending = allItems.filter((item) => item.status !== 'current').length;

  return (
    <DialogShell
      title="Centro de Actualizaciones"
      subtitle={`RadShield-MX F73 | ${pending} decisiones o mejoras pendientes`}
      gradientFrom="from-sky-500"
      gradientTo="to-blue-600"
      maxWidth="max-w-3xl"
      onClose={onClose}
    >
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2">
          <div className="text-[9px] text-emerald-700">Build</div>
          <div className="text-xs font-semibold text-emerald-900">OK</div>
        </div>
        <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
          <div className="text-[9px] text-blue-700">Canvas</div>
          <div className="text-xs font-semibold text-blue-900">Smoke OK</div>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-2">
          <div className="text-[9px] text-red-700">DB</div>
          <div className="text-xs font-semibold text-red-900">Diferida</div>
        </div>
        <div className="rounded-md border border-violet-200 bg-violet-50 p-2">
          <div className="text-[9px] text-violet-700">RAG/IA</div>
          <div className="text-xs font-semibold text-violet-900">Roadmap</div>
        </div>
      </div>

      <div data-testid="f94-dropdown-parity-summary" className="rounded-md border border-sky-200 bg-sky-50 p-3 text-[10px] text-sky-900">
        <div className="font-semibold text-sky-950">F94 Dropdown parity</div>
        <div>Gate: {f94Parity.migrationGate}</div>
        <div>Comandos cubiertos: {f94Parity.coveredCommands}/{f94Parity.totalCommands}</div>
        <div>Movimiento fisico ahora: {f94Parity.physicalMoveNow ? 'si' : 'no'}</div>
        <div>Grupos: {f94Parity.stageParity.map((stage) => `${stage.label} ${stage.covered}/${stage.total}`).join(' | ')}</div>
      </div>

      <div data-testid="f95-dropdown-smoke-summary" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F95 Dropdown smoke</div>
        <div>Resultado: {f95Smoke.pass}/{f95Smoke.total} pass | warn {f95Smoke.warn} | fail {f95Smoke.fail}</div>
        <div>Siguiente accion: {f95Smoke.nextAction}</div>
        <div>Movimiento fisico ahora: {f95Smoke.physicalMoveNow ? 'si' : 'no'}</div>
        <div>Orden: {f95Smoke.migrationOrder.join(' -> ')}</div>
      </div>

      <div data-testid="f105-final-menu-smoke-gate" className="rounded-md border border-violet-200 bg-violet-50 p-3 text-[10px] text-violet-900">
        <div className="font-semibold text-violet-950">F105 Final menu smoke gate</div>
        <div>Estado: {f105Gate.status}</div>
        <div>Comandos: {f105Gate.pass}/{f105Gate.totalCommands} pass | warn {f105Gate.warn} | fail {f105Gate.fail}</div>
        <div>Movimiento fisico ahora: {f105Gate.physicalMoveNow ? 'si' : 'no'}</div>
        <div>Flujo: {f105Gate.targetFlow.join(' -> ')}</div>
        <div>{f105Gate.decision}</div>
      </div>

      <div data-testid="f106-physical-menu-migration" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-[10px] text-teal-900">
        <div className="font-semibold text-teal-950">F106 Physical menu migration</div>
        <div>Estado: {f106Migration.status}</div>
        <div>Remocion fisica masiva: {f106Migration.physicalRemovalNow ? 'si' : 'no'}</div>
        <div>Oculto legacy: {f106Migration.hiddenLegacyGroups.join(' | ')}</div>
        <div>Rollback: {f106Migration.labeledRollbackItems.join(' | ')}</div>
        <div>Siguientes grupos: {f106Migration.nextGroups.join(' -> ')}</div>
        <div>{f106Migration.decision}</div>
      </div>

      <div data-testid="f107-shielding-menu-migration" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F107 Blindaje canonico</div>
        <div>Estado: {f107Migration.status}</div>
        <div>Comandos canonicos: {f107Migration.canonicalCommands.length}</div>
        <div>Remocion fisica masiva: {f107Migration.physicalRemovalNow ? 'si' : 'no'}</div>
        <div>Siguiente grupo: {f107Migration.nextGroups[0]}</div>
        <div>Acceso rapido propuesto: {f107Migration.quickAccessAlternatives.map((item) => item.label).join(' | ')}</div>
        <div>{f107Migration.decision}</div>
      </div>

      <div data-testid="f108-verification-quick-access-plan" className="rounded-md border border-blue-200 bg-blue-50 p-3 text-[10px] text-blue-900">
        <div className="font-semibold text-blue-950">F108 Verificacion canonica + Acceso Rapido</div>
        <div>Estado: {f108Plan.status}</div>
        <div>Comandos canonicos: {f108Plan.canonicalCommands.length}</div>
        <div>Acceso Rapido: {f108Plan.quickAccessImplementationPlan.map((item) => `${item.label} (${item.phase})`).join(' | ')}</div>
        <div>Siguiente grupo: {f108Plan.nextGroups[0]}</div>
        <div>{f108Plan.decision}</div>
      </div>

      <div data-testid="f109-reports-menu-migration" className="rounded-md border border-orange-200 bg-orange-50 p-3 text-[10px] text-orange-900">
        <div className="font-semibold text-orange-950">F109 Reportes canonicos</div>
        <div>Estado: {f109Migration.status}</div>
        <div>Comandos canonicos: {f109Migration.canonicalCommands.length}</div>
        <div>Fallbacks: {f109Migration.labeledRollbackItems.join(' | ')}</div>
        <div>Siguiente grupo: {f109Migration.nextGroups[0]}</div>
        <div>{f109Migration.decision}</div>
      </div>

      <div data-testid="f110-evidence-menu-migration" className="rounded-md border border-violet-200 bg-violet-50 p-3 text-[10px] text-violet-900">
        <div className="font-semibold text-violet-950">F110 Evidencia canonica</div>
        <div>Estado: {f110Migration.status}</div>
        <div>Comandos canonicos: {f110Migration.canonicalCommands.length}</div>
        <div>Fallbacks: {f110Migration.labeledRollbackItems.join(' | ')}</div>
        <div>Limite RAG: {f110Migration.ragBoundary}</div>
        <div>Siguiente grupo: {f110Migration.nextGroups[0]}</div>
        <div>{f110Migration.decision}</div>
      </div>

      <div data-testid="f111-quick-access-implementation" className="rounded-md border border-sky-200 bg-sky-50 p-3 text-[10px] text-sky-900">
        <div className="font-semibold text-sky-950">F111 Acceso Rapido</div>
        <div>Estado: {f111QuickAccess.status}</div>
        <div>Favoritos: {f111QuickAccess.favorites.map((item) => item.label).join(' | ')}</div>
        <div>Chips: {f111QuickAccess.statusChips.map((item) => item.label).join(' | ')}</div>
        <div>Superficies preservadas: {f111QuickAccess.preservedSurfaces.join(' | ')}</div>
        <div>F112: {f111QuickAccess.deferredToF112.join(' | ')}</div>
        <div>{f111QuickAccess.decision}</div>
      </div>

      <div data-testid="f112-quick-access-cad-integration" className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-[10px] text-cyan-900">
        <div className="font-semibold text-cyan-950">F112 Acceso Rapido + Mini CAD</div>
        <div>Estado: {f112Integration.status}</div>
        <div>Favoritos persistentes: {f112Integration.persistentFavorites.join(' | ')}</div>
        <div>Chips inteligentes: {f112Integration.smartChips.join(' | ')}</div>
        <div>Mini CAD: {f112Integration.miniCadTools.join(' | ')}</div>
        <div>DX/TX/NM/CY: {f112Integration.dxTxNmCyPolicy}</div>
        <div>{f112Integration.decision}</div>
      </div>

      <div data-testid="f113-modality-profile-implementation" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F113 Perfiles activos DX/TX/NM/CY</div>
        <div>Estado: {f113Profiles.status}</div>
        <div>Default: {f113Profiles.defaultProfile}</div>
        <div>Storage: {f113Profiles.storageKey}</div>
        <div>Perfiles: {f113Profiles.activeProfiles.join(' | ')}</div>
        <div>Preservado: {f113Profiles.preservedSurfaces.join(' | ')}</div>
        <div>Siguiente: {f113Profiles.nextPhase}</div>
        <div>{f113Profiles.decision}</div>
      </div>

      <div data-testid="f114-top-bar-deduplication" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[10px] text-amber-900">
        <div className="font-semibold text-amber-950">F114 Barra superior deduplicada</div>
        <div>Estado: {f114Dedup.status}</div>
        <div>Legacy visible: {f114Dedup.visibleLegacyMenus.join(' | ')}</div>
        <div>Duplicados ocultos: {f114Dedup.hiddenDuplicateMenus.join(' | ')}</div>
        <div>Canonicos: {f114Dedup.canonicalMenus.join(' | ')}</div>
        <div>Fallback: {f114Dedup.preservedFallbackPolicy}</div>
        <div>Siguiente: {f114Dedup.nextPhase}</div>
        <div>{f114Dedup.decision}</div>
      </div>

      <div data-testid="f115-visual-menu-smoke" className="rounded-md border border-lime-200 bg-lime-50 p-3 text-[10px] text-lime-900">
        <div className="font-semibold text-lime-950">F115 Smoke visual de menus</div>
        <div>Estado: {f115Smoke.status}</div>
        <div>Canonicos requeridos: {f115Smoke.requiredCanonicalTriggers.length}</div>
        <div>Perfiles requeridos: {f115Smoke.requiredProfileTriggers.join(' | ')}</div>
        <div>Legacy visible requerido: {f115Smoke.requiredLegacyTriggers.join(' | ')}</div>
        <div>Legacy prohibido visible: {f115Smoke.forbiddenLegacyTriggers.join(' | ')}</div>
        <div>Salida: {f115Smoke.smokeOutput}</div>
        <div>Siguiente: {f115Smoke.nextPhase}</div>
        <div>{f115Smoke.decision}</div>
      </div>

      <div data-testid="f116-utility-menu-consolidation" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-[10px] text-teal-900">
        <div className="font-semibold text-teal-950">F116 Consolidacion de utilidades</div>
        <div>Estado: {f116Utility.status}</div>
        <div>Legacy visible: {f116Utility.visibleLegacyMenus.join(' | ')}</div>
        <div>Integraciones: {f116Utility.movedToIntegrations.join(' | ')}</div>
        <div>Trigger: {f116Utility.canonicalIntegrationsTrigger}</div>
        <div>Siguiente: {f116Utility.nextPhase}</div>
        <div>{f116Utility.decision}</div>
      </div>

      <div data-testid="f117-modality-handoff-summary" className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-[10px] text-cyan-900">
        <div className="font-semibold text-cyan-950">F117 Perfiles a Memoria/Reporte/Evidencia</div>
        <div>Estado: {f117Handoff.status}</div>
        <div>Perfiles: {f117Handoff.profiles.join(' | ')}</div>
        <div>Targets: {f117Handoff.targets.join(' | ')}</div>
        <div>Storage: {f117Handoff.storageKey}</div>
        <div>Siguiente: {f117Handoff.nextPhase}</div>
        <div>{f117Handoff.decision}</div>
      </div>

      <div data-testid="f118-profile-aware-preselection" className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-[10px] text-indigo-900">
        <div className="font-semibold text-indigo-950">F118 Preseleccion confirmada por perfil</div>
        <div>Estado: {f118Preselection.status}</div>
        <div>Targets: {f118Preselection.targets.join(' | ')}</div>
        <div>Controles: {f118Preselection.controls.join(' | ')}</div>
        <div>Politica: {f118Preselection.confirmationPolicy}</div>
        <div>Siguiente: {f118Preselection.nextPhase}</div>
        <div>{f118Preselection.decision}</div>
      </div>

      <div data-testid="f119-profile-smoke-summary" className="rounded-md border border-slate-300 bg-slate-50 p-3 text-[10px] text-slate-900">
        <div className="font-semibold text-slate-950">F119 Smoke por perfil DX/TX/NM/CY</div>
        <div>Estado: {f119Smoke.status}</div>
        <div>Storage: {f119Smoke.storageKey}</div>
        <div>Superficies: {f119Smoke.surfacesChecked.join(' | ')}</div>
        <div>Controles explicitos: {f119Smoke.explicitApplyControls.join(' | ')}</div>
        <div>Perfiles: {f119Smoke.rows.map((row) => `${row.label}:${row.reportTemplate}`).join(' | ')}</div>
        <div>Siguiente: {f119Smoke.nextPhase}</div>
        <div>{f119Smoke.decision}</div>
      </div>

      <div data-testid="f120-runtime-profile-smoke-summary" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F120 Smoke runtime perfiles</div>
        <div>Estado: {f120RuntimeSmoke.status}</div>
        <div>Script: {f120RuntimeSmoke.runtimeScript}</div>
        <div>Perfiles: {f120RuntimeSmoke.profiles.join(' | ')}</div>
        <div>Superficies: {f120RuntimeSmoke.surfaces.join(' | ')}</div>
        <div>Screenshots: {f120RuntimeSmoke.screenshots.length}</div>
        <div>Siguiente: {f120RuntimeSmoke.nextPhase}</div>
        <div>{f120RuntimeSmoke.decision}</div>
      </div>

      <div data-testid="f121-structural-shielding-impact" className="rounded-md border border-orange-200 bg-orange-50 p-3 text-[10px] text-orange-900">
        <div className="font-semibold text-orange-950">F121 Impacto estructural de blindaje</div>
        <div>Estado: {f121StructuralImpact.status}</div>
        <div>Materiales: {f121StructuralImpact.materialCount}</div>
        <div>Workflows: {f121StructuralImpact.workflows.join(' | ')}</div>
        <div>Outputs: {f121StructuralImpact.outputs.join(' | ')}</div>
        <div>Siguiente: {f121StructuralImpact.nextPhase}</div>
        <div>{f121StructuralImpact.decision}</div>
      </div>

      <div data-testid="f122-canvas-structural-overlay" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[10px] text-amber-900">
        <div className="font-semibold text-amber-950">F122 Overlay estructural canvas</div>
        <div>Estado: {f122StructuralOverlay.status}</div>
        <div>Inputs: {f122StructuralOverlay.inputs.join(' | ')}</div>
        <div>Outputs: {f122StructuralOverlay.outputs.join(' | ')}</div>
        <div>Panel: {f122StructuralOverlay.canvasPanel}</div>
        <div>Siguiente: {f122StructuralOverlay.nextPhase}</div>
        <div>{f122StructuralOverlay.decision}</div>
      </div>

      <div data-testid="f123-material-decision-summary" className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-[10px] text-yellow-900">
        <div className="font-semibold text-yellow-950">F123 Matriz decision materiales</div>
        <div>Estado: {f123MaterialDecision.status}</div>
        <div>Filas: {f123MaterialDecision.rowCount}</div>
        <div>Preferido preliminar: {f123MaterialDecision.preferredMaterial}</div>
        <div>Condicionales: {f123MaterialDecision.conditionalCount}</div>
        <div>Superficie: {f123MaterialDecision.surface}</div>
        <div>Siguiente: {f123MaterialDecision.nextPhase}</div>
        <div>{f123MaterialDecision.decision}</div>
      </div>

      <div data-testid="f124-material-toolbox-summary" className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-[10px] text-cyan-900">
        <div className="font-semibold text-cyan-950">F124 Toolbox materiales</div>
        <div>Estado: {f124MaterialToolbox.status}</div>
        <div>Ruta canonica: {f124MaterialToolbox.canonicalDialog}</div>
        <div>Subherramientas: {f124MaterialToolbox.inventory.length}</div>
        <div>Duplicado resuelto: {f124MaterialToolbox.duplicateRemoved}</div>
        <div>Fases previas: {f124MaterialToolbox.phaseReconciliation.map((item) => `${item.phase}:${item.status}`).join(' | ')}</div>
        <div>Deuda registry: {f124MaterialToolbox.registryDebt.length}</div>
        <div>Siguiente: {f124MaterialToolbox.nextPhase}</div>
        <div>{f124MaterialToolbox.decision}</div>
      </div>

      <div data-testid="f125-calculation-evidence-summary" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[10px] text-amber-900">
        <div className="font-semibold text-amber-950">F125 Gate calculo-memoria-evidencia</div>
        <div>Estado: {f125EvidenceGate.status}</div>
        <div>Campos obligatorios: {f125EvidenceGate.requiredFields.join(' | ')}</div>
        <div>Superficies: {f125EvidenceGate.surfaces.join(' | ')}</div>
        <div>Siguiente: {f125EvidenceGate.nextPhase}</div>
        <div>{f125EvidenceGate.decision}</div>
      </div>

      <div data-testid="f126-release-evidence-summary" className="rounded-md border border-lime-200 bg-lime-50 p-3 text-[10px] text-lime-900">
        <div className="font-semibold text-lime-950">F126 Release evidence hardening</div>
        <div>Estado: {f126ReleaseEvidence.status}</div>
        <div>Campos RC: {f126ReleaseEvidence.requiredFields.join(' | ')}</div>
        <div>Ready RC: {f126ReleaseEvidence.readyForReleaseCandidate ? 'si' : 'pendiente'}</div>
        <div>Siguiente: {f126ReleaseEvidence.nextPhase}</div>
        <div>{f126ReleaseEvidence.decision}</div>
      </div>

      <div data-testid="f127-cype-db-alternatives" className="rounded-md border border-sky-200 bg-sky-50 p-3 text-[10px] text-sky-900">
        <div className="font-semibold text-sky-950">F127 CYPECAD + DB alternatives</div>
        <div>Estado: {f127CypeDb.status}</div>
        <div>Brechas CYPECAD: {f127CypeDb.counts.cypeGapCount} | parciales: {f127CypeDb.counts.partial} | externas: {f127CypeDb.counts.externalRequired}</div>
        <div>DB recomendada: {f127CypeDb.recommendedDb.label}</div>
        <div>Siguiente: {f127CypeDb.recommendedNextPhase}</div>
        <div>{f127CypeDb.decision}</div>
      </div>

      <div data-testid="f128-mysql-windows-validation" className="rounded-md border border-red-200 bg-red-50 p-3 text-[10px] text-red-900">
        <div className="font-semibold text-red-950">F128 MySQL Windows validation</div>
        <div>Estado: {f128MysqlWindows.status}</div>
        <div>Target: {f128MysqlWindows.currentTarget}</div>
        <div>TCP: {f128MysqlWindows.tcpReachable ? 'OK' : 'pendiente'} | Auth: {f128MysqlWindows.authOk ? 'OK' : 'bloqueado'}</div>
        <div>Migracion permitida: {f128MysqlWindows.migrationAllowed ? 'si' : 'no'} | Seed permitido: {f128MysqlWindows.seedAllowed ? 'si' : 'no'}</div>
        <div>{f128MysqlWindows.decision}</div>
      </div>

      <div data-testid="f129-document-seed-readiness" className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-[10px] text-indigo-900">
        <div className="font-semibold text-indigo-950">F129 Document seed readiness</div>
        <div>Estado: {f129DocumentSeed.status}</div>
        <div>Modo: {f129DocumentSeed.seedMode}</div>
        <div>Seed-ready: {f129DocumentSeed.totals.seedReady} docs | {f129DocumentSeed.totals.chunksReady} chunks</div>
        <div>OCR pendiente: {f129DocumentSeed.totals.needsOcr} | Fuentes faltantes: {f129DocumentSeed.totals.missingSources}</div>
        <div>Normas: {f129DocumentSeed.canonicalSeedStandards.join(' | ')}</div>
        <div>{f129DocumentSeed.decision}</div>
      </div>

      <div data-testid="f130-db-live-release" className="rounded-md border border-purple-200 bg-purple-50 p-3 text-[10px] text-purple-900">
        <div className="font-semibold text-purple-950">F130 DB live release</div>
        <div>Estado: {f130DbLive.status}</div>
        <div>Target: {f130DbLive.mysqlTarget}</div>
        <div>Tablas esperadas: {f130DbLive.expectedTables.length}</div>
        <div>Politica seed: {f130DbLive.liveSeedPolicy}</div>
        <div>{f130DbLive.decision}</div>
      </div>

      <div data-testid="f131-fullstack-live-smoke" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F131 Full-stack live smoke</div>
        <div>Estado: {f131FullstackLive.status}</div>
        <div>Stack: {f131FullstackLive.stackMode}</div>
        <div>DB: {f131FullstackLive.databaseTarget}</div>
        <div>Frontend: VITE_ENABLE_BACKEND={f131FullstackLive.frontendBackendEnv.VITE_ENABLE_BACKEND}</div>
        <div>Health: {f131FullstackLive.healthEndpoints.join(' | ')}</div>
        <div>Contratos protegidos: {f131FullstackLive.protectedContracts.length}</div>
        <div>Siguiente: {f131FullstackLive.nextPhase}</div>
        <div>{f131FullstackLive.decision}</div>
      </div>

      <div data-testid="f132-rc-persistence-smoke" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-[10px] text-teal-900">
        <div className="font-semibold text-teal-950">F132 RC persistence smoke</div>
        <div>Estado: {f132RcPersistence.status}</div>
        <div>User: {f132RcPersistence.userId}</div>
        <div>Superficies: {f132RcPersistence.surfaces.join(' | ')}</div>
        <div>Evidencia: {f132RcPersistence.evidenceTables.join(' | ')}</div>
        <div>Scope destructivo: {f132RcPersistence.destructiveScope}</div>
        <div>Siguiente: {f132RcPersistence.nextPhase}</div>
        <div>{f132RcPersistence.decision}</div>
      </div>

      <div data-testid="f133-api-authenticated-smoke" className="rounded-md border border-blue-200 bg-blue-50 p-3 text-[10px] text-blue-900">
        <div className="font-semibold text-blue-950">F133 API authenticated smoke</div>
        <div>Estado: {f133ApiAuthenticated.status}</div>
        <div>Auth: {f133ApiAuthenticated.authMode}</div>
        <div>User: {f133ApiAuthenticated.userId}</div>
        <div>API: {f133ApiAuthenticated.apiSurfaces.join(' | ')}</div>
        <div>DB readback: {f133ApiAuthenticated.dbReadback.join(' | ')}</div>
        <div>Seguridad: {f133ApiAuthenticated.securityChecks.join(' | ')}</div>
        <div>Siguiente: {f133ApiAuthenticated.nextPhase}</div>
        <div>{f133ApiAuthenticated.decision}</div>
      </div>

      <div data-testid="f134-browser-rc-smoke" className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-[10px] text-cyan-900">
        <div className="font-semibold text-cyan-950">F134 Browser RC smoke</div>
        <div>Estado: {f134BrowserRc.status}</div>
        <div>Browser: {f134BrowserRc.browserSurface}</div>
        <div>Vistas: {f134BrowserRc.requiredViews.join(' | ')}</div>
        <div>Evidencia: {f134BrowserRc.evidenceOutputs.join(' | ')}</div>
        <div>Siguiente: {f134BrowserRc.nextPhase}</div>
        <div>{f134BrowserRc.decision}</div>
      </div>

      <div data-testid="f135-release-candidate-package" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F135 Release candidate package</div>
        <div>Estado: {f135ReleasePackage.status}</div>
        <div>Paquete: {f135ReleasePackage.packageDirectory}</div>
        <div>Evidencia: {f135ReleasePackage.requiredEvidence.join(' | ')}</div>
        <div>Deploy: {f135ReleasePackage.deployDecision}</div>
        <div>Bloqueos produccion: {f135ReleasePackage.productionBlockers.join(' | ')}</div>
        <div>Siguiente: {f135ReleasePackage.nextPhase}</div>
        <div>{f135ReleasePackage.decision}</div>
      </div>

      <div data-testid="f136-production-deploy-rehearsal" className="rounded-md border border-sky-200 bg-sky-50 p-3 text-[10px] text-sky-900">
        <div className="font-semibold text-sky-950">F136 Production deploy rehearsal</div>
        <div>Estado: {f136DeployRehearsal.status}</div>
        <div>Modo: {f136DeployRehearsal.rehearsalMode}</div>
        <div>Paquete: {f136DeployRehearsal.packageSource}</div>
        <div>Validado: {f136DeployRehearsal.validatedSurfaces.join(' | ')}</div>
        <div>Deploy publico: {f136DeployRehearsal.publicDeployDecision}</div>
        <div>Siguiente: {f136DeployRehearsal.nextPhase}</div>
        <div>{f136DeployRehearsal.decision}</div>
      </div>

      <div data-testid="f137-production-cutover-checklist" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-900">
        <div className="font-semibold text-rose-950">F137 Production cutover checklist</div>
        <div>Estado: {f137Cutover.status}</div>
        <div>Base release: {f137Cutover.releaseBasis.join(' | ')}</div>
        <div>Gates: {f137Cutover.cutoverGates.join(' | ')}</div>
        <div>Go/No-Go: {f137Cutover.goNoGoDecision}</div>
        <div>Bloqueadores produccion: {f137Cutover.productionBlockers.join(' | ')}</div>
        <div>Rollback: {f137Cutover.rollbackPlan.join(' | ')}</div>
        <div>Siguiente: {f137Cutover.nextPhase}</div>
        <div>{f137Cutover.decision}</div>
      </div>

      <div data-testid="f138-material-rag-robot" className="rounded-md border border-stone-300 bg-stone-50 p-3 text-[10px] text-stone-900">
        <div className="font-semibold text-stone-950">F138 Material RAG + Robot</div>
        <div>Estado: {f138MaterialRagRobot.status}</div>
        <div>Docs materiales: {f138MaterialRagRobot.materialDocuments.length}</div>
        <div>Robot: {f138MaterialRagRobot.robotOpportunities.map((item) => `${item.label} (${item.priority})`).join(' | ')}</div>
        <div>Mejoras app: {f138MaterialRagRobot.appImprovements.join(' | ')}</div>
        <div>Fases siguientes: {f138MaterialRagRobot.phasePlan.join(' | ')}</div>
        <div>Deploy: {f138MaterialRagRobot.deployDecision}</div>
        <div>{f138MaterialRagRobot.decision}</div>
      </div>

      <div data-testid="f139-material-citation-ocr-audit" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-[10px] text-amber-900">
        <div className="font-semibold text-amber-950">F139 Material citation/OCR audit</div>
        <div>Estado: {f139MaterialAudit.status}</div>
        <div>DB: {f139MaterialAudit.databaseChecks.join(' | ')}</div>
        <div>Citas: {f139MaterialAudit.citationChecks.join(' | ')}</div>
        <div>Duplicados: {f139MaterialAudit.duplicateChecks.join(' | ')}</div>
        <div>OCR pendiente: {f139MaterialAudit.ocrPending.length ? f139MaterialAudit.ocrPending.map((item) => `${item.id} (${item.pages}p)`).join(' | ') : 'ninguno'}</div>
        <div>Resubir: {f139MaterialAudit.resubmissionRequest.join(' | ')}</div>
        <div>Siguiente: {f139MaterialAudit.nextPhase}</div>
        <div>{f139MaterialAudit.decision}</div>
      </div>

      <div data-testid="f141-material-ocr-recovery" className="rounded-md border border-green-300 bg-green-50 p-3 text-[10px] text-green-900">
        <div className="font-semibold text-green-950">F141 Material OCR recovery</div>
        <div>Estado: {f141MaterialOcr.status}</div>
        <div>Docs recuperados: {f141MaterialOcr.recoveredDocuments.map((item) => `${item.id}:${item.status}`).join(' | ')}</div>
        <div>Politica DB: {f141MaterialOcr.dbPolicy.join(' | ')}</div>
        <div>Canvas: {f141MaterialOcr.canvasUxActions.join(' | ')}</div>
        <div>Memoria IA: {f141MaterialOcr.memoriaIaActions.join(' | ')}</div>
        <div>Siguiente: {f141MaterialOcr.nextPhase}</div>
        <div>{f141MaterialOcr.decision}</div>
      </div>

      <div data-testid="f141-professional-canvas-summary" className="rounded-md border border-violet-300 bg-violet-50 p-3 text-[10px] text-violet-900">
        <div className="font-semibold text-violet-950">F141 Canvas profesional</div>
        <div>Estado: {f141ProfessionalCanvas.status}</div>
        <div>Score: {f141ProfessionalCanvas.score}%</div>
        <div>CAD: {f141ProfessionalCanvas.cadEditing.map((item) => `${item.label}:${item.status}`).join(' | ')}</div>
        <div>Materiales: {f141ProfessionalCanvas.materialPanel.map((item) => `${item.label}:${item.status}`).join(' | ')}</div>
        <div>Overlay: {f141ProfessionalCanvas.structuralOverlay.map((item) => `${item.label}:${item.status}`).join(' | ')}</div>
        <div>Pendientes: {f141ProfessionalCanvas.nextImprovements.join(' | ')}</div>
      </div>

      <div data-testid="f142-memoria-material-evidence" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F142 Memoria IA materiales</div>
        <div>Estado: {f142MemoriaMaterials.status}</div>
        <div>Fuentes: {f142MemoriaMaterials.citations.map((item) => `${item.source}:${item.chunks}`).join(' | ')}</div>
        <div>Secciones: {f142MemoriaMaterials.requiredMemorySections.join(' | ')}</div>
        <div>Pendientes docs: {f142MemoriaMaterials.pendingDocuments.join(' | ')}</div>
        <div>{f142MemoriaMaterials.decision}</div>
      </div>

      <div data-testid="f143-zumaya-document-ingestion" className="rounded-md border border-blue-300 bg-blue-50 p-3 text-[10px] text-blue-900">
        <div className="font-semibold text-blue-950">F143 ZUMAYA document ingestion</div>
        <div>Estado: {f143ZumayaDocs.status}</div>
        <div>Documentos: {f143ZumayaDocs.documents.map((item) => `${item.standard}:${item.status}`).join(' | ')}</div>
        <div>Resueltos: {f143ZumayaDocs.resolvedBlockers.join(' | ')}</div>
        <div>Brechas: {f143ZumayaDocs.remainingDocumentGaps.join(' | ')}</div>
        <div>{f143ZumayaDocs.decision}</div>
      </div>

      <div data-testid="f144-source-governance" className="rounded-md border border-indigo-300 bg-indigo-50 p-3 text-[10px] text-indigo-900">
        <div className="font-semibold text-indigo-950">F144 Source governance</div>
        <div>Estado: {f144SourceGovernance.status}</div>
        <div>Jerarquia: {f144SourceGovernance.canonicalHierarchy.slice(0, 3).join(' | ')}</div>
        <div>Perfiles: {f144SourceGovernance.memoryProfiles.map((item) => item.modality).join(' | ')}</div>
        <div>Metodologia: {f144SourceGovernance.methodologyReview.join(' | ')}</div>
        <div>Pendientes: {f144SourceGovernance.remainingImprovements.join(' | ')}</div>
        <div>{f144SourceGovernance.releaseDecision}</div>
      </div>

      <div data-testid="f145-canvas-cad-professional" className="rounded-md border border-cyan-300 bg-cyan-50 p-3 text-[10px] text-cyan-900">
        <div className="font-semibold text-cyan-950">F145 Canvas CAD profesional</div>
        <div>Estado: {f145CadProfessional.status}</div>
        <div>Score base: {f145CadProfessional.score}%</div>
        <div>Capacidades: {f145CadProfessional.capabilities.map((item) => `${item.label}:${item.status}`).join(' | ')}</div>
        <div>Uso: {f145CadProfessional.operationHints.join(' | ')}</div>
        <div>Gates release: {f145CadProfessional.releaseGates.join(' | ')}</div>
      </div>

      <div data-testid="f146-material-report-appendix-update" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-[10px] text-amber-900">
        <div className="font-semibold text-amber-950">F146 Anexo materiales en reportes</div>
        <div>Estado: {f146MaterialAppendix.status}</div>
        <div>Secciones: {f146MaterialAppendix.requiredReportSections.join(' | ')}</div>
        <div>Warnings: {f146MaterialAppendix.exportWarnings.join(' | ')}</div>
        <div>{f146MaterialAppendix.decision}</div>
      </div>

      <div data-testid="f147-medical-3d-update" className="rounded-md border border-sky-300 bg-sky-50 p-3 text-[10px] text-sky-900">
        <div className="font-semibold text-sky-950">F147 Inspeccion 3D medica</div>
        <div>Estado: {f147Medical3D.status}</div>
        <div>Recorrido: {f147Medical3D.walkthroughMode}</div>
        <div>Estaciones: {f147Medical3D.stations.map((item) => item.label).join(' | ')}</div>
        <div>Capas: {f147Medical3D.visualLayers.join(' | ')}</div>
        <div>Exports: {f147Medical3D.exportArtifacts.join(' | ')}</div>
      </div>

      <div data-testid="f148-memory-profile-update" className="rounded-md border border-violet-300 bg-violet-50 p-3 text-[10px] text-violet-900">
        <div className="font-semibold text-violet-950">F148 Perfil de Memoria IA</div>
        <div>Estado: {f148MemoryProfiles.status}</div>
        <div>Default: {f148MemoryProfiles.defaultKey}</div>
        <div>Perfiles: {f148MemoryProfiles.options.map((item) => `${item.key}:${item.label}`).join(' | ')}</div>
        <div>Politica: {f148MemoryProfiles.selectionPolicy.join(' | ')}</div>
        <div>{f148MemoryProfiles.decision}</div>
      </div>

      <div data-testid="f149-normative-numeric-qa-update" className="rounded-md border border-rose-300 bg-rose-50 p-3 text-[10px] text-rose-900">
        <div className="font-semibold text-rose-950">F149 QA numerico normativo</div>
        <div>Estado: {f149NormativeQa.status}</div>
        <div>Suite NCRP: {f149NormativeQa.canonicalSuite.passed}/{f149NormativeQa.canonicalSuite.total} | max diff {f149NormativeQa.canonicalSuite.maxDiffPercent}%</div>
        <div>Casos F149: {f149NormativeQa.totals.passed}/{f149NormativeQa.totals.total} pass | review {f149NormativeQa.totals.review} | fail {f149NormativeQa.totals.failed}</div>
        <div>Bloqueos release: {f149NormativeQa.totals.releaseBlocking}</div>
        <div>Familias: {Object.entries(f149NormativeQa.familySummary).map(([family, row]) => `${family}:${row.passed}/${row.total}`).join(' | ')}</div>
        <div>{f149NormativeQa.decision}</div>
      </div>

      <div data-testid="f149b-fastrad-export-smoke-update" className="rounded-md border border-slate-300 bg-slate-50 p-3 text-[10px] text-slate-900">
        <div className="font-semibold text-slate-950">F149b FASTRAD + smoke export</div>
        <div>Estado: {f149bFastradUtility.status}</div>
        <div>Fuente: {f149bFastradUtility.sourceUrl}</div>
        <div>Adoptar ahora: {f149bFastradUtility.adoptedNow.join(' | ')}</div>
        <div>Diferir: {f149bFastradUtility.deferred.join(' | ')}</div>
        <div>Externo: {f149bFastradUtility.rejectedForRadShield.join(' | ')}</div>
        <div>Smoke: {f149bFastradUtility.exportSmoke.surfaces.map((surface) => `${surface.surface}:${surface.status}`).join(' | ')}</div>
        <div>{f149bFastradUtility.decision}</div>
      </div>

      <div data-testid="f149c-monte-carlo-gateway-update" className="rounded-md border border-blue-300 bg-blue-50 p-3 text-[10px] text-blue-900">
        <div className="font-semibold text-blue-950">F149c Monte Carlo Gateway</div>
        <div>Estado: {f149cMonteCarloGateway.status}</div>
        <div>Schema: {f149cMonteCarloGateway.exportPackage.packageSchema}</div>
        <div>Motores: {f149cMonteCarloGateway.engines.map((engine) => `${engine.label}:${engine.status}`).join(' | ')}</div>
        <div>Artefactos: {f149cMonteCarloGateway.exportPackage.artifacts.map((artifact) => artifact.path).join(' | ')}</div>
        <div>Gates: {f149cMonteCarloGateway.validationGates.map((gate) => `${gate.id}:${gate.status}`).join(' | ')}</div>
        <div>Decision: {f149cMonteCarloGateway.decision}</div>
      </div>

      <div data-testid="f150-release-candidate-controlled" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F150 Release candidate controlado</div>
        <div>Estado: {f150ReleaseCandidate.status}</div>
        <div>Decision: {f150ReleaseCandidate.decision}</div>
        <div>Go/No-Go: {f150ReleaseCandidate.goNoGo}</div>
        <div>Gates: {f150ReleaseCandidate.gates.map((gate) => `${gate.id}:${gate.status}`).join(' | ')}</div>
        <div>Bloqueadores publicos: {f150ReleaseCandidate.productionBlockers.join(' | ')}</div>
        <div>{f150ReleaseCandidate.finalStatement}</div>
      </div>

      <div data-testid="f151-prepublish-hardening" className="rounded-md border border-orange-300 bg-orange-50 p-3 text-[10px] text-orange-900">
        <div className="font-semibold text-orange-950">F151 Prepublicacion</div>
        <div>Estado: {f151Prepublish.status}</div>
        <div>Go/No-Go: {f151Prepublish.goNoGo}</div>
        <div>Gates: {f151Prepublish.gates.map((gate) => `${gate.id}:${gate.status}`).join(' | ')}</div>
        <div>Scripts: {f151Prepublish.packageScripts.join(' | ')}</div>
        <div>{f151Prepublish.finalStatement}</div>
      </div>

      <div data-testid="f152-production-environment-prep" className="rounded-md border border-cyan-300 bg-cyan-50 p-3 text-[10px] text-cyan-900">
        <div className="font-semibold text-cyan-950">F152 Ambiente real</div>
        <div>Estado: {f152Environment.status}</div>
        <div>Go/No-Go: {f152Environment.goNoGo}</div>
        <div>Runtime: {f152Environment.recommendedRuntime}</div>
        <div>Gates: {f152Environment.gates.map((gate) => `${gate.id}:${gate.status}`).join(' | ')}</div>
        <div>Siguientes: {f152Environment.nextPhases.join(' | ')}</div>
        <div>{f152Environment.finalStatement}</div>
      </div>

      <div data-testid="f153-db-backup-restore" className="rounded-md border border-lime-300 bg-lime-50 p-3 text-[10px] text-lime-900">
        <div className="font-semibold text-lime-950">F153 Backup/restore DB</div>
        <div>Estado: {f153DbBackupRestore.status}</div>
        <div>Flags: {f153DbBackupRestore.requiredFlags.join(' | ')}</div>
        <div>Artefactos: {f153DbBackupRestore.expectedArtifacts.join(' | ')}</div>
        <div>Politica: {f153DbBackupRestore.safetyPolicy.join(' | ')}</div>
        <div>{f153DbBackupRestore.finalStatement}</div>
      </div>

      <div data-testid="f154-public-url-smoke" className="rounded-md border border-violet-300 bg-violet-50 p-3 text-[10px] text-violet-900">
        <div className="font-semibold text-violet-950">F154 Smoke URL final</div>
        <div>Estado: {f154PublicUrlSmoke.status}</div>
        <div>Requisitos: {f154PublicUrlSmoke.requiredInputs.join(' | ')}</div>
        <div>Superficies: {f154PublicUrlSmoke.smokeSurfaces.join(' | ')}</div>
        <div>Comando: {f154PublicUrlSmoke.command}</div>
        <div>{f154PublicUrlSmoke.finalStatement}</div>
      </div>

      <div data-testid="f155-controlled-release-decision" className="rounded-md border border-rose-300 bg-rose-50 p-3 text-[10px] text-rose-900">
        <div className="font-semibold text-rose-950">F155 Decision release controlado</div>
        <div>Estado: {f155ReleaseDecision.status}</div>
        <div>Modos: {f155ReleaseDecision.decisionModes.join(' | ')}</div>
        <div>Evidencia: {f155ReleaseDecision.requiredEvidence.join(' | ')}</div>
        <div>Reglas: {f155ReleaseDecision.blockingRules.join(' | ')}</div>
        <div>{f155ReleaseDecision.finalStatement}</div>
      </div>

      <div data-testid="f156-final-package" className="rounded-md border border-slate-300 bg-slate-50 p-3 text-[10px] text-slate-800">
        <div className="font-semibold text-slate-950">F156 Paquete final condicionado</div>
        <div>Estado: {f156FinalPackage.status}</div>
        <div>Contenido: {f156FinalPackage.packageContents.join(' | ')}</div>
        <div>Modos: {f156FinalPackage.deliveryModes.join(' | ')}</div>
        <div>Gates: {f156FinalPackage.hardGates.join(' | ')}</div>
        <div>{f156FinalPackage.finalStatement}</div>
      </div>

      <div data-testid="f157-operational-closure" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F157 Cierre operativo</div>
        <div>Estado: {f157OperationalClosure.status}</div>
        <div>Alcance: {f157OperationalClosure.closureScope.join(' | ')}</div>
        <div>Evidencia: {f157OperationalClosure.releaseEvidence.join(' | ')}</div>
        <div>Checklist: {f157OperationalClosure.operatingChecklist.join(' | ')}</div>
        <div>{f157OperationalClosure.publicUrlReminder}</div>
        <div>{f157OperationalClosure.finalStatement}</div>
      </div>

      <div data-testid="f158-deploy-target-post-smoke" className="rounded-md border border-cyan-300 bg-cyan-50 p-3 text-[10px] text-cyan-900">
        <div className="font-semibold text-cyan-950">F158 Deploy target + post-smoke</div>
        <div>Estado: {f158DeployTarget.status}</div>
        <div>Targets: {f158DeployTarget.deployTargets.join(' | ')}</div>
        <div>Evidencia: {f158DeployTarget.postDeployEvidence.join(' | ')}</div>
        <div>Bloqueos externos: {f158DeployTarget.externalDeployBlockers.join(' | ')}</div>
        <div>{f158DeployTarget.finalStatement}</div>
      </div>

      <div data-testid="f159-sites-hosting-prep" className="rounded-md border border-blue-300 bg-blue-50 p-3 text-[10px] text-blue-900">
        <div className="font-semibold text-blue-950">F159 Sites hosting prep</div>
        <div>Estado: {f159SitesHosting.status}</div>
        <div>Preparado: {f159SitesHosting.preparedItems.join(' | ')}</div>
        <div>Bloqueos remotos: {f159SitesHosting.remoteBlockers.join(' | ')}</div>
        <div>Siguientes: {f159SitesHosting.requiredNextSteps.join(' | ')}</div>
        <div>{f159SitesHosting.finalStatement}</div>
      </div>

      <div data-testid="f163-canvas-release-closure" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-[10px] text-emerald-900">
        <div className="font-semibold text-emerald-950">F163 Canvas/floorplan cierre</div>
        <div>Estado: {f163CanvasClosure.status}</div>
        <div>Score: {f163CanvasClosure.score}%</div>
        <div>RS parity: {f163CanvasClosure.references.map((item) => `${item.id}:${item.adoption}`).join(' | ')}</div>
        <div>Gates: {f163CanvasClosure.acceptanceGates.join(' | ')}</div>
        <div>Backlog: {f163CanvasClosure.remainingBacklog.slice(0, 3).join(' | ')}</div>
        <div>{f163CanvasClosure.decision}</div>
      </div>

      <div data-testid="f164-clinical-project-map-update" className="rounded-md border border-teal-300 bg-teal-50 p-3 text-[10px] text-teal-900">
        <div className="font-semibold text-teal-950">F164 Clinical project map</div>
        <div>Estado: {f164ClinicalMap.status}</div>
        <div>Score: {f164ClinicalMap.score}%</div>
        <div>Inspiracion: {f164ClinicalMap.sourceInspiration.name}</div>
        <div>Dominios: {f164ClinicalMap.nodes.filter((node) => node.ready).length}/{f164ClinicalMap.nodes.length}</div>
        <div>Exports: {f164ClinicalMap.exportTargets.join(' | ')}</div>
        <div>F165 outputs: {f164ClinicalMap.visualExports.map((item) => item.label).join(' | ')}</div>
        <div>Flujos: {f164ClinicalMap.flowRoutes.map((route) => `${route.routeType}:${route.ready ? 'ready' : 'draft'}`).join(' | ')}</div>
        <div>Sync: {f164ClinicalMap.syncTargets.map((target) => target.target).join(' | ')}</div>
        <div>Warnings: {f164ClinicalMap.warnings.join(' | ') || 'ninguno'}</div>
        <div>{f164ClinicalMap.decision}</div>
      </div>

      <div data-testid="f161-f165-predeploy-manuals" className="rounded-md border border-cyan-300 bg-cyan-50 p-3 text-[10px] text-cyan-950">
        <div className="font-semibold">F161/F165 predeploy closure</div>
        <div>Manual: outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md</div>
        <div>Contratos: prepare/test f161 + prepare/test f165</div>
        <div>Gate: build, paquete F159, app visual y smoke post-deploy contra URL final.</div>
      </div>

      <div data-testid="f96-dropdown-migration-summary" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[10px] text-amber-900">
        <div className="font-semibold text-amber-950">F96 Dropdown migration</div>
        <div>Status: {f96Migration.status}</div>
        <div>Grupo migrado: {f96Migration.migratedStage}</div>
        <div>Fallback legacy: {f96Migration.legacyFallbackKept ? 'activo' : 'inactivo'}</div>
        <div>Siguientes: {f96Migration.nextStages.join(' -> ')}</div>
      </div>

      <div data-testid="f97-dropdown-migration-summary" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-900">
        <div className="font-semibold text-rose-950">F97 Dropdown migration</div>
        <div>Status: {f97Migration.status}</div>
        <div>Grupos migrados: {f97Migration.migratedStages.join(' + ')}</div>
        <div>Fallback legacy: {f97Migration.legacyFallbackKept ? 'activo' : 'inactivo'}</div>
        <div>Siguientes: {f97Migration.nextStages.join(' -> ')}</div>
      </div>

      <div data-testid="f98-release-gap-summary" className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-[10px] text-indigo-900">
        <div className="font-semibold text-indigo-950">F98 Unified iconography + release gaps</div>
        <div>Puntos totales: {f98Gaps.total} | cerrados: {f98Gaps.done} | en progreso: {f98Gaps.inProgress} | bloqueados: {f98Gaps.blocked}</div>
        <div>Faltan para release final: {f98Gaps.remainingForFinalRelease}</div>
        <div>Siguiente prioridad: {f98Gaps.nextPriority.join(' -> ')}</div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {tabs.map(([key, label, Icon]) => {
          const count = itemsForTab(key).filter((item) => item.status !== 'current').length;
          return (
            <button key={key} onClick={() => setTab(key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium rounded-md transition-colors ${tab === key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />{label}<span className="text-[9px] bg-slate-200 px-1 rounded">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 max-h-[48vh] overflow-y-auto">
        {items.map((item) => (
          <div key={item.name} className={`flex items-start gap-3 p-3 rounded-lg border ${item.status === 'blocked' || item.status === 'critical' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <StatusIcon status={item.status} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px]">
                <span className="text-slate-400">{item.current}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className={item.status === 'blocked' || item.status === 'critical' ? 'text-red-600 font-medium' : 'text-blue-600 font-medium'}>{item.latest}</span>
              </div>
              {item.action && <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1"><FileText className="w-3 h-3" />{item.action}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" />Decision F73</div>
        <p>MySQL live queda diferido por infraestructura externa. Las mejoras seguras ahora son documentacion, menu IA/RAG, citation ledger, validadores, render por capas, canvas/floorplan y preparacion de seeds reproducibles.</p>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button onClick={() => window.location.reload()} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-medium transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Recargar App
        </button>
        <button onClick={onClose} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors">
          Cerrar
        </button>
      </div>
    </DialogShell>
  );
}
