// CT Isodosis Types and Parser for RadShield-MX
// NCRP 147 Section 5.6 - CT Shielding using DLP and manufacturer isodosis curves

export interface CTIsodosisPoint {
  angle_deg: number;      // angle from gantry axis (0 = cranial, 90 = lateral, 180 = caudal)
  distance_cm: number;    // distance from isocenter
  relativeKerma: number;  // relative air kerma (normalized to 1.0 at isocenter)
}

export interface CTIsodosisProfile {
  id: string;
  name: string;           // e.g. "Siemens SOMATOM Force - Body 120kV"
  manufacturer: string;   // "Siemens", "GE", "Philips", "Canon", "Hitachi"
  model: string;          // scanner model
  kVp: number;
  filter: string;         // e.g. "Body", "Head", "Cardiac"
  points: CTIsodosisPoint[];
  // Fitted parameters: K(θ,d) = a(θ) × d^(-b(θ))
  fittedParams?: {
    angle_deg: number;
    a: number;  // coefficient
    b: number;  // power (typically ~1.5-2.5)
    r2: number; // fit quality
  }[];
}

// NCRP 147 CT-DLP Method:
// K(θ, d) = DLP × f(θ) × (1m / d)^1.5  for primary scatter
// where f(θ) comes from isodosis curve (ratio at angle θ vs 90°)
// For barriers not at 90°, f(θ) < 1 typically
export interface CTDLPConfig {
  isodosisProfileId: string | null;
  dlp_mGy_cm: number;        // Dose Length Product per scan
  scansPerPatient: number;   // number of scan series per patient
  useIsodosis: boolean;        // if false, use conservative f(θ)=0.3
}

// Parse manufacturer isodosis files
// Formats supported:
// 1. Siemens: angle(deg) distance(cm) kerma_rel
// 2. GE/Philips: CSV with columns Angle, Distance, RelativeDose
export function parseIsodosisFile(content: string, filename: string): CTIsodosisProfile | null {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 3) return null;

  // Try to detect format
  const points: CTIsodosisPoint[] = [];
  let manufacturer = 'Unknown';
  const model = 'Unknown';
  let kVp = 120;
  let filter = 'Body';

  // Detect manufacturer from filename or content
  const lowerName = filename.toLowerCase();
  if (lowerName.includes('siemens')) manufacturer = 'Siemens';
  else if (lowerName.includes('ge') || lowerName.includes('ge_healthcare')) manufacturer = 'GE';
  else if (lowerName.includes('philips')) manufacturer = 'Philips';
  else if (lowerName.includes('canon') || lowerName.includes('toshiba')) manufacturer = 'Canon';
  else if (lowerName.includes('hitachi')) manufacturer = 'Hitachi';

  // Detect kVp from filename
  const kVpMatch = filename.match(/(\d{2,3})\s*k[vV]p?/);
  if (kVpMatch) kVp = parseInt(kVpMatch[1]);

  // Detect filter from filename
  if (lowerName.includes('head')) filter = 'Head';
  else if (lowerName.includes('body')) filter = 'Body';
  else if (lowerName.includes('cardiac')) filter = 'Cardiac';

  // Parse data lines
  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // Try tab, comma, or space separated
    const parts = trimmed.split(/[\t,;\s]+/).filter(p => p.length > 0);
    if (parts.length >= 3) {
      const angle = parseFloat(parts[0]);
      const distance = parseFloat(parts[1]);
      const kerma = parseFloat(parts[2]);
      if (!isNaN(angle) && !isNaN(distance) && !isNaN(kerma) && distance > 0) {
        points.push({ angle_deg: angle, distance_cm: distance, relativeKerma: kerma });
      }
    }
  }

  if (points.length < 6) return null;

  // Fit power law K(θ,d) = a × d^(-b) for each angle
  const angleGroups = new Map<number, CTIsodosisPoint[]>();
  for (const p of points) {
    const roundedAngle = Math.round(p.angle_deg);
    if (!angleGroups.has(roundedAngle)) angleGroups.set(roundedAngle, []);
    angleGroups.get(roundedAngle)!.push(p);
  }

  const fittedParams: CTIsodosisProfile['fittedParams'] = [];
  for (const [angle, pts] of angleGroups) {
    if (pts.length < 2) continue;
    // Linear regression on log-log: ln(K) = ln(a) - b × ln(d)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    let n = 0;
    for (const p of pts) {
      if (p.distance_cm <= 0 || p.relativeKerma <= 0) continue;
      const x = Math.log(p.distance_cm);
      const y = Math.log(p.relativeKerma);
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
      n++;
    }
    if (n < 2) continue;
    const b = -(n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const lnA = (sumY + b * sumX) / n;
    const a = Math.exp(lnA);
    // R² calculation
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (const p of pts) {
      if (p.distance_cm <= 0 || p.relativeKerma <= 0) continue;
      const yPred = lnA - b * Math.log(p.distance_cm);
      const yActual = Math.log(p.relativeKerma);
      ssTot += (yActual - yMean) ** 2;
      ssRes += (yActual - yPred) ** 2;
    }
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    fittedParams.push({ angle_deg: angle, a, b, r2 });
  }

  return {
    id: `isodosis-${Date.now()}`,
    name: `${manufacturer} ${model} ${filter} ${kVp}kV`,
    manufacturer,
    model,
    kVp,
    filter,
    points,
    fittedParams
  };
}

