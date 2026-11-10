import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { SupermarketStructure, buildContactAOMatrices } from "../components/3d/SupermarketStructure";
import { STORE_COLUMNS } from "../data/storeLayout";
import {
  bakeHypermarketEnvironment,
  createHypermarketEnvironmentScene,
  disposeEnvironmentScene,
} from "../utils/hypermarketEnvironment";

// Mock @react-three/drei để test trong jsdom
vi.mock("@react-three/drei", () => ({
  Text: ({ children, ...props }: any) => <span data-testid="3d-text" {...props}>{children}</span>,
  RoundedBox: ({ children, ...props }: any) => <div data-testid="rounded-box" {...props}>{children}</div>,
}));

describe("SupermarketStructure - Vỏ công trình kiến trúc đại siêu thị 40m x 54m (Phase 1 -> Phase 8)", () => {
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

  it("Gate 2 & 4 Phase 8: dựng Hypermarket IBL (8 dải đèn), dispose sạch tài nguyên & Contact AO >= 50 ma trận hợp lệ", () => {
    const envScene = createHypermarketEnvironmentScene();
    let meshCount = 0;
    let disposeCalls = 0;
    envScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshCount += 1;
        const origGeoDispose = obj.geometry.dispose.bind(obj.geometry);
        obj.geometry.dispose = () => {
          disposeCalls += 1;
          origGeoDispose();
        };
      }
    });
    expect(meshCount).toBe(17); // 6 vỏ hộp + 3 accent + 8 máng đèn trần HDR
    disposeEnvironmentScene(envScene);
    expect(disposeCalls).toBe(17);

    // Fallback an toàn trong JSDOM không có WebGL context
    expect(bakeHypermarketEnvironment({} as THREE.WebGLRenderer)).toBeNull();

    // Kiểm tra Contact AO Floor Matrices không NaN, scale > 0, ở cao độ y = 0.0065
    const aoMatrices = buildContactAOMatrices();
    expect(aoMatrices.length).toBeGreaterThanOrEqual(50);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    for (const mat of aoMatrices) {
      mat.decompose(pos, quat, scale);
      expect(Number.isFinite(pos.x) && Number.isFinite(pos.z)).toBe(true);
      expect(pos.y).toBeCloseTo(0.0065);
      expect(scale.x).toBeGreaterThan(0.5);
      expect(scale.y).toBeGreaterThan(0.5);
    }
  });
});

