import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Code, Beaker, Shield, ExternalLink } from 'lucide-react';

interface DocSection {
  title: string;
  content: string;
  refs?: string[];
}

const DOCS: Record<string, DocSection[]> = {
  methodology: [
    {
      title: 'NCRP 147 — Diagnostic Shielding',
      content: `Para blindaje diagnostico (R&F, CT, radiografia general), RadShield-MX aplica la metodologia del NCRP Report No. 147 (2004):

1. **Kerma sin blindaje**: K = W × U × T / d²
   donde W = carga de trabajo, U = factor de uso, T = factor de ocupacion, d = distancia

2. **Espesor requerido**: Usando parametros de Archer et al. para la ecuacion de transmission
   B = [(1 + beta/alpha) * e^(alpha*gamma*x) - beta/alpha]^(-1/gamma)

3. **Redondeo**: A estandares de construccion (concreto: 5mm, plomo: 1/32 pulgada)

4. **Validacion**: 24 casos de prueba contra tablas oficiales NCRP 147/151`,
      refs: ['NCRP 147 (2004)', 'Archer et al. (1983)'],
    },
    {
      title: 'NCRP 151 — Therapy Shielding (LINAC)',
      content: `Para aceleradores lineales, se aplica NCRP Report No. 151 (2005):

1. **Barrera primaria**: K_p = W × U / d_p²
   TVL de concreto a 6MV: ~370mm, a 18MV: ~450mm

2. **Barrera secundaria**: Barrera por dispersion + fugas del cabezal
   K_s = (W × a × theta) / (d_scatter² × d_sec² × 400)

3. **Laberinto**: Metodo de kersey, scatter multiple en paredes del laberinto

4. **Skyshine**: Modelo de Chilton para radiacion dispersada por el techo`,
      refs: ['NCRP 151 (2005)', 'Chilton (1966)'],
    },
    {
      title: 'AAPM TG-108 — PET/CT Shielding',
      content: `Para blindaje de medicina nuclear con PET/CT:

1. **F-18 FDG**: Dosis en superficie = A × t × Gamma / d²
   Constante gamma para F-18: 0.143 mSv·m²/(GBq·h)

2. **Tiempo de acumulacion**: Considerar 2h post-inyeccion (peak activity)

3. **Barrera secundaria**: Scatter + transmission, modelo punto fuente

4. **Dosis anual**: Integrar sobre todas las semanas del ano`,
      refs: ['AAPM TG-108 (2006)', 'IAEA Safety Reports Series No. 44'],
    },
  ],
  api: [
    {
      title: 'Screen Wake Lock API',
      content: `Mantiene la pantalla activa durante calculos largos.

**Uso**: Se activa automaticamente al iniciar un calculo de blindaje.
**Compatibilidad**: Chrome 84+, Edge 84+, Android WebView 84+
**Implementacion**: src/hooks/useScreenWakeLock.ts`,
    },
    {
      title: 'Web Share API',
      content: `Comparte resultados usando el panel nativo del OS.

**Uso**: Boton "Compartir" en Toolbar o Ctrl+Shift+S
**Compatibilidad**: Chrome 89+, Safari 12.1+, iOS Safari 12.2+
**Fallback**: Copia al portapapeles si no esta disponible`,
    },
    {
      title: 'Payment Request API (v63)',
      content: `Procesamiento de pagos para caracteristicas premium.

**Uso**: src/hooks/usePaymentRequest.ts
**Compatibilidad**: Chrome 60+, Edge 16+, Samsung Internet 7.0+
**Estado**: Simulado (TEST mode), requiere backend para produccion`,
    },
    {
      title: 'File System Access API',
      content: `Guarda/abre archivos directamente del sistema de archivos.

**Uso**: Ctrl+S (guardar), Ctrl+O (abrir)
**Compatibilidad**: Chrome 86+, Edge 86+
**Formatos**: .json (proyecto), .png (captura), .dxf (plano)`,
    },
  ],
  ai: [
    {
      title: 'Capa 1: LLM Integration',
      content: `Integracion multi-proveedor opt-in:
- OpenAI (GPT-4, GPT-3.5-turbo)
- Ollama (modelos locales: Llama 3, Mistral)
- LMStudio (API local compatible con OpenAI)

**Estado por defecto**: offline/local. No llama a proveedores externos sin configuracion explicita.
**Activacion**: configure VITE_ENABLE_BACKEND=true + VITE_BACKEND_URL, VITE_OPENAI_API_KEY, VITE_OLLAMA_BASE_URL o VITE_LMSTUDIO_BASE_URL.
**Uso**: AIAssistantDialog con fallback estatico/offline cuando no hay backend.`,
    },
    {
      title: 'Capa 2: RAG (Retrieval Augmented Generation)',
      content: `Base de datos vectorial con cosine similarity:
- Chunking semantico de documentos
- Embeddings locales sin dependencia de API
- Top-k retrieval con score de relevancia

**Estado por defecto**: recuperacion local si hay documentos ingeridos; backend RAG opcional.
**Documentos objetivo**: NCRP 151, NCRP 147, IAEA 47, TG-108, IPEM 109`,
    },
    {
      title: 'Capa 3: ML Predictivo',
      content: `Red neuronal TensorFlow.js:
- Arquitectura: [8 → 64 → 32 → 16 → 1]
- 3,000+ puntos de entrenamiento
- Deteccion de anomalias (Isolation Forest)

**Input**: kVp, mAs, distancia, material, espesor, ocupacion, uso, modalidad
**Output**: Espesor de blindaje predicho (mm)`,
    },
    {
      title: 'Capa 4: Computer Vision',
      content: `Deteccion automatica de paredes:
- Canny edge detection
- Hough transform para lineas
- Segmentacion de habitaciones

**Estado por defecto**: opt-in/offline-safe. Configure VITE_OPENCV_URL o VITE_ENABLE_OPENCV_CDN=true para cargar OpenCV.js.
**Uso**: Importar plano arquitectonico y detectar paredes automaticamente`,
    },
    {
      title: 'Capa 5: Agentes Autonomos',
      content: `Tres agentes especializados:
- **ShieldingDesignAgent**: Planificacion multi-paso de blindaje
- **ValidationAgent**: Validacion cruzada contra NCRP
- **CostOptimizationAgent**: Minimizacion de costo de materiales`,
    },
  ],
};

export default function DocsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState('methodology');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Documentacion Tecnica
            <Badge variant="outline" className="text-[10px]">v63</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="methodology" className="text-xs">
              <Beaker className="w-3.5 h-3.5 mr-1" /> Metodologia
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              <Code className="w-3.5 h-3.5 mr-1" /> APIs
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Shield className="w-3.5 h-3.5 mr-1" /> 5 Capas AI
            </TabsTrigger>
          </TabsList>

          {Object.entries(DOCS).map(([key, sections]) => (
            <TabsContent key={key} value={key} className="mt-3">
              <ScrollArea className="h-[55vh]">
                <div className="space-y-4 pr-3">
                  {sections.map((section, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-slate-50">
                      <h3 className="text-sm font-semibold text-slate-800 mb-2">{section.title}</h3>
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{section.content}</pre>
                      {section.refs && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {section.refs.map(ref => (
                            <Badge key={ref} variant="outline" className="text-[10px]">{ref}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
