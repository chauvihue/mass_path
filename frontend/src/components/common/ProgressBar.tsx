import { FC } from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
  showNumbers?: boolean;
  color?: 'primary' | 'green' | 'blue' | 'purple';
}

export const ProgressBar: FC<ProgressBarProps> = ({
  current,
  target,
  label,
  showNumbers = true,
  color = 'primary',
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  const colors = {
    primary: 'bg-primary-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showNumbers && (
            <span className="text-sm text-gray-600">
              {Math.round(current)} / {target}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${colors[color]} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showNumbers && !label && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">{Math.round(current)}</span>
          <span className="text-xs text-gray-500">{target}</span>
        </div>
      )}
    </div>
  );
};

