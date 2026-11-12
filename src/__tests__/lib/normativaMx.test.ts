import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NOM_008_NUCL, NOM_040_NUCL } from '@/lib/normativaMx';
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

describe('NOM-040-NUCL-2016 (medicina nuclear)', () => {
  it('ficha con año, título oficial, publicación DOF y alcance exclusivo de medicina nuclear', () => {
    expect(NOM_040_NUCL.clave).toBe('NOM-040-NUCL-2016');
    expect(NOM_040_NUCL.titulo).toBe('Requisitos de seguridad radiológica para la práctica de medicina nuclear');
    expect(NOM_040_NUCL.publicacionDof).toBe('2016-08-04');
    expect(NOM_040_NUCL.urlDof).toMatch(/^https:\/\/www\.dof\.gob\.mx\/.*codigo=5446807/);
    expect(NOM_040_NUCL.alcance).toMatch(/no aplica a radioterapia/i);
    const secciones = NOM_040_NUCL.requisitosDiseno.map((r) => r.seccion);
    for (const s of ['§5.1', '§5.2.1', '§5.2.8', '§5.3.1', '§5.3.2', '§5.3.7', '§6.1.1']) expect(secciones).toContain(s);
    expect(existsSync(join(SRC, '..', NOM_040_NUCL.fichaFuente))).toBe(true);
    expect(NOM_040_NUCL.urlPdf).toMatch(/^https:\/\/platiica\.economia\.gob\.mx\//);
  });

  it('la bibliografía la cita con su título (no «Instalaciones de radioterapia»)', () => {
    const ref = ALL_REFERENCES.find((b) => b.id === 'REF024');
    expect(ref?.citation).toBe(NOM_040_NUCL.cita);
    expect(ref?.year).toBe(2016);
  });

  it('ningún archivo de src cita «NOM-040-NUCL» sin año: se usa NOM_040_NUCL.clave', () => {
    const sinAnio = /NOM-040-NUCL(?!-\d{4})(?![\w-])/;
    const conCitaSinAnio = archivos(SRC)
      .filter((p) => !p.endsWith('normativaMx.ts'))
      .filter((p) => readFileSync(p, 'utf-8').split('\n').some((l) => sinAnio.test(l)))
      .map((p) => relative(SRC, p));
    expect(conCitaSinAnio).toEqual([]);
  });

  it('ningún archivo de src presenta la NOM-040-NUCL como norma de radioterapia', () => {
    const malTitulada = /NOM-040[^\n]{0,80}(?:instalaciones de radioterapia|radioterapia \(CNSNS\)|instalaciones radioterapia)/i;
    const glosario = /term: 'NOM-040[^']*', def: '[^']*radioterapia\.'/i;
    const conTituloErroneo = archivos(SRC)
      .filter((p) => readFileSync(p, 'utf-8').split('\n').some((l) => malTitulada.test(l) || glosario.test(l)))
      .map((p) => relative(SRC, p));
    expect(conTituloErroneo).toEqual([]);
  });
});
