import { describe, expect, it } from 'vitest';
import {
  buildControlledZoneCalculationPacket,
  buildDefaultControlledZoneProfile,
  generateControlledZoneFeasibility,
  summarizeControlledZoneFeasibility,
} from '../controlledZoneFeasibility';

describe('controlled zone feasibility', () => {
  it('generates ranked medical layout options with shielding seed points', () => {
    const profile = buildDefaultControlledZoneProfile();
    const options = generateControlledZoneFeasibility(profile);
    const summary = summarizeControlledZoneFeasibility(options);

    expect(options.length).toBeGreaterThanOrEqual(4);
    expect(summary.bestScore).toBeGreaterThan(60);
    expect(summary.shieldingSeedCount).toBeGreaterThanOrEqual(20);
    expect(options[0].shieldingSeeds.map((seed) => seed.barrier)).toContain('Norte');
  });

  it('flags insufficient controlled-zone area and still builds a calculation packet', () => {
    const profile = buildDefaultControlledZoneProfile({
      siteWidth_m: 9,
      siteLength_m: 10,
      controlledZoneWidth_m: 6,
      controlledZoneLength_m: 6,
      maxBudget_mxn: 5000000,
    });
    const [option] = generateControlledZoneFeasibility(profile);
    const packet = buildControlledZoneCalculationPacket(option, profile);

    expect(option.warnings.length).toBeGreaterThan(0);
    expect(packet.schemaVersion).toBe('radshield-controlled-zone-feasibility-v1');
    expect(packet.calculationReadiness.requiredInputs).toContain('Carga de trabajo semanal');
  });
});
