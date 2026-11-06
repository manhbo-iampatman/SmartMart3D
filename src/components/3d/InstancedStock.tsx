import React, { useState } from "react";
import { Text } from "@react-three/drei";
import { MOCK_PRODUCTS } from "../../data/mockProducts";
import { Product } from "../../types";
import { useAppStore } from "../../stores/useAppStore";

interface StockGroupProps {
  product: Product;
  basePos: [number, number, number];
  rotationY?: number;
}

const StockGroup: React.FC<StockGroupProps> = ({ product, basePos, rotationY = 0 }) => {
  const { setHoveredProduct, setInspectingProduct } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);

  // Tạo một hàng 4 món đồ xếp cạnh nhau trên kệ
  const count = 4;
  const spacingZ = 0.22;
  const [bx, by, bz] = basePos;
  const [dimW, dimH, dimD] = product.dimensions;

  const handleClick = (e: any) => {
    e.stopPropagation();
    // Mở modal xem 3D chi tiết
    setInspectingProduct(product);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);
    setHoveredProduct(product);
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    setHoveredProduct(null);
  };

  return (
    <group position={[bx, by, bz]} rotation={[0, rotationY, 0]}>
      {Array.from({ length: count }).map((_, idx) => {
        const offsetZ = (idx - (count - 1) / 2) * spacingZ;
        return (
          <mesh
            key={idx}
            position={[0, dimH / 2, offsetZ]}
            castShadow
            receiveShadow
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[dimW, dimH, dimD]} />
            <meshStandardMaterial
              color={product.color}
              roughness={0.25}
              metalness={0.1}
              emissive={isHovered ? "#38bdf8" : "#000000"}
              emissiveIntensity={isHovered ? 0.35 : 0}
            />
          </mesh>
        );
      })}

      {/* Nhãn giá & tên ở mép khay kệ */}
      <group position={[0.25, -0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Text
          fontSize={0.065}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#0071dc"
        >
          {product.price.toLocaleString("vi-VN")} đ
        </Text>
      </group>
    </group>
  );
};

export const InstancedStock: React.FC = () => {
  // Lọc các sản phẩm có vị trí 3D
  const productsWith3D = MOCK_PRODUCTS.filter((p) => p.has3D && p.shelfLocation);

  return (
    <group>
      {productsWith3D.map((product) => {
        const pos = product.shelfLocation!.worldPos;
        // Nếu kệ bên phải (X > 0), xoay mặt hàng hướng ra lối đi (rotationY = Math.PI)
        const rotationY = pos[0] > 0 ? Math.PI : 0;
        return (
          <StockGroup
            key={product.id}
            product={product}
            basePos={pos}
            rotationY={rotationY}
          />
        );
      })}
    </group>
  );
};

