import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../stores/useCartStore";
import { Product } from "../types";

const mockProductA: Product = {
  id: "prod-test-a",
  name: "Mì Tôm Chua Cay Hảo Hảo 75g",
  price: 4500,
  category: "Mì & Đồ Khô",
  description: "Test description",
  unit: "Gói 75g",
  image2D: "https://example.com/a.jpg",
  color: "#dc2626",
  dimensions: [0.15, 0.12, 0.05],
  has3D: true,
};

const mockProductB: Product = {
  id: "prod-test-b",
  name: "Sữa Tươi Tiệt Trùng Vinamilk 100% 1L",
  price: 36000,
  category: "Sữa & Sản Phẩm Từ Sữa",
  description: "Test description",
  unit: "Hộp 1 Lít",
  image2D: "https://example.com/b.jpg",
  color: "#2563eb",
  dimensions: [0.18, 0.28, 0.1],
  has3D: true,
};

describe("useCartStore - Quản lý giỏ hàng dùng chung (Phase 1)", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("khởi tạo giỏ hàng rỗng với tổng số lượng và tổng tiền bằng 0", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.getTotalItems()).toBe(0);
    expect(state.getTotalVND()).toBe(0);
  });

  it("thêm sản phẩm mới vào giỏ hàng với số lượng là 1", () => {
    useCartStore.getState().addItem(mockProductA);
    const state = useCartStore.getState();

    expect(state.items.length).toBe(1);
    expect(state.items[0].product.id).toBe("prod-test-a");
    expect(state.items[0].quantity).toBe(1);
    expect(state.getTotalItems()).toBe(1);
    expect(state.getTotalVND()).toBe(4500);
  });

  it("thêm cùng một sản phẩm nhiều lần sẽ tăng số lượng tương ứng", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().addItem(mockProductA);
    const state = useCartStore.getState();

    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.getTotalItems()).toBe(2);
    expect(state.getTotalVND()).toBe(9000);
  });

  it("nghiệm thu Giai đoạn 1: thêm 2 gói mì -> tổng số lượng = 2, tổng tiền = 9.000 VNĐ", () => {
    // Kịch bản nghiệm thu chính thức của Giai đoạn 1 trong báo cáo
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().addItem(mockProductA);

    const { items, getTotalItems, getTotalVND } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].product.name).toBe("Mì Tôm Chua Cay Hảo Hảo 75g");
    expect(getTotalItems()).toBe(2);
    expect(getTotalVND()).toBe(9000);
  });

  it("thêm nhiều sản phẩm khác nhau và tính tổng tiền VNĐ chính xác", () => {
    useCartStore.getState().addItem(mockProductA); // 4.500 x 1 = 4.500
    useCartStore.getState().addItem(mockProductB); // 36.000 x 1 = 36.000
    useCartStore.getState().addItem(mockProductA); // 4.500 x 2 = 9.000

    const state = useCartStore.getState();
    expect(state.items.length).toBe(2);
    expect(state.getTotalItems()).toBe(3);
    // 9.000 + 36.000 = 45.000 đ
    expect(state.getTotalVND()).toBe(45000);
  });

  it("cập nhật số lượng sản phẩm (updateQuantity)", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().updateQuantity("prod-test-a", 5);

    let state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(5);
    expect(state.getTotalItems()).toBe(5);
    expect(state.getTotalVND()).toBe(22500);

    // Cập nhật số lượng về 0 -> Tự động xóa khỏi giỏ hàng
    useCartStore.getState().updateQuantity("prod-test-a", 0);
    state = useCartStore.getState();
    expect(state.items.length).toBe(0);
    expect(state.getTotalItems()).toBe(0);
    expect(state.getTotalVND()).toBe(0);
  });

  it("cập nhật số lượng âm (quantity < 0) cũng tự động xóa khỏi giỏ hàng", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().updateQuantity("prod-test-a", -2);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(0);
    expect(state.getTotalItems()).toBe(0);
  });

  it("xóa sản phẩm khỏi giỏ hàng bằng removeItem", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().addItem(mockProductB);

    useCartStore.getState().removeItem("prod-test-a");

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].product.id).toBe("prod-test-b");
    expect(state.getTotalItems()).toBe(1);
    expect(state.getTotalVND()).toBe(36000);
  });

  it("xóa toàn bộ giỏ hàng bằng clearCart", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().addItem(mockProductB);

    useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.getTotalItems()).toBe(0);
    expect(state.getTotalVND()).toBe(0);
  });
});

