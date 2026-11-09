import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createUnavailableFeatureDialog } from '@/components/UnavailableFeatureDialog';
import { readdirSync, readFileSync } from 'node:fs';

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

  it('ningún diálogo del menú es un Stub que devuelve null', () => {
    const dir = 'src/sections/dialogs';
    const stubs = readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).filter((f) => /export default function Stub\(/.test(readFileSync(`${dir}/${f}`, 'utf8')));
    expect(stubs).toEqual([]);
  });
});
