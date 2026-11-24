/**
 * Fase 13: módulos de @babylonjs/core que usa la vista 3D Babylon (BabylonRuntimeSmokePreview), importados por ruta
 * de módulo individual. El barril `@babylonjs/core` (index.js, marcado con efectos secundarios) metía todo Babylon
 * en `vendor-babylon` (~8 MB); aquí sólo entra lo que la escena usa.
 *
 * Este archivo sólo se carga con el import() de la vista (nunca de forma estática): ver vite.config.ts y
 * scripts/verificar-carga-diferida.mjs.
 *
 * Se importan las versiones NO `.pure` de cada módulo: registran sus efectos (clase en el registro de tipos,
 * aumentos de Scene/Engine) igual que el barril.
 */
// --- Efectos secundarios necesarios ---
// scene.pick / pickWithRay: los ActionManager con OnPickTrigger (selección de muros, equipo, haz) los necesitan.
import '@babylonjs/core/Culling/ray';
// scene.beginAnimation y compañía, por si un GLB del equipo trae animaciones (glTFLoaderAnimation).
import '@babylonjs/core/Animations/animatable';
// Cargador glTF 2.0: registra GLTF2Loader y el plugin .gltf/.glb de SceneLoader, SIN importar de forma estática
// las ~40 extensiones (glTF/2.0/index.js lo haría vía Extensions/index.js).
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
// Las extensiones KHR_/EXT_ se registran como fábricas asíncronas: cada una se descarga sólo si el GLB la declara.
import { registerBuiltInGLTFExtensions } from '@babylonjs/loaders/glTF/2.0/Extensions/dynamic';

// --- Clases y funciones usadas por la escena ---
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ImportMeshAsync } from '@babylonjs/core/Loading/sceneLoader';

registerBuiltInGLTFExtensions();

/** Mismo espacio de nombres que usaba la vista con `import('@babylonjs/core')`, reducido a lo que usa. */
export const babylon = {
  Engine,
  Scene,
  Color3,
  Color4,
  Vector3,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  PBRMaterial,
  StandardMaterial,
  ActionManager,
  ExecuteCodeAction,
  TransformNode,
  ImportMeshAsync,
  MeshBuilder: { CreateBox, CreateCylinder, CreateGround, CreateTorus },
};
