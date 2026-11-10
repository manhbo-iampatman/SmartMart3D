import React, { useEffect, useRef, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, ShieldCheck } from "lucide-react";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";
import type { Product } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CartItemThumb: React.FC<{ product: Product }> = ({ product }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !product.image2D) {
    return (
      <div
        className="w-16 h-16 rounded-lg border border-hyper-border shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-600 select-none"
        style={{ backgroundColor: product.color || "#e2e8f0" }}
      >
        {product.category.slice(0, 6)}
      </div>
    );
  }

  return (
    <img
      src={product.image2D}
      alt={product.name}
      onError={() => setFailed(true)}
      className="w-16 h-16 object-cover rounded-lg bg-hyper-surface border border-hyper-border shrink-0"
    />
  );
};

export const CartDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <CartDrawerSession onClose={onClose} />;
};

const CartDrawerSession: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalVND = useCartStore((state) => state.getTotalVND());
  const totalItems = useCartStore((state) => state.getTotalItems());
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus({ preventScroll: true });
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

  const handleCheckout = () => {
    onClose();
    useAppStore.getState().setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-hyper-ink/60 animate-hyper-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="relative w-full max-w-md bg-hyper-card text-hyper-ink h-full shadow-2xl border-l border-hyper-border flex flex-col z-10 animate-hyper-slide-right"
      >
        {/* Header */}
        <div className="p-4 border-b border-hyper-border flex items-center justify-between bg-hyper-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-hyper-primary/10 text-hyper-primary flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cart-drawer-title" className="font-bold text-base text-hyper-ink">
                Giỏ Hàng SmartMart
              </h2>
              <p className="text-xs text-slate-600">
                Đồng bộ tự động 2D & 3D ({totalItems} sản phẩm)
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Đóng giỏ hàng"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-hyper-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-hyper-surface border border-hyper-border flex items-center justify-center mb-3">
                <ShoppingCart className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">Giỏ hàng của bạn đang trống</p>
              <p className="text-xs text-slate-500 max-w-[240px] mt-1">
                Hãy chọn mua nhanh ở chế độ 2D hoặc bước vào không gian 3D để nhặt đồ trên kệ!
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-hyper-border bg-hyper-card hover:border-hyper-primary/30 hover:shadow-sm transition-colors"
              >
                <CartItemThumb product={product} />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-hyper-ink truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-600">{product.unit}</span>
                    {product.has3D && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-hyper-primary/10 text-hyper-primary font-semibold border border-hyper-primary/20">
                        Có sẵn 3D
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-sm text-hyper-primary mt-1 font-num tabular-nums">
                    {`${(product.price * quantity).toLocaleString("vi-VN")} đ`}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label={`Xóa ${product.name} khỏi giỏ`}
                    onClick={() => removeItem(product.id)}
                    className="text-slate-500 hover:text-red-600 transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary"
                    title="Xóa món này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center border border-hyper-border rounded-lg overflow-hidden bg-hyper-surface">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${product.name}`}
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-hyper-ink font-num tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${product.name}`}
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Tổng tiền & Nút thanh toán */}
        {items.length > 0 && (
          <div className="p-4 border-t border-hyper-border bg-hyper-surface space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tạm tính ({totalItems} món):</span>
                <span className="font-semibold text-hyper-ink font-num tabular-nums">
                  {`${totalVND.toLocaleString("vi-VN")} đ`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí đóng gói siêu thị:</span>
                <span className="font-semibold text-hyper-fresh">Miễn phí</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-hyper-border text-hyper-ink">
                <span className="font-bold text-sm">Tổng cộng thanh toán:</span>
                <span className="font-black text-xl text-hyper-accent font-num tabular-nums">
                  {`${totalVND.toLocaleString("vi-VN")} đ`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-hyper-accent hover:bg-hyper-accent-hover text-white font-extrabold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-colors transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-accent focus-visible:ring-offset-2"
            >
              <span>Thanh Toán Siêu Tốc (VietQR)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-hyper-fresh" />
                <span>Bảo mật & minh bạch 100%</span>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="hover:text-red-600 underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary rounded"
              >
                Xóa tất cả giỏ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

