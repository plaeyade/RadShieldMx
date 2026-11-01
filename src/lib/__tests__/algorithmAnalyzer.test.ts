/**
 * algorithmAnalyzer.test.ts — Tests for algorithm inefficiency detection
 * Validates detection of O(n²), memory anti-patterns, render issues, caching.
 */
import { describe, it, expect } from 'vitest';
import {
  detectQuadraticPatterns,
  detectMemoryPatterns,
  detectRenderPatterns,
  detectCachingOpportunities,
  analyzeSource,
  analyzeModule,
  exportAnalysisJSON,
} from '../performance/AlgorithmAnalyzer';

describe('AlgorithmAnalyzer', () => {
  // ─── O(n²) Detection ───
  describe('detectQuadraticPatterns', () => {
    it('detects nested loops without Map/Set', () => {
      const code = `
function findPairs(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (arr[i] === arr[j]) result.push([i, j]);
    }
  }
  return result;
}`;
      const reports = detectQuadraticPatterns(code, 'findPairs');
      const nested = reports.find(r => r.name.includes('nested'));
      expect(nested).toBeDefined();
      expect(nested!.severity).toBe('medium');
      expect(nested!.category).toBe('complexity');
    });

    it('detects filter+map chain', () => {
      const code = 'const x = items.filter(i => i > 5).map(i => i * 2);';
      const reports = detectQuadraticPatterns(code, 'processItems');
      // Look for any complexity report on line 1
      const chain = reports.find(r => r.category === 'complexity' && r.name.includes(':L1'));
      expect(chain).toBeDefined();
      expect(chain!.severity).toBe('medium');
    });

    it('detects repeated .length access in loop', () => {
      const code = 'for (let i = 0; i < arr.length; i++) { sum += arr[i]; }';
      const reports = detectQuadraticPatterns(code, 'sumArray');
      // Look for any complexity report
      const len = reports.find(r => r.category === 'complexity');
      expect(len).toBeDefined();
      expect(len!.autoFixable).toBe(true);
    });

    it('detects triple-nested loops as high severity', () => {
      const code = `
function triple(arr) {
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      for (let k = 0; k < arr.length; k++)
        sum += arr[i] * arr[j] * arr[k];
}`;
      const reports = detectQuadraticPatterns(code, 'triple');
      const triple = reports.find(r => r.name.includes('nested'));
      expect(triple).toBeDefined();
      expect(triple!.severity).toBe('high');
    });
  });

  // ─── Memory Patterns ───
  describe('detectMemoryPatterns', () => {
    it('detects JSON.stringify in hot path', () => {
      const code = 'function save(data) { localStorage.setItem("key", JSON.stringify(data)); }';
      const reports = detectMemoryPatterns(code, 'saveData');
      const json = reports.find(r => r.name.includes('json'));
      expect(json).toBeDefined();
      expect(json!.severity).toBe('high');
    });

    it('detects dynamic array growth', () => {
      const code = `
function collect() {
  const result = [];
  for (const item of items) {
    result.push(item);
    result.push(item.x);
    result.push(item.y);
    result.push(item.z);
    result.push(item.w);
    result.push(item.v);
  }
  return result;
}`;
      const reports = detectMemoryPatterns(code, 'collect');
      const growth = reports.find(r => r.name.includes('array-growth'));
      expect(growth).toBeDefined();
      expect(growth!.autoFixable).toBe(true);
    });
  });

  // ─── Render Patterns ───
  describe('detectRenderPatterns', () => {
    it('detects inline arrow function in JSX', () => {
      const code = '<button onClick={() => handleClick()}>Click</button>';
      const reports = detectRenderPatterns(code, 'MyButton');
      const inline = reports.find(r => r.name.includes('inline-handler'));
      expect(inline).toBeDefined();
      expect(inline!.category).toBe('render');
    });

    it('detects missing key in map', () => {
      const code = 'items.map(item => <div>{item.name}</div>)';
      const reports = detectRenderPatterns(code, 'ItemList');
      const key = reports.find(r => r.name.includes('missing-key'));
      expect(key).toBeDefined();
      expect(key!.severity).toBe('high');
    });

    it('detects inline object in style prop', () => {
      const code = '<div style={{ color: "red", margin: 10 }}>text</div>';
      const reports = detectRenderPatterns(code, 'StyledDiv');
      const obj = reports.find(r => r.name.includes('inline-object'));
      expect(obj).toBeDefined();
    });
  });

  // ─── Caching Opportunities ───
  describe('detectCachingOpportunities', () => {
    it('detects Object.keys in loop', () => {
      const code = `
for (let i = 0; i < 10; i++) {
  const keys = Object.keys(data);
  for (const k of keys) process(k);
}`;
      const reports = detectCachingOpportunities(code, 'processData');
      const cache = reports.find(r => r.name.includes('object-keys'));
      expect(cache).toBeDefined();
      expect(cache!.severity).toBe('medium');
    });
  });

  // ─── Composite Analysis ───
  describe('analyzeSource', () => {
    it('returns score 100 for clean code', () => {
      const code = `
function add(a: number, b: number): number {
  return a + b;
}`;
      const result = analyzeSource(code, 'add', 'function');
      expect(result.score).toBe(100);
      expect(result.summary.critical).toBe(0);
      expect(result.summary.high).toBe(0);
    });

    it('returns lower score for problematic code', () => {
      const code = `
function process(items) {
  const result = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      result.push(items[i] + items[j]);
    }
  }
  const data = JSON.stringify(result);
  localStorage.setItem('key', data);
  return result;
}`;
      const result = analyzeSource(code, 'process', 'function');
      expect(result.score).toBeLessThan(100);
      expect(result.reports.length).toBeGreaterThan(0);
      expect(result.summary.high + result.summary.medium).toBeGreaterThan(0);
    });
  });

  describe('analyzeModule', () => {
    it('analyzes multiple files', () => {
      const files = [
        { name: 'clean.ts', source: 'export const add = (a: number, b: number): number => a + b;', type: 'function' as const },
        { name: 'bad.tsx', source: 'items.map(i => <div>{i}</div>)', type: 'component' as const },
      ];
      const result = analyzeModule(files);
      expect(result.score).toBeLessThan(100); // bad.tsx has missing key
      expect(result.reports.length).toBeGreaterThan(0);
    });
  });

  describe('export formats', () => {
    it('exports valid JSON', () => {
      const result = analyzeSource('const x = 1;', 'test', 'function');
      const json = exportAnalysisJSON(result);
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});
