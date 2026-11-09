/**
 * CompareScenariosDialog - UI-01: comparacion side-by-side de escenarios.
 * F389 migra el dialog legacy a DialogShell para convivir con el canvas.
 * Fase 9: compara escenarios guardados del proyecto contra el plano actual (`ComparadorEscenarios`); antes eran dos
 * escenarios fijos con dosis y costos de demostración.
 */
import { GitCompare } from 'lucide-react';
import DialogShell from '@/components/DialogShell';
import { GestorEscenarios, SelectorEscenario, TablaComparacion } from '@/components/ComparadorEscenarios';
import { useComparacion } from '@/hooks/useComparacionEscenarios';
import { comparacionCSV } from '@/lib/estadoProyecto';

export default function CompareScenariosDialog({ onClose }: { onClose: () => void }) {
  const { escenarios, idA, setIdA, idB, setIdB, comparacion, nombreA, nombreB } = useComparacion();

  const exportCSV = () => {
    if (!comparacion) return;
    const blob = new Blob([comparacionCSV(comparacion, nombreA, nombreB)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compare_Scenarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DialogShell
      title="Comparacion de Escenarios"
      subtitle="Escenarios guardados del proyecto contra el plano actual - F389"
      gradientFrom="from-violet-600"
      gradientTo="to-purple-700"
      maxWidth="max-w-4xl"
      onClose={onClose}
      footer={(
        <>
          <span className="text-xs text-slate-500">Escenarios de esta sesión; guarde el proyecto para conservarlos</span>
          <button onClick={exportCSV} disabled={!comparacion} className="flex items-center gap-1.5 rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">Exportar CSV</button>
        </>
      )}
    >
      <div data-testid="f389-compare-scenarios-dialogshell" className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-violet-900">
          <GitCompare className="h-5 w-5" />
          <div>
            <h2 id="compare-title" className="text-sm font-bold">Comparacion de Escenarios</h2>
            <p className="text-xs text-violet-700">Ventana movible para comparar sin perder de vista el canvas.</p>
          </div>
        </div>

        <GestorEscenarios />

        {escenarios.length > 0 && (
          <div className="flex flex-wrap items-center gap-4">
            <SelectorEscenario etiqueta="A" valor={idA} onCambio={setIdA} incluirActual={false} />
            <SelectorEscenario etiqueta="B" valor={idB} onCambio={setIdB} incluirActual />
          </div>
        )}
        {comparacion && <TablaComparacion c={comparacion} nombreA={nombreA} nombreB={nombreB} />}
      </div>
    </DialogShell>
  );
}
