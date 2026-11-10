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
  const isCylinder = ["prod-drink-coca", "prod-drink-sting", "prod-oil-simply", "prod-produce-cucumber"].includes(product.id);
  const isSphere = ["prod-produce-apple", "prod-produce-lemon", "prod-produce-avocado", "prod-produce-tomato"].includes(product.id);
  const isCap = product.id === "prod-apparel-cap";

  return (
    <Canvas dpr={[1, 1.8]} camera={{ position: [0, size * 0.25, size * 3.2], fov: 40 }}>
      <ambientLight intensity={1.6} />
      <directionalLight position={[2, 3, 4]} intensity={3} />
      <directionalLight position={[-2, 1, -2]} intensity={1.4} />
      <Center>
        <mesh>
          {isCylinder ? (
            <cylinderGeometry args={[width / 2, width / 2, height, 28]} />
          ) : isSphere ? (
            <sphereGeometry args={[Math.min(width, depth) / 2, 24, 24]} />
          ) : isCap ? (
            <sphereGeometry args={[width / 2, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          ) : (
            <boxGeometry args={[width, height, depth]} />
          )}
          <meshStandardMaterial map={hasTexture ? texture : undefined} color={hasTexture ? "#ffffff" : product.color} roughness={0.35} metalness={isCylinder ? 0.25 : 0.05} />
        </mesh>
      </Center>
      <PreviewControls autoRotate={autoRotate} resetVersion={resetVersion} size={size} />
    </Canvas>
  );
};
