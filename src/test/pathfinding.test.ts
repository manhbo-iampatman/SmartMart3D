import { describe, expect, it } from "vitest";
import { ENTRANCE, PROMOTION_LAYOUT, STORE_LAYOUT, type NavigationLayout } from "../data/storeLayout";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { findPath, floorDistance, getShelfApproach, isWalkable, isWalkableSegment, moveWithCollisions, pathLength } from "../utils/pathfinding";

describe("A* và mặt bằng đi lại", () => {
  it("giữ đường thẳng ngắn nhất khi không có vật cản", () => {
    const start = { x: 0, z: 4.5 };
    const goal = { x: 1, z: 3 };
    const path = findPath(start, goal)!;
    expect(path).toEqual([start, goal]);
    expect(pathLength(path)).toBeCloseTo(floorDistance(start, goal));
  });

  it("đi vòng đảo khuyến mãi, mọi đoạn đường đều đủ khoảng trống cho người chơi", () => {
    const goal = { x: 0, z: -3.5 };
    expect(isWalkableSegment(ENTRANCE, goal)).toBe(false);
    const path = findPath(ENTRANCE, goal)!;
    expect(path.length).toBeGreaterThan(2);
    expect(path[0]).toEqual(ENTRANCE);
    expect(path[path.length - 1]).toEqual(goal);
    path.slice(1).forEach((point, index) => expect(isWalkableSegment(path[index], point)).toBe(true));
    expect(pathLength(path)).toBeGreaterThan(floorDistance(ENTRANCE, goal));
  });

  it.each(MOCK_PRODUCTS.filter((product) => product.has3D))("tới được kệ $id và không đặt camera trong đảo/kệ", (product) => {
    const target = getShelfApproach(product.shelfLocation!.worldPos)!;
    expect(target).not.toBeNull();
    expect(isWalkable(target)).toBe(true);
    const path = findPath(ENTRANCE, target)!;
    expect(path).not.toBeNull();
    path.slice(1).forEach((point, index) => expect(isWalkableSegment(path[index], point)).toBe(true));
    expect(floorDistance(target, { x: product.shelfLocation!.worldPos[0], z: product.shelfLocation!.worldPos[2] })).toBeLessThan(2.5);
  });

  it("đi vòng đầu kệ để sang lối ngoài, không xuyên ngang kệ", () => {
    const path = findPath(ENTRANCE, { x: 4, z: 0 })!;
    expect(path).not.toBeNull();
    expect(path.some((point) => Math.abs(point.z) > 4.5)).toBe(true);
    path.slice(1).forEach((point, index) => expect(isWalkableSegment(path[index], point)).toBe(true));
  });

  it("không báo đường thành công khi điểm đích nằm trong vật cản hoặc ngoài sàn", () => {
    expect(findPath(ENTRANCE, PROMOTION_LAYOUT)).toBeNull();
    expect(findPath(ENTRANCE, { x: 100, z: 0 })).toBeNull();
    expect(findPath({ x: NaN, z: 0 }, ENTRANCE)).toBeNull();
  });

  it("không cắt chéo qua góc của hai vật cản sát nhau", () => {
    const layout: NavigationLayout = {
      minX: -1, maxX: 3, minZ: -1, maxZ: 3, cellSize: 1, playerRadius: 0,
      obstacles: [
        { id: "east", kind: "rect", x: 1, z: 0, width: 1, depth: 1 },
        { id: "north", kind: "rect", x: 0, z: 1, width: 1, depth: 1 },
      ],
    };
    const path = findPath({ x: 0, z: 0 }, { x: 1, z: 1 }, layout)!;
    expect(path).not.toBeNull();
    path.slice(1).forEach((point, index) => expect(isWalkableSegment(path[index], point, layout)).toBe(true));
    expect(pathLength(path)).toBeGreaterThan(Math.SQRT2);
  });

  it("trả về null nếu vật cản ngăn kín hai vùng", () => {
    const layout: NavigationLayout = {
      ...STORE_LAYOUT, minX: -2, maxX: 2, minZ: -2, maxZ: 2,
      obstacles: [{ id: "wall", kind: "rect", x: 0, z: 0, width: 0.2, depth: 8 }],
    };
    expect(findPath({ x: -1, z: 0 }, { x: 1, z: 0 }, layout)).toBeNull();
  });

  it("ngăn đi xuyên kệ ngay cả khi điểm cuối bước đi nằm ở phía bên kia", () => {
    const from = { x: -1.5, z: -2 };
    const to = { x: -4, z: -2 };
    expect(isWalkable(from)).toBe(true);
    expect(isWalkable(to)).toBe(true);
    expect(isWalkableSegment(from, to)).toBe(false);
    expect(moveWithCollisions(from, to)).toEqual(from);
  });
});
