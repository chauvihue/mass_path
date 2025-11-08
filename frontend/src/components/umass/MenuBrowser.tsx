import { useState, useEffect, FC } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../services/api';
import { UMassDiningItem } from '../../types';
import { MenuItemCard } from './MenuItemCard';
import { DiningHallSelector } from './DiningHallSelector';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';

interface MenuBrowserProps {
  onItemSelect?: (item: UMassDiningItem) => void;
  userAllergens?: string[];
}

export const MenuBrowser: FC<MenuBrowserProps> = ({
  onItemSelect,
  userAllergens,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [items, setItems] = useState<UMassDiningItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedLocation) {
      loadMenu(selectedLocation);
    }
  }, [selectedLocation]);

  const loadMenu = async (location: string) => {
    setLoading(true);
    try {
      const menuItems = await api.getDiningLocationMenu(location);
      setItems(menuItems);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await api.searchUMassDining(searchQuery);
      setItems(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.station.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse UMass Dining Menu</h2>
        
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DiningHallSelector
          selected={selectedLocation}
          onSelect={setSelectedLocation}
        />
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <div>
          {filteredItems.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Found {filteredItems.length} item(s)
              </p>
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAdd={onItemSelect ? () => onItemSelect(item) : undefined}
                  userAllergens={userAllergens}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {selectedLocation || searchQuery
                ? 'No items found. Try a different location or search term.'
                : 'Select a dining location or search for items to browse the menu.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

