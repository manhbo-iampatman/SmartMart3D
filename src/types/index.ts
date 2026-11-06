export interface Product {
  id: string;
  name: string;
  price: number; // Đơn vị: VNĐ
  category: string;
  description: string;
  unit: string; // "Hộp", "Chai", "Gói", "Lốc 4 hộp", v.v.
  image2D: string;
  color: string; // Màu tượng trưng trong 3D
  dimensions: [number, number, number]; // [rộng, cao, sâu] tính theo mét
  has3D: boolean;
  shelfLocation?: {
    aisle: string;
    shelfTier: number;
    worldPos: [number, number, number];
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type AppMode = "2D" | "3D";

