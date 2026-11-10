import React from "react";
import { RoundedBox, Text } from "@react-three/drei";
import { CHECKOUT_LAYOUT, PROMOTION_LAYOUT } from "../../data/storeLayout";
import { SelfCheckoutScanner3D } from "./SelfCheckoutScanner3D";

const DepartmentBanner: React.FC<{
  position: [number, number, number];
  aisleNumber: string;
  title: string;
  subtitle: string;
  color: string;
}> = ({ position, aisleNumber, title, subtitle, color }) => {
  const bannerWidth = 2.2;
  const bannerHeight = 0.58;
  const bannerDepth = 0.08;

  return (
    <group position={position}>
      {/* 2 Dây cáp treo thả từ trần nhà */}
      {[-0.8, 0.8].map((cx, idx) => (
        <mesh key={idx} position={[cx, 0.55, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.8, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Thân biển bo góc kiến trúc hiện đại phong cách Hypermarket */}
      <RoundedBox args={[bannerWidth, bannerHeight, bannerDepth]} radius={0.04} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.1} />
      </RoundedBox>

      {/* Khung viền kim loại bảo vệ mép biển */}
      <mesh>
        <boxGeometry args={[bannerWidth + 0.02, bannerHeight + 0.02, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Mặt 1 (Hướng +Z, nhìn từ lối vào siêu thị) */}
      <group position={[0, 0, bannerDepth / 2 + 0.005]}>
        {/* Khối huy hiệu số lối đi (Aisle Number Badge) */}
        <group position={[-bannerWidth / 2 + 0.36, 0, 0.01]}>
          <RoundedBox args={[0.44, 0.44, 0.02]} radius={0.04} smoothness={4}>
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </RoundedBox>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.24}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {aisleNumber}
          </Text>
        </group>

        {/* Tiêu đề & Phụ đề ngành hàng nằm gọn gàng bên trong khung */}
        <group position={[0.24, 0, 0.01]}>
          <Text
            position={[0, 0.09, 0]}
            fontSize={0.13}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.45}
          >
            {title}
          </Text>
          <Text
            position={[0, -0.1, 0]}
            fontSize={0.078}
            color="#f1f5f9"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.45}
          >
            {subtitle}
          </Text>
        </group>
      </group>

      {/* Mặt 2 (Hướng -Z, nhìn từ phía quầy thu ngân & tủ đông) */}
      <group position={[0, 0, -bannerDepth / 2 - 0.005]} rotation={[0, Math.PI, 0]}>
        <group position={[-bannerWidth / 2 + 0.36, 0, 0.01]}>
          <RoundedBox args={[0.44, 0.44, 0.02]} radius={0.04} smoothness={4}>
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </RoundedBox>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.24}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {aisleNumber}
          </Text>
        </group>

        <group position={[0.24, 0, 0.01]}>
          <Text
            position={[0, 0.09, 0]}
            fontSize={0.13}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.45}
          >
            {title}
          </Text>
          <Text
            position={[0, -0.1, 0]}
            fontSize={0.078}
            color="#f1f5f9"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.45}
          >
            {subtitle}
          </Text>
        </group>
      </group>
    </group>
  );
};

/**
 * Ụ đảo khuyến mãi giữa sảnh (Promotional Island)
 * Lấy cảm hứng từ ụ đảo đỏ/vàng trong video tham chiếu 2026:
 * - Bục tròn nhiều tầng xếp đầy hàng hóa
 * - Cột cờ biển báo "MUA 2 TẶNG 1" và "GIÁ SỐC HÔM NAY"
 */
const PromotionIsland: React.FC = () => (
  <group position={[PROMOTION_LAYOUT.x, 0, PROMOTION_LAYOUT.z]}>
    {/* Tầng đế tròn */}
    <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.96, PROMOTION_LAYOUT.radius, 0.32, 28]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.2} />
    </mesh>

    {/* Tầng 2 màu đỏ khuyến mãi */}
    <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.72, 0.76, 0.24, 24]} />
      <meshStandardMaterial color="#dc2626" roughness={0.25} />
    </mesh>

    {/* Hàng hóa xếp vòng tròn quanh ụ đảo */}
    {Array.from({ length: 12 }).map((_, index) => {
      const angle = (index / 12) * Math.PI * 2;
      return (
        <group
          key={index}
          position={[Math.cos(angle) * 0.62, 0.58, Math.sin(angle) * 0.62]}
          rotation={[0, -angle, 0]}
        >
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.34, 0.14]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#facc15" : "#ff5400"}
              roughness={0.25}
            />
          </mesh>
        </group>
      );
    })}

    {/* Cột inox thanh mảnh đỡ bảng khuyến mãi */}
    <mesh position={[0, 1.3, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 1.7, 16]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
    </mesh>

    {/* Bảng báo ưu đãi MUA 2 TẶNG 1 gọn gàng, nâng cao tầm mắt (y = 2.12m), giữ tầm nhìn thông thoáng */}
    <group position={[0, 2.12, 0]}>
      {/* Khung viền bảo vệ màu đỏ nổi bật */}
      <mesh>
        <boxGeometry args={[0.94, 0.38, 0.03]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>

      {/* Mặt bảng vàng chanh bo góc thanh thoát */}
      <RoundedBox args={[0.90, 0.34, 0.04]} radius={0.03} smoothness={4} castShadow>
        <meshStandardMaterial color="#facc15" roughness={0.2} metalness={0.05} />
      </RoundedBox>

      {/* Mặt trước hướng ra lối vào */}
      <group position={[0, 0, 0.022]}>
        <Text
          position={[0, 0.055, 0]}
          fontSize={0.095}
          color="#b91c1c"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.84}
        >
          MUA 2 TẶNG 1
        </Text>
        <Text
          position={[0, -0.055, 0]}
          fontSize={0.052}
          color="#7f1d1d"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.84}
        >
          Ưu đãi giá sốc tuần này
        </Text>
      </group>

      {/* Mặt sau hướng về quầy thu ngân & tủ đông */}
      <group position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
        <Text
          position={[0, 0.055, 0]}
          fontSize={0.095}
          color="#b91c1c"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.84}
        >
          MUA 2 TẶNG 1
        </Text>
        <Text
          position={[0, -0.055, 0]}
          fontSize={0.052}
          color="#7f1d1d"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.84}
        >
          Ưu đãi giá sốc tuần này
        </Text>
      </group>
    </group>
  </group>
);

