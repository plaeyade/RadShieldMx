export type F219CanvasPendingPriority = 'P0' | 'P1' | 'P2';
export type F219CanvasPendingRisk = 'low' | 'medium' | 'high';

export interface F219PublicQaCheck {
  id: string;
  label: string;
  surface: 'Public URL' | 'Canvas' | 'Menus' | 'Reports' | 'Evidence';
  expected: string;
  status: 'manual-required' | 'automated-covered';
}

export interface F219CanvasPendingImprovement {
  id: string;
  label: string;
  priority: F219CanvasPendingPriority;
  risk: F219CanvasPendingRisk;
  currentState: string;
  nextStep: string;
  releasePolicy: string;
}

export interface F219CanvasPostDeployQa {
  schema: 'radshield-mx.canvas-post-deploy-qa.f219.v1';
  phase: 'F219';
  status: 'post-deploy-qa-ready';
  publicUrl: string;
  checks: F219PublicQaCheck[];
  pendingCanvasImprovements: F219CanvasPendingImprovement[];
  nextRecommendedPhase: 'F220';
  decision: string;
}

export const F219_PUBLIC_URL = 'https://radshield-mx-static-dist.vercel.app/';

export function buildF219CanvasPostDeployQa(publicUrl = F219_PUBLIC_URL): F219CanvasPostDeployQa {
  const checks: F219PublicQaCheck[] = [
    {
      id: 'url-shell',
      label: 'Abrir URL publica y confirmar shell',
      surface: 'Public URL',
      expected: 'HTTPS carga sin pantalla blanca, sin cache viejo y sin consola bloqueante.',
      status: 'manual-required',
    },
    {
      id: 'canvas-visible',
      label: 'Canvas/sidebar/toolbar visibles',
      surface: 'Canvas',
      expected: 'Sidebar izquierda, viewport, toolbar CAD F191 y paneles F214-F218 visibles sin tapar el plano.',
      status: 'automated-covered',
    },
    {
      id: 'dxf-apply',
      label: 'Importar DXF y aplicar al floorplan',
      surface: 'Canvas',
      expected: 'El visor DXF clasifica capas F213 y el boton Aplicar al canvas crea barreras visibles.',
      status: 'automated-covered',
    },
    {
      id: 'scene-export',
      label: 'Preparar escenas F217',
      surface: 'Canvas',
      expected: 'Planta, Heat, Iso y Estruct cambian modo visual y exponen botones PNG.',
      status: 'automated-covered',
    },
    {
      id: 'report-handoff',
      label: 'Validar handoff F218',
      surface: 'Reports',
      expected: 'Memoria IA, PDF y Evidence Pack muestran adjuntos listos/faltantes antes de cierre documental.',
      status: 'automated-covered',
    },
    {
      id: 'operator-pass',
      label: 'Revision visual de operador',
      surface: 'Evidence',
      expected: 'Captura final del canvas y checklist manual guardados junto al paquete de entrega.',
      status: 'manual-required',
    },
  ];

  const pendingCanvasImprovements: F219CanvasPendingImprovement[] = [
    {
      id: 'cad-direct-edit',
      label: 'Edicion CAD directa',
      priority: 'P0',
      risk: 'medium',
      currentState: 'Hay inspector, acciones y QA visual; falta editar vertices/cotas con confirmacion inline en el propio canvas.',
      nextStep: 'F220 debe agregar edicion directa por microcambio con smoke antes/despues.',
      releasePolicy: 'No tocar renderer base sin prueba visual; habilitar por feature flag si afecta seleccion.',
    },
    {
      id: 'advanced-snapping',
      label: 'Snapping avanzado visual',
      priority: 'P0',
      risk: 'medium',
      currentState: 'Snap y guias existen como asistencia; faltan endpoint, midpoint, perpendicular, interseccion y angulo con indicadores visibles.',
      nextStep: 'F221 debe centralizar candidatos de snap y pintar preview sin mutar geometria hasta mouse-up.',
      releasePolicy: 'Mantener fallback a snap simple y boton para desactivar.',
    },
    {
      id: 'editable-dimensions',
      label: 'Cotas persistentes/editables/exportables',
      priority: 'P0',
      risk: 'medium',
      currentState: 'F209 resume cotas y longitudes; falta entidad de cota editable con valor, unidad, capa y export.',
      nextStep: 'F222 debe crear modelo de dimension annotations y exportarlas en PNG/CAD JSON.',
      releasePolicy: 'No recalcular barreras desde una cota editada sin confirmacion explicita.',
    },
    {
      id: 'lasso-multiselect',
      label: 'Seleccion multiple/lasso',
      priority: 'P1',
      risk: 'medium',
      currentState: 'Existe seleccion individual e inspector; falta ventana/lasso, hover preselection y panel grupal estable.',
      nextStep: 'F223 debe agregar seleccion multiple por capa visual con propiedades comunes.',
      releasePolicy: 'No reemplazar seleccion actual; additive mode con Esc para cancelar.',
    },
    {
      id: 'true-isocontours',
      label: 'Isocontornos reales con etiquetas',
      priority: 'P1',
      risk: 'high',
      currentState: 'F212/F217/F218 ordenan heatmap/isodosis como evidencia; falta interpolacion real, etiquetas y leyenda exportable por umbral.',
      nextStep: 'F224 debe separar motor de muestreo, interpolacion y render overlay.',
      releasePolicy: 'Exigir QA numerico y advertencia preliminar si no hay validacion fisica.',
    },
    {
      id: 'equipment-footprints',
      label: 'Simbolos de equipo con variantes fabricante',
      priority: 'P1',
      risk: 'low',
      currentState: 'F211 audita modalidad, fabricante, footprint y rotacion; falta biblioteca grafica mas rica por LINAC/Gamma Knife/PET/CT/HDR/CY.',
      nextStep: 'F225 debe incorporar sprites/SVG internos y selector de variante sin romper fuente existente.',
      releasePolicy: 'Mantener icono generico cuando falte fabricante o dimensiones.',
    },
    {
      id: 'visual-3d-inspection',
      label: 'Inspeccion visual 3D desde floorplan',
      priority: 'P2',
      risk: 'high',
      currentState: 'Hay escena 3D medica y metadata de equipos; falta recorrido real con espesores, zonas controladas, acabados y export visual firmado.',
      nextStep: 'F226 debe conectar floorplan 2D a vista 3D con controles de recorrido y snapshots.',
      releasePolicy: 'No bloquear release estatico; tratar como modulo avanzado.',
    },
  ];

  return {
    schema: 'radshield-mx.canvas-post-deploy-qa.f219.v1',
    phase: 'F219',
    status: 'post-deploy-qa-ready',
    publicUrl,
    checks,
    pendingCanvasImprovements,
    nextRecommendedPhase: 'F220',
    decision:
      'F219 cierra QA visual post-deploy y convierte los pendientes del canvas en una cola priorizada. Las mejoras P0 deben entrar por microfases con smoke visual para evitar repetir regresiones de sidebar/canvas.',
  };
}
