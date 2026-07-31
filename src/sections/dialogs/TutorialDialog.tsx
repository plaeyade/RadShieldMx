// =============================================================================
// TutorialDialog - Guia paso a paso para primer uso.
// F390 migra la guia a DialogShell para practicar con el canvas visible.
// =============================================================================
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DialogShell from '@/components/DialogShell';
import { ChevronRight, ChevronLeft, BookOpen, MousePointer, Calculator, FileText, Upload, CheckCircle } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const STEPS = [
  { title: 'Bienvenido a RadShield-MX', icon: BookOpen, desc: 'Sistema integral para diseno y calculo de blindajes radiologicos conforme a normativa mexicana e internacional.', color: 'blue' },
  { title: 'Paso 1: Cargar plano DXF', icon: Upload, desc: 'En la toolbar, haga clic en DXF para cargar su plano arquitectonico. Soporta LINE, CIRCLE, ARC, LWPOLYLINE y TEXT. Para DWG, use un proveedor externo o exporte primero a DXF.', color: 'indigo' },
  { title: 'Paso 2: Agregar fuente', icon: MousePointer, desc: 'En el canvas principal, dibuje la sala de tratamiento y posicione la fuente de radiacion en el isocentro o punto de emision principal.', color: 'teal' },
  { title: 'Paso 3: Dibujar barrera', icon: MousePointer, desc: 'Trace paredes, techo, piso y areas adyacentes. Use capas, snapping, cotas y seleccion para mantener trazabilidad geometrica.', color: 'amber' },
  { title: 'Paso 4: Calcular blindaje', icon: Calculator, desc: 'Abra calculo de blindaje, seleccione modalidad, equipo, energia, carga de trabajo, material, P/T/U y meta de diseno. Revise advertencias clinicas y normativa.', color: 'emerald' },
  { title: 'Paso 5: Generar memoria', icon: FileText, desc: 'Use Memoria IA para construir el documento desde plano/equipo hasta formula, cita, entrada, salida, evidencia y anexos.', color: 'violet' },
  { title: 'Completado', icon: CheckCircle, desc: 'Explore NCRP/IAEA/UAQ, biblioteca de equipos, materiales, Evidence Pack, 3D medico y reportes CNSNS. Todo resultado preliminar requiere revision del fisico medico/RSO.', color: 'green' },
];

export default function TutorialDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return (
    <DialogShell
      title="Tutorial guiado"
      subtitle="Guia movible para practicar sobre el floorplan - F390"
      gradientFrom="from-blue-600"
      gradientTo="to-indigo-700"
      maxWidth="max-w-xl"
      onClose={() => onOpenChange(false)}
    >
      <TutorialContent onOpenChange={onOpenChange} />
    </DialogShell>
  );
}

function TutorialContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const Icon = s.icon;
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  };
  const c = colors[s.color];

  return (
    <div data-testid="f390-tutorial-dialogshell" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={`${c.bg} ${c.border} flex items-start gap-4 border-b p-6`}>
        <div className={`${c.bg} ${c.text} ${c.border} rounded-xl border p-3`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">{s.title}</h2>
          <Badge variant="outline" className="mt-1 text-xs">Paso {step + 1} de {STEPS.length}</Badge>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm leading-relaxed text-slate-600">{s.desc}</p>
      </div>

      <div className="px-6 pb-2">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t p-4">
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Omitir</Button>
        <div className="flex gap-2">
          {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Anterior</Button>}
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)}>Siguiente<ChevronRight className="ml-1 h-4 w-4" /></Button>
          ) : (
            <Button size="sm" onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-4 w-4" />Finalizar</Button>
          )}
        </div>
      </div>
    </div>
  );
}
