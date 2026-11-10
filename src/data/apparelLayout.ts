export interface ApparelRackConfig {
  id: string;
  rackName: string;
  position: [number, number, number];
  width: number;
  depth: number;
  maxHeight: number;
  productId: string;
  signTitle: string;
  signSubtitle: string;
  garmentColor: string;
  garmentCount: number;
}

export interface ApparelTableConfig {
  id: string;
  tableName: string;
  position: [number, number, number];
  width: number;
  depth: number;
  maxHeight: number;
  lowerProductId: string;
  upperProductId: string;
  signTitle: string;
}

/**
 * Ranh giới sàn gỗ Birch Wood & trần hạ bậc phân khu Thời Trang (Phase 4)
 * Tọa độ: X ∈ [6.5, 19.5] (13m), Z ∈ [0.5, 14.5] (14m)
 * Nằm gọn giữa khu Rau Củ (Z <= -1.35) và khu Thu Ngân/Sảnh (Z >= 15.0)
 */
export const APPAREL_ZONE_BOUNDS = {
  centerX: 13.0,
  centerZ: 7.5,
  width: 13.0,
  depth: 14.2,
  ceilingY: 4.5,
  maxFixtureHeight: 1.36, // Khống chế dưới 1.4m giữ tầm nhìn xuyên suốt (Low-profile sightlines)
};

export const APPAREL_RACKS_CONFIG: readonly ApparelRackConfig[] = [
  {
    id: "apparel-rack-01",
    rackName: "Giá Treo Áo Thun 01",
    position: [8.55, 0, 2.4],
    width: 1.6,
    depth: 0.68,
    maxHeight: 1.36,
    productId: "prod-apparel-tshirt",
    signTitle: "Everyday clothing",
    signSubtitle: "Áo Thun Cotton Organic",
    garmentColor: "#4d7c0f",
    garmentCount: 12,
  },
  {
    id: "apparel-rack-02",
    rackName: "Giá Treo Sơ Mi 02",
    position: [14.4, 0, 2.4],
    width: 1.6,
    depth: 0.68,
    maxHeight: 1.36,
    productId: "prod-apparel-shirt",
    signTitle: "Everyday clothing",
    signSubtitle: "Sơ Mi Oxford Dài Tay",
    garmentColor: "#475569",
    garmentCount: 12,
  },
  {
    id: "apparel-rack-03",
    rackName: "Giá Treo Áo Khoác 03",
    position: [8.55, 0, 5.8],
    width: 1.6,
    depth: 0.68,
    maxHeight: 1.36,
    productId: "prod-apparel-jacket",
    signTitle: "Everyday clothing",
    signSubtitle: "Cardigan Nỉ Burgundy",
    garmentColor: "#881337",
    garmentCount: 10,
  },
  {
    id: "apparel-rack-04",
    rackName: "Giá Treo Quần Kaki 04",
    position: [8.55, 0, 9.4],
    width: 1.6,
    depth: 0.68,
    maxHeight: 1.36,
    productId: "prod-apparel-trousers",
    signTitle: "Everyday clothing",
    signSubtitle: "Quần Chinos Dáng Suông",
    garmentColor: "#1e3a8a",
    garmentCount: 12,
  },
];

export const APPAREL_TABLES_CONFIG: readonly ApparelTableConfig[] = [
  {
    id: "apparel-table-01",
    tableName: "Bàn Phụ Kiện Giày & Mũ 01",
    position: [14.4, 0, 5.8],
    width: 1.6,
    depth: 1.0,
    maxHeight: 1.34,
    lowerProductId: "prod-apparel-sneaker",
    upperProductId: "prod-apparel-cap",
    signTitle: "Accessories",
  },
  {
    id: "apparel-table-02",
    tableName: "Bàn Phụ Kiện Giày & Mũ 02",
    position: [14.4, 0, 9.4],
    width: 1.6,
    depth: 1.0,
    maxHeight: 1.34,
    lowerProductId: "prod-apparel-sneaker",
    upperProductId: "prod-apparel-cap",
    signTitle: "Accessories",
  },
  {
    id: "apparel-table-03",
    tableName: "Bàn Phụ Kiện Giày & Mũ 03",
    position: [8.55, 0, 13.5],
    width: 1.6,
    depth: 1.0,
    maxHeight: 1.34,
    lowerProductId: "prod-apparel-sneaker",
    upperProductId: "prod-apparel-cap",
    signTitle: "Accessories",
  },
  {
    id: "apparel-table-04",
    tableName: "Bàn Phụ Kiện Giày & Mũ 04",
    position: [14.4, 0, 13.5],
    width: 1.6,
    depth: 1.0,
    maxHeight: 1.34,
    lowerProductId: "prod-apparel-sneaker",
    upperProductId: "prod-apparel-cap",
    signTitle: "Accessories",
  },
];
