export type F127CypeStatus = 'implemented' | 'partial' | 'external-required' | 'deferred';
export type F127DbOptionStatus = 'recommended' | 'viable' | 'fallback' | 'not-for-release';

export interface F127CypeGap {
  area: string;
  cypePattern: string;
  currentRadShieldState: string;
  status: F127CypeStatus;
  nextAction: string;
}

export interface F127DbAlternative {
  id: string;
  label: string;
  status: F127DbOptionStatus;
  setup: string;
  strengths: string[];
  risks: string[];
  bestUse: string;
}

export const F127_CYPE_GAPS: F127CypeGap[] = [
  {
    area: 'Datos generales de obra',
    cypePattern: 'Normativa, materiales, acciones, combinaciones y parametros de calculo se definen antes del modelo.',
    currentRadShieldState:
      'Parcialmente cubierto por perfiles DX/TX/NM/CY, objetivos NCRP/IAEA/UAQ, Material Library y matriz F121-F124.',
    status: 'partial',
    nextAction:
      'Crear un Project Setup unico que congele modalidad, norma, materiales autorizados, altura de muro, criterios de ocupacion y version documental.',
  },
  {
    area: 'Modelo por plantas y grupos',
    cypePattern: 'La estructura se organiza por plantas, pilares, muros, losas, cimentacion y elementos especiales.',
    currentRadShieldState:
      'El floorplan 2D y Medical 3D existen, pero el modelo no tiene aun niveles estructurales formales ni losas/cimentacion parametrizadas.',
    status: 'partial',
    nextAction:
      'Agregar niveles/planta, losa base, tipo de estructura existente y zonas de carga para evaluar impacto de blindajes pesados.',
  },
  {
    area: 'Cargas estructurales por blindaje',
    cypePattern: 'El software estructural calcula elementos y revisa esfuerzos/desplazamientos segun cargas e hipotesis.',
    currentRadShieldState:
      'F121-F123 estiman kg/m2, kg/ml, masa, costo, rapidez y riesgo, pero no sustituyen calculo estructural formal.',
    status: 'implemented',
    nextAction:
      'Mantenerlo como prediagnostico: bandera de revision estructural, ficha tecnica y export para ingeniero estructural.',
  },
  {
    area: 'Resultados e isovalores',
    cypePattern: 'Resultados consultables por elemento, mapas/isovalores, deformada y comprobaciones.',
    currentRadShieldState:
      'Hay heatmap/isodosis radiologica y overlay estructural, pero falta una vista de isovalores estructurales de carga/masa por barrera.',
    status: 'partial',
    nextAction:
      'Agregar capa visual de kg/m2 por barrera junto a isodosis, con leyenda, umbrales y export visual para memoria/evidencia.',
  },
  {
    area: 'Mediciones y presupuesto',
    cypePattern: 'Exporta mediciones, presupuesto y formatos interoperables para costos de obra.',
    currentRadShieldState:
      'MaterialComparison, CostEstimator y CostOptimizer existen; falta export tipo presupuesto por partida y proveedor.',
    status: 'partial',
    nextAction:
      'Crear BOQ/mediciones: m2, m3, kg, piezas, juntas, anclajes, acabado, costo relativo y tiempo estimado por barrera.',
  },
  {
    area: 'DWG/DXF/IFC/BIM',
    cypePattern: 'Genera geometria desde DXF/DWG/IFC y comparte informacion calculada en IFC/BIM.',
    currentRadShieldState:
      'DXF/SVG/IFC y Revit estan contemplados; DWG sigue correctamente como conversion externa, no parser nativo falso.',
    status: 'external-required',
    nextAction:
      'Conservar DWG mediante servicio externo/ODA/AutoCAD/Revit export a DXF/IFC; no prometer DWG nativo en navegador.',
  },
  {
    area: 'Listados de comprobacion',
    cypePattern: 'Genera documentos con comprobaciones por norma y elemento.',
    currentRadShieldState:
      'F125-F126 exigen formula, norma, inputs, outputs, cita y evidencia por resultado radiologico.',
    status: 'implemented',
    nextAction:
      'Ampliar el Evidence Pack para incluir comprobacion estructural pendiente/aprobada y ficha de material por barrera.',
  },
];

