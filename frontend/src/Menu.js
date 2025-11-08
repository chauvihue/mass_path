import Food from './Food';

class Menu {
    // fetch the menu from the server
    async fetchMenu(diningHall) {
        try {
            const response = await fetch(`http://127.0.0.1:4000/menu/${diningHall}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                return data.data;
            } else {
                console.error('Error fetching menu:', data.error || 'Unknown error');
                return null;
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
            return null;
        }
    }

    // Parse nested menu structure into a flat list of Food objects
    parseMenu(menuData, diningHall = '') {
        if (!menuData || !menuData.menu) {
            return [];
        }

        const foods = [];
        const menu = menuData.menu;

        // Iterate through meal periods (lunch, dinner, etc.)
        Object.keys(menu).forEach(mealPeriod => {
            const mealData = menu[mealPeriod];
            
            // Iterate through categories in each meal
            Object.keys(mealData).forEach(categoryName => {
                const categoryData = mealData[categoryName];
                
                // Handle both object format {title: "...", items: [...]} and array format
                let items = [];
                if (Array.isArray(categoryData)) {
                    items = categoryData;
                } else if (categoryData.items && Array.isArray(categoryData.items)) {
                    items = categoryData.items;
                } else if (typeof categoryData === 'object') {
                    // Try to find items in nested structure
                    Object.keys(categoryData).forEach(key => {
                        if (Array.isArray(categoryData[key])) {
                            items = items.concat(categoryData[key]);
                        }
                    });
                }

                // Create Food objects from items
                items.forEach(item => {
                    if (item && item.name) {
                        const foodItem = {
                            ...item,
                            location: diningHall,
                            category: categoryName,
                            mealPeriod: mealPeriod
                        };
                        foods.push(new Food(foodItem));
                    }
                });
            });
        });

        return foods;
    }

    // Get all menus from all dining halls
    async getAllMenus() {
        try {
            const response = await fetch('http://127.0.0.1:4000/menu/all');
            const data = await response.json();
            
            if (data.success && data.data) {
                const allFoods = [];
                Object.keys(data.data).forEach(diningHall => {
                    const hallData = data.data[diningHall];
                    const foods = this.parseMenu(hallData, diningHall);
                    allFoods.push(...foods);
                });
                return allFoods;
            } else {
                console.error('Error fetching all menus:', data.error || 'Unknown error');
                return [];
            }
        } catch (error) {
            console.error('Error fetching all menus:', error);
            return [];
        }
    }

    // get the menu for a specific dining hall
    async getMenu(diningHall) {
        const menuData = await this.fetchMenu(diningHall);
        if (!menuData) {
            return [];
        }
        return this.parseMenu(menuData, diningHall);
    }

    // Get menu items filtered by meal period
    async getMenuByMealPeriod(diningHall, mealPeriod) {
        const foods = await this.getMenu(diningHall);
        return foods.filter(food => food.mealPeriod === mealPeriod);
    }

    // Get menu items filtered by category
    async getMenuByCategory(diningHall, category) {
        const foods = await this.getMenu(diningHall);
        return foods.filter(food => food.category === category);
    }

    // Search menu items by name
    async searchMenu(diningHall, searchTerm) {
        const foods = await this.getMenu(diningHall);
        const term = searchTerm.toLowerCase();
        return foods.filter(food => 
            food.getName().toLowerCase().includes(term) ||
            (food.getIngredients() && food.getIngredients().toLowerCase().includes(term))
        );
    }
}

export default Menu;