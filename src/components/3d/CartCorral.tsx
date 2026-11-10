import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CART_CORRAL_CONFIG, type CartCorralConfig } from "../../data/checkoutLayout";
import { useAppStore } from "../../stores/useAppStore";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import { getWireMeshTexture } from "../../utils/textureGenerator";
import { playCartDropClack, unlockAudioContext } from "../../utils/supermarketAudio";
import { isSpatialInputBlocked, PRODUCT_REACH_METERS } from "../../utils/spatialInteraction";

export interface CartCorralBatches {
  chromeRails: THREE.Matrix4[];
  chromePoles: THREE.Matrix4[];
  rubberWheels: THREE.Matrix4[];
  persimmonHandles: THREE.Matrix4[];
  nestedBaskets: THREE.Matrix4[];
}

/**
 * Pure Builder dựng toàn bộ 5 InstancedMesh cho Chuồng Xe Đẩy (hàng rào U + 12 xe đẩy lồng nhau 2 làn).
 * Toàn bộ giỏ lưới dùng CanvasTexture cắt alphaTest thay wireframe để khử overdraw.
 */
export function buildCartCorralBatches(
  config: CartCorralConfig = CART_CORRAL_CONFIG
): CartCorralBatches {
  const chromeRails: THREE.Matrix4[] = [];
  const chromePoles: THREE.Matrix4[] = [];
  const rubberWheels: THREE.Matrix4[] = [];
  const persimmonHandles: THREE.Matrix4[] = [];
  const nestedBaskets: THREE.Matrix4[] = [];

  const rootMat = new THREE.Matrix4().makeTranslation(...config.position);
  const local = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const e = new THREE.Euler();

  const pushBox = (
    arr: THREE.Matrix4[],
    lx: number,
    ly: number,
    lz: number,
    sx: number,
    sy: number,
    sz: number,
    rz = 0
  ) => {
    e.set(0, 0, rz);
    q.setFromEuler(e);
    p.set(lx, ly, lz);
    s.set(sx, sy, sz);
    local.compose(p, q, s);
    arr.push(new THREE.Matrix4().multiplyMatrices(rootMat, local));
  };

  const hw = config.width / 2;
  const hd = config.depth / 2;

  // 1. Hàng rào inox chữ U mở miệng hướng Đông (+X)
  for (const laneZ of [-hd + 0.05, 0, hd - 0.05]) {
    // Thanh lan can trên & dưới
    pushBox(chromeRails, 0, 0.92, laneZ, config.width, 0.045, 0.045);
    pushBox(chromeRails, 0, 0.48, laneZ, config.width, 0.035, 0.035);

    // 4 cột trụ dọc mỗi dãy rào
    for (let i = 0; i < 4; i++) {
      const px = -hw + 0.08 + i * ((config.width - 0.16) / 3);
      pushBox(chromePoles, px, config.height / 2, laneZ, 0.045, config.height, 0.045);
    }
  }
  // Thanh chặn hậu phía Tây (-X)
  pushBox(chromeRails, -hw + 0.05, 0.92, 0, 0.045, 0.045, config.depth - 0.1);
  pushBox(chromeRails, -hw + 0.05, 0.48, 0, 0.045, 0.035, config.depth - 0.1);

  // 2. 2 hàng x 6 xe đẩy = 12 xe đẩy lồng vào nhau dọc trục +X
  const laneCenterZs = [-config.depth / 4, config.depth / 4];
  const startCartX = -hw + 0.55;

  for (const laneZ of laneCenterZs) {
    for (let c = 0; c < config.cartsPerLane; c++) {
      const cx = startCartX + c * config.pitchX;

      // Khung gầm xe & viền trên rổ
      pushBox(chromeRails, cx, 0.14, laneZ, 0.62, 0.035, 0.46);
      pushBox(chromeRails, cx + 0.02, 0.82, laneZ, 0.66, 0.025, 0.50);

      // 4 trụ chân & tay vịn
      for (const [dx, dz, h] of [
        [-0.24, -0.21, 0.68],
        [-0.24, 0.21, 0.68],
        [0.24, -0.22, 0.78],
        [0.24, 0.22, 0.78],
      ]) {
        pushBox(chromePoles, cx + dx, h / 2 + 0.14, laneZ + dz, 0.022, h, 0.022);
      }

      // 4 bánh xe cao su xoay
      for (const [wx, wz] of [
        [-0.24, -0.2],
        [-0.24, 0.2],
        [0.24, -0.2],
        [0.24, 0.2],
      ]) {
        pushBox(rubberWheels, cx + wx, 0.055, laneZ + wz, 0.08, 0.11, 0.035);
      }

      // Tay cầm SmartMart cam Persimmon phía sau xe đẩy (+X)
      pushBox(persimmonHandles, cx + 0.26, 0.94, laneZ, 0.042, 0.042, 0.48);

      // Rổ lưới kim loại cắt alphaTest
      pushBox(nestedBaskets, cx - 0.02, 0.62, laneZ, 0.62, 0.36, 0.46);
    }
  }

  return {
    chromeRails,
    chromePoles,
    rubberWheels,
    persimmonHandles,
    nestedBaskets,
  };
}

