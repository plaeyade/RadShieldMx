// =============================================================================
// LayoutBunkerDialog — Dimensiones mínimas + Layouts detallados por modalidad (v14.4)
// =============================================================================
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ruler, AlertTriangle, CheckCircle, DoorOpen, Map, FileDown, Layers, Route, SlidersHorizontal } from 'lucide-react';
import FullscreenShell from '@/components/FullscreenShell';
import { BUNKER_LAYOUTS, getAllLayoutsForType, DETAILED_LAYOUTS, getDetailedLayout, type BunkerLayout, type DetailedLayout } from '@/lib/bunkerLayouts';
import {
  TESTFIT_ADAPTED_CAPABILITIES,
  buildControlledZoneCalculationPacket,
  buildDefaultControlledZoneProfile,
  generateControlledZoneFeasibility,
  summarizeControlledZoneFeasibility,
  type ControlledZoneFeasibilityOption,
  type ControlledZoneProfile,
} from '@/lib/controlledZoneFeasibility';
import {
  buildControlledZoneDbPersistenceDraft,
  exportControlledZoneDbPersistenceDraft,
  calculateControlledZoneShieldingPlan,
  exportControlledZoneShieldingPlan,
  parseControlledZoneShieldingPlanJson,
  type ControlledZoneShieldingPlan,
} from '@/lib/controlledZoneCalculationAdapter';
import {
  applyControlledZoneShieldingPlanToFloorPlan,
  loadControlledZoneShieldingPlanSnapshot,
  saveControlledZoneShieldingPlanSnapshot,
} from '@/lib/controlledZoneFloorPlanAdapter';
import { useControlledZonePersistence } from '@/hooks/useBackend';
import type { FloorPlan } from '@/types/radshield';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlan?: FloorPlan;
  onApplyFloorPlan?: (floorPlan: FloorPlan) => void;
}

export default function LayoutBunkerDialog({ open, onOpenChange, floorPlan, onApplyFloorPlan }: Props) {
  if (!open) return null;
  return <LayoutContent onOpenChange={onOpenChange} floorPlan={floorPlan} onApplyFloorPlan={onApplyFloorPlan} />;
}

