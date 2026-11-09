/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v30 — AI-Powered Analytical Memory Wizard
 * ═══════════════════════════════════════════════════════════════════════════
 *  Features:
 *    • Conversational AI assistant guides user through each step
 *    • Auto-suggest values based on equipment database (NCRP 151 B.2)
 *    • Real-time preview of generated memory text
 *    • Smart validation with regulatory compliance checks
 *    • One-click PDF generation with professional formatting
 *    • Dose-Volume Histogram (DVH) visualization inspired by dosemetrics
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Bot, User, ChevronRight, ChevronLeft, Download, Sparkles,
  CheckCircle, AlertTriangle, FileText, Calculator, Shield, Zap, RotateCcw, Send, Clock
} from 'lucide-react';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import { buildAnalyticMemoryEvidenceSection, buildAnalyticMemorySnapshot, createFloorPlanEvidenceSources } from '@/lib/analyticMemoryEvidence';
import { buildF102MemoryDesignPlan } from '@/lib/f102MemoriaDesignPlan';
import { getF103MemoriaWorkflowAction } from '@/lib/f103MemoriaWorkflowActions';
import { buildF117ModalityHandoff, readF117ActiveProfileId } from '@/lib/f117ModalityHandoff';
import { buildF125CalculationEvidenceGate } from '@/lib/f125CalculationEvidenceGate';
import { buildF91MemoriaAIPlan } from '@/lib/f91ReleaseRoadmap';
import { buildF142MemoriaIaMaterialEvidence } from '@/lib/f142MemoriaIaMaterialEvidence';
import { buildF144SourceGovernance } from '@/lib/f144SourceGovernance';
import { buildF146MaterialReportAppendix, formatF146MaterialAppendixText } from '@/lib/f146MaterialReportAppendix';
import { buildF148MemoryProfileSelector, getF148MemoryProfile, getF148ProfileForF117, type F148MemoryProfileKey } from '@/lib/f148MemoryProfileSelector';
import { buildF149NormativeNumericQa, formatF149NormativeNumericQaText } from '@/lib/f149NormativeNumericQa';
import { buildF149bFastradClinicalUtility, formatF149bFastradUtilityText } from '@/lib/f149bFastradClinicalUtility';
import { buildF149cMonteCarloGateway, formatF149cMonteCarloGatewayText } from '@/lib/f149cMonteCarloGateway';
import { buildF184ReleaseQualityWorkflow, formatF184ReleaseQualityWorkflowText } from '@/lib/f184ReleaseQualityWorkflow';
import { buildF208CanvasReportingLayer, formatF208CanvasReportingLayerText } from '@/lib/f208CanvasReportingLayer';
import { buildF218ReportHandoff, formatF218ReportHandoffText } from '@/lib/f218ReportHandoff';
import { buildF367F370ReleaseIntegration, formatF367F370ReleaseIntegrationText } from '@/lib/f367F370ReleaseIntegration';
import { buildF409OutputSurfaceIntegration, formatF409OutputSurfaceIntegrationText } from '@/lib/f409OutputSurfaceIntegration';
import { buildF591F620GeneralImprovements, formatF591F620GeneralImprovementsMarkdown } from '@/lib/f591F620GeneralImprovements';
import { useAppStore } from '@/stores/appStore';
import type { FloorPlan } from '@/types/radshield';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  floorPlan?: FloorPlan;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
}

/* ═══════════════════════════════════════════════════════════
   Equipment database with NCRP 151 reference values
   ═══════════════════════════════════════════════════════════ */

const EQUIPMENT_DB: Record<string, {
  name: string; modality: string; energies: string[]; workload_h_week: number;
  typical_dose_Gy: number; patient_throughput_day: number; source_isotv: string;
  shielding_notes: string; regulatory_ref: string;
}> = {
  'linac_6mv': {
    name: 'LINAC 6 MV', modality: 'External Beam (Photon)', energies: ['6 MV'],
    workload_h_week: 40, typical_dose_Gy: 2.0, patient_throughput_day: 25,
    source_isotv: 'Varian TrueBeam / Elekta Versa HD', shielding_notes: 'Primary: NCRP 151 Table B.2. Secondary: leakage 0.1% at 1m. Neutrons: negligible at 6 MV.',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.2.1',
  },
  'linac_10mv': {
    name: 'LINAC 10 MV', modality: 'External Beam (Photon)', energies: ['10 MV'],
    workload_h_week: 40, typical_dose_Gy: 2.0, patient_throughput_day: 25,
    source_isotv: 'Varian TrueBeam / Elekta Versa HD', shielding_notes: 'Primary: NCRP 151 Table B.2. Secondary: leakage 0.1%. Neutrons: threshold 10 MV — minimal at 10 MV.',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.2.2',
  },
  'linac_15mv': {
    name: 'LINAC 15 MV', modality: 'External Beam (Photon)', energies: ['15 MV'],
    workload_h_week: 40, typical_dose_Gy: 2.0, patient_throughput_day: 20,
    source_isotv: 'Varian TrueBeam / Elekta Versa HD', shielding_notes: 'Primary: NCRP 151 Table B.2. Secondary: leakage 0.1%. Neutrons: MUST include neutron shielding >10 MV per NCRP 151 Sec. 5.4.',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.2.3 + 5.4',
  },
  'linac_18mv': {
    name: 'LINAC 18 MV', modality: 'External Beam (Photon)', energies: ['18 MV'],
    workload_h_week: 40, typical_dose_Gy: 2.0, patient_throughput_day: 20,
    source_isotv: 'Varian TrueBeam / Elekta Versa HD', shielding_notes: 'Primary: NCRP 151 Table B.2. Secondary: leakage 0.1%. Neutrons: significant >10 MV — borated polyethylene recommended for doors.',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.2.4 + 5.4.2',
  },
  'gamma_knife_perfexion': {
    name: 'Gamma Knife Perfexion', modality: 'Radiosurgery', energies: ['Co-60 (1.17, 1.33 MeV)'],
    workload_h_week: 20, typical_dose_Gy: 12.0, patient_throughput_day: 4,
    source_isotv: 'Elekta Leksell Gamma Knife Perfexion / Icon', shielding_notes: '60Co sources: permanent installation. Shielding based on source activity (typically 200-400 Ci). Primary barrier: direct beam. TVL concrete 210 mm, lead 40 mm (NCRP 151 Table B.2, Co-60).',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.3.1',
  },
  'hdr_ir192': {
    name: 'HDR Ir-192', modality: 'Brachytherapy', energies: ['Ir-192 (0.38 MeV avg)'],
    workload_h_week: 10, typical_dose_Gy: 15.0, patient_throughput_day: 3,
    source_isotv: 'Varian Varisource / Elekta Flexitron', shielding_notes: 'HDR afterloader: source returns to safe when not in use. Room is controlled area. Ir-192: HVL lead ≈ 3 mm (TVL ≈ 16 mm), TVL concrete ≈ 150 mm (literature values, not from NCRP 151).',
    regulatory_ref: 'NCRP 151 (2005), Sec. 4.4.1',
  },
  'pet_ct_fdg': {
    name: 'PET/CT (F-18 FDG)', modality: 'Nuclear Medicine', energies: ['511 keV annihilation'],
    workload_h_week: 30, typical_dose_Gy: 0, patient_throughput_day: 12,
    source_isotv: 'Siemens Biograph / GE Discovery', shielding_notes: '511 keV annihilation photons. Isotropic source distribution. First TVL (TG-108 Table V, broad beam): lead ≈ 16 mm, concrete ≈ 190 mm. Self-shielding from Uptake room to Scan room. Dose limits: public areas per NCRP 147.',
    regulatory_ref: 'NCRP 147 (2004)',
  },
  'spect_tcm': {
    name: 'SPECT/CT (Tc-99m)', modality: 'Nuclear Medicine', energies: ['140 keV'],
    workload_h_week: 30, typical_dose_Gy: 0, patient_throughput_day: 15,
    source_isotv: 'Siemens Symbia / GE Discovery NM', shielding_notes: '140 keV photons from Tc-99m. Low energy, easy to shield. HVL lead ≈ 0.27 mm (TVL ≈ 0.9 mm). TVL concrete ~22 mm (narrow beam).',
    regulatory_ref: 'NCRP 147 (2004)',
  },
  'cyclotron_18mev': {
    name: 'Cyclotron 18 MeV (FDG)', modality: 'Radioisotope Production', energies: ['18 MeV protons'],
    workload_h_week: 40, typical_dose_Gy: 0, patient_throughput_day: 0,
    source_isotv: 'IBA KIUBE / GE PETtrace', shielding_notes: 'High-energy protons on target → neutrons + gamma. Shielding: thick concrete (1.5-2.5 m) or earth berm. Maze design essential. Neutron door: borated polyethylene + lead. Activation of components.',
    regulatory_ref: 'NCRP 144 (2003), IAEA SSG-8',
  },
  'cbct_igrt': {
    name: 'CBCT / IGRT Addon', modality: 'Imaging (kV)', energies: ['100-140 kVp'],
    workload_h_week: 10, typical_dose_Gy: 0, patient_throughput_day: 25,
    source_isotv: 'Varian OBI / Elekta XVI', shielding_notes: 'kV imaging: HVL lead ~0.5 mm at 120 kVp. Additional shielding for on-board imaging during treatment. AAPM TG 108 recommendations.',
    regulatory_ref: 'AAPM TG 108 (2010)',
  },
};

