/**
 * Fase 8d: pruebas de no-regresión de `MedicalFloorPlan3DDialog` antes (y después) de dividirlo.
 * El lienzo de @react-three/fiber se sustituye por un doble que no monta la escena WebGL pero
 * expone las props que recibe `RoomScene`; así se comprueba el estado que llega al visor 3D.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { MODALITIES, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';
import type { MedicalScene } from '@/lib/medical3D/sceneBuilder';

vi.mock('@react-three/fiber', async (importOriginal) => {
  const real = await importOriginal<typeof import('@react-three/fiber')>();
  function CanvasDoble({ children, dpr }: { children: ReactNode; dpr?: unknown }) {
    // <Canvas><Suspense><RoomScene …/></Suspense></Canvas>
    const room = (children as ReactElement<{ children: ReactElement<Record<string, unknown>> }>).props.children;
    const p = room.props as Record<string, unknown> & { scene: MedicalScene };
    const resumen = {
      mode: p.mode,
      walkthrough: p.walkthrough,
      photorealWalkthrough: p.photorealWalkthrough,
      lightingPreset: p.lightingPreset,
      showCeiling: p.showCeiling,
      showClinicalDetail: p.showClinicalDetail,
      showInspection: p.showInspection,
      collisionEnabled: p.collisionEnabled,
      realismAids: p.realismAids,
      activeStationId: p.activeStationId,
      stations: (p.inspectionStations as unknown[]).length,
      walls: p.scene.walls.length,
      dosePoints: p.scene.dosePoints.length,
      kermaTotal: p.scene.dosePoints.reduce((s, d) => s + d.kerma_mSv_semana, 0),
      dpr,
    };
    return (
      <div data-testid="r3f-canvas" data-resumen={JSON.stringify(resumen)}>
        <canvas />
      </div>
    );
  }
  return { ...real, Canvas: CanvasDoble };
});

import MedicalFloorPlan3DDialog from '@/sections/dialogs/MedicalFloorPlan3DDialog';

const modalidad = (id: string) => MODALITIES.find((m) => m.id === id)!;

function plano(): FloorPlan {
  const s = 0.01;
  const px = (m: number) => m / s;
  const fuentes: RadiationSource[] = [
    {
      id: 'linac', name: 'LINAC', x: px(4), y: px(4), modality: modalidad('linac-6mv'), workloadValue: 250,
      workloadUnit: 'fracciones', isocenterHeight_m: 1.3, useFactor: 0.25, imrtFraction: 0,
    },
  ];
  const muro = (id: string, x1: number, y1: number, x2: number, y2: number, extra: Partial<Barrier>): Barrier => ({
    id, name: id, x1: px(x1), y1: px(y1), x2: px(x2), y2: px(y2), barrierType: 'secondary', useFactor: 0.25,
    occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235', ...extra,
  });
  return {
    id: 'p', name: 'Bunker prueba', imageUrl: null, scale_m_per_pixel: s, width_pixels: px(10), height_pixels: px(10),
    sources: fuentes,
    barriers: [
      muro('primaria', 7, 0, 7, 8, { barrierType: 'primary', thickness_mm: 1500 }),
      muro('secundaria', 0, 7, 7, 7, { thickness_mm: 900 }),
      muro('plomo', 0, 2.5, 3, 2.5, { materialCode: 'PB', thickness_mm: 2 }),
    ],
    occupiedRegions: [], regions: [], criticalPoints: [],
  } as FloorPlan;
}

const vacio = (): FloorPlan => ({ ...plano(), name: 'Vacio', sources: [], barriers: [] });

const descargas: Array<{ nombre: string; blob: Blob }> = [];
let ultimoBlob: Blob | null = null;

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA';
  if (!('ResizeObserver' in globalThis)) {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
});

beforeEach(() => {
  descargas.length = 0;
  ultimoBlob = null;
  URL.createObjectURL = vi.fn((b: Blob) => { ultimoBlob = b; return 'blob:prueba'; }) as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    if (ultimoBlob && this.href.startsWith('blob:')) descargas.push({ nombre: this.download, blob: ultimoBlob });
    else descargas.push({ nombre: this.download, blob: new Blob([this.href]) });
    ultimoBlob = null;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const leerBlob = (b: Blob) => new Promise<string>((ok) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.readAsText(b);
});

function resumen() {
  return JSON.parse(screen.getByTestId('r3f-canvas').getAttribute('data-resumen')!);
}

function abrir(fp: FloorPlan = plano()) {
  const onOpenChange = vi.fn();
  render(<MedicalFloorPlan3DDialog open onOpenChange={onOpenChange} floorPlan={fp} />);
  return { onOpenChange, dialogo: screen.getByRole('dialog') };
}

describe('MedicalFloorPlan3DDialog — render', () => {
  it('monta cabecera, paneles y el visor Three/R3F con el estado inicial', () => {
    const { dialogo } = abrir();
    expect(within(dialogo).getByText('Medical 3D Floor Plan')).toBeTruthy();
    for (const id of [
      'medical3d-dosis-motor', // sólo en modo dosis
    ]) expect(screen.queryByTestId(id)).toBeNull();
    for (const id of [
      'f364-three-visual-workflow', 'f365-f366-visual-evidence-pack', 'f367-f370-medical-3d-release-integration',
      'f459-f463-visual-stack', 'f464-f468-visual-beta', 'f465-material-technical-links', 'f466-canvas-3d-sync-map',
      'f467-memoria-visual-evidence', 'f385-f386-productive-capability-gate', 'f307-f309-render-engine-selector',
      'f520-f524-deep-renderer-babylon-3d', 'f315-unity-external-viewer-bridge', 'f324-pointer-lock-control',
      'f325-f330-photoreal-controls', 'f461-photoreal-advanced-profile', 'f462-pbr-material-gallery',
      'f463-wasd-visual-guide', 'f409-f408-unity-scene-surface', 'f363-three-r3f-realism-aids',
      'f363-babylon-install-options', 'f92-3d-inspection-readiness', 'f147-medical-3d-inspection',
      'medical-cad-input', 'f324-pointer-lock-workbench',
    ]) expect(screen.getByTestId(id)).toBeTruthy();
    // Con VISOR_3D_BABYLON apagado no se monta Babylon; se avisa que está en revisión.
    expect(screen.getByTestId('babylon-visor-en-revision').textContent).toContain('El visor 3D activo es Three/R3F');
    const r = resumen();
    expect(r).toMatchObject({
      mode: 'presentation', walkthrough: false, photorealWalkthrough: false, lightingPreset: 'clinical',
      showCeiling: false, showClinicalDetail: true, showInspection: true, collisionEnabled: true,
      activeStationId: null, walls: 3,
      realismAids: { materialBands: true, equipmentFootprints: true, beamGuides: true, roomRulers: true },
    });
    expect(r.stations).toBeGreaterThan(0);
    expect(r.dosePoints).toBeGreaterThan(0);
    expect(r.kermaTotal).toBeGreaterThan(0);
  });

  it('el texto de la barra lateral y del visor no cambia (instantánea)', () => {
    const { dialogo } = abrir();
    expect(dialogo.textContent).toMatchSnapshot();
  });

  it('plano vacío: la escena no tiene muros y el resumen lo refleja', () => {
    abrir(vacio());
    // El preset siembra equipos aunque el plano esté vacío, así que el lienzo se monta igual.
    expect(resumen()).toMatchObject({ walls: 0, kermaTotal: 0 });
    expect(screen.getByText('Barreras: 0')).toBeTruthy();
  });

  it('no se monta con open=false', () => {
    render(<MedicalFloorPlan3DDialog open={false} onOpenChange={() => {}} floorPlan={plano()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('MedicalFloorPlan3DDialog — interacciones', () => {
  it('los presets del flujo visual fijan modo, recorrido, luz, techo y ayudas', () => {
    abrir();
    const flujo = screen.getByTestId('f364-three-visual-workflow');
    fireEvent.click(within(flujo).getByText('Barreras'));
    expect(resumen()).toMatchObject({
      mode: 'technical', walkthrough: false, lightingPreset: 'inspection',
      realismAids: { materialBands: true, equipmentFootprints: false, beamGuides: true, roomRulers: true },
    });
    fireEvent.click(within(flujo).getByText('Dosis'));
    expect(resumen()).toMatchObject({ mode: 'dose', lightingPreset: 'inspection' });
    expect(screen.getByTestId('medical3d-dosis-motor')).toBeTruthy();
    fireEvent.click(within(flujo).getByText('Recorrido'));
    const r = resumen();
    expect(r).toMatchObject({ mode: 'presentation', walkthrough: true, photorealWalkthrough: true, lightingPreset: 'warm', showCeiling: true });
    expect(r.activeStationId).toBeTruthy();
    expect(screen.getByText('WASD/flechas: recorrer')).toBeTruthy();
    expect(screen.getByText('Colisiones activas')).toBeTruthy();
    expect(screen.getByText('PBR + Recorrido calido')).toBeTruthy();
  });

  it('modo Dosis: el selector de componentes cambia el kerma que llega a la escena', () => {
    abrir();
    fireEvent.mouseDown(screen.getByRole('tab', { name: /Dosis/ }));
    const panel = screen.getByTestId('medical3d-dosis-motor');
    const total = resumen().kermaTotal;
    expect(total).toBeGreaterThan(0);
    const casillas = within(panel).getAllByRole('checkbox');
    expect(casillas.length).toBeGreaterThan(1);
    fireEvent.click(casillas[0]);
    const parcial = resumen().kermaTotal;
    expect(parcial).toBeLessThan(total);
    fireEvent.click(casillas[0]);
    expect(resumen().kermaTotal).toBeCloseTo(total, 9);
  });

  it('ayudas visuales: alternan aria-pressed, el contador y las props de la escena', () => {
    abrir();
    const ayudas = screen.getByTestId('f363-three-r3f-realism-aids');
    expect(within(ayudas).getByText('4/4')).toBeTruthy();
    const boton = within(ayudas).getByText('Reglas de sala').closest('button')!;
    expect(boton.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(boton);
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(within(ayudas).getByText('3/4')).toBeTruthy();
    expect(resumen().realismAids.roomRulers).toBe(false);
  });

  it('interruptores: techo, detalle, inspección y recorrido; mouse-look sólo con recorrido', () => {
    abrir();
    const sw = screen.getAllByRole('switch');
    // Orden: techo, detalle clínico, inspección, recorrido, mouse-look, colisiones, fotoreal.
    expect(sw).toHaveLength(7);
    expect(sw[4].hasAttribute('disabled')).toBe(true);
    fireEvent.click(sw[0]);
    fireEvent.click(sw[1]);
    fireEvent.click(sw[2]);
    expect(resumen()).toMatchObject({ showCeiling: true, showClinicalDetail: false, showInspection: false });
    fireEvent.click(sw[3]);
    expect(resumen().walkthrough).toBe(true);
    expect(sw[4].hasAttribute('disabled')).toBe(false);
    fireEvent.click(sw[4]);
    expect(screen.getByText('Click para mouse-look')).toBeTruthy();
    fireEvent.click(sw[5]);
    expect(resumen().collisionEnabled).toBe(false);
    fireEvent.click(sw[3]);
    expect(resumen().walkthrough).toBe(false);
    expect(screen.queryByText('Click para mouse-look')).toBeNull();
  });

  it('una estación F147 activa recorrido, inspección y abre el panel de detalle', () => {
    abrir();
    const f147 = screen.getByTestId('f147-medical-3d-inspection');
    const primera = within(f147).getAllByRole('button')[0];
    const etiqueta = primera.querySelector('.font-semibold')!.textContent!;
    fireEvent.click(primera);
    expect(resumen()).toMatchObject({ walkthrough: true, showInspection: true });
    expect(resumen().activeStationId).toBeTruthy();
    const detalle = screen.getAllByText(etiqueta).find((n) => n.closest('main'))!;
    expect(detalle).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryAllByText(etiqueta).find((n) => n.closest('main'))).toBeUndefined();
  });

  it('captura PNG: registra la evidencia y actualiza la compuerta', () => {
    abrir();
    const pack = screen.getByTestId('f365-f366-visual-evidence-pack');
    expect(within(pack).getByText('pending')).toBeTruthy();
    fireEvent.click(within(pack).getByRole('button', { name: /Capturar/ }));
    expect(descargas).toHaveLength(1);
    expect(descargas[0].nombre).toMatch(/^medical_3d_Bunker_prueba_overview_\w{14}\.png$/);
    expect(within(pack).getByText('review')).toBeTruthy();
    expect(within(pack).getByText('Vista general')).toBeTruthy();
    expect(within(pack).getByText('barriers, equipment, dose')).toBeTruthy();
    expect(within(screen.getByTestId('f467-memoria-visual-evidence')).getByText('1 caps')).toBeTruthy();
  });

  it('actualizar la base PBR cambia su versión y la persiste en localStorage', () => {
    abrir();
    const galeria = screen.getByTestId('f462-pbr-material-gallery');
    const antes = galeria.querySelector('.inline-flex, [class*="badge"]')?.textContent ?? galeria.textContent;
    (localStorage.setItem as ReturnType<typeof vi.fn>).mockClear?.();
    fireEvent.click(screen.getByTestId('f463-update-pbr-db'));
    const despues = galeria.querySelector('.inline-flex, [class*="badge"]')?.textContent ?? galeria.textContent;
    expect(despues).not.toBe(antes);
    expect(localStorage.setItem).toHaveBeenCalledWith('radshield-medical3d-pbr-material-db-f461', expect.any(String));
  });
});

describe('MedicalFloorPlan3DDialog — exportaciones', () => {
  it('cada botón descarga el archivo con el nombre esperado', async () => {
    abrir();
    const pulsar = (texto: RegExp | string) => fireEvent.click(screen.getByRole('button', { name: texto }));
    pulsar(/^OBJ$/);
    pulsar(/^JSON$/);
    pulsar(/Exportar tour visual/);
    pulsar(/^Pack$/);
    pulsar(/Export F367-F370/);
    fireEvent.click(screen.getByTestId('f468-export-visual-beta-pack'));
    pulsar(/Exportar handoff 3D/);
    pulsar(/Unity JSON/);
    fireEvent.click(screen.getByTestId('f463-export-pbr-db'));
    pulsar(/Exportar F147 pack/);
    pulsar(/Exportar AI Brief/);
    pulsar(/Exportar Verify Pack/);
    expect(descargas.map((d) => d.nombre)).toEqual([
      'medical_3d_Bunker_prueba.obj',
      'medical_3d_review_Bunker_prueba.json',
      'medical_3d_visual_workflow_Bunker_prueba.json',
      'medical_3d_visual_evidence_pack_Bunker_prueba.json',
      'medical_3d_f367_f370_release_integration_Bunker_prueba.json',
      'medical_3d_f464_f468_visual_beta_Bunker_prueba.json',
      'medical_3d_engine_handoff_Bunker_prueba.json',
      'medical_3d_unity_handoff_Bunker_prueba.json',
      'medical_3d_pbr_material_db_Bunker_prueba.json',
      'medical_3d_f147_inspection_Bunker_prueba.json',
      'cadx_ai_render_brief_Bunker_prueba.json',
      'cadcodeverify_pack_Bunker_prueba.json',
    ]);
    for (const d of descargas.slice(1)) {
      const texto = await leerBlob(d.blob);
      expect(() => JSON.parse(texto), d.nombre).not.toThrow();
    }
  });

  it('el JSON de revisión conserva su contenido (instantánea)', async () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: /^JSON$/ }));
    const json = JSON.parse(await leerBlob(descargas[0].blob));
    expect(json.visualEvidence.sceneHash).toMatch(/^scene-[0-9a-f]{8}$/);
    expect(json).toMatchSnapshot();
  });

  it('el OBJ y el tour visual conservan su contenido (instantánea)', async () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: /^OBJ$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Exportar tour visual/ }));
    const obj = await leerBlob(descargas[0].blob);
    expect(obj.split('\n').length).toBeGreaterThan(10);
    expect({ obj, tour: JSON.parse(await leerBlob(descargas[1].blob)) }).toMatchSnapshot();
  });

  it('el estado del flujo se refleja en el hash de escena', async () => {
    abrir();
    const hash0 = screen.getByTestId('f325-f330-photoreal-controls').querySelector('.font-mono')!.textContent;
    await act(async () => {
      fireEvent.click(within(screen.getByTestId('f364-three-visual-workflow')).getByText('Equipos'));
    });
    const hash1 = screen.getByTestId('f325-f330-photoreal-controls').querySelector('.font-mono')!.textContent;
    expect(hash1).not.toBe(hash0);
  });
});
