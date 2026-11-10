import React, { useRef, useMemo, useEffect, useLayoutEffect } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCartStore } from "../../stores/useCartStore";
import { useAppStore } from "../../stores/useAppStore";
import { useCheckoutStore } from "../../stores/useCheckoutStore";
import { CHECKOUT_LAYOUT } from "../../data/storeLayout";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import {
  playLaserBeepSound,
  playReceiptPrintSound,
  playPaymentSuccessFanfare,
  playCartDropClack,
} from "../../utils/supermarketAudio";
import { isSpatialInputBlocked } from "../../utils/spatialInteraction";

export const SelfCheckoutScanner3D: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalVND = useCartStore((state) => state.getTotalVND());
  const clearCart = useCartStore((state) => state.clearCart);

  const {
    phase,
    activeKioskId,
    currentItemIndex,
    scannedCount,
    scanProgress,
    isAutoScanning,
    orderCode,
    setActiveKioskId,
    startCheckout,
    setScanProgress,
    advanceToNextItem,
    skipScanning,
    confirmPayment,
    resetCheckout,
  } = useCheckoutStore();

  const { setIsCartOpen, setIsCheckoutOpen, triggerFastTravel } = useAppStore();

  // Làm phẳng giỏ hàng thành danh sách từng món hàng riêng lẻ
  const scannableUnits = useMemo(() => {
    return items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => item.product)
    );
  }, [items]);

  const totalUnits = scannableUnits.length;
  const activeUnit = scannableUnits[currentItemIndex];

  // Ref theo dõi âm thanh quét mã đã phát cho món hiện tại chưa
  const hasBeepedCurrentItem = useRef(false);
  const hasDroppedCurrentItem = useRef(false);

  // Hiệu ứng tia laser đỏ chuyển động quét
  const laserRef = useRef<THREE.Mesh>(null);
  const laserLightRef = useRef<THREE.PointLight>(null);

  // Hiệu ứng biên lai in nhả ra qua scale Y (tránh recreate boxGeometry)
  const receiptGroupRef = useRef<THREE.Group>(null);
  const receiptScaleRef = useRef(0.05);

  const isThisStationActive = activeKioskId === "checkout-04";

  // Reset cờ âm thanh khi đổi món
  useEffect(() => {
    hasBeepedCurrentItem.current = false;
    hasDroppedCurrentItem.current = false;
  }, [currentItemIndex]);

  // Âm thanh khi thanh toán thành công (chỉ phát nếu Checkout 04 đang là trạm active)
  useEffect(() => {
    if (phase === "success" && isThisStationActive) {
      playPaymentSuccessFanfare();
      playReceiptPrintSound();
    }
  }, [phase, isThisStationActive]);

  useFrame((state, delta) => {
    // 1. Logic tự động quét từng món hàng (chỉ chạy khi trạm Checkout 04 đang active)
    if (isThisStationActive && phase === "scanning" && isAutoScanning && totalUnits > 0) {
      const nextProgress = scanProgress + delta * 0.85;

      if (nextProgress >= 0.45 && !hasBeepedCurrentItem.current) {
        hasBeepedCurrentItem.current = true;
        playLaserBeepSound();
      }

      if (nextProgress >= 0.92 && !hasDroppedCurrentItem.current) {
        hasDroppedCurrentItem.current = true;
        playCartDropClack();
      }

      if (nextProgress >= 1) {
        advanceToNextItem(totalUnits);
      } else {
        setScanProgress(nextProgress);
      }
    }

    // 2. Chuyển động tia laser đỏ quét qua lại trên mặt kính
    if (laserRef.current) {
      if (isThisStationActive && phase === "scanning") {
        laserRef.current.visible = true;
        const sweep = Math.sin(state.clock.elapsedTime * 10) * 0.1;
        laserRef.current.position.z = 0.12 + sweep;
        if (laserLightRef.current) {
          laserLightRef.current.intensity = 1.6 + Math.sin(state.clock.elapsedTime * 20) * 0.6;
        }
      } else {
        laserRef.current.visible = false;
        if (laserLightRef.current) laserLightRef.current.intensity = 0;
      }
    }

    // 3. Animation scale Y cho dải giấy biên lai
    if (phase === "success" && isThisStationActive) {
      receiptScaleRef.current = Math.min(1, receiptScaleRef.current + delta * 1.4);
    } else {
      receiptScaleRef.current = 0.05;
    }
    if (receiptGroupRef.current) {
      receiptGroupRef.current.scale.set(1, receiptScaleRef.current, 1);
    }
  });

  // Tương tác bấm vào trạm Kiosk
  const handleStationClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (isSpatialInputBlocked(useAppStore.getState())) return;

    setActiveKioskId("checkout-04");

    if (totalItems === 0) {
      setIsCartOpen(true);
      return;
    }

    if (phase === "idle") {
      startCheckout();
    } else if (phase === "payment") {
      confirmPayment();
    } else if (phase === "success") {
      clearCart();
      resetCheckout();
    }
  };

  // Tính vị trí món hàng đang quét theo đường cong 3 giai đoạn:
  // Bàn Đặt Hàng [-0.85, 0.95, 0] ➔ Mặt Kính Quét [0, 1.12, 0.12] ➔ Bàn Đóng Túi [0.85, 1.15, 0]
  const p = scanProgress;
  let activeItemPos: [number, number, number] = [-0.85, 0.95, 0];
  let activeItemScale = 1;

  if (p < 0.4) {
    // Đoạn 1: Từ bàn trái bay vào mặt kính quét
    const t = p / 0.4;
    const x = THREE.MathUtils.lerp(-0.85, 0, t);
    const y = THREE.MathUtils.lerp(0.95, 1.12, t) + Math.sin(t * Math.PI) * 0.12;
    const z = THREE.MathUtils.lerp(0, 0.12, t);
    activeItemPos = [x, y, z];
  } else if (p < 0.6) {
    // Đoạn 2: Nằm trên mặt kính quét laser, rung nhẹ
    const t = (p - 0.4) / 0.2;
    const x = Math.sin(t * Math.PI * 4) * 0.015;
    activeItemPos = [x, 1.12, 0.12];
  } else {
    // Đoạn 3: Vòng cung Parabol bay thẳng vào lòng túi giấy
    const t = (p - 0.6) / 0.4;
    const x = THREE.MathUtils.lerp(0, 0.85, t);
    const y = THREE.MathUtils.lerp(1.12, 1.15, t) + Math.sin(t * Math.PI) * 0.35;
    const z = THREE.MathUtils.lerp(0.12, 0, t);
    activeItemScale = THREE.MathUtils.lerp(1.0, 0.8, t);
    activeItemPos = [x, y, z];
  }

  const staticBoxRef = useRef<THREE.InstancedMesh>(null);
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const staticVertexMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35, metalness: 0.25 }),
    []
  );

  const staticBatch = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const addBox = (hex: string, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      p.set(x, y, z);
      s.set(sx, sy, sz);
      matrices.push(new THREE.Matrix4().compose(p, q, s));
      colors.push(new THREE.Color(hex));
    };

    // Bàn đặt hàng trái & bàn đóng gói phải (đặt theo tọa độ cục bộ trạm Kiosk 04)
    addBox("#f1f5f9", -0.85, 0.44, 0, 0.7, 0.88, 0.75);
    addBox("#cbd5e1", -0.85, 0.89, 0, 0.74, 0.04, 0.79);
    addBox("#f1f5f9", 0.85, 0.44, 0, 0.7, 0.88, 0.75);
    addBox("#cbd5e1", 0.85, 0.89, 0, 0.74, 0.04, 0.79);
    // Thân bục Kiosk trung tâm, bảng nhận diện xanh lá & khe nhả hóa đơn
    addBox("#0f172a", 0, 0.52, 0, 0.76, 1.05, 0.65);
    addBox("#15803d", 0, 0.5, 0.328, 0.62, 0.5, 0.01);
    addBox("#020617", 0.26, 1.06, 0.05, 0.14, 0.015, 0.06);
    // Túi giấy SmartMart bên bàn đóng gói & trụ cột biển báo AVAILABLE
    addBox("#fdfbf7", 0.85, 1.15, 0, 0.34, 0.46, 0.22);
    addBox("#475569", -0.85, 1.6, -0.2, 0.048, 1.8, 0.048);

    return { matrices, colors };
  }, []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(staticBoxRef.current, staticBatch.matrices, 0, staticBatch.colors);
  }, [staticBatch]);

  return (
    <group position={[CHECKOUT_LAYOUT.x, 0, CHECKOUT_LAYOUT.z]} onClick={handleStationClick}>
      {/* Khối kết cấu tĩnh trạm Check-out 04 hợp nhất vào 1 InstancedMesh (Phase 6) */}
      <instancedMesh
        ref={staticBoxRef}
        args={[unitBox, staticVertexMat, staticBatch.matrices.length]}
        castShadow
        receiveShadow
      />

      {/* 1. Nhãn bàn đặt hàng bên trái */}
      <group position={[-0.85, 0, 0]}>
        <Text position={[0, 0.72, 0.38]} fontSize={0.065} color="#64748b" anchorX="center" anchorY="middle">
          KHU VỰC ĐẶT HÀNG
        </Text>

        {/* Các món hàng chờ quét xếp trên bàn trái */}
        {phase === "scanning" && (
          <group position={[0, 0.96, 0]}>
            {scannableUnits.slice(currentItemIndex + 1, currentItemIndex + 5).map((unit, idx) => (
              <mesh key={idx} position={[(idx % 2 - 0.5) * 0.24, 0.08, (Math.floor(idx / 2) - 0.5) * 0.24]} castShadow>
                <boxGeometry args={[0.16, 0.16, 0.14]} />
                <meshStandardMaterial color={unit.color || "#3b82f6"} roughness={0.3} />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* 2. Trạm Kiosk trung tâm (SCAN > BAG > PAY / CHECKOUT 04) */}
      <group position={[0, 0, 0]}>
        <Text position={[0, 0.58, 0.34]} fontSize={0.075} color="#ffffff" anchorX="center" anchorY="middle">
          SCAN ➔ BAG ➔ PAY
        </Text>
        <Text position={[0, 0.42, 0.34]} fontSize={0.06} color="#bbf7d0" anchorX="center" anchorY="middle">
          QUẦY TỰ THANH TOÁN 04
        </Text>

        {/* Mặt bàn kính máy quét mã vạch (Barcode Scanner Bed) */}
        <mesh position={[0, 1.06, 0.12]}>
          <boxGeometry args={[0.38, 0.04, 0.28]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} roughness={0.1} />
        </mesh>

        {/* Tia Laser Đỏ quét mã vạch (Red Laser Line) */}
        <mesh ref={laserRef} position={[0, 1.09, 0.12]}>
          <boxGeometry args={[0.32, 0.008, 0.015]} />
          <meshStandardMaterial color="#ef4444" emissive="#ff0000" emissiveIntensity={3} />
        </mesh>
        <pointLight ref={laserLightRef} position={[0, 1.15, 0.12]} color="#ef4444" intensity={0} distance={1.2} />

        {/* Món hàng hiện tại đang được quét và bay */}
        {phase === "scanning" && activeUnit && (
          <group position={activeItemPos} scale={activeItemScale}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.2, 0.16]} />
              <meshStandardMaterial
                color={activeUnit.color || "#ff5400"}
                emissive={p >= 0.4 && p <= 0.6 ? "#ff0000" : activeUnit.color || "#ff5400"}
                emissiveIntensity={p >= 0.4 && p <= 0.6 ? 0.4 : 0.15}
                roughness={0.25}
              />
            </mesh>
          </group>
        )}

        {/* Màn hình cảm ứng POS ngửa nghiêng hiển thị tiến trình trực tiếp */}
        <group position={[0, 1.36, -0.05]} rotation={[-0.2, 0, 0]}>
          <RoundedBox args={[0.88, 0.58, 0.06]} radius={0.04} smoothness={4} castShadow>
            <meshStandardMaterial
              color={phase === "success" ? "#022c22" : phase === "payment" ? "#0f172a" : "#022c22"}
              emissive={phase === "success" ? "#065f46" : phase === "payment" ? "#1e3a8a" : "#065f46"}
              emissiveIntensity={0.35}
            />
          </RoundedBox>

          {/* Nội dung màn hình theo từng Phase */}
          {phase === "idle" && (
            <group position={[0, 0, 0.04]}>
              <Text position={[0, 0.14, 0]} fontSize={0.085} color="#6ee7b7" anchorX="center" anchorY="middle">
                CHECKOUT 04
              </Text>
              <Text position={[0, 0.02, 0]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle">
                {totalItems > 0
                  ? `${totalItems} món · ${totalVND.toLocaleString("vi-VN")} đ`
                  : "Chưa có sản phẩm trong xe"}
              </Text>
              <Text position={[0, -0.12, 0]} fontSize={0.058} color="#93c5fd" anchorX="center" anchorY="middle">
                {totalItems > 0 ? "⚡ Chạm để bắt đầu quét hàng" : "Hãy nhặt hàng trên kệ trước"}
              </Text>
            </group>
          )}

          {phase === "scanning" && (
            <group position={[0, 0, 0.04]}>
              <Text position={[0, 0.16, 0]} fontSize={0.065} color="#facc15" anchorX="center" anchorY="middle">
                ĐANG QUÉT MÃ VẠCH (SCANNING)
              </Text>
              <Text position={[0, 0.06, 0]} fontSize={0.068} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={0.8}>
                {activeUnit?.name || "Sản phẩm..."}
              </Text>
              <Text position={[0, -0.04, 0]} fontSize={0.075} color="#4ade80" anchorX="center" anchorY="middle">
                {activeUnit ? `+${activeUnit.price.toLocaleString("vi-VN")} đ` : ""}
              </Text>
              <Text position={[0, -0.14, 0]} fontSize={0.055} color="#94a3b8" anchorX="center" anchorY="middle">
                {`Tiến độ: ${scannedCount + 1}/${totalUnits} món (Chạm để quét nhanh)`}
              </Text>
            </group>
          )}

          {phase === "payment" && (
            <group position={[0, 0, 0.04]}>
              <Text position={[0, 0.17, 0]} fontSize={0.07} color="#38bdf8" anchorX="center" anchorY="middle">
                QUÉT VIETQR THANH TOÁN
              </Text>
              {/* Minh họa mã QR trên màn hình */}
              <mesh position={[-0.24, -0.02, 0]}>
                <planeGeometry args={[0.22, 0.22]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[-0.24, -0.02, 0.005]}>
                <planeGeometry args={[0.18, 0.18]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              <group position={[0.14, 0, 0]}>
                <Text position={[0, 0.06, 0]} fontSize={0.055} color="#cbd5e1" anchorX="center" anchorY="middle">
                  Tổng tiền cần trả:
                </Text>
                <Text position={[0, -0.02, 0]} fontSize={0.08} color="#facc15" anchorX="center" anchorY="middle">
                  {`${totalVND.toLocaleString("vi-VN")} đ`}
                </Text>
                <Text position={[0, -0.1, 0]} fontSize={0.05} color="#4ade80" anchorX="center" anchorY="middle">
                  ⚡ Chạm để xác nhận thanh toán
                </Text>
              </group>
            </group>
          )}

          {phase === "success" && (
            <group position={[0, 0, 0.04]}>
              <Text position={[0, 0.15, 0]} fontSize={0.08} color="#4ade80" anchorX="center" anchorY="middle">
                ✓ ĐÃ THANH TOÁN THÀNH CÔNG!
              </Text>
              <Text position={[0, 0.03, 0]} fontSize={0.065} color="#f8fafc" anchorX="center" anchorY="middle">
                {`Mã đơn: ${orderCode}`}
              </Text>
              <Text position={[0, -0.07, 0]} fontSize={0.06} color="#67e8f9" anchorX="center" anchorY="middle">
                Túi hàng sẵn sàng tại bàn đóng gói
              </Text>
              <Text position={[0, -0.16, 0]} fontSize={0.052} color="#94a3b8" anchorX="center" anchorY="middle">
                Chạm để tiếp tục mua sắm
              </Text>
            </group>
          )}
        </group>

        {/* Khe nhả biên lai hóa đơn & Giấy in biên lai 3D nhả ra */}
        <group position={[0.26, 1.06, 0.05]}>
          {/* Dải giấy biên lai in nhả ra (scale Y mượt không tạo lại geometry) */}
          {phase === "success" && (
            <group ref={receiptGroupRef} position={[0, -0.14, 0.03]} rotation={[-0.3, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.12, 0.28, 0.002]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              <Text position={[0, 0, 0.003]} fontSize={0.022} color="#0f172a" anchorX="center" anchorY="middle">
                {`SMARTMART\n${totalVND.toLocaleString("vi-VN")} đ\nPAID ✓`}
              </Text>
            </group>
          )}
        </group>
      </group>

      {/* 3. Bàn đóng gói bên phải (Bagging Area) kèm túi giấy SmartMart */}
      <group position={[0.85, 0, 0]}>
        <Text position={[0, 0.72, 0.38]} fontSize={0.065} color="#64748b" anchorX="center" anchorY="middle">
          KHU VỰC ĐÓNG TÚI
        </Text>

        {/* Chữ & hàng trên túi giấy SmartMart */}
        <group position={[0, 1.15, 0]}>
          <Text position={[0, 0.08, 0.12]} fontSize={0.055} color="#15803d" anchorX="center" anchorY="middle">
            SMARTMART
          </Text>
          <Text
            position={[0, -0.04, 0.12]}
            fontSize={0.038}
            color={phase === "success" ? "#16a34a" : "#64748b"}
            anchorX="center"
            anchorY="middle"
          >
            {phase === "success" ? "ĐÃ ĐÓNG GÓI ✓" : "TÚI ĐỰNG HÀNG"}
          </Text>

          {/* Các món hàng đã quét xong nằm bên trong túi */}
          {scannedCount > 0 && (
            <group position={[0, 0.05, 0]}>
              {scannableUnits.slice(0, Math.min(scannedCount, 6)).map((unit, idx) => (
                <mesh key={idx} position={[(idx % 2 - 0.5) * 0.1, 0.12 + Math.floor(idx / 2) * 0.05, 0]} scale={0.65}>
                  <boxGeometry args={[0.12, 0.12, 0.12]} />
                  <meshStandardMaterial color={unit.color || "#10b981"} roughness={0.3} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      </group>

      {/* 4. Biển báo "AVAILABLE / CHECKOUT 04" màu xanh lá */}
      <group position={[-0.85, 2.45, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[1.05, 0.42, 0.08]} />
          <meshStandardMaterial
            color={phase === "success" ? "#15803d" : "#166534"}
            emissive={phase === "success" ? "#22c55e" : "#22c55e"}
            emissiveIntensity={phase === "success" ? 0.7 : 0.4}
          />
        </mesh>
        <Text position={[0, 0.06, 0.05]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle">
          {phase === "success" ? "HOÀN TẤT" : "AVAILABLE"}
        </Text>
        <Text position={[0, -0.1, 0.05]} fontSize={0.075} color="#bbf7d0" anchorX="center" anchorY="middle">
          CHECKOUT 04
        </Text>
      </group>
    </group>
  );
};

