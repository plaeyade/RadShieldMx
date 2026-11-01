import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Brain, FlaskConical, Crosshair, Atom, ExternalLink, Database } from 'lucide-react';

interface EquipmentLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenVersaHD?: () => void;
  onOpenGammaKnife?: () => void;
  onOpenBraquiCo60?: () => void;
  onOpenPETCT?: () => void;
  onOpenSPECT?: () => void;
  onOpenCiclotron?: () => void;
  onOpenProtones?: () => void;
}

const EQUIPMENT_TABS = [
  { id: 'linac', label: 'LINAC', icon: Activity, color: 'bg-blue-50 text-blue-700' },
  { id: 'gammaknife', label: 'Gamma Knife', icon: Brain, color: 'bg-purple-50 text-purple-700' },
  { id: 'braqui', label: 'Braqui Co-60', icon: FlaskConical, color: 'bg-green-50 text-green-700' },
  { id: 'petct', label: 'PET-CT', icon: Atom, color: 'bg-orange-50 text-orange-700' },
  { id: 'spect', label: 'SPECT', icon: Atom, color: 'bg-teal-50 text-teal-700' },
  { id: 'ciclotron', label: 'Ciclotron', icon: Crosshair, color: 'bg-red-50 text-red-700' },
  { id: 'protones', label: 'Protones', icon: Crosshair, color: 'bg-indigo-50 text-indigo-700' },
];

const LINAC_SPECS = {
  title: 'Aceleradores Lineales (LINAC)',
  models: [
    { name: 'Versa HD (Elekta)', energy: '6 MV / 15 MV FFF', maxDoseRate: '2400 MU/min', tvlConcrete15MV: '44 cm', tvlLead15MV: '5.7 cm', tvlSteel15MV: '11 cm', isoHeight: '100 cm', ssd: '100 cm', fieldSize: '40x40 cm' },
    { name: 'TrueBeam (Varian)', energy: '6 MV / 15 MV / 10 FFF', maxDoseRate: '2400 MU/min', tvlConcrete15MV: '44 cm', tvlLead15MV: '5.7 cm', tvlSteel15MV: '11 cm', isoHeight: '100 cm', ssd: '100 cm', fieldSize: '40x40 cm' },
    { name: 'Halcyon (Varian)', energy: '6 MV FFF', maxDoseRate: '800 MU/min', tvlConcrete15MV: 'N/A', tvlLead15MV: 'N/A', tvlSteel15MV: 'N/A', isoHeight: '100 cm', ssd: '100 cm', fieldSize: '28x28 cm' },
  ],
  norms: ['NCRP 151 (2005)', 'IAEA SRS 47', 'CNSNS-IT-001', 'AAPM TG 108'],
  applications: ['Radixterapia externa 3D-CRT', 'IMRT', 'VMAT', 'SBRT/SRS'],
};

const GAMMAKNIFE_SPECS = {
  title: 'Gamma Knife',
  models: [
    { name: 'Gamma Knife Perfexion / Icon', sources: '192 + 8 Co-60', activityPerSource: '1.1 Ci', halfLife: '5.27 años', tvlConcrete: '22 cm', tvlLead: '6 cm', maxField: '16 cm diam', accuracy: '0.15 mm' },
  ],
  norms: ['NCRP 91', 'IAEA TECDOC 1040', 'CNSNS'],
  applications: ['Radiocirugia intracraneal', 'SRS fraccionado (Icon)'],
};

const BRAQUI_SPECS = {
  title: 'Braquiterapia de Alta Tasa (HDR)',
  models: [
    { name: 'Flexitron / MicroSelectron', source: 'Ir-192', activity: '10 Ci', halfLife: '73.8 dias', tvlConcrete: '15 cm', tvlLead: '3 mm', doseRateAt1m: '0.018 mSv/h', applications: 'Ginecologia, prostata, mama, piel' },
    { name: 'Braquiterapia Co-60', source: 'Co-60', activity: 'Variable', halfLife: '5.27 años', tvlConcrete: '22 cm', tvlLead: '6 cm', doseRateAt1m: 'Variable', applications: 'Ginecologia, cuello uterino' },
  ],
  norms: ['NCRP 91', 'IAEA TECDOC 1274', 'AAPM TG 43', 'CNSNS'],
};

