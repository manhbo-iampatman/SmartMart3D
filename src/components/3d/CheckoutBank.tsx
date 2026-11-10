import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CHECKOUT_STATIONS_CONFIG,
  CHECKOUT_WALL_MURALS,
  type CheckoutKioskConfig,
} from "../../data/checkoutLayout";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";
import { useCheckoutStore } from "../../stores/useCheckoutStore";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import {
  getSelfCheckoutSignTexture,
  getFreshPicksMuralTexture,
  getFillYourPantryMuralTexture,
} from "../../utils/textureGenerator";
import {
  playLaserBeepSound,
  playCartDropClack,
  playReceiptPrintSound,
  playPaymentSuccessFanfare,
  unlockAudioContext,
} from "../../utils/supermarketAudio";
import { isSpatialInputBlocked, PRODUCT_REACH_METERS } from "../../utils/spatialInteraction";

export interface CheckoutBankBatches {
  whiteChassis: THREE.Matrix4[];
  charcoalTops: THREE.Matrix4[];
  baggingWings: THREE.Matrix4[];
  blueAccents: THREE.Matrix4[];
  statusLights: THREE.Matrix4[];
  chromePoles: THREE.Matrix4[];
  darkScreens: THREE.Matrix4[];
  signFaces: THREE.Matrix4[];
}

/**
 * Pure Builder dựng toàn bộ ma trận 7 InstancedMesh chính + mặt biển hiệu cho Dãy 8 Kiosk Sảnh Nam.
 * Cho phép Vitest dựng THREE.InstancedMesh thật kiểm chứng hình học, tọa độ và Raycast.
 */
export function buildCheckoutBankBatches(
  kiosks: readonly CheckoutKioskConfig[] = CHECKOUT_STATIONS_CONFIG
): CheckoutBankBatches {
  const whiteChassis: THREE.Matrix4[] = [];
  const charcoalTops: THREE.Matrix4[] = [];
  const baggingWings: THREE.Matrix4[] = [];
  const blueAccents: THREE.Matrix4[] = [];
  const statusLights: THREE.Matrix4[] = [];
  const chromePoles: THREE.Matrix4[] = [];
  const darkScreens: THREE.Matrix4[] = [];
  const signFaces: THREE.Matrix4[] = [];

  const kMat = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const e = new THREE.Euler();

  const pushLocal = (
    arr: THREE.Matrix4[],
    parent: THREE.Matrix4,
    lx: number,
    ly: number,
    lz: number,
    sx: number,
    sy: number,
    sz: number,
    rx = 0,
    ry = 0,
    rz = 0
  ) => {
    e.set(rx, ry, rz);
    q.setFromEuler(e);
    p.set(lx, ly, lz);
    s.set(sx, sy, sz);
    local.compose(p, q, s);
    arr.push(new THREE.Matrix4().multiplyMatrices(parent, local));
  };

  for (const k of kiosks) {
    kMat.compose(
      new THREE.Vector3(...k.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, k.rotationY, 0)),
      new THREE.Vector3(1, 1, 1)
    );

    // 1. Thân bệ trắng hyper-surface (#F8FAFC) + chân đế màn hình POS
    pushLocal(whiteChassis, kMat, 0.14, 0.43, 0, 0.86, 0.86, 0.72);
    pushLocal(whiteChassis, kMat, 0.14, 1.04, -0.16, 0.08, 0.24, 0.08);

    // 2. Mặt bàn thao tác dark slate (#0F172A) & vỏ màn hình POS cảm ứng hơi ngửa
    pushLocal(charcoalTops, kMat, 0.14, 0.89, 0, 0.90, 0.06, 0.76);
    pushLocal(charcoalTops, kMat, 0.14, 1.25, -0.13, 0.50, 0.34, 0.04, -0.18, 0, 0);

    // 3. Cánh bàn đóng túi bên trái thấp hơn một chút (giống ảnh 06-checkout.webp)
    pushLocal(baggingWings, kMat, -0.54, 0.36, 0, 0.50, 0.72, 0.66);
    pushLocal(baggingWings, kMat, -0.54, 0.74, 0, 0.52, 0.04, 0.68);

    // 4. Đầu đọc thẻ thanh toán bên phải & khối biển hiệu "Self checkout" hyper-primary (#0052CC)
    pushLocal(blueAccents, kMat, 0.65, 0.92, 0.08, 0.16, 0.08, 0.22, 0.22, 0, 0);
    pushLocal(blueAccents, kMat, 0.08, k.signHeight, 0, 1.18, 0.38, 0.05);

    // 5. Đèn trạng thái đỉnh cột hyper-fresh (#10B981)
    pushLocal(statusLights, kMat, 0.08, k.signHeight + 0.22, 0, 0.34, 0.05, 0.06);

    // 6. Cột kim loại inox đỡ biển treo cao
    pushLocal(chromePoles, kMat, 0.08, 1.66, -0.24, 0.036, 1.56, 0.036);

    // 7. Mặt kính máy quét laser & màn hình hiển thị POS
    pushLocal(darkScreens, kMat, 0.14, 0.925, 0.10, 0.34, 0.012, 0.26);
    pushLocal(darkScreens, kMat, 0.14, 1.25, -0.105, 0.45, 0.29, 0.015, -0.18, 0, 0);

    // Mặt decal phẳng 2 mặt biển "Self checkout"
    pushLocal(signFaces, kMat, 0.08, k.signHeight, 0.028, 1.14, 0.35, 1);
    pushLocal(signFaces, kMat, 0.08, k.signHeight, -0.028, 1.14, 0.35, 1, 0, Math.PI, 0);
  }

  return {
    whiteChassis,
    charcoalTops,
    baggingWings,
    blueAccents,
    statusLights,
    chromePoles,
    darkScreens,
    signFaces,
  };
}

