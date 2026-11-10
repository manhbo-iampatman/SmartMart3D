import { APPAREL_RACKS_CONFIG, APPAREL_TABLES_CONFIG } from "./apparelLayout";
import { CHECKOUT_PHASE5_OBSTACLES } from "./checkoutLayout";
import { PRODUCE_TABLES_CONFIG } from "./produceLayout";

export interface FloorPoint { x: number; z: number }
export type FloorObstacle =
  | { id: string; kind: "rect"; x: number; z: number; width: number; depth: number }
  | { id: string; kind: "circle"; x: number; z: number; radius: number };

export interface NavigationLayout {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  cellSize: number;
  playerRadius: number;
  obstacles: readonly FloorObstacle[];
}

export const SHELF_LAYOUT = {
  length: 4.8,
  depth: 0.85,
  height: 2.45,
  xPositions: [-5.4, -2.6, 2.6, 5.4] as readonly number[],
  southCenterZ: 4.4,
  northCenterZ: -4.4,
  farNorthCenterZ: -15.6,
};

// Hệ thống kệ mở rộng cánh Tây + dãy Bắc (Phase 7 - bước lối đi đều >= 1.80m, né trọn 12 cột ±10m)
export const EXTENDED_AISLE_LAYOUT = {
  xPositions: [-16.6, -13.2] as readonly number[],
  blockLength: 4.8,
  northCenterZ: -4.4,
  southCenterZ: 4.4,
  farNorthCenterZ: -15.6,
  crossAisleGap: 2.9,
};

// Khu Tường Bắc (Dairy & Frozen + Bakery & Deli) & Đảo Mùa Vụ thấp tầng
export const NORTH_PERIMETER_LAYOUT = {
  freezerWall: {
    x: -10.3,
    z: -26.2,
    width: 14.3,
    depth: 0.9,
    cabinetPositionsX: [-16.6, -14.8, -13.0, -11.2, -9.4, -7.6, -5.8, -4.0] as readonly number[],
  },
  bakeryWall: {
    x: 9.8,
    z: -26.1,
    width: 13.4,
    depth: 1.25,
    counterPositionsX: [4.8, 9.8, 14.8] as readonly number[],
  },
  bakeryIslands: [
    { id: "bakery-island-01", x: 7.4, z: -22.2, width: 1.9, depth: 1.1 },
    { id: "bakery-island-02", x: 13.4, z: -22.2, width: 2.0, depth: 1.1 },
  ] as const,
};

export const SEASONAL_PROMO_BAYS = [
  { id: "promo-bay-nw", label: "Ưu Đãi Mùa Vụ", x: -10.0, z: -15.6, width: 1.4, depth: 2.6 },
  { id: "promo-bay-se", label: "Khuyến Mãi Sảnh Nam", x: 16.5, z: 19.5, width: 2.4, depth: 1.4 },
] as const;

// Cổng lối vào khu kệ hàng từ Cross-Aisle & Sảnh đón tiếp chính
export const ENTRANCE: FloorPoint = { x: 0, z: 4.5 };
export const MAIN_CONCOURSE_ENTRANCE: FloorPoint = { x: 0, z: 22 };

// 12 Cột kết cấu chịu lực định vị chuẩn xác dọc trục siêu thị (2 hàng tại X = ±10m)
export const STORE_COLUMNS: readonly { id: string; x: number; z: number }[] = [
  // Cột phía Tây (X = -10m)
  { id: "col-w1", x: -10, z: -20 },
  { id: "col-w2", x: -10, z: -12 },
  { id: "col-w3", x: -10, z: -4 },
  { id: "col-w4", x: -10, z: 4 },
  { id: "col-w5", x: -10, z: 12 },
  { id: "col-w6", x: -10, z: 20 },
  // Cột phía Đông (X = +10m)
  { id: "col-e1", x: 10, z: -20 },
  { id: "col-e2", x: 10, z: -12 },
  { id: "col-e3", x: 10, z: -4 },
  { id: "col-e4", x: 10, z: 4 },
  { id: "col-e5", x: 10, z: 12 },
  { id: "col-e6", x: 10, z: 20 },
];

