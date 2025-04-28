import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import "./globals.css";

// Core Components
import PlanetViewer from "./components/planet/PlanetViewer";
import PlanetDetails from "./components/planet/PlanetDetails";
import GalaxyMap from "./components/galaxy/GalaxyMap";
import Header from "./components/ui/Header";
import Sidebar from "./components/ui/Sidebar";
import StarField from "./components/ui/StarField";
import AudioControls from "./components/ui/AudioControls";
import ResourceCatalog from "./components/resources/ResourceCatalog";
import DiscoveryLog from "./components/discovery/DiscoveryLog";

// Store Providers
import { usePlanet } from "./lib/stores/usePlanet";
import { useGalaxy } from "./lib/stores/useGalaxy";

// Define control keys
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "zoomIn", keys: ["KeyE"] },
  { name: "zoomOut", keys: ["KeyQ"] },
  { name: "interact", keys: ["KeyF"] },
  { name: "menu", keys: ["KeyM"] },
];

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  },
});

// Main App component
function App() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'planet' | 'galaxy' | 'resources' | 'discovery'>('planet');
  const [isLoading, setIsLoading] = useState(true);
  const { playBackgroundMusic } = useAudio();
  const { currentPlanet, generateNewPlanet } = usePlanet();
  const { initializeGalaxy } = useGalaxy();

  // Initialize game
  useEffect(() => {
    // Audio is now initialized in the useAudio store with Howler
    setShowCanvas(true);
    
    // Initialize game data
    const initGame = async () => {
      await Promise.all([
        generateNewPlanet(),
        initializeGalaxy()
      ]);
      setIsLoading(false);
    };
    
    initGame();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen overflow-hidden bg-background relative">
        <StarField />
        
        {showCanvas && (
          <KeyboardControls map={controls}>
            <div className="flex flex-col h-full w-full">
              <Header activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
              
              <div className="flex flex-1 overflow-hidden">
                <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
                
                <main className="flex-1 relative overflow-hidden">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-primary text-2xl glow-text">
                        Loading the cosmos...
                      </div>
                    </div>
                  ) : (
                    <>
                      {activeScreen === 'planet' && (
                        <div className="h-full w-full">
                          <Canvas
                            camera={{ position: [0, 0, 5], fov: 45 }}
                            gl={{ antialias: true, alpha: true }}
                            style={{ background: 'transparent' }}
                          >
                            <Suspense fallback={null}>
                              <PlanetViewer />
                            </Suspense>
                          </Canvas>
                          {currentPlanet && <PlanetDetails planet={currentPlanet} />}
                        </div>
                      )}
                      
                      {activeScreen === 'galaxy' && (
                        <div className="h-full w-full">
                          <Canvas
                            camera={{ position: [0, 20, 0], fov: 60 }}
                            gl={{ antialias: true, alpha: true }}
                            style={{ background: 'transparent' }}
                          >
                            <Suspense fallback={null}>
                              <GalaxyMap />
                            </Suspense>
                          </Canvas>
                        </div>
                      )}
                      
                      {activeScreen === 'resources' && (
                        <div className="h-full w-full overflow-auto p-6">
                          <ResourceCatalog />
                        </div>
                      )}
                      
                      {activeScreen === 'discovery' && (
                        <div className="h-full w-full overflow-auto p-6">
                          <DiscoveryLog />
                        </div>
                      )}
                    </>
                  )}
                </main>
              </div>
              
              <AudioControls />
            </div>
          </KeyboardControls>
        )}
      </div>
    </QueryClientProvider>
  );
}

// Components are now imported properly from their respective files

export default App;
