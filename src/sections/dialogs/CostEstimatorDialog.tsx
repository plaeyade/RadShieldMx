// Fase 2: CostEstimatorDialog -- CAPEX/OPEX con precios actualizables por material
import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Download, Calculator } from 'lucide-react';
import { MATERIALS } from '@/types/radshield';

interface MaterialCost {
  code: string;
  name: string;
  pricePerM3_USD: number;
  laborFactor: number; // multiplier for installation complexity
}

const DEFAULT_COSTS: MaterialCost[] = [
  { code: 'CONCRETE235', name: 'Concreto normal 235 kg/cm2', pricePerM3_USD: 120, laborFactor: 1.0 },
  { code: 'CONCRETE340', name: 'Concreto pesado 340 kg/cm2', pricePerM3_USD: 180, laborFactor: 1.2 },
  { code: 'HEAVY_BARYTE', name: 'Concreto pesado barita', pricePerM3_USD: 350, laborFactor: 1.3 },
  { code: 'HEAVY_IRON', name: 'Concreto pesado hierro', pricePerM3_USD: 420, laborFactor: 1.4 },
  { code: 'LEAD_LAMINATED', name: 'Plomo laminado', pricePerM3_USD: 8500, laborFactor: 1.5 },
  { code: 'STEEL_PLATES', name: 'Acero placas 5-15 mm', pricePerM3_USD: 2500, laborFactor: 1.2 },
  { code: 'LEAD_GLASS', name: 'Vidrio plomado', pricePerM3_USD: 6000, laborFactor: 1.8 },
  { code: 'DRYWALL_LEAD', name: 'Tablaroca plomado', pricePerM3_USD: 450, laborFactor: 1.1 },
];

