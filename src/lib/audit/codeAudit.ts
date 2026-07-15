/**
 * codeAudit.ts — Code Quality Audit
 * Detects anti-patterns, style violations, security issues,
 * performance smells, and maintainability concerns.
 */

export interface CodeAuditRule {
  readonly id: string;
  readonly name: string;
  readonly category: 'style' | 'performance' | 'security' | 'maintainability' | 'correctness';
  readonly severity: 'info' | 'warning' | 'error';
  readonly description: string;
  readonly check: (line: string, lineNum: number, filePath: string, fullFile: string) => CodeIssue | null;
}

export interface CodeIssue {
  readonly ruleId: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly category: string;
  readonly message: string;
  readonly file: string;
  readonly line: number;
  readonly column?: number;
  readonly snippet: string;
  readonly fix?: string;
}

export interface CodeAuditReport {
  readonly timestamp: number;
  readonly filesAudited: number;
  readonly totalIssues: number;
  readonly issuesBySeverity: { readonly error: number; readonly warning: number; readonly info: number };
  readonly issuesByCategory: Record<string, number>;
  readonly issues: readonly CodeIssue[];
  readonly score: number;
  readonly grade: 'A' | 'B' | 'C' | 'D' | 'F';
  readonly topIssues: readonly CodeIssue[];
}

