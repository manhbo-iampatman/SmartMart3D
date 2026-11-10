import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../../stores/useAppStore";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { floorDistance, getShelfApproach, moveWithCollisions } from "../../utils/pathfinding";
import {
  getWalkDisplacement,
  getProductFocusPosition,
  isEditingText,
  isSpatialInputBlocked,
  WALK_REQUEST_EVENT,
} from "../../utils/spatialInteraction";
import {
  playTeleportWhoosh,
  setCartMoving,
  updateFreezerHum,
  stopAllSupermarketSounds,
} from "../../utils/supermarketAudio";

interface FastTravelTransition {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  toQuat: THREE.Quaternion;
  elapsed: number;
  duration: number;
}

export const PlayerFPS: React.FC = () => {
  const { camera, gl, scene } = useThree();
  const target = useAppStore((state) => state.target3DPosition);
  const fastTravelTarget = useAppStore((state) => state.fastTravelTarget);
  const blocked = useAppStore(isSpatialInputBlocked);
  const keys = useRef<Record<string, boolean>>({});
  const displacement = useRef(new THREE.Vector3());
  const dragging = useRef(false);
  const poseElapsed = useRef(0);
  const fastTravel = useRef<FastTravelTransition | null>(null);
  const look = useRef({ matrix: new THREE.Matrix4(), quaternion: new THREE.Quaternion(), point: new THREE.Vector3(), direction: new THREE.Vector3() });

  const publishPose = (forcePlan = false) => {
    camera.getWorldDirection(look.current.direction);
    useNavigationStore.getState().updatePose(
      { x: camera.position.x, z: camera.position.z },
      Math.atan2(look.current.direction.x, -look.current.direction.z),
      forcePlan
    );
  };

  useEffect(() => {
    const { player, heading } = useNavigationStore.getState();
    camera.position.set(player.x, 1.65, player.z);
    camera.lookAt(player.x + Math.sin(heading), 1.65, player.z - Math.cos(heading));
  }, [camera]);

  useEffect(() => {
    if (!target) return;
    const [x, y, z] = target;
    const approach = getShelfApproach(target);
    if (approach) {
      camera.position.set(approach.x, 1.65, approach.z);
      const product = useAppStore.getState().activeNavigationProduct;
      if (product) camera.lookAt(getProductFocusPosition(product, scene));
      else camera.lookAt(x, y, z);
      publishPose();
    }
    keys.current = {};
    useAppStore.getState().setTarget3DPosition(null);
  }, [target, camera, scene]);

  useEffect(() => {
    if (!fastTravelTarget) return;
    const targetHeading = fastTravelTarget.heading ?? 0;
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      targetHeading
    );

    fastTravel.current = {
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(fastTravelTarget.x, 1.65, fastTravelTarget.z),
      fromQuat: camera.quaternion.clone(),
      toQuat: targetQuat,
      elapsed: 0,
      duration: 0.9,
    };
    keys.current = {};
    useNavigationStore.getState().setAutoWalking(false);
    playTeleportWhoosh();
  }, [fastTravelTarget, camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    const ownerDocument = canvas.ownerDocument;
    const rotation = new THREE.Euler(0, 0, 0, "YXZ");
    const previousMouse = new THREE.Vector2();
    const resetInput = () => {
      keys.current = {};
      dragging.current = false;
      useNavigationStore.getState().setAutoWalking(false);
      stopAllSupermarketSounds();
    };
    const unlock = () => {
      if (ownerDocument.pointerLockElement === canvas) ownerDocument.exitPointerLock?.();
    };
    const isBlocked = () => isSpatialInputBlocked(useAppStore.getState()) || isEditingText(ownerDocument.activeElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isBlocked() || isEditingText(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^(Key[WASD]|Arrow(Up|Down|Left|Right))$/.test(event.code)) {
        event.preventDefault();
        keys.current[event.code] = true;
        useNavigationStore.getState().setAutoWalking(false);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => { keys.current[event.code] = false; };
    const handleLockChange = () => {
      resetInput();
      useAppStore.getState().setIsPointerLocked(ownerDocument.pointerLockElement === canvas);
    };
    const handleLockError = () => {
      useAppStore.getState().setIsPointerLocked(false);
    };
    const requestWalk = () => {
      if (isBlocked()) return;
      try {
        if (canvas.requestPointerLock) {
          void Promise.resolve(canvas.requestPointerLock()).catch(handleLockError);
        }
      } catch { handleLockError(); }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 2 || isBlocked()) return;
      event.preventDefault();
      dragging.current = true;
      useNavigationStore.getState().setAutoWalking(false);
      previousMouse.set(event.clientX, event.clientY);
    };
    const handleMouseMove = (event: MouseEvent) => {
      if (isBlocked()) return;
      const locked = ownerDocument.pointerLockElement === canvas;
      if (!locked && !dragging.current) return;
      const dx = locked ? event.movementX : event.clientX - previousMouse.x;
      const dy = locked ? event.movementY : event.clientY - previousMouse.y;
      previousMouse.set(event.clientX, event.clientY);
      rotation.setFromQuaternion(camera.quaternion);
      rotation.y -= dx * 0.002;
      rotation.x = THREE.MathUtils.clamp(rotation.x - dy * 0.002, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
      camera.quaternion.setFromEuler(rotation);
    };
    const handlePointerUp = () => { dragging.current = false; };
    const handleBlur = () => { resetInput(); unlock(); };
    const preventContextMenu = (event: Event) => event.preventDefault();

    // Hỗ trợ cảm ứng vuốt xoay camera trên thiết bị di động (Touch swipe to look)
    const previousTouch = new THREE.Vector2();
    let isTouching = false;
    const handleTouchStart = (event: TouchEvent) => {
      if (isBlocked() || event.touches.length === 0) return;
      const touch = event.touches[0];
      previousTouch.set(touch.clientX, touch.clientY);
      isTouching = true;
      useNavigationStore.getState().setAutoWalking(false);
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (isBlocked() || !isTouching || event.touches.length === 0) return;
      const touch = event.touches[0];
      const dx = touch.clientX - previousTouch.x;
      const dy = touch.clientY - previousTouch.y;
      previousTouch.set(touch.clientX, touch.clientY);

      rotation.setFromQuaternion(camera.quaternion);
      rotation.y -= dx * 0.003;
      rotation.x = THREE.MathUtils.clamp(rotation.x - dy * 0.003, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
      camera.quaternion.setFromEuler(rotation);
    };
    const handleTouchEnd = () => {
      isTouching = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    window.addEventListener(WALK_REQUEST_EVENT, requestWalk);
    ownerDocument.addEventListener("focusin", resetInput);
    ownerDocument.addEventListener("mousemove", handleMouseMove);
    ownerDocument.addEventListener("pointerup", handlePointerUp);
    ownerDocument.addEventListener("pointerlockchange", handleLockChange);
    ownerDocument.addEventListener("pointerlockerror", handleLockError);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("contextmenu", preventContextMenu);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener(WALK_REQUEST_EVENT, requestWalk);
      ownerDocument.removeEventListener("focusin", resetInput);
      ownerDocument.removeEventListener("mousemove", handleMouseMove);
      ownerDocument.removeEventListener("pointerup", handlePointerUp);
      ownerDocument.removeEventListener("pointerlockchange", handleLockChange);
      ownerDocument.removeEventListener("pointerlockerror", handleLockError);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("contextmenu", preventContextMenu);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
      resetInput();
      publishPose();
      unlock();
      useAppStore.getState().setIsPointerLocked(false);
    };
  }, [camera, gl]);

  useEffect(() => {
    if (!blocked) return;
    keys.current = {};
    dragging.current = false;
    useNavigationStore.getState().setAutoWalking(false);
    if (gl.domElement.ownerDocument.pointerLockElement === gl.domElement) {
      gl.domElement.ownerDocument.exitPointerLock?.();
    }
    useAppStore.getState().setIsPointerLocked(false);
  }, [blocked, gl]);

  useFrame((_, delta) => {
    if (isSpatialInputBlocked(useAppStore.getState()) || isEditingText(gl.domElement.ownerDocument.activeElement)) return;

    // 1. Quản lý hoạt cảnh bay mượt Fast-Travel
    if (fastTravel.current) {
      fastTravel.current.elapsed += delta;
      const progress = Math.min(1, fastTravel.current.elapsed / fastTravel.current.duration);
      // Easing Hermite mượt mà
      const ease = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(fastTravel.current.fromPos, fastTravel.current.toPos, ease);
      camera.quaternion.slerpQuaternions(fastTravel.current.fromQuat, fastTravel.current.toQuat, ease);

      if (progress >= 1) {
        camera.position.copy(fastTravel.current.toPos);
        camera.quaternion.copy(fastTravel.current.toQuat);
        fastTravel.current = null;
        useAppStore.getState().setFastTravelTarget(null);
        publishPose(true);
      }
      return;
    }

    const vMove = useAppStore.getState().virtualMove;
    const keyForward = Number(!!(keys.current.KeyW || keys.current.ArrowUp)) - Number(!!(keys.current.KeyS || keys.current.ArrowDown));
    const keyRight = Number(!!(keys.current.KeyD || keys.current.ArrowRight)) - Number(!!(keys.current.KeyA || keys.current.ArrowLeft));
    const forward = keyForward !== 0 ? keyForward : vMove.forward;
    const right = keyRight !== 0 ? keyRight : vMove.right;
    const navigation = useNavigationStore.getState();
    const wasAutoWalking = navigation.autoWalking;
    if ((forward !== 0 || right !== 0) && wasAutoWalking) {
      useNavigationStore.getState().setAutoWalking(false);
    }

    // 2. Cập nhật âm thanh không gian (tiếng bánh xe lăn & tiếng rù tủ đông)
    const isMoving = forward !== 0 || right !== 0 || wasAutoWalking;
    setCartMoving(isMoving);
    updateFreezerHum(camera.position.x, camera.position.z);

    const from = { x: camera.position.x, z: camera.position.z };
    let to = from;
    if (forward || right) {
      getWalkDisplacement(camera, forward, right, delta, displacement.current);
      to = moveWithCollisions(from, { x: from.x + displacement.current.x, z: from.z + displacement.current.z });
    } else if (wasAutoWalking && navigation.path.length > 1) {
      const next = navigation.path[1];
      const distance = floorDistance(from, next);
      const step = Math.min(distance, 2.5 * Math.min(delta, 0.05));
      if (distance > 0.001) {
        to = moveWithCollisions(from, {
          x: from.x + ((next.x - from.x) / distance) * step,
          z: from.z + ((next.z - from.z) / distance) * step,
        });
        look.current.point.set(next.x, 1.65, next.z);
        look.current.matrix.lookAt(camera.position, look.current.point, camera.up);
        look.current.quaternion.setFromRotationMatrix(look.current.matrix);
        camera.quaternion.slerp(look.current.quaternion, 1 - Math.exp(-delta * 8));
      }
    }
    camera.position.x = to.x;
    camera.position.z = to.z;
    camera.position.y = 1.65;
    poseElapsed.current += delta;
    const reachedWaypoint = wasAutoWalking && !!navigation.path[1] && floorDistance(to, navigation.path[1]) < 0.02;
    if (poseElapsed.current >= 0.1 || reachedWaypoint) {
      poseElapsed.current = 0;
      publishPose(reachedWaypoint);
      if (wasAutoWalking && useNavigationStore.getState().status === "arrived") {
        const product = useAppStore.getState().activeNavigationProduct;
        if (product) { camera.lookAt(getProductFocusPosition(product, scene)); publishPose(); }
      }
    }
  });

  return null;
};

