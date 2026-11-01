import { useState } from 'react';
import { X, Send, CheckCircle2, AlertTriangle, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FormSection { title: string; fields: Array<{ label: string; value: string; status: 'complete' | 'pending' | 'error' }>; }

const FORM_SECTIONS: FormSection[] = [
  { title: 'I. Datos Generales', fields: [
    { label: 'Nombre de la Instalacion', value: 'Hospital General Dr. Perez', status: 'complete' },
    { label: 'Direccion', value: 'Av. Principal 123, CDMX', status: 'complete' },
    { label: 'Licencia CNSNS', value: 'LI-2019-0847', status: 'complete' },
    { label: 'Responsable', value: 'Dr. Carlos Martinez', status: 'complete' },
  ]},
  { title: 'II. Equipo', fields: [
    { label: 'Tipo de Equipo', value: 'Acelerador Lineal 6 MV', status: 'complete' },
    { label: 'Marca/Modelo', value: 'Varian TrueBeam', status: 'complete' },
    { label: 'Numero de Serie', value: 'TB-2019-MX-0042', status: 'complete' },
    { label: 'Energia Maxima', value: '6 MV X-rays', status: 'complete' },
  ]},
  { title: 'III. Blindaje', fields: [
    { label: 'Pared Primaria', value: 'Concreto 2.35 g/cm3, 180 cm', status: 'complete' },
    { label: 'Pared Secundaria', value: 'Concreto 2.35 g/cm3, 120 cm', status: 'complete' },
    { label: 'Laberinto', value: 'Tipo McGinley, L=6.5 m', status: 'complete' },
    { label: 'Techo', value: 'Concreto 160 cm', status: 'pending' },
  ]},
  { title: 'IV. Calculos', fields: [
    { label: 'Metodologia', value: 'NCRP 151 (2005)', status: 'complete' },
    { label: 'Factor de Uso', value: '1.0 (Primaria)', status: 'complete' },
    { label: 'Factor de Ocupacion', value: '1.0 / 0.2 / 0.125', status: 'complete' },
    { label: 'Meta de Diseno', value: '0.02 mSv/semana', status: 'complete' },
  ]},
];

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function CNSNSDigitalSubmission({ open, onOpenChange }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success('Report submitted to CNSNS', { description: 'Folio: CNSNS-RP-2026-0042' });
  };

  if (!open) return null;

  const totalFields = FORM_SECTIONS.reduce((a, s) => a + s.fields.length, 0);
  const completedFields = FORM_SECTIONS.reduce((a, s) => a + s.fields.filter(f => f.status === 'complete').length, 0);
  const pendingFields = FORM_SECTIONS.reduce((a, s) => a + s.fields.filter(f => f.status === 'pending').length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-slate-800">CNSNS Digital Submission</h2>
            <span className="text-[10px] text-slate-400">Formato estructurado para CNSNS</span>
          </div>
          <button aria-label="Cerrar CNSNS Digital Submission" onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Submission Successful</h3>
              <p className="text-sm text-slate-500 mb-1">Folio: CNSNS-RP-2026-0042</p>
              <p className="text-xs text-slate-400">Submitted on: {new Date().toLocaleString()}</p>
              <Button className="mt-4 bg-[#f97316] hover:bg-[#ea580c] text-white" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-4 bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                    {Math.round((completedFields / totalFields) * 100)}%
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700">Form Completion</p>
                    <p className="text-[10px] text-slate-400">{completedFields}/{totalFields} fields complete</p>
                  </div>
                </div>
                {pendingFields > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />{pendingFields} pending
                  </div>
                )}
              </div>

              {/* Sections */}
              <div className="space-y-3">
                {FORM_SECTIONS.map((section, si) => (
                  <div key={si} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-[11px] font-bold text-slate-700">{section.title}</h3>
                      <span className="text-[9px] text-slate-400">{section.fields.filter(f => f.status === 'complete').length}/{section.fields.length}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {section.fields.map((field, fi) => (
                        <div key={fi} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">{field.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 font-medium">{field.value}</span>
                            {field.status === 'complete' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                            {field.status === 'pending' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!submitted && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <Button size="sm" variant="outline" className="text-[11px] gap-1">
              <Download className="w-3.5 h-3.5" /> Export XML
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-[11px] gap-1" onClick={handleSubmit}>
              <Send className="w-3.5 h-3.5" /> Submit to CNSNS
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
