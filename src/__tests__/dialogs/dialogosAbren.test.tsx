/**
 * Fase 6: estos diálogos leían `s.dialogs.x?.open ?? false`, pero `dialogs[x]` es booleano y el valor
 * siempre era `false`, así que nunca se abrían. Se comprueba que ahora abren y cierran con el store.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ComponentType } from 'react';
import { dialogoAbierto, useAppStore } from '@/stores/appStore';
import AlaraWizardDialog from '@/sections/dialogs/AlaraWizardDialog';
import DarkModeDialog from '@/sections/dialogs/DarkModeDialog';
import DesignCompareDialog from '@/sections/dialogs/DesignCompareDialog';
import DoseSweepDialog from '@/sections/dialogs/DoseSweepDialog';
import DxfExportDialog from '@/sections/dialogs/DxfExportDialog';
import Geant4McDialog from '@/sections/dialogs/Geant4McDialog';
import Isosurface3DDialog from '@/sections/dialogs/Isosurface3DDialog';
import MaterialComparisonDialog from '@/sections/dialogs/MaterialComparisonDialog';
import MultiLayerShieldDialog from '@/sections/dialogs/MultiLayerShieldDialog';
import MultiObjectiveOptimizerDialog from '@/sections/dialogs/MultiObjectiveOptimizerDialog';
import NeutronShieldingDialog from '@/sections/dialogs/NeutronShieldingDialog';
import NistXcomDialog from '@/sections/dialogs/NistXcomDialog';
import NuclideLibrary500Dialog from '@/sections/dialogs/NuclideLibrary500Dialog';
import OnnxPredictorDialog from '@/sections/dialogs/OnnxPredictorDialog';
import Parametric3DDialog from '@/sections/dialogs/Parametric3DDialog';
import ParetoOptimizerDialog from '@/sections/dialogs/ParetoOptimizerDialog';
import RevitAddinDialog from '@/sections/dialogs/RevitAddinDialog';
import SensitivityAnalysisDialog from '@/sections/dialogs/SensitivityAnalysisDialog';
import SourceLibraryDialog from '@/sections/dialogs/SourceLibraryDialog';
import SpatialDoseMapDialog from '@/sections/dialogs/SpatialDoseMapDialog';

const CASOS: Array<[string, ComponentType]> = [
  ['alaraWizard', AlaraWizardDialog],
  ['darkMode', DarkModeDialog],
  ['designCompare', DesignCompareDialog],
  ['doseSweep', DoseSweepDialog],
  ['dxfExport', DxfExportDialog],
  ['geant4Mc', Geant4McDialog],
  ['isosurface3d', Isosurface3DDialog],
  ['materialComparison', MaterialComparisonDialog],
  ['multiLayerShield', MultiLayerShieldDialog],
  ['multiObjectiveOptimizer', MultiObjectiveOptimizerDialog],
  ['neutronShielding', NeutronShieldingDialog],
  ['nistXcom', NistXcomDialog],
  ['nuclideLibrary500', NuclideLibrary500Dialog],
  ['onnxPredictor', OnnxPredictorDialog],
  ['parametric3d', Parametric3DDialog],
  ['paretoOptimizer', ParetoOptimizerDialog],
  ['revitAddin', RevitAddinDialog],
  ['sensitivityAnalysis', SensitivityAnalysisDialog],
  ['sourceLibrary', SourceLibraryDialog],
  ['spatialDoseMap', SpatialDoseMapDialog],
];

beforeAll(() => {
  // jsdom no implementa canvas 2D ni ResizeObserver; varios diálogos dibujan al abrir.
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
  if (!('ResizeObserver' in globalThis)) {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
});

afterEach(() => {
  cleanup();
  useAppStore.getState().closeAll();
});

describe('dialogoAbierto', () => {
  it('interpreta el booleano del store y la forma { open }', () => {
    expect(dialogoAbierto(true)).toBe(true);
    expect(dialogoAbierto(false)).toBe(false);
    expect(dialogoAbierto(undefined)).toBe(false);
    expect(dialogoAbierto({ open: true })).toBe(true);
    expect(dialogoAbierto({ open: false })).toBe(false);
  });
});

describe('Fase 6: diálogos que nunca abrían', () => {
  it.each(CASOS)('%s abre con open() y cierra con close()', (nombre, Dialogo) => {
    expect(nombre in useAppStore.getState().dialogs).toBe(true);
    render(<Dialogo />);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => useAppStore.getState().open(nombre));
    expect(screen.getByRole('dialog')).toBeTruthy();
    act(() => useAppStore.getState().close(nombre));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
