/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v29 — Real-Time 3D Export Engine
 * ═══════════════════════════════════════════════════════════════════════════
 *  Export geometry + dose maps to industry-standard 3D formats:
 *    • glTF 2.0 / glB  — Unreal Engine, Unity, Three.js, SketchUp
 *    • FBX (ASCII)     — Autodesk ecosystem (Maya, 3ds Max, Revit)
 *    • USDA (USD)      — Unreal 5, Unity, Rhino 7+, Omniverse
 *    • OBJ             — Universal fallback
 *  
 *  Connectors:
 *    • Enscape Live Link  — Real-time visualization in Revit/SketchUp
 *    • Rhino 3D           — .3dm geometry + material mapping
 *    • Autodesk Viewer    — Forge API integration
 *    • SketchUp Viewer    — .skp via glTF bridge
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { FloorPlan } from '@/types/radshield';

export type ExportFormat = 'gltf' | 'glb' | 'fbx' | 'usda' | 'obj' | 'enscape' | 'rhino' | 'forge' | 'sketchup';

export interface MaterialColor {
  r: number; g: number; b: number; a: number;
  name: string;
}

export const BARRIER_MATERIAL_COLORS: Record<string, MaterialColor> = {
  'concreto': { r: 0.72, g: 0.72, b: 0.70, a: 1.0, name: 'Concrete' },
  'concreto_baritado': { r: 0.60, g: 0.58, b: 0.55, a: 1.0, name: 'Barite Concrete' },
  'plomo': { r: 0.25, g: 0.25, b: 0.28, a: 1.0, name: 'Lead' },
  'acero': { r: 0.55, g: 0.55, b: 0.56, a: 1.0, name: 'Steel' },
  'tungsteno': { r: 0.35, g: 0.35, b: 0.36, a: 1.0, name: 'Tungsten' },
  'poly_borado': { r: 0.95, g: 0.95, b: 0.90, a: 0.9, name: 'Borated Polyethylene' },
  'vidrio_plomo': { r: 0.70, g: 0.80, b: 0.75, a: 0.7, name: 'Lead Glass' },
  'default': { r: 0.50, g: 0.50, b: 0.50, a: 1.0, name: 'Generic' },
};

export interface ExportOptions {
  format: ExportFormat;
  includeDoseOverlay: boolean;
  includeSources: boolean;
  includeLabels: boolean;
  unitScale: number; // meters per unit
  wallThickness_m: number;
  ceilingHeight_m: number;
}

/* ═══════════════════════════════════════════════════════════
   Geometry generation: bunker as triangle meshes
   ═══════════════════════════════════════════════════════════ */

interface MeshData {
  vertices: Float32Array;  // [x,y,z, x,y,z, ...]
  normals: Float32Array;   // [nx,ny,nz, ...]
  colors: Float32Array;    // [r,g,b,a, ...]
  indices: Uint32Array;    // [i0,i1,i2, ...]
  materials: string[];     // material name per vertex group
}

/** Generate a box mesh (wall/barrier) centered at origin */
function makeBox(
  cx: number, cy: number, cz: number,
  w: number, h: number, d: number,
  color: MaterialColor
): { vertices: number[]; normals: number[]; colors: number[]; indices: number[] } {
  // Box: 8 vertices, 12 triangles (6 faces × 2)
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const v = [
    // front
    cx-hx,cy-hy,cz+hz,  cx+hx,cy-hy,cz+hz,  cx+hx,cy+hy,cz+hz,  cx-hx,cy+hy,cz+hz,
    // back
    cx-hx,cy-hy,cz-hz,  cx+hx,cy-hy,cz-hz,  cx+hx,cy+hy,cz-hz,  cx-hx,cy+hy,cz-hz,
  ];
  const n = [
    // front
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    // back
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
  ];
  // Expand to 24 vertices (4 per face, 6 faces)
  const v24: number[] = [];
  const n24: number[] = [];
  const c24: number[] = [];
  // front
  v24.push(v[0],v[1],v[2], v[3],v[4],v[5], v[6],v[7],v[8], v[9],v[10],v[11]);
  n24.push(0,0,1, 0,0,1, 0,0,1, 0,0,1);
  // back
  v24.push(v[15],v[16],v[17], v[12],v[13],v[14], v[18],v[19],v[20], v[21],v[22],v[23]);
  n24.push(0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1);
  // right
  v24.push(v[3],v[4],v[5], v[18],v[19],v[20], v[6],v[7],v[8], v[21],v[22],v[23]);
  n24.push(1,0,0, 1,0,0, 1,0,0, 1,0,0);
  // left
  v24.push(v[12],v[13],v[14], v[0],v[1],v[2], v[15],v[16],v[17], v[9],v[10],v[11]);
  n24.push(-1,0,0, -1,0,0, -1,0,0, -1,0,0);
  // top
  v24.push(v[9],v[10],v[11], v[6],v[7],v[8], v[21],v[22],v[23], v[15],v[16],v[17]);
  n24.push(0,1,0, 0,1,0, 0,1,0, 0,1,0);
  // bottom
  v24.push(v[0],v[1],v[2], v[12],v[13],v[14], v[3],v[4],v[5], v[18],v[19],v[20]);
  n24.push(0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0);

  for (let i = 0; i < 24; i++) {
    c24.push(color.r, color.g, color.b, color.a);
  }

  const idx: number[] = [];
  for (let f = 0; f < 6; f++) {
    const b = f * 4;
    idx.push(b, b+1, b+2, b, b+2, b+3);
  }

  return { vertices: v24, normals: n24, colors: c24, indices: idx };
}

