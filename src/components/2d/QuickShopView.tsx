import React, { useMemo } from "react";
import { Box, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { MOCK_PRODUCTS } from "../../data/mockProducts";
import { ProductCard2D } from "./ProductCard2D";
import { useAppStore } from "../../stores/useAppStore";

export const QuickShopView: React.FC = () => {
  const { searchQuery, selectedCategory, setSelectedCategory, setMode } = useAppStore();

  const categories = useMemo(() => {
    const list = Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)));
    return ["Tất cả", ...list];
  }, []);

  const filteredProducts = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    return MOCK_PRODUCTS.filter((product) => {
      const matchCat =
        selectedCategory === "Tất cả" || product.category === selectedCategory;
      const matchSearch =
        trimmedQuery === "" ||
        product.name.toLowerCase().includes(trimmedQuery) ||
        product.category.toLowerCase().includes(trimmedQuery);
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Banner Khuyến khích trải nghiệm 3D */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-cyan-200 text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Mô hình Mua Sắm Lai (Hybrid 2D & 3D) đầu tiên tại Việt Nam</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
            Mua sắm nhanh 2D hoặc bước vào không gian Siêu thị 3D!
          </h1>

          <p className="text-sm md:text-base text-blue-100 font-medium">
            Chọn mua nhanh các nhu yếu phẩm bên dưới, hoặc bật chế độ 3D để trực tiếp dạo quanh quầy kệ và nhặt sản phẩm. Giỏ hàng của bạn luôn được đồng bộ tự động.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setMode("3D")}
              className="bg-white hover:bg-slate-100 text-blue-700 font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              <Box className="w-4 h-4 text-cyan-600" />
              <span>Bước Vào Siêu Thị 3D Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trang trí nền */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Danh mục ngành hàng */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-blue-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
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
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h2 className="font-extrabold text-base md:text-lg text-slate-800">
              Danh Sách Nhu Yếu Phẩm ({filteredProducts.length})
            </h2>
          </div>
          {searchQuery && (
            <span className="text-xs text-slate-500">
              Kết quả tìm kiếm cho:{" "}
              <span className="font-bold text-slate-800">"{searchQuery}"</span>
            </span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <p className="font-semibold text-slate-600 text-base">
              Không tìm thấy sản phẩm phù hợp
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Thử tìm kiếm với từ khóa khác như "sữa", "mì", "cà phê"...
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

