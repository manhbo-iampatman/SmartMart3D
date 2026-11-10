import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SelfCheckoutScanner3D } from "../components/3d/SelfCheckoutScanner3D";
import { useCartStore } from "../stores/useCartStore";
import { useAppStore } from "../stores/useAppStore";
import { useCheckoutStore } from "../stores/useCheckoutStore";
import { MOCK_PRODUCTS } from "../data/mockProducts";

// Mock @react-three/fiber và @react-three/drei để kiểm thử logic 3D trong jsdom
vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: (state: unknown, delta: number) => void) => {
    // Có thể gọi thủ công nếu cần
  },
  useThree: () => ({
    camera: { position: { distanceTo: () => 1.5 } },
  }),
}));

vi.mock("@react-three/drei", () => ({
  RoundedBox: ({ children, ...props }: any) => <div data-testid="rounded-box" {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span data-testid="3d-text" {...props}>{children}</span>,
}));

const vinamilk = MOCK_PRODUCTS.find((p) => p.id === "prod-milk-vinamilk")!;
const haohao = MOCK_PRODUCTS.find((p) => p.id === "prod-noodle-haohao")!;

describe("SelfCheckoutScanner3D - Quầy Kiosk thu ngân tự động quét mã & đóng túi (Sprint 3)", () => {
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
      useCheckoutStore.getState().resetCheckout();
      useAppStore.setState({
        mode: "3D",
        isCartOpen: false,
        isCheckoutOpen: false,
      });
    });
  });

  it("hiển thị các khu vực chức năng: Đặt Hàng, Kiosk SCAN > BAG > PAY, và Đóng Túi", () => {
    render(<SelfCheckoutScanner3D />);

    expect(screen.getByText("KHU VỰC ĐẶT HÀNG")).toBeInTheDocument();
    expect(screen.getByText("SCAN ➔ BAG ➔ PAY")).toBeInTheDocument();
    expect(screen.getByText("QUẦY TỰ THANH TOÁN 04")).toBeInTheDocument();
    expect(screen.getByText("KHU VỰC ĐÓNG TÚI")).toBeInTheDocument();
    expect(screen.getByText("SMARTMART")).toBeInTheDocument();
    expect(screen.getAllByText("CHECKOUT 04").length).toBeGreaterThanOrEqual(1);
  });

  it("màn hình POS hiển thị trạng thái chờ và số tiền khi có hàng trong giỏ", () => {
    act(() => {
      useCartStore.getState().addItem(vinamilk);
      useCartStore.getState().addItem(haohao);
    });

    render(<SelfCheckoutScanner3D />);

    expect(screen.getByText(/2 món · 40.500 đ/i)).toBeInTheDocument();
    expect(screen.getByText(/Chạm để bắt đầu quét hàng/i)).toBeInTheDocument();
  });

  it("click Kiosk khi có hàng kích hoạt tiến trình quét mã 3D (phase = scanning)", () => {
    act(() => {
      useCartStore.getState().addItem(vinamilk);
    });

    const { container } = render(<SelfCheckoutScanner3D />);

    // Click vào toàn bộ Kiosk group
    const stationGroup = container.firstChild as HTMLElement;
    fireEvent.click(stationGroup);

    expect(useCheckoutStore.getState().phase).toBe("scanning");
    expect(screen.getByText("ĐANG QUÉT MÃ VẠCH (SCANNING)")).toBeInTheDocument();
    expect(screen.getByText(/Sữa Tươi Tiệt Trùng Vinamilk/i)).toBeInTheDocument();
    expect(screen.getByText("+36.000 đ")).toBeInTheDocument();
  });

  it("chuyển sang giai đoạn payment khi tất cả sản phẩm đã được quét", () => {
    act(() => {
      useCartStore.getState().addItem(vinamilk);
      useCheckoutStore.getState().startCheckout();
      useCheckoutStore.getState().skipScanning(1);
    });

    render(<SelfCheckoutScanner3D />);

    expect(useCheckoutStore.getState().phase).toBe("payment");
    expect(screen.getByText("QUÉT VIETQR THANH TOÁN")).toBeInTheDocument();
    expect(screen.getByText("36.000 đ")).toBeInTheDocument();
    expect(screen.getByText(/Chạm để xác nhận thanh toán/i)).toBeInTheDocument();
  });

  it("xác nhận thanh toán thành công (phase = success), hiển thị mã đơn và in biên lai", () => {
    act(() => {
      useCartStore.getState().addItem(haohao);
      useCheckoutStore.getState().startCheckout();
      useCheckoutStore.getState().skipScanning(1);
      useCheckoutStore.getState().confirmPayment();
    });

    render(<SelfCheckoutScanner3D />);

    expect(useCheckoutStore.getState().phase).toBe("success");
    expect(screen.getByText("✓ ĐÃ THANH TOÁN THÀNH CÔNG!")).toBeInTheDocument();
    expect(screen.getByText(/Mã đơn: SM3D-\d{6}/i)).toBeInTheDocument();
    expect(screen.getByText("ĐÃ ĐÓNG GÓI ✓")).toBeInTheDocument();
  });
});
