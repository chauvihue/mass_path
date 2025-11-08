import { FC } from 'react';
import { Card } from '../common/Card';
import { MapPin } from 'lucide-react';

interface DiningLocationCardProps {
  location: string;
  itemCount?: number;
  onClick?: () => void;
}

export const DiningLocationCard: FC<DiningLocationCardProps> = ({
  location,
  itemCount,
  onClick,
}) => {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 p-3 rounded-lg">
            <MapPin className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{location}</h3>
            {itemCount !== undefined && (
              <p className="text-sm text-gray-500">{itemCount} items available</p>
            )}
          </div>
        </div>
        <div className="text-primary-600">
          →
        </div>
      </div>
    </Card>
  );
};

