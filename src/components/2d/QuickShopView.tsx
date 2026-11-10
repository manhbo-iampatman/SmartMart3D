import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Search,
  X,
  ShieldCheck,
  Leaf,
  QrCode,
  PackageCheck,
  ArrowUp,
  RotateCcw,
} from "lucide-react";
import { ALL_PRODUCTS } from "../../data/catalog";
import { STORE_ZONES_CONFIG, groupProductsByZone, type StoreZoneId } from "../../data/storeZones";
import { useAppStore } from "../../stores/useAppStore";
import { matchesProduct } from "../../utils/productSearch";
import { Product } from "../../types";
import { DepartmentSection } from "./DepartmentSection";
import { ProductQuickViewModal } from "./ProductQuickViewModal";

const SERVICE_TRUST_ITEMS = [
  {
    icon: Leaf,
    title: "Nông sản VietGAP mỗi ngày",
    desc: "Bàn trưng bày tươi sống cánh Đông-Bắc",
    colorClass: "text-hyper-fresh bg-emerald-50 border-emerald-200",
  },
  {
    icon: Box,
    title: "Đồng bộ giỏ hàng 2D ↔ 3D",
    desc: "Thêm ở 2D, tiếp tục đẩy xe đẩy trong 3D",
    colorClass: "text-hyper-primary bg-blue-50 border-blue-200",
  },
  {
    icon: QrCode,
    title: "Thanh toán VietQR & COD 4 bước",
    desc: "Định tuyến tự động tới 8 Kiosk SCO-01..08",
    colorClass: "text-hyper-accent bg-orange-50 border-orange-200",
  },
  {
    icon: PackageCheck,
    title: "Đóng túi siêu thị miễn phí",
    desc: "Tách riêng thực phẩm và hóa phẩm an toàn",
    colorClass: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
] as const;

export const QuickShopView: React.FC = () => {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const selectedCategory = useAppStore((state) => state.selectedCategory);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setMode = useAppStore((state) => state.setMode);

  const deferredSearch = useDeferredValue(searchQuery);
  const [activeZoneId, setActiveZoneId] = useState<StoreZoneId>(STORE_ZONES_CONFIG[0].id);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<StoreZoneId, HTMLElement | null>>>({});
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of ALL_PRODUCTS) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  const categories = useMemo(() => {
    return ["Tất cả", ...Array.from(categoryCounts.keys())];
  }, [categoryCounts]);

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      const matchCat =
        selectedCategory === "Tất cả" || product.category === selectedCategory;
      const matchSearch = matchesProduct(product, deferredSearch);
      return matchCat && matchSearch;
    });
  }, [deferredSearch, selectedCategory]);

  const zoneGroups = useMemo(
    () => groupProductsByZone(filteredProducts),
    [filteredProducts]
  );

  // Giao diện Scroll-Spy bám sát vị trí phân khu trong container cuộn (an toàn JSDOM)
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const scrollRoot = rootRef.current?.closest(".overflow-y-auto") ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveZoneId(entry.target.id as StoreZoneId);
            break;
          }
        }
      },
      {
        root: scrollRoot,
        rootMargin: "-90px 0px -60% 0px",
        threshold: 0.05,
      }
    );

    for (const group of zoneGroups) {
      const el = sectionRefs.current[group.zone.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [zoneGroups]);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const scrollToZone = (zoneId: StoreZoneId) => {
    if (selectedCategory !== "Tất cả") {
      setSelectedCategory("Tất cả");
    }
    setActiveZoneId(zoneId);
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    isProgrammaticScrollRef.current = true;
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      scrollTimerRef.current = null;
    }, 450);

    window.requestAnimationFrame(() => {
      const el = sectionRefs.current[zoneId];
      el?.scrollIntoView?.({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const scrollToTop = () => {
    const scrollRoot = rootRef.current?.closest(".overflow-y-auto");
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    scrollRoot?.scrollTo?.({
      top: 0,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  };

  return (
    <div ref={rootRef} className="w-full min-h-full font-sans text-hyper-ink">
      {/* 1. Thanh Điều Hướng Phân Khu Bám Dính (Sticky top-0 không khe hở) */}
      <nav
        aria-label="Điều hướng nhanh 5 phân khu siêu thị"
        className="sticky top-0 z-30 bg-hyper-card/95 border-b border-hyper-border shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-12 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="hidden lg:inline text-xs font-bold text-slate-600 shrink-0 mr-1">
            Phân khu:
          </span>
          {STORE_ZONES_CONFIG.map((zone) => {
            const isActive = activeZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => scrollToZone(zone.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none ${
                  isActive
                    ? `${zone.badgeBgClass} ${zone.badgeTextClass}`
                    : "bg-hyper-surface border-hyper-border text-slate-700 hover:bg-white hover:text-hyper-ink"
                }`}
              >
                {zone.shortLabel}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Nội dung Storefront */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 sm:pt-6 pb-12 space-y-6 sm:space-y-8">
        {/* Tìm kiếm nhanh dành riêng cho Mobile (< md, HeaderNavbar ẩn ô tìm kiếm desktop) */}
        <div className="md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              aria-label="Tìm sản phẩm trên điện thoại"
              placeholder="Tìm nhanh sản phẩm trong siêu thị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-hyper-card border border-hyper-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-hyper-ink placeholder-slate-500 focus:outline-none focus:border-hyper-primary focus:ring-2 focus:ring-hyper-primary/30"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm nhanh"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-hyper-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Architectural Split Hero Banner */}
        <section
          aria-label="Giới thiệu SmartMart 3D Hypermarket"
          className="rounded-2xl overflow-hidden bg-hyper-ink text-white border border-slate-800 shadow-md grid grid-cols-1 lg:grid-cols-12"
        >
          <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-center space-y-4">
            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-hyper-primary/20 text-blue-200 text-xs font-bold border border-hyper-primary/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Mô hình Mua Sắm Lai (Hybrid 2D &amp; 3D) đầu tiên tại Việt Nam</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
              Siêu thị Trực Tuyến Chuẩn Kiến Trúc &amp; Không Gian 3D
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
              Mỗi ngành hàng được phân khu rõ ràng từ Nông sản tươi VietGAP, Đồ uống, Thực phẩm khô đến Thời trang SmartWear và Hóa phẩm gia đình — đồng bộ giỏ hàng 100% khi bạn bước vào 3D.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMode("3D")}
                className="bg-hyper-accent hover:bg-hyper-accent-hover text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-transform duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <Box className="w-4 h-4 text-white" />
                <span>Bước Vào Siêu Thị 3D Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToZone("zone-produce")}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-100 font-bold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                Xem từng ngành hàng
              </button>
            </div>
          </div>

          {/* Cột phải Hero: Lối tắt 5 Ngành hàng Thực Tế */}
          <div className="lg:col-span-5 bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 md:p-6 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold text-white">5 Phân Khu Trưng Bày Độc Lập</span>
              <span className="font-num tabular-nums text-slate-300">
                {ALL_PRODUCTS.length} mặt hàng
              </span>
            </div>

            <div className="space-y-2">
              {STORE_ZONES_CONFIG.map((zone) => {
                const count = zone.categories.reduce(
                  (sum, cat) => sum + (categoryCounts.get(cat) ?? 0),
                  0
                );
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => scrollToZone(zone.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors focus-visible:ring-2 focus-visible:ring-hyper-accent focus-visible:outline-none group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-blue-200 truncate">
                        {zone.shortLabel}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{zone.aisleBadge}</div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 border border-slate-700 text-[11px] font-bold font-num tabular-nums">
                      {count} món
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Dải Cam Kết Dịch Vụ (Service Trust Strip) */}
        <section
          aria-label="Cam kết chất lượng SmartMart 3D"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {SERVICE_TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl bg-hyper-card border border-hyper-border p-3.5 flex items-center gap-3 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-hyper-ink truncate">{item.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </section>

        {/* 4. Bộ Lọc Danh Mục Chi Tiết & Thanh Trạng Thái Danh Sách */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-hyper-primary" />
              <h2 className="font-extrabold text-base md:text-lg text-hyper-ink font-num tabular-nums">
                Danh Sách Nhu Yếu Phẩm ({filteredProducts.length})
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {searchQuery && (
                <span className="text-xs text-slate-600">
                  Kết quả tìm kiếm cho:{" "}
                  <span className="font-bold text-hyper-ink">"{searchQuery}"</span>
                </span>
              )}
              {(selectedCategory !== "Tất cả" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("Tất cả");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-hyper-primary hover:underline focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none rounded"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại lọc</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const count =
                cat === "Tất cả" ? ALL_PRODUCTS.length : (categoryCounts.get(cat) ?? 0);
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-label={cat}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none ${
                    isSelected
                      ? "bg-hyper-primary text-white shadow-sm"
                      : "bg-hyper-card text-hyper-ink hover:bg-slate-100 border border-hyper-border"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    aria-hidden="true"
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-num tabular-nums ${
                      isSelected ? "bg-white/20 text-white" : "bg-hyper-surface text-slate-600"
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Hiển Thị 5 Phân Khu Sản Phẩm Độc Lập (Không Gộp Chung) */}
        {zoneGroups.length === 0 ? (
          <div className="bg-hyper-card rounded-2xl border border-hyper-border p-12 text-center shadow-sm space-y-2">
            <p className="font-bold text-hyper-ink text-base">
              Không tìm thấy sản phẩm phù hợp
            </p>
            <p className="text-xs text-slate-600">
              Thử tìm kiếm với từ khóa khác như "sữa", "ớt chuông", "áo thun" hoặc đặt lại bộ lọc.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("Tất cả");
                setSearchQuery("");
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hyper-primary text-white text-xs font-bold hover:bg-hyper-primary-hover transition-colors"
            >
              Xem toàn bộ 5 ngành hàng
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {zoneGroups.map(({ zone, products }) => (
              <DepartmentSection
                key={zone.id}
                zone={zone}
                products={products}
                sectionRef={(el) => {
                  sectionRefs.current[zone.id] = el;
                }}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}

        {/* 6. Storefront Footer */}
        <footer className="rounded-2xl bg-hyper-card border border-hyper-border p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-black text-base text-hyper-ink">
              <ShieldCheck className="w-4 h-4 text-hyper-fresh" />
              <span>Đại Siêu Thị Không Gian Lai · Việt Nam</span>
            </div>
            <p className="text-xs text-slate-600">
              24 sản phẩm thuộc 5 phân khu chuẩn đại siêu thị 40m × 54m — Hỗ trợ mua nhanh 2D và tham quan kệ hàng 3D trực tiếp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={scrollToTop}
              className="px-3.5 py-2 rounded-xl border border-hyper-border bg-hyper-surface hover:bg-slate-100 text-xs font-bold text-hyper-ink flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Lên đầu trang</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("3D")}
              className="px-4 py-2 rounded-xl bg-hyper-ink hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Chuyển sang 3D</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Modal Xem Nhanh dành cho sản phẩm 2D thuần (has3D: false) */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
