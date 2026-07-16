import type { FloorPlan } from '@/types/radshield';
import { buildF164ClinicalProjectMap } from '@/lib/f164ClinicalProjectMap';

interface ClinicalProjectMapProps {
  floorPlan?: FloorPlan;
  compact?: boolean;
}

const positions = [
  { x: 50, y: 32 },
  { x: 145, y: 30 },
  { x: 238, y: 32 },
  { x: 62, y: 96 },
  { x: 145, y: 96 },
  { x: 228, y: 96 },
  { x: 50, y: 160 },
  { x: 145, y: 162 },
  { x: 238, y: 160 },
  { x: 145, y: 224 },
];

export default function ClinicalProjectMap({ floorPlan, compact = false }: ClinicalProjectMapProps) {
  const map = buildF164ClinicalProjectMap(floorPlan);
  const visibleNodes = compact ? map.nodes.filter((node) => node.ready).slice(0, 6) : map.nodes;
  const nodeIndex = new Map(map.nodes.map((node, index) => [node.id, positions[index]]));

  return (
    <div data-testid="f164-clinical-project-map" className="rounded-md border border-teal-200 bg-white/95 text-slate-700 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-teal-100 px-2.5 py-1.5">
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-teal-800">F164 mapa clinico del proyecto</div>
          <div className="truncate text-[8px] text-slate-500">Plano / areas / equipos / proteccion / evidencia</div>
        </div>
        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-bold ${
          map.status === 'clinical-map-ready'
            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
            : 'border-orange-100 bg-orange-50 text-orange-700'
        }`}>
          {map.score}%
        </span>
      </div>

      <div className={compact ? 'p-2' : 'grid gap-2 p-2 md:grid-cols-[320px_1fr]'}>
        <svg
          viewBox="0 0 290 255"
          role="img"
          aria-label="Mapa clinico derivado del floorplan"
          className={compact ? 'h-[130px] w-full' : 'h-[255px] w-full'}
        >
          <rect x="4" y="4" width="282" height="247" rx="10" fill="#f8fafc" stroke="#ccfbf1" />
          {map.links.map((link) => {
            const from = nodeIndex.get(link.from);
            const to = nodeIndex.get(link.to);
            if (!from || !to) return null;
            return (
              <g key={`${link.from}-${link.to}`} opacity={link.ready ? 0.9 : 0.25}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={link.ready ? '#0f766e' : '#94a3b8'} strokeWidth="1.4" />
              </g>
            );
          })}
          {map.nodes.map((node, index) => {
            const point = positions[index];
            return (
              <g key={node.id} transform={`translate(${point.x} ${point.y})`} opacity={node.ready ? 1 : 0.36}>
                <circle r={compact ? 13 : 16} fill={node.ready ? node.color : '#e2e8f0'} stroke="#ffffff" strokeWidth="2" />
                <text y="4" textAnchor="middle" className="fill-white text-[10px] font-bold">
                  {node.count || '-'}
                </text>
                {!compact && (
                  <text y="28" textAnchor="middle" className="fill-slate-600 text-[7px] font-semibold">
                    {node.label.slice(0, 18)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className={compact ? 'mt-1 grid grid-cols-2 gap-1' : 'grid content-start gap-1'}>
          {(compact ? visibleNodes : map.nodes).map((node) => (
            <div key={node.id} className="flex min-w-0 items-center gap-1 rounded border border-slate-100 bg-slate-50 px-1.5 py-1">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: node.ready ? node.color : '#cbd5e1' }} />
              <span className="truncate text-[8px] font-medium">{node.label}</span>
              <span className="ml-auto text-[8px] font-mono text-slate-500">{node.count}</span>
            </div>
          ))}
          {!compact && (
            <div className="mt-1 rounded border border-teal-100 bg-teal-50 px-2 py-1 text-[8px] leading-snug text-teal-900">
              Export: {map.exportTargets.join(' | ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