interface CostItem {
  materialCode: string;
  thickness_mm: number;
  area_m2: number;
  volume_m3: number;
  materialCost_USD: number;
  laborCost_USD: number;
  totalCost_USD: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CostEstimatorDialog({ open, onOpenChange }: Props) {
  const [costs, setCosts] = useState<MaterialCost[]>(DEFAULT_COSTS);
  const [items, setItems] = useState<CostItem[]>([
    { materialCode: 'CONCRETE235', thickness_mm: 200, area_m2: 25, volume_m3: 5, materialCost_USD: 0, laborCost_USD: 0, totalCost_USD: 0 },
    { materialCode: 'LEAD_LAMINATED', thickness_mm: 3, area_m2: 8, volume_m3: 0.024, materialCost_USD: 0, laborCost_USD: 0, totalCost_USD: 0 },
  ]);
  const [overheadPct, setOverheadPct] = useState(15);
  const [engineeringPct, setEngineeringPct] = useState(8);

  const recalculate = useCallback(() => {
    setItems(prev => prev.map(item => {
      const mat = costs.find(c => c.code === item.materialCode) || costs[0];
      const materialCost = item.volume_m3 * mat.pricePerM3_USD;
      const laborCost = materialCost * (mat.laborFactor - 1) * 0.5 + item.area_m2 * 25; // $25/m2 base labor
      return {
        ...item,
        materialCost_USD: Math.round(materialCost),
        laborCost_USD: Math.round(laborCost),
        totalCost_USD: Math.round(materialCost + laborCost),
      };
    }));
  }, [costs]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.totalCost_USD, 0);
    const overhead = subtotal * (overheadPct / 100);
    const engineering = subtotal * (engineeringPct / 100);
    const total = subtotal + overhead + engineering;
    return { subtotal, overhead, engineering, total };
  }, [items, overheadPct, engineeringPct]);

  const updateCost = (index: number, field: keyof MaterialCost, value: number) => {
    setCosts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const updateItem = (index: number, field: keyof CostItem, value: number | string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'thickness_mm' || field === 'area_m2') {
        updated.volume_m3 = (updated.thickness_mm / 1000) * updated.area_m2;
      }
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      materialCode: 'CONCRETE235', thickness_mm: 100, area_m2: 10, volume_m3: 1,
      materialCost_USD: 0, laborCost_USD: 0, totalCost_USD: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const exportCSV = () => {
    const headers = ['Material', 'Espesor_mm', 'Area_m2', 'Volumen_m3', 'Costo_Material_USD', 'Costo_Mano_Obra_USD', 'Costo_Total_USD'];
    const rows = items.map(i => [
      i.materialCode, i.thickness_mm, i.area_m2, i.volume_m3.toFixed(3),
      i.materialCost_USD, i.laborCost_USD, i.totalCost_USD
    ].join(','));
    const summary = [
      '', '', '', 'SUBTOTAL', '', '', totals.subtotal.toFixed(2),
      '', '', '', 'OVERHEAD', overheadPct + '%', '', totals.overhead.toFixed(2),
      '', '', '', 'INGENIERIA', engineeringPct + '%', '', totals.engineering.toFixed(2),
      '', '', '', 'TOTAL', '', '', totals.total.toFixed(2),
    ];
    const csv = [headers.join(','), ...rows, summary.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CAPEX_OPEX_Estimado_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Presupuesto exportado a CSV');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Estimador de Costos -- CAPEX / OPEX
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Material prices */}
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Precios de Materiales (USD/m3)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {costs.map((c, i) => (
                  <div key={c.code} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate">{c.name}</span>
                    <Input type="number" className="w-20 h-7 text-xs" value={c.pricePerM3_USD}
                      onChange={e => updateCost(i, 'pricePerM3_USD', Number(e.target.value))} />
                    <span className="text-gray-400 w-8">$/m3</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500">Lineas de Blindaje</h3>
                <Button size="sm" variant="outline" onClick={addItem}>+ Agregar</Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 border rounded text-xs">
                  <select value={item.materialCode} onChange={e => updateItem(i, 'materialCode', e.target.value)}
                    className="flex-1 h-8 px-2 rounded border bg-white dark:bg-gray-800">
                    {MATERIALS.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                  </select>
                  <div className="w-24">
                    <Label className="text-[9px]">Espesor (mm)</Label>
                    <Input type="number" className="h-7 text-xs" value={item.thickness_mm}
                      onChange={e => updateItem(i, 'thickness_mm', Number(e.target.value))} />
                  </div>
                  <div className="w-24">
                    <Label className="text-[9px]">Area (m2)</Label>
                    <Input type="number" className="h-7 text-xs" value={item.area_m2}
                      onChange={e => updateItem(i, 'area_m2', Number(e.target.value))} />
                  </div>
                  <div className="w-20 text-right">
                    <div className="text-[9px] text-gray-400">Vol: {item.volume_m3.toFixed(2)} m3</div>
                    <div className="font-bold">${item.totalCost_USD.toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-1" onClick={() => removeItem(i)}>x</Button>
                </div>
              ))}
            </div>

            <Button onClick={recalculate} className="w-full">
              <Calculator className="w-4 h-4 mr-1.5" /> Recalcular Costos
            </Button>

            {/* Summary */}
            <div className="border rounded-lg p-3 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500">Resumen Economico</h3>
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal materiales + mano de obra</span>
                <span className="font-mono font-bold">${totals.subtotal.toLocaleString()} USD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Overhead</span>
                <Input type="number" className="w-16 h-7 text-xs" value={overheadPct}
                  onChange={e => setOverheadPct(Number(e.target.value))} />
                <span className="text-xs">%</span>
                <span className="flex-1 text-right font-mono">${totals.overhead.toLocaleString()} USD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Ingenieria</span>
                <Input type="number" className="w-16 h-7 text-xs" value={engineeringPct}
                  onChange={e => setEngineeringPct(Number(e.target.value))} />
                <span className="text-xs">%</span>
                <span className="flex-1 text-right font-mono">${totals.engineering.toLocaleString()} USD</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between text-lg font-bold text-green-700">
                <span>TOTAL ESTIMADO</span>
                <span>${totals.total.toLocaleString()} USD</span>
              </div>
              <div className="text-[10px] text-gray-400">
                * Precios referencia 2026. Ajustar segun cotizacion local. No incluye IVA ni flete.
              </div>
            </div>

            <Button variant="outline" onClick={exportCSV} className="w-full">
              <Download className="w-4 h-4 mr-1.5" /> Exportar Presupuesto CSV
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
