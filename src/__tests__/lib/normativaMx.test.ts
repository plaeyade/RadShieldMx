import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NOM_008_NUCL } from '@/lib/normativaMx';
import { ALL_REFERENCES } from '@/lib/bibliography';
import { getRegulationById } from '@/lib/internationalRegulations';

const SRC = join(__dirname, '..', '..');

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '__tests__' ? [] : archivos(p);
    return /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

describe('NOM-008-NUCL-2024 (sustituye a la NOM-008-NUCL-2011)', () => {
  it('ficha con publicación DOF, sustitución y umbrales de zonas sin cambio respecto a 2011', () => {
    expect(NOM_008_NUCL.clave).toBe('NOM-008-NUCL-2024');
    expect(NOM_008_NUCL.publicacionDof).toBe('2024-05-24');
    expect(NOM_008_NUCL.sustituyeA).toContain('NOM-008-NUCL-2011');
    expect(NOM_008_NUCL.urlDof).toMatch(/^https:\/\/www\.dof\.gob\.mx\//);
    expect(NOM_008_NUCL.zonas).toEqual({ radiacion_mSv_h: 0.05, radiacion_mSv_5dias: 1, altaRadiacion_mSv_h: 1 });
  });

  it('bibliografía y catálogo regulatorio la citan sin atribuirle límites de dosis', () => {
    const ref = ALL_REFERENCES.find((b) => b.id === 'REF023');
    expect(ref?.citation).toBe(NOM_008_NUCL.cita);
    expect(ref?.url).toBe(NOM_008_NUCL.urlDof);
    const reg = getRegulationById('nom-008');
    expect(reg?.code).toBe('NOM-008-NUCL-2024');
    expect(reg?.doseLimits_mSv_yr).toBeUndefined();
  });

  it('ningún archivo de src cita ediciones inexistentes o derogadas ni el rótulo «NOM-008-ENER»', () => {
    // La 2011 sólo puede aparecer para decir que fue sustituida/derogada.
    const vieja = (linea: string) =>
      /NOM-008-(?:NUCL-20(?:17|18)|ENER)/.test(linea) ||
      (/NOM-008-NUCL-2011/.test(linea) && !/sustitu|deroga|supersede/i.test(linea));
    const conReferenciaVieja = archivos(SRC)
      .filter((p) => readFileSync(p, 'utf-8').split('\n').some(vieja))
      .map((p) => relative(SRC, p));
    expect(conReferenciaVieja).toEqual([]);
  });

  it('ningún archivo de src cita «NOM-008-NUCL» sin año: se usa NOM_008_NUCL.clave', () => {
    const sinAnio = /NOM-008-NUCL(?!-\d{4})(?![\w-])/;
    const conCitaSinAnio = archivos(SRC)
      .filter((p) => !p.endsWith('normativaMx.ts'))
      .filter((p) => readFileSync(p, 'utf-8').split('\n').some((l) => sinAnio.test(l)))
      .map((p) => relative(SRC, p));
    expect(conCitaSinAnio).toEqual([]);
  });
});
