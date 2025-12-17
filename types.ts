
export interface GardenPreferences {
  style: string;
  size: string;
  climate: string;
  features: string[];
  budget: string;
  colors: string;
}

export interface PlantSuggestion {
  name: string;
  description: string;
  reason: string;
}

export interface GardenLayout {
  title: string;
  description: string;
  zoning: {
    zone: string;
    description: string;
  }[];
  suggestedPlants: PlantSuggestion[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}
