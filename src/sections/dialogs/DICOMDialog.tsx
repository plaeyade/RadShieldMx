import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileImage } from 'lucide-react';
import { parseDICOMFile } from '@/hooks/useDICOM';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onLoadMetadata?: (metadata: { kVp?: number; mAs?: number }) => void; }

export default function DICOMDialog({ open, onOpenChange, onLoadMetadata }: Props) {
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof parseDICOMFile>> | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name);
    const result = await parseDICOMFile(file);
    if (result) {
      setMeta(result);
      toast.success(`DICOM cargado: ${result.modality} ${result.kVp}kV`);
      onLoadMetadata?.({ kVp: result.kVp, mAs: result.mAs });
    } else {
      toast.error('No es un archivo DICOM valido');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileImage className="w-5 h-5" />Importar DICOM / PACS</DialogTitle></DialogHeader>
        <p className="text-xs text-gray-500">Fase 10 — Importe imagenes DICOM de CT/TAC del PACS como fondo del canvas. Extrae parametros de exposicion (kVp, mAs).</p>
        <Button size="sm" variant="outline" className="w-full text-xs" asChild><label><Upload className="w-3 h-3 mr-1" />Cargar archivo DICOM<input type="file" accept=".dcm,image/dicom" className="hidden" onChange={handleFile} /></label></Button>
        {meta && (
          <div className="text-xs space-y-1 border rounded p-2">
            <div className="flex justify-between"><span>Archivo:</span><span>{fileName}</span></div>
            <div className="flex justify-between"><span>Modalidad:</span><Badge className="text-[9px]">{meta.modality}</Badge></div>
            <div className="flex justify-between"><span>kVp:</span><span>{meta.kVp}</span></div>
            <div className="flex justify-between"><span>mAs:</span><span>{meta.mAs}</span></div>
          </div>
        )}
        <p className="text-[10px] text-gray-400">En produccion: integracion con PACS via DICOMweb (WADO-RS).</p>
      </DialogContent>
    </Dialog>
  );
}
