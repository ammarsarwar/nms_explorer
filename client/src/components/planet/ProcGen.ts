import * as THREE from 'three';

// Types for generated data
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

export type PlanetType = 
  'Lush' | 'Desert' | 'Toxic' | 'Radioactive' | 'Frozen' | 'Barren' | 
  'Exotic' | 'Volcanic' | 'Ocean' | 'Anomalous' | 'Dead';

export type Biome = 
  'Verdant' | 'Tropical' | 'Scorched' | 'Irradiated' | 'Frozen' | 
  'Lifeless' | 'Corrupted' | 'Metallic' | 'Marshy' | 'Mineral' | 'Fungal';

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

// Dictionary of syllables for procedural names
const nameParts = {
  prefixes: ['A', 'Ba', 'Ce', 'Du', 'E', 'Fa', 'Go', 'Ha', 'I', 'Ju', 'Ka', 'Lo', 'Ma', 'No', 'O', 'Pa', 'Qu', 'Ra', 'Sa', 'Ta', 'U', 'Va', 'Wa', 'Xa', 'Ya', 'Za'],
  middles: ['ba', 'ca', 'da', 'fa', 'ga', 'ha', 'ka', 'la', 'ma', 'na', 'pa', 'ra', 'sa', 'ta', 'va', 'xa', 'za'],
  suffixes: ['a', 'ab', 'ac', 'ad', 'al', 'am', 'an', 'ar', 'as', 'at', 'ax', 'ay', 'az', 'e', 'en', 'er', 'es', 'et', 'i', 'ia', 'im', 'in', 'is', 'it', 'o', 'ob', 'on', 'or', 'os', 'u', 'um', 'us']
};

// Dictionary of resource prefixes and suffixes
const resourceParts = {
  prefixes: ['Alu', 'Chro', 'Cad', 'Di', 'Emer', 'Ferr', 'Gal', 'Hera', 'Indi', 'Jav', 'Kelo', 'Lumi', 'Magn', 'Nept', 'Osm', 'Phos', 'Quant', 'Rad', 'Sil', 'Trit', 'Ura', 'Vort', 'Warp', 'Xen', 'Yttr', 'Zirk'],
  suffixes: ['ite', 'ium', 'on', 'um', 'ine', 'ese', 'ide', 'ane', 'ate', 'one', 'ite', 'ark', 'ix', 'oid', 'ene', 'yl', 'yst', 'ian', 'alt', 'ore']
};

