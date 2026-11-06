import { describe, it, expect } from "vitest";
import { MOCK_PRODUCTS } from "../data/mockProducts";

describe("MOCK_PRODUCTS - Dữ liệu danh mục sản phẩm Việt Nam (Phase 1)", () => {
  it("chứa đúng 12 sản phẩm mẫu theo tiêu chuẩn nghiệm thu Giai đoạn 1", () => {
    expect(MOCK_PRODUCTS).toHaveLength(12);
  });

  it("chứa các sản phẩm quốc dân tiêu biểu của Việt Nam", () => {
    const productNames = MOCK_PRODUCTS.map((p) => p.name);
    
    // Kiểm tra các sản phẩm trọng tâm đã nêu trong báo cáo
    expect(productNames.some((n) => n.includes("Vinamilk"))).toBe(true);
    expect(productNames.some((n) => n.includes("Hảo Hảo"))).toBe(true);
    expect(productNames.some((n) => n.includes("G7"))).toBe(true);
    expect(productNames.some((n) => n.includes("Coca-Cola"))).toBe(true);
    expect(productNames.some((n) => n.includes("Choco-Pie"))).toBe(true);
    expect(productNames.some((n) => n.includes("Milo"))).toBe(true);
    expect(productNames.some((n) => n.includes("Sting"))).toBe(true);
    expect(productNames.some((n) => n.includes("Simply"))).toBe(true);
  });

  it("tất cả sản phẩm đều có thông tin hợp lệ (id, tên, giá VNĐ dương, đơn vị, ảnh)", () => {
    const uniqueIds = new Set<string>();

    MOCK_PRODUCTS.forEach((product) => {
      // ID không trùng lặp và không rỗng
      expect(product.id).toBeTruthy();
      expect(uniqueIds.has(product.id)).toBe(false);
      uniqueIds.add(product.id);

      // Tên tiếng Việt và danh mục
      expect(product.name.trim().length).toBeGreaterThan(0);
      expect(product.category.trim().length).toBeGreaterThan(0);

      // Giá tiền VNĐ phải là số nguyên dương
      expect(product.price).toBeGreaterThan(0);
      expect(Number.isInteger(product.price)).toBe(true);

      // Đơn vị tính (Hộp, Gói, Lon, Chai...)
      expect(product.unit.trim().length).toBeGreaterThan(0);

      // Ảnh 2D
      expect(product.image2D.startsWith("http")).toBe(true);

      // Kích thước 3D [rộng, cao, sâu] hợp lệ
      expect(product.dimensions).toHaveLength(3);
      expect(product.dimensions[0]).toBeGreaterThan(0);
      expect(product.dimensions[1]).toBeGreaterThan(0);
      expect(product.dimensions[2]).toBeGreaterThan(0);
    });
  });

  it("các sản phẩm có mô hình 3D (has3D = true) phải có vị trí kệ hàng (shelfLocation)", () => {
    const products3D = MOCK_PRODUCTS.filter((p) => p.has3D);
    expect(products3D.length).toBeGreaterThan(0);

    products3D.forEach((p) => {
      expect(p.shelfLocation).toBeDefined();
      expect(p.shelfLocation?.aisle).toBeTruthy();
      expect(p.shelfLocation?.shelfTier).toBeGreaterThanOrEqual(1);
      expect(p.shelfLocation?.worldPos).toHaveLength(3);
    });
  });

  it("hỗ trợ cả các sản phẩm chỉ có ở chế độ 2D (has3D = false) để kiểm chứng tính năng Hybrid", () => {
    const products2DOnly = MOCK_PRODUCTS.filter((p) => !p.has3D);
    expect(products2DOnly.length).toBeGreaterThan(0);
  });
});

