import { describe, expect, it } from 'vitest';
import {
  buildF491F498RegulatoryMaterialsDb,
  formatF491F498RegulatoryMaterialsDbMarkdown,
} from '@/lib/f491F498RegulatoryMaterialsDb';

describe('F491-F498 regulatory materials DB', () => {
  it('builds a versioned source and material registry', () => {
    const contract = buildF491F498RegulatoryMaterialsDb();

    expect(contract.schema).toBe('radshield-mx.db.regulatory-materials.f491-f498.v1');
    expect(contract.status).toBe('versioned-db-ready');
    expect(contract.summary.totalSources).toBeGreaterThan(10);
    expect(contract.summary.totalMaterials).toBeGreaterThan(5);
    expect(contract.summary.calculationAllowedMaterials).toBeGreaterThan(0);
    expect(contract.databaseRoute.tables).toEqual(expect.arrayContaining(['regulatory_sources', 'material_constants', 'material_value_versions']));
  });

  it('keeps vendor/lab materials out of final calculation constants until reviewed', () => {
    const contract = buildF491F498RegulatoryMaterialsDb();
    const commercial = contract.materials.filter((item) => item.manufacturer || item.reviewState === 'review-required');

    expect(commercial.length).toBeGreaterThan(0);
    expect(commercial.every((item) => !item.allowedUses.includes('calculation'))).toBe(true);
    expect(commercial.some((item) => item.warnings.join(' ').includes('source/page/hash'))).toBe(true);
  });

  it('formats a Memoria/Evidence ready summary', () => {
    const markdown = formatF491F498RegulatoryMaterialsDbMarkdown();

    expect(markdown).toContain('F491-F498 DB REGULATORIA/MATERIALES VERSIONADA');
    expect(markdown).toContain('regulatory_sources');
    expect(markdown).toContain('MaterialComparisonDialog');
    expect(markdown).toContain('F484-F490');
  });
});
