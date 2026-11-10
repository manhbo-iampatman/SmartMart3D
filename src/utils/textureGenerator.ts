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

/**
 * Texture sàn gỗ ghép thanh Birch Wood Parquet cho khu Thời trang (Phase 4)
 */
export function getBirchWoodTexture(): THREE.Texture {
  if (textureCache.has("birch-wood")) return textureCache.get("birch-wood")!;

  const { canvas, ctx } = createSafeCanvas(512, 512);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("birch-wood", fallback);
    return fallback;
  }

  // Nền gỗ Birch vàng kem ấm sáng
  ctx.fillStyle = "#e3c396";
  ctx.fillRect(0, 0, 512, 512);

  // Vẽ các thanh ván sàn ghép so le (Plank layout)
  const rows = 8;
  const plankH = 512 / rows;
  const tones = ["#e7ca9f", "#dfb987", "#ead1ad", "#d7ae78", "#e2c091"];

  for (let r = 0; r < rows; r++) {
    const y = r * plankH;
    const cols = 3;
    const plankW = 512 / cols;
    const stagger = (r % 2) * (plankW * 0.5);

    for (let c = -1; c <= cols; c++) {
      const x = c * plankW + stagger;
      ctx.fillStyle = tones[(r * 3 + Math.abs(c)) % tones.length];
      ctx.fillRect(x, y, plankW, plankH);

      // Vân gỗ mảnh nhẹ
      ctx.fillStyle = "rgba(146, 102, 52, 0.08)";
      for (let g = 0; g < 6; g++) {
        ctx.fillRect(x + 4, y + 6 + g * 10, plankW - 8, 2);
      }

      // Đường mạch ghép thanh gỗ
      ctx.strokeStyle = "rgba(120, 80, 38, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 6);
  textureCache.set("birch-wood", texture);
  return texture;
}

/**
 * Texture lưới kim loại cắt alphaTest cho 12 xe đẩy lồng nhau trong CartCorral (Phase 5)
 * Thay thế wireframe chồng lớp để loại bỏ overdraw.
 */
export function getWireMeshTexture(): THREE.Texture {
  if (textureCache.has("wire-mesh")) return textureCache.get("wire-mesh")!;

  const { canvas, ctx } = createSafeCanvas(256, 256);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("wire-mesh", fallback);
    return fallback;
  }

  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 10;

  const step = 32;
  for (let i = 0; i <= 256; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  textureCache.set("wire-mesh", texture);
  return texture;
}

/**
 * Texture biển hiệu phẳng "Self checkout" nền cobalt hyper-primary #0052CC (Phase 5)
 */
export function getSelfCheckoutSignTexture(): THREE.Texture {
  if (textureCache.has("self-checkout-sign")) return textureCache.get("self-checkout-sign")!;

  const { canvas, ctx } = createSafeCanvas(512, 192);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("self-checkout-sign", fallback);
    return fallback;
  }

  ctx.fillStyle = "#0052CC";
  ctx.fillRect(0, 0, 512, 192);

  // Chỉ trắng tinh tế phía dưới
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(16, 168, 480, 6);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 62px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Self checkout", 256, 86);

  ctx.fillStyle = "#dbeafe";
  ctx.font = "bold 20px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText("SMARTMART 3D · QUẦY TỰ THANH TOÁN", 256, 140);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("self-checkout-sign", texture);
  return texture;
}

/**
 * Texture tranh tường "Fresh picks" theo chuẩn hypermarket (thuần SmartMart 3D)
 */
export function getFreshPicksMuralTexture(): THREE.Texture {
  if (textureCache.has("mural-fresh-picks")) return textureCache.get("mural-fresh-picks")!;

  const { canvas, ctx } = createSafeCanvas(512, 256);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("mural-fresh-picks", fallback);
    return fallback;
  }

  ctx.fillStyle = "#064e3b";
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Fresh picks", 28, 48);

  ctx.fillStyle = "#a7f3d0";
  ctx.font = "600 16px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText("Nông sản tươi ngon mỗi ngày · VietGAP", 28, 72);

  // 3 ô thẻ trắng trưng bày Táo Đỏ, Chanh Vàng, Bơ Xanh giống 06-checkout.webp
  const cards = [
    { x: 28, color: "#dc2626", leaf: "#15803d", label: "Táo Envy" },
    { x: 186, color: "#facc15", leaf: "#16a34a", label: "Chanh Vàng" },
    { x: 344, color: "#166534", leaf: "#4d7c0f", label: "Bơ Sáp 034" },
  ];
  for (const card of cards) {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(card.x, 90, 140, 126);

    ctx.fillStyle = card.color;
    ctx.beginPath();
    ctx.arc(card.x + 70, 146, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = card.leaf;
    ctx.beginPath();
    ctx.ellipse(card.x + 76, 114, 12, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(card.label, card.x + 70, 202);
  }

  ctx.fillStyle = "#6ee7b7";
  ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SmartMart 3D · Khám phá quầy nông sản tươi", 28, 240);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("mural-fresh-picks", texture);
  return texture;
}

/**
 * Texture tranh tường "Fill your pantry" theo chuẩn 06-checkout.webp (thuần SmartMart 3D)
 */
export function getFillYourPantryMuralTexture(): THREE.Texture {
  if (textureCache.has("mural-fill-pantry")) return textureCache.get("mural-fill-pantry")!;

  const { canvas, ctx } = createSafeCanvas(512, 256);
  if (!ctx || !canvas) {
    const fallback = new THREE.Texture();
    textureCache.set("mural-fill-pantry", fallback);
    return fallback;
  }

  ctx.fillStyle = "#78350f";
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Fill your pantry", 28, 48);

  ctx.fillStyle = "#fde68a";
  ctx.font = "600 16px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText("Thực phẩm thiết yếu cho mọi gia đình", 28, 72);

  // 3 ô thẻ trắng minh họa Dầu ăn, Mì/Pasta, Gạo ST25
  const items = [
    { x: 28, bg: "#f8fafc", accent: "#eab308", title: "Dầu Simply" },
    { x: 186, bg: "#f8fafc", accent: "#0052CC", title: "Mì & Nui" },
    { x: 344, bg: "#f8fafc", accent: "#ea580c", title: "Gạo ST25" },
  ];
  for (const item of items) {
    ctx.fillStyle = item.bg;
    ctx.fillRect(item.x, 90, 140, 126);

    ctx.fillStyle = item.accent;
    ctx.fillRect(item.x + 48, 110, 44, 68);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.title, item.x + 70, 202);
  }

  ctx.fillStyle = "#fcd34d";
  ctx.font = "bold 13px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SmartMart 3D · Hàng tiêu dùng mỗi ngày", 28, 240);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("mural-fill-pantry", texture);
  return texture;
}

