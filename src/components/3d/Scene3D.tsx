import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { PlayerFPS } from "./PlayerFPS";
import { AisleGondola } from "./AisleGondola";
import { InstancedStock } from "./InstancedStock";
import { NavigationGuide } from "./NavigationGuide";
import { SpatialShopHUD } from "./SpatialShopHUD";
import { StoreFixtures } from "./StoreFixtures";
import { SupermarketStructure } from "./SupermarketStructure";
import { ProduceSection } from "./ProduceSection";
import { ApparelSection } from "./ApparelSection";
import { CheckoutBank } from "./CheckoutBank";
import { CartCorral } from "./CartCorral";
import { ProductInteraction } from "./ProductInteraction";
import { ShoppingTrolley } from "./ShoppingTrolley";
import { InteractionHUD } from "./InteractionHUD";
import { VirtualJoystick } from "./VirtualJoystick";
import { LoadingScreen } from "../shared/LoadingScreen";
import { useAppStore } from "../../stores/useAppStore";
import { LayoutGrid } from "lucide-react";

export const Scene3D: React.FC = () => {
  const setMode = useAppStore((state) => state.setMode);

  return (
    <div className="w-full h-full relative select-none bg-hyper-surface">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 1.65, 4.5], fov: 65 }}
        shadows="soft"
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        className="w-full h-full cursor-crosshair"
      >
        <color attach="background" args={["#f1f5f9"]} />
        <Suspense fallback={null}>
          {/* Ánh sáng tổng thể đại siêu thị kiến trúc sáng PBR */}
          <hemisphereLight args={["#ffffff", "#e2e8f0", 0.55]} />
          <ambientLight intensity={0.45} color="#ffffff" />
          <directionalLight
            position={[10, 18, 12]}
            intensity={1.35}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.035}
            shadow-camera-left={-26}
            shadow-camera-right={26}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-camera-near={1}
            shadow-camera-far={65}
          />

          {/* Điều khiển FPS */}
          <PlayerFPS />

          {/* Vỏ công trình kiến trúc đại siêu thị 40m x 54m (Phase 1) */}
          <SupermarketStructure />

          {/* Kệ hàng & Nội thất mua sắm */}
          <AisleGondola />
          <ProduceSection />
          <ApparelSection />
          <CheckoutBank />
          <CartCorral />
          <InstancedStock />
          <StoreFixtures />
          <NavigationGuide />
          <ProductInteraction />
          <ShoppingTrolley />

          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.4}
            scale={40}
            blur={1.5}
            far={4}
            frames={1}
            resolution={256}
          />
        </Suspense>
      </Canvas>

      <SpatialShopHUD />
      <InteractionHUD />
      <VirtualJoystick />
      <LoadingScreen />
      <button
        onClick={() => setMode("2D")}
        className="absolute right-4 bottom-4 z-20 rounded-xl bg-hyper-primary hover:bg-hyper-primary-hover text-white font-bold px-3.5 py-2.5 shadow-xl flex items-center gap-2 text-xs transition-colors"
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Chuyển Sang Mua Nhanh (2D)</span>
      </button>

    </div>
  );
};

