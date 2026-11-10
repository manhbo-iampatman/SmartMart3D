import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { MOCK_PRODUCTS } from "../../data/mockProducts";
import { Product } from "../../types";
import {
  getVinamilkTexture,
  getHaoHaoTexture,
  getCocaColaTexture,
  getG7Texture,
  getChocoPieTexture,
  getMiloTexture,
  getStingTexture,
  getSimplyTexture,
} from "../../utils/textureGenerator";
import { generateBlockMatrices } from "../../utils/stockMatrices";

interface ProductBatchConfig {
  product: Product;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
  priceTagPos: [number, number, number];
}

/**
 * Component render 1 cụm InstancedMesh cho 1 loại sản phẩm
 */
const SingleProductInstancedMesh: React.FC<{
  config: ProductBatchConfig;
}> = ({ config }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    config.matrices.forEach((mat, idx) => {
      meshRef.current!.setMatrixAt(idx, mat);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [config.matrices]);

  const [px, py, pz] = config.priceTagPos;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[config.geometry, config.material, config.matrices.length]}
        castShadow
        receiveShadow
        userData={{ product: config.product }}
        onClick={(event) => event.stopPropagation()}
      />

      {/* Bảng giá cài ở mép khay kệ */}
      <group position={[px, py, pz]} rotation={[0, px < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <mesh position={[0, -0.015, 0]}>
          <boxGeometry args={[0.3, 0.045, 0.01]} />
          <meshStandardMaterial color="#0071dc" roughness={0.3} />
        </mesh>
        <Text
          fontSize={0.038}
          color="#ffffff"
          position={[0, -0.015, 0.008]}
          anchorX="center"
          anchorY="middle"
        >
          {`${config.product.price.toLocaleString("vi-VN")} đ`}
        </Text>
      </group>
    </group>
  );
};

export const InstancedStock: React.FC = () => {
  const configs = useMemo<ProductBatchConfig[]>(() => {
    const list: ProductBatchConfig[] = [];

    // Lấy 8 sản phẩm 3D tiêu biểu
    const vinamilk = MOCK_PRODUCTS.find((p) => p.id === "prod-milk-vinamilk")!;
    const haohao = MOCK_PRODUCTS.find((p) => p.id === "prod-noodle-haohao")!;
    const coca = MOCK_PRODUCTS.find((p) => p.id === "prod-drink-coca")!;
    const g7 = MOCK_PRODUCTS.find((p) => p.id === "prod-coffee-g7")!;
    const chocopie = MOCK_PRODUCTS.find((p) => p.id === "prod-snack-chocopie")!;
    const milo = MOCK_PRODUCTS.find((p) => p.id === "prod-drink-milo")!;
    const sting = MOCK_PRODUCTS.find((p) => p.id === "prod-drink-sting")!;
    const simply = MOCK_PRODUCTS.find((p) => p.id === "prod-oil-simply")!;

    // 1. Sữa tươi Vinamilk 1L (Dãy 02, Gian 1: Z từ -2.4 đến -1.2)
    // 8 cột Z x 4 hàng sâu x 1 tầng cao x 4 tầng kệ = 128 hộp
    if (vinamilk) {
      const geo = new THREE.BoxGeometry(0.10, 0.26, 0.075);
      const mat = new THREE.MeshStandardMaterial({
        map: getVinamilkTexture(),
        roughness: 0.25,
        metalness: 0.05,
      });
      const matrices = generateBlockMatrices({
        gondolaX: -2.6,
        zStart: -2.4,
        zEnd: -1.2,
        cols: 8,
        rows: 4,
        stack: 1,
        itemH: 0.26,
        isLeft: true,
      });
      list.push({
        product: vinamilk,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [-2.17, 0.95, -1.8],
      });
    }

    // 2. Mì Hảo Hảo tôm chua cay (Dãy 04, Gian 2: Z từ -1.2 đến 0.0)
    // 9 cột Z x 4 hàng sâu x 3 gói xếp chồng x 4 tầng kệ = 432 gói
    if (haohao) {
      const geo = new THREE.BoxGeometry(0.095, 0.11, 0.055);
      const mat = new THREE.MeshStandardMaterial({
        map: getHaoHaoTexture(),
        roughness: 0.35,
        metalness: 0.05,
      });
      const matrices = generateBlockMatrices({
        gondolaX: 5.4,
        zStart: -1.2,
        zEnd: 0.0,
        cols: 9,
        rows: 4,
        stack: 3,
        itemH: 0.11,
        isLeft: false,
      });
      list.push({
        product: haohao,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [4.97, 0.95, -0.6],
      });
    }

    // 3. Nước ngọt Coca-Cola lon (Dãy 01, Gian 2: Z từ -1.2 đến 0.0)
    // 14 lon Z x 5 hàng sâu x 2 lon xếp chồng x 4 tầng kệ = 560 lon
    if (coca) {
      const geo = new THREE.CylinderGeometry(0.028, 0.028, 0.13, 16);
      const mat = new THREE.MeshStandardMaterial({
        map: getCocaColaTexture(),
        roughness: 0.15,
        metalness: 0.7,
      });
      const matrices = generateBlockMatrices({
        gondolaX: -5.4,
        zStart: -1.2,
        zEnd: 0.0,
        cols: 14,
        rows: 5,
        stack: 2,
        itemH: 0.13,
        isLeft: true,
      });
      list.push({
        product: coca,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [-4.97, 0.95, -0.6],
      });
    }

    // 4. Cà phê G7 Trung Nguyên (Dãy 02, Gian 4: Z từ 1.2 đến 2.4)
    // 8 cột Z x 4 hàng sâu x 2 hộp xếp chồng x 4 tầng kệ = 256 hộp
    if (g7) {
      const geo = new THREE.BoxGeometry(0.10, 0.2, 0.07);
      const mat = new THREE.MeshStandardMaterial({
        map: getG7Texture(),
        roughness: 0.25,
        metalness: 0.1,
      });
      const matrices = generateBlockMatrices({
        gondolaX: -2.6,
        zStart: 1.2,
        zEnd: 2.4,
        cols: 8,
        rows: 4,
        stack: 2,
        itemH: 0.2,
        isLeft: true,
      });
      list.push({
        product: g7,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [-2.17, 0.95, 1.8],
      });
    }

    // 5. Bánh Choco-Pie Orion (Dãy 03, Gian 1: Z từ -2.4 đến -1.2)
    // 6 cột Z x 4 hàng sâu x 2 hộp chồng x 4 tầng kệ = 192 hộp
    if (chocopie) {
      const geo = new THREE.BoxGeometry(0.145, 0.16, 0.075);
      const mat = new THREE.MeshStandardMaterial({
        map: getChocoPieTexture(),
        roughness: 0.3,
        metalness: 0.05,
      });
      const matrices = generateBlockMatrices({
        gondolaX: 2.6,
        zStart: -2.4,
        zEnd: -1.2,
        cols: 6,
        rows: 4,
        stack: 2,
        itemH: 0.16,
        isLeft: false,
      });
      list.push({
        product: chocopie,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [2.17, 0.95, -1.8],
      });
    }

    // 6. Thức uống lúa mạch Milo (Dãy 03, Gian 2: Z từ -1.2 đến 0.0)
    // 9 cột Z x 4 hàng sâu x 2 lốc chồng x 4 tầng kệ = 288 lốc
    if (milo) {
      const geo = new THREE.BoxGeometry(0.095, 0.13, 0.065);
      const mat = new THREE.MeshStandardMaterial({
        map: getMiloTexture(),
        roughness: 0.25,
        metalness: 0.05,
      });
      const matrices = generateBlockMatrices({
        gondolaX: 2.6,
        zStart: -1.2,
        zEnd: 0.0,
        cols: 9,
        rows: 4,
        stack: 2,
        itemH: 0.13,
        isLeft: false,
      });
      list.push({
        product: milo,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [2.17, 0.95, -0.6],
      });
    }

    // 7. Nước tăng lực Sting Dâu (Dãy 01, Gian 3: Z từ 0.0 đến 1.2)
    // 14 lon Z x 5 hàng sâu x 2 lon chồng x 4 tầng kệ = 560 lon
    if (sting) {
      const geo = new THREE.CylinderGeometry(0.028, 0.028, 0.16, 16);
      const mat = new THREE.MeshStandardMaterial({
        map: getStingTexture(),
        roughness: 0.2,
        metalness: 0.6,
      });
      const matrices = generateBlockMatrices({
        gondolaX: -5.4,
        zStart: 0.0,
        zEnd: 1.2,
        cols: 14,
        rows: 5,
        stack: 2,
        itemH: 0.16,
        isLeft: true,
      });
      list.push({
        product: sting,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [-4.97, 0.95, 0.6],
      });
    }

    // 8. Dầu đậu nành Simply (Dãy 04, Gian 4: Z từ 1.2 đến 2.4)
    // 10 chai Z x 3 hàng sâu x 1 tầng cao x 4 tầng kệ = 120 chai
    if (simply) {
      const geo = new THREE.CylinderGeometry(0.038, 0.038, 0.26, 16);
      const mat = new THREE.MeshStandardMaterial({
        map: getSimplyTexture(),
        roughness: 0.15,
        metalness: 0.2,
      });
      const matrices = generateBlockMatrices({
        gondolaX: 5.4,
        zStart: 1.2,
        zEnd: 2.4,
        cols: 10,
        rows: 3,
        stack: 1,
        itemH: 0.26,
        isLeft: false,
      });
      list.push({
        product: simply,
        geometry: geo,
        material: mat,
        matrices,
        priceTagPos: [4.97, 0.95, 1.8],
      });
    }

    return list;
  }, []);

  return (
    <group>
      {configs.map((config) => (
        <SingleProductInstancedMesh key={config.product.id} config={config} />
      ))}
    </group>
  );
};
