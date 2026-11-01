/**
 * CertificationModeDialog — E.7: Certification mode for CNSNS license
 * Guided process for CNSNS license application with checklists
 * NOM-008-NUCL-2018, NOM-040-NUCL-2016, CNSNS LA-007/01
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Award, Download, CheckCircle2 } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

interface ChecklistItem { id: string; label: string; norm: string; checked: boolean; category: string; }

const CNSNS_CHECKLIST: ChecklistItem[] = [
  // Documentación técnica
  { id: 'c1', label: 'Memoria descriptiva de blindaje (español)', norm: 'CNSNS LA-007/01 §4.1', checked: false, category: 'Documentación' },
  { id: 'c2', label: 'Planos arquitectónicos de la instalación', norm: 'CNSNS LA-007/01 §4.2', checked: false, category: 'Documentación' },
  { id: 'c3', label: 'Reporte de cálculo de blindaje (NCRP 147/151)', norm: 'NOM-008-NUCL-2018 §5.2', checked: false, category: 'Documentación' },
  { id: 'c4', label: 'Curvas de transmisión del fabricante', norm: 'NCRP 147 §4.3', checked: false, category: 'Documentación' },
  { id: 'c5', label: 'Especificaciones técnicas de materiales de blindaje', norm: 'CNSNS LA-007/01 §4.3', checked: false, category: 'Documentación' },
  // Cálculos
  { id: 'c6', label: 'Cálculo de barrera primaria (W, U, T, d, P)', norm: 'NCRP 147 §3.2 / NCRP 151 §3.1', checked: false, category: 'Cálculos' },
  { id: 'c7', label: 'Cálculo de barrera secundaria (scatter + leakage)', norm: 'NCRP 147 §4.1 / NCRP 151 §4.2', checked: false, category: 'Cálculos' },
  { id: 'c8', label: 'Cálculo de laberinto para neutrones (E>10 MV)', norm: 'NCRP 151 §5.3', checked: false, category: 'Cálculos' },
  { id: 'c9', label: 'Evaluación de skyshine (techo parcial)', norm: 'McGinley Ch.8', checked: false, category: 'Cálculos' },
  // Verificación
  { id: 'c10', label: 'Inspección visual de barreras instaladas', norm: 'NOM-040-NUCL-2016 §6.1', checked: false, category: 'Verificación' },
  { id: 'c11', label: 'Medición de espesores con ultrasonido', norm: 'NCRP 151 Appendix A', checked: false, category: 'Verificación' },
  { id: 'c12', label: 'Medición de dosis de fondo post-instalación', norm: 'NOM-008-NUCL-2018 §7.1', checked: false, category: 'Verificación' },
  { id: 'c13', label: 'Prueba de hermeticidad de puerta (if applicable)', norm: 'NCRP 151 §5.4', checked: false, category: 'Verificación' },
  // Programas
  { id: 'c14', label: 'Programa de protección radiológica autorizado', norm: 'NOM-008-NUCL-2018 §4', checked: false, category: 'Programas' },
  { id: 'c15', label: 'Designación de físico médico responsable', norm: 'NOM-008-NUCL-2018 §4.2', checked: false, category: 'Programas' },
  { id: 'c16', label: 'Programa de garantía de calidad del blindaje', norm: 'NOM-040-NUCL-2016 §5', checked: false, category: 'Programas' },
  { id: 'c17', label: 'Plan de contingencias para blindaje', norm: 'NOM-008-NUCL-2018 §8', checked: false, category: 'Programas' },
  { id: 'c18', label: 'Registro de bitácora de blindaje', norm: 'CNSNS LA-007/01 §5', checked: false, category: 'Programas' },
];

export default function CertificationModeDialog({ open, onClose }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(CNSNS_CHECKLIST);
  const [expandedCat, setExpandedCat] = useState<string | null>('Documentación');

  const toggle = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const completed = items.filter(i => i.checked).length;
  const progress = Math.round((completed / items.length) * 100);
  const categories = [...new Set(items.map(i => i.category))];

  const exportChecklist = () => {
    const date = new Date().toLocaleDateString('es-MX');
    let csv = `RadShield-MX - Checklist CNSNS LA-007/01\nFecha: ${date}\nProgreso: ${completed}/${items.length} (${progress}%)\n\n`;
    csv += 'ID,Categoria,Requisito,Norma,Cumple\n';
    items.forEach(i => { csv += `${i.id},"${i.category}","${i.label}","${i.norm}",${i.checked ? 'SI' : 'NO'}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `CNSNS_checklist_${date.replace(/\//g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Checklist exportado');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Modo Certificación CNSNS
            <Badge variant="outline" className="text-[10px]">E.7</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11px] text-amber-700 mb-3">
          <b>Checklist LA-007/01 — Licencia CNSNS:</b> Proceso guiado para solicitud de
          licencia de instalación de blindaje radiológico ante la CNSNS.
          Cumplimiento de NOM-008-NUCL-2018 y NOM-040-NUCL-2016.
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold">Progreso: {completed}/{items.length}</span>
            <span className={progress === 100 ? 'text-emerald-600 font-bold' : 'text-amber-600'}>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress === 100 && (
            <div className="text-center text-xs text-emerald-600 font-semibold mt-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Checklist completo — listo para sumisión CNSNS
            </div>
          )}
        </div>

        {categories.map(cat => (
          <div key={cat} className="mb-2">
            <button
              className="w-full text-left text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1.5 rounded flex items-center justify-between"
              onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
            >
              <span>{cat}</span>
              <span className="text-[10px] text-slate-400">
                {items.filter(i => i.category === cat && i.checked).length}/{items.filter(i => i.category === cat).length}
              </span>
            </button>
            {expandedCat === cat && (
              <div className="space-y-1 mt-1">
                {items.filter(i => i.category === cat).map(item => (
                  <div key={item.id} className="flex items-start gap-2 px-2 py-1.5 hover:bg-slate-50 rounded">
                    <Checkbox checked={item.checked} onCheckedChange={() => toggle(item.id)} className="mt-0.5" />
                    <div className="flex-1">
                      <div className={`text-[11px] ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.label}</div>
                      <div className="text-[9px] text-slate-400">{item.norm}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <Button variant="outline" size="sm" className="text-xs w-full mt-2" onClick={exportChecklist}>
          <Download className="w-3 h-3 mr-1" /> Export Checklist CSV
        </Button>
      </DialogContent>
    </Dialog>
  );
}
