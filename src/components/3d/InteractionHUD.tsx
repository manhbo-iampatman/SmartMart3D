import React from "react";
import { MousePointer2, Eye } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { isSpatialInputBlocked, WALK_REQUEST_EVENT } from "../../utils/spatialInteraction";

export const InteractionHUD: React.FC = () => {
  const blocked = useAppStore(isSpatialInputBlocked);
  const hoveredProduct = useAppStore((state) => state.hoveredProduct);
  const hoveredDistance = useAppStore((state) => state.hoveredDistance);
  const isPointerLocked = useAppStore((state) => state.isPointerLocked);
  const setInspectingProduct = useAppStore((state) => state.setInspectingProduct);

  if (blocked) return null;

  return (
    <>
      <div className="absolute inset-0 pointer-events-none grid place-items-center">
        <div
          aria-hidden="true"
          className={`rounded-full border transition-all duration-150 ${
            hoveredProduct
              ? "w-7 h-7 border-hyper-accent bg-hyper-accent/20"
              : "w-2.5 h-2.5 border-white/90 bg-white/60 shadow-sm"
          }`}
        />
      </div>

      {hoveredProduct && hoveredDistance !== null && (
        <div
          role="status"
          className="absolute top-1/2 mt-8 left-1/2 -translate-x-1/2 w-[min(380px,calc(100%-2rem))] pointer-events-auto rounded-2xl border border-hyper-accent bg-hyper-card/95 p-4 text-hyper-ink shadow-xl"
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-hyper-accent">
            <span className="h-2 w-2 rounded-full bg-hyper-accent animate-pulse" />
            Trong tầm với · {hoveredDistance.toLocaleString("vi-VN", { minimumFractionDigits: 1 })} m
          </div>
          <p className="mt-1 text-sm font-bold text-hyper-ink">{hoveredProduct.name}</p>
          <p className="mt-1 text-xs font-num tabular-nums text-slate-600">
            {hoveredProduct.price.toLocaleString("vi-VN")} đ · {hoveredProduct.unit}
          </p>
          <p className="mt-2.5 text-xs text-slate-600">
            <kbd className="rounded border border-hyper-border bg-hyper-surface px-2 py-0.5 font-bold text-hyper-ink">E</kbd> hoặc click để xem 360°
          </p>
          <button
            onClick={() => setInspectingProduct(hoveredProduct)}
            className="mt-3 w-full py-2 bg-hyper-accent hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Chạm để xem chi tiết 360°</span>
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none max-w-[calc(100%-2rem)]">
        {!isPointerLocked && (
          <button
            onClick={() => window.dispatchEvent(new Event(WALK_REQUEST_EVENT))}
            className="pointer-events-auto self-start rounded-xl border border-hyper-border bg-hyper-card/95 px-3 py-2 text-xs font-bold text-hyper-ink hover:border-hyper-primary hover:text-hyper-primary shadow-md flex items-center gap-2 transition-colors"
          >
            <MousePointer2 className="h-4 w-4 text-hyper-accent" /> Dạo bằng chuột
          </button>
        )}
        <p className="rounded-xl border border-hyper-border bg-hyper-card/90 px-3 py-2 text-[10px] sm:text-xs font-medium text-slate-700 shadow-sm">
          {isPointerLocked
            ? "WASD di chuyển · E / click xem hàng · Esc mở con trỏ"
            : "WASD / Cần gạt di chuyển · Vuốt màn hình để nhìn · E / click xem hàng"}
        </p>
      </div>
    </>
  );
};
