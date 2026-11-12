import { useState } from 'react';
import { X, Check, LayoutTemplate, Scan, Shield, Atom, Stethoscope, Radiation, Microscope, FlaskConical, Minimize2, Route, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RoomTemplate } from '@/hooks/useRoomTemplates';

interface RoomTemplatePanelProps {
  templates: RoomTemplate[];
  categories: string[];
  activeTemplate: string | null;
  onApply: (templateId: string) => void;
  onClose: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'CT': <Scan className="w-4 h-4" />,
  'PET-CT': <Atom className="w-4 h-4" />,
  'LINAC': <Radiation className="w-4 h-4" />,
  'RX': <Scan className="w-4 h-4" />,
  'Fluoroscopy': <Stethoscope className="w-4 h-4" />,
  'Mammography': <Microscope className="w-4 h-4" />,
  'Brachytherapy': <FlaskConical className="w-4 h-4" />,
  'Nuclear Medicine': <Atom className="w-4 h-4" />,
  'Shielded Room': <Shield className="w-4 h-4" />,
  'Maze': <Route className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  'CT': 'text-blue-600 bg-blue-50',
  'PET-CT': 'text-purple-600 bg-purple-50',
  'LINAC': 'text-red-600 bg-red-50',
  'RX': 'text-teal-600 bg-teal-50',
  'Fluoroscopy': 'text-cyan-600 bg-cyan-50',
  'Mammography': 'text-pink-600 bg-pink-50',
  'Brachytherapy': 'text-amber-600 bg-amber-50',
  'Nuclear Medicine': 'text-indigo-600 bg-indigo-50',
  'Shielded Room': 'text-slate-600 bg-slate-50',
  'Maze': 'text-orange-600 bg-orange-50',
};

