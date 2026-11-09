// ExperimentalValidationDialog.tsx — comparación de una TVL medida con NCRP 151 mediante Eₙ.
// Fase 8d: Eₙ combina las incertidumbres expandidas de la medición y de la referencia (antes sólo la de la
// medición, con criterio |Δ| ≤ 2u); la tabla de referencia sale de NCRP 151 Tabla B.2 (`lib/ncrp151`) en lugar
// de publicaciones sin verificar; textos en español.
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlaskConical, Database } from 'lucide-react';
import { TABLA_B_2, type MaterialNCRP151 } from '@/lib/ncrp151';
import { numeroEn } from '@/lib/numeroEn';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const NOMBRE_MATERIAL: Record<MaterialNCRP151, string> = { concrete: 'Concreto', steel: 'Acero', lead: 'Plomo' };
const ENERGIAS = ['4', '6', '10', '15', '18', 'Co60'] as const;

const REFERENCIAS = (Object.keys(TABLA_B_2) as MaterialNCRP151[]).flatMap((material) =>
  ENERGIAS.flatMap((e) => {
    const p = TABLA_B_2[material][e];
    return [
      { id: `${material}-${e}-1`, material, energia: e === 'Co60' ? 'Co-60' : `${e} MV`, tipo: 'TVL₁', tvl_cm: p.tvl1_cm },
      { id: `${material}-${e}-e`, material, energia: e === 'Co60' ? 'Co-60' : `${e} MV`, tipo: 'TVLₑ', tvl_cm: p.tvle_cm },
    ];
  }),
);

export default function ExperimentalValidationDialog({ open, onOpenChange }: Props) {
  const [measuredTVL, setMeasuredTVL] = useState('36.5');
  const [measuredUnc, setMeasuredUnc] = useState('2.0');
  const [refTVL, setRefTVL] = useState('37.0');
  const [refUnc, setRefUnc] = useState('0');

  const r = numeroEn(parseFloat(measuredTVL), parseFloat(measuredUnc), parseFloat(refTVL), parseFloat(refUnc));
  const estado = r.concordante === null ? 'sin incertidumbre' : r.concordante ? 'CONCORDANTE' : 'NO CONCORDANTE';
  const color = r.concordante === null ? 'bg-slate-500' : r.concordante ? 'bg-emerald-500' : 'bg-red-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-emerald-500" />Validación con datos medidos</DialogTitle>
          <DialogDescription className="text-xs">
            Eₙ = (x − X)/√(U_x² + U_X²) con incertidumbres expandidas (k = 2); |Eₙ| ≤ 1 es concordante (ISO 13528).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <div><Label className="text-xs" htmlFor="ev-x">TVL medida x (cm)</Label><Input id="ev-x" value={measuredTVL} onChange={e => setMeasuredTVL(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="ev-ux">U de la medición (cm, k=2)</Label><Input id="ev-ux" value={measuredUnc} onChange={e => setMeasuredUnc(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="ev-X">TVL de referencia X (cm)</Label><Input id="ev-X" value={refTVL} onChange={e => setRefTVL(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="ev-uX">U de la referencia (cm, k=2)</Label><Input id="ev-uX" value={refUnc} onChange={e => setRefUnc(e.target.value)} /></div>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />NCRP 151 Tabla B.2 (haz ancho; sin incertidumbre publicada)</CardTitle></CardHeader>
              <CardContent className="overflow-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="border-b"><th className="text-left py-1">Material</th><th className="text-left">Energía</th><th className="text-left">Tipo</th><th className="text-right">TVL (cm)</th></tr></thead>
                  <tbody>{REFERENCIAS.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setRefTVL(String(d.tvl_cm))}>
                      <td className="py-1 font-medium">{NOMBRE_MATERIAL[d.material]}</td><td>{d.energia}</td><td>{d.tipo}</td><td className="text-right font-mono">{d.tvl_cm}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-2" data-testid="validacion-en">
              <Card className="bg-blue-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Diferencia x − X</p><p className="text-xl font-bold text-blue-600">{Number.isFinite(r.diferencia) ? `${r.diferencia.toFixed(2)} cm` : '—'}</p></CardContent></Card>
              <Card className="bg-purple-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Eₙ</p><p className="text-xl font-bold text-purple-600">{r.en === null ? '—' : r.en.toFixed(2)}</p></CardContent></Card>
              <Card className="bg-slate-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Conclusión</p><Badge className={color}>{estado}</Badge></CardContent></Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
