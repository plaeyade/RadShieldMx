import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem { q: string; a: string; category: string; }

const FAQS: FAQItem[] = [
  { q: 'Como calculo el blindaje para un LINAC 6 MV?', a: 'Seleccione la modalidad "LINAC 6 MV" en el menu Calcular > Blindaje Primario. Ingrese la carga de trabajo (W), el factor de uso (U) y la distancia (d). El motor NCRP-151 calculara automaticamente el espesor de concreto requerido.', category: 'Calculos' },
  { q: 'Cual es la diferencia entre NCRP-151 y NCRP-147?', a: 'NCRP-151 aplica a terapia megavoltaje (>= 1 MV): LINAC, Gamma Knife, Cobalto-60. NCRP-147 aplica a imagenologia: RX, CT, fluoroscopia. El sistema valida automaticamente que el standard coincida con la modalidad.', category: 'Normativa' },
  { q: 'Como importo un plano DXF desde AutoCAD?', a: 'Archivo > Importar DXF. Seleccione el archivo .dxf o .dwg. El plano se escala automaticamente. Puede editar barreras y fuentes sobre el plano importado.', category: 'Importar' },
  { q: 'Que es el VectorDB RAG y como lo uso?', a: 'Es una base de datos vectorial que almacena documentos tecnicos (NCRP, IAEA, ICRU). Vaya a Archivo > RAG VectorDB para ingestar documentos. Luego use la busqueda semantica para consultar informacion tecnica.', category: 'IA/ML' },
  { q: 'Como exporto un reporte CNSNS?', a: 'Archivo > Exportar Reporte CNSNS. Complete el formulario con datos de la instalacion, fuentes, barreras y resultados. El sistema genera una memoria analitica en formato PDF.', category: 'Reportes' },
  { q: 'Puedo usar la app sin conexion a internet?', a: 'Si. RadShield-MX funciona completamente offline. Los calculos, proyectos y memorias se almacenan localmente. La sincronizacion en la nube es opcional.', category: 'General' },
  { q: 'Como comparto resultados con mi equipo?', a: 'Archivo > Compartir resultados. Usa la Web Share API para enviar a WhatsApp, Email, Drive, o descargue un archivo CSV/PDF/JSON.', category: 'Colaboracion' },
  { q: 'Que significa PASS, WARN, FAIL en los resultados?', a: 'PASS: la barrera cumple con el limite de dosis. WARN: la dosis excede el limite en menos de 50%. FAIL: la dosis critica excede el limite por mas de 50%. Revise el factor de ocupacion y el material.', category: 'Resultados' },
  { q: 'Como actualizo las dependencias y normativas?', a: 'Archivo > Actualizar App. Muestra las actualizaciones disponibles de APIs, dependencias (npm) y normativas (NCRP, IAEA, CNSNS).', category: 'Actualizaciones' },
  { q: 'Que formatos 3D soporta el visor?', a: 'STEP, IGES, DXF, DWG, OBJ, STL. El visor 3D usa Three.js para renderizar modelos de bunkers, equipos medicos y nubes de puntos.', category: '3D' },
];

const CATEGORIES = [...new Set(FAQS.map(f => f.category))];

export default function FAQPanel({ onClose }: { onClose: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [cat, setCat] = useState<string>('Todas');
  const filtered = cat === 'Todas' ? FAQS : FAQS.filter(f => f.category === cat);

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <div><h2 className="text-sm font-bold text-slate-800">Preguntas Frecuentes</h2><p className="text-[10px] text-slate-500">{FAQS.length} preguntas | RadShield-MX v78</p></div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
      </div>
      {/* Categories */}
      <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-slate-100">
        <button onClick={() => setCat('Todas')} className={cn('text-[10px] px-2 py-1 rounded-full border', cat === 'Todas' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200')}>Todas</button>
        {CATEGORIES.map(c => <button key={c} onClick={() => setCat(c)} className={cn('text-[10px] px-2 py-1 rounded-full border', cat === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200')}>{c}</button>)}
      </div>
      {/* FAQ list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.map((faq, i) => (
          <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors">
              <span className="text-xs font-medium text-slate-700 flex-1 pr-2">{faq.q}</span>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', openIdx === i && 'rotate-180')} />
            </button>
            {openIdx === i && <div className="px-3 pb-3 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 pt-2">{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