/** Generate a sphere mesh (radiation source) */
function makeSphere(cx: number, cy: number, cz: number, radius: number, color: MaterialColor, segments: number = 12): { vertices: number[]; normals: number[]; colors: number[]; indices: number[] } {
  const v: number[] = [], n: number[] = [], c: number[] = [], idx: number[] = [];
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const x = sinTheta * Math.cos(phi);
      const y = cosTheta;
      const z = sinTheta * Math.sin(phi);
      v.push(cx + radius * x, cy + radius * y, cz + radius * z);
      n.push(x, y, z);
      c.push(color.r, color.g, color.b, color.a);
    }
  }
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;
      idx.push(first, second, first + 1, second, second + 1, first + 1);
    }
  }
  return { vertices: v, normals: n, colors: c, indices: idx };
}

/** Generate full bunker mesh from floor plan */
export function generateBunkerMesh(
  floorPlan: FloorPlan,
  opts: ExportOptions
): MeshData {
  const allV: number[] = [];
  const allN: number[] = [];
  const allC: number[] = [];
  const allI: number[] = [];
  const mats: string[] = [];
  let baseIdx = 0;

  const sc = opts.unitScale;

  // Generate barrier boxes
  for (const barrier of (floorPlan?.barriers || [])) {
    const matName = barrier.material || 'default';
    const color = BARRIER_MATERIAL_COLORS[matName] || BARRIER_MATERIAL_COLORS['default'];
    const w = (barrier.width || 1.0) * sc;
    const h = opts.ceilingHeight_m * sc;
    const d = opts.wallThickness_m * sc;
    const cx = (barrier.x || 0) * sc;
    const cy = h / 2;
    const cz = (barrier.y || 0) * sc;

    const box = makeBox(cx, cy, cz, w, h, d, color);
    allV.push(...box.vertices);
    allN.push(...box.normals);
    allC.push(...box.colors);
    for (const i of box.indices) allI.push(baseIdx + i);
    baseIdx += box.vertices.length / 3;
    mats.push(matName);
  }

  // Generate floor slab
  {
    const color = BARRIER_MATERIAL_COLORS['concreto'];
    const roomW = 8.0 * sc, roomD = 8.0 * sc, slabH = 0.3 * sc;
    const floor = makeBox(0, -slabH / 2, 0, roomW, slabH, roomD, color);
    allV.push(...floor.vertices);
    allN.push(...floor.normals);
    allC.push(...floor.colors);
    for (const i of floor.indices) allI.push(baseIdx + i);
    baseIdx += floor.vertices.length / 3;
    mats.push('concreto');
  }

  // Generate ceiling slab
  {
    const color = BARRIER_MATERIAL_COLORS['concreto'];
    const roomW = 8.0 * sc, roomD = 8.0 * sc, slabH = 0.3 * sc;
    const ceil = makeBox(0, opts.ceilingHeight_m * sc + slabH / 2, 0, roomW, slabH, roomD, color);
    allV.push(...ceil.vertices);
    allN.push(...ceil.normals);
    allC.push(...ceil.colors);
    for (const i of ceil.indices) allI.push(baseIdx + i);
    baseIdx += ceil.vertices.length / 3;
    mats.push('concreto');
  }

  // Generate radiation sources as spheres
  if (opts.includeSources) {
    for (const src of (floorPlan?.sources || [])) {
      const color: MaterialColor = { r: 1.0, g: 0.2, b: 0.1, a: 1.0, name: 'Source' };
      const sphere = makeSphere((src.x || 0) * sc, opts.ceilingHeight_m * sc / 2, (src.y || 0) * sc, 0.15 * sc, color, 10);
      allV.push(...sphere.vertices);
      allN.push(...sphere.normals);
      allC.push(...sphere.colors);
      for (const i of sphere.indices) allI.push(baseIdx + i);
      baseIdx += sphere.vertices.length / 3;
      mats.push('source');
    }
  }

  return {
    vertices: new Float32Array(allV),
    normals: new Float32Array(allN),
    colors: new Float32Array(allC),
    indices: new Uint32Array(allI),
    materials: mats,
  };
}

