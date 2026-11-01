import { useState, useCallback } from 'react';
import '@/types/floorPlan';

export interface RoomTemplate {
  id: string;
  name: string;
  category: 'CT' | 'PET-CT' | 'LINAC' | 'RX' | 'Fluoroscopy' | 'Mammography' | 'Brachytherapy' | 'Nuclear Medicine' | 'Shielded Room' | 'Maze';
  description: string;
  roomDimensions: { width_m: number; length_m: number; height_m: number };
  walls: Array<{
    x1: number; y1: number; x2: number; y2: number;
    material: string; thickness_mm: number;
    isPrimaryBarrier?: boolean; isSecondaryBarrier?: boolean;
    note?: string;
  }>;
  equipment: Array<{
    name: string; type: string;
    position: { x: number; y: number };
    size: { width: number; depth: number };
    rotation: number;
    sourceType: string;
    kVp_mV?: string;
    workload?: string;
  }>;
  controlledAreas: Array<{
    name: string; type: 'controlled' | 'supervised' | 'public';
    minDistance_m: number;
    occupancyFactor: number;
    shieldingRequired_mm?: number;
  }>;
  occupancyFactors: Record<string, number>;
  designCriteria: {
    weeklyWorkload_hrs?: number;
    patientThroughput_perWeek?: number;
    doseConstraint_mSv_week?: number;
    isLithotripsy?: boolean;
  };
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'ct-siemens-force',
    name: 'CT Somatom Force',
    category: 'CT',
    description: 'Sala de TC multicorte de alta gama (Siemens Somatom Force)',
    roomDimensions: { width_m: 5.5, length_m: 7.0, height_m: 3.0 },
    walls: [
      { x1: 0, y1: 0, x2: 5.5, y2: 0, material: 'concrete', thickness_mm: 180, isPrimaryBarrier: true, note: 'Pared frontal - barrera primaria' },
      { x1: 5.5, y1: 0, x2: 5.5, y2: 7.0, material: 'concrete', thickness_mm: 120, isSecondaryBarrier: true, note: 'Pared lateral derecha' },
      { x1: 5.5, y1: 7.0, x2: 0, y2: 7.0, material: 'concrete', thickness_mm: 120, isSecondaryBarrier: true, note: 'Pared posterior' },
      { x1: 0, y1: 7.0, x2: 0, y2: 0, material: 'concrete', thickness_mm: 120, isSecondaryBarrier: true, note: 'Pared lateral izquierda - área controlada' },
    ],
    equipment: [
      { name: 'Somatom Force', type: 'CT Scanner', position: { x: 3.5, y: 3.5 }, size: { width: 2.2, depth: 1.6 }, rotation: 0, sourceType: 'CT', kVp_mV: '140 kVp', workload: '200 patients/week' },
    ],
    controlledAreas: [
      { name: 'Sala de control', type: 'controlled', minDistance_m: 4.5, occupancyFactor: 1.0 },
      { name: 'Pasillo', type: 'supervised', minDistance_m: 3.0, occupancyFactor: 0.2 },
      { name: 'Exterior/Estacionamiento', type: 'public', minDistance_m: 5.0, occupancyFactor: 0.025 },
    ],
    occupancyFactors: { controlRoom: 1.0, corridor: 0.2, outdoor: 0.025, adjacentOffice: 0.2, waitingRoom: 0.125 },
    designCriteria: { weeklyWorkload_hrs: 40, patientThroughput_perWeek: 200, doseConstraint_mSv_week: 0.1 },
  },
  {
    id: 'pet-ct-ge-dmi',
    name: 'PET-CT Discovery MI',
    category: 'PET-CT',
    description: 'Sala de PET-CT con área de inyección caliente y camilla de descanso',
    roomDimensions: { width_m: 6.0, length_m: 8.5, height_m: 3.0 },
    walls: [
      { x1: 0, y1: 0, x2: 6.0, y2: 0, material: 'concrete', thickness_mm: 200, isPrimaryBarrier: true, note: 'Pared frontal - barrera primaria (PET shielding)' },
      { x1: 6.0, y1: 0, x2: 6.0, y2: 8.5, material: 'concrete', thickness_mm: 150, isSecondaryBarrier: true, note: 'Pared lateral - F-18 shielding' },
      { x1: 6.0, y1: 8.5, x2: 0, y2: 8.5, material: 'concrete', thickness_mm: 150, isSecondaryBarrier: true, note: 'Pared posterior' },
      { x1: 0, y1: 8.5, x2: 0, y2: 4.0, material: 'lead_concrete', thickness_mm: 180, isPrimaryBarrier: true, note: 'Pared inyección - barrera primaria' },
      { x1: 0, y1: 4.0, x2: 0, y2: 0, material: 'concrete', thickness_mm: 120, isSecondaryBarrier: true, note: 'Pared acceso - barrera secundaria' },
    ],
    equipment: [
      { name: 'Discovery MI PET-CT', type: 'PET-CT Scanner', position: { x: 3.8, y: 3.0 }, size: { width: 2.4, depth: 1.8 }, rotation: 0, sourceType: 'PET-CT', kVp_mV: '140 kVp + 511 keV', workload: '20 patients/day' },
      { name: 'Hot Lab Injection', type: 'Injection Station', position: { x: 1.2, y: 6.5 }, size: { width: 1.5, depth: 1.0 }, rotation: 0, sourceType: 'F-18 vial', kVp_mV: '511 keV', workload: 'Continuous' },
    ],
    controlledAreas: [
      { name: 'Sala de control PET-CT', type: 'controlled', minDistance_m: 5.0, occupancyFactor: 1.0 },
      { name: 'Área de espera post-inyección', type: 'controlled', minDistance_m: 3.0, occupancyFactor: 0.5 },
      { name: 'Exterior (estacionamiento)', type: 'public', minDistance_m: 6.0, occupancyFactor: 0.025 },
    ],
    occupancyFactors: { controlRoom: 1.0, hotLab: 1.0, uptakeRoom: 0.5, corridor: 0.2, outdoor: 0.025 },
    designCriteria: { weeklyWorkload_hrs: 50, patientThroughput_perWeek: 100, doseConstraint_mSv_week: 0.02 },
  },
  {
    id: 'linac-varian-truebeam',
    name: 'LINAC Varian TrueBeam',
    category: 'LINAC',
    description: 'Búnker de acelerador lineal con laberinto y sala de control',
    roomDimensions: { width_m: 8.0, length_m: 10.0, height_m: 3.5 },
    walls: [
      { x1: 0, y1: 0, x2: 8.0, y2: 0, material: 'heavy_concrete', thickness_mm: 2200, isPrimaryBarrier: true, note: 'Pared frontal isocentro - barrera primaria (TVL x10)' },
      { x1: 8.0, y1: 0, x2: 8.0, y2: 10.0, material: 'heavy_concrete', thickness_mm: 1500, isSecondaryBarrier: true, note: 'Pared lateral - barrera secundaria' },
      { x1: 8.0, y1: 10.0, x2: 0, y2: 10.0, material: 'heavy_concrete', thickness_mm: 1500, isSecondaryBarrier: true, note: 'Pared posterior - barrera secundaria' },
      { x1: 0, y1: 10.0, x2: 0, y2: 6.0, material: 'heavy_concrete', thickness_mm: 1500, isSecondaryBarrier: true, note: 'Pared laberinto entrada' },
      { x1: 0, y1: 6.0, x2: 2.5, y2: 6.0, material: 'heavy_concrete', thickness_mm: 1500, isSecondaryBarrier: true, note: 'Laberinto - pared interior' },
      { x1: 2.5, y1: 6.0, x2: 2.5, y2: 8.5, material: 'heavy_concrete', thickness_mm: 1200, isSecondaryBarrier: true, note: 'Laberinto - pared guía' },
      { x1: 2.5, y1: 8.5, x2: 0, y2: 8.5, material: 'heavy_concrete', thickness_mm: 1200, isSecondaryBarrier: true, note: 'Laberinto - pared final' },
    ],
    equipment: [
      { name: 'TrueBeam STx', type: 'Linear Accelerator', position: { x: 4.0, y: 2.5 }, size: { width: 2.5, depth: 2.2 }, rotation: 0, sourceType: 'X-rays', kVp_mV: '6-18 MV', workload: '60 patients/day' },
    ],
    controlledAreas: [
      { name: 'Sala de control', type: 'controlled', minDistance_m: 6.0, occupancyFactor: 1.0 },
      { name: 'Pasillo exterior búnker', type: 'supervised', minDistance_m: 5.0, occupancyFactor: 0.2 },
      { name: 'Área pública hospital', type: 'public', minDistance_m: 8.0, occupancyFactor: 0.025 },
    ],
    occupancyFactors: { controlRoom: 1.0, maze: 0.2, corridor: 0.2, outdoor: 0.025, adjacentOffice: 0.2 },
    designCriteria: { weeklyWorkload_hrs: 60, patientThroughput_perWeek: 300, doseConstraint_mSv_week: 0.02 },
  },
  {
    id: 'xr-general-room',
    name: 'RX General/Trauma',
    category: 'RX',
    description: 'Sala de rayos X general para radiografía convencional',
    roomDimensions: { width_m: 4.5, length_m: 5.5, height_m: 3.0 },
    walls: [
      { x1: 0, y1: 0, x2: 4.5, y2: 0, material: 'concrete', thickness_mm: 100, isPrimaryBarrier: true, note: 'Pared tubo RX - barrera primaria (NCRP 147)' },
      { x1: 4.5, y1: 0, x2: 4.5, y2: 5.5, material: 'concrete', thickness_mm: 80, isSecondaryBarrier: true, note: 'Pared lateral' },
      { x1: 4.5, y1: 5.5, x2: 0, y2: 5.5, material: 'concrete', thickness_mm: 80, isSecondaryBarrier: true, note: 'Pared posterior' },
      { x1: 0, y1: 5.5, x2: 0, y2: 0, material: 'concrete', thickness_mm: 80, isSecondaryBarrier: true, note: 'Pared área controlada' },
    ],
    equipment: [
      { name: 'Sistema RX Digital', type: 'X-ray Unit', position: { x: 2.5, y: 1.8 }, size: { width: 0.8, depth: 0.6 }, rotation: 0, sourceType: 'X-rays', kVp_mV: '125 kVp', workload: '50 patients/day' },
      { name: 'Cassette Detector', type: 'Digital Detector', position: { x: 2.5, y: 0.5 }, size: { width: 0.5, depth: 0.02 }, rotation: 0, sourceType: 'scatter', kVp_mV: '125 kVp', workload: 'scatter' },
    ],
    controlledAreas: [
      { name: 'Sala de control RX', type: 'controlled', minDistance_m: 3.5, occupancyFactor: 1.0 },
      { name: 'Pasillo', type: 'supervised', minDistance_m: 2.5, occupancyFactor: 0.2 },
      { name: 'Exterior', type: 'public', minDistance_m: 4.0, occupancyFactor: 0.025 },
    ],
    occupancyFactors: { controlRoom: 1.0, corridor: 0.2, outdoor: 0.025, waitingRoom: 0.125 },
    designCriteria: { weeklyWorkload_hrs: 40, patientThroughput_perWeek: 250, doseConstraint_mSv_week: 0.1 },
  },
  {
    id: 'fluoroscopy-room',
    name: 'Fluoroscopia/Angiografía',
    category: 'Fluoroscopy',
    description: 'Sala de fluoroscopia con C-arm para procedimientos intervencionistas',
    roomDimensions: { width_m: 6.0, length_m: 6.5, height_m: 3.2 },
    walls: [
      { x1: 0, y1: 0, x2: 6.0, y2: 0, material: 'concrete', thickness_mm: 150, isPrimaryBarrier: true, note: 'Pared frontal - barrera primaria (C-arm lateral)' },
      { x1: 6.0, y1: 0, x2: 6.0, y2: 6.5, material: 'concrete', thickness_mm: 100, isSecondaryBarrier: true, note: 'Pared lateral derecha' },
      { x1: 6.0, y1: 6.5, x2: 0, y2: 6.5, material: 'concrete', thickness_mm: 100, isSecondaryBarrier: true, note: 'Pared posterior' },
      { x1: 0, y1: 6.5, x2: 0, y2: 0, material: 'concrete', thickness_mm: 100, isSecondaryBarrier: true, note: 'Pared lateral izquierda' },
    ],
    equipment: [
      { name: 'C-arm OEC 9900', type: 'C-arm Fluoroscopy', position: { x: 3.5, y: 3.0 }, size: { width: 1.8, depth: 1.5 }, rotation: 45, sourceType: 'X-rays', kVp_mV: '120 kVp', workload: '20 procedures/day' },
      { name: 'Surgical Table', type: 'Patient Table', position: { x: 3.2, y: 3.2 }, size: { width: 2.0, depth: 0.8 }, rotation: 0, sourceType: 'patient_scatter', kVp_mV: '120 kVp', workload: 'scatter' },
    ],
    controlledAreas: [
      { name: 'Sala de control fluoro', type: 'controlled', minDistance_m: 4.5, occupancyFactor: 1.0 },
      { name: 'Área de preparación', type: 'supervised', minDistance_m: 3.0, occupancyFactor: 0.5 },
      { name: 'Pasillo hospital', type: 'public', minDistance_m: 5.0, occupancyFactor: 0.2 },
    ],
    occupancyFactors: { controlRoom: 1.0, prepArea: 0.5, corridor: 0.2, outdoor: 0.025 },
    designCriteria: { weeklyWorkload_hrs: 30, patientThroughput_perWeek: 100, doseConstraint_mSv_week: 0.1 },
  },
  {
    id: 'mammo-hologic',
    name: 'Mamografía Hologic 3D',
    category: 'Mammography',
    description: 'Sala de mamografía con tomosíntesis (DBT)',
    roomDimensions: { width_m: 3.5, length_m: 4.5, height_m: 2.8 },
    walls: [
      { x1: 0, y1: 0, x2: 3.5, y2: 0, material: 'concrete', thickness_mm: 60, isPrimaryBarrier: true, note: 'Pared tubo - barrera primaria (baja energía)' },
      { x1: 3.5, y1: 0, x2: 3.5, y2: 4.5, material: 'concrete', thickness_mm: 50, isSecondaryBarrier: true, note: 'Pared lateral' },
      { x1: 3.5, y1: 4.5, x2: 0, y2: 4.5, material: 'concrete', thickness_mm: 50, isSecondaryBarrier: true, note: 'Pared posterior' },
      { x1: 0, y1: 4.5, x2: 0, y2: 0, material: 'concrete', thickness_mm: 50, isSecondaryBarrier: true, note: 'Pared área controlada' },
    ],
    equipment: [
      { name: 'Selenia Dimensions', type: 'Mammography DBT', position: { x: 2.0, y: 1.5 }, size: { width: 0.7, depth: 0.8 }, rotation: 0, sourceType: 'X-rays', kVp_mV: '35 kVp', workload: '40 patients/day' },
    ],
    controlledAreas: [
      { name: 'Sala de control mamografía', type: 'controlled', minDistance_m: 2.5, occupancyFactor: 1.0 },
      { name: 'Área de espera', type: 'supervised', minDistance_m: 2.0, occupancyFactor: 0.125 },
    ],
    occupancyFactors: { controlRoom: 1.0, waitingRoom: 0.125, corridor: 0.2 },
    designCriteria: { weeklyWorkload_hrs: 30, patientThroughput_perWeek: 200, doseConstraint_mSv_week: 0.02 },
  },
  {
    id: 'brachy-hdr',
    name: 'Braquiterapia HDR (Co-60)',
    category: 'Brachytherapy',
    description: 'Sala de braquiterapia de alta tasa con blindaje especializado',
    roomDimensions: { width_m: 5.0, length_m: 6.0, height_m: 3.0 },
    walls: [
      { x1: 0, y1: 0, x2: 5.0, y2: 0, material: 'heavy_concrete', thickness_mm: 800, isPrimaryBarrier: true, note: 'Pared fuente - barrera primaria (Co-60, 1.25 MeV)' },
      { x1: 5.0, y1: 0, x2: 5.0, y2: 6.0, material: 'heavy_concrete', thickness_mm: 600, isSecondaryBarrier: true, note: 'Pared lateral' },
      { x1: 5.0, y1: 6.0, x2: 0, y2: 6.0, material: 'heavy_concrete', thickness_mm: 600, isSecondaryBarrier: true, note: 'Pared posterior' },
      { x1: 0, y1: 6.0, x2: 0, y2: 0, material: 'heavy_concrete', thickness_mm: 600, isSecondaryBarrier: true, note: 'Pared acceso - barrera secundaria' },
    ],
    equipment: [
      { name: 'Flexitron HDR', type: 'HDR Brachytherapy', position: { x: 2.5, y: 2.5 }, size: { width: 1.2, depth: 0.8 }, rotation: 0, sourceType: 'Co-60', kVp_mV: '1.25 MeV', workload: '10 patients/week' },
      { name: 'Treatment Couch', type: 'Brachy Couch', position: { x: 2.5, y: 3.0 }, size: { width: 2.0, depth: 0.7 }, rotation: 0, sourceType: 'patient', kVp_mV: '1.25 MeV', workload: 'HDR source' },
    ],
    controlledAreas: [
      { name: 'Sala de control HDR', type: 'controlled', minDistance_m: 4.0, occupancyFactor: 1.0 },
      { name: 'Área de preparación', type: 'controlled', minDistance_m: 3.0, occupancyFactor: 0.5 },
      { name: 'Exterior', type: 'public', minDistance_m: 5.0, occupancyFactor: 0.025 },
    ],
    occupancyFactors: { controlRoom: 1.0, prepArea: 0.5, corridor: 0.2, outdoor: 0.025 },
    designCriteria: { weeklyWorkload_hrs: 20, patientThroughput_perWeek: 40, doseConstraint_mSv_week: 0.02 },
  },
  {
    id: 'nm-spect-gamma',
    name: 'Gamma Camera SPECT',
    category: 'Nuclear Medicine',
    description: 'Sala de medicina nuclear con cámara gamma SPECT',
    roomDimensions: { width_m: 5.5, length_m: 6.5, height_m: 3.0 },
    walls: [
      { x1: 0, y1: 0, x2: 5.5, y2: 0, material: 'concrete', thickness_mm: 150, isPrimaryBarrier: true, note: 'Pared detector - barrera primaria (Tc-99m)' },
      { x1: 5.5, y1: 0, x2: 5.5, y2: 6.5, material: 'concrete', thickness_mm: 100, isSecondaryBarrier: true, note: 'Pared lateral' },
      { x1: 5.5, y1: 6.5, x2: 0, y2: 6.5, material: 'concrete', thickness_mm: 100, isSecondaryBarrier: true, note: 'Pared posterior' },
      { x1: 0, y1: 6.5, x2: 0, y2: 0, material: 'concrete', thickness_mm: 100, isSecondaryBarrier: true, note: 'Pared acceso' },
    ],
    equipment: [
      { name: 'Discovery NM 630', type: 'SPECT Camera', position: { x: 3.0, y: 2.5 }, size: { width: 2.0, depth: 1.5 }, rotation: 0, sourceType: 'Gamma', kVp_mV: '140 keV (Tc-99m)', workload: '25 patients/day' },
    ],
    controlledAreas: [
      { name: 'Sala de control SPECT', type: 'controlled', minDistance_m: 4.0, occupancyFactor: 1.0 },
      { name: 'Área de inyección', type: 'controlled', minDistance_m: 2.5, occupancyFactor: 0.5 },
      { name: 'Exterior', type: 'public', minDistance_m: 5.0, occupancyFactor: 0.025 },
    ],
    occupancyFactors: { controlRoom: 1.0, injectionArea: 0.5, corridor: 0.2, outdoor: 0.025 },
    designCriteria: { weeklyWorkload_hrs: 40, patientThroughput_perWeek: 125, doseConstraint_mSv_week: 0.02 },
  },
  {
    id: 'shielded-wall-pb',
    name: 'Muro Blindado Pb (Modular)',
    category: 'Shielded Room',
    description: 'Sala con blindaje modular de plomo para baja energía',
    roomDimensions: { width_m: 4.0, length_m: 5.0, height_m: 2.8 },
    walls: [
      { x1: 0, y1: 0, x2: 4.0, y2: 0, material: 'lead_sheet', thickness_mm: 3, isPrimaryBarrier: true, note: 'Placa Pb 3mm - barrera primaria' },
      { x1: 4.0, y1: 0, x2: 4.0, y2: 5.0, material: 'lead_sheet', thickness_mm: 2, isSecondaryBarrier: true, note: 'Placa Pb 2mm - barrera secundaria' },
      { x1: 4.0, y1: 5.0, x2: 0, y2: 5.0, material: 'lead_sheet', thickness_mm: 2, isSecondaryBarrier: true, note: 'Placa Pb 2mm - barrera secundaria' },
      { x1: 0, y1: 5.0, x2: 0, y2: 0, material: 'lead_sheet', thickness_mm: 2, isSecondaryBarrier: true, note: 'Placa Pb 2mm - barrera secundaria' },
    ],
    equipment: [
      { name: 'Portable X-ray', type: 'Portable Unit', position: { x: 2.0, y: 2.0 }, size: { width: 0.5, depth: 0.4 }, rotation: 0, sourceType: 'X-rays', kVp_mV: '100 kVp', workload: 'Mobile use' },
    ],
    controlledAreas: [
      { name: 'Área operador', type: 'controlled', minDistance_m: 3.0, occupancyFactor: 1.0 },
      { name: 'Pasillo', type: 'supervised', minDistance_m: 2.0, occupancyFactor: 0.2 },
    ],
    occupancyFactors: { operatorArea: 1.0, corridor: 0.2, outdoor: 0.025 },
    designCriteria: { weeklyWorkload_hrs: 10, patientThroughput_perWeek: 50, doseConstraint_mSv_week: 0.1 },
  },
  {
    id: 'maze-neutron',
    name: 'Laberinto Neutrones (Búnker)',
    category: 'Maze',
    description: 'Laberinto para blindaje de neutrones en búnker de acelerador',
    roomDimensions: { width_m: 2.5, length_m: 5.0, height_m: 3.0 },
    walls: [
      { x1: 0, y1: 0, x2: 2.5, y2: 0, material: 'heavy_concrete', thickness_mm: 1800, isPrimaryBarrier: true, note: 'Pared interior búnker - barrera primaria neutrones' },
      { x1: 2.5, y1: 0, x2: 2.5, y2: 3.5, material: 'heavy_concrete', thickness_mm: 1200, isSecondaryBarrier: true, note: 'Pared guía laberinto' },
      { x1: 2.5, y1: 3.5, x2: 0, y2: 3.5, material: 'heavy_concrete', thickness_mm: 1200, isSecondaryBarrier: true, note: 'Pared intermedia' },
      { x1: 0, y1: 3.5, x2: 0, y2: 5.0, material: 'heavy_concrete', thickness_mm: 1000, isSecondaryBarrier: true, note: 'Pared final laberinto' },
      { x1: 0, y1: 5.0, x2: 2.5, y2: 5.0, material: 'heavy_concrete', thickness_mm: 1000, isSecondaryBarrier: true, note: 'Pared exterior salida' },
    ],
    equipment: [
      { name: 'Neutron Source', type: 'Neutron Generator', position: { x: 1.25, y: 0.5 }, size: { width: 0.8, depth: 0.6 }, rotation: 0, sourceType: 'Neutrons', kVp_mV: '14 MeV', workload: 'Research' },
    ],
    controlledAreas: [
      { name: 'Sala de control', type: 'controlled', minDistance_m: 8.0, occupancyFactor: 1.0 },
      { name: 'Salida laberinto', type: 'supervised', minDistance_m: 5.0, occupancyFactor: 0.2 },
    ],
    occupancyFactors: { controlRoom: 1.0, mazeExit: 0.2, outdoor: 0.025 },
    designCriteria: { weeklyWorkload_hrs: 10, patientThroughput_perWeek: 10, doseConstraint_mSv_week: 0.02 },
  },
];