const PETCT_SPECS = {
  title: 'PET-CT',
  radionuclides: [
    { name: 'F-18 FDG', halfLife: '110 min', maxActivity: '740 MBq', tvlConcrete511keV: '52 cm', tvlLead511keV: '1.1 cm', eGamma: '511 keV (positrones)' },
    { name: 'Ga-68 DOTATATE', halfLife: '68 min', maxActivity: '200 MBq', tvlConcrete511keV: '52 cm', tvlLead511keV: '1.1 cm', eGamma: '511 keV' },
  ],
  norms: ['NCRP 144', 'IAEA SRS 44', 'CNSNS'],
};

const SPECT_SPECS = {
  title: 'SPECT / Gamma Camera',
  radionuclides: [
    { name: 'Tc-99m', halfLife: '6.01 h', maxActivity: '925 MBq', tvlConcrete140keV: '15 cm', tvlLead140keV: '0.3 mm', eGamma: '140 keV' },
    { name: 'I-131', halfLife: '8.02 d', maxActivity: '7.4 GBq', tvlConcrete364keV: '28 cm', tvlLead364keV: '0.6 cm', eGamma: '364 keV' },
  ],
  norms: ['NCRP 144', 'IAEA SRS 44'],
};

const CICLOTRON_SPECS = {
  title: 'Ciclotron para Produccion de Radioisotopos',
  models: [
    { name: 'Ciclotron 16-30 MeV', particles: 'p, d, He-3', maxEnergy: '30 MeV', beamCurrent: '120 uA', targets: 'F-18, C-11, N-13, O-15, Ga-68, Zr-89', shielding: 'Concreto 2-3 m + acero' },
  ],
  norms: ['NCRP 144', 'CNSNS', 'IAEA'],
};

const PROTONES_SPECS = {
  title: 'Terapia con Protones / Hadrones',
  models: [
    { name: 'Ciclotron protones', maxEnergy: '230-250 MeV', range: '38 cm agua', tvlConcrete: 'Variable >200 cm', neutronShielding: 'Paraffin + boro 5%', applications: 'Ocular, craneal, base de craneo, pediatrico' },
    { name: 'Sincrotron / Synchrocyclotron', maxEnergy: '250 MeV', range: '38 cm agua', tvlConcrete: 'Variable >200 cm', neutronShielding: 'Concreto denso + boro', applications: 'Tumores profundos, re-irradiacion' },
  ],
  norms: ['NCRP 144', 'IAEA', 'CNSNS', 'AAPM TG 257'],
};

function SpecCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-3">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 text-xs space-y-2">{children}</CardContent>
    </Card>
  );
}

