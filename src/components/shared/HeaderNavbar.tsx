import React from "react";
import { ShoppingBag, Box, LayoutGrid, Search, X, Sparkles } from "lucide-react";
import { useAppStore } from "../../stores/useAppStore";
import { useCartStore } from "../../stores/useCartStore";

export const HeaderNavbar: React.FC = () => {
  const { mode, setMode, searchQuery, setSearchQuery, setIsCartOpen } = useAppStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalVND = useCartStore((state) => state.getTotalVND());

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 z-40 select-none shadow-lg">
      {/* 1. Logo & Thương hiệu */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMode("2D")}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Box className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg md:text-xl tracking-tight text-white">
              SmartMart<span className="text-cyan-400">3D</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Việt Nam
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Siêu thị Không gian Lai 2D & 3D
          </p>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm sữa tươi, mì gói, nước ngọt, bánh kẹo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
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

      {/* 3. Nút chuyển đổi Chế độ 2D <-> 3D */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center shadow-inner">
          <button
            onClick={() => setMode("2D")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "2D"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mua Nhanh (2D)</span>
          </button>
          <button
            onClick={() => setMode("3D")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "3D"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1">
              Khám Phá (3D)
              <Sparkles className="w-3 h-3 text-yellow-300" />
            </span>
          </button>
        </div>

        {/* 4. Nút Giỏ hàng đồng bộ */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[10px] text-blue-200">Giỏ hàng chung</span>
            <span className="text-xs font-bold">
              {`${totalVND.toLocaleString("vi-VN")} đ`}
            </span>
          </div>
          {totalItems > 0 && (
            <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-900 font-extrabold text-[11px] flex items-center justify-center shadow-sm">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

