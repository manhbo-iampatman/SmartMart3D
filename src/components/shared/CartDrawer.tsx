import React from "react";
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, ShieldCheck } from "lucide-react";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalVND = useCartStore((state) => state.getTotalVND());
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { setIsCheckoutOpen } = useAppStore();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white text-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-800">
                Giỏ Hàng SmartMart
              </h2>
              <p className="text-xs text-slate-500">
                Đồng bộ tự động 2D & 3D ({totalItems} sản phẩm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-600">Giỏ hàng của bạn đang trống</p>
              <p className="text-xs text-slate-400 max-w-[240px] mt-1">
                Hãy chọn mua nhanh ở chế độ 2D hoặc bước vào không gian 3D để nhặt đồ trên kệ!
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-sm transition-all"
              >
                <img
                  src={product.image2D}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-800 truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">{product.unit}</span>
                    {product.has3D && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 font-medium border border-cyan-200">
                        Có sẵn 3D
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-sm text-blue-600 mt-1">
                    {`${(product.price * quantity).toLocaleString("vi-VN")} đ`}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => removeItem(product.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Xóa món này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-slate-700">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors"
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
          <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Tạm tính ({totalItems} món):</span>
                <span className="font-medium text-slate-700">
                  {`${totalVND.toLocaleString("vi-VN")} đ`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí đóng gói siêu thị:</span>
                <span className="font-medium text-emerald-600">Miễn phí</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                <span className="font-bold text-sm">Tổng cộng thanh toán:</span>
                <span className="font-black text-xl text-orange-600 tabular-nums">
                  {`${totalVND.toLocaleString("vi-VN")} đ`}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
            >
              <span>Thanh Toán Siêu Tốc (VietQR)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bảo mật & minh bạch 100%</span>
              </div>
              <button
                onClick={clearCart}
                className="hover:text-red-500 underline transition-colors"
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

