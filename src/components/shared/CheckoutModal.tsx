import React, { useState } from "react";
import { X, CheckCircle, QrCode, CreditCard, Banknote, ArrowLeft, Printer } from "lucide-react";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen } = useAppStore();
  const { items, getTotalVND, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "cod">("vietqr");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isCheckoutOpen) return null;

  const totalVND = getTotalVND();
  const orderCode = `SM3D-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleFinishPayment = () => {
    setIsSuccess(true);
    setTimeout(() => {
      // Keep state for modal, clear on close
    }, 100);
  };

  const handleClose = () => {
    if (isSuccess) {
      clearCart();
    }
    setIsSuccess(false);
    setIsCheckoutOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-900 border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
              Quầy Thu Ngân SmartMart
            </span>
            <h3 className="font-extrabold text-lg mt-1">
              {isSuccess ? "Thanh Toán Thành Công!" : "Thanh Toán Đơn Hàng"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-xl text-slate-900">
                Cảm ơn bạn đã mua sắm tại SmartMart 3D!
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                Mã đơn hàng: <span className="font-mono font-bold text-blue-600">{orderCode}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Số lượng món:</span>
                <span className="font-bold text-slate-800">{items.length} món</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Hình thức:</span>
                <span className="font-bold text-slate-800">
                  {paymentMethod === "vietqr" ? "VietQR Ngân Hàng" : "Thanh toán khi nhận hàng (COD)"}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Tổng tiền đã thanh toán:</span>
                <span className="text-blue-600">{totalVND.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                Tiếp Tục Mua Sắm
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Phương thức thanh toán */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("vietqr")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  paymentMethod === "vietqr"
                    ? "border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm"
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
                    ? "border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Tiền Mặt (COD)</span>
              </button>
            </div>

            {/* Chi tiết theo phương thức */}
            {paymentMethod === "vietqr" ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-inner mb-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SMARTMART-3D-${orderCode}-AMOUNT-${totalVND}`}
                    alt="VietQR Demo"
                    className="w-36 h-36"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">
                    Mở App Ngân Hàng hoặc Ví Điện Tử để quét mã
                  </p>
                  <p className="text-slate-500">
                    Số tiền:{" "}
                    <span className="font-black text-blue-600 text-base">
                      {totalVND.toLocaleString("vi-VN")} đ
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Nội dung CK: <span className="font-mono font-semibold">{orderCode}</span>
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
                  <span className="text-emerald-600">{totalVND.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            )}

            {/* Nút hoàn tất */}
            <div className="space-y-2">
              <button
                onClick={handleFinishPayment}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <span>Xác Nhận Đặt Hàng ({totalVND.toLocaleString("vi-VN")} đ)</span>
              </button>
              <button
                onClick={handleClose}
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

