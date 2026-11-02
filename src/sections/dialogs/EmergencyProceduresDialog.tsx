/**
 * RadShield-MX v35 - Emergency Procedures & Incident Response
 * CNSNS LA-007/01 compliant protocols
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertTriangle, Phone, ShieldAlert, ChevronRight, CheckCircle2, Siren, Radio, Zap, Droplets, AlertOctagon, UserX, Stethoscope, FileText, Eye, Hand, HeartPulse, Ban, MapPin, Footprints, Shield, Activity } from 'lucide-react';

const SCENARIOS = [
  { id:'hdr', title:'Falla Fuente HDR (Ir-192/Co-60)', desc:'Fuente no retorna al safe post-tratamiento. Emergencia critica.', sev:'critical' as const, cat:'Braquiterapia', I:Radio,
    ind:['Alarma SOURCE NOT HOME en consola','Luz roja en unidad HDR','Timer excedido','Paciente reporta calor/dolor'], imm:['NO ABANDONAR LA SALA','Presionar boton EMERGENCIA','NO retraer manualmente','Tranquilizar al paciente','Activar plan emergencias hospital'],
    steps:[{n:1,t:'Estabilizar',d:['Presionar emergencia consola','Verificar NO retorno','Tranquilizar paciente (NO moverse)','Alejar personal no esencial'],ic:ShieldAlert},{n:2,t:'Notificar',d:['Fisico Medico guardia (Ext.5500)','Responsable Proteccion Radiologica (Ext.5501)','Comite Emergencias Hospital','CNSNS dentro 2h'],ic:Phone},{n:3,t:'Evaluar fuente',d:['Verificar posicion con fluoroscopio portatil','Si en applicador: mantener inmovil','Si desconectada: pinzas de 1m','NO tocar con manos desprotegidas'],ic:Eye},{n:4,t:'Retiro (autorizado)',d:['Entrar con dosimetro activo (alarma 1mSv/h)','Pinzas de tungsteno >1m','Colocar en contenedor emergencia (pig)','Verificar con monitor GM','Cerrar y candar contenedor'],ic:Hand},{n:5,t:'Atencion paciente',d:['Evaluar tiempo exposicion desde inicio','Calcular dosis estimada (tiempo x tasa)','Documentar posicion exacta y tiempo','Notificar oncologo radioterapeuta','Programar seguimiento dosimetrico'],ic:HeartPulse},{n:6,t:'Reporte y documentacion',d:['Formato CNSNS F-IR-01','Documentar: fecha,hora,personal,secuencia','Registrar lecturas dosimetricas','CNSNS dentro 24h','Investigacion causa raiz (RCA)'],ic:FileText}],
    contacts:['Fisico Medico Guardia|Evaluacion tecnica|Ext.5500','RPR|Coordinacion respuesta|Ext.5501','CNSNS|Notificacion regulatoria|55-5095-3200'],
    refs:'CNSNS LA-007/01 Art.12-15, NCRP 155, IAEA RS-G-1.3', prev:['Check source diario','Prueba timer semanal','Inspeccion cable mensual','Simulacro trimestral HDR','Calibracion dosimetro trimestral'] },
  { id:'linac', title:'Sobreexposicion LINAC', desc:'Dosis administrada difiere significativamente de la prescrita.', sev:'critical' as const, cat:'Terapia', I:Zap,
    ind:['MU diferente al plan >5%','Dosis independiente desviada >5%','Paciente reporta sintomas inusuales','Paciente equivocado o fraccion incorrecta'], imm:['DETENER tratamiento inmediatamente','NO continuar sin evaluacion completa','Documentar MU administrados y tiempo','Preservar TODAS las pantallas y logs','Evaluar paciente antes de retirar del bunker'],
    steps:[{n:1,t:'Detener y preservar',d:['Beam-off inmediato (STOP)','NO apagar LINAC — preservar logs','Fotografia de consola con valores MU','Registrar tiempo exacto de detencion'],ic:Ban},{n:2,t:'Evaluar paciente',d:['Verificar identidad (2 identificadores)','Signos vitales','NO administrar resto ese dia si hay duda'],ic:Stethoscope},{n:3,t:'Analisis de dosis',d:['Comparar MU admin vs planificados','Recalcular dosis con plan original','Usar R&V para reconstruir dosis real','Consultar con oncologo RT'],ic:Activity},{n:4,t:'Accion correctiva',d:['Dosis < prescrita: recalcular faltante','Dosis > prescrita: evaluar toxicidad','Modificar plan si necesario','Informar paciente — consentimiento continuar'],ic:CheckCircle2},{n:5,t:'Reporte regulatorio',d:['Reportar CNSNS si excede 25% (SA-3)','Formato incidente detallado','Reportar al fabricante si falla tecnica','Investigacion RCA','Implementar acciones correctivas'],ic:FileText}],
    contacts:['Oncologo RT|Decision medica|Ext.4500','Fisico Medico|Recalculo dosis|Ext.5500','CNSNS|Notificacion sobreexposicion|55-5095-3200'],
    refs:'CNSNS LA-007/01 Art.8, IAEA GS-G-3.1', prev:['Triple-check antes de cada tratamiento','R&V obligatorio','Imagen portico antes 1ra fraccion y semanal','Checklist LINAC diario','Auditoria mensual fracciones admin vs plan'] },
  { id:'spill', title:'Derrame Radiofarmaco (F-18 FDG)', desc:'Derrame accidental de solucion radiactiva durante preparacion/inyeccion.', sev:'high' as const, cat:'Medicina Nuclear', I:Droplets,
    ind:['Liquido derramado visible','Monitor de area elevado anormalmente','Wipe test positivo','Ruptura vial/jeringa'], imm:['NOTIFICAR "DERRAME RADIOACTIVO"','Restringir acceso al area','Colocar material absorbente sobre derrame','NO caminar sobre area contaminada','Llamar Fisico Medico / RPR'],
    steps:[{n:1,t:'Aislamiento del area',d:['Delimitar con cinta CONTAMINADO','Cerrar ventilacion local','Evacuar personal no esencial','Mover paciente a area limpia si aplica'],ic:ShieldAlert},{n:2,t:'Proteccion personal',d:['Guantes dobles','Bota proteccion sobre zapatos','Proteccion ocular si riesgo salpicadura','Verificar dosimetro activo'],ic:Shield},{n:3,t:'Contencion y limpieza',d:['Toallas absorbentes (afuera hacia adentro)','Usar kit derrames radiactivos','Medir tasa dosis antes de limpiar','Agua y detergente de adentro hacia afuera','Material en bolsa desechos amarilla'],ic:Droplets},{n:4,t:'Verificacion descontaminacion',d:['Wipe test area 50x50 cm alrededor','Monitor GM para dosis residual','Limite: < 2 Bq/cm2 (beta/gamma)','Repetir si excede','Documentar lecturas antes/despues'],ic:Activity},{n:5,t:'Dosimetria y reporte',d:['Evaluar dosimetria personal involucrado','Estimar dosis piel y extremidades','SA-2 si > 150 mSv a piel','Formato incidente derrame'],ic:FileText}],
    contacts:['Fisico Medico/RPR|Supervision descontaminacion|Ext.5500','Jefe Medicina Nuclear|Coordinacion medica|Ext.4400','CNSNS|Notificacion regulatoria|55-5095-3200'],
    refs:'CNSNS LA-004/01, ICRP 140, NCRP 155', prev:['Luer-Lock en todo momento','Bandejas forradas absorbente','Kit derrames radiactivos disponible','Capacitacion trimestral manejo derrames','Escudo Pb durante manipulacion'] },
  { id:'leak', title:'Fuga de Fuente Sellada (Co-60/Cs-137)', desc:'Fuente sellada con fuga detectada por wipe test.', sev:'critical' as const, cat:'Fuentes Selladas', I:AlertOctagon,
    ind:['Wipe test positivo > 1850 Bq','Tasa dosis de fondo elevada','Deterioro fisico visible (oxido/corrosion)','Leak test periodico positivo'], imm:['AISLAR fuente inmediatamente — NO manipular','Restringir acceso al area','Llamar RPR y fabricante de la fuente','Documentar lecturas dosimetricas','Preparar contenedor transporte'],
    steps:[{n:1,t:'Aislamiento y evaluacion',d:['Alejar personal del area','Medir tasa dosis a 1m y 30 cm','Identificar numero de serie y actividad','NO tocar la fuente'],ic:ShieldAlert},{n:2,t:'Prueba confirmacion',d:['Wipe test 5 puntos alrededor','Contador gamma well (NaI/HPGe)','Si > 1850 Bq: CONFIRMAR fuga','Documentar todos los valores'],ic:Activity},{n:3,t:'Contencion',d:['Colocar en contenedor almacenamiento original','Alternativo con equivalente blindaje si danado','Verificar tasa exterior dentro limites transporte','Etiquetar "FUENTE CON FUGA - NO USAR"'],ic:Shield},{n:4,t:'Notificaciones',d:['CNSNS dentro 2 horas','Fabricante para instrucciones retorno','Transportista autorizado radionucleidos','Documentar: actividad,fecha,serie,lote'],ic:Phone},{n:5,t:'Disposicion',d:['Solicitar recoleccion fabricante/gestor','Declaracion transporte TDG/IAEA SSR-6','Almacenamiento temporal con monitoreo','Confirmacion recepcion destinatario'],ic:FileText}],
    contacts:['RPR|Evaluacion y decision|Ext.5501','Fabricante|Retorno fuente|Ver contrato','CNSNS|Notificacion obligatoria|55-5095-3200'],
    refs:'CNSNS LA-007/01 Art.10, IAEA SSR-6, 10 CFR 30', prev:['Wipe test semestral obligatorio','Inspeccion visual mensual','Registro condiciones adversas','Mantenimiento contenedor','Inventario continuo (guia)'] },
  { id:'wrong', title:'Irradiacion Paciente Equivocado', desc:'Paciente irradiado por error de identidad, plan o fraccion.', sev:'critical' as const, cat:'General', I:UserX,
    ind:['Discrepancia nombre vs plan de tratamiento','Setup no coincide con imagen referencia','Tratamiento en fraccion equivocada','Plan equivocado cargado en LINAC'], imm:['DETENER INMEDIATAMENTE si en curso','NO retirar sin evaluacion completa','Preservar TODOS los registros: consola,R&V,imagenes','Llamar Fisico Medico y Oncologo RT','Aislar area de tratamiento'],
    steps:[{n:1,t:'Identificacion y preservacion',d:['Verificar identidad con 2 identificadores unicos','Comparar: nombre,fecha nacimiento,no. historia','Imprimir/fotografiar todas las pantallas','NO borrar ni modificar registros'],ic:Eye},{n:2,t:'Evaluar dosis erronea',d:['Obtener parametros reales: MU,campos,angulos','Recalcular dosis con parametros reales','Identificar organos en riesgo (OAR) no planificados','Consultar oncologo sobre consecuencias'],ic:Activity},{n:3,t:'Atencion paciente afectado',d:['Evaluar medicamente al paciente irradiado','Determinar consecuencias clinicas dosis recibida','Informar al paciente/familiares de manera clara','Programar seguimiento medico segun dosis'],ic:HeartPulse},{n:4,t:'Acciones correctivas sistema',d:['Identificar causa raiz: humano,sistema,ambos','Revisar protocolo time-out (triple-check)','Evaluar configuracion R&V','Implementar escaneo codigo de barras'],ic:CheckCircle2},{n:5,t:'Reporte regulatorio',d:['Reportar CNSNS como SA-3 dentro 24h','Formato detallado: paciente,dosis,OAR,causa','Notificar Comite de Calidad','Analisis FMEA prevencion recurrencia'],ic:FileText}],
    contacts:['Oncologo RT|Evaluacion medica|Ext.4500','Fisico Medico|Recalculo dosimetrico|Ext.5500','CNSNS|Notificacion regulatoria|55-5095-3200'],
    refs:'CNSNS LA-007/01 Art.9, ICRP 85, WHO QA Radiotherapy', prev:['Time-out (triple-check) obligatorio','Verificacion pulsera + 2 IDs unicos','Imagen portico cada fraccion','R&V con bloqueo discrepancia','Auditoria semanal plan vs admin'] },
  { id:'lost', title:'Perdida o Robo de Fuente', desc:'Fuente radiactiva sellada perdida,robada o no en ubicacion.', sev:'critical' as const, cat:'Fuentes Selladas', I:MapPin,
    ind:['Fuente no en ubicacion asignada','Discrepancia inventario fisico vs registro','Senales forzamiento en area almacenamiento','Alarma seguridad activada'], imm:['NOTIFICAR RPR y Director inmediatamente','Contactar CNSNS y policia local','NO buscar sin supervision RPR + dosimetria','Cerrar y asegurar puertas area almacenamiento'],
    steps:[{n:1,t:'Notificacion inmediata',d:['RPR Ext.5501','Director Hospital Ext.1000','CNSNS 55-5095-3200 (dentro 1h)','Policia local 911'],ic:Phone},{n:2,t:'Busqueda controlada',d:['Rastrear ultimo movimiento documentado','Buscar con monitor GM portatil','Dosimetro activo obligatorio durante busqueda','NO buscar sin dosimetro'],ic:Footprints},{n:3,t:'Evaluacion riesgo publico',d:['Calcular tasa dosis a 1m de fuente perdida','Identificar areas publicas cercanas hospital','Coordinar con autoridades civiles si riesgo','Punto recoleccion si encontrada por civiles'],ic:MapPin},{n:4,t:'Investigacion',d:['Revisar camaras de seguridad','Entrevistar personal con acceso autorizado','Revisar registros entrada/salida','Evaluar si control de acceso comprometido'],ic:FileText},{n:5,t:'Reporte y seguimiento',d:['Reporte inicial CNSNS 1 hora','Detallado 24 horas','Busqueda con autoridades si no encontrada','Evaluar notificacion publica','Fortalecer control acceso e inventario'],ic:Shield}],
    contacts:['Director Hospital|Decision institucional|Ext.1000','RPR|Coordinacion tecnica|Ext.5501','CNSNS Emergencias|Regulatorio|55-5095-3200','Policia Local|Seguridad|911'],
    refs:'CNSNS LA-007/01 Art.11, IAEA NSS-11, Codigo Penal Art.362', prev:['Control acceso biometrico','Inventario fisico diario firmado','Camara seguridad continua','Doble llave alta actividad','Portal monitor salida'] },
];

const SEV: Record<string,{c:string;bg:string;b:string;l:string}> = {
  critical:{c:'text-red-700',bg:'bg-red-50',b:'border-red-300',l:'CRITICA'},
  high:{c:'text-orange-700',bg:'bg-orange-50',b:'border-orange-300',l:'ALTA'},
  medium:{c:'text-amber-700',bg:'bg-amber-50',b:'border-amber-300',l:'MEDIA'},
};

export default function EmergencyProceduresDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [sel, setSel] = useState<number|null>(null);
  const [fs, setFs] = useState('all');

  const filt = SCENARIOS.filter((x:any) => fs === 'all' || x.sev === fs);
  const sc = sel !== null ? SCENARIOS[sel] : null;
  const s = sc ? (SEV as any)[sc.sev] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Siren className="w-5 h-5 text-red-600" /> Emergency Procedures &amp; Incident Response
            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">v35</span>
          </DialogTitle>
        </DialogHeader>

        {!sc ? (
          <div className="px-5 py-3 overflow-auto">
            <div className="flex gap-2 mb-3">
              <select value={fs} onChange={e=>setFs(e.target.value)} className="text-[10px] border rounded py-1 px-2">
                <option value="all">Todas severidades</option><option value="critical">Critica ({SCENARIOS.filter(x=>x.sev==='critical').length})</option><option value="high">Alta ({SCENARIOS.filter(x=>x.sev==='high').length})</option>
              </select>
              <span className="text-[10px] text-slate-500 ml-auto">{filt.length} escenarios</span>
            </div>
            <div className="space-y-1.5">
              {filt.map((sc:any) => {
                const sv = (SEV as any)[sc.sev];
                const gIdx = SCENARIOS.findIndex((x:any) => x.id === sc.id);
                return (
                  <button key={sc.id} onClick={()=>setSel(gIdx)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left hover:shadow-sm ${sv.bg} ${sv.b}`}>
                    <sc.I className={`w-5 h-5 ${sv.c} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${sv.c}`}>{sc.title}</span>
                        <span className={`text-[7px] px-1 rounded ${sv.bg} ${sv.c} border`}>{sv.l}</span>
                        <span className="text-[7px] text-slate-500 border px-1 rounded">{sc.cat}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{sc.desc}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${sv.c}`} />
                  </button>
                );
              })}
            </div>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-700 font-bold text-[10px] mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> PROTOCOLO GENERAL DE EMERGENCIA</div>
              <div className="text-[9px] text-red-700 space-y-0.5">
                <p><strong>1.DETENER</strong> operacion. <strong>2.NOTIFICAR</strong> Fisico Medico y RPR.</p>
                <p><strong>3.PROTEGER</strong> al personal. <strong>4.MEDIR</strong> con monitor GM.</p>
                <p><strong>5.DOCUMENTAR</strong> todo. <strong>6.NOTIFICAR</strong> CNSNS (1-24h).</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
              {[{n:'CNSNS',p:'55-5095-3200',a:'Dr.Barragan 779,CDMX'},{n:'Cruz Roja',p:'065',a:'Nacional'},{n:'Policia Federal',p:'911',a:'Nacional'},{n:'Bomberos CDMX',p:'068',a:'CDMX'}].map((c,i) => (
                <div key={i} className="border rounded p-2"><div className="font-semibold text-[10px]">{c.n}</div><div className="text-blue-600 font-semibold">{c.p}</div><div className="text-slate-400">{c.a}</div></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-3 overflow-auto space-y-3">
            <Button size="sm" variant="outline" className="h-6 text-[9px]" onClick={()=>setSel(null)}>&larr; Regresar</Button>
            <div className={`${s.bg} ${s.b} border rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <sc.I className={`w-5 h-5 ${s.c}`} />
                <h3 className={`text-sm font-bold ${s.c}`}>{sc.title}</h3>
                <span className={`text-[8px] px-1 rounded ${s.bg} ${s.c}`}>{s.l}</span>
              </div>
              <p className="text-[10px] text-slate-600">{sc.desc}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-2">
              <div className="text-red-700 font-bold text-[10px] mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ACCIONES INMEDIATAS</div>
              {sc.imm.map((a:string,i:number) => <div key={i} className="text-[9px] text-red-700 flex gap-1"><span className="font-bold">{i+1}.</span>{a}</div>)}
            </div>

            <div className="text-[11px] font-semibold text-slate-700">Indicadores de alerta</div>
            {sc.ind.map((ind:string,i:number) => <div key={i} className="flex items-start gap-1 text-[10px]"><AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />{ind}</div>)}

            <div className="text-[11px] font-semibold text-slate-700">Procedimiento paso a paso</div>
            {sc.steps.map((st:any,i:number) => (
              <div key={i} className="border rounded overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border-b">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold">{st.n}</div>
                  <span className="text-[10px] font-semibold">{st.t}</span>
                </div>
                <div className="px-3 py-1">{st.d.map((d:string,j:number) => <div key={j} className="flex gap-1 text-[9px]"><ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />{d}</div>)}</div>
              </div>
            ))}

            <div className="text-[11px] font-semibold text-slate-700">Contactos de emergencia</div>
            <div className="grid grid-cols-3 gap-1.5">
              {sc.contacts.map((c:string,i:number) => { const [n,r,p] = c.split('|'); return (
                <div key={i} className="border rounded p-2 cursor-pointer hover:bg-blue-50" onClick={()=>toast.info('Llamar: '+p)}>
                  <div className="text-[10px] font-semibold">{n}</div><div className="text-[8px] text-slate-500">{r}</div><div className="text-[9px] text-blue-600 font-semibold">{p}</div>
                </div>
              );})}
            </div>

            <div className="text-[9px] text-slate-500 bg-slate-50 rounded p-2 border"><strong>Referencia normativa:</strong> {sc.refs}</div>

            <div><div className="text-[11px] font-semibold text-emerald-700">Medidas de prevencion</div>
              {sc.prev.map((p:string,i:number) => <div key={i} className="flex gap-1 text-[9px] text-emerald-700"><CheckCircle2 className="w-3 h-3 shrink-0" />{p}</div>)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
