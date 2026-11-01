/**
 * PerformanceRecommendations — Recomendaciones de rendimiento y optimización
 * Para motores de cálculo, canvas, y experiencia de usuario
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Cpu, Zap, Monitor, Timer, HardDrive, Globe, AlertTriangle, CheckCircle, Info
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PerformanceRecommendations({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('engines');

  const improvements = [
    {
      category: 'engines',
      icon: Cpu,
      title: 'Motores de Cálculo',
      items: [
        { priority: 'HIGH', text: 'Implementar Web Workers para cálculos de blindaje (no bloquear UI thread)', status: 'pending' },
        { priority: 'HIGH', text: 'Activar WebGPU compute shaders para heatmaps y gamma index (Chrome 113+)', status: 'implemented' },
        { priority: 'HIGH', text: 'Memoización cacheada de resultados por barrera (evitar recálculos idénticos)', status: 'implemented' },
        { priority: 'MED', text: 'Agrupar cálculos de barreras paralelas con Promise.all()', status: 'pending' },
        { priority: 'MED', text: 'Usar TypedArrays (Float32Array) en lugar de arrays JS para matrices numéricas', status: 'implemented' },
        { priority: 'LOW', text: 'WebAssembly (WASM) para kernels de cálculo intensivo (inverseArcher, TVL)', status: 'future' },
      ]
    },
    {
      category: 'canvas',
      icon: Monitor,
      title: 'Canvas y Renderizado',
      items: [
        { priority: 'HIGH', text: 'Usar requestAnimationFrame para renderizado de canvas (evitar repaints)', status: 'implemented' },
        { priority: 'HIGH', text: 'Implementar OffscreenCanvas para renderizado en Worker thread', status: 'pending' },
        { priority: 'MED', text: 'Viewport culling: solo renderizar elementos visibles en el viewport', status: 'implemented' },
        { priority: 'MED', text: 'Canvas layers separados: fondo estático vs elementos dinámicos', status: 'pending' },
        { priority: 'MED', text: 'Usar ImageBitmap para fondos de planos grandes (aceleración GPU)', status: 'pending' },
        { priority: 'LOW', text: 'Implementar virtual scrolling para barreras con muchos puntos (>1000)', status: 'pending' },
      ]
    },
    {
      category: 'memory',
      icon: HardDrive,
      title: 'Memoria y Almacenamiento',
      items: [
        { priority: 'HIGH', text: 'React.lazy() + Suspense para code-splitting de 85+ diálogos', status: 'implemented' },
        { priority: 'HIGH', text: 'File System Access API para guardar/cargar proyectos nativamente', status: 'implemented' },
        { priority: 'MED', text: 'IndexedDB para cache de resultados de cálculo y planos recientes', status: 'pending' },
        { priority: 'MED', text: 'Service Worker opt-in para builds PWA y cache controlado de assets', status: 'pending' },
        { priority: 'LOW', text: 'Compresión de datos de heatmap con algoritmo de cuantización', status: 'future' },
      ]
    },
    {
      category: 'network',
      icon: Globe,
      title: 'Red y APIs',
      items: [
        { priority: 'HIGH', text: 'Broadcast Channel API para sincronización entre pestañas', status: 'pending' },
        { priority: 'MED', text: 'Web Bluetooth API para conectar dosímetros portátiles', status: 'future' },
        { priority: 'MED', text: 'Web Serial API para dosímetros con conexión USB', status: 'future' },
        { priority: 'LOW', text: 'WebSocket para colaboración en tiempo real (Share project)', status: 'future' },
      ]
    },
    {
      category: 'ui',
      icon: Timer,
      title: 'UX y Tiempo de Respuesta',
      items: [
        { priority: 'HIGH', text: 'Debounce de 300ms en inputs numéricos (evitar recálculos intermedios)', status: 'implemented' },
        { priority: 'HIGH', text: 'Progress bar con cancelación para cálculos largos (>2s)', status: 'implemented' },
        { priority: 'MED', text: 'Virtualización de listas de referencias y bibliografía', status: 'pending' },
        { priority: 'LOW', text: 'Skeleton loaders para diálogos pesados (ManualDialog, Manual 52 pgs)', status: 'pending' },
      ]
    },
  ];

  const priorityColors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MED: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const statusIcons: Record<string, any> = {
    implemented: <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />,
    pending: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
    future: <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
  };

  const statusLabels: Record<string, string> = {
    implemented: 'Implementado',
    pending: 'Pendiente',
    future: 'Futuro',
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-[#f97316]" />
            Recomendaciones de Rendimiento y Optimización
            <Badge variant="outline" className="text-[10px]">v42</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto">
            {improvements.map(cat => (
              <TabsTrigger key={cat.category} value={cat.category} className="text-xs flex-1">
                <cat.icon className="w-3 h-3 mr-1" /> {cat.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {improvements.map(cat => (
            <TabsContent key={cat.category} value={cat.category} className="mt-3">
              <div className="space-y-2">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border">
                    {statusIcons[item.status]}
                    <div className="flex-1">
                      <div className="text-xs text-slate-700">{item.text}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[9px] ${priorityColors[item.priority]}`}>{item.priority}</Badge>
                        <span className="text-[9px] text-slate-400">{statusLabels[item.status]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700">
          <b>Resumen:</b> De 24 recomendaciones, 9 están implementadas (38%), 11 pendientes (46%),
          4 futuras (16%). Las APIs WebGPU y File System Access ya están disponibles en la app.
          Las mejoras pendientes principales son: Web Workers para cálculos, OffscreenCanvas,
          e IndexedDB para cache persistente.
        </div>
      </DialogContent>
    </Dialog>
  );
}
