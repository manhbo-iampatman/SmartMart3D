import { MOCK_PRODUCTS } from "./mockProducts";
import { PRODUCE_PRODUCTS } from "./produceProducts";
import { APPAREL_PRODUCTS } from "./apparelProducts";
import { Product } from "../types";

/**
 * Nguồn chân lý duy nhất (Single Source of Truth) cho toàn bộ danh mục 2D & 3D:
 * 12 sản phẩm Tạp hóa (MOCK_PRODUCTS) + 6 Nông sản tươi + 6 Thời trang & Phụ kiện.
 */
export const ALL_PRODUCTS: Product[] = [
  ...MOCK_PRODUCTS,
  ...PRODUCE_PRODUCTS,
  ...APPAREL_PRODUCTS,
];

export const ALL_3D_PRODUCTS: Product[] = ALL_PRODUCTS.filter(
  (product) => product.has3D && Boolean(product.shelfLocation)
);
