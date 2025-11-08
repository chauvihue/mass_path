import { FC } from 'react';
import { Card } from '../common/Card';
import { CalorieDisplay } from './CalorieDisplay';
import { MacroBreakdown } from './MacroBreakdown';
import { AllergenDisplay } from './AllergenDisplay';
import { FoodItem } from '../../types';
import { Award } from 'lucide-react';

interface NutritionCardProps {
  foodItem: FoodItem;
  userAllergens?: string[];
  macroTargets?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const NutritionCard: FC<NutritionCardProps> = ({
  foodItem,
  userAllergens,
  macroTargets,
}) => {
  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{foodItem.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{foodItem.servingSize}</p>
        </div>
        {foodItem.isUMassDining && (
          <div className="flex items-center gap-1 bg-umass-maroon text-white px-3 py-1 rounded-full text-xs font-medium">
            <Award className="w-3 h-3" />
            UMass Dining
          </div>
        )}
      </div>

      {foodItem.diningLocation && (
        <div className="mb-3 text-sm text-gray-600">
          📍 {foodItem.diningLocation}
        </div>
      )}

      <div className="mb-4">
        <CalorieDisplay calories={foodItem.calories} size="md" />
      </div>

      <div className="mb-4">
        <MacroBreakdown
          protein={foodItem.protein}
          carbs={foodItem.carbs}
          fat={foodItem.fat}
          targets={macroTargets}
        />
      </div>

      {foodItem.allergens && foodItem.allergens.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Allergens</h4>
          <AllergenDisplay allergens={foodItem.allergens} userAllergens={userAllergens} />
        </div>
      )}

      {foodItem.ingredients && foodItem.ingredients.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients</h4>
          <p className="text-sm text-gray-600">{foodItem.ingredients.join(', ')}</p>
        </div>
      )}
    </Card>
  );
};

