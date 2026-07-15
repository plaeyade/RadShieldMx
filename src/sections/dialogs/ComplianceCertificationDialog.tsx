import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Shield, FileText,
  Award, Download, TrendingUp, Calendar, Clock, User, Building
} from 'lucide-react';
import { COMPLIANCE_CHECKLISTS, type ComplianceChecklist } from '@/lib/internationalRegulations';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

interface CheckItemState {
  checked: boolean;
  verifiedBy: string;
  verifiedDate: string;
  notes: string;
}

const CERTIFICATIONS = [
  { id: 'cert-cnsns', name: 'CNSNS Mexico — Authorized User License', authority: 'Comision Nacional de Seguridad Nuclear y Salvaguardias', country: 'Mexico', status: 'active',
    requirements: ['Memoria analitica completa', 'Licencia vigente', 'Programa ALARA', 'Dosimetria personal', 'Reporte anual'],
    renewalPeriod: 'Annual', lastRenewal: '2026-01-15', nextRenewal: '2027-01-15', 
    documents: ['Memoria Analitica', 'Licencia CNSNS', 'Reporte Anual 2026', 'Dosimetria Q1-Q2 2026'],
  },
  { id: 'cert-fda', name: 'FDA 510(k) — Radiation Therapy Device', authority: 'U.S. Food and Drug Administration', country: 'USA', status: 'active',
    requirements: ['Substantial equivalence', 'Performance testing', 'Radiation safety report', 'Quality system regulation'],
    renewalPeriod: '5 years', lastRenewal: '2024-03-10', nextRenewal: '2029-03-10',
    documents: ['510(k) Summary', 'Predicate Device Comparison', 'Performance Testing Report'],
  },
  { id: 'cert-ce', name: 'CE Marking — Medical Device Directive 93/42/EEC', authority: 'Notified Body (e.g., TUV SUD, BSI)', country: 'EU', status: 'active',
    requirements: ['Essential requirements met', 'Risk analysis', 'Clinical evaluation', 'Quality system audit'],
    renewalPeriod: '5 years', lastRenewal: '2023-08-22', nextRenewal: '2028-08-22',
    documents: ['Technical File', 'Declaration of Conformity', 'Clinical Evaluation Report'],
  },
  { id: 'cert-iso9001', name: 'ISO 9001:2015 — Quality Management', authority: 'ISO/Certification Body', country: 'International', status: 'active',
    requirements: ['Quality manual', 'Management review', 'Internal audit', 'Corrective actions'],
    renewalPeriod: '3 years', lastRenewal: '2025-06-01', nextRenewal: '2028-06-01',
    documents: ['Quality Manual', 'Management Review 2026', 'Internal Audit Report 2026'],
  },
  { id: 'cert-iso27001', name: 'ISO 27001:2022 — Information Security', authority: 'ISO/Certification Body', country: 'International', status: 'under_review',
    requirements: ['Risk assessment', 'Security controls', 'Incident management', 'Business continuity'],
    renewalPeriod: '3 years', lastRenewal: '2024-11-15', nextRenewal: '2027-11-15',
    documents: ['ISMS Scope', 'Risk Assessment 2026', 'Security Policy'],
  },
];

