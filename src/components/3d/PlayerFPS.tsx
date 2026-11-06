import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "../../stores/useAppStore";

export const PlayerFPS: React.FC = () => {
  const { camera } = useThree();
  const { target3DPosition, setTarget3DPosition } = useAppStore();
  const keys = useRef<{ [key: string]: boolean }>({});
  const [isLocked, setIsLocked] = useState(false);
  const controlsRef = useRef<any>(null);

  // Vị trí người chơi ban đầu ở đầu lối đi siêu thị
  useEffect(() => {
    camera.position.set(0, 1.65, 4.5);
    camera.lookAt(0, 1.65, 0);
  }, [camera]);

  // Nếu người dùng chọn "Tìm trên kệ" từ 2D: Di chuyển camera đến trước kệ đó
  useEffect(() => {
    if (target3DPosition) {
      const [tx, , tz] = target3DPosition;
      // Đứng cách kệ 1.2m
      const standX = tx > 0 ? tx - 1.1 : tx + 1.1;
      camera.position.set(standX, 1.65, tz);
      camera.lookAt(tx, 1.3, tz);
      setTarget3DPosition(null);
    }
  }, [target3DPosition, camera, setTarget3DPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const speed = 4.0; // mét trên giây

    const moveForward =
      (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) -
      (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0);
    const moveRight =
      (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);

    if (moveForward !== 0 || moveRight !== 0) {
      const frontVector = new THREE.Vector3(0, 0, -moveForward);
      const sideVector = new THREE.Vector3(moveRight, 0, 0);
      const direction = new THREE.Vector3();

      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(speed * delta);

      // Di chuyển theo hướng camera nhìn (giữ nguyên độ cao Y = 1.65m)
      camera.translateX(direction.x);
      camera.translateZ(direction.z);
    }

    // Giới hạn biên siêu thị không đi ra ngoài sàn (-8m đến 8m)
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7.0, 7.0);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6.5, 6.5);
    camera.position.y = 1.65; // Chiều cao mắt người
  });

  return (
    <>
      <PointerLockControls
        ref={controlsRef}
        onLock={() => setIsLocked(true)}
        onUnlock={() => setIsLocked(false)}
      />

      {/* Thông báo hướng dẫn khi chưa bấm khóa chuột */}
      {!isLocked && (
        <group>
          {/* Controls HUD is rendered in HTML overlay */}
        </group>
      )}
    </>
  );
};

