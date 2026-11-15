/**
 * DXF SINTÉTICO para pruebas (Vitest y Playwright): sala de 9 × 7 m en mm, desplazada lejos del origen
 * (250 000, 120 000) para probar el zoom a extensión, con 8 capas y un bloque INSERT. Sin datos de ningún cliente.
 * Se genera en memoria (los .dxf del repositorio van por Git LFS).
 */
const OX = 250000;
const OY = 120000;

type Par = [number, string | number];
const p = (...pares: Par[]) => pares.map(([c, v]) => `${c}\n${v}`).join('\n');
const linea = (l: string, x1: number, y1: number, x2: number, y2: number) =>
  p([0, 'LINE'], [8, l], [10, OX + x1], [20, OY + y1], [11, OX + x2], [21, OY + y2]);
const polilinea = (l: string, pts: Array<[number, number]>) =>
  p([0, 'LWPOLYLINE'], [8, l], [90, pts.length], [70, 1], ...pts.flatMap(([x, y]): Par[] => [[10, OX + x], [20, OY + y]]));
const texto = (l: string, x: number, y: number, t: string) => p([0, 'TEXT'], [8, l], [10, OX + x], [20, OY + y], [40, 250], [1, t]);

export const CAPAS_SINTETICAS: ReadonlyArray<[string, number]> = [
  ['MURO_CONCRETO_200MM', 7],
  ['MURO_PLOMO_2MM', 1],
  ['PUERTA_PB1.5MM', 2],
  ['VENTANA_VIDRIO_PLOMADO', 5],
  ['XREF PB HOSPITAL$0$TABIQUE', 3],
  ['COTAS', 8],
  ['TEXTOS', 4],
  ['MOBILIARIO', 6],
];

export function dxfCapasSinteticas(): string {
  const cabecera = [
    p([0, 'SECTION'], [2, 'HEADER'], [9, '$INSUNITS'], [70, 4], [0, 'ENDSEC']),
    p([0, 'SECTION'], [2, 'TABLES'], [0, 'TABLE'], [2, 'LAYER']),
    ...CAPAS_SINTETICAS.map(([n, c]) => p([0, 'LAYER'], [2, n], [70, 0], [62, c], [6, 'CONTINUOUS'])),
    p([0, 'ENDTAB'], [0, 'ENDSEC'], [0, 'SECTION'], [2, 'BLOCKS']),
    p([0, 'BLOCK'], [8, '0'], [2, 'SILLA'], [70, 0], [10, 0], [20, 0], [3, 'SILLA']),
    p([0, 'LINE'], [8, '0'], [10, 0], [20, 0], [11, 500], [21, 0]),
    p([0, 'LINE'], [8, '0'], [10, 500], [20, 0], [11, 500], [21, 500]),
    p([0, 'LINE'], [8, '0'], [10, 500], [20, 500], [11, 0], [21, 500]),
    p([0, 'LINE'], [8, '0'], [10, 0], [20, 500], [11, 0], [21, 0]),
    p([0, 'ENDBLK'], [8, '0']),
    p([0, 'ENDSEC'], [0, 'SECTION'], [2, 'ENTITIES']),
  ];
  const entidades = [
    polilinea('MURO_CONCRETO_200MM', [[0, 0], [9000, 0], [9000, 7000], [0, 7000]]),
    linea('MURO_PLOMO_2MM', 5000, 0, 5000, 4000),
    linea('MURO_PLOMO_2MM', 5000, 5200, 5000, 7000),
    linea('PUERTA_PB1.5MM', 5000, 4000, 5000, 5200),
    linea('VENTANA_VIDRIO_PLOMADO', 6000, 7000, 7500, 7000),
    linea('XREF PB HOSPITAL$0$TABIQUE', 0, 3500, 2500, 3500),
    linea('XREF PB HOSPITAL$0$TABIQUE', 2500, 3500, 2500, 7000),
    linea('COTAS', 0, -800, 9000, -800),
    texto('COTAS', 4300, -700, '9000'),
    texto('TEXTOS', 1000, 1000, 'SALA RX'),
    texto('TEXTOS', 6500, 1000, 'CONTROL'),
    p([0, 'CIRCLE'], [8, 'MOBILIARIO'], [10, OX + 7000], [20, OY + 3000], [40, 400]),
    p([0, 'INSERT'], [8, 'MOBILIARIO'], [2, 'SILLA'], [10, OX + 1000], [20, OY + 5000]),
    p([0, 'INSERT'], [8, 'MOBILIARIO'], [2, 'SILLA'], [10, OX + 7500], [20, OY + 5500]),
  ];
  return [...cabecera, ...entidades, p([0, 'ENDSEC'], [0, 'EOF'])].join('\n') + '\n';
}
