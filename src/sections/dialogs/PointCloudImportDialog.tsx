import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Cloud, Upload, ArrowRight } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function PointCloudImportDialog({ open, onOpenChange }: Props) {
  const [fileName, setFileName] = useState('');
  const [loaded, setLoaded] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setLoaded(true);
    toast.success('Point cloud loaded: 2.4M points');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Cloud className="h-5 w-5 text-sky-500" />Point Cloud Import (LiDAR)</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Upload LiDAR scan (.las, .laz, .e57, .ply, .xyz)</p>
              <Input type="file" accept=".las,.laz,.e57,.ply,.xyz" onChange={handleUpload} className="mt-2" />
            </div>
            {loaded && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Points</p><p className="text-2xl font-bold">2.4M</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Dimensions</p><p className="text-2xl font-bold">12x8x4 m</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Resolution</p><p className="text-2xl font-bold">5 mm</p></CardContent></Card>
                  <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Deviation</p><p className="text-2xl font-bold">±2 cm</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">As-Built vs Designed Comparison</CardTitle></CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <div className="flex justify-between"><span>Wall thickness (designed):</span><span className="font-mono">120.0 cm</span></div>
                    <div className="flex justify-between"><span>Wall thickness (measured):</span><span className="font-mono">118.5 cm</span></div>
                    <div className="flex justify-between"><span>Deviation:</span><Badge variant="outline" className="text-[9px]">-1.5 cm (-1.3%)</Badge></div>
                    <div className="flex justify-between"><span>Maze length (designed):</span><span className="font-mono">320.0 cm</span></div>
                    <div className="flex justify-between"><span>Maze length (measured):</span><span className="font-mono">322.8 cm</span></div>
                    <div className="flex justify-between"><span>Deviation:</span><Badge variant="outline" className="text-[9px]">+2.8 cm (+0.9%)</Badge></div>
                  </CardContent>
                </Card>
                <Button className="w-full"><ArrowRight className="h-4 w-4 mr-2" />Compare with Design Model</Button>
              </>
            )}
            <Card className="bg-sky-50 dark:bg-sky-950/30 border-sky-200">
              <CardContent className="pt-3 text-xs text-sky-700 dark:text-sky-300">
                <p className="font-medium">Supported Formats</p>
                <p>.las / .laz (ASPRS), .e57 (ASTM), .ply (Stanford), .xyz (ASCII), .pts (Leica), .rcp (Autodesk ReCap)</p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