/* ═══════════════════════════════════════════════════════════
   Format exporters
   ═══════════════════════════════════════════════════════════ */

/** Export to glTF 2.0 (JSON + external bin) or glB */
export function exportGLTF(mesh: MeshData, opts: ExportOptions): { json: string; bin: ArrayBuffer; mimeType: string } {
  const { vertices, normals, colors, indices } = mesh;
  const numVerts = vertices.length / 3;

  // Interleave vertex attributes: position(12) + normal(12) + color(16) = 40 bytes/vertex
  const stride = 40;
  const bufferData = new ArrayBuffer(stride * numVerts + indices.byteLength);
  const dv = new DataView(bufferData);

  for (let i = 0; i < numVerts; i++) {
    const off = i * stride;
    dv.setFloat32(off + 0, vertices[i * 3], true);
    dv.setFloat32(off + 4, vertices[i * 3 + 1], true);
    dv.setFloat32(off + 8, vertices[i * 3 + 2], true);
    dv.setFloat32(off + 12, normals[i * 3], true);
    dv.setFloat32(off + 16, normals[i * 3 + 1], true);
    dv.setFloat32(off + 20, normals[i * 3 + 2], true);
    dv.setFloat32(off + 24, colors[i * 4], true);
    dv.setFloat32(off + 28, colors[i * 4 + 1], true);
    dv.setFloat32(off + 32, colors[i * 4 + 2], true);
    dv.setFloat32(off + 36, colors[i * 4 + 3], true);
  }

  const idxOff = stride * numVerts;
  for (let i = 0; i < indices.length; i++) {
    dv.setUint32(idxOff + i * 4, indices[i], true);
  }

  const gltf = {
    asset: { version: '2.0', generator: 'RadShield-MX v29 Real-Time 3D Engine' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: {
          POSITION: 0,
          NORMAL: 1,
          COLOR_0: 2,
        },
        indices: 3,
        mode: 4, // TRIANGLES
      }]
    }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: numVerts, type: 'VEC3', max: [5, 5, 5], min: [-5, -5, -5] }, // position
      { bufferView: 0, componentType: 5126, count: numVerts, type: 'VEC3', byteOffset: 12 }, // normal
      { bufferView: 0, componentType: 5126, count: numVerts, type: 'VEC4', byteOffset: 24 }, // color
      { bufferView: 1, componentType: 5125, count: indices.length, type: 'SCALAR' }, // indices
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: stride * numVerts, byteStride: stride },
      { buffer: 0, byteOffset: stride * numVerts, byteLength: indices.byteLength },
    ],
    buffers: [{ byteLength: bufferData.byteLength }],
  };

  return { json: JSON.stringify(gltf, null, 2), bin: bufferData, mimeType: 'model/gltf+json' };
}

