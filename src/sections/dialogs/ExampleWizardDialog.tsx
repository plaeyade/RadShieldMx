import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, ChevronRight, ChevronLeft, CheckCircle2, Zap, CircleDot, Layers, BookOpen } from 'lucide-react';

interface WizardStep {
  title: string;
  description: string;
  content: string[];
  tip: string;
}

const EXAMPLES: Record<string, WizardStep[]> = {
  bunker_linac: [
    { title: 'Paso 1: Configurar Fuente', description: 'Definir el acelerador lineal', content: ['Seleccione "Acelerador Lineal" como tipo de fuente', 'Energia: 6 MV (fotones)', 'Tasa de dosis: 4 Gy/min al isocentro', 'TPR20/10: 0.67', 'Carga de trabajo: 300 Gy/semana (25 pacientes)'], tip: 'Para LINAC dual energy (6/15 MV), use 6 MV como energia primaria para calculos conservadores' },
    { title: 'Paso 2: Definir Barreras', description: 'Trazar el perimetro del bunker', content: ['Dibuje 4 paredes primarias/secundarias', 'Pared N (primaria): 120 cm concreto', 'Pared S (primaria): 120 cm concreto', 'Pared E (secundaria): 65 cm concreto', 'Pared O (secundaria): 65 cm concreto', 'Techo: 95 cm concreto', 'Suelo: 85 cm concreto'], tip: 'Use el Sketch Pad para dibujar el layout del bunker' },
    { title: 'Paso 3: Configurar Laberinto', description: 'Definir el acceso con maze', content: ['Longitud del laberinto: 4.5 m', 'Ancho: 1.8 m', 'Angulo de entrada: 90 grados', 'El laberinto reduce significativamente el espesor de la puerta'], tip: 'Sin laberinto, la puerta requiere ~8 cm Pb equivalente. Con laberinto: ~2 cm Pb+BaB2O4' },
    { title: 'Paso 4: Calcular', description: 'Ejecutar el calculo de blindaje', content: ['Click en "Calcular Blindaje" (F5)', 'Revise el tab "Pass/Fail"', 'Verifique que todas las barreras sean PASS', 'Si hay WARN/FAIL: ajuste espesor o considere barita'], tip: 'Un resultado WARN indica que el kerma esta entre 100-150% del limite. Considere margen adicional.' },
    { title: 'Paso 5: Generar Memoria', description: 'Documentar los resultados', content: ['Abra "Memoria Analitica" (Ctrl+M)', 'Complete los metadatos del proyecto', 'Genere el PDF con todos los calculos', 'Revise el reporte antes de entregar a CNSNS'], tip: 'La memoria incluye referencias bibliograficas validadas automaticamente' },
  ],
  pet_ct: [
    { title: 'Paso 1: Fuente PET-CT', description: 'Configurar F-18 FDG', content: ['Radionuclido: F-18 (Fluor-18)', 'Actividad por paciente: 370 MBq (10 mCi)', 'Pacientes por dia: 8', 'Dias por semana: 5', 'Energia gamma: 511 keV (aniquilacion)'], tip: 'Para Ga-68 DOTATATE: usar 150 MBq/paciente, misma energia 511 keV' },
    { title: 'Paso 2: Areas del Servicio', description: 'Definir areas de medicina nuclear', content: ['Sala de inyeccion: blindaje principal', 'Sala de espera: pacientes post-inyeccion', 'Sala de escaneo PET-CT', 'Sala de preparacion de radiofarmacos', 'Area de desecho'], tip: 'La sala de inyeccion requiere el mayor blindaje. El area de desecho tambien requiere atencion especial' },
    { title: 'Paso 3: Blindaje por Area', description: 'Calcular por separado', content: ['Sala inyeccion: 2.0 mm Pb en paredes', 'Sala espera: 1.5 mm Pb', 'Escaneo PET: 1.0 mm Pb (el paciente es la fuente)', 'Preparacion: 3.0 mm Pb + campana de flujo laminar', 'Desecho: 2.5 mm Pb'], tip: 'Use la tabla B.7 (Medicina Nuclear) para valores de HVL/TVL' },
    { title: 'Paso 4: Verificar Dosis', description: 'Comprobar limites', content: ['Personal: < 20 mSv/ano (NOM-008)', 'Publico: < 5 mSv/ano (NOM-008 Mexico)', 'Embarazadas: < 2 mSv post-concepcion', 'Use el Nuclide Data Viewer para DCFs'], tip: 'Mexico permite 5 mSv/ano para publico vs 1 mSv/ano en USA. Factor 5x diferencia' },
  ],
  gamma_knife: [
    { title: 'Paso 1: Fuente Co-60', description: 'Configurar Gamma Knife', content: ['192 fuentes de Co-60', 'Actividad total: ~222 TBq (6000 Ci)', 'Energia promedio: 1.25 MeV', 'Factor de uso (U): 0.05-0.1', 'Carga de trabajo: tipicamente baja'], tip: 'El Gamma Knife Perfexion usa collimadores variables de 4-16 mm' },
    { title: 'Paso 2: Geometria Especial', description: 'Considerar geometria hemiesferica', content: ['El blindaje debe cubrir 4pi esteradianos', 'Paredes primarias: mayor espesor (170 cm concreto tipico)', 'Techo: critico por carga en techo del edificio', 'Skyshine: evaluar con NCRP 151 §5.2'], tip: 'Para Gamma Knife, la geometria hemiesferica requiere TVL diferentes. Ver Tabla B.5' },
    { title: 'Paso 3: Calcular y Validar', description: 'Ejecutar calculos especificos', content: ['Use el Wizard por Equipo → Gamma Knife', 'Los parametros tecnicos estan pre-cargados', 'Revise cumplimiento con NCRP 151 §4.8.6', 'Genere memoria con referencias ICRU 57/96'], tip: 'Gamma Knife requiere validacion especifica. Consulte la biblioteca de referencias.' },
  ],
};

