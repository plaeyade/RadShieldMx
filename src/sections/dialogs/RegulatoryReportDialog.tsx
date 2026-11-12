/**
 * v110: Automated Regulatory Report Generator
 * Generates NOM-040/NOM-008-NUCL-2024/CNSNS compliant reports
 */
import { useState } from 'react';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
// Fase 11: sólo cuenta el requerido con traza del motor (un espesor tecleado no «cumple»).
import { verificarBarrera } from '@/lib/estadoProyecto';
import { NOTA_NO_REQUIERE } from '@/lib/verificacionBlindaje';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { buildAnalyticMemoryEvidenceSection, buildAnalyticMemorySnapshot } from '@/lib/analyticMemoryEvidence';
import type { FloorPlan } from '@/types/radshield';
import { FileText, Download, CheckCircle, Building2, Shield, Calendar, User } from 'lucide-react';

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  floorPlan?: FloorPlan;
}

export default function RegulatoryReportDialog({ open: controlledOpen, onOpenChange, floorPlan: liveFloorPlan }: Props) {
  const storeOpen = useAppStore(s => Boolean(s.dialogs.regulatoryReport));
  const close = () => useAppStore.getState().close('regulatoryReport');
  const open = controlledOpen ?? storeOpen;
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) close();
  };
  const storedFloorPlan = useCanvasStore(s => s.floorPlan);
  const floorPlan = liveFloorPlan ?? storedFloorPlan;
  const evidenceSnapshot = buildAnalyticMemorySnapshot(floorPlan);
  const evidenceSection = buildAnalyticMemoryEvidenceSection(floorPlan);
  const [facilityName, setFacilityName] = useState('Hospital General');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [physicistName, setPhysicistName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [exported, setExported] = useState(false);

  const generateReport = () => {
    const now = new Date().toLocaleDateString('es-MX');
    // Fase 10 (revisión): antes cualquier barrera con P > 0 salía «CUMPLE» sin cálculo ni espesor instalado.
    // El estado sale de `verificarBarrera` (instalado ≥ requerido), igual que el tablero y el cálculo por lotes.
    const ESTADO: Record<string, string> = { CUMPLE: 'CUMPLE', NO_CUMPLE: 'NO CUMPLE', SIN_CALCULO: 'SIN CÁLCULO', SIN_ESPESOR: 'SIN ESPESOR INSTALADO', REVISAR_MATERIAL: 'REVISAR MATERIAL' };
    const barriers = floorPlan.barriers.map(b => {
      const v = verificarBarrera(b);
      return {
        name: b.name, type: b.barrierType, material: b.materialCode,
        useFactor: b.useFactor, occupancyFactor: b.occupancyFactor,
        designGoal: b.designGoal_mSv_per_wk, status: v.nota === NOTA_NO_REQUIERE ? 'NO REQUIERE BLINDAJE ADICIONAL' : ESTADO[v.estado] ?? v.estado,
        requerido_mm: v.requerido_mm, instalado_mm: v.instalado_mm,
      };
    });

    const report = {
      memoria_analitica: {
        titulo: `Memoria Analitica de Blindajes — ${floorPlan.name || 'Proyecto'}`,
        version: 'RadShield-MX v110',
        fecha: now,
        instalacion: { nombre: facilityName, direccion: facilityAddress },
        responsable: { nombre: physicistName, cedula: licenseNumber },
        normativa: ['NOM-008-NUCL-2024', 'NOM-040-NUCL-2016', 'NOM-013-NUCL-2013', 'CNSNS-L-010-2015'],
        resumen: {
          total_barreras: floorPlan.barriers.length,
          total_fuentes: floorPlan.sources.length,
          total_regiones: floorPlan.occupiedRegions.length,
          puntos_criticos_f86: evidenceSnapshot.criticalPoints,
          cobertura_presets_f86_pct: evidenceSnapshot.presetCoveragePct,
          barreras_cumplen: barriers.filter(b => b.status === 'CUMPLE').length,
          barreras_no_cumplen: barriers.filter(b => b.status === 'NO CUMPLE').length,
          barreras_pendientes: barriers.filter(b => b.status !== 'CUMPLE' && b.status !== 'NO CUMPLE').length,
        },
        evidencia_canvas_f76: {
          snapshot: evidenceSnapshot,
          apendice_memoria: evidenceSection,
        },
        barreras: barriers,
        fuentes: floorPlan.sources.map(s => ({
          nombre: s.name, modalidad: s.modality?.name,
          energia: s.modality?.energies, carga: s.workloadValue, unidad: s.workloadUnit,
          posicion: { x: s.x, y: s.y },
        })),
        regiones: floorPlan.occupiedRegions.map(r => ({
          nombre: r.name, factor_ocupacion: r.occupancyFactor,
          meta_dosis: r.designGoal_mSv_per_wk,
        })),
        conclusion: `El presente estudio evalua ${floorPlan.barriers.length} barreras de blindaje conforme a NCRP 147/151 y normativa mexicana.`,
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoria_analitica_${floorPlan.name?.replace(/\s+/g, '_') || 'radshield'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" data-testid="regulatory-report-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-amber-600" /> Regulatory Report (v110)
            <Badge variant="outline" className="text-[9px]">NOM-008/040</Badge>
          </DialogTitle>
        </DialogHeader>
        <AvisoProyectoVacio floorPlan={floorPlan} className="mb-2" />
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2"><Building2 className="w-3 h-3 text-slate-400" /><input value={facilityName} onChange={e => setFacilityName(e.target.value)} className="text-[11px] border rounded px-2 py-1 flex-1" placeholder="Nombre de la instalacion" /></div>
          <div className="flex items-center gap-2"><Shield className="w-3 h-3 text-slate-400" /><input value={facilityAddress} onChange={e => setFacilityAddress(e.target.value)} className="text-[11px] border rounded px-2 py-1 flex-1" placeholder="Direccion" /></div>
          <div className="flex items-center gap-2"><User className="w-3 h-3 text-slate-400" /><input value={physicistName} onChange={e => setPhysicistName(e.target.value)} className="text-[11px] border rounded px-2 py-1 flex-1" placeholder="Nombre del fisico medico responsable" /></div>
          <div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-slate-400" /><input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="text-[11px] border rounded px-2 py-1 flex-1" placeholder="Cedula profesional / Licencia CNSNS" /></div>
        </div>
        <div data-testid="regulatory-report-evidence-f76" className="bg-slate-50 rounded-md p-2 mb-3 text-[10px] space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Barreras:</span><span className="font-medium">{floorPlan.barriers.length}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Fuentes:</span><span className="font-medium">{floorPlan.sources.length}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Regiones:</span><span className="font-medium">{floorPlan.occupiedRegions.length}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Puntos criticos F86:</span><span className="font-medium">{evidenceSnapshot.criticalPoints}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Presets F86:</span><span className="font-medium">{evidenceSnapshot.presetCoveragePct}%</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Evidencia F76:</span><span className="font-medium">{evidenceSnapshot.standards.join(', ') || 'canvas local'}</span></div>
        </div>
        <div className="text-[9px] text-slate-500 bg-amber-50 rounded-md p-2 mb-3">
          Normativa incluida: NOM-008-NUCL-2024 | NOM-040-NUCL-2016 | NOM-013-NUCL-2013 | CNSNS-L-010-2015
        </div>
        <Button onClick={generateReport} className="w-full h-8 text-[11px] bg-amber-600 hover:bg-amber-700">
          {exported ? <><CheckCircle className="w-3 h-3 mr-1" />Exportado</> : <><Download className="w-3 h-3 mr-1" />Generar Memoria Analitica JSON</>}
        </Button>
        <p className="text-[8px] text-slate-400 mt-2">Formato: JSON estructurado para importacion a sistemas regulatorios mexicanos</p>
      </DialogContent>
    </Dialog>
  );
}