/**
 * Dãy tủ đông cửa kính đứng (Glass-Door Freezer Aisles)
 * Đặt dọc tường phía cuối lối đi, mô phỏng chuẩn xác tủ lạnh siêu thị trong video
 */
const FreezerWall: React.FC = () => {
  const freezerUnits = [-3.6, -1.8, 0, 1.8, 3.6];

  return (
    <group position={[0, 0, -6.1]}>
      {freezerUnits.map((fx, idx) => (
        <group key={idx} position={[fx, 1.6, 0]}>
          {/* Thùng tủ lạnh chính */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.65, 3.0, 0.7]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>

          {/* Khoang bên trong phát ánh sáng lạnh */}
          <mesh position={[0, 0, 0.28]}>
            <boxGeometry args={[1.5, 2.75, 0.1]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#38bdf8"
              emissiveIntensity={0.35}
              roughness={0.1}
            />
          </mesh>

          {/* Các tầng kệ trong tủ đông */}
          {[-0.8, -0.2, 0.4, 1.0].map((sy, sIdx) => (
            <mesh key={sIdx} position={[0, sy, 0.28]}>
              <boxGeometry args={[1.48, 0.04, 0.18]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} />
            </mesh>
          ))}

          {/* Cánh cửa kính phản chiếu bóng loáng */}
          <mesh position={[0, 0, 0.36]}>
            <boxGeometry args={[1.56, 2.82, 0.02]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              roughness={0.05}
              transmission={0.9}
              thickness={0.1}
            />
          </mesh>

          {/* Tay nắm cửa kính dạng thanh nhôm dọc */}
          <mesh position={[0.65, 0, 0.4]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Biển "TỦ ĐÔNG LẠNH / FREEZER" trên nóc tủ */}
          <group position={[0, 1.65, 0.15]}>
            <mesh>
              <boxGeometry args={[1.5, 0.24, 0.06]} />
              <meshStandardMaterial color="#0369a1" emissive="#0284c7" emissiveIntensity={0.4} />
            </mesh>
            <Text position={[0, 0, 0.04]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
              TỦ MÁT & ĐỒ LẠNH
            </Text>
          </group>
        </group>
      ))}
    </group>
  );
};

export const StoreFixtures: React.FC = () => (
  <group>
    {/* Biển ngành hàng treo trên cao ở đầu lối vào 4 dãy kệ đại siêu thị */}
    <DepartmentBanner
      position={[-5.4, 3.25, 3.4]}
      aisleNumber="01"
      title="NƯỚC GIẢI KHÁT & BIA"
      subtitle="Coca-Cola · Sting · Bia Saigon"
      color="#1d4ed8"
    />
    <DepartmentBanner
      position={[-2.6, 3.25, 3.4]}
      aisleNumber="02"
      title="SỮA & CÀ PHÊ"
      subtitle="Vinamilk · Cà phê G7 · Milo"
      color="#ea580c"
    />
    <DepartmentBanner
      position={[2.6, 3.25, 3.4]}
      aisleNumber="03"
      title="BÁNH KẸO & MÌ GÓI"
      subtitle="Hảo Hảo · Choco-Pie · Snack Lays"
      color="#7c3aed"
    />
    <DepartmentBanner
      position={[5.4, 3.25, 3.4]}
      aisleNumber="04"
      title="GIA VỊ & NÔNG SẢN"
      subtitle="Dầu Simply · Gạo ST25 · Nước tương"
      color="#059669"
    />

    {/* Ụ đảo khuyến mãi giữa sảnh (đã thu gọn và nâng cao tầm mắt) */}
    <PromotionIsland />

    {/* Dãy tủ đông kính đứng dọc tường sau */}
    <FreezerWall />

    {/* Quầy thu ngân tự động 3D vật lý quét mã & đóng túi (Sprint 3) */}
    <SelfCheckoutScanner3D />
  </group>
);
