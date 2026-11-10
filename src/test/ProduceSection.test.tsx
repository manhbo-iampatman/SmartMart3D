import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { ProduceSection, buildProduceStockBatches } from "../components/3d/ProduceSection";
import { PRODUCE_TABLES_CONFIG, PRODUCE_WALL_MURALS } from "../data/produceLayout";
import { PRODUCE_PRODUCTS } from "../data/produceProducts";
import { findReachableProduct, PRODUCT_REACH_METERS } from "../utils/spatialInteraction";

// Mock @react-three/drei để test trong jsdom
vi.mock("@react-three/drei", () => ({
  Text: ({ children, ...props }: any) => <span data-testid="3d-text" {...props}>{children}</span>,
  RoundedBox: ({ children, ...props }: any) => <div data-testid="rounded-box" {...props}>{children}</div>,
}));

describe("ProduceSection - Phân Khu Rau Củ Quả Tươi Sống (Phase 3)", () => {
  it("khởi tạo đầy đủ 6 bàn trưng bày nan gỗ từ cấu hình dữ liệu produceLayout", () => {
    render(<ProduceSection />);

    expect(PRODUCE_TABLES_CONFIG.length).toBe(6);
    expect(PRODUCE_PRODUCTS.length).toBe(6);
  });

  it("hiển thị các bảng giá chân quỳ với tên nông sản và đơn vị VNĐ chuẩn xác", () => {
    render(<ProduceSection />);

    // Kiểm tra tên các loại nông sản chính hiển thị trên bảng giá
    expect(screen.getAllByText(/Ớt Chuông Đỏ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dưa Chuột Bao Tử/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Táo Đỏ Envy/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chanh Vàng/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bơ Sáp 034/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cà Chua Bi Ruby/i).length).toBeGreaterThan(0);

    // Kiểm tra giá tiền hiển thị đúng định dạng
    expect(screen.getAllByText(/48\.000 đ \/ kg/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/89\.000 đ \/ kg/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/42\.000 đ \/ Hộp 500g/i).length).toBeGreaterThan(0);
  });

  it("hiển thị 3 pano tranh tường Fresh picks và biển treo ngành hàng", () => {
    render(<ProduceSection />);

    expect(PRODUCE_WALL_MURALS.length).toBe(3);
    expect(screen.getByText("Fresh picks")).toBeInTheDocument();
    expect(screen.getByText("Farm to Table")).toBeInTheDocument();
    expect(screen.getByText("Daily Harvest")).toBeInTheDocument();

    // Biển treo ngành hàng 2 mặt
    expect(screen.getAllByText("RAU CỦ QUẢ TƯƠI SỐNG").length).toBe(2);
    expect(screen.getAllByText("FRESH PRODUCE & ORGANIC HARVEST").length).toBe(2);
  });

  it("gom hàng trăm quả nông sản vào đúng 6 THREE.InstancedMesh thật và tương tác Raycast 2.5m", () => {
    const { productBatches, stemMatrices } = buildProduceStockBatches(
      PRODUCE_TABLES_CONFIG,
      PRODUCE_PRODUCTS
    );

    expect(productBatches.length).toBe(6);
    expect(stemMatrices.length).toBeGreaterThan(0);

    const appleBatch = productBatches.find((b) => b.product.id === "prod-produce-apple")!;
    const scene = new THREE.Scene();
    const instancedMesh = new THREE.InstancedMesh(
      appleBatch.geometry,
      appleBatch.material,
      appleBatch.matrices.length
    );
    appleBatch.matrices.forEach((m, i) => instancedMesh.setMatrixAt(i, m));
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.computeBoundingBox();
    instancedMesh.computeBoundingSphere();
    instancedMesh.userData.product = appleBatch.product;
    scene.add(instancedMesh);
    scene.updateMatrixWorld(true);

    const pos = new THREE.Vector3().setFromMatrixPosition(appleBatch.matrices[0]);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(pos.x, pos.y + 1.0, pos.z),
      new THREE.Vector3(0, -1, 0),
      0,
      PRODUCT_REACH_METERS
    );
    const hit = findReachableProduct(ray, scene.children);
    expect(hit?.product.id).toBe("prod-produce-apple");
  });
});

