import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
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
import HyperdriveMiniGame from '@/components/minigames/HyperdriveMiniGame';

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
  // Removed audio references
  
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [galaxyRotation, setGalaxyRotation] = useState(0);
  const [systemViewMode, setSystemViewMode] = useState(false);
  const [showHyperdrive, setShowHyperdrive] = useState(false);
  
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
  
  // Create planet textures for more realistic appearances
  const createPlanetTexture = useCallback((planet: Planet, type = 'diffuse') => {
    // Seed the noise generator with the planet's ID for consistency
    let seedValue = planet.data.seed;
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
    
    // Create canvas for texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return new THREE.Texture();
    
    // Base color derived from planet color
    const baseColor = planet.color;
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    const rgb = hexToRgb(baseColor);
    
    // Function to create Perlin-like noise
    const createNoise = (scale: number, octaves: number) => {
      const noise = [];
      const size = canvas.width;
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let value = 0;
          let frequency = scale;
          let amplitude = 1;
          let maxValue = 0;
          
          // Generate multiple octaves of noise
          for (let o = 0; o < octaves; o++) {
            const noiseX = (x * frequency) / size;
            const noiseY = (y * frequency) / size;
            const seedOffset = o * 1000; // Different seed for each octave
            
            // Simple value noise
            const sampleX = Math.floor(noiseX);
            const sampleY = Math.floor(noiseY);
            const fracX = noiseX - sampleX;
            const fracY = noiseY - sampleY;
            
            // Get random values at corners
            const a = random() * 2 - 1;
            const b = random() * 2 - 1;
            const c = random() * 2 - 1;
            const d = random() * 2 - 1;
            
            // Interpolate values
            const e = a + (b - a) * fracX;
            const f = c + (d - c) * fracX;
            const noise = e + (f - e) * fracY;
            
            value += noise * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
          }
          
          // Normalize value
          value = (value / maxValue + 1) / 2;
          noise.push(value);
        }
      }
      
      return noise;
    };
    
    // Generate different types of textures
    switch (type) {
      case 'diffuse': {
        // Base terrain - basic noise pattern
        const terrainNoise = createNoise(4, 6);
        
        // Create variations based on planet type
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        let secondaryR = rgb.r;
        let secondaryG = rgb.g;
        let secondaryB = rgb.b;
        
        // Create secondary color based on planet type
        switch (planet.data.type) {
          case 'Lush':
            secondaryR = Math.max(0, rgb.r * 0.5);
            secondaryG = Math.min(255, rgb.g * 1.5); 
            secondaryB = Math.max(0, rgb.b * 0.7);
            break;
          case 'Desert':
            secondaryR = Math.min(255, rgb.r * 1.3);
            secondaryG = Math.min(255, rgb.g * 1.1);
            secondaryB = Math.max(0, rgb.b * 0.5);
            break;
          case 'Frozen':
            secondaryR = Math.min(255, rgb.r * 1.2);
            secondaryG = Math.min(255, rgb.g * 1.2);
            secondaryB = Math.min(255, rgb.b * 1.3);
            break;
          case 'Toxic':
          case 'Radioactive':
            secondaryR = Math.min(255, rgb.r * 0.8);
            secondaryG = Math.min(255, rgb.g * 1.2);
            secondaryB = Math.max(0, rgb.b * 0.5);
            break;
          case 'Volcanic':
            secondaryR = Math.min(255, rgb.r * 1.5);
            secondaryG = Math.max(0, rgb.g * 0.5);
            secondaryB = Math.max(0, rgb.b * 0.3);
            break;
          case 'Ocean':
            secondaryR = Math.max(0, rgb.r * 0.7);
            secondaryG = Math.min(255, rgb.g * 1.1);
            secondaryB = Math.min(255, rgb.b * 1.5);
            break;
          case 'Exotic':
            // Random vibrant color shift for exotic planets
            secondaryR = Math.min(255, rgb.r * (1 + random()));
            secondaryG = Math.min(255, rgb.g * (1 + random()));
            secondaryB = Math.min(255, rgb.b * (1 + random()));
            break;
        }
        
        // Apply noise to create terrain patterns
        for (let i = 0; i < terrainNoise.length; i++) {
          const index = i * 4;
          const noise = terrainNoise[i];
          
          // Mix colors based on noise
          imageData.data[index] = Math.floor(rgb.r * noise + secondaryR * (1 - noise));
          imageData.data[index + 1] = Math.floor(rgb.g * noise + secondaryG * (1 - noise));
          imageData.data[index + 2] = Math.floor(rgb.b * noise + secondaryB * (1 - noise));
          imageData.data[index + 3] = 255; // Alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add additional weather effects based on planet type
        if (planet.data.type === 'Ocean') {
          // Add wave patterns for ocean planets
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          
          for (let i = 0; i < 20; i++) {
            const y = Math.random() * canvas.height;
            const width = 20 + Math.random() * 30;
            ctx.fillRect(0, y, canvas.width, width);
          }
        } else if (planet.data.type === 'Frozen') {
          // Add frost patterns
          ctx.globalCompositeOperation = 'lighten';
          ctx.fillStyle = 'rgba(220, 240, 255, 0.2)';
          
          for (let i = 0; i < 30; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 5 + Math.random() * 20;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (planet.data.type === 'Volcanic') {
          // Add lava cracks
          ctx.globalCompositeOperation = 'lighten';
          ctx.strokeStyle = 'rgba(255, 160, 50, 0.6)';
          ctx.lineWidth = 2;
          
          for (let i = 0; i < 15; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            let currentX = x;
            let currentY = y;
            
            for (let j = 0; j < 5; j++) {
              currentX += (Math.random() - 0.5) * 50;
              currentY += (Math.random() - 0.5) * 50;
              ctx.lineTo(currentX, currentY);
            }
            
            ctx.stroke();
          }
        }
        break;
      }
      
      case 'bump': {
        // Generate bump map for rough terrain
        const bumpNoise = createNoise(8, 5);
        
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < bumpNoise.length; i++) {
          const index = i * 4;
          const value = Math.floor(bumpNoise[i] * 255);
          
          imageData.data[index] = value;
          imageData.data[index + 1] = value;
          imageData.data[index + 2] = value;
          imageData.data[index + 3] = 255; // Alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      
      case 'normal': {
        // Generate normal map for lighting details
        const normalNoise = createNoise(6, 4);
        
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < normalNoise.length; i++) {
          const index = i * 4;
          const noise = normalNoise[i];
          
          // Normal maps are RGB where:
          // Red = X direction (127 = neutral)
          // Green = Y direction (127 = neutral)
          // Blue = Z direction (255 = up/out)
          
          imageData.data[index] = 127 + (noise - 0.5) * 50; // X
          imageData.data[index + 1] = 127 + (noise - 0.5) * 50; // Y
          imageData.data[index + 2] = 255 * noise; // Z
          imageData.data[index + 3] = 255; // Alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
        break;
      }
      
      case 'displacement': {
        // Generate height map for terrain displacement
        const displacementNoise = createNoise(4, 6);
        
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Enhanced terrain features based on planet type
        const terrainFactor = (() => {
          switch (planet.data.type) {
            case 'Volcanic': return 1.5; // More dramatic mountains
            case 'Desert': return 1.2; // Moderate dunes and canyons
            case 'Frozen': return 1.3; // Icy peaks and valleys
            case 'Lush': return 1.0; // Balanced terrain
            case 'Ocean': return 0.6; // Mostly smooth with some islands
            default: return 1.0;
          }
        })();
        
        for (let i = 0; i < displacementNoise.length; i++) {
          const index = i * 4;
          // Apply terrain factor to create more dramatic landscapes for certain planet types
          const value = Math.floor(displacementNoise[i] * 255 * terrainFactor);
          
          imageData.data[index] = value;
          imageData.data[index + 1] = value;
          imageData.data[index + 2] = value;
          imageData.data[index + 3] = 255; // Alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
        break;
      }
    }
    
    // Create and return texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
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

  // Create black hole event horizon texture
  const blackHoleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create radial gradient for event horizon
      const gradient = ctx.createRadialGradient(
        128, 128, 0,
        128, 128, 128
      );
      
      // Deep black center
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      // Dark purple/blue edge
      gradient.addColorStop(0.7, 'rgba(20, 0, 40, 0.8)');
      // Distortion effect at the edge
      gradient.addColorStop(0.9, 'rgba(100, 50, 200, 0.6)');
      // Transparent outer edge
      gradient.addColorStop(1, 'rgba(150, 100, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);
  
  // Create accretion disk texture for black holes
  const accretionDiskTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
      
      // Create the accretion disk with colors ranging from blue to orange to yellow
      const centerX = 128;
      const centerY = 128;
      const innerRadius = 40;
      const outerRadius = 120;
      
      for (let r = innerRadius; r < outerRadius; r++) {
        // Color transition from blue to red to yellow
        let color;
        const normalized = (r - innerRadius) / (outerRadius - innerRadius);
        
        if (normalized < 0.3) {
          // Blue to purple
          const blue = Math.floor(255 - normalized * 3 * 100);
          color = `rgba(50, 0, ${blue}, ${1 - normalized})`;
        } else if (normalized < 0.7) {
          // Purple to red/orange
          const red = Math.floor(100 + normalized * 155);
          const green = Math.floor(normalized * 100);
          color = `rgba(${red}, ${green}, 150, ${1 - normalized * 0.5})`;
        } else {
          // Red/orange to yellow
          const red = 255;
          const green = Math.floor(100 + (normalized - 0.7) * 3 * 155);
          color = `rgba(${red}, ${green}, 0, ${1 - normalized})`;
        }
        
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Render a single star system in galaxy view
  const renderStarSystem = (system: StarSystem) => {
    // Determine if this system has a black hole
    const isBlackHole = system.hasBlackHole === true;
    
    return (
      <group key={system.id} position={system.position as any}>
        {isBlackHole ? (
          // Black Hole Rendering
          <>
            {/* Black hole event horizon */}
            <mesh
              onClick={() => setSelectedSystem(system.id)}
              onPointerOver={() => setHoveredSystem(system.id)}
              onPointerOut={() => setHoveredSystem(null)}
            >
              <sphereGeometry args={[
                system.id === selectedSystem ? 1.0 : 0.8, 
                32, 32
              ]} />
              <meshBasicMaterial 
                map={blackHoleTexture} 
                transparent={true}
                opacity={0.9}
              />
            </mesh>
            
            {/* Accretion disk */}
            <mesh 
              rotation={[Math.PI / 3, 0, 0]}
              position={[0, 0, 0]}
            >
              <ringGeometry args={[1.0, 3.0, 64]} />
              <meshBasicMaterial 
                map={accretionDiskTexture}
                transparent={true}
                opacity={0.8}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            
            {/* Gravitational lensing effect (distortion) */}
            <mesh>
              <sphereGeometry args={[2, 20, 20]} />
              <meshBasicMaterial 
                transparent={true}
                opacity={0.03}
                color="#8080ff"
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            
            {/* Point light with lower intensity for black hole */}
            <pointLight
              color="#5500ff"
              intensity={0.5}
              distance={15}
            />
          </>
        ) : (
          // Normal Star Rendering
          <>
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
          </>
        )}
        
        {/* System type label */}
        <Billboard position={[0, -1, 0]}>
          <Text
            fontSize={0.3}
            color={isBlackHole ? "#bb55ff" : system.starColor}
            anchorX="center"
            anchorY="middle"
          >
            {isBlackHole ? "Black Hole" : system.starType}
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
              <ringGeometry args={[
                isBlackHole ? 2.0 : 1.5,
                isBlackHole ? 2.3 : 1.8, 
                32
              ]} />
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
            roughness={0.8}
            metalness={0.3}
            displacementScale={0.1 * planet.size}
            displacementBias={-0.05 * planet.size}
            bumpScale={0.05}
            normalScale={new THREE.Vector2(0.5, 0.5)}
            map={createPlanetTexture(planet)}
            bumpMap={createPlanetTexture(planet, 'bump')}
            normalMap={createPlanetTexture(planet, 'normal')}
            displacementMap={createPlanetTexture(planet, 'displacement')}
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
    
    // Check if this system has a black hole
    const isBlackHole = currentSystem.hasBlackHole === true;
    
    return (
      <group ref={systemRef}>
        {isBlackHole ? (
          // Black hole at the center
          <>
            {/* Black hole event horizon */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[1.5, 32, 32]} />
              <meshBasicMaterial 
                map={blackHoleTexture} 
                transparent={true}
                opacity={0.9}
              />
            </mesh>
            
            {/* Accretion disk */}
            <mesh 
              rotation={[Math.PI / 3, 0, 0]}
              position={[0, 0, 0]}
            >
              <ringGeometry args={[1.5, 4.5, 64]} />
              <meshBasicMaterial 
                map={accretionDiskTexture}
                transparent={true}
                opacity={0.8}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            
            {/* Gravitational lensing effect (distortion) */}
            <mesh>
              <sphereGeometry args={[3, 24, 24]} />
              <meshBasicMaterial 
                transparent={true}
                opacity={0.03}
                color="#8080ff"
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            
            {/* Point light with purple hue for black hole */}
            <pointLight 
              position={[0, 0, 0]} 
              color="#5500ff" 
              intensity={1.0} 
              distance={50}
            />
          </>
        ) : (
          // Normal star at the center
          <>
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
          </>
        )}
        
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
            color={isBlackHole ? "#bb55ff" : "#cccccc"}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.5, 0]}
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {isBlackHole ? "Black Hole System" : currentSystem.starType}
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
          onClick={() => setShowHyperdrive(true)}
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
      
      {/* Hyperdrive mini-game */}
      {showHyperdrive && <HyperdriveMiniGame onClose={() => setShowHyperdrive(false)} />}
    </>
  );
}
