import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FloorPlanMap, FAST_TRAVEL_LANDMARKS } from "../components/3d/FloorPlanMap";
import { useAppStore } from "../stores/useAppStore";
import { useNavigationStore } from "../stores/useNavigationStore";

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
    });
  });

  it("click nút địa danh kích hoạt triggerFastTravel tới đúng tọa độ", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    // Click vào Tủ Đông Lạnh
    const freezerBtn = screen.getByTitle("Dịch chuyển nhanh đến Tủ Đông Lạnh");
    fireEvent.click(freezerBtn);

    const storeState = useAppStore.getState();
    expect(storeState.fastTravelTarget).toEqual({
      x: 0,
      z: -4.8,
      heading: Math.PI,
      label: "Tủ Đông Lạnh",
    });

    expect(screen.getByText(/Đang bay tới Tủ Đông Lạnh/i)).toBeInTheDocument();
  });

  it("click quầy Self-Checkout kích hoạt dịch chuyển về trạm tính tiền", () => {
    const handleClose = vi.fn();
    render(<FloorPlanMap onClose={handleClose} />);

    const checkoutBtn = screen.getByTitle("Dịch chuyển nhanh đến Thu Ngân 04");
    fireEvent.click(checkoutBtn);

    expect(useAppStore.getState().fastTravelTarget).toEqual({
      x: 0,
      z: -3.4,
      heading: Math.PI,
      label: "Thu Ngân 04",
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

