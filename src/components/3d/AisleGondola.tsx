import React, { useLayoutEffect, useMemo, useRef } from "react";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { SHELF_LAYOUT, EXTENDED_AISLE_LAYOUT } from "../../data/storeLayout";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import { useCameraLod } from "../../utils/lodCulling";

export interface GondolaSpec {
  position: [number, number, number];
  aisleCode: string;
  categoryName: string;
  length?: number;
  rotationY?: number;
  hasEndcaps?: boolean;
}

interface SingleGondolaProps extends GondolaSpec {}

/**
 * GondolaInstancedGroup (Phase 6)
 * Gộp toàn bộ cấu trúc 8 dãy kệ (tấm lưng, khung thép, ray, kickplate xanh, khay kệ trắng)
 * vào đúng 1 InstancedMesh qua setColorAt + 1 InstancedMesh underglow (LOD culling > 20m).
 */
const GondolaInstancedGroup: React.FC<{ specs: readonly GondolaSpec[] }> = ({ specs }) => {
  const solidRef = useRef<THREE.InstancedMesh>(null);
  const underglowRef = useRef<THREE.InstancedMesh>(null);

  const shelfDepth = SHELF_LAYOUT.depth;
  const shelfHeight = 1.95;
  const tierYPositions = useMemo(() => [0.45, 0.95, 1.45, 1.95], []);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const materials = useMemo(() => ({
    solidVertex: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3, metalness: 0.2 }),
    underglow: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#f8fafc", emissiveIntensity: 0.85 }),
  }), []);

  const batches = useMemo(() => {
    const solids: THREE.Matrix4[] = [];
    const solidColors: string[] = [];
    const underglows: THREE.Matrix4[] = [];

    const gMat = new THREE.Matrix4();
    const local = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const e = new THREE.Euler();

    const pushSolid = (parentMat: THREE.Matrix4, lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, color: string) => {
      e.set(0, 0, 0);
      q.setFromEuler(e);
      p.set(lx, ly, lz);
      s.set(sx, sy, sz);
      local.compose(p, q, s);
      solids.push(new THREE.Matrix4().multiplyMatrices(parentMat, local));
      solidColors.push(color);
    };

    const pushGlow = (parentMat: THREE.Matrix4, lx: number, ly: number, lz: number, sx: number, sy: number, sz: number) => {
      e.set(0, 0, 0);
      q.setFromEuler(e);
      p.set(lx, ly, lz);
      s.set(sx, sy, sz);
      local.compose(p, q, s);
      underglows.push(new THREE.Matrix4().multiplyMatrices(parentMat, local));
    };

    for (const spec of specs) {
      const length = spec.length ?? SHELF_LAYOUT.length;
      const hasEndcaps = spec.hasEndcaps ?? true;
      gMat.compose(
        new THREE.Vector3(...spec.position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, spec.rotationY || 0, 0)),
        new THREE.Vector3(1, 1, 1)
      );

      // Tấm lưng tôn đục lỗ
      pushSolid(gMat, 0, shelfHeight / 2 + 0.05, 0, 0.06, shelfHeight - 0.15, length, "#f1f5f9");

      // Cột trụ & vách ngăn đứng chia khoang 1.2m
      const bayDividers: number[] = [];
      const halfLen = length / 2;
      for (let z = -halfLen + 1.2; z < halfLen - 0.01; z += 1.2) {
        bayDividers.push(Math.round(z * 100) / 100);
      }
      for (const z of [-halfLen, ...bayDividers, halfLen]) {
        pushSolid(gMat, 0, shelfHeight / 2 + 0.05, z, shelfDepth + 0.04, shelfHeight + 0.1, 0.05, "#1e293b");
        pushSolid(gMat, -shelfDepth / 2 - 0.01, shelfHeight / 2 + 0.05, z, 0.01, shelfHeight + 0.08, 0.02, "#64748b");
        pushSolid(gMat, shelfDepth / 2 + 0.01, shelfHeight / 2 + 0.05, z, 0.01, shelfHeight + 0.08, 0.02, "#64748b");
      }

      // Chân đế & kickplate xanh SmartMart
      pushSolid(gMat, 0, 0.09, 0, shelfDepth + 0.08, 0.18, length, "#1e293b");
      pushSolid(gMat, -shelfDepth / 2 - 0.042, 0.09, 0, 0.008, 0.14, length - 0.02, "#0071dc");
      pushSolid(gMat, shelfDepth / 2 + 0.042, 0.09, 0, 0.008, 0.14, length - 0.02, "#0071dc");

      // 4 tầng khay kệ + ray giá + chỉ xanh + LED hắt gầm
      for (const y of tierYPositions) {
        pushSolid(gMat, 0, y, 0, shelfDepth, 0.035, length - 0.04, "#f8fafc");
        pushSolid(gMat, shelfDepth / 2 + 0.008, y - 0.012, 0, 0.016, 0.042, length - 0.04, "#f8fafc");
        pushSolid(gMat, -shelfDepth / 2 - 0.008, y - 0.012, 0, 0.016, 0.042, length - 0.04, "#f8fafc");
        pushSolid(gMat, shelfDepth / 2 + 0.017, y - 0.028, 0, 0.003, 0.008, length - 0.04, "#0071dc");
        pushSolid(gMat, -shelfDepth / 2 - 0.017, y - 0.028, 0, 0.003, 0.008, length - 0.04, "#0071dc");
        pushGlow(gMat, -shelfDepth / 2 + 0.05, y - 0.02, 0, 0.015, 0.008, length - 0.1);
        pushGlow(gMat, shelfDepth / 2 - 0.05, y - 0.02, 0, 0.015, 0.008, length - 0.1);
      }

      // Kệ đầu hồi (Endcaps)
      if (hasEndcaps) {
        for (let endIdx = 0; endIdx < 2; endIdx++) {
          const zPos = endIdx === 0 ? -halfLen - 0.35 : halfLen + 0.35;
          const endMat = new THREE.Matrix4().multiplyMatrices(
            gMat,
            new THREE.Matrix4().compose(
              new THREE.Vector3(0, 0, zPos),
              new THREE.Quaternion().setFromEuler(new THREE.Euler(0, endIdx === 0 ? Math.PI : 0, 0)),
              new THREE.Vector3(1, 1, 1)
            )
          );
          pushSolid(endMat, 0, shelfHeight / 2 + 0.05, 0, shelfDepth, shelfHeight + 0.1, 0.08, "#1e293b");
          pushSolid(endMat, 0, 0.09, 0.18, shelfDepth, 0.18, 0.36, "#1e293b");
          for (const y of tierYPositions) {
            pushSolid(endMat, 0, y, 0.2, shelfDepth - 0.04, 0.035, 0.38, "#f8fafc");
            pushSolid(endMat, 0, y - 0.012, 0.395, shelfDepth - 0.04, 0.042, 0.015, "#f8fafc");
          }
          pushSolid(endMat, 0, 2.35, 0.12, 0.72, 0.34, 0.04, "#0071dc");
          pushSolid(endMat, 0, 2.35, 0.142, 0.74, 0.36, 0.005, "#f8fafc");
        }
      }
    }

    return { solids, solidColors, underglows };
  }, [specs, shelfDepth, shelfHeight, tierYPositions]);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidRef.current, batches.solids, 0, batches.solidColors);
    applyMatricesToInstancedMesh(underglowRef.current, batches.underglows);
  }, [batches]);

  // LOD Distance Culling: Ẩn dải LED hắt gầm khi camera xa > 20m (qua lodCulling an toàn JSDOM)
  useCameraLod([
    { ref: underglowRef, center: [0, 0, 0], maxDistance: 20 },
  ]);

  return (
    <group>
      <instancedMesh ref={solidRef} args={[unitBox, materials.solidVertex, batches.solids.length]} castShadow receiveShadow />
      <instancedMesh ref={underglowRef} args={[unitBox, materials.underglow, batches.underglows.length]} userData={{ ignoreProductRaycast: true }} />
    </group>
  );
};

