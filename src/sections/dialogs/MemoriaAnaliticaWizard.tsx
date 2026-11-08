// =============================================================================
// MemoriaAnaliticaWizard — Wizard paso a paso para crear memoria de blindaje
// Basado en: NCRP 151, IAEA SRS 47, NOM-008-NUCL-2018, Protocolo RadSHIELD Mx
// Autor: RadShield-MX v13.7
// =============================================================================
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import FullscreenShell from '@/components/FullscreenShell';
import {
  FileText, ChevronRight, ChevronLeft, Building2, Atom, Shield, Users, Calculator, Download, BookOpen, FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { MATERIALS_DB, getMaterialById } from '@/lib/materialDatabase';
import {
  calculateLINACPrimaryBarrier, calculateLINACSecondaryBarrier,
  C1_IMRT_FACTORS
} from '@/lib/uaqProtocol';
import { stampNotForSignature } from '@/components/SyntheticResultBanner';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

const STEPS = [
  { id: 'info', label: 'Datos Generales', icon: FileText },
  { id: 'equipo', label: 'Equipo', icon: Atom },
  { id: 'habitacion', label: 'Habitación', icon: Building2 },
  { id: 'ocupacion', label: 'Ocupación', icon: Users },
  { id: 'material', label: 'Material', icon: Shield },
  { id: 'calculo', label: 'Cálculo', icon: Calculator },
  { id: 'resultado', label: 'Memoria', icon: BookOpen },
];

// ─── Tipo de habitación ───
const ROOM_TYPES = [
  { value: 'bunker_linac', label: 'Búnker LINAC (teleterapia)' },
  { value: 'bunker_gk', label: 'Búnker Gamma Knife' },
  { value: 'bunker_cobalt', label: 'Búnker Co-60' },
  { value: 'rx_diagnostico', label: 'Sala Rayos X diagnóstico' },
  { value: 'rx_interv', label: 'Sala RX intervencionista' },
  { value: 'mamografia', label: 'Sala Mamografía' },
  { value: 'tomografia', label: 'Sala Tomografía' },
  { value: 'pet_ct', label: 'Sala PET-CT' },
  { value: 'gammagrafia', label: 'Sala Gammagrafía' },
  { value: 'med_nuclear', label: 'Sala Medicina Nuclear' },
  { value: 'braquiterapia', label: 'Sala Braquiterapia HDR' },
  { value: 'dent panoramic', label: 'Sala Dental/Panorámica' },
];

export default function MemoriaAnaliticaWizard({ open, onOpenChange }: Props) {
  if (!open) return null;
  return (
    <FullscreenShell
      title="Memoria Analitica de Blindaje"
      subtitle="Wizard documental con calculo, normativa y export PDF - F394"
      icon={<BookOpen className="h-5 w-5" />}
      accentClassName="bg-indigo-600"
      traceId="f394-memoria-analitica-fullscreen-shell"
      onClose={() => onOpenChange(false)}
    >
      <WizardContent onOpenChange={onOpenChange} />
    </FullscreenShell>
  );
}

function WizardContent({ onOpenChange: _onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [memoria, setMemoria] = useState<Record<string, any>>({
    // Step 0: Info general
    nombreInstalacion: '', fecha: new Date().toISOString().slice(0, 10),
    responsable: '', firma: '', entidad: '', ciudad: '', estado: '',
    // Step 1: Equipo
    equipoTipo: 'linac', equipoMarca: 'Varian', equipoModelo: 'TrueBeam',
    energia_MV: '6', energiasAdicionales: '', maxDR_isocentro: '600',
    tecnica: 'VMAT', cargaSemanal_Gy: '450', pacientesSemana: '25',
    // Step 2: Habitación
    habitacionTipo: 'bunker_linac', dimensiones: '',
    paredes: 4, techo: true, piso: true, laberinto: true,
    // Step 3: Ocupación
    areasAdyacentes: [
      { nombre: 'Sala de control', tipo: 'control', T: 1.0, U: 0.25, d: 4.5, barrera: 'primaria' },
      { nombre: 'Pasillo exterior', tipo: 'publico', T: 0.2, U: 0.25, d: 3.5, barrera: 'secundaria' },
    ],
    // Step 4: Material
    materialId: 'concrete-normal-235',
    // Step 5: Resultados del cálculo
    resultados: null,
  });

  const update = useCallback((field: string, value: any) => {
    setMemoria(prev => ({ ...prev, [field]: value }));
  }, []);

  const material = getMaterialById(memoria.materialId) || MATERIALS_DB[0];
  const C1 = C1_IMRT_FACTORS[memoria.tecnica] || 1.0;
  const W_L = parseFloat(memoria.cargaSemanal_Gy || '0') * C1;

  // ─── Cálculo automático ───
  const calcularBarrera = useCallback((areaIdx: number) => {
    const area = memoria.areasAdyacentes[areaIdx];
    if (!area || !material) return null;
    const energy = parseInt(memoria.energia_MV);
    const P = 0.02; // mSv/sem (público por defecto)
    
    if (area.barrera === 'primaria') {
      return calculateLINACPrimaryBarrier({
        energy_MeV: energy, W_Gy_per_wk: parseFloat(memoria.cargaSemanal_Gy),
        technique: memoria.tecnica, P_mSv_per_wk: P,
        d_pri_m: area.d, U: area.U, T: area.T,
        F_conv_fraction: 0.3, F_IMRT_fraction: 0.7,
        materialCode: 'concrete235', // proxy
      });
    } else {
      return calculateLINACSecondaryBarrier({
        energy_MeV: energy, W_Gy_per_wk: parseFloat(memoria.cargaSemanal_Gy),
        technique: memoria.tecnica, P_mSv_per_wk: P,
        barrierType: 'scatter', materialCode: 'concrete235', T: area.T,
        d_L_m: area.d, d_sca_m: 1.0, d_sec_m: area.d, alpha_m2: 7.12e-4, F_cm2: 400,
      });
    }
  }, [memoria, material]);

  // ─── Exportar memoria como texto ───
  const exportMemoria = useCallback(() => {
    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '  MEMORIA ANALITICA DE CALCULO DE BLINDAJE',
      '  RadShield-MX v13.7 — Protocolo UAQ IGLIN-280880',
      '═══════════════════════════════════════════════════════════════',
      '',
      '1. DATOS GENERALES',
      `   Instalacion: ${memoria.nombreInstalacion}`,
      `   Fecha: ${memoria.fecha}`,
      `   Responsable: ${memoria.responsable}`,
      `   Entidad: ${memoria.entidad}`,
      `   Ciudad: ${memoria.ciudad}, ${memoria.estado}`,
      '',
      '2. EQUIPO',
      `   Tipo: ${memoria.equipoTipo}`,
      `   Marca/Modelo: ${memoria.equipoMarca} ${memoria.equipoModelo}`,
      `   Energia: ${memoria.energia_MV} MV`,
      `   Tecnica: ${memoria.tecnica} (C1 = ${C1})`,
      `   Carga semanal: ${memoria.cargaSemanal_Gy} Gy/sem`,
      `   Pacientes/sem: ${memoria.pacientesSemana}`,
      `   Carga modificada: ${W_L.toFixed(0)} Gy/sem eq.`,
      '',
      '3. MATERIAL DE BLINDAJE',
      `   Material: ${material?.name}`,
      `   Densidad: ${material?.density_g_cm3} g/cm³`,
      '',
      '4. AREAS ADYACENTES Y CALCULOS',
      ...memoria.areasAdyacentes.map((a: any, i: number) => {
        const r = calcularBarrera(i);
        return `   ${i+1}. ${a.nombre} (T=${a.T}, U=${a.U}, d=${a.d}m)\n       Tipo: ${a.barrera} | Espesor: ${r ? ((r as any).thickness_cm || (r as any).t_required_cm || 0).toFixed(2) : 'N/A'} cm`;
      }),
      '',
      '5. NORMATIVA APLICABLE',
      '   • NOM-008-NUCL-2018 — Seguridad Radiológica',
      '   • NCRP Report No. 151 — Structural Shielding Design',
      '   • IAEA Safety Reports Series No. 47',
      '   • Protocolo RadSHIELD Mx (basado en UAQ IGLIN-280880)',
      '',
      '═══════════════════════════════════════════════════════════════',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Memoria_Blindaje_${memoria.nombreInstalacion || 'RadShield'}_${memoria.fecha}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Memoria analítica exportada');
  }, [memoria, material, C1, W_L, calcularBarrera]);

  // ─── v14.2: Export PDF profesional ───
  const exportMemoriaPDF = useCallback(() => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const addLine = (text: string, fontSize = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
      doc.setFontSize(fontSize);
      doc.setFont(bold ? 'helvetica' : 'helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text(text, margin, y);
      y += fontSize * 0.5;
    };

    const addSeparator = () => { y += 2; doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageW - margin, y); y += 4; };

    // Portada
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, pageW, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('MEMORIA ANALITICA DE BLINDAJE', margin, 25);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text('RadShield-MX v14.2 — Protocolo RadSHIELD Mx', margin, 33);
    y = 55;

    // Sección 1: Datos Generales
    addLine('1. DATOS GENERALES', 13, true, [37, 99, 235]);
    addLine(`Instalación: ${memoria.nombreInstalacion || '—'}`, 10);
    addLine(`Fecha: ${memoria.fecha}`, 10);
    addLine(`Responsable: ${memoria.responsable || '—'}`, 10);
    addLine(`Entidad: ${memoria.entidad || '—'}`, 10);
    addLine(`Ubicación: ${memoria.ciudad || ''}, ${memoria.estado || ''}`, 10);
    addSeparator();

    // Sección 2: Equipo
    addLine('2. ESPECIFICACIONES DEL EQUIPO', 13, true, [37, 99, 235]);
    addLine(`Equipo: ${memoria.equipoTipo} — ${memoria.equipoMarca} ${memoria.equipoModelo}`, 10);
    addLine(`Energía: ${memoria.energia_MV} MV`, 10);
    addLine(`Técnica: ${memoria.tecnica} (C₁ = ${C1})`, 10);
    addLine(`Carga semanal W: ${memoria.cargaSemanal_Gy} Gy/sem`, 10);
    addLine(`Carga modificada W_L: ${W_L.toFixed(0)} Gy/sem eq.`, 10);
    addLine(`Pacientes/semana: ${memoria.pacientesSemana}`, 10);
    addSeparator();

    // Sección 3: Material
    addLine('3. MATERIAL DE BLINDAJE', 13, true, [37, 99, 235]);
    addLine(`Material seleccionado: ${material?.name || '—'}`, 10);
    addLine(`Densidad: ${material?.density_g_cm3 || '—'} g/cm³`, 10);
    addSeparator();

    // Sección 4: Cálculos
    addLine('4. AREAS ADYACENTES Y CALCULOS DE BARRERA', 13, true, [37, 99, 235]);
    memoria.areasAdyacentes.forEach((a: any, i: number) => {
      const r = calcularBarrera(i);
      const t_cm = r ? ((r as any).thickness_cm || (r as any).t_required_cm || 0) : 0;
      addLine(`${i + 1}. ${a.nombre}`, 10, true);
      addLine(`   Tipo: ${a.barrera} | T=${a.T} | U=${a.U} | d=${a.d}m`, 9);
      addLine(`   Espesor calculado: ${t_cm.toFixed(2)} cm (${(t_cm * 10).toFixed(0)} mm)`, 9);
      if (y > 240) { doc.addPage(); y = 20; }
    });
    addSeparator();

    // Sección 5: Normativa
    addLine('5. NORMATIVA APLICABLE', 13, true, [37, 99, 235]);
    addLine('• NOM-008-NUCL-2018 — Seguridad Radiológica', 9);
    addLine('• NCRP Report No. 151 — Structural Shielding Design', 9);
    addLine('• IAEA Safety Reports Series No. 47', 9);
    addLine('• Protocolo RadSHIELD Mx (UAQ IGLIN-280880)', 9);
    addLine('• AAPM TG 108 — PET/CT Shielding', 9);
    addSeparator();

    // Footer
    y = 270;
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text(`Generado por RadShield-MX v14.2 | ${new Date().toLocaleString('es-MX')}`, margin, y);
    doc.text(`Página ${doc.getNumberOfPages()}`, pageW - margin - 20, y);

    stampNotForSignature(doc);
    doc.save(`Memoria_Blindaje_${memoria.nombreInstalacion || 'RadShield'}_${memoria.fecha}.pdf`);
    toast.success('Memoria analítica PDF exportada');
  }, [memoria, material, C1, W_L, calcularBarrera]);


  return (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
          <div>
            <h2 className="text-lg font-bold">Memoria Analítica de Blindaje</h2>
            <p className="text-xs text-slate-500">Wizard paso a paso — NCRP 151 • IAEA SRS 47 • NOM-008-NUCL-2018 • Protocolo RadSHIELD Mx</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step === STEPS.length - 1 && (
            <>
              <Button variant="outline" size="sm" onClick={exportMemoria} className="text-xs h-8"><Download className="w-3 h-3 mr-1" /> Exportar .txt</Button>
              <Button variant="outline" size="sm" onClick={exportMemoriaPDF} className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"><FileDown className="w-3 h-3 mr-1" /> Exportar PDF</Button>
            </>
          )}
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div className="px-6 py-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <button onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === step ? 'bg-indigo-600 text-white shadow' :
                  i < step ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-400'
                }`}>
                <s.icon className="w-3 h-3" />{s.label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">

          {/* STEP 0: INFO GENERAL */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600"/>1. Datos Generales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Nombre de la instalación</Label><Input value={memoria.nombreInstalacion} onChange={e => update('nombreInstalacion', e.target.value)} placeholder="Ej: Hospital General de Oncología" className="h-10" /></div>
                <div><Label className="text-xs">Fecha</Label><Input type="date" value={memoria.fecha} onChange={e => update('fecha', e.target.value)} className="h-10" /></div>
                <div><Label className="text-xs">Responsable (Físico Médico)</Label><Input value={memoria.responsable} onChange={e => update('responsable', e.target.value)} placeholder="Nombre y cédula profesional" className="h-10" /></div>
                <div><Label className="text-xs">Entidad / Institución</Label><Input value={memoria.entidad} onChange={e => update('entidad', e.target.value)} placeholder="Nombre de la institución" className="h-10" /></div>
                <div><Label className="text-xs">Ciudad</Label><Input value={memoria.ciudad} onChange={e => update('ciudad', e.target.value)} className="h-10" /></div>
                <div><Label className="text-xs">Estado</Label>
                  <Select value={memoria.estado} onValueChange={v => update('estado', v)}><SelectTrigger className="h-10"><SelectValue placeholder="Seleccione"/></SelectTrigger>
                    <SelectContent>{['Aguascalientes','Baja California','Baja California Sur','Campeche','CDMX','Chiapas','Chihuahua','Coahuila','Colima','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco','México','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Card className="bg-blue-50 border-blue-200"><CardContent className="p-3 text-xs text-blue-800">
                <strong>Guía NCRP 151 §1.2:</strong> La memoria analítica debe incluir: datos de la instalación, equipo, diseño de la habitación, áreas ocupadas adyacentes, cálculos de blindaje, y referencias normativas. Este wizard guía cada paso conforme al protocolo UAQ (González Aguilar, 2023).
              </CardContent></Card>
            </div>
          )}

          {/* STEP 1: EQUIPO */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Atom className="w-5 h-5 text-indigo-600"/>2. Especificaciones del Equipo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Tipo de equipo</Label>
                  <Select value={memoria.equipoTipo} onValueChange={v => update('equipoTipo', v)}><SelectTrigger className="h-10"><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="linac">Acelerador Lineal (LINAC)</SelectItem><SelectItem value="co60">Unidad de Co-60</SelectItem><SelectItem value="gammaknife">Gamma Knife</SelectItem><SelectItem value="cyberknife">CyberKnife</SelectItem><SelectItem value="tomotherapy">TomoTherapy</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Marca</Label><Input value={memoria.equipoMarca} onChange={e => update('equipoMarca', e.target.value)} className="h-10" /></div>
                <div><Label className="text-xs">Modelo</Label><Input value={memoria.equipoModelo} onChange={e => update('equipoModelo', e.target.value)} className="h-10" /></div>
                <div><Label className="text-xs">Energía primaria (MV)</Label>
                  <Select value={memoria.energia_MV} onValueChange={v => update('energia_MV', v)}><SelectTrigger className="h-10"><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="4">4 MV</SelectItem><SelectItem value="6">6 MV</SelectItem><SelectItem value="10">10 MV</SelectItem><SelectItem value="15">15 MV</SelectItem><SelectItem value="18">18 MV</SelectItem><SelectItem value="25">25 MV</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Técnica principal</Label>
                  <Select value={memoria.tecnica} onValueChange={v => update('tecnica', v)}><SelectTrigger className="h-10"><SelectValue/></SelectTrigger>
                    <SelectContent>{Object.entries(C1_IMRT_FACTORS).map(([k, v]) => <SelectItem key={k} value={k}>{k} (C₁ = {v})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Tasa dosis máxima (Gy/min)</Label><Input type="number" value={memoria.maxDR_isocentro} onChange={e => update('maxDR_isocentro', e.target.value)} className="h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Carga de trabajo W (Gy/sem)</Label><Input type="number" value={memoria.cargaSemanal_Gy} onChange={e => update('cargaSemanal_Gy', e.target.value)} className="h-10" /></div>
                <div><Label className="text-xs">Pacientes estimados/sem</Label><Input type="number" value={memoria.pacientesSemana} onChange={e => update('pacientesSemana', e.target.value)} className="h-10" /></div>
              </div>
              {C1 > 1 && (
                <Card className="bg-amber-50 border-amber-200"><CardContent className="p-3 text-xs text-amber-800">
                  <strong>Factor C₁ aplicado ({C1}):</strong> Para {memoria.tecnica}, la carga de trabajo modificada es <strong>{W_L.toFixed(0)} Gy/sem eq.</strong> (NCRP 151 §4.8.5, Protocolo UAQ §4.8.5)
                </CardContent></Card>
              )}
            </div>
          )}

          {/* STEP 2: HABITACIÓN */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600"/>3. Diseño de la Habitación</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Tipo de habitación</Label>
                  <Select value={memoria.habitacionTipo} onValueChange={v => update('habitacionTipo', v)}><SelectTrigger className="h-10"><SelectValue/></SelectTrigger>
                    <SelectContent>{ROOM_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Dimensiones aprox. (m)</Label><Input value={memoria.dimensiones} onChange={e => update('dimensiones', e.target.value)} placeholder="Largo × Ancho × Alto" className="h-10" /></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Paredes blindadas', key: 'paredes', val: memoria.paredes },
                  { label: 'Techo blindado', key: 'techo', val: memoria.techo },
                  { label: 'Piso blindado', key: 'piso', val: memoria.piso },
                  { label: 'Laberinto', key: 'laberinto', val: memoria.laberinto },
                ].map(item => (
                  <button key={item.key} onClick={() => update(item.key, !item.val)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${item.val ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50 opacity-50'}`}>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.val ? 'Sí' : 'No'}</div>
                  </button>
                ))}
              </div>
              <Card className="bg-blue-50 border-blue-200"><CardContent className="p-3 text-xs text-blue-800">
                <strong>NCRP 151 §3:</strong> El diseño debe considerar: número de barreras, tipo (primaria/secundaria), laberinto para neutrones si E {'>'} 10 MV, y skyshine si el techo no es blindaje total.
              </CardContent></Card>
            </div>
          )}

          {/* STEP 3: OCUPACIÓN */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600"/>4. Áreas Ocupadas Adyacentes</h3>
              {memoria.areasAdyacentes.map((area: any, i: number) => (
                <Card key={i} className="border-slate-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Área {i+1}: {area.nombre}</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-5 gap-3 pt-0">
                    <div><Label className="text-xs">Nombre</Label><Input value={area.nombre} onChange={e => { const arr = [...memoria.areasAdyacentes]; arr[i].nombre = e.target.value; update('areasAdyacentes', arr); }} className="h-9" /></div>
                    <div><Label className="text-xs">Factor T</Label><Input type="number" step="0.05" value={area.T} onChange={e => { const arr = [...memoria.areasAdyacentes]; arr[i].T = parseFloat(e.target.value); update('areasAdyacentes', arr); }} className="h-9" /></div>
                    <div><Label className="text-xs">Factor U</Label><Input type="number" step="0.05" value={area.U} onChange={e => { const arr = [...memoria.areasAdyacentes]; arr[i].U = parseFloat(e.target.value); update('areasAdyacentes', arr); }} className="h-9" /></div>
                    <div><Label className="text-xs">Distancia d (m)</Label><Input type="number" step="0.1" value={area.d} onChange={e => { const arr = [...memoria.areasAdyacentes]; arr[i].d = parseFloat(e.target.value); update('areasAdyacentes', arr); }} className="h-9" /></div>
                    <div><Label className="text-xs">Tipo barrera</Label>
                      <Select value={area.barrera} onValueChange={v => { const arr = [...memoria.areasAdyacentes]; arr[i].barrera = v; update('areasAdyacentes', arr); }}><SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="primaria">Primaria</SelectItem><SelectItem value="secundaria">Secundaria</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={() => update('areasAdyacentes', [...memoria.areasAdyacentes, { nombre: 'Nueva área', tipo: 'publico', T: 0.2, U: 0.25, d: 3.0, barrera: 'secundaria' }])} className="text-xs">+ Agregar área</Button>
              <Card className="bg-blue-50 border-blue-200"><CardContent className="p-3 text-xs text-blue-800">
                <strong>NCRP 151 §4.2:</strong> T = factor de ocupación, U = factor de uso. Para áreas controladas T=1, público T=0.2, estacionamiento T=0.05. Pared primaria U=0.25 (una dirección), secundaria U=1.0.
              </CardContent></Card>
            </div>
          )}

          {/* STEP 4: MATERIAL */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600"/>5. Selección del Material de Blindaje</h3>
              <div className="grid grid-cols-1 gap-2">
                {MATERIALS_DB.map(m => (
                  <button key={m.id} onClick={() => update('materialId', m.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all ${memoria.materialId === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        m.category === 'concrete' ? 'bg-gray-500' : m.category === 'barite' ? 'bg-amber-600' : m.category === 'steel' ? 'bg-blue-600' : m.category === 'lead' ? 'bg-purple-600' : m.category === 'composite' ? 'bg-green-600' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-xs text-slate-500">{m.density_g_cm3} g/cm³ | {m.normativa.join(', ')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">TVL 6MV</div>
                      <div className="text-sm font-mono">{m.TVL_primary_cm['6MV'] || 'N/A'} cm</div>
                    </div>
                  </button>
                ))}
              </div>
              <Card className="bg-blue-50 border-blue-200"><CardContent className="p-3 text-xs text-blue-800">
                <strong>NCRP 151 Tabla B.1:</strong> Los TVL listados son para radiación primaria. Para radiación secundaria dispersa, multiplicar por 0.85. Materiales comerciales: verificar la fuente de cada TVL; los bloques TM NIPOL usan la envolvente por masa de concreto y acero hasta validar sus mediciones (docs/validacion-bloques-hd.md).
              </CardContent></Card>
            </div>
          )}

          {/* STEP 5: CÁLCULO */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-indigo-600"/>6. Cálculo de Blindajes</h3>
              <Button onClick={() => {
                const nuevosResultados = memoria.areasAdyacentes.map((_: any, i: number) => calcularBarrera(i));
                update('resultados', nuevosResultados);
                toast.success('Cálculos completados para todas las áreas');
              }} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10"><Calculator className="w-4 h-4 mr-2"/>Ejecutar Cálculos</Button>

              {memoria.resultados && memoria.resultados.map((r: any, i: number) => {
                const area = memoria.areasAdyacentes[i];
                if (!r) return null;
                return (
                  <Card key={i} className="border-slate-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between"><span>{area.nombre} — {area.barrera === 'primaria' ? 'Barrera Primaria' : 'Barrera Secundaria'}</span><Badge variant={(r as any).thickness_cm > 0 || (r as any).t_required_cm > 0 ? 'default' : 'secondary'}>{((r as any).thickness_cm || (r as any).t_required_cm || 0).toFixed(2)} cm</Badge></CardTitle></CardHeader>
                    <CardContent className="pt-0 text-xs space-y-1">
                      <div>Transmisión B: {r.B?.toExponential(2)}</div>
                      <div>Número de TVL: {r.n?.toFixed(2)}</div>
                      <div>Espesor: <strong>{((r as any).thickness_cm || (r as any).t_required_cm || 0).toFixed(2)} cm</strong> ({(((r as any).thickness_cm || (r as any).t_required_cm || 0) * 10).toFixed(0)} mm)</div>
                      {r.C1 && <div>Carga modificada: {r.W_modified?.toFixed(0)} Gy/sem (C₁={r.C1})</div>}
                      <div className="text-slate-500 mt-1">Material: {material?.name} | TVL: {material?.TVL_primary_cm[`${memoria.energia_MV}MV`]} cm</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* STEP 6: RESULTADO / MEMORIA */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-600"/>7. Resumen de la Memoria Analítica</h3>
              <Card className="border-indigo-200">
                <CardContent className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Instalación:</span><span>{memoria.nombreInstalacion || 'Sin nombre'}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Equipo:</span><span>{memoria.equipoMarca} {memoria.equipoModelo} ({memoria.energia_MV} MV)</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Técnica:</span><span>{memoria.tecnica} (C₁ = {C1})</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Carga modificada:</span><span><strong>{W_L.toFixed(0)} Gy/sem eq.</strong></span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Material:</span><span>{material?.name} ({material?.density_g_cm3} g/cm³)</span></div>
                  <div className="pt-2">
                    <div className="font-medium mb-2">Barreras calculadas:</div>
                    {memoria.resultados ? memoria.resultados.map((r: any, i: number) => {
                      if (!r) return null;
                      const a = memoria.areasAdyacentes[i];
                      return <div key={i} className="flex justify-between text-xs py-1"><span>• {a.nombre}</span><span className="font-mono">{((r as any).thickness_cm || (r as any).t_required_cm || 0).toFixed(2)} cm</span></div>;
                    }) : <div className="text-xs text-slate-400">Ejecute los cálculos en el paso anterior</div>}
                  </div>
                  <Separator />
                  <div className="text-xs text-slate-500 space-y-1">
                    <div><strong>Normativa aplicable:</strong></div>
                    <div>• NOM-008-NUCL-2018 — Seguridad Radiológica</div>
                    <div>• NCRP Report No. 151 (2005) — Structural Shielding Design</div>
                    <div>• IAEA Safety Reports Series No. 47 (2006)</div>
                    <div>• Protocolo RadSHIELD Mx — González Aguilar UAQ (2023)</div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button onClick={exportMemoria} variant="default" className="flex-1"><Download className="w-4 h-4 mr-2"/>Exportar (.txt)</Button>
                <Button onClick={exportMemoriaPDF} variant="outline" className="flex-1 text-red-600 border-red-300 hover:bg-red-50"><FileDown className="w-4 h-4 mr-2"/>Exportar PDF</Button>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button variant="outline" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="h-9"><ChevronLeft className="w-4 h-4 mr-1"/>Anterior</Button>
            <div className="text-xs text-slate-400 self-center">Paso {step + 1} de {STEPS.length}</div>
            <Button variant="default" size="sm" onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1} className="h-9 bg-indigo-600 hover:bg-indigo-700">Siguiente<ChevronRight className="w-4 h-4 ml-1"/></Button>
          </div>
        </div>
       </ScrollArea>
    </>
  );
}
