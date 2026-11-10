import React from "react";
import { ShoppingBag, Box, LayoutGrid, Search, X, Sparkles } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useCartStore } from "../../stores/useCartStore";

export const HeaderNavbar: React.FC = () => {
  const { mode, setMode, searchQuery, setSearchQuery, setIsCartOpen } = useAppStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalVND = useCartStore((state) => state.getTotalVND());

  return (
    <header className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 z-40 select-none shadow-md font-sans">
      {/* 1. Logo & Thương hiệu SmartMart 3D Việt Nam */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMode("2D")}>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Box className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-lg md:text-xl tracking-tight text-white">
              SmartMart<span className="text-orange-500">3D</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Việt Nam
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
            Đại siêu thị Không gian Lai (Hybrid Hypermarket)
          </p>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm nhanh ở chế độ 2D */}
      {mode === "2D" && (
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm sữa tươi, mì gói, nước ngọt, bánh kẹo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Nút chuyển đổi Chế độ 2D <-> 3D */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 flex items-center shadow-inner">
          <button
            onClick={() => setMode("2D")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "2D"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mua Nhanh (2D)</span>
          </button>
          <button
            onClick={() => setMode("3D")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "3D"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1">
              Khám Phá (3D)
              <Sparkles className="w-3 h-3 text-yellow-200" />
            </span>
          </button>
        </div>

        {/* 4. Nút Giỏ hàng đồng bộ (Hiển thị tổng VNĐ dạng tabular-nums) */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[10px] text-orange-200">Giỏ hàng chung</span>
            <span className="text-xs font-black tabular-nums">
              {`${totalVND.toLocaleString("vi-VN")} đ`}
            </span>
          </div>
          {totalItems > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-orange-600 font-black text-[11px] flex items-center justify-center shadow-sm">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
