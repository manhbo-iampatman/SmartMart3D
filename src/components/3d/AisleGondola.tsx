import React from "react";
import { Text } from "@react-three/drei";

interface ShelfProps {
  position: [number, number, number];
  aisleName: string;
  categoryName: string;
}

const SingleGondola: React.FC<ShelfProps> = ({ position, aisleName, categoryName }) => {
  const shelfLength = 6.4;
  const shelfDepth = 0.8;
  const shelfHeight = 2.4;
  const tierYPositions = [0.55, 1.1, 1.65, 2.2];

  return (
    <group position={position}>
      {/* 1. Tấm lưng kệ (Backing board) */}
      <mesh position={[0, shelfHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, shelfHeight, shelfLength]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>

      {/* 2. Cột trụ 2 đầu */}
      <mesh position={[0, shelfHeight / 2, -shelfLength / 2]} castShadow>
        <boxGeometry args={[shelfDepth + 0.05, shelfHeight, 0.08]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, shelfHeight / 2, shelfLength / 2]} castShadow>
        <boxGeometry args={[shelfDepth + 0.05, shelfHeight, 0.08]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 3. Đế chân kệ */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[shelfDepth + 0.1, 0.2, shelfLength]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* 4. Các tầng giá đỡ (Tiers) */}
      {tierYPositions.map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          {/* Mặt khay để hàng */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[shelfDepth, 0.04, shelfLength - 0.05]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
          </mesh>

          {/* Dải nẹp giá màu xanh SmartMart ở mép trước */}
          <mesh position={[shelfDepth / 2 + 0.01, -0.015, 0]}>
            <boxGeometry args={[0.02, 0.045, shelfLength - 0.05]} />
            <meshStandardMaterial color="#0071dc" roughness={0.3} />
          </mesh>
          <mesh position={[-shelfDepth / 2 - 0.01, -0.015, 0]}>
            <boxGeometry args={[0.02, 0.045, shelfLength - 0.05]} />
            <meshStandardMaterial color="#0071dc" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 5. Biển chỉ dẫn ngành hàng treo trên đầu kệ */}
      <group position={[0, shelfHeight + 0.45, 0]}>
        {/* Tấm biển */}
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.6, 2.6]} />
          <meshStandardMaterial color="#0071dc" roughness={0.2} />
        </mesh>

        {/* Chữ trên biển mặt 1 */}
        <group position={[0.06, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text
            fontSize={0.16}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.1, 0]}
          >
            {aisleName}
          </Text>
          <Text
            fontSize={0.11}
            color="#ffc220"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.12, 0]}
          >
            {categoryName}
          </Text>
        </group>

        {/* Chữ trên biển mặt 2 */}
        <group position={[-0.06, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Text
            fontSize={0.16}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.1, 0]}
          >
            {aisleName}
          </Text>
          <Text
            fontSize={0.11}
            color="#ffc220"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.12, 0]}
          >
            {categoryName}
          </Text>
        </group>
      </group>
    </group>
  );
};

export const AisleGondola: React.FC = () => {
  return (
    <group>
      {/* Dãy kệ bên trái: Sữa, Mì, Nước giải khát */}
      <SingleGondola
        position={[-2.5, 0, 0]}
        aisleName="DÃY 01"
        categoryName="SỮA & ĐỒ UỐNG"
      />

      {/* Dãy kệ bên phải: Bánh kẹo, Gia vị */}
      <SingleGondola
        position={[2.5, 0, 0]}
        aisleName="DÃY 02"
        categoryName="BÁNH KẸO & GIA VỊ"
      />
    </group>
  );
};

