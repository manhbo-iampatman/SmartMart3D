import { describe, expect, it } from "vitest";
import { ENTRANCE, MAIN_CONCOURSE_ENTRANCE, PROMOTION_LAYOUT, STORE_LAYOUT, type NavigationLayout } from "../data/storeLayout";
import { ALL_PRODUCTS } from "../data/catalog";
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

  it.each(ALL_PRODUCTS.filter((product) => product.has3D))("tới được kệ/quầy $id (Tạp hóa, Nông sản, Thời trang) và không đặt camera trong vật cản", (product) => {
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

  it("ngăn đi xuyên qua giá treo quần áo và bàn phụ kiện ở khu Thời trang (Phase 4)", () => {
    const northOfRack = { x: 8.0, z: 1.4 };
    const southOfRack = { x: 8.0, z: 3.4 };
    expect(isWalkable(northOfRack)).toBe(true);
    expect(isWalkable(southOfRack)).toBe(true);
    expect(isWalkableSegment(northOfRack, southOfRack)).toBe(false);
    expect(moveWithCollisions(northOfRack, southOfRack)).toEqual(northOfRack);
  });

  it("ngăn đi xuyên Dãy Kiosk Sảnh Nam và Chuồng Xe Đẩy (Phase 5) và tìm đường vòng hợp lệ", () => {
    // Tâm cánh Kiosk Tây (-7.75, 17.0) và CartCorral (-15.5, 21.5) không đi vào được
    expect(isWalkable({ x: -7.75, z: 17.0 })).toBe(false);
    expect(isWalkable({ x: 7.75, z: 17.0 })).toBe(false);
    expect(isWalkable({ x: -15.5, z: 21.5 })).toBe(false);

    // Chặn va chạm khi bước xuyên qua Kiosk cánh Tây
    const northOfKiosk = { x: -6.5, z: 14.8 };
    const southOfKiosk = { x: -6.5, z: 18.8 };
    expect(isWalkable(northOfKiosk)).toBe(true);
    expect(isWalkable(southOfKiosk)).toBe(true);
    expect(isWalkableSegment(northOfKiosk, southOfKiosk)).toBe(false);
    expect(moveWithCollisions(northOfKiosk, southOfKiosk)).toEqual(northOfKiosk);

    // Các landmark mới và trục chính đều đi bộ được & tìm tuyến vòng thông suốt từ Sảnh Chính
    const cartApproach = { x: -15.5, z: 19.2 };
    expect(isWalkable(cartApproach)).toBe(true);
    expect(isWalkable({ x: 0, z: -3.4 })).toBe(true);
    const pathToCorral = findPath(MAIN_CONCOURSE_ENTRANCE, cartApproach)!;
    expect(pathToCorral).not.toBeNull();
    pathToCorral.slice(1).forEach((point, index) => expect(isWalkableSegment(pathToCorral[index], point)).toBe(true));
  });
});
