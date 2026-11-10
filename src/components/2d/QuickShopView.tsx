import React, { useMemo } from "react";
import { Box, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { ALL_PRODUCTS } from "../../data/catalog";
import { ProductCard2D } from "./ProductCard2D";
import { useAppStore } from "../../stores/useAppStore";
import { matchesProduct } from "../../utils/productSearch";

export const QuickShopView: React.FC = () => {
  const { searchQuery, selectedCategory, setSelectedCategory, setMode } = useAppStore();

  const categories = useMemo(() => {
    const list = Array.from(new Set(ALL_PRODUCTS.map((p) => p.category)));
    return ["Tất cả", ...list];
  }, []);

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      const matchCat =
        selectedCategory === "Tất cả" || product.category === selectedCategory;
      const matchSearch = matchesProduct(product, searchQuery);
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-hyper-ink">
      {/* Banner Giới thiệu mô hình Hybrid chuẩn Modern Architectural Hypermarket */}
      <div className="relative rounded-2xl overflow-hidden bg-hyper-ink text-white p-6 md:p-8 shadow-md border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hyper-primary/20 text-blue-200 text-xs font-bold border border-hyper-primary/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mô hình Mua Sắm Lai (Hybrid 2D & 3D) đầu tiên tại Việt Nam</span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
            Mua sắm nhanh 2D hoặc bước vào không gian Siêu thị 3D!
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
            Chọn mua nhanh nhu yếu phẩm, nông sản VietGAP hoặc thời trang SmartWear bên dưới, hay bật chế độ 3D để đẩy xe đẩy qua từng phân khu. Giỏ hàng luôn đồng bộ 100%.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setMode("3D")}
              className="bg-hyper-accent hover:bg-hyper-accent-hover text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              <Box className="w-4 h-4 text-white" />
              <span>Bước Vào Siêu Thị 3D Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Danh mục ngành hàng */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-hyper-primary text-white shadow-sm"
                : "bg-hyper-card text-hyper-ink hover:bg-slate-100 border border-hyper-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Danh sách lưới sản phẩm */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-hyper-primary" />
            <h2 className="font-extrabold text-base md:text-lg text-hyper-ink">
              Danh Sách Nhu Yếu Phẩm ({filteredProducts.length})
            </h2>
          </div>
          {searchQuery && (
            <span className="text-xs text-slate-500">
              Kết quả tìm kiếm cho:{" "}
              <span className="font-bold text-hyper-ink">"{searchQuery}"</span>
            </span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-hyper-card rounded-2xl border border-hyper-border p-12 text-center text-slate-400 shadow-sm">
            <p className="font-semibold text-hyper-ink text-base">
              Không tìm thấy sản phẩm phù hợp
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Thử tìm kiếm với từ khóa khác như "sữa", "ớt chuông", "áo thun"...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard2D key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
