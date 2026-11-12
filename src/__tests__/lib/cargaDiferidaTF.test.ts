/**
 * Depuración etapa 7: `shieldingThicknessModel` carga @tensorflow/tfjs con import dinámico.
 * Sin modelo guardado, `loadModel()` (lo llama `useAutoML` al abrir el diálogo) devuelve false sin importar tfjs.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

let importado = false;
vi.mock('@tensorflow/tfjs', () => {
  importado = true;
  return {
    loadLayersModel: vi.fn(async () => ({ predict: vi.fn() })),
  };
});

// Las pruebas van en orden: la primera exige que tfjs no se haya importado todavía.
describe('carga diferida de TensorFlow.js', () => {
  afterEach(() => {
    vi.mocked(localStorage.getItem).mockImplementation(() => null);
    vi.resetModules();
  });

  it('sin modelo guardado: loadModel() da false y no importa tfjs', async () => {
    const { loadModel } = await import('@/lib/ml/models/shieldingThicknessModel');
    expect(await loadModel()).toBe(false);
    expect(importado).toBe(false);
  });

  it('con modelo guardado: importa tfjs y carga el modelo', async () => {
    // `localStorage` es un doble en src/test/setup.ts: sólo existe la clave de info del modelo guardado.
    vi.mocked(localStorage.getItem).mockImplementation((k: string) => (k === 'tensorflowjs_models/radshield-thickness-model-v2/info' ? '{}' : null));
    const { loadModel, isModelLoaded } = await import('@/lib/ml/models/shieldingThicknessModel');
    expect(await loadModel()).toBe(true);
    expect(importado).toBe(true);
    expect(isModelLoaded()).toBe(true);
  });
});