// ─── Audit Rules ───
export const AUDIT_RULES: readonly CodeAuditRule[] = [
  // ── Performance ──
  {
    id: 'PERF-001',
    name: 'Spread in loop',
    category: 'performance',
    severity: 'warning',
    description: 'Spread operator (...) inside a loop causes O(n) copy per iteration.',
    check: (line, lineNum, filePath) => {
      if (/\.\.\.[\w.]+/.test(line) && /\b(for|while|forEach|map|reduce)\b/.test(line)) {
        return {
          ruleId: 'PERF-001', severity: 'warning', category: 'performance',
          message: 'Spread operator inside loop — creates new array each iteration.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Use .push() into pre-allocated array instead of spread.',
        };
      }
      return null;
    },
  },
  {
    id: 'PERF-002',
    name: 'JSON in hot path',
    category: 'performance',
    severity: 'warning',
    description: 'JSON.parse/stringify is expensive and should not be in hot paths.',
    check: (line, lineNum, filePath) => {
      if (/JSON\.(parse|stringify)/.test(line)) {
        return {
          ruleId: 'PERF-002', severity: 'warning', category: 'performance',
          message: 'JSON.parse/stringify detected — expensive serialization.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Use structuredClone() or pass object references instead.',
        };
      }
      return null;
    },
  },
  {
    id: 'PERF-003',
    name: 'Repeated property access',
    category: 'performance',
    severity: 'info',
    description: 'Accessing same nested property multiple times without caching.',
    check: (line, lineNum, filePath) => {
      const matches = line.match(/(\w+\.\w+(?:\.\w+)*)/g);
      if (matches) {
        const seen = new Set<string>();
        for (const m of matches) {
          if (seen.has(m) && m.split('.').length >= 2) {
            return {
              ruleId: 'PERF-003', severity: 'info', category: 'performance',
              message: `Repeated access to '${m}' on same line — consider caching.`,
              file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
              fix: `const cached = ${m};`,
            };
          }
          seen.add(m);
        }
      }
      return null;
    },
  },
  {
    id: 'PERF-004',
    name: 'Object.entries in loop',
    category: 'performance',
    severity: 'warning',
    description: 'Object.entries/keys/values recalculated each loop iteration.',
    check: (line, lineNum, filePath) => {
      if (/Object\.(entries|keys|values)\s*\(/.test(line) && /\b(for|while)\b/.test(line)) {
        return {
          ruleId: 'PERF-004', severity: 'warning', category: 'performance',
          message: 'Object.entries/keys/values inside loop condition.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Hoist outside loop: const keys = Object.keys(obj);',
        };
      }
      return null;
    },
  },
  {
    id: 'PERF-005',
    name: 'Array includes in loop',
    category: 'performance',
    severity: 'warning',
    description: 'Array.includes() inside a loop is O(n²) — use Set.has() instead.',
    check: (line, lineNum, filePath, fullFile) => {
      if (/\.includes\s*\(/.test(line) && /\b(for|while|forEach)\b/.test(line)) {
        // Check if the array is defined outside the loop
        const arrayName = line.match(/(\w+)\.includes/)?.[1];
        if (arrayName && !fullFile.includes(`new Set(${arrayName})`) && !fullFile.includes(`Set<`)) {
          return {
            ruleId: 'PERF-005', severity: 'warning', category: 'performance',
            message: `Array.includes() in loop — O(n) per iteration. Use Set.has() for O(1).`,
            file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
            fix: `const ${arrayName}Set = new Set(${arrayName}); // hoist outside loop`,
          };
        }
      }
      return null;
    },
  },
  // ── Security ──
  {
    id: 'SEC-001',
    name: 'InnerHTML usage',
    category: 'security',
    severity: 'error',
    description: 'innerHTML can lead to XSS vulnerabilities.',
    check: (line, lineNum, filePath) => {
      if (/\.innerHTML\s*=/.test(line) && !line.includes('sanitize')) {
        return {
          ruleId: 'SEC-001', severity: 'error', category: 'security',
          message: 'innerHTML assignment without sanitization — XSS risk.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Use textContent or a sanitization library like DOMPurify.',
        };
      }
      return null;
    },
  },
  {
    id: 'SEC-002',
    name: 'Eval usage',
    category: 'security',
    severity: 'error',
    description: 'eval() is dangerous and should never be used.',
    check: (line, lineNum, filePath) => {
      if (/\beval\s*\(/.test(line)) {
        return {
          ruleId: 'SEC-002', severity: 'error', category: 'security',
          message: 'eval() detected — critical security vulnerability.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Use JSON.parse for JSON, or Function constructor as last resort.',
        };
      }
      return null;
    },
  },
  // ── Maintainability ──
  {
    id: 'MAINT-001',
    name: 'Magic number',
    category: 'maintainability',
    severity: 'info',
    description: 'Unnamed numeric literal that should be a named constant.',
    check: (line, lineNum, filePath) => {
      // Skip comments, strings, and obvious cases
      const cleanLine = line.replace(/["'`][^"'`]*["'`]/g, '""').replace(/\/\/.*$/, '');
      const matches = cleanLine.match(/[^\w.](\d{3,}(?:\.\d+)?|0\.\d{3,})/g);
      if (matches && !cleanLine.includes('const') && !cleanLine.includes(':')) {
        return {
          ruleId: 'MAINT-001', severity: 'info', category: 'maintainability',
          message: `Magic number detected: ${matches.join(', ')}.`,
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Extract to a named constant with descriptive name.',
        };
      }
      return null;
    },
  },
  {
    id: 'MAINT-002',
    name: 'TODO without issue',
    category: 'maintainability',
    severity: 'info',
    description: 'TODO comment without tracking issue reference.',
    check: (line, lineNum, filePath) => {
      if (/TODO(?!\s*#\d+|\s*\[)/i.test(line) && !line.includes('TODO:')) {
        return {
          ruleId: 'MAINT-002', severity: 'info', category: 'maintainability',
          message: 'TODO without issue reference — may be forgotten.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Convert to GitHub issue: TODO #123',
        };
      }
      return null;
    },
  },
  {
    id: 'MAINT-003',
    name: 'Console statement',
    category: 'maintainability',
    severity: 'warning',
    description: 'Console.log should not be in production code.',
    check: (line, lineNum, filePath) => {
      if (/console\.(log|warn|error|debug)\s*\(/.test(line) && !line.includes('//')) {
        return {
          ruleId: 'MAINT-003', severity: 'warning', category: 'maintainability',
          message: `Console statement in production code.`,
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Remove or use a proper logging framework.',
        };
      }
      return null;
    },
  },
  {
    id: 'MAINT-004',
    name: 'Deep nesting',
    category: 'maintainability',
    severity: 'warning',
    description: 'Excessive nesting (>4 levels) reduces readability.',
    check: (_line, lineNum, filePath, fullFile) => {
      const lines = fullFile.split('\n');
      const currentLine = lines[lineNum - 1] ?? '';
      let depth = 0;
      for (let i = 0; i < currentLine.length && i < currentLine.search(/\S/); i++) {
        if (currentLine[i] === ' ' || currentLine[i] === '\t') depth++;
      }
      // Approximate: 2 spaces = 1 level
      const levels = Math.floor(depth / 2);
      if (levels > 8) { // 8*2 = 16 spaces = 8 levels
        return {
          ruleId: 'MAINT-004', severity: 'warning', category: 'maintainability',
          message: `Deep nesting (${levels} levels) — consider early returns or extraction.`,
          file: filePath, line: lineNum, snippet: currentLine.trim().slice(0, 80),
          fix: 'Use guard clauses or extract nested logic into functions.',
        };
      }
      return null;
    },
  },
  // ── Correctness ──
  {
    id: 'CORRECT-001',
    name: 'Floating point equality',
    category: 'correctness',
    severity: 'warning',
    description: 'Direct comparison of floating-point numbers is unreliable.',
    check: (line, lineNum, filePath) => {
      if (/===?\s*[\d.]+\s*[*\-/]?\s*[\d.]+/.test(line) && !line.includes('Math.abs')) {
        return {
          ruleId: 'CORRECT-001', severity: 'warning', category: 'correctness',
          message: 'Floating-point direct comparison — use epsilon-based comparison.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Use Math.abs(a - b) < Number.EPSILON',
        };
      }
      return null;
    },
  },
  {
    id: 'CORRECT-002',
    name: 'Un awaited promise',
    category: 'correctness',
    severity: 'error',
    description: 'Promise created but not awaited — potential race condition.',
    check: (line, lineNum, filePath) => {
      if (/new\s+Promise\s*\(/.test(line) && !line.includes('await') && !line.includes('return')) {
        return {
          ruleId: 'CORRECT-002', severity: 'error', category: 'correctness',
          message: 'Promise created without await or return — may not execute.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Add await before the Promise, or return it to the caller.',
        };
      }
      return null;
    },
  },
  {
    id: 'CORRECT-003',
    name: 'Potentially unhandled rejection',
    category: 'correctness',
    severity: 'warning',
    description: 'Promise chain without .catch() or try/catch.',
    check: (line, lineNum, filePath, fullFile) => {
      if (/\.then\s*\(/.test(line) && !line.includes('.catch') && !fullFile.includes('try {')) {
        return {
          ruleId: 'CORRECT-003', severity: 'warning', category: 'correctness',
          message: 'Promise .then() without .catch() — unhandled rejection risk.',
          file: filePath, line: lineNum, snippet: line.trim().slice(0, 80),
          fix: 'Add .catch() handler or wrap in try/catch with await.',
        };
      }
      return null;
    },
  },
];

// ─── Run audit on source files ───
export const runCodeAudit = (files: { path: string; content: string }[]): CodeAuditReport => {
  const allIssues: CodeIssue[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const rule of AUDIT_RULES) {
        const issue = rule.check(lines[i], i + 1, file.path, file.content);
        if (issue) allIssues.push(issue);
      }
    }
  }

  // Sort by severity
  const severityOrder = { error: 0, warning: 1, info: 2 };
  const sorted = [...allIssues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const errors = sorted.filter(i => i.severity === 'error').length;
  const warnings = sorted.filter(i => i.severity === 'warning').length;
  const infos = sorted.filter(i => i.severity === 'info').length;

  const byCategory: Record<string, number> = {};
  for (const i of sorted) {
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
  }

  // Score: 100 = perfect
  let score = 100;
  score -= errors * 5;
  score -= warnings * 2;
  score -= infos * 0.5;
  score = Math.max(0, Math.round(score));

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (score >= 95) grade = 'A';
  else if (score >= 85) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 50) grade = 'D';

  return {
    timestamp: Date.now(),
    filesAudited: files.length,
    totalIssues: sorted.length,
    issuesBySeverity: { error: errors, warning: warnings, info: infos },
    issuesByCategory: byCategory,
    issues: Object.freeze(sorted),
    score,
    grade,
    topIssues: Object.freeze(sorted.slice(0, 20)),
  };
};

// ─── Export formats ───
export const exportCodeAuditJSON = (report: CodeAuditReport): string =>
  JSON.stringify(report, null, 2);

export const exportCodeAuditSARIF = (report: CodeAuditReport): string => {
  const rules = AUDIT_RULES.map(r => ({
    id: r.id,
    name: r.name,
    shortDescription: { text: r.description },
    defaultConfiguration: { level: r.severity === 'error' ? 'error' : r.severity === 'warning' ? 'warning' : 'note' },
  }));

  const results = report.issues.map(i => ({
    ruleId: i.ruleId,
    message: { text: i.message },
    locations: [{
      physicalLocation: {
        artifactLocation: { uri: i.file },
        region: { startLine: i.line, startColumn: i.column },
      },
    }],
  }));

  return JSON.stringify({
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{ tool: { driver: { name: 'RadShield Code Audit', rules } }, results }],
  }, null, 2);
};
