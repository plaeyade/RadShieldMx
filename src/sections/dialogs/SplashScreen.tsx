import { useState, useEffect } from 'react';
import { Shield, X, ChevronRight, BookOpen, Sparkles, Users, Globe } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const LOGOS = [
  { name: 'OIEA / IAEA', subtitle: 'International Atomic Energy Agency', url: 'https://www.iaea.org' },
  { name: 'NCRP', subtitle: 'National Council on Radiation Protection', url: 'https://ncrponline.org' },
  { name: 'CNSNS', subtitle: 'Comision Nacional de Seguridad Nuclear y Salvaguardias', url: 'https://www.gob.mx/cnsns' },
  { name: 'AAPM', subtitle: 'American Association of Physicists in Medicine', url: 'https://www.aapm.org' },
  { name: 'ICRP', subtitle: 'International Commission on Radiological Protection', url: 'https://www.icrp.org' },
  { name: 'ICRU', subtitle: 'International Commission on Radiation Units', url: 'https://icru.org' },
];

const FEATURES = [
  { icon: BookOpen, label: 'Normativas', desc: 'NCRP 147/151/155, IAEA, ICRP, ICRU, CNSNS, NOM' },
  { icon: Sparkles, label: 'IA/ML', desc: 'SmartBarrier AI, RAG VectorDB, prediccion ML' },
  { icon: Users, label: '18 Fuentes Reales', desc: 'DX/RT/NM/CY — iconos diferenciados en plano' },
  { icon: Globe, label: 'Fase 3 Backend', desc: 'Neutron shielding, skyshine, batch, optimizador' },
];

export default function SplashScreen({ onClose }: Props) {
  const [progress, setProgress] = useState(0);
  const [showLogos, setShowLogos] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLogos(true), 300);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 60);
    const t2 = setTimeout(() => onClose(), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center max-w-2xl w-full px-6">
        {/* App icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-6">
          <Shield className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
          RadShield<span className="text-orange-400">-MX</span>
        </h1>
        <p className="text-sm text-slate-400 mb-2">Professional Radiation Shielding Design</p>
        <p className="text-xs text-slate-500 font-mono mb-8">v127 | 2022-2026 | C.E. Cardena et al.</p>

        {/* Institutional Logos */}
        {showLogos && (
          <div className="w-full mb-8">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mb-4">
              Normas de referencia (sin aval de estas instituciones)
            </p>
            <div className="flex justify-center items-center gap-4 flex-wrap">
              {LOGOS.map(({ name, subtitle, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
                  title={subtitle}
                >
                  <span className="text-[9px] text-slate-400 group-hover:text-white transition-colors font-medium">{name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/5 border border-white/5">
              <Icon className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-slate-200">{label}</p>
                <p className="text-[9px] text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm mb-4">
          <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-slate-500">Cargando...</span>
            <span className="text-[9px] text-slate-500 font-mono">{progress}%</span>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-orange-400 transition-colors"
        >
          Continuar <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center">
        <p className="text-[9px] text-slate-600">
          NCRP 147/151 &bull; IAEA SSR-6 &bull; ICRP 103/128 &bull; ICRU 57/96 &bull; NOM-008/040-NUCL
        </p>
      </div>
    </div>
  );
}
