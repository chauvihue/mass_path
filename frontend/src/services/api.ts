import { AnalysisResponse, Meal, UMassDiningItem, UserProfile } from '../types';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Mock data for development
const mockUMassItems: UMassDiningItem[] = [
  {
    id: '1',
    name: 'Grilled Chicken Breast',
    location: 'Worcester Dining Commons',
    station: 'Grill',
    servingSize: '1 piece (150g)',
    calories: 231,
    protein: 43,
    carbs: 0,
    fat: 5,
    fiber: 0,
    sugar: 0,
    sodium: 78,
    allergens: [],
    ingredients: ['Chicken Breast', 'Salt', 'Pepper'],
    dietaryPreferences: ['gluten-free'],
  },
  {
    id: '2',
    name: 'Pasta with Marinara Sauce',
    location: 'Franklin Dining Commons',
    station: 'International',
    servingSize: '1 cup (250g)',
    calories: 220,
    protein: 8,
    carbs: 43,
    fat: 2,
    fiber: 3,
    sugar: 6,
    sodium: 480,
    allergens: ['wheat', 'gluten'],
    ingredients: ['Pasta', 'Tomato Sauce', 'Garlic', 'Basil'],
    dietaryPreferences: ['vegetarian'],
  },
  {
    id: '3',
    name: 'Caesar Salad',
    location: 'Hampshire Dining Commons',
    station: 'Salad Bar',
    servingSize: '1 bowl (200g)',
    calories: 180,
    protein: 6,
    carbs: 8,
    fat: 14,
    fiber: 2,
    sugar: 3,
    sodium: 320,
    allergens: ['milk', 'eggs', 'fish'],
    ingredients: ['Romaine Lettuce', 'Caesar Dressing', 'Parmesan', 'Croutons'],
    dietaryPreferences: [],
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Analyze food image
  analyzeImage: async (imageFile: File): Promise<AnalysisResponse> => {
    await delay(1500); // Simulate processing time
    
    // Mock analysis - in real app, this would call the backend
    const mockResponse: AnalysisResponse = {
      foodItems: [
        {
          name: 'Grilled Chicken Breast',
          calories: 231,
          protein: 43,
          carbs: 0,
          fat: 5,
          servingSize: '1 piece (150g)',
          confidence: 0.92,
          umassDiningId: '1',
          diningLocation: 'Worcester Dining Commons',
          allergens: [],
        },
        {
          name: 'Steamed Broccoli',
          calories: 55,
          protein: 4,
          carbs: 11,
          fat: 0,
          servingSize: '1 cup (150g)',
          confidence: 0.88,
        },
      ],
      totalCalories: 286,
      totalProtein: 47,
      totalCarbs: 11,
      totalFat: 5,
      umassMatches: [mockUMassItems[0]],
    };
    
    return mockResponse;
  },

  // Search UMass Dining database
  searchUMassDining: async (query: string): Promise<UMassDiningItem[]> => {
    await delay(500);
    const lowerQuery = query.toLowerCase();
    return mockUMassItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.location.toLowerCase().includes(lowerQuery)
    );
  },

  // Get menu for a specific location
  getDiningLocationMenu: async (location: string): Promise<UMassDiningItem[]> => {
    await delay(500);
    return mockUMassItems.filter(item => item.location === location);
  },

  // Get all dining locations
  getDiningLocations: async (): Promise<string[]> => {
    await delay(300);
    return [
      'Worcester Dining Commons',
      'Franklin Dining Commons',
      'Hampshire Dining Commons',
      'Berkshire Dining Commons',
    ];
  },

  // Get detailed item info
  getDiningItem: async (id: string): Promise<UMassDiningItem | null> => {
    await delay(300);
    return mockUMassItems.find(item => item.id === id) || null;
  },

  // Meal operations
  getMeals: async (): Promise<Meal[]> => {
    await delay(300);
    const stored = localStorage.getItem('meals');
    return stored ? JSON.parse(stored) : [];
  },

  saveMeal: async (meal: Omit<Meal, 'id' | 'userId'>): Promise<Meal> => {
    await delay(300);
    const meals = await api.getMeals();
    const newMeal: Meal = {
      ...meal,
      id: Date.now().toString(),
      userId: 'user1',
      timestamp: new Date(),
    };
    meals.push(newMeal);
    localStorage.setItem('meals', JSON.stringify(meals));
    return newMeal;
  },

  deleteMeal: async (id: string): Promise<void> => {
    await delay(300);
    const meals = await api.getMeals();
    const filtered = meals.filter(m => m.id !== id);
    localStorage.setItem('meals', JSON.stringify(filtered));
  },

  // User profile operations
  getUserProfile: async (): Promise<UserProfile> => {
    await delay(300);
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      return JSON.parse(stored);
    }
    // Default profile
    const defaultProfile: UserProfile = {
      id: 'user1',
      name: 'User',
      dailyCalorieTarget: 2000,
      macroTargets: {
        protein: 150,
        carbs: 200,
        fat: 65,
      },
      dietaryRestrictions: [],
      allergens: [],
    };
    localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
    return defaultProfile;
  },

  updateUserProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    await delay(300);
    const current = await api.getUserProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem('userProfile', JSON.stringify(updated));
    return updated;
  },
};

