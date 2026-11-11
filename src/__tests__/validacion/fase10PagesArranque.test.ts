/**
 * Fase 10 — arranque en GitHub Pages: el demo R&F autoguardado por versiones anteriores no se restaura, la limpieza de
 * service workers se limita a esta app y el despliegue publica sólo la punta de main, uno a la vez.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { esPlanoDemoAntiguo, planoEjemploCompleto, planoVacio } from '@/lib/ejemploGuiado';
import type { FloorPlan } from '@/types/radshield';

const leer = (f: string) => readFileSync(f, 'utf8');
const fuente = (id: string) => ({ id }) as FloorPlan['sources'][number];

describe('Fase 10: arranque en Pages', () => {
  it('reconoce el demo R&F de las versiones anteriores y no los proyectos propios ni el ejemplo «Guíame»', () => {
    expect(esPlanoDemoAntiguo({ name: 'Demo - R&F Room (RadShield Fig.6)', sources: [] })).toBe(true);
    expect(esPlanoDemoAntiguo({ name: 'Plano de Blindaje 1', sources: [fuente('source-chest'), fuente('source-table'), fuente('source-fluoro')] })).toBe(true);
    expect(esPlanoDemoAntiguo({ name: 'Sala 3', sources: [fuente('source-chest'), fuente('mi-fuente')] })).toBe(false);
    expect(esPlanoDemoAntiguo(planoEjemploCompleto())).toBe(false);
    expect(esPlanoDemoAntiguo(planoVacio())).toBe(false);
    expect(esPlanoDemoAntiguo(null)).toBe(false);
  });

  it('el diseñador descarta el demo autoguardado antes de restaurar la sesión', () => {
    const sd = leer('src/pages/ShieldingDesigner.tsx');
    const i = sd.indexOf('const saved = loadCurrent();');
    expect(i).toBeGreaterThan(0);
    const bloque = sd.slice(i, i + 600);
    expect(bloque.indexOf('esPlanoDemoAntiguo(saved)')).toBeLessThan(bloque.indexOf('resetFloorPlan(saved)'));
    expect(bloque).toMatch(/sessionStorage\.removeItem\('radshield_mx_current'\)/);
  });

  it('index.html sólo retira service workers y cachés de su propia base, y recarga una vez si uno controlaba la página', () => {
    const html = leer('index.html');
    expect(html).toMatch(/new URL\(r\.scope\)\.pathname\.indexOf\(base\) === 0/);
    expect(html).toMatch(/'radshield-' \+ base \+ ':'/);
    expect(html).toMatch(/navigator\.serviceWorker\.controller/);
    expect(html).toMatch(/radshield-sw-retirado/);
    expect(html).not.toMatch(/registrations\.forEach\(function \(registration\) \{ registration\.unregister\(\); \}\)/);
  });

  it('el despliegue de Pages va en serie, sólo publica la punta de main y deja version.json con el commit', () => {
    const ci = leer('.github/workflows/ci.yml');
    expect(ci).toMatch(/concurrency:\n\s+group: github-pages\n\s+cancel-in-progress: false/);
    expect(ci).toMatch(/git ls-remote "https:\/\/github\.com\/\$\{GITHUB_REPOSITORY\}\.git" refs\/heads\/main/);
    expect(ci.match(/if: steps\.punta\.outputs\.publicar == 'true'/g)?.length).toBe(4);
    expect(ci).toMatch(/> dist\/version\.json/);
  });
});
