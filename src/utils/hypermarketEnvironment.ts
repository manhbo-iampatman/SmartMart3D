import * as THREE from "three";

const LIGHT_X_POSITIONS = [-14, -10, -6, -2, 2, 6, 10, 14];

/**
 * Xây dựng scene IBL thủ công mô phỏng không gian đại siêu thị 8 máng đèn LED trần:
 * - Trần plenum tối (#334155) & sàn hấp thụ sáng (#475569) chống bệt sáng gầm kệ.
 * - 8 dải đèn trần HDR tạo vệt phản xạ dài tự nhiên trên sàn Terrazzo mài & inox/kính.
 * - Phân bổ sắc độ nhẹ giữa khu Bakery/Apparel (#fff1db) và khu Dairy/Frozen (#dbeafe).
 */
export function createHypermarketEnvironmentScene(): THREE.Scene {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#334155");

  const addPanel = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: THREE.ColorRepresentation,
    side: THREE.Side = THREE.FrontSide
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color, side })
    );
    mesh.position.set(x, y, z);
    envScene.add(mesh);
  };

  // Trần plenum, sàn hấp thụ sáng và tường 4 phía
  addPanel(44, 0.2, 58, 0, 9.0, 0, "#334155");
  addPanel(44, 0.2, 58, 0, -3.5, 0, "#475569");
  addPanel(0.2, 13, 58, -22, 2.8, 0, "#cbd5e1");
  addPanel(0.2, 13, 58, 22, 2.8, 0, "#dbe2ea");
  addPanel(44, 13, 0.2, 0, 2.8, -29, "#cbd5e1");
  addPanel(44, 13, 0.2, 0, 2.8, 29, "#d8e0ea");

  // Accent phản xạ dịu cho khu Bakery/Apparel (+X) và Dairy/Frozen (-X, Bắc)
  addPanel(8, 3.2, 0.2, 10, 4.5, -28.4, "#fff1db");
  addPanel(0.2, 3.2, 18, 21.5, 4.5, 4, "#fff7ed");
  addPanel(12, 3.2, 0.2, -10.5, 4.5, -28.4, "#dbeafe");

  // 8 dải đèn LED trần 5000K HDR dọc trục Z
  const stripColor = new THREE.Color(3.4, 3.5, 3.7);
  for (const lx of LIGHT_X_POSITIONS) {
    addPanel(0.45, 0.12, 46, lx, 8.4, 0, stripColor);
  }

  return envScene;
}

/** Giải phóng toàn bộ geometry và material tạm trong một scene PMREM */
export function disposeEnvironmentScene(envScene: THREE.Scene): void {
  envScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material?.dispose();
      }
    }
  });
}

/**
 * Bake Hypermarket IBL cubemap 1 lần bằng PMREMGenerator (JSDOM-safe)
 * và giải phóng ngay scene + generator tạm.
 */
export function bakeHypermarketEnvironment(
  gl: THREE.WebGLRenderer
): THREE.WebGLRenderTarget | null {
  let envScene: THREE.Scene | null = null;
  let pmrem: THREE.PMREMGenerator | null = null;
  try {
    envScene = createHypermarketEnvironmentScene();
    pmrem = new THREE.PMREMGenerator(gl);
    const renderTarget = pmrem.fromScene(envScene, 0.03);
    return renderTarget;
  } catch {
    return null;
  } finally {
    if (envScene) disposeEnvironmentScene(envScene);
    pmrem?.dispose();
  }
}
