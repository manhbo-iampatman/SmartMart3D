import { beforeAll, describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import {
  getProductTextureById,
  getVinamilkTexture,
  getHaoHaoTexture,
  getCocaColaTexture,
  getG7Texture,
  getChocoPieTexture,
  getMiloTexture,
  getStingTexture,
  getSimplyTexture,
} from "../utils/textureGenerator";

beforeAll(() => {
  const gradient = { addColorStop: vi.fn() };
  const context = {
    arc: vi.fn(),
    beginPath: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    strokeRect: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    font: "",
    lineWidth: 1,
    textAlign: "start",
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => context
  );
});

describe("textureGenerator - Tạo Texture PBR Nhãn Hàng Việt Nam (Phase 2)", () => {
  it("sinh texture hợp lệ cho 8 sản phẩm 3D đặc trưng", () => {
    const vinamilk = getVinamilkTexture();
    const haohao = getHaoHaoTexture();
    const coca = getCocaColaTexture();
    const g7 = getG7Texture();
    const chocopie = getChocoPieTexture();
    const milo = getMiloTexture();
    const sting = getStingTexture();
    const simply = getSimplyTexture();

    expect(vinamilk).toBeInstanceOf(THREE.CanvasTexture);
    expect(haohao).toBeInstanceOf(THREE.CanvasTexture);
    expect(coca).toBeInstanceOf(THREE.CanvasTexture);
    expect(g7).toBeInstanceOf(THREE.CanvasTexture);
    expect(chocopie).toBeInstanceOf(THREE.CanvasTexture);
    expect(milo).toBeInstanceOf(THREE.CanvasTexture);
    expect(sting).toBeInstanceOf(THREE.CanvasTexture);
    expect(simply).toBeInstanceOf(THREE.CanvasTexture);
  });

  it("getProductTextureById trả về đúng texture theo mã sản phẩm", () => {
    expect(getProductTextureById("prod-milk-vinamilk")).toBeInstanceOf(THREE.Texture);
    expect(getProductTextureById("prod-noodle-haohao")).toBeInstanceOf(THREE.Texture);
    expect(getProductTextureById("prod-drink-coca")).toBeInstanceOf(THREE.Texture);
    expect(getProductTextureById("prod-coffee-g7")).toBeInstanceOf(THREE.Texture);
    expect(getProductTextureById("prod-snack-chocopie")).toBeInstanceOf(THREE.Texture);
    expect(getProductTextureById("prod-drink-milo")).toBeInstanceOf(THREE.Texture);
    expect(getProductTextureById("prod-drink-sting")).toBeInstanceOf(THREE.Texture);
    expect(getProductTextureById("prod-oil-simply")).toBeInstanceOf(THREE.Texture);

    // Sản phẩm không có 3D hoặc mã không tồn tại
    expect(getProductTextureById("prod-sauce-chinsu")).toBeNull();
    expect(getProductTextureById("non-existent-id")).toBeNull();
  });

  it("cơ chế cache texture: gọi nhiều lần trả về cùng một instance texture trong bộ nhớ", () => {
    const tex1 = getProductTextureById("prod-milk-vinamilk");
    const tex2 = getProductTextureById("prod-milk-vinamilk");
    expect(tex1).toBe(tex2);
  });
});

