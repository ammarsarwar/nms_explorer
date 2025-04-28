import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Star type definition
interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Initialize stars
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        
        const starCount = Math.floor((width * height) / 1500); // Density of stars
        const newStars: Star[] = [];
        
        // Colors for stars
        const starColors = [
          '#ffffff', // White
          '#fffae6', // Warm white
          '#e6f2ff', // Cool white
          '#ffe6e6', // Reddish
          '#e6ffe6', // Greenish
          '#e6e6ff', // Bluish
        ];
        
        for (let i = 0; i < starCount; i++) {
          newStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 3 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            speed: Math.random() * 0.02 + 0.01,
            color: starColors[Math.floor(Math.random() * starColors.length)]
          });
        }
        
        setStars(newStars);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Draw stars
  useEffect(() => {
    if (!canvasRef.current || stars.length === 0 || dimensions.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    let animationId: number;
    let lastTime = 0;
    
    const animate = (time: number) => {
      // Calculate time delta for smooth animation
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw and update stars
      stars.forEach((star, index) => {
        // Draw star
        ctx.beginPath();
        
        // Random choice between circle and cross shapes
        if (star.size > 2) {
          // Cross shape for larger stars
          const halfSize = star.size / 2;
          ctx.moveTo(star.x - halfSize, star.y);
          ctx.lineTo(star.x + halfSize, star.y);
          ctx.moveTo(star.x, star.y - halfSize);
          ctx.lineTo(star.x, star.y + halfSize);
          
          // Add glow effect
          ctx.shadowColor = star.color;
          ctx.shadowBlur = star.size * 2;
        } else {
          // Circle for smaller stars
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = `${star.color}${Math.floor(star.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
        
        // Update star position (parallax effect)
        stars[index].y += star.speed * delta * 60;
        
        // Reset stars that go off-screen
        if (stars[index].y > dimensions.height) {
          stars[index].y = 0;
          stars[index].x = Math.random() * dimensions.width;
        }
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [stars, dimensions]);
  
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden z-[-1]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06001E] to-[#0F0225] z-[-2]" />
      
      {/* Nebula effect */}
      <div className="absolute inset-0 z-[-1] opacity-30 cosmic-bg">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-[120px] transform translate-x-1/4 translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-primary/10 rounded-full blur-[100px] transform -translate-x-1/4 -translate-y-1/4" />
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/2 bg-accent/10 rounded-full blur-[80px]" />
      </div>
      
      {/* Hexagonal grid pattern overlay */}
      <div className="absolute inset-0 hexgrid-pattern opacity-20 z-[-1]" />
      
      {/* Starfield canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[-1]"
      />
    </motion.div>
  );
}
