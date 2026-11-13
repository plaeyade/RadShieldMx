// =============================================================================
// NuclearMedicineAdvanced.tsx — Advanced Nuclear Medicine Shielding Module
// PET/CT, SPECT, Therapy (Lu-177, I-131, Y-90), MIRD dosimetry, Decay storage
// Based on: AAPM TG 108, NCRP 147/151 Ch.B.7, ICRP 106, IAEA SSG-46
// =============================================================================
import { useState, useMemo } from 'react';
import { espesorPET } from '@/lib/calculadorasNormativas';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Atom, Shield, Activity, FlaskConical, Clock, TrendingDown, AlertTriangle, CheckCircle, Info, Download, CloudUpload,
} from 'lucide-react';
import { BACKEND_ENABLED, trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import {
  RADIONUCLIDES, NM_ROOM_CONFIGS,
  calculateWeeklyKerma,
  decayedActivity, estimateMIRDDose,
  canReleasePatient, bremsstrahlungShielding,
  espesorRadionuclidoTerapia,
} from '@/lib/nuclearMedicine';
import {
  buildIdacDoseReadinessPack,
  estimateIdacEffectiveDose,
  findIdacPhantom,
  getIdacCoefficientForNuclide,
  IDAC_DOSE_EXTERNAL_NOTE,
  IDAC_REFERENCE_PHANTOMS,
} from '@/lib/idacDoseIntegration';
import {
  buildInternalDosimetryDataset,
  summarizeInternalDosimetryDataset,
} from '@/lib/internalDosimetryDataset';
import {
  createLocalStorageDosimetryStorage,
  createLocalStorageDosimetrySyncQueue,
  DOSIMETRY_STORAGE_KEY,
  DOSIMETRY_SYNC_QUEUE_KEY,
  enqueueDosimetryWorkspaceSync,
  getPendingDosimetrySyncItems,
  markDosimetrySyncAttempt,
  markDosimetrySyncFailure,
  markDosimetrySyncSuccess,
  persistDosimetryDataset,
  summarizeDosimetrySyncQueue,
  summarizeDosimetryWorkspace,
  type DosimetrySyncQueueDriver,
  type DosimetryWorkspace,
} from '@/lib/dosimetryPersistenceAdapter';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const EMISORES_511 = new Set(['F-18', 'Ga-68', 'Cu-64']);

/** Espesor (mm) para la transmisión B: TG-108 Tabla V para emisores β+; I-131, Lu-177 e I-123 por la regla espectral GP; si no, n·TVL. */
function espesorNM(simbolo: string, material: string, B: number, tvl_mm: number): { mm: number; metodo: string } {
  if (B >= 1) return { mm: 0, metodo: '—' };
  if (EMISORES_511.has(simbolo) && (material === 'lead' || material === 'concrete')) {
    return { mm: espesorPET(material, B), metodo: 'AAPM TG-108 Tabla V (banda ancha, 511 keV)' };
  }
  return espesorRadionuclidoTerapia(simbolo, material === 'lead' ? 'lead' : 'concrete', B, tvl_mm);
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'PET': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'SPECT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Therapy': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default function NuclearMedicineAdvanced({ open, onOpenChange }: Props) {
  const { isAuthenticated } = useAuth();
  const [selectedNuclide, setSelectedNuclide] = useState('F-18');
  const [activity_GBq, setActivity_GBq] = useState('3.7');
  const [distance_m, setDistance_m] = useState('2.0');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [designGoal_uSv, setDesignGoal_uSv] = useState('100');
  const [selectedRoom, setSelectedRoom] = useState('PET Injection Room');
  const [materialType, setMaterialType] = useState<'lead' | 'concrete'>('lead');
  const [showDecayChart, setShowDecayChart] = useState(false);
  const [selectedIdacPhantom, setSelectedIdacPhantom] = useState('adult-reference-person');
  const [dosimetryPersistenceMessage, setDosimetryPersistenceMessage] = useState('Sin guardado local');
  const [dosimetryServerMessage, setDosimetryServerMessage] = useState(
    BACKEND_ENABLED ? 'Servidor pendiente' : 'Servidor desactivado',
  );
  const [dosimetryQueueMessage, setDosimetryQueueMessage] = useState('Cola sin pendientes');
  const dosimetryWorkspaceMutation = trpc.dosimetry.upsertWorkspace.useMutation({
    onSuccess: () => {
      setDosimetryServerMessage('Sincronizado con DB');
      toast.success('Workspace dosimetrico sincronizado con DB');
    },
    onError: (error: { message?: string }) => {
      const message = error.message ?? 'No se pudo sincronizar con DB';
      setDosimetryServerMessage(`DB pendiente: ${message}`);
      toast.warning('Persistencia local OK; DB pendiente');
    },
  });

  const nuclide = useMemo(() =>
    RADIONUCLIDES.find(r => r.symbol === selectedNuclide),
    [selectedNuclide]
  );

  const room = useMemo(() =>
    NM_ROOM_CONFIGS.find(r => r.roomType === selectedRoom),
    [selectedRoom]
  );

  // ── Calculations ──
  // Fase 8c: para emisores β+ (511 keV) el espesor sale de la transmisión de banda ancha de AAPM TG-108 Tabla V
  // (`espesorPET`; antes, TVL de biblioteca: F-18 plomo 13.6 mm frente a ≈ 16.5 mm de TG-108, no conservador). Para el
  // resto se conserva el TVL de la biblioteca, rotulado como no validado.
  const shieldingCalc = useMemo(() => {
    if (!nuclide) return null;
    const A = parseFloat(activity_GBq) || 0;
    const d = parseFloat(distance_m) || 1;
    const t = parseFloat(hoursPerWeek) || 0;
    const P = parseFloat(designGoal_uSv) || 100;
    const kermaUnshielded = calculateWeeklyKerma(nuclide.gammaConstant_mSv_m2_GBq_h, A, t, d);
    const tvl = materialType === 'lead' ? nuclide.TVL_lead_mm : nuclide.TVL_concrete_mm;
    const hvl = materialType === 'lead' ? nuclide.HVL_lead_mm : nuclide.HVL_concrete_mm;
    const transmission = kermaUnshielded > 0 ? Math.min(1, P / 1000 / kermaUnshielded) : 1;
    const e = espesorNM(nuclide.symbol, materialType, transmission, tvl);
    return { kermaUnshielded, thickness: e.mm, metodo: e.metodo, transmission, tvl, hvl };
  }, [nuclide, activity_GBq, distance_m, hoursPerWeek, designGoal_uSv, materialType]);

  const roomCalc = useMemo(() => {
    if (!nuclide || !room) return null;
    const A = room.typicalDose_GBq;
    const d = room.distanceToBarrier_m;
    const t = room.patientsPerWeek * 1; // 1 h por paciente (supuesto de la configuración de sala)
    const P = room.designGoal_uSv_week;
    const kermaUnshielded = calculateWeeklyKerma(nuclide.gammaConstant_mSv_m2_GBq_h, A, t, d);
    const B = kermaUnshielded > 0 ? Math.min(1, P / 1000 / kermaUnshielded) : 1;
    const pb = espesorNM(nuclide.symbol, 'lead', B, nuclide.TVL_lead_mm);
    const conc = espesorNM(nuclide.symbol, 'concrete', B, nuclide.TVL_concrete_mm);
    return { kermaUnshielded, leadThickness: pb.mm, concreteThickness: conc.mm, metodo: pb.metodo };
  }, [nuclide, room]);

  const decayData = useMemo(() => {
    if (!nuclide) return [];
    const A0 = parseFloat(activity_GBq) || 0;
    const points: { time_h: number; activity_GBq: number; doseAt1m_mSv: number }[] = [];
    for (let h = 0; h <= nuclide.halfLife_hours * 10; h += nuclide.halfLife_hours / 4) {
      const A = decayedActivity(A0, nuclide.halfLife_hours, h);
      points.push({
        time_h: h,
        activity_GBq: A,
        doseAt1m_mSv: A * nuclide.gammaConstant_mSv_m2_GBq_h,
      });
    }
    return points;
  }, [nuclide, activity_GBq]);

  const releaseCheck = useMemo(() => {
    if (!nuclide) return null;
    const A = parseFloat(activity_GBq) || 0;
    return canReleasePatient(A, nuclide.symbol);
  }, [nuclide, activity_GBq]);

  const mirdDose = useMemo(() => {
    if (!nuclide) return [];
    const A_MBQ = (parseFloat(activity_GBq) || 0) * 1000;
    return estimateMIRDDose(nuclide.symbol, A_MBQ, nuclide.category as 'PET' | 'SPECT' | 'Therapy');
  }, [nuclide, activity_GBq]);

  const bremsstrahlung = useMemo(() => {
    if (!nuclide || !nuclide.maxBetaEnergy_MeV) return null;
    const A = parseFloat(activity_GBq) || 0;
    const d = parseFloat(distance_m) || 1;
    const P = parseFloat(designGoal_uSv) || 100;
    return bremsstrahlungShielding(A, nuclide.maxBetaEnergy_MeV, d, P);
  }, [nuclide, activity_GBq, distance_m, designGoal_uSv]);

  const idacPreview = useMemo(() => {
    if (!nuclide) return null;
    const activityMBq = (parseFloat(activity_GBq) || 0) * 1000;
    const phantom = findIdacPhantom(selectedIdacPhantom);
    const coefficient = getIdacCoefficientForNuclide(nuclide.symbol);
    return {
      phantom,
      coefficient,
      estimate: estimateIdacEffectiveDose(coefficient, phantom, activityMBq),
    };
  }, [nuclide, activity_GBq, selectedIdacPhantom]);

  const internalDosimetryDataset = useMemo(() => buildInternalDosimetryDataset(), []);
  const internalDosimetrySummary = useMemo(
    () => summarizeInternalDosimetryDataset(internalDosimetryDataset),
    [internalDosimetryDataset],
  );

  const storedDosimetrySummary = useMemo(() => {
    if (typeof window === 'undefined') return summarizeDosimetryWorkspace(null);
    return summarizeDosimetryWorkspace(createLocalStorageDosimetryStorage().load());
  }, [dosimetryPersistenceMessage]);

  const storedDosimetryQueueSummary = useMemo(() => {
    if (typeof window === 'undefined') return summarizeDosimetrySyncQueue({ schemaVersion: 'radshield-dosimetry-sync-queue-v1', items: [] });
    return summarizeDosimetrySyncQueue(createLocalStorageDosimetrySyncQueue().load());
  }, [dosimetryQueueMessage]);

  const updateDosimetryQueueMessage = () => {
    if (typeof window === 'undefined') return;
    const summary = summarizeDosimetrySyncQueue(createLocalStorageDosimetrySyncQueue().load());
    if (!summary.hasPending) {
      setDosimetryQueueMessage(summary.syncedCount > 0 ? `Cola sincronizada: ${summary.syncedCount}` : 'Cola sin pendientes');
      return;
    }
    setDosimetryQueueMessage(`Pendientes: ${summary.pendingCount + summary.failedCount}`);
  };

  const syncDosimetryWorkspaceToServer = async (
    workspace: DosimetryWorkspace,
    queueDriver: DosimetrySyncQueueDriver,
  ) => {
    markDosimetrySyncAttempt(queueDriver, workspace.workspaceId);
    updateDosimetryQueueMessage();
    try {
      await dosimetryWorkspaceMutation.mutateAsync({
        workspaceId: workspace.workspaceId,
        projectName: workspace.projectName,
        datasetVersion: workspace.dataset.schemaVersion,
        datasetJson: JSON.stringify(workspace.dataset),
        evidencePackJson: workspace.evidencePack ? JSON.stringify(workspace.evidencePack) : undefined,
        migrationPlanJson: JSON.stringify(workspace.migration),
      });
      markDosimetrySyncSuccess(queueDriver, workspace.workspaceId);
      updateDosimetryQueueMessage();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo sincronizar con DB';
      markDosimetrySyncFailure(queueDriver, workspace.workspaceId, message);
      updateDosimetryQueueMessage();
      throw error;
    }
  };

  const exportReport = () => {
    if (!nuclide || !shieldingCalc) { toast.error('No data to export'); return; }
    const lines = [
      `Nuclear Medicine Shielding Report - RadShield-MX`,
      `Radionuclide: ${nuclide.name} (${nuclide.symbol})`,
      `Half-life: ${nuclide.halfLife_text}`,
      `Activity: ${activity_GBq} GBq`,
      `Distance: ${distance_m} m`,
      ``,
      `UNSHIELDED KERMA: ${shieldingCalc.kermaUnshielded.toFixed(3)} mSv/week`,
      `REQUIRED ${materialType.toUpperCase()}: ${shieldingCalc.thickness.toFixed(1)} mm`,
      `TVL: ${shieldingCalc.tvl.toFixed(1)} mm`,
      `HVL: ${shieldingCalc.hvl.toFixed(1)} mm`,
      ``,
      `Gamma constant: ${nuclide.gammaConstant_mSv_m2_GBq_h} mSv.m2/GBq.h`,
      `Primary energies: ${nuclide.primaryEnergies_keV.join(', ')} keV`,
      ``,
      `References: AAPM TG 108, NCRP 147, ICRP 106`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NM_Shielding_${nuclide.symbol}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const exportIdacPack = () => {
    if (!nuclide) { toast.error('No data to export'); return; }
    const activityMBq = (parseFloat(activity_GBq) || 0) * 1000;
    const pack = buildIdacDoseReadinessPack({
      nuclide,
      activityMBq,
      phantomId: selectedIdacPhantom,
      mirdDose,
    });
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IDAC_Dose_Readiness_${nuclide.symbol}_${selectedIdacPhantom}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('IDAC-Dose readiness pack exported');
  };

  const exportInternalDosimetryDataset = () => {
    const blob = new Blob([JSON.stringify(internalDosimetryDataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Internal_Dosimetry_Dataset_${internalDosimetryDataset.datasetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Internal dosimetry dataset exported');
  };

  const saveInternalDosimetryDatasetLocal = () => {
    try {
      const workspace = persistDosimetryDataset(
        createLocalStorageDosimetryStorage(),
        internalDosimetryDataset,
        'RadShield-MX',
      );
      setDosimetryPersistenceMessage(`Guardado local: ${workspace.dataset.effectiveDoseCoefficients.length} coeficientes`);
      toast.success('Internal dosimetry dataset saved locally');
    } catch {
      setDosimetryPersistenceMessage('No se pudo guardar localmente');
      toast.error('No se pudo guardar el dataset local');
    }
  };

  const syncInternalDosimetryDatasetServer = async () => {
    try {
      const queueDriver = createLocalStorageDosimetrySyncQueue();
      const workspace = persistDosimetryDataset(
        createLocalStorageDosimetryStorage(),
        internalDosimetryDataset,
        'RadShield-MX',
      );
      setDosimetryPersistenceMessage(`Guardado local: ${workspace.dataset.effectiveDoseCoefficients.length} coeficientes`);

      if (!BACKEND_ENABLED) {
        enqueueDosimetryWorkspaceSync(queueDriver, workspace);
        updateDosimetryQueueMessage();
        setDosimetryServerMessage('En cola: backend desactivado');
        toast.info('Guardado local OK; sincronizacion en cola');
        return;
      }

      if (!isAuthenticated) {
        enqueueDosimetryWorkspaceSync(queueDriver, workspace);
        updateDosimetryQueueMessage();
        setDosimetryServerMessage('En cola: requiere sesion');
        toast.info('Guardado local OK; inicia sesion para sincronizar DB');
        return;
      }

      enqueueDosimetryWorkspaceSync(queueDriver, workspace);
      await syncDosimetryWorkspaceToServer(workspace, queueDriver);
    } catch {
      setDosimetryServerMessage('No se pudo preparar sincronizacion');
      toast.error('No se pudo preparar el workspace dosimetrico');
    }
  };

  const retryDosimetrySyncQueue = async () => {
    const queueDriver = createLocalStorageDosimetrySyncQueue();
    const pending = getPendingDosimetrySyncItems(queueDriver.load());
    if (pending.length === 0) {
      setDosimetryQueueMessage('Cola sin pendientes');
      toast.info('No hay workspaces dosimetricos pendientes');
      return;
    }
    if (!BACKEND_ENABLED) {
      setDosimetryServerMessage('En cola: backend desactivado');
      toast.info('Backend desactivado; la cola se conserva localmente');
      return;
    }
    if (!isAuthenticated) {
      setDosimetryServerMessage('En cola: requiere sesion');
      toast.info('Inicia sesion para sincronizar la cola');
      return;
    }
    try {
      await syncDosimetryWorkspaceToServer(pending[0].workspace, queueDriver);
    } catch {
      setDosimetryServerMessage('DB pendiente: reintento fallido');
    }
  };

  const clearInternalDosimetryDatasetLocal = () => {
    try {
      createLocalStorageDosimetryStorage().clear();
      createLocalStorageDosimetrySyncQueue().clear();
      setDosimetryPersistenceMessage('Guardado local limpiado');
      setDosimetryQueueMessage('Cola sin pendientes');
      setDosimetryServerMessage(BACKEND_ENABLED ? 'Servidor pendiente' : 'Servidor desactivado');
      toast.success('Internal dosimetry local cache cleared');
    } catch {
      setDosimetryPersistenceMessage('No se pudo limpiar cache local');
      toast.error('No se pudo limpiar el cache local');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Atom className="h-5 w-5 text-rose-500" />
            Advanced Nuclear Medicine Shielding Module
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            AAPM TG 108 / NCRP 147 / ICRP 106 — PET/CT, SPECT, Therapy, MIRD Dosimetry
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Radionuclide Selector */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Select Radionuclide</Label>
                <Select value={selectedNuclide} onValueChange={setSelectedNuclide}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['PET', 'SPECT', 'Therapy'] as const).map(cat => (
                      <SelectItem key={cat} value={cat} disabled className="font-semibold text-xs bg-muted">
                        {cat}
                      </SelectItem>
                    ))}
                    {RADIONUCLIDES.map(r => (
                      <SelectItem key={r.symbol} value={r.symbol}>
                        <span className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${getCategoryColor(r.category)}`}>{r.category}</Badge>
                          {r.symbol} — {r.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {nuclide && (
                <Badge variant="outline" className="mb-1">
                  <Clock className="h-3 w-3 mr-1" />
                  T1/2 = {nuclide.halfLife_text}
                </Badge>
              )}
            </div>

            {nuclide && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4 text-sm">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Γ constant</p>
                      <p className="font-semibold">{nuclide.gammaConstant_mSv_m2_GBq_h}</p>
                      <p className="text-[10px] text-muted-foreground">mSv.m2/GBq.h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">HVL (Pb)</p>
                      <p className="font-semibold">{nuclide.HVL_lead_mm} mm</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">TVL (Pb)</p>
                      <p className="font-semibold">{nuclide.TVL_lead_mm} mm</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Energies</p>
                      <p className="font-semibold">{nuclide.primaryEnergies_keV.map(e => `${e} keV`).join(', ') || 'Beta only'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{nuclide.notes}</p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="shielding">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="shielding"><Shield className="h-3.5 w-3.5 mr-1" />Shielding</TabsTrigger>
                <TabsTrigger value="rooms"><FlaskConical className="h-3.5 w-3.5 mr-1" />Room Presets</TabsTrigger>
                <TabsTrigger value="decay"><TrendingDown className="h-3.5 w-3.5 mr-1" />Decay</TabsTrigger>
                <TabsTrigger value="mird"><Activity className="h-3.5 w-3.5 mr-1" />MIRD</TabsTrigger>
                <TabsTrigger value="release"><CheckCircle className="h-3.5 w-3.5 mr-1" />Release</TabsTrigger>
              </TabsList>

              {/* TAB: Shielding Calculator */}
              <TabsContent value="shielding" className="space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Activity (GBq)</Label>
                    <Input type="number" value={activity_GBq} onChange={e => setActivity_GBq(e.target.value)} step="0.1" />
                  </div>
                  <div>
                    <Label className="text-xs">Distance (m)</Label>
                    <Input type="number" value={distance_m} onChange={e => setDistance_m(e.target.value)} step="0.1" />
                  </div>
                  <div>
                    <Label className="text-xs">Hours/week</Label>
                    <Input type="number" value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Design Goal (uSv/wk)</Label>
                    <Input type="number" value={designGoal_uSv} onChange={e => setDesignGoal_uSv(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Label className="text-xs">Material:</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant={materialType === 'lead' ? 'default' : 'outline'} onClick={() => setMaterialType('lead')}>
                      Lead (Pb)
                    </Button>
                    <Button size="sm" variant={materialType === 'concrete' ? 'default' : 'outline'} onClick={() => setMaterialType('concrete')}>
                      Concrete
                    </Button>
                  </div>
                </div>

                {shieldingCalc && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-amber-50 dark:bg-amber-950">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Unshielded Kerma</p>
                        <p className="text-2xl font-bold text-amber-600">{shieldingCalc.kermaUnshielded.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">mSv/week</p>
                      </CardContent>
                    </Card>
                    <Card className={shieldingCalc.thickness > 0 ? 'bg-rose-50 dark:bg-rose-950' : 'bg-emerald-50 dark:bg-emerald-950'}>
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Required {materialType}</p>
                        <p className={`text-2xl font-bold ${shieldingCalc.thickness > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {shieldingCalc.thickness.toFixed(1)} mm
                        </p>
                        <p className="text-[10px] text-muted-foreground" data-testid="nm-metodo">{shieldingCalc.metodo}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-950">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Transmission</p>
                        <p className="text-2xl font-bold text-blue-600">{(shieldingCalc.transmission * 100).toFixed(4)}%</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {bremsstrahlung && bremsstrahlung.leadThickness_mm > 0 && (
                  <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-orange-800 dark:text-orange-200">
                        <AlertTriangle className="h-4 w-4" />
                        Bremsstrahlung Shielding (Beta Emitter)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-orange-700 dark:text-orange-300">
                      <p>Bremsstrahlung X-ray fraction: {(bremsstrahlung.xrayFraction * 100).toFixed(3)}%</p>
                      <p>Required lead: {bremsstrahlung.leadThickness_mm.toFixed(1)} mm</p>
                      <p>Required concrete: {bremsstrahlung.concreteThickness_mm.toFixed(0)} mm</p>
                    </CardContent>
                  </Card>
                )}

                <Button onClick={exportReport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />Export Report
                </Button>
              </TabsContent>

              {/* TAB: Room Presets */}
              <TabsContent value="rooms" className="space-y-3">
                <div>
                  <Label>Select Room Type</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NM_ROOM_CONFIGS.map(r => (
                        <SelectItem key={r.roomType} value={r.roomType}>
                          {r.roomType} — {r.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {room && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 text-sm">
                      <p className="font-medium">{room.roomType}</p>
                      <p className="text-muted-foreground">{room.description}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div><span className="text-muted-foreground">Typical dose:</span> <span className="font-medium">{room.typicalDose_GBq} GBq</span></div>
                        <div><span className="text-muted-foreground">Patients/wk:</span> <span className="font-medium">{room.patientsPerWeek}</span></div>
                        <div><span className="text-muted-foreground">Occupancy:</span> <span className="font-medium">{room.occupancyFactor}</span></div>
                        <div><span className="text-muted-foreground">Distance:</span> <span className="font-medium">{room.distanceToBarrier_m} m</span></div>
                        <div><span className="text-muted-foreground">Design goal:</span> <span className="font-medium">{room.designGoal_uSv_week} uSv/wk</span></div>
                        <div><span className="text-muted-foreground">Material:</span> <span className="font-medium">{room.recommendedMaterial}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {roomCalc && (
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-rose-50 dark:bg-rose-950">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Lead (Pb) required</p>
                        <p className="text-2xl font-bold text-rose-600">{roomCalc.leadThickness.toFixed(1)} mm</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-stone-50 dark:bg-stone-950">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Concrete required</p>
                        <p className="text-2xl font-bold text-stone-600">{roomCalc.concreteThickness.toFixed(0)} mm</p>
                        <p className="text-xs text-muted-foreground">({(roomCalc.concreteThickness / 10).toFixed(1)} cm)</p>
                        <p className="text-[10px] text-muted-foreground">{roomCalc.metodo}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* TAB: Decay */}
              <TabsContent value="decay" className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch checked={showDecayChart} onCheckedChange={setShowDecayChart} />
                  <Label className="text-sm">Show decay table</Label>
                </div>

                {decayData.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="bg-blue-50 dark:bg-blue-950">
                        <CardContent className="pt-4 text-center">
                          <p className="text-xs text-muted-foreground">Activity at t=0</p>
                          <p className="text-2xl font-bold text-blue-600">{decayData[0].activity_GBq.toFixed(2)} GBq</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-emerald-50 dark:bg-emerald-950">
                        <CardContent className="pt-4 text-center">
                          <p className="text-xs text-muted-foreground">After 1 T1/2</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {decayData.find(d => d.time_h >= nuclide!.halfLife_hours)?.activity_GBq.toFixed(2) || '—'} GBq
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 dark:bg-purple-950">
                        <CardContent className="pt-4 text-center">
                          <p className="text-xs text-muted-foreground">After 3 T1/2</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {decayData.find(d => d.time_h >= nuclide!.halfLife_hours * 3)?.activity_GBq.toFixed(3) || '—'} GBq
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {showDecayChart && (
                      <div className="overflow-auto max-h-64">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-background z-10">
                            <tr className="border-b">
                              <th className="text-left py-1 px-2">Time (h)</th>
                              <th className="text-left py-1 px-2">T1/2 multiples</th>
                              <th className="text-right py-1 px-2">Activity (GBq)</th>
                              <th className="text-right py-1 px-2">Dose @ 1m (mSv/h)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {decayData.map((p, i) => (
                              <tr key={i} className="border-b hover:bg-muted/50">
                                <td className="py-1 px-2 font-mono">{p.time_h.toFixed(1)}</td>
                                <td className="py-1 px-2 font-mono">{(p.time_h / (nuclide?.halfLife_hours || 1)).toFixed(2)}</td>
                                <td className="text-right py-1 px-2 font-mono">{p.activity_GBq.toFixed(4)}</td>
                                <td className="text-right py-1 px-2 font-mono">{p.doseAt1m_mSv.toFixed(4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* TAB: MIRD Dosimetry */}
              <TabsContent value="mird" className="space-y-3">
                {mirdDose.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        MIRD Absorbed Dose Estimates — {selectedNuclide}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1.5 px-2">Organ</th>
                              <th className="text-right py-1.5 px-2">Absorbed Dose (mGy)</th>
                              <th className="text-right py-1.5 px-2">Contribution to E (mSv)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mirdDose.map((d, i) => (
                              <tr key={i} className={`border-b ${d.organ.includes('Effective') ? 'bg-muted font-semibold' : ''}`}>
                                <td className="py-1.5 px-2">{d.organ}</td>
                                <td className="text-right py-1.5 px-2 font-mono">
                                  {d.absorbedDose_mGy > 1000 ? `${(d.absorbedDose_mGy / 1000).toFixed(1)} Gy` : `${d.absorbedDose_mGy.toFixed(1)} mGy`}
                                </td>
                                <td className="text-right py-1.5 px-2 font-mono">{d.effectiveDose_mSv.toFixed(3)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on ICRP 106/128 dose coefficients. Values are estimates for standard adult phantom.
                        Actual patient dosimetry requires individualized kinetics.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {nuclide && (
                  <Card className="border-rose-200 bg-rose-50/60 dark:bg-rose-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-rose-900 dark:text-rose-100">
                        <Info className="h-4 w-4" />
                        IDAC-Dose 2.2 readiness
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-xs text-rose-900/80 dark:text-rose-100/80">
                        {IDAC_DOSE_EXTERNAL_NOTE}
                      </p>
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                        <div>
                          <Label className="text-xs">ICRP phantom / interpolation anchor</Label>
                          <Select value={selectedIdacPhantom} onValueChange={setSelectedIdacPhantom}>
                            <SelectTrigger data-testid="idac-phantom-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {IDAC_REFERENCE_PHANTOMS.map((phantom) => (
                                <SelectItem key={phantom.id} value={phantom.id}>
                                  {phantom.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="rounded-md border bg-white/70 p-3 text-xs dark:bg-slate-950/40">
                          <div className="font-semibold">{idacPreview?.phantom.label}</div>
                          <div className="text-muted-foreground">{idacPreview?.phantom.sourcePublication}</div>
                          <div className="mt-1">
                            Coeficiente paper:{' '}
                            <span className="font-mono">
                              {idacPreview?.estimate.coefficient_mSv_per_MBq == null
                                ? 'N/D'
                                : `${idacPreview.estimate.coefficient_mSv_per_MBq} mSv/MBq`}
                            </span>
                          </div>
                          <div>
                            E estimada:{' '}
                            <span className="font-mono">
                              {idacPreview?.estimate.estimatedEffectiveDose_mSv == null
                                ? 'N/D'
                                : `${idacPreview.estimate.estimatedEffectiveDose_mSv.toFixed(3)} mSv`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-md border bg-white/70 p-2 text-center text-xs dark:bg-slate-950/40">
                          <div className="text-muted-foreground">Procedimientos</div>
                          <div className="text-lg font-bold">{internalDosimetrySummary.procedureCount}</div>
                        </div>
                        <div className="rounded-md border bg-white/70 p-2 text-center text-xs dark:bg-slate-950/40">
                          <div className="text-muted-foreground">Coeficientes</div>
                          <div className="text-lg font-bold">{internalDosimetrySummary.coefficientCount}</div>
                        </div>
                        <div className="rounded-md border bg-white/70 p-2 text-center text-xs dark:bg-slate-950/40">
                          <div className="text-muted-foreground">Fantomas</div>
                          <div className="text-lg font-bold">{internalDosimetrySummary.phantomCount}</div>
                        </div>
                      </div>
                      <div className="rounded-md border bg-white/70 p-3 text-xs dark:bg-slate-950/40">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold">Persistencia local preparada</div>
                            <div className="text-muted-foreground">
                              Key: <span className="font-mono">{DOSIMETRY_STORAGE_KEY}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Queue: <span className="font-mono">{DOSIMETRY_SYNC_QUEUE_KEY}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div>{dosimetryPersistenceMessage}</div>
                            <div className="text-muted-foreground">
                              Workspace: {storedDosimetrySummary.hasWorkspace ? `${storedDosimetrySummary.coefficientCount} coeficientes` : 'no guardado'}
                            </div>
                            <div className="text-muted-foreground" data-testid="dosimetry-server-status">
                              DB/API: {dosimetryServerMessage}
                            </div>
                            <div className="text-muted-foreground" data-testid="dosimetry-sync-queue-status">
                              Cola: {dosimetryQueueMessage}
                              {storedDosimetryQueueSummary.hasPending ? ` (${storedDosimetryQueueSummary.pendingCount + storedDosimetryQueueSummary.failedCount})` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Exporta un paquete JSON para comparar el estimado MIRD local contra ejemplos IDAC-Dose 2.2 cuando el radionuclido/procedimiento esta cubierto por el paper.
                        </p>
                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                          <Button onClick={saveInternalDosimetryDatasetLocal} variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5 mr-1" />Guardar Local
                          </Button>
                          <Button
                            onClick={syncInternalDosimetryDatasetServer}
                            disabled={dosimetryWorkspaceMutation.isPending}
                            variant="outline"
                            size="sm"
                          >
                            <CloudUpload className="h-3.5 w-3.5 mr-1" />Sync DB
                          </Button>
                          <Button
                            onClick={retryDosimetrySyncQueue}
                            disabled={dosimetryWorkspaceMutation.isPending || !storedDosimetryQueueSummary.hasPending}
                            variant="ghost"
                            size="sm"
                          >
                            Reintentar Cola
                          </Button>
                          <Button onClick={clearInternalDosimetryDatasetLocal} variant="ghost" size="sm">
                            Limpiar Local
                          </Button>
                          <Button onClick={exportInternalDosimetryDataset} variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5 mr-1" />Exportar Dataset
                          </Button>
                          <Button onClick={exportIdacPack} variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5 mr-1" />Exportar IDAC Pack
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAB: Patient Release */}
              <TabsContent value="release" className="space-y-3">
                {releaseCheck && (
                  <>
                    <Card className={releaseCheck.canRelease ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' : 'bg-red-50 dark:bg-red-950/30 border-red-200'}>
                      <CardContent className="pt-4 flex items-start gap-3">
                        {releaseCheck.canRelease ? (
                          <CheckCircle className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className={`font-medium ${releaseCheck.canRelease ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
                            {releaseCheck.canRelease ? 'Patient CAN be released' : 'Patient CANNOT be released'}
                          </p>
                          <p className={`text-sm ${releaseCheck.canRelease ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                            {releaseCheck.reason}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                          <Info className="h-4 w-4 inline mr-1" />
                          Patient Release Criteria (NRC Reg Guide 8.39)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p>A patient may be released when the dose rate at 1 m from the patient is ≤ 5 mSv (0.5 rem).</p>
                        <p>Alternatively, retained activity must be below institution-specific limits considering:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li>Half-life of the radionuclide</li>
                          <li>Patient's living situation (children, pregnant partner)</li>
                          <li>Occupational exposure of caregivers</li>
                          <li>Time to return to work/public spaces</li>
                        </ul>
                        <p className="text-xs mt-2">Reference: NRC Regulatory Guide 8.39, Release of Patients Administered Radioactive Materials</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
