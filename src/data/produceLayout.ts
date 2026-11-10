import { PRODUCE_PRODUCTS } from "./produceProducts";

export interface ProduceBinConfig {
  binIndex: number;
  productId: string;
  itemShape: "bellpepper" | "cucumber" | "apple" | "lemon" | "avocado" | "tomato";
  itemColor: string;
  itemCount: number;
  grid: { cols: number; rows: number };
}

export interface ProduceTableConfig {
  id: string;
  tableName: string;
  position: [number, number, number];
  rotationY?: number;
  width: number;
  depth: number;
  height: number;
  tiltAngleDeg: number; // Góc nghiêng mặt bàn (8 độ như thiết kế)
  bins: ProduceBinConfig[];
}

/**
 * Cấu hình Bàn Trưng Bày Rau Củ Quả (Data Tier 2 & 3)
 * Phân khu Nông Sản Tươi Sống bố trí tại cánh Đông siêu thị (X in [7, 16], Z in [-17, 1])
 */
export const PRODUCE_TABLES_CONFIG: readonly ProduceTableConfig[] = [
  {
    id: "table-produce-01",
    tableName: "Bàn Rau Củ Đà Lạt 01",
    position: [8.72, 0, -14.0],
    width: 1.9,
    depth: 1.2,
    height: 0.85,
    tiltAngleDeg: 8,
    bins: [
      {
        binIndex: 0,
        productId: "prod-produce-bellpepper",
        itemShape: "bellpepper",
        itemColor: "#dc2626",
        itemCount: 16,
        grid: { cols: 4, rows: 4 },
      },
      {
        binIndex: 1,
        productId: "prod-produce-cucumber",
        itemShape: "cucumber",
        itemColor: "#15803d",
        itemCount: 20,
        grid: { cols: 5, rows: 4 },
      },
    ],
  },
  {
    id: "table-produce-02",
    tableName: "Bàn Trái Cây Nhập Khẩu 02",
    position: [14.4, 0, -14.0],
    width: 1.9,
    depth: 1.2,
    height: 0.85,
    tiltAngleDeg: 8,
    bins: [
      {
        binIndex: 0,
        productId: "prod-produce-apple",
        itemShape: "apple",
        itemColor: "#b91c1c",
        itemCount: 25,
        grid: { cols: 5, rows: 5 },
      },
      {
        binIndex: 1,
        productId: "prod-produce-lemon",
        itemShape: "lemon",
        itemColor: "#eab308",
        itemCount: 25,
        grid: { cols: 5, rows: 5 },
      },
    ],
  },
  {
    id: "table-produce-03",
    tableName: "Bàn Nông Sản Đặc Sản 03",
    position: [8.72, 0, -8.0],
    width: 1.9,
    depth: 1.2,
    height: 0.85,
    tiltAngleDeg: 8,
    bins: [
      {
        binIndex: 0,
        productId: "prod-produce-avocado",
        itemShape: "avocado",
        itemColor: "#1e3a1e",
        itemCount: 16,
        grid: { cols: 4, rows: 4 },
      },
      {
        binIndex: 1,
        productId: "prod-produce-tomato",
        itemShape: "tomato",
        itemColor: "#ef4444",
        itemCount: 24,
        grid: { cols: 6, rows: 4 },
      },
    ],
  },
  {
    id: "table-produce-04",
    tableName: "Bàn Trái Cây Miền Tây 04",
    position: [14.4, 0, -8.0],
    width: 1.9,
    depth: 1.2,
    height: 0.85,
    tiltAngleDeg: 8,
    bins: [
      {
        binIndex: 0,
        productId: "prod-produce-apple",
        itemShape: "apple",
        itemColor: "#dc2626",
        itemCount: 20,
        grid: { cols: 5, rows: 4 },
      },
      {
        binIndex: 1,
        productId: "prod-produce-lemon",
        itemShape: "lemon",
        itemColor: "#facc15",
        itemCount: 20,
        grid: { cols: 5, rows: 4 },
      },
    ],
  },
  {
    id: "table-produce-05",
    tableName: "Bàn Rau Hữu Cơ 05",
    position: [8.72, 0, -2.0],
    width: 1.9,
    depth: 1.2,
    height: 0.85,
    tiltAngleDeg: 8,
    bins: [
      {
        binIndex: 0,
        productId: "prod-produce-bellpepper",
        itemShape: "bellpepper",
        itemColor: "#eab308", // Ớt chuông vàng
        itemCount: 16,
        grid: { cols: 4, rows: 4 },
      },
      {
        binIndex: 1,
        productId: "prod-produce-cucumber",
        itemShape: "cucumber",
        itemColor: "#16a34a",
        itemCount: 20,
        grid: { cols: 5, rows: 4 },
      },
    ],
  },
  {
    id: "table-produce-06",
    tableName: "Bàn Củ Quả Đà Lạt 06",
    position: [14.4, 0, -2.0],
    width: 1.9,
    depth: 1.2,
    height: 0.85,
    tiltAngleDeg: 8,
    bins: [
      {
        binIndex: 0,
        productId: "prod-produce-avocado",
        itemShape: "avocado",
        itemColor: "#14532d",
        itemCount: 16,
        grid: { cols: 4, rows: 4 },
      },
      {
        binIndex: 1,
        productId: "prod-produce-tomato",
        itemShape: "tomato",
        itemColor: "#dc2626",
        itemCount: 24,
        grid: { cols: 6, rows: 4 },
      },
    ],
  },
];

/**
 * Cấu hình Pano Tranh tường "Fresh picks" trên tường Đông (X = 19.8m)
 */
export const PRODUCE_WALL_MURALS = [
  {
    id: "mural-1",
    position: [19.8, 3.2, -14.0] as [number, number, number],
    width: 4.2,
    height: 2.2,
    bgColor: "#064e3b", // Xanh ngọc lục bảo sẫm
    headline: "Fresh picks",
    subline: "NÔNG TRẠI HỮU CƠ ĐÀ LẠT · 100% TƯƠI SẠCH",
    badge: "ORGANIC 100%",
  },
  {
    id: "mural-2",
    position: [19.8, 3.2, -8.0] as [number, number, number],
    width: 4.2,
    height: 2.2,
    bgColor: "#14532d", // Xanh rừng rậm
    headline: "Farm to Table",
    subline: "TRÁI CÂY NHẬP KHẨU NEW ZEALAND & MIỀN TÂY",
    badge: "GLOBAL G.A.P",
  },
  {
    id: "mural-3",
    position: [19.8, 3.2, -2.0] as [number, number, number],
    width: 4.2,
    height: 2.2,
    bgColor: "#065f46", // Xanh lá cây đậm
    headline: "Daily Harvest",
    subline: "RAU XANH THU HOẠCH TRONG NGÀY TẠI ĐỊA PHƯƠNG",
    badge: "VIETGAP CERTIFIED",
  },
];