// Planet generation functions
export class ProcGen {
  private static seededRandom(seed: number): () => number {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  private static pickRandom<T>(array: T[], randomFn: () => number): T {
    return array[Math.floor(randomFn() * array.length)];
  }
  
  private static generateName(seed: number): string {
    const random = this.seededRandom(seed);
    const useMid = random() > 0.5;
    
    const prefix = this.pickRandom(nameParts.prefixes, random);
    const middle = useMid ? this.pickRandom(nameParts.middles, random) : '';
    const suffix = this.pickRandom(nameParts.suffixes, random);
    
    // Occasionally add roman numeral
    const addNumeral = random() > 0.7;
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    const numeral = addNumeral ? ' ' + this.pickRandom(numerals, random) : '';
    
    return prefix + middle + suffix + numeral;
  }
  
  private static generateResourceName(seed: number): string {
    const random = this.seededRandom(seed);
    const prefix = this.pickRandom(resourceParts.prefixes, random);
    const suffix = this.pickRandom(resourceParts.suffixes, random);
    
    return prefix + suffix;
  }
  
  private static generateColor(seed: number, baseHue: number, satRange: [number, number], lightRange: [number, number]): string {
    const random = this.seededRandom(seed);
    
    // Base hue with some random variation
    const hue = (baseHue + random() * 30 - 15) % 360;
    
    // Saturation and lightness from provided ranges
    const saturation = satRange[0] + random() * (satRange[1] - satRange[0]);
    const lightness = lightRange[0] + random() * (lightRange[1] - lightRange[0]);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  private static generateResources(planetType: PlanetType, seed: number, count: number): Resource[] {
    const random = this.seededRandom(seed);
    const resources: Resource[] = [];
    
    const rarities: ('Common' | 'Uncommon' | 'Rare' | 'Ultra Rare')[] = ['Common', 'Uncommon', 'Rare', 'Ultra Rare'];
    const rarityDistribution = [0.5, 0.3, 0.15, 0.05]; // Probability distribution
    
    // Resource color ranges based on rarity
    const colorRanges = {
      'Common': [0, 60], // Yellow-Green
      'Uncommon': [180, 240], // Cyan-Blue
      'Rare': [270, 330], // Purple-Pink
      'Ultra Rare': [0, 30] // Red-Orange
    };
    
    const descriptions = [
      'A crystalline substance with energy-storing properties.',
      'A valuable mineral used in advanced technology.',
      'A rare element with unique molecular properties.',
      'A metamorphic compound formed under extreme pressure.',
      'An exotic material with unusual physical characteristics.',
      'A precious metal highly valued across the galaxy.',
      'A glowing substance with potential biological applications.',
      'A scarce resource needed for advanced starship components.',
      'A dense material used in construction and engineering.',
      'An energy-rich substance that powers various technologies.'
    ];
    
    for (let i = 0; i < count; i++) {
      // Determine rarity based on weighted distribution
      let rarityIndex = 0;
      const randValue = random();
      let cumulativeProbability = 0;
      
      for (let j = 0; j < rarityDistribution.length; j++) {
        cumulativeProbability += rarityDistribution[j];
        if (randValue <= cumulativeProbability) {
          rarityIndex = j;
          break;
        }
      }
      
      const rarity = rarities[rarityIndex];
      
      // Generate value based on rarity
      const baseValue = (rarityIndex + 1) * 200;
      const value = Math.floor(baseValue * (0.8 + random() * 0.4));
      
      // Generate color based on rarity
      const hueRange = colorRanges[rarity];
      const hue = hueRange[0] + random() * (hueRange[1] - hueRange[0]);
      const color = `hsl(${hue}, ${70 + random() * 30}%, ${40 + random() * 20}%)`;
      
      resources.push({
        id: `resource-${seed}-${i}`,
        name: this.generateResourceName(seed + i),
        rarity,
        value,
        description: this.pickRandom(descriptions, random),
        color
      });
    }
    
    return resources;
  }
  
  private static generateFlora(biome: Biome, seed: number, count: number): Flora[] {
    const random = this.seededRandom(seed);
    const flora: Flora[] = [];
    
    const floraTypes = [
      'Plant', 'Tree', 'Fungus', 'Flower', 'Bush', 
      'Vine', 'Root', 'Fern', 'Cactus', 'Shrub'
    ];
    
    const descriptors = [
      'Glowing', 'Towering', 'Twisted', 'Bulbous', 'Spiny',
      'Webbed', 'Fibrous', 'Floating', 'Crystalline', 'Mossy',
      'Spotted', 'Striped', 'Hollow', 'Serrated', 'Smooth'
    ];
    
    for (let i = 0; i < count; i++) {
      const type = this.pickRandom(floraTypes, random);
      const descriptor = this.pickRandom(descriptors, random);
      
      const rarity: ('Common' | 'Uncommon' | 'Rare') = random() > 0.95 
        ? 'Rare' 
        : random() > 0.7 ? 'Uncommon' : 'Common';
      
      const height = 0.2 + random() * (rarity === 'Rare' ? 25 : rarity === 'Uncommon' ? 15 : 5);
      
      const descriptions = [
        `A peculiar ${type.toLowerCase()} with ${descriptor.toLowerCase()} features.`,
        `This ${descriptor.toLowerCase()} ${type.toLowerCase()} emits a faint bioluminescence.`,
        `The ${descriptor.toLowerCase()} structure of this ${type.toLowerCase()} adapts well to the local climate.`,
        `This ${type.toLowerCase()} has evolved unique properties to survive in this environment.`,
        `A strange ${type.toLowerCase()} with unusual growth patterns.`
      ];
      
      flora.push({
        id: `flora-${seed}-${i}`,
        name: `${descriptor} ${type}`,
        rarity,
        height: Number(height.toFixed(1)),
        description: this.pickRandom(descriptions, random)
      });
    }
    
    return flora;
  }
  
  private static generateFauna(biome: Biome, seed: number, count: number): Fauna[] {
    const random = this.seededRandom(seed);
    const fauna: Fauna[] = [];
    
    const bodyTypes = [
      'Quadruped', 'Biped', 'Avian', 'Aquatic', 'Insectoid', 
      'Reptilian', 'Blob', 'Mechanical', 'Floating', 'Worm'
    ];
    
    const descriptors = [
      'Horned', 'Spotted', 'Spined', 'Armored', 'Massive',
      'Tiny', 'Glowing', 'Swift', 'Sluggish', 'Camouflaged',
      'Furred', 'Scaled', 'Bioluminescent', 'Tentacled', 'Winged'
    ];
    
    const temperaments: ('Docile' | 'Skittish' | 'Territorial' | 'Predatory')[] = 
      ['Docile', 'Skittish', 'Territorial', 'Predatory'];
    
    for (let i = 0; i < count; i++) {
      const type = this.pickRandom(bodyTypes, random);
      const descriptor = this.pickRandom(descriptors, random);
      
      const dietTypes: ('Herbivore' | 'Carnivore' | 'Omnivore')[] = ['Herbivore', 'Carnivore', 'Omnivore'];
      const diet = this.pickRandom(dietTypes, random);
      
      const rarity: ('Common' | 'Uncommon' | 'Rare') = random() > 0.95 
        ? 'Rare' 
        : random() > 0.7 ? 'Uncommon' : 'Common';
      
      // Height and weight based on type and rarity
      let baseHeight = 0.3;
      let baseWeight = 5;
      
      switch(type) {
        case 'Quadruped':
          baseHeight = 1;
          baseWeight = 100;
          break;
        case 'Biped':
          baseHeight = 1.5;
          baseWeight = 80;
          break;
        case 'Avian':
          baseHeight = 0.4;
          baseWeight = 8;
          break;
        case 'Aquatic':
          baseHeight = 0.8;
          baseWeight = 30;
          break;
        case 'Insectoid':
          baseHeight = 0.3;
          baseWeight = 2;
          break;
        case 'Reptilian':
          baseHeight = 0.6;
          baseWeight = 40;
          break;
        case 'Blob':
          baseHeight = 0.4;
          baseWeight = 20;
          break;
        case 'Mechanical':
          baseHeight = 1.2;
          baseWeight = 200;
          break;
        case 'Floating':
          baseHeight = 0.5;
          baseWeight = 10;
          break;
        case 'Worm':
          baseHeight = 2;
          baseWeight = 300;
          break;
      }
      
      // Adjust based on rarity
      const rarityMultiplier = rarity === 'Rare' ? 3 : rarity === 'Uncommon' ? 1.5 : 1;
      const height = baseHeight * (0.5 + random() * 1.5) * rarityMultiplier;
      const weight = baseWeight * (0.7 + random() * 1.3) * rarityMultiplier;
      
      // Temperament more likely to be predatory for carnivores
      let temperament: 'Docile' | 'Skittish' | 'Territorial' | 'Predatory';
      if (diet === 'Carnivore') {
        temperament = random() > 0.7 ? 'Predatory' : random() > 0.5 ? 'Territorial' : 'Skittish';
      } else if (diet === 'Herbivore') {
        temperament = random() > 0.8 ? 'Territorial' : random() > 0.4 ? 'Skittish' : 'Docile';
      } else {
        temperament = this.pickRandom(temperaments, random);
      }
      
      const descriptions = [
        `A ${temperament.toLowerCase()} ${type.toLowerCase()} creature with ${descriptor.toLowerCase()} features.`,
        `This ${diet.toLowerCase()} adapts well to the local environment.`,
        `The ${descriptor.toLowerCase()} appendages of this creature serve as both defense and tools.`,
        `This unique species has evolved specialized sensory organs.`,
        `A fascinating specimen with unusual metabolic processes.`
      ];
      
      fauna.push({
        id: `fauna-${seed}-${i}`,
        name: `${descriptor} ${type}`,
        type: diet,
        rarity,
        height: Number(height.toFixed(1)),
        weight: Number(weight.toFixed(1)),
        temperament,
        description: this.pickRandom(descriptions, random)
      });
    }
    
    return fauna;
  }
  
  public static generatePlanet(seed = Math.floor(Math.random() * 1000000)): PlanetData {
    const random = this.seededRandom(seed);
    
    // Generate basic planet properties
    const planetTypes: PlanetType[] = [
      'Lush', 'Desert', 'Toxic', 'Radioactive', 'Frozen', 
      'Barren', 'Exotic', 'Volcanic', 'Ocean', 'Anomalous', 'Dead'
    ];
    const type = this.pickRandom(planetTypes, random);
    
    // Assign biome based on planet type
    let biomes: Biome[] = ['Verdant'];
    switch(type) {
      case 'Lush':
        biomes = ['Verdant', 'Tropical'];
        break;
      case 'Desert':
        biomes = ['Scorched', 'Mineral'];
        break;
      case 'Toxic':
        biomes = ['Marshy', 'Toxic'];
        break;
      case 'Radioactive':
        biomes = ['Irradiated'];
        break;
      case 'Frozen':
        biomes = ['Frozen'];
        break;
      case 'Barren':
        biomes = ['Lifeless', 'Mineral'];
        break;
      case 'Exotic':
        biomes = ['Corrupted', 'Metallic', 'Fungal'];
        break;
      case 'Volcanic':
        biomes = ['Scorched'];
        break;
      case 'Ocean':
        biomes = ['Tropical'];
        break;
      case 'Anomalous':
        biomes = ['Corrupted', 'Metallic'];
        break;
      case 'Dead':
        biomes = ['Lifeless'];
        break;
    }
    const biome = this.pickRandom(biomes, random);
    
    // Assign atmosphere based on planet type
    let atmospheres: Atmosphere[] = ['None'];
    switch(type) {
      case 'Lush':
        atmospheres = ['Breathable', 'Oxygen-Rich'];
        break;
      case 'Desert':
        atmospheres = ['Dusty', 'Nitrogen-Rich'];
        break;
      case 'Toxic':
        atmospheres = ['Highly Toxic', 'Corrosive'];
        break;
      case 'Radioactive':
        atmospheres = ['Radioactive'];
        break;
      case 'Frozen':
        atmospheres = ['Nitrogen-Rich', 'Argon-Rich'];
        break;
      case 'Barren':
        atmospheres = ['None', 'Dusty'];
        break;
      case 'Exotic':
        atmospheres = ['Argon-Rich', 'None'];
        break;
      case 'Volcanic':
        atmospheres = ['Corrosive', 'Highly Toxic'];
        break;
      case 'Ocean':
        atmospheres = ['Breathable', 'Oxygen-Rich'];
        break;
      case 'Anomalous':
        atmospheres = ['None', 'Argon-Rich', 'Nitrogen-Rich'];
        break;
      case 'Dead':
        atmospheres = ['None'];
        break;
    }
    const atmosphere = this.pickRandom(atmospheres, random);
    
    // Generate colors based on planet type
    let surfaceHue = 0;
    let waterHue = 200;
    let atmosphereHue = 210;
    
    switch(type) {
      case 'Lush':
        surfaceHue = 120; // Green
        waterHue = 210; // Blue
        atmosphereHue = 200; // Cyan-Blue
        break;
      case 'Desert':
        surfaceHue = 30; // Orange-Brown
        waterHue = 40; // Yellow-Orange
        atmosphereHue = 30; // Orange
        break;
      case 'Toxic':
        surfaceHue = 100; // Yellow-Green
        waterHue = 120; // Green
        atmosphereHue = 90; // Yellow-Green
        break;
      case 'Radioactive':
        surfaceHue = 60; // Yellow
        waterHue = 70; // Yellow-Green
        atmosphereHue = 60; // Yellow
        break;
      case 'Frozen':
        surfaceHue = 210; // Blue
        waterHue = 210; // Blue
        atmosphereHue = 220; // Blue
        break;
      case 'Barren':
        surfaceHue = 30; // Brown
        waterHue = 30; // Brown
        atmosphereHue = 30; // Brown
        break;
      case 'Exotic':
        surfaceHue = 280; // Purple
        waterHue = 290; // Purple
        atmosphereHue = 270; // Purple
        break;
      case 'Volcanic':
        surfaceHue = 0; // Red
        waterHue = 20; // Orange-Red
        atmosphereHue = 10; // Red-Orange
        break;
      case 'Ocean':
        surfaceHue = 190; // Cyan
        waterHue = 200; // Cyan-Blue
        atmosphereHue = 195; // Cyan
        break;
      case 'Anomalous':
        surfaceHue = random() * 360; // Random
        waterHue = random() * 360; // Random
        atmosphereHue = random() * 360; // Random
        break;
      case 'Dead':
        surfaceHue = 0; // Grayscale
        waterHue = 0; // Grayscale
        atmosphereHue = 0; // Grayscale
        break;
    }
    
    // Generate other attributes
    const weatherTypes: Weather[] = ['Calm', 'Dusty', 'Rainy', 'Stormy', 'Extreme', 'Burning', 'Freezing', 'Toxic'];
    const temperatureTypes: Temperature[] = ['Freezing', 'Cold', 'Mild', 'Warm', 'Hot', 'Scorching'];
    const radiationTypes: Radiation[] = ['None', 'Low', 'Moderate', 'High', 'Extreme'];
    const toxicityTypes: Toxicity[] = ['None', 'Low', 'Moderate', 'High', 'Extreme'];
    const sentinelTypes: SentinelActivity[] = ['None', 'Limited', 'Normal', 'Aggressive', 'Frenzied'];
    
    // Weather based on type
    let weather: Weather = 'Calm';
    switch(type) {
      case 'Desert':
        weather = random() > 0.5 ? 'Dusty' : 'Burning';
        break;
      case 'Toxic':
        weather = random() > 0.5 ? 'Toxic' : 'Rainy';
        break;
      case 'Radioactive':
        weather = random() > 0.7 ? 'Extreme' : 'Stormy';
        break;
      case 'Frozen':
        weather = 'Freezing';
        break;
      case 'Volcanic':
        weather = 'Burning';
        break;
      case 'Ocean':
        weather = random() > 0.5 ? 'Rainy' : 'Stormy';
        break;
      default:
        weather = this.pickRandom(weatherTypes, random);
    }
    
    // Temperature based on type
    let temperature: Temperature = 'Mild';
    switch(type) {
      case 'Desert':
      case 'Volcanic':
        temperature = random() > 0.3 ? 'Scorching' : 'Hot';
        break;
      case 'Frozen':
        temperature = 'Freezing';
        break;
      case 'Lush':
      case 'Ocean':
        temperature = random() > 0.6 ? 'Warm' : 'Mild';
        break;
      default:
        temperature = this.pickRandom(temperatureTypes, random);
    }
    
    // Radiation based on type
    let radiation: Radiation = 'None';
    if (type === 'Radioactive') {
      radiation = random() > 0.5 ? 'Extreme' : 'High';
    } else {
      const radiationOptions = ['None', 'Low', 'Moderate', 'High', 'Extreme'];
      const radiationWeights = type === 'Exotic' || type === 'Anomalous' 
        ? [0.2, 0.2, 0.3, 0.2, 0.1] 
        : [0.6, 0.25, 0.1, 0.04, 0.01];
      
      let randValue = random();
      let cumulativeProb = 0;
      
      for (let i = 0; i < radiationOptions.length; i++) {
        cumulativeProb += radiationWeights[i];
        if (randValue <= cumulativeProb) {
          radiation = radiationOptions[i] as Radiation;
          break;
        }
      }
    }
    
    // Toxicity based on type
    let toxicity: Toxicity = 'None';
    if (type === 'Toxic') {
      toxicity = random() > 0.5 ? 'Extreme' : 'High';
    } else {
      const toxicityOptions = ['None', 'Low', 'Moderate', 'High', 'Extreme'];
      const toxicityWeights = type === 'Volcanic' || type === 'Exotic' 
        ? [0.2, 0.2, 0.3, 0.2, 0.1] 
        : [0.6, 0.25, 0.1, 0.04, 0.01];
      
      let randValue = random();
      let cumulativeProb = 0;
      
      for (let i = 0; i < toxicityOptions.length; i++) {
        cumulativeProb += toxicityWeights[i];
        if (randValue <= cumulativeProb) {
          toxicity = toxicityOptions[i] as Toxicity;
          break;
        }
      }
    }
    
    // Sentinel activity - more complex calculation
    let sentinelActivity: SentinelActivity;
    
    // Base probabilities for different activity levels
    const sentinelBaseProbabilities = {
      'None': 0.2,
      'Limited': 0.4,
      'Normal': 0.25,
      'Aggressive': 0.1,
      'Frenzied': 0.05
    };
    
    // Adjust based on planet type
    let sentinelTypeModifier = 1.0;
    
    if (['Lush', 'Exotic'].includes(type)) {
      // Higher activity on lush and exotic planets
      sentinelTypeModifier = 1.5;
    } else if (['Dead', 'Barren'].includes(type)) {
      // Lower activity on dead and barren planets
      sentinelTypeModifier = 0.5;
    }
    
    // Calculate weighted probabilities
    const adjustedProbabilities: Record<SentinelActivity, number> = {
      'None': sentinelBaseProbabilities['None'] / sentinelTypeModifier,
      'Limited': sentinelBaseProbabilities['Limited'],
      'Normal': sentinelBaseProbabilities['Normal'],
      'Aggressive': sentinelBaseProbabilities['Aggressive'] * sentinelTypeModifier,
      'Frenzied': sentinelBaseProbabilities['Frenzied'] * sentinelTypeModifier * 1.2
    };
    
    // Normalize probabilities
    const totalProbability = Object.values(adjustedProbabilities).reduce((sum, prob) => sum + prob, 0);
    const normalizedProbabilities: Record<SentinelActivity, number> = {} as Record<SentinelActivity, number>;
    
    for (const activity of Object.keys(adjustedProbabilities) as SentinelActivity[]) {
      normalizedProbabilities[activity] = adjustedProbabilities[activity] / totalProbability;
    }
    
    // Select sentinel activity
    const randValue = random();
    let cumulativeProb = 0;
    sentinelActivity = 'Normal'; // Default
    
    for (const activity of Object.keys(normalizedProbabilities) as SentinelActivity[]) {
      cumulativeProb += normalizedProbabilities[activity];
      if (randValue <= cumulativeProb) {
        sentinelActivity = activity;
        break;
      }
    }
    
    // Generate resource count based on planet type
    let resourceCount = 3 + Math.floor(random() * 5); // 3-7 resources
    
    if (['Lush', 'Exotic'].includes(type)) {
      resourceCount += 2; // More resources on lush and exotic planets
    } else if (['Dead', 'Barren'].includes(type)) {
      resourceCount -= 2; // Fewer resources on dead and barren planets
    }
    
    resourceCount = Math.max(1, resourceCount); // At least 1 resource
    
    // Generate appropriate amount of flora and fauna based on planet type
    let floraCount = 0;
    let faunaCount = 0;
    
    switch(type) {
      case 'Lush':
      case 'Tropical':
        floraCount = 5 + Math.floor(random() * 6); // 5-10
        faunaCount = 3 + Math.floor(random() * 6); // 3-8
        break;
      case 'Desert':
        floraCount = 1 + Math.floor(random() * 3); // 1-3
        faunaCount = 1 + Math.floor(random() * 4); // 1-4
        break;
      case 'Toxic':
        floraCount = 2 + Math.floor(random() * 4); // 2-5
        faunaCount = 1 + Math.floor(random() * 3); // 1-3
        break;
      case 'Radioactive':
        floraCount = 1 + Math.floor(random() * 3); // 1-3
        faunaCount = 1 + Math.floor(random() * 2); // 1-2
        break;
      case 'Frozen':
        floraCount = 1 + Math.floor(random() * 4); // 1-4
        faunaCount = 1 + Math.floor(random() * 3); // 1-3
        break;
      case 'Barren':
        floraCount = Math.floor(random() * 2); // 0-1
        faunaCount = Math.floor(random() * 2); // 0-1
        break;
      case 'Exotic':
        floraCount = 2 + Math.floor(random() * 5); // 2-6
        faunaCount = 1 + Math.floor(random() * 4); // 1-4
        break;
      case 'Volcanic':
        floraCount = Math.floor(random() * 2); // 0-1
        faunaCount = Math.floor(random() * 2); // 0-1
        break;
      case 'Ocean':
        floraCount = 2 + Math.floor(random() * 4); // 2-5
        faunaCount = 3 + Math.floor(random() * 5); // 3-7
        break;
      case 'Anomalous':
        floraCount = 1 + Math.floor(random() * 3); // 1-3
        faunaCount = 1 + Math.floor(random() * 3); // 1-3
        break;
      case 'Dead':
        floraCount = 0;
        faunaCount = 0;
        break;
    }
    
    // Surface color with variation based on biome
    let surfaceSaturation: [number, number] = [60, 85];
    let surfaceLightness: [number, number] = [30, 50];
    
    if (type === 'Dead' || type === 'Barren') {
      surfaceSaturation = [0, 20];
      surfaceLightness = [20, 40];
    } else if (type === 'Exotic' || type === 'Anomalous') {
      surfaceSaturation = [80, 100];
      surfaceLightness = [40, 60];
    }
    
    // Water color with variation based on biome
    let waterSaturation: [number, number] = [70, 90];
    let waterLightness: [number, number] = [40, 60];
    
    if (type === 'Toxic') {
      waterSaturation = [80, 100];
      waterLightness = [50, 70];
    } else if (type === 'Dead' || type === 'Barren') {
      waterSaturation = [0, 20];
      waterLightness = [30, 50];
    }
    
    // Atmosphere color with variation based on atmosphere type
    let atmosphereSaturation: [number, number] = [60, 80];
    let atmosphereLightness: [number, number] = [60, 80];
    
    if (atmosphere === 'None') {
      atmosphereSaturation = [0, 10];
      atmosphereLightness = [80, 95];
    } else if (atmosphere === 'Highly Toxic') {
      atmosphereSaturation = [80, 100];
      atmosphereLightness = [50, 70];
    }
    
    // Generate the final planet data
    return {
      id: `planet-${seed}`,
      name: this.generateName(seed),
      seed,
      type,
      biome,
      atmosphere,
      size: 1000 + random() * 9000, // 1000-10000 km
      resources: this.generateResources(type, seed, resourceCount),
      flora: this.generateFlora(biome, seed, floraCount),
      fauna: this.generateFauna(biome, seed + 1000, faunaCount),
      sentinels: sentinelActivity,
      weather,
      temperature,
      radiation,
      toxicity,
      color: {
        surface: this.generateColor(seed, surfaceHue, surfaceSaturation, surfaceLightness),
        water: this.generateColor(seed + 1, waterHue, waterSaturation, waterLightness),
        atmosphere: this.generateColor(seed + 2, atmosphereHue, atmosphereSaturation, atmosphereLightness),
      },
      discovered: false
    };
  }
  
  // Function to generate normalized noise values
  public static generateNoiseValues(seed: number, resolution: number): number[][] {
    const random = this.seededRandom(seed);
    const noise: number[][] = [];
    
    for (let i = 0; i < resolution; i++) {
      noise[i] = [];
      for (let j = 0; j < resolution; j++) {
        noise[i][j] = random();
      }
    }
    
    return noise;
  }
  
  // Function to create a 3D displacement map for a planet
  public static createDisplacementMap(seed: number, resolution: number = 64): Uint8Array {
    const data = new Uint8Array(resolution * resolution * 4);
    const noise = this.generateNoiseValues(seed, resolution);
    
    // Generate displacement map based on noise
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const index = (i * resolution + j) * 4;
        data[index] = Math.floor(noise[i][j] * 255); // R
        data[index + 1] = Math.floor(noise[i][j] * 255); // G
        data[index + 2] = Math.floor(noise[i][j] * 255); // B
        data[index + 3] = 255; // A
      }
    }
    
    return data;
  }
  
