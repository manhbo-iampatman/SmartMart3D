import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupermarketStructure } from "../components/3d/SupermarketStructure";
import { STORE_COLUMNS } from "../data/storeLayout";

// Mock @react-three/drei để test trong jsdom
vi.mock("@react-three/drei", () => ({
  Text: ({ children, ...props }: any) => <span data-testid="3d-text" {...props}>{children}</span>,
  RoundedBox: ({ children, ...props }: any) => <div data-testid="rounded-box" {...props}>{children}</div>,
}));

describe("SupermarketStructure - Vỏ công trình kiến trúc đại siêu thị 40m x 54m (Phase 1)", () => {
  it("hiển thị khẩu hiệu chào đón khách hàng tại sảnh đón tiếp chính (Entrance Concourse)", () => {
    render(<SupermarketStructure />);

    expect(screen.getByText("WELCOME TO SMARTMART 3D HYPERMARKET")).toBeInTheDocument();
    expect(screen.getAllByText("SMARTMART 3D HYPERMARKET").length).toBeGreaterThan(0);
    expect(screen.getByText("ĐẠI SIÊU THỊ KHÔNG GIAN TƯƠNG LAI")).toBeInTheDocument();
  });

  it("khởi tạo đủ 12 cột kết cấu chịu lực chuẩn xác với biển định vị từ C-01 đến C-12", () => {
    render(<SupermarketStructure />);

    expect(STORE_COLUMNS.length).toBe(12);
    for (let i = 1; i <= 12; i++) {
      const code = `C-${String(i).padStart(2, "0")}`;
      // Mỗi cột có 2 mặt biển (+Z và -Z)
      const elements = screen.getAllByText(code);
      expect(elements.length).toBe(2);
    }
  });
});

