import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, ImageRun } from 'docx';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import { buildAnalyticMemoryEvidenceSection } from '@/lib/analyticMemoryEvidence';
import type { FloorPlan } from '@/types/radshield';
import { MATERIALS } from '@/types/radshield';
import { extractControlledZoneReportContext } from '@/lib/controlledZoneReportAdapter';
import { seccionEvidenciaMemoria, verificarPaqueteGamma, type PaqueteVerificado } from '@/lib/gammaCliente';
import paqueteEvidenciaMemoria from '@/data/gamma-evidencia-memoria.json';

export interface CNSNSReportData {
  floorPlan: FloorPlan;
  projectName: string;
  date: string;
  preparerName: string;
  reviewerName: string;
  institution: string;
  licenseNumber: string;
  canvasImageDataUrl?: string; // base64 PNG of canvas
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
  /** Evidencia de GAMMA ya verificada; si falta, se usa el paquete versionado del repo. */
  evidenciaGamma?: PaqueteVerificado;
}

function textBlockToParagraphs(text: string): Paragraph[] {
  if (!text.trim()) return [];
  return text.trim().split('\n').map(line => new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({
      text: line || ' ',
      size: line.trim().match(/^\d+\./) ? 22 : 18,
      bold: /^\d+\./.test(line.trim()),
      color: /^\d+\./.test(line.trim()) ? '1B3A5F' : '2D3748',
    })],
  }));
}

function getMaterialName(code: string): string {
  const mat = MATERIALS.find(m => m.code === code);
  return mat?.name || code;
}

