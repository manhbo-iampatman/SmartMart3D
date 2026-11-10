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
  getTerrazzoFloorTextures,
  getPegboardTexture,
  getContactAOTexture,
  getTrolleyBlobShadowTexture,
} from "../utils/textureGenerator";
import { getGroceryTextureAtlas } from "../utils/textureAtlasGenerator";

const createMockContext = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    drawImage: vi.fn(),
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
};

beforeAll(() => {
  const context = createMockContext();
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

  it("Gate 1 Phase 8: PBR Floor / Pegboard / AO / BlobShadow phân biệt chuẩn SRGBColorSpace & NoColorSpace + anisotropy <= 4", () => {
    const floor = getTerrazzoFloorTextures(16); // Ép trần max 4 dù GPU hỗ trợ 16x
    expect(floor.colorMap).toBeInstanceOf(THREE.CanvasTexture);
    expect(floor.colorMap.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(floor.colorMap.anisotropy).toBeLessThanOrEqual(4);
    expect(floor.roughnessMap.colorSpace).toBe(THREE.NoColorSpace);
    expect(floor.bumpMap.colorSpace).toBe(THREE.NoColorSpace);

    const pegboard = getPegboardTexture();
    const contactAO = getContactAOTexture();
    const trolleyBlob = getTrolleyBlobShadowTexture();
    const vinamilk = getVinamilkTexture();
    const groceryAtlas = getGroceryTextureAtlas();

    expect(pegboard.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(contactAO.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(trolleyBlob.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(vinamilk.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(groceryAtlas.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(getTerrazzoFloorTextures(4).colorMap).toBe(floor.colorMap);
  });

  it("Gate 1 Phase 8 fallback JSDOM: không crash khi HTMLCanvasElement.getContext trả về null", async () => {
    vi.resetModules();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const freshMod = await import("../utils/textureGenerator");

    const floor = freshMod.getTerrazzoFloorTextures(8);
    expect(floor.colorMap).toBeInstanceOf(THREE.Texture);
    expect(floor.roughnessMap).toBeInstanceOf(THREE.Texture);
    expect(floor.bumpMap).toBeInstanceOf(THREE.Texture);
    expect(freshMod.getPegboardTexture()).toBeInstanceOf(THREE.Texture);
    expect(freshMod.getContactAOTexture()).toBeInstanceOf(THREE.Texture);
    expect(freshMod.getTrolleyBlobShadowTexture()).toBeInstanceOf(THREE.Texture);

    // Khôi phục context mock cho các suite sau
    const ctx = createMockContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => ctx);
  });
});

