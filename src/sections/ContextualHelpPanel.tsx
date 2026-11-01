import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, X, ChevronRight, BookOpen, Video, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  icon: LucideIcon;
  content: string;
  tips: string[];
}

const HELP_TOPICS: Record<string, HelpTopic> = {
  default: {
    id: 'default',
    title: 'Bienvenido a RadShield-MX',
    icon: HelpCircle,
    content: `RadShield-MX es una plataforma profesional para el calculo de blindaje radiologico en instalaciones medicas. Cumple con normativas internacionales (NCRP 151, ICRP, ICRU) y nacionales (CNSNS).`,
    tips: [
      'Presiona Ctrl+K para abrir la paleta de comandos',
      'Usa ? para ver atajos de teclado',
      'Los paneles son redimensionables arrastrando el borde',
      'El auto-guardado funciona cada 30 segundos',
    ],
  },
  calculo: {
    id: 'calculo',
    title: 'Calculo de Blindaje',
    icon: CheckCircle2,
    content: `El calculo de blindaje sigue la metodologia del NCRP Report No. 151. Se consideran factores de uso (U), ocupacion (T) y trabajo (W) para determinar el espesor necesario de cada barrera.`,
    tips: [
      'Verifica que todas las fuentes tengan energia y carga de trabajo definidas',
      'Las barreras primarias requieren mayor espesor que las secundarias',
      'El laberinto reduce significativamente el espesor de la puerta',
      'Para energias > 10 MV, considera la contribucion de neutrones',
      'Revisa el tab Pass/Fail para identificar barreras que no cumplen',
    ],
  },
  fuentes: {
    id: 'fuentes',
    title: 'Fuentes de Radiacion',
    icon: AlertTriangle,
    content: `Las fuentes de radiacion pueden ser de terapia (LINAC, Co-60, Gamma Knife), diagnostico (RX, CT), medicina nuclear (Tc-99m, I-131, F-18) o ciclotrones.`,
    tips: [
      'Posiciona la fuente en el isocentro para calculos de terapia',
      'La carga de trabajo tipica para un LINAC es 300-500 Gy/semana',
      'Para HDR, considera el tiempo de irradiacion por paciente',
      'Las fuentes de medicina nuclear requieren calculo de dosis acumulada',
    ],
  },
  barreras: {
    id: 'barreras',
    title: 'Barreras de Blindaje',
    icon: BookOpen,
    content: `Las barreras se clasifican como primarias (reciben haz directo) o secundarias (dispersion y fuga). El material puede ser concreto ordinario, concreto de barita, plomo, acero o vidrio plomado.`,
    tips: [
      'Dibuja las barreras siguiendo el perimetro del recinto',
      'El concreto ordinario tiene densidad de 2.35 g/cm3',
      'El concreto de barita tiene mayor atenuacion pero mayor costo',
      'Usa plomo para blindajes secundarios livianos',
      'Compara costos en la pestana Comparativa Materiales',
    ],
  },
  maze: {
    id: 'maze',
    title: 'Laberinto (Maze)',
    icon: Lightbulb,
    content: `El laberinto o maze es un corredor que reduce la radiacion dispersa que llega a la puerta. El factor de atenuacion del laberinto se calcula considerando multiples reflexiones en las paredes.`,
    tips: [
      'Un laberinto tipico tiene 3-5m de longitud',
      'El ancho minimo recomendado es 1.5m',
      'El angulo de entrada debe ser de 90-120 grados',
      'Considera la radiacion dispersa del paciente en el angulo de entrada',
    ],
  },
  mc: {
    id: 'mc',
    title: 'Monte Carlo',
    icon: Video,
    content: `La simulacion Monte Carlo (MC) proporciona la solucion mas precisa para calculos de blindaje. Utiliza metodos estadisticos para simular el transporte de particulas a traves de la materia.`,
    tips: [
      'GEANT4 es el toolkit MC mas utilizado en fisica medica',
      'GATE es una interfaz amigable basada en GEANT4',
      'Minimo 1 millon de particulas para resultados estadisticamente validos',
      'La simulacion en cloud permite mayor numero de particulas',
    ],
  },
  normativa: {
    id: 'normativa',
    title: 'Normativas Aplicables',
    icon: BookOpen,
    content: `RadShield-MX incorpora multiples normativas: NCRP 151 (terapia externa), NCRP 144 (braquiterapia), NCRP 147 (diagnostico), EPA FGR 14, ICRP 33, y lineamientos CNSNS.`,
    tips: [
      'NCRP 151: Blindaje para instalaciones de terapia con radiacion externa',
      'NCRP 147: Estructuras de blindaje en instalaciones de radiologia medica',
      'EPA FGR 14: Factores de dosis por radionucleidos',
      'CNSNS: Limites de dosis para Mexico — personal: 20 mSv/ano, publico: 1 mSv/ano',
    ],
  },
};

interface ContextualHelpPanelProps {
  activeContext?: string;
  onClose: () => void;
}

export default function ContextualHelpPanel({ activeContext = 'default', onClose }: ContextualHelpPanelProps) {
  const [selectedTopic, setSelectedTopic] = useState(activeContext);
  const topic = HELP_TOPICS[selectedTopic] || HELP_TOPICS.default;
  const Icon = topic.icon;

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          Panel de Ayuda
        </span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Topic selector */}
      <div className="px-2 py-2 border-b border-slate-200">
        <div className="flex flex-wrap gap-1">
          {Object.values(HELP_TOPICS).map(t => (
            <Button
              key={t.id}
              size="sm"
              variant={selectedTopic === t.id ? 'default' : 'outline'}
              className="h-6 text-[10px] px-1.5"
              onClick={() => setSelectedTopic(t.id)}
            >
              <t.icon className="w-3 h-3 mr-0.5" />
              {t.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{topic.title}</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{topic.content}</p>

          <Separator />

          <div>
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              Consejos
            </h4>
            <div className="space-y-1.5">
              {topic.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 rounded p-1.5">
                  <ChevronRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 text-[9px] text-slate-400 text-center">
        RadShield-MX v15 — Contexto: {topic.title}
      </div>
    </div>
  );
}
