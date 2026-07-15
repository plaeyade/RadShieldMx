import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BarChart3, Trash2, Activity, Calendar, AlertTriangle } from 'lucide-react';

export default function AnalyticsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    getTotalStats, getTopDialogs, isEnabled, toggleEnabled, clearAnalytics,
  } = useAnalytics();
  const stats = getTotalStats();
  const topDialogs = getTopDialogs();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Analytics Dashboard
            <Badge variant="outline" className="ml-2 text-[10px]">LOCAL</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm text-slate-600">Recopilacion de analytics</span>
          <Switch checked={isEnabled} onCheckedChange={toggleEnabled} />
        </div>

        {!isEnabled ? (
          <div className="py-8 text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Analytics desactivado. Active la recopilacion para ver metricas.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="text-xs">Resumen</TabsTrigger>
              <TabsTrigger value="dialogs" className="text-xs">Dialogos</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <ScrollArea className="h-[45vh]">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatCard icon={Activity} label="Calculos" value={stats.totalCalculations} color="text-blue-500" />
                  <StatCard icon={Calendar} label="Exportes" value={stats.totalExports} color="text-emerald-500" />
                  <StatCard icon={AlertTriangle} label="Errores" value={stats.totalErrors} color="text-red-500" />
                  <StatCard icon={BarChart3} label="Eventos" value={stats.totalEvents} color="text-violet-500" />
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p><strong>Primera sesion:</strong> {stats.firstSession}</p>
                  <p><strong>Ultima sesion:</strong> {stats.lastSession}</p>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dialogs">
              <ScrollArea className="h-[45vh]">
                {topDialogs.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Sin datos aun</p>
                ) : (
                  <div className="space-y-2">
                    {topDialogs.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="text-xs font-mono w-6 text-slate-400">#{i + 1}</span>
                        <span className="text-xs text-slate-700 flex-1">{d.name}</span>
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, (d.count / (topDialogs[0]?.count || 1)) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4 py-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Privacidad:</strong> Los datos se almacenan localmente en su navegador.
                    No se envian a ningun servidor externo.
                  </p>
                </div>
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Borrar todos los datos
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { clearAnalytics(); setConfirmClear(false); }}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                    >
                      Confirmar borrado
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Activity; label: string; value: number; color: string }) {
  return (
    <div className="border rounded-lg p-3 bg-slate-50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
