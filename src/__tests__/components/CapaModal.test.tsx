/**
 * Cierre con Escape de las ventanas propias (CapaModal, DialogShell y FullscreenShell). QA de la Fase 12: 19 ventanas
 * `role="dialog" aria-modal` no cerraban con Escape.
 */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CapaModal from '@/components/CapaModal';
import DialogShell from '@/components/DialogShell';
import FullscreenShell from '@/components/FullscreenShell';
import { ventanasConEscapeAbiertas } from '@/hooks/useCierreConEscape';

afterEach(() => {
  cleanup();
});

const escape = (el: Element | Document = document.activeElement ?? document.body) => fireEvent.keyDown(el, { key: 'Escape' });

function ConDisparador({ shell, confirmarCierre }: { shell: 'dialog' | 'fullscreen' | 'capa'; confirmarCierre?: () => boolean }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  return (
    <div>
      <button type="button" onClick={() => setAbierto(true)}>Abrir</button>
      {abierto && shell === 'dialog' && (
        <DialogShell title="Ventana" subtitle="sub" gradientFrom="from-a" gradientTo="to-b" onClose={cerrar} confirmarCierre={confirmarCierre}>
          <input aria-label="campo" />
        </DialogShell>
      )}
      {abierto && shell === 'fullscreen' && (
        <FullscreenShell title="Pantalla" traceId="pantalla" onClose={cerrar} confirmarCierre={confirmarCierre}>
          <input aria-label="campo" />
        </FullscreenShell>
      )}
      {abierto && shell === 'capa' && (
        <CapaModal onCerrar={cerrar} aria-label="Capa" confirmarCierre={confirmarCierre}>
          <input aria-label="campo" />
        </CapaModal>
      )}
    </div>
  );
}

function abrir() {
  const boton = screen.getByRole('button', { name: 'Abrir' });
  boton.focus();
  fireEvent.click(boton);
  return boton;
}

describe('Cierre con Escape de las ventanas propias', () => {
  it.each(['dialog', 'fullscreen', 'capa'] as const)('%s: Escape cierra, el foco entra al abrir y vuelve al disparador', (shell) => {
    render(<ConDisparador shell={shell} />);
    const boton = abrir();
    const dialogo = screen.getByRole('dialog');
    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    expect(dialogo.contains(document.activeElement)).toBe(true);
    escape();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(boton);
    expect(ventanasConEscapeAbiertas()).toBe(0);
  });

  it('Escape dentro de un input normal de la ventana también cierra', () => {
    render(<ConDisparador shell="dialog" />);
    abrir();
    const campo = screen.getByLabelText('campo');
    campo.focus();
    escape(campo);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('con ventanas apiladas Escape cierra sólo la más alta', () => {
    function Apiladas() {
      const [a, setA] = useState(true);
      const [b, setB] = useState(true);
      return (
        <>
          {a && <CapaModal onCerrar={() => setA(false)} aria-label="Abajo"><p>abajo</p></CapaModal>}
          {b && <CapaModal onCerrar={() => setB(false)} aria-label="Arriba"><p>arriba</p></CapaModal>}
        </>
      );
    }
    render(<Apiladas />);
    escape();
    expect(screen.queryByRole('dialog', { name: 'Arriba' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Abajo' })).toBeTruthy();
    escape();
    expect(screen.queryByRole('dialog', { name: 'Abajo' })).toBeNull();
  });

  it('no cierra si hay un menú o subdiálogo ajeno abierto encima', () => {
    const onCerrar = vi.fn();
    const { rerender } = render(
      <CapaModal onCerrar={onCerrar} aria-label="Base">
        <div role="menu" data-state="open"><button type="button">opción</button></div>
      </CapaModal>,
    );
    escape(screen.getByRole('button', { name: 'opción' }));
    expect(onCerrar).not.toHaveBeenCalled();
    // Subdiálogo de Radix portaleado al final del body.
    rerender(<CapaModal onCerrar={onCerrar} aria-label="Base"><p>x</p></CapaModal>);
    const sub = document.createElement('div');
    sub.setAttribute('role', 'alertdialog');
    document.body.appendChild(sub);
    escape(document.body);
    expect(onCerrar).not.toHaveBeenCalled();
    sub.remove();
    escape(document.body);
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('no cierra si otra capa ya consumió la tecla (preventDefault) ni dentro de editores que la usan', () => {
    const onCerrar = vi.fn();
    render(
      <CapaModal onCerrar={onCerrar} aria-label="Base">
        <input aria-label="editor" onKeyDown={(e) => { if (e.key === 'Escape') e.preventDefault(); }} />
        <div data-escape-propio="true"><input aria-label="lienzo" /></div>
        <input aria-label="combo" aria-expanded="true" role="combobox" />
      </CapaModal>,
    );
    escape(screen.getByLabelText('editor'));
    escape(screen.getByLabelText('lienzo'));
    escape(screen.getByLabelText('combo'));
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('pide confirmación con cambios sin guardar y sólo cierra si se acepta', () => {
    let aceptar = false;
    const confirmar = vi.fn(() => aceptar);
    render(<ConDisparador shell="fullscreen" confirmarCierre={confirmar} />);
    abrir();
    escape();
    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeTruthy();
    aceptar = true;
    escape();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('la tecla consumida no llega al oyente del diseñador; con la ventana minimizada y el foco fuera, sí', () => {
    const oyenteVentana = vi.fn();
    window.addEventListener('keydown', oyenteVentana);
    try {
      render(
        <>
          <button type="button">lienzo</button>
          <ConDisparador shell="dialog" />
        </>,
      );
      abrir();
      escape();
      expect(oyenteVentana).not.toHaveBeenCalled();

      abrir();
      fireEvent.click(screen.getByTestId('f376-dialog-minimize'));
      const lienzo = screen.getByRole('button', { name: 'lienzo' });
      lienzo.focus();
      escape(lienzo);
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(oyenteVentana).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('keydown', oyenteVentana);
    }
  });

  it('si el menú que la abrió devuelve el foco a su botón, la ventana lo recupera y Escape la cierra', async () => {
    const onCerrar = vi.fn();
    function Escena() {
      const [abierta, setAbierta] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setAbierta(true)}>menú</button>
          {abierta && <CapaModal onCerrar={onCerrar} aria-label="Base"><p>x</p></CapaModal>}
        </>
      );
    }
    render(<Escena />);
    const boton = screen.getByRole('button', { name: 'menú' });
    boton.focus();
    fireEvent.click(boton);
    const ventana = screen.getByRole('dialog');
    expect(document.activeElement).toBe(ventana);
    // Radix devuelve el foco al botón del menú justo después de montar la ventana.
    boton.focus();
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(document.activeElement).toBe(ventana);
    escape();
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
