import { useState, useEffect } from 'react';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';

export default function AudioControls() {
  const { backgroundMusic, toggleMute, isMuted } = useAudio();
  const [volume, setVolume] = useState(0.4);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (backgroundMusic) {
      backgroundMusic.volume = newVolume;
    }
  };
  
  // Toggle audio
  const handleToggleMute = () => {
    toggleMute();
    
    if (backgroundMusic) {
      if (isMuted) {
        // If currently muted, unmute and play
        backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      } else {
        // If currently playing, pause
        backgroundMusic.pause();
      }
    }
  };
  
  // Auto-start the background music when component mounts
  useEffect(() => {
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(error => {
        console.log("Background music auto-play prevented:", error);
      });
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic]);

  return (
    <motion.div 
      className="fixed bottom-4 left-4 flex items-center gap-2 holographic-card p-2 rounded-full z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleToggleMute}
        className="w-10 h-10 rounded-full text-primary hover:text-primary/80 hover:bg-background/50"
      >
        {isMuted ? <VolumeX /> : <Volume2 />}
      </Button>
      
      {isExpanded && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 100, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <Slider
            defaultValue={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </motion.div>
      )}
    </motion.div>
  );
}
