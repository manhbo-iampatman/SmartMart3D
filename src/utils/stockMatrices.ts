import * as THREE from "three";

const TIER_Y_POSITIONS = [0.45, 0.95, 1.45, 1.95];

interface BlockMatrixOptions {
  gondolaX: number;
  zStart: number;
  zEnd: number;
  cols: number;
  rows: number;
  stack: number;
  itemH: number;
  isLeft: boolean;
}

/**
 * Tính ma trận vị trí, hướng xoay và tỉ lệ cho một khối hàng trên bốn tầng kệ.
 * Bảo đảm:
 * 1. Đáy sản phẩm đặt chính xác trên mặt khay kệ (y = tierY + 0.0175).
 * 2. Thân sản phẩm nằm hoàn toàn trong ô kệ, có khoảng lề an toàn cách các vách ngăn đứng (bay dividers).
 * 3. Các sản phẩm xếp ngay ngắn, không chồng chéo, không xuyên qua vách ngăn hoặc lưng kệ.
 */
export function generateBlockMatrices({
  gondolaX,
  zStart,
  zEnd,
  cols,
  rows,
  stack,
  itemH,
  isLeft,
}: BlockMatrixOptions): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = [];

  // Vách ngăn đứng dày 0.05m tại zStart và zEnd (lấn vào mỗi bên 0.025m).
  // Đệm an toàn 0.045m đảm bảo mép ngoài sản phẩm luôn cách vách ngăn ít nhất 2 - 4cm.
  const dividerPadding = 0.045;
  const usableZSpan = (zEnd - zStart) - dividerPadding * 2;
  const spacingZ = usableZSpan / cols;
  const spacingX = 0.075;
  const rotY = isLeft ? Math.PI / 2 : -Math.PI / 2;

  const position = new THREE.Vector3();
  const rotation = new THREE.Euler(0, rotY, 0);
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  const scale = new THREE.Vector3(1, 1, 1);

  // Mặt trên đợt khay kệ kim loại (khay dày 0.035m đặt tại tierY)
  const SHELF_TRAY_TOP_OFFSET = 0.0175;

  TIER_Y_POSITIONS.forEach((tierY) => {
    const shelfTopY = tierY + SHELF_TRAY_TOP_OFFSET;

    for (let c = 0; c < cols; c++) {
      // Tâm sản phẩm theo trục Z nằm trọn vẹn trong khoảng usableZSpan của ô kệ
      const z = zStart + dividerPadding + (c + 0.5) * spacingZ;

      for (let r = 0; r < rows; r++) {
        // Đặt lùi an toàn từ mép trước (gondolaX +- 0.35m) về phía lưng kệ, không chạm nẹp giá
        const x = isLeft
          ? gondolaX + 0.35 - r * spacingX
          : gondolaX - 0.35 + r * spacingX;

        for (let s = 0; s < stack; s++) {
          // Đáy sản phẩm tiếp xúc chuẩn xác trên mặt đợt kệ hoặc tầng sản phẩm ngay phía dưới
          const y = shelfTopY + s * itemH + itemH / 2;

          position.set(x, y, z);
          const matrix = new THREE.Matrix4();
          matrix.compose(position, quaternion, scale);
          matrices.push(matrix);
        }
      }
    }
  });

  return matrices;
}
