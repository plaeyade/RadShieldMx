# Banderas de funciones de RadShield-MX

Inventario de todas las banderas de funciones del frontend al 23-11-2026 (PR #79, vista 3D Babylon activa por omisión).
Responde a «¿cuáles siguen apagadas?».

Hay dos clases:

- **Banderas de compilación** (`import.meta.env.VITE_*`): se fijan al construir (`VITE_X=true npm run build`); no se
  pueden cambiar desde el navegador. Son las que gobiernan los visores y la física.
- **Banderas en tiempo de ejecución** (`featureFlags` de `src/lib/featureFlags.ts`): valor por omisión en el código,
  sobrescribible con `localStorage['radshield_feature_flags']`. Ninguna toca el cálculo de dosis.

Regla general: una bandera booleana de compilación sólo se enciende con el texto exacto `'true'`. La única excepción es
`VITE_VISOR_3D_BABYLON`, que está encendida salvo `'false'` o `'0'`.

## 1. Banderas de compilación: visores y motor de dosis (`src/lib/featureFlags.ts`)

| Bandera (constante / variable) | Por omisión | Para qué sirve |
|---|---|---|
| `VISOR_3D_BABYLON` / `VITE_VISOR_3D_BABYLON` | **ENCENDIDA** (desde el 23-11-2026, autorización del propietario) | Vista 3D Babylon de Inspección 3D (F455–F474 + GLB del equipo, Fase 13). Visual: no calcula dosis. Se apaga con `=false`/`=0` (Babylon queda como rama muerta y no se emite `vendor-babylon`). También la lee `vite.config.ts`. |
| `VISORES_EN_REVISION` / `VITE_VISORES_EN_REVISION` | apagada | Reactiva a la vez los 4 visores en revisión (Curvas Isodosis, 3D Dose Mapping, Heat Map Avanzado, Isosuperficie 3D) en menús, barra lateral y paleta de comandos. |
| `VISOR_HEATMAP_AVANZADO` / `VITE_VISOR_HEATMAP_AVANZADO` | apagada | Sólo el visor Heat Map Avanzado (`HeatMapViewer`, id `heatmap`). |
| `VISOR_ISODOSIS` / `VITE_VISOR_ISODOSIS` | apagada | Sólo Curvas Isodosis (`IsodosisViewer`, id `isodosis`). |
| `VISOR_ISOSUPERFICIE_3D` / `VITE_VISOR_ISOSUPERFICIE_3D` | apagada | Sólo Isosuperficie 3D (`Isosurface3DDialog`, id `isosurface3d`). |
| `VISOR_DOSE_MAPPING_3D` / `VITE_VISOR_DOSE_MAPPING_3D` | apagada | Sólo 3D Dose Mapping (`DoseMapping3D`, id `dose3d`). |
| `HEATMAP_GPU` / `VITE_HEATMAP_GPU` | apagada | Heat map del lienzo con el shader WebGPU; apagada = CPU con `doseFieldEngine` (el shader no está portado). |
| `DEPURACION_RENDER` / `VITE_DEPURACION_RENDER` | apagada | Dibuja sobre el lienzo los HUD de depuración del renderer (F436–F445, F621–F695). |
| `MENU_AVANZADO` / `VITE_MENU_AVANZADO` | apagada | Menú «Avanzado» de la barra superior (integraciones, rendimiento, CAD→Monte Carlo, agente de diseño, 3D en tiempo real). Apagada = sólo los 5 menús por etapa + Ayuda. |

## 2. Banderas en tiempo de ejecución (`featureFlags`, `src/lib/featureFlags.ts`)

| Bandera | Por omisión | Para qué sirve / estado |
|---|---|---|
| `webgpuHeatmap` | apagada | Histórica (C.14). Nadie la lee: el heat map GPU lo gobierna `HEATMAP_GPU`. |
| `advancedMonteCarlo` | apagada | Histórica (C.14). Sin consumidores. |
| `experimentalCV` | apagada | Histórica (C.14). Sin consumidores. |
| `canvasHighRiskCad` | apagada (`VITE_CANVAS_HIGH_RISK_CAD === 'true'`) | Herramientas CAD de alto riesgo del lienzo (`src/sections/CanvasArea.tsx`). Encendida en `.env.staging-cad.example`. |
| `canvasEventControllerV2` | apagada (requiere `VITE_CANVAS_HIGH_RISK_CAD` y `VITE_CANVAS_EVENT_CONTROLLER_V2` en `'true'`) | Controlador de eventos v2 del lienzo (`src/lib/canvas/eventControllerV2.ts`, `CanvasArea.tsx`). |
| `medical3DBabylonAdapter` | apagada (requiere `VITE_MEDICAL_3D_BABYLON_ADAPTER` y `VITE_MEDICAL_3D_BABYLON_RUNTIME` en `'true'`) | Adaptador heredado F311/F314 (`src/lib/medical3D/babylonRuntimeLoader.ts`, import con `@vite-ignore`). **No** es la vista Babylon activa (ésa es `VISOR_3D_BABYLON`). |
| `medical3DUnityExternalViewer` | apagada (requiere `VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER === 'true'` y `VITE_MEDICAL_3D_UNITY_WEBGL_URL`) | Visor Unity WebGL externo. El enlace real lo arman `unityExternalViewerBridge.ts` / `unityWebglExportedBuild.ts` con la URL. |
| `realTimeCollaboration` | apagada | Histórica (C.14). Sin consumidores. |
| `aiPredictions` | **encendida** | Histórica (C.14). Sin consumidores en el código actual (sólo la cita el glosario). |
| `debugMode` | = `import.meta.env.DEV` (encendida en `npm run dev`, apagada en build) | Histórica (C.14). Sin consumidores. |

## 3. Otras banderas de compilación booleanas (activan integraciones opcionales)

| Variable | Por omisión | Para qué sirve | Archivo |
|---|---|---|---|
| `VITE_ENABLE_BACKEND` | apagada (`.env.example`: `false`) | Conecta el cliente tRPC al backend (también se activa si hay `radshield_backend_url` en localStorage). Apagada = app estática/offline. | `src/providers/trpc.tsx` |
| `VITE_ENABLE_SERVICE_WORKER` | apagada | Registra el Service Worker (PWA). | `src/hooks/useServiceWorker.ts` |
| `VITE_ENABLE_PACS_REAL` | apagada | PACS real contra Orthanc (`VITE_ORTHANC_URL`); apagada = modo demo. | `src/lib/pacsConfig.ts` |
| `VITE_ENABLE_PYODIDE_CDN` | apagada | Permite cargar Pyodide del CDN si no hay `VITE_PYODIDE_URL` local. | `src/lib/pyodideConfig.ts` |
| `VITE_ENABLE_OPENCV_CDN` | apagada | Permite cargar OpenCV.js del CDN si no hay `VITE_OPENCV_URL` local. | `src/hooks/useOpenCV.ts` |
| `VITE_MEDICAL_3D_UNITY_LOCAL_BUILD` | apagada | Usa el build Unity WebGL local (`public/unity/radshield-medical-3d/`). | `src/lib/medical3D/unityWebglExportedBuild.ts` |
| `VITE_MEDICAL_3D_UNITY_EXTERNAL_VIEWER` | apagada | Ver `medical3DUnityExternalViewer` (sección 2). | `src/lib/featureFlags.ts` |
| `VITE_MEDICAL_3D_BABYLON_ADAPTER`, `VITE_MEDICAL_3D_BABYLON_RUNTIME` | apagadas | Ver `medical3DBabylonAdapter` (sección 2). | `src/lib/featureFlags.ts` |
| `VITE_CANVAS_HIGH_RISK_CAD`, `VITE_CANVAS_EVENT_CONTROLLER_V2` | apagadas | Ver `canvasHighRiskCad` / `canvasEventControllerV2` (sección 2). | `src/lib/featureFlags.ts` |
| `VITE_ENABLE_WEB_SCRAPER` | apagada | Sólo aparece en `.env.example`; ningún código la lee. | `.env.example` |

## 4. Configuración (no booleana; vacía = función desactivada)

| Variable | Por omisión | Para qué sirve | Archivo |
|---|---|---|---|
| `VITE_EQUIPO_GLB_BASE` | vacía (no se pide ningún GLB) | Ruta de los GLB a escala real del equipo en la vista Babylon. | `src/lib/medical3D/modelosEquipoGlb.ts` |
| `VITE_EQUIPO_GLB_ORIENTACION_DEG` | 0 | Guiñada adicional de los GLB. | `src/lib/medical3D/modelosEquipoGlb.ts` |
| `VITE_MEDICAL_3D_UNITY_WEBGL_URL` | vacía | URL publicada del visor Unity WebGL. | `src/lib/medical3D/unityExternalViewerBridge.ts` |
| `VITE_BACKEND_URL` | vacía (origen o `localhost:3000`) | URL del backend tRPC. | `src/providers/trpc.tsx` |
| `VITE_GAMMA_URL` | vacía | Servicio GAMMA (biblioteca de referencias en vivo). | `src/lib/gammaCliente.ts` |
| `VITE_ORTHANC_URL` | vacía | Servidor Orthanc del PACS real. | `src/lib/pacsConfig.ts` |
| `VITE_PYODIDE_URL`, `VITE_OPENCV_URL` | vacías | Bundles locales de Pyodide / OpenCV.js. | `src/lib/pyodideConfig.ts`, `src/hooks/useOpenCV.ts` |
| `VITE_LLM_PROVIDER` | `offline` | Proveedor LLM del asistente. | `src/lib/llm/providers.ts` |
| `VITE_OPENAI_API_KEY`, `VITE_OLLAMA_BASE_URL`, `VITE_LMSTUDIO_BASE_URL` | vacías | Credencial / URLs de proveedores LLM. | `src/lib/llm/providers.ts` |
| `VITE_CLOUD_API_URL` | vacía | Sincronización en la nube. | `src/lib/cloudSync.ts` |
| `VITE_KIMI_AUTH_URL` + `VITE_APP_ID` | vacías | Inicio de sesión OAuth (ambas necesarias). | `src/lib/authConfig.ts` |
| `VITE_SENTRY_DSN`, `VITE_APP_VERSION` | vacías | Reporte de errores Sentry y su versión. | `src/lib/sentry.ts` |
| `VITE_BASE_PATH` | `./` (CI: `/RadShieldMx/`) | Base del sitio (GitHub Pages). | `vite.config.ts` |

## Resumen: ¿cuáles siguen apagadas?

- **Encendida por omisión:** sólo `VISOR_3D_BABYLON` (vista 3D Babylon, visual) y la histórica `aiPredictions`
  (sin efecto: nadie la lee). `debugMode` sigue a `DEV` (sólo en `npm run dev`).
- **Apagadas:** `HEATMAP_GPU`, `MENU_AVANZADO`, `VISORES_EN_REVISION`, `VISOR_HEATMAP_AVANZADO`, `VISOR_ISODOSIS`,
  `VISOR_ISOSUPERFICIE_3D`, `VISOR_DOSE_MAPPING_3D`, `DEPURACION_RENDER`, y todas las demás de las secciones 2 y 3.

Las pruebas que fijan estos valores: `src/__tests__/dialogs/BabylonEquipoGlb.test.tsx` (Babylon encendida; GPU y menú
avanzado apagados) y `src/__tests__/lib/featureFlagsMotorDosis.test.ts` (visores en revisión, GPU).
