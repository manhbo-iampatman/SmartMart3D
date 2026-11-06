import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ProductCard2D } from "../components/2d/ProductCard2D";
import { useCartStore } from "../stores/useCartStore";
import { useAppStore } from "../stores/useAppStore";
import { Product } from "../types";

const mockProduct3D: Product = {
  id: "prod-noodle-haohao",
  name: "Mì Tôm Chua Cay Hảo Hảo 75g",
  price: 4500,
  category: "Mì & Đồ Khô",
  description: "Acecook Việt Nam",
  unit: "Gói 75g",
  image2D: "https://example.com/haohao.jpg",
  color: "#dc2626",
  dimensions: [0.15, 0.12, 0.05],
  has3D: true,
  shelfLocation: {
    aisle: "Aisle 01 (Trái)",
    shelfTier: 1,
    worldPos: [-2.1, 0.65, -0.6],
  },
};

const mockProduct2DOnly: Product = {
  id: "prod-rice-st25",
  name: "Gạo Thơm ST25 Thượng Hạng Túi 5kg",
  price: 185000,
  category: "Mì & Đồ Khô",
  description: "Gạo ngon nhất thế giới",
  unit: "Túi 5kg",
  image2D: "https://example.com/st25.jpg",
  color: "#f8fafc",
  dimensions: [0.25, 0.4, 0.15],
  has3D: false,
};

describe("ProductCard2D - Thẻ hiển thị sản phẩm chế độ 2D", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useAppStore.setState({
      mode: "2D",
      inspectingProduct: null,
      hoveredProduct: null,
      target3DPosition: null,
    });
    vi.useFakeTimers();
  });

  it("hiển thị đầy đủ thông tin: tên, giá tiền VNĐ, đơn vị, ngành hàng", () => {
    render(<ProductCard2D product={mockProduct3D} />);

    expect(screen.getByText("Mì Tôm Chua Cay Hảo Hảo 75g")).toBeInTheDocument();
    expect(screen.getByText("Mì & Đồ Khô")).toBeInTheDocument();
    expect(screen.getByText("Gói 75g")).toBeInTheDocument();
    expect(screen.getByText("4.500")).toBeInTheDocument();
    expect(screen.getByText("đ")).toBeInTheDocument();
  });

  it("hiển thị badge 'Có mô hình 3D' đối với sản phẩm có 3D", () => {
    render(<ProductCard2D product={mockProduct3D} />);
    expect(screen.getByText("Có mô hình 3D")).toBeInTheDocument();
  });

  it("hiển thị badge '2D Mua nhanh' đối với sản phẩm chỉ hỗ trợ 2D", () => {
    render(<ProductCard2D product={mockProduct2DOnly} />);
    expect(screen.getByText("2D Mua nhanh")).toBeInTheDocument();
  });

  it("bấm nút 'Chọn mua' sẽ thêm sản phẩm vào useCartStore và hiện feedback 'Đã thêm'", () => {
    render(<ProductCard2D product={mockProduct3D} />);

    const buyButton = screen.getByRole("button", { name: /chọn mua/i });
    expect(buyButton).toBeInTheDocument();

    fireEvent.click(buyButton);

    // Kiểm tra giỏ hàng đã tăng
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].product.id).toBe("prod-noodle-haohao");
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    // Kiểm tra nút chuyển sang trạng thái "Đã thêm"
    expect(screen.getByText("Đã thêm")).toBeInTheDocument();

    // Sau 900ms quay lại "Chọn mua"
    act(() => {
      vi.advanceTimersByTime(950);
    });
    expect(screen.getByText("Chọn mua")).toBeInTheDocument();
  });

  it("bấm nút 'Tìm trên kệ' sẽ kích hoạt goToProductIn3D", () => {
    render(<ProductCard2D product={mockProduct3D} />);

    const findOnShelfButton = screen.getByTitle("Bước vào 3D và đi đến kệ này");
    expect(findOnShelfButton).toBeInTheDocument();

    fireEvent.click(findOnShelfButton);

    const appState = useAppStore.getState();
    expect(appState.mode).toBe("3D");
    expect(appState.target3DPosition).toEqual([-2.1, 0.65, -0.6]);
  });

  it("bấm nút 'Xoay 3D' sẽ mở modal xem chi tiết 360 độ (setInspectingProduct)", () => {
    render(<ProductCard2D product={mockProduct3D} />);

    const inspectButton = screen.getByTitle("Xem mô hình 360 độ");
    expect(inspectButton).toBeInTheDocument();

    fireEvent.click(inspectButton);

    expect(useAppStore.getState().inspectingProduct?.id).toBe("prod-noodle-haohao");
  });
});

