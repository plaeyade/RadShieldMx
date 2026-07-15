import { useState, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, FileCheck, BookOpen, Beaker, Shield, Users, ClipboardList, Building2, Printer, Download } from 'lucide-react';
import { announce } from '@/components/A11yAnnouncer';

// =============================================================================
// GMPCyclotronCertificationDialog — Certificación GMP para laboratorios de
// producción de radiofármacos con ciclotrón
// Basado en: IAEA TCS-88, WHO TRS 1025 Annex 2, EMA CHMP/QWP/363827/2025,
// PIC/S Annex 3, EANM cGRPP 2021, IAEA SSG-46, NOM-012-NUCL-2015
// =============================================================================

interface GMPRequirement {
  id: string;
  category: string;
  text: string;
  reference: string;
  weight: number; // 1=critical, 2=major, 3=minor
}

interface GMPAnswer {
  requirementId: string;
  status: 'compliant' | 'partial' | 'noncompliant' | 'na';
  observation: string;
}

const REQUIREMENTS: GMPRequirement[] = [
  // ── SISTEMA DE GESTIÓN DE CALIDAD ──
  { id: 'QMS-01', category: 'Sistema de Gestión de Calidad', text: 'Existe un sistema de gestión de calidad (QMS) documentado que cubre estructura organizacional, descripciones de puesto, procedimientos, procesos, recursos y acciones sistemáticas.', reference: 'WHO TRS 1025 Annex 2 §3.1 | IAEA/WHO QAS/24.969 §4', weight: 1 },
  { id: 'QMS-02', category: 'Sistema de Gestión de Calidad', text: 'Se aplican principios de gestión de riesgos de calidad (QRM) en el establecimiento, implementación y manejo del QMS y GMP.', reference: 'WHO TRS 1025 Annex 2 §3.2 | EANM QRM 2022 (REF052)', weight: 1 },
  { id: 'QMS-03', category: 'Sistema de Gestión de Calidad', text: 'La evaluación de riesgos incluye identificación y evaluación exhaustiva de todos los riesgos posibles asociados al proceso de manufactura.', reference: 'WHO TRS 1025 Annex 2 §3.3 | EMA CHMP/QWP/363827/2025 §3', weight: 1 },
  { id: 'QMS-04', category: 'Sistema de Gestión de Calidad', text: 'Los controles de riesgo son proporcionales a la complejidad del riesgo identificado, considerando las características específicas de los radiofármacos.', reference: 'WHO TRS 1025 Annex 2 §3.4 | IAEA TCS-88 Module 7 (REF045)', weight: 2 },
  { id: 'QMS-05', category: 'Sistema de Gestión de Calidad', text: 'Existe un programa de control de calidad del aire (partículas y microbiología) con monitoreo continuo en áreas clasificadas.', reference: 'WHO TRS 1025 Annex 2 §3.5 | PIC/S Annex 3 §16-24 | Marengo (REF069)', weight: 1 },
  { id: 'QMS-06', category: 'Sistema de Gestión de Calidad', text: 'Se aplica el principio ALARA (As Low As Reasonably Achievable) en todas las operaciones con material radiactivo.', reference: 'IAEA SSG-46 | WHO TRS 1025 Annex 2 §3.6 | IAEA STI/PUB/1342 (REF046)', weight: 1 },
  { id: 'QMS-07', category: 'Sistema de Gestión de Calidad', text: 'Existe un sistema de gestión de desviaciones, no-conformidades, CAPA (Corrective and Preventive Actions) y cambios controlados.', reference: 'WHO TRS 1025 Annex 2 §4 | EANM cGRPP 2021 §7.2 (REF051)', weight: 1 },
  { id: 'QMS-08', category: 'Sistema de Gestión de Calidad', text: 'Se realizan auditorías internas programadas con frecuencia definida y se documentan las acciones correctivas.', reference: 'WHO TRS 1025 Annex 2 §7.16 | IAEA TCS-88 Competency 4F (REF045)', weight: 2 },
  { id: 'QMS-09', category: 'Sistema de Gestión de Calidad', text: 'Existe un programa de farmacovigilancia para reporte de eventos adversos y seguridad de radiofármacos.', reference: 'IAEA TCS-88 Module 7.18 | EMA CHMP/QWP/363827/2025', weight: 2 },
  { id: 'QMS-10', category: 'Sistema de Gestión de Calidad', text: 'La evaluación de riesgos cubre la naturaleza única de los agentes radiactivos con controles adaptados al proceso real de producción.', reference: 'WHO TRS 1025 Annex 2 §3.6 | Faivre-Chauvet 2022 (REF053)', weight: 1 },

  // ── PERSONAL ──
  { id: 'PER-01', category: 'Personal y Capacitación', text: 'Todas las operaciones de fabricación se realizan bajo responsabilidad de personal con competencia en protección radiológica.', reference: 'PIC/S Annex 3 §13-15 | WHO TRS 1025 Annex 2 §8 | NOM-012-NUCL-2015 (REF074)', weight: 1 },
  { id: 'PER-02', category: 'Personal y Capacitación', text: 'El personal de producción, control analítico y liberación está debidamente capacitado en aspectos específicos de radiofármacos del QMS.', reference: 'WHO QAS/24.969 §5 | IAEA TCS-88 §2.2 | EANM Technologist Guide (REF047)', weight: 1 },
  { id: 'PER-03', category: 'Personal y Capacitación', text: 'La persona autorizada (Qualified Person) tiene completa responsabilidad para la liberación de productos.', reference: 'PIC/S Annex 3 §13 | EMA CHMP/QWP/363827/2025 §4', weight: 1 },
  { id: 'PER-04', category: 'Personal y Capacitación', text: 'Todo el personal (incluido limpieza y mantenimiento) recibe formación adicional adaptada a productos radiactivos.', reference: 'PIC/S Annex 3 §14 | WHO TRS 1025 Annex 2 §8.4', weight: 2 },
  { id: 'PER-05', category: 'Personal y Capacitación', text: 'Cuando las instalaciones se comparten con investigación, el personal de investigación está entrenado en normas GMP.', reference: 'PIC/S Annex 3 §15 | Bormans 2017 (REF054)', weight: 2 },
  { id: 'PER-06', category: 'Personal y Capacitación', text: 'El programa de capacitación incluye formación específica en: radioquímica, síntesis automatizada, control de calidad, y prácticas asépticas.', reference: 'IAEA TCS-88 §5 (Modules 4-6) | IAEA STI/PUB/1342 Level 3 (REF046)', weight: 1 },
  { id: 'PER-07', category: 'Personal y Capacitación', text: 'El personal que opera el ciclotrón cuenta con certificación específica en operación de aceleradores de partículas.', reference: 'IAEA TCS-88 §5.2 | NOM-012-NUCL-2015 (REF074)', weight: 1 },
  { id: 'PER-08', category: 'Personal y Capacitación', text: 'Se mantienen registros de capacitación, evaluación de competencias y planes de desarrollo profesional continuo.', reference: 'IAEA TCS-88 §7 | WHO QAS/24.969 §5.1', weight: 2 },

  // ── INSTALACIONES Y EQUIPO ──
  { id: 'FAC-01', category: 'Instalaciones y Equipo', text: 'Los productos radiactivos se fabrican en áreas controladas ambiental y radiactivamente.', reference: 'PIC/S Annex 3 §16 | WHO TRS 1025 Annex 2 §9 | Marengo (REF069)', weight: 1 },
  { id: 'FAC-02', category: 'Instalaciones y Equipo', text: 'Todas las etapas de fabricación se llevan a cabo en instalaciones dedicadas a radiofármacos y autónomas.', reference: 'PIC/S Annex 3 §17', weight: 1 },
  { id: 'FAC-03', category: 'Instalaciones y Equipo', text: 'Se establecen medidas para prevenir contaminación cruzada de personal, materiales, radionucleidos, etc.', reference: 'PIC/S Annex 3 §18 | EMA CHMP/QWP/363827/2025 §4.1', weight: 1 },
  { id: 'FAC-04', category: 'Instalaciones y Equipo', text: 'El acceso a áreas de fabricación es a través de vestidores con restricción a personal autorizado.', reference: 'PIC/S Annex 3 §18 | WHO TRS 1025 Annex 2 §9.3', weight: 2 },
  { id: 'FAC-05', category: 'Instalaciones y Equipo', text: 'Las estaciones de trabajo y su entorno están controladas respecto a radiactividad, partículas y calidad microbiológica según PQ.', reference: 'PIC/S Annex 3 §19 | IAEA SSG-46 (IAEA_SSG46)', weight: 1 },
  { id: 'FAC-06', category: 'Instalaciones y Equipo', text: 'Se realizan mantenimiento preventivo, programas de calibración y calificación de instalaciones y equipos.', reference: 'PIC/S Annex 3 §20 | WHO TRS 1025 Annex 2 §10', weight: 1 },
  { id: 'FAC-07', category: 'Instalaciones y Equipo', text: 'El equipo que contacta el producto está construido de manera que las superficies no sean reactivas, aditivas o absorbentes.', reference: 'PIC/S Annex 3 §22 | EMA CHMP/QWP/363827/2025 §5.1.2', weight: 2 },
  { id: 'FAC-08', category: 'Instalaciones y Equipo', text: 'Para radiofármacos estériles, la zona de trabajo cumple con requisitos de Grado A/B/C/D según tipo de operación.', reference: 'PIC/S Annex 3 §25-28 | EudraLex Vol 4 Annex 1 | Marengo (REF069)', weight: 1 },
  { id: 'FAC-09', category: 'Instalaciones y Equipo', text: 'Se dispone de cabina de flujo laminar (LAF) o aislador para manipulaciones asépticas.', reference: 'EANM Technologist Guide Ch.2 (REF047) | IAEA STI/PUB/1342 (REF046)', weight: 1 },
  { id: 'FAC-10', category: 'Instalaciones y Equipo', text: 'El ciclotrón y líneas de transferencia al sintetizador están calificados (IQ/OQ/PQ) y mantenidos.', reference: 'NOM-012-NUCL-2015 (REF074) | IAEA TCS-88 §5.2 (REF045)', weight: 1 },
  { id: 'FAC-11', category: 'Instalaciones y Equipo', text: 'Se dispone de celdas calientes (hot cells) con blindaje adecuado para el radionucleido producido.', reference: 'IAEA STI/PUB/1342 (REF046) | IAEA SSG-46 | NOM-012-NUCL-2015', weight: 1 },
  { id: 'FAC-12', category: 'Instalaciones y Equipo', text: 'Las salidas de aire están diseñadas para minimizar contaminación ambiental por partículas radiactivas y gases.', reference: 'PIC/S Annex 3 §23 | WHO TRS 1025 Annex 2 §9.5', weight: 1 },
  { id: 'FAC-13', category: 'Instalaciones y Equipo', text: 'Se dispone de laboratorio separado para control de calidad con equipos calibrados y calificados.', reference: 'IAEA TCS-88 §3.2 | WHO QAS/24.969 §10-12', weight: 2 },

  // ── PRODUCCIÓN ──
  { id: 'PRO-01', category: 'Producción y Procesos', text: 'Se aplica una evaluación de riesgos para determinar presiones diferenciales adecuadas, flujo de aire y calidad del aire.', reference: 'PIC/S Annex 3 §26 | EMA CHMP/QWP/363827/2025 §5', weight: 1 },
  { id: 'PRO-02', category: 'Producción y Procesos', text: 'Los procedimientos de limpieza y desinfección están validados y documentados.', reference: 'WHO TRS 1025 Annex 2 §13 | PIC/S Annex 3 §18 | EANM cGRPP (REF051)', weight: 1 },
  { id: 'PRO-03', category: 'Producción y Procesos', text: 'Se dispone de procedimientos operativos estándar (SOP) para cada proceso de producción, incluyendo síntesis automatizada.', reference: 'IAEA TCS-88 §7.6 | WHO QAS/24.969 §8 | IAEA STI/PUB/1342 (REF046)', weight: 1 },
  { id: 'PRO-04', category: 'Producción y Procesos', text: 'La producción de radionúclidos en ciclotrón incluye control de parámetros de irradiación (energía, corriente, tiempo) y material blanco.', reference: 'EMA CHMP/QWP/363827/2025 §4.1.2 | IAEA TCS-88 §5.4 (REF045)', weight: 1 },
  { id: 'PRO-05', category: 'Producción y Procesos', text: 'Los procesos de separación radiquímica (intercambio iónico, destilación, extracción con solvente) están validados.', reference: 'EMA CHMP/QWP/363827/2025 §4.1.2 | IAEA TCS-88 §5.5', weight: 1 },
  { id: 'PRO-06', category: 'Producción y Procesos', text: 'Los módulos de síntesis automatizada están calificados (IQ/OQ/PQ) con registros de auditoría.', reference: 'EMA CHMP/QWP/363827/2025 §5.1.3 | EANM cGRPP §5.10 (REF051)', weight: 1 },
  { id: 'PRO-07', category: 'Producción y Procesos', text: 'Para radiofármacos con vida media ≤20 min, se dispone de validación de proceso que demuestra consistencia.', reference: 'EMA CHMP/QWP/363827/2025 §5.1.3', weight: 1 },
  { id: 'PRO-08', category: 'Producción y Procesos', text: 'Se establecen especificaciones y controles para materiales de partida, reactivos y solventes.', reference: 'EMA CHMP/QWP/363827/2025 §4 | WHO QAS/24.969 §9', weight: 1 },
  { id: 'PRO-09', category: 'Producción y Procesos', text: 'Los registros de producción (batch records) son completos, trazables y revisados antes de liberación.', reference: 'PIC/S Annex 3 §7.8 | WHO TRS 1025 Annex 2 §12 | EANM cGRPP (REF051)', weight: 1 },
  { id: 'PRO-10', category: 'Producción y Procesos', text: 'Se dispone de procedimientos para manejo de desechos radiactivos con segregación por vida media.', reference: 'IAEA SSG-46 | IAEA TCS-88 §1.11 | NOM-008-NUCL-2018', weight: 2 },

  // ── CONTROL DE CALIDAD ──
  { id: 'QC-01', category: 'Control de Calidad', text: 'Se realizan controles de calidad de materiales de partida antes de su uso en producción.', reference: 'WHO QAS/24.969 §9 | EMA CHMP/QWP/363827/2025 §4.1.4', weight: 1 },
  { id: 'QC-02', category: 'Control de Calidad', text: 'Los métodos analíticos no descritos en farmacopea están validados.', reference: 'WHO TRS 1025 Annex 2 §4.9 | EANM 2014 (REF068)', weight: 1 },
  { id: 'QC-03', category: 'Control de Calidad', text: 'Para radiofármacos estériles filtrados, se establece bioburden ≤10 UFC/100 ml antes de filtración estéril.', reference: 'EMA CHMP/QWP/363827/2025 §5.1.3 | PIC/S Annex 3 §7.8', weight: 1 },
  { id: 'QC-04', category: 'Control de Calidad', text: 'Se incluyen en especificaciones: pureza radioquímica, pureza química, pureza radionuclídica, actividad específica, pH, endotoxinas.', reference: 'EMA CHMP/QWP/363827/2025 §5.1.5 | WHO QAS/24.969 §11', weight: 1 },
  { id: 'QC-05', category: 'Control de Calidad', text: 'La pureza radioquímica es ≥95% para diagnóstico y ≥95% para terapéuticos.', reference: 'EMA CHMP/QWP/363827/2025 §5.1.5', weight: 1 },
  { id: 'QC-06', category: 'Control de Calidad', text: 'Se dispone de métodos para pureza radionuclídica, identidad radioquímica, y esterilidad (post-liberación cuando aplique).', reference: 'EMA CHMP/QWP/363827/2025 §5.1.5 Annex 1', weight: 1 },
  { id: 'QC-07', category: 'Control de Calidad', text: 'Los estándares de calibración para medición de actividad son trazables a institución metrológica oficial.', reference: 'EMA CHMP/QWP/363827/2025 §4.1.5', weight: 1 },
  { id: 'QC-08', category: 'Control de Calidad', text: 'Para radiofármacos terapéuticos (beta y alfa), se valida experimentalmente la calibración en sitio.', reference: 'EMA CHMP/QWP/363827/2025 §4.1.5', weight: 2 },
  { id: 'QC-09', category: 'Control de Calidad', text: 'Se realizan pruebas de integridad de filtro esterilizante antes de liberación del producto.', reference: 'EMA CHMP/QWP/363827/2025 §5.1.3 | EANM cGRPP (REF051)', weight: 2 },
  { id: 'QC-10', category: 'Control de Calidad', text: 'La concentración de actividad para diagnóstico está dentro de 90-110% del valor declarado.', reference: 'EMA CHMP/QWP/363827/2025 §5.1.5', weight: 1 },

  // ── DOCUMENTACIÓN ──
  { id: 'DOC-01', category: 'Documentación', text: 'Existe un sistema de gestión documental con control de versiones, registros, SOPs, formularios y bitácoras.', reference: 'IAEA TCS-88 §7.6 | WHO QAS/24.969 §8 | WHO TRS 1025 Annex 2 §12', weight: 1 },
  { id: 'DOC-02', category: 'Documentación', text: 'Las desviaciones de proceso se documentan, investigan y se establecen acciones correctivas.', reference: 'PIC/S Annex 3 §7.8 | IAEA TCS-88 §7.16', weight: 1 },
  { id: 'DOC-03', category: 'Documentación', text: 'Los registros de producción permiten trazabilidad completa de cada lote de radiofármaco.', reference: 'WHO TRS 1025 Annex 2 §12 | EMA CHMP/QWP/363827/2025 §5', weight: 1 },
  { id: 'DOC-04', category: 'Documentación', text: 'Se dispone de registros de calibración, mantenimiento preventivo y calificación de equipos.', reference: 'WHO TRS 1025 Annex 2 §4 | WHO QAS/24.969 §7', weight: 2 },
  { id: 'DOC-05', category: 'Documentación', text: 'La liberación del producto se documenta con firma de la persona autorizada.', reference: 'PIC/S Annex 3 §13 | EMA CHMP/QWP/363827/2025 §5.2', weight: 1 },
  { id: 'DOC-06', category: 'Documentación', text: 'Se mantiene documentación de capacitación del personal con registros de competencias.', reference: 'WHO QAS/24.969 §5 | IAEA TCS-88 §6', weight: 2 },
  { id: 'DOC-07', category: 'Documentación', text: 'Se dispone de registros de monitoreo ambiental (partículas, microbiología, presión diferencial).', reference: 'PIC/S Annex 3 §19-24 | WHO QAS/24.969 §14', weight: 2 },
  { id: 'DOC-08', category: 'Documentación', text: 'Se mantiene registro de inventario y control de materiales de partida y reactivos.', reference: 'EMA CHMP/QWP/363827/2025 §3.2.S.2.2 | WHO QAS/24.969 §9', weight: 2 },
];

