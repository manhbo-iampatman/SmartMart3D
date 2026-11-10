import React, { useRef, useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCartStore } from "../../stores/useCartStore";
import { playCartDropClack } from "../../utils/supermarketAudio";
import { getWireMeshTexture } from "../../utils/textureGenerator";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";

/**
 * Xe đẩy siêu thị 3D theo góc nhìn người thứ nhất (First-Person Trolley)
 * Lấy cảm hứng trực tiếp từ video tham chiếu "3D HYPERMARKET WEBSITE 2026":
 * - Giỏ kim loại dạng lưới chrome sáng bóng
 * - Tay cầm bọc đệm màu cam Persimmon đặc trưng
 * - Đồ trong giỏ hàng xuất hiện trực tiếp trong lòng xe khi người dùng nhặt hàng
 * - Chuyển động quán tính nhẹ (inertial sway & bobbing) khi di chuyển
 * - Animation sản phẩm thu nhỏ bay vào lòng xe đẩy (Parabolic Drop Animation)
 */
export const ShoppingTrolley: React.FC = () => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());

  const previousPos = useRef(new THREE.Vector3());
  const trolleyPos = useRef(new THREE.Vector3());
  const trolleyRotY = useRef(0);
  const walkPhase = useRef(0);

  // Quản lý animation rơi đồ vào giỏ xe đẩy
  const previousTotal = useRef(totalItems);
  const [dropAnim, setDropAnim] = useState<{ active: boolean; progress: number; color: string }>({
    active: false,
    progress: 0,
    color: "#ff5400",
  });

  const solidRef = useRef<THREE.InstancedMesh>(null);
  const polesRef = useRef<THREE.InstancedMesh>(null);
  const basketRef = useRef<THREE.InstancedMesh>(null);
  const cartItemsRef = useRef<THREE.InstancedMesh>(null);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const unitCyl = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 12), []);
  const wireTex = useMemo(() => getWireMeshTexture(), []);

  const mats = useMemo(() => ({
    solidVertex: new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0.55, roughness: 0.25 }),
    wireBasket: new THREE.MeshStandardMaterial({
      ...(wireTex.image ? { map: wireTex } : {}),
      color: "#cbd5e1",
      metalness: 0.85,
      roughness: 0.2,
      alphaTest: wireTex.image ? 0.45 : 0,
      side: THREE.DoubleSide,
    }),
    itemVertex: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3, metalness: 0.1 }),
  }), [wireTex]);

  const staticBatches = useMemo(() => {
    const solids: THREE.Matrix4[] = [];
    const solidColors: THREE.Color[] = [];
    const poles: THREE.Matrix4[] = [];
    const poleColors: THREE.Color[] = [];
    const basketFaces: THREE.Matrix4[] = [];

    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const e = new THREE.Euler();
    const pushColored = (
      arr: THREE.Matrix4[],
      colors: THREE.Color[],
      hex: string,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      rx = 0,
      ry = 0,
      rz = 0
    ) => {
      e.set(rx, ry, rz);
      q.setFromEuler(e);
      p.set(x, y, z);
      s.set(sx, sy, sz);
      arr.push(new THREE.Matrix4().compose(p, q, s));
      colors.push(new THREE.Color(hex));
    };

    // Khung gầm, 4 bánh xe, viền miệng giỏ, 2 nẹp tay cầm
    pushColored(solids, solidColors, "#94a3b8", 0, 0.12, 0, 0.48, 0.04, 0.62);
    for (const [wx, wz] of [[-0.22, -0.26], [0.22, -0.26], [-0.2, 0.26], [0.2, 0.26]]) {
      pushColored(solids, solidColors, "#334155", wx, 0.06, wz, 0.03, 0.09, 0.09);
      pushColored(poles, poleColors, "#cbd5e1", wx, 0.1, wz, 0.024, 0.05, 0.024);
    }
    for (const [sx, sy, sz] of [[-0.22, 0.35, -0.22], [0.22, 0.35, -0.22], [-0.24, 0.45, 0.25], [0.24, 0.45, 0.25]]) {
      pushColored(poles, poleColors, "#e2e8f0", sx, sy, sz, 0.024, 0.65, 0.024);
    }
    pushColored(solids, solidColors, "#f1f5f9", 0, 0.82, 0, 0.52, 0.025, 0.68);
    pushColored(poles, poleColors, "#ff5400", 0, 0.94, 0.42, 0.048, 0.54, 0.048, 0, 0, Math.PI / 2);
    for (const hx of [-0.27, 0.27]) {
      pushColored(solids, solidColors, "#64748b", hx, 0.86, 0.36, 0.02, 0.2, 0.03, 0.4, 0, 0);
    }

    // 5 mặt lưới rổ kim loại hợp nhất thành 1 InstancedMesh
    const dummyColors: THREE.Color[] = [];
    pushColored(basketFaces, dummyColors, "#cbd5e1", 0, 0.46, 0, 0.5, 0.02, 0.66);
    pushColored(basketFaces, dummyColors, "#cbd5e1", -0.25, 0.64, 0, 0.02, 0.36, 0.66);
    pushColored(basketFaces, dummyColors, "#cbd5e1", 0.25, 0.64, 0, 0.02, 0.36, 0.66);
    pushColored(basketFaces, dummyColors, "#cbd5e1", 0, 0.58, -0.33, 0.5, 0.24, 0.02);
    pushColored(basketFaces, dummyColors, "#cbd5e1", 0, 0.7, 0.33, 0.5, 0.48, 0.02);

    return { solids, solidColors, poles, poleColors, basketFaces };
  }, []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidRef.current, staticBatches.solids, 0, staticBatches.solidColors);
    applyMatricesToInstancedMesh(polesRef.current, staticBatches.poles, 0, staticBatches.poleColors);
    applyMatricesToInstancedMesh(basketRef.current, staticBatches.basketFaces);
  }, [staticBatches]);

  const cartItemBatch = useMemo(() => {
    const visibleItems = items.slice(0, 6);
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(0.16, 0.18, 0.14);
    visibleItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const px = (col - 0.5) * 0.22;
      const pz = (row - 1) * 0.2;
      matrices.push(new THREE.Matrix4().compose(new THREE.Vector3(px, 0.59, pz), q, s));
      colors.push(new THREE.Color(item.product.color || (index % 2 === 0 ? "#ff5400" : "#2563eb")));
    });
    return { matrices, colors };
  }, [items]);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(cartItemsRef.current, cartItemBatch.matrices, 0, cartItemBatch.colors);
  }, [cartItemBatch]);

  // Vô hiệu hóa raycast trên toàn bộ lưới xe đẩy cá nhân để không che tia nhặt hàng hay bấm Kiosk
  useEffect(() => {
    const group = groupRef.current;
    if (!group || typeof group.traverse !== "function") return;
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.raycast = () => {};
      }
    });
  }, [totalItems]);

  useEffect(() => {
    if (totalItems > previousTotal.current) {
      const lastItem = items[items.length - 1];
      const color = lastItem?.product.color || "#ff5400";
      setDropAnim({ active: true, progress: 0, color });
      playCartDropClack();
    }
    previousTotal.current = totalItems;
  }, [totalItems, items]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Tiến trình animation rơi đồ
    if (dropAnim.active) {
      const nextProgress = dropAnim.progress + delta * 2.4;
      if (nextProgress >= 1) {
        setDropAnim((prev) => ({ ...prev, active: false, progress: 1 }));
      } else {
        setDropAnim((prev) => ({ ...prev, progress: nextProgress }));
      }
    }

    // Tính hướng nhìn ngang của camera (Yaw)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const yaw = Math.atan2(forward.x, -forward.z);

    // Tính vận tốc di chuyển
    const currentCamPos = camera.position;
    const speed = currentCamPos.distanceTo(previousPos.current) / Math.max(delta, 0.001);
    previousPos.current.copy(currentCamPos);

    // Hiệu ứng nhịp bước chân (bobbing) khi người chơi đi bộ
    if (speed > 0.3) {
      walkPhase.current += delta * 9;
    }
    const bob = Math.sin(walkPhase.current) * (speed > 0.3 ? 0.012 : 0);

    // Điểm đích của xe đẩy: phía trước camera khoảng 0.82m, đặt trên mặt sàn (y = 0)
    const targetX = currentCamPos.x + Math.sin(yaw) * 0.82;
    const targetZ = currentCamPos.z - Math.cos(yaw) * 0.82;

    // Làm mượt vị trí (lerp) để xe có độ trễ quán tính tự nhiên
    const lerpFactor = Math.min(1, delta * 14);
    trolleyPos.current.x = THREE.MathUtils.lerp(trolleyPos.current.x || targetX, targetX, lerpFactor);
    trolleyPos.current.z = THREE.MathUtils.lerp(trolleyPos.current.z || targetZ, targetZ, lerpFactor);

    // Làm mượt góc quay theo hướng đi
    let angleDiff = yaw - trolleyRotY.current;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    trolleyRotY.current += angleDiff * lerpFactor;

    groupRef.current.position.set(trolleyPos.current.x, bob, trolleyPos.current.z);
    groupRef.current.rotation.y = trolleyRotY.current;
  });

  // Tính toán vị trí và độ phóng to của món đồ đang bay vào xe
  const p = dropAnim.progress;
  const dropY = THREE.MathUtils.lerp(1.05, 0.02, p) + Math.sin(p * Math.PI) * 0.22;
  const dropZ = THREE.MathUtils.lerp(-0.15, 0.05, p);
  const dropScale = THREE.MathUtils.lerp(1.35, 1.0, p);

  return (
    <group
      ref={groupRef}
      name="first-person-shopping-trolley"
      userData={{ ignoreProductRaycast: true }}
    >
      {/* 1. Toàn bộ khung gầm, bánh xe, cột chống, tay cầm & rổ lưới hợp nhất thành 3 InstancedMesh (Phase 6) */}
      <instancedMesh ref={solidRef} args={[unitBox, mats.solidVertex, staticBatches.solids.length]} />
      <instancedMesh ref={polesRef} args={[unitCyl, mats.solidVertex, staticBatches.poles.length]} />
      <instancedMesh ref={basketRef} args={[unitBox, mats.wireBasket, staticBatches.basketFaces.length]} />

      {/* 2. Animation món hàng đang bay theo đường cong vào giỏ (Drop Animation) */}
      {dropAnim.active && (
        <group position={[0, 0.62 + dropY, dropZ]} scale={dropScale}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.2, 0.16]} />
            <meshStandardMaterial
              color={dropAnim.color}
              emissive={dropAnim.color}
              emissiveIntensity={0.25}
              roughness={0.2}
            />
          </mesh>
        </group>
      )}

      {/* 3. Các món hàng trong giỏ gộp chung 1 InstancedMesh */}
      {cartItemBatch.matrices.length > 0 && (
        <instancedMesh
          ref={cartItemsRef}
          args={[unitBox, mats.itemVertex, cartItemBatch.matrices.length]}
          castShadow
        />
      )}
    </group>
  );
};
