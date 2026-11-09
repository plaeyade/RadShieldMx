/**
 * Fase 9 — despliegue en GitHub Pages (base /RadShieldMx/, sin rutas absolutas a public/, entrada con carga diferida)
 * y los ítems de prioridad baja que tocaban cálculos o datos mostrados.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { rutaPublica } from '@/lib/rutaPublica';
import { listEquipmentVisualProfiles } from '@/lib/equipmentVisuals';
import AuditTrailDialog from '@/sections/dialogs/AuditTrailDialog';
import { TRPCProvider } from '@/providers/trpc';

const RAIZ = path.resolve(__dirname, '../../..');
const leer = (p: string) => readFileSync(path.join(RAIZ, p), 'utf8');
const dialogo = (p: string) => leer(`src/sections/dialogs/${p}`);

afterEach(() => cleanup());

describe('GitHub Pages', () => {
  it('rutaPublica respeta la base del despliegue', () => {
    expect(rutaPublica('wasm/shielding_math.wasm', '/RadShieldMx/')).toBe('/RadShieldMx/wasm/shielding_math.wasm');
    expect(rutaPublica('/equipment-images/a.png', '/RadShieldMx/')).toBe('/RadShieldMx/equipment-images/a.png');
    expect(rutaPublica('icon-192.png', './')).toBe('./icon-192.png');
    expect(rutaPublica('x.png', '/RadShieldMx')).toBe('/RadShieldMx/x.png');
    expect(rutaPublica('https://cdn.example/x.png', '/RadShieldMx/')).toBe('https://cdn.example/x.png');
    // En las pruebas la base es «/»: las rutas no cambian respecto a la raíz del dominio.
    expect(listEquipmentVisualProfiles().every((v) => v.preferredAsset?.startsWith('/equipment-images/') ?? true)).toBe(true);
  });

  it('vite toma la base de VITE_BASE_PATH y el CI construye el artefacto de Pages con /RadShieldMx/ y lo verifica', () => {
    expect(leer('vite.config.ts')).toMatch(/const base = process\.env\.VITE_BASE_PATH \|\| '\.\/'/);
    const ci = leer('.github/workflows/ci.yml');
    expect(ci).toMatch(/VITE_BASE_PATH: \/RadShieldMx\//);
    expect(ci).toMatch(/node scripts\/verificar-base-pages\.mjs dist \/RadShieldMx\//);
    // Pages sigue tras la variable del repositorio; no se activa aquí.
    expect(ci).toMatch(/vars\.PAGES_HABILITADO == 'true'/);
  });

  it('sin rutas absolutas a public/ en el código que se ejecuta en el navegador', () => {
    expect(leer('src/hooks/useWASM.ts')).not.toMatch(/fetch\('\/wasm/);
    expect(leer('src/hooks/useServiceWorker.ts')).not.toMatch(/register\('\/sw-v50\.js'/);
    expect(leer('src/sections/WelcomeScreen.tsx')).not.toMatch(/src="\/mosaic-preview\.png"/);
    for (const f of ['src/lib/equipmentVisuals.ts', 'src/types/equipmentDB.ts', 'src/sections/dialogs/PlanValidatorDialog.tsx', 'src/sections/dialogs/EquipmentShieldingWizard.tsx']) {
      expect(leer(f)).not.toMatch(/'\/(equipment-images|installation-guides)\//);
    }
    const manifest = JSON.parse(leer('public/manifest.json'));
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.icons.every((i: { src: string }) => !i.src.startsWith('/'))).toBe(true);
    const sw = leer('public/sw-v50.js');
    expect(sw).toMatch(/self\.registration \? self\.registration\.scope/);
    expect(sw).not.toMatch(/'\/index\.html'/);
  });

  it('carga diferida: CanvasArea sale de la entrada (lazy) y se redimensiona al montarse', () => {
    const sd = leer('src/pages/ShieldingDesigner.tsx');
    expect(sd).toMatch(/const CanvasArea = lazy\(\(\) => import\('@\/sections\/CanvasArea'\)\)/);
    expect(sd).not.toMatch(/^import CanvasArea from/m);
    expect(leer('src/sections/CanvasArea.tsx')).toMatch(/window\.dispatchEvent\(new Event\('resize'\)\)/);
  });
});

describe('Prioridad baja: cálculos y datos mostrados', () => {
  it('Python (NCRP 151): P en Sv contra W en Gy y TVL₁/TVLₑ de la Tabla B.2', () => {
    const s = dialogo('PythonIntegrationDialog.tsx');
    expect(s).toMatch(/P_Sv_week = design_goal_mSv_week \* 1e-3/);
    expect(s).toMatch(/tvl1_cm \+ \(n - 1\) \* tvle_cm/);
    expect(s).not.toMatch(/workload_cGy_week/);
  });

  it('MCNP: conversión de F6 (1 MeV/g = 1.602×10⁻¹⁰ Gy) y de *F6 (1 jerk/g = 10¹² Gy)', () => {
    const s = dialogo('MCNPGUIDeckGenerator.tsx');
    expect(s).toContain('x 1.602e-10 (Gy por MeV/g)');
    expect(s).toContain('1 jerk/g = 1e9 J/g = 1e12 Gy');
    expect(s).not.toMatch(/= 1e3 to get Gy/);
  });

  it('Revit: px → m con la escala del plano → pies; sin «PASS» fijo', () => {
    const s = dialogo('RevitAddinDialog.tsx');
    expect(s).toMatch(/data\.scale_m_per_pixel \/ 0\.3048/);
    expect(s).not.toMatch(/\/304\.8/);
    expect(s).not.toMatch(/Set\("PASS"\)/);
  });

  it('Ciclotrón KIUBE: horas de haz por año editables (antes 4000 h fijas)', () => {
    const s = dialogo('CycloneKIUBEWizard.tsx');
    expect(s).toMatch(/const annualDose = \(doseBehindWall \* horas\) \/ 1000/);
    expect(s).toMatch(/horasHazAnio: 4000/);
  });

  it('Plantillas de la comunidad sin descargas ni calificaciones ficticias; rótulos de XCOM y concreto', () => {
    expect(dialogo('CommunityTemplatesDialog.tsx')).not.toMatch(/downloads|rating/);
    expect(dialogo('NistXcomDialog.tsx')).toMatch(/haz estrecho/);
    expect(dialogo('CostEstimatorDialog.tsx')).toMatch(/f'c 235 kg\/cm², ρ ≈ 2350 kg\/m³/);
  });

  it('Audit Trail sin servidor: lo dice en lugar de «sin registros»', () => {
    render(<TRPCProvider><AuditTrailDialog open onOpenChange={() => {}} projectId="p" /></TRPCProvider>);
    expect(screen.getByTestId('audit-trail-sin-servidor').textContent).toMatch(/Sin servidor configurado/);
  });
});
