import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { MOCK_PRODUCTS } from "../../data/mockProducts";
import { Product } from "../../types";
import { generateBlockMatrices } from "../../utils/stockMatrices";
import {
  GROCERY_ATLAS_TILES,
  getGroceryTextureAtlas,
  remapGeometryToAtlasTile,
} from "../../utils/textureAtlasGenerator";
import { applyMatricesToInstancedMesh } from "../../utils/instancingHelper";
import { useCameraLod } from "../../utils/lodCulling";

interface ProductBatchConfig {
  product: Product;
  geometry: THREE.BufferGeometry;
  matrices: THREE.Matrix4[];
  priceTagPos: [number, number, number];
}

const SingleProductInstancedMesh: React.FC<{
  config: ProductBatchConfig;
  sharedMaterial: THREE.MeshStandardMaterial;
}> = ({ config, sharedMaterial }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(meshRef.current, config.matrices, 0, undefined, {
      staticTransform: true,
      enableLayer1: true,
    });
  }, [config.matrices]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[config.geometry, sharedMaterial, config.matrices.length]}
      receiveShadow
      userData={{ product: config.product }}
      onClick={(event) => event.stopPropagation()}
    />
  );
};

export const InstancedStock: React.FC = () => {
  const priceTagTextGroupRef = useRef<THREE.Group>(null);
  const pricePlatesRef = useRef<THREE.InstancedMesh>(null);

  // 1 Material & 1 Texture Atlas 2048x2048 duy nhất chia sẻ trên GPU cho cả 8 SKU
  const sharedAtlasMaterial = useMemo(() => {
    const atlas = getGroceryTextureAtlas();
    return new THREE.MeshStandardMaterial({
      ...(atlas.image ? { map: atlas } : {}),
      color: "#ffffff",
      roughness: 0.24,
      metalness: 0.16,
    });
  }, []);

  const configs = useMemo<ProductBatchConfig[]>(() => {
    const list: ProductBatchConfig[] = [];

    const vinamilk = MOCK_PRODUCTS.find((p) => p.id === "prod-milk-vinamilk");
    const haohao = MOCK_PRODUCTS.find((p) => p.id === "prod-noodle-haohao");
    const coca = MOCK_PRODUCTS.find((p) => p.id === "prod-drink-coca");
    const g7 = MOCK_PRODUCTS.find((p) => p.id === "prod-coffee-g7");
    const chocopie = MOCK_PRODUCTS.find((p) => p.id === "prod-snack-chocopie");
    const milo = MOCK_PRODUCTS.find((p) => p.id === "prod-drink-milo");
    const sting = MOCK_PRODUCTS.find((p) => p.id === "prod-drink-sting");
    const simply = MOCK_PRODUCTS.find((p) => p.id === "prod-oil-simply");

    if (vinamilk) {
      list.push({
        product: vinamilk,
        geometry: remapGeometryToAtlasTile(new THREE.BoxGeometry(0.10, 0.26, 0.075), GROCERY_ATLAS_TILES["prod-milk-vinamilk"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: -2.6, zStart: -6.8, zEnd: -5.6, cols: 8, rows: 4, stack: 1, itemH: 0.26, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -13.2, zStart: -18.0, zEnd: -16.8, cols: 6, rows: 3, stack: 1, itemH: 0.26, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -2.6, zStart: -18.0, zEnd: -16.8, cols: 6, rows: 3, stack: 1, itemH: 0.26, isLeft: true }),
        ],
        priceTagPos: [-2.17, 0.95, -6.2],
      });
    }
    if (haohao) {
      list.push({
        product: haohao,
        geometry: remapGeometryToAtlasTile(new THREE.BoxGeometry(0.095, 0.11, 0.055), GROCERY_ATLAS_TILES["prod-noodle-haohao"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: 5.4, zStart: -4.4, zEnd: -3.2, cols: 9, rows: 4, stack: 3, itemH: 0.11, isLeft: false }),
          ...generateBlockMatrices({ gondolaX: -13.2, zStart: -5.6, zEnd: -4.4, cols: 8, rows: 3, stack: 2, itemH: 0.11, isLeft: false }),
          ...generateBlockMatrices({ gondolaX: 5.4, zStart: -16.8, zEnd: -15.6, cols: 8, rows: 3, stack: 2, itemH: 0.11, isLeft: false }),
        ],
        priceTagPos: [4.97, 0.95, -3.8],
      });
    }
    if (coca) {
      list.push({
        product: coca,
        geometry: remapGeometryToAtlasTile(new THREE.CylinderGeometry(0.028, 0.028, 0.13, 14), GROCERY_ATLAS_TILES["prod-drink-coca"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: -5.4, zStart: -4.4, zEnd: -3.2, cols: 14, rows: 5, stack: 2, itemH: 0.13, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -16.6, zStart: 3.2, zEnd: 4.4, cols: 10, rows: 3, stack: 2, itemH: 0.13, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -5.4, zStart: -15.6, zEnd: -14.4, cols: 10, rows: 3, stack: 2, itemH: 0.13, isLeft: true }),
        ],
        priceTagPos: [-4.97, 0.95, -3.8],
      });
    }
    if (g7) {
      list.push({
        product: g7,
        geometry: remapGeometryToAtlasTile(new THREE.BoxGeometry(0.10, 0.2, 0.07), GROCERY_ATLAS_TILES["prod-coffee-g7"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: -2.6, zStart: -5.6, zEnd: -4.4, cols: 8, rows: 4, stack: 2, itemH: 0.2, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -13.2, zStart: 4.4, zEnd: 5.6, cols: 7, rows: 3, stack: 2, itemH: 0.2, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -2.6, zStart: -15.6, zEnd: -14.4, cols: 7, rows: 3, stack: 2, itemH: 0.2, isLeft: true }),
        ],
        priceTagPos: [-2.17, 0.95, -5.0],
      });
    }
    if (chocopie) {
      list.push({
        product: chocopie,
        geometry: remapGeometryToAtlasTile(new THREE.BoxGeometry(0.145, 0.16, 0.075), GROCERY_ATLAS_TILES["prod-snack-chocopie"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: 2.6, zStart: -6.8, zEnd: -5.6, cols: 6, rows: 4, stack: 2, itemH: 0.16, isLeft: false }),
          ...generateBlockMatrices({ gondolaX: -16.6, zStart: -6.8, zEnd: -5.6, cols: 6, rows: 3, stack: 2, itemH: 0.16, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: 2.6, zStart: -18.0, zEnd: -16.8, cols: 6, rows: 3, stack: 2, itemH: 0.16, isLeft: false }),
        ],
        priceTagPos: [2.17, 0.95, -6.2],
      });
    }
    if (milo) {
      list.push({
        product: milo,
        geometry: remapGeometryToAtlasTile(new THREE.BoxGeometry(0.095, 0.13, 0.065), GROCERY_ATLAS_TILES["prod-drink-milo"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: 2.6, zStart: 2.0, zEnd: 3.2, cols: 9, rows: 4, stack: 2, itemH: 0.13, isLeft: false }),
          ...generateBlockMatrices({ gondolaX: -13.2, zStart: -14.4, zEnd: -13.2, cols: 7, rows: 3, stack: 2, itemH: 0.13, isLeft: false }),
          ...generateBlockMatrices({ gondolaX: 2.6, zStart: 4.4, zEnd: 5.6, cols: 7, rows: 3, stack: 2, itemH: 0.13, isLeft: false }),
        ],
        priceTagPos: [2.17, 0.95, 2.6],
      });
    }
    if (sting) {
      list.push({
        product: sting,
        geometry: remapGeometryToAtlasTile(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 14), GROCERY_ATLAS_TILES["prod-drink-sting"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: -5.4, zStart: 2.0, zEnd: 3.2, cols: 14, rows: 5, stack: 2, itemH: 0.16, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -16.6, zStart: -15.6, zEnd: -14.4, cols: 10, rows: 3, stack: 2, itemH: 0.16, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: -5.4, zStart: 4.4, zEnd: 5.6, cols: 10, rows: 3, stack: 2, itemH: 0.16, isLeft: true }),
        ],
        priceTagPos: [-4.97, 0.95, 2.6],
      });
    }
    if (simply) {
      list.push({
        product: simply,
        geometry: remapGeometryToAtlasTile(new THREE.CylinderGeometry(0.038, 0.038, 0.26, 14), GROCERY_ATLAS_TILES["prod-oil-simply"]),
        matrices: [
          ...generateBlockMatrices({ gondolaX: 5.4, zStart: 2.0, zEnd: 3.2, cols: 10, rows: 3, stack: 1, itemH: 0.26, isLeft: false }),
          ...generateBlockMatrices({ gondolaX: -13.2, zStart: 2.0, zEnd: 3.2, cols: 8, rows: 3, stack: 1, itemH: 0.26, isLeft: true }),
          ...generateBlockMatrices({ gondolaX: 5.4, zStart: 4.4, zEnd: 5.6, cols: 8, rows: 3, stack: 1, itemH: 0.26, isLeft: false }),
        ],
        priceTagPos: [4.97, 0.95, 2.6],
      });
    }

    return list;
  }, []);

  // Gom 8 bảng giá xanh mép kệ vào đúng 1 InstancedMesh
  const pricePlateMatrices = useMemo(() => {
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(0.3, 0.045, 0.01);
    const e = new THREE.Euler();
    return configs.map((cfg) => {
      const [px, py, pz] = cfg.priceTagPos;
      e.set(0, px < 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      q.setFromEuler(e);
      p.set(px, py - 0.015, pz);
      return new THREE.Matrix4().compose(p, q, s);
    });
  }, [configs]);

  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const plateMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0071dc", roughness: 0.3 }), []);

  useLayoutEffect(() => {
    applyMatricesToInstancedMesh(pricePlatesRef.current, pricePlateMatrices);
  }, [pricePlateMatrices]);

  // LOD Distance Culling: Ẩn chữ bảng giá nhỏ khi đứng xa cụm kệ (> 18m), giữ nguyên 8 InstancedMesh sản phẩm
  useCameraLod([
    { ref: priceTagTextGroupRef, center: [0, 0, 0], maxDistance: 18 },
    { ref: pricePlatesRef, center: [0, 0, 0], maxDistance: 18 },
  ]);

  return (
    <group>
      {configs.map((config) => (
        <SingleProductInstancedMesh
          key={config.product.id}
          config={config}
          sharedMaterial={sharedAtlasMaterial}
        />
      ))}

      <instancedMesh
        ref={pricePlatesRef}
        args={[unitBox, plateMat, Math.max(1, pricePlateMatrices.length)]}
        userData={{ ignoreProductRaycast: true }}
      />

      <group ref={priceTagTextGroupRef} userData={{ ignoreProductRaycast: true }}>
        {configs.map((cfg) => {
          const [px, py, pz] = cfg.priceTagPos;
          return (
            <group key={cfg.product.id} position={[px, py, pz]} rotation={[0, px < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <Text fontSize={0.038} color="#ffffff" position={[0, -0.015, 0.008]} anchorX="center" anchorY="middle">
                {`${cfg.product.price.toLocaleString("vi-VN")} đ`}
              </Text>
            </group>
          );
        })}
      </group>
    </group>
  );
};
