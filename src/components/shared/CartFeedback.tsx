import React, { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { useFeedbackStore } from "../../stores/useFeedbackStore";
import { useAppStore } from "../../stores/useAppStore";

export const CartFeedback: React.FC = () => {
  const { notice, dismissNotice } = useFeedbackStore();
  const setIsCartOpen = useAppStore((state) => state.setIsCartOpen);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => dismissNotice(notice.id), 3200);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] w-[min(440px,calc(100%-2rem))] rounded-2xl border border-emerald-300 bg-emerald-950/95 text-white p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-emerald-300 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Đã thêm {notice.quantity} sản phẩm vào giỏ</p>
        <p className="text-xs text-emerald-100 mt-1 truncate">{notice.productName}</p>
        <button className="mt-2 text-xs font-bold text-emerald-300 underline" onClick={() => {
          dismissNotice(notice.id);
          setIsCartOpen(true);
        }}>Xem giỏ hàng</button>
      </div>
      <button aria-label="Đóng thông báo thêm giỏ" onClick={() => dismissNotice(notice.id)} className="p-1 text-emerald-200">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
