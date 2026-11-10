import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => {},
  useThree: () => ({
    camera: new THREE.PerspectiveCamera(65, 16 / 9, 0.1, 100),
    gl: { domElement: document.createElement("canvas") },
    scene: new THREE.Scene(),
  }),
}));

vi.mock("@react-three/drei", () => ({
  Text: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("span", { "data-testid": "3d-text" }, children),
  RoundedBox: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "rounded-box" }, children),
}));

import { CAMERA_PRESETS } from "../data/cameraPresets";
import { STORE_LAYOUT } from "../data/storeLayout";
import { useAppStore } from "../stores/useAppStore";
import { findPath, isWalkable } from "../utils/pathfinding";
import {
  GROCERY_ATLAS_TILES,
  getDepartmentBannerAtlasTexture,
  getGroceryTextureAtlas,
  remapGeometryToAtlasTile,
} from "../utils/textureAtlasGenerator";
import { SupermarketStructure } from "../components/3d/SupermarketStructure";
import { AisleGondola } from "../components/3d/AisleGondola";
import { InstancedStock } from "../components/3d/InstancedStock";
import { StoreFixtures } from "../components/3d/StoreFixtures";
import { ProduceSection } from "../components/3d/ProduceSection";
import { ApparelSection } from "../components/3d/ApparelSection";
import { CheckoutBank } from "../components/3d/CheckoutBank";
import { CartCorral } from "../components/3d/CartCorral";
import { ShoppingTrolley } from "../components/3d/ShoppingTrolley";
import { FloorPlanMap } from "../components/3d/FloorPlanMap";

function countRenderableDrawUnits(container: HTMLElement): number {
  return container.querySelectorAll('mesh, instancedmesh, [data-testid="rounded-box"]').length;
}

