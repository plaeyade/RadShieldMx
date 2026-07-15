import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Sparkles } from 'lucide-react';

interface ChatMsg { id: string; role: 'user' | 'bot'; text: string; timestamp: string; }

const INITIAL_MSGS: ChatMsg[] = [
  { id: '1', role: 'bot', text: 'Hola! Soy el asistente IA de RadShield-MX v78. Puedo ayudarte con:\n\n• Calculos de blindaje (NCRP-151/147)\n• Consultas normativas (CNSNS, IAEA, ICRP)\n• Interpretacion de resultados\n• Uso de herramientas y funciones\n\nEscribe tu pregunta...', timestamp: new Date().toISOString() },
];

const SUGGESTIONS = [
  'Como calculo blindaje para LINAC 6MV?',
  'Que diferencia hay entre NCRP-151 y 147?',
  'Como exporto un reporte CNSNS?',
  'Que es el TVL y como se interpola?',
];

export default function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>(INITIAL_MSGS);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [msgs]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: 'user', text, timestamp: new Date().toISOString() };
    setMsgs(p => [...p, userMsg]);
    setInput('');
    setTyping(true);

    // Simulated AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'linac': 'Para un LINAC 6 MV:\n1. Vaya a Calcular > Blindaje Primario\n2. Seleccione "LINAC 6 MV"\n3. Ingrese: W (carga de trabajo en Gy/semana), U (factor de uso), d (distancia en m)\n4. El motor NCRP-151 calculara el espesor de concreto en mm.\n\nTip: Use el factor de ocupacion T segun el area adyacente (control=1, pasillo=0.2)',
        'ncrp': 'NCRP-151 = Terapia megavoltaje (>=1 MV): LINAC, Gamma Knife, Co-60.\nNCRP-147 = Imagenologia: RX, CT, fluoroscopia.\n\nEl sistema valida automaticamente que el standard coincida con la modalidad seleccionada.',
        'reporte': 'Para exportar un reporte CNSNS:\n1. Archivo > Exportar Reporte CNSNS\n2. Complete: Instalacion, Responsable, Fecha, Modalidades, Fuentes, Barreras\n3. Revise los resultados calculados\n4. Genere el PDF con la memoria analitica',
        'tvl': 'TVL (Tenth-Value Layer) = espesor que reduce la intensidad a 1/10.\n\nPara energias no tabuladas, el sistema usa interpolacion log-lineal automatica (v72 B.12):\nTVL(E) = TVL(E1) * (TVL(E2)/TVL(E1)) ^ log(E/E1)/log(E2/E1)\n\nEsto reduce el error de ~15% a <3% para energias intermedias.',
      };
      let response = 'Entiendo tu pregunta. Puedo ayudarte con eso. Para una respuesta mas detallada, consulte el Glosario (Archivo > Glosario) o el Manual de Usuario.';
      const lower = text.toLowerCase();
      if (lower.includes('linac') || lower.includes('blindaje') || lower.includes('calcular')) response = responses['linac'];
      else if (lower.includes('ncrp') || lower.includes('151') || lower.includes('147')) response = responses['ncrp'];
      else if (lower.includes('reporte') || lower.includes('cnsns') || lower.includes('export')) response = responses['reporte'];
      else if (lower.includes('tvl') || lower.includes('hvl') || lower.includes('interpol')) response = responses['tvl'];

      const botMsg: ChatMsg = { id: `b_${Date.now()}`, role: 'bot', text: response, timestamp: new Date().toISOString() };
      setMsgs(p => [...p, botMsg]);
      setTyping(false);
    }, 800 + Math.random() * 1200);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-[600] w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform">
      <Bot className="w-7 h-7 text-white" />
    </button>
  );

  return (
    <div className="fixed bottom-6 right-6 z-[600] w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-white" />
          <div><h3 className="text-sm font-bold text-white">RadShield AI</h3><p className="text-[9px] text-orange-100">v78 | Asistente de blindaje</p></div>
        </div>
        <button onClick={() => setOpen(false)} className="text-orange-200 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {msgs.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'bot' ? 'bg-orange-100' : 'bg-slate-100'}`}>
              {m.role === 'bot' ? <Sparkles className="w-4 h-4 text-orange-600" /> : <User className="w-4 h-4 text-slate-600" />}
            </div>
            <div className={`max-w-[280px] p-2.5 rounded-xl text-[11px] leading-relaxed whitespace-pre-line ${m.role === 'bot' ? 'bg-slate-50 text-slate-700 rounded-tl-none' : 'bg-orange-50 text-slate-700 rounded-tr-none'}`}>{m.text}</div>
          </div>
        ))}
        {typing && <div className="flex gap-2"><div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center"><Bot className="w-4 h-4 text-orange-600" /></div><div className="bg-slate-50 p-2.5 rounded-xl rounded-tl-none text-[11px] text-slate-400">Escribiendo...</div></div>}
      </div>
      {/* Suggestions */}
      {msgs.length <= 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-full hover:bg-orange-50 hover:border-orange-200 transition-colors">{s}</button>)}
        </div>
      )}
      {/* Input */}
      <div className="p-3 border-t border-slate-100 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder="Pregunta sobre blindaje..." className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        <button onClick={() => send(input)} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