const ALL_GONDOLA_X = [...EXTENDED_AISLE_LAYOUT.xPositions, ...SHELF_LAYOUT.xPositions];
const GONDOLA_Z_TIERS = [
  { key: "south", z: SHELF_LAYOUT.southCenterZ },
  { key: "north", z: SHELF_LAYOUT.northCenterZ },
  { key: "farnorth", z: SHELF_LAYOUT.farNorthCenterZ },
];

// Mặt bằng đại siêu thị 40m x 54m (Phase 7 - 0 khe hẹp < 1.80m, thông trục Chính & Cross-Aisle)
export const STORE_LAYOUT: NavigationLayout = {
  minX: -20, maxX: 20, minZ: -27, maxZ: 27,
  cellSize: 0.35, playerRadius: 0.22,
  obstacles: [
    // 18 Block kệ Tạp hóa (6 trục X x 3 tầng Z, đã cộng chiều sâu endcaps 1.1m)
    ...ALL_GONDOLA_X.flatMap((x, xIdx) =>
      GONDOLA_Z_TIERS.map((tier): FloorObstacle => ({
        id: `shelf-${tier.key}-${xIdx}`,
        kind: "rect",
        x,
        z: tier.z,
        width: SHELF_LAYOUT.depth + 0.08,
        depth: SHELF_LAYOUT.length + 1.1,
      }))
    ),
    // Phân khu Tường Bắc: Tủ Đông & Sữa Mát, Quầy Bakery & Deli, 2 Đảo Bánh Mì
    {
      id: "freezer-wall-north",
      kind: "rect",
      x: NORTH_PERIMETER_LAYOUT.freezerWall.x,
      z: NORTH_PERIMETER_LAYOUT.freezerWall.z,
      width: NORTH_PERIMETER_LAYOUT.freezerWall.width,
      depth: NORTH_PERIMETER_LAYOUT.freezerWall.depth,
    },
    {
      id: "bakery-wall-north",
      kind: "rect",
      x: NORTH_PERIMETER_LAYOUT.bakeryWall.x,
      z: NORTH_PERIMETER_LAYOUT.bakeryWall.z,
      width: NORTH_PERIMETER_LAYOUT.bakeryWall.width,
      depth: NORTH_PERIMETER_LAYOUT.bakeryWall.depth,
    },
    ...NORTH_PERIMETER_LAYOUT.bakeryIslands.map((island): FloorObstacle => ({
      id: island.id,
      kind: "rect",
      x: island.x,
      z: island.z,
      width: island.width + 0.08,
      depth: island.depth + 0.08,
    })),
    // 2 Đảo Khuyến Mãi Mùa Vụ thấp tầng
    ...SEASONAL_PROMO_BAYS.map((bay): FloorObstacle => ({
      id: bay.id,
      kind: "rect",
      x: bay.x,
      z: bay.z,
      width: bay.width + 0.08,
      depth: bay.depth + 0.08,
    })),
    // 6 Bàn rau củ tươi sống phân khu nông sản (width 1.90m, lùi X = 8.72 / 14.4 tránh khe < 1.80m & cột +10m)
    ...PRODUCE_TABLES_CONFIG.map((table): FloorObstacle => ({
      id: table.id,
      kind: "rect",
      x: table.position[0],
      z: table.position[2],
      width: table.width + 0.08,
      depth: table.depth + 0.08,
    })),
    // 4 Giá treo quần áo & 4 Bàn phụ kiện khu Thời trang
    ...APPAREL_RACKS_CONFIG.map((rack): FloorObstacle => ({
      id: rack.id,
      kind: "rect",
      x: rack.position[0],
      z: rack.position[2],
      width: rack.width + 0.08,
      depth: rack.depth + 0.08,
    })),
    ...APPAREL_TABLES_CONFIG.map((table): FloorObstacle => ({
      id: table.id,
      kind: "rect",
      x: table.position[0],
      z: table.position[2],
      width: table.width + 0.08,
      depth: table.depth + 0.08,
    })),
    ...CHECKOUT_PHASE5_OBSTACLES,
    ...STORE_COLUMNS.map((col): FloorObstacle => ({
      id: col.id, kind: "rect", x: col.x, z: col.z, width: 0.55, depth: 0.55,
    })),
  ],
};
