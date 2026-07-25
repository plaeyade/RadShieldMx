export type DwgProviderId =
  | 'aps-design-automation'
  | 'oda-self-hosted'
  | 'cloudconvert-preview'
  | 'manual-dxf-fallback';

export interface DwgProviderCandidate {
  id: DwgProviderId;
  rank: number;
  role: 'primary' | 'private-long-term' | 'preview-only' | 'fallback';
  recommendedFor: string;
  strengths: string[];
  limitations: string[];
  requiredSecrets: string[];
  acceptedOutputs: Array<'dxf' | 'svg' | 'ifc' | 'pdf' | 'png'>;
  releaseDecision: string;
}

export interface DwgProviderSelection {
  phase: 'F261';
  schema: 'radshield-mx.dwg-provider-selection.f261.v1';
  selectedPrimary: DwgProviderId;
  canonicalImportPath: 'dwg-provider-to-dxf-then-existing-dxf-import';
  publicFrontendSafe: true;
  providers: DwgProviderCandidate[];
  operatorSteps: string[];
}

export function buildDwgProviderSelection(): DwgProviderSelection {
  return {
    phase: 'F261',
    schema: 'radshield-mx.dwg-provider-selection.f261.v1',
    selectedPrimary: 'aps-design-automation',
    canonicalImportPath: 'dwg-provider-to-dxf-then-existing-dxf-import',
    publicFrontendSafe: true,
    providers: [
      {
        id: 'aps-design-automation',
        rank: 1,
        role: 'primary',
        recommendedFor:
          'Produccion controlada cuando el objetivo sea convertir DWG a DXF conservando capas/bloques con automatizacion AutoCAD en cloud.',
        strengths: [
          'Proveedor de origen Autodesk para DWG/AutoCAD',
          'Permite scripts/add-ins de AutoCAD en cloud',
          'Mejor candidato para conservar capas, bloques, unidades y limpieza CAD',
          'Encaja con un backend seguro: upload -> workitem -> DXF -> importador actual',
        ],
        limitations: [
          'Requiere cuenta APS, OAuth, bucket/OSS y actividad/workitem',
          'No debe ejecutarse desde frontend estatico',
          'Hay que crear fixtures DWG reales y smoke de capas',
        ],
        requiredSecrets: ['APS_CLIENT_ID', 'APS_CLIENT_SECRET', 'APS_BUCKET_KEY'],
        acceptedOutputs: ['dxf', 'svg', 'pdf'],
        releaseDecision:
          'Usar como proveedor primario F261 para DWG->DXF; mantener desactivado hasta contar con credenciales y fixtures.',
      },
      {
        id: 'oda-self-hosted',
        rank: 2,
        role: 'private-long-term',
        recommendedFor:
          'Ambiente privado/industrial con documentos sensibles y necesidad de control total de DWG/DGN/IFC/SVG.',
        strengths: [
          'Opcion fuerte para privacidad y despliegue propio',
          'Cubre DWG/DGN/DXF y exportaciones como SVG/IFC/raster segun SDK',
          'Mejor para ruta enterprise si el volumen crece',
        ],
        limitations: [
          'Licenciamiento anual y setup tecnico mayor',
          'No es una integracion rapida de frontend estatico',
          'Requiere servicio propio o private cloud',
        ],
        requiredSecrets: ['ODA_SERVICE_URL', 'ODA_API_KEY'],
        acceptedOutputs: ['dxf', 'svg', 'ifc', 'pdf', 'png'],
        releaseDecision:
          'Mantener como ruta privada de mediano plazo; no bloquear F261/F262 por ODA.',
      },
      {
        id: 'cloudconvert-preview',
        rank: 3,
        role: 'preview-only',
        recommendedFor:
          'Previsualizacion o conversion rapida a SVG/PDF/PNG cuando no se requiere preservar semantica CAD completa.',
        strengths: [
          'API simple y rapida para conversiones de archivos',
          'Puede generar SVG/PDF/PNG utiles como overlay visual',
          'Buena opcion para pruebas no clinicas o planos no sensibles',
        ],
        limitations: [
          'No es la ruta canonica para calculo si no entrega DXF con capas verificables',
          'No subir planos privados sin convenio/consentimiento',
          'Debe pasar por backend; nunca exponer token en frontend',
        ],
        requiredSecrets: ['CLOUDCONVERT_API_KEY'],
        acceptedOutputs: ['svg', 'pdf', 'png'],
        releaseDecision:
          'Usar solo para preview/overlay; no para aplicar geometria calculable sin validacion DXF.',
      },
      {
        id: 'manual-dxf-fallback',
        rank: 4,
        role: 'fallback',
        recommendedFor:
          'Operacion inmediata: convertir DWG a DXF con AutoCAD/ODA File Converter/local CAD y cargar el DXF actual.',
        strengths: [
          'No requiere API nueva',
          'Mantiene estable el importador DXF existente',
          'Es la ruta de rollback si falla cualquier proveedor',
        ],
        limitations: [
          'Proceso manual',
          'No audita conversion automaticamente salvo que el operador suba ambos archivos',
        ],
        requiredSecrets: [],
        acceptedOutputs: ['dxf'],
        releaseDecision:
          'Conservar siempre como fallback canonico.',
      },
    ],
    operatorSteps: [
      'Crear credenciales APS solo en backend/servidor, no en frontend estatico.',
      'Subir 2-3 DWG pequenos no sensibles como fixtures F262.',
      'Convertir DWG a DXF y comparar capas/unidades contra el importador DXF actual.',
      'Aplicar al canvas solo despues de confirmacion del operador.',
    ],
  };
}

export function summarizeDwgProviderSelection(): string {
  const selection = buildDwgProviderSelection();
  const primary = selection.providers.find((provider) => provider.id === selection.selectedPrimary);
  return [
    'F261 DWG PROVIDER SELECTION',
    `Primary: ${selection.selectedPrimary}`,
    `Canonical path: ${selection.canonicalImportPath}`,
    `Frontend safe: ${selection.publicFrontendSafe ? 'yes' : 'no'}`,
    `Primary decision: ${primary?.releaseDecision ?? 'missing primary'}`,
    ...selection.providers.map((provider) => [
      `- ${provider.id} [${provider.role}] rank=${provider.rank}`,
      `  Use: ${provider.recommendedFor}`,
      `  Outputs: ${provider.acceptedOutputs.join(', ')}`,
      `  Secrets: ${provider.requiredSecrets.length ? provider.requiredSecrets.join(', ') : 'none'}`,
    ].join('\n')),
  ].join('\n');
}
