// =============================================================================
// ExternalConnectorDialog.tsx — External Software Integration
// ANSYS, MATLAB, COMSOL, SolidWorks, Geant4, MCNP, FLUKA, Penelope
// =============================================================================
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import '@/components/ui/input';
import '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Cpu, ExternalLink, Download, Link2,
  CheckCircle, Info, Settings,
} from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface ExternalSoftware {
  id: string;
  name: string;
  vendor: string;
  category: 'FEM' | 'MC' | 'CAD' | 'Math' | 'Optimization';
  description: string;
  connectionType: 'API' | 'File' | 'Script' | 'Plugin';
  status: 'available' | 'beta' | 'planned';
  formats: string[];
  website: string;
  features: string[];
}

const SOFTWARE_LIST: ExternalSoftware[] = [
  {
    id: 'cad-conversion-api',
    name: 'CAD Conversion API',
    vendor: 'Custom / ODA / Autodesk APS',
    category: 'CAD',
    description: 'External conversion bridge for DWG to DXF/SVG/IFC/GLB/JSON before RadShield import. Keeps native DWG parsing outside the browser core.',
    connectionType: 'API',
    status: 'beta',
    formats: ['.dwg', '.dxf', '.svg', '.ifc', '.glb', '.json'],
    website: 'https://aps.autodesk.com/',
    features: ['DWG conversion handoff', 'Layer preservation', 'Unit metadata', 'BIM metadata extraction', 'Unsupported entity warnings'],
  },
  {
    id: 'rayxpert',
    name: 'RayXpert',
    vendor: 'TRAD Tests & Radiations',
    category: 'MC',
    description: '3D Monte Carlo workflow reference with CAD import, dose mapping, zoning, validation benchmarks, and distributed calculation concepts.',
    connectionType: 'File',
    status: 'planned',
    formats: ['.step', '.iges', '.stl', '.csv', '.gdml'],
    website: 'https://www.rayxpert.com/en/',
    features: ['CAD geometry exchange', 'Dose mapping benchmark', 'Zoning comparison', 'Validation folder cross-check'],
  },
  {
    id: 'mosaicatomics',
    name: 'Mosaic Atomics',
    vendor: 'Mosaic Atomics',
    category: 'Optimization',
    description: 'Medical shielding workflow reference for regulator-ready reports, editable assumptions, control points, and project review.',
    connectionType: 'File',
    status: 'planned',
    formats: ['.csv', '.xlsx', '.pdf', '.json'],
    website: 'https://www.mosaicatomics.com/',
    features: ['Report workflow comparison', 'Barrier assumption review', 'Control point checklist', 'Project handoff package'],
  },
  {
    id: 'ansys',
    name: 'ANSYS Mechanical / Fluent',
    vendor: 'Ansys, Inc.',
    category: 'FEM',
    description: 'Finite Element Analysis for structural, thermal, and fluid simulations. Radiation transport via ACP module.',
    connectionType: 'File',
    status: 'planned',
    formats: ['.cdb', '.inp', '.rst', '.iges', '.step'],
    website: 'https://www.ansys.com/',
    features: ['Stress analysis on shielding', 'Thermal simulation', 'Geometry import/export', 'Results comparison'],
  },
  {
    id: 'matlab',
    name: 'MATLAB + Simulink',
    vendor: 'MathWorks',
    category: 'Math',
    description: 'Numerical computing environment. Shielding calculations, optimization, and data analysis.',
    connectionType: 'Script',
    status: 'available',
    formats: ['.m', '.mat', '.csv', '.xlsx'],
    website: 'https://www.mathworks.com/',
    features: ['Direct .m file export', 'Matrix calculations', 'Optimization toolbox', 'Signal processing'],
  },
  {
    id: 'comsol',
    name: 'COMSOL Multiphysics',
    vendor: 'COMSOL AB',
    category: 'FEM',
    description: 'Multiphysics simulation including radiation transfer, heat transfer, and particle tracing.',
    connectionType: 'File',
    status: 'planned',
    formats: ['.mph', '.txt', '.csv', '.stl'],
    website: 'https://www.comsol.com/',
    features: ['Radiation transfer module', 'Particle tracing', 'Heat-shielding coupling', 'LiveLink MATLAB'],
  },
  {
    id: 'solidworks',
    name: 'SolidWorks',
    vendor: 'Dassault Systemes',
    category: 'CAD',
    description: '3D CAD design. Import shielding geometries for mechanical design and verification.',
    connectionType: 'File',
    status: 'available',
    formats: ['.sldprt', '.sldasm', '.step', '.iges', '.stl'],
    website: 'https://www.solidworks.com/',
    features: ['3D model export', 'Assembly verification', 'STEP/IGES import', 'BOM generation'],
  },
  {
    id: 'geant4',
    name: 'Geant4',
    vendor: 'CERN',
    category: 'MC',
    description: 'Monte Carlo toolkit for simulating particle transport through matter. Gold standard for shielding validation.',
    connectionType: 'Script',
    status: 'available',
    formats: ['.mac', '.gdml', '.csv', '.root'],
    website: 'https://geant4.web.cern.ch/',
    features: ['Auto-generate macros', 'GDML geometry export', 'Physics list selection', 'Results validation'],
  },
  {
    id: 'mcnp',
    name: 'MCNP6',
    vendor: 'LANL',
    category: 'MC',
    description: 'Monte Carlo N-Particle transport code. LANL reference for nuclear shielding calculations.',
    connectionType: 'Script',
    status: 'available',
    formats: ['.inp', '.i', '.o', '.mctal'],
    website: 'https://mcnp.lanl.gov/',
    features: ['Input deck generation', 'Criticality safety', 'Neutron/photon coupled', 'Tally configuration'],
  },
  {
    id: 'fluka',
    name: 'FLUKA',
    vendor: 'CERN/INFN',
    category: 'MC',
    description: 'Fully integrated Monte Carlo simulation package for particle physics and shielding.',
    connectionType: 'Script',
    status: 'beta',
    formats: ['.inp', '.flair', '.log', '.fort'],
    website: 'https://fluka.cern/',
    features: ['Hadron/electron/photon', 'Activation calculations', 'Residual dose', 'FLAIR GUI export'],
  },
  {
    id: 'penelope',
    name: 'PENELOPE',
    vendor: 'CIEMAT',
    category: 'MC',
    description: 'Monte Carlo code for simulation of electron-photon showers in arbitrary materials.',
    connectionType: 'File',
    status: 'planned',
    formats: ['.in', '.geo', '.mat', '.dat'],
    website: 'https://www.oecd-nea.org/tools/abstract/detail/nea-1525',
    features: ['Electron-photon transport', 'Material definition export', 'Geometry files', 'Energy deposition'],
  },
  {
    id: 'gate',
    name: 'GATE (Geant4 Application)',
    vendor: 'OpenGATE Collaboration',
    category: 'MC',
    description: 'Geant4-based simulation platform for PET/SPECT and radiation therapy.',
    connectionType: 'Script',
    status: 'available',
    formats: ['.mac', '.mhd', '.raw', '.root'],
    website: 'https://opengate.readthedocs.io/',
    features: ['Nuclear medicine sim', 'Imaging simulation', 'Dose calculation', 'CT simulation'],
  },
  {
    id: 'origin',
    name: 'OriginPro',
    vendor: 'OriginLab',
    category: 'Math',
    description: 'Data analysis and graphing software. Plot shielding results with publication-quality figures.',
    connectionType: 'File',
    status: 'available',
    formats: ['.opju', '.csv', '.txt'],
    website: 'https://www.originlab.com/',
    features: ['Publication plots', 'Curve fitting', 'Custom templates', 'Multi-plot layouts'],
  },
];

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'FEM': return 'bg-purple-100 text-purple-800';
    case 'MC': return 'bg-blue-100 text-blue-800';
    case 'CAD': return 'bg-emerald-100 text-emerald-800';
    case 'Math': return 'bg-amber-100 text-amber-800';
    case 'Optimization': return 'bg-rose-100 text-rose-800';
    default: return 'bg-gray-100';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'available': return <Badge className="bg-emerald-500 text-[10px]">Available</Badge>;
    case 'beta': return <Badge className="bg-amber-500 text-[10px]">Beta</Badge>;
    case 'planned': return <Badge variant="outline" className="text-[10px]">Planned</Badge>;
    default: return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
  }
}