export default function ComplianceCertificationDialog({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState('checklist');
  const [selectedChecklist, setSelectedChecklist] = useState(COMPLIANCE_CHECKLISTS[0].id);
  const [itemStates, setItemStates] = useState<Record<string, CheckItemState>>(() => {
    const initial: Record<string, CheckItemState> = {};
    COMPLIANCE_CHECKLISTS.forEach(cl => cl.items.forEach(item => {
      initial[item.id] = { checked: false, verifiedBy: '', verifiedDate: '', notes: '' };
    }));
    return initial;
  });

  const currentChecklist = useMemo(() => COMPLIANCE_CHECKLISTS.find(c => c.id === selectedChecklist), [selectedChecklist]);
  
  const checklistProgress = useMemo(() => {
    if (!currentChecklist) return 0;
    const checked = currentChecklist.items.filter(item => itemStates[item.id]?.checked).length;
    return Math.round((checked / currentChecklist.items.length) * 100);
  }, [currentChecklist, itemStates]);

  const toggleItem = useCallback((itemId: string) => {
    setItemStates(prev => ({
      ...prev, [itemId]: { ...prev[itemId], checked: !prev[itemId]?.checked, verifiedDate: !prev[itemId]?.checked ? new Date().toISOString().split('T')[0] : '' }
    }));
  }, []);

  const overallProgress = useMemo(() => {
    const allItems = COMPLIANCE_CHECKLISTS.flatMap(cl => cl.items);
    const checked = allItems.filter(item => itemStates[item.id]?.checked).length;
    return Math.round((checked / allItems.length) * 100);
  }, [itemStates]);

  const exportReport = useCallback(() => {
    let report = `# Compliance & Certification Report\n`;
    report += `Generated: ${new Date().toLocaleDateString('es-MX')}\n`;
    report += `Overall Compliance: ${overallProgress}%\n\n`;
    COMPLIANCE_CHECKLISTS.forEach(cl => {
      const progress = Math.round((cl.items.filter(i => itemStates[i.id]?.checked).length / cl.items.length) * 100);
      report += `## ${cl.title} (${progress}%)\n`;
      cl.items.forEach(item => {
        report += `- [${itemStates[item.id]?.checked ? 'x' : ' '}] ${item.text} (${item.frequency})\n`;
      });
      report += '\n';
    });
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Compliance_Report_${new Date().toISOString().split('T')[0]}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Compliance report exported');
  }, [overallProgress, itemStates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="w-5 h-5 text-emerald-500" />
            Compliance & Certification
            <Badge variant="outline" className="text-[10px]">Eje 3.3</Badge>
            <Badge className="text-[10px] gap-1 bg-emerald-500">
              <TrendingUp className="w-3 h-3" />{overallProgress}% Overall
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 w-full shrink-0">
            <TabsTrigger value="checklist" className="text-xs gap-1"><ClipboardCheck className="w-3.5 h-3.5" />Checklists</TabsTrigger>
            <TabsTrigger value="certifications" className="text-xs gap-1"><Award className="w-3.5 h-3.5" />Certifications</TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" />Dashboard</TabsTrigger>
          </TabsList>

          {/* CHECKLIST TAB */}
          <TabsContent value="checklist" className="flex-1 flex flex-col min-h-0 mt-2 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <Select value={selectedChecklist} onValueChange={setSelectedChecklist}>
                <SelectTrigger className="w-80 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_CHECKLISTS.map(cl => <SelectItem key={cl.id} value={cl.id} className="text-xs">{cl.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1"><Progress value={checklistProgress} className="h-3" /></div>
              <span className="text-xs font-mono font-bold w-12 text-right">{checklistProgress}%</span>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportReport}><Download className="w-3 h-3" />Export</Button>
            </div>

            {currentChecklist && (
              <ScrollArea className="flex-1">
                <div className="space-y-1 pr-2">
                  {currentChecklist.items.map(item => {
                    const state = itemStates[item.id];
                    return (
                      <div key={item.id} className={`flex items-start gap-2 p-2 rounded border ${state?.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                        <div className="pt-0.5"><Switch checked={state?.checked || false} onCheckedChange={() => toggleItem(item.id)} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${state?.checked ? 'line-through text-muted-foreground' : 'font-medium'}`}>{item.text}</span>
                            {item.required && <Badge variant="outline" className="text-[8px] bg-red-50 text-red-700">Required</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" />{item.category}</span>
                            <span className="flex items-center gap-1"><FileText className="w-2.5 h-2.5" />{item.verificationMethod}</span>
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{item.frequency}</span>
                            {state?.checked && state?.verifiedDate && <span className="flex items-center gap-1 text-emerald-600"><Calendar className="w-2.5 h-2.5" />{state.verifiedDate}</span>}
                          </div>
                        </div>
                        {state?.checked ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* CERTIFICATIONS TAB */}
          <TabsContent value="certifications" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {CERTIFICATIONS.map(cert => {
                  const isExpiringSoon = new Date(cert.nextRenewal) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  return (
                    <Card key={cert.id} className={`border-l-4 ${cert.status === 'under_review' ? 'border-l-amber-500' : isExpiringSoon ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />{cert.name}
                            <Badge variant="outline" className="text-[9px]">{cert.country}</Badge>
                            {cert.status === 'under_review' && <Badge className="text-[9px] bg-amber-500">Under Review</Badge>}
                            {isExpiringSoon && <Badge className="text-[9px] bg-red-500">Expiring Soon</Badge>}
                          </CardTitle>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Building className="w-3 h-3" />{cert.authority}</p>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div><span className="text-muted-foreground">Renewal:</span> <strong>{cert.renewalPeriod}</strong></div>
                          <div><span className="text-muted-foreground">Last:</span> <strong>{cert.lastRenewal}</strong></div>
                          <div><span className="text-muted-foreground">Next:</span> <strong className={isExpiringSoon ? 'text-red-600' : ''}>{cert.nextRenewal}</strong></div>
                        </div>
                        <div><span className="font-semibold text-[10px]">Requirements:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cert.requirements.map(r => <Badge key={r} variant="secondary" className="text-[8px]">{r}</Badge>)}
                          </div>
                        </div>
                        <div><span className="font-semibold text-[10px]">Documents:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cert.documents.map(d => <Badge key={d} variant="outline" className="text-[8px] gap-1"><FileText className="w-2 h-2" />{d}</Badge>)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                <div className="grid grid-cols-4 gap-2">
                  <Card className="bg-emerald-50"><CardContent className="p-3 text-center"><p className="text-[10px] text-emerald-600">Overall Compliance</p><p className="text-3xl font-bold text-emerald-700">{overallProgress}%</p></CardContent></Card>
                  <Card className="bg-blue-50"><CardContent className="p-3 text-center"><p className="text-[10px] text-blue-600">Checklists</p><p className="text-3xl font-bold text-blue-700">{COMPLIANCE_CHECKLISTS.length}</p></CardContent></Card>
                  <Card className="bg-amber-50"><CardContent className="p-3 text-center"><p className="text-[10px] text-amber-600">Certifications</p><p className="text-3xl font-bold text-amber-700">{CERTIFICATIONS.length}</p></CardContent></Card>
                  <Card className="bg-violet-50"><CardContent className="p-3 text-center"><p className="text-[10px] text-violet-600">Total Items</p><p className="text-3xl font-bold text-violet-700">{COMPLIANCE_CHECKLISTS.reduce((s, c) => s + c.items.length, 0)}</p></CardContent></Card>
                </div>

                {COMPLIANCE_CHECKLISTS.map(cl => {
                  const progress = Math.round((cl.items.filter(i => itemStates[i.id]?.checked).length / cl.items.length) * 100);
                  return (
                    <Card key={cl.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium flex-1">{cl.title}</span>
                          <Progress value={progress} className="w-40 h-2" />
                          <span className="text-xs font-mono font-bold w-10 text-right">{progress}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" />Upcoming Renewals</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    {CERTIFICATIONS.filter(c => new Date(c.nextRenewal) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)).map(cert => (
                      <div key={cert.id} className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span className="font-medium">{cert.name}</span>
                        <span className="text-muted-foreground">Renews: {cert.nextRenewal}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
