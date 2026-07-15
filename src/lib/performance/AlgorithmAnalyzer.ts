/**
 * AlgorithmAnalyzer — Detects inefficient algorithms and excessive memory patterns
 * using heuristics: O(n²) detection, repeated calculations, unnecessary allocations.
 */

export interface InefficiencyReport {
  readonly name: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly category: 'complexity' | 'allocation' | 'caching' | 'render' | 'io';
  readonly description: string;
  readonly recommendation: string;
  readonly estimatedImpact: string;
  readonly autoFixable: boolean;
}

export interface AnalysisResult {
  readonly timestamp: number;
  readonly reports: readonly InefficiencyReport[];
  readonly score: number; // 0-100, higher = better
  readonly summary: {
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
    readonly autoFixable: number;
  };
}

// ─── O(n²) pattern detection ───
export interface LoopPattern {
  readonly funcName: string;
  readonly nestedDepth: number;
  readonly loopVars: readonly string[];
  readonly hasArrayMethod: boolean;
}

export const detectQuadraticPatterns = (
  sourceCode: string,
  funcName: string
): InefficiencyReport[] => {
  const reports: InefficiencyReport[] = [];
  const lines = sourceCode.split('\n');

  // Detect nested loops on same array
  let depth = 0;
  let maxDepth = 0;
  const loopStack: { line: number; type: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Enter loop
    if (/^(for|while)\s*\(/.test(line) || /\.(forEach|map|filter|reduce)\s*\(/.test(line)) {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
      loopStack.push({ line: i + 1, type: line.match(/^(for|while|\.\w+)/)?.[0] ?? 'loop' });
    }

    // Exit block (simplified)
    if (line === '}' && depth > 0) {
      depth--;
      loopStack.pop();
    }

    // Detect filter+map chains that could be single reduce
    if (/\.filter\s*\([^)]*\)\.map\s*\(/.test(line)) {
      reports.push({
        name: `${funcName}:L${i + 1}`,
        severity: 'medium',
        category: 'complexity',
        description: `Chained .filter().map() on line ${i + 1} — iterates array twice.`,
        recommendation: 'Combine into a single .reduce() or use a for-loop with push.',
        estimatedImpact: '~2x speedup on large arrays (>1000 items).',
        autoFixable: false,
      });
    }

    // Detect repeated .length access in for-loop condition
    if (/for\s*\(.*?<\s*\w+\.length/.test(line)) {
      reports.push({
        name: `${funcName}:L${i + 1}`,
        severity: 'low',
        category: 'complexity',
        description: `Repeated .length access in loop condition on line ${i + 1}.`,
        recommendation: 'Cache .length in a local variable: for (let i = 0, n = arr.length; i < n; i++).',
        estimatedImpact: '~10-15% speedup on tight loops.',
        autoFixable: true,
      });
    }
  }

  if (maxDepth >= 3) {
    reports.push({
      name: `${funcName}:nested`,
      severity: 'high',
      category: 'complexity',
      description: `Triple-nested loops detected (depth=${maxDepth}). Potential O(n³) complexity.`,
      recommendation: 'Refactor: use lookup tables, Map/Set for O(1) access, or pre-calculate values.',
      estimatedImpact: 'Could reduce from O(n³) to O(n) or O(n log n) with proper data structures.',
      autoFixable: false,
    });
  } else if (maxDepth >= 2 && !sourceCode.includes('Map') && !sourceCode.includes('Set')) {
    reports.push({
      name: `${funcName}:nested`,
      severity: 'medium',
      category: 'complexity',
      description: `Nested loops without Map/Set optimization.`,
      recommendation: 'Consider using Map/Set for O(1) lookups instead of linear search in inner loop.',
      estimatedImpact: '~10-100x speedup depending on data size.',
      autoFixable: false,
    });
  }

  // Detect spread in loops (allocates new array each iteration)
  if (/\.\.\.\w+/.test(sourceCode) && maxDepth > 0) {
    const spreadLines = lines.map((l, i) => ({ line: l, num: i + 1 }))
      .filter(({ line }) => /\.\.\.\w+/.test(line) && (line.includes('for') || line.includes('while') || depth > 0));
    for (const { line, num } of spreadLines) {
      reports.push({
        name: `${funcName}:L${num}`,
        severity: 'medium',
        category: 'allocation',
        description: `Spread operator inside loop on line ${num} — creates new array each iteration.`,
        recommendation: 'Pre-allocate result array and use .push() instead of spread.',
        estimatedImpact: 'Reduces GC pressure significantly in hot loops.',
        autoFixable: true,
      });
    }
  }

  return reports;
};

// ─── Memory pattern detection ───
export const detectMemoryPatterns = (
  sourceCode: string,
  funcName: string
): InefficiencyReport[] => {
  const reports: InefficiencyReport[] = [];

  // Large object literals in hot paths
  if (/\{\s*\w+:\s*\{/.test(sourceCode) && sourceCode.split('\n').length < 50) {
    reports.push({
      name: `${funcName}:object-allocation`,
      severity: 'low',
      category: 'allocation',
      description: 'Nested object literal creation detected in potentially hot function.',
      recommendation: 'Hoist static objects to module scope or use Object.freeze() constants.',
      estimatedImpact: 'Eliminates repeated object allocation.',
      autoFixable: true,
    });
  }

  // JSON.parse/stringify in loops (expensive)
  if (/JSON\.(parse|stringify)/.test(sourceCode)) {
    reports.push({
      name: `${funcName}:json-serialization`,
      severity: 'high',
      category: 'complexity',
      description: 'JSON.parse/stringify detected — expensive serialization operation.',
      recommendation: 'Use structured cloning, TypedArrays, or pass references instead of serializing.',
      estimatedImpact: 'JSON.stringify is 10-100x slower than direct property access.',
      autoFixable: false,
    });
  }

  // Array re-allocation patterns
  const arrayPushCount = (sourceCode.match(/\.push\(/g) ?? []).length;
  const arrayInit = sourceCode.match(/=\s*\[\]/g) ?? [];
  if (arrayPushCount > 5 && arrayInit.length > 0) {
    reports.push({
      name: `${funcName}:array-growth`,
      severity: 'low',
      category: 'allocation',
      description: `Dynamic array growth with ${arrayPushCount} .push() calls.`,
      recommendation: 'If size is known, pre-allocate: new Array(expectedSize).',
      estimatedImpact: 'Eliminates array resizing overhead (~2x alloc reduction).',
      autoFixable: true,
    });
  }

  return reports;
};

// ─── Render pattern detection ───
export const detectRenderPatterns = (
  sourceCode: string,
  componentName: string
): InefficiencyReport[] => {
  const reports: InefficiencyReport[] = [];

  // Inline arrow functions in JSX (new reference each render)
  if (/on\w+=\{\s*\(\)\s*=>/.test(sourceCode)) {
    reports.push({
      name: `${componentName}:inline-handler`,
      severity: 'medium',
      category: 'render',
      description: 'Inline arrow function in JSX prop — creates new function reference each render.',
      recommendation: 'Use useCallback() for event handlers, or define function outside component.',
      estimatedImpact: 'Prevents unnecessary child re-renders in React.',
      autoFixable: true,
    });
  }

  // Object/array literals in JSX props
  if (/style=\{\s*\{/.test(sourceCode) || /sx=\{\s*\{/.test(sourceCode)) {
    reports.push({
      name: `${componentName}:inline-object`,
      severity: 'low',
      category: 'render',
      description: 'Inline object in style/sx prop — new reference each render.',
      recommendation: 'Extract to a const outside the component, or use memoized styles.',
      estimatedImpact: 'Reduces unnecessary re-renders of styled elements.',
      autoFixable: true,
    });
  }

  // Missing key prop
  if (/\.map\s*\(.*=>/.test(sourceCode) && !/key=\{/.test(sourceCode)) {
    reports.push({
      name: `${componentName}:missing-key`,
      severity: 'high',
      category: 'render',
      description: '.map() without key prop — React cannot optimize list updates.',
      recommendation: 'Add key={uniqueId} to mapped elements. Use stable IDs, not array indices.',
      estimatedImpact: 'O(n) → O(1) list diffing. Prevents full re-mounts.',
      autoFixable: true,
    });
  }

  return reports;
};

// ─── Caching opportunity detection ───
export const detectCachingOpportunities = (
  sourceCode: string,
  funcName: string
): InefficiencyReport[] => {
  const reports: InefficiencyReport[] = [];

  // Repeated Math.* calls with same args
  const mathCalls = sourceCode.match(/Math\.(\w+)\(([^)]+)\)/g) ?? [];
  const callSet = new Set<string>();
  const duplicates: string[] = [];
  for (const call of mathCalls) {
    if (callSet.has(call)) duplicates.push(call);
    callSet.add(call);
  }
  if (duplicates.length > 0) {
    reports.push({
      name: `${funcName}:duplicate-math`,
      severity: 'low',
      category: 'caching',
      description: `Duplicate Math calls: ${[...new Set(duplicates)].join(', ')}.`,
      recommendation: 'Cache result in a local variable.',
      estimatedImpact: 'Minor — mainly readability improvement.',
      autoFixable: true,
    });
  }

  // Object.entries/keys/values in loops
  if (/Object\.(entries|keys|values)/.test(sourceCode)) {
    const inLoop = sourceCode.split('\n').some((line, i, arr) => {
      const hasObjectMethod = /Object\.(entries|keys|values)/.test(line);
      const nearbyLoop = arr.slice(Math.max(0, i - 3), i + 3).some(l =>
        /^(for|while)\s*\(/.test(l.trim()) || /\.(forEach|map)\s*\(/.test(l)
      );
      return hasObjectMethod && nearbyLoop;
    });
    if (inLoop) {
      reports.push({
        name: `${funcName}:object-keys-loop`,
        severity: 'medium',
        category: 'caching',
        description: 'Object.keys/entries/values inside loop — recalculates on each iteration.',
        recommendation: 'Hoist outside the loop: const keys = Object.keys(obj); for (const k of keys).',
        estimatedImpact: '~2-5x speedup in object-heavy loops.',
        autoFixable: true,
      });
    }
  }

  return reports;
};

// ─── Composite analysis ───
export const analyzeSource = (
  sourceCode: string,
  name: string,
  type: 'function' | 'component' | 'module' = 'function'
): AnalysisResult => {
  const all: InefficiencyReport[] = [
    ...detectQuadraticPatterns(sourceCode, name),
    ...detectMemoryPatterns(sourceCode, name),
    ...detectCachingOpportunities(sourceCode, name),
    ...(type === 'component' ? detectRenderPatterns(sourceCode, name) : []),
  ];

  // Deduplicate by name
  const seen = new Set<string>();
  const reports = all.filter(r => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });

  const critical = reports.filter(r => r.severity === 'critical').length;
  const high = reports.filter(r => r.severity === 'high').length;
  const medium = reports.filter(r => r.severity === 'medium').length;
  const low = reports.filter(r => r.severity === 'low').length;
  const autoFixable = reports.filter(r => r.autoFixable).length;

  // Score: 100 = perfect, deduct per issue
  const deductions = critical * 25 + high * 15 + medium * 8 + low * 3;
  const score = Math.max(0, 100 - deductions);

  return {
    timestamp: Date.now(),
    reports: Object.freeze(reports),
    score,
    summary: { critical, high, medium, low, autoFixable },
  };
};

// ─── Batch analysis for a module ───
export const analyzeModule = (
  files: { name: string; source: string; type: 'function' | 'component' | 'module' }[]
): AnalysisResult => {
  let allReports: InefficiencyReport[] = [];
  let totalScore = 0;

  for (const file of files) {
    const result = analyzeSource(file.source, file.name, file.type);
    allReports = [...allReports, ...result.reports];
    totalScore += result.score;
  }

  const avgScore = files.length > 0 ? Math.round(totalScore / files.length) : 100;
  const critical = allReports.filter(r => r.severity === 'critical').length;
  const high = allReports.filter(r => r.severity === 'high').length;
  const medium = allReports.filter(r => r.severity === 'medium').length;
  const low = allReports.filter(r => r.severity === 'low').length;
  const autoFixable = allReports.filter(r => r.autoFixable).length;

  return {
    timestamp: Date.now(),
    reports: Object.freeze(allReports),
    score: avgScore,
    summary: { critical, high, medium, low, autoFixable },
  };
};

// ─── Export report ───
export const exportAnalysisJSON = (result: AnalysisResult): string =>
  JSON.stringify(result, null, 2);

export const exportAnalysisMarkdown = (result: AnalysisResult): string => {
  const s = result.summary;
  return `# Algorithm Analysis Report
**Score:** ${result.score}/100 | **Date:** ${new Date(result.timestamp).toISOString()}

## Summary
- Critical: ${s.critical} | High: ${s.high} | Medium: ${s.medium} | Low: ${s.low}
- Auto-fixable: ${s.autoFixable}

## Issues
${result.reports.map(r => `### ${r.name} (${r.severity.toUpperCase()})
- **Category:** ${r.category}
- **Description:** ${r.description}
- **Recommendation:** ${r.recommendation}
- **Impact:** ${r.estimatedImpact}
- **Auto-fixable:** ${r.autoFixable ? 'Yes' : 'No'}
`).join('\n')}
`;
};
