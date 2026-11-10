import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FloorPlanMap, FAST_TRAVEL_LANDMARKS } from "../components/3d/FloorPlanMap";
import { useAppStore } from "../stores/useAppStore";
import { useNavigationStore } from "../stores/useNavigationStore";
import { isWalkable } from "../utils/pathfinding";

describe("FloorPlanMap - Bản đồ tương tác & Fast-Travel (Sprint 1)", () => {
  beforeEach(() => {
    act(() => {
      useNavigationStore.setState(useNavigationStore.getInitialState(), true);
      useAppStore.setState({
        mode: "3D",
        fastTravelTarget: null,
        activeNavigationProduct: null,
      });
    });
  });

  it("hiển thị đầy đủ 6 nút địa điểm dịch chuyển nhanh (Fast-Travel landmarks)", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    expect(screen.getByText("Sơ đồ SmartMart")).toBeInTheDocument();
    expect(screen.getByText("2026 Radar")).toBeInTheDocument();
    expect(screen.getByText(/Dịch chuyển nhanh \(Fast-Travel\)/i)).toBeInTheDocument();

    FAST_TRAVEL_LANDMARKS.forEach((landmark) => {
      const shortName = landmark.name.split(":")[0];
      expect(screen.getByText(shortName)).toBeInTheDocument();
      expect(isWalkable({ x: landmark.x, z: landmark.z }), `Landmark ${landmark.id} phải đứng ở vị trí đi bộ được`).toBe(true);
    });
  });

  it("click nút địa danh kích hoạt triggerFastTravel tới Tủ Đông tường Bắc và Bánh Mì Deli (Phase 7)", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    // Click vào Tủ Đông Lạnh ở tường Bắc (đã di dời từ z = -6.1)
    const freezerBtn = screen.getByTitle("Dịch chuyển nhanh đến Tủ Đông Lạnh");
    fireEvent.click(freezerBtn);

    const storeState = useAppStore.getState();
    expect(storeState.fastTravelTarget).toEqual({
      x: -10.3,
      z: -23.8,
      heading: 0,
      label: "Tủ Đông Lạnh",
    });

    expect(screen.getByText(/Đang bay tới Tủ Đông Lạnh/i)).toBeInTheDocument();
  });

  it("click quầy Bánh Mì & Deli kích hoạt dịch chuyển tới tường Bắc và không còn Thu Ngân 04 / Ụ Khuyến Mãi", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    expect(screen.queryByTitle(/Thu Ngân 04/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Ụ Khuyến Mãi/i)).not.toBeInTheDocument();

    const bakeryBtn = screen.getByTitle("Dịch chuyển nhanh đến Bánh Mì & Deli");
    fireEvent.click(bakeryBtn);

    expect(useAppStore.getState().fastTravelTarget).toEqual({
      x: 10.4,
      z: -23.8,
      heading: 0,
      label: "Bánh Mì & Deli",
    });
  });

  it("click khu Thời Trang kích hoạt dịch chuyển tới sàn gỗ khu may mặc (Phase 4)", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    const apparelBtn = screen.getByTitle("Dịch chuyển nhanh đến Thời Trang");
    fireEvent.click(apparelBtn);

    expect(useAppStore.getState().fastTravelTarget).toEqual({
      x: 11.0,
      z: 7.5,
      heading: -Math.PI / 2,
      label: "Thời Trang",
    });
  });

  it("click Kiosk Sảnh Nam và Chuồng Xe Đẩy kích hoạt dịch chuyển tới khu Thanh toán Phase 5", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    fireEvent.click(screen.getByTitle("Dịch chuyển nhanh đến Kiosk Sảnh Nam"));
    expect(useAppStore.getState().fastTravelTarget).toEqual({
      x: -6.5,
      z: 14.8,
      heading: Math.PI,
      label: "Kiosk Sảnh Nam",
    });

    fireEvent.click(screen.getByTitle("Dịch chuyển nhanh đến Chuồng Xe Đẩy"));
    expect(useAppStore.getState().fastTravelTarget).toEqual({
      x: -15.5,
      z: 19.2,
      heading: Math.PI,
      label: "Chuồng Xe Đẩy",
    });
  });

  it("nhấn phím Escape đóng bản đồ khi không mở modal", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledOnce();
  });
});