export default function ExternalConnectorDialog({ open, onOpenChange }: Props) {
  const [selectedSoftware, setSelectedSoftware] = useState<ExternalSoftware | null>(null);
  const [exportFormat, setExportFormat] = useState('');

  const handleExport = (software: ExternalSoftware) => {
    const format = exportFormat || software.formats[0];
    toast.success(`Exporting to ${software.name} format (${format})`);
  };

  const mcSoftware = SOFTWARE_LIST.filter(s => s.category === 'MC');
  const femSoftware = SOFTWARE_LIST.filter(s => s.category === 'FEM');
  const cadSoftware = SOFTWARE_LIST.filter(s => s.category === 'CAD');
  const mathSoftware = SOFTWARE_LIST.filter(s => s.category === 'Math');
  const optimizationSoftware = SOFTWARE_LIST.filter(s => s.category === 'Optimization');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Cpu className="h-5 w-5 text-blue-500" />
            External Software Connector
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Connect RadShield-MX with ANSYS, MATLAB, COMSOL, SolidWorks, Geant4, MCNP, FLUKA, and more
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Info Banner */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
              <CardContent className="pt-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">How it works</p>
                  <p>RadShield-MX exports shielding data in vendor-specific formats. You import these files into the external software for advanced simulations (Monte Carlo, FEM, CAD). Results can be re-imported for comparison.</p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="mc">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="mc"><AtomIcon />Monte Carlo</TabsTrigger>
                <TabsTrigger value="fem"><CpuIcon />FEM/Physics</TabsTrigger>
                <TabsTrigger value="cad"><BoxIcon />CAD</TabsTrigger>
                <TabsTrigger value="math"><MathIcon />Math/Analysis</TabsTrigger>
                <TabsTrigger value="optimization"><Settings className="h-3.5 w-3.5 mr-1" />Workflow</TabsTrigger>
              </TabsList>

              {[
                { key: 'mc', list: mcSoftware },
                { key: 'fem', list: femSoftware },
                { key: 'cad', list: cadSoftware },
                { key: 'math', list: mathSoftware },
                { key: 'optimization', list: optimizationSoftware },
              ].map(tab => (
                <TabsContent key={tab.key} value={tab.key} className="space-y-2">
                  {tab.list.map(sw => (
                    <Card key={sw.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedSoftware?.id === sw.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedSoftware(sw)}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{sw.name}</p>
                              <Badge className={`text-[10px] ${getCategoryColor(sw.category)}`}>{sw.category}</Badge>
                              {getStatusBadge(sw.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{sw.description}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {sw.formats.map(f => (
                                <Badge key={f} variant="outline" className="text-[10px] font-mono">{f}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); window.open(sw.website, '_blank'); }}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            {/* Selected Software Detail */}
            {selectedSoftware && (
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    {selectedSoftware.name} — Connection Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted p-2 rounded">
                      <p className="text-xs text-muted-foreground">Connection Type</p>
                      <p className="font-medium">{selectedSoftware.connectionType}</p>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{selectedSoftware.status}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Supported Features</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedSoftware.features.map(f => (
                        <Badge key={f} variant="secondary" className="text-[10px]"><CheckCircle className="h-2.5 w-2.5 mr-0.5" />{f}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="w-40 text-xs"><SelectValue placeholder="Select format" /></SelectTrigger>
                      <SelectContent>
                        {selectedSoftware.formats.map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleExport(selectedSoftware)}>
                      <Download className="h-3.5 w-3.5 mr-1" />Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(selectedSoftware.website, '_blank')}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* API Endpoints */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">API Reference (Future)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-mono space-y-1">
                <p><span className="text-emerald-600">POST</span> /api/export/geant4/macro — Generate Geant4 macro</p>
                <p><span className="text-emerald-600">POST</span> /api/export/mcnp/input — Generate MCNP6 input deck</p>
                <p><span className="text-emerald-600">POST</span> /api/export/matlab/script — Generate MATLAB .m file</p>
                <p><span className="text-emerald-600">POST</span> /api/export/comsol/geometry — Export COMSOL geometry</p>
                <p><span className="text-emerald-600">POST</span> /api/export/solidworks/step — Export STEP file</p>
                <p><span className="text-blue-600">GET</span> /api/validate/mc — Validate against MC simulation results</p>
                <p><span className="text-blue-600">GET</span> /api/compare/experimental — Compare with measured data</p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AtomIcon() { return <span className="mr-1">⚛</span>; }
function CpuIcon() { return <Cpu className="h-3.5 w-3.5 mr-1" />; }
function BoxIcon() { return <span className="mr-1">📦</span>; }
function MathIcon() { return <span className="mr-1">∑</span>; }
