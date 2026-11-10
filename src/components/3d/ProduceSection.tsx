import React, { useLayoutEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  PRODUCE_TABLES_CONFIG,
  PRODUCE_WALL_MURALS,
  ProduceTableConfig,
  ProduceBinConfig,
} from "../../data/produceLayout";
import { PRODUCE_PRODUCTS } from "../../data/produceProducts";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import { useCameraLod } from "../../utils/lodCulling";
import type { Product } from "../../types";

interface ProduceProductBatch {
  product: Product;
  shape: ProduceBinConfig["itemShape"];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
}

function createProduceGeometry(shape: ProduceBinConfig["itemShape"]): {
  geometry: THREE.BufferGeometry;
  halfHeight: number;
} {
  switch (shape) {
    case "bellpepper":
      return { geometry: new THREE.BoxGeometry(0.11, 0.12, 0.11), halfHeight: 0.06 };
    case "cucumber":
      return { geometry: new THREE.CylinderGeometry(0.024, 0.024, 0.16, 12), halfHeight: 0.024 };
    case "apple":
      return { geometry: new THREE.SphereGeometry(0.048, 14, 14), halfHeight: 0.048 };
    case "lemon":
      return { geometry: new THREE.SphereGeometry(0.038, 12, 12), halfHeight: 0.0475 };
    case "avocado":
      return { geometry: new THREE.SphereGeometry(0.042, 12, 12), halfHeight: 0.0567 };
    case "tomato":
      return { geometry: new THREE.SphereGeometry(0.032, 12, 12), halfHeight: 0.032 };
  }
}

/**
 * Helper dựng các batch InstancedMesh chuẩn cho toàn bộ hàng nông sản (Single Geometry/Product)
 * Giúp giảm ~300 draw calls xuống còn 6 InstancedMesh tương tác trực tiếp bằng Raycast.
 */
export function buildProduceStockBatches(
  tables: readonly ProduceTableConfig[] = PRODUCE_TABLES_CONFIG,
  products: readonly Product[] = PRODUCE_PRODUCTS
): { productBatches: ProduceProductBatch[]; stemMatrices: THREE.Matrix4[] } {
  const byProduct = new Map<string, ProduceProductBatch>();
  const stemMatrices: THREE.Matrix4[] = [];

  const tableMatrix = new THREE.Matrix4();
  const deckMatrix = new THREE.Matrix4();
  const worldDeckMatrix = new THREE.Matrix4();
  const localItemMatrix = new THREE.Matrix4();
  const stemOffset = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const quat = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();

  for (const table of tables) {
    const tiltRad = (table.tiltAngleDeg * Math.PI) / 180;
    tableMatrix.compose(
      new THREE.Vector3(...table.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, table.rotationY || 0, 0)),
      new THREE.Vector3(1, 1, 1)
    );
    deckMatrix.compose(
      new THREE.Vector3(0, table.height, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltRad, 0, 0)),
      new THREE.Vector3(1, 1, 1)
    );
    worldDeckMatrix.multiplyMatrices(tableMatrix, deckMatrix);

    for (const bin of table.bins) {
      const product = products.find((p) => p.id === bin.productId);
      if (!product) continue;

      let batch = byProduct.get(product.id);
      if (!batch) {
        const { geometry } = createProduceGeometry(bin.itemShape);
        const roughness =
          bin.itemShape === "tomato" ? 0.15 :
          bin.itemShape === "apple" ? 0.18 :
          bin.itemShape === "bellpepper" ? 0.2 :
          bin.itemShape === "avocado" ? 0.5 : 0.35;
        const material = new THREE.MeshStandardMaterial({
          color: bin.itemColor,
          roughness,
          metalness: bin.itemShape === "apple" || bin.itemShape === "tomato" ? 0.06 : 0.02,
        });
        batch = {
          product,
          shape: bin.itemShape,
          geometry,
          material,
          matrices: [],
        };
        byProduct.set(product.id, batch);
      }

      const { halfHeight } = createProduceGeometry(bin.itemShape);
      const { cols, rows } = bin.grid;
      const isLeftBin = bin.binIndex === 0;
      const binCenterX = isLeftBin ? -table.width / 4 : table.width / 4;
      const binWidth = table.width / 2 - 0.12;
      const binDepth = table.depth - 0.18;
      const spacingX = binWidth / cols;
      const spacingZ = binDepth / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = binCenterX - binWidth / 2 + (c + 0.5) * spacingX;
          const z = -binDepth / 2 + (r + 0.5) * spacingZ;
          const y = 0.02 + halfHeight;

          const rx = Math.sin(c * 17 + r * 31) * 0.08;
          const ry = Math.cos(c * 23 + r * 19) * Math.PI;
          const rz = bin.itemShape === "cucumber" ? Math.PI / 2 : Math.sin(c * 11 + r * 7) * 0.08;

          euler.set(rx, ry, rz);
          quat.setFromEuler(euler);
          pos.set(x, y, z);

          if (bin.itemShape === "lemon") scale.set(1, 1.25, 1);
          else if (bin.itemShape === "avocado") scale.set(1, 1.35, 1);
          else scale.set(1, 1, 1);

          localItemMatrix.compose(pos, quat, scale);
          const worldMat = new THREE.Matrix4().multiplyMatrices(worldDeckMatrix, localItemMatrix);
          batch.matrices.push(worldMat);

          // Cuống xanh nhỏ cho ớt chuông và táo
          if (bin.itemShape === "bellpepper" || bin.itemShape === "apple") {
            const stemH = bin.itemShape === "bellpepper" ? 0.068 : 0.052;
            stemOffset.makeTranslation(0, stemH, 0);
            const stemMat = new THREE.Matrix4().multiplyMatrices(worldMat, stemOffset);
            stemMatrices.push(stemMat);
          }
        }
      }
    }
  }

  return {
    productBatches: Array.from(byProduct.values()),
    stemMatrices,
  };
}