// Get f(θ) factor from isodosis profile
// f(θ) = K(θ, 1m) / K(90°, 1m) — relative to lateral direction
export function getCTIsodosisFactor(profile: CTIsodosisProfile, angle_deg: number): number {
  if (!profile.fittedParams || profile.fittedParams.length === 0) {
    // Conservative fallback: NCRP 147 Table 5.1
    const absAngle = Math.abs(angle_deg) % 360;
    if (absAngle <= 30 || absAngle >= 330) return 0.1;  // cranial/caudal
    if (absAngle <= 60 || absAngle >= 300) return 0.15;
    if (absAngle <= 120 || absAngle >= 240) return 0.3;  // lateral-ish
    return 0.2;
  }

  // Interpolate between fitted angles
  const normalizedAngle = ((angle_deg % 360) + 360) % 360;
  const fp = profile.fittedParams;
  fp.sort((a, b) => a.angle_deg - b.angle_deg);

  // Find surrounding angles
  let lower = fp[fp.length - 1];
  let upper = fp[0];
  for (let i = 0; i < fp.length - 1; i++) {
    if (normalizedAngle >= fp[i].angle_deg && normalizedAngle <= fp[i + 1].angle_deg) {
      lower = fp[i];
      upper = fp[i + 1];
      break;
    }
  }

  const t = (normalizedAngle - lower.angle_deg) / (upper.angle_deg - lower.angle_deg);
  const a = lower.a * (1 - t) + upper.a * t;
  const b = lower.b * (1 - t) + upper.b * t;

  // Calculate at 100 cm (1m)
  const kAt1m = a * Math.pow(100, -b);

  // Reference: 90° (lateral)
  const refAngle = 90;
  const refParams = profile.fittedParams.find(p => Math.abs(p.angle_deg - refAngle) < 5)
    || profile.fittedParams.reduce((closest, p) =>
      Math.abs(p.angle_deg - refAngle) < Math.abs(closest.angle_deg - refAngle) ? p : closest);
  const refK = refParams.a * Math.pow(100, -refParams.b);

  return refK > 0 ? kAt1m / refK : 0.3;
}

// Default/placeholder isodosis profiles (NCRP 147 conservative values)
export const DEFAULT_CT_ISODOSIS: CTIsodosisProfile = {
  id: 'default-conservative',
  name: 'NCRP 147 Conservative (no isodosis data)',
  manufacturer: 'NCRP',
  model: 'Generic',
  kVp: 120,
  filter: 'Body',
  points: [
    { angle_deg: 0, distance_cm: 100, relativeKerma: 0.1 },
    { angle_deg: 90, distance_cm: 100, relativeKerma: 1.0 },
    { angle_deg: 180, distance_cm: 100, relativeKerma: 0.1 },
    { angle_deg: 270, distance_cm: 100, relativeKerma: 1.0 },
  ],
  fittedParams: [
    { angle_deg: 0, a: 1000, b: 2.0, r2: 0.95 },
    { angle_deg: 90, a: 10000, b: 2.0, r2: 0.95 },
  ]
};
