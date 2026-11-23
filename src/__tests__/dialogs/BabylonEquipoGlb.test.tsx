import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BabylonRuntimeSmokePreview } from '@/sections/dialogs/medical3d/BabylonRuntimeSmokePreview';
import { buildMedicalScene } from '@/lib/medical3D/sceneBuilder';
import { VISOR_3D_BABYLON } from '@/lib/featureFlags';

describe('Fase 13: controles del equipo GLB en la vista Babylon', () => {
  it('la bandera VISOR_3D_BABYLON sigue apagada', () => {
    expect(VISOR_3D_BABYLON).toBe(false);
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
