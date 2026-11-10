import React, { useEffect, useRef, useState, useMemo } from "react";
import { X, Plus, Minus, MapPin, Pause, Play, RotateCcw, Volume2, VolumeX, ShoppingBag, Sparkles } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useCartStore } from "../../stores/useCartStore";
import { useFeedbackStore } from "../../stores/useFeedbackStore";
import { playCartSound } from "../../utils/cartSound";
import { ProductPreview3D } from "./ProductPreview3D";
import { MOCK_PRODUCTS } from "../../data/mockProducts";
import type { Product } from "../../types";

export const ProductInspector3D: React.FC = () => {
  const product = useAppStore((state) => state.inspectingProduct);
  return product ? <InspectorSession key={product.id} product={product} /> : null;
};

const InspectorSession: React.FC<{ product: Product }> = ({ product: inspectingProduct }) => {
  const { mode, setInspectingProduct, goToProductIn3D, navigateToProductIn3D } = useAppStore();
  const addItem = useCartStore((state) => state.addItem);
  const { soundEnabled, setSoundEnabled, showCartNotice } = useFeedbackStore();
  const [autoRotate, setAutoRotate] = useState(() => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [resetVersion, setResetVersion] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Danh sách sản phẩm gợi ý mua kèm (Cross-selling theo video tham chiếu)
  const crossSellProducts = useMemo(() => {
    return MOCK_PRODUCTS
      .filter((p) => p.id !== inspectingProduct.id)
      .slice(0, 3);
  }, [inspectingProduct.id]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButton.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      const state = useAppStore.getState();
      if (event.key === "Escape" && !state.isCartOpen && !state.isCheckoutOpen) {
        event.preventDefault();
        setInspectingProduct(null);
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [setInspectingProduct]);

  const handleAddToCart = () => {
    // Thêm theo số lượng đã chọn
    for (let i = 0; i < quantity; i++) {
      addItem(inspectingProduct);
    }
    showCartNotice(inspectingProduct.name, quantity);
    if (soundEnabled) playCartSound();
    setInspectingProduct(null);
  };

  const handleQuickAddCrossSell = (crossProduct: Product) => {
    addItem(crossProduct);
    showCartNotice(crossProduct.name, 1);
    if (soundEnabled) playCartSound();
  };

  const handleGoToShelf = () => {
    if (mode === "2D") goToProductIn3D(inspectingProduct);
    else navigateToProductIn3D(inspectingProduct);
    setInspectingProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none pointer-events-none">
      <aside
        role="dialog"
        aria-labelledby="inspector-product-title"
        aria-modal="false"
        className="relative w-full max-w-[440px] h-full bg-white border-l border-slate-200 shadow-2xl overflow-hidden pointer-events-auto flex flex-col text-slate-900 animate-in slide-in-from-right duration-300 font-sans"
      >
        {/* Nút đóng */}
        <button
          ref={closeButton}
          aria-label="Đóng thông tin sản phẩm"
          onClick={() => setInspectingProduct(null)}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khung xem mô hình 3D xoay 360 độ */}
        <div className="w-full h-48 sm:h-60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 relative flex items-center justify-center shrink-0">
          <ProductPreview3D product={inspectingProduct} autoRotate={autoRotate} resetVersion={resetVersion} />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-[10px] text-slate-300">
            <span className="pointer-events-none">Kéo để xoay · Cuộn để phóng to</span>
            <div className="flex gap-1">
              <button
                aria-label={autoRotate ? "Tạm dừng tự xoay" : "Bật tự xoay"}
                aria-pressed={autoRotate}
                onClick={() => setAutoRotate((value) => !value)}
                className="rounded-lg bg-slate-800/90 p-2 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                aria-label="Đặt lại góc nhìn sản phẩm"
                onClick={() => setResetVersion((value) => value + 1)}
                className="rounded-lg bg-slate-800/90 p-2 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="w-full p-5 flex-1 min-h-0 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {inspectingProduct.category}
              </span>
              {inspectingProduct.shelfLocation && (
                <span className="text-[11px] font-medium text-slate-500">
                  {inspectingProduct.shelfLocation.aisle}
                </span>
              )}
            </div>

            <h2 id="inspector-product-title" className="text-lg font-black text-slate-900 mt-1.5 leading-snug">
              {inspectingProduct.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{inspectingProduct.unit}</p>
          </div>

          {/* Bảng giá niêm yết to rõ chuẩn bán lẻ */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500">Giá niêm yết siêu thị:</div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {inspectingProduct.price.toLocaleString("vi-VN")}{" "}
                <span className="text-sm font-bold text-orange-600">VNĐ</span>
              </div>
            </div>

            {/* Bộ tăng giảm số lượng [- 1 +] */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                aria-label="Giảm số lượng"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-slate-800 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                aria-label="Tăng số lượng"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {inspectingProduct.description}
          </p>

          {/* Thông tin bao bì minh họa */}
          <section aria-label="Thông tin bao bì" className="rounded-xl border border-slate-200 p-3 text-xs bg-white">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>Thông tin bao bì</span>
            </h3>
            <dl className="mt-2 space-y-2 text-slate-600 leading-relaxed">
              <div>
                <dt className="font-semibold text-slate-800">Thành phần</dt>
                <dd>{inspectingProduct.labelInfo?.ingredients ?? "Chưa có thông tin từ nhà cung cấp."}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Bảo quản</dt>
                <dd>{inspectingProduct.labelInfo?.storage ?? "Xem hướng dẫn in trên bao bì."}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Hạn sử dụng</dt>
                <dd>{inspectingProduct.labelInfo?.expiry ?? "Xem NSX / HSD in trên bao bì."}</dd>
              </div>
            </dl>
            {inspectingProduct.labelInfo?.isDemo && (
              <p className="mt-2 text-[10px] text-slate-400">
                Mẫu thông tin minh họa, chưa phải dữ liệu nhãn hàng được xác thực.
              </p>
            )}
          </section>

          {/* Vị trí trên kệ hàng */}
          {inspectingProduct.shelfLocation && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Vị trí trong siêu thị:{" "}
                <strong className="text-slate-800">
                  {inspectingProduct.shelfLocation.aisle} (Tầng{" "}
                  {inspectingProduct.shelfLocation.shelfTier})
                </strong>
              </span>
            </div>
          )}

          {/* Gợi ý mua kèm (Frequently Bought Together - Theo Video 2026) */}
          <section className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Thường mua cùng sản phẩm này</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {crossSellProducts.map((cross) => (
                <div
                  key={cross.id}
                  className="p-2 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-slate-50 flex flex-col justify-between"
                >
                  <img
                    src={cross.image2D}
                    alt={cross.name}
                    className="w-full aspect-square object-cover rounded-lg bg-white border border-slate-200/60"
                  />
                  <div className="mt-1.5">
                    <p className="text-[11px] font-bold text-slate-800 truncate" title={cross.name}>
                      {cross.name}
                    </p>
                    <p className="text-[10px] font-black text-orange-600 tabular-nums">
                      {cross.price.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                  <button
                    onClick={() => handleQuickAddCrossSell(cross)}
                    className="mt-1.5 w-full py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    title={`Thêm ${cross.name} vào giỏ`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Mua thêm</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Khung hành động cố định ở đáy panel */}
        <div className="shrink-0 space-y-2 p-4 border-t border-slate-200 bg-white">
          <button
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Âm báo thêm giỏ"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 text-xs text-slate-500 py-0.5 hover:text-slate-800"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            Âm báo thêm giỏ: {soundEnabled ? "Bật" : "Tắt"}
          </button>

          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Bỏ Vào Giỏ Hàng</span>
          </button>

          {inspectingProduct.shelfLocation && (
            <button
              onClick={handleGoToShelf}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl border border-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Đưa Tôi Đến Kệ Hàng Này (3D)</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
