import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const MOCK_ALERTS: RegulatoryAlert[] = [
  { id: 'a1', title: 'CNSNS-LA-001/2018 Updated — New Shielding Requirements',
    description: 'CNSNS published an update to LA-001/2018 requiring additional neutron shielding assessment for all installations using >10 MV LINACs.',
    regulation: 'CNSNS-LA-001/2018', authority: 'CNSNS', severity: 'critical',
    date: '2026-06-01', category: 'Mexico', read: false,
    action: 'Review current shielding calculations and add neutron assessment if applicable',
  },
  { id: 'a2', title: 'ICRP 118 — Lens of Eye Dose Limit Enforcement Date',
    description: 'The 20 mSv/y lens of eye dose limit (ICRP 118) is now being actively enforced by multiple national regulators.',
    regulation: 'ICRP 118', authority: 'ICRP', severity: 'warning',
    date: '2026-05-20', category: 'International', read: false,
    action: 'Update dosimetry monitoring protocols to include lens dose assessment',
  },
  { id: 'a3', title: 'Euratom BSS 2013/59 — DRLs Update for CT Chest',
    description: 'New Diagnostic Reference Levels published for CT Chest procedures in the EU. CTDIvol: 12 mGy (median), DLP: 420 mGy·cm.',
    regulation: 'Euratom 2013/59', authority: 'European Commission', severity: 'info',
    date: '2026-05-15', category: 'EU', read: true,
    action: 'Compare local CT protocols against new DRLs',
  },
  { id: 'a4', title: 'NCRP 151 — Errata Published for Table B.4',
    description: 'Errata published correcting TVL values for lead at 6 MV FFF beams in NCRP Report No. 151 Table B.4.',
    regulation: 'NCRP 151', authority: 'NCRP', severity: 'critical',
    date: '2026-04-28', category: 'USA', read: false,
    action: 'Verify current shielding calculations use corrected TVL values',
  },
  { id: 'a5', title: 'NOM-008-ENER — Annual Compliance Deadline Approaching',
    description: 'Annual compliance report due to Secretaria de Energia by June 30, 2026.',
    regulation: 'NOM-008-ENER', authority: 'SENER', severity: 'warning',
    date: '2026-05-10', category: 'Mexico', read: false,
    action: 'Prepare and submit annual compliance report',
  },
  { id: 'a6', title: 'FDA — New Guidance on 510(k) for Radiation Shielding Devices',
    description: 'FDA issued draft guidance for 510(k) submissions for radiation shielding devices and accessories.',
    regulation: 'FDA 510(k)', authority: 'FDA', severity: 'info',
    date: '2026-04-15', category: 'USA', read: true,
  },
  { id: 'a7', title: 'ARPANSA — RPS C-1 Revision Under Consultation',
    description: 'ARPANSA is consulting on a revision to the Code of Practice for Medical Applications of Ionizing Radiation.',
    regulation: 'RPS C-1', authority: 'ARPANSA', severity: 'info',
    date: '2026-03-30', category: 'Australia', read: true,
    action: 'Submit comments by July 31, 2026',
  },
  { id: 'a8', title: 'IAEA SRS 47 — Arabic Translation Now Available',
    description: 'The IAEA Safety Report Series No. 47 is now available in Arabic.',
    regulation: 'IAEA SRS 47', authority: 'IAEA', severity: 'info',
    date: '2026-03-15', category: 'International', read: true,
  },
  { id: 'a9', title: 'CNSNS — Nueva Guia de Blindajes para Medicina Nuclear',
    description: 'CNSNS publico una nueva guia especifica para blindajes en instalaciones de medicina nuclear (PET/CT, SPECT).',
    regulation: 'CNSNS-LA-003/2026', authority: 'CNSNS', severity: 'critical',
    date: '2026-06-02', category: 'Mexico', read: false,
    action: 'Revisar y actualizar calculos de blindaje para medicina nuclear',
  },
  { id: 'a10', title: 'ISO 9001:2015 — Transition to ISO 9001:2025 Announced',
    description: 'ISO announced a new version of ISO 9001 to be published in 2025. Transition period: 3 years.',
    regulation: 'ISO 9001', authority: 'ISO', severity: 'warning',
    date: '2026-02-20', category: 'International', read: true,
    action: 'Plan transition to new standard version',
  },
];

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Warning' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Info' },
};

export default function RegulatoryAlertsDialog({ open, onOpenChange }: Props) {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
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
              <div className="text-center text-muted-foreground py-8 text-sm">No alerts match your criteria</div>
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
