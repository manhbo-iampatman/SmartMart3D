import React, { useLayoutEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { CHECKOUT_STATIONS_CONFIG, CART_CORRAL_CONFIG } from "../../data/checkoutLayout";
import { STORE_COLUMNS, STORE_LAYOUT } from "../../data/storeLayout";
import { useAppStore } from "../../stores/useAppStore";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import { useCameraLod } from "../../utils/lodCulling";
import { getContactAOTexture, getTerrazzoFloorTextures } from "../../utils/textureGenerator";

interface ColoredInstance {
  matrix: THREE.Matrix4;
  color: THREE.Color;
}

/** Tạo danh sách ma trận Contact AO tĩnh dưới chân toàn bộ kệ, bàn, Kiosk, tủ & 12 cột */
export function buildContactAOMatrices(): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = [];
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const e = new THREE.Euler();

  for (const obs of STORE_LAYOUT.obstacles) {
    if (obs.kind !== "rect") continue;
    if (obs.id.startsWith("kiosk-bank-") || obs.id === "cart-corral-south") continue;
    const isColumn = obs.id.startsWith("col-");
    const pad = isColumn ? 0.45 : 0.34;
    e.set(-Math.PI / 2, 0, 0);
    q.setFromEuler(e);
    p.set(obs.x, 0.0065, obs.z);
    s.set(obs.width + pad, obs.depth + pad, 1);
    matrices.push(new THREE.Matrix4().compose(p, q, s));
  }

  for (const kiosk of CHECKOUT_STATIONS_CONFIG) {
    e.set(-Math.PI / 2, 0, kiosk.rotationY);
    q.setFromEuler(e);
    p.set(kiosk.position[0] - 0.14, 0.0065, kiosk.position[2]);
    s.set(1.75, 1.05, 1);
    matrices.push(new THREE.Matrix4().compose(p, q, s));
  }

  e.set(-Math.PI / 2, 0, 0);
  q.setFromEuler(e);
  p.set(CART_CORRAL_CONFIG.position[0], 0.0065, CART_CORRAL_CONFIG.position[2]);
  s.set(CART_CORRAL_CONFIG.width + 0.4, CART_CORRAL_CONFIG.depth + 0.4, 1);
  matrices.push(new THREE.Matrix4().compose(p, q, s));

  return matrices;
}

/**
 * SupermarketStructure (Phase 6 - Consolidated InstancedMesh + Overview HideCeiling)
 * Toàn bộ cột, nẹp, tường, khung sảnh, vì kèo W-struts, ống HVAC & máng đèn
 * được hợp nhất bằng InstancedMesh + setColorAt còn ~11 Draw Calls,
 * và tự ẩn hệ trần khi bật góc nhìn toàn cảnh 01-overview.
 */
