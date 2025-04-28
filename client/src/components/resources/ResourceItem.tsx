import { useState } from 'react';
import { motion } from 'framer-motion';
import { Resource } from '@/components/planet/ProcGen';
import { Card } from '@/components/ui/card';
import { 
  Maximize2, 
  Coins,
  X
} from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';
import { cn } from '@/lib/utils';

interface ResourceItemProps {
  resource: Resource;
}

export default function ResourceItem({ resource }: ResourceItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { playHit } = useAudio();
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    playHit();
  };
  
  // Get color class based on rarity
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'Common':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Uncommon':
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'Rare':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'Ultra Rare':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
        className="hover-3d"
      >
        <Card className="holographic-card border border-primary/20 overflow-hidden backdrop-blur-sm">
          <div className="flex p-4">
            <div 
              className="w-12 h-12 rounded-md mr-4 flex-shrink-0"
              style={{ backgroundColor: resource.color }}
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-foreground">{resource.name}</h3>
                <button 
                  onClick={toggleExpanded}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  getRarityColor(resource.rarity)
                )}>
                  {resource.rarity}
                </div>
                <div className="flex items-center text-accent">
                  <Coins className="h-3.5 w-3.5 mr-1" />
                  <span className="text-sm font-mono">{resource.value}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {resource.description}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Expanded resource detail modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md"
          >
            <Card className="holographic-card border border-primary/30 overflow-hidden backdrop-blur-md">
              <div className="relative p-6">
                <button 
                  onClick={toggleExpanded}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-start mb-4">
                  <div 
                    className="w-16 h-16 rounded-md mr-4 flex-shrink-0"
                    style={{ backgroundColor: resource.color }}
                  />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{resource.name}</h2>
                    <div className={cn(
                      "text-xs px-2 py-0.5 rounded-full border inline-block mt-1",
                      getRarityColor(resource.rarity)
                    )}>
                      {resource.rarity}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-sm">{resource.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Market Value</h3>
                    <div className="flex items-center text-accent text-lg">
                      <Coins className="h-5 w-5 mr-2" />
                      <span className="font-mono">{resource.value} units</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Properties</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Element ID</span>
                        <span className="font-mono">{resource.id.split('-')[2]}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Molecular Structure</span>
                        <span>Complex</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">State</span>
                        <span>Solid</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Density</span>
                        <span>Medium</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Uses</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Spacecraft fuel refinement</li>
                      <li>Advanced technology crafting</li>
                      <li>Trading with alien merchants</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  );
}
