import type { Product } from "../types";

export type StoreZoneId =
  | "zone-produce"
  | "zone-beverages-dairy"
  | "zone-pantry-snacks"
  | "zone-apparel"
  | "zone-homecare";

export interface StoreZoneConfig {
  id: StoreZoneId;
  title: string;
  shortLabel: string;
  subtitle: string;
  aisleBadge: string;
  spatialHint: string;
  categories: readonly string[];
  accentHex: string;
  badgeBgClass: string;
  badgeTextClass: string;
  borderAccentClass: string;
  ctaClass: string;
  entry3D: {
    x: number;
    z: number;
    heading: number;
    label: string;
  };
  spotlightNote?: string;
}

/**
 * Bản đồ phân khu bán lẻ chuẩn hóa (1-1 với đại siêu thị 3D 40m x 54m)
 * Đảm bảo mỗi dòng sản phẩm được tách bạch hoàn toàn khỏi các ngành hàng khác.
 */
export const STORE_ZONES_CONFIG: readonly StoreZoneConfig[] = [
  {
    id: "zone-produce",
    title: "Nông Sản & Trái Cây Tươi VietGAP",
    shortLabel: "Nông sản tươi",
    subtitle: "Thu hoạch mới mỗi ngày · Bàn trưng bày gỗ sồi cánh Đông-Bắc",
    aisleBadge: "Bàn gỗ 01–06 · Cánh Đông-Bắc",
    spatialHint: "Rẽ phải cuối đại lộ chính, ngay cạnh dãy Gia Vị A04",
    categories: ["Gia Vị & Nông Sản"],
    accentHex: "#059669",
    badgeBgClass: "bg-emerald-50 border-emerald-200",
    badgeTextClass: "text-emerald-800",
    borderAccentClass: "border-l-emerald-600",
    ctaClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    entry3D: { x: 11.5, z: -8.0, heading: -Math.PI / 2, label: "Khu Nông Sản Tươi" },
  },
  {
    id: "zone-beverages-dairy",
    title: "Đồ Uống, Sữa & Cà Phê",
    shortLabel: "Đồ uống & Sữa",
    subtitle: "Sữa tiệt trùng, cà phê pha sẵn, nước giải khát & đồ uống mát",
    aisleBadge: "Lối 01–02 · Kệ A01, A02, A05, A06",
    spatialHint: "Phía Tây đại lộ trung tâm, sát dãy Tủ Đông tường Bắc",
    categories: [
      "Sữa & Sản Phẩm Từ Sữa",
      "Cà Phê & Trà",
      "Nước Giải Khát",
      "Bia & Đồ Uống Có Cồn",
    ],
    accentHex: "#0052CC",
    badgeBgClass: "bg-blue-50 border-blue-200",
    badgeTextClass: "text-hyper-primary",
    borderAccentClass: "border-l-hyper-primary",
    ctaClass: "bg-hyper-primary hover:bg-hyper-primary-hover text-white",
    entry3D: { x: -4.0, z: 8.2, heading: 0, label: "Khu Đồ Uống & Sữa" },
  },
  {
    id: "zone-pantry-snacks",
    title: "Thực Phẩm Khô, Bánh Kẹo & Gia Vị Bếp",
    shortLabel: "Đồ khô & Gia vị",
    subtitle: "Mì ăn liền, gạo ST25, dầu ăn tinh luyện, nước chấm & bánh kẹo",
    aisleBadge: "Lối 03–04 · Kệ A03, A04, A07, A08",
    spatialHint: "Phía Đông đại lộ trung tâm, đối diện lối vào khu Nông Sản",
    categories: ["Mì & Đồ Khô", "Bánh Kẹo & Snack", "Gia Vị & Nấu Ăn"],
    accentHex: "#FF5400",
    badgeBgClass: "bg-orange-50 border-orange-200",
    badgeTextClass: "text-orange-800",
    borderAccentClass: "border-l-hyper-accent",
    ctaClass: "bg-hyper-accent hover:bg-hyper-accent-hover text-white",
    entry3D: { x: 4.0, z: 8.2, heading: 0, label: "Khu Thực Phẩm Khô & Gia Vị" },
  },
  {
    id: "zone-apparel",
    title: "Thời Trang & Phụ Kiện SmartWear",
    shortLabel: "Thời trang",
    subtitle: "Cotton organic, sơ mi Oxford, áo khoác nỉ, giày thể thao & phụ kiện",
    aisleBadge: "Sàn gỗ Birch · Cánh Đông-Nam",
    spatialHint: "Nằm ngay góc phải sau dãy Self-Checkout Sảnh Nam",
    categories: ["Thời Trang & Phụ Kiện"],
    accentHex: "#4F46E5",
    badgeBgClass: "bg-indigo-50 border-indigo-200",
    badgeTextClass: "text-indigo-800",
    borderAccentClass: "border-l-indigo-600",
    ctaClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    entry3D: { x: 11.0, z: 7.5, heading: -Math.PI / 2, label: "Khu Thời Trang SmartWear" },
  },
  {
    id: "zone-homecare",
    title: "Hóa Phẩm & Chăm Sóc Gia Đình",
    shortLabel: "Chăm sóc gia đình",
    subtitle: "Giặt giũ & vệ sinh nhà cửa — Phân khu an toàn tách biệt thực phẩm",
    aisleBadge: "Cánh Tây · Kệ W03, W04, N01",
    spatialHint: "Tách riêng hoàn toàn tại dãy cánh Tây (khoảng lối đi 2.47m)",
    categories: ["Chăm Sóc Gia Đình"],
    accentHex: "#0891B2",
    badgeBgClass: "bg-cyan-50 border-cyan-200",
    badgeTextClass: "text-cyan-800",
    borderAccentClass: "border-l-cyan-600",
    ctaClass: "bg-cyan-700 hover:bg-cyan-800 text-white",
    entry3D: { x: -14.9, z: 8.2, heading: 0, label: "Khu Hóa Phẩm Gia Đình" },
    spotlightNote:
      "Theo tiêu chuẩn an toàn vệ sinh siêu thị, hóa phẩm giặt tẩy được bày trí tách biệt khỏi khu thực phẩm & nông sản tươi.",
  },
];

const CATEGORY_TO_ZONE = new Map<string, StoreZoneConfig>();
for (const zone of STORE_ZONES_CONFIG) {
  for (const cat of zone.categories) {
    CATEGORY_TO_ZONE.set(cat, zone);
  }
}

export function getZoneForProduct(product: Product): StoreZoneConfig {
  return CATEGORY_TO_ZONE.get(product.category) ?? STORE_ZONES_CONFIG[2];
}

export interface ProductZoneGroup {
  zone: StoreZoneConfig;
  products: Product[];
}

/**
 * Gom nhóm danh sách sản phẩm đã lọc vào đúng từng phân khu theo thứ tự chuẩn trong O(N)
 */
export function groupProductsByZone(products: readonly Product[]): ProductZoneGroup[] {
  const map = new Map<StoreZoneId, Product[]>();
  for (const zone of STORE_ZONES_CONFIG) {
    map.set(zone.id, []);
  }
  for (const product of products) {
    const zone = getZoneForProduct(product);
    map.get(zone.id)!.push(product);
  }
  return STORE_ZONES_CONFIG.map((zone) => ({
    zone,
    products: map.get(zone.id) ?? [],
  })).filter((group) => group.products.length > 0);
}
