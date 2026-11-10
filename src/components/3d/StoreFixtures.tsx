import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { NORTH_PERIMETER_LAYOUT, SEASONAL_PROMO_BAYS, SHELF_LAYOUT } from "../../data/storeLayout";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import {
  getDepartmentBannerAtlasTexture,
  getZoneSignAtlasTexture,
  remapGeometryToAtlasTile,
} from "../../utils/textureAtlasGenerator";

const BANNERS = [
  { position: [-5.4, 3.25, 3.4] as [number, number, number], aisleNumber: "01", title: "NƯỚC GIẢI KHÁT & BIA", subtitle: "Coca-Cola · Sting · Bia Saigon", color: "#1d4ed8" },
  { position: [-2.6, 3.25, 3.4] as [number, number, number], aisleNumber: "02", title: "SỮA & CÀ PHÊ", subtitle: "Vinamilk · Cà phê G7 · Milo", color: "#ea580c" },
  { position: [2.6, 3.25, 3.4] as [number, number, number], aisleNumber: "03", title: "BÁNH KẸO & MÌ GÓI", subtitle: "Hảo Hảo · Choco-Pie · Snack", color: "#7c3aed" },
  { position: [5.4, 3.25, 3.4] as [number, number, number], aisleNumber: "04", title: "GIA VỊ & NÔNG SẢN", subtitle: "Dầu Simply · Gạo ST25", color: "#059669" },
];

const ZONE_SIGNS = [
  { title: "DAIRY & FROZEN", subtitle: "Sữa mát & Thực phẩm đông lạnh", bgColor: "#0369a1", accentColor: "#38bdf8" },
  { title: "BAKERY & DELI", subtitle: "Bánh mì tươi & Món chế biến sẵn", bgColor: "#92400e", accentColor: "#facc15" },
  { title: "SELF-CHECKOUT SẢNH NAM ↓", subtitle: "8 Quầy tự thanh toán SCO-01..08", bgColor: "#0052cc", accentColor: "#ff5400" },
  { title: "SMARTMART 3D HYPERMARKET", subtitle: "Không gian bán lẻ kiến trúc sáng", bgColor: "#0f172a", accentColor: "#10b981" },
];

function mergeUvPlaneGeometries(
  planes: ReadonlyArray<{ tileIndex: number; width: number; height: number; matrix: THREE.Matrix4 }>
): THREE.BufferGeometry {
  const posList: number[] = [];
  const normList: number[] = [];
  const uvList: number[] = [];
  const indexList: number[] = [];
  let vertexOffset = 0;

  for (const item of planes) {
    const base = remapGeometryToAtlasTile(new THREE.PlaneGeometry(item.width, item.height), item.tileIndex, 2, 2);
    base.applyMatrix4(item.matrix);
    const pos = base.attributes.position;
    const norm = base.attributes.normal;
    const uv = base.attributes.uv;
    const idx = base.index;
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

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(posList, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normList, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvList, 2));
  merged.setIndex(indexList);
  return merged;
}

/**
 * StoreFixtures (Phase 7 - North Perimeter & Clean Concourse Architecture)
 * - Đã xóa hoàn toàn Checkout 04 giữa sảnh, FreezerWall z=-6.1 và cột MUA 2 TẶNG 1.
 * - Tái quy hoạch 8 tủ Dairy & Frozen + 3 quầy kính Bakery & Deli + 2 Đảo bánh mì tại Tường Bắc,
 *   2 Đảo khuyến mãi mùa vụ thấp tầng (không cột cao) và 4 DepartmentBanner + Biển chỉ dẫn Sảnh Nam.
 * - Tổng chỉ dùng 6 Draw Calls (4 InstancedMesh + 2 Merged Atlas Geo), 0 <pointLight>, 0 <Text> mới.
 */
