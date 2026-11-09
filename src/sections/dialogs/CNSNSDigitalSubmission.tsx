// Fase 9: el formulario se prellena desde el plano (`formularioCNSNS`: fuentes, barreras con requerido/instalado y
// verificación, normativa, T y P); los datos de la instalación quedan «Por completar». Antes los campos eran de un
// hospital ficticio y «Enviar» simulaba un folio de la CNSNS. RadShield-MX no tiene canal de envío a la CNSNS: el envío
// queda desactivado y sólo se exporta el formulario para revisarlo y presentarlo por la vía oficial.
import { useMemo } from 'react';
import { X, CheckCircle2, AlertTriangle, Shield, Download, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCanvasStore } from '@/stores/canvasStore';
import { formularioCNSNS } from '@/lib/estadoProyecto';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function CNSNSDigitalSubmission({ open, onOpenChange }: Props) {
  const floorPlan = useCanvasStore((s) => s.floorPlan);
  const secciones = useMemo(() => formularioCNSNS(floorPlan), [floorPlan]);

  if (!open) return null;

  const campos = secciones.flatMap((s) => s.fields);
  const totalFields = campos.length;
  const completedFields = campos.filter((f) => f.status === 'complete').length;
  const pendingFields = campos.filter((f) => f.status === 'pending').length;
  const errorFields = campos.filter((f) => f.status === 'error').length;

  const exportar = () => {
    const datos = { borrador: true, documentoOficial: false, proyecto: floorPlan.name, generado: new Date().toISOString(), aviso: 'Borrador generado por RadShield-MX a partir del proyecto; revisar, completar y firmar por el responsable.', secciones };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `BORRADOR_no_oficial_formulario_cnsns_${floorPlan.id}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Formulario exportado (borrador)');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cnsns-digital-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            <h2 id="cnsns-digital-title" className="text-sm font-bold text-slate-800">Envío digital a CNSNS</h2>
            <span className="text-[10px] text-slate-400">Formulario prellenado desde el proyecto «{floorPlan.name}»</span>
          </div>
          <button aria-label="Cerrar CNSNS Digital Submission" onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <p data-testid="cnsns-envio-desactivado" role="note" className="mx-4 mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Envío desactivado.</strong> RadShield-MX no tiene conexión con la CNSNS. Complete los datos de la instalación,
          exporte el borrador y preséntelo por la vía oficial.
        </p>

        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 bg-slate-50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                {totalFields ? Math.round((completedFields / totalFields) * 100) : 0}%
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-700">Campos completos</p>
                <p data-testid="cnsns-completos" className="text-[10px] text-slate-400">{completedFields}/{totalFields} campos completos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              {pendingFields > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" />{pendingFields} pendientes</span>}
              {errorFields > 0 && <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3.5 h-3.5" />{errorFields} con problema</span>}
            </div>
          </div>

          <div className="space-y-3">
            {secciones.map((section) => (
              <div key={section.title} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-700">{section.title}</h3>
                  <span className="text-[9px] text-slate-400">{section.fields.filter((f) => f.status === 'complete').length}/{section.fields.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {section.fields.map((field, fi) => (
                    <div key={`${field.label}-${fi}`} className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-600">{field.label}</span>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-slate-800 font-medium">{field.value}</span>
                        {field.status === 'complete' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />}
                        {field.status === 'pending' && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
                        {field.status === 'error' && <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button size="sm" variant="outline" className="text-[11px] gap-1" onClick={exportar}>
            <Download className="w-3.5 h-3.5" /> Exportar borrador (JSON)
          </Button>
          <Button size="sm" disabled title="Sin canal de envío a la CNSNS" className="bg-red-600 text-white text-[11px] gap-1">
            <Send className="w-3.5 h-3.5" /> Enviar a CNSNS (no disponible)
          </Button>
        </div>
      </div>
    </div>
  );
}
