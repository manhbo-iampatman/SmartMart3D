import React from "react";
import { ShoppingBag, Box, LayoutGrid, Search, X, Sparkles } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useCartStore } from "../../stores/useCartStore";

export const HeaderNavbar: React.FC = () => {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setIsCartOpen = useAppStore((state) => state.setIsCartOpen);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalVND = useCartStore((state) => state.getTotalVND());

  return (
    <header className="h-14 shrink-0 bg-hyper-card border-b border-hyper-border px-4 md:px-6 flex items-center justify-between gap-4 z-40 select-none shadow-sm font-sans text-hyper-ink">
      {/* 1. Logo & Thương hiệu SmartMart 3D Việt Nam */}
      <button
        type="button"
        onClick={() => setMode("2D")}
        aria-label="Về trang mua nhanh SmartMart 3D"
        className="flex items-center gap-3 text-left rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:ring-offset-2"
      >
        <div className="w-9 h-9 rounded-xl bg-hyper-primary flex items-center justify-center text-white shadow-sm">
          <Box className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-lg md:text-xl tracking-tight text-hyper-ink">
              SmartMart<span className="text-hyper-accent">3D</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-hyper-primary/10 text-hyper-primary border border-hyper-primary/20">
              Việt Nam
            </span>
          </div>
          <p className="text-[11px] text-slate-600 hidden sm:block mt-0.5">
            Đại siêu thị Không gian Lai (Hybrid Hypermarket)
          </p>
        </div>
      </button>

      {/* 2. Thanh tìm kiếm nhanh ở chế độ 2D */}
      {mode === "2D" && (
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm sữa tươi, mì gói, nước ngọt, bánh kẹo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-hyper-surface border border-hyper-border rounded-xl pl-9 pr-8 py-1.5 text-sm text-hyper-ink placeholder-slate-500 focus:outline-none focus:border-hyper-primary focus:ring-2 focus:ring-hyper-primary/30 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-hyper-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Nút gạt chuyển đổi Chế độ 2D <-> 3D */}
      <div className="flex items-center gap-3">
        <div className="bg-hyper-surface p-1 rounded-xl border border-hyper-border flex items-center">
          <button
            type="button"
            aria-pressed={mode === "2D"}
            onClick={() => setMode("2D")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-primary ${
              mode === "2D"
                ? "bg-hyper-primary text-white shadow-sm"
                : "text-slate-600 hover:text-hyper-ink"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mua Nhanh (2D)</span>
          </button>
          <button
            type="button"
            aria-pressed={mode === "3D"}
            onClick={() => setMode("3D")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-accent ${
              mode === "3D"
                ? "bg-hyper-accent text-white shadow-sm"
                : "text-slate-600 hover:text-hyper-ink"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1">
              Khám Phá (3D)
              <Sparkles className="w-3 h-3" />
            </span>
          </button>
        </div>

        {/* 4. Nút Giỏ hàng đồng bộ (Hiển thị tổng VNĐ dạng tabular-nums) */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Giỏ hàng chung (${totalItems} sản phẩm) - ${totalVND.toLocaleString("vi-VN")} đ`}
          className="relative flex items-center gap-2.5 bg-hyper-accent hover:bg-hyper-accent-hover text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors transition-transform shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hyper-accent focus-visible:ring-offset-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[10px] text-orange-50">Giỏ hàng chung</span>
            <span className="text-xs font-black tabular-nums font-num">
              {`${totalVND.toLocaleString("vi-VN")} đ`}
            </span>
          </div>
          {totalItems > 0 && (
            <span
              key={totalItems}
              className="w-5 h-5 rounded-full bg-white text-hyper-accent font-black text-[11px] flex items-center justify-center shadow-sm tabular-nums animate-hyper-cart-bump"
            >
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
