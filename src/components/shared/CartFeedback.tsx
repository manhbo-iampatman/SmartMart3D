import React, { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { useFeedbackStore } from "../../stores/useFeedbackStore";
import { useAppStore } from "../../stores/useAppStore";

export const CartFeedback: React.FC = () => {
  const notice = useFeedbackStore((state) => state.notice);
  const dismissNotice = useFeedbackStore((state) => state.dismissNotice);
  const setIsCartOpen = useAppStore((state) => state.setIsCartOpen);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => dismissNotice(notice.id), 3200);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] w-[min(440px,calc(100%-2rem))] pointer-events-none"
    >
      <div className="pointer-events-auto rounded-2xl border border-hyper-fresh/40 bg-hyper-card text-hyper-ink p-4 shadow-xl flex items-start gap-3 animate-hyper-toast-up">
        <div className="w-8 h-8 rounded-full bg-hyper-fresh/10 text-hyper-fresh flex items-center justify-center shrink-0">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-hyper-ink">
            Đã thêm {notice.quantity} sản phẩm vào giỏ
          </p>
          <p className="text-xs text-slate-600 mt-0.5 truncate">{notice.productName}</p>
          <button
            type="button"
            className="mt-2 text-xs font-bold text-hyper-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary rounded"
            onClick={() => {
              dismissNotice(notice.id);
              setIsCartOpen(true);
            }}
          >
            Xem giỏ hàng
          </button>
        </div>
        <button
          type="button"
          aria-label="Đóng thông báo thêm giỏ"
          onClick={() => dismissNotice(notice.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-hyper-ink hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
