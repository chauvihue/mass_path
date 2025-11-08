import { useState, FC } from 'react';
import { Meal } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MealEntry } from './MealEntry';

interface CalendarViewProps {
  meals: Meal[];
  onDelete: (id: string) => void;
}

export const CalendarView: FC<CalendarViewProps> = ({ meals, onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return meals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate.toDateString() === dateStr;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedMeals = selectedDate ? getMealsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayMeals = getMealsForDate(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-transparent hover:bg-gray-50'
                } ${isToday ? 'ring-2 ring-primary-300' : ''}`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={`text-sm ${isSelected ? 'font-bold text-primary-600' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {dayMeals.length > 0 && (
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-1" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Meals on {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          {selectedMeals.length > 0 ? (
            <div>
              {selectedMeals.map(meal => (
                <MealEntry key={meal.id} meal={meal} onDelete={onDelete} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No meals logged for this date.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

