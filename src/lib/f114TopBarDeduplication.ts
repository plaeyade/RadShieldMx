export interface F114TopBarDeduplication {
  phase: 'F114';
  status: 'implemented-controlled';
  visibleLegacyMenus: string[];
  hiddenDuplicateMenus: string[];
  canonicalMenus: string[];
  preservedFallbackPolicy: string;
  nextPhase: string;
  decision: string;
}

export function buildF114TopBarDeduplication(): F114TopBarDeduplication {
  return {
    phase: 'F114',
    status: 'implemented-controlled',
    visibleLegacyMenus: ['Archivo'],
    hiddenDuplicateMenus: ['Calcular', 'Fisica', 'Med. Nuclear', 'Normativa', 'Reportes', 'Herramientas'],
    canonicalMenus: ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'],
    preservedFallbackPolicy: 'Handlers and menu definitions are preserved in code; F116 moves Eficiencia into Integraciones while keeping Archivo visible for project I/O.',
    nextPhase: 'F115/F116 smoke should validate Archivo as the only visible utility menu and Integraciones as the efficiency destination.',
    decision: 'F114 removes visible duplicate legacy triggers from the top bar. F116 further consolidates Eficiencia into Integraciones, leaving Archivo as the only visible utility menu.',
  };
}
