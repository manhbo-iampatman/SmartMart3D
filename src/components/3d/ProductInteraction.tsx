import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../../stores/useAppStore";
import {
  findReachableProduct,
  isEditingText,
  isSpatialInputBlocked,
  PRODUCT_REACH_METERS,
  type ProductHit,
} from "../../utils/spatialInteraction";

export function useProductInteraction() {
  const { camera, gl, scene } = useThree();
  const outline = useRef<THREE.Mesh>(null);
  const pointer = useRef(new THREE.Vector2());
  const centerPointer = useMemo(() => new THREE.Vector2(0, 0), []);
  const pointerInside = useRef(true);
  const elapsed = useRef(0);
  const blocked = useAppStore(isSpatialInputBlocked);
  const raycaster = useMemo(() => new THREE.Raycaster(undefined, undefined, 0, PRODUCT_REACH_METERS), []);
  const pickablesRef = useRef<THREE.Object3D[]>([]);
  const transform = useMemo(() => ({
    instance: new THREE.Matrix4(),
    bounds: new THREE.Matrix4(),
    center: new THREE.Vector3(),
    size: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
  }), []);

  const pick = useCallback((fromCenter = false): ProductHit | null => {
    const ownerDocument = gl.domElement.ownerDocument;
    if (isSpatialInputBlocked(useAppStore.getState()) || isEditingText(ownerDocument.activeElement)) return null;
    const locked = ownerDocument.pointerLockElement === gl.domElement;
    if (!locked && !fromCenter && !pointerInside.current) return null;
    camera.updateMatrixWorld();
    raycaster.setFromCamera(locked || fromCenter ? centerPointer : pointer.current, camera);

    const pickables = pickablesRef.current;
    pickables.length = 0;
    if (typeof scene.traverse === "function") {
      scene.traverse((obj) => {
        if ((obj.layers.mask & 2) !== 0 && obj.visible) {
          pickables.push(obj);
        }
      });
    }

    if (pickables.length > 0) {
      raycaster.layers.set(1);
      return findReachableProduct(raycaster, pickables, false);
    }

    // Fallback Layer 0 cho unit test dùng mesh mặc định
    raycaster.layers.set(0);
    return findReachableProduct(raycaster, scene.children, true);
  }, [camera, gl, raycaster, scene, centerPointer]);

  const showTarget = useCallback((hit: ProductHit | null) => {
    useAppStore.getState().setHoveredTarget(
      hit?.product ?? null,
      hit ? Math.round(hit.intersection.distance * 10) / 10 : null
    );
    const mesh = outline.current;
    if (!mesh) return;
    mesh.visible = !!hit;
    if (!hit) return;
    const object = hit.intersection.object as THREE.Mesh;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox;
    if (!bounds) return;
    bounds.getCenter(transform.center);
    bounds.getSize(transform.size).multiplyScalar(1.08);
    transform.bounds.compose(transform.center, transform.quaternion, transform.size);
    mesh.matrix.copy(object.matrixWorld);
    if (object instanceof THREE.InstancedMesh && hit.intersection.instanceId !== undefined) {
      object.getMatrixAt(hit.intersection.instanceId, transform.instance);
      mesh.matrix.multiply(transform.instance);
    }
    mesh.matrix.multiply(transform.bounds);
    mesh.matrixWorldNeedsUpdate = true;
  }, [transform]);

  useEffect(() => {
    const canvas = gl.domElement;
    const ownerDocument = canvas.ownerDocument;
    const updatePointer = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      pointerInside.current = true;
    };
    const leave = () => {
      pointerInside.current = false;
      if (ownerDocument.pointerLockElement !== canvas) showTarget(null);
    };
    const openProduct = (fromCenter = false) => {
      const hit = pick(fromCenter); // Re-test at activation time; do not trust a stale hover.
      if (hit) useAppStore.getState().setInspectingProduct(hit.product);
    };
    const click = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (ownerDocument.pointerLockElement !== canvas) updatePointer(event);
      openProduct();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" || event.repeat || event.ctrlKey || event.altKey || event.metaKey || isEditingText(event.target)) return;
      if (isSpatialInputBlocked(useAppStore.getState()) || isEditingText(ownerDocument.activeElement)) return;
      event.preventDefault();
      openProduct(true);
    };
    const blur = () => { pointerInside.current = false; showTarget(null); };
    canvas.addEventListener("pointermove", updatePointer);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("click", click);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("blur", blur);
    return () => {
      canvas.removeEventListener("pointermove", updatePointer);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("click", click);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("blur", blur);
      useAppStore.getState().setHoveredTarget(null, null);
    };
  }, [gl, pick, showTarget]);

  useEffect(() => {
    if (blocked) showTarget(null);
  }, [blocked, showTarget]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 1 / 15) return;
    elapsed.current = 0;
    showTarget(pick());
  });

  return outline;
}

export const ProductInteraction: React.FC = () => {
  const outline = useProductInteraction();
  return (
    <mesh ref={outline} visible={false} matrixAutoUpdate={false} renderOrder={10} userData={{ ignoreProductRaycast: true }} raycast={() => {}}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
};
