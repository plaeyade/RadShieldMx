// =============================================================================
// NCRP151TablesDialog — Consulta interactiva de tablas NCRP 151 (v14.2)
// =============================================================================
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X, BookOpen, Table, Info } from 'lucide-react';
import { ALL_NCRP151_TABLES, searchTables, type NCRPTable } from '@/lib/ncrp151Tables';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function NCRP151TablesDialog({ open, onOpenChange }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      <TablesContent onOpenChange={onOpenChange} />
    </div>
  );
}

function TablesContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<NCRPTable | null>(null);

  const filtered = useMemo(() => search ? searchTables(search) : ALL_NCRP151_TABLES, [search]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg"><BookOpen className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Tablas NCRP 151 — Referencia Rápida</h1>
            <p className="text-xs text-slate-500">{ALL_NCRP151_TABLES.length} tablas interactivas — Búsqueda en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar tabla o valor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-72" />
          </div>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Lista de tablas */}
        <div className="w-80 border-r bg-slate-50 flex flex-col">
          <div className="p-3 border-b text-xs font-semibold text-slate-500 uppercase">{filtered.length} tablas encontradas</div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filtered.map(t => (
                <button key={t.id} onClick={() => setSelectedTable(t)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTable?.id === t.id ? 'bg-indigo-100 border border-indigo-300' : 'hover:bg-slate-100 border border-transparent'}`}>
                  <div className="flex items-center gap-2">
                    <Table className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold">Tabla {t.id}</span>
                  </div>
                  <div className="text-sm font-medium mt-0.5 truncate">{t.title.replace('Tabla ' + t.id + ' — ', '')}</div>
                  <div className="text-xs text-slate-500 truncate">{t.section}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main: Tabla seleccionada */}
        <div className="flex-1 overflow-auto p-6">
          {selectedTable ? <TableView table={selectedTable} /> : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Seleccione una tabla del panel izquierdo</p>
                <p className="text-xs mt-1">O use la búsqueda para encontrar valores específicos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TableView({ table }: { table: NCRPTable }) {
  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-mono">Tabla {table.id}</Badge>
          <span className="text-xs text-slate-500">{table.section}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">{table.title}</h2>
        <p className="text-sm text-slate-600 mt-1">{table.description}</p>
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b">
                  {table.columns.map((col, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(table.rows).map((row, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2.5 font-mono text-xs">{typeof cell === 'number' ? cell.toExponential ? (cell < 0.01 ? cell.toExponential(2) : cell.toFixed(2)) : cell : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {table.notes && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Notas y referencias</span>
          </div>
          <ul className="space-y-1">
            {table.notes.map((note, i) => (
              <li key={i} className="text-xs text-blue-700 flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full bg-blue-400 shrink-0" />{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
