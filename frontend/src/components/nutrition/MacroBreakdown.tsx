import { FC } from 'react';
import { ProgressBar } from '../common/ProgressBar';

interface MacroBreakdownProps {
  protein: number;
  carbs: number;
  fat: number;
  targets?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const MacroBreakdown: FC<MacroBreakdownProps> = ({
  protein,
  carbs,
  fat,
  targets,
}) => {
  const totalCalories = protein * 4 + carbs * 4 + fat * 9;
  const proteinPercent = totalCalories > 0 ? (protein * 4 / totalCalories) * 100 : 0;
  const carbsPercent = totalCalories > 0 ? (carbs * 4 / totalCalories) * 100 : 0;
  const fatPercent = totalCalories > 0 ? (fat * 9 / totalCalories) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Protein</span>
          <span className="text-sm text-gray-600">
            {Math.round(protein)}g {targets && `(${Math.round((protein / targets.protein) * 100)}%)`}
          </span>
        </div>
        {targets ? (
          <ProgressBar current={protein} target={targets.protein} color="blue" showNumbers={false} />
        ) : (
          <div className="text-xs text-gray-500">{Math.round(proteinPercent)}% of calories</div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Carbs</span>
          <span className="text-sm text-gray-600">
            {Math.round(carbs)}g {targets && `(${Math.round((carbs / targets.carbs) * 100)}%)`}
          </span>
        </div>
        {targets ? (
          <ProgressBar current={carbs} target={targets.carbs} color="green" showNumbers={false} />
        ) : (
          <div className="text-xs text-gray-500">{Math.round(carbsPercent)}% of calories</div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Fat</span>
          <span className="text-sm text-gray-600">
            {Math.round(fat)}g {targets && `(${Math.round((fat / targets.fat) * 100)}%)`}
          </span>
        </div>
        {targets ? (
          <ProgressBar current={fat} target={targets.fat} color="purple" showNumbers={false} />
        ) : (
          <div className="text-xs text-gray-500">{Math.round(fatPercent)}% of calories</div>
        )}
      </div>
    </div>
  );
};

