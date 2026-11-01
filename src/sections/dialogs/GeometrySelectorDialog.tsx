import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import '@/components/ui/separator';
import { Box, Circle, Cylinder, Square, Triangle, Hexagon, Star, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GeometryOption {
  id: string;
  name: string;
  description: string;
  category: 'point' | 'line' | 'area' | 'volume' | 'infinite';
  icon: LucideIcon;
  shields: number;
  supportsCladding: boolean;
  supportsOffset: boolean;
}

const GEOMETRIES: GeometryOption[] = [
  { id: 'P1', name: 'Point Source', description: 'Fuente puntual isotropica', category: 'point', icon: Circle, shields: 10, supportsCladding: false, supportsOffset: true },
  { id: 'L1', name: 'Line Source', description: 'Fuente lineal (tubo, varilla)', category: 'line', icon: Star, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'D1', name: 'Disk Source', description: 'Fuente en forma de disco circular', category: 'area', icon: Circle, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'R1', name: 'Rectangular Area — Vertical', description: 'Area rectangular vertical', category: 'area', icon: Square, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'R2', name: 'Rectangular Area — Horizontal', description: 'Area rectangular horizontal', category: 'area', icon: Square, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'S1', name: 'Sphere Volume', description: 'Volumen esferico (contenedor esfera)', category: 'volume', icon: Circle, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'C1', name: 'Cylinder Volume — Side Shields', description: 'Cilindro con blindaje lateral', category: 'volume', icon: Cylinder, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'C2', name: 'Cylinder Volume — End Shields', description: 'Cilindro con blindaje en extremos', category: 'volume', icon: Cylinder, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'C3', name: 'Cylinder Surface — Internal Dose', description: 'Superficie cilindrica, punto interno', category: 'volume', icon: Cylinder, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'C4', name: 'Cylinder Surface — External Dose', description: 'Superficie cilindrica, punto externo', category: 'volume', icon: Cylinder, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'A1', name: 'Annular Cylinder — Internal Dose', description: 'Cilindro anular, punto interno', category: 'volume', icon: Hexagon, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'A2', name: 'Annular Cylinder — External Dose', description: 'Cilindro anular, punto externo', category: 'volume', icon: Hexagon, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'V1', name: 'Rectangular Volume', description: 'Volumen paralelepipedico', category: 'volume', icon: Box, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'T1', name: 'Truncated Cone', description: 'Cono truncado', category: 'volume', icon: Triangle, shields: 10, supportsCladding: true, supportsOffset: true },
  { id: 'I1', name: 'Infinite Plane', description: 'Plano infinito (semi-infinito)', category: 'infinite', icon: Layers, shields: 10, supportsCladding: false, supportsOffset: true },
  { id: 'I2', name: 'Infinite Slab', description: 'Losa infinita (capa delgada)', category: 'infinite', icon: Layers, shields: 10, supportsCladding: false, supportsOffset: true },
];

const CAT_LABELS: Record<string, string> = {
  point: 'Puntual', line: 'Lineal', area: 'Area', volume: 'Volumetrica', infinite: 'Infinita',
};
const CAT_COLORS: Record<string, string> = {
  point: 'bg-blue-100 text-blue-700', line: 'bg-emerald-100 text-emerald-700', area: 'bg-amber-100 text-amber-700',
  volume: 'bg-violet-100 text-violet-700', infinite: 'bg-slate-100 text-slate-700',
};

interface GeometrySelectorDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (geo: GeometryOption) => void;
}

export default function GeometrySelectorDialog({ open, onOpenChange, onSelect }: GeometrySelectorDialogProps) {
  const categories = [...new Set(GEOMETRIES.map(g => g.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Box className="w-5 h-5 text-blue-500" />
            Geometry Selector — 16 Geometrias (tipo MicroShield)
            <Badge variant="outline" className="text-[10px]">MicroShield v13</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 text-xs text-slate-500">
          Seleccione una geometria de fuente. Cada geometria soporta hasta 10 blindajes estandar, auto-blindaje de fuente y revestimiento de cilindro.
        </div>

        <ScrollArea className="px-6 pb-6 max-h-[60vh]">
          {categories.map(cat => (
            <div key={cat} className="mb-4">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Badge className={`${CAT_COLORS[cat]} text-[9px] h-4 px-1`}>{CAT_LABELS[cat]}</Badge>
                <span>{GEOMETRIES.filter(g => g.category === cat).length} geometrias</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {GEOMETRIES.filter(g => g.category === cat).map(geo => {
                  const Icon = geo.icon;
                  return (
                    <button
                      key={geo.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left"
                      onClick={() => onSelect?.(geo)}
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{geo.name}</span>
                          {geo.supportsCladding && <Badge variant="outline" className="text-[8px] h-3 px-0.5">Cladding</Badge>}
                          {geo.supportsOffset && <Badge variant="outline" className="text-[8px] h-3 px-0.5">Offset</Badge>}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{geo.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{geo.shields} blindajes soportados</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
