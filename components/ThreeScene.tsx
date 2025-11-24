
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AIState } from '../types';

interface ThreeSceneProps {
  aiState: AIState;
  focusMode: boolean; // If true, avatar moves to front and center
}

const CoreAvatar: React.FC<{ aiState: AIState; focusMode: boolean }> = ({ aiState, focusMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Dynamic color based on state
  const color = useMemo(() => {
    switch (aiState) {
      case 'listening': return new THREE.Color('#ef4444'); // Red
      case 'thinking': return new THREE.Color('#06b6d4'); // Cyan
      case 'speaking': return new THREE.Color('#10b981'); // Green
      default: return new THREE.Color('#8b5cf6'); // Violet
    }
  }, [aiState]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Position Interpolation
      // Standard: 0,0,0
      // Focus Mode: Closer to camera (z=4) and slightly centered (y=-0.5)
      const targetPos = focusMode ? new THREE.Vector3(0, 0, 4) : new THREE.Vector3(0, 0, 0);
      meshRef.current.position.lerp(targetPos, 0.05);

      // Pulse size based on state - SCALED DOWN 65% from original 1.5
      // Original Base: 1.5. New Target: ~0.55
      let baseScale = focusMode ? 0.6 : 0.4; 
      let scale = baseScale;
      
      if (aiState === 'speaking') {
         scale = baseScale + Math.sin(time * 10) * 0.1;
      } else if (aiState === 'thinking') {
         scale = baseScale + Math.sin(time * 5) * 0.05;
      } else {
         scale = baseScale + Math.sin(time) * 0.02;
      }
      meshRef.current.scale.set(scale, scale, scale);
      
      // Rotate
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;
      
      // Update Material Color
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.color.lerp(color, 0.1);
      material.emissive.lerp(color, 0.1);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.6, 64, 64]} /> {/* Radius scaled down */}
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.7}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

const BackgroundParticles: React.FC<{ focusMode: boolean }> = ({ focusMode }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // Depth
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x += 0.0005;
      // Fade out effect if focused?
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = focusMode ? 0.3 : 0.8;
      material.transparent = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffffff" sizeAttenuation />
    </points>
  );
};

export const ThreeScene: React.FC<ThreeSceneProps> = ({ aiState, focusMode }) => {
  return (
    <div id="canvas-container" className="transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4c1d95" />
        
        <CoreAvatar aiState={aiState} focusMode={focusMode} />
        <BackgroundParticles focusMode={focusMode} />
      </Canvas>
    </div>
  );
};
