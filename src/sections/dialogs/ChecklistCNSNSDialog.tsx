// =============================================================================
// ChecklistCNSNSDialog - Checklist detallado para tramite CNSNS.
// F397 migra el fullscreen legacy a FullscreenShell controlado.
// =============================================================================
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import FullscreenShell from '@/components/FullscreenShell';
import { ClipboardCheck, CheckCircle, Circle } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }
interface CheckItem { id: string; category: string; item: string; reference: string; checked: boolean; required: boolean; }

const DEFAULT_ITEMS: CheckItem[] = [
  { id: '1', category: 'Datos Generales', item: 'Nombre de la institucion completo', reference: 'Portada', checked: false, required: true },
  { id: '2', category: 'Datos Generales', item: 'Direccion completa (calle, ciudad, estado, CP)', reference: 'Portada', checked: false, required: true },
  { id: '3', category: 'Datos Generales', item: 'Licencia CNSNS vigente', reference: 'RGSR (1988)', checked: false, required: true },
  { id: '4', category: 'Datos Generales', item: 'Responsable de proteccion radiologica (nombre, licencia)', reference: 'RGSR (1988)', checked: false, required: true },
  { id: '5', category: 'Equipo', item: 'Marca, modelo y numero de serie del equipo', reference: 'Condiciones Generales', checked: false, required: true },
  { id: '6', category: 'Equipo', item: 'Energia fotones (MV) confirmada', reference: 'Condiciones Generales', checked: false, required: true },
  { id: '7', category: 'Equipo', item: 'Energia electrones (MeV) si aplica', reference: 'Condiciones Generales', checked: false, required: false },
  { id: '8', category: 'Equipo', item: 'Tasa de dosis maxima (cGy/min) a dmax', reference: 'Fabricante', checked: false, required: true },
  { id: '9', category: 'Layout', item: 'Plano arquitectonico de la sala (DXF/PDF)', reference: 'LAYOUT_ESTRUCTURAL', checked: false, required: true },
  { id: '10', category: 'Layout', item: 'Dimensiones del bunker: largo, ancho, altura', reference: 'LAYOUT_ESTRUCTURAL', checked: false, required: true },
  { id: '11', category: 'Layout', item: 'Colindancias identificadas (N, S, E, O, arriba, abajo)', reference: 'LAYOUT_ESTRUCTURAL', checked: false, required: true },
  { id: '12', category: 'Layout', item: 'Distancias fuente-punto de calculo para cada barrera', reference: 'Datos Sala y Puntos', checked: false, required: true },
  { id: '13', category: 'Calculos', item: 'Barrera primaria calculada (equipo, energia, W, U, T, d)', reference: 'Barreras Primarias', checked: false, required: true },
  { id: '14', category: 'Calculos', item: 'Barrera secundaria calculada (scatter + leakage)', reference: 'Barreras Secundarias', checked: false, required: true },
  { id: '15', category: 'Calculos', item: 'Laberinto calculado (si aplica > 10 MV o GK)', reference: 'DISENO_LABERINTO', checked: false, required: true },
  { id: '16', category: 'Calculos', item: 'Puerta del laberinto (neutrones si > 10 MV)', reference: 'Neutrones', checked: false, required: false },
  { id: '17', category: 'Calculos', item: 'Verificacion TADR contra objetivos de diseno', reference: 'NCRP 147/151', checked: false, required: true },
  { id: '18', category: 'Calculos', item: 'Skyshine evaluado (fotones y neutrones)', reference: 'NCRP 151 sec. 5.3', checked: false, required: false },
  { id: '19', category: 'Materiales', item: 'Material de blindaje especificado con densidad', reference: 'MATERIALES_BLINDAJE', checked: false, required: true },
  { id: '20', category: 'Materiales', item: 'TVL confirmado para energia y material seleccionado', reference: 'NCRP 151 Tabla B.1', checked: false, required: true },
  { id: '21', category: 'QA', item: 'Prueba de integridad del sistema', reference: 'CHECKLIST_PRE_CNSNS', checked: false, required: true },
  { id: '22', category: 'QA', item: 'Memoria analitica completa y firmada', reference: 'MEMORIA_ANALITICA_*', checked: false, required: true },
  { id: '23', category: 'QA', item: 'Plan de contingencias', reference: 'MEMORIA_CONTING', checked: false, required: true },
  { id: '24', category: 'QA', item: 'Registro de mantenimiento programado', reference: 'REGISTRO_MANTENIMIENTO', checked: false, required: true },
  { id: '25', category: 'Normativa', item: 'Delimitacion y control de zonas (contaminacion/radiacion)', reference: 'NOM-008-NUCL-2024', checked: false, required: true },
  { id: '26', category: 'Normativa', item: 'Cumplimiento NOM-040-NUCL (instalaciones radioterapia)', reference: 'NOM-040', checked: false, required: true },
];

export default function ChecklistCNSNSDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <ChecklistContent onOpenChange={onOpenChange} />;
}

function ChecklistContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<CheckItem[]>(DEFAULT_ITEMS);

  const toggleItem = (id: string) => setItems(items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  const checkedCount = items.filter((i) => i.checked).length;
  const requiredCount = items.filter((i) => i.required).length;
  const requiredChecked = items.filter((i) => i.required && i.checked).length;
  const progress = Math.round((checkedCount / items.length) * 100);
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <FullscreenShell
      title="Checklist Pre-CNSNS"
      subtitle="Validacion de tramite ante la Comision Nacional de Seguridad Nuclear y Salvaguardias - F397"
      icon={<ClipboardCheck className="h-5 w-5" />}
      accentClassName="bg-green-600"
      traceId="f397-checklist-cnsns-fullscreen-shell"
      onClose={() => onOpenChange(false)}
      toolbar={<Badge variant={requiredChecked === requiredCount ? 'default' : 'secondary'} className="text-xs">{requiredChecked}/{requiredCount} requeridos</Badge>}
    >
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Progreso del checklist</span>
                <span className="text-sm font-bold">{progress}% ({checkedCount}/{items.length})</span>
              </div>
              <Progress value={progress} className="h-3" />
              {requiredChecked === requiredCount ? (
                <div className="mt-2 text-xs font-semibold text-green-600">Todos los items requeridos completados - listo para tramite CNSNS</div>
              ) : (
                <div className="mt-2 text-xs text-amber-600">Faltan {requiredCount - requiredChecked} items requeridos</div>
              )}
            </CardContent>
          </Card>

          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            return (
              <Card key={cat}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{cat}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {catItems.map((item) => (
                      <button key={item.id} onClick={() => toggleItem(item.id)} className={`flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors ${item.checked ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                        {item.checked ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
                        <div className="flex-1">
                          <div className="text-sm">{item.item} {item.required && <Badge variant="destructive" className="ml-1 text-[10px]">REQUERIDO</Badge>}</div>
                          <div className="text-xs text-slate-500">Ref: {item.reference}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </FullscreenShell>
  );
}
