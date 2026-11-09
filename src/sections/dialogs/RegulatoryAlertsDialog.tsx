import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, AlertTriangle, Info, Calendar, Globe, BookOpen, Clock } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface RegulatoryAlert {
  id: string; title: string; description: string; regulation: string;
  authority: string; severity: 'critical' | 'warning' | 'info';
  date: string; category: string; read: boolean;
  action?: string;
}

// Fase 8b: antes había 12 alertas inventadas presentadas como publicadas (p. ej. «CNSNS-LA-003/2026», una
// «actualización de LA-001/2018» marcada como crítica). La aplicación no tiene una fuente oficial de alertas: la lista
// queda vacía y el diálogo lo dice, en lugar de mostrar normativa ficticia.
const ALERTAS_REGISTRADAS: RegulatoryAlert[] = [];

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Warning' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Info' },
};

export default function RegulatoryAlertsDialog({ open, onOpenChange }: Props) {
  const [alerts, setAlerts] = useState(ALERTAS_REGISTRADAS);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity] = useState('');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const filtered = useMemo(() => alerts.filter(a => {
    const matchCat = !filterCategory || a.category === filterCategory;
    const matchSev = !filterSeverity || a.severity === filterSeverity;
    const matchUnread = !showOnlyUnread || !a.read;
    return matchCat && matchSev && matchUnread;
  }), [alerts, filterCategory, filterSeverity, showOnlyUnread]);

  const stats = useMemo(() => ({
    total: alerts.length, unread: alerts.filter(a => !a.read).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
  }), [alerts]);

  const markRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[900px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-red-500" />
            Regulatory Update Alerts
            <Badge variant="outline" className="text-[10px]">Eje 3.4</Badge>
            {stats.unread > 0 && <Badge className="text-[10px] bg-red-500 gap-1"><Bell className="w-2.5 h-2.5" />{stats.unread} new</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 shrink-0 mb-2">
          <Card className="bg-red-50"><CardContent className="p-2 text-center"><p className="text-[10px] text-red-600">Critical</p><p className="text-xl font-bold text-red-700">{stats.critical}</p></CardContent></Card>
          <Card className="bg-amber-50"><CardContent className="p-2 text-center"><p className="text-[10px] text-amber-600">Warning</p><p className="text-xl font-bold text-amber-700">{stats.warning}</p></CardContent></Card>
          <Card className="bg-blue-50"><CardContent className="p-2 text-center"><p className="text-[10px] text-blue-600">Total</p><p className="text-xl font-bold text-blue-700">{stats.total}</p></CardContent></Card>
          <Card className="bg-violet-50"><CardContent className="p-2 text-center"><p className="text-[10px] text-violet-600">Unread</p><p className="text-xl font-bold text-violet-700">{stats.unread}</p></CardContent></Card>
        </div>

        <div className="flex items-center gap-2 shrink-0 mb-2">
          <div className="flex items-center gap-2">
            <Switch checked={showOnlyUnread} onCheckedChange={setShowOnlyUnread} id="unread" />
            <Label htmlFor="unread" className="text-xs cursor-pointer">Unread only</Label>
          </div>
          <div className="flex gap-1">
            {['', ...new Set(alerts.map(a => a.category))].map(cat => (
              <Badge key={cat} variant={filterCategory === cat ? 'default' : 'outline'} className="text-[9px] cursor-pointer" onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}>
                {cat || 'All'}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm" data-testid="alertas-vacio">{alerts.length === 0 ? "No hay alertas regulatorias registradas. Consulte el Diario Oficial de la Federación y el sitio de la CNSNS para la normativa vigente." : "Ninguna alerta coincide con los filtros."}</div>
            ) : (
              filtered.map(alert => {
                const sev = SEVERITY_CONFIG[alert.severity];
                const Icon = sev.icon;
                return (
                  <Card key={alert.id} className={`border-l-4 ${sev.bg} ${!alert.read ? 'border-l-red-500' : 'border-l-slate-300'}`}>
                    <CardHeader className="pb-2 cursor-pointer" onClick={() => markRead(alert.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${sev.color}`} />
                            <span className="text-sm font-medium">{alert.title}</span>
                            <Badge className={`text-[8px] ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}>{sev.label}</Badge>
                            {!alert.read && <Badge className="text-[8px] bg-violet-500">New</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{alert.category}</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" />{alert.regulation}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{alert.date}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      {alert.action && (
                        <div className="mt-2 p-2 bg-white/50 rounded text-[10px] flex items-start gap-2">
                          <Clock className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>Action required:</strong> {alert.action}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
