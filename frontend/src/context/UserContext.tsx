import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { UserProfile, Meal } from '../types';
import { api } from '../services/api';

interface UserContextType {
  profile: UserProfile | null;
  meals: Meal[];
  loading: boolean;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addMeal: (meal: Omit<Meal, 'id' | 'userId'>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  refreshMeals: () => Promise<void>;
  getTodayCalories: () => number;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, mealsData] = await Promise.all([
        api.getUserProfile(),
        api.getMeals(),
      ]);
      setProfile(profileData);
      setMeals(mealsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await api.updateUserProfile(updates);
    setProfile(updated);
  };

  const addMeal = async (meal: Omit<Meal, 'id' | 'userId'>) => {
    const newMeal = await api.saveMeal(meal);
    setMeals([...meals, newMeal]);
  };

  const deleteMeal = async (id: string) => {
    await api.deleteMeal(id);
    setMeals(meals.filter(m => m.id !== id));
  };

  const refreshMeals = async () => {
    const mealsData = await api.getMeals();
    setMeals(mealsData);
  };

  const getTodayCalories = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return meals
      .filter(meal => {
        const mealDate = new Date(meal.timestamp);
        mealDate.setHours(0, 0, 0, 0);
        return mealDate.getTime() === today.getTime();
      })
      .reduce((sum, meal) => sum + meal.totalCalories, 0);
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        meals,
        loading,
        updateProfile,
        addMeal,
        deleteMeal,
        refreshMeals,
        getTodayCalories,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

