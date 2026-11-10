import React, { useLayoutEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { PROMOTION_LAYOUT } from "../../data/storeLayout";
import { SelfCheckoutScanner3D } from "./SelfCheckoutScanner3D";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import {
  getDepartmentBannerAtlasTexture,
  remapGeometryToAtlasTile,
} from "../../utils/textureAtlasGenerator";

const BANNERS = [
  { position: [-5.4, 3.25, 3.4] as [number, number, number], aisleNumber: "01", title: "NƯỚC GIẢI KHÁT & BIA", subtitle: "Coca-Cola · Sting · Bia Saigon", color: "#1d4ed8" },
  { position: [-2.6, 3.25, 3.4] as [number, number, number], aisleNumber: "02", title: "SỮA & CÀ PHÊ", subtitle: "Vinamilk · Cà phê G7 · Milo", color: "#ea580c" },
  { position: [2.6, 3.25, 3.4] as [number, number, number], aisleNumber: "03", title: "BÁNH KẸO & MÌ GÓI", subtitle: "Hảo Hảo · Choco-Pie · Snack", color: "#7c3aed" },
  { position: [5.4, 3.25, 3.4] as [number, number, number], aisleNumber: "04", title: "GIA VỊ & NÔNG SẢN", subtitle: "Dầu Simply · Gạo ST25", color: "#059669" },
];

/**
 * StoreFixtures (Phase 6 Optimized)
 * Gom toàn bộ FreezerWall, 4 DepartmentBanner và PromotionIsland vào đúng 6 InstancedMesh + bảng MUA 2 TẶNG 1,
 * giảm từ ~119 Draw Calls xuống 8 Draw Calls.
 */
export const StoreFixtures: React.FC = () => {
  const solidBoxesRef = useRef<THREE.InstancedMesh>(null);
  const cylindersRef = useRef<THREE.InstancedMesh>(null);
  const freezerGlassRef = useRef<THREE.InstancedMesh>(null);
  const freezerGlowRef = useRef<THREE.InstancedMesh>(null);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const unitCyl = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 12), []);

  const bannerAtlasTex = useMemo(() => getDepartmentBannerAtlasTexture(BANNERS), []);

  const materials = useMemo(() => ({
    solidVertexColor: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3, metalness: 0.2 }),
    metalVertexColor: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2, metalness: 0.85 }),
    freezerGlass: new THREE.MeshStandardMaterial({
      color: "#bae6fd",
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.25,
      depthWrite: false,
    }),
    freezerGlow: new THREE.MeshStandardMaterial({
      color: "#e0f2fe",
      emissive: "#38bdf8",
      emissiveIntensity: 0.35,
      roughness: 0.1,
    }),
    bannerAtlas: new THREE.MeshStandardMaterial({
      ...(bannerAtlasTex.image ? { map: bannerAtlasTex } : {}),
      color: "#ffffff",
      roughness: 0.25,
    }),
  }), [bannerAtlasTex]);

  // 8 mặt biển (4 DepartmentBanner x 2 mặt) gộp vào 1 BufferGeometry duy nhất dùng Banner Atlas (1 draw call)
  const mergedBannerDecalGeo = useMemo(() => {
    const posList: number[] = [];
    const normList: number[] = [];
    const uvList: number[] = [];
    const indexList: number[] = [];
    const m = new THREE.Matrix4();
    const rotY = new THREE.Euler(0, Math.PI, 0);
    let vertexOffset = 0;

    BANNERS.forEach((b, i) => {
      const base = remapGeometryToAtlasTile(new THREE.PlaneGeometry(2.12, 0.52), i, 2, 2);
      const transforms = [
        m.clone().makeTranslation(b.position[0], b.position[1], b.position[2] + 0.046),
        m.clone().compose(
          new THREE.Vector3(b.position[0], b.position[1], b.position[2] - 0.046),
          new THREE.Quaternion().setFromEuler(rotY),
          new THREE.Vector3(1, 1, 1)
        ),
      ];

      for (const mat of transforms) {
        const g = base.clone();
        g.applyMatrix4(mat);
        const pos = g.attributes.position;
        const norm = g.attributes.normal;
        const uv = g.attributes.uv;
        const idx = g.index;
        for (let v = 0; v < pos.count; v++) {
          posList.push(pos.getX(v), pos.getY(v), pos.getZ(v));
          normList.push(norm.getX(v), norm.getY(v), norm.getZ(v));
          uvList.push(uv.getX(v), uv.getY(v));
        }
        if (idx) {
          for (let k = 0; k < idx.count; k++) {
            indexList.push(vertexOffset + idx.getX(k));
          }
        }
        vertexOffset += pos.count;
      }
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.Float32BufferAttribute(posList, 3));
    merged.setAttribute("normal", new THREE.Float32BufferAttribute(normList, 3));
    merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvList, 2));
    merged.setIndex(indexList);
    return merged;
  }, []);

  const batches = useMemo(() => {
    const boxes: THREE.Matrix4[] = [];
    const boxColors: string[] = [];
    const cyls: THREE.Matrix4[] = [];
    const cylColors: string[] = [];
    const glasses: THREE.Matrix4[] = [];
    const glows: THREE.Matrix4[] = [];

    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const e = new THREE.Euler();

    const addBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, ry = 0) => {
      e.set(0, ry, 0);
      q.setFromEuler(e);
      p.set(x, y, z);
      s.set(sx, sy, sz);
      boxes.push(new THREE.Matrix4().compose(p, q, s));
      boxColors.push(color);
    };

    const addCyl = (x: number, y: number, z: number, dia: number, h: number, color: string) => {
      e.set(0, 0, 0);
      q.setFromEuler(e);
      p.set(x, y, z);
      s.set(dia, h, dia);
      cyls.push(new THREE.Matrix4().compose(p, q, s));
      cylColors.push(color);
    };

    // 1. Dãy 5 tủ đông cửa kính FreezerWall (z = -6.1)
    for (const fx of [-3.6, -1.8, 0, 1.8, 3.6]) {
      // Thùng chính, 4 kệ trong, khung biển trên
      addBox(fx, 1.6, -6.1, 1.65, 3.0, 0.7, "#0f172a");
      for (const sy of [-0.8, -0.2, 0.4, 1.0]) {
        addBox(fx, 1.6 + sy, -6.1 + 0.28, 1.48, 0.04, 0.18, "#94a3b8");
      }
      addBox(fx, 3.25, -6.1 + 0.15, 1.5, 0.24, 0.06, "#0369a1");

      // Tay nắm cửa kính
      addCyl(fx + 0.65, 1.6, -6.1 + 0.4, 0.04, 1.2, "#e2e8f0");

      // Khoang phát sáng & cửa kính không transmission
      p.set(fx, 1.6, -6.1 + 0.28);
      q.identity();
      s.set(1.5, 2.75, 0.1);
      glows.push(new THREE.Matrix4().compose(p, q, s));

      p.set(fx, 1.6, -6.1 + 0.36);
      s.set(1.56, 2.82, 0.02);
      glasses.push(new THREE.Matrix4().compose(p, q, s));
    }

    // 2. 4 Biển ngành hàng treo cao DepartmentBanner
    for (const b of BANNERS) {
      const [bx, by, bz] = b.position;
      addBox(bx, by, bz, 2.2, 0.58, 0.08, b.color);
      addBox(bx, by, bz, 2.22, 0.6, 0.02, "#ffffff");
      addCyl(bx - 0.8, by + 0.55, bz, 0.01, 0.8, "#cbd5e1");
      addCyl(bx + 0.8, by + 0.55, bz, 0.01, 0.8, "#cbd5e1");
    }

    // 3. 12 Hộp hàng xoay tròn & cột biển PromotionIsland
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      addBox(
        PROMOTION_LAYOUT.x + Math.cos(angle) * 0.62,
        0.58,
        PROMOTION_LAYOUT.z + Math.sin(angle) * 0.62,
        0.2,
        0.34,
        0.14,
        i % 2 === 0 ? "#facc15" : "#ff5400",
        -angle
      );
    }
    // Cột inox, viền đỏ & bảng vàng MUA 2 TẶNG 1
    addCyl(PROMOTION_LAYOUT.x, 1.3, PROMOTION_LAYOUT.z, 0.04, 1.7, "#cbd5e1");
    addBox(PROMOTION_LAYOUT.x, 2.12, PROMOTION_LAYOUT.z, 0.94, 0.38, 0.03, "#dc2626");
    addBox(PROMOTION_LAYOUT.x, 2.12, PROMOTION_LAYOUT.z, 0.90, 0.34, 0.04, "#facc15");

    return { boxes, boxColors, cyls, cylColors, glasses, glows };
  }, []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidBoxesRef.current, batches.boxes, 0, batches.boxColors);
    applyMatricesToInstancedMesh(cylindersRef.current, batches.cyls, 0, batches.cylColors);
    applyMatricesToInstancedMesh(freezerGlassRef.current, batches.glasses);
    applyMatricesToInstancedMesh(freezerGlowRef.current, batches.glows);
  }, [batches]);

  return (
    <group userData={{ ignoreProductRaycast: true }}>
      <instancedMesh ref={solidBoxesRef} args={[unitBox, materials.solidVertexColor, batches.boxes.length]} castShadow receiveShadow />
      <instancedMesh ref={cylindersRef} args={[unitCyl, materials.metalVertexColor, batches.cyls.length]} />
      <instancedMesh ref={freezerGlowRef} args={[unitBox, materials.freezerGlow, batches.glows.length]} />
      <instancedMesh ref={freezerGlassRef} args={[unitBox, materials.freezerGlass, batches.glasses.length]} />

      {/* Toàn bộ 8 mặt biển 4 DepartmentBanner dùng chung 1 Banner Atlas trong 1 Draw Call */}
      <mesh geometry={mergedBannerDecalGeo} material={materials.bannerAtlas} />

      {/* Đế tròn 2 tầng PromotionIsland & Bảng MUA 2 TẶNG 1 */}
      <group position={[PROMOTION_LAYOUT.x, 0, PROMOTION_LAYOUT.z]}>
        <mesh position={[0, 0.16, 0]} receiveShadow>
          <cylinderGeometry args={[0.96, PROMOTION_LAYOUT.radius, 0.32, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.72, 0.76, 0.24, 20]} />
          <meshStandardMaterial color="#dc2626" roughness={0.25} />
        </mesh>
        <group position={[0, 2.12, 0]}>
          <group position={[0, 0, 0.022]}>
            <Text position={[0, 0.055, 0]} fontSize={0.095} color="#b91c1c" anchorX="center" anchorY="middle" maxWidth={0.84}>MUA 2 TẶNG 1</Text>
            <Text position={[0, -0.055, 0]} fontSize={0.052} color="#7f1d1d" anchorX="center" anchorY="middle" maxWidth={0.84}>Ưu đãi giá sốc tuần này</Text>
          </group>
          <group position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
            <Text position={[0, 0.055, 0]} fontSize={0.095} color="#b91c1c" anchorX="center" anchorY="middle" maxWidth={0.84}>MUA 2 TẶNG 1</Text>
            <Text position={[0, -0.055, 0]} fontSize={0.052} color="#7f1d1d" anchorX="center" anchorY="middle" maxWidth={0.84}>Ưu đãi giá sốc tuần này</Text>
          </group>
        </group>
      </group>

      {/* Quầy thu ngân tự động 3D vật lý quét mã & đóng túi */}
      <SelfCheckoutScanner3D />
    </group>
  );
};
