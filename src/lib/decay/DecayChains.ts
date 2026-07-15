/**
 * DecayChains — MC-13: Decaimiento en tiempo real con cadenas de decaimiento
 * Incluye: Mo-99/Tc-99m, Ge-68/Ga-68, Sr-82/Rb-82, W-188/Re-188
 * Referencia: Nucleonica Decay Engine++, ICRP 107
 */

export interface DecayChainNode {
  symbol: string; name: string; halfLife_h: number; branchingFraction: number;
  gamma_MeV: number; gammaIntensity: number; // for dose calculation
}

export interface DecayChain {
  name: string; nodes: DecayChainNode[];
  description: string; clinicalUse: string;
}

export const DECAY_CHAINS: DecayChain[] = [
  {
    name: 'Mo-99 → Tc-99m',
    description: 'Generator used in 80% of nuclear medicine procedures',
    clinicalUse: 'SPECT imaging: bone, cardiac, renal, thyroid scans',
    nodes: [
      { symbol: 'Mo-99', name: 'Molybdenum-99', halfLife_h: 65.94, branchingFraction: 1.0, gamma_MeV: 0.740, gammaIntensity: 0.122 },
      { symbol: 'Tc-99m', name: 'Technetium-99m', halfLife_h: 6.01, branchingFraction: 0.876, gamma_MeV: 0.140, gammaIntensity: 0.885 },
      { symbol: 'Tc-99', name: 'Technetium-99', halfLife_h: 211100, branchingFraction: 1.0, gamma_MeV: 0.0, gammaIntensity: 0.0 },
    ],
  },
  {
    name: 'Ge-68 → Ga-68',
    description: 'Generator for PET imaging with DOTATATE/DOTATOC',
    clinicalUse: 'PET neuroendocrine tumor imaging (Ga-68 DOTATATE)',
    nodes: [
      { symbol: 'Ge-68', name: 'Germanium-68', halfLife_h: 270.8, branchingFraction: 1.0, gamma_MeV: 0.511, gammaIntensity: 0.178 },
      { symbol: 'Ga-68', name: 'Gallium-68', halfLife_h: 1.13, branchingFraction: 0.999, gamma_MeV: 0.511, gammaIntensity: 1.78 },
      { symbol: 'Zn-68', name: 'Zinc-68', halfLife_h: Infinity, branchingFraction: 1.0, gamma_MeV: 0.0, gammaIntensity: 0.0 },
    ],
  },
  {
    name: 'Sr-82 → Rb-82',
    description: 'CardioGen generator for myocardial perfusion PET',
    clinicalUse: 'PET cardiac perfusion imaging (Rubidium-82)',
    nodes: [
      { symbol: 'Sr-82', name: 'Strontium-82', halfLife_h: 636, branchingFraction: 1.0, gamma_MeV: 0.511, gammaIntensity: 0.13 },
      { symbol: 'Rb-82', name: 'Rubidium-82', halfLife_h: 0.032, branchingFraction: 0.999, gamma_MeV: 0.511, gammaIntensity: 3.35 },
      { symbol: 'Kr-82', name: 'Krypton-82', halfLife_h: Infinity, branchingFraction: 1.0, gamma_MeV: 0.0, gammaIntensity: 0.0 },
    ],
  },
  {
    name: 'W-188 → Re-188',
    description: 'Generator for radionuclide therapy (liver, synovectomy)',
    clinicalUse: 'Hepatic radioembolization, radiosynovectomy',
    nodes: [
      { symbol: 'W-188', name: 'Tungsten-188', halfLife_h: 69.4, branchingFraction: 1.0, gamma_MeV: 0.064, gammaIntensity: 0.032 },
      { symbol: 'Re-188', name: 'Rhenium-188', halfLife_h: 17.0, branchingFraction: 0.999, gamma_MeV: 0.155, gammaIntensity: 0.15 },
      { symbol: 'Os-188', name: 'Osmium-188', halfLife_h: Infinity, branchingFraction: 1.0, gamma_MeV: 0.0, gammaIntensity: 0.0 },
    ],
  },
];

