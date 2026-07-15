import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Globe, Search, BookOpen, Shield, MapPin, Calendar, FileText,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import {
  REGULATIONS, REGULATORY_REGIONS, searchRegulations,
  type Regulation
} from '@/lib/internationalRegulations';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const CATEGORY_LABELS: Record<string, string> = {
  safety_standard: 'Safety Standard', guideline: 'Guideline', regulatory_guide: 'Regulatory Guide',
  legal_act: 'Legal Act', code_of_practice: 'Code of Practice', technical_report: 'Technical Report',
};
const CATEGORY_COLORS: Record<string, string> = {
  safety_standard: 'bg-blue-100 text-blue-800', guideline: 'bg-emerald-100 text-emerald-800',
  regulatory_guide: 'bg-amber-100 text-amber-800', legal_act: 'bg-red-100 text-red-800',
  code_of_practice: 'bg-violet-100 text-violet-800', technical_report: 'bg-slate-100 text-slate-800',
};

function RegulationCard({ reg, expanded, onToggle }: { reg: Regulation; expanded: boolean; onToggle: () => void }) {
  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[9px] ${CATEGORY_COLORS[reg.category] || ''}`}>{CATEGORY_LABELS[reg.category]}</Badge>
              <Badge variant="outline" className="text-[9px]">{reg.status}</Badge>
              <Badge variant="outline" className="text-[9px]">{reg.applicability}</Badge>
            </div>
            <CardTitle className="text-sm mt-1">{reg.code}: {reg.title}</CardTitle>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{reg.authority}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{reg.country}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{reg.year}</span>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-3 text-xs">
          <p className="text-muted-foreground">{reg.summary}</p>
          {reg.doseLimits_mSv_yr && (
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(reg.doseLimits_mSv_yr).map(([key, val]) => (
                <div key={key} className="bg-muted/50 rounded p-2 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                  <p className="font-bold font-mono">{val} <span className="text-[9px] font-normal">mSv/y</span></p>
                </div>
              ))}
            </div>
          )}
          <div>
            <p className="font-semibold text-[10px] mb-1">Key Requirements:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
              {reg.keyRequirements.map((kr, i) => <li key={i}>{kr}</li>)}
            </ul>
          </div>
          {reg.shieldingRequirements && (
            <div>
              <p className="font-semibold text-[10px] mb-1 flex items-center gap-1"><Shield className="w-3 h-3" />Shielding Requirements:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                {reg.shieldingRequirements.map((sr, i) => <li key={i}>{sr}</li>)}
              </ul>
            </div>
          )}
          {reg.scope.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reg.scope.map(s => <Badge key={s} variant="secondary" className="text-[8px]">{s.replace(/_/g, ' ')}</Badge>)}
            </div>
          )}
          {reg.relatedRegulations.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-semibold">Related:</span> {reg.relatedRegulations.join(', ')}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function InternationalRegulationsDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => searchRegulations(query, {
    region: region === 'all' ? undefined : region, category: category === 'all' ? undefined : category, status: status === 'all' ? undefined : status,
  }), [query, region, category, status]);

  const stats = useMemo(() => ({
    total: REGULATIONS.length, active: REGULATIONS.filter(r => r.status === 'active').length,
    superseded: REGULATIONS.filter(r => r.status === 'superseded').length,
    underReview: REGULATIONS.filter(r => r.status === 'under_review').length,
    international: REGULATIONS.filter(r => r.applicability === 'international').length,
    regions: new Set(REGULATIONS.map(r => r.region)).size,
  }), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Globe className="w-5 h-5 text-blue-500" />
            International Regulations Database
            <Badge variant="outline" className="text-[10px]">Eje 3.1</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2 shrink-0 mb-2">
          {[{ label: 'Total', value: stats.total, color: 'text-blue-600' }, { label: 'Active', value: stats.active, color: 'text-emerald-600' },
            { label: 'Superseded', value: stats.superseded, color: 'text-amber-600' }, { label: 'Under Review', value: stats.underReview, color: 'text-red-600' },
            { label: 'Regions', value: stats.regions, color: 'text-violet-600' }].map(s => (
            <Card key={s.label} className="bg-muted/30"><CardContent className="p-2 text-center"><p className="text-[9px] text-muted-foreground">{s.label}</p><p className={`text-lg font-bold ${s.color}`}>{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 mb-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search regulations by title, code, authority, or content..." value={query} onChange={e => setQuery(e.target.value)}
              className="pl-8 h-8 text-xs" />
          </div>
          <Select value={region} onValueChange={setRegion}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>{[['all','All Regions'], ...[...new Set(REGULATIONS.map(r => r.region))].map(r => [r,r])].map(([v,l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{[['all','All'], ...[...new Set(REGULATIONS.map(r => r.category))].map(c => [c,CATEGORY_LABELS[c]||c])].map(([v,l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{[['all','All Status'], ...[...new Set(REGULATIONS.map(r => r.status))].map(s => [s,s])].map(([v,l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2">
            {filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">No regulations found matching your criteria</div>
            ) : (
              filtered.map(reg => (
                <RegulationCard key={reg.id} reg={reg} expanded={expandedId === reg.id} onToggle={() => setExpandedId(expandedId === reg.id ? null : reg.id)} />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
