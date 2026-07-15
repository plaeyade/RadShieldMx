/**
 * ═══════════════════════════════════════════════════════════
 * ModulePlaceholder — Dialog placeholder for modules in development
 * Shows module info instead of blank/null to provide user feedback
 * ═══════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { Construction, Clock, ArrowRight, BookOpen, Wrench, Beaker } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Module metadata for user-friendly display
const MODULE_INFO: Record<string, { title: string; category: string; description: string; eta: string; priority: string }> = {
  default: {
    title: 'Modulo en Desarrollo',
    category: 'RadShield-MX',
    description: 'Este modulo esta siendo desarrollado para la siguiente version. La funcionalidad basica (calculos de blindaje, canvas, reportes) esta completamente operativa.',
    eta: 'Proxima actualizacion',
    priority: 'planned'
  }
};

interface ModulePlaceholderProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ModulePlaceholder({ open, onOpenChange }: ModulePlaceholderProps = {}) {
  const [isOpen, setIsOpen] = useState(open ?? true);
  const handleOpen = onOpenChange ?? setIsOpen;
  const actualOpen = open ?? isOpen;

  const info = MODULE_INFO.default;

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md border-amber-200 bg-amber-50/50">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
            <Construction className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-amber-800 flex items-center justify-center gap-2">
            <Wrench className="w-4 h-4" />
            {info.title}
          </DialogTitle>
          <DialogDescription className="text-amber-700/80 text-sm">
            {info.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Status badge */}
          <div className="flex items-center gap-2 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" />
              {info.eta}
            </span>
          </div>

          {/* Available modules reminder */}
          <div className="bg-white rounded-lg border border-amber-100 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Modulos Operativos
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                'Calculos Blindaje',
                'Canvas 2D/3D',
                'AI Shielding Assistant',
                'Reportes PDF/Excel',
                'Normativas NCRP/IAEA',
                'Base Datos Vectorial',
                'Optimizador Costos',
                '5 Capas IA/ML'
              ].map((mod) => (
                <div key={mod} className="flex items-center gap-1.5 text-slate-600">
                  <Beaker className="w-3 h-3 text-emerald-500" />
                  {mod}
                </div>
              ))}
            </div>
          </div>

          {/* Feature request */}
          <p className="text-[10px] text-center text-slate-400">
            Solicita esta funcionalidad via el menu Ayuda &gt; Feedback
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
            onClick={() => handleOpen(false)}
          >
            Entendido
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
