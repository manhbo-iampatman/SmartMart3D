import React, { memo, useEffect, useRef, useState } from "react";
import { Plus, Minus, Check, Box, Eye, Package } from "lucide-react";
import type { Product } from "../../types";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";
import { useFeedbackStore } from "../../stores/useFeedbackStore";
import { playCartSound } from "../../utils/cartSound";

const VND_FORMATTER = new Intl.NumberFormat("vi-VN");

interface Props {
  product: Product;
  onQuickView?: (product: Product) => void;
  staggerIndex?: number;
}

export const ProductCard2D: React.FC<Props> = memo(({ product, onQuickView, staggerIndex }) => {
  const qty = useCartStore(
    (state) => state.items.find((item) => item.product.id === product.id)?.quantity ?? 0
  );
  const [justAdded, setJustAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [product.image2D]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleAddToCart = () => {
    useCartStore.getState().addItem(product);
    const feedback = useFeedbackStore.getState();
    feedback.showCartNotice(product.name, 1);
    if (feedback.soundEnabled) playCartSound();

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setJustAdded(true);
    timerRef.current = window.setTimeout(() => {
      setJustAdded(false);
      timerRef.current = null;
    }, 900);
  };

  const handleGo3D = () => useAppStore.getState().goToProductIn3D(product);
  const handleInspect3D = () => useAppStore.getState().setInspectingProduct(product);

  const staggerStyle =
    staggerIndex !== undefined && staggerIndex < 6
      ? { animationDelay: `${staggerIndex * 35}ms` }
      : undefined;

  return (
    <article
      style={staggerStyle}
      className="animate-hyper-card-rise bg-hyper-card rounded-2xl border border-hyper-border hover:border-hyper-primary/60 hover:-translate-y-1 hover:shadow-lg transition-[transform,box-shadow,border-color] duration-200 flex flex-col overflow-hidden group select-none font-sans"
    >
      {/* Ảnh sản phẩm với Skeleton Shimmer & Fallback khi lỗi */}
      <div className="relative aspect-square w-full bg-hyper-surface overflow-hidden">
        {!imgLoaded && !imgError && <div className="absolute inset-0 hyper-skeleton" aria-hidden="true" />}

        {imgError ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
            style={{ backgroundColor: `${product.color}16` }}
          >
            <Package className="w-9 h-9 text-slate-500 mb-1.5" />
            <span className="text-[11px] font-bold text-slate-700 line-clamp-2">{product.name}</span>
          </div>
        ) : (
          <img
            src={product.image2D}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
            className={`w-full h-full object-cover group-hover:scale-[1.04] transition-[transform,opacity] duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
          />
        )}

        {/* Badge nhận diện 3D vs 2D (Không dùng backdrop-blur-sm trên từng thẻ để cuộn mượt 60FPS) */}
        {product.has3D ? (
          <span className="absolute top-2.5 left-2.5 bg-hyper-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Box className="w-3 h-3" />
            <span>Có mô hình 3D</span>
          </span>
        ) : (
          <span className="absolute top-2.5 left-2.5 bg-hyper-ink/85 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
            2D Mua nhanh
          </span>
        )}

        {/* Nút xem nhanh 360° (has3D: true) hoặc Chi tiết 2D (has3D: false) luôn accessible trên mobile & bàn phím */}
        {product.has3D ? (
          <button
            type="button"
            onClick={handleInspect3D}
            className="absolute bottom-2.5 right-2.5 bg-hyper-card border border-hyper-border hover:border-hyper-primary text-hyper-ink px-2.5 py-1.5 rounded-xl shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none transition-opacity duration-200 flex items-center gap-1 text-xs font-bold"
            title="Xem mô hình 360 độ"
          >
            <Eye className="w-3.5 h-3.5 text-hyper-primary" />
            <span>Xoay 3D</span>
          </button>
        ) : (
          onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="absolute bottom-2.5 right-2.5 bg-hyper-card border border-hyper-border hover:border-hyper-primary text-hyper-ink px-2.5 py-1.5 rounded-xl shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none transition-opacity duration-200 flex items-center gap-1 text-xs font-bold"
              title="Xem chi tiết sản phẩm"
            >
              <Eye className="w-3.5 h-3.5 text-hyper-primary" />
              <span>Xem nhanh</span>
            </button>
          )
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-hyper-primary tracking-normal truncate">
              {product.category}
            </span>
            {product.shelfLocation && (
              <span className="hidden sm:inline text-[10px] font-semibold text-slate-600 shrink-0">
                {product.shelfLocation.aisle.split("(")[0].trim()}
              </span>
            )}
          </div>

          <h4 className="font-bold text-sm text-hyper-ink line-clamp-2 mt-1 leading-snug group-hover:text-hyper-primary transition-colors">
            {product.name}
          </h4>
          <p className="text-xs text-slate-600 mt-1">{product.unit}</p>

          {/* Pill chỉnh nhanh số lượng khi sản phẩm đã có trong giỏ */}
          {qty > 0 && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-blue-50/90 border border-blue-200 px-2.5 py-1 text-[11px]">
              <span className="font-semibold text-slate-700">
                Trong giỏ:{" "}
                <strong className="font-num tabular-nums text-hyper-primary">{qty} sp</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Giảm số lượng ${product.name}`}
                  onClick={() => useCartStore.getState().updateQuantity(product.id, qty - 1)}
                  className="w-5 h-5 rounded-md bg-white border border-blue-200 hover:bg-blue-100 flex items-center justify-center text-hyper-ink focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Tăng số lượng ${product.name}`}
                  onClick={() => useCartStore.getState().updateQuantity(product.id, qty + 1)}
                  className="w-5 h-5 rounded-md bg-white border border-blue-200 hover:bg-blue-100 flex items-center justify-center text-hyper-ink focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-hyper-border/70 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-medium text-slate-600">Giá niêm yết:</div>
            <div className="font-black text-base text-hyper-ink font-num tabular-nums">
              <span>{VND_FORMATTER.format(product.price)}</span>{" "}
              <span className="text-xs font-bold text-hyper-accent">đ</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {product.has3D && (
              <button
                type="button"
                onClick={handleGo3D}
                className="p-2 rounded-xl border border-hyper-border bg-hyper-surface text-slate-700 hover:bg-blue-50 hover:text-hyper-primary hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none transition-colors text-xs font-bold flex items-center gap-1"
                title="Bước vào 3D và đi đến kệ này"
              >
                <Box className="w-3.5 h-3.5 text-hyper-primary" />
                <span className="hidden xl:inline">Tìm trên kệ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-[transform,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none ${
                justAdded
                  ? "bg-hyper-fresh text-white scale-105"
                  : "bg-hyper-primary hover:bg-hyper-primary-hover text-white active:scale-[0.97]"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã thêm</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Chọn mua</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

ProductCard2D.displayName = "ProductCard2D";
