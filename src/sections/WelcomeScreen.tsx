import { rutaPublica } from '@/lib/rutaPublica';
import { useState, useEffect } from 'react';
import {
  Shield, Play, FolderOpen, Upload, BookOpen, X, Activity, Radio, Atom, Zap, Calculator, FileText,
  Stethoscope, Box,
  ArrowRight, CheckCircle2,
  MapPin, BarChart3, PenTool, Ruler, FileBarChart,
  ScanLine, Brain, Radiation,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';

const TEMPLATES = [
  { id: 'linac-6', nameKey: 'LINAC 6 MV Bunker', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', descKey: 'NCRP 151' },
  { id: 'pet-ct', nameKey: 'PET/CT F-18 FDG', icon: Radio, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', descKey: 'TG-108' },
  { id: 'gamma-knife', nameKey: 'Gamma Knife', icon: Brain, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', descKey: 'SRS' },
  { id: 'hdr-co60', nameKey: 'HDR Co-60', icon: Activity, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', descKey: 'Brachy' },
  { id: 'cyclotron', nameKey: 'Ciclotron 18 MeV', icon: Atom, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', descKey: 'Neutrones' },
  { id: 'rf-room', nameKey: 'R&F Room', icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', descKey: 'NCRP 147' },
];

interface Props {
  onNewProject: () => void;
  onOpenProject: () => void;
  onImportDXF: () => void;
  onImportFloorPlan: () => void;
  onLoadTemplate: (id: string) => void;
  onLoadRecent?: (id: string) => void;
  onTutorial: () => void;
  onManual: () => void;
  onDismiss: () => void;
  onOpenTool?: (toolId: string) => void;
}

export default function WelcomeScreen({ onNewProject, onImportDXF, onImportFloorPlan, onLoadTemplate, onManual, onDismiss }: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);
  const [activePill, setActivePill] = useState('ct');

  useEffect(() => { try { if (localStorage.getItem('radshield_mosaic')) setVisible(false); } catch { /* almacenamiento no disponible */ } }, []);
  if (!visible) return null;
  const dismiss = () => { setVisible(false); try { localStorage.setItem('radshield_mosaic', '1'); } catch { /* almacenamiento no disponible */ } onDismiss(); };

  const MODALITY_PILLS = [
    { id: 'ct', label: 'CT Rooms', icon: ScanLine },
    { id: 'fluoro', label: 'Fluoro.', icon: Stethoscope },
    { id: 'xr', label: 'General X-ray', icon: Radiation },
    { id: 'pet', label: 'PET/CT', icon: Radio },
    { id: 'linac', label: 'Linac Vaults', icon: Zap },
    { id: 'gamma', label: 'Gamma Knife', icon: Brain },
    { id: 'hdr', label: 'HDR', icon: Activity },
    { id: 'cycl', label: 'Cyclotron', icon: Atom },
  ];

  const FEATURES = [
    { icon: PenTool, title: t('feat.barrierAssumptions'), desc: t('feat.barrierAssumptionsDesc') },
    { icon: CheckCircle2, title: t('feat.reviewRecommendations'), desc: t('feat.reviewRecommendationsDesc') },
    { icon: FileBarChart, title: t('feat.airKerma'), desc: t('feat.airKermaDesc') },
    { icon: Building2, title: t('feat.projectManagement'), desc: t('feat.projectManagementDesc') },
    { icon: Ruler, title: t('feat.geometry'), desc: t('feat.geometryDesc') },
    { icon: MapPin, title: t('feat.controlPoints'), desc: t('feat.controlPointsDesc') },
  ];

  const WHAT_YOU_GET = [
    { title: t('wyg.regulatorReport'), desc: t('wyg.regulatorReportDesc'), icon: FileText },
    { title: t('wyg.physicistReport'), desc: t('wyg.physicistReportDesc'), icon: BarChart3 },
    { title: t('wyg.editableModels'), desc: t('wyg.editableModelsDesc'), icon: PenTool },
    { title: t('wyg.projectWorkflow'), desc: t('wyg.projectWorkflowDesc'), icon: FolderOpen },
  ];

  const WORKFLOWS = [
    { title: t('wf.xrayCT'), desc: t('wf.xrayCTDesc'), icon: Radiation, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: t('wf.petSPECT'), desc: t('wf.petSPECTDesc'), icon: Radio, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: t('wf.linac'), desc: t('wf.linacDesc'), icon: Zap, color: 'text-red-600', bg: 'bg-red-50' },
    { title: t('wf.gamma'), desc: t('wf.gammaDesc'), icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-auto">
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f97316] flex items-center justify-center"><Shield className="w-4.5 h-4.5 text-white" /></div>
          <span className="font-bold text-sm text-slate-800">RadShield-MX</span>
        </div>
        <nav className="flex items-center gap-6 text-[13px] text-slate-600">
          <button className="hover:text-slate-900 transition-colors font-medium">Platform</button>
          <button className="hover:text-slate-900 transition-colors font-medium">About</button>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1.5" onClick={onManual}><BookOpen className="w-3.5 h-3.5" /> Manual</Button>
          <Button className="h-8 bg-[#f97316] hover:bg-[#ea580c] text-white text-[11px] px-4 gap-1.5" onClick={() => { dismiss(); onNewProject(); }}>
            <Play className="w-3.5 h-3.5" /> {t('welcome.newProject')}
          </Button>
          <button onClick={dismiss} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Hero */}
        <section className="bg-[#f97316] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-12 flex items-center gap-12">
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-white leading-tight mb-4">
                Radiation Shielding<br /><span className="text-slate-900">Software</span><br />for Medical Physics
              </h1>
              <p className="text-white/90 text-base mb-6 max-w-lg">{t('app.tagline')}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {MODALITY_PILLS.map(p => (
                  <button key={p.id} onClick={() => setActivePill(p.id)}
                    className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all ${activePill === p.id ? 'bg-slate-900 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                    <p.icon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />{p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-6 gap-2" onClick={() => { dismiss(); onNewProject(); }}>
                  <Play className="w-4 h-4" /> {t('welcome.newProject')}
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent px-6 gap-2" onClick={() => { dismiss(); onImportFloorPlan(); }}>
                  <Upload className="w-4 h-4" /> {t('welcome.importPlan')}
                </Button>
              </div>
            </div>
            <div className="w-[480px] bg-white rounded-lg shadow-2xl p-4 shrink-0">
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
                <img src={rutaPublica('mosaic-preview.png')} alt="Report preview" className="w-full h-48 object-cover bg-slate-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="p-3 bg-slate-50">
                  <div className="h-2 w-3/4 bg-slate-200 rounded mb-2" /><div className="h-2 w-1/2 bg-slate-200 rounded" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic text-center">{t('feat.airKermaDesc')}</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[#fff7ed] flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-[#f97316]" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">{f.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="bg-[#fef7f0] py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">{t('platform.title')}</h2>
            <p className="text-sm text-slate-500 text-center mb-8 max-w-xl mx-auto">{t('platform.desc')}</p>
            <div className="flex items-center justify-center gap-4">
              <div className="space-y-3">
                <div className="bg-[#f97316] text-white px-5 py-3 rounded-lg text-[12px] font-semibold text-center shadow-sm"><Box className="w-4 h-4 inline mr-1.5" />{t('platform.floorPlans')}</div>
                <div className="bg-[#fb923c] text-white px-5 py-3 rounded-lg text-[12px] font-semibold text-center shadow-sm"><PenTool className="w-4 h-4 inline mr-1.5" />{t('platform.barrierDetails')}</div>
                <div className="bg-[#fb923c] text-white px-5 py-3 rounded-lg text-[12px] font-semibold text-center shadow-sm"><Radio className="w-4 h-4 inline mr-1.5" />{t('platform.sources')}</div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400" />
              <div className="w-28 h-28 bg-white rounded-2xl border-2 border-[#fed7aa] flex items-center justify-center shadow-md"><Shield className="w-12 h-12 text-[#f97316]" /></div>
              <ArrowRight className="w-6 h-6 text-slate-400" />
              <div className="space-y-3">
                <div className="bg-[#f97316] text-white px-5 py-3 rounded-lg text-[12px] font-semibold text-center shadow-sm"><FileText className="w-4 h-4 inline mr-1.5" />{t('platform.regulatorReady')}</div>
                <div className="bg-[#fb923c] text-white px-5 py-3 rounded-lg text-[12px] font-semibold text-center shadow-sm"><Calculator className="w-4 h-4 inline mr-1.5" />{t('platform.calcVerification')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="bg-white py-10 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">{t('wyg.title')}</h2>
            <p className="text-sm text-slate-500 text-center mb-6">{t('wyg.subtitle')}</p>
            <div className="grid grid-cols-2 gap-4">
              {WHAT_YOU_GET.map((item, i) => (
                <div key={i} className="p-4 rounded-xl border-t-2 border-t-[#f97316] border border-slate-100 shadow-sm">
                  <item.icon className="w-5 h-5 text-[#f97316] mb-2" />
                  <h3 className="text-[13px] font-semibold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflows */}
        <section className="bg-[#fafaf9] py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">{t('wf.title')}</h2>
            <p className="text-sm text-slate-500 text-center mb-6 max-w-2xl mx-auto">{t('wf.desc')}</p>
            <div className="grid grid-cols-4 gap-4">
              {WORKFLOWS.map((w, i) => (
                <div key={i} className={`${w.bg} rounded-xl p-5 border border-slate-100`}>
                  <w.icon className={`w-8 h-8 ${w.color} mb-3`} />
                  <h3 className="text-[13px] font-bold text-slate-800 mb-2">{w.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="bg-white py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">{t('welcome.templates')}</h2>
            <div className="grid grid-cols-6 gap-3">
              {TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => { dismiss(); onLoadTemplate(tpl.id); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${tpl.border} ${tpl.bg} hover:shadow-lg transition-all group`}>
                  <tpl.icon className={`w-7 h-7 ${tpl.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">{tpl.nameKey}</span>
                  <span className="text-[9px] text-slate-400">{tpl.descKey}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-slate-900 py-10 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to start your shielding design?</h2>
            <p className="text-sm text-slate-400 mb-6">{t('welcome.description')}</p>
            <div className="flex justify-center gap-3">
              <Button size="lg" className="bg-[#f97316] hover:bg-[#ea580c] text-white px-8 gap-2" onClick={() => { dismiss(); onNewProject(); }}>
                <Play className="w-4 h-4" /> {t('welcome.newProject')}
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent px-6 gap-2" onClick={() => { dismiss(); onImportFloorPlan(); }}>
                <Upload className="w-4 h-4" /> {t('welcome.importPlan')}
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent px-6 gap-2" onClick={() => { dismiss(); onImportDXF(); }}>
                <Box className="w-4 h-4" /> {t('welcome.importDXF')}
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 text-slate-500 py-6 px-6 text-[11px]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#f97316]" />
              <span className="font-semibold text-slate-400">RadShield-MX</span>
            </div>
            <div className="flex gap-6">
              <span>NCRP 147 / 151 / TG-108</span>
              <span>ICRP 103 / IAEA SSR-6</span>
              <span>CNSNS LA-007/01</span>
            </div>
            <span>{t('footer.copyright')}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
