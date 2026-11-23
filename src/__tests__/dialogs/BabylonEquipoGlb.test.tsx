import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  BabylonRuntimeSmokePreview,
  MENSAJE_SIN_WEBGL,
  navegadorSoportaWebGL,
} from '@/sections/dialogs/medical3d/BabylonRuntimeSmokePreview';
import { buildMedicalScene } from '@/lib/medical3D/sceneBuilder';
import { HEATMAP_GPU, MENU_AVANZADO, VISOR_3D_BABYLON } from '@/lib/featureFlags';

afterEach(() => vi.restoreAllMocks());

describe('Fase 13: controles del equipo GLB en la vista Babylon', () => {
  it('VISOR_3D_BABYLON activa por omisión (autorización del propietario, 23-11-2026); GPU y menú avanzado siguen apagados', () => {
    // Antes: «la bandera VISOR_3D_BABYLON sigue apagada». El 23-11-2026 el propietario autorizó activar SÓLO la
    // vista 3D Babylon; se apaga en el build con VITE_VISOR_3D_BABYLON=false.
    expect(VISOR_3D_BABYLON).toBe(true);
    expect(HEATMAP_GPU).toBe(false);
    expect(MENU_AVANZADO).toBe(false);
  });

  it('sin WebGL no descarga Babylon: muestra el respaldo accesible y desactiva «Ampliar»', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(navegadorSoportaWebGL()).toBe(false);
    const onStatusChange = vi.fn();
    render(
      <BabylonRuntimeSmokePreview
        scene={buildMedicalScene(undefined, 'linac')}
        enabled
        onStatusChange={onStatusChange}
        deepContract={{ controls: { overlays: [] } } as never}
      />,
    );
    await waitFor(() => expect(screen.getByTestId('f455-babylon-runtime-status').textContent).toBe('sin-webgl'));
    expect(onStatusChange).toHaveBeenLastCalledWith('sin-webgl');
    expect(onStatusChange).not.toHaveBeenCalledWith('loading');
    const mensaje = screen.getByTestId('f455-babylon-runtime-mensaje');
    expect(mensaje.getAttribute('role')).toBe('status');
    expect(mensaje.textContent).toBe(MENSAJE_SIN_WEBGL);
    expect((screen.getByTestId('f13-babylon-ampliar') as HTMLButtonElement).disabled).toBe(true);
  });

  it('el canvas es enfocable y describe la escena; «Ampliar» alterna la vista', () => {
    render(
      <BabylonRuntimeSmokePreview
        scene={buildMedicalScene(undefined, 'linac')}
        enabled={false}
        deepContract={{ controls: { overlays: [] } } as never}
      />,
    );
    const canvas = screen.getByTestId('f455-babylon-runtime-canvas');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('tabindex')).toBe('0');
    expect(canvas.getAttribute('aria-label')).toMatch(/Vista 3D de .*barreras/);
    const ampliar = screen.getByTestId('f13-babylon-ampliar');
    expect(ampliar.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(ampliar);
    expect(ampliar.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('f455-babylon-runtime-smoke').getAttribute('data-ampliada')).toBe('true');
  });

  it('muestra el interruptor, la orientación y el respaldo sin ruta configurada', () => {
    render(
      <BabylonRuntimeSmokePreview
        scene={buildMedicalScene(undefined, 'linac')}
        enabled={false}
        deepContract={{ controls: { overlays: [] } } as never}
      />,
    );
    const mostrar = screen.getByTestId('f13-equipo-glb-mostrar') as HTMLInputElement;
    expect(mostrar.checked).toBe(true);
    fireEvent.click(mostrar);
    expect(mostrar.checked).toBe(false);
    const orientacion = screen.getByTestId('f13-equipo-glb-orientacion') as HTMLSelectElement;
    fireEvent.change(orientacion, { target: { value: '180' } });
    expect(orientacion.value).toBe('180');
    expect(screen.getByTestId('f13-equipo-glb-estado').textContent).toMatch(/sin ruta/);
  });
});
