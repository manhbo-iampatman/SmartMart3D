import * as THREE from "three";

// Cache các texture đã khởi tạo để tránh sinh lại nhiều lần
const textureCache = new Map<string, THREE.Texture>();

/**
 * Tạo canvas an toàn hỗ trợ cả môi trường Node/JSDOM (test) và trình duyệt thực tế
 */
function createSafeCanvas(width = 512, height = 512): {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
} {
  if (typeof document === "undefined") {
    return { canvas: null, ctx: null };
  }
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
 * 1. Texture Sữa tươi Vinamilk 100% 1L
 */
export function getVinamilkTexture(): THREE.Texture {
  if (textureCache.has("vinamilk")) return textureCache.get("vinamilk")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("vinamilk", fallback);
    return fallback;
  }

  // Nền xanh Vinamilk
  ctx.fillStyle = "#005baa";
  ctx.fillRect(0, 0, 512, 512);

  // Sóng sữa trắng ở nửa dưới
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.bezierCurveTo(120, 210, 360, 270, 512, 230);
  ctx.lineTo(512, 512);
  ctx.lineTo(0, 512);
  ctx.closePath();
  ctx.fill();

  // Logo & Chữ Vinamilk
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 58px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VINAMILK", 256, 110);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 32px Arial, sans-serif";
  ctx.fillText("100% SỮA TƯƠI", 256, 160);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 22px Arial, sans-serif";
  ctx.fillText("TIỆT TRÙNG - ÍT ĐƯỜNG", 256, 195);

  // Nhãn thể tích 1 Lít
  ctx.fillStyle = "#005baa";
  ctx.font = "bold 44px Arial, sans-serif";
  ctx.fillText("1 LÍT", 256, 340);

  ctx.fillStyle = "#475569";
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("Dồi dào Canxi & Vitamin D3", 256, 385);

  // Vạch barcode mô phỏng
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(180, 430, 152, 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set("vinamilk", texture);
  return texture;
}

/**
 * 2. Texture Mì tôm chua cay Hảo Hảo 75g
 */
export function getHaoHaoTexture(): THREE.Texture {
  if (textureCache.has("haohao")) return textureCache.get("haohao")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("haohao", fallback);
    return fallback;
  }

  // Nền đỏ cam hồng Hảo Hảo
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, "#e11d48");
  grad.addColorStop(1, "#dc2626");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Khung viền vàng
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, 480, 480);

  // Logo Acecook
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Acecook", 256, 75);

  // Chữ HẢO HẢO màu vàng nổi bật viền đen
  ctx.fillStyle = "#fde047";
  ctx.font = "900 80px Impact, Arial, sans-serif";
  ctx.fillText("HẢO HẢO", 256, 180);

  // Hương vị Tôm chua cay
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillText("TÔM CHUA CAY", 256, 250);

  // Minh họa tô mì vàng óng
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(256, 360, 85, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("Khối lượng tịnh: 75g", 256, 465);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("haohao", texture);
  return texture;
}

/**
 * 3. Texture Lon nước ngọt Coca-Cola 320ml
 */
export function getCocaColaTexture(): THREE.Texture {
  if (textureCache.has("coca")) return textureCache.get("coca")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("coca", fallback);
    return fallback;
  }

  // Nền đỏ bóng Coca-Cola
  ctx.fillStyle = "#d90429";
  ctx.fillRect(0, 0, 512, 512);

  // Dải lượn sóng trắng đặc trưng
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.bezierCurveTo(150, 300, 350, 420, 512, 340);
  ctx.lineTo(512, 380);
  ctx.bezierCurveTo(350, 460, 150, 340, 0, 400);
  ctx.closePath();
  ctx.fill();

  // Chữ Coca-Cola uốn lượn phong cách cổ điển
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic bold 70px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Coca-Cola", 256, 230);

  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillText("VỊ NGUYÊN BẢN", 256, 285);

  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("320 ml • SẢNG KHOÁI MÁT LẠNH", 256, 450);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("coca", texture);
  return texture;
}

/**
 * 4. Texture Hộp Cà phê G7 Trung Nguyên Legend
 */
export function getG7Texture(): THREE.Texture {
  if (textureCache.has("g7")) return textureCache.get("g7")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("g7", fallback);
    return fallback;
  }

  // Nền nâu đậm cà phê phối đen
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#1c1917");
  grad.addColorStop(1, "#451a03");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Logo TRUNG NGUYÊN
  ctx.fillStyle = "#d97706";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TRUNG NGUYÊN LEGEND", 256, 80);

  // Chữ G7 lớn màu đỏ mạ vàng
  ctx.fillStyle = "#dc2626";
  ctx.font = "900 130px Impact, Arial, sans-serif";
  ctx.fillText("G7", 256, 220);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 32px Arial, sans-serif";
  ctx.fillText("COFFEE 3in1", 256, 275);

  ctx.fillStyle = "#fef3c7";
  ctx.font = "italic 20px Georgia, serif";
  ctx.fillText("Cà Phê Thứ Thiệt Cho Người Sành", 256, 320);

  // Minh họa ly cà phê
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("HỘP 18 GÓI x 16g", 256, 450);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("g7", texture);
  return texture;
}

