import { create } from 'zustand';
import { ProcGen } from '@/components/planet/ProcGen';
import { PlanetData } from '@/components/planet/ProcGen';

// Define types for galaxy data
export interface Planet {
  id: string;
  name: string;
  type: string;
  size: number;
  position: [number, number, number]; // Position relative to star
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  data: PlanetData; // Detailed planet data
  discovered: boolean;
}

export interface StarSystem {
  id: string;
  name: string;
  position: [number, number, number];
  starType: string;
  starColor: string;
  planetList: Planet[]; // Actual planet objects
  planetCount: number;  // Number of planets
  discovered: boolean;
  seed: number;
}

interface GalaxyState {
  systems: StarSystem[];
  selectedSystem: string | null;
  selectedPlanet: string | null;
  isLoading: boolean;
  activePlanetView: boolean;
  currentGalaxy: string;
  availableGalaxies: { id: string, name: string, requiredFuel: number }[];
  hyperfuel: number;
  
  // Core functions
  initializeGalaxy: () => Promise<StarSystem[]>;
  setSelectedSystem: (systemId: string | null) => void;
  setSelectedPlanet: (planetId: string | null) => void;
  discoverSystem: (systemId: string) => void;
  discoverPlanet: (planetId: string) => void;
  enterPlanetView: () => void;
  exitPlanetView: () => void;
  
  // Hyperfuel
  addHyperfuel: (amount: number) => void;
  useHyperfuel: (amount: number) => boolean;
  travelToGalaxy: (galaxyId: string) => boolean;
}

export const useGalaxy = create<GalaxyState>((set, get) => ({
  systems: [],
  selectedSystem: null,
  selectedPlanet: null,
  isLoading: true,
  activePlanetView: false,
  currentGalaxy: 'euclid',
  availableGalaxies: [
    { id: 'euclid', name: 'Euclid', requiredFuel: 0 },
    { id: 'hilbert', name: 'Hilbert Dimension', requiredFuel: 100 },
    { id: 'calypso', name: 'Calypso', requiredFuel: 250 },
    { id: 'hesperius', name: 'Hesperius Dimension', requiredFuel: 500 },
    { id: 'hyades', name: 'Hyades', requiredFuel: 1000 }
  ],
  hyperfuel: 0,
  
  initializeGalaxy: async () => {
    // Set loading state
    set({ isLoading: true });
    
    try {
      // Generate a random seed for the galaxy
      const galaxySeed = Math.floor(Math.random() * 1000000);
      
      // Generate star systems within the galaxy (fewer for performance)
      const starSystemCount = 20;
      const starSystemsData = ProcGen.generateGalaxy(galaxySeed, starSystemCount);
      
      // Generate planets for each star system
      const starSystems: StarSystem[] = [];
      
      for (const systemData of starSystemsData) {
        const planetCount = systemData.planets;
        const planetList: Planet[] = [];
        
        // Generate planets for this star system
        for (let i = 0; i < planetCount; i++) {
          // Generate a unique seed for this planet based on system seed and planet index
          const planetSeed = systemData.seed + (i * 1000);
          
          // Generate planet data using ProcGen
          const planetData = ProcGen.generatePlanet(planetSeed);
          
          // Calculate orbit radius (distance from star)
          const minOrbitRadius = 3; // Minimum distance from star
          const orbitRadius = minOrbitRadius + i * 2.5; // Each planet further out
          
          // Calculate orbit speed (further planets orbit slower)
          const orbitSpeed = 0.2 / Math.sqrt(orbitRadius); 
          
          // Calculate rotation speed
          const rotationSpeed = 0.2 + Math.random() * 0.3;
          
          // Generate position based on orbit radius and random angle
          const angle = Math.random() * Math.PI * 2;
          const x = Math.cos(angle) * orbitRadius;
          const z = Math.sin(angle) * orbitRadius;
          const y = (Math.random() - 0.5) * 0.5; // Slight variation in orbit plane
          
          // Create planet object
          const planet: Planet = {
            id: `planet-${systemData.id}-${i}`,
            name: planetData.name,
            type: planetData.type,
            size: 0.5 + (planetData.size * 0.01), // Scale size appropriately
            position: [x, y, z],
            color: planetData.color.surface,
            orbitRadius,
            orbitSpeed,
            rotationSpeed,
            data: planetData,
            discovered: false
          };
          
          planetList.push(planet);
        }
        
        // Create star system with planets
        const starSystem: StarSystem = {
          ...systemData,
          planetList,
          planetCount,
          seed: systemData.seed
        };
        
        starSystems.push(starSystem);
      }
      
      // Set the generated systems in the state
      set({ 
        systems: starSystems, 
        isLoading: false,
        selectedSystem: starSystems.length > 0 ? starSystems[0].id : null
      });
      
      // Log for debugging
      console.log(`Generated galaxy with ${starSystems.length} star systems`);
      
      return starSystems;
    } catch (error) {
      console.error('Error generating galaxy:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  setSelectedSystem: (systemId: string | null) => {
    set({ 
      selectedSystem: systemId,
      selectedPlanet: null,
      activePlanetView: false
    });
  },
  
  setSelectedPlanet: (planetId: string | null) => {
    set({ selectedPlanet: planetId });
  },
  
  discoverSystem: (systemId: string) => {
    set(state => ({
      systems: state.systems.map(system => 
        system.id === systemId 
          ? { ...system, discovered: true } 
          : system
      )
    }));
  },
  
  discoverPlanet: (planetId: string) => {
    set(state => ({
      systems: state.systems.map(system => ({
        ...system,
        planetList: system.planetList.map(planet =>
          planet.id === planetId
            ? { ...planet, discovered: true }
            : planet
        )
      }))
    }));
  },
  
  enterPlanetView: () => {
    set({ activePlanetView: true });
  },
  
  exitPlanetView: () => {
    set({ activePlanetView: false });
  },
  
  // Hyperfuel management
  addHyperfuel: (amount: number) => {
    set(state => ({ hyperfuel: state.hyperfuel + amount }));
  },
  
  useHyperfuel: (amount: number) => {
    const { hyperfuel } = get();
    if (hyperfuel >= amount) {
      set({ hyperfuel: hyperfuel - amount });
      return true;
    }
    return false;
  },
  
  travelToGalaxy: (galaxyId: string) => {
    const { availableGalaxies, hyperfuel } = get();
    const targetGalaxy = availableGalaxies.find(g => g.id === galaxyId);
    
    if (!targetGalaxy) return false;
    
    if (hyperfuel >= targetGalaxy.requiredFuel) {
      set({ 
        currentGalaxy: galaxyId,
        hyperfuel: hyperfuel - targetGalaxy.requiredFuel,
        isLoading: true
      });
      
      // Reinitialize galaxy
      get().initializeGalaxy();
      return true;
    }
    
    return false;
  }
}));
