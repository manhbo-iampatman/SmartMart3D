import React, { useState, useEffect } from "react";
import { X, CheckCircle, QrCode, Banknote, ArrowLeft, PackageCheck, Scan, Sparkles } from "lucide-react";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";
import { useCheckoutStore, generateOrderCode } from "../../stores/useCheckoutStore";

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen, setIsCartOpen } = useAppStore();
  const { getTotalVND, getTotalItems, clearCart, items } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "cod">("vietqr");
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState(generateOrderCode);

  useEffect(() => {
    if (isCheckoutOpen) {
      setIsSuccess(false);
      const code = generateOrderCode();
      setOrderCode(code);
    }
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const totalVND = getTotalVND();
  const totalItems = getTotalItems();

  const handleFinishPayment = () => {
    setIsSuccess(true);
    useCheckoutStore.getState().confirmPayment();
  };

  const handleClose = () => {
    if (isSuccess) {
      clearCart();
      useCheckoutStore.getState().resetCheckout();
    }
    setIsSuccess(false);
    setIsCheckoutOpen(false);
  };

  const handleBackToCart = () => {
    setIsSuccess(false);
    useCheckoutStore.getState().resetCheckout();
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-sans">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-900 border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header Quầy Self-Checkout 04 chuẩn video tham chiếu */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Self-Checkout 04
              </span>
              <span className="text-[10px] text-slate-400">Siêu thị SmartMart 3D</span>
            </div>
            <h3 className="font-extrabold text-lg mt-1 text-white">
              {isSuccess ? "Thanh Toán Thành Công!" : "Thanh Toán Đơn Hàng"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tiến trình các bước quét hàng (Sequence Tabs) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className={isSuccess ? "text-slate-400" : "text-emerald-700 font-bold"}>
            1. Đặt & Quét mã
          </span>
          <span>➔</span>
          <span className={!isSuccess ? "text-blue-700 font-bold" : "text-slate-400"}>
            2. Thanh toán
          </span>
          <span>➔</span>
          <span className={isSuccess ? "text-emerald-700 font-bold" : "text-slate-400"}>
            3. Túi hàng sẵn sàng
          </span>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider">
                Đã hoàn tất đóng gói
              </span>
              <h4 className="font-black text-xl text-slate-900 mt-1">
                Túi hàng của bạn đã sẵn sàng!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Cảm ơn bạn đã mua sắm tại SmartMart 3D! Nhân viên sẽ giao hàng trong khoảng 30 phút.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Mã đơn hàng: <span className="font-mono font-bold text-blue-600">{orderCode}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Số lượng món:</span>
                <span className="font-bold text-slate-800">{totalItems} món</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Hình thức:</span>
                <span className="font-bold text-slate-800">
                  {paymentMethod === "vietqr" ? "VietQR Ngân Hàng" : "Thanh toán khi nhận hàng (COD)"}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Tổng tiền đã thanh toán:</span>
                <span className="text-blue-600 tabular-nums">{totalVND.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
              >
                Tiếp Tục Mua Sắm
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Tóm tắt danh sách sản phẩm trong giỏ */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{product.name}</span>
                    <span className="text-slate-400">x{quantity}</span>
                  </div>
                  <span className="font-bold text-slate-700 tabular-nums shrink-0">
                    {(product.price * quantity).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              ))}
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setPaymentMethod("vietqr")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  paymentMethod === "vietqr"
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>Quét Mã VietQR</span>
              </button>

              <button
                onClick={() => setPaymentMethod("cod")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  paymentMethod === "cod"
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Tiền Mặt (COD)</span>
              </button>
            </div>

            {/* Chi tiết theo phương thức */}
            {paymentMethod === "vietqr" ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col items-center text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner mb-2.5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=SMARTMART-3D-${orderCode}-AMOUNT-${totalVND}`}
                    alt="VietQR Demo"
                    className="w-32 h-32"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">
                    Mở App Ngân Hàng hoặc Ví Điện Tử để quét mã
                  </p>
                  <p className="text-slate-500">
                    Số tiền:{" "}
                    <span className="font-black text-blue-600 text-sm tabular-nums">
                      {totalVND.toLocaleString("vi-VN")} đ
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mã đơn hàng: <span className="font-mono font-bold text-slate-700">{orderCode}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800">Giao hàng & Thu tiền tận nơi (COD)</p>
                <p>
                  Nhân viên siêu thị SmartMart 3D sẽ đóng gói và giao hàng đến địa chỉ của bạn trong 60 phút. Bạn kiểm tra hàng trước khi thanh toán.
                </p>
                <div className="pt-2 border-t border-slate-200 font-bold text-sm text-slate-900 flex justify-between">
                  <span>Số tiền chuẩn bị:</span>
                  <span className="text-emerald-600 tabular-nums">{totalVND.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            )}

            {/* Nút hoàn tất */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleFinishPayment}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
              >
                <span>Xác Nhận Đặt Hàng ({totalVND.toLocaleString("vi-VN")} đ)</span>
              </button>
              <button
                onClick={handleBackToCart}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại giỏ hàng</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
