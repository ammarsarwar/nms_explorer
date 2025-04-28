import { create } from 'zustand';
import { ProcGen, PlanetData } from '@/components/planet/ProcGen';

interface PlanetState {
  currentPlanet: PlanetData | null;
  discoveredPlanets: PlanetData[];
  isLoading: boolean;
  generateNewPlanet: () => Promise<PlanetData>;
}

export const usePlanet = create<PlanetState>((set, get) => ({
  currentPlanet: null,
  discoveredPlanets: [],
  isLoading: true,
  
  generateNewPlanet: async () => {
    // Set loading state
    set({ isLoading: true });
    
    try {
      // Generate a random seed for the planet
      const seed = Math.floor(Math.random() * 1000000);
      
      // Generate the planet data using the ProcGen class
      const planetData = ProcGen.generatePlanet(seed);
      
      // Add the planet to discovered planets if it's a new one
      set(state => {
        const newDiscoveredPlanets = [...state.discoveredPlanets];
        if (!newDiscoveredPlanets.some(p => p.id === planetData.id)) {
          newDiscoveredPlanets.push(planetData);
        }
        
        return {
          currentPlanet: planetData,
          discoveredPlanets: newDiscoveredPlanets,
          isLoading: false
        };
      });
      
      // Log for debugging
      console.log(`Generated new planet: ${planetData.name} (${planetData.type})`);
      
      return planetData;
    } catch (error) {
      console.error('Error generating planet:', error);
      set({ isLoading: false });
      throw error;
    }
  }
}));