export default function RoomTemplatePanel({ templates, categories, activeTemplate, onApply, onClose }: RoomTemplatePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="absolute top-16 right-4 w-[420px] max-h-[80vh] bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-sm text-slate-800">Smart Rooms — Plantillas</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Category filters */}
      <div className="px-4 py-2 border-b border-slate-100 flex gap-1.5 flex-wrap">
        <button
          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          onClick={() => setSelectedCategory('all')}
        >
          Todas ({templates.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1 ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            <span className={selectedCategory === cat ? 'text-white' : categoryColors[cat]?.split(' ')[0] || 'text-slate-600'}>
              {categoryIcons[cat]}
            </span>
            {cat}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`rounded-lg border transition-all cursor-pointer ${
              activeTemplate === template.id
                ? 'border-orange-300 bg-orange-50'
                : 'border-slate-150 bg-slate-50 hover:border-orange-200 hover:bg-white'
            }`}
          >
            {/* Card header */}
            <div
              className="flex items-center gap-2.5 px-3 py-2"
              onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
            >
              <div className={`p-1.5 rounded-md ${categoryColors[template.category] || 'text-slate-600 bg-slate-50'}`}>
                {categoryIcons[template.category] || <LayoutTemplate className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 truncate">{template.name}</span>
                  {activeTemplate === template.id && (
                    <span className="flex items-center gap-0.5 text-[10px] text-orange-600 font-medium ml-1">
                      <Check className="w-3 h-3" /> Activa
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">{template.description}</p>
              </div>
              <ArrowRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expandedTemplate === template.id ? 'rotate-90' : ''}`} />
            </div>

            {/* Expanded details */}
            {expandedTemplate === template.id && (
              <div className="px-3 pb-3 border-t border-slate-100 pt-2 space-y-2">
                {/* Room dimensions */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded px-2 py-1.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400">Ancho</p>
                    <p className="text-xs font-semibold text-slate-700">{template.roomDimensions.width_m} m</p>
                  </div>
                  <div className="bg-white rounded px-2 py-1.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400">Largo</p>
                    <p className="text-xs font-semibold text-slate-700">{template.roomDimensions.length_m} m</p>
                  </div>
                  <div className="bg-white rounded px-2 py-1.5 text-center border border-slate-100">
                    <p className="text-[9px] text-slate-400">Alto</p>
                    <p className="text-xs font-semibold text-slate-700">{template.roomDimensions.height_m} m</p>
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Equipo</p>
                  {template.equipment.map((eq, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded px-2 py-1.5 border border-slate-100 mb-1">
                      <Radiation className="w-3 h-3 text-orange-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-slate-700 truncate">{eq.name}</p>
                        <p className="text-[9px] text-slate-400">{eq.kVp_mV} · {eq.workload}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Walls summary */}
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Blindaje</p>
                  <div className="space-y-1">
                    {template.walls.filter(w => w.isPrimaryBarrier).map((w, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-red-100">
                        <Shield className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] text-slate-600 flex-1">{w.material} — {w.thickness_mm}mm</span>
                        <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Primaria</span>
                      </div>
                    ))}
                    {template.walls.filter(w => w.isSecondaryBarrier && !w.isPrimaryBarrier).slice(0, 2).map((w, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-slate-100">
                        <Minimize2 className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-600 flex-1">{w.material} — {w.thickness_mm}mm</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Secundaria</span>
                      </div>
                    ))}
                    {template.walls.filter(w => w.isSecondaryBarrier && !w.isPrimaryBarrier).length > 2 && (
                      <p className="text-[9px] text-slate-400 pl-2">+{template.walls.filter(w => w.isSecondaryBarrier && !w.isPrimaryBarrier).length - 2} paredes más...</p>
                    )}
                  </div>
                </div>

                {/* Controlled areas */}
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Áreas Controladas</p>
                  <div className="flex gap-1 flex-wrap">
                    {template.controlledAreas.map((area, i) => (
                      <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        area.type === 'controlled' ? 'bg-amber-50 text-amber-700' :
                        area.type === 'supervised' ? 'bg-blue-50 text-blue-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {area.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recintos exigidos por la norma (NOM-040-NUCL-2016 en medicina nuclear) */}
                {template.recintosNormativos && template.recintosNormativos.length > 0 && (
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Recintos requeridos por la norma</p>
                    <ul className="space-y-0.5">
                      {template.recintosNormativos.map((r) => (
                        <li key={r.id} className="text-[9px] text-slate-600">
                          {r.nombre} <span className="text-slate-400">— {r.numeral}{r.cuandoAplica ? ` (cuando aplique: ${r.cuandoAplica})` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Design criteria */}
                {template.designCriteria && (
                  <div className="flex gap-2 flex-wrap">
                    {template.designCriteria.weeklyWorkload_hrs && (
                      <span className="text-[9px] bg-white border border-slate-100 px-2 py-1 rounded text-slate-500">
                        {template.designCriteria.weeklyWorkload_hrs} hrs/semana
                      </span>
                    )}
                    {template.designCriteria.doseConstraint_mSv_week && (
                      <span className="text-[9px] bg-white border border-slate-100 px-2 py-1 rounded text-slate-500">
                        ≤ {template.designCriteria.doseConstraint_mSv_week} mSv/semana
                      </span>
                    )}
                    {template.designCriteria.patientThroughput_perWeek && (
                      <span className="text-[9px] bg-white border border-slate-100 px-2 py-1 rounded text-slate-500">
                        ~{template.designCriteria.patientThroughput_perWeek} pacientes/sem
                      </span>
                    )}
                  </div>
                )}

                {/* Apply button */}
                <Button
                  size="sm"
                  className={`w-full text-xs h-8 ${activeTemplate === template.id ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                  onClick={() => onApply(template.id)}
                >
                  {activeTemplate === template.id ? (
                    <><Check className="w-3.5 h-3.5 mr-1" /> Aplicada — Clic para reaplicar</>
                  ) : (
                    <><LayoutTemplate className="w-3.5 h-3.5 mr-1" /> Aplicar plantilla</>
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 rounded-b-lg">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Info className="w-3 h-3" />
          <span>Las plantillas generan barreras, fuentes y áreas controladas preconfiguradas según NCRP 147/151</span>
        </div>
      </div>
    </div>
  );
}
