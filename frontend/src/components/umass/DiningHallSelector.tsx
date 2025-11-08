import { FC } from 'react';
import { Button } from '../common/Button';

const DINING_HALLS = [
  'Worcester Dining Commons',
  'Franklin Dining Commons',
  'Hampshire Dining Commons',
  'Berkshire Dining Commons',
];

interface DiningHallSelectorProps {
  selected: string | null;
  onSelect: (hall: string) => void;
}

export const DiningHallSelector: FC<DiningHallSelectorProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {DINING_HALLS.map((hall) => (
        <Button
          key={hall}
          variant={selected === hall ? 'primary' : 'outline'}
          onClick={() => onSelect(hall)}
          className="text-sm"
        >
          {hall.replace(' Dining Commons', '')}
        </Button>
      ))}
    </div>
  );
};

