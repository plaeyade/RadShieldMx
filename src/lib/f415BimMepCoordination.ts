export interface F415MepSystemLayer {
  id: string;
  label: string;
  color: string;
  bimCategory: 'IfcFlowSegment' | 'IfcDuctSegment' | 'IfcCableCarrierSegment' | 'IfcOpeningElement' | 'IfcBuildingElementProxy';
  radiologicalRisk: 'low' | 'medium' | 'high';
  requiredChecks: string[];
}

export interface F415BimMepGate {
  id: string;
  label: string;
  owner: 'CAD/BIM' | 'Fisica Medica' | 'Estructura' | 'Obra/MEP';
  rule: string;
  releaseBlocking: boolean;
}

export interface F415BimMepCoordinationPlan {
  schema: 'radshield-mx.f415.bim-mep-coordination.v1';
  phase: 'F415';
  status: 'coordination-ready';
  visualReference: string[];
  systemLayers: F415MepSystemLayer[];
  gates: F415BimMepGate[];
  canvasActions: Array<{ id: string; label: string; action: string }>;
}

export function buildF415BimMepCoordinationPlan(): F415BimMepCoordinationPlan {
  return {
    schema: 'radshield-mx.f415.bim-mep-coordination.v1',
    phase: 'F415',
    status: 'coordination-ready',
    visualReference: [
      'Los videos muestran modelos MEP/BIM con tuberias, ductos, charolas, soportes, puertas y muros coloreados por sistema.',
      'Para RadShield-MX, el valor clinico es detectar penetraciones, interferencias, rutas de fuga, accesos de mantenimiento y cargas estructurales antes de cerrar memoria.',
    ],
    systemLayers: [
      {
        id: 'shielding-walls',
        label: 'Muros/losas de blindaje',
        color: '#22c55e',
        bimCategory: 'IfcBuildingElementProxy',
        radiologicalRisk: 'high',
        requiredChecks: ['espesor requerido', 'densidad/TVL versionada', 'carga kg/m2', 'continuidad contra penetraciones'],
      },
      {
        id: 'hvac-ducts',
        label: 'HVAC / ductos',
        color: '#38bdf8',
        bimCategory: 'IfcDuctSegment',
        radiologicalRisk: 'high',
        requiredChecks: ['cruce de barrera', 'compensacion de blindaje', 'laberinto o sleeve', 'evidencia fotografica/plano'],
      },
      {
        id: 'pipes',
        label: 'Tuberias / gases / agua',
        color: '#ef4444',
        bimCategory: 'IfcFlowSegment',
        radiologicalRisk: 'medium',
        requiredChecks: ['diametro', 'material', 'trayectoria', 'sello de penetracion', 'distancia a fuente'],
      },
      {
        id: 'cable-trays',
        label: 'Charolas / cableado',
        color: '#a855f7',
        bimCategory: 'IfcCableCarrierSegment',
        radiologicalRisk: 'medium',
        requiredChecks: ['pasamuros', 'canalizacion', 'blindaje local', 'acceso mantenimiento'],
      },
      {
        id: 'openings',
        label: 'Penetraciones / puertas',
        color: '#f59e0b',
        bimCategory: 'IfcOpeningElement',
        radiologicalRisk: 'high',
        requiredChecks: ['ubicacion exacta', 'dimensiones', 'equivalente Pb/concreto', 'revision fisico medico'],
      },
    ],
    gates: [
      {
        id: 'penetration-register',
        label: 'Registro de penetraciones',
        owner: 'Fisica Medica',
        rule: 'Toda entidad que cruza barrera debe crear entrada en Evidence Pack con ubicacion, dimensiones, sistema y mitigacion.',
        releaseBlocking: true,
      },
      {
        id: 'mep-clash',
        label: 'Clash MEP/blindaje',
        owner: 'CAD/BIM',
        rule: 'Cruces de ductos/tuberias/charolas contra barreras deben marcarse en canvas y plano 3D antes de reporte.',
        releaseBlocking: true,
      },
      {
        id: 'structural-load',
        label: 'Carga estructural',
        owner: 'Estructura',
        rule: 'Materiales HD y equipos pesados deben sumar carga kg/m2 y emitir advertencia si falta revision estructural.',
        releaseBlocking: true,
      },
      {
        id: 'maintenance-access',
        label: 'Acceso y mantenimiento',
        owner: 'Obra/MEP',
        rule: 'Rutas de servicio no deben abrir trayectorias directas de fuga radiologica ni bloquear controles/equipos.',
        releaseBlocking: false,
      },
    ],
    canvasActions: [
      { id: 'add-penetration', label: 'Agregar penetracion', action: 'Crear marcador de cruce con barrera y evidencia requerida.' },
      { id: 'toggle-mep', label: 'Alternar MEP', action: 'Mostrar/ocultar ductos, tuberias, charolas y soportes por capa.' },
      { id: 'clash-check', label: 'Revisar interferencias', action: 'Listar cruces MEP/blindaje y bloquear export si falta mitigacion.' },
      { id: 'view-shaded-edges', label: 'Shaded + edges', action: 'Activar inspeccion 3D/2.5D con aristas y colores disciplinares.' },
    ],
  };
}
