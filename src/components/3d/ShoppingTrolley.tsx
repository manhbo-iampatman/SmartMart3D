import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCartStore } from "../../stores/useCartStore";
import { playCartDropClack } from "../../utils/supermarketAudio";

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
    <group ref={groupRef} name="first-person-shopping-trolley">
      {/* 1. Khung gầm xe đẩy và 4 bánh xe */}
      <group position={[0, 0.06, 0]}>
        {/* Khung thép chữ U đỡ giỏ */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.48, 0.04, 0.62]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* 4 bánh xe xoay đa hướng */}
        {[
          [-0.22, -0.26],
          [0.22, -0.26],
          [-0.2, 0.26],
          [0.2, 0.26],
        ].map(([wx, wz], idx) => (
          <group key={idx} position={[wx, 0, wz]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.03, 12]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 2. Bốn cột chống kim loại nối lên giỏ hàng */}
      <group>
        {[
          [-0.22, 0.35, -0.22],
          [0.22, 0.35, -0.22],
          [-0.24, 0.45, 0.25],
          [0.24, 0.45, 0.25],
        ].map(([sx, sy, sz], idx) => (
          <mesh key={idx} position={[sx, sy, sz]}>
            <cylinderGeometry args={[0.012, 0.012, 0.65, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* 3. Lòng giỏ hàng dạng lưới kim loại (Wire Mesh Basket) */}
      <group position={[0, 0.62, 0]}>
        {/* Đáy giỏ */}
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.66]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} wireframe />
        </mesh>
        {/* Vách trái/phải */}
        <mesh position={[-0.25, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.36, 0.66]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} wireframe />
        </mesh>
        <mesh position={[0.25, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.36, 0.66]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} wireframe />
        </mesh>
        {/* Vách trước (thấp hơn) */}
        <mesh position={[0, -0.04, -0.33]}>
          <boxGeometry args={[0.5, 0.24, 0.02]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} wireframe />
        </mesh>
        {/* Vách sau (cao hơn về phía người cầm) */}
        <mesh position={[0, 0.08, 0.33]}>
          <boxGeometry args={[0.5, 0.48, 0.02]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} wireframe />
        </mesh>

        {/* Viền kim loại bo quanh miệng giỏ */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.52, 0.025, 0.68]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* 4. Animation món hàng đang bay theo đường cong vào giỏ (Drop Animation) */}
        {dropAnim.active && (
          <group position={[0, dropY, dropZ]} scale={dropScale}>
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

        {/* 5. Các món hàng thực tế xếp trong lòng xe đẩy khi nhặt hàng */}
        {totalItems > 0 && (
          <group position={[0, -0.08, 0]}>
            {items.slice(0, 6).map((item, index) => {
              const col = index % 2;
              const row = Math.floor(index / 2);
              const px = (col - 0.5) * 0.22;
              const pz = (row - 1) * 0.2;
              const itemColor = item.product.color || (index % 2 === 0 ? "#ff5400" : "#2563eb");

              return (
                <group key={item.product.id} position={[px, 0.05, pz]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.16, 0.18, 0.14]} />
                    <meshStandardMaterial color={itemColor} roughness={0.3} metalness={0.1} />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}
      </group>

      {/* 6. Tay cầm đẩy xe siêu thị màu cam Persimmon cao cấp */}
      <group position={[0, 0.94, 0.42]}>
        {/* Thanh đệm tay cầm bọc cao su cam */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.54, 16]} />
          <meshStandardMaterial color="#ff5400" roughness={0.35} />
        </mesh>
        {/* Nẹp hai bên thanh đẩy nối vào khung */}
        {[-0.27, 0.27].map((hx, idx) => (
          <mesh key={idx} position={[hx, -0.08, -0.06]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.02, 0.2, 0.03]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