  // Function to generate a heightmap for terrain
  public static createHeightMap(seed: number, resolution: number = 128): number[][] {
    const noise1 = this.generateNoiseValues(seed, resolution);
    const noise2 = this.generateNoiseValues(seed + 1000, resolution);
    
    const heightmap: number[][] = [];
    
    for (let i = 0; i < resolution; i++) {
      heightmap[i] = [];
      for (let j = 0; j < resolution; j++) {
        // Combine multiple noise patterns at different frequencies
        let value = noise1[i][j];
        value += noise2[i][j] * 0.5;
        value /= 1.5; // Normalize to 0-1 range
        
        heightmap[i][j] = value;
      }
    }
    
    return heightmap;
  }
  
  // Function to generate star system data
  public static generateStarSystem(seed: number, index: number): {
    id: string;
    name: string;
    position: [number, number, number];
    starType: string;
    starColor: string;
    planets: number;
    discovered: boolean;
  } {
    const random = this.seededRandom(seed + index);
    
    const starTypes = [
      'Class O (Blue)', 'Class B (Blue-White)', 'Class A (White)', 
      'Class F (Yellow-White)', 'Class G (Yellow)', 'Class K (Orange)', 
      'Class M (Red)', 'Red Dwarf', 'Binary System', 'Black Hole', 
      'Neutron Star'
    ];
    
    const starColors: Record<string, string> = {
      'Class O (Blue)': '#9bb0ff',
      'Class B (Blue-White)': '#aabfff',
      'Class A (White)': '#cad7ff',
      'Class F (Yellow-White)': '#f8f7ff',
      'Class G (Yellow)': '#fff4ea',
      'Class K (Orange)': '#ffd2a1',
      'Class M (Red)': '#ffcc6f',
      'Red Dwarf': '#ff8f60',
      'Binary System': '#e8e8ff',
      'Black Hole': '#000000',
      'Neutron Star': '#efefff'
    };
    
    const starType = this.pickRandom(starTypes, random);
    const starColor = starColors[starType];
    
    // Generate position with distribution biased toward galactic center
    const theta = random() * Math.PI * 2; // Angular position
    const r = Math.pow(random(), 0.5) * 100; // Radial distance from center (higher concentration in center)
    const height = (random() * 2 - 1) * 10; // Vertical position with thinner distribution
    
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = height;
    
    return {
      id: `system-${seed}-${index}`,
      name: this.generateName(seed + index),
      position: [x, y, z],
      starType,
      starColor,
      planets: 1 + Math.floor(random() * 6), // 1-6 planets
      discovered: random() > 0.95 // 5% chance of being discovered
    };
  }
  
  // Function to generate a galaxy
  public static generateGalaxy(seed: number, systemCount: number): any[] {
    const systems = [];
    
    for (let i = 0; i < systemCount; i++) {
      systems.push(this.generateStarSystem(seed, i));
    }
    
    return systems;
  }
}