const GondolaEndcapSignage: React.FC<{ spec: GondolaSpec }> = ({ spec }) => {
  const length = spec.length ?? SHELF_LAYOUT.length;
  const hasEndcaps = spec.hasEndcaps ?? true;
  if (!hasEndcaps) return null;

  return (
    <group position={spec.position} rotation={[0, spec.rotationY || 0, 0]} userData={{ ignoreProductRaycast: true }}>
      {[-length / 2 - 0.35, length / 2 + 0.35].map((zPos, endIdx) => (
        <group key={endIdx} position={[0, 2.35, zPos]} rotation={[0, endIdx === 0 ? Math.PI : 0, 0]}>
          <group position={[0, 0, 0.12]}>
            <Text position={[-0.2, 0, 0.028]} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle">
              {spec.aisleCode}
            </Text>
            <Text position={[0.15, 0.04, 0.028]} fontSize={0.075} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={0.35}>
              {spec.categoryName.split("&")[0].trim()}
            </Text>
            <Text position={[0.15, -0.05, 0.028]} fontSize={0.055} color="#dbeafe" anchorX="center" anchorY="middle" maxWidth={0.35}>
              {spec.categoryName.split("&")[1]?.trim() || "HYPERMARKET"}
            </Text>
          </group>
        </group>
      ))}
    </group>
  );
};

export const SingleGondola: React.FC<SingleGondolaProps> = (props) => {
  const specs = useMemo(() => [props], [props]);
  return (
    <group>
      <GondolaInstancedGroup specs={specs} />
      <GondolaEndcapSignage spec={props} />
    </group>
  );
};

