
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AIState } from '../types';

interface ThreeSceneProps {
  aiState: AIState;
  focusMode: boolean;
}

const CyberCoinAvatar: React.FC<{ aiState: AIState; focusMode: boolean }> = ({ aiState, focusMode }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  const color = useMemo(() => {
    switch (aiState) {
      case 'listening': return new THREE.Color('#ef4444');
      case 'thinking': return new THREE.Color('#06b6d4');
      case 'speaking': return new THREE.Color('#10b981');
      default: return new THREE.Color('#8b5cf6');
    }
  }, [aiState]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Base Animation
      let rotSpeed = 0.5;
      let bobAmount = 0.1;
      let bobSpeed = 2;

      if (aiState === 'speaking') {
          rotSpeed = 3;
          bobAmount = 0.2;
          bobSpeed = 8;
      } else if (aiState === 'thinking') {
          rotSpeed = 5;
          bobAmount = 0.05;
      }

      meshRef.current.rotation.y += 0.02 * rotSpeed;
      meshRef.current.position.y = Math.sin(time * bobSpeed) * bobAmount;
      
      const targetZ = focusMode ? 4 : 0;
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.1);

      // Pulse color
      meshRef.current.children.forEach((child: any) => {
          if(child.material) {
              child.material.emissive.lerp(color, 0.1);
              child.material.color.lerp(color, 0.1);
          }
      });
    }
  });

  return (
    <group ref={meshRef}>
      {/* Outer Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.1, 16, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Inner Core */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Symbol (Simulated by boxes) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

const BackgroundParticles: React.FC<{ aiState: AIState; focusMode: boolean }> = ({ aiState, focusMode }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return positions;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      let speed = 0.001;
      if (aiState === 'speaking') speed = 0.005;
      if (aiState === 'thinking') speed = 0.01;
      
      pointsRef.current.rotation.y += speed;
      pointsRef.current.rotation.x += speed * 0.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#ffffff" sizeAttenuation transparent opacity={focusMode ? 0.3 : 0.6} />
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
        <CyberCoinAvatar aiState={aiState} focusMode={focusMode} />
        <BackgroundParticles aiState={aiState} focusMode={focusMode} />
      </Canvas>
    </div>
  );
};
