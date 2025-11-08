import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export const Header: FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <UtensilsCrossed className="w-6 h-6" />
            <span className="font-bold text-xl">MassPath</span>
          </button>
          {title && (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </div>
    </header>
  );
};

