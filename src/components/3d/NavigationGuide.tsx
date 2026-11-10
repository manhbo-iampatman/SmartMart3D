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

  const underlayPoints: [number, number, number][] = path.map((point) => [point.x, 0.045, point.z]);
  const dashPoints: [number, number, number][] = path.map((point) => [point.x, 0.049, point.z]);

  return (
    <group userData={{ ignoreProductRaycast: true }}>
      {underlayPoints.length > 1 && (
        <>
          <Line
            points={underlayPoints}
            color="#0f172a"
            lineWidth={6.5}
            raycast={() => {}}
          />
          <Line
            ref={lineRef}
            points={dashPoints}
            color="#ff5400"
            lineWidth={3.5}
            dashed
            dashScale={2}
            dashSize={0.28}
            gapSize={0.18}
            raycast={() => {}}
          />
        </>
      )}
      <group ref={beaconRef} position={[destination.x, 0.08, destination.z]}>
        {/* Vòng định vị sát mặt sàn (worldY = 0.018) chống chìm trên nền sáng */}
        <mesh position={[0, -0.062, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3} raycast={() => {}}>
          <ringGeometry args={[0.36, 0.5, 32]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.35} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
          <torusGeometry args={[0.34, 0.045, 10, 32]} />
          <meshStandardMaterial
            color="#ff5400"
            emissive="#ea580c"
            emissiveIntensity={1.6}
          />
        </mesh>
        <mesh position={[0, 0.6, 0]} raycast={() => {}}>
          <coneGeometry args={[0.18, 0.42, 16]} />
          <meshStandardMaterial
            color="#ff5400"
            emissive="#ea580c"
            emissiveIntensity={1.2}
          />
        </mesh>
        {/* Cột halo dọc giúp nhìn thấy đích từ xa qua các kệ cao 1.95m */}
        <mesh position={[0, 0.9, 0]} renderOrder={3} raycast={() => {}}>
          <cylinderGeometry args={[0.12, 0.22, 1.8, 16, 1, true]} />
          <meshBasicMaterial
            color="#ff5400"
            transparent
            opacity={0.15}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};
