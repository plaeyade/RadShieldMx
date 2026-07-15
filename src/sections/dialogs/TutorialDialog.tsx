// =============================================================================
// TutorialDialog — Guía paso a paso para primer uso (v14.2)
// =============================================================================
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, X, BookOpen, MousePointer, Calculator, FileText, Upload, CheckCircle } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const STEPS = [
  { title: 'Bienvenido a RadShield-MX', icon: BookOpen, desc: 'Sistema integral para diseño y cálculo de blindajes radiológicos conforme a normativa mexicana e internacional.', color: 'blue' },
  { title: 'Paso 1: Cargar plano DXF', icon: Upload, desc: 'En la toolbar, haga clic en "DXF" para cargar su plano arquitectónico. Soporta LINE, CIRCLE, ARC, LWPOLYLINE, TEXT. Para archivos DWG, exporte primero a DXF desde AutoCAD.', color: 'indigo' },
  { title: 'Paso 2: Agregar fuente', icon: MousePointer, desc: 'En el canvas principal, dibuje la sala de tratamiento y posicione la fuente de radiación (LINAC, Gamma Knife, etc.) en el isocentro.', color: 'teal' },
  { title: 'Paso 3: Dibujar barrera', icon: MousePointer, desc: 'Trace las paredes, techo y piso. Use las herramientas de dibujo para definir el perímetro de la sala y áreas adyacentes.', color: 'amber' },
  { title: 'Paso 4: Calcular blindaje', icon: Calculator, desc: 'Use el botón "Calc. Blindaje" (verde) para abrir la calculadora fullscreen con 14 tabs. Seleccione el equipo, energía, técnica y material. El sistema calculará el espesor y costo automáticamente.', color: 'emerald' },
  { title: 'Paso 5: Generar memoria', icon: FileText, desc: 'Use el botón "Memoria" para iniciar el wizard de 7 pasos. Complete los datos y exporte el reporte en PDF listo para entregar a CNSNS.', color: 'violet' },
  { title: 'Completado', icon: CheckCircle, desc: '¡Listo! Explore también: NCRP 151 (tablas de referencia), Wizard Blindaje (por equipo), Monte Carlo (simulación), y la Biblioteca de Equipos.', color: 'green' },
];

export default function TutorialDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <TutorialContent onOpenChange={onOpenChange} />;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-[560px] shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className={`${c.bg} ${c.border} border-b p-6 flex items-start gap-4`}>
            <div className={`${c.bg} ${c.text} p-3 rounded-xl border ${c.border}`}>
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{s.title}</h2>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
              </div>
              <Badge variant="outline" className="mt-1 text-xs">Paso {step + 1} de {STEPS.length}</Badge>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
          </div>

          {/* Progress */}
          <div className="px-6 pb-2">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 flex justify-between items-center border-t">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Omitir</Button>
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}><ChevronLeft className="w-4 h-4 mr-1" />Anterior</Button>}
              {step < STEPS.length - 1 ? (
                <Button size="sm" onClick={() => setStep(step + 1)}>Siguiente<ChevronRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button size="sm" onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-1" />Finalizar</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
