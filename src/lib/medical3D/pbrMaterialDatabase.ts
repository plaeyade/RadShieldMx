export type PbrMaterialFamily = 'concrete' | 'lead' | 'steel' | 'glass' | 'polymer' | 'finish';

export interface PbrMaterialRecord {
  id: string;
  name: string;
  family: PbrMaterialFamily;
  color: string;
  roughness: number;
  metalness: number;
  density_kg_m3: number | null;
  shieldingUse: string;
  visualTexture: string;
  source: string;
  updatedAt: string;
}

export interface PbrMaterialDatabase {
  schema: 'radshield-mx.medical3d.pbr-material-db.f461-f463.v1';
  version: string;
  updatedAt: string;
  records: PbrMaterialRecord[];
}

const BASE_UPDATED_AT = '2026-08-01T00:00:00.000Z';

export const defaultPbrMaterialRecords: PbrMaterialRecord[] = [
  {
    id: 'hd-concrete',
    name: 'Concreto alta densidad',
    family: 'concrete',
    color: '#777268',
    roughness: 0.88,
    metalness: 0,
    density_kg_m3: 3200,
    shieldingUse: 'Muros, losas, bovedas y barreras primarias/secundarias.',
    visualTexture: 'procedural aggregate + rough cutaway',
    source: 'RadShield material toolbox + vendor/RAG evidence pending page binding',
    updatedAt: BASE_UPDATED_AT,
  },
  {
    id: 'lead-sheet',
    name: 'Plomo laminado',
    family: 'lead',
    color: '#3f424b',
    roughness: 0.46,
    metalness: 0.42,
    density_kg_m3: 11340,
    shieldingUse: 'Puertas, vidrio plomado, laminados y detalles locales.',
    visualTexture: 'brushed dark metal',
    source: 'RadShield material toolbox + NCRP/IAEA citation binding',
    updatedAt: BASE_UPDATED_AT,
  },
  {
    id: 'structural-steel',
    name: 'Acero estructural',
    family: 'steel',
    color: '#8b949e',
    roughness: 0.36,
    metalness: 0.62,
    density_kg_m3: 7850,
    shieldingUse: 'Marcos, placas, refuerzos y soporte de cargas.',
    visualTexture: 'brushed steel',
    source: 'Structural overlay + BIM coordination',
    updatedAt: BASE_UPDATED_AT,
  },
  {
    id: 'lead-glass',
    name: 'Vidrio plomado',
    family: 'glass',
    color: '#8db8b4',
    roughness: 0.16,
    metalness: 0.02,
    density_kg_m3: 5200,
    shieldingUse: 'Ventanas de control y observacion.',
    visualTexture: 'transparent green-blue glass',
    source: 'Vendor/spec library pending page binding',
    updatedAt: BASE_UPDATED_AT,
  },
  {
    id: 'borated-poly',
    name: 'Polietileno borado',
    family: 'polymer',
    color: '#eee8cf',
    roughness: 0.64,
    metalness: 0,
    density_kg_m3: 960,
    shieldingUse: 'Neutrones, ciclotron, LINAC >10 MV y laberintos especificos.',
    visualTexture: 'matte polymer',
    source: 'Neutron shielding toolbox + RAG evidence pending page binding',
    updatedAt: BASE_UPDATED_AT,
  },
];

export function buildDefaultPbrMaterialDatabase(now = new Date().toISOString()): PbrMaterialDatabase {
  return {
    schema: 'radshield-mx.medical3d.pbr-material-db.f461-f463.v1',
    version: 'f461-f463.1',
    updatedAt: now,
    records: defaultPbrMaterialRecords.map((record) => ({ ...record })),
  };
}

export function mergePbrMaterialDatabase(
  current: PbrMaterialDatabase | null | undefined,
  incoming: PbrMaterialRecord[],
  now = new Date().toISOString(),
): PbrMaterialDatabase {
  const base = current?.records?.length ? current.records : defaultPbrMaterialRecords;
  const byId = new Map(base.map((record) => [record.id, { ...record }]));
  for (const record of incoming) byId.set(record.id, { ...record, updatedAt: now });
  return {
    schema: 'radshield-mx.medical3d.pbr-material-db.f461-f463.v1',
    version: `f461-f463.${byId.size}`,
    updatedAt: now,
    records: Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function buildPbrMaterialDbUpdate(db: PbrMaterialDatabase, now = new Date().toISOString()): PbrMaterialDatabase {
  return mergePbrMaterialDatabase(db, [
    {
      id: 'tm-nipoll-hd-block',
      name: 'TM/NIPOLL bloque HD',
      family: 'concrete',
      color: '#6f6a5f',
      roughness: 0.9,
      metalness: 0,
      density_kg_m3: 3600,
      shieldingUse: 'Alternativa constructiva para muros de alta densidad, costo/tiempo/estructura y TVL versionado.',
      visualTexture: 'dense block aggregate',
      source: 'Materiales TM/NIPOLL indexados; pendiente pagina/hash firmable si cambia OCR/RAG.',
      updatedAt: now,
    },
  ], now);
}