/**
 * 5. Texture Hộp Bánh Choco-Pie Orion 360g
 */
export function getChocoPieTexture(): THREE.Texture {
  if (textureCache.has("chocopie")) return textureCache.get("chocopie")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("chocopie", fallback);
    return fallback;
  }

  // Nền vàng ấm Orion
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(0, 0, 512, 512);

  // Khối sô-cô-la nâu
  ctx.fillStyle = "#78350f";
  ctx.fillRect(0, 0, 512, 130);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ORION", 256, 80);

  // Chữ Choco-Pie đỏ
  ctx.fillStyle = "#b91c1c";
  ctx.font = "900 68px Arial, sans-serif";
  ctx.fillText("Choco•Pie", 256, 220);

  // Chữ "Tình" thư pháp đỏ
  ctx.fillStyle = "#991b1b";
  ctx.font = "bold 80px Times New Roman, serif";
  ctx.fillText("Tình", 256, 320);

  ctx.fillStyle = "#451a03";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText("Bánh Bông Lan Phủ Sô-cô-la", 256, 375);

  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("Hộp 12 Cái • 360g", 256, 450);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("chocopie", texture);
  return texture;
}

/**
 * 6. Texture Thức uống lúa mạch Nestlé Milo
 */
export function getMiloTexture(): THREE.Texture {
  if (textureCache.has("milo")) return textureCache.get("milo")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("milo", fallback);
    return fallback;
  }

  // Nền xanh lá Milo thể thao
  ctx.fillStyle = "#15803d";
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Nestlé", 256, 80);

  // Chữ MILO đỏ nền trắng nổi
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 95px Impact, Arial, sans-serif";
  ctx.fillText("MILO", 256, 190);

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 32px Arial, sans-serif";
  ctx.fillText("ACTIV-GO", 256, 245);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText("MẦM LÚA MẠCH & CANXI", 256, 305);

  ctx.fillStyle = "#bbf7d0";
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("Lốc 4 Hộp x 180ml • Tiếp Năng Lượng", 256, 440);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("milo", texture);
  return texture;
}

/**
 * 7. Texture Nước tăng lực Sting Dâu tây đỏ
 */
export function getStingTexture(): THREE.Texture {
  if (textureCache.has("sting")) return textureCache.get("sting")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("sting", fallback);
    return fallback;
  }

  // Nền đỏ thẫm Sting
  ctx.fillStyle = "#be123c";
  ctx.fillRect(0, 0, 512, 512);

  // Tia sét vàng
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(270, 70);
  ctx.lineTo(230, 190);
  ctx.lineTo(265, 190);
  ctx.lineTo(220, 310);
  ctx.lineTo(285, 170);
  ctx.lineTo(250, 170);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 78px Impact, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("STING", 256, 220);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText("DÂU TÂY ĐỎ", 256, 270);

  ctx.fillStyle = "#ffffff";
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("HỒNG SÂM & NĂNG LƯỢNG • 330ml", 256, 440);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("sting", texture);
  return texture;
}

/**
 * 8. Texture Dầu đậu nành Simply 1L
 */
export function getSimplyTexture(): THREE.Texture {
  if (textureCache.has("simply")) return textureCache.get("simply")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("simply", fallback);
    return fallback;
  }

  // Nền vàng mật dầu ăn
  ctx.fillStyle = "#eab308";
  ctx.fillRect(0, 0, 512, 512);

  // Nhãn trắng giữa
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(40, 100, 432, 312);

  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 44px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Simply", 256, 175);

  ctx.fillStyle = "#ca8a04";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillText("DẦU ĐẬU NÀNH", 256, 225);

  ctx.fillStyle = "#1e293b";
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText("Giàu Omega 3, 6, 9 Tự Nhiên", 256, 275);

  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("CHO MỘT TRÁI TIM KHỎE", 256, 325);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText("CHAI 1 LÍT", 256, 380);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("simply", texture);
  return texture;
}

/**
 * Trả về texture tương ứng với ID của sản phẩm
 */
export function getProductTextureById(productId: string): THREE.Texture | null {
  switch (productId) {
    case "prod-milk-vinamilk":
      return getVinamilkTexture();
    case "prod-noodle-haohao":
      return getHaoHaoTexture();
    case "prod-drink-coca":
      return getCocaColaTexture();
    case "prod-coffee-g7":
      return getG7Texture();
    case "prod-snack-chocopie":
      return getChocoPieTexture();
    case "prod-drink-milo":
      return getMiloTexture();
    case "prod-drink-sting":
      return getStingTexture();
    case "prod-oil-simply":
      return getSimplyTexture();
    default:
      return null;
  }
}

