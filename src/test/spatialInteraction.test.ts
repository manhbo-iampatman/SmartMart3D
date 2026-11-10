import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { findReachableProduct, getProductFocusPosition, getWalkDisplacement } from "../utils/spatialInteraction";

const product = MOCK_PRODUCTS[0];

function makeProduct(z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial());
  mesh.position.z = z;
  mesh.userData.product = product;
  return mesh;
}

function pick(...objects: THREE.Object3D[]) {
  const scene = new THREE.Scene();
  scene.add(...objects);
  scene.updateMatrixWorld(true);
  return findReachableProduct(new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 0, -1)), scene.children);
}

describe("Raycast sản phẩm trong tầm với", () => {
  it("chọn sản phẩm gần nhất thay vì một món phía sau", () => {
    const near = makeProduct(-1);
    const far = makeProduct(-2);
    expect(pick(far, near)?.intersection.object).toBe(near);
  });

  it("không cho nhặt sản phẩm ở xa hơn 2,5 m", () => {
    expect(pick(makeProduct(-3))).toBeNull();
  });

  it("kiểm tra ranh giới 2,5 m theo điểm chạm bề mặt", () => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
    mesh.userData.product = product;
    mesh.position.z = -2.5;
    expect(pick(mesh)?.product.id).toBe(product.id);
    mesh.position.z = -2.501;
    expect(pick(mesh)).toBeNull();
  });

  it("không nhặt xuyên qua vách hoặc tầng kệ", () => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.1), new THREE.MeshBasicMaterial());
    shelf.position.z = -0.5;
    expect(pick(makeProduct(-1), shelf)).toBeNull();
  });

  it("bỏ qua các object bị ẩn và hiệu ứng không chặn raycast", () => {
    const hiddenGroup = new THREE.Group();
    hiddenGroup.visible = false;
    hiddenGroup.add(makeProduct(-0.5));
    const effect = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
    effect.position.z = -0.7;
    effect.userData.ignoreProductRaycast = true;
    expect(pick(hiddenGroup, effect, makeProduct(-1))?.product.id).toBe(product.id);
  });

  it("trả đúng instanceId cho sản phẩm trong InstancedMesh có transform cha", () => {
    const batch = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial(), 2);
    batch.userData.product = product;
    batch.setMatrixAt(0, new THREE.Matrix4().makeTranslation(3, 0, -1));
    batch.setMatrixAt(1, new THREE.Matrix4().makeTranslation(0, 0, -1.5));
    const group = new THREE.Group();
    group.position.z = -0.2;
    group.add(batch);
    expect(pick(group)?.intersection.instanceId).toBe(1);
  });
});

describe("Di chuyển theo camera", () => {
  it("phím D đi sang phải và A sang trái", () => {
    const camera = new THREE.PerspectiveCamera();
    expect(getWalkDisplacement(camera, 0, 1, 0.02, new THREE.Vector3()).x).toBeGreaterThan(0);
    expect(getWalkDisplacement(camera, 0, -1, 0.02, new THREE.Vector3()).x).toBeLessThan(0);
  });

  it("giữ tốc độ khi đi chéo hoặc nhìn xuống, không thay đổi độ cao", () => {
    const camera = new THREE.PerspectiveCamera();
    camera.rotation.x = -Math.PI / 3;
    const result = getWalkDisplacement(camera, 1, 1, 0.02, new THREE.Vector3());
    expect(result.length()).toBeCloseTo(0.08);
    expect(result.y).toBe(0);
  });

  it("không nhảy xa khi tab quay lại có delta lớn", () => {
    expect(getWalkDisplacement(new THREE.PerspectiveCamera(), 1, 0, 10, new THREE.Vector3()).length()).toBeCloseTo(0.2);
  });
});

it("định hướng camera vào instance thật gần địa chỉ kệ thay vì khe trống giữa hai lon", () => {
  const stockedProduct = { ...product, shelfLocation: { aisle: "Test", shelfTier: 1, worldPos: [0, 0, -1] as [number, number, number] } };
  const batch = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15), new THREE.MeshBasicMaterial(), 2);
  batch.userData.product = stockedProduct;
  batch.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-0.05, 0, -1));
  batch.setMatrixAt(1, new THREE.Matrix4().makeTranslation(0.05, 0, -1));
  const scene = new THREE.Scene();
  scene.add(batch);
  const focus = getProductFocusPosition(stockedProduct, scene);
  expect(Math.abs(focus.x)).toBeCloseTo(0.05);
  const raycaster = new THREE.Raycaster(new THREE.Vector3(), focus.clone().normalize());
  expect(findReachableProduct(raycaster, scene.children)?.product.id).toBe(product.id);
});
