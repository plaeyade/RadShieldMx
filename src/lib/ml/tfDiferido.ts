/**
 * Depuración etapa 7: única puerta a @tensorflow/tfjs. `shieldingThicknessModel` la importa con `import()`;
 * re-exportar sólo lo que se usa mantiene el tree-shaking que tenía el `import * as tf` estático (un `import()` del
 * paquete entero lo perdería y el bundle crecería ~230 kB).
 */
export { loadLayersModel, layers, sequential, tensor2d, train } from '@tensorflow/tfjs';
