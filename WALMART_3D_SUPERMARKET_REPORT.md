# BÁO CÁO PHÂN TÍCH VÀ ĐỀ ÁN PHÁT TRIỂN: SMARTMART 3D
> **Hệ quy chiếu kỹ thuật**: Dự án [Walmart — An Interactive 3D Supermarket (By Omid)](https://byomid.com/Walmart/)  
> **Định hướng phát triển**: Siêu thị Mua sắm Không gian Lai (Hybrid 2D & 3D E-Commerce) cho Thị trường Việt Nam  
> **Người thực hiện**: Antigravity  
> **Cập nhật ngày**: 2026-11-06  

---

## 1. TỔNG QUAN DỰ ÁN GỐC (WALMART 3D CỦA BY OMID)

Dự án **"Walmart — An Interactive 3D Supermarket"** là một concept thử nghiệm bán lẻ không gian 3D tương tác trực tiếp trên trình duyệt web (Browser-based Spatial Retail Experience) do nhà thiết kế & kỹ sư **Omid Rasouli** (By Omid) phát triển.

### Mục tiêu & Ý tưởng cốt lõi của nguyên mẫu:
Thay vì người mua hàng chỉ cuộn xem danh sách sản phẩm dạng lưới 2D phẳng thông thường, nguyên mẫu Walmart 3D tái hiện một siêu thị thu nhỏ dưới dạng không gian 3D chân thực:
- Người dùng trực tiếp "bước vào", đi bộ qua từng lối đi (aisles).
- Nhìn thấy các biển chỉ dẫn ngành hàng, đi tới từng kệ hàng.
- Tìm kiếm sản phẩm thông qua công cụ tìm kiếm, sau đó hệ thống tự động **vẽ đường dẫn (pathfinding)** đưa người dùng đi bộ đến đúng vị trí kệ hàng đó.
- Nhặt sản phẩm bỏ vào xe đẩy vật lý đi theo mình, kiểm tra sản phẩm 3D xoay 360 độ và đẩy xe tới quầy **Self-checkout** mô phỏng quét mã in hóa đơn.

---

## 2. QUY MÔ & TÍNH NĂNG KỸ THUẬT NỔI BẬT

Theo công bố kỹ thuật trên trang dự án của Omid:

| Thông số / Thành phần | Quy mô trong Prototype | Chi tiết kỹ thuật |
| :--- | :--- | :--- |
| **Sản phẩm danh mục (Catalogue)** | **400 sản phẩm** riêng biệt | Các model 3D độc lập có texture bao bì, quy cách và giá |
| **Vị trí hàng hóa trên kệ** | **104,346 vị trí** (Stocked instances) | Sử dụng kỹ thuật **GPU Instancing** lặp lại 400 model gốc trên các kệ chứ không tạo 104k mesh riêng |
| **Cấu trúc nội thất (Fixtures)** | **290 cụm** kệ / quầy | Kệ gondola tiêu chuẩn, tủ đông lạnh, giá treo quần áo, quầy tính tiền |
| **Khu vực ngành hàng (Departments)** | **15 khu vực** | Nông sản tươi (Produce), Tạp hóa (Grocery), Bánh mì (Bakery), Thời trang (Apparel), Điện tử (Electronics), Đồ gia dụng, Sân vườn, Quầy thanh toán... |

### Các tính năng tương tác chính:
1. **Hệ thống điều khiển & Góc nhìn (Camera & Movement)**:
   - Hỗ trợ cả bàn phím (`W-A-S-D` / phím mũi tên) và điều khiển cảm ứng (Virtual Joystick / Swipe) trên thiết bị di động.
   - Xoay góc nhìn người thứ nhất (First-person) hoặc người thứ ba (Third-person).
   - **Chuyển đổi góc nhìn mặt bằng (Floor-plan view)**: Xem toàn cảnh siêu thị từ trên cao như một bản đồ tương tác (Minimap).
2. **Hệ thống định vị & Dẫn đường (Wayfinding & Pathfinding)**:
   - Gắn mã địa chỉ kệ (Shelf address) và biển báo trực quan.
   - Tính năng **"Find on shelf"**: Khi tìm kiếm sản phẩm trên danh mục, hệ thống sẽ vẽ vệt sáng dẫn đường trên sàn nhà đưa người dùng đến tận kệ chứa món hàng.
3. **Kiểm tra chi tiết sản phẩm (3D Product Inspection)**:
   - Khi đứng trong phạm vi gần (Within reach), click vào sản phẩm sẽ mở popup 3D cho phép xoay 360 độ, kiểm tra bao bì, chọn màu sắc/kích thước và xem thông số giá.
4. **Xe đẩy vật lý & Quầy Self-checkout**:
   - Chọn xe đẩy tại cửa ra vào, xe đẩy di chuyển bám theo góc đi của người chơi.
   - Giỏ hàng có sức chứa thể tích vật lý (giới hạn tối đa khoảng 24 gói hàng tùy kích thước hộp).
   - Quầy thanh toán tự động mô phỏng: Đưa từng món qua máy quét mã vạch (có hiệu ứng âm thanh/chuyển động) và in biên lai mẫu trên trình duyệt.
   - Lưu trữ giỏ hàng trong bộ nhớ cục bộ trình duyệt (LocalStorage / IndexedDB).
5. **Kỹ thuật tối ưu hóa 3D đỉnh cao**:
   - Màn hình tải có hoạt cảnh giới thiệu lối đi (Animated preview) để người dùng không cảm thấy lâu trong lúc engine dựng scene ngầm.
   - Kỹ thuật **LOD (Level of Detail)**: Kệ ở gần dựng chi tiết cao, kệ ở xa tự động giảm đa giác hoặc chuyển thành billboard nhẹ.
   - Tách biệt hoàn toàn luồng nạp dữ liệu sản phẩm với luồng dựng cảnh quan 3D.

---

## 3. CÁC CÔNG CỤ & CÔNG NGHỆ CẦN THIẾT (TECH STACK)

### 3.1. Thiết kế 3D & Xử lý Tài nguyên (3D Asset Pipeline)
- **DCC Tools**: **Blender** (Dựng kiến trúc, kệ hàng, nướng ánh sáng Lightmap baking).
- **Tạo mô hình sản phẩm**: 
  - **3D Scanning / Photogrammetry**: *RealityCapture*, *Polycam*, hoặc *Kiri Engine* quét từ sản phẩm thật.
  - **AI 3D Model Generation**: *Tripo3D*, *Meshy.ai*, hoặc *CSM* tạo draft model nhanh từ ảnh 2D.
- **Xử lý chất liệu & Texture**: *Adobe Substance 3D Painter* (chất liệu PBR: BaseColor, Normal, Roughness, Metalness).
- **Tối ưu hóa file 3D cho Web**: **glTF-Transform**, **Draco Compression** (giảm 70-80% dung lượng), **KTX2 / Basis Universal** (nén texture trực tiếp vào VRAM).

### 3.2. Lập trình Frontend & Engine 3D trên Web
- **3D Web Engine**: **React Three Fiber (R3F) + Three.js + `@react-three/drei`** (Lựa chọn tối ưu nhất để kết hợp giữa UI 2D truyền thống và Canvas 3D).
- **Vật lý & Va chạm**: **Rapier.js** (`@react-three/rapier` viết bằng Rust/Wasm, siêu nhẹ).
- **Hệ thống dẫn đường**: **three-pathfinding** hoặc **Recast/Detour NavMesh** cho tính năng "Find on shelf".
- **Giao diện & Quản lý trạng thái**: **React + TypeScript + Tailwind CSS**, **Zustand** (quản lý state giỏ hàng dùng chung).

### 3.3. Backend & Lưu trữ
- **Backend API**: Node.js (NestJS / Express) hoặc Python (FastAPI).
- **Cơ sở dữ liệu**: PostgreSQL + PostGIS (lưu tọa độ `x, y, z`, danh mục, mã kệ).
- **CDN**: Cloudflare R2 / AWS S3 + CDN để tải file `.glb` nhanh chóng.

---

## 4. ĐÁNH GIÁ TÍNH KHẢ DỤNG NGUYÊN MẪU THUẦN 3D

```
+---------------------------------------------------------------------------------+
|                      ĐÁNH GIÁ NGUYÊN MẪU THUẦN 3D TRUYỀN THỐNG                  |
+----------------------+--------------------+-------------------------------------+
| Tiêu chí             | Điểm khả dụng      | Nhận định                           |
+----------------------+--------------------+-------------------------------------+
| 1. Kỹ thuật Web 3D   | 9 / 10 (Rất cao)   | WebGL 2.0 & WebGPU hoàn toàn đáp ứng|
| 2. Chi phí sản xuất  | 4 / 10 (Khó khăn)  | Khối lượng dựng 400+ 3D quá đắt đỏ  |
| 3. Trải nghiệm E-com | 3 / 10 (Bất tiện)  | Mua sắm chậm chạp so với web 2D     |
| 4. Marketing/Showroom| 9 / 10 (Tuyệt vời) | Gây ấn tượng mạnh, viral tốt        |
+----------------------+--------------------+-------------------------------------+
```

* **Vấn đề cốt tử của mô hình thuần 3D**: Khách hàng đi chợ online cần tốc độ (tìm đồ và thanh toán trong 30 giây). Bắt người dùng "đi bộ ảo" qua 15 dãy kệ sẽ gây mỏi tay và ức chế sau vài phút. Hơn nữa, chi phí dựng hàng nghìn sản phẩm 3D là gánh nặng khổng lồ.

---

## 5. ĐỀ XUẤT ĐỘT PHÁ: DỰ ÁN "SMARTMART 3D" (HYBRID E-COMMERCE VIỆT NAM)

> **Nhận định về ý tưởng SmartMart 3D**:  
> Đây là một **ý tưởng cực kỳ xuất sắc và mang tính đột phá cao (10/10)**, trực tiếp giải quyết 2 rào cản lớn nhất của thương mại 3D: **tốc độ mua sắm** và **chi phí sản xuất tài nguyên**.

### 5.1. Triết lý Thiết kế: Mô hình Mua sắm Lai (Dual-Mode Hybrid)
Thay vì bắt khách hàng chỉ được chọn 2D hoặc 3D, hệ thống cung cấp **chế độ chuyển đổi linh hoạt 1-click**:

1. **Chế độ 1: Mua Nhanh (2D Quick Shop)**:
   - Giao diện dạng danh sách / lưới thẻ sản phẩm quen thuộc giống Shopee, Bách Hóa Xanh, Tiki.
   - Thanh tìm kiếm tức thời (Instant search), bộ lọc ngành hàng, phân loại theo giá VNĐ.
   - Thêm nhanh vào giỏ hàng với 1 click chuột, điều chỉnh số lượng (+/-) tức thì.
   - Thích hợp khi: Khách bận rộn, mua đồ lặt vặt hàng ngày, mua nhiều món cùng lúc.

2. **Chế độ 2: Khám Phá 3D (3D Immersive Spatial Shop)**:
   - Bước chân vào không gian siêu thị 3D với góc nhìn người thứ nhất (`W-A-S-D` hoặc cảm ứng).
   - Tham quan các gian hàng tiêu biểu (Feature Aisles), nhìn ngắm sản phẩm xếp trên kệ.
   - Click vào sản phẩm để mở hộp xoay 360 độ, nhặt hàng vào xe đẩy vật lý.
   - Có vệt sáng dẫn đường "Tìm trên kệ" nếu muốn biết món hàng nằm ở đâu trong siêu thị.
   - Thích hợp khi: Khách có thời gian dạo chơi, tìm kiếm cảm giác mới lạ, muốn xem kỹ bao bì sản phẩm khuyến mãi hoặc quà tặng.

### 5.2. Trái tim Hệ thống: Cơ chế Đồng bộ Giỏ hàng 2 Chiều (Unified Cart State)
Hai chế độ sử dụng chung **một nguồn dữ liệu duy nhất (Single Source of Truth)**. Người dùng có thể tự do luân chuyển qua lại mà không mất dữ liệu:

```mermaid
flowchart LR
    subgraph UI ["Giao diện Người dùng"]
        M2D["Chế độ Mua Nhanh 2D\n(Danh sách, Tìm kiếm, Lưới thẻ)"]
        M3D["Chế độ Khám Phá 3D\n(Đi dạo, Nhặt hàng trên kệ)"]
    end

    subgraph Store ["Tầng Quản lý Trạng thái Tập trung (Zustand)"]
        Cart["Unified Cart Store\n- items: CartItem[]\n- totalVND: number\n- addItem(), removeItem()"]
        Catalog["Unified Product Catalog\n- Dữ liệu sản phẩm tiếng Việt\n- Giá niêm yết VNĐ\n- Tọa độ 3D (nếu có)"]
    end

    M2D <==>|"Thêm / Bớt / Cập nhật"| Cart
    M3D <==>|"Nhặt trên kệ / Trả về"| Cart
    Catalog --> M2D
    Catalog --> M3D
```

#### Kịch bản thực tế:
1. Khách hàng bật chế độ 3D, đi dạo và nhặt **1 Hộp Sữa Tươi Vinamilk 1L** (38.000 đ) trên kệ vào giỏ hàng.
2. Khách nhớ ra cần mua thêm bột giặt nhưng lười đi bộ tìm quầy chất tẩy rửa $\rightarrow$ Bấm nút **"Chuyển sang Mua Nhanh 2D"**.
3. Màn hình chuyển sang giao diện danh sách quen thuộc. Góc trên giỏ hàng **vẫn hiển thị 1 món (38.000 đ)**.
4. Khách gõ ô tìm kiếm: *"Bột giặt OMO"* $\rightarrow$ Click *"Thêm vào giỏ"* (145.000 đ). Giỏ hàng tự động cập nhật thành **2 món (183.000 đ)**.
5. Khách tò mò muốn xem quầy bánh mì 3D $\rightarrow$ Bấm quay lại **"Khám Phá 3D"**. Xe đẩy trong không gian 3D lập tức đồng bộ hiển thị các sản phẩm đã chọn!

### 5.3. Chiến lược MVP Thu Nhỏ (Smart Scope): Giảm 90% Chi phí & Thời gian
Ở các bước đầu, **chúng ta không cần và không nên dựng toàn bộ hàng nghìn sản phẩm 3D**:

* **Trong Cơ sở dữ liệu 2D (Danh mục đầy đủ)**: Có thể chứa 500 - 1,000 mặt hàng bình thường (chỉ cần ảnh chụp 2D, tên tiếng Việt, giá VNĐ như web thương mại điện tử thông thường).
* **Trong Không gian 3D (Gian hàng tiêu biểu - Showcase Aisles)**:
  - Chỉ dựng **1 lối đi mẫu (Aisle 01)** với **2 dãy kệ**.
  - Chỉ cần chuẩn bị mô hình 3D cho khoảng **10 - 20 sản phẩm nổi bật** (Ví dụ: Nước giải khát, Sữa tươi, Bánh snack, Cà phê lon).
  - Sử dụng kỹ thuật **GPU Instancing** để nhân bản 10-20 model này lấp đầy các tầng kệ, tạo cảm giác siêu thị phong phú, nhộn nhịp mà dung lượng tải chỉ tốn **dưới 5MB**!
  - Các sản phẩm khác nếu chưa có 3D: Khi tìm kiếm trong 3D, hệ thống sẽ hiện thông báo *"Sản phẩm có sẵn ở chế độ Mua Nhanh"* kèm nút bấm chuyển sang 2D ngay lập tức.

### 5.4. Bản địa hóa Toàn diện Thị trường Việt Nam
- **Ngôn ngữ**: 100% Tiếng Việt (Biển hiệu siêu thị: "Khu Bánh Kẹo", "Quầy Sữa & Nước Giải Khát", "Quầy Thu Ngân Tự Động").
- **Đơn vị tiền tệ**: VNĐ chuẩn định dạng Việt Nam (`45.000 đ`, `120.000 đ`), tính toán tổng tiền, VAT 8-10%.
- **Thanh toán tích hợp**: Quầy Self-checkout mô phỏng quét mã **VietQR**, **MoMo**, **ZaloPay** hoặc Thanh toán khi nhận hàng (COD).

---

## 6. HƯỚNG DẪN XÂY DỰNG NỀN TẢNG (BASE) ĐẦU TIÊN CHO SMARTMART 3D

### 6.1. Khởi tạo Dự án & Cài đặt Thư viện
```bash
# 1. Tạo project Vite React TypeScript
npm create vite@latest smartmart-3d -- --template react-ts
cd smartmart-3d

# 2. Cài đặt các thư viện 3D cốt lõi (React 18 / Three.js)
npm install three @types/three @react-three/fiber @react-three/drei

# 3. Cài đặt thư viện quản lý trạng thái, icon & UI
npm install zustand lucide-react clsx tailwind-merge

# 4. Cài đặt Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 6.2. Cấu trúc Thư mục Dự án Lai (Hybrid Project Structure)
```text
smartmart-3d/
├── public/
│   ├── assets/
│   │   ├── models/           # File 3D (.glb) nén: kệ hàng, xe đẩy, sản phẩm mẫu
│   │   └── textures/         # Texture PBR: gạch sàn siêu thị, biển hiệu tiếng Việt
│   └── data/
│       └── products.json     # Kho dữ liệu chung (Single Source of Truth)
├── src/
│   ├── components/
│   │   ├── 2d/               # CHẾ ĐỘ MUA NHANH 2D
│   │   │   ├── QuickShopView.tsx    # Giao diện lưới sản phẩm 2D
│   │   │   ├── ProductCard2D.tsx    # Thẻ sản phẩm với nút thêm giỏ hàng
│   │   │   └── CategoryFilter.tsx   # Bộ lọc ngành hàng tiếng Việt
│   │   ├── 3d/               # CHẾ ĐỘ KHÁM PHÁ 3D
│   │   │   ├── Scene3D.tsx          # Canvas Three.js, ánh sáng, môi trường
│   │   │   ├── PlayerFPS.tsx        # Điều khiển góc nhìn người thứ nhất (WASD)
│   │   │   ├── AisleGondola.tsx     # Dãy kệ hàng siêu thị
│   │   │   ├── InstancedStock.tsx   # Render hàng nghìn hộp bánh/sữa mượt 60fps
│   │   │   └── ProductInspector3D.tsx# Modal xem sản phẩm xoay 360 độ
│   │   └── shared/           # GIAO DIỆN DÙNG CHUNG CẢ 2 CHẾ ĐỘ
│   │       ├── HeaderNavbar.tsx     # Nút gạt chuyển đổi [2D Mua Nhanh] <-> [3D Khám Phá]
│   │       ├── CartDrawer.tsx       # Giỏ hàng bên phải màn hình (luôn đồng bộ)
│   │       └── CheckoutModal.tsx    # Quét mã QR VNĐ thanh toán
│   ├── stores/
│   │   ├── useCartStore.ts   # Quản lý giỏ hàng chung (Zustand + LocalStorage)
│   │   ├── useProductStore.ts# Quản lý danh mục & trạng thái sản phẩm
│   │   └── useAppModeStore.ts# Quản lý chế độ hiện tại ('2D' | '3D')
│   ├── types/
│   │   └── index.ts          # Định nghĩa Product, CartItem, Department
│   ├── App.tsx               # Component gốc điều phối hiển thị 2D / 3D
│   └── main.tsx
```

### 6.3. Mã nguồn Quản lý Trạng thái Giỏ hàng Chung (`useCartStore.ts`)
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  id: string;
  name: string;
  price: number; // Đơn vị: VNĐ
  category: string;
  image2D: string;
  has3DModel: boolean;
  modelType?: string;
  stockPositions?: [number, number, number][]; // Tọa độ trong 3D
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalVND: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: currentItems.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...currentItems, { product, quantity: 1 }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalVND: () =>
        get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: "smartmart-cart-storage" }
  )
);
```

### 6.4. Bộ Điều phối Giao diện Chuyển đổi 2D $\leftrightarrow$ 3D (`App.tsx`)
```tsx
import React, { useState } from "react";
import { HeaderNavbar } from "./components/shared/HeaderNavbar";
import { QuickShopView } from "./components/2d/QuickShopView";
import { Scene3D } from "./components/3d/Scene3D";
import { CartDrawer } from "./components/shared/CartDrawer";

export const App: React.FC = () => {
  const [mode, setMode] = useState<"2D" | "3D">("2D");
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 text-white flex flex-col font-sans">
      {/* 1. Thanh điều hướng dùng chung: Chuyển chế độ 2D <-> 3D */}
      <HeaderNavbar
        currentMode={mode}
        onToggleMode={(newMode) => setMode(newMode)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 2. Khu vực hiển thị: Thay đổi theo chế độ đã chọn */}
      <main className="flex-1 relative overflow-hidden">
        {mode === "2D" ? (
          <div className="w-full h-full overflow-y-auto p-6 bg-slate-50 text-slate-800">
            <QuickShopView onSwitchTo3D={() => setMode("3D")} />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <Scene3D />
            {/* HUD tâm ngắm & phím tắt cho 3D */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-2 h-2 bg-white/80 rounded-full border border-black/30 shadow" />
            </div>
          </div>
        )}
      </main>

      {/* 3. Giỏ hàng Drawer: Luôn hiển thị dữ liệu đồng bộ dù ở 2D hay 3D */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default App;
```

---

## 7. KẾ HOẠCH PHÂN CHIA 6 GIAI ĐOẠN TRIỂN KHAI TỪNG BƯỚC

```mermaid
flowchart TD
    G1["Giai đoạn 1: Khởi tạo Base Dual-Mode & Đồng bộ Giỏ hàng (Tuần 1)"] --> G2["Giai đoạn 2: Dựng Gian hàng 3D Mẫu & GPU Instancing (Tuần 2)"]
    G2 --> G3["Giai đoạn 3: Tương tác Nhặt hàng 3D & Xem chi tiết 360 độ (Tuần 3)"]
    G3 --> G4["Giai đoạn 4: Dẫn đường 'Tìm trên kệ' & Chuyển đổi 2D-3D mượt mà (Tuần 4)"]
    G4 --> G5["Giai đoạn 5: Xe đẩy theo người & Thanh toán VietQR VNĐ (Tuần 5)"]
    G5 --> G6["Giai đoạn 6: Tối ưu Mobile, Đóng gói & Triển khai Public (Tuần 6)"]
```

---

### GIAI ĐOẠN 1: KHỞI TẠO NỀN TẢNG HYBRID DUAL-MODE (BASE FOUNDATION)
*Thời lượng: 3 - 5 ngày*

* **Mục tiêu**: Xây dựng bộ khung ứng dụng kết hợp 2D và 3D với hệ thống giỏ hàng dùng chung hoạt động ổn định.
* **Nhiệm vụ cụ thể**:
  - [x] Cài đặt dự án với Vite + React 18 + TypeScript + Three.js + Tailwind CSS.
  - [x] Tạo `useCartStore` bằng Zustand, có lưu trữ `localStorage` và tính tổng tiền VNĐ.
  - [x] Tạo thanh Header với nút gạt: `[⚡ Mua Nhanh 2D]` $\leftrightarrow$ `[🎮 Khám Phá 3D]`.
  - [x] Tạo màn hình 2D với 12 sản phẩm Việt Nam mẫu (Sữa Vinamilk, Mì Hảo Hảo, Cà phê G7, Nước ngọt...).
  - [x] Tạo màn hình 3D cơ bản với mặt sàn siêu thị, ánh sáng và camera di chuyển bằng phím `WASD`.
* **Nghiệm vụ**: Bấm thêm 2 gói mì ở 2D $\rightarrow$ bấm sang 3D $\rightarrow$ giỏ hàng vẫn lưu đúng 2 gói mì và tổng tiền VNĐ chính xác.

---

### GIAI ĐOẠN 2: DỰNG GIAN HÀNG 3D MẪU & RENDER HÀNG LOẠT (INSTANCING)
*Thời lượng: 5 - 7 ngày*

* **Mục tiêu**: Xây dựng 1 lối đi siêu thị mẫu (Aisle 01) với 2 dãy kệ chứa hàng nghìn sản phẩm nhưng FPS luôn đạt **60 FPS**.
* **Nhiệm vụ cụ thể**:
  - [ ] Thiết kế 2 dãy kệ hàng Gondola bằng Blender hoặc hình học cơ bản có vách ngăn, khay giá.
  - [ ] Chuẩn bị texture nhãn dán cho 5 sản phẩm đặc trưng: Sữa tươi, Nước ngọt lon, Bánh hộp, Snack gói, Cà phê.
  - [ ] Viết component `InstancedStock.tsx` sử dụng `THREE.InstancedMesh`.
  - [ ] Rải tự động 1,500 - 3,000 sản phẩm lên các tầng kệ bằng thuật toán ma trận tọa độ.
  - [ ] Kiểm tra hiệu năng: Số lệnh vẽ (Draw calls) $\le 20$, FPS đạt 60 trên trình duyệt máy tính.
* **Nghiệm vụ**: Bước vào 3D thấy các kệ hàng đầy ắp sản phẩm, di chuyển trơn tru, không có hiện tượng giật hình.

---

### GIAI ĐOẠN 3: TƯƠNG TÁC NHẶT HÀNG & MODAL 3D 360 ĐỘ
*Thời lượng: 5 - 7 ngày*

* **Mục tiêu**: Hiện thực hóa thao tác nhặt hàng trên kệ 3D và xem chi tiết sản phẩm.
* **Nhiệm vụ cụ thể**:
  - [ ] Sử dụng `Raycaster` gắn với tâm ngắm ở giữa màn hình.
  - [ ] Khi ngắm vào sản phẩm trong phạm vi < 2.5m: Hiện tên tiếng Việt và giá VNĐ nổi trên đầu món đồ.
  - [ ] Bấm phím `E` hoặc Click chuột: Mở modal **ProductInspector3D** cho phép xoay 360 độ bằng chuột, xem thành phần và hạn sử dụng.
  - [ ] Nút "Bỏ vào giỏ": Gọi hàm `addItem()` của `useCartStore`, phát hiệu ứng âm thanh *"ting"* vui tai và cập nhật giỏ hàng ngay lập tức.
* **Nghiệm vụ**: Người dùng đứng trước kệ sữa, click nhặt 1 hộp sữa $\rightarrow$ giỏ hàng tăng số lượng và cập nhật tiền tức thì.

---

### GIAI ĐOẠN 4: TÍNH NĂNG "TÌM TRÊN KỆ" (PATHFINDING) & LIÊN KẾT 2D-3D
*Thời lượng: 7 - 10 ngày*

* **Mục tiêu**: Kết nối sâu sắc giữa 2 chế độ: Đang ở 2D có thể bấm "Xem vị trí trong 3D", và ở 3D có thể tìm đường tới kệ.
* **Nhiệm vụ cụ thể**:
  - [ ] Ở giao diện 2D: Mỗi sản phẩm có thêm nút *"📍 Xem vị trí trên kệ 3D"*. Khi bấm vào $\rightarrow$ Tự động chuyển sang chế độ 3D và đặt người chơi đứng trước kệ hàng đó.
  - [ ] Ở giao diện 3D: Thanh tìm kiếm sản phẩm. Khi chọn món hàng $\rightarrow$ Tính toán đường đi ngắn nhất bằng **A\*** (NavMesh).
  - [ ] Vẽ vệt sáng uốn lượn dưới sàn nhà dẫn người dùng từ vị trí hiện tại đến kệ hàng đích.
  - [ ] Thêm nút xem bản đồ mặt bằng từ trên cao (**Top-down Minimap**).
* **Nghiệm vụ**: Khách tìm kiếm ở 2D hoặc 3D đều có thể được dẫn đường chính xác tới vị trí vật lý của kệ hàng.

---

### GIAI ĐOẠN 5: XE ĐẨY VẬT LÝ & QUẦY TÍNH TIỀN VIETQR (SELF-CHECKOUT)
*Thời lượng: 5 - 7 ngày*

* **Mục tiêu**: Mô phỏng trọn vẹn văn hóa mua sắm siêu thị với xe đẩy và quét mã thanh toán Việt Nam.
* **Nhiệm vụ cụ thể**:
  - [ ] Thêm mô hình xe đẩy hàng bám theo bước chân người chơi trong không gian 3D.
  - [ ] Sản phẩm khi nhặt sẽ có animation thu nhỏ bay vào lòng xe đẩy.
  - [ ] Dựng quầy tính tiền tự động (Self-checkout) ở đầu lối đi.
  - [ ] Khi đi tới quầy: Kích hoạt màn hình quét mã.
  - [ ] Hệ thống hiển thị bảng kê danh sách sản phẩm tiếng Việt, tổng tiền VNĐ và **tự động sinh mã VietQR động** (với số tiền chính xác để người dùng có thể quét thử bằng app ngân hàng thật nếu muốn).
* **Nghiệm vụ**: Trải nghiệm cảm giác đẩy xe tới quầy, nghe tiếng tít tít máy quét mã và hiện mã QR thanh toán quen thuộc của Việt Nam.

---

### GIAI ĐOẠN 6: TỐI ƯU HÓA MOBILE, ĐÓNG GÓI & TRIỂN KHAI (DEPLOY)
*Thời lượng: 5 - 7 ngày*

* **Mục tiêu**: Chạy mượt mà trên điện thoại smartphone và đưa lên hosting công khai.
* **Nhiệm vụ cụ thể**:
  - [ ] Phát hiện thiết bị di động: Tự động bổ sung cần điều khiển ảo (Virtual Joystick) trên màn hình cảm ứng để di chuyển và vuốt xoay camera.
  - [ ] Tối ưu hóa kích thước file: Nén Draco toàn bộ file 3D, chuyển texture sang `.webp`.
  - [ ] Màn hình Loading mở đầu với hoạt cảnh giới thiệu siêu thị và tiến trình nạp (%).
  - [ ] Build dự án bằng `vite build` và triển khai lên **Vercel** hoặc **Cloudflare Pages** với tên miền tùy chỉnh.
* **Nghiệm vụ**: Mở link web trên điện thoại iPhone/Android chạy mượt mà ở cả chế độ 2D và 3D.

---

## 8. BẢNG TIẾN ĐỘ VÀ PHÂN BỔ CÔNG VIỆC

| Giai đoạn | Trọng tâm công việc | Thời gian | Kết quả bàn giao (Deliverable) |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | Base Dual-Mode 2D & 3D, Giỏ hàng dùng chung | 3 - 5 ngày | Web chuyển đổi mượt 2D $\leftrightarrow$ 3D, giỏ hàng đồng bộ 100% |
| **Giai đoạn 2** | Gian hàng 3D mẫu & GPU Instancing | 5 - 7 ngày | 1 lối đi siêu thị chứa 2,000+ món hàng đạt 60 FPS |
| **Giai đoạn 3** | Raycasting nhặt đồ & Inspector 360° | 5 - 7 ngày | Click nhặt đồ trên kệ, xem chi tiết sản phẩm xoay 3D |
| **Giai đoạn 4** | Dẫn đường "Tìm trên kệ" & NavMesh | 7 - 10 ngày | Vệt sáng chỉ đường tới đúng vị trí kệ chứa món hàng |
| **Giai đoạn 5** | Xe đẩy hàng & Quầy tính tiền VietQR | 5 - 7 ngày | Mô phỏng quét mã vạch và tạo mã VietQR thanh toán VNĐ |
| **Giai đoạn 6** | Tối ưu Mobile, LOD & Triển khai Public | 5 - 7 ngày | Deploy bản hoàn chỉnh lên Vercel/Cloudflare, chạy tốt trên di động |

---

## 9. KẾT LUẬN

Ý tưởng **SmartMart 3D** với mô hình **Mua Sắm Lai (Hybrid: 2D Mua Nhanh + 3D Khám Phá)** là hướng đi chuẩn xác nhất cho thương mại điện tử thế hệ mới tại Việt Nam:

1. **Khả thi 100%**: Không bị sa lầy vào việc phải mô hình hóa hàng vạn sản phẩm 3D.
2. **Trải nghiệm khách hàng tối ưu**: Ai thích nhanh thì dùng 2D, ai thích trải nghiệm thì vào 3D.
3. **Giá trị ứng dụng cao**: Rất hấp dẫn đối với các chuỗi siêu thị bán lẻ, chuỗi cửa hàng tiện lợi hoặc các thương hiệu muốn tạo chiến dịch tiếp thị mang tính đột phá và ấn tượng.
