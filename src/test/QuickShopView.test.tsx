import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QuickShopView } from "../components/2d/QuickShopView";
import { useAppStore } from "../stores/useAppStore";
import { useCartStore } from "../stores/useCartStore";
import { useNavigationStore } from "../stores/useNavigationStore";
import { STORE_ZONES_CONFIG } from "../data/storeZones";
import { isWalkable } from "../utils/pathfinding";

describe("QuickShopView - Màn hình Mua Nhanh 2D (Phase 1)", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useAppStore.setState({
      mode: "2D",
      searchQuery: "",
      selectedCategory: "Tất cả",
    });
  });

  it("hiển thị banner giới thiệu mô hình Hybrid và nút chuyển sang 3D", () => {
    render(<QuickShopView />);

    expect(
      screen.getByText(/Mô hình Mua Sắm Lai \(Hybrid 2D & 3D\) đầu tiên tại Việt Nam/i)
    ).toBeInTheDocument();

    const switch3DButton = screen.getByRole("button", {
      name: /bước vào siêu thị 3d ngay/i,
    });
    expect(switch3DButton).toBeInTheDocument();

    fireEvent.click(switch3DButton);
    expect(useAppStore.getState().mode).toBe("3D");
  });

  it("hiển thị danh sách đầy đủ 24 sản phẩm hợp nhất (12 Tạp hóa + 6 Nông sản + 6 Thời trang)", () => {
    render(<QuickShopView />);
    expect(screen.getByText("Danh Sách Nhu Yếu Phẩm (24)")).toBeInTheDocument();

    // Kiểm tra lọc nhanh ngành hàng Thời Trang & Phụ Kiện
    const apparelBtn = screen.getByRole("button", { name: "Thời Trang & Phụ Kiện" });
    fireEvent.click(apparelBtn);
    expect(screen.getByText("Danh Sách Nhu Yếu Phẩm (6)")).toBeInTheDocument();
    expect(screen.getByText("Giày Thể Thao Ultralite Running (Xanh Cobalt)")).toBeInTheDocument();
  });

  it("lọc sản phẩm theo danh mục khi click vào nút ngành hàng", () => {
    render(<QuickShopView />);

    const drinkCategoryBtn = screen.getByRole("button", { name: "Nước Giải Khát" });
    expect(drinkCategoryBtn).toBeInTheDocument();

    fireEvent.click(drinkCategoryBtn);

    expect(useAppStore.getState().selectedCategory).toBe("Nước Giải Khát");
    // Kiểm tra có Coca-Cola và Sting
    expect(screen.getByText("Nước Ngọt Coca-Cola Vị Nguyên Bản")).toBeInTheDocument();
    expect(screen.getByText("Nước Tăng Lực Sting Dâu Tây Đỏ")).toBeInTheDocument();
    // Không còn Vinamilk
    expect(screen.queryByText("Sữa Tươi Tiệt Trùng Vinamilk 100% 1L")).not.toBeInTheDocument();
  });

  it("lọc sản phẩm theo từ khóa tìm kiếm", () => {
    useAppStore.setState({ searchQuery: "Hảo Hảo" });
    render(<QuickShopView />);

    expect(screen.getByText("Mì Tôm Chua Cay Hảo Hảo 75g")).toBeInTheDocument();
    expect(screen.queryByText("Sữa Tươi Tiệt Trùng Vinamilk 100% 1L")).not.toBeInTheDocument();
    expect(screen.getByText(/Kết quả tìm kiếm cho:/i)).toBeInTheDocument();
  });

  it("hiển thị thông báo khi không tìm thấy sản phẩm nào khớp", () => {
    useAppStore.setState({ searchQuery: "sản phẩm không hề tồn tại 9999" });
    render(<QuickShopView />);

    expect(screen.getByText("Không tìm thấy sản phẩm phù hợp")).toBeInTheDocument();
    expect(screen.getByText("Danh Sách Nhu Yếu Phẩm (0)")).toBeInTheDocument();
  });

  it("Phase 9 Gate 1: tách biệt 24 sản phẩm vào đúng 5 phân khu độc lập, không gộp thực phẩm và hóa phẩm", () => {
    render(<QuickShopView />);

    const expectedCounts: Record<string, number> = {
      "zone-produce": 6,
      "zone-beverages-dairy": 6,
      "zone-pantry-snacks": 5,
      "zone-apparel": 6,
      "zone-homecare": 1,
    };

    let totalRendered = 0;
    for (const zone of STORE_ZONES_CONFIG) {
      const section = screen.getByTestId(`department-section-${zone.id}`);
      expect(section.tagName).toBe("SECTION");
      const cards = within(section).getAllByRole("article");
      expect(cards).toHaveLength(expectedCounts[zone.id]);
      totalRendered += cards.length;
    }
    expect(totalRendered).toBe(24);

    // Đảm bảo Hóa phẩm (OMO Matic) nằm riêng ở zone-homecare, không trộn vào Thực phẩm/Nông sản
    const homecareSection = screen.getByTestId("department-section-zone-homecare");
    const produceSection = screen.getByTestId("department-section-zone-produce");
    const pantrySection = screen.getByTestId("department-section-zone-pantry-snacks");

    expect(within(homecareSection).getByText(/OMO Matic/i)).toBeInTheDocument();
    expect(within(produceSection).queryByText(/OMO Matic/i)).not.toBeInTheDocument();
    expect(within(pantrySection).queryByText(/OMO Matic/i)).not.toBeInTheDocument();
  });

  it("Phase 9 Gate 1: ẩn hoàn toàn các phân khu rỗng khi lọc danh mục ngành hàng", () => {
    useAppStore.setState({ selectedCategory: "Gia Vị & Nông Sản" });
    render(<QuickShopView />);

    expect(screen.getByTestId("department-section-zone-produce")).toBeInTheDocument();
    expect(screen.queryByTestId("department-section-zone-beverages-dairy")).not.toBeInTheDocument();
    expect(screen.queryByTestId("department-section-zone-pantry-snacks")).not.toBeInTheDocument();
    expect(screen.queryByTestId("department-section-zone-apparel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("department-section-zone-homecare")).not.toBeInTheDocument();
  });

  it("Phase 9 Gate 1: tất cả entry3D của 5 khu đều walkable và nút Dạo khu này trong 3D kích hoạt goToZoneIn3D", () => {
    for (const zone of STORE_ZONES_CONFIG) {
      expect(isWalkable({ x: zone.entry3D.x, z: zone.entry3D.z })).toBe(true);
    }

    useAppStore.setState({ isCartOpen: true, isCheckoutOpen: true });
    render(<QuickShopView />);

    const produceSection = screen.getByTestId("department-section-zone-produce");
    const jump3DBtn = within(produceSection).getByRole("button", { name: /dạo khu này trong 3d/i });
    fireEvent.click(jump3DBtn);

    const appState = useAppStore.getState();
    const navState = useNavigationStore.getState();
    const produceZone = STORE_ZONES_CONFIG[0];

    expect(appState.mode).toBe("3D");
    expect(appState.isCartOpen).toBe(false);
    expect(appState.isCheckoutOpen).toBe(false);
    expect(navState.player).toEqual({ x: produceZone.entry3D.x, z: produceZone.entry3D.z });
    expect(navState.heading).toBeCloseTo(produceZone.entry3D.heading);
  });
});

