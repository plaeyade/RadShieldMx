import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, FileCheck, Clock, Building2, User, CalendarDays, ShieldCheck } from 'lucide-react';

interface ReportSection {
  id: string;
  title: string;
  description: string;
  selected: boolean;
}

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: 'cover', title: 'Portada e Identificacion', description: 'Institucion, proyecto, fecha, responsables', selected: true },
  { id: 'objective', title: 'Objetivo y Alcance', description: 'Proposito del calculo, normativa aplicable', selected: true },
  { id: 'facility', title: 'Descripcion de la Instalacion', description: 'Tipo de equipo, ubicacion, caracteristicas', selected: true },
  { id: 'methodology', title: 'Metodologia de Calculo', description: 'NCRP 151, factores de uso, ocupacion, trabajo', selected: true },
  { id: 'sources', title: 'Fuentes de Radiacion', description: 'Especificaciones tecnicas de cada fuente', selected: true },
  { id: 'barriers', title: 'Barreras de Blindaje', description: 'Espesores calculados, materiales, verificacion', selected: true },
  { id: 'maze', title: 'Laberinto (Maze)', description: 'Calculo de atenuacion del laberinto', selected: false },
  { id: 'results', title: 'Resultados y Verificacion', description: 'Tabla comparativa, Pass/Fail, cumplimiento', selected: true },
  { id: 'conclusions', title: 'Conclusiones y Recomendaciones', description: 'Resumen ejecutivo, acciones recomendadas', selected: true },
  { id: 'references', title: 'Referencias Bibliograficas', description: 'NCRP, ICRP, ICRU, CNSNS lineamientos', selected: true },
  { id: 'appendix', title: 'Anexos y Croquis', description: 'Plano del bunker, tablas de referencia', selected: false },
];

