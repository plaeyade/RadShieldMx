/**
 * Shape Library — Panel con shapes arrastrables al canvas
 * Prioridad MEDIA del analisis SmartDraw
 * Categorias: Equipos, Mobiliario, Estructura, Simbolos
 */
import { useState } from 'react';
import { Shapes, X, Monitor, Armchair, DoorOpen, ShieldAlert, Radiation, TriangleAlert, Stethoscope } from 'lucide-react';

export interface ShapeItem {
  id: string;
  name: string;
  icon: typeof Monitor;
  color: string;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
}

const SHAPE_CATEGORIES = [
  {
    name: 'Equipos',
    items: [
      { id: 'xr-tube', name: 'Tubo XR', icon: Monitor, color: '#3b82f6', defaultWidth: 40, defaultHeight: 40 },
      { id: 'ct-gantry', name: 'CT Gantry', icon: Shapes, color: '#8b5cf6', defaultWidth: 80, defaultHeight: 80 },
      { id: 'pet-ct', name: 'PET/CT', icon: Radiation, color: '#ef4444', defaultWidth: 100, defaultHeight: 80 },
      { id: 'linac', name: 'LINAC', icon: Monitor, color: '#f59e0b', defaultWidth: 120, defaultHeight: 100 },
      { id: 'gamma-knife', name: 'Gamma Knife', icon: ShieldAlert, color: '#10b981', defaultWidth: 60, defaultHeight: 60 },
    ] as ShapeItem[],
  },
  {
    name: 'Mobiliario',
    items: [
      { id: 'table', name: 'Mesa', icon: Armchair, color: '#78716c', defaultWidth: 60, defaultHeight: 30 },
      { id: 'chair', name: 'Silla', icon: Armchair, color: '#78716c', defaultWidth: 25, defaultHeight: 25 },
      { id: 'lead-panel', name: 'Panel Lead', icon: ShieldAlert, color: '#475569', defaultWidth: 20, defaultHeight: 60 },
    ] as ShapeItem[],
  },
  {
    name: 'Estructura',
    items: [
      { id: 'door-lead', name: 'Puerta Lead', icon: DoorOpen, color: '#92400e', defaultWidth: 40, defaultHeight: 10 },
      { id: 'window-lead', name: 'Ventana Lead', icon: Monitor, color: '#1e40af', defaultWidth: 30, defaultHeight: 20 },
    ] as ShapeItem[],
  },
  {
    name: 'Simbolos',
    items: [
      { id: 'radiation', name: 'Radiacion', icon: Radiation, color: '#ef4444', defaultWidth: 30, defaultHeight: 30 },
      { id: 'emergency', name: 'Emergencia', icon: TriangleAlert, color: '#f59e0b', defaultWidth: 25, defaultHeight: 25 },
      { id: 'restricted', name: 'Restringido', icon: ShieldAlert, color: '#dc2626', defaultWidth: 30, defaultHeight: 30 },
      { id: 'exam', name: 'Sala Examen', icon: Stethoscope, color: '#0891b2', defaultWidth: 30, defaultHeight: 30 },
    ] as ShapeItem[],
  },
];

interface Props {
  onDragStart: (shape: ShapeItem) => void;
  onClose: () => void;
}

export default function ShapeLibrary({ onDragStart, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState('Equipos');

  return (
    <div className="fixed bottom-4 left-4 z-[100] bg-white border rounded-lg shadow-lg p-3 w-56">
      <div className="flex items-center justify-between mb-2 pb-1 border-b">
        <div className="flex items-center gap-1.5">
          <Shapes className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-semibold text-slate-700">Libreria de Formas</span>
        </div>
        <button onClick={onClose} className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-1 mb-2 flex-wrap">
        {SHAPE_CATEGORIES.map(cat => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-2 py-0.5 text-[10px] rounded transition ${activeCategory === cat.name ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {SHAPE_CATEGORIES.find(c => c.name === activeCategory)?.items.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(item)}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded border hover:border-teal-300 hover:bg-teal-50 cursor-grab active:cursor-grabbing transition"
              title={`${item.name} (${item.defaultWidth}x${item.defaultHeight}px)`}
            >
              <Icon className="w-5 h-5" style={{ color: item.color }} />
              <span className="text-[9px] text-slate-500 text-center leading-tight">{item.name}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-slate-400 mt-2 text-center">Arrastre al canvas para colocar</p>
    </div>
  );
}

export { SHAPE_CATEGORIES };
