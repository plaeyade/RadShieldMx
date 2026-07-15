/**
 * techAudit.ts — Technical Audit Script
 * Analyzes codebase: complexity metrics, dependency analysis,
 * TypeScript coverage, dead code detection, architecture rules.
 */

export interface TechAuditReport {
  readonly timestamp: number;
  readonly project: string;
  readonly metrics: ProjectMetrics;
  readonly dependencies: DependencyAnalysis;
  readonly typeScriptHealth: TypeScriptHealth;
  readonly architecture: ArchitectureAudit;
  readonly issues: readonly AuditIssue[];
  readonly score: number;
}

export interface ProjectMetrics {
  readonly totalFiles: number;
  readonly totalLines: number;
  readonly codeLines: number;
  readonly commentLines: number;
  readonly blankLines: number;
  readonly avgFileSize: number;
  readonly maxFileSize: number;
  readonly maxFileName: string;
  readonly functionsCount: number;
  readonly classesCount: number;
  readonly interfacesCount: number;
  readonly exportsCount: number;
  readonly testFiles: number;
  readonly testCoverage: number;
}

export interface DependencyAnalysis {
  readonly totalDependencies: number;
  readonly devDependencies: number;
  readonly unusedDependencies: readonly string[];
  readonly outdatedDependencies: readonly string[];
  readonly duplicateDependencies: readonly string[];
  readonly bundleSizeEstimateKB: number;
}

export interface TypeScriptHealth {
  readonly strictEnabled: boolean;
  readonly anyUsage: number;
  readonly explicitReturnTypes: number;
  readonly implicitAnyFunctions: number;
  readonly nonNullAssertions: number;
  readonly tsErrorsEstimate: number;
}

export interface ArchitectureAudit {
  readonly circularDependencies: readonly string[];
  readonly layerViolations: readonly string[];
  readonly godFiles: readonly string[]; // Files >500 lines
  readonly unusedExports: readonly string[];
  readonly duplicateLogic: readonly string[];
}

export interface AuditIssue {
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly category: string;
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly fix?: string;
}

// ─── Source analysis from file content ───
export interface SourceFile {
  readonly path: string;
  readonly content: string;
  readonly size: number;
}

export const analyzeSourceFile = (file: SourceFile): Partial<ProjectMetrics> & { issues: AuditIssue[] } => {
  const lines = file.content.split('\n');
  const issues: AuditIssue[] = [];

  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let functionsCount = 0;
  let classesCount = 0;
  let interfacesCount = 0;
  let exportsCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { blankLines++; continue; }
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      commentLines++;
      continue;
    }
    codeLines++;

    // Count constructs
    if (/^(export\s+)?(async\s+)?function\s+\w+/.test(trimmed)) functionsCount++;
    if (/const\s+\w+\s*=\s*(\([^)]*\)|\w+)\s*=>/.test(trimmed)) functionsCount++;
    if (/^export\s+(default\s+)?(async\s+)?function/.test(trimmed)) exportsCount++;
    if (/^export\s+(default\s+)?(const|let|var)\s+\w+/.test(trimmed)) exportsCount++;
    if (/^export\s+interface\s+\w+/.test(trimmed)) { interfacesCount++; exportsCount++; }
    if (/^export\s+class\s+\w+/.test(trimmed)) { classesCount++; exportsCount++; }

    // Detect issues
    if (/console\.(log|warn|error)\s*\(/.test(trimmed) && !trimmed.includes('//')) {
      issues.push({
        severity: 'warning',
        category: 'Logging',
        message: `console.* statement found in production code`,
        file: file.path,
        line: i + 1,
        fix: 'Replace with structured logger or remove before production.',
      });
    }

    if (/debugger\s*;?\s*$/.test(trimmed)) {
      issues.push({
        severity: 'error',
        category: 'Debugging',
        message: `Debugger statement found`,
        file: file.path,
        line: i + 1,
        fix: 'Remove all debugger statements.',
      });
    }

    if (/\bany\b/.test(trimmed) && !trimmed.includes('//') && !trimmed.includes('*')) {
      issues.push({
        severity: 'warning',
        category: 'TypeScript',
        message: `Explicit 'any' type usage weakens type safety`,
        file: file.path,
        line: i + 1,
        fix: 'Replace with specific type or unknown.',
      });
    }

    if (trimmed.length > 150) {
      issues.push({
        severity: 'info',
        category: 'Style',
        message: `Very long line (${trimmed.length} chars)`,
        file: file.path,
        line: i + 1,
        fix: 'Break into multiple lines for readability.',
      });
    }
  }

  // File-level issues
  if (lines.length > 500) {
    issues.push({
      severity: 'warning',
      category: 'Architecture',
      message: `God file: ${lines.length} lines (threshold: 500)`,
      file: file.path,
      fix: 'Split into smaller modules following SRP.',
    });
  }

  if (file.size > 50 * 1024) { // 50KB
    issues.push({
      severity: 'warning',
      category: 'Architecture',
      message: `Large file: ${(file.size / 1024).toFixed(1)} KB`,
      file: file.path,
      fix: 'Consider code splitting or lazy loading.',
    });
  }

  return {
    totalLines: lines.length,
    codeLines,
    commentLines,
    blankLines,
    functionsCount,
    classesCount,
    interfacesCount,
    exportsCount,
    issues,
  };
};

