/**
 * A.22: Color-Blind Safe Palette
 * Icons + patterns + text labels in addition to color
 */
export type ComplianceStatus = 'pass' | 'warning' | 'fail' | 'neutral';

export interface StatusVisual {
  bg: string; text: string; border: string; icon: string; label: string; pattern?: string;
}

const STATUS_MAP: Record<ComplianceStatus, StatusVisual> = {
  pass: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', icon: '✓', label: 'PASS', pattern: 'solid' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', icon: '◆', label: 'WARN', pattern: 'striped' },
  fail: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', icon: '✗', label: 'FAIL', pattern: 'dotted' },
  neutral: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: '○', label: 'N/A', pattern: 'solid' },
};

export function getStatusVisual(status: ComplianceStatus): StatusVisual {
  return STATUS_MAP[status];
}

export function StatusBadge({ status, showIcon = true, showLabel = true }: { status: ComplianceStatus; showIcon?: boolean; showLabel?: boolean }) {
  const v = getStatusVisual(status);
  return `<span class="${v.bg} ${v.text} ${v.border} border px-2 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1">${showIcon ? v.icon + ' ' : ''}${showLabel ? v.label : ''}</span>`;
}
