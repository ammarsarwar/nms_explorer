import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Text, 
  useKeyboardControls, 
  useHelper, 
  OrbitControls,
  Billboard
} from '@react-three/drei';
import { useGalaxy } from '@/lib/stores/useGalaxy';
import { usePlanet } from '@/lib/stores/usePlanet';
import { useAudio } from '@/lib/stores/useAudio';

enum Controls {
  forward = 'forward',
  backward = 'backward',
  leftward = 'leftward',
  rightward = 'rightward',
  zoomIn = 'zoomIn',
  zoomOut = 'zoomOut',
  interact = 'interact'
}

export default function GalaxyMap() {
  const { systems, selectedSystem, setSelectedSystem } = useGalaxy();
  const { generateNewPlanet } = usePlanet();
  const { playHit, playSuccess } = useAudio();
  
  const [hovered, setHovered] = useState<string | null>(null);
  const [galaxyRotation, setGalaxyRotation] = useState(0);
  
  const galaxyRef = useRef<THREE.Group>(null);
  const selectedRef = useRef<THREE.Mesh | null>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // Get keyboard controls
  const forward = useKeyboardControls(state => state.forward);
  const backward = useKeyboardControls(state => state.backward);
  const leftward = useKeyboardControls(state => state.leftward);
  const rightward = useKeyboardControls(state => state.rightward);
  const zoomIn = useKeyboardControls(state => state.zoomIn);
  const zoomOut = useKeyboardControls(state => state.zoomOut);
  const interact = useKeyboardControls(state => state.interact);
  
  const { camera } = useThree();
  
  // Highlight the selected system when it changes
  useEffect(() => {
    if (selectedSystem && galaxyRef.current) {
      const system = systems.find(s => s.id === selectedSystem);
      if (system) {
        // Move camera to look at the selected system
        const target = new THREE.Vector3(system.position[0], system.position[1], system.position[2]);
        camera.position.set(target.x + 5, target.y + 20, target.z + 5);
        camera.lookAt(target);
        
        // Play selection sound
        playSuccess();
      }
    }
  }, [selectedSystem]);
  
  // Handle keyboard interactions
  useEffect(() => {
    if (interact && hovered) {
      setSelectedSystem(hovered);
      generateNewPlanet();
    }
  }, [interact]);
  
  // Create star particles for the galaxy background
  const starfieldParticles = useMemo(() => {
    const particlesCount = 2000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);
    
    for (let i = 0; i < particlesCount; i++) {
      // Random position across a larger area
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 500;
      positions[i3 + 1] = (Math.random() - 0.5) * 500;
      positions[i3 + 2] = (Math.random() - 0.5) * 500;
      
      // Colors - mostly white/blue with some variation
      colors[i3] = 0.8 + Math.random() * 0.2;
      colors[i3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i3 + 2] = 0.9 + Math.random() * 0.1;
      
      // Random sizes
      sizes[i] = Math.random() * 2;
    }
    
    return { positions, colors, sizes };
  }, []);
  
  // Create galaxy center glow
  const galaxyCenter = useMemo(() => {
    const texture = new THREE.CanvasTexture(createGlowTexture());
    return texture;
    
    function createGlowTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const gradient = ctx.createRadialGradient(
          64, 64, 0, 
          64, 64, 64
        );
        
        gradient.addColorStop(0, 'rgba(255, 220, 150, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 180, 120, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 140, 80, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
      }
      
      return canvas;
    }
  }, []);
  
  // Spiral arms geometry
  const spiralArms = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // Create spiral arms dust
    const arms = 2; // Number of spiral arms
    const armAngle = 2 * Math.PI / arms;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const arm = i % arms;
      const distance = 5 + Math.random() * 80; // Distance from center
      const angle = arm * armAngle + distance * 0.03; // Angle including spiral effect
      
      // Add some randomness to the spiral pattern
      const angleOffset = (Math.random() - 0.5) * 0.6;
      const distanceOffset = (Math.random() - 0.5) * 20;
      
      // Convert to Cartesian coordinates
      positions[i3] = (distance + distanceOffset) * Math.cos(angle + angleOffset);
      positions[i3 + 1] = (Math.random() - 0.5) * 5; // Small vertical spread
      positions[i3 + 2] = (distance + distanceOffset) * Math.sin(angle + angleOffset);
      
      // Colors with gradient from center (yellowish) to edges (bluish)
      const normalizedDistance = distance / 80;
      colors[i3] = 0.8 - normalizedDistance * 0.5; // R: decrease toward edges
      colors[i3 + 1] = 0.7 - normalizedDistance * 0.3; // G: decrease toward edges
      colors[i3 + 2] = 0.6 + normalizedDistance * 0.4; // B: increase toward edges
      
      // Sizes, smaller toward edges
      sizes[i] = 2 * (1 - normalizedDistance * 0.7);
    }
    
    return { positions, colors, sizes };
  }, []);
  
  // Galaxy animation
  useFrame(({ clock }, delta) => {
    const elapsedTime = clock.getElapsedTime();
    
    if (galaxyRef.current) {
      // Very slow rotation of the galaxy
      setGalaxyRotation(prev => prev + delta * 0.05);
      galaxyRef.current.rotation.y = galaxyRotation;
    }
    
    if (pointLightRef.current) {
      // Subtle pulsing of the center light
      pointLightRef.current.intensity = 1.5 + Math.sin(elapsedTime * 0.5) * 0.3;
    }
    
    // Handle keyboard controls for camera movement
    if (forward) camera.position.z -= 1;
    if (backward) camera.position.z += 1;
    if (leftward) camera.position.x -= 1;
    if (rightward) camera.position.x += 1;
    if (zoomIn) camera.position.y -= 1;
    if (zoomOut) camera.position.y += 1;
  });
  
  // For debugging
  // useHelper(pointLightRef, THREE.PointLightHelper, 1);
  
  // Update selection highlight
  useEffect(() => {
    if (hovered !== null) {
      playHit();
    }
  }, [hovered]);

  return (
    <>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={200}
      />
      
      <ambientLight intensity={0.1} />
      <pointLight 
        ref={pointLightRef} 
        position={[0, 0, 0]} 
        intensity={1.5} 
        color="#ff8f60" 
        distance={100}
      />
      
      {/* Background starfield */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starfieldParticles.positions.length / 3}
            array={starfieldParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={starfieldParticles.colors.length / 3}
            array={starfieldParticles.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={starfieldParticles.sizes.length}
            array={starfieldParticles.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1}
          vertexColors
          transparent
          sizeAttenuation
        />
      </points>
      
      <group ref={galaxyRef}>
        {/* Galaxy center */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial color="#ffb347" />
        </mesh>
        
        {/* Galaxy center glow */}
        <sprite position={[0, 0, 0]} scale={[15, 15, 1]}>
          <spriteMaterial
            map={galaxyCenter}
            transparent
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        
        {/* Spiral arms dust */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={spiralArms.positions.length / 3}
              array={spiralArms.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={spiralArms.colors.length / 3}
              array={spiralArms.colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={spiralArms.sizes.length}
              array={spiralArms.sizes}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            size={1.5}
            vertexColors
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
        
        {/* Star systems */}
        {systems.map((system) => (
          <group key={system.id} position={system.position as any}>
            {/* Star */}
            <mesh
              onClick={() => setSelectedSystem(system.id)}
              onPointerOver={() => setHovered(system.id)}
              onPointerOut={() => setHovered(null)}
            >
              <sphereGeometry args={[
                system.id === selectedSystem ? 1 : 0.7, 
                16, 16
              ]} />
              <meshBasicMaterial 
                color={system.starColor} 
                emissive={system.starColor}
                emissiveIntensity={system.id === selectedSystem ? 2 : 1}
              />
            </mesh>
            
            {/* Glow effect */}
            <sprite scale={[
              system.id === selectedSystem ? 4 : 2, 
              system.id === selectedSystem ? 4 : 2, 
              1
            ]}>
              <spriteMaterial
                color={system.starColor}
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
            
            {/* Selection indicator */}
            {(system.id === selectedSystem || system.id === hovered) && (
              <group>
                <Billboard>
                  <Text
                    fontSize={0.8}
                    color={system.id === selectedSystem ? "#00ffff" : "#ffffff"}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, 2, 0]}
                    outlineWidth={0.05}
                    outlineColor="#000000"
                  >
                    {system.name}
                  </Text>
                </Billboard>
                
                {/* Ring indicator */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                  <ringGeometry args={[1.5, 1.8, 32]} />
                  <meshBasicMaterial 
                    color={system.id === selectedSystem ? "#00ffff" : "#ffffff"} 
                    transparent 
                    opacity={0.6}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            )}
            
            {/* Discovered indicator */}
            {system.discovered && (
              <Billboard position={[0, -1.5, 0]}>
                <Text
                  fontSize={0.6}
                  color="#00ff00"
                  anchorX="center"
                  anchorY="middle"
                >
                  DISCOVERED
                </Text>
              </Billboard>
            )}
          </group>
        ))}
      </group>
      
      {/* Selected system info */}
      {selectedSystem && (
        <group position={[0, -15, 0]}>
          <Text
            fontSize={1.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            position={[0, 0, 0]}
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {systems.find(s => s.id === selectedSystem)?.name}
          </Text>
          <Text
            fontSize={0.8}
            color="#cccccc"
            anchorX="center"
            anchorY="middle"
            position={[0, -1.5, 0]}
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {systems.find(s => s.id === selectedSystem)?.starType}
          </Text>
          <Text
            fontSize={0.8}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
            position={[0, -3, 0]}
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            Planets: {systems.find(s => s.id === selectedSystem)?.planets}
          </Text>
        </group>
      )}
      
      {/* Instructions */}
      <group position={[0, 20, 0]}>
        <Text
          fontSize={1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0]}
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          Click on a star system to select it
        </Text>
        <Text
          fontSize={0.8}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          position={[0, -1.5, 0]}
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          Press F to travel to selected system
        </Text>
      </group>
    </>
  );
}
