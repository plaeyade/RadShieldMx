import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Mail, Send, Plus, Trash2, Clock, CheckCircle } from 'lucide-react';

type NewReportForm = {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string;
  template: 'summary' | 'full' | 'alerts-only';
};

export default function EmailNotificationsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reports, toggleReport, sendNow, updateReport, deleteReport, addReport, getEmailTemplate } = useEmailNotifications();
  const { getTotalStats } = useAnalytics();
  const [sending, setSending] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newReport, setNewReport] = useState<NewReportForm>({ name: '', frequency: 'weekly', recipients: '', template: 'summary' });

  const handleSend = async (id: string) => {
    setSending(id);
    await sendNow(id);
    setSending(null);
  };

  const handleAdd = () => {
    if (!newReport.name.trim()) return;
    addReport({
      name: newReport.name,
      frequency: newReport.frequency,
      recipients: newReport.recipients.split(',').map(r => r.trim()).filter(Boolean),
      enabled: true,
      template: newReport.template,
    });
    setNewReport({ name: '', frequency: 'weekly', recipients: '', template: 'summary' });
    setShowForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-600" />
            Notificaciones por Email
            <Badge variant="outline" className="text-[10px]">SIMULADO</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
          <p className="text-xs text-blue-800">
            <strong>Modo simulado:</strong> En produccion se conecta a SendGrid/AWS SES.
            Ahora muestra el contenido del email que se enviaria.
          </p>
        </div>

        <ScrollArea className="h-[45vh]">
          <div className="space-y-2 pr-2">
            {reports.map(report => (
              <div key={report.id} className={`border rounded-lg p-3 ${report.enabled ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={report.enabled} onCheckedChange={() => toggleReport(report.id)} />
                    <span className="text-sm font-medium text-slate-700">{report.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSend(report.id)}
                      disabled={sending === report.id}
                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition disabled:opacity-50"
                      title="Enviar ahora"
                    >
                      {sending === report.id ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Badge variant="outline">{report.frequency}</Badge>
                  <Badge variant="outline">{report.template}</Badge>
                  {report.lastSent && <span>Ultimo: {new Date(report.lastSent).toLocaleDateString()}</span>}
                  {report.recipients.length > 0 && <span>A: {report.recipients.join(', ')}</span>}
                </div>
              </div>
            ))}
          </div>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Nuevo reporte programado
            </button>
          ) : (
            <div className="mt-3 border rounded-lg p-3 space-y-2">
              <input
                type="text"
                placeholder="Nombre del reporte"
                value={newReport.name}
                onChange={e => setNewReport(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
              <div className="flex gap-2">
                <select
                  value={newReport.frequency}
                  onChange={e => setNewReport(p => ({ ...p, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                  className="px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
                <select
                  value={newReport.template}
                  onChange={e => setNewReport(p => ({ ...p, template: e.target.value as 'summary' | 'full' | 'alerts-only' }))}
                  className="px-3 py-2 text-sm border rounded-lg flex-1"
                >
                  <option value="summary">Resumen</option>
                  <option value="full">Completo</option>
                  <option value="alerts-only">Solo alertas</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Emails separados por coma"
                value={newReport.recipients}
                onChange={e => setNewReport(p => ({ ...p, recipients: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition">Guardar</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition">Cancelar</button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