export interface AppliedTemplate {
  templateId: string;
  appliedAt: Date;
  name: string;
  isCustomized: boolean;
}

export function useRoomTemplates() {
  const [appliedTemplates, setAppliedTemplates] = useState<AppliedTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const templates = ROOM_TEMPLATES;

  const applyTemplate = useCallback((templateId: string): RoomTemplate | undefined => {
    const template = ROOM_TEMPLATES.find(t => t.id === templateId);
    if (!template) return undefined;

    setActiveTemplate(templateId);
    setAppliedTemplates(prev => [
      ...prev.filter(t => t.templateId !== templateId),
      {
        templateId,
        appliedAt: new Date(),
        name: template.name,
        isCustomized: false,
      }
    ]);
    return template;
  }, []);

  const customizeTemplate = useCallback((templateId: string) => {
    setAppliedTemplates(prev =>
      prev.map(t =>
        t.templateId === templateId ? { ...t, isCustomized: true } : t
      )
    );
  }, []);

  const removeTemplate = useCallback((templateId: string) => {
    setAppliedTemplates(prev => prev.filter(t => t.templateId !== templateId));
    if (activeTemplate === templateId) {
      setActiveTemplate(null);
    }
  }, [activeTemplate]);

  const getTemplateById = useCallback((templateId: string): RoomTemplate | undefined => {
    return ROOM_TEMPLATES.find(t => t.id === templateId);
  }, []);

  const getTemplatesByCategory = useCallback((category: RoomTemplate['category']): RoomTemplate[] => {
    return ROOM_TEMPLATES.filter(t => t.category === category);
  }, []);

  const categories = Array.from(new Set(ROOM_TEMPLATES.map(t => t.category)));

  return {
    templates,
    categories,
    appliedTemplates,
    activeTemplate,
    showPanel,
    setShowPanel,
    applyTemplate,
    customizeTemplate,
    removeTemplate,
    getTemplateById,
    getTemplatesByCategory,
  };
}

export { ROOM_TEMPLATES };
