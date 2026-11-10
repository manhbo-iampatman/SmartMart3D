import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CartDrawer } from "../components/shared/CartDrawer";
import { useCartStore } from "../stores/useCartStore";
import { useAppStore } from "../stores/useAppStore";
import { MOCK_PRODUCTS } from "../data/mockProducts";

describe("CartDrawer - Giỏ hàng trượt đồng bộ 2D & 3D (Phase 1)", () => {
  const mockOnClose = vi.fn();
  const haohao = MOCK_PRODUCTS.find((p) => p.id === "prod-noodle-haohao")!;
  const vinamilk = MOCK_PRODUCTS.find((p) => p.id === "prod-milk-vinamilk")!;

  beforeEach(() => {
    useCartStore.getState().clearCart();
    useAppStore.setState({ isCheckoutOpen: false });
    mockOnClose.mockClear();
  });

  it("không render giao diện khi isOpen = false", () => {
    const { container } = render(<CartDrawer isOpen={false} onClose={mockOnClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hiển thị trạng thái giỏ hàng trống khi chưa có món hàng nào", () => {
    render(<CartDrawer isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText("Giỏ hàng của bạn đang trống")).toBeInTheDocument();
  });

  it("hiển thị chi tiết các sản phẩm trong giỏ hàng", () => {
    act(() => {
      useCartStore.getState().addItem(haohao); // 4.500
      useCartStore.getState().addItem(vinamilk); // 36.000
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Mì Tôm Chua Cay Hảo Hảo 75g")).toBeInTheDocument();
    expect(screen.getByText("Sữa Tươi Tiệt Trùng Vinamilk 100% 1L")).toBeInTheDocument();
    expect(screen.getByText("4.500 đ")).toBeInTheDocument();
    expect(screen.getByText("36.000 đ")).toBeInTheDocument();
    // 40.500 đ hiển thị ở cả 2 mục: Tạm tính và Tổng cộng thanh toán
    expect(screen.getAllByText("40.500 đ")).toHaveLength(2);
  });

  it("thao tác tăng / giảm số lượng sản phẩm trực tiếp trong drawer", () => {
    useCartStore.getState().addItem(haohao);
    render(<CartDrawer isOpen={true} onClose={mockOnClose} />);

    // Click nút tăng số lượng (+)
    const plusButtons = screen.getAllByRole("button").filter((btn) =>
      btn.querySelector("svg.lucide-plus")
    );
    fireEvent.click(plusButtons[0]);

    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().getTotalVND()).toBe(9000);

    // Click nút giảm số lượng (-)
    const minusButtons = screen.getAllByRole("button").filter((btn) =>
      btn.querySelector("svg.lucide-minus")
    );
    fireEvent.click(minusButtons[0]);

    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(useCartStore.getState().getTotalVND()).toBe(4500);
  });

  it("xóa sản phẩm bằng nút thùng rác", () => {
    useCartStore.getState().addItem(haohao);
    render(<CartDrawer isOpen={true} onClose={mockOnClose} />);

    const trashBtn = screen.getByTitle("Xóa món này");
    fireEvent.click(trashBtn);

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByText("Giỏ hàng của bạn đang trống")).toBeInTheDocument();
  });

  it("bấm nút 'Thanh Toán Siêu Tốc (VietQR)' sẽ đóng drawer và mở checkout modal", () => {
    useCartStore.getState().addItem(haohao);
    render(<CartDrawer isOpen={true} onClose={mockOnClose} />);

    const checkoutBtn = screen.getByRole("button", {
      name: /thanh toán siêu tốc \(vietqr\)/i,
    });
    fireEvent.click(checkoutBtn);

    expect(mockOnClose).toHaveBeenCalled();
    expect(useAppStore.getState().isCheckoutOpen).toBe(true);
  });

  it("Phase 9 Gate 3: hỗ trợ Accessibility role='dialog', aria-labelledby, aria-label các nút và đóng bằng phím Escape", () => {
    useCartStore.getState().addItem(haohao);
    render(<CartDrawer isOpen={true} onClose={mockOnClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "cart-drawer-title");

    expect(screen.getByRole("button", { name: "Đóng giỏ hàng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Giảm số lượng ${haohao.name}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Tăng số lượng ${haohao.name}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Xóa ${haohao.name} khỏi giỏ` })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
