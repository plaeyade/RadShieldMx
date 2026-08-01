export interface F414BimVideoReferencePattern {
  id: string;
  label: string;
  observedIn: 'image' | 'video' | 'image-video';
  canvasApplication: string;
  releaseRule: string;
}

export interface F414BimVideoReferencePlan {
  schema: 'radshield-mx.f414.bim-video-reference.v1';
  phase: 'F414';
  status: 'reference-ready' | 'frames-required';
  sourceEvidence: string[];
  patterns: F414BimVideoReferencePattern[];
  extractionNotes: string[];
}

export function buildF414BimVideoReferencePlan(hasDecodedFrames = false): F414BimVideoReferencePlan {
  return {
    schema: 'radshield-mx.f414.bim-video-reference.v1',
    phase: 'F414',
    status: hasDecodedFrames ? 'reference-ready' : 'frames-required',
    sourceEvidence: [
      'WhatsApp still image: AutoCAD Plant 3D style ribbon, project manager, layers, properties, viewport labels, view cube and command line.',
      'WhatsApp videos: pending frame extraction from local ffmpeg path; Codex cannot see ffmpeg.exe in AppData/Local or PATH yet.',
    ],
    patterns: [
      {
        id: 'discipline-ribbon',
        label: 'Ribbon por disciplina',
        observedIn: 'image-video',
        canvasApplication: 'Agrupar Proyecto, Modelo, Equipos, Blindaje, Anotar, Verificar, Reportar y Evidencia como flujo BIM.',
        releaseRule: 'Cada boton visible debe tener accion real, tooltip y testid estable.',
      },
      {
        id: 'project-manager',
        label: 'Project Manager lateral',
        observedIn: 'image',
        canvasApplication: 'Mostrar planos, modelos 3D, equipos, barreras, zonas, reportes y evidencia sin tapar el viewport.',
        releaseRule: 'Sidebar con ancho estable, colapsable y sin overlays sobre el canvas central.',
      },
      {
        id: 'properties-layers',
        label: 'Propiedades y capas',
        observedIn: 'image',
        canvasApplication: 'Unificar detalles, propiedades, capas, bloqueo, opacidad, material, TVL y estado de revision.',
        releaseRule: 'Cambios de capa/material deben invalidar calculo, memoria y snapshots.',
      },
      {
        id: 'annotated-viewport',
        label: 'Viewport anotado',
        observedIn: 'image-video',
        canvasApplication: 'Usar etiquetas, leyenda, flechas, isocontornos, zonas y callouts para memoria analitica.',
        releaseRule: 'Todo overlay exportable debe conservar escala, fuente, pagina/hash y perfil DX/TX/NM/CY.',
      },
      {
        id: 'view-navigation',
        label: 'View cube y navegacion',
        observedIn: 'image',
        canvasApplication: 'Mantener vista superior, ajuste, pan/zoom y acceso a recorrido medico 3D desde el viewport.',
        releaseRule: 'Navegacion no debe bloquear seleccion, lasso, grips, cotas ni boton derecho.',
      },
      {
        id: 'command-line',
        label: 'Linea de comando',
        observedIn: 'image',
        canvasApplication: 'Mostrar estado de herramienta, accion reciente, errores de escala/DXF y comandos de memoria.',
        releaseRule: 'Los mensajes deben reflejar acciones reales del store/canvas, no texto decorativo.',
      },
    ],
    extractionNotes: [
      'Si ffmpeg queda disponible, extraer frames a outputs/f414_bim_video_reference para comparar ribbon, panels, viewport y navegacion.',
      'Comando esperado: ffmpeg -i video.mp4 -vf fps=1/3,scale=1280:-1 outputs/f414_bim_video_reference/frame_%03d.jpg',
      'Sin ffmpeg visible, F414 conserva la referencia como contrato de UI y no bloquea build ni uso del canvas.',
    ],
  };
}