const WEIGHT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Crítico', color: 'text-red-600 bg-red-50' },
  2: { label: 'Mayor', color: 'text-amber-600 bg-amber-50' },
  3: {label: 'Menor', color: 'text-blue-600 bg-blue-50' },
};

const STATUS_CONFIG = {
  compliant: { label: 'Cumple', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  partial: { label: 'Parcial', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  noncompliant: { label: 'No cumple', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  na: { label: 'N/A', icon: X, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' },
};

export default function GMPCyclotronCertificationDialog({ onClose }: { onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, GMPAnswer>>({});
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showReport, setShowReport] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(REQUIREMENTS.map(r => r.category))];
    return cats;
  }, []);

  const filteredRequirements = useMemo(() => {
    if (activeTab === 'all') return REQUIREMENTS;
    return REQUIREMENTS.filter(r => r.category === activeTab);
  }, [activeTab]);

  const setStatus = useCallback((reqId: string, status: GMPAnswer['status']) => {
    setAnswers(prev => ({
      ...prev,
      [reqId]: { ...prev[reqId], requirementId: reqId, status },
    }));
  }, []);

  const setObservation = useCallback((reqId: string, observation: string) => {
    setAnswers(prev => ({
      ...prev,
      [reqId]: { ...prev[reqId], requirementId: reqId, observation },
    }));
  }, []);

  const stats = useMemo(() => {
    const total = REQUIREMENTS.length;
    const answered = Object.keys(answers).length;
    const compliant = Object.values(answers).filter(a => a.status === 'compliant').length;
    const partial = Object.values(answers).filter(a => a.status === 'partial').length;
    const noncompliant = Object.values(answers).filter(a => a.status === 'noncompliant').length;
    const critical = REQUIREMENTS.filter(r => r.weight === 1);
    const criticalAnswered = critical.filter(r => answers[r.id]?.status === 'compliant').length;
    const score = total > 0 ? Math.round(((compliant * 1.0 + partial * 0.5) / total) * 100) : 0;
    return { total, answered, compliant, partial, noncompliant, criticalTotal: critical.length, criticalAnswered, score };
  }, [answers]);

  const generateReport = useCallback(() => {
    setShowReport(true);
    announce('Reporte de certificación GMP generado');
  }, []);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  const downloadCSV = useCallback(() => {
    const headers = ['ID', 'Categoria', 'Requisito', 'Referencia', 'Peso', 'Estado', 'Observacion'];
    const rows = REQUIREMENTS.map(r => {
      const a = answers[r.id];
      return [
        r.id, r.category, r.text, r.reference,
        r.weight === 1 ? 'Critico' : r.weight === 2 ? 'Mayor' : 'Menor',
        a?.status || 'Sin evaluar', a?.observation || ''
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GMP_Certification_Cyclotron_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    announce('Archivo CSV descargado');
  }, [answers]);

  const getCategoryScore = useCallback((cat: string) => {
    const reqs = REQUIREMENTS.filter(r => r.category === cat);
    const vals = reqs.map(r => {
      const s = answers[r.id]?.status;
      return s === 'compliant' ? 1 : s === 'partial' ? 0.5 : s === 'noncompliant' ? 0 : -1;
    }).filter(v => v >= 0);
    if (vals.length === 0) return -1;
    return Math.round((vals.reduce((a, b) => a + b, 0) / reqs.length) * 100);
  }, [answers]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 print:p-0 print:bg-white print:static" role="dialog" aria-modal="true" aria-labelledby="gmp-title">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-t-lg print:bg-white print:text-black print:border-black">
          <div className="flex items-center gap-3">
            <FileCheck className="w-6 h-6" />
            <div>
              <h2 id="gmp-title" className="text-lg font-bold">Certificación GMP — Laboratorio de Radiofármacos con Ciclotrón</h2>
              <p className="text-xs text-teal-100 print:text-slate-600">Basado en IAEA/WHO, EMA, PIC/S, EANM, CNSNS — v50</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadCSV} className="p-1.5 rounded hover:bg-white/20 transition print:hidden" title="Exportar CSV">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={printReport} className="p-1.5 rounded hover:bg-white/20 transition print:hidden" title="Imprimir">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20 transition print:hidden" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-slate-50 border-b print:bg-white">
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-2xl font-bold text-teal-700">{stats.score}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Puntuación</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-2xl font-bold text-emerald-600">{stats.compliant}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Cumple</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-2xl font-bold text-amber-600">{stats.partial}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Parcial</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-2xl font-bold text-red-600">{stats.noncompliant}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">No Cumple</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-2xl font-bold text-purple-600">{stats.criticalAnswered}/{stats.criticalTotal}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Críticos OK</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="px-3 py-2 border-b bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Progreso: {stats.answered}/{stats.total} requisitos evaluados</span>
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${stats.total > 0 ? (stats.answered / stats.total) * 100 : 0}%`,
                  backgroundColor: stats.score >= 80 ? '#059669' : stats.score >= 60 ? '#d97706' : '#dc2626',
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {categories.map(cat => {
              const s = getCategoryScore(cat);
              return (
                <div key={cat} className="flex items-center gap-1 text-[10px]">
                  {cat === 'Sistema de Gestión de Calidad' && <Shield className="w-3 h-3 text-slate-400" />}
                  {cat === 'Personal y Capacitación' && <Users className="w-3 h-3 text-slate-400" />}
                  {cat === 'Instalaciones y Equipo' && <Building2 className="w-3 h-3 text-slate-400" />}
                  {cat === 'Producción y Procesos' && <Beaker className="w-3 h-3 text-slate-400" />}
                  {cat === 'Control de Calidad' && <ClipboardList className="w-3 h-3 text-slate-400" />}
                  {cat === 'Documentación' && <BookOpen className="w-3 h-3 text-slate-400" />}
                  <span className="text-slate-500">{cat.split(' ').slice(0, 2).join(' ')}:</span>
                  <span className={`font-bold ${s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-600' : s >= 0 ? 'text-red-600' : 'text-slate-300'}`}>
                    {s >= 0 ? `${s}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b bg-slate-50 overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${activeTab === 'all' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
          >
            Todos ({REQUIREMENTS.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${activeTab === cat ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
            >
              {cat} ({REQUIREMENTS.filter(r => r.category === cat).length})
            </button>
          ))}
        </div>

        {/* Requirements list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 print:overflow-visible">
          {filteredRequirements.map(req => {
            const ans = answers[req.id];
            const w = WEIGHT_LABELS[req.weight];
            return (
              <div key={req.id} className={`border rounded-lg p-3 transition ${ans?.status ? STATUS_CONFIG[ans.status].bg : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-slate-400 mt-0.5">{req.id}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-800 font-medium">{req.text}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${w.color}`}>{w.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{req.reference}</p>
                    {/* Status buttons */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(['compliant', 'partial', 'noncompliant', 'na'] as const).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const Icon = cfg.icon;
                        const isActive = ans?.status === st;
                        return (
                          <button
                            key={st}
                            onClick={() => setStatus(req.id, st)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition ${isActive ? `${cfg.bg} ${cfg.color} border-current` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Observation */}
                    <input
                      type="text"
                      placeholder="Observación (opcional)..."
                      value={ans?.observation || ''}
                      onChange={e => setObservation(req.id, e.target.value)}
                      className="mt-2 w-full text-xs px-2 py-1.5 border rounded bg-white/80 focus:outline-none focus:ring-1 focus:ring-teal-500 print:border-black"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Report section (visible after generation) */}
        {showReport && (
          <div className="border-t p-4 bg-slate-50 print:bg-white print:border-black">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Resumen de Certificación GMP</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {categories.map(cat => {
                const s = getCategoryScore(cat);
                const catReqs = REQUIREMENTS.filter(r => r.category === cat);
                const catCompliant = catReqs.filter(r => answers[r.id]?.status === 'compliant').length;
                const catPartial = catReqs.filter(r => answers[r.id]?.status === 'partial').length;
                const catNonComp = catReqs.filter(r => answers[r.id]?.status === 'noncompliant').length;
                return (
                  <div key={cat} className="p-2 bg-white rounded border">
                    <div className="font-medium text-slate-700">{cat}</div>
                    <div className={`text-lg font-bold ${s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-600' : s >= 0 ? 'text-red-600' : 'text-slate-300'}`}>
                      {s >= 0 ? `${s}%` : 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-500">C: {catCompliant} | P: {catPartial} | NC: {catNonComp}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-white rounded border text-xs">
              <p className="font-bold text-slate-700">Conclusión:</p>
              {stats.score >= 90 ? (
                <p className="text-emerald-700">El laboratorio cumple con los requisitos GMP para producción de radiofármacos con ciclotrón. Se recomienda mantener el sistema de gestión de calidad y continuar con auditorías programadas.</p>
              ) : stats.score >= 75 ? (
                <p className="text-amber-700">El laboratorio cumple parcialmente con los requisitos GMP. Se requieren acciones correctivas en los requisitos identificados como "No cumple" o "Parcial" antes de obtener certificación completa.</p>
              ) : stats.score >= 50 ? (
                <p className="text-orange-700">El laboratorio tiene deficiencias significativas en el cumplimiento GMP. Se requiere plan de acción integral para alcanzar estándares de calidad aceptables.</p>
              ) : (
                <p className="text-red-700">El laboratorio no cumple con los requisitos mínimos GMP. No se recomienda la operación hasta que se implementen las acciones correctivas necesarias.</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-slate-50 rounded-b-lg print:hidden">
          <span className="text-xs text-slate-500">{stats.answered}/{stats.total} requisitos evaluados</span>
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            <button
              onClick={generateReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Generar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
