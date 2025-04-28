import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Text, 
  useKeyboardControls, 
  useHelper, 
  OrbitControls,
  Billboard,
  Stars
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
    if (selectedSystem && galaxyRef.current && systems.length > 0) {
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
  }, [selectedSystem, systems.length]);
  
  // Handle keyboard interactions
  useEffect(() => {
    if (interact && hovered) {
      setSelectedSystem(hovered);
      generateNewPlanet();
    }
  }, [interact]);
  
  // Background stars
  const renderStarfield = useMemo(() => {
    return (
      <Stars 
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0.5}
      />
    );
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
  
  // Update selection highlight
  useEffect(() => {
    if (hovered !== null) {
      playHit();
    }
  }, [hovered]);

  // Render a single star system
  const renderStarSystem = (system: any) => {
    return (
      <group key={system.id} position={system.position as any}>
        {/* Star core */}
        <mesh
          onClick={() => setSelectedSystem(system.id)}
          onPointerOver={() => setHovered(system.id)}
          onPointerOut={() => setHovered(null)}
        >
          <sphereGeometry args={[
            system.id === selectedSystem ? 0.8 : 0.5, 
            16, 16
          ]} />
          <meshBasicMaterial color={system.starColor} />
        </mesh>
        
        {/* Point light for each star */}
        <pointLight
          color={system.starColor}
          intensity={0.8}
          distance={10}
        />
        
        {/* Star type label */}
        <Billboard position={[0, -1, 0]}>
          <Text
            fontSize={0.3}
            color={system.starColor}
            anchorX="center"
            anchorY="middle"
          >
            {system.starType}
          </Text>
        </Billboard>
        
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
            
            {/* Selection ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
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
          <Billboard position={[0, -2, 0]}>
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
    );
  };

  return (
    <>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={200}
      />
      
      {/* Background starfield */}
      {renderStarfield}
      
      {/* Ambient light */}
      <ambientLight intensity={0.1} />
      
      {/* Galaxy center light */}
      <pointLight 
        ref={pointLightRef} 
        position={[0, 0, 0]} 
        intensity={1.5} 
        color="#ff8f60" 
        distance={100}
      />
      
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
        
        {/* Star systems */}
        {systems.map(renderStarSystem)}
      </group>
      
      {/* Selected system info */}
      {selectedSystem && systems.length > 0 && systems.find(s => s.id === selectedSystem) && (
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
            {systems.find(s => s.id === selectedSystem)?.name || "Unknown System"}
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
            {systems.find(s => s.id === selectedSystem)?.starType || "Unknown Type"}
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
            Planets: {systems.find(s => s.id === selectedSystem)?.planets || 0}
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
