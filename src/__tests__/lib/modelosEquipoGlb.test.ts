import { describe, expect, it } from 'vitest';
import {
  MODELOS_EQUIPO_GLB,
  baseModelosGlb,
  colocacionModeloGlb,
  modeloGlbParaEquipo,
  orientacionPorOmisionGlb_deg,
} from '@/lib/medical3D/modelosEquipoGlb';
import { buildMedicalScene } from '@/lib/medical3D/sceneBuilder';

describe('Fase 13: modelos GLB de equipos', () => {
  it('las alturas del isocentro son las de las fichas', () => {
    const h = Object.fromEntries(MODELOS_EQUIPO_GLB.map((m) => [m.clave, m.alturaIsocentro_m]));
    expect(h).toEqual({
      elekta_versa_hd: 1.24,
      elekta_leksell_gamma_knife: 0.967,
      siemens_biograph_trinion: 1.064,
      elekta_studio_braquiterapia: 1.117,
    });
    expect(MODELOS_EQUIPO_GLB.find((m) => m.clave === 'elekta_leksell_gamma_knife')?.isocentroEstimado).toBe(true);
  });

  it('elige el modelo por el perfil del equipo y por modalidad sin otro fabricante', () => {
    expect(modeloGlbParaEquipo({ name: 'Elekta Versa HD 6 MV', kind: 'linac' })?.archivo).toBe('elekta_versa_hd_web.glb');
    expect(modeloGlbParaEquipo({ name: 'Leksell Gamma Knife Icon', kind: 'gammaKnife' })?.archivo).toBe('elekta_leksell_gamma_knife_web.glb');
    expect(modeloGlbParaEquipo({ name: 'Biograph Trinion F-18', kind: 'petct' })?.archivo).toBe('siemens_biograph_trinion_web.glb');
    expect(modeloGlbParaEquipo({ name: 'Flexitron Ir-192', kind: 'hdr' })?.archivo).toBe('elekta_studio_braquiterapia_web.glb');
    expect(modeloGlbParaEquipo({ name: 'LINAC bunker', kind: 'linac' })?.clave).toBe('elekta_versa_hd');
    expect(modeloGlbParaEquipo({ name: 'Varian TrueBeam 10 MV', kind: 'linac' })).toBeNull();
    expect(modeloGlbParaEquipo({ name: 'GE Discovery MI', kind: 'petct' })).toBeNull();
    expect(modeloGlbParaEquipo({ name: 'CT simulador', kind: 'ct' })).toBeNull();
    expect(modeloGlbParaEquipo({ name: 'Radiofarmacia', kind: 'radiofarmacia' })).toBeNull();
  });

  it('sin ruta base no se pide ningún GLB (respaldo a la representación actual)', () => {
    expect(baseModelosGlb('')).toBeNull();
    expect(baseModelosGlb(undefined)).toBeNull();
    expect(baseModelosGlb('/modelos-equipo')).toBe('/modelos-equipo/');
    expect(colocacionModeloGlb({ name: 'Versa HD', kind: 'linac', position: [1, 0, 2], rotationY: 0 }, { base: null })).toBeNull();
    // En el entorno de pruebas VITE_EQUIPO_GLB_BASE no está definida.
    expect(baseModelosGlb()).toBeNull();
    expect(orientacionPorOmisionGlb_deg('abc')).toBe(0);
    expect(orientacionPorOmisionGlb_deg('90')).toBe(90);
  });

  it('coloca el origen del GLB en el isocentro del búnker con la orientación configurable', () => {
    const fuentes = [{ id: 'versa-6', x: 400, y: 300, name: 'Elekta Versa HD 6 MV', manufacturerVariant: 'Elekta Versa HD' }];
    const plano = {
      id: 'p', name: 'p', imageUrl: null, scale_m_per_pixel: 0.01, width_pixels: 900, height_pixels: 700,
      barriers: [], sources: fuentes, occupiedRegions: [], regions: [], criticalPoints: [],
    };
    const escena = buildMedicalScene(plano as never, 'linac');
    const eq = escena.equipment[0];
    const c = colocacionModeloGlb(eq, { base: 'https://modelos.local/glb', orientacion_deg: 90 });
    expect(c?.url).toBe('https://modelos.local/glb/elekta_versa_hd_web.glb');
    expect(c?.rootUrl).toBe('https://modelos.local/glb/');
    expect(c?.posicion[0]).toBeCloseTo(eq.position[0]);
    expect(c?.posicion[1]).toBeCloseTo(1.24);
    expect(c?.posicion[2]).toBeCloseTo(eq.position[2]);
    expect(c?.rotacionY).toBeCloseTo(Math.PI / 2);
  });
});
