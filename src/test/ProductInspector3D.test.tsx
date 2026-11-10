import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductInspector3D } from "../components/3d/ProductInspector3D";
import { CartFeedback } from "../components/shared/CartFeedback";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { useAppStore } from "../stores/useAppStore";
import { useCartStore } from "../stores/useCartStore";
import { useFeedbackStore } from "../stores/useFeedbackStore";
import { playCartSound } from "../utils/cartSound";

vi.mock("../components/3d/ProductPreview3D", () => ({
  ProductPreview3D: () => <div aria-label="Mô hình sản phẩm 360 độ" />,
}));
vi.mock("../utils/cartSound", () => ({ playCartSound: vi.fn() }));

const milk = MOCK_PRODUCTS[0];

beforeEach(() => {
  vi.clearAllMocks();
  act(() => {
    useCartStore.getState().clearCart();
    useFeedbackStore.setState({ soundEnabled: true, notice: null });
    useAppStore.setState({ mode: "3D", inspectingProduct: null, isCartOpen: false, isCheckoutOpen: false, target3DPosition: null });
  });
});

describe("ProductInspector3D - nghiệm thu giai đoạn 3", () => {
  it("chỉ hiển thị khi chọn sản phẩm, có thành phần và hạn dùng minh họa", () => {
    render(<ProductInspector3D />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => useAppStore.getState().setInspectingProduct(milk));
    expect(screen.getByRole("dialog", { name: milk.name })).toBeInTheDocument();
    expect(screen.getByText(milk.labelInfo!.ingredients)).toBeInTheDocument();
    expect(screen.getByText(milk.labelInfo!.expiry)).toBeInTheDocument();
    expect(screen.getByText(/Mẫu thông tin minh họa/)).toBeInTheDocument();
  });

  it("nhặt một hộp sữa cập nhật đúng giỏ, đóng panel, báo thành công và phát âm", () => {
    act(() => useAppStore.getState().setInspectingProduct(milk));
    render(<><ProductInspector3D /><CartFeedback /></>);
    fireEvent.click(screen.getByRole("button", { name: /bỏ vào giỏ hàng/i }));
    expect(useCartStore.getState().getTotalItems()).toBe(1);
    expect(useCartStore.getState().getTotalVND()).toBe(36000);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(milk.name);
    expect(playCartSound).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /xem giỏ hàng/i }));
    expect(useAppStore.getState().isCartOpen).toBe(true);
  });

  it("tắt âm vẫn thêm hàng và cộng gộp sản phẩm đúng một lần", () => {
    act(() => {
      useCartStore.getState().addItem(milk);
      useAppStore.getState().setInspectingProduct(milk);
    });
    render(<ProductInspector3D />);
    fireEvent.click(screen.getByRole("switch", { name: /âm báo thêm giỏ/i }));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("button", { name: /bỏ vào giỏ hàng/i }));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getTotalVND()).toBe(72000);
    expect(playCartSound).not.toHaveBeenCalled();
  });

  it("Escape đóng panel, hoàn trả focus và không thay đổi giỏ", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    act(() => useAppStore.getState().setInspectingProduct(milk));
    render(<ProductInspector3D />);
    expect(screen.getByRole("button", { name: /đóng thông tin sản phẩm/i })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useAppStore.getState().inspectingProduct).toBeNull();
    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("đóng bằng nút X và dẫn về kệ không vô tình thêm sản phẩm", () => {
    act(() => useAppStore.getState().setInspectingProduct(milk));
    render(<ProductInspector3D />);
    fireEvent.click(screen.getByRole("button", { name: /đóng thông tin sản phẩm/i }));
    expect(useAppStore.getState().inspectingProduct).toBeNull();
    act(() => useAppStore.getState().setInspectingProduct(milk));
    fireEvent.click(screen.getByRole("button", { name: /đưa tôi đến kệ hàng này/i }));
    expect(useAppStore.getState().target3DPosition).toBeNull();
    expect(useAppStore.getState().activeNavigationProduct?.id).toBe(milk.id);
    expect(useAppStore.getState().inspectingProduct).toBeNull();
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });

  it("Phase 8: khung xem 360° dùng nền studio sáng bg-hyper-surface đồng bộ UI", () => {
    act(() => useAppStore.getState().setInspectingProduct(milk));
    render(<ProductInspector3D />);
    const dialog = screen.getByRole("dialog", { name: milk.name });
    expect(dialog.querySelector(".bg-hyper-surface")).not.toBeNull();
    expect(dialog.innerHTML).not.toContain("from-slate-900");
  });
});
