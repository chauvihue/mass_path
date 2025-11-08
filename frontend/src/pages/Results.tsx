import { useState, useEffect, FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { NutritionCard } from '../components/nutrition/NutritionCard';
import { CalorieDisplay } from '../components/nutrition/CalorieDisplay';
import { MacroBreakdown } from '../components/nutrition/MacroBreakdown';
import { useUser } from '../context/UserContext';
import { AnalysisResponse, FoodItem } from '../types';
import { Save, RotateCcw, Search, Award } from 'lucide-react';

export const Results: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, addMeal } = useUser();
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (location.state) {
      setImageSrc(location.state.imageSrc);
      setAnalysis(location.state.analysis);
    } else {
      // If no state, redirect to camera
      navigate('/camera');
    }
  }, [location, navigate]);

  const handleSave = async () => {
    if (!analysis || !imageSrc) return;

    setSaving(true);
    try {
      await addMeal({
        imageUrl: imageSrc,
        foodItems: analysis.foodItems.map(item => ({
          ...item,
          isUMassDining: !!item.umassDiningId,
        })),
        totalCalories: analysis.totalCalories,
        totalProtein: analysis.totalProtein,
        totalCarbs: analysis.totalCarbs,
        totalFat: analysis.totalFat,
        timestamp: new Date(),
        isUMassDining: !!(analysis.umassMatches && analysis.umassMatches.length > 0),
        location: analysis.umassMatches?.[0]?.location,
      });
      
      navigate('/history');
    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!analysis) {
    return (
      <Layout title="Results">
        <div className="text-center py-12">
          <p className="text-gray-500">No analysis data found.</p>
          <Button onClick={() => navigate('/camera')} className="mt-4">
            Take New Photo
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analysis Results">
      <div className="space-y-6">
        {/* Image Preview */}
        {imageSrc && (
          <Card>
            <img
              src={imageSrc}
              alt="Analyzed meal"
              className="w-full h-auto rounded-lg"
            />
          </Card>
        )}

        {/* UMass Dining Badge */}
        {analysis.umassMatches && analysis.umassMatches.length > 0 && (
          <Card className="bg-umass-maroon text-white">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <h3 className="font-bold">UMass Dining Match Found!</h3>
                <p className="text-sm text-umass-gold">
                  {analysis.umassMatches[0].location}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Total Calories */}
        <Card>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Total Nutrition</h2>
            <CalorieDisplay
              calories={analysis.totalCalories}
              target={profile?.dailyCalorieTarget}
              size="lg"
            />
            <div className="mt-6">
              <MacroBreakdown
                protein={analysis.totalProtein}
                carbs={analysis.totalCarbs}
                fat={analysis.totalFat}
                targets={profile?.macroTargets}
              />
            </div>
          </div>
        </Card>

        {/* Individual Food Items */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detected Items</h2>
          {analysis.foodItems.map((item, index) => (
            <NutritionCard
              key={index}
              foodItem={{
                ...item,
                isUMassDining: !!item.umassDiningId,
              }}
              userAllergens={profile?.allergens}
              macroTargets={profile?.macroTargets}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/camera')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Photo
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/menu')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Search Menu
          </Button>
          
          <Button
            size="lg"
            onClick={handleSave}
            loading={saving}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save to Log
          </Button>
        </div>
      </div>
    </Layout>
  );
};

