import { useState, useEffect, FC } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useUser } from '../context/UserContext';
import { UserProfile } from '../types';
import { Save, Moon, Sun } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ALLERGENS = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree_nuts',
  'peanuts',
  'wheat',
  'soy',
  'gluten',
  'corn',
  'sesame',
];

const DINING_HALLS = [
  'Worcester Dining Commons',
  'Franklin Dining Commons',
  'Hampshire Dining Commons',
  'Berkshire Dining Commons',
];

export const Profile: FC = () => {
  const { profile, updateProfile } = useUser();
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    dailyCalorieTarget: 2000,
    macroTargets: {
      protein: 150,
      carbs: 200,
      fat: 65,
    },
    dietaryRestrictions: [],
    allergens: [],
    favoriteDiningHall: undefined,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    const current = formData.allergens || [];
    const updated = current.includes(allergen)
      ? current.filter(a => a !== allergen)
      : [...current, allergen];
    setFormData({ ...formData, allergens: updated });
  };

  if (!profile) {
    return (
      <Layout title="Profile">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile & Settings">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Calorie Target
              </label>
              <input
                type="number"
                value={formData.dailyCalorieTarget || 2000}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyCalorieTarget: parseInt(e.target.value) || 2000,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        {/* Macro Targets */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Macro Targets (grams)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protein
              </label>
              <input
                type="number"
                value={formData.macroTargets?.protein || 150}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macroTargets: {
                      ...formData.macroTargets!,
                      protein: parseInt(e.target.value) || 150,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carbs
              </label>
              <input
                type="number"
                value={formData.macroTargets?.carbs || 200}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macroTargets: {
                      ...formData.macroTargets!,
                      carbs: parseInt(e.target.value) || 200,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fat
              </label>
              <input
                type="number"
                value={formData.macroTargets?.fat || 65}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    macroTargets: {
                      ...formData.macroTargets!,
                      fat: parseInt(e.target.value) || 65,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        {/* Allergens */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Allergens to Avoid</h2>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergen(allergen)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.allergens?.includes(allergen)
                    ? 'bg-red-100 text-red-800 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {allergen.charAt(0).toUpperCase() + allergen.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </Card>

        {/* Favorite Dining Hall */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Favorite Dining Hall</h2>
          <select
            value={formData.favoriteDiningHall || ''}
            onChange={(e) =>
              setFormData({ ...formData, favoriteDiningHall: e.target.value || undefined })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">None</option>
            {DINING_HALLS.map((hall) => (
              <option key={hall} value={hall}>
                {hall}
              </option>
            ))}
          </select>
        </Card>

        {/* Theme Toggle */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Theme</h2>
              <p className="text-sm text-gray-600">Toggle dark mode</p>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-600" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          type="submit"
          size="lg"
          loading={saving}
          className="w-full flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Changes
        </Button>
      </form>
    </Layout>
  );
};

