/**
 * Fase 9 (GitHub Pages): ruta de un archivo de `public/` respetando la base del despliegue.
 *
 * En la raíz de un dominio (`base: './'`, Netlify/Vercel/Docker) `rutaPublica('wasm/x.wasm')` da `./wasm/x.wasm`, que con
 * HashRouter se resuelve contra `index.html`; en GitHub Pages (`base: '/RadShieldMx/'`) da `/RadShieldMx/wasm/x.wasm`.
 * Una ruta absoluta `/wasm/x.wasm` apuntaría a la raíz del dominio y daría 404 en Pages.
 */
export function rutaPublica(ruta: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  if (/^(?:[a-z]+:)?\/\//i.test(ruta) || ruta.startsWith('data:') || ruta.startsWith('blob:')) return ruta;
  const b = base.endsWith('/') ? base : `${base}/`;
  return `${b}${ruta.replace(/^\/+/, '')}`;
}
