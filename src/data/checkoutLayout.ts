import type { FloorObstacle } from "./storeLayout";

export interface CheckoutKioskConfig {
  id: string;
  kioskNumber: string;
  position: [number, number, number];
  rotationY: number;
  wing: "west" | "east";
  width: number;
  depth: number;
  counterHeight: number;
  signHeight: number;
}

export interface CartCorralConfig {
  id: string;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  lanes: number;
  cartsPerLane: number;
  pitchX: number;
}

export interface CheckoutWallMuralConfig {
  id: string;
  kind: "fresh" | "pantry";
  position: [number, number, number];
  width: number;
  height: number;
  title: string;
  subtitle: string;
}

/**
 * Ranh giới cụm Self-Checkout Sảnh Nam & Chuồng Xe Đẩy (Phase 5)
 * Bám sát bố cục ảnh mẫu 06-checkout.webp:
 * - Tách 2 cánh Tây/Đông dọc Z = 17.0m, hướng mặt -Z đón khách đi ra từ các dãy kệ.
 * - Giữ trọn Sảnh Chính X ∈ [-2.1, 2.1] (hành lang thông thủy rộng 6.30m giữa SCO-04 và SCO-05).
 */
export const CHECKOUT_BANK_BOUNDS = {
  zLine: 17.0,
  minX: -12.35,
  maxX: 12.35,
  westCenterX: -7.75,
  eastCenterX: 7.75,
  wingWidth: 9.2,
  wingDepth: 0.95,
};

export const CHECKOUT_STATIONS_CONFIG: readonly CheckoutKioskConfig[] = [
  // Cánh Tây (SCO-01 -> SCO-04)
  { id: "SCO-01", kioskNumber: "01", position: [-11.5, 0, 17.0], rotationY: Math.PI, wing: "west", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
  { id: "SCO-02", kioskNumber: "02", position: [-9.0, 0, 17.0], rotationY: Math.PI, wing: "west", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
  { id: "SCO-03", kioskNumber: "03", position: [-6.5, 0, 17.0], rotationY: Math.PI, wing: "west", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
  { id: "SCO-04", kioskNumber: "04", position: [-4.0, 0, 17.0], rotationY: Math.PI, wing: "west", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
  // Cánh Đông (SCO-05 -> SCO-08)
  { id: "SCO-05", kioskNumber: "05", position: [4.0, 0, 17.0], rotationY: Math.PI, wing: "east", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
  { id: "SCO-06", kioskNumber: "06", position: [6.5, 0, 17.0], rotationY: Math.PI, wing: "east", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
  { id: "SCO-07", kioskNumber: "07", position: [9.0, 0, 17.0], rotationY: Math.PI, wing: "east", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
  { id: "SCO-08", kioskNumber: "08", position: [11.5, 0, 17.0], rotationY: Math.PI, wing: "east", width: 1.6, depth: 0.85, counterHeight: 0.9, signHeight: 2.45 },
];

/**
 * Chuồng tập kết xe đẩy lồng nhau (Shopping Cart Corral - 2 làn x 6 xe = 12 xe)
 * Tọa độ [-15.5, 0, 21.5], mở miệng về hướng +X đón khách từ sảnh chính.
 */
export const CART_CORRAL_CONFIG: CartCorralConfig = {
  id: "cart-corral-south",
  position: [-15.5, 0, 21.5],
  width: 4.2,
  depth: 2.1,
  height: 1.0,
  lanes: 2,
  cartsPerLane: 6,
  pitchX: 0.34,
};

/**
 * 4 Pano tranh tường khu vực thu ngân trên tường Nam (Z = 26.80m)
 */
export const CHECKOUT_WALL_MURALS: readonly CheckoutWallMuralConfig[] = [
  {
    id: "mural-checkout-fresh",
    kind: "fresh",
    position: [-14.5, 3.0, 26.8],
    width: 4.8,
    height: 2.4,
    title: "Fresh picks",
    subtitle: "Nông sản tươi mỗi ngày · SmartMart 3D",
  },
  {
    id: "mural-checkout-pantry",
    kind: "pantry",
    position: [-8.0, 3.0, 26.8],
    width: 4.8,
    height: 2.4,
    title: "Fill your pantry",
    subtitle: "Thực phẩm thiết yếu cho mọi nhà · SmartMart 3D",
  },
  {
    id: "mural-checkout-pantry-east",
    kind: "pantry",
    position: [8.0, 3.0, 26.8],
    width: 4.8,
    height: 2.4,
    title: "Fill your pantry",
    subtitle: "Thực phẩm thiết yếu cho mọi nhà · SmartMart 3D",
  },
  {
    id: "mural-checkout-fresh-east",
    kind: "fresh",
    position: [14.5, 3.0, 26.8],
    width: 4.8,
    height: 2.4,
    title: "Fresh picks",
    subtitle: "Nông sản tươi mỗi ngày · SmartMart 3D",
  },
];

/**
 * Vật cản tĩnh gộp AABB cho A* Pathfinding (triệt tiêu khe kẹt 0.8m giữa các Kiosk)
 */
export const CHECKOUT_PHASE5_OBSTACLES: readonly FloorObstacle[] = [
  {
    id: "kiosk-bank-west",
    kind: "rect",
    x: CHECKOUT_BANK_BOUNDS.westCenterX,
    z: CHECKOUT_BANK_BOUNDS.zLine,
    width: CHECKOUT_BANK_BOUNDS.wingWidth,
    depth: CHECKOUT_BANK_BOUNDS.wingDepth,
  },
  {
    id: "kiosk-bank-east",
    kind: "rect",
    x: CHECKOUT_BANK_BOUNDS.eastCenterX,
    z: CHECKOUT_BANK_BOUNDS.zLine,
    width: CHECKOUT_BANK_BOUNDS.wingWidth,
    depth: CHECKOUT_BANK_BOUNDS.wingDepth,
  },
  {
    id: CART_CORRAL_CONFIG.id,
    kind: "rect",
    x: CART_CORRAL_CONFIG.position[0],
    z: CART_CORRAL_CONFIG.position[2],
    width: CART_CORRAL_CONFIG.width + 0.1,
    depth: CART_CORRAL_CONFIG.depth + 0.1,
  },
];
