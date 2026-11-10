import React, { useMemo, useState } from "react";
import {
  ChevronRight,
  Map as MapIcon,
  ScanLine,
  Search,
  ShoppingCart,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { ALL_PRODUCTS } from "../../data/catalog";
import { useAppStore } from "../../stores/useAppStore";
import { useCartStore } from "../../stores/useCartStore";
import { matchesProduct } from "../../utils/productSearch";
import { FloorPlanMap } from "./FloorPlanMap";
import { NavigationPanel } from "./NavigationPanel";
import { updateAudioMuteState } from "../../utils/supermarketAudio";

const ALL_CATEGORIES = "Tất cả";

interface HudCategoryTab {
  label: string;
  categories?: readonly string[];
}

const HUD_CATEGORY_TABS: readonly HudCategoryTab[] = [
  { label: ALL_CATEGORIES },
  { label: "Đồ uống", categories: ["Nước Giải Khát", "Bia & Đồ Uống Có Cồn"] },
  { label: "Sữa & Cà phê", categories: ["Sữa & Sản Phẩm Từ Sữa", "Cà Phê & Trà"] },
  { label: "Bánh & Mì", categories: ["Bánh Kẹo & Snack", "Mì & Đồ Khô"] },
  { label: "Gia vị", categories: ["Gia Vị & Nấu Ăn"] },
  { label: "Rau củ tươi", categories: ["Gia Vị & Nông Sản"] },
  { label: "Thời trang", categories: ["Thời Trang & Phụ Kiện"] },
  { label: "Gia đình", categories: ["Chăm Sóc Gia Đình"] },
];

export const SpatialShopHUD: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const navigate = useAppStore((state) => state.navigateToProductIn3D);
  const openIn2D = useAppStore((state) => state.openProductIn2D);
  const setIsCartOpen = useAppStore((state) => state.setIsCartOpen);
  const setIsCheckoutOpen = useAppStore((state) => state.setIsCheckoutOpen);
  const isAudioMuted = useAppStore((state) => state.isAudioMuted);
  const toggleAudioMuted = useAppStore((state) => state.toggleAudioMuted);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalVND = useCartStore((state) => state.getTotalVND());

  const catalog = ALL_PRODUCTS;
  const activeTab = useMemo(
    () => HUD_CATEGORY_TABS.find((tab) => tab.label === selectedCategory) ?? HUD_CATEGORY_TABS[0],
    [selectedCategory]
  );

  const filteredProducts = useMemo(() => {
    return catalog.filter((product) => {
      const matchesCategory =
        !activeTab.categories || activeTab.categories.includes(product.category);
      return matchesCategory && matchesProduct(product, query);
    });
  }, [catalog, query, activeTab]);

  const showResults =
    query.trim().length > 0 || selectedCategory !== ALL_CATEGORIES;
  const navigateToProduct = (product: (typeof catalog)[number]) => {
    if (product.has3D && product.shelfLocation) navigate(product);
    else openIn2D(product);
    setQuery("");
    setSelectedCategory(ALL_CATEGORIES);
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none text-slate-900">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(880px,calc(100%-2rem))] pointer-events-auto font-sans">
        <div className="rounded-2xl border border-hyper-border bg-hyper-card/95 shadow-xl shadow-slate-950/10 p-2 flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
            <input
              aria-label="Tìm sản phẩm trong siêu thị 3D"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm Coca-Cola, Vinamilk, Hảo Hảo..."
              className="w-full h-10 rounded-xl bg-slate-100/90 border border-slate-200 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            {query && (
              <button
                aria-label="Xóa tìm kiếm 3D"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            aria-label="Mở bản đồ siêu thị"
            aria-pressed={isMapOpen}
            onClick={() => {
              setIsMapOpen((open) => !open);
              setQuery("");
              setSelectedCategory(ALL_CATEGORIES);
            }}
            className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-colors ${
              isMapOpen
                ? "bg-hyper-primary border-hyper-primary text-white"
                : "bg-hyper-card border-hyper-border text-hyper-ink hover:bg-hyper-surface"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Bản đồ</span>
          </button>

          <button
            aria-label={isAudioMuted ? "Bật âm thanh siêu thị" : "Tắt âm thanh siêu thị"}
            aria-pressed={!isAudioMuted}
            onClick={() => {
              const nextMuted = !isAudioMuted;
              toggleAudioMuted();
              updateAudioMuteState(nextMuted);
            }}
            className={`h-10 w-10 shrink-0 rounded-xl border grid place-items-center transition-colors ${
              !isAudioMuted
                ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
                : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
            }`}
            title={isAudioMuted ? "Bật âm thanh siêu thị" : "Tắt âm thanh siêu thị"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            aria-label={`Mở giỏ hàng, ${totalItems} sản phẩm`}
            onClick={() => setIsCartOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-hyper-fresh hover:bg-hyper-fresh-hover text-white flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-black text-xs whitespace-nowrap tabular-nums">
              {totalVND.toLocaleString("vi-VN")} đ
            </span>
            {totalItems > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-amber-300 text-emerald-950 text-[10px] font-black grid place-items-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {HUD_CATEGORY_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setSelectedCategory(tab.label)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                selectedCategory === tab.label
                  ? "border-hyper-primary bg-hyper-primary text-white shadow-sm"
                  : "border-hyper-border bg-hyper-card/95 text-hyper-ink hover:bg-hyper-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showResults && (
          <div className="mt-2 ml-auto w-full sm:w-[420px] max-h-72 overflow-y-auto rounded-2xl border border-hyper-border bg-hyper-card/95 shadow-2xl p-2">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {filteredProducts.length} sản phẩm trong danh mục
            </div>
            {filteredProducts.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-slate-500">
                Không tìm thấy sản phẩm phù hợp.
              </p>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigateToProduct(product)}
                  className="w-full flex items-center gap-3 rounded-xl p-2 text-left hover:bg-emerald-50 transition-colors"
                >
                  <span
                    className="w-9 h-9 rounded-lg border border-slate-200 shrink-0"
                    style={{ backgroundColor: product.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-800">
                      {product.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {product.has3D && product.shelfLocation ? product.shelfLocation.aisle : "Có sẵn ở chế độ Mua Nhanh 2D"} · {product.price.toLocaleString("vi-VN")} đ
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    {product.has3D && product.shelfLocation ? "Dẫn đường" : "Mua nhanh 2D"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {isMapOpen && <FloorPlanMap onClose={() => setIsMapOpen(false)} />}
      <NavigationPanel />

      {totalItems > 0 && (
        <button
          onClick={() => setIsCheckoutOpen(true)}
          className="absolute right-4 bottom-16 pointer-events-auto rounded-2xl bg-hyper-accent hover:bg-hyper-accent-hover text-white px-4 py-3 shadow-xl shadow-orange-600/25 flex items-center gap-2 text-xs font-black transition-all active:scale-95"
        >
          <ScanLine className="w-4 h-4" />
          Tới quầy thanh toán
        </button>
      )}
    </div>
  );
};
