import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Orbit, 
  Telescope, 
  Database, 
  BookOpen, 
  Menu, 
  X,
  VolumeX,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';

interface HeaderProps {
  activeScreen: 'planet' | 'galaxy' | 'resources' | 'discovery';
  setActiveScreen: (screen: 'planet' | 'galaxy' | 'resources' | 'discovery') => void;
}

export default function Header({ activeScreen, setActiveScreen }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleMute, isMuted } = useAudio();

  // Navigation items
  const navItems = [
    { name: 'Orbit Explorer', value: 'planet', icon: Orbit, color: 'text-primary' },
    { name: 'Galaxy Map', value: 'galaxy', icon: Telescope, color: 'text-secondary' },
    { name: 'Resource Catalog', value: 'resources', icon: Database, color: 'text-accent' },
    { name: 'Discovery Log', value: 'discovery', icon: BookOpen, color: 'text-chart-4' }
  ];

  return (
    <header className="py-2 px-4 backdrop-blur-md bg-background/30 border-b border-primary/20 z-10">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Title */}
        <motion.div 
          className="flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Orbit className="h-7 w-7 text-primary mr-2" />
          <h1 className="text-xl font-semibold text-primary glow-text">NO MAN'S SKY EXPLORER</h1>
        </motion.div>

        {/* Desktop Navigation */}
        <motion.nav 
          className="hidden md:flex items-center space-x-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveScreen(item.value as any)}
              className={cn(
                "flex items-center px-3 py-2 rounded-md transition-all duration-300 hover-3d",
                activeScreen === item.value
                  ? `${item.color} bg-muted/30`
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mr-2" />
              <span>{item.name}</span>
            </button>
          ))}

          {/* Sound toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </motion.nav>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-primary"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div
          className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-primary/20 md:hidden z-50"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto py-3 px-4 flex flex-col space-y-2">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setActiveScreen(item.value as any);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md w-full transition-all",
                  activeScreen === item.value
                    ? `${item.color} bg-muted/30`
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </button>
            ))}
            
            {/* Sound toggle button for mobile */}
            <button
              onClick={toggleMute}
              className="flex items-center px-4 py-3 rounded-md w-full transition-all text-muted-foreground hover:text-foreground"
            >
              {isMuted ? <VolumeX className="h-5 w-5 mr-3" /> : <Volume2 className="h-5 w-5 mr-3" />}
              <span>{isMuted ? "Unmute Audio" : "Mute Audio"}</span>
            </button>
          </div>
        </motion.div>
      )}
    </header>
  );
}
