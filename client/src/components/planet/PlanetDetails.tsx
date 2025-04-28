import { useState } from 'react';
import { PlanetData } from './ProcGen';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAudio } from '@/lib/stores/useAudio';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";

interface PlanetDetailsProps {
  planet: PlanetData;
}

export default function PlanetDetails({ planet }: PlanetDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { playHit } = useAudio();
  
  // Get status text and colors based on planet characteristics
  const getStatusColor = (value: string) => {
    switch(value) {
      case 'None':
      case 'Low':
      case 'Calm':
      case 'Mild':
      case 'Limited':
        return 'text-green-400';
      case 'Moderate':
      case 'Normal':
        return 'text-blue-400';
      case 'High':
      case 'Aggressive':
      case 'Extreme':
      case 'Stormy':
      case 'Freezing':
      case 'Scorching':
      case 'Frenzied':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };
  
  // Get appropriate danger icon
  const getDangerIcon = (value: string) => {
    if (['None', 'Low', 'Calm', 'Mild', 'Limited'].includes(value)) {
      return '●';
    } else if (['Moderate', 'Normal'].includes(value)) {
      return '◆';
    } else {
      return '▲';
    }
  };

  return (
    <div className="absolute bottom-8 right-8 w-96 max-w-full pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="holographic-card backdrop-blur-md p-4 border-primary/30 overflow-hidden">
          <h3 className="text-2xl font-bold glow-text text-primary mb-2">{planet.name}</h3>
          <div className="text-sm text-primary/80 mb-4">
            {planet.type} Planet • {planet.biome} Biome • {planet.atmosphere} Atmosphere
          </div>
          
          <Tabs value={activeTab} onValueChange={(val) => {
            setActiveTab(val);
            playHit();
          }}>
            <TabsList className="grid grid-cols-4 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className={cn(
                  "data-[state=active]:bg-muted/30 data-[state=active]:text-primary",
                  "hover:text-primary/80"
                )}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="flora" 
                className={cn(
                  "data-[state=active]:bg-muted/30 data-[state=active]:text-secondary",
                  "hover:text-secondary/80"
                )}
              >
                Flora
              </TabsTrigger>
              <TabsTrigger 
                value="fauna" 
                className={cn(
                  "data-[state=active]:bg-muted/30 data-[state=active]:text-accent",
                  "hover:text-accent/80"
                )}
              >
                Fauna
              </TabsTrigger>
              <TabsTrigger 
                value="resources" 
                className={cn(
                  "data-[state=active]:bg-muted/30 data-[state=active]:text-chart-4",
                  "hover:text-chart-4/80"
                )}
              >
                Resources
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Weather</span>
                  <span className={cn("font-medium", getStatusColor(planet.weather))}>
                    {getDangerIcon(planet.weather)} {planet.weather}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Temperature</span>
                  <span className={cn("font-medium", getStatusColor(planet.temperature))}>
                    {getDangerIcon(planet.temperature)} {planet.temperature}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Radiation</span>
                  <span className={cn("font-medium", getStatusColor(planet.radiation))}>
                    {getDangerIcon(planet.radiation)} {planet.radiation}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Toxicity</span>
                  <span className={cn("font-medium", getStatusColor(planet.toxicity))}>
                    {getDangerIcon(planet.toxicity)} {planet.toxicity}
                  </span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-muted/20 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Sentinel Presence</span>
                  <span className={cn("font-medium", getStatusColor(planet.sentinels))}>
                    {planet.sentinels}
                  </span>
                </div>
                
                <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full", 
                      planet.sentinels === 'None' ? "bg-green-500 w-[5%]" : 
                      planet.sentinels === 'Limited' ? "bg-green-500 w-[25%]" :
                      planet.sentinels === 'Normal' ? "bg-blue-500 w-[50%]" :
                      planet.sentinels === 'Aggressive' ? "bg-orange-500 w-[75%]" :
                      "bg-red-500 w-[95%]"
                    )}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm">
                  <div className="text-muted-foreground">Size</div>
                  <div>{Math.floor(planet.size).toLocaleString()} km</div>
                </div>
                
                <div className="flex items-center gap-1">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: planet.color.surface }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: planet.color.water }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: planet.color.atmosphere }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flora" className="mt-4 max-h-60 overflow-y-auto pr-1">
              {planet.flora.length > 0 ? (
                <div className="space-y-3">
                  {planet.flora.map((flora) => (
                    <div key={flora.id} className="p-2 bg-muted/20 rounded-md">
                      <div className="flex justify-between">
                        <div className="font-medium">{flora.name}</div>
                        <div className={cn(
                          "text-xs px-2 py-0.5 rounded-full", 
                          flora.rarity === 'Common' ? "bg-blue-500/20 text-blue-400" : 
                          flora.rarity === 'Uncommon' ? "bg-purple-500/20 text-purple-400" :
                          "bg-orange-500/20 text-orange-400"
                        )}>
                          {flora.rarity}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Height: {flora.height} m</div>
                      <div className="text-xs mt-1 italic">{flora.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No flora detected on this planet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="fauna" className="mt-4 max-h-60 overflow-y-auto pr-1">
              {planet.fauna.length > 0 ? (
                <div className="space-y-3">
                  {planet.fauna.map((fauna) => (
                    <div key={fauna.id} className="p-2 bg-muted/20 rounded-md">
                      <div className="flex justify-between">
                        <div className="font-medium">{fauna.name}</div>
                        <div className={cn(
                          "text-xs px-2 py-0.5 rounded-full", 
                          fauna.rarity === 'Common' ? "bg-blue-500/20 text-blue-400" : 
                          fauna.rarity === 'Uncommon' ? "bg-purple-500/20 text-purple-400" :
                          "bg-orange-500/20 text-orange-400"
                        )}>
                          {fauna.rarity}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <div>{fauna.type}</div>
                        <div>{fauna.temperament}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {fauna.height}m • {fauna.weight}kg
                      </div>
                      <div className="text-xs mt-1 italic">{fauna.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No fauna detected on this planet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources" className="mt-4 max-h-60 overflow-y-auto pr-1">
              <div className="space-y-3">
                {planet.resources.map((resource) => (
                  <div key={resource.id} className="flex items-center p-2 bg-muted/20 rounded-md">
                    <div 
                      className="w-8 h-8 rounded-md mr-3 flex-shrink-0"
                      style={{ backgroundColor: resource.color }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="font-medium">{resource.name}</div>
                        <div className={cn(
                          "text-xs px-2 py-0.5 rounded-full", 
                          resource.rarity === 'Common' ? "bg-blue-500/20 text-blue-400" : 
                          resource.rarity === 'Uncommon' ? "bg-purple-500/20 text-purple-400" :
                          resource.rarity === 'Rare' ? "bg-orange-500/20 text-orange-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {resource.rarity}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs mt-1 italic line-clamp-1">{resource.description}</div>
                        <div className="text-xs text-primary font-mono">
                          {resource.value} u
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
            <div>Seed: {planet.seed}</div>
            <div>Press F to generate new planet</div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
