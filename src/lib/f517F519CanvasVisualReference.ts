export interface F517F519CanvasVisualReference {
  phaseRange: 'F517-F519';
  source: 'user-supplied-floorplan-reference-images';
  status: 'implemented-low-risk';
  palette: {
    workspace: string;
    panel: string;
    border: string;
    ink: string;
    muted: string;
    accent: string;
    tx: string;
    nm: string;
    dx: string;
    cy: string;
  };
  visualPatterns: Array<{
    id: string;
    referencePattern: string;
    radShieldTranslation: string;
    implementationStatus: 'visible-contract' | 'planned-deep-implementation';
  }>;
  implementationPhases: Array<{
    phase: 'F517' | 'F518' | 'F519' | 'F520+';
    objective: string;
    deliverable: string;
    risk: 'low' | 'medium' | 'high';
  }>;
}

export function buildF517F519CanvasVisualReference(): F517F519CanvasVisualReference {
  return {
    phaseRange: 'F517-F519',
    source: 'user-supplied-floorplan-reference-images',
    status: 'implemented-low-risk',
    palette: {
      workspace: '#eef3ec',
      panel: '#fffdf8',
      border: '#d8d6cd',
      ink: '#252525',
      muted: '#71706a',
      accent: '#238a61',
      tx: '#f6d8ce',
      nm: '#dcebf7',
      dx: '#fff2bd',
      cy: '#eee8ed',
    },
    visualPatterns: [
      {
        id: 'clinical-room-catalog',
        referencePattern: 'Room Catalog with add/remove counters and grouped room families',
        radShieldTranslation: 'Catalogo clinico para bunker, control, laberinto, cuarto de equipo, hot lab, uptake, sala publica y penetraciones.',
        implementationStatus: 'visible-contract',
      },
      {
        id: 'floating-cad-toolbar',
        referencePattern: 'Floating mode toolbar with Rooms/Shape/Lot, zoom, undo, redo, Snap and Reset',
        radShieldTranslation: 'Toolbar compacta del canvas con modo, zoom, undo/redo, snap, reset y comandos clinicos sin cubrir el plano.',
        implementationStatus: 'visible-contract',
      },
      {
        id: 'variant-thumbnails',
        referencePattern: 'A-E design alternatives shown as small selectable thumbnails',
        radShieldTranslation: 'Variantes A-E para escenarios de distribucion y comparacion de blindaje antes de calcular la memoria.',
        implementationStatus: 'visible-contract',
      },
      {
        id: 'inline-object-editor',
        referencePattern: 'Selected doors/windows show handles and an inline popover for type, flip, width, move, align and delete',
        radShieldTranslation: 'Editor inline para barreras, puertas, penetraciones y equipos: rol, material, espesor, ancho, alineacion, mover y borrar.',
        implementationStatus: 'planned-deep-implementation',
      },
      {
        id: 'material-render-palette',
        referencePattern: 'Choose Materials screen with swatches and save palette flow',
        radShieldTranslation: 'Paleta tecnica de materiales con TVL, densidad, peso, costo, tiempo, carga estructural, cita y hash.',
        implementationStatus: 'visible-contract',
      },
      {
        id: 'export-bim-bundle',
        referencePattern: 'Download panel with PDF, DXF, IFC, GLB and 3D model preview',
        radShieldTranslation: 'Paquete de salida RadShield: PDF, DXF, IFC/GLB, screenshot, Evidence Pack y Memoria IA.',
        implementationStatus: 'visible-contract',
      },
    ],
    implementationPhases: [
      {
        phase: 'F517',
        objective: 'Analizar referencias visuales y traducirlas a patrones clinicos RadShield.',
        deliverable: 'Panel visible en canvas + Update Center + manuales con patrones adoptados.',
        risk: 'low',
      },
      {
        phase: 'F518',
        objective: 'Homogeneizar paleta del canvas tipo Project Manager sin romper renderer/eventos.',
        deliverable: 'Tokens de color workspace/panel/acento y swatches TX/NM/DX/CY visibles.',
        risk: 'low',
      },
      {
        phase: 'F519',
        objective: 'Definir implementacion profunda de catalogo, variantes, inline editor y export BIM.',
        deliverable: 'Contrato testeable y ruta F520+ para pasar de visible-contract a interaccion real.',
        risk: 'low',
      },
      {
        phase: 'F520+',
        objective: 'Convertir patrones visuales en herramientas operativas reales.',
        deliverable: 'Drag/drop catalog, editor inline, variantes persistentes, export BIM y material palette DB-backed.',
        risk: 'high',
      },
    ],
  };
}
