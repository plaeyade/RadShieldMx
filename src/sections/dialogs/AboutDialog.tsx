import { BookOpen, Calendar, Code, Globe, Heart, Shield, Users } from 'lucide-react';
import DialogShell from '@/components/DialogShell';

const META = [
  { icon: Calendar, label: 'Inicio del proyecto', value: '2022 — Plataforma web para fisicos medicos mexicanos' },
  { icon: Users, label: 'Autor', value: 'C.E. Cardena et al.' },
  { icon: Code, label: 'Desarrollo', value: 'Codigo propietario, desarrollo independiente' },
  { icon: Globe, label: 'Objetivo', value: 'Facilitar calculos de blindaje conforme a NCRP 147/151 y la normativa CNSNS, para instalaciones de radiologia y medicina nuclear en Mexico' },
  { icon: BookOpen, label: 'Referencias', value: '113 referencias bibliograficas indexadas (NCRP, ICRP, IAEA, AAPM, EANM, CNSNS)' },
] as const;

const FEATURES = [
  'NCRP Validation Suite (24 casos de validacion)',
  'CT Scatter Database (22 modelos de CT)',
  'AAPM TG 108 PET Shielding Calculator',
  'IPEM Report 109 SPECT Shielding',
  'Chilton Skyshine Calculator',
  'Therapy Radionuclide Shielding (Y-90, Lu-177, Ac-225)',
  'Decay Chain Calculator (Mo-99/Tc-99m, Ge-68/Ga-68)',
  'Compare Scenarios + Tornado Sensitivity',
  'GMP Certification para laboratorios de ciclotron',
] as const;

export default function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogShell
      title="Acerca de RadShield-MX"
      subtitle="Sistema Profesional de Calculo de Blindajes Radiologicos"
      gradientFrom="from-teal-600"
      gradientTo="to-cyan-700"
      maxWidth="max-w-lg"
      onClose={onClose}
    >
      <div className="text-center">
        <Shield className="w-12 h-12 text-teal-600 mx-auto mb-2" />
        <h3 className="text-2xl font-bold text-slate-800">RadShield-MX</h3>
        <p className="text-xs font-mono text-teal-600 mt-1">Version 50.4 | 2025</p>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border text-xs space-y-2">
        {META.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <span><strong>{label}:</strong> {value}</span>
          </div>
        ))}
      </div>

      <div className="p-3 bg-teal-50 rounded-lg border text-xs">
        <p className="font-semibold text-teal-800 mb-1">Novedades v50.4:</p>
        <ul className="space-y-0.5 text-teal-700 list-disc list-inside">
          {FEATURES.map(f => <li key={f}>{f}</li>)}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
        <Heart className="w-3 h-3 text-rose-400" />
        <span>Desarrollado para Mexico | Fisica Medica | Seguridad Radiologica</span>
      </div>
    </DialogShell>
  );
}
