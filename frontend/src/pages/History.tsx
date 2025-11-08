import { useState, FC } from 'react';
import { Layout } from '../components/layout/Layout';
import { MealList } from '../components/history/MealList';
import { CalendarView } from '../components/history/CalendarView';
import { Button } from '../components/common/Button';
import { useUser } from '../context/UserContext';
import { List, Calendar, Download } from 'lucide-react';

type ViewMode = 'list' | 'calendar';

export const History: FC = () => {
  const { meals, deleteMeal } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const handleExport = () => {
    const dataStr = JSON.stringify(meals, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meals-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Meal History">
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </Button>
          </div>

          {meals.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <MealList meals={meals} onDelete={deleteMeal} />
        ) : (
          <CalendarView meals={meals} onDelete={deleteMeal} />
        )}
      </div>
    </Layout>
  );
};