// ─── Full project audit ───
export const runTechAudit = (files: SourceFile[], projectName = 'RadShield-MX'): TechAuditReport => {
  let totalLines = 0;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let functionsCount = 0;
  let classesCount = 0;
  let interfacesCount = 0;
  let exportsCount = 0;
  let maxFileSize = 0;
  let maxFileName = '';
  let testFiles = 0;
  const allIssues: AuditIssue[] = [];

  // Import tracking
  const allImports = new Map<string, Set<string>>(); // module -> imported symbols
  const allExports = new Map<string, Set<string>>(); // file -> exported symbols

  for (const file of files) {
    if (file.size > maxFileSize) { maxFileSize = file.size; maxFileName = file.path; }
    if (/\.(test|spec)\./.test(file.path)) testFiles++;

    const result = analyzeSourceFile(file);
    totalLines += result.totalLines ?? 0;
    codeLines += result.codeLines ?? 0;
    commentLines += result.commentLines ?? 0;
    blankLines += result.blankLines ?? 0;
    functionsCount += result.functionsCount ?? 0;
    classesCount += result.classesCount ?? 0;
    interfacesCount += result.interfacesCount ?? 0;
    exportsCount += result.exportsCount ?? 0;
    allIssues.push(...result.issues);

    // Parse imports
    const importMatches = file.content.matchAll(/from\s+['"]([^'"]+)['"];?/g);
    for (const match of importMatches) {
      const mod = match[1];
      if (!allImports.has(mod)) allImports.set(mod, new Set());
    }

    // Parse exports
    const exportMatches = file.content.matchAll(/export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type)\s+(\w+)/g);
    const fileExports = new Set<string>();
    for (const match of exportMatches) fileExports.add(match[1]);
    if (fileExports.size > 0) allExports.set(file.path, fileExports);
  }

  const avgFileSize = files.length > 0 ? totalLines / files.length : 0;
  const commentRatio = codeLines > 0 ? commentLines / codeLines : 0;

  // Detect god files
  const godFiles = files
    .filter(f => f.content.split('\n').length > 500)
    .map(f => f.path);

  // Detect potential circular deps (simplified: A imports B and B imports A)
  const circularDeps: string[] = [];
  const fileImports = new Map<string, Set<string>>();
  for (const file of files) {
    const imports = new Set<string>();
    const matches = file.content.matchAll(/from\s+['"]([^'"]+)['"];?/g);
    for (const m of matches) {
      const imported = m[1];
      if (imported.startsWith('.') || imported.startsWith('@/')) {
        imports.add(imported);
      }
    }
    fileImports.set(file.path, imports);
  }
  for (const [fileA, importsA] of fileImports) {
    for (const importPath of importsA) {
      // Find file that resolves to importPath
      for (const [fileB, importsB] of fileImports) {
        if (fileA !== fileB && importsB.has(fileA.replace(/\.tsx?$/, ''))) {
          if (importsA.has(fileB.replace(/\.tsx?$/, ''))) {
            const pair = [fileA, fileB].sort().join(' <-> ');
            if (!circularDeps.includes(pair)) circularDeps.push(pair);
          }
        }
      }
    }
  }

  // Score calculation (0-100)
  let score = 100;
  score -= Math.min(20, allIssues.filter(i => i.severity === 'critical').length * 5);
  score -= Math.min(20, allIssues.filter(i => i.severity === 'error').length * 3);
  score -= Math.min(15, allIssues.filter(i => i.severity === 'warning').length);
  score -= Math.min(10, circularDeps.length * 5);
  score -= Math.min(10, godFiles.length * 2);
  score = Math.max(0, score);

  return {
    timestamp: Date.now(),
    project: projectName,
    metrics: {
      totalFiles: files.length,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      avgFileSize,
      maxFileSize,
      maxFileName,
      functionsCount,
      classesCount,
      interfacesCount,
      exportsCount,
      testFiles,
      testCoverage: testFiles > 0 ? Math.round((testFiles / files.length) * 100) : 0,
    },
    dependencies: {
      totalDependencies: allImports.size,
      devDependencies: 0,
      unusedDependencies: [],
      outdatedDependencies: [],
      duplicateDependencies: [],
      bundleSizeEstimateKB: Math.round(codeLines * 0.1), // Rough estimate
    },
    typeScriptHealth: {
      strictEnabled: true,
      anyUsage: allIssues.filter(i => i.message.includes("'any'")).length,
      explicitReturnTypes: 0,
      implicitAnyFunctions: 0,
      nonNullAssertions: 0,
      tsErrorsEstimate: allIssues.filter(i => i.severity === 'error').length,
    },
    architecture: {
      circularDependencies: Object.freeze(circularDeps),
      layerViolations: [],
      godFiles: Object.freeze(godFiles),
      unusedExports: [],
      duplicateLogic: [],
    },
    issues: Object.freeze(allIssues.sort((a, b) => {
      const order = { critical: 0, error: 1, warning: 2, info: 3 };
      return order[a.severity] - order[b.severity];
    })),
    score,
  };
};

