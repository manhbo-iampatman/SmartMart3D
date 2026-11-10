import React, { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, OrbitControls } from "@react-three/drei";
import type { Product } from "../../types";
import { getProductTextureById } from "../../utils/textureGenerator";

interface PreviewProps {
  product: Product;
  autoRotate: boolean;
  resetVersion: number;
}

const PreviewControls: React.FC<Omit<PreviewProps, "product"> & { size: number }> = ({ autoRotate, resetVersion, size }) => {
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null);
  useEffect(() => { controls.current?.reset(); }, [resetVersion]);
  return (
    <OrbitControls
      ref={controls}
      autoRotate={autoRotate}
      autoRotateSpeed={2}
      enablePan={false}
      minDistance={size * 1.5}
      maxDistance={size * 6}
      makeDefault
    />
  );
};

export const ProductPreview3D: React.FC<PreviewProps> = ({ product, autoRotate, resetVersion }) => {
  const [width, height, depth] = product.dimensions;
  const size = Math.max(width, height, depth);
  const texture = useMemo(() => getProductTextureById(product.id), [product.id]);
  const hasTexture = !!texture?.image;
  const isCylinder = ["prod-drink-coca", "prod-drink-sting", "prod-oil-simply"].includes(product.id);

  return (
    <Canvas camera={{ position: [0, size * 0.25, size * 3.2], fov: 40 }}>
      <ambientLight intensity={1.6} />
      <directionalLight position={[2, 3, 4]} intensity={3} />
      <directionalLight position={[-2, 1, -2]} intensity={1.4} />
      <Center>
        <mesh>
          {isCylinder
            ? <cylinderGeometry args={[width / 2, width / 2, height, 32]} />
            : <boxGeometry args={[width, height, depth]} />}
          <meshStandardMaterial map={hasTexture ? texture : undefined} color={hasTexture ? "#ffffff" : product.color} roughness={0.35} metalness={isCylinder ? 0.3 : 0.05} />
        </mesh>
      </Center>
      <PreviewControls autoRotate={autoRotate} resetVersion={resetVersion} size={size} />
    </Canvas>
  );
};
