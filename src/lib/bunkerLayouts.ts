// =============================================================================
// bunkerLayouts.ts — Dimensiones mínimas de bunkers por tipo de equipo (v14.3)
// Basado en NCRP 151, IAEA SRS 47, y especificaciones de fabricantes
// =============================================================================

export interface BunkerLayout {
  equipmentType: string;
  equipmentSubtype: string;
  minLength_m: number;
  minWidth_m: number;
  minHeight_m: number;
  minWallThickness_cm: number;
  ceilingThickness_cm: number;
  floorThickness_cm: number;
  mazeRequired: boolean;
  mazeMinWidth_m: number;
  controlRoomAdjacent: boolean;
  source: string;
  notes: string[];
}

export const BUNKER_LAYOUTS: BunkerLayout[] = [
  {
    equipmentType: 'LINAC',
    equipmentSubtype: '6-10 MV (conventional)',
    minLength_m: 6.5, minWidth_m: 5.5, minHeight_m: 2.8,
    minWallThickness_cm: 90, ceilingThickness_cm: 70, floorThickness_cm: 50,
    mazeRequired: false, mazeMinWidth_m: 0, controlRoomAdjacent: true,
    source: 'NCRP 151 §4.2',
    notes: ['Maze recomendado pero no obligatorio < 10 MV', 'Pared primaria mínima 90 cm concreto'],
  },
  {
    equipmentType: 'LINAC',
    equipmentSubtype: '15-18 MV (IMRT/VMAT)',
    minLength_m: 7.5, minWidth_m: 6.5, minHeight_m: 3.0,
    minWallThickness_cm: 150, ceilingThickness_cm: 100, floorThickness_cm: 70,
    mazeRequired: true, mazeMinWidth_m: 1.5, controlRoomAdjacent: true,
    source: 'NCRP 151 §4.2 / §5.3',
    notes: ['Laberinto OBLIGATORIO ≥ 10 MV', 'Considerar neutrones > 10 MV', 'Puerta con plomo + BPE'],
  },
  {
    equipmentType: 'LINAC',
    equipmentSubtype: '25 MV / SRS/SBRT',
    minLength_m: 8.0, minWidth_m: 7.0, minHeight_m: 3.2,
    minWallThickness_cm: 180, ceilingThickness_cm: 120, floorThickness_cm: 80,
    mazeRequired: true, mazeMinWidth_m: 1.8, controlRoomAdjacent: true,
    source: 'NCRP 151 §4.2 / Varian SRS requirements',
    notes: ['Laberinto obligatorio con doble vuelta recomendada', 'Blindaje neutrones: BPE 5%', 'Dosis rate alto → espesores mayores'],
  },
  {
    equipmentType: 'Gamma Knife',
    equipmentSubtype: 'Icon / Perfexion / Esprit',
    minLength_m: 7.0, minWidth_m: 6.0, minHeight_m: 2.7,
    minWallThickness_cm: 70, ceilingThickness_cm: 60, floorThickness_cm: 40,
    mazeRequired: true, mazeMinWidth_m: 1.2, controlRoomAdjacent: true,
    source: 'NCRP 151 §4.8.6 / Elekta installation manual',
    notes: ['Maze obligatorio (cobalt source always ON)', 'Fuente permanente → maze siempre requerido', 'Paredes menores que LINAC (Co-60 < 18 MV)'],
  },
  {
    equipmentType: 'HDR',
    equipmentSubtype: 'Ir-192 / Co-60 remote afterloader',
    minLength_m: 4.5, minWidth_m: 3.5, minHeight_m: 2.5,
    minWallThickness_cm: 45, ceilingThickness_cm: 35, floorThickness_cm: 30,
    mazeRequired: true, mazeMinWidth_m: 1.0, controlRoomAdjacent: true,
    source: 'NCRP 151 §4.8.5 / IAEA TECDOC 1274',
    notes: ['Sala de tratamiento + sala de conexión', 'Maze siempre requerido (source always present)', 'Paredes delgadas (HDR dosis rate bajo)'],
  },
  {
    equipmentType: 'PET-CT',
    equipmentSubtype: 'F-18 FDG imaging',
    minLength_m: 5.0, minWidth_m: 4.0, minHeight_m: 2.7,
    minWallThickness_cm: 20, ceilingThickness_cm: 15, floorThickness_cm: 10,
    mazeRequired: false, mazeMinWidth_m: 0, controlRoomAdjacent: true,
    source: 'AAPM TG-108 / NCRP 147',
    notes: ['No se requiere maze (auto-shielding CT)', 'Paredes delgadas (511 keV auto-attenuado)', 'Inyección en HOT lab separado', 'Uptake room con blindaje separado'],
  },
  {
    equipmentType: 'CT',
    equipmentSubtype: 'Diagnostic / Simulation',
    minLength_m: 4.5, minWidth_m: 3.5, minHeight_m: 2.5,
    minWallThickness_cm: 10, ceilingThickness_cm: 8, floorThickness_cm: 5,
    mazeRequired: false, mazeMinWidth_m: 0, controlRoomAdjacent: true,
    source: 'NCRP 147 §5.6',
    notes: ['Blindaje mínimo (kV range)', 'Lead lining en paredes adyacentes si necesario', 'Sala de control con ventana plomada'],
  },
  {
    equipmentType: 'Cyclotron',
    equipmentSubtype: 'IBA KIUBE 100-300 (18 MeV p)',
    minLength_m: 12.0, minWidth_m: 10.0, minHeight_m: 5.0,
    minWallThickness_cm: 200, ceilingThickness_cm: 150, floorThickness_cm: 120,
    mazeRequired: true, mazeMinWidth_m: 2.0, controlRoomAdjacent: false,
    source: 'NCRP 144 / IBA MID 55672 Rev G',
    notes: ['Self-shielded cyclotron (IBA KIUBE)', 'Maze con doble vuelta obligatorio', 'Neutrones + gamma (18 MeV p → ¹⁸F)', 'Target cave con blindaje separado', 'Ventilación activa (tritio, C-11, N-13)'],
  },
  {
    equipmentType: 'Radiofarmacia',
    equipmentSubtype: 'HOT lab F-18 / Ga-68 / I-131',
    minLength_m: 6.0, minWidth_m: 4.5, minHeight_m: 2.7,
    minWallThickness_cm: 15, ceilingThickness_cm: 12, floorThickness_cm: 8,
    mazeRequired: false, mazeMinWidth_m: 0, controlRoomAdjacent: false,
    source: 'NCRP 147 / AAPM TG-108',
    notes: ['Sintesis + QC + dispensación separadas', 'LAF (Laminar Air Flow) en sintesis', 'Fume hood con filtro HEPA + carbon', 'Almacenamiento de desechos con blindaje'],
  },
  {
    equipmentType: 'Braquiterapia LDR',
    equipmentSubtype: 'I-125 / Pd-103 permanent implants',
    minLength_m: 3.5, minWidth_m: 3.0, minHeight_m: 2.4,
    minWallThickness_cm: 8, ceilingThickness_cm: 5, floorThickness_cm: 5,
    mazeRequired: false, mazeMinWidth_m: 0, controlRoomAdjacent: true,
    source: 'NCRP 151 §4.8.5',
    notes: ['Blindaje mínimo (baja energía)', 'Almacenamiento de semillas con safe', 'Morgue radioactiva para pacientes I-131'],
  },
];