/**
 * InstancedMesh Batch cho một loại nông sản có gắn userData.product
 * Hỗ trợ nhặt hàng (E / Click), highlight viền và 360° Preview.
 */
const ProduceProductInstancedBatch: React.FC<{ batch: ProduceProductBatch }> = ({ batch }) => {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(ref.current, batch.matrices, 0, undefined, {
      staticTransform: true,
      enableLayer1: true,
    });
  }, [batch.matrices]);

  return (
    <instancedMesh
      ref={ref}
      args={[batch.geometry, batch.material, batch.matrices.length]}
      receiveShadow
      userData={{ product: batch.product }}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

/**
 * Gộp toàn bộ kết cấu 6 bàn nan gỗ, sọt nhựa, bảng giá trắng, khung Pano & biển treo vào 1 InstancedMesh + 1 kính Mica (Phase 6)
 */
const ProduceFurnitureInstanced: React.FC<{
  tables: readonly ProduceTableConfig[];
  murals: typeof PRODUCE_WALL_MURALS;
}> = ({ tables, murals }) => {
  const solidRef = useRef<THREE.InstancedMesh>(null);
  const acrylicRef = useRef<THREE.InstancedMesh>(null);

  const furnitureData = useMemo(() => {
    const solids: THREE.Matrix4[] = [];
    const solidColors: THREE.Color[] = [];
    const acrylics: THREE.Matrix4[] = [];

    const C_LEG = new THREE.Color("#1e293b");
    const C_DARK = new THREE.Color("#0f172a");
    const C_WOOD_DECK = new THREE.Color("#451a03");
    const C_WOOD_SLAT = new THREE.Color("#1c0a00");
    const C_CRATE = new THREE.Color("#0284c7");
    const C_PLAQUE = new THREE.Color("#ffffff");
    const C_BADGE = new THREE.Color("#facc15");
    const C_SIGN = new THREE.Color("#065f46");
    const C_CABLE = new THREE.Color("#cbd5e1");

    const tMat = new THREE.Matrix4();
    const local = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const e = new THREE.Euler();

    const pushColored = (
      matrix: THREE.Matrix4,
      color: THREE.Color
    ) => {
      solids.push(matrix);
      solidColors.push(color);
    };

    const pushScaled = (
      color: THREE.Color,
      lx: number,
      ly: number,
      lz: number,
      sx: number,
      sy: number,
      sz: number,
      rx = 0
    ) => {
      e.set(rx, 0, 0);
      q.setFromEuler(e);
      p.set(lx, ly, lz);
      s.set(sx, sy, sz);
      local.compose(p, q, s);
      pushColored(new THREE.Matrix4().multiplyMatrices(tMat, local), color);
    };

    for (const t of tables) {
      const { width: w, depth: d, height: h, tiltAngleDeg } = t;
      const tiltRad = (tiltAngleDeg * Math.PI) / 180;
      tMat.compose(
        new THREE.Vector3(...t.position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, t.rotationY || 0, 0)),
        new THREE.Vector3(1, 1, 1)
      );

      // 4 Chân bàn thép hộp
      for (const [cx, cz] of [
        [-w / 2 + 0.08, -d / 2 + 0.08],
        [w / 2 - 0.08, -d / 2 + 0.08],
        [-w / 2 + 0.08, d / 2 - 0.08],
        [w / 2 - 0.08, d / 2 - 0.08],
      ]) {
        pushScaled(C_LEG, cx, h / 2, cz, 0.06, h, 0.06);
      }

      // Giằng chân + gờ chắn trước mặt bàn nghiêng
      pushScaled(C_DARK, 0, 0.12, 0, w - 0.1, 0.04, d - 0.1);
      const frontRailLocal = new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0.045, d / 2 - 0.015),
        new THREE.Quaternion(),
        new THREE.Vector3(w, 0.08, 0.03)
      );
      const deckWorld = new THREE.Matrix4().multiplyMatrices(
        tMat,
        new THREE.Matrix4().compose(
          new THREE.Vector3(0, h, 0),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltRad, 0, 0)),
          new THREE.Vector3(1, 1, 1)
        )
      );
      pushColored(new THREE.Matrix4().multiplyMatrices(deckWorld, frontRailLocal), C_DARK);

      // Tầng kệ trữ rổ dưới chân + thân hộp gỗ + mặt bàn nghiêng
      pushScaled(C_WOOD_DECK, 0, 0.22, 0, w - 0.08, 0.03, d - 0.08);
      pushScaled(C_WOOD_DECK, 0, h - 0.16, 0, w + 0.02, 0.28, d + 0.02);
      pushScaled(C_WOOD_DECK, 0, h, 0, w, 0.04, d, tiltRad);

      // 9 Rãnh nan gỗ sẫm trang trí mặt trước
      for (let rIdx = 0; rIdx < 9; rIdx++) {
        const rx = -w / 2 + 0.22 + rIdx * 0.22;
        pushScaled(C_WOOD_SLAT, rx, h - 0.16, d / 2 + 0.015, 0.015, 0.26, 0.005);
      }

      // 2 Sọt nhựa xanh trữ hàng dưới gầm bàn
      for (const sx of [-0.55, 0.55]) {
        pushScaled(C_CRATE, sx, 0.36, 0, 0.55, 0.24, 0.65);
      }

      // 2 Bảng giá trắng chân quỳ (thay thế RoundedBox riêng lẻ)
      for (const bin of t.bins) {
        const binCenterX = bin.binIndex === 0 ? -w / 4 : w / 4;
        const plaqueLocal = new THREE.Matrix4().compose(
          new THREE.Vector3(binCenterX, 0.08, d / 2 - 0.08),
          new THREE.Quaternion(),
          new THREE.Vector3(0.42, 0.16, 0.015)
        );
        pushColored(new THREE.Matrix4().multiplyMatrices(deckWorld, plaqueLocal), C_PLAQUE);
      }

      // Vách ngăn mica giữa bàn nghiêng
      const dividerLocal = new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0.065, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(0.015, 0.12, d - 0.04)
      );
      acrylics.push(new THREE.Matrix4().multiplyMatrices(deckWorld, dividerLocal));
    }

    // 3 Pano tranh tường Đông (khung + nền xanh + tem vàng)
    const muralRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
    for (const mural of murals) {
      tMat.compose(new THREE.Vector3(...mural.position), muralRot, new THREE.Vector3(1, 1, 1));
      pushScaled(C_DARK, 0, 0, 0, mural.width, mural.height, 0.08);
      pushScaled(new THREE.Color(mural.bgColor), 0, 0, 0.045, mural.width - 0.1, mural.height - 0.1, 0.01);
      pushScaled(C_BADGE, mural.width / 2 - 0.8, mural.height / 2 - 0.35, 0.05, 1.1, 0.28, 0.02);
    }

    // Biển treo trần Rau củ quả + 2 ti treo bạc
    tMat.makeTranslation(10.75, 3.8, -8.0);
    pushScaled(C_SIGN, 0, 0, 0, 3.2, 0.55, 0.08);
    pushScaled(C_CABLE, -1.2, 0.8, 0, 0.01, 1.6, 0.01);
    pushScaled(C_CABLE, 1.2, 0.8, 0, 0.01, 1.6, 0.01);

    return { solids, solidColors, acrylics };
  }, [tables, murals]);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const materials = useMemo(() => ({
    solidVertex: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.42, metalness: 0.2 }),
    acrylic: new THREE.MeshStandardMaterial({ color: "#e0f2fe", transparent: true, opacity: 0.38, roughness: 0.1 }),
  }), []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidRef.current, furnitureData.solids, 0, furnitureData.solidColors, {
      staticTransform: true,
      enableLayer1: true,
    });
    applyMatricesToInstancedMesh(acrylicRef.current, furnitureData.acrylics, 0, undefined, {
      staticTransform: true,
    });
  }, [furnitureData]);

  return (
    <group userData={{ ignoreProductRaycast: true }}>
      <instancedMesh ref={solidRef} args={[unitBox, materials.solidVertex, furnitureData.solids.length]} castShadow receiveShadow />
      <instancedMesh ref={acrylicRef} args={[unitBox, materials.acrylic, furnitureData.acrylics.length]} />
    </group>
  );
};