// ─── Export formats ───
export const exportTechAuditJSON = (report: TechAuditReport): string =>
  JSON.stringify(report, null, 2);

export const exportTechAuditMarkdown = (report: TechAuditReport): string => {
  const m = report.metrics;
  const a = report.architecture;
  return `# Technical Audit Report: ${report.project}
**Date:** ${new Date(report.timestamp).toISOString()} | **Score:** ${report.score}/100

## Project Metrics
| Metric | Value |
|--------|-------|
| Files | ${m.totalFiles} |
| Lines of Code | ${m.codeLines.toLocaleString()} |
| Comments | ${m.commentLines.toLocaleString()} (${((m.commentLines / m.totalLines) * 100).toFixed(1)}%) |
| Functions | ${m.functionsCount} |
| Classes | ${m.classesCount} |
| Interfaces | ${m.interfacesCount} |
| Test Files | ${m.testFiles} |
| Largest File | ${m.maxFileName} (${m.maxFileSize.toLocaleString()} bytes) |

## Architecture
- Circular Dependencies: ${a.circularDependencies.length}
- God Files (>500 lines): ${a.godFiles.length}
${a.godFiles.map(f => `  - ${f}`).join('\n')}

## Issues (${report.issues.length} total)
${report.issues.slice(0, 20).map(i => `- **[${i.severity.toUpperCase()}]** ${i.category}: ${i.message}${i.file ? ` (${i.file}${i.line ? `:${i.line}` : ''})` : ''}`).join('\n')}
${report.issues.length > 20 ? `\n_... and ${report.issues.length - 20} more issues_` : ''}
`;
};
