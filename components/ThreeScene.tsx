
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AIState } from '../types';

interface ThreeSceneProps {
  aiState: AIState;
  focusMode: boolean;
}

const ElegantMorphingAvatar: React.FC<{ aiState: AIState; focusMode: boolean }> = ({ aiState, focusMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.IcosahedronGeometry>(null);
  
  // Warm, Elegant Color Palette
  const color = useMemo(() => {
    switch (aiState) {
      case 'listening': return new THREE.Color('#db2777'); // Pink-600
      case 'thinking': return new THREE.Color('#9333ea'); // Purple-600
      case 'speaking': return new THREE.Color('#f59e0b'); // Amber-500
      default: return new THREE.Color('#be185d'); // Pink-700 (Idle)
    }
  }, [aiState]);

  // Initial random noise for vertex displacement
  const noise = useMemo(() => {
    return new Float32Array(200).map(() => Math.random());
  }, []);

  useFrame((state) => {
    if (meshRef.current && geometryRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Gentle floating
      const targetZ = focusMode ? 3.5 : 0;
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.05);
      
      // Animation Parameters based on State
      let speed = 0.5;
      let amplitude = 0.1;
      
      if (aiState === 'speaking') {
          speed = 2.5;
          amplitude = 0.3;
      } else if (aiState === 'thinking') {
          speed = 3.0;
          amplitude = 0.15;
      } else if (aiState === 'listening') {
          speed = 1.0;
          amplitude = 0.2;
      }

      // Smooth Rotation
      meshRef.current.rotation.y += 0.002 * speed;
      meshRef.current.rotation.z += 0.001 * speed;

      // Color Transition
      if(meshRef.current.material instanceof THREE.MeshStandardMaterial) {
         meshRef.current.material.color.lerp(color, 0.05);
         meshRef.current.material.emissive.lerp(color, 0.05);
      }
      
      // Scale Pulse (Subtle breathing)
      const scale = 1 + Math.sin(time * speed) * (amplitude * 0.5);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry ref={geometryRef} args={[1.2, 4]} />{/* High poly for smooth look */}
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.1} 
        metalness={0.2}
        wireframe={true} // Elegant wireframe overlay
        transparent
        opacity={0.8}
      />
      {/* Inner Glow Core */}
      <mesh scale={[0.8, 0.8, 0.8]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} />
      </mesh>
    </mesh>
  );
};

const WarmParticles: React.FC<{ aiState: AIState }> = ({ aiState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      let speed = 0.0005;
      if (aiState !== 'idle') speed = 0.002;
      pointsRef.current.rotation.y += speed;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#fcd34d" sizeAttenuation transparent opacity={0.4} />
    </points>
  );
};

export const ThreeScene: React.FC<ThreeSceneProps> = ({ aiState, focusMode }) => {
  return (
    <div id="canvas-container" className="transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#f472b6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#fbbf24" />
        <ElegantMorphingAvatar aiState={aiState} focusMode={focusMode} />
        <WarmParticles aiState={aiState} />
      </Canvas>
    </div>
  );
};