export function getLayoutByEquipment(type: string, subtype?: string): BunkerLayout | undefined {
  return BUNKER_LAYOUTS.find(l => 
    l.equipmentType === type && (subtype ? l.equipmentSubtype.includes(subtype) : true)
  );
}

// ── Layouts detallados por modalidad (de hojas Excel LAYOUT_ESTR_*) ──
export interface DetailedLayout {
  modality: string;
  description: string;
  generalParams: Record<string, string>;
  colindancias: Array<{ punto: string; nombre: string; zona: string; distancia_m: number; nota: string }>;
  specificNotes: string[];
}

export const DETAILED_LAYOUTS: DetailedLayout[] = [
  {
    modality: 'PET-CT con Ciclotrón',
    description: 'Layout estructural para unidad PET-CT con ciclotrón IBA',
    generalParams: {
      'Equipo PET-CT': 'Siemens Biograph / GE Discovery / Philips Vereos',
      'Equipo Ciclotrón': 'IBA KIUBE TR-FORTE/CP (16.5 MeV p)',
      'Corriente haz': '60 μA (operación)',
      'Radionúclidos': 'F-18, C-11, N-13, O-15, I-124',
      'Blindaje principal': 'Concreto barita + Pb laminado',
      'Ventilación': '15 cambios/hora mínimo (área HOT)',
      'Presión diferencial': 'Negativa (área HOT vs fría)',
      'Capilla L-extractora': '1000 cfm mínimo (NOM-003)',
    },
    colindancias: [
      { punto: 'I', nombre: 'Sala escáner PET-CT', zona: 'Controlada', distancia_m: 3.0, nota: 'Auto-blindaje escáner' },
      { punto: 'II', nombre: 'Sala inyección / Uptake', zona: 'Controlada', distancia_m: 2.5, nota: 'F-18 370 MBq inyección' },
      { punto: 'III', nombre: 'Sala sintesis (HOT lab)', zona: 'Controlada', distancia_m: 4.0, nota: 'F-18 producción, blindaje mayor' },
      { punto: 'IV', nombre: 'Ciclotrón / Target cave', zona: 'Controlada', distancia_m: 5.0, nota: 'Self-shielded + maze' },
      { punto: 'V', nombre: 'QC / Dispensación', zona: 'Controlada', distancia_m: 3.0, nota: 'Control calidad' },
      { punto: 'VI', nombre: 'Área administrativa', zona: 'Pública', distancia_m: 6.0, nota: 'Dispersión + fuga' },
      { punto: 'VII', nombre: 'Pasillo exterior', zona: 'Pública', distancia_m: 5.0, nota: 'Skyshine posible' },
    ],
    specificNotes: [
      'NOM-003-NUCL-1999: Radiofarmacia específica',
      'AAPM TG-108: Blindaje PET-CT (511 keV)',
      'IBA MID 55672 Rev G: Datos ciclotrón KIUBE',
      'Ventilación activa obligatoria (tritio, C-11, N-13)',
      'Almacenamiento desechos con blindaje separado',
    ],
  },
  {
    modality: 'Gamma Knife',
    description: 'Layout estructural para Gamma Knife (Perfexion / Icon / Esprit)',
    generalParams: {
      'Modelo': 'Perfexion / Icon / Esprit (Elekta)',
      'Fuentes Co-60': '201 (Perfexion/Icon) / 230 (Esprit)',
      'Actividad total': '~8800 Ci (aproximada)',
      'Energía gamma': '1.17 + 1.33 MeV (Co-60)',
      'SAD (fuente-foco)': '400 mm (fijo)',
      'Campo máximo': '160 mm diámetro',
      'Blindaje principal': 'Concreto normal / barita',
    },
    colindancias: [
      { punto: 'S1', nombre: 'Castillo cabeza (pared primaria)', zona: 'Controlada', distancia_m: 4.0, nota: 'Beam ON, haz primario' },
      { punto: 'S2', nombre: 'Castillo pies (pared primaria)', zona: 'Controlada', distancia_m: 4.0, nota: 'Beam ON, haz primario' },
      { punto: 'S3', nombre: 'Lateral derecho (dispersión)', zona: 'Controlada', distancia_m: 3.0, nota: 'Beam OFF, dispersión' },
      { punto: 'S4', nombre: 'Lateral izquierdo (dispersión)', zona: 'Controlada', distancia_m: 3.0, nota: 'Beam OFF, dispersión' },
      { punto: 'S5', nombre: 'Techo (fuga + skyshine)', zona: 'Controlada', distancia_m: 3.5, nota: 'Fuga cabezal' },
      { punto: 'SP1', nombre: 'Puerta laberinto exterior', zona: 'Pública', distancia_m: 4.5, nota: 'Beam ON+OFF maze' },
      { punto: 'SP2', nombre: 'Punto control sala consola', zona: 'Controlada', distancia_m: 5.0, nota: 'Sala de control' },
    ],
    specificNotes: [
      'Fuente Co-60 SIEMPRE encendida → maze obligatorio',
      'Beam ON (~2-3h/día) + Beam OFF (~21-22h/día)',
      'NCRP 151 §4.8.6: método especial GK',
      'Obturadores individuales por fuente',
      'Tasa dosis en SAD: ~3 Gy/min',
    ],
  },
  {
    modality: 'Braquiterapia HDR',
    description: 'Layout estructural para braquiterapia HDR con Ir-192',
    generalParams: {
      'Radionúclido principal': 'Ir-192 (HDR)',
      'Alternativo': 'Co-60 / Cs-137',
      'Actividad máxima': '10 Ci',
      'RAKR': '410.7 μGy·m²/(h·GBq)',
      'Energía gamma': '380 keV promedio (Ir-192)',
      'Tratamientos/semana': '15 pacientes',
      'Blindaje principal': 'Concreto normal',
    },
    colindancias: [
      { punto: 'S1', nombre: 'Pared trasera fuente (primaria)', zona: 'Controlada', distancia_m: 2.5, nota: 'Posición extrema fuente' },
      { punto: 'S2', nombre: 'Lateral derecho', zona: 'Controlada', distancia_m: 2.0, nota: 'Dispersión' },
      { punto: 'S3', nombre: 'Lateral izquierdo', zona: 'Controlada', distancia_m: 2.0, nota: 'Dispersión' },
      { punto: 'S4', nombre: 'Techo', zona: 'Controlada', distancia_m: 2.5, nota: 'Fuga' },
      { punto: 'SP1', nombre: 'Puerta laberinto', zona: 'Pública', distancia_m: 3.5, nota: 'Maze obligatorio (source always present)' },
      { punto: 'SP2', nombre: 'Sala de control', zona: 'Controlada', distancia_m: 4.0, nota: 'Consola remota' },
      { punto: 'S5', nombre: 'Sala de conexión / prep.', zona: 'Controlada', distancia_m: 3.0, nota: 'Preparación aplicadores' },
    ],
    specificNotes: [
      'IAEA TECDOC 1274: Blindaje HDR específico',
      'Fuente siempre presente → maze SIEMPRE requerido',
      'PMID 8630660: TVL medidos para blindaje HDR',
      'Sala de tratamiento + sala de conexión separadas',
      'Control remoto obligatorio (flexitron)',
    ],
  },
  {
    modality: 'Radiofarmacia',
    description: 'Layout estructural para radiofarmacia (central o satelital)',
    generalParams: {
      'Tipo': 'Central (producción) / Satelital (dispensado)',
      'Radionúclidos': 'Tc-99m, I-131, Lu-177, F-18, Ga-68',
      'Generador Mo-99/Tc-99m': 'Sí/No según servicios',
      'Ciclotrón en sitio': 'Sí/No',
      'Capilla L-extractora': '1000 cfm mínimo',
      'Cambios aire/hora': '15 mínimo (área caliente)',
      'Presión diferencial': 'Negativa (HOT vs fría)',
    },
    colindancias: [
      { punto: 'I', nombre: 'Área recepción generadores', zona: 'Controlada', distancia_m: 2.0, nota: 'Mo-99/Tc-99m' },
      { punto: 'II', nombre: 'Área elución / QC', zona: 'Controlada', distancia_m: 2.0, nota: 'Tc-99m, control calidad' },
      { punto: 'III', nombre: 'Área dispensación', zona: 'Controlada', distancia_m: 2.5, nota: 'Dosis pacientes' },
      { punto: 'IV', nombre: 'Área I-131 terapéutico', zona: 'Controlada', distancia_m: 3.0, nota: 'Dosis altas I-131' },
      { punto: 'V', nombre: 'Área almacenamiento desechos', zona: 'Controlada', distancia_m: 2.0, nota: 'Residuos NOM-036' },
      { punto: 'VI', nombre: 'Pasillo / área pública', zona: 'Pública', distancia_m: 4.0, nota: 'Dispersión + fuga' },
      { punto: 'VII', nombre: 'Oficina administrativa', zona: 'Pública', distancia_m: 5.0, nota: 'Personal no expuesto' },
    ],
    specificNotes: [
      'NOM-003-NUCL-1999: Instalaciones radiofarmacia',
      'NOM-036-NUCL-2013: Residuos radioactivos',
      'Áreas: limpia (fría) → controlada (caliente) → HOT',
      'Fume hood con HEPA + carbón activado',
      'Laminar flow en síntesis (si F-18/Ga-68)',
    ],
  },
];

export function getDetailedLayout(modality: string): DetailedLayout | undefined {
  return DETAILED_LAYOUTS.find(d => d.modality === modality);
}

export function getAllLayoutsForType(type: string): BunkerLayout[] {
  return BUNKER_LAYOUTS.filter(l => l.equipmentType === type);
}
