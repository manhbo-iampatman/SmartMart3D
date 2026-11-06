import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../stores/useAppStore";
import { Product } from "../types";

const mockProductWith3D: Product = {
  id: "prod-3d",
  name: "Sữa Vinamilk 1L",
  price: 36000,
  category: "Sữa & Sản Phẩm Từ Sữa",
  description: "Test",
  unit: "Hộp 1 Lít",
  image2D: "https://example.com/vinamilk.jpg",
  color: "#2563eb",
  dimensions: [0.18, 0.28, 0.1],
  has3D: true,
  shelfLocation: {
    aisle: "Aisle 01 (Trái)",
    shelfTier: 2,
    worldPos: [-2.1, 1.2, -1.8],
  },
};

const mockProductWithout3D: Product = {
  id: "prod-2d",
  name: "Gạo Thơm ST25",
  price: 185000,
  category: "Mì & Đồ Khô",
  description: "Test 2D only",
  unit: "Túi 5kg",
  image2D: "https://example.com/st25.jpg",
  color: "#f8fafc",
  dimensions: [0.25, 0.4, 0.15],
  has3D: false,
};

describe("useAppStore - Quản lý chế độ 2D/3D & Trạng thái UI (Phase 1)", () => {
  beforeEach(() => {
    useAppStore.setState({
      mode: "2D",
      isCartOpen: false,
      isCheckoutOpen: false,
      inspectingProduct: null,
      hoveredProduct: null,
      searchQuery: "",
      selectedCategory: "Tất cả",
      target3DPosition: null,
    });
  });

  it("khởi tạo mặc định ở chế độ Mua Nhanh 2D", () => {
    const state = useAppStore.getState();
    expect(state.mode).toBe("2D");
    expect(state.isCartOpen).toBe(false);
    expect(state.isCheckoutOpen).toBe(false);
    expect(state.selectedCategory).toBe("Tất cả");
    expect(state.searchQuery).toBe("");
  });

  it("chuyển đổi chế độ qua lại giữa 2D và 3D bằng setMode", () => {
    useAppStore.getState().setMode("3D");
    expect(useAppStore.getState().mode).toBe("3D");

    useAppStore.getState().setMode("2D");
    expect(useAppStore.getState().mode).toBe("2D");
  });

  it("chuyển đổi chế độ đảo chiều bằng toggleMode", () => {
    expect(useAppStore.getState().mode).toBe("2D");

    useAppStore.getState().toggleMode();
    expect(useAppStore.getState().mode).toBe("3D");

    useAppStore.getState().toggleMode();
    expect(useAppStore.getState().mode).toBe("2D");
  });

  it("quản lý trạng thái mở/đóng Giỏ hàng Drawer", () => {
    useAppStore.getState().setIsCartOpen(true);
    expect(useAppStore.getState().isCartOpen).toBe(true);

    useAppStore.getState().setIsCartOpen(false);
    expect(useAppStore.getState().isCartOpen).toBe(false);
  });

  it("quản lý trạng thái tìm kiếm và bộ lọc ngành hàng", () => {
    useAppStore.getState().setSearchQuery("Hảo Hảo");
    expect(useAppStore.getState().searchQuery).toBe("Hảo Hảo");

    useAppStore.getState().setSelectedCategory("Mì & Đồ Khô");
    expect(useAppStore.getState().selectedCategory).toBe("Mì & Đồ Khô");
  });

  it("quản lý sản phẩm đang xem chi tiết 3D (inspectingProduct)", () => {
    useAppStore.getState().setInspectingProduct(mockProductWith3D);
    expect(useAppStore.getState().inspectingProduct).toEqual(mockProductWith3D);

    useAppStore.getState().setInspectingProduct(null);
    expect(useAppStore.getState().inspectingProduct).toBeNull();
  });

  it("goToProductIn3D: tự động chuyển sang 3D và nhắm đúng tọa độ kệ hàng nếu có 3D", () => {
    useAppStore.getState().goToProductIn3D(mockProductWith3D);

    const state = useAppStore.getState();
    expect(state.mode).toBe("3D");
    expect(state.target3DPosition).toEqual([-2.1, 1.2, -1.8]);
    expect(state.hoveredProduct).toEqual(mockProductWith3D);
  });

  it("goToProductIn3D: chuyển sang 3D bình thường nếu sản phẩm chưa có tọa độ kệ", () => {
    useAppStore.getState().goToProductIn3D(mockProductWithout3D);

    const state = useAppStore.getState();
    expect(state.mode).toBe("3D");
    expect(state.target3DPosition).toBeNull();
  });
});

