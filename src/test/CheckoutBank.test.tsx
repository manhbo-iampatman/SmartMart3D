import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { CheckoutBank, buildCheckoutBankBatches, getKioskIndexFromSolidInstance } from "../components/3d/CheckoutBank";
import { CartCorral, buildCartCorralBatches } from "../components/3d/CartCorral";
import { ShoppingTrolley } from "../components/3d/ShoppingTrolley";
import {
  CHECKOUT_STATIONS_CONFIG,
  CHECKOUT_WALL_MURALS,
  CART_CORRAL_CONFIG,
} from "../data/checkoutLayout";
import { STORE_COLUMNS } from "../data/storeLayout";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { findReachableProduct, PRODUCT_REACH_METERS } from "../utils/spatialInteraction";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => {},
  useThree: () => ({ camera: { position: new THREE.Vector3(0, 1.65, 14.8) } }),
}));

vi.mock("@react-three/drei", () => ({
  Text: ({ children, ...props }: any) => <span data-testid="3d-text" {...props}>{children}</span>,
  RoundedBox: ({ children, ...props }: any) => <div data-testid="rounded-box" {...props}>{children}</div>,
}));

function assertValidMatrices(matrices: readonly THREE.Matrix4[]) {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (const mat of matrices) {
    mat.decompose(pos, quat, scale);
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
    expect(Number.isFinite(pos.z)).toBe(true);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(scale.x).toBeGreaterThan(0);
    expect(scale.y).toBeGreaterThan(0);
    expect(scale.z).toBeGreaterThan(0);
  }
}

