import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CheckoutModal } from "../components/shared/CheckoutModal";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { useAppStore } from "../stores/useAppStore";
import { useCartStore } from "../stores/useCartStore";
import { useCheckoutStore } from "../stores/useCheckoutStore";

const haoHao = MOCK_PRODUCTS.find(
  (product) => product.id === "prod-noodle-haohao"
)!;

describe("CheckoutModal - luồng thanh toán", () => {
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
      useAppStore.setState({
        isCartOpen: false,
        isCheckoutOpen: false,
      });
    });
  });

  it("không render khi checkout đang đóng", () => {
    const { container } = render(<CheckoutModal />);

    expect(container).toBeEmptyDOMElement();
  });

  it("giữ nguyên mã đơn từ lúc tạo QR đến khi xác nhận thành công và đếm đúng tổng số lượng", () => {
    act(() => {
      useCartStore.getState().addItem(haoHao);
      useCartStore.getState().addItem(haoHao);
      useAppStore.getState().setIsCheckoutOpen(true);
    });
    render(<CheckoutModal />);

    const orderCodeBeforePayment = screen.getByText(/^SM3D-\d{6}$/).textContent;
    fireEvent.click(
      screen.getByRole("button", { name: /xác nhận đặt hàng/i })
    );

    expect(screen.getByText("Thanh Toán Thành Công!")).toBeInTheDocument();
    expect(screen.getByText(/^SM3D-\d{6}$/)).toHaveTextContent(
      orderCodeBeforePayment!
    );
    expect(screen.getByText("2 món")).toBeInTheDocument();
    expect(screen.getByText("9.000 đ")).toBeInTheDocument();
  });

  it("quay lại giỏ hàng mà không xóa sản phẩm", () => {
    act(() => {
      useCartStore.getState().addItem(haoHao);
      useAppStore.getState().setIsCheckoutOpen(true);
    });
    render(<CheckoutModal />);

    fireEvent.click(
      screen.getByRole("button", { name: /quay lại giỏ hàng/i })
    );

    expect(useAppStore.getState().isCheckoutOpen).toBe(false);
    expect(useAppStore.getState().isCartOpen).toBe(true);
    expect(useCartStore.getState().getTotalItems()).toBe(1);
  });

  it("chỉ xóa giỏ sau khi thanh toán thành công và đóng biên nhận", () => {
    act(() => {
      useCartStore.getState().addItem(haoHao);
      useAppStore.getState().setIsCheckoutOpen(true);
    });
    render(<CheckoutModal />);

    fireEvent.click(
      screen.getByRole("button", { name: /xác nhận đặt hàng/i })
    );
    expect(useCartStore.getState().getTotalItems()).toBe(1);

    fireEvent.click(
      screen.getByRole("button", { name: /tiếp tục mua sắm/i })
    );

    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(useAppStore.getState().isCheckoutOpen).toBe(false);
  });

  it("đồng bộ 4 bước (Giỏ hàng -> Quét mã -> Thanh toán -> Hoàn tất) cùng activeKioskId & orderCode với Kiosk 3D", () => {
    act(() => {
      useCheckoutStore.getState().resetCheckout();
      useCartStore.getState().addItem(haoHao);
      useCheckoutStore.getState().setActiveKioskId("SCO-04");
      useCheckoutStore.getState().startCheckout();
      useAppStore.getState().setIsCheckoutOpen(true);
    });
    render(<CheckoutModal />);

    // Đang ở bước 2: Quét mã tại Kiosk SCO-04
    expect(screen.getByText("Self-Checkout SCO-04")).toBeInTheDocument();
    expect(screen.getByText(/Kiosk đang quét từng sản phẩm/i)).toBeInTheDocument();
    const sharedCode = useCheckoutStore.getState().orderCode;
    expect(screen.getByText(sharedCode)).toBeInTheDocument();

    // Chuyển sang bước 3: Thanh toán -> giữ nguyên mã đơn từ useCheckoutStore
    fireEvent.click(screen.getByRole("button", { name: /chuyển sang bước thanh toán/i }));
    expect(useCheckoutStore.getState().phase).toBe("payment");
    expect(screen.getByText(sharedCode)).toBeInTheDocument();

    // Xác nhận thanh toán -> Bước 4: Hoàn tất
    fireEvent.click(screen.getByRole("button", { name: /xác nhận đặt hàng/i }));
    expect(useCheckoutStore.getState().phase).toBe("success");
    expect(screen.getByText("Thanh Toán Thành Công!")).toBeInTheDocument();
    expect(screen.getByText(sharedCode)).toBeInTheDocument();
  });
});
