import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { MedicalScene } from '@/lib/medical3D/sceneBuilder';
import type { F147InspectionStation } from '@/lib/f147Medical3DInspection';
import { isWalkthroughBlocked } from '../utilidades';

export function CameraRig({ scene, walkthrough }: { scene: MedicalScene; walkthrough: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    if (walkthrough) return;
    const [cx, , cz] = scene.bounds.center;
    const span = Math.max(scene.bounds.width, scene.bounds.depth, 7);
    camera.position.set(cx + span * 0.72, span * 0.58, cz + span * 0.86);
    camera.near = 0.05;
    camera.far = Math.max(120, span * 12);
    camera.lookAt(cx, 1.1, cz);
    camera.updateProjectionMatrix();
  }, [camera, scene, walkthrough]);

  return null;
}

export function InspectionStationRig({ station }: { station?: F147InspectionStation }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!station) return;
    camera.position.set(...station.position);
    camera.lookAt(...station.lookAt);
    camera.updateProjectionMatrix();
  }, [camera, station]);

  return null;
}

export function WalkthroughRig({
  scene,
  enabled,
  collisionEnabled,
}: {
  scene: MedicalScene;
  enabled: boolean;
  collisionEnabled: boolean;
}) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const yaw = useRef(0);
  const pitch = useRef(0);
  const eyeHeight = useRef(1.65);

  useEffect(() => {
    if (!enabled) return;
    const [cx, , cz] = scene.bounds.center;
    camera.position.set(cx, 1.65, cz + Math.max(2.2, scene.bounds.depth * 0.35));
    eyeHeight.current = 1.65;
    yaw.current = Math.PI;
    pitch.current = -0.04;
    camera.lookAt(cx, 1.35, cz);

    const down = (event: KeyboardEvent) => keys.current.add(event.key.toLowerCase());
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const move = (event: MouseEvent) => {
      if (!document.pointerLockElement) return;
      yaw.current -= event.movementX * 0.0022;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.0018, -0.52, 0.42);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousemove', move);
      keys.current.clear();
    };
  }, [camera, enabled, scene]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const speedModifier = keys.current.has('shift') ? 1.9 : keys.current.has('control') ? 0.42 : 1;
    const turnSpeed = 1.7 * speedModifier * delta;
    const moveSpeed = 2.6 * speedModifier * delta;
    const heightSpeed = 0.7 * delta;
    const [cx, , cz] = scene.bounds.center;
    const margin = 0.45;
    const minX = cx - scene.bounds.width / 2 + margin;
    const maxX = cx + scene.bounds.width / 2 - margin;
    const minZ = cz - scene.bounds.depth / 2 + margin;
    const maxZ = cz + scene.bounds.depth / 2 - margin;

    if (keys.current.has('arrowleft') || keys.current.has('q')) yaw.current += turnSpeed;
    if (keys.current.has('arrowright') || keys.current.has('e')) yaw.current -= turnSpeed;
    if (keys.current.has('r')) eyeHeight.current = Math.min(2.2, eyeHeight.current + heightSpeed);
    if (keys.current.has('f')) eyeHeight.current = Math.max(1.05, eyeHeight.current - heightSpeed);
    const forward = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const nextPosition = camera.position.clone();
    if (keys.current.has('w') || keys.current.has('arrowup')) nextPosition.addScaledVector(forward, moveSpeed);
    if (keys.current.has('s') || keys.current.has('arrowdown')) nextPosition.addScaledVector(forward, -moveSpeed);
    if (keys.current.has('a')) nextPosition.addScaledVector(right, -moveSpeed);
    if (keys.current.has('d')) nextPosition.addScaledVector(right, moveSpeed);
    nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, minX, maxX);
    nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, minZ, maxZ);
    if (!collisionEnabled || !isWalkthroughBlocked(scene, nextPosition.x, nextPosition.z)) {
      camera.position.x = nextPosition.x;
      camera.position.z = nextPosition.z;
    }
    camera.position.y = eyeHeight.current;
    camera.lookAt(
      camera.position.x + forward.x,
      eyeHeight.current + Math.sin(pitch.current),
      camera.position.z + forward.z,
    );
  });

  return null;
}
