import { type ChangeEvent, useRef, useState } from 'react';
import type { FloorPlan } from '@/types/radshield';
import { importCadBimFile, type CadBimImportSummary } from '@/lib/medical3D/cadBimBridge';

/** Importación DXF/IFC que sustituye al plano del proyecto mientras el diálogo está abierto. */
export function useImportacionCadBim() {
  const [importedFloorPlan, setImportedFloorPlan] = useState<FloorPlan | null>(null);
  const [cadSummary, setCadSummary] = useState<CadBimImportSummary | null>(null);
  const [cadError, setCadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCadImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importCadBimFile(file);
      setImportedFloorPlan(result.floorPlan);
      setCadSummary(result.summary);
      setCadError(null);
    } catch (error) {
      setCadError(error instanceof Error ? error.message : 'No se pudo importar el archivo CAD/BIM.');
      setCadSummary(null);
    } finally {
      event.target.value = '';
    }
  };

  const clearCadImport = () => {
    setImportedFloorPlan(null);
    setCadSummary(null);
    setCadError(null);
  };

  return { importedFloorPlan, cadSummary, cadError, fileInputRef, handleCadImport, clearCadImport };
}

export type ImportacionCadBim = ReturnType<typeof useImportacionCadBim>;