// Bateman equation for chain decay: A_n(t) = lambda_n * sum_{i=1..n} (N_i(0) * product_{j≠i} lambda_j / (lambda_j - lambda_i) * e^{-lambda_i * t})
export interface ChainActivityResult {
  time_h: number; activities: Record<string, number>; // MBq per initial parent MBq
  totalGamma_doseRate_uSvh: number; // at 1m from 1 MBq parent
}

export function calculateChainActivity(chain: DecayChain, timeHours: number[], initialActivity_MBq: number = 1): ChainActivityResult[] {
  const nodes = chain.nodes;
  const lambdas = nodes.map(n => Math.LN2 / n.halfLife_h);
  return timeHours.map(t => {
    const activities: Record<string, number> = {};
    let totalDoseRate = 0;
    for (let n = 0; n < nodes.length; n++) {
      let sum = 0;
      for (let i = 0; i <= n; i++) {
        let prod = initialActivity_MBq;
        for (let j = 0; j <= n; j++) {
          if (j !== i) prod *= lambdas[j] / (lambdas[j] - lambdas[i]);
        }
        sum += prod * Math.exp(-lambdas[i] * t);
      }
      const act = lambdas[n] * sum;
      activities[nodes[n].symbol] = Math.max(0, isNaN(act) ? 0 : act);
      // Dose rate contribution: 0.5 uSv/h per MBq at 1m for typical PET/SPECT nuclide
      const doseCoeff = nodes[n].gamma_MeV > 0.1 ? (nodes[n].symbol.includes('m') ? 0.0593 : 0.143) : 0.001;
      totalDoseRate += Math.max(0, act) * doseCoeff;
    }
    return { time_h: t, activities, totalGamma_doseRate_uSvh: totalDoseRate };
  });
}

// Elution efficiency for generators (typical values)
export const GENERATOR_EFFICIENCY: Record<string, number> = {
  'Mo-99 → Tc-99m': 0.85, // 85% elution efficiency
  'Ge-68 → Ga-68': 0.70,  // 70% for ITG generator
  'Sr-82 → Rb-82': 0.95,  // 95% automated infusion
  'W-188 → Re-188': 0.80, // 80% saline elution
};

// Practical: calculate eluate activity at time t since last elution
export function eluateActivity(chainName: string, parentActivity_MBq: number, hoursSinceElution: number): number {
  const chain = DECAY_CHAINS.find(c => c.name === chainName);
  if (!chain || chain.nodes.length < 2) return 0;
  const daughter = chain.nodes[1];
  const parent = chain.nodes[0];
  const lambdaP = Math.LN2 / parent.halfLife_h;
  const lambdaD = Math.LN2 / daughter.halfLife_h;
  const efficiency = GENERATOR_EFFICIENCY[chainName] || 0.8;
  // Activity of daughter at time t: A_D(t) = A_P(0) * lambda_D / (lambda_D - lambda_P) * (e^{-lambda_P*t} - e^{-lambda_D*t})
  const daughterActivity = parentActivity_MBq * lambdaD / (lambdaD - lambdaP) * (Math.exp(-lambdaP * hoursSinceElution) - Math.exp(-lambdaD * hoursSinceElution));
  return Math.max(0, daughterActivity * efficiency);
}

// Time to maximum daughter activity (for scheduling elutions)
export function timeToMaxDaughter(chainName: string): number {
  const chain = DECAY_CHAINS.find(c => c.name === chainName);
  if (!chain || chain.nodes.length < 2) return 0;
  const parent = chain.nodes[0];
  const daughter = chain.nodes[1];
  const lambdaP = Math.LN2 / parent.halfLife_h;
  const lambdaD = Math.LN2 / daughter.halfLife_h;
  return Math.log(lambdaD / lambdaP) / (lambdaD - lambdaP);
}
