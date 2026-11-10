import type { Product } from "../types";

// Illustrative label content, not verified manufacturer data or real batch expiry dates.
const expiry = "Xem NSX / HSD in trên bao bì; chưa có dữ liệu theo lô.";
const storage = "Tham khảo hướng dẫn bảo quản in trên bao bì của sản phẩm.";

export const MOCK_PRODUCT_LABELS: Record<string, NonNullable<Product["labelInfo"]>> = {
  "prod-milk-vinamilk": { ingredients: "Minh họa: sữa tươi, vitamin và khoáng chất.", storage, expiry, isDemo: true },
  "prod-noodle-haohao": { ingredients: "Minh họa: bột mì, dầu thực vật và gói gia vị.", storage, expiry, isDemo: true },
  "prod-drink-coca": { ingredients: "Minh họa: nước có ga, đường và hương liệu.", storage, expiry, isDemo: true },
  "prod-coffee-g7": { ingredients: "Minh họa: cà phê hòa tan, đường và bột kem.", storage, expiry, isDemo: true },
  "prod-snack-chocopie": { ingredients: "Minh họa: bột mì, đường, ca cao và nhân marshmallow.", storage, expiry, isDemo: true },
  "prod-drink-milo": { ingredients: "Minh họa: sữa, lúa mạch và ca cao.", storage, expiry, isDemo: true },
  "prod-drink-sting": { ingredients: "Minh họa: nước, đường và hương dâu.", storage, expiry, isDemo: true },
  "prod-oil-simply": { ingredients: "Minh họa: dầu thực vật tinh luyện.", storage, expiry, isDemo: true },
};
