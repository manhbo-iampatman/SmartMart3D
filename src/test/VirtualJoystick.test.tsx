import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { VirtualJoystick } from "../components/3d/VirtualJoystick";
import { useAppStore } from "../stores/useAppStore";

describe("VirtualJoystick - Cần điều khiển ảo cho di động (Giai đoạn 6)", () => {
  beforeEach(() => {
    act(() => {
      useAppStore.setState({
        mode: "3D",
        isCartOpen: false,
        isCheckoutOpen: false,
        inspectingProduct: null,
        virtualMove: { forward: 0, right: 0 },
      });
    });
    // Giả lập màn hình mobile
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 390 });
    window.dispatchEvent(new Event("resize"));
  });

  it("hiển thị cần gạt joystick trên thiết bị màn hình di động", () => {
    render(<VirtualJoystick />);
    expect(screen.getByRole("region", { name: /cần điều khiển ảo di chuyển/i })).toBeInTheDocument();
    expect(screen.getByText(/cần gạt di chuyển/i)).toBeInTheDocument();
  });

  it("kéo cần gạt về phía trước (Y âm) cập nhật virtualMove.forward > 0", () => {
    render(<VirtualJoystick />);
    const joystick = screen.getByRole("region", { name: /cần điều khiển ảo di chuyển/i });
    const base = joystick.querySelector("div")!;

    // Giả lập getBoundingClientRect
    base.getBoundingClientRect = () => ({
      left: 24,
      top: 500,
      width: 120,
      height: 120,
      right: 144,
      bottom: 620,
      x: 24,
      y: 500,
      toJSON: () => {},
    });

    // Kéo ngón tay lên trên (dy = -30px -> đẩy tới)
    fireEvent.touchStart(base, {
      changedTouches: [{ identifier: 1, clientX: 84, clientY: 530 }],
    });

    const move = useAppStore.getState().virtualMove;
    expect(move.forward).toBeGreaterThan(0);

    // Nhả ngón tay -> reset về 0
    fireEvent.touchEnd(base, {
      changedTouches: [{ identifier: 1, clientX: 84, clientY: 530 }],
    });
    expect(useAppStore.getState().virtualMove).toEqual({ forward: 0, right: 0 });
  });

  it("kéo cần gạt sang phải (X dương) cập nhật virtualMove.right > 0", () => {
    render(<VirtualJoystick />);
    const joystick = screen.getByRole("region", { name: /cần điều khiển ảo di chuyển/i });
    const base = joystick.querySelector("div")!;

    base.getBoundingClientRect = () => ({
      left: 24,
      top: 500,
      width: 120,
      height: 120,
      right: 144,
      bottom: 620,
      x: 24,
      y: 500,
      toJSON: () => {},
    });

    // Kéo ngón tay sang phải (dx = +35px -> sang phải)
    fireEvent.touchStart(base, {
      changedTouches: [{ identifier: 1, clientX: 119, clientY: 560 }],
    });

    const move = useAppStore.getState().virtualMove;
    expect(move.right).toBeGreaterThan(0);

    // Nhả tay
    fireEvent.touchEnd(base, {
      changedTouches: [{ identifier: 1, clientX: 119, clientY: 560 }],
    });
    expect(useAppStore.getState().virtualMove).toEqual({ forward: 0, right: 0 });
  });

  it("ẩn joystick khi giỏ hàng hoặc modal checkout đang mở", () => {
    const { rerender } = render(<VirtualJoystick />);
    expect(screen.getByRole("region", { name: /cần điều khiển ảo di chuyển/i })).toBeInTheDocument();

    act(() => useAppStore.getState().setIsCartOpen(true));
    rerender(<VirtualJoystick />);
    expect(screen.queryByRole("region", { name: /cần điều khiển ảo di chuyển/i })).not.toBeInTheDocument();
  });
});

