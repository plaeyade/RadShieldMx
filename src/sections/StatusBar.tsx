import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Clock, Activity, Shield, GitBranch, User } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

interface StatusBarProps {
  projectName: string;
  lastSaved: Date | null;
  isCalculating: boolean;
  calculationStatus: 'idle' | 'running' | 'success' | 'error';
  numSources: number;
  numBarriers: number;
  numBarriersCalculated: number;
  version: string;
  isDirty: boolean;
  userName?: string | null;
}

export default function StatusBar({
  projectName, lastSaved, isCalculating, calculationStatus,
  numSources, numBarriers, numBarriersCalculated, version, isDirty, userName,
}: StatusBarProps) {
  const { t } = useI18n();

  const statusConfig = {
    idle: { label: t('status.ready'), color: 'bg-slate-300' },
    running: { label: 'Calculating...', color: 'bg-[#f97316] animate-pulse' },
    success: { label: 'Done', color: 'bg-emerald-400' },
    error: { label: 'Error', color: 'bg-red-400' },
  };
  const status = statusConfig[calculationStatus];

  return (
    <div className="h-6 bg-white border-t border-slate-200 text-slate-500 flex items-center px-3 text-[10px] gap-3 select-none shrink-0 z-50">
      {/* Left: Project */}
      <div className="flex items-center gap-1.5">
        <Shield className="w-3 h-3 text-[#f97316]" />
        <span className="font-semibold text-slate-700 truncate max-w-[200px]">{projectName || 'RadShield-MX'}</span>
        {isDirty && (
          <Badge variant="outline" className="h-3.5 px-1 text-[8px] border-[#f97316] text-[#f97316]">{t('status.modified')}</Badge>
        )}
      </div>

      <Separator orientation="vertical" className="h-3 bg-slate-200" />

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${status.color}`} />
        <span className="text-slate-500">{status.label}</span>
      </div>

      <Separator orientation="vertical" className="h-3 bg-slate-200" />

      {/* Counts */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <GitBranch className="w-2.5 h-2.5 text-[#f97316]" />
          {t('status.sources')}: <strong className="text-slate-700">{numSources}</strong>
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-[#f97316]" />
          {t('status.barriers')}: <strong className="text-slate-700">{numBarriers}</strong>
        </span>
        {numBarriersCalculated > 0 && (
          <span className="text-emerald-600 font-medium">({numBarriersCalculated} calculated)</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Right */}
      <div className="flex items-center gap-3">
        {lastSaved && (
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-2.5 h-2.5" />{lastSaved.toLocaleTimeString()}
          </span>
        )}
        <span className="flex items-center gap-1 text-emerald-600">
          <Save className="w-2.5 h-2.5" />{t('status.autoSave')}
        </span>
        {userName ? (
          <span className="flex items-center gap-1 text-emerald-600 text-[10px]">
            <User className="w-2.5 h-2.5" />{userName}
          </span>
        ) : (
          <span className="text-slate-300 text-[10px]">Sin sesion</span>
        )}
        <span className="text-slate-400 font-mono">{version}</span>
      </div>
    </div>
  );
}
