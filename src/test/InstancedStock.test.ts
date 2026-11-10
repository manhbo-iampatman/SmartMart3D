import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import {
  getVinamilkTexture,
  getHaoHaoTexture,
  getCocaColaTexture,
  getG7Texture,
  getChocoPieTexture,
  getMiloTexture,
  getStingTexture,
  getSimplyTexture,
} from "../utils/textureGenerator";
import { generateBlockMatrices } from "../utils/stockMatrices";

describe("InstancedStock - Thuật toán Ma trận Tọa độ & GPU Instancing (Phase 2)", () => {
  it("tổng số lượng sản phẩm được rải trên kệ nằm trong khoảng 1,500 - 3,000 món", () => {
    const vinamilkMatrices = generateBlockMatrices({
      gondolaX: -2.6,
      zStart: -2.4,
      zEnd: -1.2,
      cols: 8,
      rows: 4,
      stack: 1,
      itemH: 0.26,
      isLeft: true,
    }); // 8 * 4 * 1 * 4 = 128

    const haohaoMatrices = generateBlockMatrices({
      gondolaX: -2.6,
      zStart: -1.2,
      zEnd: 0.0,
      cols: 9,
      rows: 4,
      stack: 3,
      itemH: 0.11,
      isLeft: true,
    }); // 9 * 4 * 3 * 4 = 432

    const cocaMatrices = generateBlockMatrices({
      gondolaX: -2.6,
      zStart: 0.0,
      zEnd: 1.2,
      cols: 14,
      rows: 5,
      stack: 2,
      itemH: 0.13,
      isLeft: true,
    }); // 14 * 5 * 2 * 4 = 560

    const g7Matrices = generateBlockMatrices({
      gondolaX: -2.6,
      zStart: 1.2,
      zEnd: 2.4,
      cols: 8,
      rows: 4,
      stack: 2,
      itemH: 0.2,
      isLeft: true,
    }); // 8 * 4 * 2 * 4 = 256

    const chocopieMatrices = generateBlockMatrices({
      gondolaX: 2.6,
      zStart: -2.4,
      zEnd: -1.2,
      cols: 6,
      rows: 4,
      stack: 2,
      itemH: 0.16,
      isLeft: false,
    }); // 6 * 4 * 2 * 4 = 192

    const miloMatrices = generateBlockMatrices({
      gondolaX: 2.6,
      zStart: -1.2,
      zEnd: 0.0,
      cols: 9,
      rows: 4,
      stack: 2,
      itemH: 0.13,
      isLeft: false,
    }); // 9 * 4 * 2 * 4 = 288

    const stingMatrices = generateBlockMatrices({
      gondolaX: 2.6,
      zStart: 0.0,
      zEnd: 1.2,
      cols: 14,
      rows: 5,
      stack: 2,
      itemH: 0.16,
      isLeft: false,
    }); // 14 * 5 * 2 * 4 = 560

    const simplyMatrices = generateBlockMatrices({
      gondolaX: 2.6,
      zStart: 1.2,
      zEnd: 2.4,
      cols: 10,
      rows: 3,
      stack: 1,
      itemH: 0.26,
      isLeft: false,
    }); // 10 * 3 * 1 * 4 = 120

    const totalInstances =
      vinamilkMatrices.length +
      haohaoMatrices.length +
      cocaMatrices.length +
      g7Matrices.length +
      chocopieMatrices.length +
      miloMatrices.length +
      stingMatrices.length +
      simplyMatrices.length;

    // Yêu cầu Giai đoạn 2: 1,500 - 3,000 sản phẩm
    expect(totalInstances).toBeGreaterThanOrEqual(1500);
    expect(totalInstances).toBeLessThanOrEqual(3000);
    expect(totalInstances).toBe(2536);
  });

  it("các ma trận tọa độ được phân bổ chính xác theo 4 tầng kệ (Y = 0.45, 0.95, 1.45, 1.95)", () => {
    const matrices = generateBlockMatrices({
      gondolaX: -2.6,
      zStart: -2.4,
      zEnd: -1.2,
      cols: 4,
      rows: 2,
      stack: 1,
      itemH: 0.2,
      isLeft: true,
    });

    const pos = new THREE.Vector3();
    const rot = new THREE.Quaternion();
    const sca = new THREE.Vector3();

    const uniqueYLevels = new Set<number>();

    matrices.forEach((mat) => {
      mat.decompose(pos, rot, sca);
      // Làm tròn 2 chữ số thập phân
      uniqueYLevels.add(Math.round(pos.y * 100) / 100);

      // Kệ trái X phải nằm trong khoảng [-2.6, -2.1]
      expect(pos.x).toBeLessThan(0);
      expect(pos.x).toBeGreaterThanOrEqual(-2.6);
      expect(pos.x).toBeLessThanOrEqual(-2.15);

      // Z nằm trong khoảng [-2.4, -1.2]
      expect(pos.z).toBeGreaterThanOrEqual(-2.4);
      expect(pos.z).toBeLessThanOrEqual(-1.2);
    });

    expect(uniqueYLevels.size).toBe(4);
  });

  it("phân bổ rõ ràng giữa Dãy Kệ Trái (X < 0) và Dãy Kệ Phải (X > 0)", () => {
    const leftMats = generateBlockMatrices({
      gondolaX: -2.6,
      zStart: -1.0,
      zEnd: 0.0,
      cols: 2,
      rows: 2,
      stack: 1,
      itemH: 0.1,
      isLeft: true,
    });
    const rightMats = generateBlockMatrices({
      gondolaX: 2.6,
      zStart: -1.0,
      zEnd: 0.0,
      cols: 2,
      rows: 2,
      stack: 1,
      itemH: 0.1,
      isLeft: false,
    });

    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();

    leftMats.forEach((m) => {
      m.decompose(p, q, s);
      expect(p.x).toBeLessThan(0);
    });

    rightMats.forEach((m) => {
      m.decompose(p, q, s);
      expect(p.x).toBeGreaterThan(0);
    });
  });

  it("tổng số draw calls của phần stock chỉ bằng đúng 8 (1 draw call cho mỗi loại sản phẩm)", () => {
    // 8 sản phẩm 3D = 8 cụm InstancedMesh
    const productCountWith3D = MOCK_PRODUCTS.filter((p) => p.has3D).length;
    expect(productCountWith3D).toBe(8);
  });
});

