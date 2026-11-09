/**
 * AuditLogDialog — E.9: Audit log export (PDF)
 * Complete audit trail for regulatory inspection
 * NOM-008-NUCL-2018 §8, ISO 27001:2022 A.12.4
 */
import { DatosEjemploBanner } from '@/components/SyntheticResultBanner';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Download, FileText, Search, Filter, ShieldCheck } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

interface AuditEntry {
  id: string; timestamp: string; user: string; action: string;
  category: string; severity: 'info' | 'warning' | 'critical';
  details: string; version: string;
}

// Simulated audit log (in production, this would come from backend)
const DEMO_AUDIT: AuditEntry[] = [
  { id: 'a1', timestamp: '2026-06-03T09:15:00Z', user: 'physicist@hospital.mx', action: 'Project created', category: 'Project', severity: 'info', details: 'LINAC 6 MV Bunker — NCRP 151', version: 'v49' },
  { id: 'a2', timestamp: '2026-06-03T09:22:00Z', user: 'physicist@hospital.mx', action: 'Floorplan imported', category: 'Import', severity: 'info', details: 'DXF file: bunker_layout.dxf (1.2 MB)', version: 'v49' },
  { id: 'a3', timestamp: '2026-06-03T09:35:00Z', user: 'physicist@hospital.mx', action: 'Barrier added', category: 'Design', severity: 'info', details: 'Primary wall: concrete, 4.5m from isocenter', version: 'v49' },
  { id: 'a4', timestamp: '2026-06-03T09:40:00Z', user: 'physicist@hospital.mx', action: 'Source configured', category: 'Design', severity: 'info', details: 'Linac 6 MV, 35 fractions/week, 2 Gy/fraction', version: 'v49' },
  { id: 'a5', timestamp: '2026-06-03T10:05:00Z', user: 'physicist@hospital.mx', action: 'Shielding calculation', category: 'Calculation', severity: 'info', details: 'NCRP 151 method, 6 barriers, 1200 points', version: 'v49' },
  { id: 'a6', timestamp: '2026-06-03T10:05:00Z', user: 'system', action: 'WASM acceleration', category: 'Performance', severity: 'info', details: 'inverse_archer executed 6×, 12ms total', version: 'v49' },
  { id: 'a7', timestamp: '2026-06-03T10:12:00Z', user: 'physicist@hospital.mx', action: 'Barrier FAIL detected', category: 'Validation', severity: 'warning', details: 'Secondary wall S3: 0.025 mSv/week > 0.02 design goal', version: 'v49' },
  { id: 'a8', timestamp: '2026-06-03T10:15:00Z', user: 'physicist@hospital.mx', action: 'Barrier adjusted', category: 'Design', severity: 'info', details: 'S3: concrete increased 180mm → 200mm', version: 'v49' },
  { id: 'a9', timestamp: '2026-06-03T10:20:00Z', user: 'physicist@hospital.mx', action: 'Recalculation', category: 'Calculation', severity: 'info', details: 'All barriers PASS after adjustment', version: 'v49' },
  { id: 'a10', timestamp: '2026-06-03T10:30:00Z', user: 'physicist@hospital.mx', action: 'Report exported', category: 'Export', severity: 'info', details: 'PDF report generated: 12 pages', version: 'v49' },
  { id: 'a11', timestamp: '2026-06-03T11:00:00Z', user: 'reviewer@cnsns.gob.mx', action: 'Project reviewed', category: 'Review', severity: 'info', details: 'CNSNS reviewer accessed project', version: 'v49' },
  { id: 'a12', timestamp: '2026-06-03T11:05:00Z', user: 'reviewer@cnsns.gob.mx', action: 'Cross-validation NCRP147/151', category: 'Validation', severity: 'info', details: 'Discrepancy: 8.2% (ACCEPTABLE <10%)', version: 'v49' },
];

const SEVERITY_COLORS = { info: 'bg-blue-100 text-blue-700', warning: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' };

export default function AuditLogDialog({ open, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const categories = ['All', ...new Set(DEMO_AUDIT.map(a => a.category))];

  const filtered = useMemo(() => DEMO_AUDIT.filter(a => {
    const q = search.toLowerCase();
    return (a.action.toLowerCase().includes(q) || a.details.toLowerCase().includes(q) || a.user.toLowerCase().includes(q)) &&
      (catFilter === 'All' || a.category === catFilter);
  }), [search, catFilter]);

  const exportCSV = () => {
    let csv = 'ID,FechaHora,Usuario,Accion,Categoria,Severidad,Detalles,Version\n';
    filtered.forEach(a => { csv += `${a.id},${a.timestamp},${a.user},"${a.action}",${a.category},${a.severity},"${a.details}",${a.version}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Audit log exportado: ${filtered.length} entries`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Audit Log — Regulatory Inspection
            <Badge variant="outline" className="text-[10px]">E.9</Badge>
          </DialogTitle>
        </DialogHeader>
        <DatosEjemploBanner detalle="Los eventos (incluidos los usuarios con dominio institucional) son ficticios: no es un registro de inspección." />

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search audit log..." className="h-8 text-xs pl-8" />
          </div>
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="h-8 text-xs border rounded pl-7 pr-2">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Time</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">User</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Action</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Severity</th>
                <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-t hover:bg-slate-50">
                  <td className="px-2 py-1.5 text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-2 py-1.5 text-slate-600 truncate max-w-[100px]">{entry.user}</td>
                  <td className="px-2 py-1.5 font-medium text-slate-700">{entry.action}</td>
                  <td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${SEVERITY_COLORS[entry.severity]}`}>{entry.severity}</span></td>
                  <td className="px-2 py-1.5 text-slate-500 truncate max-w-[200px]">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" className="text-xs flex-1" onClick={exportCSV}>
            <Download className="w-3 h-3 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => toast.info('PDF export requires backend integration')}>
            <FileText className="w-3 h-3 mr-1" /> Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
