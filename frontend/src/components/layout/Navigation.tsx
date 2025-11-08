import { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Camera, History, User, Utensils } from 'lucide-react';

export const Navigation: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/camera', icon: Camera, label: 'Camera' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/menu', icon: Utensils, label: 'Menu' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

