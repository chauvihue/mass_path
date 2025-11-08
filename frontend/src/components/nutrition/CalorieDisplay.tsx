import { FC } from 'react';

interface CalorieDisplayProps {
  calories: number;
  target?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const CalorieDisplay: FC<CalorieDisplayProps> = ({
  calories,
  target,
  size = 'md',
}) => {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className="text-center">
      <div className={`font-bold text-primary-600 ${sizes[size]}`}>
        {Math.round(calories)}
      </div>
      <div className="text-sm text-gray-600 mt-1">calories</div>
      {target && (
        <div className="text-xs text-gray-500 mt-1">
          {Math.round((calories / target) * 100)}% of daily goal
        </div>
      )}
    </div>
  );
};

