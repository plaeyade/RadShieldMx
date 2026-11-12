import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Clock, Shield, GitBranch, User } from 'lucide-react';
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
  importStatus?: 'preliminary' | 'final';
  importMode?: string;
  importCalculationStatus?: 'not-started' | 'blocked-no-source' | 'running' | 'complete' | 'error';
  onConfirmImport?: () => void;
  onOpenImportReview?: () => void;
}

export default function StatusBar({
  projectName, lastSaved, calculationStatus,
  numSources, numBarriers, numBarriersCalculated, version, isDirty, userName,
  importStatus, importMode, importCalculationStatus, onConfirmImport, onOpenImportReview,
}: StatusBarProps) {
  const { t } = useI18n();

  const statusConfig = {
    idle: { label: t('status.ready'), color: 'bg-slate-300' },
    running: { label: 'Calculating...', color: 'bg-[#f97316] animate-pulse' },
    success: { label: 'Done', color: 'bg-emerald-400' },
    error: { label: 'Error', color: 'bg-red-400' },
  };
  const status = statusConfig[calculationStatus];
  const importCalculationLabel = importCalculationStatus === 'complete'
    ? 'DXF calculado'
    : importCalculationStatus === 'running'
      ? 'DXF calculando'
      : importCalculationStatus === 'blocked-no-source'
        ? 'DXF sin fuente'
        : importCalculationStatus === 'error'
          ? 'DXF error'
          : null;
  const importCalculationClass = importCalculationStatus === 'complete'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
    : importCalculationStatus === 'blocked-no-source'
      ? 'border-amber-300 bg-amber-50 text-amber-700'
      : importCalculationStatus === 'error'
        ? 'border-red-300 bg-red-50 text-red-700'
        : 'border-slate-300 bg-slate-50 text-slate-600';

  return (
    <div className="h-6 bg-white border-t border-slate-200 text-slate-500 flex items-center px-3 text-[10px] gap-3 select-none shrink-0 z-50">
      {/* Left: Project */}
      <div className="flex items-center gap-1.5">
        <Shield className="w-3 h-3 text-[#f97316]" />
        <span className="font-semibold text-slate-700 truncate max-w-[200px]">{projectName || 'RadShield-MX'}</span>
        {isDirty && (
          <Badge variant="outline" className="h-3.5 px-1 text-[8px] border-[#f97316] text-[#f97316]">{t('status.modified')}</Badge>
        )}
        {importStatus === 'preliminary' && (
          <>
            <Badge
              variant="outline"
              className="h-3.5 px-1 text-[8px] border-amber-400 bg-amber-50 text-amber-700"
              title="Plano importado en modo preliminar; revise capas, escala y geometria antes de firmar memoria analitica."
            >
              DXF preliminar{importMode ? `/${importMode}` : ''}
            </Badge>
            {onConfirmImport && (
              <button
                type="button"
                data-testid="statusbar-confirm-dxf-geometry"
                onClick={onConfirmImport}
                className="h-4 rounded border border-emerald-300 bg-emerald-50 px-1.5 text-[8px] font-semibold text-emerald-700 hover:bg-emerald-100"
                title="Confirmar que la geometria DXF revisada puede usarse para calculo, memoria y evidencia."
              >
                Confirmar DXF
              </button>
            )}
          </>
        )}
        {importStatus === 'final' && importMode && (
          <Badge
            variant="outline"
            className="h-3.5 px-1 text-[8px] border-emerald-300 bg-emerald-50 text-emerald-700"
            title="Geometria DXF confirmada para calculo, memoria y evidencia."
          >
            DXF confirmado
          </Badge>
        )}
        {importStatus === 'final' && importCalculationLabel && (
          <Badge
            variant="outline"
            className={`h-3.5 px-1 text-[8px] ${importCalculationClass}`}
            title="Estado del calculo preliminar asociado a la geometria DXF confirmada."
          >
            {importCalculationLabel}
          </Badge>
        )}
        {importStatus && onOpenImportReview && (
          <button
            type="button"
            data-testid="statusbar-open-dxf-review"
            onClick={onOpenImportReview}
            className="h-4 rounded border border-slate-200 bg-slate-50 px-1.5 text-[8px] font-semibold text-slate-600 hover:bg-white hover:text-orange-700"
            title="Abrir revision DXF para escala, barreras, advertencias, calculo, Memoria IA y Evidence Pack."
          >
            Revisar
          </button>
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
          {t('status.sources')}: <strong data-testid="statusbar-source-count" className="text-slate-700">{numSources}</strong>
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-[#f97316]" />
          {t('status.barriers')}: <strong data-testid="statusbar-barrier-count" className="text-slate-700">{numBarriers}</strong>
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
