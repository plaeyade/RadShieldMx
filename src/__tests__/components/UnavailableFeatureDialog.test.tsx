import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createUnavailableFeatureDialog } from '@/components/UnavailableFeatureDialog';
import VentilationDialog from '@/sections/dialogs/VentilationDialog';

describe('funciones de menú sin implementación', () => {
  it('avisan explícitamente en lugar de no hacer nada', () => {
    const Dialogo = createUnavailableFeatureDialog('Calculadora X', 'Detalle de prueba');
    const html = renderToStaticMarkup(<Dialogo open onClose={() => undefined} />);
    expect(html).toContain('Calculadora X');
    expect(html).toContain('no está implementada');
    expect(html).toContain('Detalle de prueba');
  });

  it('cerrado no renderiza y tolera props del diálogo previsto', () => {
    const Dialogo = createUnavailableFeatureDialog('Y');
    expect(renderToStaticMarkup(<Dialogo open={false} history={[]} />)).toBe('');
  });

  it('los antiguos stubs usan el aviso', () => {
    expect(renderToStaticMarkup(<VentilationDialog open />)).toContain('Ventilación del búnker');
  });
});