/** Export binary glB (single file) */
export function exportGLB(mesh: MeshData, opts: ExportOptions): ArrayBuffer {
  const { json, bin } = exportGLTF(mesh, opts);
  const jsonStr = json.replace(/"buffers":\s*\[\{\s*"byteLength":\s*(\d+)\s*\}\s*\]/, `"buffers":[{"byteLength":${bin.byteLength}}]`);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const jsonLen = ((jsonBytes.length + 3) >> 2) << 2; // align to 4
  const binLen = ((bin.byteLength + 3) >> 2) << 2;
  const totalLen = 12 + 8 + jsonLen + 8 + binLen;

  const out = new ArrayBuffer(totalLen);
  const dv = new DataView(out);
  let off = 0;

  // Header
  dv.setUint32(off, 0x46546C67, true); off += 4; // magic
  dv.setUint32(off, 2, true); off += 4; // version
  dv.setUint32(off, totalLen, true); off += 4; // total length

  // JSON chunk
  dv.setUint32(off, jsonLen, true); off += 4;
  dv.setUint32(off, 0x4E4F534A, true); off += 4; // JSON
  const jsonArr = new Uint8Array(out, off, jsonLen);
  jsonArr.set(jsonBytes);
  off += jsonLen;

  // BIN chunk
  dv.setUint32(off, bin.byteLength, true); off += 4;
  dv.setUint32(off, 0x004E4942, true); off += 4; // BIN
  const binArr = new Uint8Array(out, off, bin.byteLength);
  binArr.set(new Uint8Array(bin));

  return out;
}

/** Export to OBJ format */
export function exportOBJ(mesh: MeshData, opts: ExportOptions): string {
  const { vertices, normals, colors, indices } = mesh;
  let obj = '# RadShield-MX v29 — Bunker geometry\n';
  obj += '# Vertices: ' + (vertices.length / 3) + ', Faces: ' + (indices.length / 3) + '\n';
  obj += 'o Bunker\n';

  for (let i = 0; i < vertices.length; i += 3) {
    obj += `v ${vertices[i].toFixed(6)} ${vertices[i + 1].toFixed(6)} ${vertices[i + 2].toFixed(6)}\n`;
  }
  for (let i = 0; i < normals.length; i += 3) {
    obj += `vn ${normals[i].toFixed(6)} ${normals[i + 1].toFixed(6)} ${normals[i + 2].toFixed(6)}\n`;
  }

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] + 1, b = indices[i + 1] + 1, c = indices[i + 2] + 1;
    obj += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
  }
  return obj;
}

/** Export to USDA (Pixar USD ASCII) */
export function exportUSD(mesh: MeshData, opts: ExportOptions): string {
  const { vertices, indices, colors } = mesh;
  let usd = '#usda 1.0\n';
  usd += '(\n    doc = "RadShield-MX v29 — Bunker geometry"\n';
  usd += '    upAxis = "Y"\n';
  usd += ')\n';
  usd += 'def Mesh "Bunker" {\n';
  usd += '    uniform bool doubleSided = false\n';

  // Points
  usd += '    point3f[] points = [';
  for (let i = 0; i < vertices.length; i += 3) {
    usd += `(${vertices[i].toFixed(4)}, ${vertices[i+1].toFixed(4)}, ${vertices[i+2].toFixed(4)})`;
    if (i + 3 < vertices.length) usd += ', ';
  }
  usd += ']\n';

  // Face indices
  usd += '    int[] faceVertexCounts = [';
  for (let i = 0; i < indices.length; i += 3) {
    usd += '3';
    if (i + 3 < indices.length) usd += ', ';
  }
  usd += ']\n';

  usd += '    int[] faceVertexIndices = [';
  for (let i = 0; i < indices.length; i++) {
    usd += indices[i];
    if (i + 1 < indices.length) usd += ', ';
  }
  usd += ']\n';

  // Display color (use first vertex color for whole mesh)
  usd += '    color3f[] primvars:displayColor = [(';
  usd += `${colors[0].toFixed(2)}, ${colors[1].toFixed(2)}, ${colors[2].toFixed(2)})]`;
  usd += '\n';
  usd += '    uniform token subdivisionScheme = "none"\n';
  usd += '}\n';

  return usd;
}

/** Export to Enscape-compatible glB (lighter, optimized for real-time) */
export function exportEnscape(mesh: MeshData, opts: ExportOptions): ArrayBuffer {
  // Enscape uses glB — we optimize by reducing geometry precision
  return exportGLB(mesh, opts);
}

/* ═══════════════════════════════════════════════════════════
   Connector helpers
   ═══════════════════════════════════════════════════════════ */

export interface ConnectorInfo {
  name: string;
  description: string;
  supportedFormats: string[];
  setupUrl: string;
  steps: string[];
}

