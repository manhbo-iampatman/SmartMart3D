import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../App";
import { useCartStore } from "../stores/useCartStore";
import { useAppStore } from "../stores/useAppStore";
import { MOCK_PRODUCTS } from "../data/mockProducts";

// Mock Three.js Canvas components for JSDOM testing
vi.mock("../components/3d/Scene3D", () => ({
  Scene3D: () => (
    <div data-testid="scene-3d-mock">
      <span>Siêu Thị 3D Đang Hoạt Động (Mock Canvas 3D)</span>
    </div>
  ),
}));

vi.mock("../components/3d/ProductInspector3D", () => ({
  ProductInspector3D: () => <div data-testid="product-inspector-3d-mock" />,
}));

describe("App - Tích hợp Hệ thống Hybrid Dual-Mode 2D <-> 3D (Phase 1)", () => {
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
      useAppStore.setState({
        mode: "2D",
        isCartOpen: false,
        isCheckoutOpen: false,
        searchQuery: "",
        selectedCategory: "Tất cả",
      });
    });
  });

  it("khởi tạo ứng dụng với thanh Header Navbar và giao diện 2D Quick Shop", () => {
    render(<App />);

    // Header Navbar
    expect(screen.getByText(/SmartMart/i)).toBeInTheDocument();
    expect(screen.getByText("Việt Nam")).toBeInTheDocument();

    // Màn hình 2D QuickShopView
    expect(
      screen.getByText(/Mô hình Mua Sắm Lai \(Hybrid 2D & 3D\) đầu tiên tại Việt Nam/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Danh Sách Nhu Yếu Phẩm (12)")).toBeInTheDocument();

    // 3D Scene không hiển thị khi ở 2D
    expect(screen.queryByTestId("scene-3d-mock")).not.toBeInTheDocument();
  });

  it("chuyển đổi mượt mà giữa chế độ 2D và 3D từ thanh điều hướng", () => {
    render(<App />);

    const btn3D = screen.getByRole("button", { name: /khám phá \(3d\)/i });
    fireEvent.click(btn3D);

    // Màn hình 3D xuất hiện
    expect(screen.getByTestId("scene-3d-mock")).toBeInTheDocument();
    // 2D Quick Shop biến mất
    expect(
      screen.queryByText(/Mô hình Mua Sắm Lai \(Hybrid 2D & 3D\)/i)
    ).not.toBeInTheDocument();

    // Chuyển lại về 2D
    const btn2D = screen.getByRole("button", { name: /mua nhanh \(2d\)/i });
    fireEvent.click(btn2D);
    expect(screen.queryByTestId("scene-3d-mock")).not.toBeInTheDocument();
    expect(screen.getByText("Danh Sách Nhu Yếu Phẩm (12)")).toBeInTheDocument();
  });

  it("TIÊU CHÍ NGHIỆM THU GIAI ĐOẠN 1: Thêm 2 gói mì ở 2D -> Chuyển sang 3D -> Giỏ hàng vẫn lưu đúng 2 gói mì và tổng tiền 9.000 VNĐ", () => {
    render(<App />);

    // 1. Đang ở chế độ 2D
    expect(useAppStore.getState().mode).toBe("2D");

    // 2. Tìm thẻ sản phẩm "Mì Tôm Chua Cay Hảo Hảo 75g" và bấm nút Chọn mua 2 lần
    const noodleProduct = MOCK_PRODUCTS.find((p) => p.id === "prod-noodle-haohao")!;
    expect(noodleProduct.price).toBe(4500);

    // Thêm 2 gói mì bằng store
    act(() => {
      useCartStore.getState().addItem(noodleProduct);
      useCartStore.getState().addItem(noodleProduct);
    });

    // Kiểm tra trên Header giỏ hàng hiển thị 2 món và 9.000 đ
    expect(screen.getByText("9.000 đ")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // 3. Người dùng bấm nút chuyển sang chế độ 3D
    const btn3D = screen.getByRole("button", { name: /khám phá \(3d\)/i });
    fireEvent.click(btn3D);

    // Xác nhận đã sang chế độ 3D
    expect(useAppStore.getState().mode).toBe("3D");
    expect(screen.getByTestId("scene-3d-mock")).toBeInTheDocument();

    // 4. Kiểm tra giỏ hàng trong trạng thái 3D:
    // Mở drawer giỏ hàng từ 3D
    const cartButton = screen.getByRole("button", { name: /giỏ hàng chung/i });
    fireEvent.click(cartButton);

    // 5. Nghiệm thu: Giỏ hàng vẫn hiển thị đúng 2 gói mì và tổng tiền 9.000 VNĐ
    expect(screen.getByText("Mì Tôm Chua Cay Hảo Hảo 75g")).toBeInTheDocument();
    expect(screen.getAllByText("9.000 đ").length).toBeGreaterThanOrEqual(1);

    const cartState = useCartStore.getState();
    expect(cartState.items).toHaveLength(1);
    expect(cartState.items[0].product.name).toBe("Mì Tôm Chua Cay Hảo Hảo 75g");
    expect(cartState.items[0].quantity).toBe(2);
    expect(cartState.getTotalVND()).toBe(9000);
    expect(cartState.getTotalItems()).toBe(2);
  });
});
