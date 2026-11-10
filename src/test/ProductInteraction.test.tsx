import { act, fireEvent, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import type { RootState } from "@react-three/fiber";
import { useProductInteraction } from "../components/3d/ProductInteraction";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { useAppStore } from "../stores/useAppStore";

const fiber = vi.hoisted(() => ({
  state: null as unknown as RootState,
  frame: (_state: RootState, _delta: number) => {},
}));
vi.mock("@react-three/fiber", () => ({
  useThree: () => fiber.state,
  useFrame: (callback: typeof fiber.frame) => { fiber.frame = callback; },
}));

const product = MOCK_PRODUCTS[0];
let canvas: HTMLCanvasElement;
let mesh: THREE.Mesh;

beforeEach(() => {
  useAppStore.setState({ mode: "3D", hoveredProduct: null, hoveredDistance: null, inspectingProduct: null, isCartOpen: false, isCheckoutOpen: false });
  canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 400 }) as DOMRect;
  const camera = new THREE.PerspectiveCamera(60, 1.5, 0.1, 20);
  const scene = new THREE.Scene();
  mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), new THREE.MeshBasicMaterial());
  mesh.userData.product = product;
  mesh.position.z = -1;
  scene.add(mesh);
  scene.updateMatrixWorld(true);
  fiber.state = { camera, scene, gl: { domElement: canvas } } as unknown as RootState;
});

describe("Tương tác sản phẩm thực tế, không cần WebGL", () => {
  it("ngắm giữa camera hiển thị khoảng cách, phím E mở đúng sản phẩm", () => {
    renderHook(() => useProductInteraction());
    act(() => fiber.frame(fiber.state, 0.1));
    expect(useAppStore.getState().hoveredProduct?.id).toBe(product.id);
    expect(useAppStore.getState().hoveredDistance).toBe(0.9);
    fireEvent.keyDown(window, { code: "KeyE" });
    expect(useAppStore.getState().inspectingProduct?.id).toBe(product.id);
    expect(useAppStore.getState().hoveredProduct).toBeNull();
  });

  it("raycast lại khi bấm E, không mở mục tiêu cũ sau khi đã đi ra xa", () => {
    renderHook(() => useProductInteraction());
    act(() => fiber.frame(fiber.state, 0.1));
    mesh.position.z = -4;
    mesh.updateMatrixWorld(true);
    fireEvent.keyDown(window, { code: "KeyE" });
    expect(useAppStore.getState().inspectingProduct).toBeNull();
  });

  it("click ở vị trí con trỏ mở hàng, click ngoài hàng không mở", () => {
    renderHook(() => useProductInteraction());
    fireEvent.click(canvas, { clientX: 5, clientY: 5 });
    expect(useAppStore.getState().inspectingProduct).toBeNull();
    fireEvent.click(canvas, { clientX: 300, clientY: 200 });
    expect(useAppStore.getState().inspectingProduct?.id).toBe(product.id);
  });

  it("không nhận E đang gõ tìm kiếm, key-repeat hoặc khi giỏ đang mở", () => {
    renderHook(() => useProductInteraction());
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { code: "KeyE" });
    expect(useAppStore.getState().inspectingProduct).toBeNull();
    input.remove();
    fireEvent.keyDown(window, { code: "KeyE", repeat: true });
    expect(useAppStore.getState().inspectingProduct).toBeNull();
    act(() => useAppStore.getState().setIsCartOpen(true));
    fireEvent.keyDown(window, { code: "KeyE" });
    fireEvent.click(canvas, { clientX: 300, clientY: 200 });
    expect(useAppStore.getState().inspectingProduct).toBeNull();
  });

  it("không để listener E và hover tồn tại khi rời 3D", () => {
    const hook = renderHook(() => useProductInteraction());
    act(() => fiber.frame(fiber.state, 0.1));
    hook.unmount();
    fireEvent.keyDown(window, { code: "KeyE" });
    expect(useAppStore.getState().inspectingProduct).toBeNull();
    expect(useAppStore.getState().hoveredProduct).toBeNull();
  });

  it("E luôn dùng tâm camera sau khi chọn dẫn đường trên HUD, không phụ thuộc vị trí con trỏ cũ", () => {
    renderHook(() => useProductInteraction());
    fireEvent.pointerLeave(canvas);
    fireEvent.keyDown(window, { code: "KeyE" });
    expect(useAppStore.getState().inspectingProduct?.id).toBe(product.id);
  });
});
