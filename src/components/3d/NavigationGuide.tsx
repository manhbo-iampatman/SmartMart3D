import React, { useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../../stores/useAppStore";
import { useNavigationStore } from "../../stores/useNavigationStore";

export const NavigationGuide: React.FC = () => {
  const activeNavigationProduct = useAppStore(
    (state) => state.activeNavigationProduct
  );
  const beaconRef = useRef<THREE.Group>(null);
  const lineRef = useRef<React.ElementRef<typeof Line>>(null);
  const path = useNavigationStore((state) => state.path);
  const destination = useNavigationStore((state) => state.destination);

  useFrame(({ clock }, delta) => {
    if (lineRef.current) lineRef.current.material.dashOffset -= delta * 0.6;
    if (!beaconRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.12;
    beaconRef.current.scale.setScalar(pulse);
    beaconRef.current.rotation.y = clock.elapsedTime * 0.8;
  });

  const target = activeNavigationProduct?.shelfLocation?.worldPos;
  if (!target || !destination) return null;

  const pathPoints: [number, number, number][] = path.map((point) => [point.x, 0.045, point.z]);

  return (
    <group userData={{ ignoreProductRaycast: true }}>
      {pathPoints.length > 1 && <Line
        ref={lineRef}
        points={pathPoints}
        color="#facc15"
        lineWidth={4}
        dashed
        dashScale={2}
        dashSize={0.28}
        gapSize={0.18}
      />}
      <group ref={beaconRef} position={[destination.x, 0.08, destination.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.045, 10, 32]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#f59e0b"
            emissiveIntensity={2}
          />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.18, 0.42, 16]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#f59e0b"
            emissiveIntensity={1.4}
          />
        </mesh>
        <pointLight color="#facc15" intensity={2} distance={2.4} />
      </group>
    </group>
  );
};
