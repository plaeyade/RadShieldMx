import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'sonner';
import { Play, Pause, SkipBack, Clock, Zap } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

function jet(v: number): string {
  v = Math.max(0, Math.min(1, v));
  let r = 0, g = 0, b = 0;
  if (v < 0.125) b = 0.5 + v * 4;
  else if (v < 0.375) { g = (v - 0.125) * 4; b = 1; }
  else if (v < 0.625) { r = (v - 0.375) * 4; g = 1; b = 1 - (v - 0.375) * 4; }
  else if (v < 0.875) { r = 1; g = 1 - (v - 0.625) * 4; }
  else { r = 1; g = (v - 0.875) * 2; }
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

export default function AnimatedDoseMapsDialog({ open, onOpenChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed] = useState(1);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (playing) {
      let last = performance.now();
      const step = (now: number) => {
        const dt = (now - last) / 1000;
        last = now;
        setTime(t => (t + dt * speed) % 10);
        animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    } else if (animRef.current) cancelAnimationFrame(animRef.current);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, speed]);

  // Generate a decaying dose field
  const decayTime = time;
  const halfLife = 1.83; // F-18 hours
  const activity = Math.pow(0.5, decayTime / halfLife);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />Animated Dose Maps</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <Button size="sm" onClick={() => setPlaying(!playing)}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
              <Button size="sm" variant="outline" onClick={() => setTime(0)}><SkipBack className="h-4 w-4" /></Button>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${(time / 10) * 100}%` }} /></div>
              <Badge variant="outline" className="text-[10px]"><Clock className="h-2.5 w-2.5 mr-0.5" />t = {decayTime.toFixed(1)} h</Badge>
              <Badge variant="outline" className="text-[10px]">A = {(activity * 100).toFixed(1)}%</Badge>
            </div>
            {/* Animated dose grid */}
            <div className="grid grid-cols-20 gap-px bg-muted rounded overflow-hidden" style={{ gridTemplateColumns: 'repeat(20, 1fr)' }}>
              {Array.from({ length: 200 }).map((_, i) => {
                const x = (i % 20) / 20;
                const y = Math.floor(i / 20) / 10;
                const dist = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) + 0.1;
                const dose = activity / (dist * dist);
                const norm = Math.min(1, dose / 10);
                return <div key={i} className="aspect-square" style={{ backgroundColor: jet(norm) }} />;
              })}
            </div>
            <div className="flex gap-1 text-[10px]">
              <div className="flex items-center gap-0.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: jet(0) }} /><span>0</span></div>
              <div className="flex items-center gap-0.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: jet(0.25) }} /><span>Low</span></div>
              <div className="flex items-center gap-0.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: jet(0.5) }} /><span>Med</span></div>
              <div className="flex items-center gap-0.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: jet(0.75) }} /><span>High</span></div>
              <div className="flex items-center gap-0.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: jet(1) }} /><span>Max</span></div>
              <span className="text-muted-foreground ml-2">Simulating F-18 decay in PET facility over 10 hours</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
