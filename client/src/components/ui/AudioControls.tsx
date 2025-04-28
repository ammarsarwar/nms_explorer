import { useState } from 'react';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Howler } from 'howler';

export default function AudioControls() {
  const { toggleMute, isMuted, playBackgroundMusic, stopBackgroundMusic, isMusicPlaying } = useAudio();
  const [volume, setVolume] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    // Set global volume for all sounds
    Howler.volume(newVolume);
  };
  
  // Toggle audio
  const handleToggleMute = () => {
    toggleMute();
  };
  
  // Toggle background music
  const handleToggleMusic = () => {
    if (isMusicPlaying) {
      stopBackgroundMusic();
    } else {
      playBackgroundMusic();
    }
  };

  return (
    <motion.div 
      className="fixed bottom-4 left-4 flex items-center gap-2 holographic-card p-2 rounded-full z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Sound on/off button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleToggleMute}
        className="w-10 h-10 rounded-full text-primary hover:text-primary/80 hover:bg-background/50"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX /> : <Volume2 />}
      </Button>
      
      {/* Music on/off button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleToggleMusic}
        className="w-10 h-10 rounded-full text-secondary hover:text-secondary/80 hover:bg-background/50"
        title={isMusicPlaying ? "Stop Music" : "Play Music"}
      >
        {isMusicPlaying ? <Music /> : <Music2 />}
      </Button>
      
      {/* Volume slider */}
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
