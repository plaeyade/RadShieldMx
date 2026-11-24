/**
 * Vista 3D Babylon (Fase 13): ¿hay WebGL? Se prueba en un canvas aparte (no en el de la vista: un `getContext` previo
 * fijaría sus atributos y Babylon ya no podría pedir `preserveDrawingBuffer`) y se libera el contexto.
 * Sin WebGL no se descarga Babylon.
 */
export function navegadorSoportaWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const prueba = document.createElement('canvas');
    const gl = (prueba.getContext('webgl2') || prueba.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export const MENSAJE_SIN_WEBGL =
  'Este navegador no ofrece WebGL: la vista 3D Babylon no puede dibujarse. Use el visor Three/R3F de la derecha o la planta 2D; el cálculo no cambia.';
