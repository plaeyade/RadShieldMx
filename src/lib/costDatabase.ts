/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v31 — Regionalized Cost Database
 * ═══════════════════════════════════════════════════════════════════════════
 *  Material costs per m³ by region: Mexico, USA, Europe, Latin America
 *  Updated June 2026. Sources: local suppliers, NCRP 151 estimates.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface RegionalCost {
  region: string;
  currency: string;
  year: number;
  materials: Record<string, MaterialCost>;
  labor_hourly: number; // local currency
}

export interface MaterialCost {
  name: string;
  cost_per_m3: number; // local currency per cubic meter
  density_kg_m3: number;
  attenuation_quality: 'Excellent' | 'Good' | 'Fair' | 'Limited';
  typical_use: string;
  notes: string;
}

export const REGIONAL_COSTS: RegionalCost[] = [
  {
    region: 'Mexico',
    currency: 'MXN',
    year: 2026,
    labor_hourly: 450,
    materials: {
      'concreto_ordinario': {
        name: 'Concreto ordinario (f\'c = 200 kg/cm²)',
        cost_per_m3: 3800,
        density_kg_m3: 2350,
        attenuation_quality: 'Good',
        typical_use: 'Paredes primarias y secundarias (TVL ~ 370 mm @ 6 MV)',
        notes: 'Material estándar. C$200-250/m³ sin acarreo. Disponible en toda la República.',
      },
      'concreto_baritado': {
        name: 'Concreto baritado (ρ = 3.2 g/cm³, 60% BaSO₄)',
        cost_per_m3: 18500,
        density_kg_m3: 3200,
        attenuation_quality: 'Excellent',
        typical_use: 'Paredes primarias de alta energía (> 10 MV)',
        notes: 'Barita mineral de Sonora o Zacatecas. TVL 30% menor que concreto ordinario. Mezcla especial requiere vibrado cuidadoso.',
      },
      'plomo_laminado': {
        name: 'Plomo laminado (Pb 99.9%, 2-10 mm)',
        cost_per_m3: 285000,
        density_kg_m3: 11340,
        attenuation_quality: 'Excellent',
        typical_use: 'Puertas blindadas, revestimiento de paredes, láminas de protección',
        notes: '~$285/kg. Importado (México no produce plomo refinado). Precio varía con LME.',
      },
      'acero_estructural': {
        name: 'Acero estructural (refuerzo A-615)',
        cost_per_m3: 42000,
        density_kg_m3: 7850,
        attenuation_quality: 'Limited',
        typical_use: 'Refuerzo de concreto',
        notes: '~$42/kg. Altos Hornos de México (AHMSA) o importado.',
      },
      'tungsteno': {
        name: 'Tungsteno (W 95%, Ni/Fe 5%)',
        cost_per_m3: 1250000,
        density_kg_m3: 17500,
        attenuation_quality: 'Excellent',
        typical_use: 'Colimación primaria, mini-haces',
        notes: '~$1250/kg. Importado (China, Vietnam). Costo muy alto, solo para aplicaciones especializadas.',
      },
      'poly_borado': {
        name: 'Polietileno borado (5% B, ρ = 0.95 g/cm³)',
        cost_per_m3: 85000,
        density_kg_m3: 950,
        attenuation_quality: 'Fair',
        typical_use: 'Blindaje de neutrones en puertas de laberinto',
        notes: '~$85/kg. Importado (USA, Corea). Eficiente para neutrones térmicos pero requiere respaldo de Pb para fotones.',
      },
      'vidrio_plomo': {
        name: 'Vidrio de plomo (ZF-2, ρ = 3.5 g/cm³)',
        cost_per_m3: 450000,
        density_kg_m3: 3500,
        attenuation_quality: 'Good',
        typical_use: 'Ventanas de observación, paneles de control',
        notes: 'Importado (Alemania, China). Densidad intermedia entre concreto y Pb.',
      },
      'concreto_magnetita': {
        name: 'Concreto de magnetita (ρ = 3.5 g/cm³)',
        cost_per_m3: 15000,
        density_kg_m3: 3500,
        attenuation_quality: 'Good',
        typical_use: 'Alternativa al concreto baritado (mejor disponibilidad local)',
        notes: 'Magnetita (Fe₃O₄) disponible en Jalisco y Michoacán. Densidad intermedia.',
      },
      'concreto_hierro': {
        name: 'Concreto de hierro (ferrita, ρ = 4.5 g/cm³)',
        cost_per_m3: 22000,
        density_kg_m3: 4500,
        attenuation_quality: 'Excellent',
        typical_use: 'Paredes primarias de alta energía (alternativa al Pb)',
        notes: 'Ferrita de hierro (scrap). Densidad cercana al ladrillo de Pb pero 7x más barato.',
      },
    },
  },
  {
    region: 'United States',
    currency: 'USD',
    year: 2026,
    labor_hourly: 85,
    materials: {
      'concreto_ordinario': {
        name: 'Standard concrete (4,000 psi)',
        cost_per_m3: 180,
        density_kg_m3: 2350,
        attenuation_quality: 'Good',
        typical_use: 'Primary and secondary walls',
        notes: '~$138/yd³. Widely available.',
      },
      'concreto_baritado': {
        name: 'Barite concrete (ρ = 3.5 g/cm³)',
        cost_per_m3: 950,
        density_kg_m3: 3500,
        attenuation_quality: 'Excellent',
        typical_use: 'High-energy primary barriers',
        notes: '~$726/yd³. Barite from Nevada/Missouri.',
      },
      'plomo_laminado': {
        name: 'Lead sheet (Pb 99.9%)',
        cost_per_m3: 12500,
        density_kg_m3: 11340,
        attenuation_quality: 'Excellent',
        typical_use: 'Lead doors, wall sheeting',
        notes: '~$1.25/lb. LME price dependent. Recycled lead ~10% cheaper.',
      },
      'acero_estructural': {
        name: 'Steel (rebar, A615)',
        cost_per_m3: 2200,
        density_kg_m3: 7850,
        attenuation_quality: 'Limited',
        typical_use: 'Reinforcement',
        notes: '~$0.22/lb. Domestic production (Nucor, CMC).',
      },
      'tungsteno': {
        name: 'Tungsten alloy (W 95%)',
        cost_per_m3: 52000,
        density_kg_m3: 17500,
        attenuation_quality: 'Excellent',
        typical_use: 'Primary collimation, mini-beams',
        notes: '~$52/lb. Import from China.',
      },
      'poly_borado': {
        name: 'Borated polyethylene (5% B)',
        cost_per_m3: 3800,
        density_kg_m3: 950,
        attenuation_quality: 'Fair',
        typical_use: 'Neutron shielding in maze doors',
        notes: '~$3.80/lb. US manufacturers available.',
      },
      'vidrio_plomo': {
        name: 'Lead glass (x-ray shielding)',
        cost_per_m3: 18500,
        density_kg_m3: 3500,
        attenuation_quality: 'Good',
        typical_use: 'Viewing windows',
        notes: '~$18.50/lb. Schott, Corning sources.',
      },
    },
  },
  {
    region: 'Europe',
    currency: 'EUR',
    year: 2026,
    labor_hourly: 75,
    materials: {
      'concreto_ordinario': {
        name: 'Standard concrete (C25/30)',
        cost_per_m3: 150,
        density_kg_m3: 2350,
        attenuation_quality: 'Good',
        typical_use: 'Paredes primarias y secundarias',
        notes: '~115 €/m³. Pan-EU availability.',
      },
      'concreto_baritado': {
        name: 'Baryte concrete (ρ = 3.5 g/cm³)',
        cost_per_m3: 800,
        density_kg_m3: 3500,
        attenuation_quality: 'Excellent',
        typical_use: 'Barreras primarias alta energía',
        notes: '~615 €/m³. Barita de Alemania/España.',
      },
      'plomo_laminado': {
        name: 'Lead sheet (Pb)',
        cost_per_m3: 10500,
        density_kg_m3: 11340,
        attenuation_quality: 'Excellent',
        typical_use: 'Puertas blindadas',
        notes: '~1.05 €/kg. Reciclado disponible.',
      },
      'acero_estructural': {
        name: 'Structural steel',
        cost_per_m3: 1800,
        density_kg_m3: 7850,
        attenuation_quality: 'Limited',
        typical_use: 'Refuerzo',
        notes: '~0.18 €/kg. ArcelorMittal, ThyssenKrupp.',
      },
    },
  },
];

export function getRegionCosts(region: string): RegionalCost | undefined {
  return REGIONAL_COSTS.find(r => r.region.toLowerCase() === region.toLowerCase());
}

export function getMaterialCost(region: string, materialKey: string): MaterialCost | undefined {
  const regionData = getRegionCosts(region);
  return regionData?.materials[materialKey];
}

export function calculateBarrierCost(
  region: string,
  materialKey: string,
  area_m2: number,
  thickness_m: number
): { total_cost: number; cost_per_m2: number; currency: string } | null {
  const mat = getMaterialCost(region, materialKey);
  const reg = getRegionCosts(region);
  if (!mat || !reg) return null;
  const volume_m3 = area_m2 * thickness_m;
  const total_cost = mat.cost_per_m3 * volume_m3;
  return { total_cost, cost_per_m2: total_cost / area_m2, currency: reg.currency };
}

export const ALL_REGIONS = REGIONAL_COSTS.map(r => ({ name: r.region, currency: r.currency, labor: r.labor_hourly }));

export function formatCostMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatCostUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatCostEUR(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
