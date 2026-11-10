import React, { useLayoutEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  APPAREL_RACKS_CONFIG,
  APPAREL_TABLES_CONFIG,
  APPAREL_ZONE_BOUNDS,
  type ApparelRackConfig,
  type ApparelTableConfig,
} from "../../data/apparelLayout";
import { APPAREL_PRODUCTS } from "../../data/apparelProducts";
import { getBirchWoodTexture } from "../../utils/textureGenerator";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import { useAppStore } from "../../stores/useAppStore";
import { useCameraLod } from "../../utils/lodCulling";
import type { Product } from "../../types";

interface ApparelProductBatch {
  product: Product;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
}

function createApparelGeometry(productId: string): THREE.BufferGeometry {
  switch (productId) {
    case "prod-apparel-tshirt":
      return new THREE.BoxGeometry(0.055, 0.44, 0.36);
    case "prod-apparel-shirt":
      return new THREE.BoxGeometry(0.052, 0.5, 0.38);
    case "prod-apparel-jacket":
      return new THREE.BoxGeometry(0.068, 0.52, 0.4);
    case "prod-apparel-trousers":
      return new THREE.BoxGeometry(0.048, 0.58, 0.3);
    case "prod-apparel-sneaker":
      return new THREE.BoxGeometry(0.095, 0.085, 0.24);
    case "prod-apparel-cap":
      return new THREE.SphereGeometry(0.095, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    default:
      return new THREE.BoxGeometry(0.15, 0.2, 0.15);
  }
}

/**
 * Helper dựng các batch InstancedMesh chuẩn cho toàn bộ hàng Thời Trang & Phụ Kiện
 * Tách thành 6 InstancedMesh (mỗi SKU 1 batch có gắn userData.product để Raycast / E / Preview)
 */
export function buildApparelStockBatches(
  racks: readonly ApparelRackConfig[] = APPAREL_RACKS_CONFIG,
  tables: readonly ApparelTableConfig[] = APPAREL_TABLES_CONFIG,
  products: readonly Product[] = APPAREL_PRODUCTS
): {
  productBatches: ApparelProductBatch[];
  hangerMatrices: THREE.Matrix4[];
  soleMatrices: THREE.Matrix4[];
  visorMatrices: THREE.Matrix4[];
} {
  const byProduct = new Map<string, ApparelProductBatch>();
  const hangerMatrices: THREE.Matrix4[] = [];
  const soleMatrices: THREE.Matrix4[] = [];
  const visorMatrices: THREE.Matrix4[] = [];

  const ensureBatch = (product: Product) => {
    let batch = byProduct.get(product.id);
    if (!batch) {
      batch = {
        product,
        geometry: createApparelGeometry(product.id),
        material: new THREE.MeshStandardMaterial({
          color: product.color,
          roughness: product.id === "prod-apparel-sneaker" ? 0.45 : 0.72,
          metalness: 0.04,
        }),
        matrices: [],
      };
      byProduct.set(product.id, batch);
    }
    return batch;
  };

  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const euler = new THREE.Euler();

  // 1. Sinh ma trận quần áo treo trên các giá chữ U (< 1.2m cao)
  for (const rack of racks) {
    const product = products.find((p) => p.id === rack.productId);
    if (!product) continue;
    const batch = ensureBatch(product);

    const usableSpan = rack.width - 0.28;
    const stepX = usableSpan / Math.max(1, rack.garmentCount - 1);
    const barY = 1.15;
    const garmentHeight = product.id === "prod-apparel-trousers" ? 0.58 : product.id === "prod-apparel-jacket" ? 0.52 : 0.46;

    for (let i = 0; i < rack.garmentCount; i++) {
      const gx = rack.position[0] - usableSpan / 2 + i * stepX;
      const gz = rack.position[2];

      // Móc áo phía trên
      euler.set(0, 0, 0);
      quat.setFromEuler(euler);
      pos.set(gx, barY - 0.03, gz);
      hangerMatrices.push(new THREE.Matrix4().compose(pos, quat, scale));

      // Áo/Quần treo ngay ngắn không xuyên thanh khung
      euler.set(0, Math.sin(i * 1.3) * 0.03, 0);
      quat.setFromEuler(euler);
      pos.set(gx, barY - 0.07 - garmentHeight / 2, gz);
      batch.matrices.push(new THREE.Matrix4().compose(pos, quat, scale));
    }
  }

  // 2. Sinh ma trận Giày (tầng 1 & tầng 2) và Mũ Lưỡi Trai (tầng 3) trên các bàn phụ kiện 2-3 bậc
  for (const table of tables) {
    const shoeProduct = products.find((p) => p.id === table.lowerProductId);
    const capProduct = products.find((p) => p.id === table.upperProductId);
    const [tx, , tz] = table.position;

    if (shoeProduct) {
      const shoeBatch = ensureBatch(shoeProduct);
      const cols = 4;
      const spacingX = (table.width - 0.36) / (cols - 1);

      // Tầng dưới (y = 0.27m top) & mặt bàn chính (y = 0.67m top)
      for (const shelfTopY of [0.27, 0.67]) {
        for (const rowOffsetZ of [-0.24, 0.24]) {
          for (let c = 0; c < cols; c++) {
            const sx = tx - (table.width - 0.36) / 2 + c * spacingX;
            const sz = tz + rowOffsetZ;

            euler.set(0, rowOffsetZ > 0 ? 0.08 : Math.PI - 0.08, 0);
            quat.setFromEuler(euler);
            // Chiếc trái & chiếc phải tạo thành 1 đôi gọn gàng
            for (const pairDx of [-0.058, 0.058]) {
              pos.set(sx + pairDx, shelfTopY + 0.048, sz);
              shoeBatch.matrices.push(new THREE.Matrix4().compose(pos, quat, scale));
              pos.set(sx + pairDx, shelfTopY + 0.012, sz);
              soleMatrices.push(new THREE.Matrix4().compose(pos, quat, scale));
            }
          }
        }
      }
    }

    if (capProduct) {
      const capBatch = ensureBatch(capProduct);
      const cols = 4;
      const spacingX = (table.width - 0.56) / (cols - 1);
      const upperShelfTopY = 0.92;

      for (const rowZ of [-0.14, 0.14]) {
        for (let c = 0; c < cols; c++) {
          const cx = tx - (table.width - 0.56) / 2 + c * spacingX;
          const cz = tz + rowZ;
          const facing = rowZ >= 0 ? 0 : Math.PI;
          euler.set(0, facing, 0);
          quat.setFromEuler(euler);

          pos.set(cx, upperShelfTopY + 0.005, cz);
          capBatch.matrices.push(new THREE.Matrix4().compose(pos, quat, scale));

          // Vành lưỡi trai hướng ra ngoài khách hàng
          pos.set(cx, upperShelfTopY + 0.012, cz + (rowZ >= 0 ? 0.085 : -0.085));
          visorMatrices.push(new THREE.Matrix4().compose(pos, quat, scale));
        }
      }
    }
  }

  return {
    productBatches: Array.from(byProduct.values()),
    hangerMatrices,
    soleMatrices,
    visorMatrices,
  };
}

/**
 * InstancedMesh Batch cho từng sản phẩm thời trang có hỗ trợ Raycast
 */
const ApparelProductInstancedBatch: React.FC<{ batch: ApparelProductBatch }> = ({ batch }) => {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(ref.current, batch.matrices);
  }, [batch.matrices]);

  return (
    <instancedMesh
      ref={ref}
      args={[batch.geometry, batch.material, batch.matrices.length]}
      castShadow
      receiveShadow
      userData={{ product: batch.product }}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

/**
 * Gom toàn bộ khung giá treo chữ U, bàn phụ kiện, nẹp sàn, đế giày & vành mũ vào 1 InstancedMesh qua setColorAt (Phase 6)
 */
const ApparelFurnitureInstanced: React.FC<{
  racks: readonly ApparelRackConfig[];
  tables: readonly ApparelTableConfig[];
  soleMatrices: THREE.Matrix4[];
  visorMatrices: THREE.Matrix4[];
}> = ({ racks, tables, soleMatrices, visorMatrices }) => {
  const solidRef = useRef<THREE.InstancedMesh>(null);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const vertexMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.32, metalness: 0.25 }),
    []
  );

  const data = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    const C_CHROME = new THREE.Color("#94a3b8");
    const C_WHITE = new THREE.Color("#f8fafc");
    const C_BLUE = new THREE.Color("#0071dc");
    const C_VISOR = new THREE.Color("#1e40af");

    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const pushBox = (color: THREE.Color, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      p.set(x, y, z);
      s.set(sx, sy, sz);
      matrices.push(new THREE.Matrix4().compose(p, q, s));
      colors.push(color);
    };

    // Nẹp bo viền chuyển tiếp sàn gỗ Birch
    pushBox(
      C_CHROME,
      APPAREL_ZONE_BOUNDS.centerX,
      0.002,
      APPAREL_ZONE_BOUNDS.centerZ,
      APPAREL_ZONE_BOUNDS.width + 0.14,
      0.002,
      APPAREL_ZONE_BOUNDS.depth + 0.14
    );

    // 1. Giá treo quần áo chữ U ngược (Clothing Rack Frames)
    for (const r of racks) {
      const [rx, , rz] = r.position;
      const hw = r.width / 2 - 0.04;
      const hd = r.depth / 2;
      pushBox(C_CHROME, rx - hw, 0.59, rz, 0.028, 1.18, 0.028);
      pushBox(C_CHROME, rx + hw, 0.59, rz, 0.028, 1.18, 0.028);
      pushBox(C_CHROME, rx - hw, 0.02, rz, 0.035, 0.035, r.depth);
      pushBox(C_CHROME, rx + hw, 0.02, rz, 0.035, 0.035, r.depth);
      pushBox(C_CHROME, rx, 1.15, rz, r.width - 0.06, 0.028, 0.028);
      pushBox(C_CHROME, rx, 0.06, rz, r.width - 0.08, 0.022, 0.022);
      pushBox(C_CHROME, rx, 1.22, rz, 0.018, 0.14, 0.018);
      pushBox(C_BLUE, rx, 1.29, rz, 0.96, 0.14, 0.03);
      pushBox(C_WHITE, rx + hw - 0.04, 1.05, rz + hd * 0.45, 0.16, 0.07, 0.012);
    }

    // 2. Bàn trưng bày phụ kiện 2-3 tầng (Accessory Tables)
    for (const t of tables) {
      const [tx, , tz] = t.position;
      const hw = t.width / 2 - 0.06;
      const hd = t.depth / 2 - 0.06;
      for (const [cx, cz] of [
        [tx - hw, tz - hd],
        [tx + hw, tz - hd],
        [tx - hw, tz + hd],
        [tx + hw, tz + hd],
      ]) {
        pushBox(C_WHITE, cx, 0.325, cz, 0.045, 0.65, 0.045);
      }
      pushBox(C_WHITE, tx, 0.25, tz, t.width - 0.08, 0.04, t.depth - 0.08);
      pushBox(C_WHITE, tx, 0.65, tz, t.width, 0.04, t.depth);
      pushBox(C_BLUE, tx - t.width * 0.28, 0.78, tz, 0.08, 0.22, t.depth * 0.48);
      pushBox(C_BLUE, tx + t.width * 0.28, 0.78, tz, 0.08, 0.22, t.depth * 0.48);
      pushBox(C_WHITE, tx, 0.9, tz, t.width - 0.34, 0.035, t.depth * 0.56);
      pushBox(C_BLUE, tx, 0.625, tz + t.depth / 2 + 0.004, t.width, 0.014, 0.008);
      pushBox(C_BLUE, tx, 0.625, tz - t.depth / 2 - 0.004, t.width, 0.014, 0.008);
      pushBox(C_CHROME, tx, 1.09, tz, 0.02, 0.36, 0.02);
      pushBox(C_BLUE, tx, 1.27, tz, 0.92, 0.14, 0.03);
      pushBox(C_WHITE, tx, 0.68, tz + t.depth / 2 - 0.02, 0.28, 0.06, 0.012);
    }

    // 3. Đế giày trắng & vành nón kết hợp vào cùng batch
    const soleScale = new THREE.Matrix4().makeScale(0.102, 0.024, 0.25);
    for (const m of soleMatrices) {
      matrices.push(new THREE.Matrix4().multiplyMatrices(m, soleScale));
      colors.push(C_WHITE);
    }
    const visorScale = new THREE.Matrix4().makeScale(0.16, 0.012, 0.11);
    for (const m of visorMatrices) {
      matrices.push(new THREE.Matrix4().multiplyMatrices(m, visorScale));
      colors.push(C_VISOR);
    }

    return { matrices, colors };
  }, [racks, tables, soleMatrices, visorMatrices]);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(solidRef.current, data.matrices, 0, data.colors);
  }, [data]);

  return (
    <group>
      <instancedMesh ref={solidRef} args={[unitBox, vertexMat, data.matrices.length]} castShadow receiveShadow />
    </group>
  );
};

