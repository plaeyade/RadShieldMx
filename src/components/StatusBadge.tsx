import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'pass' | 'warning' | 'fail' | 'info' | 'neutral';

interface Props { status: StatusType; label?: string; showIcon?: boolean; size?: 'sm' | 'md'; }

const CONFIG: Record<StatusType, { icon: typeof CheckCircle2; bg: string; text: string; border: string; defaultLabel: string }> = {
  pass:    { icon: CheckCircle2,  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', defaultLabel: 'PASS' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', defaultLabel: 'WARN' },
  fail:    { icon: XCircle,       bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   defaultLabel: 'FAIL' },
  info:    { icon: Info,          bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  defaultLabel: 'INFO' },
  neutral: { icon: Info,          bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200', defaultLabel: 'N/A' },
};

export default function StatusBadge({ status, label, showIcon = true, size = 'sm' }: Props) {
  const c = CONFIG[status];
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 border rounded-full font-medium', c.bg, c.text, c.border, size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1')}>
      {showIcon && <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />}
      {label || c.defaultLabel}
    </span>
  );
}
