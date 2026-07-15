// =============================================================================
// ChecklistCNSNSDialog — Checklist detallado para trámite CNSNS (v14.3)
// =============================================================================
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ClipboardCheck, CheckCircle, Circle } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

interface CheckItem { id: string; category: string; item: string; reference: string; checked: boolean; required: boolean; }

const DEFAULT_ITEMS: CheckItem[] = [
  { id: '1', category: 'Datos Generales', item: 'Nombre de la institución completo', reference: 'Portada', checked: false, required: true },
  { id: '2', category: 'Datos Generales', item: 'Dirección completa (calle, ciudad, estado, CP)', reference: 'Portada', checked: false, required: true },
  { id: '3', category: 'Datos Generales', item: 'Licencia CNSNS vigente', reference: 'NOM-008', checked: false, required: true },
  { id: '4', category: 'Datos Generales', item: 'Responsable de protección radiológica (nombre, licencia)', reference: 'NOM-008 §5', checked: false, required: true },
  { id: '5', category: 'Equipo', item: 'Marca, modelo y número de serie del equipo', reference: 'Condiciones Generales', checked: false, required: true },
  { id: '6', category: 'Equipo', item: 'Energía fotones (MV) confirmada', reference: 'Condiciones Generales', checked: false, required: true },
  { id: '7', category: 'Equipo', item: 'Energía electrones (MeV) si aplica', reference: 'Condiciones Generales', checked: false, required: false },
  { id: '8', category: 'Equipo', item: 'Tasa de dosis máxima (cGy/min) a dmax', reference: 'Fabricante', checked: false, required: true },
  { id: '9', category: 'Layout', item: 'Plano arquitectónico de la sala (DXF/PDF)', reference: 'LAYOUT_ESTRUCTURAL', checked: false, required: true },
  { id: '10', category: 'Layout', item: 'Dimensiones del bunker: largo, ancho, altura', reference: 'LAYOUT_ESTRUCTURAL', checked: false, required: true },
  { id: '11', category: 'Layout', item: 'Colindancias identificadas (N, S, E, O, arriba, abajo)', reference: 'LAYOUT_ESTRUCTURAL', checked: false, required: true },
  { id: '12', category: 'Layout', item: 'Distancias fuente-punto de cálculo para cada barrera', reference: 'Datos Sala y Puntos', checked: false, required: true },
  { id: '13', category: 'Cálculos', item: 'Barrera primaria calculada (equipo, energía, W, U, T, d)', reference: 'Barreras Primarias', checked: false, required: true },
  { id: '14', category: 'Cálculos', item: 'Barrera secundaria calculada (scatter + leakage)', reference: 'Barreras Secundarias', checked: false, required: true },
  { id: '15', category: 'Cálculos', item: 'Laberinto calculado (si aplica > 10 MV o GK)', reference: 'DISEÑO_LABERINTO', checked: false, required: true },
  { id: '16', category: 'Cálculos', item: 'Puerta del laberinto (neutrones si > 10 MV)', reference: 'Neutrones', checked: false, required: false },
  { id: '17', category: 'Cálculos', item: 'Verificación TADR contra NOM-008', reference: 'NOM-008', checked: false, required: true },
  { id: '18', category: 'Cálculos', item: 'Skyshine evaluado (fotones y neutrones)', reference: 'NCRP 151 §5.3', checked: false, required: false },
  { id: '19', category: 'Materiales', item: 'Material de blindaje especificado con densidad', reference: 'MATERIALES_BLINDAJE', checked: false, required: true },
  { id: '20', category: 'Materiales', item: 'TVL confirmado para energía y material seleccionado', reference: 'NCRP 151 Tabla B.1', checked: false, required: true },
  { id: '21', category: 'QA', item: 'Prueba de integridad del sistema (CHECKLIST_PRE_CNSNS)', reference: 'PRUEBA_INTEGRIDAD', checked: false, required: true },
  { id: '22', category: 'QA', item: 'Memoria analítica completa y firmada', reference: 'MEMORIA_ANALITICA_*', checked: false, required: true },
  { id: '23', category: 'QA', item: 'Plan de contingencias', reference: 'MEMORIA_CONTING', checked: false, required: true },
  { id: '24', category: 'QA', item: 'Registro de mantenimiento programado', reference: 'REGISTRO_MANTENIMIENTO', checked: false, required: true },
  { id: '25', category: 'Normativa', item: 'Cumplimiento NOM-008-NUCL-2018 (límites de exposición)', reference: 'NOM-008', checked: false, required: true },
  { id: '26', category: 'Normativa', item: 'Cumplimiento NOM-040-NUCL (instalaciones radioterapia)', reference: 'NOM-040', checked: false, required: true },
];

export default function ChecklistCNSNSDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <ChecklistContent onOpenChange={onOpenChange} />;
}

function ChecklistContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<CheckItem[]>(DEFAULT_ITEMS);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const requiredCount = items.filter(i => i.required).length;
  const requiredChecked = items.filter(i => i.required && i.checked).length;
  const progress = Math.round((checkedCount / items.length) * 100);

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 text-white p-2 rounded-lg"><ClipboardCheck className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Checklist Pre-CNSNS</h1>
            <p className="text-xs text-slate-500">Validación de trámite ante la Comisión Nacional de Seguridad Nuclear y Salvaguardias</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={requiredChecked === requiredCount ? 'default' : 'secondary'} className="text-xs">
            {requiredChecked}/{requiredCount} requeridos
          </Badge>
          <Button
            aria-label="Cerrar Checklist Pre-CNSNS"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Progreso del checklist</span>
                <span className="text-sm font-bold">{progress}% ({checkedCount}/{items.length})</span>
              </div>
              <Progress value={progress} className="h-3" />
              {requiredChecked === requiredCount ? (
                <div className="mt-2 text-xs text-green-600 font-semibold">✓ Todos los items requeridos completados — Listo para trámite CNSNS</div>
              ) : (
                <div className="mt-2 text-xs text-amber-600">⚠ Faltan {requiredCount - requiredChecked} items requeridos</div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          {categories.map(cat => {
            const catItems = items.filter(i => i.category === cat);
            return (
              <Card key={cat}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{cat}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {catItems.map(item => (
                      <button key={item.id} onClick={() => toggleItem(item.id)} className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${item.checked ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                        {item.checked ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5"/> : <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5"/>}
                        <div className="flex-1">
                          <div className="text-sm">{item.item} {item.required && <Badge variant="destructive" className="text-[10px] ml-1">REQUERIDO</Badge>}</div>
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
    </div>
  );
}
