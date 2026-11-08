import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import TG108PatientModelCard from '@/sections/TG108PatientModelCard';
import { MODALITIES, type RadiationSource } from '@/types/radshield';

const fuente = (id: string, extra: Partial<RadiationSource> = {}): RadiationSource => ({
  id: 's1', x: 0, y: 0, name: 'NM', modality: MODALITIES.find((m) => m.id === id)!, workloadValue: 555,
  workloadUnit: 'MBq', isocenterHeight_m: 1, useFactor: 1, workloadHoursPerWeek: 40, ...extra,
});

function Harness({ initial, spy }: { initial: RadiationSource; spy: (v: RadiationSource['tg108']) => void }) {
  const [s, setS] = useState(initial);
  return (
    <TG108PatientModelCard
      source={s}
      onChange={(tg108) => {
        spy(tg108);
        setS((prev) => ({ ...prev, tg108 }));
      }}
    />
  );
}

describe('TG108PatientModelCard', () => {
  it('no aparece en modalidades sin modelo por paciente', () => {
    const { container } = render(<TG108PatientModelCard source={fuente('rad-chest')} onChange={() => undefined} />);
    expect(container.innerHTML).toBe('');
  });

  it('PET: activar rellena valores, preset fija A₀, sala cambia y apagar deja undefined', () => {
    const spy = vi.fn();
    render(<Harness initial={fuente('pet-f18')} spy={spy} />);
    expect(screen.queryByTestId('tg108-A0_MBq')).toBeNull();

    fireEvent.click(screen.getByTestId('tg108-toggle'));
    expect(spy).toHaveBeenLastCalledWith({ A0_MBq: 555, pacientesSemana: 40, tU_h: 1, tI_h: 0.5, sala: 'captacion' });
    expect(screen.getByTestId('tg108-hint').textContent).toMatch(/Rₜ = 0\.83\d/);

    fireEvent.change(screen.getByTestId('tg108-pacientesSemana'), { target: { value: '20' } });
    expect(spy.mock.lastCall?.[0].pacientesSemana).toBe(20);

    const preset = screen.getByTestId('tg108-preset') as HTMLSelectElement;
    const opciones = Array.from(preset.options).map((o) => o.value).filter(Boolean);
    expect(opciones).toEqual(['fdg-onco-tg108']);
    fireEvent.change(screen.getByTestId('tg108-A0_MBq'), { target: { value: '300' } });
    fireEvent.change(preset, { target: { value: 'fdg-onco-tg108' } });
    expect(spy.mock.lastCall?.[0].A0_MBq).toBe(555);

    fireEvent.change(screen.getByTestId('tg108-sala'), { target: { value: 'imagen' } });
    expect(spy.mock.lastCall?.[0].sala).toBe('imagen');

    fireEvent.click(screen.getByTestId('tg108-toggle'));
    expect(spy).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByTestId('tg108-hint')).toBeNull();
  });

  it('SPECT avisa que es extensión y ofrece sólo presets Tc-99m', () => {
    render(<Harness initial={fuente('spect-tc99m', { tg108: { A0_MBq: 740, pacientesSemana: 30, tU_h: 1, tI_h: 0.5, sala: 'captacion' } })} spy={vi.fn()} />);
    expect(screen.getByText(/Extensión, no TG-108/)).toBeTruthy();
    const preset = screen.getByTestId('tg108-preset') as HTMLSelectElement;
    expect(Array.from(preset.options).filter((o) => o.value).every((o) => o.textContent?.includes('Tc'))).toBe(true);
    expect(screen.getByTestId('tg108-hint').textContent).toContain('μSv/sem');
  });
});