/* ═══════════════════════════════════════════════════════════
   AI Assistant messages
   ═══════════════════════════════════════════════════════════ */

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  suggestions?: string[];
}

const AI_GREETING = `¡Hola! Soy el **Asistente de Memorias Analíticas** de RadShield-MX. Voy a guiarte paso a paso para crear una memoria profesional conforme a la normativa vigente.

**¿Qué equipo deseas documentar?** Selecciona de la lista o describe tu instalación.`;

/* ═══════════════════════════════════════════════════════════
   Step configurations
   ═══════════════════════════════════════════════════════════ */

const STEPS = [
  { id: 'project', label: 'Proyecto', icon: FileText },
  { id: 'equipment', label: 'Equipo', icon: Zap },
  { id: 'workload', label: 'Carga de Trabajo', icon: Clock },
  { id: 'barriers', label: 'Barreras', icon: Shield },
  { id: 'calcs', label: 'Cálculos', icon: Calculator },
  { id: 'review', label: 'Revisión AI', icon: Bot },
  { id: 'export', label: 'Exportar', icon: Download },
];

export default function MemoriaAIWizard({
  open,
  onOpenChange,
  floorPlan,
  barrierResults = [],
  sampleLines = [],
}: Props) {
  const [step, setStep] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'ai', text: AI_GREETING },
  ]);
  const [userInput, setUserInput] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState('chat');

  // Form data
  const [projectData, setProjectData] = useState({
    name: '', institution: '', responsible: '', date: new Date().toISOString().split('T')[0],
    location: '', licenseNumber: '', reportType: 'shielding',
  });
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMemoryProfile, setSelectedMemoryProfile] = useState<F148MemoryProfileKey>(() => getF148ProfileForF117(readF117ActiveProfileId()));
  const [, setEquipmentNotes] = useState('');
  const [workloadData, setWorkloadData] = useState({
    patientsPerWeek: '', fractionsPerPatient: '', dosePerFraction: '',
    beamsPerFraction: '', tadsPerWeek: '', workloadHours: '',
  });
  const [barrierData, setBarrierData] = useState({
    numBarriers: '', hasMaze: false, mazeType: '', hasLeadDoor: false,
    doorThicknessPb: '', ceilingHeight: '', floorThickness: '',
  });
  const [calcResults, setCalcResults] = useState({
    primaryTVL: '', secondaryTVL: '', neutronTVL: '', skyshineFactor: '',
    doseConstraintPublic: '0.02', doseConstraintWorker: '0.4', occupancyFactor: '',
  });

  const eq = selectedEquipment ? EQUIPMENT_DB[selectedEquipment] : null;
  const memorySnapshot = useMemo(() => buildAnalyticMemorySnapshot(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const evidenceSection = useMemo(() => buildAnalyticMemoryEvidenceSection(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const dxfEvidenceSource = useMemo(
    () => createFloorPlanEvidenceSources(floorPlan, barrierResults, sampleLines).find((source) => source.id === 'ev-dxf-import-review'),
    [floorPlan, barrierResults, sampleLines],
  );
  const f125Gate = useMemo(() => buildF125CalculationEvidenceGate(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const memoriaAIPlan = useMemo(() => buildF91MemoriaAIPlan(), []);
  const f142MaterialEvidence = useMemo(() => buildF142MemoriaIaMaterialEvidence(), []);
  const f144SourceGovernance = useMemo(() => buildF144SourceGovernance(), []);
  const f146MaterialAppendix = useMemo(() => buildF146MaterialReportAppendix(floorPlan), [floorPlan]);
  const f146MaterialAppendixText = useMemo(() => formatF146MaterialAppendixText(f146MaterialAppendix), [f146MaterialAppendix]);
  const f148ProfileSelector = useMemo(() => buildF148MemoryProfileSelector(), []);
  const f148ActiveProfile = useMemo(() => getF148MemoryProfile(selectedMemoryProfile), [selectedMemoryProfile]);
  const f149NormativeQa = useMemo(() => buildF149NormativeNumericQa(), []);
  const f149NormativeQaText = useMemo(() => formatF149NormativeNumericQaText(f149NormativeQa), [f149NormativeQa]);
  const f149bFastradUtility = useMemo(() => buildF149bFastradClinicalUtility(), []);
  const f149bFastradUtilityText = useMemo(() => formatF149bFastradUtilityText(f149bFastradUtility), [f149bFastradUtility]);
  const f149cMonteCarloGateway = useMemo(() => buildF149cMonteCarloGateway(floorPlan), [floorPlan]);
  const f149cMonteCarloGatewayText = useMemo(() => formatF149cMonteCarloGatewayText(f149cMonteCarloGateway), [f149cMonteCarloGateway]);
  const f184ReleaseQuality = useMemo(() => buildF184ReleaseQualityWorkflow(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const f184ReleaseQualityText = useMemo(() => formatF184ReleaseQualityWorkflowText(f184ReleaseQuality), [f184ReleaseQuality]);
  const f208CanvasReporting = useMemo(() => buildF208CanvasReportingLayer(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const f208CanvasReportingText = useMemo(() => formatF208CanvasReportingLayerText(f208CanvasReporting), [f208CanvasReporting]);
  const f218ReportHandoff = useMemo(() => buildF218ReportHandoff(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const f218ReportHandoffText = useMemo(() => formatF218ReportHandoffText(f218ReportHandoff), [f218ReportHandoff]);
  const f367F370ReleaseIntegration = useMemo(() => buildF367F370ReleaseIntegration(floorPlan), [floorPlan]);
  const f367F370ReleaseIntegrationText = useMemo(() => formatF367F370ReleaseIntegrationText(f367F370ReleaseIntegration), [f367F370ReleaseIntegration]);
  const f409OutputIntegration = useMemo(() => buildF409OutputSurfaceIntegration(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const f409OutputIntegrationText = useMemo(() => formatF409OutputSurfaceIntegrationText(f409OutputIntegration), [f409OutputIntegration]);
  const f591GeneralImprovements = useMemo(() => buildF591F620GeneralImprovements(), []);
  const f591GeneralImprovementsText = useMemo(() => formatF591F620GeneralImprovementsMarkdown(f591GeneralImprovements), [f591GeneralImprovements]);
  const f117Handoff = useMemo(() => buildF117ModalityHandoff(), []);
  const f118SuggestedEquipmentKey = f117Handoff.memoriaDefaults.recommendedEquipmentKeys.find((key) => EQUIPMENT_DB[key]) || '';
  const f102DesignPlan = useMemo(() => buildF102MemoryDesignPlan({
    floorPlan,
    selectedEquipmentKey: selectedEquipment,
    selectedEquipmentName: eq?.name,
    barrierResults,
    sampleLines,
  }), [floorPlan, selectedEquipment, eq?.name, barrierResults, sampleLines]);
  const f103WorkflowActions = useMemo(
    () => f102DesignPlan.steps.map((item) => ({ step: item, action: getF103MemoriaWorkflowAction(item.id) })),
    [f102DesignPlan.steps],
  );

  // ─── AI Chat ───
  const addAIMessage = useCallback((text: string, suggestions?: string[]) => {
    setChatHistory(prev => [...prev, { role: 'ai', text, suggestions }]);
  }, []);

  const runF103WorkflowAction = useCallback((stepId: string) => {
    const workflowAction = getF103MemoriaWorkflowAction(stepId);
    if (!workflowAction) return;
    if (typeof workflowAction.wizardStep === 'number') {
      setStep(Math.min(Math.max(workflowAction.wizardStep, 0), STEPS.length - 1));
    }
    if (workflowAction.tool) {
      useAppStore.getState().setActiveTool(workflowAction.tool);
    }
    if (workflowAction.dialogName) {
      useAppStore.getState().open(workflowAction.dialogName);
    }
    addAIMessage(`F103 activo: **${workflowAction.label}**.\n${workflowAction.detail}`);
    toast.success(`F103: ${workflowAction.label}`);
  }, [addAIMessage]);

  const handleUserMessage = useCallback(() => {
    if (!userInput.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', text: userInput }]);

    // Simple AI response logic
    const input = userInput.toLowerCase();
    setTimeout(() => {
      if (input.includes('linac') || input.includes('acelerador')) {
        addAIMessage('Detecté que mencionas un **Acelerador Lineal**. Los LINAC son los equipos más comunes en radioterapia. ¿Qué energía tiene? (6 MV, 10 MV, 15 MV, 18 MV)', ['6 MV', '10 MV', '15 MV', '18 MV']);
      } else if (input.includes('pet') || input.includes('fdg')) {
        addAIMessage('Unidad **PET/CT con F-18 FDG**. La clave aquí es el blindaje para fotones de aniquilación de 511 keV. La NCRP 147 tiene tablas específicas para medicina nuclear. ¿Ya tienes el diseño del bunker?');
      } else if (input.includes('gamma knife') || input.includes('radiocirugía')) {
        addAIMessage('**Gamma Knife** — fuente de Co-60 con blindaje especializado. El TVL en concreto es de ~210 mm. ¿Es modelo Perfexion o Icon?', ['Perfexion', 'Icon']);
      } else if (input.includes('hdr') || input.includes('braquiterapia')) {
        addAIMessage('**Braquiterapia HDR** con Ir-192. El blindaje es más ligero debido a la baja energía (380 keV promedio). HVL en plomo ≈ 3 mm (TVL ≈ 16 mm).', ['Ir-192', 'Co-60 HDR']);
      } else {
        addAIMessage('Entendido. Para avanzar, selecciona el equipo de la lista a la izquierda y yo completaré automáticamente los valores de referencia según NCRP 151.');
      }
    }, 300);
    setUserInput('');
  }, [userInput, addAIMessage]);

  // ─── Auto-fill from equipment DB ───
  const handleEquipmentSelect = useCallback((key: string) => {
    setSelectedEquipment(key);
    if (key.includes('gamma_knife')) setSelectedMemoryProfile('GAMMA_KNIFE');
    else if (key.includes('cyclotron')) setSelectedMemoryProfile('CYCLOTRON');
    else if (key.includes('hdr')) setSelectedMemoryProfile('BRAQUI_CO60');
    else if (key.includes('pet') || key.includes('spect')) setSelectedMemoryProfile('NUCLEAR_MEDICINE');
    else if (key.includes('ct') || key.includes('cbct')) setSelectedMemoryProfile('DIAGNOSTIC');
    else if (key.includes('linac')) setSelectedMemoryProfile('LINAC');
    const e = EQUIPMENT_DB[key];
    if (e) {
      setWorkloadData(prev => ({
        ...prev,
        patientsPerWeek: String(e.patient_throughput_day * 5),
        dosePerFraction: String(e.typical_dose_Gy),
        workloadHours: String(e.workload_h_week),
      }));
      setEquipmentNotes(e.shielding_notes);
      addAIMessage(`**${e.name}** seleccionado. He completado automáticamente los valores de referencia de la **NCRP 151** (Tabla B.2):\n\n• **Modalidad:** ${e.modality}\n• **Energía(s):** ${e.energies.join(', ')}\n• **Workload típico:** ${e.workload_h_week} h/semana\n• **Dosis/fraction:** ${e.typical_dose_Gy} Gy\n• **Pacientes/día:** ${e.patient_throughput_day}\n\n**Notas de blindaje:**\n${e.shielding_notes}\n\n**Referencia:** ${e.regulatory_ref}`, ['Confirmar y continuar', 'Modificar valores']);
    }
  }, [addAIMessage]);

  // ─── Generate memory text ───
  const generatedText = useMemo(() => {
    const f117Section = `\n7.2 PERFIL ACTIVO F117 / RUTA DOCUMENTAL\n   Perfil: ${f117Handoff.activeProfile.label} - ${f117Handoff.activeProfile.name}\n   Tipo de memoria: ${f117Handoff.memoriaDefaults.reportType}\n   Plantilla reporte: ${f117Handoff.reportDefaults.templateId} - ${f117Handoff.reportDefaults.title}\n   Normas prioritarias: ${f117Handoff.evidenceDefaults.priorityDocuments.join(', ')}\n   Enfoque metodologico: ${f117Handoff.memoriaDefaults.methodFocus.join(', ')}\n   Consultas RAG sugeridas: ${f117Handoff.evidenceDefaults.ragQueries.join(' | ')}\n   Primer prompt: ${f117Handoff.memoriaDefaults.firstPrompt}\n`;
    const f117F148BridgeSection = `\n7.2.1 PUENTE DX/TX/NM/CY -> PERFIL F148\n   Perfil operativo activo: ${f117Handoff.activeProfile.id.toUpperCase()} (${f117Handoff.activeProfile.label})\n   Perfil de memoria recomendado: ${getF148ProfileForF117(f117Handoff.activeProfile.id)}\n   Perfil de memoria seleccionado: ${f148ActiveProfile.key} - ${f148ActiveProfile.label}\n   Regla: el perfil activo preselecciona la ruta documental, pero el usuario confirma antes de exportar.\n`;
    const improvementSection = `\n8. PLAN DE MEJORA IA / QA HACIA RELEASE\n${memoriaAIPlan.map((item, index) => `   ${index + 1}. ${item}`).join('\n')}\n`;
    const f102Section = `\n7. DISENO GUIADO DE MEMORIA ANALITICA SEGUN FLOORPLAN Y EQUIPO\n   Score de preparacion: ${f102DesignPlan.score}%\n   Equipo/base: ${f102DesignPlan.equipmentSummary}\n   Plano/base: ${f102DesignPlan.floorPlanSummary}\n   Norma sugerida: ${f102DesignPlan.recommendedStandard}\n   Proxima accion: ${f102DesignPlan.nextBestAction}\n${f102DesignPlan.steps.map((item) => `   - ${item.title}: ${item.status.toUpperCase()} | ${item.action} | Evidencia: ${item.evidence}`).join('\n')}\n`;
    const f103Section = `\n7.1 FLUJO ACCIONABLE F103\n${f103WorkflowActions.map(({ step: item, action }) => `   - ${item.title}: ${action?.label ?? 'Revisar'} -> ${action?.detail ?? item.action}`).join('\n')}\n`;
    const f142Section = `\n7.3 EVIDENCIA MATERIAL F142 / RAG TM NIPOLL-CONTUPLEX\n   Estado: ${f142MaterialEvidence.status}\n   Politica IA: usar PDFs de fabricante/laboratorio como evidencia citada; no promover valores a constantes certificadas sin revision humana.\n${f142MaterialEvidence.citations.map((item) => `   - ${item.title} (${item.source}, ${item.pages}, ${item.chunks} chunks): ${item.use}${item.warning ? ` Advertencia: ${item.warning}` : ''}`).join('\n')}\n   Secciones obligatorias:\n${f142MaterialEvidence.requiredMemorySections.map((item) => `   - ${item}`).join('\n')}\n   Pendientes documentales:\n${f142MaterialEvidence.pendingDocuments.map((item) => `   - ${item}`).join('\n')}\n`;
    const f144Section = `\n7.4 GOBIERNO DE FUENTES F144 / DX-TX-NM-CY\n   Estado: ${f144SourceGovernance.status}\n   Jerarquia:\n${f144SourceGovernance.canonicalHierarchy.map((item) => `   - ${item}`).join('\n')}\n   Perfiles de memoria:\n${f144SourceGovernance.memoryProfiles.map((profile) => `   - ${profile.title}: Normas ${profile.requiredNormativeSources.join(' + ')} | Soporte ${profile.supportingSources.join(' + ')} | Revision: ${profile.calculationMethodReview}`).join('\n')}\n   Revision metodologica:\n${f144SourceGovernance.methodologyReview.map((item) => `   - ${item}`).join('\n')}\n   Politica duplicados:\n${f144SourceGovernance.duplicatePolicy.map((item) => `   - ${item}`).join('\n')}\n`;
    const f146Section = `\n7.4.1 ANEXO F146 / MATERIALES EN REPORTE\n${f146MaterialAppendixText}\n`;
    const f148Section = `\n7.5 PERFIL DE MEMORIA F148 / MODALIDAD\n   Perfil seleccionado: ${f148ActiveProfile.label} (${f148ActiveProfile.key})\n   Descripcion: ${f148ActiveProfile.description}\n   Normas requeridas: ${f148ActiveProfile.profile.requiredNormativeSources.join(' + ')}\n   Fuentes soporte: ${f148ActiveProfile.profile.supportingSources.join(' + ')}\n   Inputs obligatorios:\n${f148ActiveProfile.requiredInputs.map((item) => `   - ${item}`).join('\n')}\n   Advertencias antes de exportar:\n${f148ActiveProfile.exportWarnings.map((item) => `   - ${item}`).join('\n')}\n   Politica F148:\n${f148ProfileSelector.selectionPolicy.map((item) => `   - ${item}`).join('\n')}\n`;
    const f149Section = `\n7.6 QA NUMERICO NORMATIVO F149\n${f149NormativeQaText}\n`;
    const f149bSection = `\n7.7 SMOKE F149B / ANALISIS FASTRAD Y EXPORTACION\n${f149bFastradUtilityText}\n`;
    const f149cSection = `\n7.8 GATEWAY F149C / MONTE CARLO EXTERNO VALIDABLE\n${f149cMonteCarloGatewayText}\n`;
    const f184Section = `\n7.9 QA INTEGRAL F184 / MOTOR-CANVAS-MEMORIA-MATERIALES\n${f184ReleaseQualityText}\n`;
    const f208Section = `\n7.10 CANVAS REPORTABLE F208\n${f208CanvasReportingText}\n`;
    const f218Section = `\n7.11 HANDOFF VISUAL F218\n${f218ReportHandoffText}\n`;
    const f367F370Section = `\n7.12 INTEGRACION F367-F370 / 3D, UNITY, MOTORES EXTERNOS Y BETA\n${f367F370ReleaseIntegrationText}\n`;
    const f409Section = `\n7.13 INTEGRACION F409 / SALIDAS REALES F405-F408\n${f409OutputIntegrationText}\n`;
    const f591Section = `\n7.14 MEJORAS GENERALES F591-F620 / FLUJO PRODUCTIVO\n${f591GeneralImprovementsText}\n`;
    const dxfEvidenceText = dxfEvidenceSource ? `\n7.15 REVISION CAD/DXF PARA MEMORIA IA\n   Fuente: ${dxfEvidenceSource.title}\n   Estado: ${dxfEvidenceSource.verificationStatus}\n   Hash/extracto: ${dxfEvidenceSource.excerptHash}\n   Trazabilidad: ${dxfEvidenceSource.excerpt}\n   Nota tecnica: ${dxfEvidenceSource.notes}\n` : '';
    if (!eq) return evidenceSection ? `MEMORIA ANALITICA DE BLINDAJE RADIOLOGICO\n\n${f102Section}${f103Section}${f117Section}${f117F148BridgeSection}${f142Section}${f144Section}${f146Section}${f148Section}${f149Section}${f149bSection}${f149cSection}${f184Section}${f208Section}${f218Section}${f367F370Section}${f409Section}${f591Section}${dxfEvidenceText}\n${evidenceSection}${improvementSection}` : `${f102Section}${f103Section}${f117Section}${f117F148BridgeSection}${f142Section}${f144Section}${f146Section}${f148Section}${f149Section}${f149bSection}${f149cSection}${f184Section}${f208Section}${f218Section}${f367F370Section}${f409Section}${f591Section}${dxfEvidenceText}\n${improvementSection}`.trim();
    return `MEMORIA ANALITICA DE BLINDAJE RADIOLOGICO

1. DATOS DEL PROYECTO
   Nombre del proyecto: ${projectData.name || '[Por definir]'}
   Institución: ${projectData.institution || '[Por definir]'}
   Responsable: ${projectData.responsible || '[Por definir]'}
   Fecha: ${projectData.date}
   Ubicación: ${projectData.location || '[Por definir]'}
   Licencia CNSNS: ${projectData.licenseNumber || '[Por definir]'}

2. DESCRIPCION DEL EQUIPO
   Equipo: ${eq.name}
   Modalidad: ${eq.modality}
   Energía: ${eq.energies.join(', ')}
   Fabricante/Modelo: ${eq.source_isotv}
   
   ${eq.shielding_notes}

3. CARGA DE TRABAJO (WORKLOAD)
   Pacientes por semana: ${workloadData.patientsPerWeek || eq.patient_throughput_day * 5}
   Dosis por fracción: ${workloadData.dosePerFraction || eq.typical_dose_Gy} Gy
   Horas de trabajo/semana: ${workloadData.workloadHours || eq.workload_h_week} h
   Número de barreras: ${barrierData.numBarriers || '[Por definir]'}
   Altura del techo: ${barrierData.ceilingHeight || '[Por definir]'} m

4. CALCULO DE BLINDAJE
   Referencia normativa: ${eq.regulatory_ref}
   Límite dosis público: ${calcResults.doseConstraintPublic} mSv/semana
   Límite dosis trabajador: ${calcResults.doseConstraintWorker} mSv/semana
   
   METODOLOGIA: NCRP Report No. 151 (2005)
   B = P × d² / (W × U × T)
   
   Donde:
   B = barrier transmission factor
   P = design dose limit (mSv/semana)
   d = distance from source to barrier (m)
   W = workload (Gy/semana)
   U = use factor
   T = occupancy factor

5. RESULTADOS
   [Pendiente de cálculo con datos completos]

6. CONCLUSIONES
   El diseño de blindaje cumple con los requisitos de la NCRP 151
   y las normas de la CNSNS (LA-001/01) para la protección radiológica.

Referencias:
[1] NCRP (2005). Structural Shielding Design for MV X- and Gamma-Ray
    Radiotherapy Facilities. NCRP Report No. 151.
[2] CNSNS (2014). Licencia de Operacion para Instalaciones Medicas.
    Norma LA-001/01.
${eq.regulatory_ref !== 'NCRP 151 (2005)' ? `[3] ${eq.regulatory_ref}` : ''}
${f102Section}${f103Section}${f117Section}${f117F148BridgeSection}
${f142Section}
${f144Section}
${f146Section}
${f148Section}
${f149Section}
${f149bSection}
${f149cSection}
${f184Section}
${f208Section}
${f218Section}
${f367F370Section}
${f409Section}
${f591Section}
${dxfEvidenceText}
${evidenceSection}
${improvementSection}
`;
  }, [eq, projectData, workloadData, barrierData, calcResults, f102DesignPlan, f103WorkflowActions, f117Handoff, f142MaterialEvidence, f144SourceGovernance, f146MaterialAppendixText, f148ActiveProfile, f148ProfileSelector.selectionPolicy, f149NormativeQaText, f149bFastradUtilityText, f149cMonteCarloGatewayText, f184ReleaseQualityText, f208CanvasReportingText, f218ReportHandoffText, f367F370ReleaseIntegrationText, f409OutputIntegrationText, f591GeneralImprovementsText, dxfEvidenceSource, evidenceSection, memoriaAIPlan]);

  // ─── Export handlers ───
  const exportPDF = useCallback(() => {
    const text = generatedText;
    const html = `
      <html><head><style>
        body{font-family:Arial,sans-serif;line-height:1.6;max-width:800px;margin:2cm auto;color:#333}
        h1{color:#1a365d;border-bottom:2px solid #3182ce;padding-bottom:.3cm}
        h2{color:#2d3748;margin-top:1cm} pre{background:#f5f5f5;padding:1em;border-radius:4px;white-space:pre-wrap}
      </style></head><body>
      <h1>Memoria Analitica de Blindaje Radiologico</h1>
      <pre>${text}</pre>
      <p style="margin-top:2cm;text-align:center;color:#666;font-size:10pt">
        Generado por RadShield-MX v30 AI Assistant<br/>
        ${new Date().toLocaleDateString('es-MX')}
      </p>
      </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Memoria_${projectData.name || 'Blindaje'}_${projectData.date}.html`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Memoria exportada (HTML, abrir en navegador para imprimir a PDF)');
  }, [generatedText, projectData]);

  const exportTXT = useCallback(() => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Memoria_${projectData.name || 'Blindaje'}_${projectData.date}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Memoria exportada como TXT');
  }, [generatedText, projectData]);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bot className="w-5 h-5 text-violet-500" />
            Asistente AI — Memoria Analitica de Blindaje
            <Badge className="text-[9px] bg-violet-100 text-violet-700 ml-1">v30 AI</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="px-5 pt-2 pb-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>Paso {step + 1} de {STEPS.length}: {STEPS[step]?.label}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex gap-1 mt-2">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                className={`flex-1 text-[9px] py-0.5 rounded transition-colors ${
                  i === step ? 'bg-violet-100 text-violet-700 font-semibold' :
                  i < step ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                }`}
                onClick={() => i <= step && setStep(i)}
              >
                {i < step ? '✓' : i + 1}. {s.label}
              </button>
            ))}
          </div>
          <div data-testid="memoria-evidence-snapshot" className="mt-2 grid grid-cols-6 gap-1 text-[9px]">
            {[
              ['Barreras', memorySnapshot.barriers],
              ['Fuentes', memorySnapshot.sources],
              ['Zonas', memorySnapshot.regions],
              ['Resultados', memorySnapshot.results],
              ['Lineas 0.3m', memorySnapshot.sampleLines],
              ['Puntos', memorySnapshot.samplePoints],
              ['Criticos F86', memorySnapshot.criticalPoints],
              ['Presets F86', `${memorySnapshot.presetCoveragePct}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-violet-100 bg-violet-50 px-2 py-1 text-violet-800">
                <div className="font-semibold">{value}</div>
                <div className="truncate">{label}</div>
              </div>
            ))}
            <div className="col-span-6 rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-800">
              Evidence Pack F76: {memorySnapshot.standards.join(', ') || 'sin fuentes'} | max {memorySnapshot.maxThickness.toFixed(1)} mm
            </div>
            {dxfEvidenceSource && (
              <div data-testid="memoria-dxf-evidence-source" className="col-span-6 rounded border border-blue-100 bg-blue-50 px-2 py-1 text-blue-900">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">Revision CAD/DXF para Memoria IA</div>
                  <Badge className="h-4 bg-blue-100 text-blue-800 text-[9px]">CAD/DXF</Badge>
                </div>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  <div>Estado: {dxfEvidenceSource.verificationStatus}</div>
                  <div className="truncate">Hash: {dxfEvidenceSource.excerptHash}</div>
                  <div className="truncate">Doc: {dxfEvidenceSource.documentId}</div>
                </div>
                <div className="mt-1 truncate text-blue-800">{dxfEvidenceSource.excerpt}</div>
                <div className="mt-0.5 truncate text-blue-700">{dxfEvidenceSource.notes}</div>
              </div>
            )}
            <div data-testid="f125-memoria-evidence-gate" className="col-span-6 rounded border border-amber-100 bg-amber-50 px-2 py-1 text-amber-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F125 contrato calculo-memoria-evidencia</div>
                <Badge className="h-4 bg-amber-100 text-amber-800 text-[9px]">{f125Gate.completeCount}/{f125Gate.resultCount} completos</Badge>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-1">
                <div>Revision: {f125Gate.reviewRequiredCount}</div>
                <div>Sin resultado: {f125Gate.missingResultCount}</div>
                <div>Siguiente: {f125Gate.nextPhase}</div>
              </div>
              <div className="mt-1 truncate">Campos: {f125Gate.requiredFields.join(', ')}</div>
            </div>
            <div data-testid="memoria-f91-improvement-plan" className="col-span-6 rounded border border-sky-100 bg-sky-50 px-2 py-1 text-sky-800">
              <div className="font-semibold">F91+ mejoras IA priorizadas</div>
              <div className="mt-1 grid grid-cols-1 gap-0.5">
                {memoriaAIPlan.slice(0, 3).map(item => (
                  <div key={item} className="truncate">{item}</div>
                ))}
              </div>
            </div>
            <div data-testid="f102-memoria-design-plan" className="col-span-6 rounded border border-fuchsia-100 bg-fuchsia-50 px-2 py-1 text-fuchsia-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F102 paso a paso para diseno de MA</div>
                <Badge className="h-4 bg-fuchsia-100 text-fuchsia-700 text-[9px]">{f102DesignPlan.score}% listo</Badge>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <div className="rounded bg-white/70 border border-fuchsia-100 px-2 py-1">
                  <div className="text-[8px] uppercase text-fuchsia-500 font-bold">Equipo</div>
                  <div className="truncate">{f102DesignPlan.equipmentSummary}</div>
                </div>
                <div className="rounded bg-white/70 border border-fuchsia-100 px-2 py-1">
                  <div className="text-[8px] uppercase text-fuchsia-500 font-bold">Norma</div>
                  <div className="truncate">{f102DesignPlan.recommendedStandard}</div>
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                {f103WorkflowActions.map(({ step: item, action }) => (
                  <div key={item.id} data-testid={`f102-step-${item.id}`} className="flex items-center gap-1 rounded bg-white/60 border border-fuchsia-100 px-2 py-1">
                    <span className={`h-2 w-2 rounded-full ${
                      item.status === 'complete' ? 'bg-emerald-500'
                        : item.status === 'active' ? 'bg-amber-500'
                          : item.status === 'blocked' ? 'bg-red-500' : 'bg-slate-300'
                    }`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold truncate">{item.title}</span>
                      <span className="block text-[8px] text-fuchsia-600 truncate">{action?.detail ?? item.action}</span>
                    </span>
                    <span className="text-[8px] uppercase text-fuchsia-500">{item.status}</span>
                    {action && (
                      <Button
                        type="button"
                        size="sm"
                        variant={item.status === 'complete' ? 'outline' : 'default'}
                        className="h-5 px-1.5 text-[8px]"
                        data-testid={`f103-action-${item.id}`}
                        onClick={() => runF103WorkflowAction(item.id)}
                      >
                        {action.label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div data-testid="f102-next-best-action" className="mt-1 flex items-center gap-2 rounded bg-white/70 border border-fuchsia-100 px-2 py-1">
                <span className="min-w-0 flex-1"><span className="font-semibold">Siguiente:</span> {f102DesignPlan.nextBestAction}</span>
                {f103WorkflowActions.find(({ step: item }) => item.status !== 'complete')?.action && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-5 px-1.5 text-[8px]"
                    data-testid="f103-next-action"
                    onClick={() => {
                      const next = f103WorkflowActions.find(({ step: item }) => item.status !== 'complete');
                      if (next) runF103WorkflowAction(next.step.id);
                    }}
                  >
                    Resolver
                  </Button>
                )}
              </div>
            </div>
            <div data-testid="f117-modality-handoff-memoria" className="col-span-6 rounded border border-cyan-100 bg-cyan-50 px-2 py-1 text-cyan-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F117 perfil activo a Memoria IA</div>
                <Badge className="h-4 bg-cyan-100 text-cyan-700 text-[9px]">{f117Handoff.activeProfile.label}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <div className="rounded bg-white/70 border border-cyan-100 px-2 py-1">
                  <div className="text-[8px] uppercase text-cyan-500 font-bold">Memoria</div>
                  <div className="truncate">{f117Handoff.memoriaDefaults.reportType}</div>
                </div>
                <div className="rounded bg-white/70 border border-cyan-100 px-2 py-1">
                  <div className="text-[8px] uppercase text-cyan-500 font-bold">Reporte</div>
                  <div className="truncate">{f117Handoff.reportDefaults.templateId}</div>
                </div>
              </div>
              <div className="mt-1 truncate">Normas: {f117Handoff.evidenceDefaults.priorityDocuments.join(', ')}</div>
              <div className="truncate">RAG: {f117Handoff.evidenceDefaults.ragQueries[0]}</div>
              <div className="mt-1 flex items-center gap-2 rounded bg-white/70 border border-cyan-100 px-2 py-1">
                <span className="min-w-0 flex-1 truncate">
                  F118 sugerido: {f118SuggestedEquipmentKey ? EQUIPMENT_DB[f118SuggestedEquipmentKey].name : 'sin equipo compatible'}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-5 px-1.5 text-[8px]"
                  data-testid="f118-apply-suggested-equipment"
                  disabled={!f118SuggestedEquipmentKey}
                  onClick={() => {
                    if (f118SuggestedEquipmentKey) {
                      handleEquipmentSelect(f118SuggestedEquipmentKey);
                      setStep(1);
                    }
                  }}
                >
                  Usar
                </Button>
              </div>
            </div>
            <div data-testid="f142-material-evidence-memoria" className="col-span-6 rounded border border-green-100 bg-green-50 px-2 py-1 text-green-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F142 evidencia material para Memoria IA</div>
                <Badge className="h-4 bg-green-100 text-green-700 text-[9px]">{f142MaterialEvidence.citations.length} fuentes</Badge>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {f142MaterialEvidence.citations.slice(0, 4).map((item) => (
                  <div key={item.source} className="rounded bg-white/70 border border-green-100 px-2 py-1">
                    <div className="text-[8px] uppercase text-green-600 font-bold truncate">{item.source}</div>
                    <div className="truncate">{item.title}</div>
                    <div className="text-[8px] text-green-700 truncate">{item.chunks} chunks | {item.pages}</div>
                  </div>
                ))}
              </div>
              <div className="mt-1 rounded bg-white/70 border border-green-100 px-2 py-1">
                <div className="font-semibold">Instruccion IA</div>
                <div className="truncate">{f142MaterialEvidence.aiInstructions[0]}</div>
              </div>
              <div className="mt-1 truncate">Pendientes: {f142MaterialEvidence.pendingDocuments.join(' | ')}</div>
            </div>
            <div data-testid="f144-source-governance-memoria" className="col-span-6 rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-indigo-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F144 fuentes canonicas y perfiles MA</div>
                <Badge className="h-4 bg-indigo-100 text-indigo-700 text-[9px]">{f144SourceGovernance.sources.length} fuentes</Badge>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {f144SourceGovernance.memoryProfiles.map((profile) => (
                  <div key={profile.modality} className="rounded bg-white/70 border border-indigo-100 px-2 py-1">
                    <div className="text-[8px] uppercase text-indigo-600 font-bold truncate">{profile.modality}</div>
                    <div className="truncate">{profile.requiredNormativeSources.join(' + ')}</div>
                    <div className="text-[8px] text-indigo-700 truncate">{profile.supportingSources.join(' | ')}</div>
                  </div>
                ))}
              </div>
              <div className="mt-1 rounded bg-white/70 border border-indigo-100 px-2 py-1">
                <div className="font-semibold">Revision metodologia</div>
                <div className="truncate">{f144SourceGovernance.methodologyReview[0]}</div>
              </div>
              <div className="mt-1 truncate">Pendientes: {f144SourceGovernance.remainingImprovements.join(' | ')}</div>
            </div>
            <div data-testid="f148-memory-profile-selector" className="col-span-6 rounded border border-violet-100 bg-violet-50 px-2 py-1 text-violet-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F148 perfil de memoria por modalidad</div>
                <Badge className="h-4 bg-violet-100 text-violet-700 text-[9px]">{f148ActiveProfile.key}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-1">
                <div className="col-span-1">
                  <Select value={selectedMemoryProfile} onValueChange={(value) => setSelectedMemoryProfile(value as F148MemoryProfileKey)}>
                    <SelectTrigger data-testid="f148-memory-profile-select" className="h-7 text-[10px] bg-white/80 border-violet-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f148ProfileSelector.options.map((option) => (
                        <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 rounded bg-white/70 border border-violet-100 px-2 py-1">
                  <div className="truncate">{f148ActiveProfile.description}</div>
                  <div className="text-[8px] text-violet-700 truncate">Normas: {f148ActiveProfile.profile.requiredNormativeSources.join(' + ')}</div>
                </div>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <div className="rounded bg-white/70 border border-violet-100 px-2 py-1">
                  <div className="text-[8px] uppercase text-violet-600 font-bold">Inputs</div>
                  <div className="truncate">{f148ActiveProfile.requiredInputs.join(' | ')}</div>
                </div>
                <div className="rounded bg-white/70 border border-violet-100 px-2 py-1">
                  <div className="text-[8px] uppercase text-violet-600 font-bold">Advertencias</div>
                  <div className="truncate">{f148ActiveProfile.exportWarnings.join(' | ')}</div>
                </div>
              </div>
            </div>
            <div data-testid="f146-material-report-appendix-memoria" className="col-span-6 rounded border border-amber-100 bg-amber-50 px-2 py-1 text-amber-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F146 anexo de materiales para reporte</div>
                <Badge className="h-4 bg-amber-100 text-amber-700 text-[9px]">{f146MaterialAppendix.totals.reviewRequired} revisar</Badge>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-[9px]">
                <div className="rounded bg-white/70 border border-amber-100 px-2 py-1">Barreras: {f146MaterialAppendix.totals.barriers}</div>
                <div className="rounded bg-white/70 border border-amber-100 px-2 py-1">Materiales: {f146MaterialAppendix.totals.materials.length}</div>
                <div className="rounded bg-white/70 border border-amber-100 px-2 py-1">Peso: {f146MaterialAppendix.totals.totalWeight_kg.toFixed(1)} kg</div>
                <div className="rounded bg-white/70 border border-amber-100 px-2 py-1">Costo: USD {f146MaterialAppendix.totals.estimatedCostUSD.toFixed(0)}</div>
              </div>
              <div className="mt-1 truncate">
                {f146MaterialAppendix.rows.slice(0, 3).map((row) => `${row.barrierName}: ${row.materialCode} ${row.thickness_mm.toFixed(0)}mm ${row.citationHash}`).join(' | ') || 'Sin barreras/materiales activos.'}
              </div>
              <div className="mt-1 text-[8px] text-amber-700 truncate">{f146MaterialAppendix.exportWarnings.join(' | ')}</div>
            </div>
            <div data-testid="f149-normative-numeric-qa-memoria" className="col-span-6 rounded border border-rose-100 bg-rose-50 px-2 py-1 text-rose-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F149 QA numerico normativo</div>
                <Badge className="h-4 bg-rose-100 text-rose-700 text-[9px]">{f149NormativeQa.releaseReady ? 'release ready' : 'bloqueado'}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-[9px]">
                <div className="rounded bg-white/70 border border-rose-100 px-2 py-1">Suite: {f149NormativeQa.canonicalSuite.passed}/{f149NormativeQa.canonicalSuite.total}</div>
                <div className="rounded bg-white/70 border border-rose-100 px-2 py-1">F149: {f149NormativeQa.totals.passed}/{f149NormativeQa.totals.total}</div>
                <div className="rounded bg-white/70 border border-rose-100 px-2 py-1">Review: {f149NormativeQa.totals.review}</div>
                <div className="rounded bg-white/70 border border-rose-100 px-2 py-1">Fail: {f149NormativeQa.totals.failed}</div>
              </div>
              <div className="mt-1 truncate">{f149NormativeQa.cases.slice(0, 3).map((item) => `${item.id}:${item.status}`).join(' | ')}</div>
              <div className="mt-1 text-[8px] text-rose-700 truncate">{f149NormativeQa.nextPhase}</div>
            </div>
            <div data-testid="f208-canvas-reporting-memoria" className="col-span-6 rounded border border-cyan-100 bg-cyan-50 px-2 py-1 text-cyan-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F208 canvas reportable para Memoria IA</div>
                <Badge className="h-4 bg-cyan-100 text-cyan-700 text-[9px]">{f208CanvasReporting.score}%</Badge>
              </div>
              <div className="mt-1 grid grid-cols-6 gap-1">
                {f208CanvasReporting.items.map((item) => (
                  <div key={item.id} className="rounded bg-white/70 border border-cyan-100 px-2 py-1">
                    <div className="text-[8px] uppercase text-cyan-600 font-bold">{item.label}</div>
                    <div className="truncate">{item.status}</div>
                  </div>
                ))}
              </div>
              <div className="mt-1 truncate">{f208CanvasReporting.nextActions.join(' | ')}</div>
            </div>
            <div data-testid="f611-f615-memoria-productive-workflow" className="col-span-6 rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-950">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F611-F615 Memoria IA productiva</div>
                <Badge className="h-4 bg-emerald-100 text-emerald-700 text-[9px]">{f591GeneralImprovements.status}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-6 gap-1 text-[9px]">
                {['Plano', 'Equipo', 'Barreras', 'Calculo', 'Cita', 'PDF'].map((step) => (
                  <div key={step} className="rounded bg-white/75 border border-emerald-100 px-2 py-1 text-center font-semibold">
                    {step}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[9px]">
                {f591GeneralImprovements.tracks.slice(0, 3).map((track) => (
                  <div key={track.id} className="rounded bg-white/75 border border-emerald-100 px-2 py-1" title={track.nextAction}>
                    <div className="text-[8px] uppercase text-emerald-700 font-bold">{track.phaseRange}</div>
                    <div className="truncate">{track.status}</div>
                  </div>
                ))}
              </div>
              <div className="mt-1 truncate text-[8px] text-emerald-800">DB real, paginas/hash y revision FM/RSO siguen requeridas para claim clinico certificado.</div>
            </div>
            <div data-testid="f218-report-handoff-memoria" className="col-span-6 rounded border border-teal-100 bg-teal-50 px-2 py-1 text-teal-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F218 handoff visual para cierre documental</div>
                <Badge className="h-4 bg-teal-100 text-teal-700 text-[9px]">{f218ReportHandoff.status}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-[9px]">
                <div className="rounded bg-white/70 border border-teal-100 px-2 py-1">Listos: {f218ReportHandoff.readyCount}</div>
                <div className="rounded bg-white/70 border border-teal-100 px-2 py-1">Revision: {f218ReportHandoff.reviewCount}</div>
                <div className="rounded bg-white/70 border border-teal-100 px-2 py-1">Faltantes: {f218ReportHandoff.missingCount}</div>
                <div className="rounded bg-white/70 border border-teal-100 px-2 py-1">Total: {f218ReportHandoff.total}</div>
              </div>
              <div className="mt-1 truncate">{f218ReportHandoff.requiredAttachments.join(' | ')}</div>
            </div>
            <div data-testid="f367-f370-release-integration-memoria" className="col-span-6 rounded border border-purple-100 bg-purple-50 px-2 py-1 text-purple-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F367-F370 evidencia 3D + Unity + motores + beta</div>
                <Badge className="h-4 bg-purple-100 text-purple-700 text-[9px]">{f367F370ReleaseIntegration.status}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1">
                <div className="rounded bg-white/70 border border-purple-100 px-2 py-1">3D: {f367F370ReleaseIntegration.visualEvidence.documentSurfaces.length} superficies</div>
                <div className="rounded bg-white/70 border border-purple-100 px-2 py-1">Unity: {f367F370ReleaseIntegration.unityWebgl.mode}</div>
                <div className="rounded bg-white/70 border border-purple-100 px-2 py-1">MC: {f367F370ReleaseIntegration.externalEngines.engines.length} motores</div>
                <div className="rounded bg-white/70 border border-purple-100 px-2 py-1">Beta: {f367F370ReleaseIntegration.releaseGate.decision}</div>
              </div>
              <div className="mt-1 truncate">Capturas: {f367F370ReleaseIntegration.visualEvidence.minimumCapturePolicy}</div>
              <div className="mt-1 text-[8px] text-purple-700 truncate">Bloqueos: {f367F370ReleaseIntegration.releaseGate.blockedClaims.join(' | ')}</div>
            </div>
            <div data-testid="f409-output-surface-integration-memoria" className="col-span-6 rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-indigo-950">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F409 salidas reales F405-F408</div>
                <Badge className="h-4 bg-indigo-100 text-indigo-700 text-[9px]">{f409OutputIntegration.status}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-[9px]">
                <div className="rounded bg-white/70 border border-indigo-100 px-2 py-1">Listas: {f409OutputIntegration.readyCount}</div>
                <div className="rounded bg-white/70 border border-indigo-100 px-2 py-1">Revision: {f409OutputIntegration.reviewCount}</div>
                <div className="rounded bg-white/70 border border-indigo-100 px-2 py-1">Bloqueadas: {f409OutputIntegration.blockedCount}</div>
                <div className="rounded bg-white/70 border border-indigo-100 px-2 py-1">3D: {f409OutputIntegration.unity.status}</div>
              </div>
              <div className="mt-1 truncate">{f409OutputIntegration.surfaces.map((surface) => `${surface.label}:${surface.status}`).join(' | ')}</div>
              <div className="mt-1 text-[8px] text-indigo-700 truncate">{f409OutputIntegration.decision}</div>
            </div>
            <div data-testid="f149b-fastrad-export-smoke-memoria" className="col-span-6 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F149b FASTRAD + smoke export</div>
                <Badge className="h-4 bg-slate-200 text-slate-700 text-[9px]">{f149bFastradUtility.exportSmoke.releaseReady ? 'listo' : 'pendiente'}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[9px]">
                <div className="rounded bg-white/70 border border-slate-200 px-2 py-1">Adoptar: {f149bFastradUtility.adoptedNow.length}</div>
                <div className="rounded bg-white/70 border border-slate-200 px-2 py-1">Diferir: {f149bFastradUtility.deferred.length}</div>
                <div className="rounded bg-white/70 border border-slate-200 px-2 py-1">Externos: {f149bFastradUtility.rejectedForRadShield.length}</div>
              </div>
              <div className="mt-1 truncate">{f149bFastradUtility.adoptedNow.join(' | ')}</div>
              <div className="mt-1 text-[8px] text-slate-600 truncate">{f149bFastradUtility.nextPhase}</div>
            </div>
            <div data-testid="f149c-monte-carlo-gateway-memoria" className="col-span-6 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F149c Monte Carlo Gateway</div>
                <Badge className="h-4 bg-blue-100 text-blue-700 text-[9px]">{f149cMonteCarloGateway.exportPackage.releaseReady ? 'gateway listo' : 'validar'}</Badge>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-1 text-[9px]">
                <div className="rounded bg-white/70 border border-blue-100 px-2 py-1">Motores: {f149cMonteCarloGateway.engines.length}</div>
                <div className="rounded bg-white/70 border border-blue-100 px-2 py-1">Artefactos: {f149cMonteCarloGateway.exportPackage.artifacts.length}</div>
                <div className="rounded bg-white/70 border border-blue-100 px-2 py-1">Gates: {f149cMonteCarloGateway.validationGates.length}</div>
                <div className="rounded bg-white/70 border border-blue-100 px-2 py-1">Modo: externo</div>
              </div>
              <div className="mt-1 truncate">{f149cMonteCarloGateway.engines.slice(0, 4).map((engine) => engine.label).join(' | ')}</div>
              <div className="mt-1 text-[8px] text-blue-700 truncate">{f149cMonteCarloGateway.nextPhase}</div>
            </div>
            <div data-testid="f184-release-quality-memoria" className="col-span-6 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-900">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">F184 calidad integral antes de memoria/reporte</div>
                <Badge className="h-4 bg-emerald-100 text-emerald-700 text-[9px]">{f184ReleaseQuality.score}%</Badge>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[9px]">
                <div className="rounded bg-white/70 border border-emerald-100 px-2 py-1">Listo: {f184ReleaseQuality.readyCount}</div>
                <div className="rounded bg-white/70 border border-emerald-100 px-2 py-1">Parcial: {f184ReleaseQuality.partialCount}</div>
                <div className="rounded bg-white/70 border border-emerald-100 px-2 py-1">Falta: {f184ReleaseQuality.missingCount}</div>
              </div>
              <div className="mt-1 truncate">{f184ReleaseQuality.items.slice(0, 4).map((item) => `${item.scope}:${item.status}`).join(' | ')}</div>
              <div className="mt-1 text-[8px] text-emerald-700 truncate">{f184ReleaseQuality.decision}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-0 h-[55vh]">
          {/* Left: Form */}
          <div className="col-span-3 border-r overflow-hidden">
            <ScrollArea className="h-full px-5 py-3">
              {/* STEP 0: Project */}
              {step === 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Datos del Proyecto
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[10px]">Nombre del proyecto</Label><Input value={projectData.name} onChange={e => setProjectData(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Bunker LINAC 6MV - HGR 196" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Institución</Label><Input value={projectData.institution} onChange={e => setProjectData(p => ({ ...p, institution: e.target.value }))} placeholder="Hospital General Regional" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Responsable</Label><Input value={projectData.responsible} onChange={e => setProjectData(p => ({ ...p, responsible: e.target.value }))} placeholder="Físico Médico responsable" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Fecha</Label><Input value={projectData.date} onChange={e => setProjectData(p => ({ ...p, date: e.target.value }))} type="date" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Ubicación</Label><Input value={projectData.location} onChange={e => setProjectData(p => ({ ...p, location: e.target.value }))} placeholder="Ciudad, Estado" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Licencia CNSNS</Label><Input value={projectData.licenseNumber} onChange={e => setProjectData(p => ({ ...p, licenseNumber: e.target.value }))} placeholder="Ej: LM-XXXX-01" className="h-7 text-xs" /></div>
                  </div>
                </div>
              )}

              {/* STEP 1: Equipment */}
              {step === 1 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Selección de Equipo
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(EQUIPMENT_DB).map(([key, e]) => (
                      <button
                        key={key}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          selectedEquipment === key ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                        onClick={() => handleEquipmentSelect(key)}
                      >
                        <div className="text-[11px] font-semibold">{e.name}</div>
                        <div className="text-[9px] text-slate-400">{e.modality}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{e.energies.join(', ')}</div>
                      </button>
                    ))}
                  </div>
                  {eq && (
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-[11px]">
                      <div className="font-semibold text-violet-800 mb-1">{eq.name} — Datos NCRP 151</div>
                      <div className="text-violet-700 space-y-0.5">
                        <div><strong>Modalidad:</strong> {eq.modality}</div>
                        <div><strong>Energía:</strong> {eq.energies.join(', ')}</div>
                        <div><strong>Workload:</strong> {eq.workload_h_week} h/semana</div>
                        <div><strong>Dosis/fracción:</strong> {eq.typical_dose_Gy} Gy</div>
                        <div><strong>Pacientes/día:</strong> {eq.patient_throughput_day}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Workload */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Carga de Trabajo (Workload)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[10px]">Pacientes/semana</Label><Input value={workloadData.patientsPerWeek} onChange={e => setWorkloadData(p => ({ ...p, patientsPerWeek: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Fracciones/paciente</Label><Input value={workloadData.fractionsPerPatient} onChange={e => setWorkloadData(p => ({ ...p, fractionsPerPatient: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Dosis/fracción (Gy)</Label><Input value={workloadData.dosePerFraction} onChange={e => setWorkloadData(p => ({ ...p, dosePerFraction: e.target.value }))} type="number" step="0.1" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Haz/fracción</Label><Input value={workloadData.beamsPerFraction} onChange={e => setWorkloadData(p => ({ ...p, beamsPerFraction: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Horas/semana</Label><Input value={workloadData.workloadHours} onChange={e => setWorkloadData(p => ({ ...p, workloadHours: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">TADs/semana</Label><Input value={workloadData.tadsPerWeek} onChange={e => setWorkloadData(p => ({ ...p, tadsPerWeek: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                  </div>
                  {eq && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border">
                      <strong>Valores de referencia NCRP 151 para {eq.name}:</strong> {eq.workload_h_week} h/semana, {eq.patient_throughput_day} pacientes/día, {eq.typical_dose_Gy} Gy/fracción
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Barriers */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Configuración de Barreras
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[10px]">Número de barreras</Label><Input value={barrierData.numBarriers} onChange={e => setBarrierData(p => ({ ...p, numBarriers: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Altura techo (m)</Label><Input value={barrierData.ceilingHeight} onChange={e => setBarrierData(p => ({ ...p, ceilingHeight: e.target.value }))} type="number" step="0.1" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Espesor piso (cm)</Label><Input value={barrierData.floorThickness} onChange={e => setBarrierData(p => ({ ...p, floorThickness: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Espesor puerta Pb (mm)</Label><Input value={barrierData.doorThicknessPb} onChange={e => setBarrierData(p => ({ ...p, doorThicknessPb: e.target.value }))} type="number" className="h-7 text-xs" /></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <Label>¿Tiene laberinto?</Label><Switch checked={barrierData.hasMaze} onCheckedChange={v => setBarrierData(p => ({ ...p, hasMaze: v }))} />
                  </div>
                  {barrierData.hasMaze && (
                    <Select value={barrierData.mazeType} onValueChange={v => setBarrierData(p => ({ ...p, mazeType: v }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Tipo de laberinto" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple" className="text-xs">Laberinto simple (un giro)</SelectItem>
                        <SelectItem value="double" className="text-xs">Laberinto doble (dos giros)</SelectItem>
                        <SelectItem value="mcginley" className="text-xs">Método McGinley (NCRP 151)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <Label>¿Puerta de plomo?</Label><Switch checked={barrierData.hasLeadDoor} onCheckedChange={v => setBarrierData(p => ({ ...p, hasLeadDoor: v }))} />
                  </div>
                </div>
              )}

              {/* STEP 4: Calculations */}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5" /> Parámetros de Cálculo
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[10px]">TVL primario (mm concreto)</Label><Input value={calcResults.primaryTVL} onChange={e => setCalcResults(p => ({ ...p, primaryTVL: e.target.value }))} placeholder="Ej: 380" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">TVL secundario (mm concreto)</Label><Input value={calcResults.secondaryTVL} onChange={e => setCalcResults(p => ({ ...p, secondaryTVL: e.target.value }))} placeholder="Ej: 280" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">TVL neutrones (mm PE borado)</Label><Input value={calcResults.neutronTVL} onChange={e => setCalcResults(p => ({ ...p, neutronTVL: e.target.value }))} placeholder="Ej: 45" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Factor de ocupación (T)</Label><Input value={calcResults.occupancyFactor} onChange={e => setCalcResults(p => ({ ...p, occupancyFactor: e.target.value }))} placeholder="Ej: 1/16" className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Límite público (mSv/sem)</Label><Input value={calcResults.doseConstraintPublic} onChange={e => setCalcResults(p => ({ ...p, doseConstraintPublic: e.target.value }))} className="h-7 text-xs" /></div>
                    <div><Label className="text-[10px]">Límite trabajador (mSv/sem)</Label><Input value={calcResults.doseConstraintWorker} onChange={e => setCalcResults(p => ({ ...p, doseConstraintWorker: e.target.value }))} className="h-7 text-xs" /></div>
                  </div>
                  {eq && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-700">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      <strong>Referencia:</strong> {eq.regulatory_ref}. Los TVL dependen de la energía y material. Consulte las tablas del NCRP 151 para valores exactos.
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: AI Review */}
              {step === 5 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-violet-700 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> Revisión AI del Asistente
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Datos del proyecto', status: projectData.name && projectData.institution ? 'complete' : 'pending' },
                      { label: 'Equipo seleccionado', status: selectedEquipment ? 'complete' : 'pending' },
                      { label: 'Carga de trabajo', status: workloadData.patientsPerWeek ? 'complete' : 'pending' },
                      { label: 'Barreras configuradas', status: barrierData.numBarriers ? 'complete' : 'pending' },
                      { label: 'Parámetros de cálculo', status: calcResults.primaryTVL ? 'complete' : 'pending' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded border">
                        <span className="flex items-center gap-1.5">
                          {item.status === 'complete' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {item.label}
                        </span>
                        <Badge className={`text-[9px] h-4 ${item.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status === 'complete' ? 'Completo' : 'Pendiente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {eq && (
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-[11px] text-violet-800">
                      <Sparkles className="w-4 h-4 inline mr-1 text-violet-500" />
                      <strong>Sugerencias AI:</strong>
                      <ul className="list-disc ml-4 mt-1 space-y-0.5">
                        <li>Verificar que el workload no exceda {eq.workload_h_week} h/semana según NCRP 151</li>
                        <li>Confirmar factor de ocupación T para áreas adyacentes</li>
                        <li>Incluir análisis de skyshine si no hay techo blindado</li>
                        {eq.energies.some(e => e.includes('15') || e.includes('18')) && (
                          <li><strong>⚠ Obligatorio:</strong> Incluir blindaje de neutrones (NCRP 151 Sec. 5.4)</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: Export */}
              {step === 6 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Exportar Memoria
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="text-xs gap-1" onClick={exportPDF}>
                      <FileText className="w-3.5 h-3.5" /> Exportar HTML (imprimir PDF)
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={exportTXT}>
                      <Download className="w-3.5 h-3.5" /> Exportar TXT
                    </Button>
                  </div>
                  <div className="bg-slate-50 border rounded-lg p-2 text-[10px] text-slate-500">
                    <strong>Vista previa del contenido:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-[9px] max-h-[200px] overflow-y-auto">{generatedText.substring(0, 800)}...</pre>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: AI Chat + Preview */}
          <div className="col-span-2 flex flex-col bg-slate-50">
            <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab} className="flex-1 flex flex-col">
              <TabsList className="mx-2 mt-2 grid grid-cols-2 h-7">
                <TabsTrigger value="chat" className="text-[10px]">
                  <Bot className="w-3 h-3 mr-1" /> Asistente AI
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-[10px]">
                  <FileText className="w-3 h-3 mr-1" /> Vista previa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col mt-0 m-0">
                <ScrollArea className="flex-1 px-3 py-2">
                  <div className="space-y-2">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex gap-1.5 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === 'ai' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {msg.role === 'ai' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        </div>
                        <div className={`text-[10px] p-2 rounded-lg max-w-[90%] ${
                          msg.role === 'ai' ? 'bg-white border text-slate-700' : 'bg-blue-50 border border-blue-200 text-blue-800'
                        }`}>
                          <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                          {msg.suggestions && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {msg.suggestions.map((s, j) => (
                                <button key={j} className="text-[9px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded hover:bg-violet-100" onClick={() => { setUserInput(s); }}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t bg-white">
                  <div className="flex gap-1">
                    <Input value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUserMessage()} placeholder="Escribe tu pregunta..." className="h-7 text-[11px]" />
                    <Button size="sm" className="h-7 px-2" onClick={handleUserMessage}>
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-0 m-0 flex-1">
                <ScrollArea className="h-full px-3 py-2">
                  <pre className="text-[9px] whitespace-pre-wrap text-slate-600">{generatedText || 'Complete los pasos para generar la memoria analítica...'}</pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-white">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </Button>
          <div className="flex gap-1.5">
            {step > 0 && (
              <Button size="sm" variant="ghost" className="text-[10px] h-7" onClick={() => setStep(0)}>
                <RotateCcw className="w-3 h-3 mr-1" /> Reiniciar
              </Button>
            )}
            <Button size="sm" className="text-xs gap-1" onClick={() => {
              if (step < STEPS.length - 1) {
                setStep(step + 1);
                // Add contextual AI message
                if (step === 0) addAIMessage('¡Perfecto! Ahora selecciona el equipo de radioterapia. Tengo la base de datos del NCRP 151 lista para autocompletar los valores.');
                if (step === 1) addAIMessage('Excelente elección. Ahora configura la carga de trabajo. Los valores se han autocompletado con los datos de referencia del NCRP 151. Puedes modificarlos si tu instalación tiene valores diferentes.');
                if (step === 2) addAIMessage('Ahora define las barreras del bunker. Indica si hay laberinto y el tipo de puerta. Esto afectará significativamente los cálculos de blindaje.');
                if (step === 3) addAIMessage('Introduce los valores TVL (Tenth Value Layer) para el material de blindaje seleccionado. Puedes consultar las tablas del NCRP 151 o usar la Modeling Toolbox.');
                if (step === 4) addAIMessage('Revisando los datos ingresados... Verifico que todo esté completo antes de generar la memoria final.');
              }
            }}>
              {step === STEPS.length - 1 ? 'Finalizar' : 'Siguiente'} <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
