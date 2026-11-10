import * as THREE from "three";
import type { AppMode, Product } from "../types";

export const PRODUCT_REACH_METERS = 2.5;
export const WALK_REQUEST_EVENT = "smartmart:walk";

export interface SpatialUIState {
  mode: AppMode;
  inspectingProduct: Product | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
}

export function isSpatialInputBlocked(state: SpatialUIState): boolean {
  return state.mode !== "3D" || !!state.inspectingProduct || state.isCartOpen || state.isCheckoutOpen;
}

export function isEditingText(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
  );
}

export interface ProductHit {
  product: Product;
  intersection: THREE.Intersection<THREE.Object3D>;
}

/** Aim at an actual stocked instance, not an aisle center that may be a gap between cans. */
export function getProductFocusPosition(product: Product, root?: THREE.Object3D): THREE.Vector3 {
  const shelfPosition = new THREE.Vector3(...(product.shelfLocation?.worldPos ?? [0, 1.65, 0]));
  const result = shelfPosition.clone();
  const candidate = new THREE.Vector3();
  const center = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  let closest = Infinity;
  root?.updateWorldMatrix(true, true);
  root?.traverse((object) => {
    if (!(object instanceof THREE.InstancedMesh) || object.userData.product?.id !== product.id || !isVisibleSurface(object)) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    object.geometry.boundingBox?.getCenter(center);
    for (let index = 0; index < object.count; index++) {
      object.getMatrixAt(index, matrix);
      candidate.copy(center).applyMatrix4(matrix).applyMatrix4(object.matrixWorld);
      const distance = candidate.distanceToSquared(shelfPosition);
      if (distance < closest) { closest = distance; result.copy(candidate); }
    }
  });
  return result;
}

function isVisibleSurface(object: THREE.Object3D): boolean {
  if (!(object instanceof THREE.Mesh)) return false;
  for (let node: THREE.Object3D | null = object; node; node = node.parent) {
    if (!node.visible || node.userData.ignoreProductRaycast) return false;
  }
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.some((material) => material.visible && material.opacity > 0);
}

/** Only the first visible surface can be picked; shelves block products behind them. */
export function findReachableProduct(
  raycaster: THREE.Raycaster,
  objects: THREE.Object3D[]
): ProductHit | null {
  const surface = raycaster.intersectObjects(objects, true).find(
    (hit) => hit.distance <= PRODUCT_REACH_METERS && isVisibleSurface(hit.object)
  );
  if (!surface) return null;

  for (let node: THREE.Object3D | null = surface.object; node; node = node.parent) {
    const product = node.userData.product as Product | undefined;
    if (product?.has3D) return { product, intersection: surface };
  }
  return null;
}

/** Horizontal camera-relative movement: looking up/down never changes walk speed. */
export function getWalkDisplacement(
  camera: THREE.Camera,
  forward: number,
  right: number,
  delta: number,
  result: THREE.Vector3
): THREE.Vector3 {
  camera.getWorldDirection(result);
  result.y = 0;
  result.normalize();
  const forwardX = result.x;
  const forwardZ = result.z;
  result.set(forwardX * forward - forwardZ * right, 0, forwardZ * forward + forwardX * right);
  return result.normalize().multiplyScalar(4 * Math.min(delta, 0.05));
}