function ModelTable({ headers, rows }: { headers: string[]; rows: Record<string, string>[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {headers.map(h => <th key={h} className="text-left p-1.5 border border-gray-200 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {Object.values(row).map((v, j) => <td key={j} className="p-1.5 border border-gray-200">{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EquipmentLibraryDialog(props: EquipmentLibraryDialogProps) {
  const { open, onOpenChange, onOpenVersaHD, onOpenGammaKnife, onOpenBraquiCo60 } = props;
  const [activeTab, setActiveTab] = useState('linac');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Biblioteca de Equipos Medicos — RadShield-MX
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {EQUIPMENT_TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs gap-1">
                <tab.icon className="w-3 h-3" />{tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="linac" className="mt-3">
            <SpecCard title={LINAC_SPECS.title}>
              <div className="flex gap-2 mb-2 flex-wrap">
                {LINAC_SPECS.norms.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <ModelTable
                headers={['Modelo', 'Energia', 'Dosis max', 'TVL Concr 15MV', 'TVL Plomo 15MV', 'TVL Acero 15MV', 'Campo max']}
                rows={LINAC_SPECS.models.map(m => ({ name: m.name, energy: m.energy, maxDoseRate: m.maxDoseRate, tvlConcrete: m.tvlConcrete15MV, tvlLead: m.tvlLead15MV, tvlSteel: m.tvlSteel15MV, fieldSize: m.fieldSize }))}
              />
              <div className="mt-2 text-gray-600">
                <strong>Aplicaciones:</strong> {LINAC_SPECS.applications.join(', ')}
              </div>
              {onOpenVersaHD && (
                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => { onOpenChange(false); onOpenVersaHD(); }}>
                  <ExternalLink className="w-3 h-3 mr-1" /> Abrir dialogo completo Versa HD 15 MV
                </Button>
              )}
            </SpecCard>
          </TabsContent>

          <TabsContent value="gammaknife" className="mt-3">
            <SpecCard title={GAMMAKNIFE_SPECS.title}>
              <div className="flex gap-2 mb-2 flex-wrap">
                {GAMMAKNIFE_SPECS.norms.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <ModelTable
                headers={['Modelo', 'Fuentes', 'Actividad/fuente', 'TVL Concreto', 'TVL Plomo', 'Precision']}
                rows={GAMMAKNIFE_SPECS.models.map(m => ({ name: m.name, sources: m.sources, activity: m.activityPerSource, tvlConcrete: m.tvlConcrete, tvlLead: m.tvlLead, accuracy: m.accuracy }))}
              />
              <div className="mt-2 text-gray-600">
                <strong>Aplicaciones:</strong> {GAMMAKNIFE_SPECS.applications.join(', ')}
              </div>
              {onOpenGammaKnife && (
                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => { onOpenChange(false); onOpenGammaKnife(); }}>
                  <ExternalLink className="w-3 h-3 mr-1" /> Abrir dialogo completo Gamma Knife
                </Button>
              )}
            </SpecCard>
          </TabsContent>

          <TabsContent value="braqui" className="mt-3">
            <SpecCard title={BRAQUI_SPECS.title}>
              <div className="flex gap-2 mb-2 flex-wrap">
                {BRAQUI_SPECS.norms.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <ModelTable
                headers={['Sistema', 'Fuente', 'Actividad', 'TVL Concreto', 'TVL Plomo', 'Aplicaciones']}
                rows={BRAQUI_SPECS.models.map(m => ({ name: m.name, source: m.source, activity: m.activity, tvlConcrete: m.tvlConcrete, tvlLead: m.tvlLead, applications: m.applications }))}
              />
              {onOpenBraquiCo60 && (
                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => { onOpenChange(false); onOpenBraquiCo60(); }}>
                  <ExternalLink className="w-3 h-3 mr-1" /> Abrir dialogo completo Braqui Co-60
                </Button>
              )}
            </SpecCard>
          </TabsContent>

          <TabsContent value="petct" className="mt-3">
            <SpecCard title={PETCT_SPECS.title}>
              <div className="flex gap-2 mb-2 flex-wrap">
                {PETCT_SPECS.norms.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <ModelTable
                headers={['Radionuclido', 'T1/2', 'Act. max', 'TVL Concr (511 keV)', 'TVL Plomo (511 keV)', 'E_gamma']}
                rows={PETCT_SPECS.radionuclides.map(r => ({ name: r.name, halfLife: r.halfLife, maxActivity: r.maxActivity, tvlConcrete: r.tvlConcrete511keV, tvlLead: r.tvlLead511keV, eGamma: r.eGamma }))}
              />
            </SpecCard>
          </TabsContent>

          <TabsContent value="spect" className="mt-3">
            <SpecCard title={SPECT_SPECS.title}>
              <div className="flex gap-2 mb-2 flex-wrap">
                {SPECT_SPECS.norms.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <ModelTable
                headers={['Radionuclido', 'T1/2', 'Act. max', 'TVL Concr', 'TVL Plomo', 'E_gamma']}
                rows={SPECT_SPECS.radionuclides.map(r => ({ name: r.name, halfLife: r.halfLife, maxActivity: r.maxActivity, tvlConcrete: r.tvlConcrete140keV, tvlLead: r.tvlLead140keV, eGamma: r.eGamma }))}
              />
            </SpecCard>
          </TabsContent>

          <TabsContent value="ciclotron" className="mt-3">
            <SpecCard title={CICLOTRON_SPECS.title}>
              <div className="flex gap-2 mb-2 flex-wrap">
                {CICLOTRON_SPECS.norms.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <ModelTable
                headers={['Tipo', 'Particulas', 'Energia max', 'Corriente', 'Isotopos', 'Blindaje']}
                rows={CICLOTRON_SPECS.models.map(m => ({ name: m.name, particles: m.particles, maxEnergy: m.maxEnergy, beamCurrent: m.beamCurrent, targets: m.targets, shielding: m.shielding }))}
              />
            </SpecCard>
          </TabsContent>

          <TabsContent value="protones" className="mt-3">
            <SpecCard title={PROTONES_SPECS.title}>
              <div className="flex gap-2 mb-2 flex-wrap">
                {PROTONES_SPECS.norms.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}
              </div>
              <ModelTable
                headers={['Acelerador', 'Energia max', 'Alcance', 'TVL Concreto', 'Blindaje neutrones', 'Aplicaciones']}
                rows={PROTONES_SPECS.models.map(m => ({ name: m.name, maxEnergy: m.maxEnergy, range: m.range, tvlConcrete: m.tvlConcrete, neutronShielding: m.neutronShielding, applications: m.applications }))}
              />
            </SpecCard>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
