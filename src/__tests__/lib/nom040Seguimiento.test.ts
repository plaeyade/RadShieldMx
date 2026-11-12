/**
 * Seguimiento de la NOM-040-NUCL-2016 (#51): consola de PET en zona controlada, recintos que exige la norma en las
 * plantillas de medicina nuclear, NOM-033 (no NOM-040) en reportes de linac y una sola ficha de la NOM-013-NUCL-2009.
 * Cada bloque falla si el error reaparece.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NOM_013_NUCL,
  NOM_033_NUCL,
  NOM_040_NUCL,
  citasMxAplicables,
  normasMxAplicables,
} from '@/lib/normativaMx';
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from '@/lib/limitesDosis';
import { buildDefaultControlledZoneProfile, generateControlledZoneFeasibility } from '@/lib/controlledZoneFeasibility';
import { ROOM_TEMPLATES } from '@/hooks/useRoomTemplates';
import { MODALITIES } from '@/types/radshield';

const SRC = join(__dirname, '..', '..');
const leer = (rel: string) => readFileSync(join(SRC, rel), 'utf-8');

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '__tests__' ? [] : archivos(p);
    return /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

const opciones = () => generateControlledZoneFeasibility(buildDefaultControlledZoneProfile());
const pet = () => {
  const o = opciones().find((x) => x.modality === 'PET-CT');
  if (!o) throw new Error('sin plantilla PET-CT');
  return o;
};

describe('1 · Consola de PET en zona controlada (NOM-040-NUCL-2016 §5.1.7.3)', () => {
  it('la consola del PET-CT es zona controlada con P = 0.1 mSv/semana de limitesDosis.ts', () => {
    const consola = pet().rooms.find((r) => r.id === 'control');
    expect(consola?.zone).toBe('controlada');
    expect(consola?.designGoal_mSvWeek).toBe(P_CONTROLADA_mSv_semana);
    expect(consola?.designGoal_mSvWeek).toBe(0.1);
    expect(consola?.numeralNorma).toContain('§5.1.7.3');
  });

  it('ningún recinto de una plantilla de medicina nuclear queda «supervisado»', () => {
    const mn = opciones().filter((o) => o.modality === 'PET-CT' || o.modality === 'Radiofarmacia');
    expect(mn.length).toBeGreaterThan(0);
    for (const o of mn) expect(o.rooms.filter((r) => r.zone !== 'controlada').map((r) => r.name)).toEqual([]);
  });

  it('el objetivo de cada recinto sale de su zona (0.1 controlada / 0.02 no controlada) en todas las plantillas', () => {
    for (const o of opciones()) {
      for (const r of o.rooms) {
        expect(r.designGoal_mSvWeek).toBe(r.zone === 'controlada' ? P_CONTROLADA_mSv_semana : P_NO_CONTROLADA_mSv_semana);
      }
    }
  });

  it('las semillas de barrera no cambian (los recintos no entran al cálculo)', () => {
    const goals = pet().shieldingSeeds.map((s) => [s.barrier, s.designGoal_mSvWeek, s.occupancyFactor, s.distance_m]);
    expect(goals).toEqual([
      ['Norte', 0.1, 0.5, 10],
      ['Sur', 0.02, 1, 20 / 2.4],
      ['Este', 0.1, 0.25, 8],
      ['Oeste', 0.1, 0.25, 8],
      ['Techo', 0.02, 1, 3],
    ]);
  });
});

describe('2 · Recintos de la NOM-040-NUCL-2016 en plantillas y checklists', () => {
  const ids = ['almacen-desechos', 'descontaminacion', 'sanitario-inyectados', 'hospitalizacion-i131', 'detector-alarma'];

  it('la ficha lista los cinco requisitos con su numeral', () => {
    expect(NOM_040_NUCL.recintos.map((r) => r.id)).toEqual(ids);
    const numeral = Object.fromEntries(NOM_040_NUCL.recintos.map((r) => [r.id, r.numeral]));
    expect(numeral['almacen-desechos']).toContain('§5.1.3');
    expect(numeral['descontaminacion']).toContain('§5.3.3');
    expect(numeral['sanitario-inyectados']).toContain('§5.1.8');
    expect(numeral['hospitalizacion-i131']).toContain('§5.3.7');
    expect(numeral['detector-alarma']).toContain('§6.1.1.4');
  });

  it('las plantillas de sala de medicina nuclear (PET-CT y SPECT) listan todos los recintos con la clave y el numeral', () => {
    const mn = ROOM_TEMPLATES.filter((t) => t.category === 'PET-CT' || t.category === 'Nuclear Medicine');
    expect(mn.length).toBeGreaterThanOrEqual(2);
    for (const t of mn) {
      expect(t.recintosNormativos?.map((r) => r.id)).toEqual(ids);
      for (const r of t.recintosNormativos ?? []) expect(r.numeral).toMatch(/^NOM-040-NUCL-2016 §\d/);
    }
  });

  it('los recintos normativos no alteran las barreras ni las regiones que crea una plantilla (proyectos guardados intactos)', () => {
    const petTpl = ROOM_TEMPLATES.find((t) => t.id === 'pet-ct-ge-dmi');
    expect(petTpl?.controlledAreas.map((a) => a.name)).toEqual([
      'Sala de control PET-CT',
      'Área de espera post-inyección',
      'Exterior (estacionamiento)',
    ]);
  });

  it('el estudio de factibilidad PET-CT incluye almacén de desechos, descontaminación y sanitario, y avisa hospitalización y detector', () => {
    const o = pet();
    for (const id of ['waste', 'decon', 'wc-inyectados']) {
      const r = o.rooms.find((x) => x.id === id);
      expect(r?.zone).toBe('controlada');
      expect(r?.numeralNorma).toMatch(/^NOM-040-NUCL-2016 §/);
    }
    expect(o.nextActions.join('\n')).toMatch(/§5\.3\.7/);
    expect(o.nextActions.join('\n')).toMatch(/§6\.1\.1\.4/);
    // Los recintos quedan dentro de la huella de la plantilla (3 columnas cuando hay más de 6).
    for (const r of o.rooms) expect(r.y_m).toBeLessThan(20);
  });

  it('el checklist CNSNS genera un ítem por recinto desde la ficha', () => {
    const src = leer('sections/dialogs/CNSNSChecklistDialog.tsx');
    expect(src).toMatch(/NOM_040_NUCL\.recintos\.map/);
    expect(src).toMatch(/id: `040-r-\$\{r\.id\}`/);
  });
});

describe('3 · Reportes de linac: NOM-033-NUCL-2016, no NOM-040-NUCL-2016', () => {
  const linac = MODALITIES.filter((m) => m.id.startsWith('linac'));
  const mn = MODALITIES.filter((m) => m.category === 'nuclear');

  it('ficha NOM-033-NUCL-2016 (DOF 04-08-2016, vigente, alcance sólo linac)', () => {
    expect(NOM_033_NUCL.clave).toBe('NOM-033-NUCL-2016');
    expect(NOM_033_NUCL.publicacionDof).toBe('2016-08-04');
    expect(NOM_033_NUCL.urlDof).toMatch(/codigo=5446806/);
    expect(NOM_033_NUCL.sustituyeA).toContain('NOM-033-NUCL-1999');
  });

  it('un proyecto de linac cita RGSR, NOM-008 y NOM-033; nunca NOM-040 ni NOM-013', () => {
    const n = normasMxAplicables(linac);
    expect(n).toEqual(['RGSR (1988)', 'NOM-008-NUCL-2024', 'NOM-033-NUCL-2016']);
    expect(citasMxAplicables(linac).join('\n')).not.toMatch(/NOM-040|NOM-013/);
  });

  it('un proyecto de medicina nuclear cita NOM-040 y NOM-013; nunca NOM-033', () => {
    const n = normasMxAplicables(mn);
    expect(n).toContain(NOM_040_NUCL.clave);
    expect(n).toContain(NOM_013_NUCL.clave);
    expect(n).not.toContain(NOM_033_NUCL.clave);
  });

  it('ni el checklist de certificación ni los reportes llevan la NOM-040 fija', () => {
    const conNom040Fija = [
      'sections/dialogs/CertificationModeDialog.tsx',
      'sections/dialogs/PdfReportDialog.tsx',
      'sections/dialogs/RegulatoryReportDialog.tsx',
      'lib/excelExport.ts',
      'hooks/usePDFGenerator.ts',
      'hooks/useCNSNSReport.ts',
    ].filter((rel) => /NOM-040|NOM_040/.test(leer(rel).replace(/^\s*(?:\/\/|\*).*$/gm, '')));
    expect(conNom040Fija).toEqual([]);
  });
});

describe('4 · NOM-013-NUCL-2009: una sola ficha', () => {
  it('ficha con publicación DOF 20-10-2009 y título de egreso de pacientes', () => {
    expect(NOM_013_NUCL.clave).toBe('NOM-013-NUCL-2009');
    expect(NOM_013_NUCL.publicacionDof).toBe('2009-10-20');
    expect(NOM_013_NUCL.urlDof).toMatch(/codigo=5114948/);
    expect(NOM_013_NUCL.titulo).toMatch(/egresar a pacientes/);
  });

  it('ningún archivo de src ni el manual cita otra edición o rótulo de la NOM-013, ni la escribe fuera de la ficha', () => {
    const mala = /NOM-013-(?!NUCL-2009)|NOM-041-NUCL[^\n]{0,60}liberaci/i;
    const literal = /NOM-013-NUCL-2009/;
    const fuera = archivos(SRC)
      .filter((p) => !p.endsWith('normativaMx.ts'))
      .filter((p) => readFileSync(p, 'utf-8').split('\n').some((l) => mala.test(l) || literal.test(l)))
      .map((p) => relative(SRC, p));
    expect(fuera).toEqual([]);
    const manual = readFileSync(join(SRC, '..', 'MANUAL_USUARIO_v99.md'), 'utf-8');
    expect(manual).not.toMatch(/NOM-013-(?!NUCL-2009)/);
  });
});
