import { useState } from 'react';
import { Search } from 'lucide-react';
import DialogShell from '@/components/DialogShell';

const GLOSSARY = [
  // === v77: AI/ML/RAG (nuevos) ===
  { term: 'RAG (Retrieval-Augmented Generation)', def: 'Sistema que combina recuperacion de documentos con generacion de texto. Usado en RadShield-MX v70 para consultar NCRP/IAEA/ICRU via embeddings y cosine similarity.' },
  { term: 'VectorDB', def: 'Base de datos vectorial en IndexedDB que almacena chunks de documentos con embeddings. Soporta busqueda por similitud de coseno para consultas tecnicas. v70.' },
  { term: 'Cosine Similarity', def: 'Medida de similitud entre dos vectores: sim = (A dot B) / (||A|| ||B||). Usada en RAG para encontrar los chunks mas relevantes.' },
  { term: 'TensorFlow.js', def: 'Libreria ML en el navegador. Usada para prediccion de espesores y anomaly detection. Cargado via CDN jsDelivr. v68 C.9.' },
  { term: 'ML Prediction', def: 'Modelo de red neuronal entrenado para predecir espesores de blindaje basado en datos historicos de calculos. v50 Fase 2.' },
  { term: 'Anomaly Detection', def: 'Deteccion automatica de valores atipicos en calculos de blindaje usando ML. Alerta cuando un resultado difiere significativamente del esperado.' },
  // === v77: Motores de calculo (nuevos) ===
  { term: 'TVL Interpolacion', def: 'Interpolacion log-lineal de Tenth-Value Layer para energias no tabuladas. v72 B.12. Reduce error de ~15% a <3%.' },
  { term: 'NCRP Cross-Validation', def: 'Validacion automatica NCRP-151 vs NCRP-147. v72 B.11. Detecta si LINAC/terapia usa NCRP-147 o CT usa NCRP-151 por error.' },
  { term: 'CNSNS Limites', def: 'Limites regulatorios mexicanos: publico 0.02 mSv/semana, ocupacional 0.4 mSv/semana. Validacion post-calculo automatica. v72 B.17.' },
  { term: 'Skyshine (Chilton)', def: 'Radiacion dispersa en atmosfera despues de salir por el techo. Calculo segun Chilton para instalaciones sin techo. v50.' },
  // === v77: Arquitectura/Code (nuevos) ===
  { term: 'Design Tokens', def: 'Sistema de tokens de diseno centralizado: colores, spacing, radius, animation. Reemplaza valores hardcodeados. v72 A.14.' },
  { term: 'Feature Flags', def: 'Sistema de caracteristicas toggleables via localStorage. webgpuHeatmap, advancedMonteCarlo, aiPredictions. v72 C.14.' },
  { term: 'Offline-First', def: 'Arquitectura que funciona sin conexion: queue de operaciones, sync al reconectar, deteccion online/offline. v72 E.13.' },
  { term: 'Bundle Optimization', def: 'Externalizacion de Three.js y TensorFlow.js via CDN. Reduccion vendor: 8.7MB a 5.2MB (-40%). v68 C.9.' },
  { term: 'Security Headers', def: 'Headers HTTP: CSP estricta, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. v71 E.11.' },
  { term: 'Color-Blind Safe', def: 'Paleta accesible para daltonismo (8% hombres): iconos + patrones + labels ademas de color. PASS/WARN/FAIL. v76 A.22.' },
  { term: 'Persistent Layout', def: 'Guardado automatico del layout de la UI en localStorage. Sidebar width, paneles, tool activo. v76 A.20.' },
  { term: 'Toast Queue', def: 'Sistema de notificaciones con rate limiting: max 3 visibles, agrupacion por tipo, auto-dismiss 4s. v76 A.17.' },
  { term: 'Lazy Loading', def: 'Carga diferida de ~180 dialogs solo cuando se abren. Reduce bundle inicial a ~700KB. v50-v63.' },
  { term: 'Zustand', def: 'Libreria de state management ligera. 75+ dialogs migrados. open/close/goBack/dialogHistory. v60-v70.' },
  // === v77: APIs/Web (nuevos) ===
  { term: 'WebGPU', def: 'API de graficos de bajo nivel para navegadores. Aceleracion de heatmaps de dosis. Feature flag: webgpuHeatmap.' },
  { term: 'Three.js', def: 'Libreria 3D para visualizacion de bunkers, isodosis y point clouds. Cargado via CDN jsDelivr. v68.' },
  { term: 'WebSerial API', def: 'API para comunicacion con dispositivos seriales (dosimetros Radcal/Fluke) desde el navegador.' },
  { term: 'Web Share API', def: 'API nativa para compartir resultados a apps del sistema (WhatsApp, Email, Drive). Menu Archivo > Compartir.' },
  { term: 'Playwright E2E', def: 'Framework de testing end-to-end. 14 tests: 8 menu items + 6 menu Archivo. v63, v72 E.14.' },
  { term: 'tRPC', def: 'Framework RPC type-safe para APIs. Integrado con Zod validation y Drizzle ORM. Backend type-safe.' },
  { term: 'Drizzle ORM', def: 'ORM type-safe para SQLite. Proyectos, usuarios, calculos con esquema tipado automatico.' },
  { term: 'IndexedDB', def: 'Base de datos NoSQL del navegador. Almacena VectorDB, projects, memories offline.' },
  // === v77: UI/UX (nuevos) ===
  { term: 'Skeleton Loading', def: '5 templates de carga: Form, Table, Chart, Wizard, List. Animate-pulse para feedback visual. v72 A.15.' },
  { term: 'Progress Indicator', def: 'Barra de progreso linear persistente para operaciones >2s. Timer, cancel, 4 estados. v72 A.18.' },
  { term: 'Command Palette', def: 'Paleta de comandos Ctrl+K. Busqueda fuzzy de funciones, shortcuts, acciones. v50.' },
  { term: 'Minimap', def: 'Navegador miniatura del canvas en esquina inferior derecha. Pan y zoom rapido. v47.' },
  { term: 'Onboarding Tour', def: 'Tour guiado para nuevos usuarios. Joyride con pasos por las funciones principales. v50.' },
  // === v1-v50: Terminos originales ===
  { term: 'ALARA', def: 'As Low As Reasonably Achievable. Principio de optimizacion: las dosis deben mantenerse tan bajas como razonablemente sea posible.' },
  { term: 'Archer Equation', def: 'Ecuacion empirica para transmision de RX: B=[(1+beta/alpha)exp(alpha*gamma*x)-beta/alpha]^(-1/gamma). Base NCRP 147.' },
  { term: 'Atenuacion', def: 'Reduccion de intensidad de radiacion al atravesar material, por absorcion y dispersion.' },
  { term: 'Bateman Equation', def: 'Describe el decaimiento de una cadena de radionucleidos, calculando actividad de cada miembro vs tiempo.' },
  { term: 'Blindaje Primario', def: 'Barrera que recibe el haz primario directo. Disenado para la dosis maxima posible.' },
  { term: 'Blindaje Secundario', def: 'Barrera que recibe solo radiacion dispersa (scatter) o de fuga (leakage). Menor espesor.' },
  { term: 'Carga de Trabajo (W)', def: 'Workload. Uso del equipo: mA*min/semana (diagnostico) o Gy/semana (terapia).' },
  { term: 'Capa Semirreductora (HVL)', def: 'Half-Value Layer. Espesor que reduce la intensidad a la mitad.' },
  { term: 'Capa Diezmarreductora (TVL)', def: 'Tenth-Value Layer. Espesor que reduce la intensidad a un decimo.' },
  { term: 'Ciclotron', def: 'Acelerador circular que produce radionucleidos para medicina nuclear (F-18, C-11, N-13, O-15).' },
  { term: 'CNSNS', def: 'Comision Nacional de Seguridad Nuclear y Salvaguardias. Regulador mexicano nuclear.' },
  { term: 'CTDIvol', def: 'Volume CT Dose Index. Indice de dosis volumetrico para CT en mGy.' },
  { term: 'Distancia de Uso (d)', def: 'Distancia desde la fuente hasta el punto de interes (barrera, area ocupada).' },
  { term: 'DLP', def: 'Dose-Length Product. CTDIvol x longitud de escaneo (mGy*cm).' },
  { term: 'Factor de Uso (U)', def: 'Fraccion del tiempo que el haz primario apunta a la barrera.' },
  { term: 'Factor de Ocupacion (T)', def: 'Fraccion del tiempo que una persona puede estar en el area protegida.' },
  { term: 'Factor kappa (CT)', def: 'Conversion DLP a kerma de dispersion para CT. Varia 0.5-13% entre marcas.' },
  { term: 'Fotoneutron', def: 'Neutron producido por fotones >10 MV con nucleos atomicos. Requiere blindaje adicional.' },
  { term: 'FW-CADIS', def: 'Forward-Weighted Consistent Adjoint Driven Importance Sampling. Reduccion de varianza Monte Carlo.' },
  { term: 'Gamma Constant', def: 'Constante de exposicion para un radionuclido. Unidades: uSv*m2/MBq*h.' },
  { term: 'GMP', def: 'Good Manufacturing Practices. Buenas Practicas de Manufactura para productos farmaceuticos.' },
  { term: 'GUM', def: 'Guide to the Expression of Uncertainty in Measurement. JCGM 100:2008.' },
  { term: 'Haz Primario', def: 'Haz de radiacion directo del equipo hacia el paciente.' },
  { term: 'Haz Disperso (Scatter)', def: 'Radiacion que cambia de direccion por interaccion con paciente, mesa o equipo.' },
  { term: 'Haz de Fuga (Leakage)', def: 'Radiacion que escapa del equipo fuera del haz util. Limitada a <0.1%.' },
  { term: 'IPEM', def: 'Institute of Physics and Engineering in Medicine. Organismo britanico (Report 109).' },
  { term: 'Isodosis', def: 'Linea que conecta puntos de igual dosis absorbida.' },
  { term: 'Kerma', def: 'Kinetic Energy Released per unit Mass. Energia cinetica liberada por unidad de masa. Unidad: Gy.' },
  { term: 'Laberinto (Maze)', def: 'Corredor con codos que reduce radiacion dispersa sin puerta blindada.' },
  { term: 'MIRD', def: 'Medical Internal Radiation Dose. Metodologia formal para dosis absorbida interna.' },
  { term: 'NCRP', def: 'National Council on Radiation Protection and Measurements (Reports 147, 151).' },
  { term: 'NIST', def: 'National Institute of Standards and Technology. XCOM database.' },
  { term: 'NOM-008-NUCL', def: 'Norma Mexicana de proteccion radiologica. Limites de dosis y requisitos de blindaje.' },
  { term: 'NOM-040-NUCL', def: 'Norma Mexicana para instalaciones de radioterapia.' },
  { term: 'PET', def: 'Positron Emission Tomography. Usa F-18, Ga-68. Blindaje especifico (AAPM TG 108).' },
  { term: 'Radiofarmaco', def: 'Compuesto con radionuclido para diagnostico o terapia.' },
  { term: 'SPECT', def: 'Single Photon Emission Computed Tomography. Usa Tc-99m, I-131, Ga-67.' },
  { term: 'TASMIP', def: 'Tungsten Anode Spectral Model using Interpolating Polynomials. Modelo Boone para espectros RX.' },
  { term: 'WASM', def: 'WebAssembly. Formato binario ejecucion de alto rendimiento en navegadores.' },
  { term: 'WebWorker', def: 'API JavaScript para ejecutar scripts en segundo plano sin bloquear UI.' },
  { term: 'ICRP 103', def: 'Recomendaciones 2007: justificacion, optimizacion (ALARA), limitacion.' },
  { term: 'ICRP 128', def: 'Proteccion en terapia con radiofarmacos. Blindaje Y-90, Lu-177, I-131, Ra-223.' },
] as const;

export default function GlossaryDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const filtered = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(q.toLowerCase()) ||
    g.def.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <DialogShell
      title="Glosario de Terminologia"
      subtitle={`${GLOSSARY.length} terminos | RadShield-MX v77`}
      gradientFrom="from-amber-500"
      gradientTo="to-orange-600"
      maxWidth="max-w-3xl"
      onClose={onClose}
    >
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar termino..."
          className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <p className="text-xs text-slate-500">{filtered.length} de {GLOSSARY.length} terminos | v1-v77</p>

      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {filtered.map(({ term, def }) => (
          <div key={term} className="p-2.5 bg-slate-50 rounded-lg border hover:bg-amber-50 transition-colors">
            <p className="text-sm font-bold text-slate-800">{term}</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{def}</p>
          </div>
        ))}
      </div>
    </DialogShell>
  );
}
