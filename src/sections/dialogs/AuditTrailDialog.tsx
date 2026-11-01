import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Activity, Download, Clock, User, FileEdit, Trash2, LogIn, LogOut, Calculator, FileText, FileDown } from 'lucide-react';
import { trpc } from '@/providers/trpc';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; projectId: string; }

const actionConfig: Record<string, { label: string; icon: any; color: string }> = {
  create: { label: 'Crear', icon: FileEdit, color: 'bg-green-100 text-green-700' },
  update: { label: 'Actualizar', icon: FileEdit, color: 'bg-blue-100 text-blue-700' },
  delete: { label: 'Eliminar', icon: Trash2, color: 'bg-red-100 text-red-700' },
  calculate: { label: 'Calcular', icon: Calculator, color: 'bg-purple-100 text-purple-700' },
  export: { label: 'Exportar', icon: FileDown, color: 'bg-amber-100 text-amber-700' },
  generate_report: { label: 'Reporte', icon: FileText, color: 'bg-teal-100 text-teal-700' },
  login: { label: 'Login', icon: LogIn, color: 'bg-gray-100 text-gray-700' },
  logout: { label: 'Logout', icon: LogOut, color: 'bg-gray-100 text-gray-700' },
};

export default function AuditTrailDialog({ open, onOpenChange, projectId }: Props) {
  const [limit, setLimit] = useState(50);
  const { data: auditEntries, isLoading } = trpc.audit.list.useQuery(
    { projectId, limit },
    { enabled: open && !!projectId }
  );

  const exportCSV = () => {
    if (!auditEntries?.length) { toast.error('Sin registros para exportar'); return; }
    const headers = ['Fecha', 'Usuario', 'Acción', 'Campo', 'Valor Anterior', 'Valor Nuevo', 'IP'];
    const rows = auditEntries.map(e => [
      new Date(e.createdAt).toISOString(),
      e.userId,
      e.action,
      e.fieldName || '-',
      e.oldValue?.slice(0, 50) || '-',
      e.newValue?.slice(0, 50) || '-',
      e.ipAddress || '-'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_trail_${projectId}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit trail exportado a CSV');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Audit Trail — Trazabilidad CNSNS
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500">
          Registro cronológico de todas las acciones sobre el proyecto. Requerido por CNSNS para dictámenes técnicos.
        </p>
        <div className="flex items-center gap-2 mb-2">
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="w-3 h-3 mr-1" /> Exportar CSV
          </Button>
          <span className="text-xs text-gray-400">{auditEntries?.length || 0} registros</span>
        </div>
        <ScrollArea className="flex-1 border rounded-md">
          <div className="p-2 space-y-1">
            {isLoading && <div className="text-center text-gray-400 text-sm py-8">Cargando registros...</div>}
            {!isLoading && !auditEntries?.length && (
              <div className="text-center text-gray-400 text-sm py-8">
                Sin registros de auditoría.<br />Las acciones se registrarán automáticamente al guardar, calcular o exportar.
              </div>
            )}
            {auditEntries?.map((entry) => {
              const cfg = actionConfig[entry.action] || { label: entry.action, icon: Activity, color: 'bg-gray-100' };
              const Icon = cfg.icon;
              return (
                <div key={entry.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 border text-sm">
                  <div className={`mt-0.5 p-1 rounded ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{cfg.label}</Badge>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.createdAt).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />
                      {entry.userId.slice(0, 12)}...
                      {entry.ipAddress && <span className="text-gray-400">| IP: {entry.ipAddress}</span>}
                    </div>
                    {entry.fieldName && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        <span className="font-medium">{entry.fieldName}:</span>{' '}
                        {entry.oldValue && <span className="text-red-500 line-through">{entry.oldValue.slice(0, 40)}</span>}
                        {entry.oldValue && entry.newValue && <span className="mx-1">→</span>}
                        {entry.newValue && <span className="text-green-600">{entry.newValue.slice(0, 40)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
