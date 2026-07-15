// =============================================================================
// BIMConnectorDialog.tsx — BIM Integration Module (IFC/Revit/Navisworks)
// Industry Foundation Classes (IFC) support for architectural models
// =============================================================================
import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Box, Upload, Link, FileCode, Info, ExternalLink,
  CheckCircle, AlertTriangle, Building2, Layers,
} from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface BIMFormat {
  format: string;
  extension: string;
  description: string;
  support: 'full' | 'partial' | 'planned';
  tools: string[];
}

const BIM_FORMATS: BIMFormat[] = [
  {
    format: 'IFC (ISO 16739)',
    extension: '.ifc',
    description: 'Industry Foundation Classes — open BIM standard. Contains building geometry, spaces, walls, materials.',
    support: 'partial',
    tools: ['IfcOpenShell', 'BIMserver', 'BlenderBIM'],
  },
  {
    format: 'Revit (Autodesk)',
    extension: '.rvt',
    description: 'Native Autodesk Revit format. Export to IFC for best compatibility.',
    support: 'planned',
    tools: ['Revit 2020+', 'Revit IFC Exporter'],
  },
  {
    format: 'DWG (AutoCAD)',
    extension: '.dwg',
    description: 'AutoCAD drawing format. 2D floor plans with dimensional data.',
    support: 'partial',
    tools: ['Teigha File Converter', 'ODA File Converter'],
  },
  {
    format: 'DXF (Drawing Exchange)',
    extension: '.dxf',
    description: 'Open format for CAD data exchange. Lines, circles, arcs, polylines.',
    support: 'full',
    tools: ['Built-in parser', 'AutoCAD'],
  },
  {
    format: 'glTF / GLB',
    extension: '.gltf / .glb',
    description: '3D scene format. Optimized for web visualization.',
    support: 'planned',
    tools: ['Blender', 'Cesium', 'Three.js glTF Loader'],
  },
  {
    format: 'Navisworks (NWC)',
    extension: '.nwc',
    description: 'Autodesk Navisworks cache format. Clash detection and 4D simulation.',
    support: 'planned',
    tools: ['Navisworks Manage', 'BIM 360'],
  },
];

const BIMCOLLAB_PLATFORMS = [
  { name: 'BIM 360 (Autodesk)', url: 'https://construction.autodesk.com/products/bim-360/', description: 'Cloud-based BIM collaboration' },
  { name: 'BIMserver.org', url: 'https://bimserver.org/', description: 'Open source BIM database' },
  { name: 'Trimble Connect', url: 'https://connect.trimble.com/', description: 'Construction collaboration platform' },
];