/**
 * CartCorral (Phase 6 - Consolidated InstancedMesh, không dùng hitbox opacity=0)
 * Chuồng xe đẩy 12 chiếc lồng nhau tại Sảnh Nam-Tây [-15.5, 0, 21.5]
 */
export const CartCorral: React.FC = () => {
  const solidRef = useRef<THREE.InstancedMesh>(null);
  const polesRef = useRef<THREE.InstancedMesh>(null);
  const basketsRef = useRef<THREE.InstancedMesh>(null);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const unitCyl = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 10), []);
  const wireTex = useMemo(() => getWireMeshTexture(), []);

  const mats = useMemo(() => ({
    solidVertex: new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0.45, roughness: 0.35 }),
    pole: new THREE.MeshStandardMaterial({ color: "#e2e8f0", metalness: 0.85, roughness: 0.18 }),
    basket: new THREE.MeshStandardMaterial({
      ...(wireTex.image ? { map: wireTex } : {}),
      color: "#cbd5e1",
      metalness: 0.8,
      roughness: 0.25,
      alphaTest: wireTex.image ? 0.45 : 0,
      side: THREE.DoubleSide,
    }),
  }), [wireTex]);

  const batches = useMemo(() => buildCartCorralBatches(CART_CORRAL_CONFIG), []);

  const solidMerged = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const C_RAIL = new THREE.Color("#cbd5e1");
    const C_WHEEL = new THREE.Color("#334155");
    const C_HANDLE = new THREE.Color("#ff5400");

    for (const m of batches.chromeRails) {
      matrices.push(m);
      colors.push(C_RAIL);
    }
    for (const m of batches.rubberWheels) {
      matrices.push(m);
      colors.push(C_WHEEL);
    }
    for (const m of batches.persimmonHandles) {
      matrices.push(m);
      colors.push(C_HANDLE);
    }
    return { matrices, colors };
  }, [batches]);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidRef.current, solidMerged.matrices, 0, solidMerged.colors);
    applyMatricesToInstancedMesh(polesRef.current, batches.chromePoles);
    applyMatricesToInstancedMesh(basketsRef.current, batches.nestedBaskets);
  }, [batches, solidMerged]);

  const handleCorralClick = (distance: number, stopPropagation: () => void) => {
    stopPropagation();
    if (isSpatialInputBlocked(useAppStore.getState())) return;
    if (distance > PRODUCT_REACH_METERS + 0.6) return;
    unlockAudioContext();
    playCartDropClack();
    useAppStore.getState().setIsCartOpen(true);
  };

  return (
    <group userData={{ ignoreProductRaycast: true }}>
      <instancedMesh
        ref={solidRef}
        args={[unitBox, mats.solidVertex, solidMerged.matrices.length]}
        castShadow
        onClick={(e) => handleCorralClick(e.distance, () => e.stopPropagation())}
      />
      <instancedMesh ref={polesRef} args={[unitCyl, mats.pole, batches.chromePoles.length]} />
      <instancedMesh
        ref={basketsRef}
        args={[unitBox, mats.basket, batches.nestedBaskets.length]}
        onClick={(e) => handleCorralClick(e.distance, () => e.stopPropagation())}
      />
    </group>
  );
};
