import { FC } from 'react';
import { Meal } from '../../types';
import { MealEntry } from './MealEntry';

interface MealListProps {
  meals: Meal[];
  onDelete: (id: string) => void;
}

export const MealList: FC<MealListProps> = ({ meals, onDelete }) => {
  if (meals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No meals logged yet.</p>
        <p className="text-sm mt-2">Start by taking a photo of your meal!</p>
      </div>
    );
  }

  return (
    <div>
      {meals.map((meal) => (
        <MealEntry key={meal.id} meal={meal} onDelete={onDelete} />
      ))}
    </div>
  );
};