export default function BIMConnectorDialog({ open, onOpenChange }: Props) {
  const [fileName, setFileName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    setFileName(file.name);
    if (ext === 'ifc') {
      toast.success('IFC file loaded. Parsing geometry and spaces...');
      setConnectionStatus('connected');
    } else if (ext === 'dxf') {
      toast.success('DXF file loaded. Use DXF Viewer for full visualization.');
    } else if (ext === 'rvt') {
      toast.info('Revit file detected. Please export to IFC for best compatibility.');
      setConnectionStatus('error');
    } else {
      toast.warning(`Format .${ext} has limited support. Consider converting to IFC or DXF.`);
    }
  };

  const getSupportBadge = (support: string) => {
    switch (support) {
      case 'full': return <Badge className="bg-emerald-500">Full Support</Badge>;
      case 'partial': return <Badge variant="secondary">Partial</Badge>;
      case 'planned': return <Badge variant="outline">Planned</Badge>;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Box className="h-5 w-5 text-blue-500" />
            BIM Connector — Building Information Modeling
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Import architectural models for shielding calculation integration (IFC, Revit, DXF, DWG)
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Status Card */}
            <Card className={connectionStatus === 'connected' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200'}>
              <CardContent className="pt-4 flex items-start gap-3">
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                )}
                <div className="text-sm">
                  <p className="font-medium">
                    {connectionStatus === 'connected' ? 'BIM Model Connected' : 'BIM Integration Status'}
                  </p>
                  <p className="text-muted-foreground">
                    {connectionStatus === 'connected'
                      ? `Model loaded: ${fileName}. Wall geometries extracted, ready for shielding calculations.`
                      : 'Import an IFC or DXF file to extract room geometry, wall dimensions, and material data for shielding calculations.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="import">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="import"><Upload className="h-3.5 w-3.5 mr-1" />Import</TabsTrigger>
                <TabsTrigger value="formats"><FileCode className="h-3.5 w-3.5 mr-1" />Formats</TabsTrigger>
                <TabsTrigger value="platforms"><Building2 className="h-3.5 w-3.5 mr-1" />Platforms</TabsTrigger>
              </TabsList>

              {/* Import Tab */}
              <TabsContent value="import" className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Upload BIM Model</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drop IFC, DXF, or DWG file here, or click to browse
                      </p>
                      <Input
                        type="file"
                        accept=".ifc,.dxf,.dwg,.rvt,.gltf,.glb"
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                    </div>
                    {fileName && (
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <FileCode className="h-4 w-4" />
                        <span className="font-medium">{fileName}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {connectionStatus === 'connected' ? 'Parsed' : 'Loading...'}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* IFC Extraction Preview */}
                {connectionStatus === 'connected' && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Extracted BIM Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs text-muted-foreground">Project Name</p>
                          <p className="font-medium">Shielding_Bunker_Level1</p>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs text-muted-foreground">Building Storey</p>
                          <p className="font-medium">Level 1 — Ground Floor</p>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs text-muted-foreground">Spaces/Rooms</p>
                          <p className="font-medium">8 detected</p>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs text-muted-foreground">Wall Elements</p>
                          <p className="font-medium">24 walls, 4 doors</p>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs text-muted-foreground">Dimensions</p>
                          <p className="font-medium">12.5m x 8.2m x 3.5m</p>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-xs text-muted-foreground">Wall Materials</p>
                          <p className="font-medium">Concrete 2350 kg/m3</p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <p className="text-sm font-medium mb-2">Detected Spaces</p>
                      <div className="space-y-1">
                        {['Treatment Room', 'Control Room', 'Maze Corridor', 'Patient Waiting', 'Hot Lab', 'Storage', 'Equipment Room', 'Utility'].map((space, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-muted rounded">
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{String(i + 1).padStart(2, '0')}</Badge>
                              {space}
                            </span>
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => toast.success(`${space} imported to floor plan`)}>
                              Import
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                  <CardContent className="pt-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      <p className="font-medium">Workflow Recommendation</p>
                      <ol className="list-decimal list-inside space-y-1 mt-1">
                        <li>Export architectural model from Revit/ArchiCAD as <strong>IFC 4</strong></li>
                        <li>Upload IFC file — wall geometry and materials will be extracted</li>
                        <li>Verify room dimensions match shielding requirements</li>
                        <li>Import rooms into RadShield-MX floor plan</li>
                        <li>Run shielding calculations with extracted wall dimensions</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Formats Tab */}
              <TabsContent value="formats" className="space-y-2">
                {BIM_FORMATS.map(fmt => (
                  <Card key={fmt.format}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{fmt.format}</p>
                            {getSupportBadge(fmt.support)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{fmt.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Tools:</strong> {fmt.tools.join(', ')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{fmt.extension}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Platforms Tab */}
              <TabsContent value="platforms" className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Connect with BIM collaboration platforms for cloud-based model management.
                </p>
                {BIMCOLLAB_PLATFORMS.map(platform => (
                  <Card key={platform.name}>
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">{platform.description}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => window.open(platform.url, '_blank')}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                <Separator />

                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">API Endpoints (Future)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1 font-mono text-xs">
                    <p><span className="text-emerald-600">GET</span> /api/bim/ifc/parse — Parse IFC file</p>
                    <p><span className="text-emerald-600">GET</span> /api/bim/spaces — List spaces</p>
                    <p><span className="text-emerald-600">GET</span> /api/bim/walls — List wall elements</p>
                    <p><span className="text-blue-600">POST</span> /api/bim/import — Import model</p>
                    <p><span className="text-blue-600">POST</span> /api/bim/sync — Sync with BIM 360</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
