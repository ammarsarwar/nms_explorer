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
    // Reduced resolution for better performance
    canvas.width = 512; 
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Generate a seeded random function for consistency
    const seed = currentPlanet.seed;
    let seedValue = seed;
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
    
    // Base color from planet data
    const baseColor = new THREE.Color(currentPlanet.color.surface);
    
    // Helper function to generate Perlin-like noise
    const generateNoise = (scale: number, octaves: number, persistence: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const noiseMap = new Array(width * height).fill(0);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let amplitude = 1;
          let frequency = scale;
          let noiseValue = 0;
          let maxValue = 0;
          
          // Generate multiple layers of noise
          for (let o = 0; o < octaves; o++) {
            // Generate simplex-like noise
            const xCoord = x / width * frequency;
            const yCoord = y / height * frequency;
            
            // Sample points
            const xFloor = Math.floor(xCoord);
            const yFloor = Math.floor(yCoord);
            const xFrac = xCoord - xFloor;
            const yFrac = yCoord - yFloor;
            
            // Get random values for corners (using seeded random)
            const n1 = random() * 2 - 1;
            const n2 = random() * 2 - 1;
            const n3 = random() * 2 - 1;
            const n4 = random() * 2 - 1;
            
            // Bilinear interpolation
            const value1 = n1 + xFrac * (n2 - n1);
            const value2 = n3 + xFrac * (n4 - n3);
            const value = value1 + yFrac * (value2 - value1);
            
            // Add to noise value
            noiseValue += value * amplitude;
            maxValue += amplitude;
            
            // Prepare for next octave
            amplitude *= persistence;
            frequency *= 2;
            seedValue += o * 1000; // Different seed for each octave
          }
          
          // Normalize noise value
          noiseMap[y * width + x] = (noiseValue / maxValue + 1) / 2;
        }
      }
      
      return noiseMap;
    };
    
    // Fill with a black background initially
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Handle different planet types based on real planet references
    switch (currentPlanet.type) {
      case 'Lush': {
        // Earth-like planet with continents and oceans
        
        // Generate base terrain noise 
        // Reduced complexity for better performance
        const continentNoise = generateNoise(4, 3, 0.65);
        const detailNoise = generateNoise(6, 2, 0.5);
        
        // Create the image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Deep ocean color
        const oceanColor = new THREE.Color(currentPlanet.color.water);
        // Shallow water color
        const shallowColor = new THREE.Color(currentPlanet.color.water).offsetHSL(0, 0.1, 0.2);
        // Land colors
        const landColor = new THREE.Color(currentPlanet.color.surface);
        const mountainColor = new THREE.Color(currentPlanet.color.surface).offsetHSL(0, -0.1, -0.2);
        // Forest areas
        const forestColor = new THREE.Color('#2D5E40');
        
        // Create clouds
        const cloudNoise = generateNoise(6, 3, 0.7);
        
        // Apply noise to create terrain
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const continent = continentNoise[i];
          const detail = detailNoise[i];
          
          // Combine noise values to create terrain
          let value = continent * 0.8 + detail * 0.2;
          
          // Add latitude effect (more ice at poles)
          const latitude = Math.abs((y / canvas.height) - 0.5) * 2; // 0 at equator, 1 at poles
          
          // Add ice caps
          const polarInfluence = Math.pow(latitude, 8); // Sharp transition to ice
          
          // Create terrain based on combined noise
          let r, g, b;
          
          if (value < 0.4) {
            // Deep ocean
            const depth = 1 - (value / 0.4); // 0 = shallow, 1 = deep
            r = oceanColor.r * 255;
            g = oceanColor.g * 255;
            b = oceanColor.b * 255;
          } else if (value < 0.45) {
            // Shallow water / beaches
            const shallowness = (value - 0.4) / 0.05;
            r = oceanColor.r * 255 * (1 - shallowness) + shallowColor.r * 255 * shallowness;
            g = oceanColor.g * 255 * (1 - shallowness) + shallowColor.g * 255 * shallowness;
            b = oceanColor.b * 255 * (1 - shallowness) + shallowColor.b * 255 * shallowness;
          } else if (value < 0.75) {
            // Land / forest areas
            const forestInfluence = Math.pow((value - 0.45) / 0.3, 2) * (1 - polarInfluence);
            r = landColor.r * 255 * (1 - forestInfluence) + forestColor.r * forestInfluence;
            g = landColor.g * 255 * (1 - forestInfluence) + forestColor.g * forestInfluence;
            b = landColor.b * 255 * (1 - forestInfluence) + forestColor.b * forestInfluence;
          } else {
            // Mountains
            const mountainHeight = (value - 0.75) / 0.25;
            
            // Snow on mountain tops
            const snowInfluence = Math.pow(mountainHeight, 3) + polarInfluence;
            
            r = mountainColor.r * 255 * (1 - snowInfluence) + 255 * snowInfluence;
            g = mountainColor.g * 255 * (1 - snowInfluence) + 255 * snowInfluence;
            b = mountainColor.b * 255 * (1 - snowInfluence) + 255 * snowInfluence;
          }
          
          // Set pixel colors
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add cloud patterns
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = y * canvas.width + x;
            const cloud = cloudNoise[i];
            
            if (cloud > 0.65) {
              const opacity = (cloud - 0.65) / 0.35 * 0.3;
              ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        
        break;
      }
      
      case 'Ocean': {
        // Neptune or water world
        
        // Generate base ocean noise
        // Reduced complexity for better performance
        const oceanNoise = generateNoise(4, 2, 0.7);
        const waveNoise = generateNoise(8, 1, 0.8);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Ocean colors
        const deepColor = new THREE.Color(currentPlanet.color.water).offsetHSL(0, 0.1, -0.2);
        const midColor = new THREE.Color(currentPlanet.color.water);
        const surfaceColor = new THREE.Color(currentPlanet.color.water).offsetHSL(0, -0.1, 0.2);
        
        // Apply noise for ocean patterns
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const ocean = oceanNoise[i];
          const wave = waveNoise[i];
          
          // Combined noise
          const combined = ocean * 0.7 + wave * 0.3;
          
          // Apply color based on depth
          let r, g, b;
          
          if (combined < 0.4) {
            // Deep ocean
            r = deepColor.r * 255;
            g = deepColor.g * 255;
            b = deepColor.b * 255;
          } else if (combined < 0.7) {
            // Mid-level
            const depth = (combined - 0.4) / 0.3;
            r = deepColor.r * 255 * (1 - depth) + midColor.r * 255 * depth;
            g = deepColor.g * 255 * (1 - depth) + midColor.g * 255 * depth;
            b = deepColor.b * 255 * (1 - depth) + midColor.b * 255 * depth;
          } else {
            // Surface / waves
            const surface = (combined - 0.7) / 0.3;
            r = midColor.r * 255 * (1 - surface) + surfaceColor.r * 255 * surface;
            g = midColor.g * 255 * (1 - surface) + surfaceColor.g * 255 * surface;
            b = midColor.b * 255 * (1 - surface) + surfaceColor.b * 255 * surface;
          }
          
          // Set pixel color
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add swirling patterns like Neptune
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
        
        // Large atmospheric bands
        for (let i = 0; i < 5; i++) {
          const y = canvas.height * (0.2 + i * 0.15);
          const height = canvas.height * 0.08;
          
          ctx.beginPath();
          ctx.rect(0, y, canvas.width, height);
          ctx.fill();
        }
        
        // Add storm spots
        for (let i = 0; i < 3; i++) {
          const x = random() * canvas.width;
          const y = random() * canvas.height;
          const radius = 20 + random() * 80;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
          ctx.fill();
        }
        
        break;
      }
      
      case 'Desert': {
        // Mars-like desert planet
        
        // Generate base terrain noise
        // Reduced complexity for better performance
        const terrainNoise = generateNoise(4, 2, 0.6);
        const craterNoise = generateNoise(6, 2, 0.5);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Desert color palette
        const darkColor = new THREE.Color(baseColor).offsetHSL(0, 0.1, -0.2);
        const lightColor = new THREE.Color(baseColor).offsetHSL(0, -0.1, 0.2);
        
        // Apply noise for desert terrain
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const terrain = terrainNoise[i];
          const crater = craterNoise[i];
          
          // Apply mars-like terrain
          let r, g, b;
          
          // Crater detection
          const hasCrater = crater > 0.75;
          
          if (hasCrater) {
            // Crater area
            r = darkColor.r * 255;
            g = darkColor.g * 255;
            b = darkColor.b * 255;
          } else if (terrain < 0.4) {
            // Lowlands
            r = darkColor.r * 255;
            g = darkColor.g * 255;
            b = darkColor.b * 255;
          } else if (terrain < 0.7) {
            // Mid-level terrain
            const blend = (terrain - 0.4) / 0.3;
            r = darkColor.r * 255 * (1 - blend) + baseColor.r * 255 * blend;
            g = darkColor.g * 255 * (1 - blend) + baseColor.g * 255 * blend;
            b = darkColor.b * 255 * (1 - blend) + baseColor.b * 255 * blend;
          } else {
            // Highlands
            const blend = (terrain - 0.7) / 0.3;
            r = baseColor.r * 255 * (1 - blend) + lightColor.r * 255 * blend;
            g = baseColor.g * 255 * (1 - blend) + lightColor.g * 255 * blend;
            b = baseColor.b * 255 * (1 - blend) + lightColor.b * 255 * blend;
          }
          
          // Set pixel colors
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add craters
        ctx.globalCompositeOperation = 'multiply';
        
        for (let i = 0; i < 15 + random() * 10; i++) {
          const x = random() * canvas.width;
          const y = random() * canvas.height;
          const radius = 10 + random() * 40;
          
          // Crater with lighter rim
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(60, 60, 60, 0.3)`;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(40, 40, 40, 0.4)`;
          ctx.fill();
          
          // Rim highlight
          ctx.globalCompositeOperation = 'lighter';
          ctx.beginPath();
          ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
          ctx.arc(x, y, radius, 0, Math.PI * 2, true);
          ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
          ctx.fill();
          ctx.globalCompositeOperation = 'multiply';
        }
        
        break;
      }
      
      case 'Frozen': {
        // Europa or Pluto like frozen planet
        
        // Generate base ice noise
        const iceNoise = generateNoise(5, 4, 0.6);
        const crackNoise = generateNoise(12, 3, 0.7);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Ice color palette
        const baseColor = new THREE.Color('#e8ecf0');
        const crackColor = new THREE.Color('#a0c0d0');
        const deepColor = new THREE.Color('#708090');
        
        // Apply noise for ice terrain
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const ice = iceNoise[i];
          const crack = crackNoise[i];
          
          // Apply ice terrain
          let r, g, b;
          
          // Determine if location has a crack
          const hasCrack = crack > 0.7 && crack < 0.73;
          
          if (hasCrack) {
            // Ice cracks (like on Europa)
            r = deepColor.r * 255;
            g = deepColor.g * 255;
            b = deepColor.b * 255;
          } else if (ice < 0.4) {
            // Darker ice
            r = crackColor.r * 255;
            g = crackColor.g * 255;
            b = crackColor.b * 255;
          } else {
            // Pure ice
            const brightness = (ice - 0.4) / 0.6;
            r = crackColor.r * 255 * (1 - brightness) + baseColor.r * 255 * brightness;
            g = crackColor.g * 255 * (1 - brightness) + baseColor.g * 255 * brightness;
            b = crackColor.b * 255 * (1 - brightness) + baseColor.b * 255 * brightness;
          }
          
          // Set pixel color
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add some craters
        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 5 + random() * 5; i++) {
          const x = random() * canvas.width;
          const y = random() * canvas.height;
          const radius = 10 + random() * 30;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80, 100, 120, 0.3)`;
          ctx.fill();
        }
        
        break;
      }
      
      case 'Volcanic': {
        // Io-like volcanic planet
        
        // Generate base terrain noise
        const baseNoise = generateNoise(4, 5, 0.7);
        const lavaFlowNoise = generateNoise(10, 3, 0.5);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Volcanic palette
        const crustColor = new THREE.Color('#3C2005');
        const sulfurColor = new THREE.Color('#A08030');
        const lavaColor = new THREE.Color('#FF5000');
        
        // Apply noise for volcanic terrain
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const base = baseNoise[i];
          const lava = lavaFlowNoise[i];
          
          // Determine terrain type
          let r, g, b;
          
          // Check for lava flow
          const hasLava = lava > 0.75;
          
          if (hasLava) {
            // Active lava flow
            r = lavaColor.r * 255;
            g = lavaColor.g * 255;
            b = lavaColor.b * 255;
          } else if (base < 0.5) {
            // Darker crust
            r = crustColor.r * 255;
            g = crustColor.g * 255;
            b = crustColor.b * 255;
          } else {
            // Sulfur deposits
            const sulfurAmount = (base - 0.5) / 0.5;
            r = crustColor.r * 255 * (1 - sulfurAmount) + sulfurColor.r * 255 * sulfurAmount;
            g = crustColor.g * 255 * (1 - sulfurAmount) + sulfurColor.g * 255 * sulfurAmount;
            b = crustColor.b * 255 * (1 - sulfurAmount) + sulfurColor.b * 255 * sulfurAmount;
          }
          
          // Set pixel color
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add volcanic vents/eruptions
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10 + random() * 10; i++) {
          const x = random() * canvas.width;
          const y = random() * canvas.height;
          const size = 5 + random() * 20;
          
          // Eruption center
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 200, 50, 0.8)`;
          ctx.fill();
          
          // Outer glow
          ctx.beginPath();
          ctx.arc(x, y, size * 3, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(x, y, size, x, y, size * 3);
          gradient.addColorStop(0, `rgba(255, 100, 0, 0.5)`);
          gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        break;
      }
      
      case 'Toxic': 
      case 'Radioactive': {
        // Venus-like toxic planet
        
        // Generate base cloud noise
        const cloudNoise = generateNoise(3, 6, 0.7);
        const swirlNoise = generateNoise(8, 4, 0.6);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Toxic clouds palette
        const darkColor = new THREE.Color(baseColor).offsetHSL(0, 0.2, -0.3);
        const accentColor = new THREE.Color(baseColor).offsetHSL(0.1, 0.3, 0.1);
        
        // Apply noise for toxic cloud cover
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const cloud = cloudNoise[i];
          const swirl = swirlNoise[i];
          
          // Combined value
          const combined = cloud * 0.7 + swirl * 0.3;
          
          // Apply cloud patterns
          let r, g, b;
          
          if (combined < 0.4) {
            // Deeper clouds
            r = darkColor.r * 255;
            g = darkColor.g * 255;
            b = darkColor.b * 255;
          } else if (combined < 0.7) {
            // Mid-level clouds
            const blend = (combined - 0.4) / 0.3;
            r = darkColor.r * 255 * (1 - blend) + baseColor.r * 255 * blend;
            g = darkColor.g * 255 * (1 - blend) + baseColor.g * 255 * blend;
            b = darkColor.b * 255 * (1 - blend) + baseColor.b * 255 * blend;
          } else {
            // Upper clouds with accent color
            const blend = (combined - 0.7) / 0.3;
            r = baseColor.r * 255 * (1 - blend) + accentColor.r * 255 * blend;
            g = baseColor.g * 255 * (1 - blend) + accentColor.g * 255 * blend;
            b = baseColor.b * 255 * (1 - blend) + accentColor.b * 255 * blend;
          }
          
          // Set pixel color
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add swirling cloud patterns
        ctx.globalCompositeOperation = 'lighten';
        
        // Create horizontal cloud bands
        for (let i = 0; i < 7; i++) {
          const y = canvas.height * (0.1 + i * 0.125);
          const height = canvas.height * 0.05;
          
          ctx.beginPath();
          ctx.rect(0, y, canvas.width, height);
          ctx.fillStyle = `rgba(255, 255, 255, 0.05)`;
          ctx.fill();
        }
        
        break;
      }
      
      case 'Barren': {
        // Mercury-like barren planet
        
        // Generate base terrain noise
        const terrainNoise = generateNoise(5, 6, 0.6);
        const craterNoise = generateNoise(10, 4, 0.7);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Barren color palette - gray tones
        const baseColor = new THREE.Color('#888888');
        const darkColor = new THREE.Color('#444444');
        const lightColor = new THREE.Color('#bbbbbb');
        
        // Apply noise for barren terrain
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const terrain = terrainNoise[i];
          const crater = craterNoise[i];
          
          // Determine if location has a crater
          const hasCrater = crater > 0.75;
          
          // Apply mercury-like terrain
          let r, g, b;
          
          if (hasCrater) {
            // Crater area
            r = darkColor.r * 255;
            g = darkColor.g * 255;
            b = darkColor.b * 255;
          } else if (terrain < 0.4) {
            // Lowlands
            r = darkColor.r * 255;
            g = darkColor.g * 255;
            b = darkColor.b * 255;
          } else if (terrain < 0.7) {
            // Mid-level terrain
            const blend = (terrain - 0.4) / 0.3;
            r = darkColor.r * 255 * (1 - blend) + baseColor.r * 255 * blend;
            g = darkColor.g * 255 * (1 - blend) + baseColor.g * 255 * blend;
            b = darkColor.b * 255 * (1 - blend) + baseColor.b * 255 * blend;
          } else {
            // Highlands
            const blend = (terrain - 0.7) / 0.3;
            r = baseColor.r * 255 * (1 - blend) + lightColor.r * 255 * blend;
            g = baseColor.g * 255 * (1 - blend) + lightColor.g * 255 * blend;
            b = baseColor.b * 255 * (1 - blend) + lightColor.b * 255 * blend;
          }
          
          // Set pixel color
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add many craters
        ctx.globalCompositeOperation = 'multiply';
        
        for (let i = 0; i < 25 + random() * 25; i++) {
          const x = random() * canvas.width;
          const y = random() * canvas.height;
          const radius = 5 + random() * 50;
          
          // Crater with lighter rim
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(60, 60, 60, 0.4)`;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(40, 40, 40, 0.3)`;
          ctx.fill();
          
          // Rim highlight (one side only to simulate lighting)
          ctx.globalCompositeOperation = 'lighter';
          ctx.beginPath();
          ctx.arc(x, y, radius * 1.05, Math.PI * 0.75, Math.PI * 1.75);
          ctx.arc(x, y, radius, Math.PI * 1.75, Math.PI * 0.75, true);
          ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
          ctx.fill();
          ctx.globalCompositeOperation = 'multiply';
        }
        
        break;
      }
      
      case 'Exotic':
      case 'Anomalous': {
        // Exotic gas giant like Saturn or Jupiter or alien world
        
        // Generate base cloud noise
        const cloudNoise = generateNoise(3, 6, 0.7);
        const bandNoise = generateNoise(2, 3, 0.9);
        const spotNoise = generateNoise(10, 2, 0.6);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Exotic color palettes - vivid and unusual colors
        const accentColor1 = new THREE.Color(baseColor).offsetHSL(0.1, 0.2, 0.1);
        const accentColor2 = new THREE.Color(baseColor).offsetHSL(-0.1, 0.2, -0.1);
        
        // Apply noise for exotic cloud bands
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise values
          const cloud = cloudNoise[i];
          const band = bandNoise[i];
          const spot = spotNoise[i];
          
          // Relative position for bands (Jupiter/Saturn like)
          const yPos = y / canvas.height;
          
          // Apply striped bands with varying width
          const stripeFactor = Math.sin(yPos * 20 + band * 5) * 0.5 + 0.5;
          
          // Apply cloud patterns with bands
          let r, g, b;
          
          // Determine if location has a spot feature
          const hasSpot = spot > 0.85;
          
          if (hasSpot) {
            // Special colored spots (like Jupiter's red spot)
            // Get HSL values with a temp object
            const hsl = { h: 0, s: 0, l: 0 };
            baseColor.getHSL(hsl);
            const spotColor = new THREE.Color().setHSL(
              (hsl.h + 0.5) % 1.0, 
              0.8, 
              0.5
            );
            
            r = spotColor.r * 255;
            g = spotColor.g * 255;
            b = spotColor.b * 255;
          } else if (stripeFactor < 0.4) {
            // Darker bands
            r = accentColor2.r * 255;
            g = accentColor2.g * 255;
            b = accentColor2.b * 255;
          } else if (stripeFactor < 0.6) {
            // Transition bands
            const blend = (stripeFactor - 0.4) / 0.2;
            r = accentColor2.r * 255 * (1 - blend) + baseColor.r * 255 * blend;
            g = accentColor2.g * 255 * (1 - blend) + baseColor.g * 255 * blend;
            b = accentColor2.b * 255 * (1 - blend) + baseColor.b * 255 * blend;
          } else {
            // Lighter bands
            const blend = Math.min(1, (stripeFactor - 0.6) / 0.4);
            r = baseColor.r * 255 * (1 - blend) + accentColor1.r * 255 * blend;
            g = baseColor.g * 255 * (1 - blend) + accentColor1.g * 255 * blend;
            b = baseColor.b * 255 * (1 - blend) + accentColor1.b * 255 * blend;
          }
          
          // Add cloud detail
          const cloudDetail = (cloud - 0.5) * 0.3;
          r = Math.max(0, Math.min(255, r + cloudDetail * 255));
          g = Math.max(0, Math.min(255, g + cloudDetail * 255));
          b = Math.max(0, Math.min(255, b + cloudDetail * 255));
          
          // Set pixel color
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add swirling patterns
        ctx.globalCompositeOperation = 'overlay';
        
        // Create special features
        for (let i = 0; i < 3; i++) {
          const x = random() * canvas.width;
          const y = random() * canvas.height;
          const radius = 20 + random() * 80;
          
          // Create gradient for spot
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, 0.1)`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          
          ctx.beginPath();
          ctx.ellipse(x, y, radius, radius * 0.6, random() * Math.PI, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        break;
      }
      
      default: {
        // Generic planet for any other types
        
        // Generate base terrain noise
        const terrainNoise = generateNoise(5, 5, 0.65);
        
        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        
        // Generic color palette
        const darkColor = new THREE.Color(baseColor).offsetHSL(0, 0, -0.2);
        const lightColor = new THREE.Color(baseColor).offsetHSL(0, 0, 0.2);
        
        // Apply noise for generic terrain
        for (let i = 0; i < canvas.width * canvas.height; i++) {
          const x = i % canvas.width;
          const y = Math.floor(i / canvas.width);
          
          // Get noise value
          const terrain = terrainNoise[i];
          
          // Apply generic terrain
          let r, g, b;
          
          if (terrain < 0.4) {
            // Darker regions
            r = darkColor.r * 255;
            g = darkColor.g * 255;
            b = darkColor.b * 255;
          } else if (terrain < 0.7) {
            // Mid-level regions
            const blend = (terrain - 0.4) / 0.3;
            r = darkColor.r * 255 * (1 - blend) + baseColor.r * 255 * blend;
            g = darkColor.g * 255 * (1 - blend) + baseColor.g * 255 * blend;
            b = darkColor.b * 255 * (1 - blend) + baseColor.b * 255 * blend;
          } else {
            // Lighter regions
            const blend = (terrain - 0.7) / 0.3;
            r = baseColor.r * 255 * (1 - blend) + lightColor.r * 255 * blend;
            g = baseColor.g * 255 * (1 - blend) + lightColor.g * 255 * blend;
            b = baseColor.b * 255 * (1 - blend) + lightColor.b * 255 * blend;
          }
          
          // Set pixel color
          const index = i * 4;
          imageData.data[index] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add some basic features
        ctx.globalCompositeOperation = 'multiply';
        
        for (let i = 0; i < 20; i++) {
          const x = random() * canvas.width;
          const y = random() * canvas.height;
          const radius = 10 + random() * 40;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
          ctx.fill();
        }
        
        break;
      }
    }
    
    // Add more controlled, subtle noise to all planet types
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create subtle noise without white spots
    for (let i = 0; i < data.length; i += 4) {
      // Make a much smaller, consistent noise (no white spots)
      const noise = (random() - 0.5) * 8;
      
      // Apply noise consistently to maintain color relationships
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
  
  // Rings texture generation for Saturn-like planets
  const ringTexture = useMemo(() => {
    if (!currentPlanet) return null;
    
    // Only exotic and some of the barren/anomalous planets have rings
    const hasRings = 
      currentPlanet.type === 'Exotic' || 
      (currentPlanet.type === 'Anomalous' && (currentPlanet.seed % 3 === 0)) || 
      (currentPlanet.type === 'Barren' && (currentPlanet.seed % 5 === 0));
      
    if (!hasRings) return null;
    
    // Create a canvas for the rings
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Fill with transparent initially
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Seed for consistent ring generation
    const random = () => {
      const x = Math.sin(currentPlanet.seed++) * 10000;
      return x - Math.floor(x);
    };
    
    // Start with inner ring gap
    let position = 0;
    const innerGap = canvas.width * 0.2;
    
    // Draw multiple ring bands with different colors and densities
    while (position < canvas.width) {
      // Skip the inner gap
      if (position < innerGap) {
        position += 10;
        continue;
      }
      
      // Determine ring band width
      const bandWidth = 20 + random() * 80;
      
      // Determine ring color (based on planet type)
      let ringColor;
      if (currentPlanet.type === 'Exotic') {
        // More colorful rings for exotic planets
        const hue = (random() * 60 + 20) % 360; // Warm colors like Saturn
        ringColor = `hsl(${hue}, ${50 + random() * 30}%, ${40 + random() * 40}%)`;
      } else {
        // Grey/white rings for normal planets
        const lightness = 50 + random() * 40;
        ringColor = `rgb(${lightness}%, ${lightness}%, ${lightness}%)`;
      }
      
      // Determine opacity of the band (gaps between dense rings)
      const opacity = 0.1 + random() * 0.6;
      
      // Draw the band
      ctx.fillStyle = ringColor;
      ctx.globalAlpha = opacity;
      ctx.fillRect(position, 0, bandWidth, canvas.height);
      
      // Add detail lines within the band
      const lineCount = Math.floor(random() * 10) + 5;
      for (let i = 0; i < lineCount; i++) {
        const linePos = position + random() * bandWidth;
        const lineWidth = 1 + random() * 3;
        ctx.globalAlpha = 0.5 + random() * 0.5;
        ctx.fillRect(linePos, 0, lineWidth, canvas.height);
      }
      
      // Move to next band position
      position += bandWidth;
      
      // Sometimes add gaps between ring bands
      if (random() > 0.7) {
        position += 5 + random() * 30;
      }
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, [currentPlanet]);
  
  // Determine if the planet has rings
  const hasRings = useMemo(() => {
    if (!currentPlanet) return false;
    
    return (
      currentPlanet.type === 'Exotic' || 
      (currentPlanet.type === 'Anomalous' && (currentPlanet.seed % 3 === 0)) || 
      (currentPlanet.type === 'Barren' && (currentPlanet.seed % 5 === 0))
    );
  }, [currentPlanet]);
  
  // Ring reference for animation
  const ringsRef = useRef<THREE.Mesh>(null);
  
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
    
    if (ringsRef.current) {
      // Keep rings tilted but not rotating with the planet
      ringsRef.current.rotation.x = 0.3; // Tilt rings slightly
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
            onUpdate={self => {
              // Ensure material updates properly
              self.needsUpdate = true;
            }}
          />
        </mesh>
        
        {/* Saturn-like ring system for certain planets */}
        {hasRings && ringTexture && (
          <mesh ref={ringsRef} rotation={[0.3, 0, 0]} scale={[2.5, 2.5, 2.5]}>
            <ringGeometry args={[1.2, 2.0, 128]} />
            <meshStandardMaterial 
              map={ringTexture}
              transparent={true}
              side={THREE.DoubleSide}
              opacity={0.9}
              depthWrite={false}
              onUpdate={self => {
                // Ensure material updates properly
                self.needsUpdate = true;
              }}
            />
          </mesh>
        )}
        
        {/* Cloud layer */}
        <mesh ref={cloudRef} scale={1.02}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            map={createCloudsTexture}
            transparent={true}
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
            onUpdate={self => {
              // Ensure material updates properly
              self.needsUpdate = true;
            }}
          />
        </mesh>
        
        {/* Atmosphere layer */}
        <mesh ref={atmosphereRef} scale={1.1}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color={atmosphereParams.color || "#ffffff"}
            transparent={true}
            opacity={atmosphereParams.strength || 0.1}
            side={THREE.BackSide}
            depthWrite={false}
            onUpdate={self => {
              // Ensure material updates properly
              self.needsUpdate = true;
            }}
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
          {hasRings && " ♅"}
        </Text>
      </group>
    </>
  );
}
