import { useState, useEffect } from 'react';
import { Shield, Trash2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'radshield_privacy_consent';
const MODE_KEY = 'radshield_private_mode';

export function usePrivacyConsent() {
  const [consented, setConsented] = useState(() => localStorage.getItem(CONSENT_KEY) === 'true');
  const [privateMode, setPrivateMode] = useState(() => localStorage.getItem(MODE_KEY) === 'true');

  const giveConsent = () => { localStorage.setItem(CONSENT_KEY, 'true'); setConsented(true); };
  const revokeConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(MODE_KEY);
    setConsented(false);
    setPrivateMode(false);
  };
  const togglePrivateMode = () => {
    const next = !privateMode;
    localStorage.setItem(MODE_KEY, String(next));
    setPrivateMode(next);
  };
  const clearAllData = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('radshield_'));
    keys.forEach(k => localStorage.removeItem(k));
    indexedDB.databases?.().then(dbs => dbs.forEach(db => { if (db.name?.startsWith('RadShield')) indexedDB.deleteDatabase(db.name); }));
    setConsented(false);
    setPrivateMode(false);
  };

  return { consented, privateMode, giveConsent, revokeConsent, togglePrivateMode, clearAllData };
}

export function PrivacyBanner({ onConsent }: { onConsent: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white px-4 py-3 z-[500] flex items-center gap-4 text-xs">
    <Shield className="w-4 h-4 text-orange-400 shrink-0" />
    <p className="flex-1">RadShield-MX almacena datos localmente en su dispositivo. No enviamos datos a servidores sin su consentimiento.</p>
    <Button size="sm" className="h-7 bg-orange-500 hover:bg-orange-600 text-[10px]" onClick={() => { onConsent(); setDismissed(true); }}>Aceptar</Button>
    <Button size="sm" variant="ghost" className="h-7 text-slate-400 hover:text-white text-[10px]" onClick={() => setDismissed(true)}>Cerrar</Button>
  </div>;
}

export function PrivacySettingsPanel({ onClose }: { onClose: () => void }) {
  const privacy = usePrivacyConsent();
  return <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l z-50 p-4 space-y-4">
    <h3 className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4" /> Privacidad y Datos</h3>
    <div className="space-y-3 text-xs">
      <label className="flex items-center gap-2"><input type="checkbox" checked={privacy.privateMode} onChange={privacy.togglePrivateMode} /> Modo privado (sin persistencia)</label>
      <p className="text-slate-500">En modo privado, los proyectos no se guardan entre sesiones.</p>
      <hr />
      <Button variant="destructive" size="sm" className="h-8 text-[10px] gap-1 w-full" onClick={() => { if (confirm('Eliminar TODOS los datos?')) { privacy.clearAllData(); onClose(); } }}>
        <Trash2 className="w-3 h-3" /> Borrar todos mis datos
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 w-full" onClick={onClose}>Cerrar</Button>
    </div>
  </div>;
}
