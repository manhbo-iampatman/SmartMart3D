import React from "react";
import { HeaderNavbar } from "./components/shared/HeaderNavbar";
import { CartDrawer } from "./components/shared/CartDrawer";
import { CheckoutModal } from "./components/shared/CheckoutModal";
import { CartFeedback } from "./components/shared/CartFeedback";
import { QuickShopView } from "./components/2d/QuickShopView";
import { Scene3D } from "./components/3d/Scene3D";
import { ProductInspector3D } from "./components/3d/ProductInspector3D";
import { useAppStore } from "./stores/useAppStore";

export const App: React.FC = () => {
  const { mode, isCartOpen, setIsCartOpen } = useAppStore();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 text-white flex flex-col font-sans select-none">
      {/* 1. Header Navbar dùng chung cho cả 2D và 3D */}
      <HeaderNavbar />

      {/* 2. Nội dung chính: Tùy biến theo chế độ đang chọn */}
      <main className="flex-1 relative overflow-hidden">
        {mode === "2D" ? (
          <div className="w-full h-full overflow-y-auto p-4 md:p-6 bg-slate-100 text-slate-800">
            <QuickShopView />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <Scene3D />
          </div>
        )}
      </main>

      {/* 3. Modal xem chi tiết 3D sản phẩm (hoạt động ở cả 2D và 3D) */}
      <ProductInspector3D />

      {/* 4. Giỏ hàng chung (Drawer luôn đồng bộ dữ liệu) */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* 5. Modal quầy thanh toán tự động VietQR */}
      <CheckoutModal />
      <CartFeedback />
    </div>
  );
};

export default App;

