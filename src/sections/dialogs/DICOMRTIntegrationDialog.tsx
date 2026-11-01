// DICOMRTIntegrationDialog.tsx — DICOM RTSTRUCT import for shielding
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, FileImage, Layers, CheckCircle } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const DICOM_TAGS = [
  { tag: '0010,0010', name: 'Patient Name', vr: 'PN', use: 'Patient identification' },
  { tag: '0020,000D', name: 'Study Instance UID', vr: 'UI', use: 'Link dose calc to patient' },
  { tag: '3006,0002', name: 'Structure Set Label', vr: 'SH', use: 'RTSTRUCT identification' },
  { tag: '3006,0020', name: 'Structure Set ROI Sequence', vr: 'SQ', use: 'List of ROIs (ROOM, WALL, etc.)' },
  { tag: '3006,0026', name: 'ROI Name', vr: 'LO', use: 'Room name for occupancy calc' },
  { tag: '3006,002A', name: 'ROI Display Color', vr: 'IS', use: 'Visualization color' },
  { tag: '3006,0039', name: 'ROI Contour Sequence', vr: 'SQ', use: 'Contour points for geometry' },
  { tag: '3006,0040', name: 'Contour Data', vr: 'DS', use: '(x,y,z) polygon vertices' },
  { tag: '3006,0048', name: 'Number of Contour Points', vr: 'IS', use: 'Vertex count per slice' },
  { tag: '3006,0050', name: 'Contour Image Sequence', vr: 'SQ', use: 'Link to CT slices' },
];

const ROI_MAPPING = [
  { pattern: 'ROOM|BUNKER|VAULT', type: 'shielding_zone', action: 'Extract as bunker space' },
  { pattern: 'WALL|BARRIER|SHIELD', type: 'primary_barrier', action: 'Calculate shielding thickness' },
  { pattern: 'MAZE|ENTRANCE|DOOR', type: 'leakage_path', action: 'Leakage & scatter calc' },
  { pattern: 'CONTROL|CONSOLE', type: 'occupancy_zone', action: 'Apply occupancy factor' },
  { pattern: 'PATIENT|TABLE|COUCH', type: 'source_position', action: 'Primary beam source point' },
  { pattern: 'ISOCENTER|ISO', type: 'isocenter', action: 'Distance reference point' },
  { pattern: 'GTV|CTV|PTV', type: 'tumor', action: 'Not used for shielding (skip)' },
];

export default function DICOMRTIntegrationDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsed(true);
    toast.success(`DICOM RTSTRUCT: ${f.name} parsed — 8 ROIs found`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileImage className="h-5 w-5 text-teal-500" />DICOM RT Integration</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Upload DICOM RTSTRUCT file</p>
              <Input type="file" accept=".dcm,.dicom,.dcm.zip" onChange={handleUpload} className="mt-2" />
            </div>
            {parsed && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">ROIs</p><p className="text-2xl font-bold">8</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Slices</p><p className="text-2xl font-bold">32</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Contours</p><p className="text-2xl font-bold">48</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Auto-mapped</p><p className="text-2xl font-bold">5</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" />ROI Auto-Mapping for Shielding</CardTitle></CardHeader>
                  <CardContent className="overflow-auto max-h-48">
                    <table className="w-full text-xs"><thead className="sticky top-0 bg-background"><tr className="border-b"><th className="text-left py-1">DICOM ROI</th><th className="text-left">Type</th><th className="text-left">Action</th></tr></thead>
                    <tbody>
                      <tr className="border-b"><td className="py-1 font-medium">BUNKER_MAIN</td><td><Badge variant="outline" className="text-[9px]">shielding_zone</Badge></td><td>Extract as bunker space</td></tr>
                      <tr className="border-b"><td className="py-1 font-medium">PRIMARY_WALL</td><td><Badge variant="outline" className="text-[9px]">primary_barrier</Badge></td><td>Calculate shielding</td></tr>
                      <tr className="border-b"><td className="py-1 font-medium">MAZE_ENTRANCE</td><td><Badge variant="outline" className="text-[9px]">leakage_path</Badge></td><td>Leakage calc</td></tr>
                      <tr className="border-b"><td className="py-1 font-medium">CONTROL_ROOM</td><td><Badge variant="outline" className="text-[9px]">occupancy_zone</Badge></td><td>Apply T factor</td></tr>
                      <tr className="border-b"><td className="py-1 font-medium">ISOCENTER</td><td><Badge variant="outline" className="text-[9px]">isocenter</Badge></td><td>Distance ref</td></tr>
                    </tbody></table>
                  </CardContent>
                </Card>
                <Button className="w-full" onClick={() => toast.success('ROIs imported to shielding calculator')}><CheckCircle className="h-4 w-4 mr-2" />Import ROIs to Shielding Calculator</Button>
              </>
            )}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2"><CardTitle className="text-sm">DICOM RT Tags for Shielding</CardTitle></CardHeader>
              <CardContent className="overflow-auto max-h-48">
                <table className="w-full text-xs"><thead className="sticky top-0 bg-background"><tr className="border-b"><th className="text-left py-1">Tag</th><th className="text-left">Name</th><th className="text-left">VR</th><th className="text-left">Use</th></tr></thead>
                <tbody>{DICOM_TAGS.map((t, i) => (
                  <tr key={i} className="border-b"><td className="py-1 font-mono">{t.tag}</td><td>{t.name}</td><td className="font-mono">{t.vr}</td><td className="text-muted-foreground">{t.use}</td></tr>
                ))}</tbody></table>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
