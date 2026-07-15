import { useMemo } from 'react';
import { Ruler } from 'lucide-react';

export interface DimensionPoint {
  x: number;
  y: number;
}

export interface DimensionLineProps {
  start: DimensionPoint;
  end: DimensionPoint;
  scale?: number; // pixels per meter
  label?: string;
  color?: string;
  showInMetric?: boolean;
  lineWidth?: number;
  fontSize?: number;
}

export function formatDimension(meters: number): string {
  if (meters >= 1) {
    return `${meters.toFixed(2)} m`;
  } else if (meters >= 0.01) {
    return `${(meters * 100).toFixed(1)} cm`;
  } else {
    return `${(meters * 1000).toFixed(0)} mm`;
  }
}

export function calculateDistance(p1: DimensionPoint, p2: DimensionPoint): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculateAngle(p1: DimensionPoint, p2: DimensionPoint): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
}

export default function DimensionLine({
  start,
  end,
  scale = 50,
  label,
  color = '#f97316',
  showInMetric = true,
  lineWidth = 1.5,
  fontSize = 11,
}: DimensionLineProps) {
  const distancePx = useMemo(() => calculateDistance(start, end), [start, end]);
  const distanceM = useMemo(() => distancePx / scale, [distancePx, scale]);
  const angle = useMemo(() => calculateAngle(start, end), [start, end]);

  // Extension line offset (perpendicular)
  const extOffset = 15;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Perpendicular direction for dimension line offset
  const perpAngle = angle + 90;
  const perpRad = (perpAngle * Math.PI) / 180;
  const offsetX = extOffset * Math.cos(perpRad);
  const offsetY = extOffset * Math.sin(perpRad);

  // Dimension line endpoints (offset from actual points)
  const dimStart = { x: start.x + offsetX, y: start.y + offsetY };
  const dimEnd = { x: end.x + offsetX, y: end.y + offsetY };

  // Extension lines (from actual point to dimension line)
  const extLen = 8;
  const extRad = (perpAngle * Math.PI) / 180;

  const displayLabel = label || (showInMetric ? formatDimension(distanceM) : `${distancePx.toFixed(0)} px`);

  return (
    <g className="dimension-line-group">
      {/* Extension lines */}
      <line
        x1={start.x}
        y1={start.y}
        x2={start.x + offsetX + (extLen * Math.cos(extRad))}
        y2={start.y + offsetY + (extLen * Math.sin(extRad))}
        stroke={color}
        strokeWidth={0.75}
        strokeDasharray="2,2"
        opacity={0.5}
      />
      <line
        x1={end.x}
        y1={end.y}
        x2={end.x + offsetX + (extLen * Math.cos(extRad))}
        y2={end.y + offsetY + (extLen * Math.sin(extRad))}
        stroke={color}
        strokeWidth={0.75}
        strokeDasharray="2,2"
        opacity={0.5}
      />

      {/* Dimension line */}
      <line
        x1={dimStart.x}
        y1={dimStart.y}
        x2={dimEnd.x}
        y2={dimEnd.y}
        stroke={color}
        strokeWidth={lineWidth}
        markerStart="url(#dimArrowStart)"
        markerEnd="url(#dimArrowEnd)"
      />

      {/* Arrow markers definition */}
      <defs>
        <marker id="dimArrowStart" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M8,0 L0,3 L8,6 Z" fill={color} />
        </marker>
        <marker id="dimArrowEnd" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,3 L0,6 Z" fill={color} />
        </marker>
      </defs>

      {/* Dimension label background */}
      <rect
        x={midX + offsetX - (displayLabel.length * fontSize * 0.3) - 6}
        y={midY + offsetY - fontSize / 2 - 3}
        width={displayLabel.length * fontSize * 0.6 + 12}
        height={fontSize + 8}
        rx={4}
        fill="white"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.95}
      />

      {/* Dimension label text */}
      <text
        x={midX + offsetX}
        y={midY + offsetY + fontSize / 3}
        textAnchor="middle"
        fill={color}
        fontSize={fontSize}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {displayLabel}
      </text>
    </g>
  );
}

// Dimension toolbar button component
export function DimensionToolbarButton({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  return (
    <button
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
        isActive
          ? 'bg-orange-500 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      onClick={onClick}
      title="Líneas de dimensión"
    >
      <Ruler className="w-3.5 h-3.5" />
      Cotas
    </button>
  );
}
