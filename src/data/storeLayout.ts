import { APPAREL_RACKS_CONFIG, APPAREL_TABLES_CONFIG } from "./apparelLayout";
import { CHECKOUT_PHASE5_OBSTACLES } from "./checkoutLayout";

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
  length: 7.2,
  depth: 0.85,
  height: 2.45,
  xPositions: [-5.4, -2.6, 2.6, 5.4],
};

// Hệ thống kệ mở rộng phía Tây kèm lối cắt ngang (Cross-Aisle) rộng 2.4m (Phase 2)
export const EXTENDED_AISLE_LAYOUT = {
  xPositions: [-14.0, -7.0],
  blockLength: 6.0,
  northCenterZ: -4.2,
  southCenterZ: 4.2,
  crossAisleGap: 2.4,
};

export const PROMOTION_LAYOUT = { x: 0, z: 0.15, radius: 1.02 };
export const CHECKOUT_LAYOUT = { x: 0, z: -4.7, width: 2.2, depth: 1.3 };
// Cổng lối vào khu kệ hàng đại siêu thị
export const ENTRANCE: FloorPoint = { x: 0, z: 4.5 };
// Sảnh đón tiếp chính của đại siêu thị quy mô 40m x 54m (Phase 1)
export const MAIN_CONCOURSE_ENTRANCE: FloorPoint = { x: 0, z: 22 };

// 12 Cột kết cấu chịu lực định vị chuẩn xác dọc trục siêu thị (2 hàng tại X = +-10m)
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

// Mặt bằng đại siêu thị 40m x 54m tiêu chuẩn quốc tế
export const STORE_LAYOUT: NavigationLayout = {
  minX: -20, maxX: 20, minZ: -27, maxZ: 27,
  cellSize: 0.35, playerRadius: 0.22,
  obstacles: [
    ...SHELF_LAYOUT.xPositions.map((x, index): FloorObstacle => ({
      id: `shelf-${index}`, kind: "rect", x, z: 0,
      width: SHELF_LAYOUT.depth + 0.08, depth: SHELF_LAYOUT.length + 1.5,
    })),
    ...EXTENDED_AISLE_LAYOUT.xPositions.flatMap((x, idx) => [
      {
        id: `ext-shelf-north-${idx}`,
        kind: "rect" as const,
        x,
        z: EXTENDED_AISLE_LAYOUT.northCenterZ,
        width: SHELF_LAYOUT.depth + 0.08,
        depth: EXTENDED_AISLE_LAYOUT.blockLength + 0.6,
      },
      {
        id: `ext-shelf-south-${idx}`,
        kind: "rect" as const,
        x,
        z: EXTENDED_AISLE_LAYOUT.southCenterZ,
        width: SHELF_LAYOUT.depth + 0.08,
        depth: EXTENDED_AISLE_LAYOUT.blockLength + 0.6,
      },
    ]),
    { id: "promotion", kind: "circle", ...PROMOTION_LAYOUT },
    { id: "checkout", kind: "rect", ...CHECKOUT_LAYOUT },
    // 6 Bàn rau củ tươi sống phân khu nông sản (Phase 3)
    { id: "produce-01", kind: "rect", x: 8.0, z: -14.0, width: 2.3, depth: 1.3 },
    { id: "produce-02", kind: "rect", x: 13.5, z: -14.0, width: 2.3, depth: 1.3 },
    { id: "produce-03", kind: "rect", x: 8.0, z: -8.0, width: 2.3, depth: 1.3 },
    { id: "produce-04", kind: "rect", x: 13.5, z: -8.0, width: 2.3, depth: 1.3 },
    { id: "produce-05", kind: "rect", x: 8.0, z: -2.0, width: 2.3, depth: 1.3 },
    { id: "produce-06", kind: "rect", x: 13.5, z: -2.0, width: 2.3, depth: 1.3 },
    // 4 Giá treo quần áo & 4 Bàn phụ kiện khu Thời trang (Phase 4)
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
