import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickShopView } from "../components/2d/QuickShopView";
import { useAppStore } from "../stores/useAppStore";
import { useCartStore } from "../stores/useCartStore";

describe("QuickShopView - Màn hình Mua Nhanh 2D (Phase 1)", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useAppStore.setState({
      mode: "2D",
      searchQuery: "",
      selectedCategory: "Tất cả",
    });
  });

  it("hiển thị banner giới thiệu mô hình Hybrid và nút chuyển sang 3D", () => {
    render(<QuickShopView />);

    expect(
      screen.getByText(/Mô hình Mua Sắm Lai \(Hybrid 2D & 3D\) đầu tiên tại Việt Nam/i)
    ).toBeInTheDocument();

    const switch3DButton = screen.getByRole("button", {
      name: /bước vào siêu thị 3d ngay/i,
    });
    expect(switch3DButton).toBeInTheDocument();

    fireEvent.click(switch3DButton);
    expect(useAppStore.getState().mode).toBe("3D");
  });

  it("hiển thị danh sách 12 sản phẩm mẫu ở trạng thái mặc định", () => {
    render(<QuickShopView />);
    expect(screen.getByText("Danh Sách Nhu Yếu Phẩm (12)")).toBeInTheDocument();
  });

  it("lọc sản phẩm theo danh mục khi click vào nút ngành hàng", () => {
    render(<QuickShopView />);

    const drinkCategoryBtn = screen.getByRole("button", { name: "Nước Giải Khát" });
    expect(drinkCategoryBtn).toBeInTheDocument();

    fireEvent.click(drinkCategoryBtn);

    expect(useAppStore.getState().selectedCategory).toBe("Nước Giải Khát");
    // Kiểm tra có Coca-Cola và Sting
    expect(screen.getByText("Nước Ngọt Coca-Cola Vị Nguyên Bản")).toBeInTheDocument();
    expect(screen.getByText("Nước Tăng Lực Sting Dâu Tây Đỏ")).toBeInTheDocument();
    // Không còn Vinamilk
    expect(screen.queryByText("Sữa Tươi Tiệt Trùng Vinamilk 100% 1L")).not.toBeInTheDocument();
  });

  it("lọc sản phẩm theo từ khóa tìm kiếm", () => {
    useAppStore.setState({ searchQuery: "Hảo Hảo" });
    render(<QuickShopView />);

    expect(screen.getByText("Mì Tôm Chua Cay Hảo Hảo 75g")).toBeInTheDocument();
    expect(screen.queryByText("Sữa Tươi Tiệt Trùng Vinamilk 100% 1L")).not.toBeInTheDocument();
    expect(screen.getByText(/Kết quả tìm kiếm cho:/i)).toBeInTheDocument();
  });

  it("hiển thị thông báo khi không tìm thấy sản phẩm nào khớp", () => {
    useAppStore.setState({ searchQuery: "sản phẩm không hề tồn tại 9999" });
    render(<QuickShopView />);

    expect(screen.getByText("Không tìm thấy sản phẩm phù hợp")).toBeInTheDocument();
    expect(screen.getByText("Danh Sách Nhu Yếu Phẩm (0)")).toBeInTheDocument();
  });
});

