import { FC } from 'react';
import { AllergenBadge } from '../common/AllergenBadge';
import { AlertTriangle } from 'lucide-react';

interface AllergenDisplayProps {
  allergens: string[];
  userAllergens?: string[];
}

export const AllergenDisplay: FC<AllergenDisplayProps> = ({
  allergens,
  userAllergens = [],
}) => {
  const hasUserAllergen = allergens.some(allergen =>
    userAllergens.some(userAllergen =>
      allergen.toLowerCase().includes(userAllergen.toLowerCase()) ||
      userAllergen.toLowerCase().includes(allergen.toLowerCase())
    )
  );

  if (allergens.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No allergens listed
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasUserAllergen && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Contains your allergens!</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen, index) => (
          <AllergenBadge key={index} allergen={allergen} />
        ))}
      </div>
    </div>
  );
};

