import { useMemo } from 'react';
import * as THREE from 'three';
import type { TextureKind } from '../constantes';

function makeProceduralTexture(kind: TextureKind) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const palettes: Record<TextureKind, [string, string, string]> = {
    floor: ['#dce7ea', '#cdd9dc', '#eef4f5'],
    concrete: ['#d0cec8', '#bcb9b1', '#e0ded8'],
    lead: ['#424854', '#303642', '#5a616d'],
    steel: ['#aeb7c0', '#8995a1', '#d3d8dd'],
    glass: ['#9ccbc8', '#d9f4f2', '#5e9f9c'],
    ceiling: ['#f8fafc', '#e5e7eb', '#ffffff'],
    equipment: ['#f8fafc', '#d7dee8', '#ffffff'],
  };
  const [base, line, highlight] = palettes[kind];

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = line;
  ctx.lineWidth = kind === 'floor' || kind === 'ceiling' ? 2 : 1;

  if (kind === 'floor' || kind === 'ceiling') {
    for (let i = 0; i <= canvas.width; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  } else {
    for (let i = -canvas.height; i < canvas.width; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, canvas.height);
      ctx.lineTo(i + canvas.height, 0);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = highlight;
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 37) % canvas.width;
    const y = (i * 53) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'floor' ? 10 : 4, kind === 'floor' ? 10 : 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useProceduralTexture(kind: TextureKind) {
  return useMemo(() => makeProceduralTexture(kind), [kind]);
}

export function SurfaceMaterial({
  kind,
  color,
  roughness = 0.55,
  metalness = 0.04,
  opacity = 1,
}: {
  kind: TextureKind;
  color: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
}) {
  const map = useProceduralTexture(kind);
  return (
    <meshStandardMaterial
      color={color}
      map={map || undefined}
      roughness={roughness}
      metalness={metalness}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}
