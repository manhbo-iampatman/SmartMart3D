import React from "react";
import { Text } from "@react-three/drei";
import { SHELF_LAYOUT } from "../../data/storeLayout";

interface SingleGondolaProps {
  position: [number, number, number];
  aisleName: string;
  categoryName: string;
  rotationY?: number;
}

const SingleGondola: React.FC<SingleGondolaProps> = ({
  position,
  aisleName,
  categoryName,
  rotationY = 0,
}) => {
  const { length: shelfLength, depth: shelfDepth, height: shelfHeight } = SHELF_LAYOUT;
  const tierYPositions = [0.45, 0.95, 1.45, 1.95];
  // 5 vách ngăn đứng phân chia chính xác 6 ô kệ chuẩn 1.2m (từ -3.6m đến +3.6m), đồng bộ 100% với các cụm hàng hóa
  const bayDividers = [-2.4, -1.2, 0.0, 1.2, 2.4];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 1. Tấm lưng kệ chính (Backing pegboard) */}
      <mesh position={[0, shelfHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, shelfHeight, shelfLength]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* 2. Cột trụ 2 đầu & các vách ngăn đứng (Bay dividers) */}
      {[-shelfLength / 2, ...bayDividers, shelfLength / 2].map((z, idx) => (
        <mesh key={idx} position={[0, shelfHeight / 2, z]} castShadow>
          <boxGeometry args={[shelfDepth + 0.04, shelfHeight, 0.05]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* 3. Đế chân kệ chịu lực (Base kickplate) */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[shelfDepth + 0.08, 0.2, shelfLength]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* 4. Các tầng giá đỡ (Khay kệ chịu tải 4 tầng) */}
      {tierYPositions.map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          {/* Mặt khay để hàng kim loại sơn tĩnh điện trắng */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[shelfDepth, 0.035, shelfLength - 0.04]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.15} />
          </mesh>

          {/* Dải nẹp rãnh cài bảng giá màu xanh SmartMart ở cả 2 mép trước sau */}
          <mesh position={[shelfDepth / 2 + 0.01, -0.015, 0]}>
            <boxGeometry args={[0.02, 0.045, shelfLength - 0.04]} />
            <meshStandardMaterial color="#0071dc" roughness={0.3} />
          </mesh>
          <mesh position={[-shelfDepth / 2 - 0.01, -0.015, 0]}>
            <boxGeometry args={[0.02, 0.045, shelfLength - 0.04]} />
            <meshStandardMaterial color="#0071dc" roughness={0.3} />
          </mesh>

          {/* Dải đèn LED hắt sáng gầm kệ (Shelf Underglow) */}
          <mesh position={[shelfDepth / 2 - 0.04, -0.02, 0]}>
            <boxGeometry args={[0.02, 0.01, shelfLength - 0.1]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#f8fafc"
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh position={[-shelfDepth / 2 + 0.04, -0.02, 0]}>
            <boxGeometry args={[0.02, 0.01, shelfLength - 0.1]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#f8fafc"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* 5. Kệ đầu hồi (Endcap Display) ở 2 đầu dãy kệ */}
      {[-shelfLength / 2 - 0.35, shelfLength / 2 + 0.35].map((zPos, endIdx) => (
        <group
          key={endIdx}
          position={[0, 0, zPos]}
          rotation={[0, endIdx === 0 ? Math.PI : 0, 0]}
        >
          {/* Khung kệ đầu hồi */}
          <mesh position={[0, shelfHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[shelfDepth, shelfHeight, 0.1]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
          </mesh>

          {/* Các tầng đầu hồi */}
          {tierYPositions.map((y, tIdx) => (
            <mesh key={tIdx} position={[0, y, 0.2]} castShadow receiveShadow>
              <boxGeometry args={[shelfDepth - 0.05, 0.035, 0.4]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

export const AisleGondola: React.FC = () => {
  const departmentNames = [
    { aisle: "DÃY 01", category: "NƯỚC GIẢI KHÁT & BIA" },
    { aisle: "DÃY 02", category: "SỮA & CÀ PHÊ" },
    { aisle: "DÃY 03", category: "BÁNH KẸO & MÌ GÓI" },
    { aisle: "DÃY 04", category: "GIA VỊ & NÔNG SẢN" },
  ];

  return (
    <group>
      {SHELF_LAYOUT.xPositions.map((x, idx) => (
        <SingleGondola
          key={idx}
          position={[x, 0, 0]}
          aisleName={departmentNames[idx]?.aisle || `DÃY 0${idx + 1}`}
          categoryName={departmentNames[idx]?.category || "HÀNG TIÊU DÙNG"}
        />
      ))}
    </group>
  );
};
