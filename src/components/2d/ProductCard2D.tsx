import React, { useState } from "react";
import { Plus, Check, Box, Eye } from "lucide-react";
import { Product } from "../../types";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";

interface Props {
  product: Product;
}

export const ProductCard2D: React.FC<Props> = ({ product }) => {
  const { addItem } = useCartStore();
  const { goToProductIn3D, setInspectingProduct } = useAppStore();
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group select-none">
      {/* Ảnh sản phẩm */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        <img
          src={product.image2D}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badge 3D */}
        {product.has3D ? (
          <span className="absolute top-2.5 left-2.5 bg-cyan-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
            <Box className="w-3 h-3" />
            Có mô hình 3D
          </span>
        ) : (
          <span className="absolute top-2.5 left-2.5 bg-slate-900/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            2D Mua nhanh
          </span>
        )}

        {/* Nút xem nhanh 3D popup */}
        {product.has3D && (
          <button
            onClick={() => setInspectingProduct(product)}
            className="absolute bottom-2.5 right-2.5 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-semibold backdrop-blur-sm"
            title="Xem mô hình 360 độ"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Xoay 3D</span>
          </button>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
            {product.category}
          </span>
          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mt-1 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{product.unit}</p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-400">Giá niêm yết:</div>
            <div className="font-black text-base text-slate-900">
              {product.price.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-blue-600">đ</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Nút định vị tới kệ 3D */}
            {product.has3D && (
              <button
                onClick={() => goToProductIn3D(product)}
                className="p-2 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors text-xs font-bold flex items-center gap-1"
                title="Bước vào 3D và đi đến kệ này"
              >
                <Box className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Tìm trên kệ</span>
              </button>
            )}

            {/* Nút thêm vào giỏ */}
            <button
              onClick={handleAddToCart}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                justAdded
                  ? "bg-emerald-600 text-white scale-105"
                  : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã thêm</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Chọn mua</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

