import React, { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { bakeHypermarketEnvironment } from "../../utils/hypermarketEnvironment";
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

/**
 * Khởi tạo Custom 8-Strip Hypermarket IBL (PMREM), đóng băng shadowMap tĩnh
 * và precompile toàn bộ WebGL shader trước khi thả màn hình chờ (threejs-performance).
 */
const SceneOptimizer: React.FC = () => {
  const { gl, scene, camera } = useThree();
  const isOverviewMode = useAppStore((state) => state.isOverviewMode);

  useEffect(() => {
    let disposed = false;
    let envRenderTarget: THREE.WebGLRenderTarget | null = null;

    const hasWebGL =
      gl &&
      typeof gl.getContext === "function" &&
      Boolean(gl.getContext());

    if (hasWebGL) {
      envRenderTarget = bakeHypermarketEnvironment(gl);
      if (envRenderTarget) {
        scene.environment = envRenderTarget.texture;
        scene.environmentIntensity = 0.36;
      }

      if (gl.shadowMap) {
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
      }

      const compileFn = (gl as unknown as { compileAsync?: (s: THREE.Scene, c: THREE.Camera) => Promise<void> }).compileAsync;
      if (typeof compileFn === "function") {
        void compileFn.call(gl, scene, camera).catch(() => undefined).finally(() => {
          if (!disposed) useAppStore.getState().setIsSceneCompiled(true);
        });
      } else {
        if (typeof gl.compile === "function") gl.compile(scene, camera);
        useAppStore.getState().setIsSceneCompiled(true);
      }
    } else {
      useAppStore.getState().setIsSceneCompiled(true);
    }

    return () => {
      disposed = true;
      if (envRenderTarget) {
        scene.environment = null;
        envRenderTarget.dispose();
      }
    };
  }, [gl, scene, camera]);

  // Chỉ render lại shadow map tĩnh một lần khi thay đổi chế độ ẩn/hiện mái toàn cảnh
  useEffect(() => {
    if (gl?.shadowMap) {
      gl.shadowMap.needsUpdate = true;
    }
  }, [gl, isOverviewMode]);

  return null;
};

export const Scene3D: React.FC = () => {
  const setMode = useAppStore((state) => state.setMode);

  return (
    <div className="w-full h-full relative select-none bg-hyper-surface">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.65, 22.0], fov: 62 }}
        shadows={{ enabled: true, type: THREE.PCFShadowMap }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 0.96,
        }}
        className="w-full h-full cursor-crosshair"
      >
        <color attach="background" args={["#d8e0ea"]} />
        <Suspense fallback={null}>
          <SceneOptimizer />

          {/* Hệ ánh sáng PBR Kiến trúc Siêu thị (Key:Fill ~ 3.8:1, chống bệt phẳng) */}
          <hemisphereLight args={["#f8fafc", "#64748b", 0.38]} />
          <ambientLight intensity={0.1} color="#ffffff" />
          <directionalLight
            position={[14, 24, 16]}
            intensity={1.55}
            color="#fffcf7"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0002}
            shadow-normalBias={0.014}
            shadow-radius={2.2}
            shadow-intensity={0.78}
            shadow-camera-left={-22}
            shadow-camera-right={22}
            shadow-camera-top={29}
            shadow-camera-bottom={-29}
            shadow-camera-near={2}
            shadow-camera-far={58}
          />
          <directionalLight position={[-12, 14, -14]} intensity={0.28} color="#eef6ff" />

          {/* Điều khiển FPS */}
          <PlayerFPS />

          {/* Vỏ công trình kiến trúc đại siêu thị 40m x 54m */}
          <SupermarketStructure />

          {/* Kệ hàng & Nội thất mua sắm hợp nhất */}
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
        </Suspense>
      </Canvas>

      <SpatialShopHUD />
      <InteractionHUD />
      <VirtualJoystick />
      <LoadingScreen waitForCompile />
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
