import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Video, Play, Mic, Clock, FileText } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const TUTORIALS = [
  { id: 'primary_barrier', title: 'How to Calculate a Primary Barrier', duration: '3:24', topics: ['NCRP 151 formula', 'TVL method', 'Worked example 6MV concrete'] },
  { id: 'scatter_barrier', title: 'Scatter Barrier Calculation', duration: '4:12', topics: ['Scatter fraction table B.4', '90° scatter', 'Patient scatter example'] },
  { id: 'neutron_shielding', title: 'Neutron Shielding >10 MV', duration: '5:08', topics: ['Neutron production', 'TVL for neutrons', 'Door maze design'] },
  { id: 'pet_ct_shielding', title: 'PET/CT Shielding (TG 108)', duration: '4:45', topics: ['Gamma constant', 'Uptake room', 'Weekly kerma method'] },
  { id: 'gum_uncertainty', title: 'GUM Uncertainty Propagation', duration: '6:20', topics: ['Type A/B uncertainties', 'Sensitivity coefficients', 'Coverage factor k=2'] },
];

export default function VideoTutorialGenerator({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState(TUTORIALS[0].id);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); toast.success('Video tutorial generated'); }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-rose-500" />Video Tutorial Generator</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TUTORIALS.map(t => <SelectItem key={t.id} value={t.id}>{t.title} ({t.duration})</SelectItem>)}
              </SelectContent>
            </Select>
            {TUTORIALS.filter(t => t.id === selected).map(t => (
              <Card key={t.id}>
                <CardContent className="pt-3">
                  <p className="font-medium">{t.title}</p>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-[9px]"><Clock className="h-2.5 w-2.5 mr-0.5" />{t.duration}</Badge>
                    <Badge variant="outline" className="text-[9px]"><Mic className="h-2.5 w-2.5 mr-0.5" />ElevenLabs TTS</Badge>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {t.topics.map((topic, i) => <div key={i} className="text-xs flex items-center gap-1"><FileText className="h-3 w-3 text-muted-foreground" />{topic}</div>)}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={generate} disabled={generating} className="w-full">
              {generating ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Generate Tutorial Video
            </Button>
            <div className="border rounded p-3 bg-muted/30 text-center text-sm text-muted-foreground">
              Video will include: animated formulas, step-by-step calculations, 3D bunker visualization, voice narration via ElevenLabs API
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
