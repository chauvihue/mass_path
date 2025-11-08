import { FC } from 'react';

const ALLERGEN_COLORS: Record<string, string> = {
  milk: 'bg-blue-100 text-blue-800',
  eggs: 'bg-yellow-100 text-yellow-800',
  fish: 'bg-cyan-100 text-cyan-800',
  shellfish: 'bg-orange-100 text-orange-800',
  tree_nuts: 'bg-amber-100 text-amber-800',
  peanuts: 'bg-amber-100 text-amber-800',
  wheat: 'bg-amber-100 text-amber-800',
  soy: 'bg-green-100 text-green-800',
  gluten: 'bg-amber-100 text-amber-800',
  corn: 'bg-yellow-100 text-yellow-800',
  sesame: 'bg-orange-100 text-orange-800',
};

export const AllergenBadge: FC<{ allergen: string }> = ({ allergen }) => {
  const colorClass = ALLERGEN_COLORS[allergen.toLowerCase()] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {allergen.charAt(0).toUpperCase() + allergen.slice(1).replace('_', ' ')}
    </span>
  );
};

