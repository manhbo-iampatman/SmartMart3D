import React from "react";
import { MousePointer2, Eye } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { isSpatialInputBlocked, WALK_REQUEST_EVENT } from "../../utils/spatialInteraction";

export const InteractionHUD: React.FC = () => {
  const state = useAppStore();
  if (isSpatialInputBlocked(state)) return null;
  const { hoveredProduct, hoveredDistance, isPointerLocked, setInspectingProduct } = state;

  return (
    <>
      <div className="absolute inset-0 pointer-events-none grid place-items-center">
        <div
          aria-hidden="true"
          className={`rounded-full border transition-all duration-150 ${
            hoveredProduct ? "w-7 h-7 border-orange-400 bg-orange-400/20" : "w-2.5 h-2.5 border-white/80 bg-white/40 shadow-sm"
          }`}
        />
      </div>

      {hoveredProduct && hoveredDistance !== null && (
        <div
          role="status"
          className="absolute top-1/2 mt-8 left-1/2 -translate-x-1/2 w-[min(380px,calc(100%-2rem))] pointer-events-auto rounded-2xl border border-orange-400/60 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            Trong tầm với · {hoveredDistance.toLocaleString("vi-VN", { minimumFractionDigits: 1 })} m
          </div>
          <p className="mt-1 text-sm font-bold text-white">{hoveredProduct.name}</p>
          <p className="mt-1 text-xs text-slate-300 tabular-nums">
            {hoveredProduct.price.toLocaleString("vi-VN")} đ · {hoveredProduct.unit}
          </p>
          <p className="mt-2.5 text-xs text-slate-300">
            <kbd className="rounded border border-orange-400/40 px-2 py-0.5 font-bold text-orange-300">E</kbd> hoặc click để xem 360°
          </p>
          <button
            onClick={() => setInspectingProduct(hoveredProduct)}
            className="mt-3 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
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
            className="pointer-events-auto self-start rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white shadow-lg flex items-center gap-2"
          >
            <MousePointer2 className="h-4 w-4 text-orange-400" /> Dạo bằng chuột
          </button>
        )}
        <p className="rounded-xl bg-slate-950/85 px-3 py-2 text-[10px] sm:text-xs text-slate-300 backdrop-blur-md">
          {isPointerLocked
            ? "WASD di chuyển · E / click xem hàng · Esc mở con trỏ"
            : "WASD / Cần gạt di chuyển · Vuốt màn hình để nhìn · E / click xem hàng"}
        </p>
      </div>
    </>
  );
};
