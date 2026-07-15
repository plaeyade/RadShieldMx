// =============================================================================
// systemIntegrity.ts — Prueba de integridad, backup, y generación PDF (v14.4)
// =============================================================================

// ── PRUEBA DE INTEGRIDAD — Verificación del sistema completo ──
export interface IntegrityCheck {
  id: string; name: string; description: string;
  status: 'pass' | 'fail' | 'warning' | 'not-checked';
  critical: boolean; fix?: string;
}

export const INTEGRITY_CHECKS: IntegrityCheck[] = [
  { id: 'I01', name: 'Datos generales completos', description: 'Nombre institución, ubicación, responsable, licencia CNSNS', status: 'not-checked', critical: true, fix: 'Completar Portada y Datos Sala' },
  { id: 'I02', name: 'Especificaciones del equipo', description: 'Marca, modelo, energía, tasa dosis máxima', status: 'not-checked', critical: true, fix: 'Completar Condiciones Generales' },
  { id: 'I03', name: 'Layout estructural definido', description: 'Dimensiones bunker, colindancias, puntos de cálculo', status: 'not-checked', critical: true, fix: 'Completar LAYOUT_ESTRUCTURAL' },
  { id: 'I04', name: 'Barrera primaria calculada', description: 'Cálculo B=P·d²/(W·U·T) para cada pared primaria', status: 'not-checked', critical: true, fix: 'Usar calculadora Blindaje → LINAC' },
  { id: 'I05', name: 'Barrera secundaria calculada', description: 'Scatter + leakage para cada pared secundaria', status: 'not-checked', critical: true, fix: 'Usar calculadora Blindaje → LINAC → Secundaria' },
  { id: 'I06', name: 'Laberinto evaluado', description: 'Maze con 5 componentes (si > 10 MV o GK)', status: 'not-checked', critical: true, fix: 'Usar calculadora → Laberinto Completo' },
  { id: 'I07', name: 'Puerta del laberinto', description: 'Espesor plomo + BPE (neutrones si > 10 MV)', status: 'not-checked', critical: true, fix: 'Usar calculadora → Puerta' },
  { id: 'I08', name: 'Skyshine evaluado', description: 'Fotones + neutrones por encima del techo', status: 'not-checked', critical: false, fix: 'Usar calculadora → Skyshine' },
  { id: 'I09', name: 'TADR verificada', description: 'TADR calculada < 20 mSv/año (POE) o < 5 mSv/año (público)', status: 'not-checked', critical: true, fix: 'Usar calculadora → Verificación TADR' },
  { id: 'I10', name: 'Material de blindaje seleccionado', description: 'Material con densidad y TVL confirmado', status: 'not-checked', critical: true, fix: 'Seleccionar en calculadora o wizard Memoria' },
  { id: 'I11', name: 'Memoria analítica generada', description: 'Documento completo con todos los cálculos', status: 'not-checked', critical: true, fix: 'Usar wizard Memoria → Exportar PDF' },
  { id: 'I12', name: 'Plan de contingencias', description: 'Plan conforme NOM-041-NUCL-2013', status: 'not-checked', critical: true, fix: 'Completar MEMORIA_CONTING' },
  { id: 'I13', name: 'Checklist CNSNS', description: '≥ 90% de items requeridos cumplidos', status: 'not-checked', critical: false, fix: 'Usar diálogo Checklist' },
  { id: 'I14', name: 'Casos especiales evaluados', description: 'CBCT-IGRT, área espera, casos especiales si aplica', status: 'not-checked', critical: false, fix: 'Usar diálogo Casos Especiales' },
];

// ── BACKUP — Componentes del sistema ──
export interface BackupItem {
  component: string; files: string[]; frequency: string;
}
export const BACKUP_ITEMS: BackupItem[] = [
  { component: 'Cálculos de Blindaje', files: ['Barreras Primarias', 'Barreras Secundarias', 'Resumen Blindajes'], frequency: 'Cada cambio' },
  { component: 'Layouts', files: ['LAYOUT_ESTRUCTURAL', 'LAYOUT_ESTR_PETCT', 'LAYOUT_ESTR_GK', 'LAYOUT_ESTR_HDR', 'LAYOUT_ESTR_RADIOFARM'], frequency: 'Cada cambio' },
  { component: 'Memorias Analíticas', files: ['MEMORIA_*_PET-CT', 'MEMORIA_*_LINAC', 'MEMORIA_*_HDR', 'MEMORIA_*_GK', 'MEMORIA_*_CICLOTRON'], frequency: 'Final de proyecto' },
  { component: 'Registro de Mantenimiento', files: ['REGISTRO_MANTENIMIENTO'], frequency: 'Semestral' },
  { component: 'Checklist CNSNS', files: ['CHECKLIST_PRE_CNSNS'], frequency: 'Pre-trámite' },
  { component: 'Configuración Webapp', files: ['Proyectos exportados (JSON)', 'Reportes PDF'], frequency: 'Semanal' },
];

// ── GENERAR PDF — Componentes del reporte consolidado ──
export interface PDFComponent {
  section: string; content: string; source: string; required: boolean;
}
export const PDF_COMPONENTS: PDFComponent[] = [
  { section: 'Portada', content: 'Nombre empresa, título, ubicación, fecha, versión', source: 'Portada', required: true },
  { section: 'I. Objetivo', content: 'Descripción del propósito del cálculo de blindajes', source: 'Memoria Wizard → Paso 1', required: true },
  { section: 'II. Alcance', content: 'Equipo considerado, especificaciones, condiciones de operación', source: 'Memoria Wizard → Paso 2', required: true },
  { section: 'III. Unidad de tratamiento', content: 'Descripción técnica del equipo y sus características', source: 'EquipmentLibraryDialog', required: true },
  { section: 'IV. Criterios y método', content: 'Metodología NCRP 151, ecuaciones, factores U/T', source: 'NCRP151TablesDialog', required: true },
  { section: 'V. Croquis del bunker', content: 'Vista planta, longitudinal, puntos de cálculo', source: 'DXFViewerDialog', required: true },
  { section: 'VI. Cálculo de barreras', content: 'Resultados detallados por barrera primaria/secundaria', source: 'ShieldingCalculatorDialog', required: true },
  { section: 'VII. Cálculo puerta', content: 'Espesor plomo + BPE (si neutrones)', source: 'ShieldingCalculatorDialog → Puerta', required: false },
  { section: 'VIII. Resumen espesores', content: 'Tabla consolidada con todos los puntos de cálculo', source: 'DashboardDialog', required: true },
  { section: 'IX. Validación QA', content: 'Verificación TADR, checklist CNSNS', source: 'ChecklistCNSNSDialog', required: true },
  { section: 'X. Referencias', content: 'Normas aplicables: NOM, NCRP, IAEA, AAPM', source: 'ReferenceLibraryDialog', required: true },
];
