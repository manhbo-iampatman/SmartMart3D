import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadingScreen } from "../components/shared/LoadingScreen";

vi.mock("@react-three/drei", () => ({
  useProgress: () => ({
    active: true,
    progress: 68,
    loaded: 5,
    total: 8,
    errors: [],
  }),
}));

describe("LoadingScreen - Màn hình nạp tài nguyên 3D (Giai đoạn 6)", () => {
  it("hiển thị thương hiệu SmartMart3D và thông điệp khởi tạo", () => {
    render(<LoadingScreen />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/SmartMart/i)).toBeInTheDocument();
    expect(screen.getByText(/Đang khởi tạo không gian 3D/i)).toBeInTheDocument();
    expect(screen.getByText(/Máy tính \(Desktop\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Điện thoại \(Mobile\)/i)).toBeInTheDocument();
  });
});

