/** Fase 10: lógica del asistente «Guíame» (saltar, pausar, reanudar, reiniciar) y estados vacíos. */
import { describe, expect, it } from 'vitest';
import {
  CLAVE_PROGRESO_GUIA, PASOS_GUIA, PROGRESO_INICIAL, guardarProgreso, leerProgreso, pasoCumplido, reducirGuia, type ProgresoGuia,
} from '@/lib/guiaPasos';
import { planoEjemploCompleto, planoVacio } from '@/lib/ejemploGuiado';
import { faltaEnProyecto, filasResultados } from '@/lib/resumenResultados';

const memoria = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; };

describe('reducirGuia', () => {
  it('sigue el orden pedido: proyecto → plano → fuentes → ocupación → cálculo → cumplimiento → reporte', () => {
    expect(PASOS_GUIA.map((p) => p.id)).toEqual(['proyecto', 'plano', 'fuentes', 'ocupacion', 'calculo', 'cumplimiento', 'reporte']);
  });

  it('iniciar, avanzar, saltar y terminar', () => {
    let p = reducirGuia(PROGRESO_INICIAL, { tipo: 'iniciar' });
    expect(p).toMatchObject({ estado: 'activo', paso: 0 });
    p = reducirGuia(p, { tipo: 'saltar' });
    expect(p.paso).toBe(1);
    expect(p.saltados).toEqual(['proyecto']);
    for (let i = 0; i < 10; i++) p = reducirGuia(p, { tipo: 'siguiente' });
    expect(p.estado).toBe('terminado');
    expect(p.paso).toBe(PASOS_GUIA.length - 1);
  });

  it('pausar y reanudar conservan el paso; reanudar tras terminar reinicia', () => {
    let p: ProgresoGuia = { ...PROGRESO_INICIAL, estado: 'activo', paso: 3 };
    p = reducirGuia(p, { tipo: 'pausar' });
    expect(p).toMatchObject({ estado: 'pausado', paso: 3 });
    p = reducirGuia(p, { tipo: 'reanudar' });
    expect(p).toMatchObject({ estado: 'activo', paso: 3 });
    p = reducirGuia({ ...p, estado: 'terminado' }, { tipo: 'reanudar' });
    expect(p).toMatchObject({ estado: 'activo', paso: 0, saltados: [] });
  });

  it('«ir» y «anterior» quedan dentro del rango', () => {
    const p = reducirGuia({ ...PROGRESO_INICIAL, estado: 'activo' }, { tipo: 'ir', paso: 99 });
    expect(p.paso).toBe(PASOS_GUIA.length - 1);
    expect(reducirGuia({ ...p, paso: 0 }, { tipo: 'anterior' }).paso).toBe(0);
  });
});

describe('persistencia', () => {
  it('guarda y lee; datos corruptos o ajenos vuelven al inicio', () => {
    const s = memoria();
    const p: ProgresoGuia = { estado: 'pausado', paso: 4, saltados: ['plano'], visitados: ['cumplimiento'], usaEjemplo: true };
    guardarProgreso(s, p);
    expect(leerProgreso(s)).toEqual(p);
    s.setItem(CLAVE_PROGRESO_GUIA, '{no json');
    expect(leerProgreso(s)).toEqual(PROGRESO_INICIAL);
    s.setItem(CLAVE_PROGRESO_GUIA, JSON.stringify({ estado: 'x', paso: -5, saltados: ['otro'] }));
    expect(leerProgreso(s)).toEqual(PROGRESO_INICIAL);
    expect(leerProgreso(null)).toEqual(PROGRESO_INICIAL);
  });

  it('almacenamiento que lanza no rompe la guía', () => {
    const roto = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(leerProgreso(roto)).toEqual(PROGRESO_INICIAL);
    expect(() => guardarProgreso(roto, PROGRESO_INICIAL)).not.toThrow();
  });
});

describe('detección de pasos y estados vacíos', () => {
  it('plano vacío: nada cumplido salvo «proyecto» (id nuevo); ejemplo: plano, fuentes y ocupación', () => {
    const vacio = planoVacio();
    expect(pasoCumplido('plano', vacio)).toBe(false);
    expect(pasoCumplido('fuentes', vacio)).toBe(false);
    expect(pasoCumplido('proyecto', { ...vacio, id: 'plan-1' })).toBe(false);
    const ej = planoEjemploCompleto();
    expect(['plano', 'fuentes', 'ocupacion'].every((id) => pasoCumplido(id as never, ej))).toBe(true);
    expect(pasoCumplido('calculo', ej)).toBe(false);
    expect(pasoCumplido('cumplimiento', ej, ['cumplimiento'])).toBe(true);
  });

  it('faltaEnProyecto y filasResultados', () => {
    expect(faltaEnProyecto(planoVacio())).toBe('plano');
    expect(faltaEnProyecto({ ...planoEjemploCompleto(), sources: [] })).toBe('fuentes');
    expect(faltaEnProyecto(planoEjemploCompleto())).toBe('calculo');
    expect(filasResultados(planoVacio())).toEqual([]);
    expect(filasResultados(null)).toEqual([]);
    const filas = filasResultados(planoEjemploCompleto());
    expect(filas).toHaveLength(7);
    expect(filas.every((f) => f.estado === 'sin-calculo' && f.espesor_mm === null)).toBe(true);
  });
});
