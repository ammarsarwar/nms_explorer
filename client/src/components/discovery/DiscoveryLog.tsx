import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlanetData, PlanetType } from '@/components/planet/ProcGen';
import { usePlanet } from '@/lib/stores/usePlanet';
import { useGalaxy } from '@/lib/stores/useGalaxy';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useAudio } from '@/lib/stores/useAudio';
import { 
  Orbit, 
  Fish, 
  Flower2, 
  Map, 
  Medal, 
  User, 
  Clock, 
  CalendarDays, 
  ChevronRight, 
  Star, 
  Biohazard, 
  Thermometer,
  Droplets
} from 'lucide-react';

export default function DiscoveryLog() {
  const { currentPlanet } = usePlanet();
  const { systems } = useGalaxy();
  const { playHit } = useAudio();
  
  const [visitedPlanets, setVisitedPlanets] = useState<PlanetData[]>([]);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Add current planet to visited planets (in a real app, this would be persisted)
  useEffect(() => {
    if (currentPlanet && !visitedPlanets.some(p => p.id === currentPlanet.id)) {
      const newPlanet = {
        ...currentPlanet,
        discovered: true,
        discoveryDate: new Date()
      };
      setVisitedPlanets(prev => [...prev, newPlanet]);
    }
  }, [currentPlanet]);
  
  // Calculate discovery statistics
  const stats = useMemo(() => {
    const totalSpecies = visitedPlanets.reduce(
      (acc, planet) => acc + planet.flora.length + planet.fauna.length, 
      0
    );
    
    const totalResources = visitedPlanets.reduce(
      (acc, planet) => acc + planet.resources.length, 
      0
    );
    
    // Count planet types
    const planetTypes = visitedPlanets.reduce((acc, planet) => {
      acc[planet.type] = (acc[planet.type] || 0) + 1;
      return acc;
    }, {} as Record<PlanetType, number>);
    
    return {
      planets: visitedPlanets.length,
      systems: systems.filter(s => s.discovered).length,
      species: totalSpecies,
      resources: totalResources,
      planetTypes
    };
  }, [visitedPlanets, systems]);
  
  // Generate random explorer name
  const explorerName = useMemo(() => "Explorer INV-" + Math.floor(Math.random() * 9000 + 1000), []);
  
  // Get formatted date
  const getFormattedDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  return (
    <div className="h-full">
      <motion.div
        className="max-w-5xl mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-chart-4 glow-text mb-2">Discovery Log</h2>
            <p className="text-muted-foreground max-w-md">
              Track your journey across the universe and review your discoveries
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          playHit();
        }}>
          <TabsList className="bg-muted/20 mb-6">
            <TabsTrigger 
              value="summary" 
              className="data-[state=active]:bg-chart-4/20 data-[state=active]:text-chart-4"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="planets" 
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Planets
            </TabsTrigger>
            <TabsTrigger 
              value="life" 
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
            >
              Life Forms
            </TabsTrigger>
            <TabsTrigger 
              value="milestones" 
              className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary"
            >
              Milestones
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Explorer Profile */}
              <Card className="holographic-card border-primary/20 p-6 md:col-span-1">
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20 mb-4 ring-2 ring-primary/30 bg-muted">
                    <AvatarFallback>EX</AvatarFallback>
                    <AvatarImage src="https://images.unsplash.com/photo-1581822261290-991b38693d1b" />
                  </Avatar>
                  <h3 className="text-lg font-semibold">{explorerName}</h3>
                  <div className="text-sm text-muted-foreground mb-4">Interstellar Researcher</div>
                  
                  <div className="w-full space-y-4 mt-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Explorer Level</span>
                        <span>3</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold">{stats.planets}</div>
                        <div className="text-xs text-muted-foreground">Planets Visited</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold">{stats.systems}</div>
                        <div className="text-xs text-muted-foreground">Systems Explored</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold">{stats.species}</div>
                        <div className="text-xs text-muted-foreground">Species Discovered</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-semibold">{stats.resources}</div>
                        <div className="text-xs text-muted-foreground">Resources Cataloged</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Recent Activity */}
              <Card className="holographic-card border-primary/20 p-6 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                
                <div className="space-y-4">
                  {visitedPlanets.slice(0, 3).map((planet, index) => (
                    <div key={planet.id} className="flex items-start">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-chart-1/20 flex items-center justify-center">
                          <Orbit className="h-5 w-5 text-chart-1" />
                        </div>
                        {index < visitedPlanets.slice(0, 3).length - 1 && (
                          <div className="absolute top-10 left-1/2 w-0.5 h-full -ml-0.5 bg-muted/30" />
                        )}
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{planet.name} discovered</h4>
                            <div className="text-sm text-muted-foreground">
                              {planet.type} planet with {planet.biome} biome
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getFormattedDate(planet.discoveryDate || new Date())}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <div className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground">
                            {planet.flora.length} flora species
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground">
                            {planet.fauna.length} fauna species
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground">
                            {planet.resources.length} resources
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {visitedPlanets.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No planets discovered yet. Explore the galaxy to begin your journey!
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Statistics Cards */}
              <Card className="holographic-card border-primary/20 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Map className="h-5 w-5 mr-2 text-secondary" />
                  Explored Regions
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Galaxy Center</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.min(Math.floor(stats.systems * 2), 15)}%
                    </div>
                  </div>
                  <Progress value={Math.min(Math.floor(stats.systems * 2), 15)} className="h-1.5" />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Outer Rim</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.min(Math.floor(stats.systems * 5), 30)}%
                    </div>
                  </div>
                  <Progress value={Math.min(Math.floor(stats.systems * 5), 30)} className="h-1.5" />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Uncharted Space</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.min(Math.floor(stats.systems * 1), 5)}%
                    </div>
                  </div>
                  <Progress value={Math.min(Math.floor(stats.systems * 1), 5)} className="h-1.5" />
                </div>
              </Card>
              
              <Card className="holographic-card border-primary/20 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Flower2 className="h-5 w-5 mr-2 text-accent" />
                  Flora & Fauna Stats
                </h3>
                <div className="space-y-3">
                  {visitedPlanets.reduce((total, planet) => total + planet.flora.length, 0) > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Total Flora Species</span>
                        <span>{visitedPlanets.reduce((total, planet) => total + planet.flora.length, 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Fauna Species</span>
                        <span>{visitedPlanets.reduce((total, planet) => total + planet.fauna.length, 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Rare Species Found</span>
                        <span>
                          {visitedPlanets.reduce((total, planet) => {
                            const rareFlora = planet.flora.filter(f => f.rarity === 'Rare').length;
                            const rareFauna = planet.fauna.filter(f => f.rarity === 'Rare').length;
                            return total + rareFlora + rareFauna;
                          }, 0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground text-sm py-2">
                      No species discovered yet.
                    </div>
                  )}
                </div>
              </Card>
              
              <Card className="holographic-card border-primary/20 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Medal className="h-5 w-5 mr-2 text-chart-4" />
                  Achievements
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">First Steps</div>
                      <div className="text-xs text-muted-foreground">Discover first planet</div>
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      stats.planets > 0 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-muted/20 text-muted-foreground"
                    )}>
                      {stats.planets > 0 ? "Completed" : "Incomplete"}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Biologist</div>
                      <div className="text-xs text-muted-foreground">Discover 10 life forms</div>
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      stats.species >= 10 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-muted/20 text-muted-foreground"
                    )}>
                      {stats.species >= 10 ? "Completed" : `${stats.species}/10`}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Geologist</div>
                      <div className="text-xs text-muted-foreground">Discover 15 resources</div>
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      stats.resources >= 15 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-muted/20 text-muted-foreground"
                    )}>
                      {stats.resources >= 15 ? "Completed" : `${stats.resources}/15`}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="planets" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visitedPlanets.length > 0 ? (
                visitedPlanets.map(planet => (
                  <Card key={planet.id} className="holographic-card border-primary/20 overflow-hidden">
                    <div className="h-40 bg-gradient-to-br relative" style={{
                      background: `linear-gradient(to bottom right, ${planet.color.surface}, ${planet.color.atmosphere})`
                    }}>
                      <div className="absolute inset-0 hexgrid-pattern opacity-30" />
                      <div className="absolute bottom-4 left-4">
                        <div className="text-2xl font-bold text-white">{planet.name}</div>
                        <div className="text-sm text-white/80">{planet.type} Orbit</div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Biome</span>
                          <span className="text-sm">{planet.biome}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Weather</span>
                          <span className="text-sm">{planet.weather}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Size</span>
                          <span className="text-sm">{Math.floor(planet.size).toLocaleString()} km</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Discovered</span>
                          <span className="text-sm">{getFormattedDate(planet.discoveryDate || new Date())}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {planet.temperature !== 'Mild' && (
                          <div className="flex items-center text-xs px-2 py-0.5 rounded-full bg-muted/20">
                            <Thermometer className="h-3 w-3 mr-1" />
                            {planet.temperature}
                          </div>
                        )}
                        {planet.toxicity !== 'None' && planet.toxicity !== 'Low' && (
                          <div className="flex items-center text-xs px-2 py-0.5 rounded-full bg-muted/20">
                            <Biohazard className="h-3 w-3 mr-1" />
                            Toxic
                          </div>
                        )}
                        {planet.weather !== 'Calm' && (
                          <div className="flex items-center text-xs px-2 py-0.5 rounded-full bg-muted/20">
                            <Droplets className="h-3 w-3 mr-1" />
                            {planet.weather}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex space-x-3">
                          <div className="flex items-center">
                            <Flower2 className="h-3.5 w-3.5 mr-1" />
                            <span>{planet.flora.length}</span>
                          </div>
                          <div className="flex items-center">
                            <Fish className="h-3.5 w-3.5 mr-1" />
                            <span>{planet.fauna.length}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          <span>Details</span>
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No planets discovered yet. Explore the galaxy to add discoveries to your log!
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="life" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Flora Discovery Log */}
              <Card className="holographic-card border-primary/20 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Flower2 className="h-5 w-5 mr-2 text-green-400" />
                  Flora Species Log
                </h3>
                
                {visitedPlanets.some(p => p.flora.length > 0) ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {visitedPlanets.flatMap(planet => 
                      planet.flora.map(flora => ({
                        ...flora,
                        planetName: planet.name,
                        planetType: planet.type
                      }))
                    ).map(flora => (
                      <div key={flora.id} className="flex items-start pb-3 border-b border-muted/20">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Flower2 className="h-5 w-5 text-green-400" />
                        </div>
                        
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{flora.name}</h4>
                            <div className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              flora.rarity === 'Common' ? "bg-blue-500/20 text-blue-400" :
                              flora.rarity === 'Uncommon' ? "bg-purple-500/20 text-purple-400" :
                              "bg-orange-500/20 text-orange-400"
                            )}>
                              {flora.rarity}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Found on {flora.planetName} ({flora.planetType})</div>
                          <div className="text-sm mt-1">{flora.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">Height: {flora.height} m</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No flora species discovered yet.
                  </div>
                )}
              </Card>
              
              {/* Fauna Discovery Log */}
              <Card className="holographic-card border-primary/20 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Fish className="h-5 w-5 mr-2 text-yellow-400" />
                  Fauna Species Log
                </h3>
                
                {visitedPlanets.some(p => p.fauna.length > 0) ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {visitedPlanets.flatMap(planet => 
                      planet.fauna.map(fauna => ({
                        ...fauna,
                        planetName: planet.name,
                        planetType: planet.type
                      }))
                    ).map(fauna => (
                      <div key={fauna.id} className="flex items-start pb-3 border-b border-muted/20">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <Fish className="h-5 w-5 text-yellow-400" />
                        </div>
                        
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{fauna.name}</h4>
                            <div className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              fauna.rarity === 'Common' ? "bg-blue-500/20 text-blue-400" :
                              fauna.rarity === 'Uncommon' ? "bg-purple-500/20 text-purple-400" :
                              "bg-orange-500/20 text-orange-400"
                            )}>
                              {fauna.rarity}
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <div>Found on {fauna.planetName}</div>
                            <div>{fauna.type}</div>
                          </div>
                          
                          <div className="text-sm mt-1">{fauna.description}</div>
                          
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <div>Size: {fauna.height}m / {fauna.weight}kg</div>
                            <div>Temperament: {fauna.temperament}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No fauna species discovered yet.
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="milestones" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="holographic-card border-primary/20 p-6 col-span-full">
                <div className="flex items-center mb-6">
                  <User className="h-6 w-6 text-chart-4 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">{explorerName}</h3>
                    <div className="text-sm text-muted-foreground">Explorer Progress</div>
                  </div>
                  <div className="ml-auto flex items-center">
                    <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" />
                    <div className="text-sm text-muted-foreground">
                      Journey started: {getFormattedDate(new Date())}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Explorer Milestones */}
                  <div>
                    <h4 className="text-md font-medium mb-4">Explorer Milestones</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-muted/10 border-muted/20 p-4">
                        <div className="flex items-center mb-3">
                          <Orbit className="h-5 w-5 text-primary mr-2" />
                          <h5 className="font-medium">Planetary Explorer</h5>
                        </div>
                        <Progress value={Math.min(stats.planets * 10, 100)} className="h-1.5 mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Planets Visited</span>
                          <span>{stats.planets}/10</span>
                        </div>
                      </Card>
                      
                      <Card className="bg-muted/10 border-muted/20 p-4">
                        <div className="flex items-center mb-3">
                          <Flower2 className="h-5 w-5 text-green-400 mr-2" />
                          <h5 className="font-medium">Botanist</h5>
                        </div>
                        <Progress 
                          value={Math.min(visitedPlanets.reduce((acc, planet) => acc + planet.flora.length, 0) * 5, 100)} 
                          className="h-1.5 mb-2" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Flora Discovered</span>
                          <span>
                            {visitedPlanets.reduce((acc, planet) => acc + planet.flora.length, 0)}/20
                          </span>
                        </div>
                      </Card>
                      
                      <Card className="bg-muted/10 border-muted/20 p-4">
                        <div className="flex items-center mb-3">
                          <Fish className="h-5 w-5 text-yellow-400 mr-2" />
                          <h5 className="font-medium">Zoologist</h5>
                        </div>
                        <Progress 
                          value={Math.min(visitedPlanets.reduce((acc, planet) => acc + planet.fauna.length, 0) * 5, 100)} 
                          className="h-1.5 mb-2" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Fauna Discovered</span>
                          <span>
                            {visitedPlanets.reduce((acc, planet) => acc + planet.fauna.length, 0)}/20
                          </span>
                        </div>
                      </Card>
                    </div>
                  </div>
                  
                  {/* Achievements */}
                  <div>
                    <h4 className="text-md font-medium mb-4">Achievements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center p-3 bg-muted/10 rounded-lg">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                          stats.planets > 0 ? "bg-chart-4/20" : "bg-muted/20"
                        )}>
                          <Star className={cn(
                            "h-5 w-5",
                            stats.planets > 0 ? "text-chart-4" : "text-muted-foreground"
                          )} />
                        </div>
                        
                        <div className="flex-1">
                          <h5 className="font-medium">First Contact</h5>
                          <div className="text-xs text-muted-foreground">Discover your first planet</div>
                        </div>
                        
                        <div className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          stats.planets > 0 ? "bg-green-500/20 text-green-400" : "bg-muted/20 text-muted-foreground"
                        )}>
                          {stats.planets > 0 ? "Completed" : "Incomplete"}
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 bg-muted/10 rounded-lg">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                          stats.resources >= 5 ? "bg-chart-4/20" : "bg-muted/20"
                        )}>
                          <Star className={cn(
                            "h-5 w-5",
                            stats.resources >= 5 ? "text-chart-4" : "text-muted-foreground"
                          )} />
                        </div>
                        
                        <div className="flex-1">
                          <h5 className="font-medium">Resource Hunter</h5>
                          <div className="text-xs text-muted-foreground">Discover 5 unique resources</div>
                        </div>
                        
                        <div className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          stats.resources >= 5 ? "bg-green-500/20 text-green-400" : "bg-muted/20 text-muted-foreground"
                        )}>
                          {stats.resources >= 5 ? "Completed" : `${stats.resources}/5`}
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 bg-muted/10 rounded-lg">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                          Object.keys(stats.planetTypes).length >= 3 ? "bg-chart-4/20" : "bg-muted/20"
                        )}>
                          <Star className={cn(
                            "h-5 w-5",
                            Object.keys(stats.planetTypes).length >= 3 ? "text-chart-4" : "text-muted-foreground"
                          )} />
                        </div>
                        
                        <div className="flex-1">
                          <h5 className="font-medium">Planetary Diversity</h5>
                          <div className="text-xs text-muted-foreground">Visit 3 different planet types</div>
                        </div>
                        
                        <div className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          Object.keys(stats.planetTypes).length >= 3 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-muted/20 text-muted-foreground"
                        )}>
                          {Object.keys(stats.planetTypes).length >= 3 
                            ? "Completed" 
                            : `${Object.keys(stats.planetTypes).length}/3`}
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 bg-muted/10 rounded-lg">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                          stats.species >= 10 ? "bg-chart-4/20" : "bg-muted/20"
                        )}>
                          <Star className={cn(
                            "h-5 w-5",
                            stats.species >= 10 ? "text-chart-4" : "text-muted-foreground"
                          )} />
                        </div>
                        
                        <div className="flex-1">
                          <h5 className="font-medium">Xenobiologist</h5>
                          <div className="text-xs text-muted-foreground">Discover 10 different species</div>
                        </div>
                        
                        <div className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          stats.species >= 10 ? "bg-green-500/20 text-green-400" : "bg-muted/20 text-muted-foreground"
                        )}>
                          {stats.species >= 10 ? "Completed" : `${stats.species}/10`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
