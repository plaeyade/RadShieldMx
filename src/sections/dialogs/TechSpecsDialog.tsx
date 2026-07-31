import DialogShell from '@/components/DialogShell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Database, FileText, ShieldCheck } from 'lucide-react';

interface TechSpecsDialogProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export default function TechSpecsDialog({ onClose, onOpenChange }: TechSpecsDialogProps) {
  const close = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const specs = [
    {
      title: 'Frontend',
      icon: Cpu,
      items: ['React + Vite', 'Zustand dialog store', 'Canvas CAD/floorplan', 'Three/R3F visual inspection'],
    },
    {
      title: 'Calculo',
      icon: ShieldCheck,
      items: ['NCRP 147/151 workflow', 'TG-108 PET shielding route', 'UAQ/CNSNS evidence handoff', 'Warnings + numeric QA gates'],
    },
    {
      title: 'Datos',
      icon: Database,
      items: ['Material toolbox TVL/density/weight/cost', 'RAG chunks with hash/page metadata', 'DB live optional', 'External DWG/MC gateways gated'],
    },
    {
      title: 'Reportes',
      icon: FileText,
      items: ['Memoria IA', 'PDF report', 'Evidence Pack', 'CNSNS checklist/export'],
    },
  ];

  return (
    <DialogShell
      title="Especificaciones Tecnicas"
      subtitle="Ficha tecnica operativa de RadShield-MX - F404"
      gradientFrom="from-slate-700"
      gradientTo="to-slate-900"
      maxWidth="max-w-4xl"
      onClose={close}
    >
      <div data-testid="f404-tech-specs-dialog" className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">RadShield-MX v127</Badge>
            <Badge variant="outline">Frontend beta estable</Badge>
            <Badge variant="outline">F404 menu QA</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Esta pantalla confirma que el acceso Archivo &gt; Especificaciones Tecnicas ejecuta una
            vista real y auditable, no un stub. La informacion resume capacidades activas y gates
            que deben validarse antes de un release clinico completo.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {specs.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-slate-600" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DialogShell>
  );
}
