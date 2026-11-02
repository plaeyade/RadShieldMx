import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReferenceLibraryDialog from '@/sections/dialogs/ReferenceLibraryDialog';
import evidenciaFixture from '../fixtures/gamma-evidencia.json';

describe('Biblioteca de referencias: consulta en vivo a GAMMA', () => {
  it('sin servicio configurado no consulta y ofrece el archivo', () => {
    const fetchFn = vi.fn();
    render(<ReferenceLibraryDialog gammaUrl="" fetchFn={fetchFn} />);
    expect(screen.getByTestId('gamma-live-off')).toBeTruthy();
    expect((screen.getByLabelText('Consulta a GAMMA') as HTMLInputElement).disabled).toBe(true);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('consulta el servicio y muestra las citas verificadas', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(evidenciaFixture), { status: 200 }));
    render(<ReferenceLibraryDialog gammaUrl="http://127.0.0.1:8765" fetchFn={fetchFn} />);
    fireEvent.change(screen.getByLabelText('Consulta a GAMMA'), { target: { value: 'dosis' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar' }));
    await waitFor(() => expect(screen.getByTestId('gamma-evidence-status').textContent).toMatch(/citas verificadas/));
    expect(fetchFn).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/v1/ecosistema/evidencia?q=dosis&k=5&revision=0',
      expect.anything(),
    );
  });

  it('una respuesta alterada se rechaza', async () => {
    const malo = structuredClone(evidenciaFixture) as typeof evidenciaFixture;
    malo.citas[0].texto += ' (editado)';
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(malo), { status: 200 }));
    render(<ReferenceLibraryDialog gammaUrl="http://127.0.0.1:8765" fetchFn={fetchFn} />);
    fireEvent.change(screen.getByLabelText('Consulta a GAMMA'), { target: { value: 'dosis' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar' }));
    await waitFor(() => expect(screen.getByTestId('gamma-evidence-status').textContent).toMatch(/rechazada/));
  });
});
