import { useEffect, useRef } from "react";
import type React from "react";
import * as THREE from "three";

export interface LodVisibilityTarget {
  ref: React.RefObject<THREE.Object3D | null>;
  center?: readonly [number, number, number];
  maxDistance: number;
}

type LodListener = (cameraPosition: THREE.Vector3) => void;

const lodListeners = new Set<LodListener>();

/**
 * Đăng ký callback nhận vị trí camera mỗi frame (chỉ chạy trong Canvas runtime).
 */
export function subscribeCameraLod(listener: LodListener): () => void {
  lodListeners.add(listener);
  return () => {
    lodListeners.delete(listener);
  };
}

/**
 * Phát vị trí camera từ vòng lặp useFrame duy nhất trong PlayerFPS.
 * Khi chạy unit test JSDOM ngoài Canvas, hàm này không được gọi nên các đối tượng giữ nguyên visible mặc định.
 */
export function notifyCameraLodUpdate(cameraPosition: THREE.Vector3): void {
  lodListeners.forEach((listener) => listener(cameraPosition));
}

/**
 * Hook LOD distance culling không phụ thuộc hook useThree/useFrame của R3F,
 * giúp các component 3D vẫn render an toàn trong unit test JSDOM.
 */
export function useCameraLod(targets: readonly LodVisibilityTarget[]): void {
  const targetsRef = useRef<readonly LodVisibilityTarget[]>(targets);
  targetsRef.current = targets;

  useEffect(() => {
    const updateVisibility = (cameraPosition: THREE.Vector3) => {
      for (const target of targetsRef.current) {
        const obj = target.ref.current;
        if (!obj) continue;
        const [cx, , cz] = target.center ?? [0, 0, 0];
        const dist = Math.hypot(cameraPosition.x - cx, cameraPosition.z - cz);
        const nextVisible = dist <= target.maxDistance;
        if (obj.visible !== nextVisible) {
          obj.visible = nextVisible;
        }
      }
    };

    return subscribeCameraLod(updateVisibility);
  }, []);
}
