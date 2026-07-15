export type CadImportFormat = 'dxf' | 'dwg' | 'svg' | 'png' | 'jpg' | 'ifc' | 'step' | 'obj';

export interface CadImportCapability {
  format: CadImportFormat;
  status: 'native' | 'external-conversion' | 'reference-overlay';
  purpose: string;
  recommendedPath: string;
}

export const CAD_IMPORT_CAPABILITIES: CadImportCapability[] = [
  {
    format: 'dxf',
    status: 'native',
    purpose: 'Plano 2D vectorial para barreras, capas y medicion.',
    recommendedPath: 'Importar DXF directamente y mapear lineas/capas a barreras.',
  },
  {
    format: 'dwg',
    status: 'external-conversion',
    purpose: 'Plano AutoCAD fuente cuando el despacho no entrega DXF.',
    recommendedPath: 'Convertir DWG a DXF/SVG con AutoCAD, ODA File Converter, LibreDWG o servicio CAD externo antes de importar.',
  },
  {
    format: 'svg',
    status: 'reference-overlay',
    purpose: 'Plano vectorial ligero para calcar barreras y zonas controladas.',
    recommendedPath: 'Importar como overlay y mantener escala calibrada antes de calcular.',
  },
  {
    format: 'png',
    status: 'reference-overlay',
    purpose: 'Plano raster para trazado manual y evidencia documental.',
    recommendedPath: 'Importar como imagen, calibrar escala y reconstruir barreras en canvas.',
  },
  {
    format: 'jpg',
    status: 'reference-overlay',
    purpose: 'Plano raster alternativo a PNG.',
    recommendedPath: 'Usar solo si la resolucion permite identificar muros y cotas.',
  },
  {
    format: 'ifc',
    status: 'external-conversion',
    purpose: 'BIM arquitectonico para extraer espacios, muros y materiales.',
    recommendedPath: 'Usar puente Revit/IFC para generar floor plan y escena 3D.',
  },
  {
    format: 'step',
    status: 'external-conversion',
    purpose: 'Geometria CAD de equipos o ensambles para Monte Carlo.',
    recommendedPath: 'Convertir a OBJ/glTF o deck MC con asignacion de materiales.',
  },
  {
    format: 'obj',
    status: 'native',
    purpose: 'Geometria 3D exportable/importable para revision tecnica.',
    recommendedPath: 'Usar OBJ como salida del visor Medical 3D y como puente a herramientas externas.',
  },
];

export function getDwgImportRecommendation() {
  return CAD_IMPORT_CAPABILITIES.find((capability) => capability.format === 'dwg')!;
}