export async function generateCNSNSReport(data: CNSNSReportData): Promise<Blob> {
  const { floorPlan, projectName, date, preparerName, reviewerName, institution, licenseNumber } = data;
  const analyticEvidenceSection = buildAnalyticMemoryEvidenceSection(
    floorPlan,
    data.barrierResults ?? [],
    data.sampleLines ?? [],
  );

  // Sort barriers by max kerma (descending)
  const sortedBarriers = [...floorPlan.barriers]
    .filter(b => b.requiredThickness_mm)
    .sort((a, b) => (b.maxKerma || 0) - (a.maxKerma || 0));

  // Collect sources info
  const sourceSummary = floorPlan.sources.map(s => ({
    name: s.name,
    modality: s.modality.name,
    category: s.modality.category,
    workload: s.workloadValue,
    unit: s.workloadUnit,
    energy: s.modality.energyLabel
  }));

  // Find top 3 materials per barrier
  const barrierTables = sortedBarriers.map(b => {
    const entries = Object.entries(b.requiredThickness_mm || {})
      .map(([code, t]) => ({ code, thickness: t, rounded: Math.ceil(t / 5) * 5, name: getMaterialName(code) }))
      .filter(e => e.thickness > 0)
      .sort((a, b) => a.thickness - b.thickness)
      .slice(0, 3);
    return { barrier: b, topMaterials: entries };
  });

  // --- Document sections ---

  // 1. Cover page
  const coverParagraphs = [
    new Paragraph({
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'COMISION NACIONAL DE SEGURIDAD NUCLEAR Y SALVAGUARDIAS', bold: true, size: 28, color: '1B3A5F' })
      ]
    }),
    new Paragraph({
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'DIRECCION GENERAL DE LICENCIAS Y PERMISOS', bold: true, size: 24, color: '2E5C8A' })
      ]
    }),
    new Paragraph({
      spacing: { before: 600, after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'MEMORIA ANALITICA DE BLINDAJES RADIOLOGICOS', bold: true, size: 32, color: '1B3A5F' })
      ]
    }),
    new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: projectName, bold: true, size: 28, color: 'C53030' })
      ]
    }),
    new Paragraph({
      spacing: { before: 400, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Institucion: ${institution || '[Institucion]' }`, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Licencia CNSNS: ${licenseNumber || '[Numero de licencia]' }`, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { before: 600, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Fecha: ${date}`, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Elaboro: ${preparerName || '[Nombre del Fisico Medico]' }`, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Reviso: ${reviewerName || '[Nombre del Supervisor]' }`, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { before: 800 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'RADSHIELD-MX v1.1 — Sistema Integral de Blindajes Radiologicos', size: 18, italics: true, color: '718096' })
      ]
    })
  ];

  // 2. Summary
  const summaryParagraphs = [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: '1. RESUMEN EJECUTIVO', bold: true, size: 28, color: '1B3A5F' })]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `La presente memoria analitica documenta el diseno de blindajes radiologicos para la instalacion "${projectName}". El calculo se realizo con el modulo web RadShield-MX v1.1, que implementa los estandares NCRP Report 147 (blindaje para instalaciones de rayos X de diagnostico), NCRP Report 151 (blindaje para instalaciones de radioterapia con megavoltaje), AAPM TG 108 (blindaje para medicina nuclear y PET), e IAEA SRS 47 (blindaje para ciclotrones de produccion de radionuclidos).`, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `Se consideraron ${floorPlan.sources.length} fuente(s) de radiacion y ${floorPlan.barriers.length} barrera(s) de blindaje. La escala del plano es ${floorPlan.scale_m_per_pixel.toFixed(4)} m/pixel. El muestreo se realizo a 0.3 m de cada barrera con puntos espaciados cada 0.2 m, conforme a la metodologia del NCRP 147.`, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `La kerma maxima no atenuada detectada fue ${Math.max(...sortedBarriers.map(b => b.maxKerma || 0), 0).toFixed(3)} mSv/semana. Los espesores de blindaje se calcularon para 16 materiales diferentes, incluyendo concretos convencionales, concretos de alta densidad (barita, hierro), materiales comerciales (NELCO, VERITAS) y materiales certificados mexicanos (TM-NIPOL TD-350/400/500 con certificacion IMCYC EMA C-053-039/11).`, size: 22 })
      ]
    })
  ];

  // 3. Equipment table
  const equipmentRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Equipo', bold: true, size: 20 })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Modalidad', bold: true, size: 20, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Energia', bold: true, size: 20, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Carga semanal', bold: true, size: 20, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Unidad', bold: true, size: 20, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } })
      ]
    }),
    ...sourceSummary.map(s => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.name, size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.modality, size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.energy, size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(s.workload), size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.unit, size: 20 })] })] })
      ]
    }))
  ];

  const equipmentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: equipmentRows
  });

  const equipmentParagraphs = [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: '2. EQUIPOS CONSIDERADOS', bold: true, size: 28, color: '1B3A5F' })]
    }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'La siguiente tabla resume los equipos de radiodiagnostico, radioterapia, medicina nuclear y ciclotron considerados en el calculo de blindaje:', size: 22 })] }),
    new Paragraph({ children: [equipmentTable] }),
    new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'Nota: Para equipos de CT, el DLP (Dose Length Product) y los escaneos por paciente se configuran por fuente. Para equipos de medicina nuclear, la actividad se introduce en GBq. Para radioterapia, se usa fracciones/semana.', size: 18, italics: true, color: '718096' })] })
  ];

  // 4. Results table
  const resultHeaderRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Barrera', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '1B3A5F' } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tipo', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '1B3A5F' } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Long. (m)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '1B3A5F' } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Kerma max (mSv/sem)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '1B3A5F' } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Material recomendado', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '1B3A5F' } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Espesor (mm)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '1B3A5F' } })
    ]
  });

  const resultDataRows = barrierTables.map(({ barrier, topMaterials }) => {
    const length_m = Math.sqrt((barrier.x2 - barrier.x1) ** 2 + (barrier.y2 - barrier.y1) ** 2) * floorPlan.scale_m_per_pixel;
    const top = topMaterials[0];
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: barrier.name, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: barrier.barrierType.toUpperCase(), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: length_m.toFixed(2), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (barrier.maxKerma || 0).toFixed(3), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: top?.name || 'N/A', size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(top ? Math.ceil(top.thickness / 5) * 5 : 0), size: 18, bold: true })] })] })
      ]
    });
  });

  const resultsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [resultHeaderRow, ...resultDataRows]
  });

  const resultsParagraphs = [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: '3. RESULTADOS DE BLINDAJE', bold: true, size: 28, color: '1B3A5F' })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: 'La siguiente tabla presenta los espesores de blindaje calculados para cada barrera, ordenadas por kerma maxima no atenuada (de mayor a menor). El espesor mostrado corresponde al material mas eficiente (menor espesor requerido) redondeado al incremento practico del material:', size: 22 })]
    }),
    new Paragraph({ children: [resultsTable] }),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [new TextRun({ text: 'Notas: (1) Espesores redondeados a 5 mm para concreto/NIPOL/NELCO/VERITAS, 0.79 mm (1/32") para plomo. (2) El factor de uso U aplica solo a barreras primarias de radioterapia. (3) El factor de ocupacion T se aplica conforme NCRP 147 Tabla 4.5.', size: 18, italics: true, color: '718096' })]
    })
  ];

  const controlledZoneContext = extractControlledZoneReportContext(floorPlan);
  const controlledZoneRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Elemento', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tipo estructural', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Long. ref. (m)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Material', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Espesor (mm)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
      ],
    }),
    ...controlledZoneContext.barriers.map((barrier) => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: barrier.name, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: barrier.structuralElement.toUpperCase(), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: barrier.length_m.toFixed(2), size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: barrier.materialCode, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(Math.ceil(barrier.thickness_mm / 5) * 5), size: 18, bold: true })] })] }),
      ],
    })),
  ];
  const controlledZoneTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: controlledZoneRows,
  });
  const controlledZoneParagraphs = controlledZoneContext.hasGeneratedControlledZone ? [
    new Paragraph({
      spacing: { before: 300, after: 160 },
      children: [new TextRun({ text: '3.1 ZONA CONTROLADA GENERADA DESDE FACTIBILIDAD', bold: true, size: 24, color: '2E5C8A' })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `El plano contiene ${controlledZoneContext.barriers.length} barrera(s) generadas desde el flujo de factibilidad y calculo preliminar de zona controlada. Se identificaron ${controlledZoneContext.wallCount} muro(s), ${controlledZoneContext.ceilingCount} techo/losa(s) y ${controlledZoneContext.floorCount} piso/suelo(s).`,
          size: 22,
        }),
      ],
    }),
    new Paragraph({ children: [controlledZoneTable] }),
    ...controlledZoneContext.warnings.map((warning) => new Paragraph({
      spacing: { before: 80 },
      children: [new TextRun({ text: `Nota: ${warning}`, size: 18, italics: true, color: '718096' })],
    })),
  ] : [];

  // 5. Material comparison table
  const matCompRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Material', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Densidad (g/cm³)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Espesor total (mm)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Costo est. (USD)', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Certificacion', bold: true, size: 18, color: 'FFFFFF' })] })], shading: { fill: '2E5C8A' } })
      ]
    }),
    ...MATERIALS.map(mat => {
      let totalThickness = 0;
      let totalCost = 0;
      floorPlan.barriers.forEach(b => {
        if (!b.requiredThickness_mm) return;
        const t = b.requiredThickness_mm[mat.code] || 0;
        const rounded = Math.ceil(t / 5) * 5;
        const length_m = Math.sqrt((b.x2 - b.x1) ** 2 + (b.y2 - b.y1) ** 2) * floorPlan.scale_m_per_pixel;
        totalThickness += rounded;
        totalCost += (rounded / 1000) * mat.cost_per_m3 * length_m;
      });
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mat.name, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mat.density.toFixed(2), size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: totalThickness.toFixed(1), size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${totalCost.toFixed(2)}`, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mat.certifiedLab || mat.manufacturer || '—', size: 18 })] })] })
        ]
      });
    })
  ];

  const matCompTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: matCompRows
  });

  const matCompParagraphs = [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: '4. COMPARATIVA DE MATERIALES', bold: true, size: 28, color: '1B3A5F' })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: 'La siguiente tabla compara todos los materiales disponibles en el sistema, mostrando el espesor total acumulado si se usara el mismo material para todas las barreras, y su costo estimado:', size: 22 })]
    }),
    new Paragraph({ children: [matCompTable] })
  ];

  // 6. Methodology
  const methodologyParagraphs = [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: '5. METODOLOGIA DE CALCULO', bold: true, size: 28, color: '1B3A5F' })]
    }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '5.1 NCRP Report 147 — Diagnostico (Rayos X, CT, PET)', bold: true, size: 24, color: '2E5C8A' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Para radiologia diagnostica, se utiliza la ecuacion de Archer para la transmision a traves del blindaje: B(x) = [(1 + beta/alpha) * exp(alpha*gamma*x/cos(theta)) - beta/alpha]^(-1/gamma). El espesor requerido se determina por el metodo de biseccion iterativa (~50 iteraciones) hasta que la kerma transmitida sea menor o igual al objetivo de diseno (P/T).', size: 22 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Para CT, se utiliza el metodo DLP (NCRP 147 Seccion 5.6): K(theta,d) = DLP * f(theta) * (100cm/d)^1.5, donde f(theta) se obtiene de la curva isodosis del fabricante o valores conservadores NCRP 147 cuando no hay datos de fabricante.', size: 22 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '5.2 NCRP Report 151 — Terapia (LINAC, Gamma Knife, Braquiterapia)', bold: true, size: 24, color: '2E5C8A' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Para radioterapia de megavoltaje, se utiliza el metodo de las TVL (Tenth-Value Layers): n = log10(K_sin_blindaje / K_diseño), x = n * TVL. Las TVL por energia y material se obtienen de NCRP 151 y datos de laboratorio para materiales certificados.', size: 22 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '5.3 AAPM TG 108 / IAEA SRS 47 — Medicina Nuclear y Ciclotrones', bold: true, size: 24, color: '2E5C8A' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Para radionuclidos, se utiliza atenuacion exponencial: B = e^(-mu*x) donde mu = ln(10)/TVL = ln(2)/HVL. La kerma no atenuada se calcula como K = Gamma * A / d^2, donde Gamma es la constante de dosis especifica del radionuclido (muSv*m2/GBq*h), A es la actividad en GBq, y d es la distancia en metros.', size: 22 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '5.4 Muestreo espacial', bold: true, size: 24, color: '2E5C8A' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'El muestreo se realiza a 0.3 m de cada barrera (NCRP 147 recomendacion), con puntos espaciados cada 0.2 m a lo largo de la barrera. Para cada punto, se suman las contribuciones de todas las fuentes de radiacion considerando la ley inversa del cuadrado de la distancia (1/d2) y la atenuacion angular cuando aplica.', size: 22 })] })
  ];

  // 7. Normative references
  const normativeParagraphs = [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: '6. REFERENCIAS NORMATIVAS', bold: true, size: 28, color: '1B3A5F' })]
    }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• NCRP Report No. 147 (2004). Structural Shielding Design for Medical X-Ray Imaging Facilities.', size: 22 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• NCRP Report No. 151 (2005). Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities.', size: 22 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• AAPM TG 108 (2006). PET and PET/CT Shielding Requirements.', size: 22 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• IAEA Safety Reports Series No. 47 (2006). Radiation Protection for PET/CT Facilities.', size: 22 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• NOM-008-NUCL-2024. Límites de contaminación radiactiva y criterios para su control (DOF 24-05-2024).', size: 22 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• NOM-040-NUCL-2016. Requisitos de seguridad radiológica para la práctica de medicina nuclear (aplica solo a medicina nuclear).', size: 22 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• NOM-041-NUCL-2013. Criterios radiologicos para la liberacion de pacientes con radionuclidos.', size: 22 })] }),
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '• DeLorenzo et al. (2016). RadShield: Semiautomated shielding design using a floor plan driven GUI. JACMP 17(3):167-182.', size: 22 })] })
  ];

  // 6.1 Evidencia documental citada (GAMMA-AI): página y fragmento verificables por SHA-256
  const evidenciaGamma = data.evidenciaGamma ?? (await verificarPaqueteGamma(paqueteEvidenciaMemoria));
  const gammaParagraphs = [
    new Paragraph({
      spacing: { before: 300, after: 120 },
      children: [new TextRun({ text: '6.1 EVIDENCIA DOCUMENTAL CITADA (GAMMA-AI)', bold: true, size: 24, color: '2E5C8A' })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({
        text: 'Fragmentos de las fuentes recuperados por GAMMA-AI con documento, página y SHA-256 del texto citado. Respaldo documental experimental: no sustituye la revisión ni la firma del responsable.',
        size: 18, italics: true, color: '4A5568',
      })],
    }),
    ...seccionEvidenciaMemoria(evidenciaGamma).map((linea) => new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: linea, size: linea.startsWith('Sección') ? 20 : 17, bold: linea.startsWith('Sección') })],
    })),
  ];

  const analyticEvidenceParagraphs = [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: '7. EVIDENCIA TRAZABLE DEL CANVAS (F76)', bold: true, size: 28, color: '1B3A5F' })]
    }),
    ...textBlockToParagraphs(analyticEvidenceSection.replace(/^7\. EVIDENCIA TRAZABLE DEL CANVAS \(F76\)\n?/, '')),
  ];

  // 8. Signatures
  const signatureParagraphs = [
    new Paragraph({
      spacing: { before: 800, after: 400 },
      children: [new TextRun({ text: '7. FIRMAS Y SELLOS', bold: true, size: 28, color: '1B3A5F' })]
    }),
    new Paragraph({
      spacing: { after: 600 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '_________________________________', size: 22 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: preparerName || 'Fisico Medico responsable', bold: true, size: 22 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Elaboro: Memoria Analitica de Blindajes', size: 20, color: '718096' })]
    }),
    new Paragraph({
      spacing: { before: 400, after: 600 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '_________________________________', size: 22 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: reviewerName || 'Representante legal / RPO', bold: true, size: 22 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Reviso y aprueba para tramite CNSNS', size: 20, color: '718096' })]
    }),
    new Paragraph({
      spacing: { before: 600 },
      children: [new TextRun({ text: `[Sello de la institucion: ${institution || '[Institucion]'}]`, size: 18, color: 'A0AEC0', italics: true })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `[Licencia CNSNS: ${licenseNumber || '[Numero]'}]`, size: 18, color: 'A0AEC0', italics: true })]
    })
  ];

  // Canvas image if available
  const canvasImageParagraphs: Paragraph[] = [];
  if (data.canvasImageDataUrl) {
    // Remove data URL prefix to get base64
    const base64Data = data.canvasImageDataUrl.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    canvasImageParagraphs.push(
      new Paragraph({
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ text: 'ANEXO A — PLANO DE BLINDAJE CON RESULTADOS', bold: true, size: 28, color: '1B3A5F' })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: 'El siguiente diagrama muestra el plano arquitectonico con las barreras de blindaje (lineas gruesas), las fuentes de radiacion (simbolos de radiactividad), los puntos de muestreo (puntos verdes a 0.3 m de barrera), y el heatmap de kerma (colores interpolados):', size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: { width: 600, height: 400 },
            type: 'png'
          })
        ]
      })
    );
  }

  // Build document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        ...coverParagraphs,
        new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }), // page break
        ...summaryParagraphs,
        ...equipmentParagraphs,
        ...resultsParagraphs,
        ...controlledZoneParagraphs,
        ...matCompParagraphs,
        ...methodologyParagraphs,
        ...normativeParagraphs,
        ...gammaParagraphs,
        ...analyticEvidenceParagraphs,
        ...canvasImageParagraphs,
        ...signatureParagraphs
      ]
    }]
  });

  return await Packer.toBlob(doc);
}
