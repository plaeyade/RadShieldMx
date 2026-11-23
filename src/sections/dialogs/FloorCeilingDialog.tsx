// Fase 9: Blindaje de suelo y techo — NCRP 151 §5.2.3
import { useState, useMemo, type ChangeEvent } from 'react';
import '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import 'sonner';
import { ArrowUpDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { calculateFloorCeiling, type FloorCeilingConfig } from '@/hooks/useFloorCeilingCalc';
import { ALTURA_ENTREPISO_M, ALTURA_PLANTA_BAJA_M, ALTURA_PUNTO_NIVEL_ABAJO_M, ALTURA_PUNTO_NIVEL_ARRIBA_M, EDIFICIO_SIN_SOTANOS } from '@/lib/nivelesEdificio';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function FloorCeilingDialog({ open, onOpenChange }: Props) {
  const [config, setConfig] = useState<FloorCeilingConfig>({
    energy_MeV: 6, workload_Gy_week: 400, useFactor: 0.25,
    isocenterHeight_m: 1.3, roomHeight_m: 4.0,
    floorThickness_m: 1.2, ceilingThickness_m: 1.5,
    areaAboveOccupied: true, areaBelowOccupied: false,
    distanceToAbove_m: 5.5, distanceToBelow_m: 4.0,
    designGoalAbove_mSv_week: 0.02, designGoalBelow_mSv_week: 0.02,
    occupancyAbove: 1, occupancyBelow: 1,
  });

  // Niveles del edificio (datos del propietario, configurables): planta baja 5.40 m y demás niveles 5 m de piso a
  // contrapiso. El edificio NO tiene sótanos (decisión del propietario, 23-11-2026): el campo de sótanos queda oculto
  // salvo que se indique que los hay; entonces empieza vacío y, si el cálculo lo necesita, se pide. Activo por omisión.
  const [porNiveles, setPorNiveles] = useState(true);
  const [haySotanos, setHaySotanos] = useState(!EDIFICIO_SIN_SOTANOS);
  const [niveles, setNiveles] = useState<{ nivelSala: number; alturaPlantaBaja_m: number; alturaEntrepiso_m: number; alturaSotano_m?: number }>(
    { nivelSala: 0, alturaPlantaBaja_m: ALTURA_PLANTA_BAJA_M, alturaEntrepiso_m: ALTURA_ENTREPISO_M });
  const configEfectiva = useMemo<FloorCeilingConfig>(() => (porNiveles
    ? { ...config, niveles: { nivelSala: niveles.nivelSala, edificio: haySotanos
      ? { alturaPlantaBaja_m: niveles.alturaPlantaBaja_m, alturaEntrepiso_m: niveles.alturaEntrepiso_m, alturaSotano_m: niveles.alturaSotano_m }
      : { alturaPlantaBaja_m: niveles.alturaPlantaBaja_m, alturaEntrepiso_m: niveles.alturaEntrepiso_m, sinSotanos: true } } }
    : config), [config, porNiveles, niveles, haySotanos]);
  const result = useMemo(() => calculateFloorCeiling(configEfectiva), [configEfectiva]);
  const setNivel = (k: keyof typeof niveles) => (e: ChangeEvent<HTMLInputElement>) => {
    const x = parseFloat(e.target.value);
    setNiveles((p) => ({ ...p, [k]: k === 'nivelSala' ? Math.round(x || 0) : k === 'alturaSotano_m' ? (x > 0 ? x : undefined) : x }));
  };
  const fmt = (d: number | null) => (d === null ? (haySotanos ? 'pendiente (falta altura de sótano)' : 'no aplica (sin sótanos)') : `${d.toFixed(2)} m`);
  const mm = (x: number) => (Number.isFinite(x) ? x.toFixed(0) : '—');

  const update = (field: keyof FloorCeilingConfig, val: number | boolean) => {
    setConfig(p => ({ ...p, [field]: val }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Fase 9 — Blindaje Suelo y Techo (NCRP 151 §5.2.3)
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-500">
          Calculo de blindaje para areas ocupadas arriba o abajo del vault. 
          Considera scattering primario hacia techo y transmission hacia suelo.
        </p>

        {/* Source params */}
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">Energia (MV)</Label><Input type="number" value={config.energy_MeV} onChange={e => update('energy_MeV', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Workload (Gy/sem)</Label><Input type="number" value={config.workload_Gy_week} onChange={e => update('workload_Gy_week', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Factor Uso (U)</Label><Input type="number" step="0.05" value={config.useFactor} onChange={e => update('useFactor', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
        </div>

        {/* Geometry */}
        <div className="text-xs font-bold text-gray-600 mt-1">Geometria del Vault</div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">Alt. isocentro (m)</Label><Input type="number" step="0.1" value={config.isocenterHeight_m} onChange={e => update('isocenterHeight_m', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Alt. vault (m)</Label><Input type="number" step="0.1" value={config.roomHeight_m} onChange={e => update('roomHeight_m', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
        </div>

        {/* Building levels */}
        <div className="flex items-center gap-2 mt-1">
          <Switch id="fc-por-niveles" checked={porNiveles} onCheckedChange={setPorNiveles} />
          <Label htmlFor="fc-por-niveles" className="text-xs font-bold text-gray-600">Distancias por niveles del edificio</Label>
        </div>
        {porNiveles && (
          <>
            <div className={`grid ${haySotanos ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
              <div><Label htmlFor="fc-nivel" className="text-xs">Nivel de la sala (0 = PB)</Label><Input id="fc-nivel" type="number" step="1" value={niveles.nivelSala} onChange={setNivel('nivelSala')} className="h-8 text-sm" /></div>
              <div><Label htmlFor="fc-pb" className="text-xs">Planta baja, piso a contrapiso (m)</Label><Input id="fc-pb" type="number" step="0.1" value={niveles.alturaPlantaBaja_m} onChange={setNivel('alturaPlantaBaja_m')} className="h-8 text-sm" /></div>
              <div><Label htmlFor="fc-entrepiso" className="text-xs">Demás niveles, piso a contrapiso (m)</Label><Input id="fc-entrepiso" type="number" step="0.1" value={niveles.alturaEntrepiso_m} onChange={setNivel('alturaEntrepiso_m')} className="h-8 text-sm" /></div>
              {haySotanos && <div><Label htmlFor="fc-sotano" className="text-xs">Sótanos, piso a contrapiso (m)</Label><Input id="fc-sotano" type="number" step="0.1" value={niveles.alturaSotano_m ?? ''} placeholder="sin dato" onChange={setNivel('alturaSotano_m')} className="h-8 text-sm" /></div>}
            </div>
            <div className="flex items-center gap-2">
              <Switch id="fc-hay-sotanos" checked={haySotanos} onCheckedChange={setHaySotanos} />
              <Label htmlFor="fc-hay-sotanos" className="text-xs">El edificio tiene sótanos (este proyecto: no)</Label>
            </div>
            {result.nivelesInexistentes.length > 0 && (
              <Alert className="py-2" role="status">
                <AlertDescription className="text-xs">
                  El edificio no tiene sótanos (nivel {result.nivelesInexistentes.join(', ')} no existe): {niveles.nivelSala < 0 ? 'corrija el nivel de la sala.' : 'bajo la sala está el terreno y el suelo no se calcula.'}
                </AlertDescription>
              </Alert>
            )}
            {result.sotanosSinAltura.length > 0 && (
              <Alert variant="destructive" className="py-2" role="alert">
                <AlertDescription className="text-xs">
                  Capture la altura del sótano (nivel {result.sotanosSinAltura.join(', ')}): no hay dato y no se asume ninguna.
                </AlertDescription>
              </Alert>
            )}
            <p className="text-[11px] text-gray-500">
              Punto protegido a {ALTURA_PUNTO_NIVEL_ARRIBA_M} m sobre el piso de arriba y a {ALTURA_PUNTO_NIVEL_ABAJO_M} m sobre el piso de abajo.
              Distancia isocentro → punto: arriba {fmt(result.distanceToAbove_m)}, abajo {fmt(result.distanceToBelow_m)}.
            </p>
          </>
        )}

        {/* Existing structure */}
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Espesor techo existente (m)</Label><Input type="number" step="0.05" value={config.ceilingThickness_m} onChange={e => update('ceilingThickness_m', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">Espesor suelo existente (m)</Label><Input type="number" step="0.05" value={config.floorThickness_m} onChange={e => update('floorThickness_m', parseFloat(e.target.value))} className="h-8 text-sm" /></div>
        </div>

        {/* Occupied areas */}
        <div className="text-xs font-bold text-gray-600 mt-1">Areas Ocupadas</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={config.areaAboveOccupied} onCheckedChange={v => update('areaAboveOccupied', v)} />
            <div>
              <Label className="text-xs">Area arriba ocupada</Label>
              {config.areaAboveOccupied && (
                <div className="space-y-1 mt-1">
                  <Input type="number" step="0.1" value={porNiveles ? (result.distanceToAbove_m === null ? '' : +result.distanceToAbove_m.toFixed(2)) : config.distanceToAbove_m} disabled={porNiveles} aria-label="Distancia isocentro a punto arriba (m)" onChange={e => update('distanceToAbove_m', parseFloat(e.target.value))} className="h-7 text-xs" placeholder="Dist. (m)" />
                  <Input type="number" step="0.01" value={config.occupancyAbove} onChange={e => update('occupancyAbove', parseFloat(e.target.value))} className="h-7 text-xs" placeholder="T factor" />
                  <Input type="number" step="0.001" value={config.designGoalAbove_mSv_week} onChange={e => update('designGoalAbove_mSv_week', parseFloat(e.target.value))} className="h-7 text-xs" placeholder="Objetivo mSv/sem" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.areaBelowOccupied} onCheckedChange={v => update('areaBelowOccupied', v)} />
            <div>
              <Label className="text-xs">Area abajo ocupada</Label>
              {config.areaBelowOccupied && (
                <div className="space-y-1 mt-1">
                  <Input type="number" step="0.1" value={porNiveles ? (result.distanceToBelow_m === null ? '' : +result.distanceToBelow_m.toFixed(2)) : config.distanceToBelow_m} disabled={porNiveles} aria-label="Distancia isocentro a punto abajo (m)" onChange={e => update('distanceToBelow_m', parseFloat(e.target.value))} className="h-7 text-xs" placeholder="Dist. (m)" />
                  <Input type="number" step="0.01" value={config.occupancyBelow} onChange={e => update('occupancyBelow', parseFloat(e.target.value))} className="h-7 text-xs" placeholder="T factor" />
                  <Input type="number" step="0.001" value={config.designGoalBelow_mSv_week} onChange={e => update('designGoalBelow_mSv_week', parseFloat(e.target.value))} className="h-7 text-xs" placeholder="Objetivo mSv/sem" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2 border-t pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Card><CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-blue-700">{result.scatterAngle_deg.toFixed(1)}°</div>
              <div className="text-[10px] text-gray-500">Angulo scattering techo</div>
            </CardContent></Card>
            <Card><CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-purple-700">{(result.scatterFraction * 100).toFixed(2)}%</div>
              <div className="text-[10px] text-gray-500">Fraccion scatter</div>
            </CardContent></Card>
          </div>

          {/* Ceiling result */}
          {config.areaAboveOccupied && (
            <div className="border rounded p-2">
              <div className="text-xs font-medium flex items-center gap-2">
                TECHO (arriba):
                {result.ceilingCompliant ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                <Badge variant={result.ceilingCompliant ? 'default' : 'destructive'} className="text-[9px]">{result.ceilingCompliant ? 'CUMPLE' : Number.isFinite(result.ceilingRequiredThickness_mm) ? 'FALTA BLINDAJE' : 'FALTA DATO'}</Badge>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Kerma no atenuado: <strong>{result.ceilingKerma_unshielded_mSv_week.toFixed(3)}</strong> mSv/sem | 
                Espesor requerido: <strong>{mm(result.ceilingRequiredThickness_mm)}</strong> mm concreto
                {!result.ceilingCompliant && <span className="text-red-600"> | Extra necesario: <strong>{mm(result.ceilingExtraNeeded_mm)} mm</strong> concreto{Number.isFinite(result.ceilingExtraNeeded_mm) && <> ({(result.ceilingExtraNeeded_mm * 0.15).toFixed(1)} mm Pb equivalente)</>}</span>}
              </div>
            </div>
          )}

          {/* Floor result (sin sótanos, bajo PB no hay nada que blindar) */}
          {config.areaBelowOccupied && result.nivelesInexistentes.length === 0 && (
            <div className="border rounded p-2">
              <div className="text-xs font-medium flex items-center gap-2">
                SUELO (abajo):
                {result.floorCompliant ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                <Badge variant={result.floorCompliant ? 'default' : 'destructive'} className="text-[9px]">{result.floorCompliant ? 'CUMPLE' : Number.isFinite(result.floorRequiredThickness_mm) ? 'FALTA BLINDAJE' : 'FALTA DATO'}</Badge>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Kerma no atenuado: <strong>{result.floorKerma_unshielded_mSv_week.toFixed(3)}</strong> mSv/sem | 
                Espesor requerido: <strong>{mm(result.floorRequiredThickness_mm)}</strong> mm concreto
                {!result.floorCompliant && <span className="text-red-600"> | Extra necesario: <strong>{mm(result.floorExtraNeeded_mm)} mm</strong> concreto</span>}
              </div>
            </div>
          )}

          <Alert className="py-2">
            <AlertDescription className="text-xs">{result.recommendation}</AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