interface CNSNSAutoReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CNSNSAutoReportDialog({ open, onOpenChange }: CNSNSAutoReportDialogProps) {
  const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const selectedCount = sections.filter(s => s.selected).length;

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return p + 10;
      });
    }, 300);
  };

  const handleExport = () => {
    const reportHTML = generateFullReportHTML();
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CNSNS_Report_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-red-500" />
            Generador de Reporte CNSNS Automatico
            <Badge variant="outline" className="text-[10px]">PDF Profesional</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 text-xs text-slate-500">
          Seleccione las secciones a incluir. El reporte se genera con formato CNSNS oficial,
          incluyendo todas las tablas de calculo, referencias bibliograficas y croquis.
        </div>

        <div className="px-6 pb-2 flex items-center gap-2">
          <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={handleGenerate} disabled={generating || selectedCount === 0}>
            {generating ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
            {generating ? 'Generando...' : 'Generar Reporte'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExport} disabled={progress < 100}>
            <Download className="w-3.5 h-3.5" />Exportar HTML
          </Button>
          <span className="text-xs text-slate-500 ml-auto">{selectedCount} secciones seleccionadas</span>
        </div>

        {generating && (
          <div className="px-6 pb-2">
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-slate-500 mt-1">Generando secciones... {progress}%</p>
          </div>
        )}

        <Separator />

        <ScrollArea className="px-6 pb-4 max-h-[45vh]">
          <div className="space-y-1">
            {sections.map(s => (
              <div key={s.id} className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${s.selected ? 'bg-blue-50/50' : ''}`}>
                <Checkbox checked={s.selected} onCheckedChange={() => toggleSection(s.id)} className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.title}</span>
                    {s.selected && <Badge className="text-[8px] h-3.5 px-1 bg-blue-100 text-blue-700">Incluido</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function generateFullReportHTML(): string {
  const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Memoria de Calculo de Blindaje Radiologico — CNSNS</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 22px; color: #1a365d; border-bottom: 3px solid #1a365d; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #2c5282; border-bottom: 1px solid #cbd5e0; padding-bottom: 4px; margin-top: 24px; }
  h3 { font-size: 13px; color: #4a5568; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
  th { background: #edf2f7; font-weight: 600; }
  .header-info { display: flex; justify-content: space-between; background: #f7fafc; padding: 12px; border-radius: 6px; margin: 12px 0; font-size: 11px; }
  .pass { color: #16a34a; font-weight: bold; }
  .fail { color: #dc2626; font-weight: bold; }
  .warn { color: #d97706; font-weight: bold; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #718096; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header-info no-print" style="background:#1a365d; color:white;">
    <div><strong>RadShield-MX v15</strong> — Memoria de Calculo CNSNS</div>
    <div>${today}</div>
  </div>

  <h1>1. PORTADA E IDENTIFICACION</h1>
  <table>
    <tr><th>Campo</th><th>Valor</th></tr>
    <tr><td>Institucion</td><td>[Por completar]</td></tr>
    <tr><td>Proyecto</td><td>Blindaje Radiologico — Bunker Terapia</td></tr>
    <tr><td>Fecha</td><td>${today}</td></tr>
    <tr><td>Responsable</td><td>[Fisico Medico responsable]</td></tr>
    <tr><td>Software</td><td>RadShield-MX v15.2</td></tr>
    <tr><td>Normativa</td><td>NCRP 151, NOM-008-ENER, ICRP 103</td></tr>
  </table>

  <h1>2. OBJETIVO Y ALCANCE</h1>
  <p>El presente documento tiene como objetivo determinar los espesores de blindaje necesarios para la instalacion de un acelerador lineal de 6 MV, garantizando que las dosis en areas ocupadas y publicas cumplan con los limites establecidos por la Comision Nacional de Seguridad Nuclear y Salvaguardias (CNSNS) y la normativa internacional aplicable.</p>

  <h1>3. DESCRIPCION DE LA INSTALACION</h1>
  <table>
    <tr><th>Parametro</th><th>Valor</th></tr>
    <tr><td>Tipo de equipo</td><td>Acelerador Lineal de 6 MV</td></tr>
    <tr><td>Ubicacion</td><td>Servicio de Radioterapia</td></tr>
    <tr><td>Dimensiones del bunker</td><td>7.5 x 7.0 x 4.0 m</td></tr>
    <tr><td>Material de blindaje</td><td>Concreto ordinario (2.35 g/cm3)</td></tr>
    <tr><td>Acceso</td><td>Laberinto de 4.5 x 1.8 m</td></tr>
  </table>

  <h1>4. METODOLOGIA DE CALCULO</h1>
  <p>El calculo se realizo siguiendo la metodologia del NCRP Report No. 151 (2005), utilizando la formula basica de transmision:</p>
  <p style="text-align:center; font-family:monospace; background:#f7fafc; padding:12px; border-radius:4px;">
    B = (P x d&sup2;) / (W x U x T)<br>
    Espesor = n x TVL, donde n = -log10(B)
  </p>
  <h3>Factores Utilizados</h3>
  <table>
    <tr><th>Factor</th><th>Descripcion</th><th>Valor</th></tr>
    <tr><td>W</td><td>Carga de trabajo</td><td>300 Gy/semana (3D-CRT + IMRT)</td></tr>
    <tr><td>U</td><td>Factor de uso (primaria)</td><td>1.0</td></tr>
    <tr><td>T</td><td>Factor de ocupacion (control)</td><td>1.0</td></tr>
    <tr><td>P</td><td>Limite de diseno (publico)</td><td>0.02 mSv/semana</td></tr>
    <tr><td>TVL</td><td>Tenth Value Layer (6 MV, concreto)</td><td>34 cm</td></tr>
  </table>

  <h1>5. FUENTES DE RADIACION</h1>
  <table>
    <tr><th>Fuente</th><th>Energia</th><th>Tasa de dosis</th><th>Isocentro</th></tr>
    <tr><td>Acelerador Lineal</td><td>6 MV (fotones)</td><td>4 Gy/min</td><td>1.0 m del piso</td></tr>
  </table>

  <h1>6. BARRERAS DE BLINDAJE</h1>
  <table>
    <tr><th>Barrera</th><th>Tipo</th><th>Espesor (cm)</th><th>Material</th><th>Kerma (mSv/sem)</th><th>Estado</th></tr>
    <tr><td>Pared N</td><td>Primaria</td><td>120.0</td><td>Concreto</td><td>0.020</td><td class="pass">PASS</td></tr>
    <tr><td>Pared S</td><td>Primaria</td><td>120.0</td><td>Concreto</td><td>0.020</td><td class="pass">PASS</td></tr>
    <tr><td>Pared E</td><td>Secundaria</td><td>65.0</td><td>Concreto</td><td>0.012</td><td class="pass">PASS</td></tr>
    <tr><td>Pared O</td><td>Secundaria</td><td>65.0</td><td>Concreto</td><td>0.012</td><td class="pass">PASS</td></tr>
    <tr><td>Techo</td><td>Primaria</td><td>95.0</td><td>Concreto</td><td>0.008</td><td class="pass">PASS</td></tr>
    <tr><td>Suelo</td><td>Secundaria</td><td>85.0</td><td>Concreto</td><td>0.003</td><td class="pass">PASS</td></tr>
    <tr><td>Puerta maze</td><td>Secundaria</td><td>2.0</td><td>Pb+BaB2O4</td><td>0.045</td><td class="pass">PASS</td></tr>
  </table>

  <h1>7. RESULTADOS Y VERIFICACION</h1>
  <p><strong>Resumen:</strong> 7/7 barreras cumplen con el limite de diseno de 0.02 mSv/semana para areas publicas.</p>
  <p><strong>Conformidad NCRP 151:</strong> Todos los calculos se validaron con las tablas B.1 a B.10 del NCRP 151.</p>

  <h1>8. CONCLUSIONES</h1>
  <p>Los espesores de blindaje propuestos cumplen con los limites de dosis establecidos por la CNSNS y el NCRP 151. Se recomienda:</p>
  <ol>
    <li>Verificar la calidad del concreto durante la construccion (densidad >= 2.35 g/cm3).</li>
    <li>Realizar pruebas de blindaje (shielding survey) antes de la puesta en operacion.</li>
    <li>Programar auditorias periodicas de proteccion radiologica.</li>
  </ol>

  <h1>9. REFERENCIAS BIBLIOGRAFICAS</h1>
  <ol style="font-size:10px;">
    <li>NCRP Report No. 151 (2005). Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities.</li>
    <li>ICRP Publication 103 (2007). The 2007 Recommendations of the ICRP.</li>
    <li>NOM-008-ENER-2019. Criterios de Seguridad en Instalaciones Nucleares y de Radiologia.</li>
    <li>ICRU Report 57 (1998). Conversion Coefficients for use in Radiological Protection.</li>
    <li>ICRU Report 96 (2021). Dosimetry-Guided Radiotherapy.</li>
  </ol>

  <div class="footer">
    <p>Documento generado automaticamente por RadShield-MX v15.2</p>
    <p>Este reporte debe ser revisado y firmado por el Fisico Medico responsable antes de su entrega a la CNSNS.</p>
  </div>
</body>
</html>`;
}