describe("Phase 6 - Visual Parity, Atlas UVs, 6 Camera Presets, A* Cache & Draw Call Gate", () => {
  it("1. Texture Atlas 2048x2048 & Banner Atlas 1024x512 giữ nguyên UV trong [0..1] cho toàn bộ tile", () => {
    const atlas1 = getGroceryTextureAtlas();
    const atlas2 = getGroceryTextureAtlas();
    expect(atlas1).toBe(atlas2);
    expect(atlas1).toBeInstanceOf(THREE.Texture);

    const banner1 = getDepartmentBannerAtlasTexture([
      { aisleNumber: "01", title: "ĐỒ UỐNG", subtitle: "Coca", color: "#1d4ed8" },
      { aisleNumber: "02", title: "SỮA", subtitle: "Vinamilk", color: "#ea580c" },
      { aisleNumber: "03", title: "BÁNH KẸO", subtitle: "Oreo", color: "#7c3aed" },
      { aisleNumber: "04", title: "GIA VỊ", subtitle: "Simply", color: "#059669" },
    ]);
    expect(banner1).toBeInstanceOf(THREE.Texture);

    Object.values(GROCERY_ATLAS_TILES).forEach((tileIndex) => {
      const geo = remapGeometryToAtlasTile(new THREE.BoxGeometry(0.1, 0.2, 0.1), tileIndex, 4, 2);
      const uv = geo.attributes.uv;
      expect(uv.count).toBeGreaterThan(0);

      const expectedCol = tileIndex % 4;
      const expectedRow = Math.floor(tileIndex / 4);
      const uMinBound = expectedCol / 4;
      const uMaxBound = (expectedCol + 1) / 4;
      const vMinBound = 1 - (expectedRow + 1) / 2;
      const vMaxBound = 1 - expectedRow / 2;

      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i);
        const v = uv.getY(i);
        expect(Number.isFinite(u)).toBe(true);
        expect(Number.isFinite(v)).toBe(true);
        expect(u).toBeGreaterThanOrEqual(uMinBound);
        expect(u).toBeLessThanOrEqual(uMaxBound);
        expect(v).toBeGreaterThanOrEqual(vMinBound);
        expect(v).toBeLessThanOrEqual(vMaxBound);
      }
    });
  });

  it("2. 6 Camera Presets chuẩn đối chiếu (01-overview ẩn trần; 02..06 đều walkable)", () => {
    expect(CAMERA_PRESETS.length).toBe(6);

    const overview = CAMERA_PRESETS[0];
    expect(overview.id).toBe("01-overview");
    expect(overview.isAerial).toBe(true);
    expect(overview.hideCeiling).toBe(true);

    for (const preset of CAMERA_PRESETS.slice(1)) {
      const walkable = isWalkable({ x: preset.position[0], z: preset.position[2] }, STORE_LAYOUT);
      expect(walkable, `Preset ${preset.id} phải đứng ở tọa độ walkable`).toBe(true);
      expect(preset.position[1]).toBeGreaterThanOrEqual(1.5);
    }

    act(() => {
      useAppStore.getState().activateCameraPreset(overview);
    });
    expect(useAppStore.getState().isOverviewMode).toBe(true);
    expect(useAppStore.getState().activePresetTarget?.id).toBe("01-overview");

    act(() => {
      useAppStore.getState().activateCameraPreset(CAMERA_PRESETS[1]);
    });
    expect(useAppStore.getState().isOverviewMode).toBe(false);
    expect(useAppStore.getState().activePresetTarget?.id).toBe("02-entrance");
  });

  it("3. FloorPlanMap hỗ trợ chuyển Tab giữa Khu vực (mặc định) và 6 Góc nhìn", () => {
    const onClose = vi.fn();
    render(React.createElement(FloorPlanMap, { onClose }));

    // Tab Khu vực hiển thị mặc định để không phá vỡ bài kiểm tra Fast-Travel
    expect(screen.getByText(/Dịch chuyển nhanh \(Fast-Travel\)/i)).toBeInTheDocument();

    // Chuyển sang Tab 6 Góc nhìn
    fireEvent.click(screen.getByText("6 Góc nhìn"));
    for (const preset of CAMERA_PRESETS) {
      expect(screen.getByText(preset.label)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByText(CAMERA_PRESETS[0].label));
    expect(useAppStore.getState().isOverviewMode).toBe(true);
    expect(useAppStore.getState().activePresetTarget?.id).toBe("01-overview");
  });

  it("4. A* WeakMap Grid Cache tìm đường ấm dưới 3ms và vô hiệu hóa sạch khi layout thay đổi", () => {
    // Warm up grid cache với tọa độ walkable của sảnh chính, Rau củ & Thời trang
    const warmUp = findPath({ x: 0, z: 22.8 }, { x: 10.5, z: -8.0 }, STORE_LAYOUT);
    expect(warmUp).not.toBeNull();

    const startTime = performance.now();
    for (let i = 0; i < 10; i++) {
      const p1 = findPath({ x: 0, z: 22.8 }, { x: 10.5, z: -8.0 }, STORE_LAYOUT);
      const p2 = findPath({ x: -6.5, z: 14.8 }, { x: 11.0, z: 7.5 }, STORE_LAYOUT);
      expect(p1).not.toBeNull();
      expect(p2).not.toBeNull();
    }
    const avgMs = (performance.now() - startTime) / 20;
    expect(avgMs).toBeLessThan(3);

    // Đảm bảo layout mới không dùng nhầm cache cũ
    const customLayout = {
      ...STORE_LAYOUT,
      obstacles: [
        ...STORE_LAYOUT.obstacles,
        { id: "blocker-test", kind: "rect" as const, x: 0, z: 10, width: 3.8, depth: 1.0 },
      ],
    };
    expect(isWalkable({ x: 0, z: 10 }, customLayout)).toBe(false);
    expect(isWalkable({ x: 0, z: 10 }, STORE_LAYOUT)).toBe(true);
  });

  it("5. Kiểm toán tổng số renderable meshes + instancedMeshes toàn cảnh Scene3D <= 75", () => {
    const structureView = render(React.createElement(SupermarketStructure));
    const gondolaView = render(React.createElement(AisleGondola));
    const stockView = render(React.createElement(InstancedStock));
    // StoreFixtures đã bao gồm SelfCheckoutScanner3D bên trong
    const fixturesView = render(React.createElement(StoreFixtures));
    const produceView = render(React.createElement(ProduceSection));
    const apparelView = render(React.createElement(ApparelSection));
    const checkoutBankView = render(React.createElement(CheckoutBank));
    const corralView = render(React.createElement(CartCorral));
    const trolleyView = render(React.createElement(ShoppingTrolley));

    const breakdown = {
      SupermarketStructure: countRenderableDrawUnits(structureView.container),
      AisleGondola: countRenderableDrawUnits(gondolaView.container),
      InstancedStock: countRenderableDrawUnits(stockView.container),
      "StoreFixtures+SelfCheckout04": countRenderableDrawUnits(fixturesView.container),
      ProduceSection: countRenderableDrawUnits(produceView.container),
      ApparelSection: countRenderableDrawUnits(apparelView.container),
      CheckoutBank: countRenderableDrawUnits(checkoutBankView.container),
      CartCorral: countRenderableDrawUnits(corralView.container),
      ShoppingTrolley: countRenderableDrawUnits(trolleyView.container),
    };

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    console.info(`[Phase 6 Renderable Audit] Total=${total}/75`, JSON.stringify(breakdown));
    expect(total).toBeGreaterThan(20);
    expect(total).toBeLessThanOrEqual(75);
  });
});