interface ExampleWizardDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ExampleWizardDialog({ open, onOpenChange }: ExampleWizardDialogProps) {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const example = selectedExample ? EXAMPLES[selectedExample] : null;

  const handleClose = () => {
    setSelectedExample(null);
    setStep(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="w-5 h-5 text-violet-500" />
            Wizard de Ejemplos — Paso a Paso
          </DialogTitle>
        </DialogHeader>

        {!selectedExample ? (
          <div className="px-6 pb-6 space-y-3">
            <p className="text-xs text-slate-500">Seleccione un ejemplo guiado para aprender a usar RadShield-MX:</p>
            {[
              { id: 'bunker_linac', name: 'Bunker LINAC 6 MV', desc: 'Bunker completo para acelerador lineal con laberinto', icon: Zap, modality: 'TX', steps: 5 },
              { id: 'pet_ct', name: 'Sala PET-CT FDG', desc: 'Blindaje para unidad PET-CT con F-18', icon: CircleDot, modality: 'NM', steps: 4 },
              { id: 'gamma_knife', name: 'Gamma Knife Perfexion', desc: 'Blindaje para radiocirugia Gamma Knife', icon: Layers, modality: 'TX', steps: 3 },
            ].map(ex => (
              <button key={ex.id} className="w-full text-left p-4 border rounded-lg hover:border-violet-300 hover:bg-violet-50/30 transition-all" onClick={() => setSelectedExample(ex.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <ex.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ex.name}</span>
                      <Badge className="text-[9px] h-4">{ex.modality}</Badge>
                      <Badge variant="outline" className="text-[9px] h-4">{ex.steps} pasos</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{ex.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        ) : example ? (
          <>
            <div className="px-6 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Paso {step + 1} de {example.length}</span>
                <span className="text-xs text-slate-500">{Math.round(((step + 1) / example.length) * 100)}%</span>
              </div>
              <Progress value={((step + 1) / example.length) * 100} className="h-2" />
            </div>

            <ScrollArea className="px-6 pb-4 max-h-[45vh]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{example[step].title}</h3>
                  <p className="text-sm text-slate-600">{example[step].description}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  {example[step].content.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-amber-800">Consejo profesional:</span>
                      <p className="text-xs text-amber-700 mt-0.5">{example[step].tip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="px-6 pb-4 flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />Anterior
              </Button>
              <div className="flex-1" />
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setSelectedExample(null); setStep(0); }}>
                Volver a ejemplos
              </Button>
              {step < example.length - 1 ? (
                <Button size="sm" variant="default" className="text-xs" onClick={() => setStep(step + 1)}>
                  Siguiente<ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handleClose}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Completado
                </Button>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
