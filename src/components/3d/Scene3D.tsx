import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, ContactShadows } from "@react-three/drei";
import { PlayerFPS } from "./PlayerFPS";
import { AisleGondola } from "./AisleGondola";
import { InstancedStock } from "./InstancedStock";
import { useAppStore } from "../../stores/useAppStore";
import { Eye, Move, ShoppingCart, LayoutGrid, Sparkles } from "lucide-react";

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
  const { hoveredProduct, setMode } = useAppStore();

  return (
    <div className="w-full h-full relative select-none bg-slate-950">
      <Canvas
        camera={{ position: [0, 1.65, 4.5], fov: 65 }}
        shadows
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

          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.4}
            scale={20}
            blur={1.5}
            far={4}
          />
        </Suspense>
      </Canvas>

      {/* Tâm ngắm (Crosshair) ở giữa màn hình */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className={`rounded-full border transition-all duration-150 ${
            hoveredProduct
              ? "w-8 h-8 border-cyan-400 bg-cyan-400/20 scale-125"
              : "w-2.5 h-2.5 border-white/80 bg-white/40 shadow-sm"
          }`}
        />
      </div>

      {/* Tooltip khi lia tâm ngắm trúng sản phẩm trên kệ */}
      {hoveredProduct && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/90 border border-cyan-500/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div
            className="w-3.5 h-3.5 rounded-full shrink-0"
            style={{ backgroundColor: hoveredProduct.color }}
          />
          <div>
            <div className="font-bold text-xs text-white">
              {hoveredProduct.name}
            </div>
            <div className="text-[11px] text-cyan-300 font-bold">
              {hoveredProduct.price.toLocaleString("vi-VN")} đ{" "}
              <span className="text-slate-400 font-normal">
                ({hoveredProduct.unit})
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-medium">
            Click chuột để xem
          </span>
        </div>
      )}

      {/* Thanh hướng dẫn điều khiển ở dưới màn hình */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center justify-between">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-slate-300 px-4 py-2 rounded-2xl text-xs flex items-center gap-4 shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white border border-slate-600">
              W A S D
            </span>
            <span>Di chuyển</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white border border-slate-600">
              Chuột
            </span>
            <span>Xoay góc nhìn</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white border border-slate-600">
              Click
            </span>
            <span>Nhặt / Xem sản phẩm</span>
          </div>
        </div>

        {/* Nút quay lại 2D nổi */}
        <button
          onClick={() => setMode("2D")}
          className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs transition-all active:scale-95"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Chuyển Sang Mua Nhanh (2D)</span>
        </button>
      </div>

      {/* Hint bấm chuột để khóa điều khiển */}
      <div className="absolute top-4 left-4 bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Bấm chuột vào màn hình để bắt đầu dạo quanh siêu thị</span>
      </div>
    </div>
  );
};

