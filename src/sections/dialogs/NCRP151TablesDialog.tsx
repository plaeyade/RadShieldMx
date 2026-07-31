// =============================================================================
// NCRP151TablesDialog - Consulta interactiva de tablas NCRP 151.
// F398 migra el fullscreen legacy a FullscreenShell controlado.
// =============================================================================
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import FullscreenShell from '@/components/FullscreenShell';
import { Search, BookOpen, Table, Info } from 'lucide-react';
import { ALL_NCRP151_TABLES, searchTables, type NCRPTable } from '@/lib/ncrp151Tables';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function NCRP151TablesDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return <TablesContent onOpenChange={onOpenChange} />;
}

function TablesContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<NCRPTable | null>(null);
  const filtered = useMemo(() => search ? searchTables(search) : ALL_NCRP151_TABLES, [search]);

  return (
    <FullscreenShell
      title="Tablas NCRP 151 - Referencia Rapida"
      subtitle={`${ALL_NCRP151_TABLES.length} tablas interactivas - busqueda en tiempo real - F398`}
      icon={<BookOpen className="h-5 w-5" />}
      accentClassName="bg-indigo-600"
      traceId="f398-ncrp151-tables-fullscreen-shell"
      onClose={() => onOpenChange(false)}
      toolbar={<div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar tabla o valor..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72 pl-9" /></div>}
    >
      <div className="flex h-full overflow-hidden">
        <div className="flex w-80 flex-col border-r bg-slate-50">
          <div className="border-b p-3 text-xs font-semibold uppercase text-slate-500">{filtered.length} tablas encontradas</div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {filtered.map((t) => (
                <button key={t.id} onClick={() => setSelectedTable(t)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedTable?.id === t.id ? 'border-indigo-300 bg-indigo-100' : 'border-transparent hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <Table className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold">Tabla {t.id}</span>
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium">{t.title.replace(`Tabla ${t.id} - `, '').replace(`Tabla ${t.id} — `, '')}</div>
                  <div className="truncate text-xs text-slate-500">{t.section}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {selectedTable ? <TableView table={selectedTable} /> : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <div className="text-center">
                <BookOpen className="mx-auto mb-3 h-16 w-16 opacity-30" />
                <p className="text-sm font-medium">Seleccione una tabla del panel izquierdo</p>
                <p className="mt-1 text-xs">O use la busqueda para encontrar valores especificos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </FullscreenShell>
  );
}

function TableView({ table }: { table: NCRPTable }) {
  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">Tabla {table.id}</Badge>
          <span className="text-xs text-slate-500">{table.section}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">{table.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{table.description}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-100">
                  {table.columns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(table.rows).map((row, i) => (
                  <tr key={i} className="border-b transition-colors hover:bg-slate-50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2.5 font-mono text-xs">{typeof cell === 'number' ? (cell < 0.01 ? cell.toExponential(2) : cell.toFixed(2)) : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {table.notes && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Notas y referencias</span>
          </div>
          <ul className="space-y-1">
            {table.notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-700"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
