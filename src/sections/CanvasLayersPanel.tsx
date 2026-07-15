/**
 * Canvas Layers Panel — Control de visibilidad/opacity/lock por capa
 * Integracion: Toolbar → boton Layers → panel flotante
 */
import { Layers, Eye, EyeOff, Lock, Unlock, RotateCcw } from 'lucide-react';
import type { CanvasLayer } from '@/hooks/useCanvasLayers';

interface Props {
  layers: CanvasLayer[];
  activeLayer: string;
  onToggle: (id: string) => void;
  onOpacity: (id: string, v: number) => void;
  onLock: (id: string) => void;
  onActivate: (id: string) => void;
  onReset: () => void;
}

export default function CanvasLayersPanel({ layers, activeLayer, onToggle, onOpacity, onLock, onActivate, onReset }: Props) {
  return (
    <div className="fixed top-[60px] right-4 z-[100] bg-white border rounded-lg shadow-lg p-3 w-56 space-y-1">
      <div className="flex items-center justify-between mb-2 pb-1 border-b">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-semibold text-slate-700">Capas</span>
        </div>
        <button onClick={onReset} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="Restaurar">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
      {layers.map(layer => (
        <div
          key={layer.id}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition ${activeLayer === layer.id ? 'bg-teal-50 ring-1 ring-teal-200' : 'hover:bg-slate-50'}`}
          onClick={() => onActivate(layer.id)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(layer.id); }}
            className={`p-0.5 rounded ${layer.visible ? 'text-teal-600' : 'text-slate-300'}`}
          >
            {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: layer.color }} />
          <span className="text-[10px] text-slate-600 flex-1 truncate">{layer.nameEs}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onLock(layer.id); }}
            className={`p-0.5 rounded ${layer.locked ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}
          >
            {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(layer.opacity * 100)}
            onChange={(e) => onOpacity(layer.id, parseInt(e.target.value) / 100)}
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-1 accent-teal-600"
            title={`Opacidad: ${Math.round(layer.opacity * 100)}%`}
          />
        </div>
      ))}
    </div>
  );
}
