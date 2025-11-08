import { FC } from 'react';
import { Card } from '../common/Card';
import { AllergenDisplay } from '../nutrition/AllergenDisplay';
import { UMassDiningItem } from '../../types';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button';

interface MenuItemCardProps {
  item: UMassDiningItem;
  onAdd?: () => void;
  userAllergens?: string[];
}

export const MenuItemCard: FC<MenuItemCardProps> = ({
  item,
  onAdd,
  userAllergens,
}) => {
  return (
    <Card className="mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{item.station} • {item.location}</p>
          <p className="text-xs text-gray-400 mt-1">{item.servingSize}</p>
        </div>
        {onAdd && (
          <Button
            size="sm"
            onClick={onAdd}
            className="ml-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-2 text-sm">
        <span className="font-medium text-primary-600">{item.calories} cal</span>
        <span className="text-gray-600">P: {item.protein}g</span>
        <span className="text-gray-600">C: {item.carbs}g</span>
        <span className="text-gray-600">F: {item.fat}g</span>
      </div>

      {item.dietaryPreferences && item.dietaryPreferences.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-1">
            {item.dietaryPreferences.map((pref, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
              >
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.allergens && item.allergens.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-1">Allergens</h4>
          <AllergenDisplay allergens={item.allergens} userAllergens={userAllergens} />
        </div>
      )}
    </Card>
  );
};

