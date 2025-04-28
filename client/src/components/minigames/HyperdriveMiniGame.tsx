import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGalaxy } from '@/lib/stores/useGalaxy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Fuel, 
  Rocket, 
  Zap,
  ChevronRight,
  Target,
  CheckCircle
} from 'lucide-react';

interface HyperdriveMiniGameProps {
  onClose: () => void;
}

export default function HyperdriveMiniGame({ onClose }: HyperdriveMiniGameProps) {
  const { hyperfuel, addHyperfuel, availableGalaxies, currentGalaxy, travelToGalaxy } = useGalaxy();
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'success' | 'failed'>('intro');
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [stability, setStability] = useState(100);
  const [targetLocked, setTargetLocked] = useState(false);
  const [selectedGalaxy, setSelectedGalaxy] = useState<string | null>(null);
  const [earnedFuel, setEarnedFuel] = useState(0);
  const [countdown, setCountdown] = useState(5);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize game
  const startGame = () => {
    setGameState('playing');
    setStability(100);
    setTargetLocked(false);
    setEarnedFuel(0);
    
    // Set initial random target position
    setTargetPosition({
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40
    });
    
    // Start stability countdown
    stabilityTimerRef.current = setInterval(() => {
      setStability(prev => {
        const newStability = prev - 0.5;
        if (newStability <= 0) {
          clearInterval(stabilityTimerRef.current!);
          setGameState('failed');
          return 0;
        }
        return newStability;
      });
    }, 100);
  };
  
  // Handle mouse/touch move in game area
  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'playing' || !gameAreaRef.current) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCursorPosition({ x, y });
    
    // Check if cursor is close to target
    const distance = Math.sqrt(
      Math.pow(x - targetPosition.x, 2) + 
      Math.pow(y - targetPosition.y, 2)
    );
    
    if (distance < 5) {
      if (!targetLocked) {
        setTargetLocked(true);
        
        // Award fuel based on stability
        const fuelEarned = Math.floor(stability / 10);
        setEarnedFuel(fuelEarned);
        
        // Start countdown
        setCountdown(5);
        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              clearInterval(stabilityTimerRef.current!);
              setGameState('success');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else if (targetLocked) {
      // Lost target lock
      setTargetLocked(false);
      clearInterval(timerRef.current!);
    }
  };
  
  // Travel to selected galaxy
  const handleTravel = () => {
    if (selectedGalaxy) {
      // Add earned fuel and then attempt travel
      addHyperfuel(earnedFuel);
      
      // Slight delay to update fuel count
      setTimeout(() => {
        if (travelToGalaxy(selectedGalaxy)) {
          onClose();
        } else {
          // Not enough fuel
          setGameState('failed');
        }
      }, 100);
    }
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stabilityTimerRef.current) clearInterval(stabilityTimerRef.current);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80 backdrop-blur-sm">
      <motion.div 
        className="bg-black/80 border border-primary/30 rounded-lg p-6 max-w-2xl w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Hyperdrive System</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {gameState === 'intro' && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-muted/20 rounded-lg mb-6">
              <h3 className="text-xl font-medium mb-2 text-secondary">Select Destination Galaxy</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Current hyperfuel: <span className="text-yellow-400 font-medium">{hyperfuel} units</span>
              </p>
              
              <div className="grid grid-cols-1 gap-3 mt-4">
                {availableGalaxies.map(galaxy => (
                  <Button
                    key={galaxy.id}
                    variant={selectedGalaxy === galaxy.id ? "default" : "outline"}
                    className={`justify-between ${galaxy.id === currentGalaxy ? 'border-green-500 bg-green-500/10' : ''}`}
                    disabled={galaxy.id === currentGalaxy}
                    onClick={() => {
                      setSelectedGalaxy(galaxy.id);
                    }}
                  >
                    <span>{galaxy.name}</span>
                    <span className="flex items-center">
                      <Fuel className="h-4 w-4 mr-1 text-yellow-400" />
                      <span className={galaxy.requiredFuel > hyperfuel ? 'text-red-400' : 'text-yellow-400'}>
                        {galaxy.requiredFuel}
                      </span>
                      {galaxy.id === currentGalaxy && (
                        <span className="ml-2 text-green-500 text-xs">(Current)</span>
                      )}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-4">
                Calibrate the hyperdrive to earn fuel for your journey. Lock onto the target and maintain stability.
              </p>
              <Button 
                size="lg" 
                className="w-full bg-primary/80 hover:bg-primary"
                disabled={!selectedGalaxy || selectedGalaxy === currentGalaxy}
                onClick={startGame}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Begin Calibration
              </Button>
            </div>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-sm text-muted-foreground">Destination:</span>
                <span className="ml-2 text-secondary">
                  {availableGalaxies.find(g => g.id === selectedGalaxy)?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Required Fuel:</span>
                <span className="ml-2 text-yellow-400">
                  {availableGalaxies.find(g => g.id === selectedGalaxy)?.requiredFuel || 0}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Drive Stability:</span>
                <span className={`text-sm ${stability > 50 ? 'text-green-400' : stability > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.floor(stability)}%
                </span>
              </div>
              <Progress 
                value={stability} 
                className="h-2 mt-1" 
              />
            </div>
            
            {targetLocked && (
              <div className="bg-green-500/20 border border-green-500/50 p-2 rounded-md text-center animate-pulse">
                <p className="text-green-400 font-medium">Target Locked! Maintaining in {countdown}...</p>
              </div>
            )}
            
            <div 
              ref={gameAreaRef}
              className="relative w-full h-64 bg-black border border-primary/30 rounded-lg overflow-hidden"
              onPointerMove={handlePointerMove}
            >
              {/* Background grid */}
              <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
              
              {/* Target */}
              <div 
                className={`absolute w-10 h-10 pointer-events-none transition duration-1000 ${targetLocked ? 'scale-110' : 'scale-100'}`} 
                style={{ 
                  left: `calc(${targetPosition.x}% - 20px)`, 
                  top: `calc(${targetPosition.y}% - 20px)`
                }}
              >
                <div className={`w-full h-full rounded-full border-2 ${targetLocked ? 'border-green-500' : 'border-yellow-500'} flex items-center justify-center animate-ping-slow`}>
                  <div className={`w-2 h-2 rounded-full ${targetLocked ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
              </div>
              
              {/* Cursor */}
              <div 
                className="absolute w-8 h-8 pointer-events-none" 
                style={{ 
                  left: `calc(${cursorPosition.x}% - 16px)`, 
                  top: `calc(${cursorPosition.y}% - 16px)`
                }}
              >
                <Target className={`h-8 w-8 ${targetLocked ? 'text-green-500' : 'text-blue-400'}`} />
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground italic">
              Move your cursor to target and maintain lock on the signal to calibrate hyperdrive
            </p>
          </div>
        )}
        
        {gameState === 'success' && (
          <div className="text-center space-y-6">
            <div className="py-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-secondary">Calibration Successful!</h3>
              <p className="text-muted-foreground">
                You've earned <span className="text-yellow-400 font-medium">{earnedFuel}</span> units of hyperfuel.
              </p>
            </div>
            
            <div className="bg-muted/20 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Current Hyperfuel:</span>
                <span className="text-yellow-400">{hyperfuel} units</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Earned Hyperfuel:</span>
                <span className="text-green-400">+{earnedFuel} units</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Required for Travel:</span>
                <span className="text-blue-400">
                  {availableGalaxies.find(g => g.id === selectedGalaxy)?.requiredFuel || 0} units
                </span>
              </div>
              <div className="h-px bg-muted-foreground/30 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total After Travel:</span>
                <span className={`font-medium ${
                  (hyperfuel + earnedFuel) >= (availableGalaxies.find(g => g.id === selectedGalaxy)?.requiredFuel || 0)
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {(hyperfuel + earnedFuel) - (availableGalaxies.find(g => g.id === selectedGalaxy)?.requiredFuel || 0)} units
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={startGame}
              >
                <Zap className="mr-2 h-4 w-4" />
                Recalibrate
              </Button>
              
              <Button
                className="flex-1 bg-primary/80 hover:bg-primary"
                onClick={handleTravel}
                disabled={(hyperfuel + earnedFuel) < (availableGalaxies.find(g => g.id === selectedGalaxy)?.requiredFuel || 0)}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Launch to {availableGalaxies.find(g => g.id === selectedGalaxy)?.name}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {gameState === 'failed' && (
          <div className="text-center space-y-6">
            <div className="py-4">
              <X className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-red-400">Calibration Failed</h3>
              <p className="text-muted-foreground">
                The hyperdrive calibration was unsuccessful. Drive stability reached critical levels.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGameState('intro')}
              >
                Change Destination
              </Button>
              
              <Button
                className="flex-1 bg-primary/80 hover:bg-primary"
                onClick={startGame}
              >
                <Zap className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}