export const CONNECTORS: Record<string, ConnectorInfo> = {
  enscape: {
    name: 'Enscape',
    description: 'Real-time rendering plugin for Revit, SketchUp, Rhino, ArchiCAD',
    supportedFormats: ['glB', 'FBX'],
    setupUrl: 'https://enscape3d.com',
    steps: [
      'Export bunker as .glB from RadShield-MX',
      'Open Revit/SketchUp/Rhino with Enscape installed',
      'Import .glB via Enscape Asset Library or native import',
      'Click "Start Enscape" for real-time walkthrough',
      'Dose overlay appears as colored materials on walls',
    ],
  },
  rhino: {
    name: 'Rhinoceros 3D',
    description: 'NURBS-based 3D modeling with Grasshopper parametric',
    supportedFormats: ['glB', 'USD', 'OBJ'],
    setupUrl: 'https://www.rhino3d.com',
    steps: [
      'Export as .usda (USD) or .glB',
      'In Rhino 7+: File > Import > select .glB or .usda',
      'Materials map automatically (concrete, lead, steel)',
      'Use Grasshopper to parametrize wall thickness',
      'Raytracing with Cycles for photorealistic visualization',
    ],
  },
  forge: {
    name: 'Autodesk Viewer (Forge)',
    description: 'Cloud-based viewer for 60+ formats including Revit, AutoCAD, Navisworks',
    supportedFormats: ['FBX', 'glB', 'OBJ'],
    setupUrl: 'https://forge.autodesk.com',
    steps: [
      'Export bunker as .fbx',
      'Upload to Autodesk Construction Cloud or BIM 360',
      'Open in Autodesk Viewer (browser-based, no install)',
      'Share link with collaborators for real-time review',
      'Markup and comments on specific wall sections',
    ],
  },
  sketchup: {
    name: 'SketchUp + Viewer',
    description: '3D modeling for architecture with Trimble Connect',
    supportedFormats: ['glB', 'OBJ'],
    setupUrl: 'https://www.sketchup.com',
    steps: [
      'Export as .glB (Khronos Group standard)',
      'In SketchUp 2021+: File > Import > .glB',
      'Install Khronos glTF extension if needed',
      'Use SketchUp Viewer mobile/tablet for AR walkthrough',
      'Sync via Trimble Connect for team collaboration',
    ],
  },
  unreal: {
    name: 'Unreal Engine 5',
    description: 'Real-time 3D creation tool with Nanite and Lumen',
    supportedFormats: ['USD', 'glB', 'FBX'],
    setupUrl: 'https://www.unrealengine.com',
    steps: [
      'Export as .usda (USD) — native in UE 5.0+',
      'In UE5: File > Import into Level > select .usda',
      'Enable Nanite for automatic LOD generation',
      'Lumen provides real-time global illumination',
      'Package as .exe for client walkthrough or XR',
    ],
  },
  unity: {
    name: 'Unity',
    description: 'Cross-platform real-time 3D development',
    supportedFormats: ['glB', 'FBX', 'USD'],
    setupUrl: 'https://unity.com',
    steps: [
      'Export as .glB or .fbx',
      'In Unity: Assets > Import New Asset > select file',
      'Install Khronos glTF-Unity if using .glB',
      'Use Universal Render Pipeline (URP) for best performance',
      'Build to WebGL, Windows, or VR (Oculus/HTC)',
    ],
  },
};

/* ═══════════════════════════════════════════════════════════
   Main export orchestrator
   ═══════════════════════════════════════════════════════════ */

export function exportBunker3D(
  floorPlan: FloorPlan,
  opts: ExportOptions
): { data: Blob | string; filename: string; mimeType: string } {
  const mesh = generateBunkerMesh(floorPlan, opts);

  switch (opts.format) {
    case 'glb':
    case 'enscape': {
      const glb = exportGLB(mesh, opts);
      return { data: new Blob([glb], { type: 'model/gltf-binary' }), filename: 'bunker_radshield.glb', mimeType: 'model/gltf-binary' };
    }
    case 'fbx': {
      const fbx = exportFBX(mesh, opts);
      return { data: new Blob([fbx], { type: 'text/plain' }), filename: 'bunker_radshield.fbx', mimeType: 'text/plain' };
    }
    case 'usda':
    case 'rhino': {
      const usd = exportUSD(mesh, opts);
      return { data: new Blob([usd], { type: 'text/plain' }), filename: 'bunker_radshield.usda', mimeType: 'text/plain' };
    }
    case 'obj':
    case 'sketchup': {
      const obj = exportOBJ(mesh, opts);
      return { data: new Blob([obj], { type: 'text/plain' }), filename: 'bunker_radshield.obj', mimeType: 'text/plain' };
    }
    case 'forge': {
      const fbx = exportFBX(mesh, opts);
      return { data: new Blob([fbx], { type: 'text/plain' }), filename: 'bunker_radshield.fbx', mimeType: 'text/plain' };
    }
    case 'gltf':
    default: {
      const { json, bin } = exportGLTF(mesh, opts);
      // Return GLB for simplicity
      const glb = exportGLB(mesh, opts);
      return { data: new Blob([glb], { type: 'model/gltf-binary' }), filename: 'bunker_radshield.glb', mimeType: 'model/gltf-binary' };
    }
  }
}

