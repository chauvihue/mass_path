import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { CalorieDisplay } from '../components/nutrition/CalorieDisplay';
import { useUser } from '../context/UserContext';
import { Camera, TrendingUp, Clock } from 'lucide-react';
import { MealEntry } from '../components/history/MealEntry';

export const Home: FC = () => {
  const navigate = useNavigate();
  const { profile, meals, getTodayCalories, deleteMeal } = useUser();

  const todayCalories = getTodayCalories();
  const targetCalories = profile?.dailyCalorieTarget || 2000;
  const recentMeals = meals
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}!
          </h1>
          <p className="text-gray-600">Track your meals and reach your goals</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-sm text-gray-600 mb-1">Today's Calories</div>
            <CalorieDisplay calories={todayCalories} target={targetCalories} size="lg" />
            <div className="mt-4">
              <ProgressBar
                current={todayCalories}
                target={targetCalories}
                color="primary"
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Macros Today</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Protein</span>
                <span className="font-medium">
                  {Math.round(
                    recentMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
                  )}g
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Carbs</span>
                <span className="font-medium">
                  {Math.round(
                    recentMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
                  )}g
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fat</span>
                <span className="font-medium">
                  {Math.round(
                    recentMeals.reduce((sum, meal) => sum + meal.totalFat, 0)
                  )}g
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Meals Today</span>
            </div>
            <div className="text-4xl font-bold text-primary-600">
              {recentMeals.filter(meal => {
                const mealDate = new Date(meal.timestamp);
                const today = new Date();
                return (
                  mealDate.getDate() === today.getDate() &&
                  mealDate.getMonth() === today.getMonth() &&
                  mealDate.getFullYear() === today.getFullYear()
                );
              }).length}
            </div>
          </Card>
        </div>

        {/* Quick Action */}
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Log a New Meal</h2>
              <p className="text-primary-100">
                Snap a photo of your meal to get instant nutrition analysis
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/camera')}
              className="flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>
          </div>
        </Card>

        {/* Recent Meals */}
        {recentMeals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Meals</h2>
            <div className="space-y-3">
              {recentMeals.map(meal => (
                <MealEntry key={meal.id} meal={meal} onDelete={deleteMeal} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

