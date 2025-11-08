import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { MenuBrowser as MenuBrowserComponent } from '../components/umass/MenuBrowser';
import { useUser } from '../context/UserContext';
import { UMassDiningItem, FoodItem } from '../types';

export const MenuBrowserPage: FC = () => {
  const navigate = useNavigate();
  const { profile, addMeal } = useUser();

  const handleItemSelect = async (item: UMassDiningItem) => {
    // Convert UMass dining item to food item format
    const foodItem: FoodItem = {
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      servingSize: item.servingSize,
      umassDiningId: item.id,
      allergens: item.allergens,
      ingredients: item.ingredients,
      diningLocation: item.location,
    };

    // Create a meal from the selected item
    await addMeal({
      imageUrl: '', // No image for manual selection
      foodItems: [foodItem],
      totalCalories: item.calories,
      totalProtein: item.protein,
      totalCarbs: item.carbs,
      totalFat: item.fat,
      timestamp: new Date(),
      isUMassDining: true,
      location: item.location,
    });

    // Show success message and navigate
    alert(`${item.name} added to your meal log!`);
    navigate('/history');
  };

  return (
    <Layout title="UMass Dining Menu">
      <MenuBrowserComponent
        onItemSelect={handleItemSelect}
        userAllergens={profile?.allergens}
      />
    </Layout>
  );
};