export const F127_DB_ALTERNATIVES: F127DbAlternative[] = [
  {
    id: 'mysql-windows-service',
    label: 'MySQL 8 directo en Windows',
    status: 'recommended',
    setup: 'Instalar MySQL Community Server 8.x con MSI, crear base radshield_mx, usuario radshield y configurar DATABASE_URL local.',
    strengths: ['Compatible con Drizzle/MySQL actual', 'No depende de Docker', 'Apto para pruebas full-stack reales'],
    risks: ['Requiere administrar servicio Windows, puerto 3306 y credenciales', 'Conviene respaldar dumps antes de cambios grandes'],
    bestUse: 'Opcion preferida si quieres continuar con la arquitectura MySQL existente sin Docker.',
  },
  {
    id: 'mariadb-windows-service',
    label: 'MariaDB directo en Windows',
    status: 'viable',
    setup: 'Instalar MariaDB 10/11 local y probar compatibilidad de migraciones Drizzle antes de seed definitivo.',
    strengths: ['Instalador sencillo', 'Muy parecido a MySQL', 'Buen rendimiento local'],
    risks: ['Puede haber diferencias SQL/JSON/índices frente a MySQL 8', 'Requiere smoke de migraciones y seed'],
    bestUse: 'Alternativa local si MySQL MSI falla, siempre con prueba de compatibilidad.',
  },
  {
    id: 'hosted-mysql',
    label: 'MySQL administrado externo',
    status: 'viable',
    setup: 'Usar PlanetScale, Aiven, Railway, Render, Azure Database for MySQL u otro MySQL 8 administrado y cargar DATABASE_URL.',
    strengths: ['Evita instalacion local', 'Facil de compartir entre equipos', 'Backups y monitoreo externos'],
    risks: ['Depende de internet, costo y politicas de datos', 'Cuidar privacidad de memorias/documentos clinicos'],
    bestUse: 'Validacion colaborativa o demo multiusuario sin depender de Docker Desktop.',
  },
  {
    id: 'sqlite-offline',
    label: 'SQLite offline para demo',
    status: 'fallback',
    setup: 'Agregar adaptador SQLite/Drizzle separado para proyectos locales y evidencia offline.',
    strengths: ['Cero servidor', 'Portable', 'Ideal para paquete offline'],
    risks: ['Requiere adaptar schema/queries', 'No prueba exactamente el backend MySQL final'],
    bestUse: 'Release offline o demo portable, no reemplazo definitivo del modo multiusuario.',
  },
  {
    id: 'postgres-local',
    label: 'PostgreSQL local',
    status: 'not-for-release',
    setup: 'Instalar PostgreSQL y migrar schema/adaptador si se decide cambio de motor.',
    strengths: ['Robusto para RAG/metadatos y JSON', 'Buen ecosistema'],
    risks: ['Cambio de arquitectura', 'Mayor costo de migracion que MySQL directo'],
    bestUse: 'Solo si se decide rediseñar persistencia despues del release candidate.',
  },
];

export function buildF127CypeDbAlternatives() {
  const implemented = F127_CYPE_GAPS.filter((gap) => gap.status === 'implemented').length;
  const partial = F127_CYPE_GAPS.filter((gap) => gap.status === 'partial').length;
  const externalRequired = F127_CYPE_GAPS.filter((gap) => gap.status === 'external-required').length;
  const recommendedDb = F127_DB_ALTERNATIVES.find((option) => option.status === 'recommended') ?? F127_DB_ALTERNATIVES[0];

  return {
    phase: 'F127',
    status: 'implemented-gap-review',
    sourceBasis: 'CYPECAD public feature map: BIM structural model, general data, floors, beams/walls/slabs, results/isovalues, reports, DWG/DXF/PDF/IFC and quantity/cost export.',
    cypeGaps: F127_CYPE_GAPS,
    dbAlternatives: F127_DB_ALTERNATIVES,
    counts: {
      cypeGapCount: F127_CYPE_GAPS.length,
      implemented,
      partial,
      externalRequired,
      dbAlternativeCount: F127_DB_ALTERNATIVES.length,
    },
    decision:
      'RadShield-MX should keep CYPECAD-inspired structural impact as a prediagnostic shield-design layer, not as a formal structural solver. For DB without Docker, install MySQL 8 directly on Windows first.',
    recommendedNextPhase:
      'F128 should either validate MySQL Windows Service with migrations/seed or continue offline with SQLite adapter planning if local MySQL is not acceptable.',
    recommendedDb,
  };
}
