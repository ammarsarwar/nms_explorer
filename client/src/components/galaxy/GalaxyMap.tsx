import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Text, 
  useKeyboardControls, 
  OrbitControls,
  Billboard,
  Stars
} from '@react-three/drei';
import { useGalaxy, StarSystem, Planet } from '@/lib/stores/useGalaxy';
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
  const { 
    systems, 
    selectedSystem, 
    setSelectedSystem,
    selectedPlanet,
    setSelectedPlanet,
    activePlanetView,
    enterPlanetView,
    exitPlanetView,
    currentGalaxy,
    hyperfuel
  } = useGalaxy();
  
  const { generateNewPlanet } = usePlanet();
  const { playHit, playSuccess } = useAudio();
  
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [galaxyRotation, setGalaxyRotation] = useState(0);
  const [systemViewMode, setSystemViewMode] = useState(false);
  
  const galaxyRef = useRef<THREE.Group>(null);
  const systemRef = useRef<THREE.Group>(null);
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
  
  // Get the current system
  const currentSystem = useMemo(() => {
    return systems.find(s => s.id === selectedSystem) || null;
  }, [systems, selectedSystem]);
  
  // Get the current planet
  const currentPlanet = useMemo(() => {
    if (!currentSystem || !selectedPlanet) return null;
    return currentSystem.planetList.find(p => p.id === selectedPlanet) || null;
  }, [currentSystem, selectedPlanet]);
  
  // Toggle between galaxy view and system view
  useEffect(() => {
    if (selectedSystem && !systemViewMode) {
      setSystemViewMode(true);
    }
  }, [selectedSystem]);
  
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
    if (interact) {
      if (hoveredSystem) {
        setSelectedSystem(hoveredSystem);
        generateNewPlanet();
      } else if (hoveredPlanet && hoveredPlanet !== null) {
        setSelectedPlanet(hoveredPlanet);
        enterPlanetView();
      }
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
  
  // Planet orbiting animation
  useFrame(({ clock }, delta) => {
    const elapsedTime = clock.getElapsedTime();
    
    if (galaxyRef.current && !systemViewMode) {
      // Very slow rotation of the galaxy
      setGalaxyRotation(prev => prev + delta * 0.05);
      galaxyRef.current.rotation.y = galaxyRotation;
    }
    
    if (pointLightRef.current) {
      // Subtle pulsing of the center light
      pointLightRef.current.intensity = 1.5 + Math.sin(elapsedTime * 0.5) * 0.3;
    }
    
    // Animate planets orbiting around their star
    if (systemRef.current && currentSystem) {
      // Get all planet meshes
      const planetMeshes = systemRef.current.children.filter(
        child => child.userData?.isPlanet
      );
      
      // Animate each planet
      planetMeshes.forEach((planetMesh) => {
        const { id, orbitSpeed, orbitRadius } = planetMesh.userData.planetData;
        
        // Create orbit animation
        const angle = elapsedTime * orbitSpeed;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        
        // Update position
        planetMesh.position.x = x;
        planetMesh.position.z = z;
        
        // Rotate planet on its axis
        planetMesh.rotation.y += delta * planetMesh.userData.planetData.rotationSpeed;
      });
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
    if (hoveredSystem !== null) {
      playHit();
    }
  }, [hoveredSystem]);
  
  useEffect(() => {
    if (hoveredPlanet !== null) {
      playHit();
    }
  }, [hoveredPlanet]);

  // Render a single star system in galaxy view
  const renderStarSystem = (system: StarSystem) => {
    return (
      <group key={system.id} position={system.position as any}>
        {/* Star core */}
        <mesh
          onClick={() => setSelectedSystem(system.id)}
          onPointerOver={() => setHoveredSystem(system.id)}
          onPointerOut={() => setHoveredSystem(null)}
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
        {(system.id === selectedSystem || system.id === hoveredSystem) && (
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
  
  // Render a planet in system view
  const renderPlanet = (planet: Planet) => {
    // Get planet's initial position based on orbit radius
    const orbitAngle = Math.random() * Math.PI * 2;
    const x = Math.cos(orbitAngle) * planet.orbitRadius;
    const z = Math.sin(orbitAngle) * planet.orbitRadius;
    
    return (
      <group 
        key={planet.id} 
        position={[x, planet.position[1], z]}
        userData={{
          isPlanet: true,
          planetData: planet
        }}
      >
        {/* Planet sphere */}
        <mesh
          onClick={() => {
            setSelectedPlanet(planet.id);
            enterPlanetView();
          }}
          onPointerOver={() => setHoveredPlanet(planet.id)}
          onPointerOut={() => setHoveredPlanet(null)}
        >
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshStandardMaterial 
            color={planet.color}
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>
        
        {/* Selection indicator */}
        {(planet.id === selectedPlanet || planet.id === hoveredPlanet) && (
          <group>
            <Billboard>
              <Text
                fontSize={0.3}
                color={planet.id === selectedPlanet ? "#00ffff" : "#ffffff"}
                anchorX="center"
                anchorY="middle"
                position={[0, planet.size + 0.5, 0]}
                outlineWidth={0.05}
                outlineColor="#000000"
              >
                {planet.name}
              </Text>
              
              <Text
                fontSize={0.2}
                color={planet.id === selectedPlanet ? "#88ffff" : "#cccccc"}
                anchorX="center"
                anchorY="middle"
                position={[0, planet.size + 0.8, 0]}
                outlineWidth={0.05}
                outlineColor="#000000"
              >
                {planet.type}
              </Text>
            </Billboard>
            
            {/* Selection ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planet.size + 0.2, planet.size + 0.3, 32]} />
              <meshBasicMaterial 
                color={planet.id === selectedPlanet ? "#00ffff" : "#ffffff"} 
                transparent 
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )}
        
        {/* Planet's orbit path */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-x, -planet.position[1], -z]}>
          <ringGeometry args={[planet.orbitRadius - 0.02, planet.orbitRadius + 0.02, 64]} />
          <meshBasicMaterial 
            color="#444466" 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Discovered indicator */}
        {planet.discovered && (
          <Billboard position={[0, planet.size + 1.2, 0]}>
            <Text
              fontSize={0.2}
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

  // Render system view when a system is selected
  const renderSystemView = () => {
    if (!currentSystem) return null;
    
    return (
      <group ref={systemRef}>
        {/* Central star */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color={currentSystem.starColor} />
        </mesh>
        
        {/* Star glow */}
        <pointLight 
          position={[0, 0, 0]} 
          color={currentSystem.starColor} 
          intensity={1.5} 
          distance={50}
        />
        
        {/* Planets */}
        {currentSystem.planetList.map(renderPlanet)}
        
        {/* System info */}
        <Billboard position={[0, 4, 0]}>
          <Text
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {currentSystem.name}
          </Text>
          <Text
            fontSize={0.3}
            color="#cccccc"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.5, 0]}
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {currentSystem.starType}
          </Text>
        </Billboard>
        
        {/* Back to galaxy button */}
        <Billboard position={[0, -4, 0]}>
          <group 
            onClick={() => {
              setSystemViewMode(false);
              setSelectedSystem(null)
            }}
            onPointerOver={() => playHit()}
          >
            <mesh>
              <planeGeometry args={[3, 0.8]} />
              <meshBasicMaterial color="#114455" />
            </mesh>
            <Text
              fontSize={0.4}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              Return to Galaxy
            </Text>
          </group>
        </Billboard>
      </group>
    );
  };

  return (
    <>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={200}
      />
      
      {/* Background starfield */}
      {renderStarfield}
      
      {/* Ambient light */}
      <ambientLight intensity={0.1} />
      
      {/* Hyperfuel indicator */}
      <Billboard position={[15, 15, 0]}>
        <Text
          fontSize={0.5}
          color="#ffaa22"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          Hyperfuel: {hyperfuel} units
        </Text>
      </Billboard>
      
      {/* Galaxy indicator */}
      <Billboard position={[-15, 15, 0]}>
        <Text
          fontSize={0.5}
          color="#22aaff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          Galaxy: {currentGalaxy.charAt(0).toUpperCase() + currentGalaxy.slice(1)}
        </Text>
      </Billboard>
      
      {systemViewMode && selectedSystem ? (
        // System view - show selected system with planets
        renderSystemView()
      ) : (
        // Galaxy view - show all star systems
        <group ref={galaxyRef}>
          {/* Galaxy center light */}
          <pointLight 
            ref={pointLightRef} 
            position={[0, 0, 0]} 
            intensity={1.5} 
            color="#ff8f60" 
            distance={100}
          />
        
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
          
          {/* Galaxy instructions */}
          <Billboard position={[0, 15, 0]}>
            <Text
              fontSize={0.7}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              Click on a star to view its planets
            </Text>
          </Billboard>
        </group>
      )}
      
      {/* Hyperdrive mini-game button */}
      <Billboard position={[0, -15, 0]}>
        <group
          onClick={() => {
            // TODO: Open hyperdrive mini-game
            console.log("Opening hyperdrive mini-game");
          }}
          onPointerOver={() => playHit()}
        >
          <mesh>
            <planeGeometry args={[8, 1.2]} />
            <meshBasicMaterial color="#551144" />
          </mesh>
          <Text
            fontSize={0.5}
            color="#ffaaff"
            anchorX="center"
            anchorY="middle"
          >
            Activate Hyperdrive
          </Text>
        </group>
      </Billboard>
    </>
  );
}
