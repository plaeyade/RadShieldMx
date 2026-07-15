import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Microscope } from 'lucide-react';
import type { MCConfig } from '@/hooks/useMCBridge';

interface MCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MCConfig;
  setConfig: React.Dispatch<React.SetStateAction<MCConfig>>;
  onGenerate: () => void;
}

export default function MCDialog({ open, onOpenChange, config, setConfig, onGenerate }: MCDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Exportar Macro Monte Carlo GEANT4/GATE</DialogTitle></DialogHeader>
        <div className="space-y-3 py-3">
          <p className="text-sm text-gray-600">
            Genere macros para validar los calculos analiticos contra simulacion Monte Carlo. Se descargan 3 archivos: macro GEANT4 (.mac), macro GATE (.mac), e instrucciones de validacion.
          </p>
          <div>
            <Label className="text-xs">Numero de particulas primarias</Label>
            <Input type="number" value={config.numParticles}
              onChange={e => setConfig(c => ({ ...c, numParticles: parseInt(e.target.value) || 1_000_000 }))}
              className="h-8 text-sm" />
            <p className="text-[10px] text-gray-500">Recomendado: 1x10^6 para barreras finas, 1x10^7 para concreto grueso</p>
          </div>
          <div>
            <Label className="text-xs">Lista de fisica</Label>
            <Select value={config.physicsList} onValueChange={val => setConfig(c => ({ ...c, physicsList: val }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="QGSP_BIC_EMY" className="text-xs">QGSP_BIC_EMY (rayos X diagnostico)</SelectItem>
                <SelectItem value="QGSP_BIC_HP" className="text-xs">QGSP_BIC_HP (terapia + neutrones)</SelectItem>
                <SelectItem value="QGSP_BIC_EMZ" className="text-xs">QGSP_BIC_EMZ (medicina nuclear)</SelectItem>
                <SelectItem value="FTFP_BERT" className="text-xs">FTFP_BERT (hadrones alta energia)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cut de produccion (mm)</Label>
            <Input type="number" step="0.01" value={config.cutValue_mm}
              onChange={e => setConfig(c => ({ ...c, cutValue_mm: parseFloat(e.target.value) || 0.1 }))}
              className="h-8 text-sm" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Reduccion de varianza (Russian roulette)</Label>
            <Button size="sm" variant={config.useVarianceReduction ? 'default' : 'outline'} className="h-7 text-xs"
              onClick={() => setConfig(c => ({ ...c, useVarianceReduction: !c.useVarianceReduction }))}>
              {config.useVarianceReduction ? 'ON' : 'OFF'}
            </Button>
          </div>
          <Button onClick={onGenerate} className="w-full bg-indigo-700 hover:bg-indigo-800">
            <Microscope className="w-4 h-4 mr-2" />Generar y Descargar Macros MC
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