describe("CheckoutBank & CartCorral - Cụm Kiosk Sảnh Nam & Chuồng Xe Đẩy (Phase 5)", () => {
  it("render đầy đủ cấu hình 8 Kiosk, 4 Pano tường Nam và 12 xe đẩy lồng nhau", () => {
    const bankView = render(<CheckoutBank />);
    const corralView = render(<CartCorral />);

    expect(CHECKOUT_STATIONS_CONFIG.length).toBe(8);
    expect(CHECKOUT_WALL_MURALS.length).toBe(4);
    expect(CART_CORRAL_CONFIG.lanes * CART_CORRAL_CONFIG.cartsPerLane).toBe(12);
    expect(bankView.container).toBeInTheDocument();
    expect(corralView.container).toBeInTheDocument();
  });

  it("dựng 7 THREE.InstancedMesh thật cho Kiosk Bank (không NaN, không zero-scale) & bắt Raycast 2.5m", () => {
    const batches = buildCheckoutBankBatches(CHECKOUT_STATIONS_CONFIG);

    expect(batches.whiteChassis.length).toBe(16);
    expect(batches.charcoalTops.length).toBe(16);
    expect(batches.baggingWings.length).toBe(16);
    expect(batches.blueAccents.length).toBe(16);
    expect(batches.statusLights.length).toBe(8);
    expect(batches.chromePoles.length).toBe(8);
    expect(batches.darkScreens.length).toBe(16);
    expect(batches.signFaces.length).toBe(16);

    assertValidMatrices(batches.whiteChassis);
    assertValidMatrices(batches.charcoalTops);
    assertValidMatrices(batches.baggingWings);
    assertValidMatrices(batches.blueAccents);
    assertValidMatrices(batches.statusLights);
    assertValidMatrices(batches.chromePoles);
    assertValidMatrices(batches.darkScreens);
    assertValidMatrices(batches.signFaces);

    // Dựng THREE.InstancedMesh thật cho thân bục Kiosk và test THREE.Raycaster từ điểm Kiosk Sảnh Nam (-6.5, 1.65, 14.8)
    const scene = new THREE.Scene();
    const chassisGeo = new THREE.BoxGeometry(1, 1, 1);
    const chassisMat = new THREE.MeshStandardMaterial({ color: "#f8fafc" });
    const instancedMesh = new THREE.InstancedMesh(
      chassisGeo,
      chassisMat,
      batches.whiteChassis.length
    );
    batches.whiteChassis.forEach((m, i) => instancedMesh.setMatrixAt(i, m));
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.computeBoundingBox();
    instancedMesh.computeBoundingSphere();
    scene.add(instancedMesh);
    scene.updateMatrixWorld(true);

    // Hướng từ (-6.5, 0.5, 14.8) nhìn thẳng +Z tới SCO-03 [-6.5, 0.5, 17.0]
    const rayInRange = new THREE.Raycaster(
      new THREE.Vector3(-6.36, 0.5, 14.8),
      new THREE.Vector3(0, 0, 1),
      0,
      PRODUCT_REACH_METERS
    );
    const hits = rayInRange.intersectObject(instancedMesh, false);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].distance).toBeLessThanOrEqual(PRODUCT_REACH_METERS);

    // Đứng xa > 2.5m tại z = 12.0 không với tới
    const rayOutOfRange = new THREE.Raycaster(
      new THREE.Vector3(-6.36, 0.5, 12.0),
      new THREE.Vector3(0, 0, 1),
      0,
      PRODUCT_REACH_METERS
    );
    expect(rayOutOfRange.intersectObject(instancedMesh, false).length).toBe(0);

    // Phase 6: Tra cứu trực tiếp trạm Kiosk SCO-01..08 từ instanceId của batched InstancedMesh
    for (let kIdx = 0; kIdx < CHECKOUT_STATIONS_CONFIG.length; kIdx++) {
      expect(getKioskIndexFromSolidInstance(kIdx * 8)).toBe(kIdx);
      expect(getKioskIndexFromSolidInstance(kIdx * 8 + 7)).toBe(kIdx);
    }
    expect(getKioskIndexFromSolidInstance(CHECKOUT_STATIONS_CONFIG.length * 8)).toBe(-1);
    expect(getKioskIndexFromSolidInstance(undefined)).toBe(-1);
  });

  it("dựng 5 THREE.InstancedMesh thật cho CartCorral (12 xe đẩy lồng nhau) và không đè cột col-w6", () => {
    const corralBatches = buildCartCorralBatches(CART_CORRAL_CONFIG);

    expect(corralBatches.rubberWheels.length).toBe(48); // 12 xe x 4 bánh
    expect(corralBatches.persimmonHandles.length).toBe(12);
    expect(corralBatches.nestedBaskets.length).toBe(12);
    expect(corralBatches.chromeRails.length).toBeGreaterThan(20);
    expect(corralBatches.chromePoles.length).toBeGreaterThan(40);

    assertValidMatrices(corralBatches.chromeRails);
    assertValidMatrices(corralBatches.chromePoles);
    assertValidMatrices(corralBatches.rubberWheels);
    assertValidMatrices(corralBatches.persimmonHandles);
    assertValidMatrices(corralBatches.nestedBaskets);

    // Đảm bảo CartCorral (-15.5, 21.5) không giao cắt với cột col-w6 (-10, 20)
    const colW6 = STORE_COLUMNS.find((c) => c.id === "col-w6")!;
    const distToColX = Math.abs(CART_CORRAL_CONFIG.position[0] - colW6.x) - CART_CORRAL_CONFIG.width / 2 - 0.25;
    expect(distToColX).toBeGreaterThan(2.5);

    // Kiểm tra raycast thật trên THREE.InstancedMesh rổ xe đẩy từ Chuồng Xe Đẩy (-15.5, 19.2)
    const scene = new THREE.Scene();
    const basketGeo = new THREE.BoxGeometry(1, 1, 1);
    const basketMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1" });
    const basketMesh = new THREE.InstancedMesh(
      basketGeo,
      basketMat,
      corralBatches.nestedBaskets.length
    );
    corralBatches.nestedBaskets.forEach((m, i) => basketMesh.setMatrixAt(i, m));
    basketMesh.instanceMatrix.needsUpdate = true;
    basketMesh.computeBoundingBox();
    basketMesh.computeBoundingSphere();
    scene.add(basketMesh);
    scene.updateMatrixWorld(true);

    const firstPos = new THREE.Vector3().setFromMatrixPosition(corralBatches.nestedBaskets[0]);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(firstPos.x, firstPos.y, 19.2),
      new THREE.Vector3(0, 0, 1),
      0,
      PRODUCT_REACH_METERS
    );
    const hits = ray.intersectObject(basketMesh, false);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].distance).toBeLessThanOrEqual(PRODUCT_REACH_METERS);
  });

  it("ShoppingTrolley gắn ignoreProductRaycast để không che tia nhặt hàng và bấm Kiosk", () => {
    const { container } = render(<ShoppingTrolley />);
    const trolleyNode = container.querySelector('[name="first-person-shopping-trolley"]');
    expect(trolleyNode).not.toBeNull();

    // Kiểm chứng trên THREE.Group thật: mesh mang ignoreProductRaycast đứng chắn phía trước không được cản tia tới sản phẩm
    const scene = new THREE.Scene();
    const trolleyGroup = new THREE.Group();
    trolleyGroup.userData.ignoreProductRaycast = true;
    trolleyGroup.position.set(0, 0.8, -0.82);
    trolleyGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial()));

    const product = MOCK_PRODUCTS.find((p) => p.has3D)!;
    const productMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), new THREE.MeshStandardMaterial());
    productMesh.position.set(0, 0.8, -1.6);
    productMesh.userData.product = product;

    scene.add(trolleyGroup, productMesh);
    scene.updateMatrixWorld(true);

    const ray = new THREE.Raycaster(new THREE.Vector3(0, 0.8, 0), new THREE.Vector3(0, 0, -1), 0, PRODUCT_REACH_METERS);
    const hit = findReachableProduct(ray, scene.children);
    expect(hit?.product.id).toBe(product.id);
  });
});