export const OverheadLcdDisplay: React.FC<{
  position: [number, number, number];
  title?: string;
  itemName?: string;
  price?: string;
  tag?: string;
}> = ({
  position,
  title = "SmartMart ★ GROCERY FOCUS",
  itemName = "Yến Mạch Úc Rolled Oats 500g",
  price = "36.000 đ",
  tag = "GIÁ TỐT MỖI NGÀY · CHẠM ĐỂ XEM",
}) => {
  return (
    <group position={position} userData={{ ignoreProductRaycast: true }}>
      <RoundedBox args={[1.65, 0.92, 0.06]} radius={0.03} smoothness={4}>
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </RoundedBox>
      <mesh>
        <boxGeometry args={[1.56, 0.82, 0.068]} />
        <meshStandardMaterial color="#090d16" emissive="#0f172a" emissiveIntensity={0.4} roughness={0.2} />
      </mesh>
      <group position={[0, 0, 0.039]}>
        <Text position={[0, 0.3, 0.005]} fontSize={0.075} color="#38bdf8" anchorX="center" anchorY="middle">{title}</Text>
        <Text position={[0, 0.12, 0.005]} fontSize={0.095} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={1.45}>{itemName}</Text>
        <Text position={[0, -0.08, 0.005]} fontSize={0.16} color="#facc15" anchorX="center" anchorY="middle">{price}</Text>
        <Text position={[0, -0.26, 0.005]} fontSize={0.052} color="#94a3b8" anchorX="center" anchorY="middle">{tag}</Text>
      </group>
      <group position={[0, 0, -0.039]} rotation={[0, Math.PI, 0]}>
        <Text position={[0, 0.3, 0.005]} fontSize={0.075} color="#38bdf8" anchorX="center" anchorY="middle">{title}</Text>
        <Text position={[0, 0.12, 0.005]} fontSize={0.095} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={1.45}>{itemName}</Text>
        <Text position={[0, -0.08, 0.005]} fontSize={0.16} color="#facc15" anchorX="center" anchorY="middle">{price}</Text>
        <Text position={[0, -0.26, 0.005]} fontSize={0.052} color="#94a3b8" anchorX="center" anchorY="middle">{tag}</Text>
      </group>
    </group>
  );
};

export const AisleGondola: React.FC = () => {
  const allGondolaSpecs = useMemo<GondolaSpec[]>(() => [
    { aisleCode: "A01", categoryName: "NƯỚC GIẢI KHÁT & BIA", position: [-5.4, 0, 0], length: SHELF_LAYOUT.length },
    { aisleCode: "A02", categoryName: "SỮA & CÀ PHÊ", position: [-2.6, 0, 0], length: SHELF_LAYOUT.length },
    { aisleCode: "A03", categoryName: "BÁNH KẸO & SNACK", position: [2.6, 0, 0], length: SHELF_LAYOUT.length },
    { aisleCode: "A04", categoryName: "GIA VỊ & NÔNG SẢN", position: [5.4, 0, 0], length: SHELF_LAYOUT.length },
    { aisleCode: "A05", categoryName: "MÌ GÓI & THỰC PHẨM KHÔ", position: [-7.0, 0, EXTENDED_AISLE_LAYOUT.northCenterZ], length: EXTENDED_AISLE_LAYOUT.blockLength },
    { aisleCode: "A06", categoryName: "MÌ GÓI & THỰC PHẨM KHÔ", position: [-7.0, 0, EXTENDED_AISLE_LAYOUT.southCenterZ], length: EXTENDED_AISLE_LAYOUT.blockLength },
    { aisleCode: "A07", categoryName: "HÓA PHẨM & CHĂM SÓC", position: [-14.0, 0, EXTENDED_AISLE_LAYOUT.northCenterZ], length: EXTENDED_AISLE_LAYOUT.blockLength },
    { aisleCode: "A08", categoryName: "HÓA PHẨM & CHĂM SÓC", position: [-14.0, 0, EXTENDED_AISLE_LAYOUT.southCenterZ], length: EXTENDED_AISLE_LAYOUT.blockLength },
  ], []);

  return (
    <group>
      <GondolaInstancedGroup specs={allGondolaSpecs} />
      {allGondolaSpecs.map((spec) => (
        <GondolaEndcapSignage key={spec.aisleCode} spec={spec} />
      ))}
      <OverheadLcdDisplay
        position={[-4.0, 3.6, 4.0]}
        title="SmartMart ★ GROCERY FOCUS"
        itemName="Yến Mạch Úc Rolled Oats 500g"
        price="36.000 đ"
        tag="GIÁ TỐT MỖI NGÀY · CHẠM ĐỂ XEM"
      />
      <OverheadLcdDisplay
        position={[4.0, 3.6, 4.0]}
        title="SmartMart ★ FRESH PROMO"
        itemName="Bánh Choco-Pie Hộp 12 Cái"
        price="62.000 đ"
        tag="TIẾT KIỆM 15% · ƯU ĐÃI TUẦN NÀY"
      />
    </group>
  );
};
