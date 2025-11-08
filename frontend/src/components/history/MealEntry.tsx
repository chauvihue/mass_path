import { useState, FC } from 'react';
import { Card } from '../common/Card';
import { Meal } from '../../types';
import { Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { CalorieDisplay } from '../nutrition/CalorieDisplay';

interface MealEntryProps {
  meal: Meal;
  onDelete: (id: string) => void;
}

export const MealEntry: FC<MealEntryProps> = ({ meal, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(meal.timestamp);
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card className="mb-3">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {meal.imageUrl ? (
            <img
              src={meal.imageUrl}
              alt="Meal"
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {meal.foodItems.map(item => item.name).join(', ') || 'Meal'}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{timeString}</span>
                {meal.location && (
                  <>
                    <span>•</span>
                    <span>{meal.location}</span>
                  </>
                )}
              </div>
              {meal.isUMassDining && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-umass-maroon text-white text-xs rounded-full">
                  UMass Dining
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <CalorieDisplay calories={meal.totalCalories} size="sm" />
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(meal.id)}
                className="p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                {expanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Protein</div>
                  <div className="text-sm font-medium">{Math.round(meal.totalProtein)}g</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Carbs</div>
                  <div className="text-sm font-medium">{Math.round(meal.totalCarbs)}g</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Fat</div>
                  <div className="text-sm font-medium">{Math.round(meal.totalFat)}g</div>
                </div>
              </div>

              {meal.foodItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Food Items</h4>
                  <ul className="space-y-1">
                    {meal.foodItems.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        • {item.name} ({Math.round(item.calories)} cal)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

