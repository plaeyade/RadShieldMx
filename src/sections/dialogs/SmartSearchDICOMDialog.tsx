import { DatosEjemploBanner } from '@/components/SyntheticResultBanner';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, FileImage, User, Calendar, Hash, Scan, Database, Filter } from 'lucide-react';

interface DICOMStudy {
  id: string;
  patientName: string;
  mrn: string;
  studyDate: string;
  modality: string;
  description: string;
  numSeries: number;
  numImages: number;
  institution: string;
  fileSize: string;
  isImported: boolean;
}

const MOCK_STUDIES: DICOMStudy[] = [
  { id: 'D001', patientName: 'DEMO^PACIENTE 01', mrn: 'DEMO-0001', studyDate: '2026-05-28', modality: 'CT', description: 'CT Torax c/contraste - Planificacion RT', numSeries: 4, numImages: 248, institution: 'Institución demo', fileSize: '156 MB', isImported: true },
  { id: 'D002', patientName: 'DEMO^PACIENTE 02', mrn: 'DEMO-0002', studyDate: '2026-05-27', modality: 'CT', description: 'CT Pelvis - Braquiterapia HDR', numSeries: 3, numImages: 186, institution: 'Institución demo', fileSize: '98 MB', isImported: true },
  { id: 'D003', patientName: 'DEMO^PACIENTE 03', mrn: 'DEMO-0003', studyDate: '2026-05-26', modality: 'PET-CT', description: 'PET-CT FDG Oncologico - Dosis I-131', numSeries: 6, numImages: 412, institution: 'Institución demo', fileSize: '312 MB', isImported: false },
  { id: 'D004', patientName: 'DEMO^PACIENTE 04', mrn: 'DEMO-0004', studyDate: '2026-05-25', modality: 'CT', description: 'CT Craneo - Gamma Knife Perfexion', numSeries: 3, numImages: 164, institution: 'Institución demo', fileSize: '87 MB', isImported: false },
  { id: 'D005', patientName: 'DEMO^PACIENTE 05', mrn: 'DEMO-0005', studyDate: '2026-05-24', modality: 'MR', description: 'MR Prostata - Planificacion VMAT', numSeries: 5, numImages: 320, institution: 'Institución demo', fileSize: '198 MB', isImported: true },
  { id: 'D006', patientName: 'DEMO^PACIENTE 06', mrn: 'DEMO-0006', studyDate: '2026-05-23', modality: 'CT', description: 'CT Simulacion - LINAC 6MV', numSeries: 2, numImages: 128, institution: 'Institución demo', fileSize: '76 MB', isImported: false },
  { id: 'D007', patientName: 'DEMO^PACIENTE 07', mrn: 'DEMO-0007', studyDate: '2026-05-22', modality: 'PET-CT', description: 'PET-CT Ga-68 DOTATATE - Terapia Lu-177', numSeries: 7, numImages: 534, institution: 'Institución demo', fileSize: '445 MB', isImported: true },
  { id: 'D008', patientName: 'DEMO^PACIENTE 08', mrn: 'DEMO-0008', studyDate: '2026-05-21', modality: 'CT', description: 'CT Torax/Abdomen - Verificacion blindaje', numSeries: 4, numImages: 286, institution: 'Institución demo', fileSize: '178 MB', isImported: false },
  { id: 'D009', patientName: 'DEMO^PACIENTE 09', mrn: 'DEMO-0009', studyDate: '2026-05-20', modality: 'CT', description: 'CT Cervical - Planificacion SRS', numSeries: 3, numImages: 192, institution: 'Institución demo', fileSize: '112 MB', isImported: false },
  { id: 'D010', patientName: 'DEMO^PACIENTE 10', mrn: 'DEMO-0010', studyDate: '2026-05-19', modality: 'PET-CT', description: 'PET-CT FDG - Dosimetria post Lu-177', numSeries: 5, numImages: 368, institution: 'Institución demo', fileSize: '289 MB', isImported: true },
];

interface SmartSearchDICOMDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectStudy?: (study: DICOMStudy) => void;
}

export default function SmartSearchDICOMDialog({ open, onOpenChange, onSelectStudy }: SmartSearchDICOMDialogProps) {
  const [search, setSearch] = useState('');
  const [filterModality, setFilterModality] = useState<string>('ALL');

  const modalities = useMemo(() => {
    const mods = new Set(MOCK_STUDIES.map(s => s.modality));
    return ['ALL', ...Array.from(mods)];
  }, []);

  const filteredStudies = useMemo(() => {
    return MOCK_STUDIES.filter(study => {
      const matchesModality = filterModality === 'ALL' || study.modality === filterModality;
      if (!search.trim()) return matchesModality;
      const q = search.toLowerCase();
      return matchesModality && (
        study.patientName.toLowerCase().includes(q) ||
        study.mrn.toLowerCase().includes(q) ||
        study.description.toLowerCase().includes(q) ||
        study.modality.toLowerCase().includes(q) ||
        study.studyDate.includes(q)
      );
    });
  }, [search, filterModality]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">{part}</mark>
        : part
    );
  };

  const modalityColors: Record<string, string> = {
    CT: 'bg-blue-100 text-blue-700 border-blue-300',
    MR: 'bg-purple-100 text-purple-700 border-purple-300',
    'PET-CT': 'bg-amber-100 text-amber-700 border-amber-300',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Scan className="w-5 h-5 text-blue-500" />
            SmartSearch DICOM
            <Badge variant="outline" className="text-[10px] ml-2">{filteredStudies.length} estudios</Badge>
          </DialogTitle>
        </DialogHeader>
        <DatosEjemploBanner detalle="Los pacientes y estudios son de demostración y están anonimizados." />

        <div className="px-6 pb-4 space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre de paciente, MRN, modalidad o descripcion..."
              className="pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Modality filters */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {modalities.map(mod => (
              <Badge
                key={mod}
                variant={filterModality === mod ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] h-5 px-1.5"
                onClick={() => setFilterModality(mod)}
              >
                {mod === 'ALL' ? 'Todas' : mod}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Results */}
        <ScrollArea className="px-6 pb-6 max-h-[45vh]">
          {filteredStudies.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No se encontraron estudios</p>
              <p className="text-xs text-slate-400 mt-1">Intente con otros terminos de busqueda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudies.map(study => (
                <div
                  key={study.id}
                  className="group border rounded-lg p-3 hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-all"
                  onClick={() => onSelectStudy?.(study)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {highlightMatch(study.patientName, search)}
                        </span>
                        <Badge className={`text-[9px] h-4 px-1 ${modalityColors[study.modality] || 'bg-slate-100 text-slate-700'}`}>
                          {study.modality}
                        </Badge>
                        {study.isImported && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-300 text-emerald-600">
                            Importado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {highlightMatch(study.mrn, search)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {study.studyDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileImage className="w-3 h-3" />
                          {study.numSeries} series / {study.numImages} imgs
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {highlightMatch(study.description, search)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400">{study.fileSize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
