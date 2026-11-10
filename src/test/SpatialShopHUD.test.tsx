import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SpatialShopHUD } from "../components/3d/SpatialShopHUD";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { useAppStore } from "../stores/useAppStore";
import { useCartStore } from "../stores/useCartStore";
import { useNavigationStore } from "../stores/useNavigationStore";
import { ENTRANCE } from "../data/storeLayout";

const haoHao = MOCK_PRODUCTS.find(
  (product) => product.id === "prod-noodle-haohao"
)!;

describe("SpatialShopHUD - giao diện mua sắm trong không gian 3D", () => {
  beforeEach(() => {
    act(() => {
      useNavigationStore.setState(useNavigationStore.getInitialState(), true);
      useCartStore.getState().clearCart();
      useAppStore.setState({
        mode: "3D",
        isCartOpen: false,
        isCheckoutOpen: false,
        hoveredProduct: null,
        activeNavigationProduct: null,
        target3DPosition: null,
      });
    });
  });

  it("tìm sản phẩm trên kệ và kích hoạt dẫn đường 3D", () => {
    render(<SpatialShopHUD />);

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /tìm sản phẩm trong siêu thị 3d/i,
      }),
      { target: { value: "Hảo Hảo" } }
    );

    expect(screen.getByText(haoHao.name)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`${haoHao.name}.*Dẫn đường`, "i"),
      })
    );

    expect(useAppStore.getState().activeNavigationProduct?.id).toBe(
      haoHao.id
    );
    expect(useAppStore.getState().target3DPosition).toBeNull();
    expect(useNavigationStore.getState().path[0]).toEqual(ENTRANCE);
    expect(screen.getByText("Đang dẫn đến kệ")).toBeInTheDocument();
  });

  it("mở minimap và cho phép dừng dẫn đường", () => {
    act(() => {
      useAppStore.getState().goToProductIn3D(haoHao);
    });
    render(<SpatialShopHUD />);

    fireEvent.click(
      screen.getByRole("button", { name: /mở bản đồ siêu thị/i })
    );
    expect(screen.getByText("Sơ đồ SmartMart")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Vị trí sản phẩm đang dẫn đường")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /dừng dẫn đường/i })
    );
    expect(useAppStore.getState().activeNavigationProduct).toBeNull();
    expect(useNavigationStore.getState().path).toEqual([]);
  });

  it("đồng bộ giỏ hàng và mở thẳng quầy thanh toán từ HUD", () => {
    act(() => {
      useCartStore.getState().addItem(haoHao);
      useCartStore.getState().addItem(haoHao);
    });
    render(<SpatialShopHUD />);

    expect(screen.getByText("9.000 đ")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: /mở giỏ hàng, 2 sản phẩm/i,
      })
    );
    expect(useAppStore.getState().isCartOpen).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: /tới quầy thanh toán/i })
    );
    expect(useAppStore.getState().isCheckoutOpen).toBe(true);
  });

  it("tìm không dấu và chuyển sản phẩm chưa có 3D sang mua nhanh, không mất giỏ", () => {
    const rice = MOCK_PRODUCTS.find((product) => product.id === "prod-rice-st25")!;
    useCartStore.getState().addItem(haoHao);
    render(<SpatialShopHUD />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "gao st25" } });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`${rice.name}.*Mua nhanh 2D`, "i") }));
    expect(useAppStore.getState().mode).toBe("2D");
    expect(useAppStore.getState().searchQuery).toBe(rice.name);
    expect(useAppStore.getState().selectedCategory).toBe("Tất cả");
    expect(useCartStore.getState().getTotalItems()).toBe(1);
  });

  it("chọn sản phẩm trên bản đồ và bật/dừng tự đi bằng nút HUD", () => {
    render(<SpatialShopHUD />);
    fireEvent.click(screen.getByRole("button", { name: /mở bản đồ siêu thị/i }));
    fireEvent.click(screen.getByRole("button", { name: `Dẫn đường đến ${haoHao.name}` }));
    expect(useAppStore.getState().activeNavigationProduct?.id).toBe(haoHao.id);
    expect(screen.getByLabelText("Đường đi đến kệ")).toBeInTheDocument();
    expect(screen.getByLabelText("Vị trí của bạn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tự động đi tới kệ/i }));
    expect(useNavigationStore.getState().autoWalking).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /dừng tự đi/i }));
    expect(useNavigationStore.getState().autoWalking).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /phóng to bản đồ/i }));
    expect(screen.getByRole("button", { name: /thu nhỏ bản đồ/i })).toBeInTheDocument();
  });

  it("bật tắt âm thanh siêu thị bằng nút Volume trên thanh HUD", () => {
    useAppStore.setState({ isAudioMuted: false });
    render(<SpatialShopHUD />);

    const muteBtn = screen.getByRole("button", { name: /tắt âm thanh siêu thị/i });
    expect(muteBtn).toBeInTheDocument();

    fireEvent.click(muteBtn);
    expect(useAppStore.getState().isAudioMuted).toBe(true);
    expect(screen.getByRole("button", { name: /bật âm thanh siêu thị/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /bật âm thanh siêu thị/i }));
    expect(useAppStore.getState().isAudioMuted).toBe(false);
  });
});