function LayoutContent({
  onOpenChange,
  floorPlan,
  onApplyFloorPlan,
}: {
  onOpenChange: (open: boolean) => void;
  floorPlan?: FloorPlan;
  onApplyFloorPlan?: (floorPlan: FloorPlan) => void;
}) {
  const [selectedType, setSelectedType] = useState('LINAC');
  const [viewMode, setViewMode] = useState<'dimensions' | 'detailed' | 'feasibility'>('dimensions');
  const [siteWidthM, setSiteWidthM] = useState('22');
  const [siteLengthM, setSiteLengthM] = useState('28');
  const [controlledWidthM, setControlledWidthM] = useState('14');
  const [controlledLengthM, setControlledLengthM] = useState('18');
  const [maxBudgetMxn, setMaxBudgetMxn] = useState('30000000');
  const [targetThroughput, setTargetThroughput] = useState('24');
  const [preferMaze, setPreferMaze] = useState(true);
  const [publicAccessSide, setPublicAccessSide] = useState<ControlledZoneProfile['publicAccessSide']>('south');
  const [controlledAccessSide, setControlledAccessSide] = useState<ControlledZoneProfile['controlledAccessSide']>('north');
  const [detailedModality, setDetailedModality] = useState('PET-CT con Ciclotrón');
  const layouts = getAllLayoutsForType(selectedType);
  const equipmentTypes = [...new Set(BUNKER_LAYOUTS.map(l => l.equipmentType))];
  const selectedDetailed = getDetailedLayout(detailedModality);
  const feasibilityProfile = useMemo(() => buildDefaultControlledZoneProfile({
    siteWidth_m: parsePositive(siteWidthM, 22),
    siteLength_m: parsePositive(siteLengthM, 28),
    controlledZoneWidth_m: parsePositive(controlledWidthM, 14),
    controlledZoneLength_m: parsePositive(controlledLengthM, 18),
    maxBudget_mxn: parsePositive(maxBudgetMxn, 30000000),
    targetThroughputPerDay: parsePositive(targetThroughput, 24),
    preferMaze,
    publicAccessSide,
    controlledAccessSide,
  }), [siteWidthM, siteLengthM, controlledWidthM, controlledLengthM, maxBudgetMxn, targetThroughput, preferMaze, publicAccessSide, controlledAccessSide]);
  const feasibilityOptions = useMemo(() => generateControlledZoneFeasibility(feasibilityProfile), [feasibilityProfile]);
  const feasibilitySummary = useMemo(() => summarizeControlledZoneFeasibility(feasibilityOptions), [feasibilityOptions]);

  return (
    <FullscreenShell
      title="Layouts de Bunkers"
      subtitle="Dimensiones minimas, layout detallado y factibilidad de zona controlada - F395"
      icon={<Ruler className="h-5 w-5" />}
      accentClassName="bg-slate-700"
      traceId="f395-layout-bunker-fullscreen-shell"
      onClose={() => onOpenChange(false)}
    >
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 text-white p-2 rounded-lg"><Ruler className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Layouts de Bunkers</h1>
            <p className="text-xs text-slate-500">Dimensiones mínimas + Layouts detallados por modalidad (LAYOUT_ESTR_*)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'dimensions' | 'detailed' | 'feasibility')}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dimensions">Dimensiones</SelectItem>
              <SelectItem value="detailed">Layout detallado</SelectItem>
              <SelectItem value="feasibility">Factibilidad</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === 'dimensions' ? (
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{equipmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          ) : viewMode === 'detailed' ? (
            <Select value={detailedModality} onValueChange={setDetailedModality}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>{DETAILED_LAYOUTS.map(d => <SelectItem key={d.modality} value={d.modality}>{d.modality}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Badge className="bg-emerald-600">Zona controlada</Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {viewMode === 'dimensions' ? (
            <>
              {layouts.map((layout, idx) => <LayoutCard key={idx} layout={layout} />)}
              {layouts.length === 0 && <div className="text-center text-slate-400 py-20"><Ruler className="w-16 h-16 mx-auto mb-3 opacity-30" /><p className="text-sm">Seleccione un tipo de equipo</p></div>}
            </>
          ) : viewMode === 'detailed' && selectedDetailed ? (
            <DetailedLayoutCard layout={selectedDetailed} />
          ) : viewMode === 'feasibility' ? (
            <ControlledZoneFeasibilityPanel
              profile={feasibilityProfile}
              options={feasibilityOptions}
              summary={feasibilitySummary}
              siteWidthM={siteWidthM}
              siteLengthM={siteLengthM}
              controlledWidthM={controlledWidthM}
              controlledLengthM={controlledLengthM}
              maxBudgetMxn={maxBudgetMxn}
              targetThroughput={targetThroughput}
              preferMaze={preferMaze}
              publicAccessSide={publicAccessSide}
              controlledAccessSide={controlledAccessSide}
              setSiteWidthM={setSiteWidthM}
              setSiteLengthM={setSiteLengthM}
              setControlledWidthM={setControlledWidthM}
              setControlledLengthM={setControlledLengthM}
              setMaxBudgetMxn={setMaxBudgetMxn}
              setTargetThroughput={setTargetThroughput}
              setPreferMaze={setPreferMaze}
              setPublicAccessSide={setPublicAccessSide}
              setControlledAccessSide={setControlledAccessSide}
              floorPlan={floorPlan}
              onApplyFloorPlan={onApplyFloorPlan}
            />
          ) : (
            <div className="text-center text-slate-400 py-20"><Map className="w-16 h-16 mx-auto mb-3 opacity-30" /><p className="text-sm">Seleccione una modalidad</p></div>
          )}
        </div>
      </div>
    </FullscreenShell>
  );
}

function LayoutCard({ layout }: { layout: BunkerLayout }) {
  const [expanded, setExpanded] = useState(false);
  const COL = ['bg-blue-50 border-blue-200','bg-emerald-50 border-emerald-200','bg-amber-50 border-amber-200','bg-violet-50 border-violet-200'];
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{layout.equipmentType} — {layout.equipmentSubtype}</CardTitle>
            <Badge variant={layout.mazeRequired ? 'default' : 'secondary'}>{layout.mazeRequired ? 'Laberinto obligatorio' : 'Laberinto opcional'}</Badge>
          </div>
          <span className="text-xs text-slate-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          <div className={`${COL[0]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Largo</div><div className="text-xl font-bold">{layout.minLength_m} m</div></div>
          <div className={`${COL[0]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Ancho</div><div className="text-xl font-bold">{layout.minWidth_m} m</div></div>
          <div className={`${COL[0]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Altura</div><div className="text-xl font-bold">{layout.minHeight_m} m</div></div>
          <div className={`${COL[1]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Área mínima</div><div className="text-xl font-bold">{(layout.minLength_m * layout.minWidth_m).toFixed(1)} m²</div></div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className={`${COL[2]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Paredes mín.</div><div className="text-lg font-bold">{layout.minWallThickness_cm} cm</div></div>
          <div className={`${COL[2]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Techo mín.</div><div className="text-lg font-bold">{layout.ceilingThickness_cm} cm</div></div>
          <div className={`${COL[2]} border-2 rounded-lg p-3`}><div className="text-xs font-semibold opacity-70">Piso mín.</div><div className="text-lg font-bold">{layout.floorThickness_cm} cm</div></div>
        </div>
        {layout.mazeRequired && (
          <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
            <DoorOpen className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-800">Laberinto: {layout.mazeMinWidth_m}m ancho mín. — {layout.controlRoomAdjacent ? 'Control adyacente' : 'Control separada'}</span>
          </div>
        )}
        {expanded && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-800 mb-1">Notas</div>
            <ul className="space-y-1">{layout.notes.map((n, i) => <li key={i} className="text-xs text-blue-700 flex items-start gap-2"><CheckCircle className="w-3 h-3 mt-0.5 shrink-0"/>{n}</li>)}</ul>
            <div className="text-xs text-slate-500 mt-2">Ref: {layout.source}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailedLayoutCard({ layout }: { layout: DetailedLayout }) {
  return (
    <Card className="border-slate-300">
      <CardHeader className="pb-2 bg-slate-50"><CardTitle className="text-base flex items-center gap-2"><Map className="w-5 h-5"/>{layout.modality}</CardTitle></CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="text-sm text-slate-600">{layout.description}</div>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">Parámetros generales</CardTitle></CardHeader>
          <CardContent><div className="grid grid-cols-2 gap-2">{Object.entries(layout.generalParams).map(([k, v], i) => <div key={i} className="bg-slate-50 border rounded p-2"><div className="text-xs text-slate-500">{k}</div><div className="text-xs font-semibold">{v}</div></div>)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm">Colindancias y puntos de cálculo</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100"><tr><th className="px-2 py-1 text-left">Punto</th><th className="px-2 py-1 text-left">Colindancia</th><th className="px-2 py-1 text-center">Zona</th><th className="px-2 py-1 text-center">Dist.</th><th className="px-2 py-1 text-left">Nota</th></tr></thead>
                <tbody>{layout.colindancias.map((c, i) => <tr key={i} className="border-b hover:bg-slate-50"><td className="px-2 py-1.5 font-bold">{c.punto}</td><td className="px-2 py-1.5">{c.nombre}</td><td className="px-2 py-1.5 text-center"><Badge variant={c.zona === 'Controlada' ? 'default' : 'secondary'} className="text-[9px]">{c.zona}</Badge></td><td className="px-2 py-1.5 text-center font-mono">{c.distancia_m}m</td><td className="px-2 py-1.5 text-slate-500">{c.nota}</td></tr>)}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-blue-800 mb-1">Notas específicas</div>
          <ul className="space-y-1">{layout.specificNotes.map((n, i) => <li key={i} className="text-xs text-blue-700 flex items-start gap-2"><CheckCircle className="w-3 h-3 mt-0.5 shrink-0"/>{n}</li>)}</ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface ControlledZoneFeasibilityPanelProps {
  profile: ControlledZoneProfile;
  options: ControlledZoneFeasibilityOption[];
  summary: ReturnType<typeof summarizeControlledZoneFeasibility>;
  siteWidthM: string;
  siteLengthM: string;
  controlledWidthM: string;
  controlledLengthM: string;
  maxBudgetMxn: string;
  targetThroughput: string;
  preferMaze: boolean;
  publicAccessSide: ControlledZoneProfile['publicAccessSide'];
  controlledAccessSide: ControlledZoneProfile['controlledAccessSide'];
  setSiteWidthM: (value: string) => void;
  setSiteLengthM: (value: string) => void;
  setControlledWidthM: (value: string) => void;
  setControlledLengthM: (value: string) => void;
  setMaxBudgetMxn: (value: string) => void;
  setTargetThroughput: (value: string) => void;
  setPreferMaze: (value: boolean) => void;
  setPublicAccessSide: (value: ControlledZoneProfile['publicAccessSide']) => void;
  setControlledAccessSide: (value: ControlledZoneProfile['controlledAccessSide']) => void;
  floorPlan?: FloorPlan;
  onApplyFloorPlan?: (floorPlan: FloorPlan) => void;
}

function ControlledZoneFeasibilityPanel(props: ControlledZoneFeasibilityPanelProps) {
  const {
    profile,
    options,
    summary,
    siteWidthM,
    siteLengthM,
    controlledWidthM,
    controlledLengthM,
    maxBudgetMxn,
    targetThroughput,
    preferMaze,
    publicAccessSide,
    controlledAccessSide,
    setSiteWidthM,
    setSiteLengthM,
    setControlledWidthM,
    setControlledLengthM,
    setMaxBudgetMxn,
    setTargetThroughput,
    setPreferMaze,
    setPublicAccessSide,
    setControlledAccessSide,
    floorPlan,
    onApplyFloorPlan,
  } = props;
  const bestOption = options[0];
  const [shieldingPlan, setShieldingPlan] = useState<ControlledZoneShieldingPlan | null>(null);
  const [floorPlanImportMessage, setFloorPlanImportMessage] = useState('');
  const [planExchangeMessage, setPlanExchangeMessage] = useState('');
  const [dbPersistenceMessage, setDbPersistenceMessage] = useState('');
  const planImportInputRef = useRef<HTMLInputElement | null>(null);
  const controlledZonePersistence = useControlledZonePersistence();

  const exportBestOption = () => {
    if (!bestOption) return;
    const packet = buildControlledZoneCalculationPacket(bestOption, profile);
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${bestOption.id}-calculation-packet.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sendBestOptionToCalculation = () => {
    if (!bestOption) return;
    setShieldingPlan(calculateControlledZoneShieldingPlan(bestOption, profile));
    setPlanExchangeMessage('Plan preliminar generado desde la mejor opcion de factibilidad.');
  };

  const exportShieldingPlan = () => {
    if (!shieldingPlan) return;
    const exported = exportControlledZoneShieldingPlan(shieldingPlan);
    downloadText(exported.fileName, exported.body, exported.mimeType);
  };

  const exportAnalyticMemoryDraft = () => {
    if (!shieldingPlan) return;
    downloadText(`${shieldingPlan.optionId}-memoria-preliminar.md`, shieldingPlan.analyticMemoryDraft, 'text/markdown');
  };

  const exportDbDraft = () => {
    if (!shieldingPlan) return;
    const exported = exportControlledZoneDbPersistenceDraft(shieldingPlan);
    downloadText(exported.fileName, exported.body, exported.mimeType);
  };

  const persistDbDraft = async () => {
    if (!shieldingPlan) {
      setDbPersistenceMessage('Genere o importe un plan preliminar antes de guardar.');
      return;
    }

    try {
      setDbPersistenceMessage('Guardando borrador de zona controlada en backend...');
      const result = await controlledZonePersistence.persistDraft({
        draft: buildControlledZoneDbPersistenceDraft(shieldingPlan),
      });
      setDbPersistenceMessage(
        result?.mode === 'exists'
          ? `Plan ya persistido: ${shieldingPlan.optionName}.`
          : `Plan persistido: ${shieldingPlan.optionName}. ${shieldingPlan.calculations.length} calculos vinculados.`,
      );
    } catch (error) {
      setDbPersistenceMessage(error instanceof Error ? error.message : 'No se pudo guardar el borrador en backend.');
    }
  };

  const recoverLocalSnapshot = () => {
    const recovered = loadControlledZoneShieldingPlanSnapshot(
      typeof window !== 'undefined' ? window.localStorage : undefined,
    );
    if (!recovered) {
      setPlanExchangeMessage('No hay snapshot local de plan preliminar para recuperar.');
      return;
    }
    setShieldingPlan(recovered);
    setPlanExchangeMessage(`Snapshot local recuperado: ${recovered.optionName}.`);
  };

  const importShieldingPlan = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const raw = await file.text();
      const imported = parseControlledZoneShieldingPlanJson(raw);
      setShieldingPlan(imported);
      saveControlledZoneShieldingPlanSnapshot(
        imported,
        typeof window !== 'undefined' ? window.localStorage : undefined,
      );
      setPlanExchangeMessage(`Plan importado: ${imported.optionName}. Snapshot actualizado.`);
    } catch (error) {
      setPlanExchangeMessage(error instanceof Error ? error.message : 'No se pudo importar el plan.');
    }
  };

  const applyShieldingPlanToFloorPlan = () => {
    if (!shieldingPlan || !floorPlan || !onApplyFloorPlan) {
      setFloorPlanImportMessage('Abra este modulo desde el diseñador principal para aplicar al plano.');
      return;
    }
    const result = applyControlledZoneShieldingPlanToFloorPlan(floorPlan, shieldingPlan);
    const saved = saveControlledZoneShieldingPlanSnapshot(
      shieldingPlan,
      typeof window !== 'undefined' ? window.localStorage : undefined,
    );
    onApplyFloorPlan(result.floorPlan);
    setFloorPlanImportMessage(
      `Plano actualizado: ${result.addedBarriers} barreras, ${result.addedSources} fuente y ${result.addedRegions} zona controlada.${saved ? ' Plan guardado localmente.' : ''}`,
    );
  };

  return (
    <div className="space-y-4" data-testid="layout-feasibility-panel">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
              Factibilidad de zona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Sitio ancho m" value={siteWidthM} onChange={setSiteWidthM} />
              <NumberField label="Sitio largo m" value={siteLengthM} onChange={setSiteLengthM} />
              <NumberField label="Zona ancho m" value={controlledWidthM} onChange={setControlledWidthM} />
              <NumberField label="Zona largo m" value={controlledLengthM} onChange={setControlledLengthM} />
              <NumberField label="Presupuesto MXN" value={maxBudgetMxn} onChange={setMaxBudgetMxn} />
              <NumberField label="Pacientes/dia" value={targetThroughput} onChange={setTargetThroughput} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SideSelect label="Acceso publico" value={publicAccessSide} onChange={setPublicAccessSide} />
              <SideSelect label="Acceso controlado" value={controlledAccessSide} onChange={setControlledAccessSide} />
            </div>

            <label className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-700">Priorizar laberinto</span>
              <input type="checkbox" checked={preferMaze} onChange={(event) => setPreferMaze(event.target.checked)} />
            </label>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Metric label="Opciones" value={summary.optionCount} />
              <Metric label="Score" value={summary.bestScore} />
              <Metric label="Puntos" value={summary.shieldingSeedCount} />
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-xs font-semibold text-emerald-900">De layout a memoria</div>
              <div className="mt-1 text-xs text-emerald-800">
                La opcion aprobada ya contiene zona controlada, rooms, barreras, distancia, ocupacion inicial y familia de calculo.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-700" />
                  Opciones generadas
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={sendBestOptionToCalculation} disabled={!bestOption}>
                    <Route className="w-4 h-4 mr-2" />
                    Enviar a calculo
                  </Button>
                  <Button size="sm" onClick={exportBestOption} disabled={!bestOption}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar paquete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {shieldingPlan && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-blue-950">Plan preliminar de blindaje</div>
                      <div className="mt-1 text-xs text-blue-800">
                        {shieldingPlan.summary.barrierCount} barreras | max {shieldingPlan.summary.maxThickness_mm} mm | K0 max {shieldingPlan.summary.maxUnshielded_mSvWeek} mSv/sem
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={exportShieldingPlan}>JSON calculo</Button>
                      <Button size="sm" variant="outline" onClick={exportAnalyticMemoryDraft}>Memoria MD</Button>
                      <Button size="sm" variant="outline" onClick={exportDbDraft}>DB draft</Button>
                      <Button size="sm" variant="outline" onClick={persistDbDraft} disabled={controlledZonePersistence.isLoading}>
                        {controlledZonePersistence.isLoading ? 'Guardando...' : 'Guardar DB'}
                      </Button>
                      <Button size="sm" onClick={applyShieldingPlanToFloorPlan}>Aplicar al plano</Button>
                    </div>
                  </div>
                  {dbPersistenceMessage && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-blue-900">
                      <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{dbPersistenceMessage}</span>
                    </div>
                  )}
                  {floorPlanImportMessage && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-blue-900">
                      <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{floorPlanImportMessage}</span>
                    </div>
                  )}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="text-blue-900"><tr><th className="text-left">Barrera</th><th>Metodo</th><th>Zona</th><th>K0</th><th>Espesor</th><th>Estado</th></tr></thead>
                      <tbody>
                        {shieldingPlan.calculations.map((calc) => (
                          <tr key={calc.seedId} className="border-t border-blue-200">
                            <td className="py-1 font-semibold">{calc.barrier}</td>
                            <td className="py-1 text-center">{calc.method}</td>
                            <td className="py-1 text-center">{calc.adjacentZone}</td>
                            <td className="py-1 text-center">{calc.unshielded_mSvWeek}</td>
                            <td className="py-1 text-center">{calc.requiredThickness_mm} mm</td>
                            <td className="py-1 text-center">{calc.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Intercambio de plan preliminar</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Importa o recupera `shielding-plan.json` para continuar memoria, reporte o aplicacion al plano.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={planImportInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={importShieldingPlan}
                    />
                    <Button size="sm" variant="outline" onClick={() => planImportInputRef.current?.click()}>
                      Importar JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={recoverLocalSnapshot}>
                      Recuperar local
                    </Button>
                  </div>
                </div>
                {planExchangeMessage && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{planExchangeMessage}</span>
                  </div>
                )}
              </div>
              {options.map((option) => (
                <div key={option.id} className="rounded-lg border bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={option.id === summary.bestOptionId ? 'bg-emerald-600' : 'bg-slate-700'}>{option.totalScore}/100</Badge>
                        <div className="font-semibold text-slate-900">{option.name}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{option.modality} | {option.footprint_m2.toFixed(0)} m2 | {formatMxn(option.estimatedCost_mxn)}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <Metric label="Ajuste" value={option.fitScore} />
                      <Metric label="Blindaje" value={option.shieldingReadinessScore} />
                      <Metric label="Flujo" value={option.workflowScore} />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
                    <div className="rounded-md border bg-slate-50 p-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700"><Map className="w-4 h-4" />Zona controlada</div>
                      <div className="grid grid-cols-2 gap-1">
                        {option.rooms.map((room) => (
                          <div key={room.id} className="rounded border bg-white px-2 py-1 text-[11px]">
                            <div className="font-semibold text-slate-800">{room.name}</div>
                            <div className="text-slate-500">{room.zone} | {room.width_m} x {room.length_m} m</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border bg-slate-50 p-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700"><Route className="w-4 h-4" />Semillas de calculo</div>
                      <div className="max-h-32 overflow-auto">
                        <table className="w-full text-[11px]">
                          <thead className="text-slate-500"><tr><th className="text-left">Barrera</th><th>Zona</th><th>Dist.</th><th>Metodo</th></tr></thead>
                          <tbody>
                            {option.shieldingSeeds.map((seed) => (
                              <tr key={seed.id} className="border-t">
                                <td className="py-1 font-semibold">{seed.barrier}</td>
                                <td className="py-1 text-center">{seed.adjacentZone}</td>
                                <td className="py-1 text-center">{seed.distance_m.toFixed(1)} m</td>
                                <td className="py-1 text-center">{seed.calculationFamily}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {option.warnings.length > 0 && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2">
                      {option.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-amber-800">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {TESTFIT_ADAPTED_CAPABILITIES.map((capability) => (
              <div key={capability} className="rounded-md border bg-slate-50 p-2 text-[11px] text-slate-600">{capability}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-slate-500">{label}</Label>
      <Input className="h-8 text-xs" value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" />
    </div>
  );
}

function SideSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ControlledZoneProfile['publicAccessSide'];
  onChange: (value: ControlledZoneProfile['publicAccessSide']) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-slate-500">{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as ControlledZoneProfile['publicAccessSide'])}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="north">Norte</SelectItem>
          <SelectItem value="south">Sur</SelectItem>
          <SelectItem value="east">Este</SelectItem>
          <SelectItem value="west">Oeste</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-white px-2 py-1">
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function parsePositive(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatMxn(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

function downloadText(fileName: string, body: string, mimeType: string) {
  const blob = new Blob([body], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
