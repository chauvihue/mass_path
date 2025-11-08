export interface Meal {
  id: string;
  userId: string;
  imageUrl: string;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  timestamp: Date;
  location?: string; // UMass dining location if applicable
  isUMassDining: boolean; // Flag for UMass-sourced data
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  confidence?: number; // AI confidence score
  umassDiningId?: string; // ID from UMass dining database
  allergens?: string[]; // Top 8 + corn & sesame
  ingredients?: string[];
  diningLocation?: string; // Worcester DC, Franklin DC, etc.
  isUMassDining?: boolean; // Flag for UMass-sourced data
}

export interface UMassDiningItem {
  id: string;
  name: string;
  location: string; // Dining hall name
  station: string; // e.g., "Grill", "International", "Pizza"
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  allergens: string[];
  ingredients: string[];
  dietaryPreferences: string[]; // vegetarian, vegan, gluten-free, etc.
  healthfulness?: string; // SPE Certified rating if available
}

export interface UserProfile {
  id: string;
  name: string;
  dailyCalorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fat: number;
  };
  dietaryRestrictions: string[];
  allergens: string[]; // User's allergen list
  favoriteDiningHall?: string;
}

export interface AnalysisResponse {
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  umassMatches?: UMassDiningItem[];
}