/**
 * Nhãn chữ bảng giá chân quỳ cho từng ô trên mỗi bàn rau củ
 */
const TablePricePlaques: React.FC<{ config: ProduceTableConfig }> = ({ config }) => {
  const tiltRad = (config.tiltAngleDeg * Math.PI) / 180;
  return (
    <group position={config.position} rotation={[0, config.rotationY || 0, 0]} userData={{ ignoreProductRaycast: true }}>
      <group position={[0, config.height, 0]} rotation={[tiltRad, 0, 0]}>
        {config.bins.map((bin) => {
          const product = PRODUCE_PRODUCTS.find((p) => p.id === bin.productId);
          if (!product) return null;
          const binCenterX = bin.binIndex === 0 ? -config.width / 4 : config.width / 4;
          return (
            <group key={bin.binIndex} position={[binCenterX, 0.08, config.depth / 2 - 0.08]}>
              <Text
                position={[0, 0.038, 0.012]}
                fontSize={0.042}
                color="#0f172a"
                anchorX="center"
                anchorY="middle"
                maxWidth={0.38}
              >
                {product.name.split("Chuẩn")[0].split("Nhập")[0].trim()}
              </Text>
              <Text
                position={[0, -0.035, 0.012]}
                fontSize={0.054}
                color="#059669"
                anchorX="center"
                anchorY="middle"
              >
                {`${product.price.toLocaleString("vi-VN")} đ / ${product.unit}`}
              </Text>
            </group>
          );
        })}
      </group>
    </group>
  );
};

