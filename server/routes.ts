import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePlanet, generateGalaxy } from "./services/generation";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes for No Man's Sky Explorer web app
  const httpServer = createServer(app);
  
  // API route to generate a random planet
  app.get('/api/planet/generate', (req, res) => {
    try {
      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const planet = generatePlanet(seed);
      res.json(planet);
    } catch (error) {
      console.error('Error generating planet:', error);
      res.status(500).json({ message: 'Failed to generate planet' });
    }
  });
  
  // API route to generate a galaxy
  app.get('/api/galaxy/generate', (req, res) => {
    try {
      const seed = req.query.seed ? parseInt(req.query.seed as string) : undefined;
      const count = req.query.count ? parseInt(req.query.count as string) : 50;
      const galaxy = generateGalaxy(seed, count);
      res.json(galaxy);
    } catch (error) {
      console.error('Error generating galaxy:', error);
      res.status(500).json({ message: 'Failed to generate galaxy' });
    }
  });
  
  // API route to save discoveries (in a real app, this would persist to database)
  app.post('/api/discoveries/save', (req, res) => {
    try {
      const { type, data } = req.body;
      
      if (!type || !data) {
        return res.status(400).json({ message: 'Invalid discovery data' });
      }
      
      // In a real app, save to database
      // For now, just return success
      res.json({ 
        success: true, 
        message: `Successfully saved ${type} discovery`,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving discovery:', error);
      res.status(500).json({ message: 'Failed to save discovery' });
    }
  });
  
  // API route to get discoveries (in a real app, this would fetch from database)
  app.get('/api/discoveries', (req, res) => {
    try {
      // In a real app, fetch from database
      // For now, just return empty array
      res.json([]);
    } catch (error) {
      console.error('Error fetching discoveries:', error);
      res.status(500).json({ message: 'Failed to fetch discoveries' });
    }
  });

  return httpServer;
}
