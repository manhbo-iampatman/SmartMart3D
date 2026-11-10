export interface CameraPreset {
  id: string;
  label: string;
  shortName: string;
  description: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  isAerial?: boolean;
  hideCeiling?: boolean;
}

/**
 * 6 Góc nhìn chuẩn đối chiếu trực tiếp bộ ảnh tham chiếu Omid (D:\Docker\demo\01..06):
 * Mọi góc đi bộ (02..06) đều đạt isWalkable === true và không bị cột hay kệ che chắn.
 */
export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    id: "01-overview",
    label: "01 · Toàn cảnh 45°",
    shortName: "Toàn cảnh",
    description: "Góc chim bay bao quát toàn bộ mặt bằng đại siêu thị 40m × 54m",
    position: [-24.0, 30.0, 34.0],
    lookAt: [1.0, 0.0, -2.0],
    fov: 48,
    isAerial: true,
    hideCeiling: true,
  },
  {
    id: "02-entrance",
    label: "02 · Sảnh đón tiếp",
    shortName: "Sảnh vào",
    description: "Đứng tại sảnh đón chính nhìn xuyên suốt trục hành lang 4.2m",
    position: [0.0, 1.65, 22.8],
    lookAt: [-1.5, 1.65, 0.0],
    fov: 62,
  },
  {
    id: "03-produce",
    label: "03 · Quầy Rau củ",
    shortName: "Rau củ",
    description: "Cận cảnh bàn nan gỗ nghiêng 8°, trái cây và pano Fresh picks",
    position: [6.4, 1.65, 0.0],
    lookAt: [13.5, 1.45, -10.5],
    fov: 58,
  },
  {
    id: "04-grocery",
    label: "04 · Dãy kệ Tạp hóa",
    shortName: "Tạp hóa",
    description: "Lối đi giữa dãy kệ Gondola A01–A04, LCD treo trần & nẹp giá",
    position: [-4.0, 1.55, 5.8],
    lookAt: [-4.0, 1.55, -2.0],
    fov: 60,
  },
  {
    id: "05-apparel",
    label: "05 · Đảo Thời trang",
    shortName: "Thời trang",
    description: "Không gian sàn gỗ Birch Wood, giá áo thấp & bàn phụ kiện",
    position: [11.2, 1.6, 11.4],
    lookAt: [10.8, 1.25, 2.5],
    fov: 60,
  },
  {
    id: "06-checkout",
    label: "06 · Cụm Self-Checkout",
    shortName: "Thanh toán",
    description: "Dãy Kiosk Sảnh Nam, chuồng 12 xe đẩy & pano Fill your pantry",
    position: [-6.8, 1.65, 13.0],
    lookAt: [-10.5, 1.5, 21.5],
    fov: 56,
  },
];
