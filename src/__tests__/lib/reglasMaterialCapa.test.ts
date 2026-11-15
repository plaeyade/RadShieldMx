/**
 * Hallazgos 2, 6 y 7 (auditoría independiente 2026-11): material, espesor y rol de capa por reglas explícitas sobre el nombre LOCAL
 * de la capa (sin el prefijo del XREF ligado).
 */
import { describe, expect, it } from 'vitest';
import { inferirMaterialCapa, nombreLocalCapa, importDXFToFloorPlan, REGLAS_MATERIAL_CAPA } from '@/lib/medical3D/cadBimBridge';
import { inferDxfLayerRole } from '@/lib/f213DxfLayerMappingQa';

describe('reglas explícitas de material por capa', () => {
  it('nombre local de una capa de XREF ligado', () => {
    expect(nombreLocalCapa('XREF PB HOSPITAL$0$TABIQUES BLINDADOS')).toBe('TABIQUES BLINDADOS');
    expect(nombreLocalCapa('XREF AZ X$0$XREF PB X$0$BUNKER')).toBe('BUNKER');
    expect(nombreLocalCapa('MUROS')).toBe('MUROS');
  });

  it.each([
    // «PB» del nombre del XREF (planta baja) ya no es plomo.
    ['XREF PB HOSPITAL$0$MUROS', 'concreto', 'omision'],
    ['XREF PB HOSPITAL$0$TABIQUES BLINDADOS', 'concreto', 'concreto'],
    ['XREF  PB EDIFICIO$0$MUROS DE TABLAROCA', 'concreto', 'omision'],
    ['MUROS PB', 'concreto', 'omision'],
    ['XREF 2N HOSPITAL$0$MUROS CON PROTECCION PLOMO', 'plomo', 'plomo'],
    ['DOOR_LEAD_6MM', 'plomo', 'plomo'],
    ['PUERTA PB 2MM', 'plomo', 'pb-espesor'],
    ['Pb-1.5', 'plomo', 'pb-espesor'],
    ['LAMINA DE PB', 'plomo', 'pb-espesor'],
    ['MURO EMPLOMADO', 'plomo', 'plomo'],
    ['VIDRIO PLOMADO', 'vidrio_plomo', 'vidrio-plomado'],
    ['MIRILLA PB', 'vidrio_plomo', 'vidrio-plomado'],
    ['VENTANAS', 'concreto', 'omision'],
    ['CONCRETO BARITADO', 'concreto_baritado', 'baritado'],
    ['PLACA ACERO', 'acero', 'acero'],
    ['TABIQUE NIPOL 4', 'NIPOL400', 'nipol-4'],
    ['NIPOL 5.0', 'NIPOL500', 'nipol-5'],
    ['NIPOL', 'NIPOL350', 'nipol-3.5'],
    ['BOVEDA CICLOTRON', 'concreto', 'concreto'],
  ])('%s → %s (%s)', (capa, material, regla) => {
    const r = inferirMaterialCapa(capa);
    expect(r.material).toBe(material);
    expect(r.regla).toBe(regla);
    expect(r.declarado).toBe(regla !== 'omision');
  });

  it('las reglas tienen id único y descripción', () => {
    const ids = REGLAS_MATERIAL_CAPA.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(REGLAS_MATERIAL_CAPA.every((r) => r.descripcion.length > 3)).toBe(true);
  });

  it('rol de capa por el nombre local; la bóveda del ciclotrón es barrera', () => {
    expect(inferDxfLayerRole('XREF PB HOSPITAL$0$BOVEDA CYCLOTRON')).toBe('barrier');
    expect(inferDxfLayerRole('XREF PB HOSPITAL$0$CYCLOTRON')).toBe('equipment');
    expect(inferDxfLayerRole('XREF PB HOSPITAL$0$MOBILIARIO')).toBe('unmapped');
    expect(inferDxfLayerRole('XREF PB HOSPITAL')).toBe('reference');
  });

  it('importador: espesor sólo con unidad (no «1N» → 1 mm), override de material y aviso de material no declarado', () => {
    const contenido = [
      '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n6\n0\nENDSEC',
      '0\nSECTION\n2\nENTITIES',
      '0\nLINE\n8\nXREF 1N HOSPITAL$0$MUROS\n10\n0\n20\n0\n11\n5\n21\n0',
      '0\nLINE\n8\nXREF 1N HOSPITAL$0$TABIQUES BLINDADOS 300MM\n10\n0\n20\n1\n11\n5\n21\n1',
      '0\nENDSEC\n0\nEOF',
    ].join('\n');
    const { floorPlan, summary } = importDXFToFloorPlan(contenido, 'n1.dxf');
    const muros = floorPlan.barriers.find((b) => b.name.includes('$0$MUROS'))!;
    const tab = floorPlan.barriers.find((b) => b.name.includes('TABIQUES'))!;
    expect(muros.requiredThickness_mm).toBe(200);
    expect(muros.thickness_mm).toBeUndefined();
    expect(tab.thickness_mm).toBe(300);
    expect(summary.warnings.join(' ')).toMatch(/sin material declarado.*XREF 1N HOSPITAL\$0\$MUROS/);
    const conOverride = importDXFToFloorPlan(contenido, 'n1.dxf', { layerMaterialOverrides: { 'XREF 1N HOSPITAL$0$MUROS': 'NIPOL400' } });
    expect(conOverride.floorPlan.barriers.find((b) => b.name.includes('$0$MUROS'))!.materialCode).toBe('NIPOL400');
  });
});
