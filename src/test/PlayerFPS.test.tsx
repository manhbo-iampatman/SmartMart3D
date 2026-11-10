import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import type { RootState } from "@react-three/fiber";
import { PlayerFPS } from "../components/3d/PlayerFPS";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { useAppStore } from "../stores/useAppStore";
import { useNavigationStore } from "../stores/useNavigationStore";
import { getShelfApproach, isWalkable } from "../utils/pathfinding";
import { WALK_REQUEST_EVENT } from "../utils/spatialInteraction";
import * as supermarketAudio from "../utils/supermarketAudio";

const fiber = vi.hoisted(() => ({
  state: null as unknown as RootState,
  frame: (_state: RootState, _delta: number) => {},
}));
vi.mock("@react-three/fiber", () => ({
  useThree: () => fiber.state,
  useFrame: (callback: typeof fiber.frame) => { fiber.frame = callback; },
}));

let canvas: HTMLCanvasElement;
let lockedElement: Element | null;
let exitLock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  useNavigationStore.setState(useNavigationStore.getInitialState(), true);
  useAppStore.setState({ mode: "3D", target3DPosition: null, inspectingProduct: null, isCartOpen: false, isCheckoutOpen: false, isPointerLocked: false });
  canvas = document.createElement("canvas");
  lockedElement = null;
  exitLock = vi.fn(() => { lockedElement = null; document.dispatchEvent(new Event("pointerlockchange")); });
  Object.defineProperty(document, "pointerLockElement", { configurable: true, get: () => lockedElement });
  Object.defineProperty(document, "exitPointerLock", { configurable: true, value: exitLock });
  fiber.state = { camera: new THREE.PerspectiveCamera(), gl: { domElement: canvas } } as unknown as RootState;
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(document, "pointerLockElement");
  Reflect.deleteProperty(document, "exitPointerLock");
});

