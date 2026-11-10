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
export const PROMOTION_LAYOUT = { x: 0, z: 0.15, radius: 1.02 };
export const CHECKOUT_LAYOUT = { x: 0, z: -4.7, width: 2.2, depth: 1.3 };
export const ENTRANCE: FloorPoint = { x: 0, z: 4.5 };

// Mặt bằng đại siêu thị 4 dãy kệ (Aisles 01, 02, 03, 04)
export const STORE_LAYOUT: NavigationLayout = {
  minX: -8.5, maxX: 8.5, minZ: -6.5, maxZ: 6.5,
  cellSize: 0.2, playerRadius: 0.22,
  obstacles: [
    ...SHELF_LAYOUT.xPositions.map((x, index): FloorObstacle => ({
      id: `shelf-${index}`, kind: "rect", x, z: 0,
      width: SHELF_LAYOUT.depth + 0.08, depth: SHELF_LAYOUT.length + 1.5,
    })),
    { id: "promotion", kind: "circle", ...PROMOTION_LAYOUT },
    { id: "checkout", kind: "rect", ...CHECKOUT_LAYOUT },
  ],
};
