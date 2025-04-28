import { create } from "zustand";
import { Howl, Howler } from 'howler';

// Load and configure sounds
let backgroundMusic: any = null; 
let hitSound: any = null;
let successSound: any = null;
let explorationSound: any = null;

// Preload sounds - we'll do this outside to avoid duplicate sounds
try {
  backgroundMusic = new Howl({
    src: ['/sounds/ambient.mp3'],
    loop: true,
    volume: 0.3,
    autoplay: false
  });
  
  hitSound = new Howl({
    src: ['/sounds/hit.mp3'],
    volume: 0.5
  });
  
  successSound = new Howl({
    src: ['/sounds/success.mp3'],
    volume: 0.6
  });
  
  explorationSound = new Howl({
    src: ['/sounds/exploration.mp3'],
    volume: 0.5
  });
  
  console.log("Audio files loaded successfully");
} catch (error) {
  console.error("Failed to load audio files:", error);
}

interface AudioState {
  isMuted: boolean;
  isMusicPlaying: boolean;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playExploration: () => void;
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  isMuted: false, // Start unmuted to allow sound
  isMusicPlaying: false,
  
  toggleMute: () => {
    const { isMuted, isMusicPlaying, stopBackgroundMusic, playBackgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Handle global mute
    Howler.mute(newMutedState);
    
    // Special handling for background music
    if (newMutedState) {
      if (backgroundMusic && isMusicPlaying) {
        backgroundMusic.pause();
      }
    } else {
      // If unmuting and music was playing, restart it
      if (isMusicPlaying && backgroundMusic) {
        backgroundMusic.play();
      }
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { isMuted } = get();
    if (isMuted || !hitSound) return;
    
    hitSound.play();
  },
  
  playSuccess: () => {
    const { isMuted } = get();
    if (isMuted || !successSound) return;
    
    successSound.play();
  },
  
  playExploration: () => {
    const { isMuted } = get();
    if (isMuted || !explorationSound) return;
    
    explorationSound.play();
  },
  
  playBackgroundMusic: () => {
    const { isMuted, isMusicPlaying } = get();
    
    if (isMusicPlaying || !backgroundMusic) return;
    
    if (!isMuted) {
      backgroundMusic.play();
    }
    
    set({ isMusicPlaying: true });
  },
  
  stopBackgroundMusic: () => {
    if (backgroundMusic) {
      backgroundMusic.pause();
    }
    set({ isMusicPlaying: false });
  }
}));

// Start background music on load
setTimeout(() => {
  const { playBackgroundMusic } = useAudio.getState();
  playBackgroundMusic();
}, 1000);
