import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// No Man's Sky - Planet Data types
export type PlanetType = 
  'Lush' | 'Desert' | 'Toxic' | 'Radioactive' | 'Frozen' | 'Barren' | 
  'Exotic' | 'Volcanic' | 'Ocean' | 'Anomalous' | 'Dead';

export type Biome = 
  'Verdant' | 'Tropical' | 'Scorched' | 'Irradiated' | 'Frozen' | 
  'Lifeless' | 'Corrupted' | 'Metallic' | 'Marshy' | 'Mineral' | 'Fungal' | 'Toxic';

export type Atmosphere = 
  'Breathable' | 'Highly Toxic' | 'Radioactive' | 'Corrosive' | 
  'None' | 'Nitrogen-Rich' | 'Argon-Rich' | 'Dusty' | 'Oxygen-Rich';

export type SentinelActivity = 'None' | 'Limited' | 'Normal' | 'Aggressive' | 'Frenzied';
export type Weather = 'Calm' | 'Dusty' | 'Rainy' | 'Stormy' | 'Extreme' | 'Burning' | 'Freezing' | 'Toxic';
export type Temperature = 'Freezing' | 'Cold' | 'Mild' | 'Warm' | 'Hot' | 'Scorching';
export type Radiation = 'None' | 'Low' | 'Moderate' | 'High' | 'Extreme';
export type Toxicity = 'None' | 'Low' | 'Moderate' | 'High' | 'Extreme';

export interface Resource {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare';
  value: number;
  description: string;
  color: string;
}

export interface Flora {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare';
  height: number; // In meters
  description: string;
}

export interface Fauna {
  id: string;
  name: string;
  type: 'Herbivore' | 'Carnivore' | 'Omnivore';
  rarity: 'Common' | 'Uncommon' | 'Rare';
  height: number; // In meters
  weight: number; // In kg
  temperament: 'Docile' | 'Skittish' | 'Territorial' | 'Predatory';
  description: string;
}

export interface PlanetData {
  id: string;
  name: string;
  seed: number;
  type: PlanetType;
  biome: Biome;
  atmosphere: Atmosphere;
  size: number;
  resources: Resource[];
  flora: Flora[];
  fauna: Fauna[];
  sentinels: SentinelActivity;
  weather: Weather;
  temperature: Temperature;
  radiation: Radiation;
  toxicity: Toxicity;
  color: {
    surface: string;
    water: string;
    atmosphere: string;
  };
  discovered: boolean;
  discoveryDate?: Date;
}

// Database tables for discoveries
export const discoveredPlanets = pgTable("discovered_planets", {
  id: serial("id").primaryKey(),
  planetId: text("planet_id").notNull(),
  planetData: json("planet_data").$type<PlanetData>().notNull(),
  discoveredBy: integer("discovered_by").references(() => users.id),
  discoveryDate: text("discovery_date").notNull(),
});

export const discoveredSystems = pgTable("discovered_systems", {
  id: serial("id").primaryKey(),
  systemId: text("system_id").notNull(),
  systemData: json("system_data").notNull(),
  discoveredBy: integer("discovered_by").references(() => users.id),
  discoveryDate: text("discovery_date").notNull(),
});
