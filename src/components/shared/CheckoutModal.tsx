import React, { useEffect, useRef } from "react";
import { X, CheckCircle, QrCode, Banknote, ArrowLeft, Scan } from "lucide-react";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";
import { useCheckoutStore } from "../../stores/useCheckoutStore";

export const CheckoutModal: React.FC = () => {
  const isCheckoutOpen = useAppStore((state) => state.isCheckoutOpen);
  const wasOpenRef = useRef(false);

  // Tự động reset khi mở phiên thanh toán mới sau khi đơn trước đã hoàn tất (tương thích Test 2 -> Test 3)
  useEffect(() => {
    if (isCheckoutOpen && !wasOpenRef.current) {
      const checkout = useCheckoutStore.getState();
      if (checkout.phase === "success") {
        checkout.resetCheckout();
      }
    }
    wasOpenRef.current = isCheckoutOpen;
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;
  return <CheckoutModalSession />;
};

const CheckoutModalSession: React.FC = () => {
  const setIsCheckoutOpen = useAppStore((state) => state.setIsCheckoutOpen);
  const setIsCartOpen = useAppStore((state) => state.setIsCartOpen);
  const totalVND = useCartStore((state) => state.getTotalVND());
  const totalItems = useCartStore((state) => state.getTotalItems());
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);
  const phase = useCheckoutStore((state) => state.phase);
  const activeKioskId = useCheckoutStore((state) => state.activeKioskId);
  const orderCode = useCheckoutStore((state) => state.orderCode);
  const paymentMethod = useCheckoutStore((state) => state.paymentMethod);
  const scannedCount = useCheckoutStore((state) => state.scannedCount);
  const setPaymentMethod = useCheckoutStore((state) => state.setPaymentMethod);
  const skipScanning = useCheckoutStore((state) => state.skipScanning);
  const confirmPayment = useCheckoutStore((state) => state.confirmPayment);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isSuccess = phase === "success";
  const isScanning = phase === "scanning";

  const handleFinishPayment = () => {
    confirmPayment();
  };

  const handleClose = () => {
    if (phase === "success") {
      clearCart();
      resetCheckout();
    }
    setIsCheckoutOpen(false);
  };

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (useCheckoutStore.getState().phase === "success") {
          useCartStore.getState().clearCart();
          useCheckoutStore.getState().resetCheckout();
        }
        useAppStore.getState().setIsCheckoutOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  const handleBackToCart = () => {
    resetCheckout();
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  };

  const stationBadge = `Self-Checkout ${activeKioskId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-sans">
      <div
        className="fixed inset-0 bg-hyper-ink/70 animate-hyper-fade-in"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className="relative w-full max-w-lg bg-hyper-card rounded-2xl shadow-2xl overflow-hidden z-10 text-hyper-ink border border-hyper-border animate-hyper-modal-pop"
      >
        {/* Header Quầy Self-Checkout chuẩn Modern Architectural Hypermarket */}
        <div className="bg-hyper-ink text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded bg-hyper-fresh/20 text-emerald-300 border border-hyper-fresh/40">
                {stationBadge}
              </span>
              <span className="text-[11px] text-slate-300">Siêu thị SmartMart 3D</span>
            </div>
            <h3 id="checkout-modal-title" className="font-extrabold text-lg mt-1 text-white">
              {isSuccess
                ? "Thanh Toán Thành Công!"
                : isScanning
                  ? "Đang Quét Hàng Tại Kiosk"
                  : "Thanh Toán Đơn Hàng"}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Đóng thanh toán"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tiến trình 4 bước đồng bộ với useCheckoutStore (Single Source of Truth) */}
        <div className="bg-hyper-surface border-b border-hyper-border px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="text-hyper-fresh font-bold">1. Giỏ hàng</span>
          <span>→</span>
          <span className={isScanning ? "text-hyper-primary font-bold" : "text-hyper-fresh font-bold"}>
            2. Quét mã
          </span>
          <span>→</span>
          <span
            className={
              !isSuccess && !isScanning
                ? "text-hyper-primary font-bold"
                : isSuccess
                  ? "text-hyper-fresh font-bold"
                  : "text-slate-400"
            }
          >
            3. Thanh toán
          </span>
          <span>→</span>
          <span className={isSuccess ? "text-hyper-fresh font-bold" : "text-slate-400"}>
            4. Hoàn tất
          </span>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-hyper-fresh flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-extrabold text-hyper-fresh tracking-wide">
                Đã hoàn tất đóng gói
              </span>
              <h4 className="font-black text-xl text-hyper-ink mt-1">
                Túi hàng của bạn đã sẵn sàng!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Cảm ơn bạn đã mua sắm tại SmartMart 3D! Bạn có thể nhận túi tại khu đóng gói ngay lúc này.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Mã đơn hàng:{" "}
                <span className="font-mono font-bold text-hyper-primary font-num tabular-nums">
                  {orderCode}
                </span>
              </p>
            </div>

            <div className="bg-hyper-surface border border-hyper-border rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Số lượng món:</span>
                <span className="font-bold text-hyper-ink font-num tabular-nums">{totalItems} món</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Hình thức:</span>
                <span className="font-bold text-hyper-ink">
                  {paymentMethod === "vietqr" ? "VietQR Ngân Hàng" : "Thanh toán khi nhận hàng (COD)"}
                </span>
              </div>
              <div className="flex justify-between border-t border-hyper-border pt-2 text-sm font-bold text-hyper-ink">
                <span>Tổng tiền đã thanh toán:</span>
                <span className="text-hyper-primary font-num tabular-nums">
                  {totalVND.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClose}
                className="w-full bg-hyper-fresh hover:bg-hyper-fresh-hover text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Tiếp Tục Mua Sắm
              </button>
            </div>
          </div>
        ) : isScanning ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-hyper-primary flex items-center justify-center mx-auto border border-blue-200">
              <Scan className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-hyper-ink">
                Kiosk đang quét từng sản phẩm ({scannedCount}/{totalItems})
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Mã đơn dự kiến:{" "}
                <span className="font-mono font-bold text-hyper-primary font-num tabular-nums">
                  {orderCode}
                </span>
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => skipScanning(totalItems)}
                className="w-full bg-hyper-primary hover:bg-hyper-primary-hover text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                Chuyển Sang Bước Thanh Toán ({totalVND.toLocaleString("vi-VN")} đ)
              </button>
              <button
                onClick={handleBackToCart}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-hyper-ink flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại giỏ hàng</span>
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
                  className="flex items-center justify-between p-2 rounded-lg bg-hyper-surface border border-hyper-border text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-hyper-fresh shrink-0" />
                    <span className="font-bold text-hyper-ink truncate">{product.name}</span>
                    <span className="text-slate-400 font-num tabular-nums">x{quantity}</span>
                  </div>
                  <span className="font-bold text-slate-700 font-num tabular-nums shrink-0">
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
                    ? "border-hyper-primary bg-blue-50/70 text-hyper-primary shadow-sm"
                    : "border-hyper-border text-slate-600 hover:border-slate-300"
                }`}
              >
                <QrCode className="w-5 h-5 text-hyper-primary" />
                <span>Quét Mã VietQR</span>
              </button>

              <button
                onClick={() => setPaymentMethod("cod")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  paymentMethod === "cod"
                    ? "border-hyper-primary bg-blue-50/70 text-hyper-primary shadow-sm"
                    : "border-hyper-border text-slate-600 hover:border-slate-300"
                }`}
              >
                <Banknote className="w-5 h-5 text-hyper-fresh" />
                <span>Tiền Mặt (COD)</span>
              </button>
            </div>

            {/* Chi tiết theo phương thức */}
            {paymentMethod === "vietqr" ? (
              <div className="bg-hyper-surface border border-hyper-border rounded-xl p-3.5 flex flex-col items-center text-center">
                <div className="bg-white p-2.5 rounded-xl border border-hyper-border mb-2.5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=SMARTMART-3D-${orderCode}-AMOUNT-${totalVND}`}
                    alt="VietQR Demo"
                    className="w-32 h-32"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-hyper-ink">
                    Mở App Ngân Hàng hoặc Ví Điện Tử để quét mã
                  </p>
                  <p className="text-slate-500">
                    Số tiền:{" "}
                    <span className="font-black text-hyper-primary text-sm font-num tabular-nums">
                      {totalVND.toLocaleString("vi-VN")} đ
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mã đơn hàng:{" "}
                    <span className="font-mono font-bold text-hyper-ink font-num tabular-nums">
                      {orderCode}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-hyper-surface border border-hyper-border rounded-xl p-4 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-hyper-ink">Giao hàng & Thu tiền tận nơi (COD)</p>
                <p>
                  Nhân viên siêu thị SmartMart 3D sẽ đóng gói và giao hàng đến địa chỉ của bạn trong 60 phút. Bạn kiểm tra hàng trước khi thanh toán.
                </p>
                <div className="pt-2 border-t border-hyper-border font-bold text-sm text-hyper-ink flex justify-between">
                  <span>Số tiền chuẩn bị:</span>
                  <span className="text-hyper-fresh font-num tabular-nums">
                    {totalVND.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            )}

            {/* Nút hoàn tất phẳng chuẩn Modern Architectural Hypermarket */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleFinishPayment}
                className="w-full bg-hyper-primary hover:bg-hyper-primary-hover text-white font-black py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] font-num tabular-nums"
              >
                <span>Xác Nhận Đặt Hàng ({totalVND.toLocaleString("vi-VN")} đ)</span>
              </button>
              <button
                onClick={handleBackToCart}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-hyper-ink flex items-center justify-center gap-1"
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