/**
 * Chữ Pano Tranh tường "Fresh picks" gắn trên tường Đông
 */
const ProduceWallMural: React.FC<{
  mural: (typeof PRODUCE_WALL_MURALS)[0];
}> = ({ mural }) => {
  return (
    <group position={mural.position} rotation={[0, -Math.PI / 2, 0]} userData={{ ignoreProductRaycast: true }}>
      <Text position={[mural.width / 2 - 0.8, mural.height / 2 - 0.35, 0.065]} fontSize={0.095} color="#064e3b" anchorX="center" anchorY="middle">
        {mural.badge}
      </Text>
      <Text position={[-0.3, 0.22, 0.055]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        {mural.headline}
      </Text>
      <Text position={[0, -0.28, 0.055]} fontSize={0.13} color="#d1fae5" anchorX="center" anchorY="middle" maxWidth={mural.width - 0.4}>
        {mural.subline}
      </Text>
    </group>
  );
};

/**
 * ProduceSection (Phase 6 - Consolidated InstancedMesh + LOD Culling)
 */
export const ProduceSection: React.FC = () => {
  const { productBatches, stemMatrices } = useMemo(
    () => buildProduceStockBatches(PRODUCE_TABLES_CONFIG, PRODUCE_PRODUCTS),
    []
  );

  const stemRef = useRef<THREE.InstancedMesh>(null);
  const pricePlaquesRef = useRef<THREE.Group>(null);
  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.008, 0.008, 0.022, 6), []);
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#166534", roughness: 0.6 }), []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(stemRef.current, stemMatrices);
  }, [stemMatrices]);

  // LOD Culling > 16m chỉ áp dụng lên cuống nhỏ và chữ bảng giá chân quỳ; 6 InstancedMesh nông sản luôn hiển thị
  useCameraLod([
    { ref: stemRef, center: [11.5, 0, -8.0], maxDistance: 16 },
    { ref: pricePlaquesRef, center: [11.5, 0, -8.0], maxDistance: 16 },
  ]);

  return (
    <group>
      {/* 1. Toàn bộ kết cấu bàn, bảng giá, pano & biển treo hợp nhất */}
      <ProduceFurnitureInstanced tables={PRODUCE_TABLES_CONFIG} murals={PRODUCE_WALL_MURALS} />

      {/* 2. Toàn bộ nông sản giữ nguyên 6 InstancedMesh hỗ trợ Raycast/Pick/Preview */}
      {productBatches.map((batch) => (
        <ProduceProductInstancedBatch key={batch.product.id} batch={batch} />
      ))}

      {/* Cuống nông sản (LOD > 18m) */}
      {stemMatrices.length > 0 && (
        <instancedMesh
          ref={stemRef}
          args={[stemGeo, stemMat, stemMatrices.length]}
          userData={{ ignoreProductRaycast: true }}
        />
      )}

      {/* 3. Bảng giá chân quỳ từng ô (LOD > 18m, mặc định visible=true trong JSDOM) */}
      <group ref={pricePlaquesRef}>
        {PRODUCE_TABLES_CONFIG.map((table) => (
          <TablePricePlaques key={table.id} config={table} />
        ))}
      </group>

      {/* 4. Chữ pano tranh tường Fresh picks */}
      {PRODUCE_WALL_MURALS.map((mural) => (
        <ProduceWallMural key={mural.id} mural={mural} />
      ))}

      {/* 5. Chữ biển treo ngành hàng thả trần */}
      <group position={[10.75, 3.8, -8.0]} userData={{ ignoreProductRaycast: true }}>
        <group position={[0, 0, 0.05]}>
          <Text position={[0, 0.08, 0]} fontSize={0.17} color="#ffffff" anchorX="center" anchorY="middle">
            RAU CỦ QUẢ TƯƠI SỐNG
          </Text>
          <Text position={[0, -0.09, 0]} fontSize={0.09} color="#a7f3d0" anchorX="center" anchorY="middle">
            FRESH PRODUCE & ORGANIC HARVEST
          </Text>
        </group>
        <group position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
          <Text position={[0, 0.08, 0]} fontSize={0.17} color="#ffffff" anchorX="center" anchorY="middle">
            RAU CỦ QUẢ TƯƠI SỐNG
          </Text>
          <Text position={[0, -0.09, 0]} fontSize={0.09} color="#a7f3d0" anchorX="center" anchorY="middle">
            FRESH PRODUCE & ORGANIC HARVEST
          </Text>
        </group>
      </group>
    </group>
  );
};
