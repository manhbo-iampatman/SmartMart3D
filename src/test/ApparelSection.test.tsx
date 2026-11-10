import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { ApparelSection, buildApparelStockBatches } from "../components/3d/ApparelSection";
import {
  APPAREL_RACKS_CONFIG,
  APPAREL_TABLES_CONFIG,
  APPAREL_ZONE_BOUNDS,
} from "../data/apparelLayout";
import { APPAREL_PRODUCTS } from "../data/apparelProducts";
import { findReachableProduct, PRODUCT_REACH_METERS } from "../utils/spatialInteraction";

vi.mock("@react-three/drei", () => ({
  Text: ({ children, ...props }: any) => <span data-testid="3d-text" {...props}>{children}</span>,
  RoundedBox: ({ children, ...props }: any) => <div data-testid="rounded-box" {...props}>{children}</div>,
}));

describe("ApparelSection - Phân Khu Thời Trang & Phụ Kiện Sàn Gỗ (Phase 4)", () => {
  it("khởi tạo đầy đủ 4 giá treo chữ U & 4 bàn phụ kiện dưới trần hạ bậc (chiều cao < 1.4m)", () => {
    render(<ApparelSection />);

    expect(APPAREL_RACKS_CONFIG.length).toBe(4);
    expect(APPAREL_TABLES_CONFIG.length).toBe(4);
    expect(APPAREL_PRODUCTS.length).toBe(6);

    // Mọi vật thể thời trang phải giữ tầm nhìn mở (Low-profile sightlines < 1.4m)
    expect(APPAREL_ZONE_BOUNDS.maxFixtureHeight).toBeLessThan(1.4);
    APPAREL_RACKS_CONFIG.forEach((rack) => expect(rack.maxHeight).toBeLessThan(1.4));
    APPAREL_TABLES_CONFIG.forEach((table) => expect(table.maxHeight).toBeLessThan(1.4));

    // Biển 2 mặt Everyday clothing (4 giá x 2 mặt = 8) & Accessories (4 bàn x 2 mặt = 8)
    expect(screen.getAllByText("Everyday clothing").length).toBe(8);
    expect(screen.getAllByText("Accessories").length).toBe(8);
  });

  it("hiển thị đúng bảng giá VNĐ của các sản phẩm thời trang và phụ kiện", () => {
    render(<ApparelSection />);

    expect(screen.getByText("149.000 đ")).toBeInTheDocument();
    expect(screen.getByText("279.000 đ")).toBeInTheDocument();
    expect(screen.getByText("359.000 đ")).toBeInTheDocument();
    expect(screen.getByText("329.000 đ")).toBeInTheDocument();
    expect(screen.getAllByText("490.000 đ").length).toBe(4);
  });

  it("gom toàn bộ sản phẩm thời trang vào 6 THREE.InstancedMesh thật và hỗ trợ Raycast 2.5m", () => {
    const { productBatches, hangerMatrices, soleMatrices, visorMatrices } = buildApparelStockBatches(
      APPAREL_RACKS_CONFIG,
      APPAREL_TABLES_CONFIG,
      APPAREL_PRODUCTS
    );

    // Đúng 6 InstancedMesh tương ứng 6 SKU (hàng trăm sản phẩm chỉ tốn 6 draw calls)
    expect(productBatches.length).toBe(6);
    expect(hangerMatrices.length).toBe(46); // 12 + 12 + 10 + 12 móc treo
    expect(soleMatrices.length).toBeGreaterThan(0);
    expect(visorMatrices.length).toBeGreaterThan(0);

    // Kiểm tra raycast thật trên THREE.InstancedMesh
    const scene = new THREE.Scene();
    const targetBatch = productBatches.find((b) => b.product.id === "prod-apparel-sneaker")!;
    const instancedMesh = new THREE.InstancedMesh(
      targetBatch.geometry,
      targetBatch.material,
      targetBatch.matrices.length
    );
    targetBatch.matrices.forEach((m, i) => instancedMesh.setMatrixAt(i, m));
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.computeBoundingBox();
    instancedMesh.computeBoundingSphere();
    instancedMesh.userData.product = targetBatch.product;
    scene.add(instancedMesh);
    scene.updateMatrixWorld(true);

    // Lấy tọa độ thế giới của chiếc giày đầu tiên
    const pos = new THREE.Vector3().setFromMatrixPosition(targetBatch.matrices[0]);

    // Camera đứng cách 1.2m (< 2.5m) -> phải nhặt được giày
    const raycasterNear = new THREE.Raycaster(
      new THREE.Vector3(pos.x, pos.y, pos.z + 1.2),
      new THREE.Vector3(0, 0, -1),
      0,
      PRODUCT_REACH_METERS
    );
    const hitNear = findReachableProduct(raycasterNear, scene.children);
    expect(hitNear).not.toBeNull();
    expect(hitNear?.product.id).toBe("prod-apparel-sneaker");
    expect(hitNear?.intersection.instanceId).toBeDefined();

    // Camera đứng phía trên cách 4.0m (> 2.5m) nhìn thẳng xuống -> ngoài tầm với, trả về null
    const raycasterFar = new THREE.Raycaster(
      new THREE.Vector3(pos.x, pos.y + 4.0, pos.z),
      new THREE.Vector3(0, -1, 0),
      0,
      PRODUCT_REACH_METERS
    );
    expect(findReachableProduct(raycasterFar, scene.children)).toBeNull();
  });
});