export function getKioskIndexFromSolidInstance(
  instanceId: number | undefined,
  kioskCount = CHECKOUT_STATIONS_CONFIG.length
): number {
  if (instanceId === undefined || instanceId < 0) return -1;
  const idx = Math.floor(instanceId / 8);
  return idx < kioskCount ? idx : -1;
}

/**
 * Hero Overlay duy nhất chạy hiệu ứng quét laser / món hàng bay / hóa đơn
 * khi người dùng thao tác trực tiếp tại một trong 8 Kiosk Sảnh Nam (SCO-01..08).
 */
const ActiveSouthKioskOverlay: React.FC = () => {
  const activeKioskId = useCheckoutStore((s) => s.activeKioskId);
  const phase = useCheckoutStore((s) => s.phase);
  const isAutoScanning = useCheckoutStore((s) => s.isAutoScanning);
  const advanceToNextItem = useCheckoutStore((s) => s.advanceToNextItem);
  const items = useCartStore((s) => s.items);

  const activeKiosk = useMemo(
    () => CHECKOUT_STATIONS_CONFIG.find((k) => k.id === activeKioskId),
    [activeKioskId]
  );

  const scannableUnits = useMemo(
    () => items.flatMap((item) => Array.from({ length: item.quantity }, () => item.product)),
    [items]
  );

  const progressRef = useRef(0);
  const hasBeepedRef = useRef(false);
  const hasDroppedRef = useRef(false);
  const prevPhaseRef = useRef(phase);

  const itemMeshRef = useRef<THREE.Mesh>(null);
  const laserMeshRef = useRef<THREE.Mesh>(null);
  const receiptMeshRef = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    if (phase === "success" && prevPhaseRef.current !== "success") {
      playPaymentSuccessFanfare();
      playReceiptPrintSound();
    }
    prevPhaseRef.current = phase;
    progressRef.current = 0;
    hasBeepedRef.current = false;
    hasDroppedRef.current = false;
  }, [phase, activeKioskId]);

  useFrame((state, delta) => {
    if (!activeKiosk) return;

    const totalUnits = scannableUnits.length;
    if (phase === "scanning" && isAutoScanning && totalUnits > 0) {
      progressRef.current += delta * 0.9;
      if (progressRef.current >= 0.45 && !hasBeepedRef.current) {
        hasBeepedRef.current = true;
        playLaserBeepSound();
      }
      if (progressRef.current >= 0.92 && !hasDroppedRef.current) {
        hasDroppedRef.current = true;
        playCartDropClack();
      }
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        hasBeepedRef.current = false;
        hasDroppedRef.current = false;
        advanceToNextItem(totalUnits);
      }

      if (itemMeshRef.current) {
        const p = progressRef.current;
        itemMeshRef.current.visible = true;
        if (p < 0.4) {
          const t = p / 0.4;
          itemMeshRef.current.position.set(
            THREE.MathUtils.lerp(0.45, 0.14, t),
            THREE.MathUtils.lerp(0.98, 1.05, t) + Math.sin(t * Math.PI) * 0.1,
            THREE.MathUtils.lerp(0.08, 0.1, t)
          );
          itemMeshRef.current.scale.setScalar(1);
        } else if (p < 0.6) {
          itemMeshRef.current.position.set(0.14, 1.05, 0.1);
          itemMeshRef.current.scale.setScalar(1.04);
        } else {
          const t = (p - 0.6) / 0.4;
          itemMeshRef.current.position.set(
            THREE.MathUtils.lerp(0.14, -0.54, t),
            THREE.MathUtils.lerp(1.05, 0.85, t) + Math.sin(t * Math.PI) * 0.18,
            THREE.MathUtils.lerp(0.1, 0, t)
          );
          itemMeshRef.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.55, t));
        }
      }
    } else if (itemMeshRef.current) {
      itemMeshRef.current.visible = false;
    }

    if (laserMeshRef.current) {
      laserMeshRef.current.visible = phase === "scanning";
      laserMeshRef.current.position.z = 0.1 + Math.sin(state.clock.elapsedTime * 8) * 0.08;
    }

    if (receiptMeshRef.current) {
      receiptMeshRef.current.visible = phase === "success";
      const nextScale = phase === "success" ? Math.min(1, receiptMeshRef.current.scale.y + delta * 1.8) : 0.05;
      receiptMeshRef.current.scale.set(1, Math.max(0.05, nextScale), 1);
    }
  });

  if (!activeKiosk) return null;

  return (
    <group
      position={activeKiosk.position}
      rotation={[0, activeKiosk.rotationY, 0]}
      userData={{ ignoreProductRaycast: true }}
    >
      {/* Túi giấy SmartMart ở cánh đóng túi */}
      <mesh position={[-0.54, 0.88, 0]} castShadow>
        <boxGeometry args={[0.24, 0.24, 0.18]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.75} />
      </mesh>

      {phase !== "idle" && (
        <>
          {/* Tia laser quét đỏ */}
          <mesh ref={laserMeshRef} position={[0.14, 0.94, 0.1]} visible={false}>
            <boxGeometry args={[0.3, 0.006, 0.008]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
          </mesh>

          {/* Món hàng đang lướt quét */}
          <mesh ref={itemMeshRef} position={[0.14, 1.05, 0.1]} visible={false}>
            <boxGeometry args={[0.14, 0.16, 0.12]} />
            <meshStandardMaterial color="#ff5400" roughness={0.25} />
          </mesh>

          {/* Hóa đơn giấy in nhiệt */}
          <mesh ref={receiptMeshRef} position={[0.52, 0.98, 0.12]} visible={false}>
            <boxGeometry args={[0.1, 0.22, 0.003]} />
            <meshStandardMaterial color="#ffffff" roughness={0.35} />
          </mesh>
        </>
      )}
    </group>
  );
};

