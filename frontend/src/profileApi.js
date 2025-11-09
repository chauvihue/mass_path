// Simple profile API service using fetch
const API_BASE = 'http://127.0.0.1:4000';

export const profileApi = {
  async calculateCalories(profileData) {
    const res = await fetch(`${API_BASE}/api/profile/calculate-calories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error('Failed to calculate calories');
    return res.json();
  },

  async getDailyCalories(userId) {
    const url = userId 
      ? `${API_BASE}/api/profile/calories?user_id=${encodeURIComponent(userId)}` 
      : `${API_BASE}/api/profile/calories`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch daily calories');
    const data = await res.json();
    return data.daily_calories;
  }
};
