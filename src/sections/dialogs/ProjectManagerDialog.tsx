// =============================================================================
// ProjectManagerDialog.tsx — v90: Cloud + Local project management
// =============================================================================
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderOpen, Trash2, Download, Upload, Cloud, HardDrive,
  Search, FileJson, Save, RefreshCw,
} from 'lucide-react';

interface LocalProject {
  id: string;
  name: string;
  updatedAt: string;
  floorPlan?: { sources?: unknown[]; barriers?: unknown[]; name?: string };
}

interface CloudProject {
  id: number;
  name: string;
  modality: string | null;
  numSources: string | null;
  numBarriers: string | null;
  maxKerma: string | null;
  updatedAt: Date;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: LocalProject[];
  cloudProjects: CloudProject[];
  currentProjectName: string;
  onSave: (name: string) => void;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onRename: (id: string, name: string) => void;
  onExport: (projectId: string) => void;
  onImport: () => void;
  isLoggedIn: boolean;
  isLoadingCloud?: boolean;
}

export default function ProjectManagerDialog({
  open, onOpenChange, projects, cloudProjects, currentProjectName,
  onSave, onLoad, onDelete, onRename, onExport, onImport, isLoggedIn, isLoadingCloud = false,
}: Props) {
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [activeTab, setActiveTab] = useState('local');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredLocal = useMemo(() =>
    projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [projects, search]
  );

  const filteredCloud = useMemo(() =>
    cloudProjects.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [cloudProjects, search]
  );

  const handleQuickSave = () => {
    const name = newName.trim() || currentProjectName || `Proyecto ${new Date().toLocaleDateString()}`;
    onSave(name);
    setNewName('');
  };

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const confirmRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-orange-500" />
            Administrador de Proyectos
            {currentProjectName && (
              <Badge variant="outline" className="ml-2 text-xs">{currentProjectName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Quick Save */}
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Nombre del proyecto..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickSave()}
            className="flex-1"
          />
          <Button onClick={handleQuickSave} className="bg-orange-500 hover:bg-orange-600">
            <Save className="w-4 h-4 mr-1" /> Guardar
          </Button>
          <Button variant="outline" onClick={onImport}>
            <Upload className="w-4 h-4 mr-1" /> Importar
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar proyectos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local" className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" /> Local ({filteredLocal.length})
            </TabsTrigger>
            <TabsTrigger value="cloud" className="flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" /> Nube ({filteredCloud.length})
              {!isLoggedIn && <Badge variant="secondary" className="text-[9px] ml-1">Login</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Local Projects */}
          <TabsContent value="local" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[400px]">
              {filteredLocal.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <HardDrive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay proyectos locales</p>
                  <p className="text-xs mt-1">Guarde un proyecto o importe uno</p>
                </div>
              ) : (
                <div className="space-y-1.5 pr-2">
                  {filteredLocal.map(proj => (
                    <div
                      key={proj.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <FileJson className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingId === proj.id ? (
                          <div className="flex gap-1">
                            <Input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null); }}
                              autoFocus
                              className="h-7 text-sm"
                            />
                            <Button size="sm" className="h-7 px-2" onClick={confirmRename}>OK</Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate">{proj.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(proj.updatedAt).toLocaleString()} ·
                              {proj.floorPlan?.sources?.length ?? 0} fuentes ·
                              {proj.floorPlan?.barriers?.length ?? 0} barreras
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onLoad(proj.id)} title="Cargar">
                          <FolderOpen className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startRename(proj.id, proj.name)} title="Renombrar">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onExport(proj.id)} title="Exportar JSON">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => { if (confirm('Eliminar proyecto?')) onDelete(proj.id); }} title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Cloud Projects */}
          <TabsContent value="cloud" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[400px]">
              {!isLoggedIn ? (
                <div className="text-center text-slate-400 py-12">
                  <Cloud className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Inicie sesion para sincronizar proyectos en la nube</p>
                  <p className="text-xs mt-1">Los proyectos se guardan automaticamente en la nube cuando esta autenticado</p>
                </div>
              ) : isLoadingCloud ? (
                <div className="text-center text-slate-400 py-12">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Cargando proyectos de la nube...</p>
                </div>
              ) : filteredCloud.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <Cloud className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay proyectos en la nube</p>
                  <p className="text-xs mt-1">Guarde un proyecto para sincronizarlo</p>
                </div>
              ) : (
                <div className="space-y-1.5 pr-2">
                  {filteredCloud.map(proj => (
                    <div
                      key={proj.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <Cloud className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{proj.name}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          {proj.modality && <Badge variant="outline" className="text-[9px]">{proj.modality}</Badge>}
                          <span className="text-[10px] text-slate-400">
                            {proj.numSources} fuentes · {proj.numBarriers} barreras · Kerma: {proj.maxKerma} mSv/sem
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onLoad(String(proj.id))} title="Cargar">
                          <FolderOpen className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => { if (confirm('Eliminar de la nube?')) onDelete(String(proj.id)); }} title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
