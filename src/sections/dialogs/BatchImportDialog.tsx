import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseCSVImport, applyCSVImport } from '@/hooks/useBatchImport';
import type { FloorPlan } from '@/types/radshield';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; floorPlan: FloorPlan; onImport: (plan: FloorPlan) => void; }

export default function BatchImportDialog({ open, onOpenChange, floorPlan, onImport }: Props) {
  const [csvText, setCsvText] = useState('');

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCsvText(ev.target?.result as string); toast.success(`Archivo cargado: ${file.name}`); };
    reader.readAsText(file);
  }, []);

  const apply = useCallback(() => {
    const rows = parseCSVImport(csvText);
    if (rows.length === 0) { toast.error('CSV vacio o formato invalido'); return; }
    const newPlan = applyCSVImport(rows, floorPlan);
    onImport(newPlan);
    toast.success(`${rows.length} elementos importados`);
    onOpenChange(false);
  }, [csvText, floorPlan, onImport, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Importar batch CSV/Excel</DialogTitle></DialogHeader>
        <p className="text-xs text-gray-500">Formato CSV: name,type,x1,y1,x2,y2,barriertype,materialcode,usefactor,occupancy,designgoal (para barreras) o name,type,x,y,modalityid,workload,usefactor (para fuentes)</p>
        <Button size="sm" variant="outline" className="w-full text-xs" asChild><label><FileSpreadsheet className="w-3 h-3 mr-1" />Cargar CSV<input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} /></label></Button>
        <Textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Pegue aqui el CSV o cargue un archivo..." className="h-32 text-xs font-mono" />
        <Button onClick={apply} className="w-full bg-red-700 hover:bg-red-800"><Upload className="w-4 h-4 mr-1" />Importar a plano</Button>
      </DialogContent>
    </Dialog>
  );
}
