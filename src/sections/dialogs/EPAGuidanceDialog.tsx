// EPAGuidanceDialog.tsx -- Referencia rapida EPA Federal Guidance Report No. 14 (2014)
// Reemplaza FGR 9 (1976). Enfasis: diagnostico e intervencionismo RX

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { BookOpen, Shield, Baby, Eye, Stethoscope, ClipboardList, AlertTriangle, CheckCircle, Info, Download } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GuidanceSection {
  id: string;
  title: string;
  icon: any;
  items: { label: string; value: string; note?: string }[];
}

const EPA_SECTIONS: GuidanceSection[] = [
  {
    id: 'shielding',
    title: 'Objetivos de Blindaje (FGR 14 §3.2)',
    icon: Shield,
    items: [
      { label: 'Area controlada (POE)', value: '5 mGy/año = 0.1 mGy/semana', note: 'Equivalente a 100 uSv/semana. Consistente con NCRP 151 §2.1' },
      { label: 'Area no controlada (publico)', value: '1 mGy/año = 0.02 mGy/semana', note: 'Equivalente a 20 uSv/semana. Consistente con NCRP 151 §2.1' },
      { label: 'Embarazada ocupacional', value: '0.5 mSv/mes = 5 mSv/gestacion', note: 'FGR 14 §3.2.3. Mismo que NOM-008-NUCL-2011 §4.3' },
      { label: 'Objetivos NCRP 147 (diagnóstico)', value: 'Controlada 0.1 mGy/semana; no controlada 0.02 mGy/semana', note: 'NCRP 147 §1.3 (kerma en aire). Antes decía «controlada 20 μSv/semana», que es el objetivo NO controlado.' },
    ],
  },
  {
    id: 'alara',
    title: 'ALARA y Optimizacion de Dosis (FGR 14 §2.3)',
    icon: CheckCircle,
    items: [
      { label: 'Principio ALARA', value: 'Tan bajo como razonablemente achievable', note: 'Considerando factores economicos y sociales. No es un limite, es un proceso.' },
      { label: 'Dose creep digital', value: 'Riesgo de incremento con imagen digital vs pelicula', note: 'FGR 14 §4.1.4. Monitorear CTDIvol y DLP tendencias a lo largo del tiempo.' },
      { label: 'Niveles de referencia diagnosticos (DRL)', value: 'CT cabeza < 50 mGy (CTDIvol)', note: 'FGR 14 Tabla 4-1. Comparar contra DRL nacionales (NOM-030-NUCL-2011).' },
      { label: 'Justificacion', value: 'Toda exposicion debe estar justificada clinicamente', note: 'FGR 14 §2.1. Revisar apropiacion indicacion antes de cada estudio.' },
    ],
  },
  {
    id: 'ct',
    title: 'Tomografia Computarizada (FGR 14 §4.2)',
    icon: Stethoscope,
    items: [
      { label: 'Modulacion de mA (ATCM)', value: 'Reducir dosis 20-40% manteniendo calidad', note: 'FGR 14 §4.2.2. Recomendado para todos los estudios de rutina.' },
      { label: 'Pitch optimo', value: 'Pitch > 1.0 cuando sea clinicamente aceptable', note: 'FGR 14 §4.2.3. Aumentar pitch reduce dosis pero puede afectar resolucion.' },
      { label: 'Grosor de corte colimacion', value: 'Usar el minimo necesario para el diagnostico', note: 'FGR 14 §4.2.4. Corte mas delgado = mas ruido = mas dosis para compensar.' },
      { label: 'Reconstruccion iterativa', value: 'Permite reducir mA 30-50%', note: 'FGR 14 §4.2.5. ASIR, IRIS, SAFIRE, ADMIRE segun fabricante.' },
      { label: 'CT pediatrico', value: 'kVp 80-100, mA minimo, pitch maximo', note: 'FGR 14 §4.2.6. Protocolos especificos por rango de edad.' },
    ],
  },
  {
    id: 'fluoro',
    title: 'Fluoroscopia Intervencionista (FGR 14 §4.3)',
    icon: Eye,
    items: [
      { label: 'Limite dosis lente ocular', value: '20 mSv/ano (nuevo limite ICRP 118)', note: 'FGR 14 §4.3.1. Anteriormente 150 mSv/ano. Proteccion ocular obligatoria.' },
      { label: 'Proteccion ocular primaria', value: 'Gafas con equivalente Pb 0.5 mm minimo', note: 'FGR 14 §4.3.2. Preferir gafas envolventes (wrap-around).' },
      { label: 'Escudos suspendidos del techo', value: 'Reducir dosis scatter al operador 80-90%', note: 'FGR 14 §4.3.3. Posicionar lo mas cerca del paciente posible.' },
      { label: 'Modo pulso fluoro', value: 'Usar la menor tasa de pulsos clinicamente aceptable', note: 'FGR 14 §4.3.4. 7.5-15 fps vs 30 fps puede reducir dosis 50%.' },
      { label: 'Last image hold (LIH)', value: 'Evitar exposicion continua innecesaria', note: 'FGR 14 §4.3.5. Revisar imagen congelada en lugar de fluoro continuo.' },
    ],
  },
  {
    id: 'pediatric',
    title: 'Pacientes Pediatricos (FGR 14 §5.1)',
    icon: Baby,
    items: [
      { label: 'Reduccion dosis pediatrica', value: '50-80% menor que adulto para mismo examen', note: 'FGR 14 §5.1.1. Ajustar kVp, mAs, y filtracion segun tamano.' },
      { label: 'Tecnica de mAs fijo vs AEC', value: 'AEC puede sobreexponer en ninos pequenos', note: 'FGR 14 §5.1.2. Considerar mAs manual o AEC con limites pediatricos.' },
      { label: 'Inmovilizacion', value: 'Evitar repeticiones por movimiento', note: 'FGR 14 §5.1.3. Dispositivos de inmovilizacion = menos repeticiones = menos dosis.' },
      { label: 'Proteccion gonadal', value: 'Siempre que no interfiera con area de interes', note: 'FGR 14 §5.1.4. Escudo Pb 0.5 mm minimo, preferible 1.0 mm.' },
      { label: 'Tamano vs edad', value: 'Usar dimensiones corporales, no edad cronologica', note: 'FGR 14 §5.1.5. Protocolos basados en peso o diametro toracico.' },
    ],
  },
  {
    id: 'pregnancy',
    title: 'Pacientes Embarazadas (FGR 14 §5.2)',
    icon: AlertTriangle,
    items: [
      { label: 'Dosis fetal maxima', value: '< 0.5 mGy para toda la gestacion', note: 'FGR 14 §5.2.1. Riesgo deterministico despreciable por debajo de este umbral.' },
      { label: 'Periodo critico', value: '8-15 semanas: mayor sensibilidad fetal', note: 'FGR 14 §5.2.2. Si procedimiento es esencial, optimizar tecnicamente.' },
      { label: 'Distancia fuente-feto', value: 'Maximizar distancia, minimizar tiempo', note: 'FGR 14 §5.2.3. Inclinar tubo alejado del utero cuando sea posible.' },
      { label: 'Collimar estrictamente', value: 'Restringir al campo estrictamente necesario', note: 'FGR 14 §5.2.4. Cualquier radiacion fuera del campo es scatter hacia el feto.' },
    ],
  },
  {
    id: 'qa',
    title: 'Garantia de Calidad (FGR 14 §6.1)',
    icon: ClipboardList,
    items: [
      { label: 'Programa QA anual', value: 'Revisado por Fisico Medico calificado', note: 'FGR 14 §6.1.1. El QMP (Qualified Medical Physicist) debe firmar el programa.' },
      { label: 'Receptor imagen digital', value: 'Pruebas de calidad imagen semestrales', note: 'FGR 14 §6.1.2. Uniformidad, ruido, resolucion, contraste.' },
      { label: 'CT: phantoms water-air', value: 'Verificar CTDIvol y perfil numero CT', note: 'FGR 14 §6.1.3. ACR phantom anual obligatorio para acreditacion.' },
      { label: 'Fluoroscopia: tiempo fluoro', value: 'Verificar tiempo de exposicion acumulado', note: 'FGR 14 §6.1.4. Monitoreo del tiempo de activacion del pedal.' },
      { label: 'Mamografia: MQSA', value: 'Cumplir FDA MQSA o equivalente local', note: 'FGR 14 §6.1.5. NOM-030-NUCL en Mexico requiere QC semestral.' },
    ],
  },
  {
    id: 'qmp',
    title: 'Fisico Medico Calificado / QMP (FGR 14 §3.1)',
    icon: Info,
    items: [
      { label: 'Rol del QMP en blindaje', value: 'Debe realizar o revisar el diseno estructural', note: 'FGR 14 §3.1.2. No basta con calculo arquitectonico; debe validar fisico medico.' },
      { label: 'Calibracion dosimetrica', value: 'Anual con patrones trazables a NIST', note: 'FGR 14 §3.1.3. Incluye camaras de ionizacion, TLD, OSL, diodos.' },
      { label: 'Verificacion post-instalacion', value: 'Medir dose rate real vs calculado', note: 'FGR 14 §3.1.4. Desviacion > 20% requiere investigacion y correccion.' },
      { label: 'Documentacion', value: 'Memoria de calculo firmada por QMP', note: 'FGR 14 §3.1.5. Incluir metodologia, referencias, y limites de diseno.' },
    ],
  },
];

