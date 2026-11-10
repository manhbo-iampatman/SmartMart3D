import React from "react";
import { MapPin, Navigation, Pause, Play, X } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useNavigationStore } from "../../stores/useNavigationStore";

export const NavigationPanel: React.FC = () => {
  const product = useAppStore((state) => state.activeNavigationProduct);
  const stop = useAppStore((state) => state.setActiveNavigationProduct);
  const distance = useNavigationStore((state) => state.distance);
  const status = useNavigationStore((state) => state.status);
  const autoWalking = useNavigationStore((state) => state.autoWalking);
  const setAutoWalking = useNavigationStore((state) => state.setAutoWalking);
  const destination = useNavigationStore((state) => state.destination);
  const setDestination = useNavigationStore((state) => state.setDestination);

  if (!product) return null;
  const title = status === "arrived" ? "Đã đến kệ" : status === "unreachable" ? "Chưa tìm được lối đi" : "Đang dẫn đến kệ";

  return (
    <section
      aria-label="Hướng dẫn đến kệ"
      className="absolute left-4 bottom-28 sm:bottom-24 w-[min(340px,calc(100%-2rem))] rounded-2xl border border-hyper-fresh bg-hyper-card/95 p-3 text-hyper-ink shadow-xl pointer-events-auto"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-hyper-fresh grid place-items-center shrink-0">
          <Navigation className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p role="status" className="text-[10px] uppercase tracking-widest font-bold text-hyper-fresh">
            {title}
          </p>
          <p className="truncate text-xs font-black mt-1 text-hyper-ink">{product.name}</p>
          <p className="flex items-center gap-1 mt-1 text-[10px] text-slate-600">
            <MapPin className="w-3 h-3" />
            {product.shelfLocation?.aisle} · Tầng {product.shelfLocation?.shelfTier}
          </p>
        </div>
        <button aria-label="Dừng dẫn đường" onClick={() => stop(null)} className="text-slate-500 hover:text-hyper-ink transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      {status === "navigating" && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs font-num tabular-nums text-slate-700">
            Còn {distance?.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} m
          </p>
          <button
            onClick={() => setAutoWalking(!autoWalking)}
            className="rounded-lg bg-hyper-fresh hover:bg-emerald-600 text-white px-3 py-2 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          >
            {autoWalking ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {autoWalking ? "Dừng tự đi" : "Tự động đi tới kệ"}
          </button>
        </div>
      )}
      {status === "arrived" && <p className="mt-2 text-[10px] font-medium text-emerald-700">Ngắm sản phẩm rồi bấm E hoặc click để xem.</p>}
      {status === "unreachable" && (
        <button className="mt-2 text-xs font-semibold text-amber-700 underline" onClick={() => setDestination(destination)}>
          Thử tìm lại đường
        </button>
      )}
    </section>
  );
};
