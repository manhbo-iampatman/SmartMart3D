import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AisleGondola, SingleGondola, OverheadLcdDisplay } from "../components/3d/AisleGondola";

// Mock @react-three/drei để test trong jsdom
vi.mock("@react-three/drei", () => ({
  Text: ({ children, ...props }: any) => <span data-testid="3d-text" {...props}>{children}</span>,
  RoundedBox: ({ children, ...props }: any) => <div data-testid="rounded-box" {...props}>{children}</div>,
}));

describe("AisleGondola - Hệ thống Dãy Kệ Tạp Hóa Chuẩn Hóa & Mở Rộng (Phase 2)", () => {
  it("khởi tạo đầy đủ 4 dãy kệ trung tâm chính (A01 - A04) và các dãy mở rộng có lối cắt ngang (A05 - A08)", () => {
    render(<AisleGondola />);

    // Kiểm tra các mã biển định danh đầu kệ từ A01 đến A08
    ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08"].forEach((code) => {
      const badges = screen.getAllByText(code);
      expect(badges.length).toBeGreaterThan(0);
    });

    // Kiểm tra tên các ngành hàng hiển thị trên biển đầu kệ
    expect(screen.getAllByText("NƯỚC GIẢI KHÁT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SỮA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BÁNH KẸO").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GIA VỊ").length).toBeGreaterThan(0);
  });

  it("hiển thị 2 màn hình LCD kỹ thuật số treo trần quảng bá sản phẩm trọng tâm", () => {
    render(<AisleGondola />);

    expect(screen.getAllByText("SmartMart ★ GROCERY FOCUS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Yến Mạch Úc Rolled Oats 500g").length).toBeGreaterThan(0);
    expect(screen.getAllByText("36.000 đ").length).toBeGreaterThan(0);

    expect(screen.getAllByText("SmartMart ★ FRESH PROMO").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bánh Choco-Pie Hộp 12 Cái").length).toBeGreaterThan(0);
    expect(screen.getAllByText("62.000 đ").length).toBeGreaterThan(0);
  });

  it("SingleGondola render chuẩn vách ngăn và nẹp ray giá liên tục", () => {
    const { container } = render(
      <SingleGondola
        position={[0, 0, 0]}
        aisleCode="A09"
        categoryName="THỰC PHẨM CHỨC NĂNG"
      />
    );

    expect(screen.getAllByText("A09").length).toBe(2);
    expect(container).toBeInTheDocument();
  });
});