/**
 * ApparelSection (Phase 6 - Consolidated InstancedMesh + Overview HideCeiling + LOD)
 */
export const ApparelSection: React.FC = () => {
  const isOverviewMode = useAppStore((state) => state.isOverviewMode);
  const birchTexture = useMemo(() => getBirchWoodTexture(), []);
  const { productBatches, hangerMatrices, soleMatrices, visorMatrices } = useMemo(
    () => buildApparelStockBatches(APPAREL_RACKS_CONFIG, APPAREL_TABLES_CONFIG, APPAREL_PRODUCTS),
    []
  );

  const hangerRef = useRef<THREE.InstancedMesh>(null);
  const priceTextGroupRef = useRef<THREE.Group>(null);
  const ceilingLightsRef = useRef<THREE.InstancedMesh>(null);

  const hangerGeo = useMemo(() => new THREE.CylinderGeometry(0.005, 0.005, 0.28, 6), []);
  const lightGeo = useMemo(() => new THREE.BoxGeometry(0.18, 0.025, 11.6), []);

  const auxMats = useMemo(() => ({
    hanger: new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.7, roughness: 0.3 }),
    recessedLight: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 1.6 }),
  }), []);

  const lightMatrices = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const offsets = [-4.2, -1.4, 1.4, 4.2];
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    for (const ox of offsets) {
      p.set(APPAREL_ZONE_BOUNDS.centerX + ox, APPAREL_ZONE_BOUNDS.ceilingY - 0.015, APPAREL_ZONE_BOUNDS.centerZ);
      mats.push(new THREE.Matrix4().compose(p, q, s));
    }
    return mats;
  }, []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(hangerRef.current, hangerMatrices, Math.PI / 2);
    applyMatricesToInstancedMesh(ceilingLightsRef.current, lightMatrices);
  }, [hangerMatrices, lightMatrices]);

  // LOD Distance Culling > 18m chỉ cho móc áo nhỏ & chữ giá; 6 SKU quần áo/giày/nón luôn hiển thị
  useCameraLod([
    { ref: hangerRef, center: [APPAREL_ZONE_BOUNDS.centerX, 0, APPAREL_ZONE_BOUNDS.centerZ], maxDistance: 18 },
    { ref: priceTextGroupRef, center: [APPAREL_ZONE_BOUNDS.centerX, 0, APPAREL_ZONE_BOUNDS.centerZ], maxDistance: 18 },
  ]);

  return (
    <group>
      {/* 1. MẶT SÀN GỖ GHÉP THANH BIRCH WOOD PARQUET (13m x 14m) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[APPAREL_ZONE_BOUNDS.centerX, 0.004, APPAREL_ZONE_BOUNDS.centerZ]}
        receiveShadow
        userData={{ ignoreProductRaycast: true }}
      >
        <planeGeometry args={[APPAREL_ZONE_BOUNDS.width, APPAREL_ZONE_BOUNDS.depth]} />
        <meshStandardMaterial
          {...(birchTexture.image ? { map: birchTexture } : {})}
          color={birchTexture.image ? "#ffffff" : "#e3c396"}
          roughness={0.38}
          metalness={0.04}
        />
      </mesh>

      {/* 2. TRẦN HẠ BẬC THẠCH CAO MODULAR (y = 4.5m, ẩn khi bật 01-overview) */}
      <group visible={!isOverviewMode}>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[APPAREL_ZONE_BOUNDS.centerX, APPAREL_ZONE_BOUNDS.ceilingY, APPAREL_ZONE_BOUNDS.centerZ]}
          userData={{ ignoreProductRaycast: true }}
        >
          <planeGeometry args={[APPAREL_ZONE_BOUNDS.width, APPAREL_ZONE_BOUNDS.depth]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
        </mesh>
        <instancedMesh
          ref={ceilingLightsRef}
          args={[lightGeo, auxMats.recessedLight, lightMatrices.length]}
          userData={{ ignoreProductRaycast: true }}
        />
      </group>

      {/* 3. KHUNG GIÁ TREO, BÀN PHỤ KIỆN, ĐẾ GIÀY, VÀNH NÓN & VIỀN SÀN HỢP NHẤT */}
      <ApparelFurnitureInstanced
        racks={APPAREL_RACKS_CONFIG}
        tables={APPAREL_TABLES_CONFIG}
        soleMatrices={soleMatrices}
        visorMatrices={visorMatrices}
      />

      {/* 4. MÓC ÁO (LOD > 18m) */}
      {hangerMatrices.length > 0 && (
        <instancedMesh ref={hangerRef} args={[hangerGeo, auxMats.hanger, hangerMatrices.length]} userData={{ ignoreProductRaycast: true }} />
      )}

      {/* 5. CÁC LÔ SẢN PHẨM THỜI TRANG INSTANCED MESH HỖ TRỢ RAYCAST (E / CLICK) */}
      {productBatches.map((batch) => (
        <ApparelProductInstancedBatch key={batch.product.id} batch={batch} />
      ))}

      {/* 6. BIỂN CHỈ DẪN "EVERYDAY CLOTHING" & "ACCESSORIES" HAI MẶT (< 1.4m) */}
      {APPAREL_RACKS_CONFIG.map((rack) => (
        <group key={rack.id} position={[rack.position[0], 1.29, rack.position[2]]} userData={{ ignoreProductRaycast: true }}>
          <Text position={[0, 0, 0.022]} fontSize={0.072} color="#ffffff" anchorX="center" anchorY="middle">
            {rack.signTitle}
          </Text>
          <Text position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]} fontSize={0.072} color="#ffffff" anchorX="center" anchorY="middle">
            {rack.signTitle}
          </Text>
        </group>
      ))}

      {APPAREL_TABLES_CONFIG.map((table) => (
        <group key={table.id} position={[table.position[0], 1.27, table.position[2]]} userData={{ ignoreProductRaycast: true }}>
          <Text position={[0, 0, 0.022]} fontSize={0.075} color="#ffffff" anchorX="center" anchorY="middle">
            {table.signTitle}
          </Text>
          <Text position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]} fontSize={0.075} color="#ffffff" anchorX="center" anchorY="middle">
            {table.signTitle}
          </Text>
        </group>
      ))}

      {/* Nhãn giá nhỏ cạnh giá treo & bàn (LOD > 18m, mặc định visible=true trong JSDOM) */}
      <group ref={priceTextGroupRef} userData={{ ignoreProductRaycast: true }}>
        {APPAREL_RACKS_CONFIG.map((rack) => {
          const product = APPAREL_PRODUCTS.find((p) => p.id === rack.productId);
          if (!product) return null;
          return (
            <Text
              key={`price-${rack.id}`}
              position={[rack.position[0] + rack.width / 2 - 0.08, 1.05, rack.position[2] + (rack.depth / 2) * 0.45 + 0.012]}
              fontSize={0.026}
              color="#0f172a"
              anchorX="center"
              anchorY="middle"
            >
              {`${product.price.toLocaleString("vi-VN")} đ`}
            </Text>
          );
        })}

        {APPAREL_TABLES_CONFIG.map((table) => {
          const shoeProduct = APPAREL_PRODUCTS.find((p) => p.id === table.lowerProductId);
          if (!shoeProduct) return null;
          return (
            <Text
              key={`price-${table.id}`}
              position={[table.position[0], 0.68, table.position[2] + table.depth / 2 - 0.01]}
              fontSize={0.028}
              color="#0f172a"
              anchorX="center"
              anchorY="middle"
            >
              {`${shoeProduct.price.toLocaleString("vi-VN")} đ`}
            </Text>
          );
        })}
      </group>
    </group>
  );
};
