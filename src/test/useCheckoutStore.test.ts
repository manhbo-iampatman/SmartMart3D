import { describe, it, expect, beforeEach } from "vitest";
import { useCheckoutStore } from "../stores/useCheckoutStore";

describe("useCheckoutStore - Quản lý tiến trình quét mã và thanh toán (Sprint 3)", () => {
  beforeEach(() => {
    useCheckoutStore.getState().resetCheckout();
  });

  it("khởi tạo ở trạng thái idle với mã đơn hợp lệ", () => {
    const state = useCheckoutStore.getState();
    expect(state.phase).toBe("idle");
    expect(state.scannedCount).toBe(0);
    expect(state.orderCode).toMatch(/^SM3D-\d{6}$/);
    expect(state.paymentMethod).toBe("vietqr");
  });

  it("bắt đầu quét hàng (startCheckout) chuyển sang phase scanning", () => {
    useCheckoutStore.getState().startCheckout();
    const state = useCheckoutStore.getState();
    expect(state.phase).toBe("scanning");
    expect(state.isAutoScanning).toBe(true);
    expect(state.scannedCount).toBe(0);
    expect(state.currentItemIndex).toBe(0);
  });

  it("quét lần lượt từng món (advanceToNextItem) và chuyển sang payment khi xong", () => {
    const totalItems = 3;
    useCheckoutStore.getState().startCheckout();

    // Món 1
    useCheckoutStore.getState().advanceToNextItem(totalItems);
    expect(useCheckoutStore.getState().scannedCount).toBe(1);
    expect(useCheckoutStore.getState().currentItemIndex).toBe(1);
    expect(useCheckoutStore.getState().phase).toBe("scanning");

    // Món 2
    useCheckoutStore.getState().advanceToNextItem(totalItems);
    expect(useCheckoutStore.getState().scannedCount).toBe(2);
    expect(useCheckoutStore.getState().phase).toBe("scanning");

    // Món 3 (Món cuối) -> Sang payment
    useCheckoutStore.getState().advanceToNextItem(totalItems);
    expect(useCheckoutStore.getState().scannedCount).toBe(3);
    expect(useCheckoutStore.getState().phase).toBe("payment");
    expect(useCheckoutStore.getState().isAutoScanning).toBe(false);
  });

  it("cho phép quét nhanh (skipScanning) bỏ qua animation và tới thẳng payment", () => {
    useCheckoutStore.getState().startCheckout();
    useCheckoutStore.getState().skipScanning(5);

    const state = useCheckoutStore.getState();
    expect(state.scannedCount).toBe(5);
    expect(state.phase).toBe("payment");
    expect(state.isAutoScanning).toBe(false);
  });

  it("xác nhận thanh toán (confirmPayment) hoàn tất đơn hàng", () => {
    useCheckoutStore.getState().startCheckout();
    useCheckoutStore.getState().skipScanning(2);
    useCheckoutStore.getState().confirmPayment();

    expect(useCheckoutStore.getState().phase).toBe("success");
  });

  it("chuyển đổi phương thức thanh toán giữa vietqr và cod", () => {
    useCheckoutStore.getState().setPaymentMethod("cod");
    expect(useCheckoutStore.getState().paymentMethod).toBe("cod");

    useCheckoutStore.getState().setPaymentMethod("vietqr");
    expect(useCheckoutStore.getState().paymentMethod).toBe("vietqr");
  });
});

