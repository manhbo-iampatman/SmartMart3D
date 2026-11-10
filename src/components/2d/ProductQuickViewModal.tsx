import React, { useEffect, useRef, useState } from "react";
import { X, Plus, Minus, ShoppingBag, Package, ShieldCheck } from "lucide-react";
import type { Product } from "../../types";
import { getZoneForProduct } from "../../data/storeZones";
import { useCartStore } from "../../stores/useCartStore";
import { useFeedbackStore } from "../../stores/useFeedbackStore";
import { playCartSound } from "../../utils/cartSound";

const VND_FORMATTER = new Intl.NumberFormat("vi-VN");

interface Props {
  product: Product | null;
  onClose: () => void;
}

export const ProductQuickViewModal: React.FC<Props> = ({ product, onClose }) => {
  return product ? <QuickViewDialog key={product.id} product={product} onClose={onClose} /> : null;
};

const QuickViewDialog: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const zone = getZoneForProduct(product);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  const handleAdd = () => {
    const { addItem } = useCartStore.getState();
    const { soundEnabled, showCartNotice } = useFeedbackStore.getState();
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    showCartNotice(product.name, quantity);
    if (soundEnabled) playCartSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans select-none">
      <div
        className="fixed inset-0 bg-hyper-ink/60 animate-hyper-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-2d-title"
        className="relative z-10 w-full max-w-xl rounded-2xl bg-hyper-card border border-hyper-border shadow-2xl overflow-hidden text-hyper-ink animate-hyper-modal-pop"
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-hyper-surface border-b border-hyper-border">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${zone.badgeBgClass} ${zone.badgeTextClass}`}>
              {zone.shortLabel}
            </span>
            <span className="text-xs font-semibold text-slate-600 truncate">
              2D Mua nhanh
            </span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Đóng chi tiết sản phẩm"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/80 flex items-center justify-center text-slate-600 hover:text-hyper-ink focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          <div className="sm:col-span-5 relative aspect-square rounded-xl bg-hyper-surface border border-hyper-border overflow-hidden">
            {!imgLoaded && !imgError && <div className="absolute inset-0 hyper-skeleton" aria-hidden="true" />}
            {imgError ? (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
                style={{ backgroundColor: `${product.color}18` }}
              >
                <Package className="w-10 h-10 text-slate-500 mb-2" />
                <span className="text-xs font-bold text-slate-700 line-clamp-2">{product.name}</span>
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
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>

          <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-hyper-primary">{product.category}</span>
              <h3 id="quickview-2d-title" className="text-lg font-extrabold text-hyper-ink leading-snug">
                {product.name}
              </h3>
              <p className="text-xs text-slate-600">Quy cách: {product.unit}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
            </div>

            {product.labelInfo && (
              <div className="rounded-xl bg-hyper-surface border border-hyper-border p-3 text-xs space-y-1 text-slate-600">
                <p>
                  <strong className="text-hyper-ink">Thành phần:</strong> {product.labelInfo.ingredients}
                </p>
                <p>
                  <strong className="text-hyper-ink">Bảo quản:</strong> {product.labelInfo.storage}
                </p>
                <p>
                  <strong className="text-hyper-ink">Hạn sử dụng:</strong> {product.labelInfo.expiry}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-hyper-fresh shrink-0" />
              <span>Đồng bộ giỏ hàng ngay sang không gian 3D & Kiosk thanh toán</span>
            </div>

            <div className="pt-3 border-t border-hyper-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-slate-600">Giá bán lẻ</div>
                <div className="font-black text-xl text-hyper-ink font-num tabular-nums">
                  {VND_FORMATTER.format(product.price)}{" "}
                  <span className="text-sm font-bold text-hyper-accent">đ</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-hyper-border rounded-xl bg-hyper-surface overflow-hidden">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-9 flex items-center justify-center hover:bg-slate-200/80 text-hyper-ink transition-colors focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold font-num tabular-nums text-hyper-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-9 flex items-center justify-center hover:bg-slate-200/80 text-hyper-ink transition-colors focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="bg-hyper-accent hover:bg-hyper-accent-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.97] transition-transform focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Thêm vào giỏ hàng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
