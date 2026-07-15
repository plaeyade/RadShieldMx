// Batch 4: Seasonal workload variation (monthly factors)
export interface SeasonalProfile {
  name: string;
  months: Record<string, number>; // month (1-12) -> workload multiplier
}

export const SEASONAL_PRESETS: SeasonalProfile[] = [
  {
    name: 'Public hospital (Mexico)',
    months: { '1': 0.9, '2': 0.85, '3': 0.95, '4': 1.0, '5': 1.05, '6': 1.0, '7': 0.9, '8': 0.95, '9': 1.1, '10': 1.15, '11': 1.0, '12': 0.6 },
  },
  {
    name: 'Private oncology center',
    months: { '1': 1.0, '2': 1.0, '3': 1.0, '4': 1.0, '5': 1.0, '6': 1.0, '7': 1.0, '8': 1.0, '9': 1.0, '10': 1.0, '11': 1.0, '12': 0.8 },
  },
  {
    name: 'Academic center (semester-based)',
    months: { '1': 0.5, '2': 1.3, '3': 1.4, '4': 1.3, '5': 1.2, '6': 0.6, '7': 0.3, '8': 0.4, '9': 1.3, '10': 1.4, '11': 1.3, '12': 0.5 },
  },
];

export function applySeasonalFactor(baseWorkload: number, month: number, profile: SeasonalProfile): number {
  const factor = profile.months[String(month)] || 1.0;
  return baseWorkload * factor;
}