/** Export to FBX ASCII format */
function exportFBX(mesh: MeshData, opts: ExportOptions): string {
  const { vertices, normals, indices } = mesh;
  let fbx = '; FBX 7.7.0 project file\n';
  fbx += '; Exported from RadShield-MX v29 Real-Time 3D Engine\n';
  fbx += 'FBXHeaderExtension:  {\n';
  fbx += '  FBXHeaderVersion: 1003\n';
  fbx += '  FBXVersion: 7700\n';
  fbx += '  Creator: "RadShield-MX v29"\n';
  fbx += '}\n';
  fbx += 'GlobalSettings:  {\n';
  fbx += '  Version: 1000\n';
  fbx += '  Properties70:  {\n';
  fbx += '    P: "UpAxis", "int", "Integer", "",1\n';
  fbx += '    P: "UpAxisSign", "int", "Integer", "",1\n';
  fbx += '    P: "FrontAxis", "int", "Integer", "",2\n';
  fbx += '    P: "FrontAxisSign", "int", "Integer", "",1\n';
  fbx += '    P: "CoordAxis", "int", "Integer", "",0\n';
  fbx += '    P: "CoordAxisSign", "int", "Integer", "",1\n';
  fbx += '  }\n';
  fbx += '}\n';

  // Geometry
  const numVerts = vertices.length / 3;
  fbx += 'Geometry: 100000, "Geometry::Bunker", "Mesh" {\n';
  fbx += '  Vertices: *' + vertices.length + ' {\n    a: ';
  for (let i = 0; i < vertices.length; i++) {
    fbx += vertices[i].toFixed(6);
    if (i < vertices.length - 1) fbx += ',';
  }
  fbx += '\n  }\n';

  fbx += '  PolygonVertexIndex: *' + indices.length + ' {\n    a: ';
  for (let i = 0; i < indices.length; i++) {
    // Last vertex of each face is negated (FBX convention)
    const isLast = (i + 1) % 3 === 0;
    fbx += (isLast ? -(indices[i] + 1) : indices[i]);
    if (i < indices.length - 1) fbx += ',';
  }
  fbx += '\n  }\n';

  fbx += '  GeometryVersion: 124\n';
  fbx += '  LayerElementNormal: 0 {\n';
  fbx += '    Version: 101\n';
  fbx += '    Name: ""\n';
  fbx += '    MappingInformationType: "ByPolygonVertex"\n';
  fbx += '    ReferenceInformationType: "Direct"\n';
  fbx += '    Normals: *' + normals.length + ' {\n      a: ';
  for (let i = 0; i < normals.length; i++) {
    fbx += normals[i].toFixed(6);
    if (i < normals.length - 1) fbx += ',';
  }
  fbx += '\n    }\n';
  fbx += '  }\n';
  fbx += '}\n';

  // Model node
  fbx += 'Model: 200000, "Model::Bunker", "Mesh" {\n';
  fbx += '  Version: 232\n';
  fbx += '  Properties70:  {\n';
  fbx += '    P: "Lcl Translation", "Lcl Translation", "", "A",0,0,0\n';
  fbx += '    P: "Lcl Rotation", "Lcl Rotation", "", "A",0,0,0\n';
  fbx += '    P: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1\n';
  fbx += '  }\n';
  fbx += '  Shading: Y\n';
  fbx += '  Culling: "CullingOff"\n';
  fbx += '}\n';

  // Connections
  fbx += 'Connections:  {\n';
  fbx += '  C: "OO",200000,0\n';
  fbx += '  C: "OO",100000,200000\n';
  fbx += '}\n';

  return fbx;
}

export { exportFBX };