export const StoreFixtures: React.FC = () => {
  const solidBoxesRef = useRef<THREE.InstancedMesh>(null);
  const cylindersRef = useRef<THREE.InstancedMesh>(null);
  const freezerGlassRef = useRef<THREE.InstancedMesh>(null);
  const freezerGlowRef = useRef<THREE.InstancedMesh>(null);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const unitCyl = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 12), []);

  const bannerAtlasTex = useMemo(() => getDepartmentBannerAtlasTexture(BANNERS), []);
  const zoneSignAtlasTex = useMemo(() => getZoneSignAtlasTexture(ZONE_SIGNS), []);

  const materials = useMemo(() => ({
    solidVertexColor: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.44, metalness: 0.1 }),
    metalVertexColor: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.25, metalness: 0.55 }),
    freezerGlass: new THREE.MeshStandardMaterial({
      color: "#bae6fd",
      transparent: true,
      opacity: 0.26,
      roughness: 0.08,
      metalness: 0.25,
      depthWrite: false,
    }),
    freezerGlow: new THREE.MeshStandardMaterial({
      color: "#eef6ff",
      emissive: "#60a5fa",
      emissiveIntensity: 0.3,
      roughness: 0.12,
    }),
    bannerAtlas: new THREE.MeshStandardMaterial({
      ...(bannerAtlasTex.image ? { map: bannerAtlasTex } : {}),
      color: "#ffffff",
      roughness: 0.38,
    }),
    zoneSignAtlas: new THREE.MeshStandardMaterial({
      ...(zoneSignAtlasTex.image ? { map: zoneSignAtlasTex } : {}),
      color: "#ffffff",
      roughness: 0.38,
    }),
  }), [bannerAtlasTex, zoneSignAtlasTex]);

  const mergedBannerDecalGeo = useMemo(() => {
    const planes: Array<{ tileIndex: number; width: number; height: number; matrix: THREE.Matrix4 }> = [];
    const rotY = new THREE.Euler(0, Math.PI, 0);
    BANNERS.forEach((b, i) => {
      planes.push({
        tileIndex: i,
        width: 2.12,
        height: 0.52,
        matrix: new THREE.Matrix4().makeTranslation(b.position[0], b.position[1], b.position[2] + 0.046),
      });
      planes.push({
        tileIndex: i,
        width: 2.12,
        height: 0.52,
        matrix: new THREE.Matrix4().compose(
          new THREE.Vector3(b.position[0], b.position[1], b.position[2] - 0.046),
          new THREE.Quaternion().setFromEuler(rotY),
          new THREE.Vector3(1, 1, 1)
        ),
      });
    });
    return mergeUvPlaneGeometries(planes);
  }, []);

  const mergedZoneSignGeo = useMemo(() => {
    const rotBack = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
    const qId = new THREE.Quaternion();
    const sId = new THREE.Vector3(1, 1, 1);
    return mergeUvPlaneGeometries([
      // Tile 0: Dairy & Frozen header phía trên 8 tủ lạnh Bắc (Z = -25.85)
      { tileIndex: 0, width: 6.2, height: 1.0, matrix: new THREE.Matrix4().compose(new THREE.Vector3(-10.3, 3.7, -25.95), qId, sId) },
      // Tile 1: Bakery & Deli header trên tường Bắc Đông (Z = -25.85)
      { tileIndex: 1, width: 6.2, height: 1.0, matrix: new THREE.Matrix4().compose(new THREE.Vector3(9.8, 3.7, -25.95), qId, sId) },
      // Tile 2: Biển treo Self-Checkout Sảnh Nam (hai mặt, X = 0, Z = 11.2, Y = 3.55)
      { tileIndex: 2, width: 3.4, height: 0.8, matrix: new THREE.Matrix4().compose(new THREE.Vector3(0, 3.55, 11.25), qId, sId) },
      { tileIndex: 2, width: 3.4, height: 0.8, matrix: new THREE.Matrix4().compose(new THREE.Vector3(0, 3.55, 11.15), rotBack, sId) },
      // Tile 3: Pano tiêu điểm Tường Bắc cuối Đại lộ Chính (X = 0, Y = 3.3, Z = -26.82)
      { tileIndex: 3, width: 5.4, height: 1.5, matrix: new THREE.Matrix4().compose(new THREE.Vector3(0, 3.3, -26.8), qId, sId) },
    ]);
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

    // 1. Dãy 8 tủ Dairy & Frozen quay mặt +Z dọc Tường Bắc-Tây (Z = -26.2m)
    for (const fx of NORTH_PERIMETER_LAYOUT.freezerWall.cabinetPositionsX) {
      const fz = NORTH_PERIMETER_LAYOUT.freezerWall.z;
      addBox(fx, 1.55, fz, 1.65, 3.0, 0.72, "#e2e8f0");
      for (const sy of [-0.75, -0.15, 0.45, 1.0]) {
        addBox(fx, 1.55 + sy, fz + 0.28, 1.48, 0.04, 0.18, "#f8fafc");
      }
      addBox(fx, 3.18, fz + 0.18, 1.55, 0.22, 0.06, "#0369a1");
      addCyl(fx + 0.65, 1.55, fz + 0.41, 0.036, 1.15, "#cbd5e1");

      p.set(fx, 1.55, fz + 0.28);
      q.identity();
      s.set(1.5, 2.72, 0.1);
      glows.push(new THREE.Matrix4().compose(p, q, s));

      p.set(fx, 1.55, fz + 0.37);
      s.set(1.56, 2.78, 0.02);
      glasses.push(new THREE.Matrix4().compose(p, q, s));
    }

    // 2. Khu Bakery & Deli Tường Bắc-Đông (tông ấm dịu #fff1db, 3 quầy kính + 2 đảo bánh mì thấp tầng)
    for (const bx of NORTH_PERIMETER_LAYOUT.bakeryWall.counterPositionsX) {
      const bz = NORTH_PERIMETER_LAYOUT.bakeryWall.z;
      addBox(bx, 0.48, bz, 3.15, 0.96, 1.05, "#fff1db");
      addBox(bx, 0.98, bz, 3.2, 0.06, 1.1, "#92400e");
      addBox(bx, 1.04, bz - 0.35, 3.05, 0.12, 0.3, "#78350f");
      for (let i = -3; i <= 3; i++) {
        addBox(bx + i * 0.4, 1.08, bz + 0.1, 0.24, 0.12, 0.28, i % 2 === 0 ? "#d97706" : "#f59e0b");
      }
      p.set(bx, 1.24, bz + 0.36);
      q.identity();
      s.set(3.1, 0.46, 0.03);
      glasses.push(new THREE.Matrix4().compose(p, q, s));
    }
    for (const island of NORTH_PERIMETER_LAYOUT.bakeryIslands) {
      addBox(island.x, 0.44, island.z, island.width, 0.88, island.depth, "#fff1db");
      addBox(island.x, 0.9, island.z, island.width + 0.06, 0.06, island.depth + 0.06, "#92400e");
      for (let j = -1; j <= 1; j++) {
        addBox(island.x + j * 0.52, 1.01, island.z, 0.32, 0.14, 0.48, j === 0 ? "#f59e0b" : "#d97706");
      }
    }

    // 3. 2 Đảo khuyến mãi mùa vụ thấp tầng (<= 1.05m, không cột cản tầm nhìn)
    for (const bay of SEASONAL_PROMO_BAYS) {
      addBox(bay.x, 0.38, bay.z, bay.width, 0.76, bay.depth, "#f8fafc");
      addBox(bay.x, 0.78, bay.z, bay.width + 0.06, 0.05, bay.depth + 0.06, "#0052cc");
      addBox(bay.x, 0.94, bay.z, bay.width * 0.55, 0.26, bay.depth * 0.55, "#ff5400");
    }

    // 4. Khung nền các biển treo (4 DepartmentBanner + Biển Sảnh Nam + Tiêu điểm Bắc)
    for (const b of BANNERS) {
      const [bx, by, bz] = b.position;
      addBox(bx, by, bz, 2.2, 0.58, 0.08, b.color);
      addBox(bx, by, bz, 2.22, 0.6, 0.02, "#ffffff");
      addCyl(bx - 0.8, by + 0.55, bz, 0.01, 0.8, "#cbd5e1");
      addCyl(bx + 0.8, by + 0.55, bz, 0.01, 0.8, "#cbd5e1");
    }
    addBox(-10.3, 3.7, -26.0, 6.4, 1.1, 0.08, "#0369a1");
    addBox(9.8, 3.7, -26.0, 6.4, 1.1, 0.08, "#92400e");
    addBox(0, 3.55, 11.2, 3.5, 0.88, 0.08, "#0052cc");
    addCyl(-1.3, 4.45, 11.2, 0.012, 1.0, "#cbd5e1");
    addCyl(1.3, 4.45, 11.2, 0.012, 1.0, "#cbd5e1");
    addBox(0, 3.3, -26.84, 5.6, 1.6, 0.06, "#0f172a");

    void SHELF_LAYOUT;
    return { boxes, boxColors, cyls, cylColors, glasses, glows };
  }, []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidBoxesRef.current, batches.boxes, 0, batches.boxColors, {
      staticTransform: true,
      enableLayer1: true,
    });
    applyMatricesToInstancedMesh(cylindersRef.current, batches.cyls, 0, batches.cylColors, {
      staticTransform: true,
    });
    applyMatricesToInstancedMesh(freezerGlassRef.current, batches.glasses, 0, undefined, {
      staticTransform: true,
    });
    applyMatricesToInstancedMesh(freezerGlowRef.current, batches.glows, 0, undefined, {
      staticTransform: true,
    });
  }, [batches]);

  return (
    <group userData={{ ignoreProductRaycast: true }}>
      <instancedMesh ref={solidBoxesRef} args={[unitBox, materials.solidVertexColor, batches.boxes.length]} castShadow receiveShadow />
      <instancedMesh ref={cylindersRef} args={[unitCyl, materials.metalVertexColor, batches.cyls.length]} />
      <instancedMesh ref={freezerGlowRef} args={[unitBox, materials.freezerGlow, batches.glows.length]} />
      <instancedMesh ref={freezerGlassRef} args={[unitBox, materials.freezerGlass, batches.glasses.length]} />
      <mesh geometry={mergedBannerDecalGeo} material={materials.bannerAtlas} />
      <mesh geometry={mergedZoneSignGeo} material={materials.zoneSignAtlas} />
    </group>
  );
};
