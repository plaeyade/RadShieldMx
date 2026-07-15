// =============================================================================
// SpecialCasesDialog — Casos especiales + Prueba integridad + PDF (v14.4)
// Integra: AREA_ESPERA, MORGUE, OFTALMO, ARP, IMPLANTES, CuartoTerapia,
//          Anexos, PruebaIntegridad, Backup, GenerarPDF — Todo en un solo lugar
// =============================================================================
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, AlertTriangle, Shield, Eye, Stethoscope, Users, Skull, FileText, BookOpen, CheckCircle, Circle, Activity, ClipboardList, Save, FileDown } from 'lucide-react';
import { getAllSpecialCases } from '@/lib/specialCases';
import { INTEGRITY_CHECKS, BACKUP_ITEMS, PDF_COMPONENTS } from '@/lib/systemIntegrity';
import { toast } from 'sonner';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const CASES = [
  { id: 'espera', label: 'Área Espera', icon: Users, desc: 'I-131 terapia tiroidea' },
  { id: 'morgue', label: 'Morgue', icon: Skull, desc: 'Post-mortem radionúclidos' },
  { id: 'oftalmo', label: 'Oftalmología', icon: Eye, desc: 'Intervencionista I-125/Ru-106' },
  { id: 'arp', label: 'ARP', icon: Shield, desc: 'Análisis riesgo probabilístico' },
  { id: 'implantes', label: 'Implantes', icon: Stethoscope, desc: 'Dosis a trabajadores' },
  { id: 'cuarto', label: 'Terapia I-131', icon: Activity, desc: 'Cuarto terapia radionúclidos' },
  { id: 'anexos', label: 'Anexos', icon: BookOpen, desc: 'Anexos técnicos A-I' },
  { id: 'integridad', label: 'Integridad', icon: CheckCircle, desc: 'Prueba del sistema' },
  { id: 'backup', label: 'Backup', icon: Save, desc: 'Componentes a respaldar' },
  { id: 'pdf', label: 'PDF', icon: FileDown, desc: 'Generar reporte CNSNS' },
];

export default function SpecialCasesDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <CasesContent onOpenChange={onOpenChange} />;
}

function CasesContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const data = getAllSpecialCases();
  const [integrityChecks, setIntegrityChecks] = useState(INTEGRITY_CHECKS);
  const [activeTab, setActiveTab] = useState('espera');

  const toggleCheck = (id: string) => {
    setIntegrityChecks(prev => prev.map(c => c.id === id ? { ...c, status: (c.status === 'pass' ? 'not-checked' : 'pass') as any } : c));
  };

  const passedCount = integrityChecks.filter(c => c.status === 'pass').length;
  const criticalPassed = integrityChecks.filter(c => c.critical && c.status === 'pass').length;
  const totalCritical = integrityChecks.filter(c => c.critical).length;

  const COL: Record<string, string> = {
    espera: 'bg-blue-50', morgue: 'bg-slate-100', oftalmo: 'bg-cyan-50', arp: 'bg-red-50',
    implantes: 'bg-emerald-50', cuarto: 'bg-amber-50', anexos: 'bg-violet-50',
    integridad: 'bg-green-50', backup: 'bg-gray-50', pdf: 'bg-indigo-50',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 text-white p-2 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Casos Especiales y Verificación del Sistema</h1>
            <p className="text-xs text-slate-500">7 casos especiales + Prueba integridad + Backup + PDF — Todo en un solo lugar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={criticalPassed === totalCritical ? 'default' : 'secondary'} className="text-xs">
            {criticalPassed}/{totalCritical} críticos OK
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 overflow-hidden">
        <div className="w-52 border-r bg-slate-50 flex flex-col">
          <ScrollArea className="flex-1">
            <TabsList className="flex flex-col w-full h-auto gap-0.5 p-2 bg-transparent">
              {CASES.map(c => {
                const Icon = c.icon;
                const isActive = activeTab === c.id;
                return (
                  <TabsTrigger key={c.id} value={c.id} className={`w-full justify-start gap-2 text-xs h-auto py-2.5 px-3 ${isActive ? 'bg-white shadow-sm border' : 'hover:bg-slate-100'}`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <div className="text-left leading-tight">
                      <div className="font-medium">{c.label}</div>
                      <div className="text-[10px] opacity-60 font-normal">{c.desc}</div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* ── ÁREA ESPERA ── */}
            <TabsContent value="espera" className="mt-0">
              <Card className="border-blue-300">
                <CardHeader className="pb-2 bg-blue-50"><CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5"/>Área de Espera — Pacientes I-131</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 border rounded-lg p-3"><div className="text-xs opacity-70">Radionúclido</div><div className="text-lg font-bold">{data.area_espera.radionuclide}</div></div>
                    <div className="bg-blue-50 border rounded-lg p-3"><div className="text-xs opacity-70">Actividad típica</div><div className="text-lg font-bold">{data.area_espera.activity_mbq} MBq</div></div>
                    <div className="bg-blue-50 border rounded-lg p-3"><div className="text-xs opacity-70">Energía γ</div><div className="text-lg font-bold">{data.area_espera.gamma_energy_keV} keV</div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3"><div className="text-xs font-semibold text-amber-700">Blindaje recomendado</div><div className="text-sm font-mono">{data.area_espera.material}</div></div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3"><div className="text-xs font-semibold text-amber-700">Espesor</div><div className="text-sm font-mono">{data.area_espera.recommended_shielding_cm} cm</div></div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-blue-700">Cálculo de dosis</div>
                    <div className="text-xs text-blue-600 mt-1">
                      K = Γ · A / d² = {data.area_espera.gamma_constant} × {data.area_espera.activity_mbq} / ({data.area_espera.distance_to_public_m})² = 
                      {((data.area_espera.gamma_constant * data.area_espera.activity_mbq) / (data.area_espera.distance_to_public_m ** 2)).toFixed(2)} μSv/h
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Dosis anual (4h espera/día × 250 días): 
                      {((data.area_espera.gamma_constant * data.area_espera.activity_mbq) / (data.area_espera.distance_to_public_m ** 2) * 4 * 250 / 1000).toFixed(2)} mSv/año
                      {((data.area_espera.gamma_constant * data.area_espera.activity_mbq) / (data.area_espera.distance_to_public_m ** 2) * 4 * 250 / 1000) < data.area_espera.max_dose_public_mSv_year ? ' ✅ CUMPLE' : ' ❌ NO CUMPLE'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── MORGUE ── */}
            <TabsContent value="morgue" className="mt-0">
              <Card className="border-slate-400">
                <CardHeader className="pb-2 bg-slate-100"><CardTitle className="text-base flex items-center gap-2"><Skull className="w-5 h-5"/>Morgue Radioactivo — Post-mortem I-131</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-100 border rounded-lg p-3"><div className="text-xs opacity-70">Actividad residual</div><div className="text-lg font-bold">{data.morgue_radioactivo.typical_residual_mbq} MBq</div></div>
                    <div className="bg-slate-100 border rounded-lg p-3"><div className="text-xs opacity-70">Tiempo post-admin.</div><div className="text-lg font-bold">{data.morgue_radioactivo.time_since_admin_h} h</div></div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3"><div className="text-xs font-semibold text-red-700">BLINDAJE</div><div className="text-sm font-bold">{data.morgue_radioactivo.recommended_material}</div></div>
                  </div>
                  <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Protocolo de manejo</CardTitle></CardHeader><CardContent><ol className="space-y-1.5">{data.morgue_radioactivo.handling_protocol.map((p, i) => <li key={i} className="text-xs flex items-start gap-2"><span className="bg-slate-200 text-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>{p}</li>)}</ol></CardContent></Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── OFTALMOLOGÍA ── */}
            <TabsContent value="oftalmo" className="mt-0">
              <div className="space-y-3">
                {data.oftalmologia_interv.procedures.map((p, i) => (
                  <Card key={i} className="border-cyan-300">
                    <CardHeader className="pb-2 bg-cyan-50"><CardTitle className="text-sm flex items-center gap-2"><Eye className="w-4 h-4"/>{p.name}</CardTitle></CardHeader>
                    <CardContent className="pt-3">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-cyan-50 border rounded p-2"><div className="opacity-70">Radionúclido</div><div className="font-bold">{p.radionuclide}</div></div>
                        <div className="bg-cyan-50 border rounded p-2"><div className="opacity-70">Actividad</div><div className="font-bold">{p.activity_mbq} MBq</div></div>
                        <div className="bg-cyan-50 border rounded p-2"><div className="opacity-70">HVL Pb</div><div className="font-bold">{p.HVL_mm_pb} mm</div></div>
                        <div className="bg-cyan-50 border rounded p-2"><div className="opacity-70">Blindaje</div><div className="font-bold">{p.shielding_type}</div></div>
                      </div>
                      <div className="text-xs text-cyan-700 mt-2 bg-cyan-50 p-2 rounded">{p.notes}</div>
                    </CardContent>
                  </Card>
                ))}
                <Card className="bg-cyan-50 border-cyan-200"><CardContent className="p-3"><div className="text-xs font-semibold text-cyan-800 mb-1">Requisitos generales</div><ul className="space-y-1">{data.oftalmologia_interv.general_requirements.map((r, i) => <li key={i} className="text-xs text-cyan-700 flex items-start gap-2"><CheckCircle className="w-3 h-3 mt-0.5 shrink-0"/>{r}</li>)}</ul></CardContent></Card>
              </div>
            </TabsContent>

            {/* ── ARP ── */}
            <TabsContent value="arp" className="mt-0">
              <div className="space-y-2">
                {data.arp_scenarios.map((s, i) => (
                  <Card key={i} className={s.risk_level === 'Crítico' ? 'border-red-400 bg-red-50' : s.risk_level === 'Alto' ? 'border-orange-300 bg-orange-50' : s.risk_level === 'Medio' ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={s.risk_level === 'Crítico' ? 'destructive' : s.risk_level === 'Alto' ? 'default' : 'secondary'} className="text-[10px]">{s.risk_level}</Badge>
                          <span className="text-sm font-medium">{s.scenario}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">Prob: {s.probability} | Consecuencia: {s.consequence}</div>
                      <div className="text-xs text-slate-500 mt-1">Mitigación: {s.mitigation}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ── IMPLANTES ── */}
            <TabsContent value="implantes" className="mt-0">
              <div className="space-y-3">
                {data.dosis_trabajador_implantes.map((d, i) => (
                  <Card key={i} className="border-emerald-300">
                    <CardHeader className="pb-2 bg-emerald-50"><CardTitle className="text-sm">{d.procedure} ({d.radionuclide})</CardTitle></CardHeader>
                    <CardContent className="pt-3">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-emerald-50 border rounded p-2"><div className="opacity-70">Cirujano</div><div className="font-bold">{d.dose_to_surgeon_uSv_per_procedure} μSv/proc.</div></div>
                        <div className="bg-emerald-50 border rounded p-2"><div className="opacity-70">Asistente</div><div className="font-bold">{d.dose_to_assistant_uSv_per_procedure} μSv/proc.</div></div>
                        <div className="bg-emerald-50 border rounded p-2"><div className="opacity-70">Enfermería</div><div className="font-bold">{d.dose_to_nurse_uSv_per_procedure} μSv/proc.</div></div>
                        <div className="bg-red-50 border border-red-200 rounded p-2"><div className="opacity-70">Límite anual</div><div className="font-bold text-red-700">{d.annual_limit_procedures} proc.</div></div>
                      </div>
                      <div className="text-xs mt-2 bg-emerald-50 p-2 rounded"><strong>Protección:</strong> {d.protective_measures.join(' • ')}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ── CUARTO TERAPIA ── */}
            <TabsContent value="cuarto" className="mt-0">
              <Card className="border-amber-300">
                <CardHeader className="pb-2 bg-amber-50"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-5 h-5"/>Cuarto de Terapia con I-131</CardTitle></CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-amber-50 border rounded p-3"><div className="font-bold">Actividad</div>{data.cuarto_terapia_radionuclidos.activity_range_mbq[0]}-{data.cuarto_terapia_radionuclidos.activity_range_mbq[1]} MBq (30-200 mCi)</div>
                    <div className="bg-amber-50 border rounded p-3"><div className="font-bold">Liberación paciente</div>{data.cuarto_terapia_radionuclidos.patient_release_criteria[0]}</div>
                  </div>
                  <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Requisitos de la sala</CardTitle></CardHeader><CardContent><ul className="space-y-1">{data.cuarto_terapia_radionuclidos.room_requirements.map((r, i) => <li key={i} className="text-xs flex items-start gap-2"><CheckCircle className="w-3 h-3 mt-0.5 shrink-0"/>{r}</li>)}</ul></CardContent></Card>
                  <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Blindaje</CardTitle></CardHeader><CardContent><ul className="space-y-1">{data.cuarto_terapia_radionuclidos.shielding_requirements.map((r, i) => <li key={i} className="text-xs flex items-start gap-2"><Shield className="w-3 h-3 mt-0.5 shrink-0"/>{r}</li>)}</ul></CardContent></Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── ANEXOS ── */}
            <TabsContent value="anexos" className="mt-0">
              <div className="space-y-2">
                {data.anexos_tecnicos.map((a, i) => (
                  <Card key={i} className="border-violet-200 hover:bg-violet-50 transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="bg-violet-100 text-violet-700 rounded-lg w-10 h-10 flex items-center justify-center font-bold text-sm">{a.id}</div>
                      <div className="flex-1"><div className="text-sm font-medium">{a.title}</div><div className="text-xs text-slate-500">{a.description}</div></div>
                      <Badge variant="outline" className="text-[10px]">{a.reference}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ── INTEGRIDAD ── */}
            <TabsContent value="integridad" className="mt-0">
              <Card className="border-green-300">
                <CardHeader className="pb-2 bg-green-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><CheckCircle className="w-5 h-5"/>Prueba de Integridad del Sistema</CardTitle>
                    <Badge variant={criticalPassed === totalCritical ? 'default' : 'secondary'}>{passedCount}/{integrityChecks.length} OK</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {integrityChecks.map(c => (
                    <button key={c.id} onClick={() => toggleCheck(c.id)} className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${c.status === 'pass' ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                      {c.status === 'pass' ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5"/> : <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5"/>}
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><span className="text-sm font-medium">{c.name}</span>{c.critical && <Badge variant="destructive" className="text-[10px]">CRÍTICO</Badge>}</div>
                        <div className="text-xs text-slate-500">{c.description}</div>
                        {c.status !== 'pass' && c.fix && <div className="text-xs text-amber-600 mt-1">Fix: {c.fix}</div>}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── BACKUP ── */}
            <TabsContent value="backup" className="mt-0">
              <Card className="border-gray-300">
                <CardHeader className="pb-2 bg-gray-50"><CardTitle className="text-base flex items-center gap-2"><Save className="w-5 h-5"/>Componentes del Sistema a Respaldar</CardTitle></CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {BACKUP_ITEMS.map((b, i) => (
                      <div key={i} className="bg-gray-50 border rounded-lg p-3">
                        <div className="flex items-center justify-between"><span className="text-sm font-medium">{b.component}</span><Badge variant="outline" className="text-[10px]">{b.frequency}</Badge></div>
                        <div className="text-xs text-slate-500 mt-1">{b.files.join(' • ')}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── PDF ── */}
            <TabsContent value="pdf" className="mt-0">
              <Card className="border-indigo-300">
                <CardHeader className="pb-2 bg-indigo-50"><CardTitle className="text-base flex items-center gap-2"><FileDown className="w-5 h-5"/>Generar Reporte PDF Consolidado CNSNS</CardTitle></CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800">
                    Este reporte integra automáticamente todos los cálculos, layouts, memorias y validaciones del sistema en un solo documento PDF.
                  </div>
                  <div className="space-y-2">
                    {PDF_COMPONENTS.map((p, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${p.required ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'}`}>
                        <span className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                        <div className="flex-1"><div className="text-sm font-medium">{p.section} {p.required && <Badge variant="destructive" className="text-[9px] ml-1">REQ</Badge>}</div><div className="text-xs text-slate-500">{p.content}</div></div>
                        <span className="text-[10px] text-slate-400">{p.source}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => toast.success('PDF consolidado generado (demo)')} className="w-full bg-indigo-600 hover:bg-indigo-700"><FileDown className="w-4 h-4 mr-2"/>Generar PDF Consolidado CNSNS</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
