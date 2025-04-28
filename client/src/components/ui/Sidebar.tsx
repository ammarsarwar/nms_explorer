import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGalaxy } from '@/lib/stores/useGalaxy';
import { usePlanet } from '@/lib/stores/usePlanet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Rocket, 
  Zap, 
  AlertTriangle, 
  Heart, 
  Thermometer, 
  Droplets, 
  Radiation,
  Orbit,
  Telescope,
  Database,
  BookOpen
} from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeScreen: 'planet' | 'galaxy' | 'resources' | 'discovery';
  setActiveScreen: (screen: 'planet' | 'galaxy' | 'resources' | 'discovery') => void;
}

export default function Sidebar({ activeScreen, setActiveScreen }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { systems, selectedSystem, setSelectedSystem } = useGalaxy();
  const { currentPlanet, generateNewPlanet } = usePlanet();
  const { playHit, playSuccess } = useAudio();

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
    playHit();
  };

  const handleSystemSelect = (systemId: string) => {
    setSelectedSystem(systemId);
    setActiveScreen('galaxy');
    playSuccess();
  };

  const handleGenerateNewPlanet = () => {
    generateNewPlanet();
    playSuccess();
  };

  return (
    <motion.div
      className={cn(
        "h-full border-r border-primary/20 bg-sidebar/40 backdrop-blur-sm transition-all duration-300 flex flex-col",
        isExpanded ? "w-64" : "w-12"
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExpandToggle}
        className="self-end m-1 text-primary hover:text-primary/80 hover:bg-background/50"
      >
        {isExpanded ? <ChevronLeft /> : <ChevronRight />}
      </Button>

      {isExpanded ? (
        <ScrollArea className="flex-1 px-4">
          {/* Context-sensitive sidebar content based on active screen */}
          {activeScreen === 'planet' && currentPlanet && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-primary glow-text">Planet Info</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleGenerateNewPlanet}
                  title="Generate new planet"
                >
                  <RefreshCw className="h-4 w-4 text-secondary" />
                </Button>
              </div>
              
              <Card className="bg-muted/20 p-3 border-muted/30">
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: currentPlanet.color.surface }}
                  />
                  <h4 className="font-medium">{currentPlanet.name}</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{currentPlanet.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biome:</span>
                    <span>{currentPlanet.biome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{Math.floor(currentPlanet.size).toLocaleString()} km</span>
                  </div>
                </div>
                
                <Separator className="my-2 bg-muted/30" />
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 text-accent mr-2" />
                    <span className="text-sm">{currentPlanet.temperature}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">{currentPlanet.weather}</span>
                  </div>
                  <div className="flex items-center">
                    <Radiation className="h-4 w-4 text-secondary mr-2" />
                    <span className="text-sm">Radiation: {currentPlanet.radiation}</span>
                  </div>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-accent mr-2" />
                    <span className="text-sm">Sentinels: {currentPlanet.sentinels}</span>
                  </div>
                </div>
              </Card>
              
              <div>
                <h4 className="text-sm font-medium mb-2 text-secondary glow-text-pink">Resources</h4>
                <div className="space-y-1">
                  {currentPlanet.resources.slice(0, 3).map(resource => (
                    <div key={resource.id} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-sm mr-2"
                        style={{ backgroundColor: resource.color }}
                      />
                      <span className="text-xs">{resource.name}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {resource.rarity}
                      </Badge>
                    </div>
                  ))}
                  {currentPlanet.resources.length > 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs w-full text-muted-foreground"
                      onClick={() => setActiveScreen('resources')}
                    >
                      View All Resources...
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 text-accent glow-text-orange">Life Forms</h4>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-xs text-muted-foreground">Flora:</span>
                  </div>
                  <span className="text-xs">{currentPlanet.flora.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-xs text-muted-foreground">Fauna:</span>
                  </div>
                  <span className="text-xs">{currentPlanet.fauna.length}</span>
                </div>
              </div>
            </div>
          )}
          
          {activeScreen === 'galaxy' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-secondary glow-text-pink">Star Systems</h3>
              
              {selectedSystem && (
                <Card className="bg-muted/20 p-3 border-muted/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: systems.find(s => s.id === selectedSystem)?.starColor || '#ffffff' }}
                    />
                    <h4 className="font-medium">{systems.find(s => s.id === selectedSystem)?.name}</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{systems.find(s => s.id === selectedSystem)?.starType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Planets:</span>
                      <span>{systems.find(s => s.id === selectedSystem)?.planetCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={systems.find(s => s.id === selectedSystem)?.discovered ? "text-green-400" : "text-muted-foreground"}>
                        {systems.find(s => s.id === selectedSystem)?.discovered ? "Discovered" : "Undiscovered"}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    onClick={handleGenerateNewPlanet}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Travel to System
                  </Button>
                </Card>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">Nearby Systems</h4>
                <div className="space-y-2">
                  {systems.slice(0, 6).map(system => (
                    <Button
                      key={system.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-xs h-auto py-2",
                        system.id === selectedSystem ? "bg-muted/30 text-secondary" : "text-muted-foreground"
                      )}
                      onClick={() => handleSystemSelect(system.id)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: system.starColor }}
                      />
                      <span className="truncate">{system.name}</span>
                      {system.discovered && (
                        <Badge variant="outline" className="ml-auto text-[10px] bg-muted/20">
                          Found
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeScreen === 'resources' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-accent glow-text-orange">Resources</h3>
              <p className="text-sm text-muted-foreground">
                Browse and catalog the various resources you've discovered across the universe.
              </p>
              
              {currentPlanet && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Planet:</span>
                  <span className="ml-2 text-primary">{currentPlanet.name}</span>
                </div>
              )}
            </div>
          )}
          
          {activeScreen === 'discovery' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-chart-4 glow-text">Discovery Log</h3>
              <p className="text-sm text-muted-foreground">
                Track your journey through the cosmos and record your discoveries.
              </p>
              
              <Card className="bg-muted/20 p-3 border-muted/30">
                <h4 className="text-sm font-medium mb-2">Explorer Stats</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planets Visited:</span>
                    <span>1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Systems Explored:</span>
                    <span>{systems.filter(s => s.discovered).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Species Cataloged:</span>
                    <span>{currentPlanet ? currentPlanet.fauna.length : 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center space-y-6 mt-6">
          {/* Icon-only sidebar when collapsed */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen('planet')}
            className={activeScreen === 'planet' ? "text-primary" : "text-muted-foreground"}
          >
            <Orbit />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen('galaxy')}
            className={activeScreen === 'galaxy' ? "text-secondary" : "text-muted-foreground"}
          >
            <Telescope />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen('resources')}
            className={activeScreen === 'resources' ? "text-accent" : "text-muted-foreground"}
          >
            <Database />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveScreen('discovery')}
            className={activeScreen === 'discovery' ? "text-chart-4" : "text-muted-foreground"}
          >
            <BookOpen />
          </Button>
          <Separator className="bg-muted/30 w-8" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGenerateNewPlanet}
            className="text-muted-foreground hover:text-primary"
          >
            <RefreshCw />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
