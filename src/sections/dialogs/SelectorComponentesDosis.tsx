/**
 * Fase 3 del motor de dosis: selección de componentes del campo (`doseFieldEngine`) que suman en un mapa.
 * Sólo se ofrecen las componentes presentes en las fuentes del plano.
 */
import { Checkbox } from '@/components/ui/checkbox';
import { ETIQUETA_COMPONENTE, type ComponenteCampo } from '@/lib/doseFieldEngine';

interface Props {
  disponibles: readonly ComponenteCampo[];
  /** Componentes seleccionadas; `undefined` = todas. */
  seleccion: readonly ComponenteCampo[] | undefined;
  onChange: (seleccion: ComponenteCampo[] | undefined) => void;
  testId?: string;
}

export function SelectorComponentesDosis({ disponibles, seleccion, onChange, testId }: Props) {
  if (!disponibles.length) return null;
  const activa = (c: ComponenteCampo) => !seleccion || seleccion.includes(c);
  const alternar = (c: ComponenteCampo, on: boolean) => {
    const actual = disponibles.filter(activa);
    const nueva = on ? disponibles.filter((k) => k === c || actual.includes(k)) : actual.filter((k) => k !== c);
    onChange(nueva.length === disponibles.length ? undefined : nueva);
  };
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]" data-testid={testId ?? 'selector-componentes-dosis'}>
      {disponibles.map((c) => (
        <label key={c} className="flex items-center gap-1 cursor-pointer">
          <Checkbox checked={activa(c)} onCheckedChange={(v) => alternar(c, v === true)} aria-label={ETIQUETA_COMPONENTE[c]} />
          {ETIQUETA_COMPONENTE[c]}
        </label>
      ))}
    </div>
  );
}

export default SelectorComponentesDosis;
