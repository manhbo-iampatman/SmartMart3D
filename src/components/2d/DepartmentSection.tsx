import React, { memo } from "react";
import { Box, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import type { Product } from "../../types";
import type { StoreZoneConfig } from "../../data/storeZones";
import { useAppStore } from "../../stores/useAppStore";
import { ProductCard2D } from "./ProductCard2D";

interface DepartmentSectionProps {
  zone: StoreZoneConfig;
  products: readonly Product[];
  sectionRef?: (el: HTMLElement | null) => void;
  onQuickView: (product: Product) => void;
}

export const DepartmentSection: React.FC<DepartmentSectionProps> = memo(
  ({ zone, products, sectionRef, onQuickView }) => {
    const isSpotlight = Boolean(zone.spotlightNote && products.length <= 2);

    return (
      <section
        id={zone.id}
        ref={sectionRef}
        aria-labelledby={`${zone.id}-title`}
        data-testid={`department-section-${zone.id}`}
        className={`hyper-zone-section rounded-2xl bg-hyper-card border border-hyper-border border-l-4 ${zone.borderAccentClass} p-4 sm:p-6 shadow-sm space-y-5`}
      >
        {/* Header Ngành Hàng & Đường Dẫn Trực Tiếp Vào Phân Khu 3D */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-hyper-border">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${zone.badgeBgClass} ${zone.badgeTextClass}`}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{zone.aisleBadge}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-hyper-surface border border-hyper-border text-[11px] font-bold text-slate-700 font-num tabular-nums">
                {products.length} sản phẩm
              </span>
            </div>

            <h3
              id={`${zone.id}-title`}
              className="text-lg sm:text-xl font-extrabold text-hyper-ink tracking-tight"
            >
              {zone.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {zone.subtitle} — <span className="font-medium text-slate-700">{zone.spatialHint}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => useAppStore.getState().goToZoneIn3D(zone)}
            className={`shrink-0 self-start md:self-center px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-transform duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none ${zone.ctaClass}`}
          >
            <Box className="w-4 h-4" />
            <span>Dạo khu này trong 3D</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nội dung trưng bày: Spotlight Split cho nhóm ít SKU (Hóa phẩm) hoặc Lưới chuẩn E-Commerce */}
        {isSpotlight ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-5 xl:col-span-4">
              <ProductCard2D product={products[0]} onQuickView={onQuickView} staggerIndex={0} />
            </div>

            <div className="lg:col-span-7 xl:col-span-8 rounded-2xl bg-hyper-surface border border-hyper-border p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Phân Khu Gia Dụng Độc Lập Cánh Tây</span>
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-hyper-ink">
                  An toàn tách biệt thực phẩm · Tiện lợi cho đơn hàng gia đình
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {zone.spotlightNote}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl bg-hyper-card border border-hyper-border p-3">
                    <div className="text-[11px] font-semibold text-slate-600">Vị trí trong 3D</div>
                    <div className="text-sm font-extrabold text-hyper-ink mt-0.5">Kệ W03 · W04 · N01</div>
                  </div>
                  <div className="rounded-xl bg-hyper-card border border-hyper-border p-3">
                    <div className="text-[11px] font-semibold text-slate-600">Lối đi mở rộng</div>
                    <div className="text-sm font-extrabold text-hyper-ink mt-0.5 font-num tabular-nums">
                      2.47m (Không góc hẹp)
                    </div>
                  </div>
                  <div className="rounded-xl bg-hyper-card border border-hyper-border p-3">
                    <div className="text-[11px] font-semibold text-slate-600">Hình thức mua</div>
                    <div className="text-sm font-extrabold text-hyper-primary mt-0.5">2D Mua nhanh + Kiosk</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-hyper-border">
                <button
                  type="button"
                  onClick={() => onQuickView(products[0])}
                  className="px-4 py-2 rounded-xl bg-hyper-card border border-hyper-border hover:border-hyper-primary text-xs font-bold text-hyper-ink transition-colors focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none"
                >
                  Xem thông số sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => useAppStore.getState().goToZoneIn3D(zone)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-800 hover:underline focus-visible:ring-2 focus-visible:ring-hyper-primary focus-visible:outline-none"
                >
                  Tham quan dãy W03–W04 trong 3D
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product, idx) => (
              <ProductCard2D
                key={product.id}
                product={product}
                onQuickView={onQuickView}
                staggerIndex={idx}
              />
            ))}
          </div>
        )}
      </section>
    );
  }
);

DepartmentSection.displayName = "DepartmentSection";
