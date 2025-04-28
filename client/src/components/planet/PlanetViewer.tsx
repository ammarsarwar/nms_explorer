import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  useTexture, 
  OrbitControls, 
  Stars,
  Text
} from '@react-three/drei';
import { useKeyboardControls } from '@react-three/drei';
import { usePlanet } from '@/lib/stores/usePlanet';
import { PlanetData } from './ProcGen';
import atmosphereVertex from '@/assets/shaders/atmosphere';
import PlanetDetails from './PlanetDetails';

// Define controls
enum Controls {
  forward = 'forward',
  backward = 'backward',
  leftward = 'leftward',
  rightward = 'rightward',
  zoomIn = 'zoomIn',
  zoomOut = 'zoomOut',
  interact = 'interact',
}

export default function PlanetViewer() {
  const { currentPlanet, generateNewPlanet } = usePlanet();
  const planetGroup = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  // Get keyboard controls
  const forward = useKeyboardControls(state => state.forward);
  const backward = useKeyboardControls(state => state.backward);
  const leftward = useKeyboardControls(state => state.leftward);
  const rightward = useKeyboardControls(state => state.rightward);
  const zoomIn = useKeyboardControls(state => state.zoomIn);
  const zoomOut = useKeyboardControls(state => state.zoomOut);
  const interact = useKeyboardControls(state => state.interact);
  
  useEffect(() => {
    if (interact) {
      generateNewPlanet();
    }
  }, [interact]);

  // Create color texture based on planet data
  const planetTexture = useMemo(() => {
    if (!currentPlanet) return null;
    
    // Create a canvas to generate the texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Base color from planet data
    const color = new THREE.Color(currentPlanet.color.surface);
    
    // Fill with base color
    ctx.fillStyle = currentPlanet.color.surface;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise and features based on planet type
    // Different patterns for different planet types
    if (['Lush'].includes(currentPlanet.type)) {
      // Add landmass patterns
      ctx.fillStyle = new THREE.Color(color).offsetHSL(0, 0, 0.1).getStyle();
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 50 + Math.random() * 100;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add water areas
      ctx.fillStyle = currentPlanet.color.water;
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 30 + Math.random() * 80;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (['Desert', 'Barren'].includes(currentPlanet.type)) {
      // Add cracks and dunes
      ctx.strokeStyle = new THREE.Color(color).offsetHSL(0, 0, -0.1).getStyle();
      ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = 100 + Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(angle) * length,
          y + Math.sin(angle) * length
        );
        ctx.stroke();
      }
    } else if (['Frozen'].includes(currentPlanet.type)) {
      // Add ice caps and cracks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 0, canvas.height / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height, canvas.height / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Add cracks
      ctx.strokeStyle = '#99ccff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = 50 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(angle) * length,
          y + Math.sin(angle) * length
        );
        ctx.stroke();
      }
    } else if (['Toxic', 'Radioactive'].includes(currentPlanet.type)) {
      // Add toxic pools and patterns
      ctx.fillStyle = new THREE.Color(color).offsetHSL(0.05, 0.2, 0.1).getStyle();
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 30 + Math.random() * 70;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (['Exotic', 'Anomalous'].includes(currentPlanet.type)) {
      // Add exotic patterns
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 10 + Math.random() * 30;
        
        // Random colors for exotic planets
        ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (['Volcanic'].includes(currentPlanet.type)) {
      // Add lava flows
      ctx.fillStyle = '#ff4400';
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const width = 20 + Math.random() * 50;
        const height = 100 + Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.restore();
      }
      
      // Add bright spots for active volcanoes
      ctx.fillStyle = '#ffaa00';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 5 + Math.random() * 15;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Add general noise to all planet types
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Add some noise to the texture
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create a ThreeJS texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, [currentPlanet]);
  
  // Create bump map based on planet data
  const bumpMap = useMemo(() => {
    if (!currentPlanet) return null;
    
    // Create a canvas for the bump map
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Fill with black initially (no displacement)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise patterns based on planet type for bump effect
    let bumpIntensity = 0.5;
    
    // Adjust bump intensity based on planet type
    switch (currentPlanet.type) {
      case 'Lush':
        bumpIntensity = 0.4; // Moderate mountains
        break;
      case 'Desert':
        bumpIntensity = 0.3; // Dunes
        break;
      case 'Volcanic':
        bumpIntensity = 0.8; // High mountains
        break;
      case 'Frozen':
      case 'Barren':
        bumpIntensity = 0.5; // Medium roughness
        break;
      case 'Exotic':
      case 'Anomalous':
        bumpIntensity = 0.7; // Strange formations
        break;
      default:
        bumpIntensity = 0.4; // Default
    }
    
    // Generate noise for the bump map
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        
        // Simplex-like noise
        let nx = x / canvas.width - 0.5;
        let ny = y / canvas.height - 0.5;
        let noise = 0;
        
        // Multiple octaves of noise
        let amplitude = 1.0;
        let frequency = 1.0;
        
        for (let i = 0; i < 4; i++) {
          const noiseVal = (Math.sin(nx * frequency * 10 + currentPlanet.seed) + 
                           Math.sin(ny * frequency * 10 + currentPlanet.seed)) * 0.5 + 0.5;
          noise += noiseVal * amplitude;
          
          amplitude *= 0.5;
          frequency *= 2.0;
          
          nx = nx * 2 + 0.5;
          ny = ny * 2 + 0.5;
        }
        
        // Normalize and apply bump intensity
        noise = Math.min(1.0, Math.max(0.0, noise / 2.0 * bumpIntensity)) * 255;
        
        // Set RGB to the same value for a grayscale bump map
        data[idx] = noise;
        data[idx + 1] = noise;
        data[idx + 2] = noise;
        data[idx + 3] = 255; // Full alpha
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create ThreeJS texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, [currentPlanet]);
  
  // Create atmosphere texture
  const createCloudsTexture = useMemo(() => {
    if (!currentPlanet) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Fill with transparent initially
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Skip clouds for certain planet types
    if (['Dead', 'Barren', 'Anomalous'].includes(currentPlanet.type)) {
      // No clouds or very minimal for these types
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    }
    
    // Add clouds based on planet type and atmosphere
    let cloudCoverage = 0.3; // Default
    let cloudOpacity = 0.5; // Default
    
    switch (currentPlanet.weather) {
      case 'Calm':
        cloudCoverage = 0.2;
        cloudOpacity = 0.4;
        break;
      case 'Dusty':
        cloudCoverage = 0.6;
        cloudOpacity = 0.3;
        break;
      case 'Rainy':
        cloudCoverage = 0.7;
        cloudOpacity = 0.6;
        break;
      case 'Stormy':
        cloudCoverage = 0.8;
        cloudOpacity = 0.7;
        break;
      case 'Extreme':
        cloudCoverage = 0.9;
        cloudOpacity = 0.8;
        break;
    }
    
    // Color based on atmosphere type
    let cloudColor = 'rgba(255, 255, 255, ';
    
    if (currentPlanet.atmosphere === 'Highly Toxic') {
      cloudColor = 'rgba(190, 255, 150, ';
    } else if (currentPlanet.atmosphere === 'Corrosive') {
      cloudColor = 'rgba(255, 200, 120, ';
    } else if (currentPlanet.atmosphere === 'Radioactive') {
      cloudColor = 'rgba(150, 255, 150, ';
    } else if (currentPlanet.atmosphere === 'None') {
      cloudOpacity *= 0.2; // Very thin clouds if any
    }
    
    // Draw cloud blobs
    const cloudCount = Math.floor(20 * cloudCoverage);
    
    for (let i = 0; i < cloudCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 30 + Math.random() * 70;
      
      // Randomize opacity for each cloud
      const thisOpacity = (0.2 + Math.random() * 0.8) * cloudOpacity;
      ctx.fillStyle = cloudColor + thisOpacity + ')';
      
      // Draw cloud as a set of overlapping circles
      for (let j = 0; j < 5; j++) {
        const offsetX = (Math.random() - 0.5) * radius * 0.5;
        const offsetY = (Math.random() - 0.5) * radius * 0.5;
        const thisRadius = radius * (0.7 + Math.random() * 0.3);
        
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, thisRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Create ThreeJS texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, [currentPlanet]);
  
  // Calculate atmospheric params based on planet data
  const atmosphereParams = useMemo(() => {
    if (!currentPlanet) return { color: '#ffffff', strength: 0.1 };
    
    const color = new THREE.Color(currentPlanet.color.atmosphere);
    let strength = 0.1; // Default
    
    // Adjust atmosphere strength based on atmosphere type
    switch (currentPlanet.atmosphere) {
      case 'None':
        strength = 0.05;
        break;
      case 'Breathable':
      case 'Oxygen-Rich':
        strength = 0.15;
        break;
      case 'Highly Toxic':
      case 'Corrosive':
        strength = 0.25;
        break;
      case 'Dusty':
        strength = 0.2;
        break;
      case 'Radioactive':
        strength = 0.3;
        break;
      default:
        strength = 0.1;
    }
    
    return { color: color.getStyle(), strength };
  }, [currentPlanet]);
  
  // Planet animation
  useFrame((_, delta) => {
    if (planetGroup.current) {
      // Rotate planet slowly
      planetGroup.current.rotation.y += 0.05 * delta;
    }
    
    if (cloudRef.current) {
      // Rotate clouds at a different speed for effect
      cloudRef.current.rotation.y += 0.08 * delta;
    }
    
    // Handle keyboard controls for camera movement
    if (forward) camera.position.z -= 0.5;
    if (backward) camera.position.z += 0.5;
    if (leftward) camera.position.x -= 0.5;
    if (rightward) camera.position.x += 0.5;
    if (zoomIn) camera.position.multiplyScalar(0.98);  // Zoom in
    if (zoomOut) camera.position.multiplyScalar(1.02); // Zoom out
  });
  
  if (!currentPlanet || !planetTexture || !bumpMap || !createCloudsTexture) {
    return (
      <Text position={[0, 0, 0]} fontSize={0.5} color="#00ffff">
        Loading planet data...
      </Text>
    );
  }
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 5, 10]} intensity={1} />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={10}
      />
      
      <Stars 
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0.5}
      />
      
      <group ref={planetGroup}>
        {/* Main planet */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial 
            map={planetTexture}
            bumpMap={bumpMap}
            bumpScale={0.1}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        
        {/* Cloud layer */}
        <mesh ref={cloudRef} scale={1.02}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            map={createCloudsTexture}
            transparent={true}
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        
        {/* Atmosphere layer */}
        <mesh ref={atmosphereRef} scale={1.1}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color={atmosphereParams.color}
            transparent={true}
            opacity={atmosphereParams.strength}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
        
        {/* Planet name label */}
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.15}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="rgba(0,0,0,0.5)"
        >
          {currentPlanet.name}
        </Text>
      </group>
    </>
  );
}
