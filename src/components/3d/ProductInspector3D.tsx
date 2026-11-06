import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { X, Plus, ShoppingBag, MapPin, Sparkles } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useCartStore } from "../../stores/useCartStore";

export const ProductInspector3D: React.FC = () => {
  const { inspectingProduct, setInspectingProduct, goToProductIn3D } = useAppStore();
  const { addItem } = useCartStore();

  if (!inspectingProduct) return null;

  const handleAddToCart = () => {
    addItem(inspectingProduct);
    setInspectingProduct(null);
  };

  const handleGoToShelf = () => {
    goToProductIn3D(inspectingProduct);
    setInspectingProduct(null);
  };

  const [w, h, d] = inspectingProduct.dimensions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        onClick={() => setInspectingProduct(null)}
      />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row text-white animate-in zoom-in-95 duration-200">
        {/* Nút đóng */}
        <button
          onClick={() => setInspectingProduct(null)}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khung xem mô hình 3D xoay 360 độ */}
        <div className="w-full md:w-1/2 h-64 md:h-[420px] bg-gradient-to-b from-slate-800 to-slate-950 relative flex items-center justify-center">
          <Canvas camera={{ position: [0, 0, 1.2], fov: 45 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <Stage environment="city" intensity={0.6}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[w * 2.5, h * 2.5, d * 2.5]} />
                <meshStandardMaterial
                  color={inspectingProduct.color}
                  roughness={0.2}
                  metalness={0.15}
                />
              </mesh>
            </Stage>
            <OrbitControls autoRotate autoRotateSpeed={2.5} makeDefault />
          </Canvas>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none px-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Kéo chuột để xoay 360°
            </span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-cyan-300 font-mono">
              3D PBR Preview
            </span>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div>
              <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
                {inspectingProduct.category}
              </span>
              <h2 className="text-xl font-black text-white mt-1 leading-tight">
                {inspectingProduct.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{inspectingProduct.unit}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-xs text-slate-400">Giá niêm yết siêu thị:</div>
              <div className="text-2xl font-black text-cyan-300">
                {inspectingProduct.price.toLocaleString("vi-VN")}{" "}
                <span className="text-sm font-bold text-white">VNĐ</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {inspectingProduct.description}
            </p>

            {inspectingProduct.shelfLocation && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Vị trí trong siêu thị:{" "}
                  <strong className="text-white">
                    {inspectingProduct.shelfLocation.aisle} (Tầng{" "}
                    {inspectingProduct.shelfLocation.shelfTier})
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Hành động */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Bỏ Vào Giỏ Hàng</span>
            </button>

            {inspectingProduct.shelfLocation && (
              <button
                onClick={handleGoToShelf}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl border border-slate-700 text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Đưa Tôi Đến Kệ Hàng Này (3D)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

