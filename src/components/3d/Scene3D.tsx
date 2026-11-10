import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { PlayerFPS } from "./PlayerFPS";
import { AisleGondola } from "./AisleGondola";
import { InstancedStock } from "./InstancedStock";
import { NavigationGuide } from "./NavigationGuide";
import { SpatialShopHUD } from "./SpatialShopHUD";
import { StoreFixtures } from "./StoreFixtures";
import { ProductInteraction } from "./ProductInteraction";
import { ShoppingTrolley } from "./ShoppingTrolley";
import { InteractionHUD } from "./InteractionHUD";
import { VirtualJoystick } from "./VirtualJoystick";
import { LoadingScreen } from "../shared/LoadingScreen";
import { useAppStore } from "../../stores/useAppStore";
import { LayoutGrid } from "lucide-react";

// Trần nhà siêu thị với các thanh đèn LED dài
const SupermarketCeiling: React.FC = () => {
  const lightPositions = [-3, -1, 1, 3];
  return (
    <group position={[0, 4.2, 0]}>
      {/* Trần thạch cao */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Dãy đèn tuýp LED dài */}
      {lightPositions.map((z, idx) => (
        <group key={idx} position={[0, -0.05, z]}>
          <mesh>
            <boxGeometry args={[12, 0.08, 0.25]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={2.5}
            />
          </mesh>
          <pointLight intensity={1.5} distance={7} decay={2} color="#f8fafc" />
        </group>
      ))}
    </group>
  );
};

// Sàn gạch siêu thị sáng bóng
const SupermarketFloor: React.FC = () => {
  return (
    <group>
      {/* Sàn chính */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.15}
          metalness={0.05}
        />
      </mesh>

      {/* Vạch sơn phân làn lối đi giữa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[2.8, 14]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.3}
        />
      </mesh>
    </group>
  );
};

export const Scene3D: React.FC = () => {
  const setMode = useAppStore((state) => state.setMode);

  return (
    <div className="w-full h-full relative select-none bg-slate-950">
      <Canvas
        camera={{ position: [0, 1.65, 4.5], fov: 65 }}
        shadows="percentage"
        className="w-full h-full cursor-crosshair"
      >
        <Suspense fallback={null}>
          {/* Ánh sáng */}
          <ambientLight intensity={0.85} color="#ffffff" />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          {/* Điều khiển FPS */}
          <PlayerFPS />

          {/* Môi trường siêu thị */}
          <SupermarketFloor />
          <SupermarketCeiling />
          <AisleGondola />
          <InstancedStock />
          <StoreFixtures />
          <NavigationGuide />
          <ProductInteraction />
          <ShoppingTrolley />

          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.4}
            scale={20}
            blur={1.5}
            far={4}
          />
        </Suspense>
      </Canvas>

      <SpatialShopHUD />
      <InteractionHUD />
      <VirtualJoystick />
      <LoadingScreen />
      <button
        onClick={() => setMode("2D")}
        className="absolute right-4 bottom-16 sm:bottom-4 z-20 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 shadow-xl flex items-center gap-2 text-xs"
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Chuyển Sang Mua Nhanh (2D)</span>
      </button>

    </div>
  );
};