describe("PlayerFPS - trạng thái điều khiển khi mua sắm", () => {
  it("D đi sang phải, giữ nguyên chiều cao mắt", () => {
    render(<PlayerFPS />);
    fireEvent.keyDown(window, { code: "KeyD" });
    act(() => fiber.frame(fiber.state, 0.02));
    expect(fiber.state.camera.position.x).toBeGreaterThan(0);
    expect(fiber.state.camera.position.y).toBe(1.65);
  });

  it("mở inspector nhả pointer lock, xóa phím giữ và không tự đi tiếp sau khi đóng", () => {
    render(<PlayerFPS />);
    lockedElement = canvas;
    fireEvent(document, new Event("pointerlockchange"));
    fireEvent.keyDown(window, { code: "KeyW" });
    act(() => fiber.frame(fiber.state, 0.02));
    const position = fiber.state.camera.position.clone();
    act(() => useAppStore.getState().setInspectingProduct(MOCK_PRODUCTS[0]));
    expect(exitLock).toHaveBeenCalledOnce();
    act(() => fiber.frame(fiber.state, 0.02));
    act(() => useAppStore.getState().setInspectingProduct(null));
    act(() => fiber.frame(fiber.state, 0.02));
    expect(fiber.state.camera.position.equals(position)).toBe(true);
    expect(useAppStore.getState().isPointerLocked).toBe(false);
  });

  it("gõ WASD vào ô tìm kiếm không làm camera di chuyển", () => {
    render(<PlayerFPS />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { code: "KeyW" });
    const before = fiber.state.camera.position.clone();
    act(() => fiber.frame(fiber.state, 0.02));
    expect(fiber.state.camera.position.equals(before)).toBe(true);
    input.remove();
  });

  it("mất focus xóa các phím đang giữ", () => {
    render(<PlayerFPS />);
    fireEvent.keyDown(window, { code: "KeyW" });
    fireEvent.blur(window);
    act(() => fiber.frame(fiber.state, 0.02));
    expect(fiber.state.camera.position.z).toBe(4.5);
  });

  it("không yêu cầu pointer lock khi click hàng và xử lý trình duyệt từ chối khóa chuột", async () => {
    const lock = vi.fn().mockRejectedValue(new Error("Pointer lock unavailable"));
    canvas.requestPointerLock = lock;
    render(<PlayerFPS />);
    fireEvent.click(canvas);
    expect(lock).not.toHaveBeenCalled();
    await act(async () => window.dispatchEvent(new Event(WALK_REQUEST_EVENT)));
    expect(lock).toHaveBeenCalledOnce();
    expect(useAppStore.getState().isPointerLocked).toBe(false);
  });

  it("rời scene gỡ listener và không còn nhận yêu cầu dạo bằng chuột", () => {
    canvas.requestPointerLock = vi.fn();
    const view = render(<PlayerFPS />);
    view.unmount();
    window.dispatchEvent(new Event(WALK_REQUEST_EVENT));
    expect(canvas.requestPointerLock).not.toHaveBeenCalled();
  });

  it("tự đi tới kệ bằng đường A*, không xuyên vật cản và dừng đúng điểm", () => {
    render(<PlayerFPS />);
    act(() => useAppStore.getState().navigateToProductIn3D(MOCK_PRODUCTS[0]));
    act(() => useNavigationStore.getState().setAutoWalking(true));
    let frames = 0;
    while (useNavigationStore.getState().autoWalking && frames++ < 1500) {
      act(() => fiber.frame(fiber.state, 0.02));
      expect(isWalkable({ x: fiber.state.camera.position.x, z: fiber.state.camera.position.z })).toBe(true);
    }
    expect(useNavigationStore.getState().status).toBe("arrived");
    expect(frames).toBeLessThan(1500);
    expect(useNavigationStore.getState().distance).toBe(0);
  });

  it("WASD hủy chế độ tự đi và mở giỏ không tự tiếp tục di chuyển", () => {
    render(<PlayerFPS />);
    act(() => useAppStore.getState().navigateToProductIn3D(MOCK_PRODUCTS[0]));
    act(() => useNavigationStore.getState().setAutoWalking(true));
    fireEvent.keyDown(window, { code: "KeyD" });
    expect(useNavigationStore.getState().autoWalking).toBe(false);
    act(() => useAppStore.getState().setIsCartOpen(true));
    const position = fiber.state.camera.position.clone();
    act(() => fiber.frame(fiber.state, 0.02));
    expect(fiber.state.camera.position.equals(position)).toBe(true);
  });

  it("trục chính giữa sảnh thông thoáng khi giữ W và không đi xuyên kệ Gondola", () => {
    render(<PlayerFPS />);
    fireEvent.keyDown(window, { code: "KeyW" });
    for (let frame = 0; frame < 200; frame++) act(() => fiber.frame(fiber.state, 0.02));
    expect(fiber.state.camera.position.z).toBeLessThan(-10);
    expect(isWalkable({ x: fiber.state.camera.position.x, z: fiber.state.camera.position.z })).toBe(true);
    fireEvent.keyUp(window, { code: "KeyW" });

    // Đứng trước dãy kệ A02 (-2.6, 9.0) nhìn hướng Bắc (-Z) -> giữ W phải dừng sát đầu kệ
    act(() => {
      fiber.state.camera.position.set(-2.6, 1.65, 9.0);
      fiber.state.camera.lookAt(-2.6, 1.65, 0);
    });
    fireEvent.keyDown(window, { code: "KeyW" });
    for (let frame = 0; frame < 150; frame++) act(() => fiber.frame(fiber.state, 0.02));
    expect(fiber.state.camera.position.z).toBeGreaterThan(6.8);
    expect(isWalkable({ x: fiber.state.camera.position.x, z: fiber.state.camera.position.z })).toBe(true);
  });

  it("tìm kệ từ 2D dùng điểm đứng an toàn, kể cả kệ ở cạnh đảo khuyến mãi", () => {
    const product = MOCK_PRODUCTS.find((item) => item.id === "prod-drink-sting")!;
    act(() => useAppStore.getState().goToProductIn3D(product));
    render(<PlayerFPS />);
    const point = getShelfApproach(product.shelfLocation!.worldPos)!;
    expect(fiber.state.camera.position.x).toBeCloseTo(point.x);
    expect(fiber.state.camera.position.z).toBeCloseTo(point.z);
    expect(useAppStore.getState().target3DPosition).toBeNull();
    expect(isWalkable(point)).toBe(true);
  });

  it("không bị kẹt khi waypoint tiếp theo gần hơn ngưỡng cập nhật pose", () => {
    render(<PlayerFPS />);
    act(() => useNavigationStore.setState({
      destination: { x: 1, z: 3 }, status: "navigating", autoWalking: true,
      path: [{ x: 0, z: 4.5 }, { x: 0.005, z: 4.5 }, { x: 1, z: 3 }],
    }));
    let frames = 0;
    while (useNavigationStore.getState().autoWalking && frames++ < 300) {
      act(() => fiber.frame(fiber.state, 0.02));
    }
    expect(useNavigationStore.getState().status).toBe("arrived");
    expect(frames).toBeLessThan(300);
  });

  it("dừng toàn bộ âm thanh xe đẩy khi mở Checkout / bị chặn điều khiển không gian", () => {
    const stopSpy = vi.spyOn(supermarketAudio, "stopAllSupermarketSounds");
    render(<PlayerFPS />);
    act(() => useAppStore.getState().setIsCheckoutOpen(true));
    expect(stopSpy).toHaveBeenCalled();
    stopSpy.mockRestore();
  });
});