/**
 * CheckoutBank (Phase 6 - Consolidated InstancedMesh + Direct instanceId Hit Detection)
 * Dãy 8 Kiosk Self-Checkout Sảnh Nam + 4 Pano Tường Nam gộp vào ~7 InstancedMesh (bỏ toàn bộ hitbox opacity={0})
 */
export const CheckoutBank: React.FC = () => {
  const solidBoxRef = useRef<THREE.InstancedMesh>(null);
  const statusRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const screenRef = useRef<THREE.InstancedMesh>(null);
  const signFaceRef = useRef<THREE.InstancedMesh>(null);
  const freshMuralRef = useRef<THREE.InstancedMesh>(null);
  const pantryMuralRef = useRef<THREE.InstancedMesh>(null);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const unitCyl = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 10), []);
  const unitPlane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const signTexture = useMemo(() => getSelfCheckoutSignTexture(), []);
  const freshMuralTex = useMemo(() => getFreshPicksMuralTexture(), []);
  const pantryMuralTex = useMemo(() => getFillYourPantryMuralTexture(), []);

  const mats = useMemo(() => ({
    solidVertex: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.32, metalness: 0.18 }),
    statusFresh: new THREE.MeshStandardMaterial({ color: "#10b981", emissive: "#10b981", emissiveIntensity: 0.8 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.85, roughness: 0.18 }),
    screen: new THREE.MeshStandardMaterial({ color: "#0f172a", emissive: "#0284c7", emissiveIntensity: 0.45, roughness: 0.18 }),
    signFace: new THREE.MeshStandardMaterial({
      ...(signTexture.image ? { map: signTexture } : {}),
      color: signTexture.image ? "#ffffff" : "#0052cc",
      roughness: 0.25,
    }),
    freshMural: new THREE.MeshStandardMaterial({
      ...(freshMuralTex.image ? { map: freshMuralTex } : {}),
      color: freshMuralTex.image ? "#ffffff" : "#064e3b",
      roughness: 0.35,
    }),
    pantryMural: new THREE.MeshStandardMaterial({
      ...(pantryMuralTex.image ? { map: pantryMuralTex } : {}),
      color: pantryMuralTex.image ? "#ffffff" : "#78350f",
      roughness: 0.35,
    }),
  }), [signTexture, freshMuralTex, pantryMuralTex]);

  const batches = useMemo(() => buildCheckoutBankBatches(CHECKOUT_STATIONS_CONFIG), []);

  const consolidated = useMemo(() => {
    const solidMatrices: THREE.Matrix4[] = [];
    const solidColors: THREE.Color[] = [];
    const C_WHITE = new THREE.Color("#f8fafc");
    const C_CHARCOAL = new THREE.Color("#0f172a");
    const C_WING = new THREE.Color("#cbd5e1");
    const C_BLUE = new THREE.Color("#0052cc");

    // 8 box mỗi Kiosk theo đúng thứ tự index để tra cứu trực tiếp qua instanceId / 8
    for (let i = 0; i < CHECKOUT_STATIONS_CONFIG.length; i++) {
      const offset = i * 2;
      solidMatrices.push(batches.whiteChassis[offset], batches.whiteChassis[offset + 1]);
      solidColors.push(C_WHITE, C_WHITE);
      solidMatrices.push(batches.charcoalTops[offset], batches.charcoalTops[offset + 1]);
      solidColors.push(C_CHARCOAL, C_CHARCOAL);
      solidMatrices.push(batches.baggingWings[offset], batches.baggingWings[offset + 1]);
      solidColors.push(C_WING, C_WING);
      solidMatrices.push(batches.blueAccents[offset], batches.blueAccents[offset + 1]);
      solidColors.push(C_BLUE, C_BLUE);
    }

    // Dải chỉ kiến trúc xanh Cobalt tường Nam + 4 khung Pano (instanceId >= 64 => non-kiosk)
    const p = new THREE.Vector3(0, 5.15, 26.82);
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(39.4, 0.45, 0.06);
    solidMatrices.push(new THREE.Matrix4().compose(p, q, s));
    solidColors.push(C_BLUE);

    for (const m of CHECKOUT_WALL_MURALS) {
      p.set(m.position[0], m.position[1], m.position[2]);
      s.set(m.width + 0.12, m.height + 0.12, 0.08);
      solidMatrices.push(new THREE.Matrix4().compose(p, q, s));
      solidColors.push(C_CHARCOAL);
    }

    const freshMirrors: THREE.Matrix4[] = [];
    const pantryMirrors: THREE.Matrix4[] = [];
    const qMural = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
    for (const mural of CHECKOUT_WALL_MURALS) {
      const mMat = new THREE.Matrix4().compose(
        new THREE.Vector3(mural.position[0], mural.position[1], mural.position[2] - 0.045),
        qMural,
        new THREE.Vector3(mural.width, mural.height, 1)
      );
      if (mural.kind === "fresh") {
        freshMirrors.push(mMat);
      } else {
        pantryMirrors.push(mMat);
      }
    }

    return { solidMatrices, solidColors, freshMirrors, pantryMirrors };
  }, [batches]);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidBoxRef.current, consolidated.solidMatrices, 0, consolidated.solidColors);
    applyMatricesToInstancedMesh(statusRef.current, batches.statusLights);
    applyMatricesToInstancedMesh(poleRef.current, batches.chromePoles);
    applyMatricesToInstancedMesh(screenRef.current, batches.darkScreens);
    applyMatricesToInstancedMesh(signFaceRef.current, batches.signFaces);
    applyMatricesToInstancedMesh(freshMuralRef.current, consolidated.freshMirrors);
    applyMatricesToInstancedMesh(pantryMuralRef.current, consolidated.pantryMirrors);
  }, [batches, consolidated]);

  const handleKioskClick = (kiosk: CheckoutKioskConfig, distance: number, stopPropagation: () => void) => {
    stopPropagation();
    if (isSpatialInputBlocked(useAppStore.getState())) return;
    if (distance > PRODUCT_REACH_METERS + 0.4) return;

    unlockAudioContext();
    const cartState = useCartStore.getState();
    const checkoutState = useCheckoutStore.getState();
    const appState = useAppStore.getState();

    checkoutState.setActiveKioskId(kiosk.id);

    if (cartState.getTotalItems() === 0) {
      playCartDropClack();
      appState.setIsCartOpen(true);
      return;
    }

    if (checkoutState.phase === "idle") {
      playLaserBeepSound();
      checkoutState.startCheckout();
      appState.setIsCheckoutOpen(true);
    } else if (checkoutState.phase === "payment") {
      appState.setIsCheckoutOpen(true);
    } else if (checkoutState.phase === "success") {
      cartState.clearCart();
      checkoutState.resetCheckout();
    }
  };

  return (
    <group>
      {/* 1. Toàn bộ 8 Kiosk gộp thành 5 InstancedMesh, xác định trạm bấm qua e.instanceId */}
      <instancedMesh
        ref={solidBoxRef}
        args={[unitBox, mats.solidVertex, consolidated.solidMatrices.length]}
        castShadow
        receiveShadow
        userData={{ ignoreProductRaycast: true }}
        onClick={(e) => {
          const kioskIndex = getKioskIndexFromSolidInstance(e.instanceId);
          if (kioskIndex < 0) return;
          const kiosk = CHECKOUT_STATIONS_CONFIG[kioskIndex];
          if (kiosk) handleKioskClick(kiosk, e.distance, () => e.stopPropagation());
        }}
      />

      <group userData={{ ignoreProductRaycast: true }}>
        <instancedMesh ref={statusRef} args={[unitBox, mats.statusFresh, batches.statusLights.length]} />
        <instancedMesh ref={poleRef} args={[unitCyl, mats.chrome, batches.chromePoles.length]} />
        <instancedMesh ref={screenRef} args={[unitBox, mats.screen, batches.darkScreens.length]} />
        <instancedMesh ref={signFaceRef} args={[unitPlane, mats.signFace, batches.signFaces.length]} />
        <instancedMesh ref={freshMuralRef} args={[unitPlane, mats.freshMural, consolidated.freshMirrors.length]} />
        <instancedMesh ref={pantryMuralRef} args={[unitPlane, mats.pantryMural, consolidated.pantryMirrors.length]} />
      </group>

      {/* 2. Hero Scanner Overlay duy nhất chạy hiệu ứng cho trạm Sảnh Nam đang được chọn */}
      <ActiveSouthKioskOverlay />
    </group>
  );
};
