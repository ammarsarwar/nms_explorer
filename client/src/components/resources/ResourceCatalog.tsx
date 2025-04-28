import { useState, useEffect } from 'react';
import { usePlanet } from '@/lib/stores/usePlanet';
import { useGalaxy } from '@/lib/stores/useGalaxy';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Resource } from '@/components/planet/ProcGen';
import ResourceItem from './ResourceItem';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Filter, 
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';

// Type for resource rarity filtering
type RarityFilter = 'all' | 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare';

export default function ResourceCatalog() {
  const { currentPlanet } = usePlanet();
  const { systems, selectedSystem } = useGalaxy();
  const { playHit } = useAudio();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'rarity'>('name');
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
  
  // All resources across visited planets (in a real app, this would come from a database)
  const [allResources, setAllResources] = useState<Resource[]>([]);
  
  // Get all resources when planet changes
  useEffect(() => {
    if (currentPlanet) {
      // In a real app, we would accumulate resources from all visited planets
      // For now, we'll just use the current planet's resources
      setAllResources(currentPlanet.resources);
    }
  }, [currentPlanet]);
  
  // Filter and sort resources
  const filteredResources = (activeTab === 'current' ? currentPlanet?.resources || [] : allResources)
    .filter(resource => {
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply rarity filter
      const matchesRarity = rarityFilter === 'all' || resource.rarity === rarityFilter;
      
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'value') {
        return b.value - a.value;
      } else { // rarity
        const rarityOrder = { 'Common': 0, 'Uncommon': 1, 'Rare': 2, 'Ultra Rare': 3 };
        return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
      }
    });
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  // Reset all filters
  const resetFilters = () => {
    setRarityFilter('all');
    setSortBy('name');
    setSearchTerm('');
    playHit();
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'current' | 'all');
    playHit();
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
            <h2 className="text-2xl md:text-3xl font-bold text-accent glow-text-orange mb-2">Resource Catalog</h2>
            <p className="text-muted-foreground max-w-md">
              Analyze and catalog resources discovered across the universe
            </p>
          </div>
          
          {currentPlanet && (
            <div className="mt-4 md:mt-0 text-right">
              <div className="text-sm text-muted-foreground">Current Planet</div>
              <div className="text-lg font-medium text-accent">{currentPlanet.name}</div>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="current" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/20">
              <TabsTrigger value="current" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                Current Planet
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                All Discoveries
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-muted/20 border-muted/30 text-sm"
                />
                {searchTerm && (
                  <button 
                    onClick={clearSearch}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <button 
                onClick={resetFilters}
                className="bg-muted/20 p-2 rounded-md text-muted-foreground hover:text-foreground"
                title="Reset filters"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground mr-2">Rarity:</span>
            </div>
            {(['all', 'Common', 'Uncommon', 'Rare', 'Ultra Rare'] as const).map(rarity => (
              <button
                key={rarity}
                onClick={() => {
                  setRarityFilter(rarity);
                  playHit();
                }}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border",
                  rarityFilter === rarity 
                    ? rarity === 'all' 
                      ? "bg-muted/30 border-muted/50 text-foreground" 
                      : rarity === 'Common' 
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                        : rarity === 'Uncommon'
                          ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                          : rarity === 'Rare'
                            ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                            : "bg-red-500/20 border-red-500/30 text-red-400"
                    : "bg-transparent border-muted/30 text-muted-foreground hover:border-muted/50"
                )}
              >
                {rarity === 'all' ? 'All Rarities' : rarity}
              </button>
            ))}
            
            <div className="flex items-center ml-4">
              <span className="text-sm text-muted-foreground mr-2">Sort:</span>
            </div>
            {([
              { value: 'name', label: 'Name' },
              { value: 'value', label: 'Value' },
              { value: 'rarity', label: 'Rarity' },
            ] as const).map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  playHit();
                }}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border",
                  sortBy === option.value
                    ? "bg-accent/20 border-accent/30 text-accent"
                    : "bg-transparent border-muted/30 text-muted-foreground hover:border-muted/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <TabsContent value="current" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPlanet && filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground">
                    {currentPlanet 
                      ? "No resources matching your filters found on this planet." 
                      : "No planet selected. Explore the galaxy to discover resources."}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground">
                    No resources matching your filters found in your catalog.
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center text-xs text-muted-foreground">
          {filteredResources.length} resources displayed • {allResources.length} total discovered
        </div>
      </motion.div>
    </div>
  );
}