export const SupermarketStructure: React.FC = () => {
  const isOverviewMode = useAppStore((state) => state.isOverviewMode);

  const trussZPositions = useMemo(() => [-24, -18, -12, -6, 0, 6, 12, 18, 24], []);
  const purlinXPositions = useMemo(() => [-16, -11, -6, 0, 6, 11, 16], []);
  const lightXPositions = useMemo(() => [-14, -10, -6, -2, 2, 6, 10, 14], []);

  const floorDecorRef = useRef<THREE.InstancedMesh>(null);
  const contactAoRef = useRef<THREE.InstancedMesh>(null);
  const groundWallsRef = useRef<THREE.InstancedMesh>(null);
  const groundSolidRef = useRef<THREE.InstancedMesh>(null);
  const pedestalLedRef = useRef<THREE.InstancedMesh>(null);
  const ceilingBoxRef = useRef<THREE.InstancedMesh>(null);
  const ceilingCylRef = useRef<THREE.InstancedMesh>(null);
  const hvacRingRef = useRef<THREE.InstancedMesh>(null);
  const hvacDiffuserRef = useRef<THREE.InstancedMesh>(null);
  const ledTubeRef = useRef<THREE.InstancedMesh>(null);
  const colLabelsRef = useRef<THREE.Group>(null);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const unitPlane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const unitCyl = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 12), []);
  const hvacTorusGeo = useMemo(() => new THREE.TorusGeometry(0.33, 0.025, 8, 20), []);
  const hvacDiffuserGeo = useMemo(() => new THREE.ConeGeometry(0.22, 0.12, 14), []);

  const floorTextures = useMemo(() => getTerrazzoFloorTextures(4), []);
  const contactAoTex = useMemo(() => getContactAOTexture(), []);

  const mats = useMemo(() => ({
    floorDecor: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.42, metalness: 0.03 }),
    contactAo: new THREE.MeshBasicMaterial({
      ...(contactAoTex.image ? { map: contactAoTex } : {}),
      color: contactAoTex.image ? "#ffffff" : "#0f172a",
      transparent: true,
      opacity: contactAoTex.image ? 1.0 : 0.16,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    groundWall: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.78, metalness: 0.0 }),
    groundSolid: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35, metalness: 0.25 }),
    pedestalLed: new THREE.MeshStandardMaterial({
      color: "#0071dc",
      emissive: "#0284c7",
      emissiveIntensity: 0.55,
    }),
    ceilingSteel: new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0.38, roughness: 0.38 }),
    ceilingCyl: new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0.42, roughness: 0.35 }),
    hvacMetal: new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.48, roughness: 0.28 }),
    hvacCone: new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.45, roughness: 0.32 }),
    ledTube: new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 1.85,
      roughness: 0.12,
    }),
  }), [contactAoTex]);

  const contactAoMatrices = useMemo(() => buildContactAOMatrices(), []);

  const batches = useMemo(() => {
    const floorDecors: ColoredInstance[] = [];
    const groundWalls: ColoredInstance[] = [];
    const groundSolids: ColoredInstance[] = [];
    const pedestalLeds: THREE.Matrix4[] = [];
    const ceilingBoxes: ColoredInstance[] = [];
    const ceilingCyls: ColoredInstance[] = [];
    const hvacRings: THREE.Matrix4[] = [];
    const hvacDiffusers: THREE.Matrix4[] = [];
    const ledTubes: THREE.Matrix4[] = [];

    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const e = new THREE.Euler();

    const makeMat = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0) => {
      e.set(rx, ry, rz);
      q.setFromEuler(e);
      p.set(x, y, z);
      s.set(sx, sy, sz);
      return new THREE.Matrix4().compose(p, q, s);
    };

    const pushColored = (
      arr: ColoredInstance[],
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
      arr.push({
        matrix: makeMat(x, y, z, sx, sy, sz, rx, ry, rz),
        color: new THREE.Color(hex),
      });
    };

    // 0. Sảnh chính, vạch dẫn hướng, cross-aisle & thảm vào cửa
    pushColored(floorDecors, "#f8fafc", 0, 0.002, 0, 4.2, 0.002, 53.6);
    pushColored(floorDecors, "#0071dc", -2.1, 0.003, 0, 0.08, 0.002, 53.6);
    pushColored(floorDecors, "#0071dc", 2.1, 0.003, 0, 0.08, 0.002, 53.6);
    pushColored(floorDecors, "#f1f5f9", 0, 0.0025, 0, 39.6, 0.002, 2.6);
    pushColored(floorDecors, "#0f172a", 0, 0.0035, 24.5, 6.0, 0.002, 3.2);
    pushColored(floorDecors, "#1e293b", 0, 0.0045, 24.5, 5.6, 0.002, 2.8);

    // 1. 12 Cột kết cấu chịu lực + tường bao + cổng an ninh
    for (const col of STORE_COLUMNS) {
      pushColored(groundSolids, "#f8fafc", col.x, 3.0, col.z, 0.5, 6.0, 0.5);
      pushColored(groundSolids, "#0f172a", col.x, 0.09, col.z, 0.56, 0.18, 0.56);
      pushColored(groundSolids, "#facc15", col.x, 1.25, col.z, 0.52, 0.08, 0.52);
      pushColored(groundSolids, "#0071dc", col.x, 2.3, col.z + 0.26, 0.32, 0.22, 0.02);
      pushColored(groundSolids, "#0071dc", col.x, 2.3, col.z - 0.26, 0.32, 0.22, 0.02);
    }

    // 4 thanh khung cửa kính Nam
    for (const fx of [-3.9, -1.3, 1.3, 3.9]) {
      pushColored(groundSolids, "#0f172a", fx, 2.0, 27, 0.08, 4.0, 0.12);
    }

    // Tường bao thạch cao matte (roughness 0.78) tách khỏi nẹp & cột thép
    pushColored(groundWalls, "#f1f5f9", 0, 3.0, -27, 40, 6.0, 0.3);
    pushColored(groundSolids, "#0f172a", 0, 0.1, -26.84, 40, 0.2, 0.04);
    pushColored(groundSolids, "#0052cc", 0, 5.15, -26.82, 39.4, 0.45, 0.06);
    pushColored(groundWalls, "#f1f5f9", -20, 3.0, 0, 0.3, 6.0, 54);
    pushColored(groundSolids, "#0f172a", -19.84, 0.1, 0, 0.04, 0.2, 54);
    pushColored(groundWalls, "#f1f5f9", 20, 3.0, 0, 0.3, 6.0, 54);
    pushColored(groundSolids, "#0f172a", 19.84, 0.1, 0, 0.04, 0.2, 54);
    pushColored(groundWalls, "#f1f5f9", -12, 3.0, 27, 16, 6.0, 0.3);
    pushColored(groundWalls, "#f1f5f9", 12, 3.0, 27, 16, 6.0, 0.3);
    pushColored(groundSolids, "#0071dc", 0, 5.0, 27, 8, 2.0, 0.3);

    // 2 Cổng từ an ninh sảnh Nam
    for (const px of [-1.8, 1.8]) {
      pushColored(groundSolids, "#e2e8f0", px, 0.8, 24.2, 0.08, 1.6, 0.45);
      pedestalLeds.push(makeMat(px, 1.52, 24.2, 0.085, 0.05, 0.46));
    }

    // 2. Hệ dầm vì kèo thép 40m & 180 thanh giằng W-struts + 7 xà gồ sáng màu công nghiệp
    for (const tz of trussZPositions) {
      pushColored(ceilingBoxes, "#cbd5e1", 0, 5.8, tz, 40, 0.08, 0.08);
      pushColored(ceilingBoxes, "#cbd5e1", 0, 5.2, tz, 40, 0.08, 0.08);
      for (let i = 0; i < 20; i++) {
        const midX = -20 + i * 2.0 + 1.0;
        const angle = i % 2 === 0 ? 0.29 : -0.29;
        pushColored(ceilingCyls, "#94a3b8", midX, 5.5, tz, 0.025, 0.65, 0.025, 0, 0, angle);
      }
    }
    for (const px of purlinXPositions) {
      pushColored(ceilingBoxes, "#cbd5e1", px, 5.86, 0, 0.06, 0.06, 54);
    }

    // 3. Hệ thống HVAC mạ kẽm (2 ống gió 52m + vành gia cường + ti treo + miệng tán gió)
    for (const ductX of [-6.0, 6.0]) {
      pushColored(ceilingCyls, "#e2e8f0", ductX, 4.85, 0, 0.325, 52, 0.325, Math.PI / 2, 0, 0);
      for (let fIdx = 0; fIdx < 13; fIdx++) {
        const fz = -24 + fIdx * 4;
        hvacRings.push(makeMat(ductX, 4.85, fz, 1, 1, 1));
      }
      for (const tz of trussZPositions) {
        pushColored(ceilingCyls, "#cbd5e1", ductX, 5.2, tz, 0.01, 0.7, 0.01);
      }
      for (const dz of [-18, -10, -2, 6, 14, 22]) {
        hvacDiffusers.push(makeMat(ductX, 4.53, dz, 1, 1, 1));
      }
    }

    // 4. 8 Dãy đèn tuýp LED đôi thả trần + 40 dây cáp treo
    for (const lx of lightXPositions) {
      pushColored(ceilingBoxes, "#94a3b8", lx, 4.34, 0, 0.2, 0.06, 48);
      ledTubes.push(makeMat(lx, 4.3, 0, 0.16, 0.02, 48));
      for (const sz of [-20, -10, 0, 10, 20]) {
        pushColored(ceilingCyls, "#cbd5e1", lx, 4.75, sz, 0.004, 0.9, 0.004);
      }
    }

    return {
      floorDecorMatrices: floorDecors.map((d) => d.matrix),
      floorDecorColors: floorDecors.map((d) => d.color),
      groundWallMatrices: groundWalls.map((d) => d.matrix),
      groundWallColors: groundWalls.map((d) => d.color),
      groundSolidMatrices: groundSolids.map((d) => d.matrix),
      groundSolidColors: groundSolids.map((d) => d.color),
      pedestalLeds,
      ceilingBoxMatrices: ceilingBoxes.map((d) => d.matrix),
      ceilingBoxColors: ceilingBoxes.map((d) => d.color),
      ceilingCylMatrices: ceilingCyls.map((d) => d.matrix),
      ceilingCylColors: ceilingCyls.map((d) => d.color),
      hvacRings,
      hvacDiffusers,
      ledTubes,
    };
  }, [trussZPositions, purlinXPositions, lightXPositions]);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(floorDecorRef.current, batches.floorDecorMatrices, 0, batches.floorDecorColors);
    applyMatricesToInstancedMesh(contactAoRef.current, contactAoMatrices, 0, undefined, {
      staticTransform: true,
    });
    applyMatricesToInstancedMesh(groundWallsRef.current, batches.groundWallMatrices, 0, batches.groundWallColors, {
      staticTransform: true,
      enableLayer1: true,
    });
    applyMatricesToInstancedMesh(groundSolidRef.current, batches.groundSolidMatrices, 0, batches.groundSolidColors, {
      staticTransform: true,
      enableLayer1: true,
    });
    applyMatricesToInstancedMesh(pedestalLedRef.current, batches.pedestalLeds);
    applyMatricesToInstancedMesh(ceilingBoxRef.current, batches.ceilingBoxMatrices, 0, batches.ceilingBoxColors);
    applyMatricesToInstancedMesh(ceilingCylRef.current, batches.ceilingCylMatrices, 0, batches.ceilingCylColors);
    applyMatricesToInstancedMesh(hvacRingRef.current, batches.hvacRings);
    applyMatricesToInstancedMesh(hvacDiffuserRef.current, batches.hvacDiffusers);
    applyMatricesToInstancedMesh(ledTubeRef.current, batches.ledTubes);
  }, [batches, contactAoMatrices]);

  // LOD Culling cho nhãn C-01..C-12 khi đứng xa > 16m (mặc định visible=true trong JSDOM)
  useCameraLod([
    { ref: colLabelsRef, center: [0, 0, 0], maxDistance: 16 },
  ]);

  return (
    <group userData={{ ignoreProductRaycast: true }}>
      {/* 1. MẶT SÀN TERRAZZO PBR 40m x 54m, VẠCH PHÂN LUỒNG & CONTACT AO TIẾP ĐẤT */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 54]} />
        <meshStandardMaterial
          {...(floorTextures.colorMap.image ? { map: floorTextures.colorMap } : {})}
          {...(floorTextures.roughnessMap.image ? { roughnessMap: floorTextures.roughnessMap } : {})}
          {...(floorTextures.bumpMap.image ? { bumpMap: floorTextures.bumpMap, bumpScale: 0.0035 } : {})}
          color={floorTextures.colorMap.image ? "#ffffff" : "#d8e0ea"}
          roughness={floorTextures.roughnessMap.image ? 1.0 : 0.32}
          metalness={0.02}
        />
      </mesh>
      <instancedMesh ref={floorDecorRef} args={[unitBox, mats.floorDecor, batches.floorDecorMatrices.length]} receiveShadow />
      <instancedMesh
        ref={contactAoRef}
        args={[unitPlane, mats.contactAo, contactAoMatrices.length]}
        renderOrder={1}
        raycast={() => {}}
      />

      {/* Thảm chữ đón tiếp sảnh vào */}
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 24.5]} fontSize={0.28} color="#facc15" anchorX="center" anchorY="middle">
        WELCOME TO SMARTMART 3D HYPERMARKET
      </Text>

      {/* 2. KẾT CẤU SÀN & TƯỜNG BAO (Tường matte + Cột thép satin + Cổng từ + Kính sảnh) */}
      <instancedMesh ref={groundWallsRef} args={[unitBox, mats.groundWall, batches.groundWallMatrices.length]} castShadow receiveShadow />
      <instancedMesh ref={groundSolidRef} args={[unitBox, mats.groundSolid, batches.groundSolidMatrices.length]} castShadow receiveShadow />
      <instancedMesh ref={pedestalLedRef} args={[unitBox, mats.pedestalLed, batches.pedestalLeds.length]} />

      {/* Biển hiệu sảnh Nam & kính cường lực */}
      <group position={[0, 5.0, 26.83]}>
        <Text fontSize={0.48} color="#ffffff" anchorX="center" anchorY="middle">
          SMARTMART 3D HYPERMARKET
        </Text>
        <Text position={[0, -0.4, 0]} fontSize={0.2} color="#facc15" anchorX="center" anchorY="middle">
          ĐẠI SIÊU THỊ KHÔNG GIAN TƯƠNG LAI
        </Text>
      </group>
      <mesh position={[0, 2.0, 27]}>
        <boxGeometry args={[7.8, 4.0, 0.04]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.32} roughness={0.08} metalness={0.2} />
      </mesh>

      {/* Biển mã định vị cột C-01..C-12 */}
      <group ref={colLabelsRef}>
        {STORE_COLUMNS.map((col, idx) => (
          <React.Fragment key={col.id}>
            <Text position={[col.x, 2.3, col.z + 0.275]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
              {`C-${String(idx + 1).padStart(2, "0")}`}
            </Text>
            <Text position={[col.x, 2.3, col.z - 0.275]} rotation={[0, Math.PI, 0]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
              {`C-${String(idx + 1).padStart(2, "0")}`}
            </Text>
          </React.Fragment>
        ))}
      </group>

      {/* 3. HỆ TRẦN, VÌ KÈO, ỐNG HVAC & MÁNG ĐÈN LED (Tự ẩn khi dùng góc nhìn 01-overview) */}
      <group visible={!isOverviewMode}>
        <instancedMesh ref={ceilingBoxRef} args={[unitBox, mats.ceilingSteel, batches.ceilingBoxMatrices.length]} />
        <instancedMesh ref={ceilingCylRef} args={[unitCyl, mats.ceilingCyl, batches.ceilingCylMatrices.length]} />
        <instancedMesh ref={hvacRingRef} args={[hvacTorusGeo, mats.hvacMetal, batches.hvacRings.length]} />
        <instancedMesh ref={hvacDiffuserRef} args={[hvacDiffuserGeo, mats.hvacCone, batches.hvacDiffusers.length]} />
        <instancedMesh ref={ledTubeRef} args={[unitBox, mats.ledTube, batches.ledTubes.length]} />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6.0, 0]}>
          <planeGeometry args={[40, 54]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.12} />
        </mesh>
      </group>
    </group>
  );
};
