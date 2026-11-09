/**
 * v104: Revit Add-in C# — Bidirectional BIM Integration
 * Template code and RS shared parameters for Autodesk Revit
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Building2, Code, Copy, CheckCircle, FileCode, BookOpen } from 'lucide-react';

const REVIT_CS_TEMPLATE = `using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using System.Linq;

namespace RadShieldRevitAddin
{
  [Transaction(TransactionMode.Manual)]
  public class ImportShieldingCmd : IExternalCommand
  {
    public Result Execute(ExternalCommandData cd, ref string msg, ElementSet elements)
    {
      UIDocument uidoc = cd.Application.ActiveUIDocument;
      Document doc = uidoc.Document;

      // 1. Read RadShield JSON export
      var json = File.ReadAllText(@"C:\\RadShield\\export.json");
      var data = JsonConvert.DeserializeObject<RadShieldExport>(json);

      using (Transaction tx = new Transaction(doc, "RadShield Import"))
      {
        tx.Start();
        foreach (var barrier in data.barriers)
        {
          // Create wall with shielding thickness
          WallType wt = GetOrCreateShieldingWallType(doc, barrier.materialCode, barrier.thickness_mm);
          // Coordenadas del lienzo en px -> m con la escala del plano -> pies (unidad interna de Revit).
          // (Antes se dividian los px entre 304.8 como si fueran mm.)
          double k = data.scale_m_per_pixel / 0.3048;
          Wall wall = Wall.Create(doc, Line.CreateBound(
            new XYZ(barrier.x1 * k, barrier.y1 * k, 0),
            new XYZ(barrier.x2 * k, barrier.y2 * k, 0)), wt.Id, doc.ActiveView.GenLevel.Id, 3.0 / 0.3048, 0, false, false);

          // Set RS shared parameters
          wall.LookupParameter("RS_ShieldingType")?.Set(barrier.barrierType);
          wall.LookupParameter("RS_DesignGoal_mSv")?.Set(barrier.designGoal);
          wall.LookupParameter("RS_MaterialCode")?.Set(barrier.materialCode);
          // Requerido = espesor del motor (null si la barrera no se calculó); instalado = espesor declarado del muro.
          if (barrier.requiredThickness_mm.HasValue) wall.LookupParameter("RS_RequiredThickness_mm")?.Set(barrier.requiredThickness_mm.Value);
          wall.LookupParameter("RS_ActualThickness_mm")?.Set(barrier.thickness_mm);
          // Estado de la verificacion exportado por RadShield (instalado >= requerido); sin dato no se marca PASS.
          wall.LookupParameter("RS_PassFail")?.Set(barrier.verificacion ?? "SIN VERIFICAR");
        }
        tx.Commit();
      }
      return Result.Succeeded;
    }
  }
}`;

const SHARED_PARAMS_XML = `<?xml version="1.0" encoding="utf-8"?>
<RadShieldSharedParameters>
  <Parameter name="RS_ShieldingType" type="Text" group="RadShield-MX" desc="Tipo de blindaje: Primaria/Secundaria/Leakage/Scatter" />
  <Parameter name="RS_DesignGoal_mSv" type="Number" group="RadShield-MX" desc="Meta de dosis P (mSv/semana)" />
  <Parameter name="RS_MaterialCode" type="Text" group="RadShield-MX" desc="Codigo de material: CONCRETE235, LEAD, STEEL, GYPSUM, BPE, TUNGSTEN" />
  <Parameter name="RS_RequiredThickness_mm" type="Number" group="RadShield-MX" desc="Espesor requerido calculado por RadShield (mm)" />
  <Parameter name="RS_ActualThickness_mm" type="Number" group="RadShield-MX" desc="Espesor actual del muro en modelo (mm)" />
  <Parameter name="RS_PassFail" type="Text" group="RadShield-MX" desc="Estado de cumplimiento: PASS/FAIL" />
  <Parameter name="RS_NCRPReference" type="Text" group="RadShield-MX" desc="Referencia NCRP: 147/151/155" />
  <Parameter name="RS_CalculatedDate" type="Text" group="RadShield-MX" desc="Fecha de calculo RadShield" />
  <Parameter name="RS_Version" type="Text" group="RadShield-MX" desc="Version RadShield-MX usada" />
</RadShieldSharedParameters>`;

export default function RevitAddinDialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.revitAddin));
  const close = () => useAppStore.getState().close('revitAddin');
  const [copied, setCopied] = useState<'cs' | 'xml' | null>(null);
  const [activeTab, setActiveTab] = useState<'cs' | 'xml' | 'guide'>('cs');

  const copy = (text: string, which: 'cs' | 'xml') => {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-500" /> Revit Add-in C# (v104)
            <Badge variant="outline" className="text-[9px]">BIM Bidireccional</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-3">
          <Button variant={activeTab === 'cs' ? 'default' : 'outline'} size="sm" className="text-[10px] h-6" onClick={() => setActiveTab('cs')}><Code className="w-3 h-3 mr-1" />C# Add-in</Button>
          <Button variant={activeTab === 'xml' ? 'default' : 'outline'} size="sm" className="text-[10px] h-6" onClick={() => setActiveTab('xml')}><FileCode className="w-3 h-3 mr-1" />Shared Params</Button>
          <Button variant={activeTab === 'guide' ? 'default' : 'outline'} size="sm" className="text-[10px] h-6" onClick={() => setActiveTab('guide')}><BookOpen className="w-3 h-3 mr-1" />Guia</Button>
        </div>

        {activeTab === 'cs' && (
          <div>
            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-medium text-slate-600">ImportShieldingCmd.cs</span><Button variant="ghost" size="sm" className="h-5 text-[9px]" onClick={() => copy(REVIT_CS_TEMPLATE, 'cs')}>{copied === 'cs' ? <><CheckCircle className="w-3 h-3 mr-1 text-green-500" />Copiado</> : <><Copy className="w-3 h-3 mr-1" />Copiar</>}</Button></div>
            <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-[9px] font-mono overflow-x-auto max-h-64 overflow-y-auto">{REVIT_CS_TEMPLATE}</pre>
          </div>
        )}

        {activeTab === 'xml' && (
          <div>
            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-medium text-slate-600">RadShieldSharedParameters.xml</span><Button variant="ghost" size="sm" className="h-5 text-[9px]" onClick={() => copy(SHARED_PARAMS_XML, 'xml')}>{copied === 'xml' ? <><CheckCircle className="w-3 h-3 mr-1 text-green-500" />Copiado</> : <><Copy className="w-3 h-3 mr-1" />Copiar</>}</Button></div>
            <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-[9px] font-mono overflow-x-auto max-h-64 overflow-y-auto">{SHARED_PARAMS_XML}</pre>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-3 text-[10px] text-slate-600">
            <div className="bg-blue-50 rounded-md p-2"><strong className="text-blue-700">Paso 1:</strong> Crear Shared Parameters en Revit (Manage &gt; Shared Parameters) usando el XML.</div>
            <div className="bg-blue-50 rounded-md p-2"><strong className="text-blue-700">Paso 2:</strong> Compilar el Add-in C# con referencias a RevitAPI.dll y RevitAPIUI.dll.</div>
            <div className="bg-blue-50 rounded-md p-2"><strong className="text-blue-700">Paso 3:</strong> Instalar el .addin en %APPDATA%/Autodesk/Revit/Addins/2024/.</div>
            <div className="bg-blue-50 rounded-md p-2"><strong className="text-blue-700">Paso 4:</strong> Exportar JSON desde RadShield (v102) y ejecutar ImportShieldingCmd en Revit.</div>
            <div className="bg-blue-50 rounded-md p-2"><strong className="text-blue-700">Paso 5:</strong> Generar Schedule de blindaje en Revit con columnas RS_*.</div>
            <p className="text-[8px] text-slate-400 mt-2">Autodesk Revit API 2024 | .NET Framework 4.8 | Visual Studio 2022</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
