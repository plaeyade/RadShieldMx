import type { FloorPlan } from '@/types/radshield';
import { buildF164ClinicalMapExportPlan, buildF164ClinicalProjectMap, type F164ClinicalDomain } from '@/lib/f164ClinicalProjectMap';

interface ClinicalProjectMapProps {
  floorPlan?: FloorPlan;
  compact?: boolean;
  selectedDomain?: F164ClinicalDomain | null;
  onNodeSelect?: (domain: F164ClinicalDomain) => void;
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

export default function ClinicalProjectMap({ floorPlan, compact = false, selectedDomain, onNodeSelect }: ClinicalProjectMapProps) {
  const map = buildF164ClinicalProjectMap(floorPlan);
  const visibleNodes = compact ? map.nodes.filter((node) => node.ready).slice(0, 6) : map.nodes;
  const nodeIndex = new Map(map.nodes.map((node, index) => [node.id, positions[index]]));
  const exportPlan = buildF164ClinicalMapExportPlan(floorPlan);
  const activeFlows = map.flowRoutes.filter((route) => route.ready).slice(0, compact ? 2 : 4);

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
          {activeFlows.map((route, index) => {
            const from = nodeIndex.get(route.from);
            const to = nodeIndex.get(route.to);
            if (!from || !to) return null;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 5 - index * 4;
            return (
              <g key={route.id} opacity={route.ready ? 0.95 : 0.2}>
                <path d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`} fill="none" stroke="#14b8a6" strokeDasharray="4 3" strokeWidth="1.3" />
                {!compact && (
                  <text x={midX} y={midY - 2} textAnchor="middle" className="fill-teal-700 text-[6px] font-semibold">
                    {route.routeType}
                  </text>
                )}
              </g>
            );
          })}
          {map.nodes.map((node, index) => {
            const point = positions[index];
            const selected = selectedDomain === node.id;
            return (
              <g
                key={node.id}
                data-domain={node.id}
                transform={`translate(${point.x} ${point.y})`}
                opacity={node.ready ? 1 : 0.36}
                className={onNodeSelect ? 'cursor-pointer' : undefined}
                onClick={() => onNodeSelect?.(node.id)}
              >
                <circle r={compact ? 13 : 16} fill={node.ready ? node.color : '#e2e8f0'} stroke={selected ? '#0f172a' : '#ffffff'} strokeWidth={selected ? 3 : 2} />
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
            <button
              key={node.id}
              type="button"
              data-domain={node.id}
              onClick={() => onNodeSelect?.(node.id)}
              className={`flex min-w-0 items-center gap-1 rounded border px-1.5 py-1 text-left ${
                selectedDomain === node.id ? 'border-teal-300 bg-teal-50' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: node.ready ? node.color : '#cbd5e1' }} />
              <span className="truncate text-[8px] font-medium">{node.label}</span>
              <span className="ml-auto text-[8px] font-mono text-slate-500">{node.count}</span>
            </button>
          ))}
          {!compact && map.roomClassifications.length > 0 && (
            <div className="mt-1 rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[8px] leading-snug text-blue-900">
              OCR/salas: {map.roomClassifications.slice(0, 4).map((room) => `${room.name} -> ${room.inferredDomain}`).join(' | ')}
            </div>
          )}
          {!compact && (
            <div className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-[8px] leading-snug text-emerald-900">
              Sync: {map.syncTargets.filter((target) => target.ready).map((target) => target.target).join(' | ')}
            </div>
          )}
          {!compact && (
            <div className="mt-1 rounded border border-teal-100 bg-teal-50 px-2 py-1 text-[8px] leading-snug text-teal-900">
              Export: {map.visualExports.map((item) => item.label).join(' | ')} / SVG bytes {exportPlan.svg.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