export default function EPAGuidanceDialog({ open, onOpenChange }: Props) {
  const [activeSection, setActiveSection] = useState<string>('shielding');

  const active = EPA_SECTIONS.find(s => s.id === activeSection)!;
  const Icon = active.icon;

  const handleExport = () => {
    const lines: string[] = [];
    lines.push('EPA FGR 14 — Radiation Protection Guidance for Diagnostic and Interventional X-Ray Procedures');
    lines.push('Federal Guidance Report No. 14 (2014) — Replaces FGR 9 (1976)');
    lines.push('');
    for (const sec of EPA_SECTIONS) {
      lines.push(`=== ${sec.title} ===`);
      for (const item of sec.items) {
        lines.push(`- ${item.label}: ${item.value}`);
        if (item.note) lines.push(`  Nota: ${item.note}`);
      }
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EPA_FGR_14_Guia_Referencia.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Guia EPA FGR 14 exportada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5 text-blue-700" />
            EPA FGR 14 — Guia Federal Proteccion Radiologica (2014)
            <Badge variant="outline" className="ml-auto text-[10px]">Reemplaza FGR 9</Badge>
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            Federal Guidance Report No. 14 — Radiation Protection Guidance for Diagnostic and Interventional X-Ray Procedures.
            Recomendaciones para blindaje, ALARA, CT, fluoroscopia, pediatria, embarazo y QA.
          </p>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <div className="w-56 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0 overflow-y-auto">
            {EPA_SECTIONS.map(sec => {
              const SIcon = sec.icon;
              const isActive = sec.id === activeSection;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
                    isActive ? 'bg-white text-blue-700 font-medium border-l-3 border-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <SIcon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {sec.title.split(' (')[0]}
                </button>
              );
            })}
            <div className="flex-1" />
            <div className="p-2">
              <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={handleExport}>
                <Download className="w-3 h-3" /> Exportar guia
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Icon className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-semibold text-gray-800">{active.title}</h3>
              </div>

              {active.items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium text-gray-700">{item.label}</div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 whitespace-nowrap">{item.value}</Badge>
                  </div>
                  {item.note && (
                    <div className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{item.note}</div>
                  )}
                </div>
              ))}

              <div className="pt-2 text-[10px] text-gray-400 italic">
                Fuente: U.S. EPA Federal Guidance Report No. 14 (2014). Disponible en: https://19january2017snapshot.epa.gov/sites/production/files/2015-05/documents/08-0442-attach-3.pdf
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
