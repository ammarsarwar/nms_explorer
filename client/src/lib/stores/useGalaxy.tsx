import { create } from 'zustand';
import { ProcGen } from '@/components/planet/ProcGen';

// Define types for galaxy data
interface StarSystem {
  id: string;
  name: string;
  position: [number, number, number];
  starType: string;
  starColor: string;
  planets: number;
  discovered: boolean;
}

interface GalaxyState {
  systems: StarSystem[];
  selectedSystem: string | null;
  isLoading: boolean;
  initializeGalaxy: () => Promise<StarSystem[]>;
  setSelectedSystem: (systemId: string) => void;
  discoverSystem: (systemId: string) => void;
}

export const useGalaxy = create<GalaxyState>((set, get) => ({
  systems: [],
  selectedSystem: null,
  isLoading: true,
  
  initializeGalaxy: async () => {
    // Set loading state
    set({ isLoading: true });
    
    try {
      // Generate a random seed for the galaxy
      const galaxySeed = Math.floor(Math.random() * 1000000);
      
      // Generate 50 star systems within the galaxy
      const starSystems = ProcGen.generateGalaxy(galaxySeed, 50);
      
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
  
  setSelectedSystem: (systemId: string) => {
    set({ selectedSystem: systemId });
  },
  
  discoverSystem: (systemId: string) => {
    set(state => ({
      systems: state.systems.map(system => 
        system.id === systemId 
          ? { ...system, discovered: true } 
          : system
      )
    }));
  }
}));
