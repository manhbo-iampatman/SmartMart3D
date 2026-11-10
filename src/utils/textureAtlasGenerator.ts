import * as THREE from "three";
import {
  getVinamilkTexture,
  getHaoHaoTexture,
  getCocaColaTexture,
  getG7Texture,
  getChocoPieTexture,
  getMiloTexture,
  getStingTexture,
  getSimplyTexture,
} from "./textureGenerator";

export const GROCERY_ATLAS_TILES = {
  "prod-milk-vinamilk": 0,
  "prod-noodle-haohao": 1,
  "prod-drink-coca": 2,
  "prod-coffee-g7": 3,
  "prod-snack-chocopie": 4,
  "prod-drink-milo": 5,
  "prod-drink-sting": 6,
  "prod-oil-simply": 7,
} as const;

export type GroceryAtlasProductId = keyof typeof GROCERY_ATLAS_TILES;

const atlasCache = new Map<string, THREE.Texture>();

function createSafeAtlasCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
} {
  if (typeof document === "undefined") return { canvas: null, ctx: null };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
  } catch {
    return { canvas: null, ctx: null };
  }
}

/**
 * Remap thuộc tính UV của THREE.BufferGeometry vào đúng ô tile trong Texture Atlas.
 * Đảm bảo mọi (u, v) nằm chặt trong biên [0..1] và khớp cơ chế flipY = true của WebGL.
 */
export function remapGeometryToAtlasTile(
  geometry: THREE.BufferGeometry,
  tileIndex: number,
  cols = 4,
  rows = 2
): THREE.BufferGeometry {
  const uv = geometry.attributes.uv;
  if (!uv) return geometry;

  const col = tileIndex % cols;
  const row = Math.floor(tileIndex / cols);
  const padU = 2 / 2048;
  const padV = 2 / 2048;

  const uMin = col / cols + padU;
  const uSpan = 1 / cols - padU * 2;
  // Hàng 0 nằm nửa trên Atlas (v từ 0.5 -> 1.0 với flipY = true)
  const vMin = 1 - (row + 1) / rows + padV;
  const vSpan = 1 / rows - padV * 2;

  for (let i = 0; i < uv.count; i++) {
    const u = Math.min(1, Math.max(0, uv.getX(i)));
    const v = Math.min(1, Math.max(0, uv.getY(i)));
    uv.setXY(i, uMin + u * uSpan, vMin + v * vSpan);
  }
  uv.needsUpdate = true;
  return geometry;
}

/**
 * Đóng gói toàn bộ 8 texture sản phẩm tạp hóa vào 1 Texture Atlas 2048x2048 (lưới 4x2),
 * cho phép chia sẻ 1 MeshStandardMaterial & 1 CanvasTexture duy nhất trên GPU.
 */
export function getGroceryTextureAtlas(): THREE.Texture {
  if (atlasCache.has("grocery-2048")) return atlasCache.get("grocery-2048")!;

  const { canvas, ctx } = createSafeAtlasCanvas(2048, 2048);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    atlasCache.set("grocery-2048", fallback);
    return fallback;
  }

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 2048, 2048);

  const sources = [
    getVinamilkTexture(),
    getHaoHaoTexture(),
    getCocaColaTexture(),
    getG7Texture(),
    getChocoPieTexture(),
    getMiloTexture(),
    getStingTexture(),
    getSimplyTexture(),
  ];

  const tileW = 512;
  const tileH = 1024;
  sources.forEach((tex, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const img = tex.image as HTMLCanvasElement | undefined;
    if (img) {
      ctx.drawImage(img, col * tileW, row * tileH, tileW, tileH);
    }
  });

  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.needsUpdate = true;
  atlasCache.set("grocery-2048", atlasTexture);
  return atlasTexture;
}

export interface BannerTileSpec {
  aisleNumber: string;
  title: string;
  subtitle: string;
  color: string;
}

/**
 * Đóng gói 4 biển ngành hàng đầu kệ (01..04) vào 1 Texture Atlas 1024x512 (2x2)
 * cho phép DepartmentBanner render toàn bộ mặt biển bằng 1 InstancedMesh.
 */
export function getDepartmentBannerAtlasTexture(
  banners: readonly BannerTileSpec[]
): THREE.Texture {
  if (atlasCache.has("banners-1024")) return atlasCache.get("banners-1024")!;

  const { canvas, ctx } = createSafeAtlasCanvas(1024, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    atlasCache.set("banners-1024", fallback);
    return fallback;
  }

  const tileW = 512;
  const tileH = 256;
  banners.slice(0, 4).forEach((b, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const ox = col * tileW;
    const oy = row * tileH;

    ctx.fillStyle = b.color;
    ctx.fillRect(ox, oy, tileW, tileH);

    // Huy hiệu số lối đi bên trái
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ox + 28, oy + 52, 110, 152);
    ctx.fillStyle = b.color;
    ctx.font = "900 64px 'Plus Jakarta Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.aisleNumber, ox + 83, oy + 128);

    // Tiêu đề & phụ đề ngành hàng
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 32px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(b.title, ox + 160, oy + 102);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 18px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(b.subtitle, ox + 160, oy + 154);
  });

  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.needsUpdate = true;
  atlasCache.set("banners-1024", atlasTexture);
  return atlasTexture;
}

export interface ZoneSignTileSpec {
  title: string;
  subtitle: string;
  bgColor: string;
  accentColor: string;
}

/**
 * Đóng gói 4 biển phân khu (Dairy & Frozen, Bakery & Deli, Self-Checkout Sảnh Nam, SmartMart Bắc)
 * vào 1 Texture Atlas 1024x512 (2x2) để không tạo thêm <Text> Troika SDF mới.
 */
export function getZoneSignAtlasTexture(signs: readonly ZoneSignTileSpec[]): THREE.Texture {
  if (atlasCache.has("zone-signs-1024")) return atlasCache.get("zone-signs-1024")!;

  const { canvas, ctx } = createSafeAtlasCanvas(1024, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    atlasCache.set("zone-signs-1024", fallback);
    return fallback;
  }

  const tileW = 512;
  const tileH = 256;
  signs.slice(0, 4).forEach((s, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const ox = col * tileW;
    const oy = row * tileH;

    ctx.fillStyle = s.bgColor;
    ctx.fillRect(ox, oy, tileW, tileH);

    ctx.fillStyle = s.accentColor;
    ctx.fillRect(ox, oy + tileH - 16, tileW, 16);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 34px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.title, ox + tileW / 2, oy + 104);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 20px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(s.subtitle, ox + tileW / 2, oy + 162);
  });

  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.needsUpdate = true;
  atlasCache.set("zone-signs-1024", atlasTexture);
  return atlasTexture;
}
