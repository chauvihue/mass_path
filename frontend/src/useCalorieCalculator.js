import { useState, useEffect } from 'react';
import { profileApi } from './profileApi';

const STORAGE_PROFILE = 'mp_user_profile';
const STORAGE_CALORIES = 'mp_daily_calories';

export default function useCalorieCalculator(userId) {
  const DEFAULT_CALORIES = 2200;

  const [profileData, setProfileData] = useState(null);
  const [dailyCalories, setDailyCalories] = useState(DEFAULT_CALORIES);
  
  // Load saved data on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_PROFILE);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileData(parsed);
      }

      const savedCalories = localStorage.getItem(STORAGE_CALORIES);
      if (savedCalories) {
        const parsed = parseInt(savedCalories, 10);
        if (!isNaN(parsed)) {
          setDailyCalories(parsed);
        }
      }
    } catch (e) {
      console.warn('Error loading saved data:', e);
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Update with new calories immediately when they change
    if (dailyCalories) {
      localStorage.setItem(STORAGE_CALORIES, String(dailyCalories));
    }
  }, [dailyCalories]);

  useEffect(() => {
    // Try to load from backend if userId present
    let mounted = true;
    async function load() {
      if (!userId) return;
      try {
        setLoading(true);
        const cal = await profileApi.getDailyCalories(userId);
        if (!mounted) return;
        setDailyCalories(cal);
        localStorage.setItem(STORAGE_CALORIES, String(cal));
      } catch (e) {
        console.warn('Could not load calories from backend:', e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [userId]);

  const saveProfile = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...data };
      if (userId) payload.user_id = userId;
      const res = await profileApi.calculateCalories(payload);
      const cal = res.daily_calories;
      setProfileData(data);
      setDailyCalories(cal);
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(data));
      localStorage.setItem(STORAGE_CALORIES, String(cal));
      return res;
    } catch (e) {
      setError(e.message || 'Failed to save profile');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { profileData, dailyCalories, loading, error, saveProfile };
}
