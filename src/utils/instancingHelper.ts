import * as THREE from "three";

const _tmpColor = new THREE.Color();

/**
 * Helper dùng chung cập nhật danh sách ma trận (và màu từng instance qua setColorAt)
 * cho THREE.InstancedMesh, bỏ qua an toàn khi render trong JSDOM không có R3F reconciler.
 */
export function applyMatricesToInstancedMesh(
  mesh: THREE.InstancedMesh | null,
  matrices: readonly THREE.Matrix4[],
  postMultiplyRotationZ = 0,
  colors?: readonly THREE.ColorRepresentation[]
): void {
  if (!mesh || typeof mesh.setMatrixAt !== "function") return;

  if (postMultiplyRotationZ !== 0) {
    const rotMat = new THREE.Matrix4().makeRotationFromQuaternion(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, postMultiplyRotationZ))
    );
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < matrices.length; i++) {
      tmp.multiplyMatrices(matrices[i], rotMat);
      mesh.setMatrixAt(i, tmp);
    }
  } else {
    for (let i = 0; i < matrices.length; i++) {
      mesh.setMatrixAt(i, matrices[i]);
    }
  }

  if (colors && colors.length > 0 && typeof mesh.setColorAt === "function") {
    for (let i = 0; i < matrices.length; i++) {
      _tmpColor.set(colors[i] ?? "#ffffff");
      mesh.setColorAt(i, _tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}
