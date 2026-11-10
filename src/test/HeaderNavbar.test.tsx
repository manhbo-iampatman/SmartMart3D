import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { HeaderNavbar } from "../components/shared/HeaderNavbar";
import { useAppStore } from "../stores/useAppStore";
import { useCartStore } from "../stores/useCartStore";
import { MOCK_PRODUCTS } from "../data/mockProducts";

describe("HeaderNavbar - Thanh điều hướng dùng chung 2D & 3D (Phase 1)", () => {
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
      useAppStore.setState({
        mode: "2D",
        searchQuery: "",
        isCartOpen: false,
      });
    });
  });

  it("hiển thị thương hiệu SmartMart3D và nhãn Việt Nam", () => {
    render(<HeaderNavbar />);
    expect(screen.getByText(/SmartMart/i)).toBeInTheDocument();
    expect(screen.getByText("3D")).toBeInTheDocument();
    expect(screen.getByText("Việt Nam")).toBeInTheDocument();
  });

  it("chuyển đổi chế độ 2D <-> 3D khi click vào các nút trên thanh điều hướng", () => {
    render(<HeaderNavbar />);

    const btn3D = screen.getByRole("button", { name: /khám phá \(3d\)/i });
    const btn2D = screen.getByRole("button", { name: /mua nhanh \(2d\)/i });

    expect(useAppStore.getState().mode).toBe("2D");

    // Chuyển sang 3D
    fireEvent.click(btn3D);
    expect(useAppStore.getState().mode).toBe("3D");

    // Chuyển về 2D
    fireEvent.click(btn2D);
    expect(useAppStore.getState().mode).toBe("2D");
  });

  it("cập nhật từ khóa tìm kiếm khi người dùng gõ vào ô input", () => {
    render(<HeaderNavbar />);

    const searchInput = screen.getByPlaceholderText(
      /tìm sữa tươi, mì gói, nước ngọt, bánh kẹo/i
    );
    fireEvent.change(searchInput, { target: { value: "Vinamilk" } });

    expect(useAppStore.getState().searchQuery).toBe("Vinamilk");
  });

  it("hiển thị số lượng món và tổng tiền VNĐ đồng bộ trên nút giỏ hàng", () => {
    render(<HeaderNavbar />);

    // Ban đầu giỏ hàng rỗng
    expect(screen.getByText("0 đ")).toBeInTheDocument();

    // Thêm 2 gói mì (4.500 x 2 = 9.000 đ)
    const noodle = MOCK_PRODUCTS.find((p) => p.id === "prod-noodle-haohao")!;
    act(() => {
      useCartStore.getState().addItem(noodle);
      useCartStore.getState().addItem(noodle);
    });

    // Nút giỏ hàng tự động cập nhật
    expect(screen.getByText("9.000 đ")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("click nút giỏ hàng sẽ mở CartDrawer (setIsCartOpen(true))", () => {
    render(<HeaderNavbar />);

    const cartBtn = screen.getByRole("button", { name: /giỏ hàng chung/i });
    fireEvent.click(cartBtn);

    expect(useAppStore.getState().isCartOpen).toBe(true);
  });

  it("Phase 9 Gate 3: Logo sử dụng nút button truy cập bàn phím, nút xóa tìm kiếm có aria-label chuẩn", () => {
    useAppStore.setState({ mode: "3D", searchQuery: "Hảo Hảo" });
    render(<HeaderNavbar />);

    const logoBtn = screen.getByRole("button", { name: /về trang mua nhanh smartmart 3d/i });
    expect(logoBtn.tagName).toBe("BUTTON");
    fireEvent.click(logoBtn);
    expect(useAppStore.getState().mode).toBe("2D");

    const clearBtn = screen.getByRole("button", { name: "Xóa tìm kiếm" });
    fireEvent.click(clearBtn);
    expect(useAppStore.getState().searchQuery).toBe("");
  });
});
