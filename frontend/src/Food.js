class Food {
    constructor(itemData) {
        // itemData can be either a menu item object or individual parameters for backward compatibility
        if (typeof itemData === 'object' && itemData !== null) {
            this.name = itemData.name || '';
            this.calories = itemData.calories || 0;
            
            // Extract nutritional info from raw_attrs if available
            if (itemData.raw_attrs) {
                this.protein = this.parseNutritionValue(itemData.raw_attrs['data-protein']);
                this.carbs = this.parseNutritionValue(itemData.raw_attrs['data-total-carb']);
                this.fat = this.parseNutritionValue(itemData.raw_attrs['data-total-fat']);
            } else {
                // Fallback to direct properties if raw_attrs not available
                this.protein = itemData.protein || 0;
                this.carbs = itemData.carbs || 0;
                this.fat = itemData.fat || 0;
            }
            
            // Store additional properties
            this.allergens = itemData.allergens || '';
            this.ingredients = itemData.ingredients || '';
            this.servingSize = itemData.serving_size || '';
            this.healthfulness = itemData.healthfulness || '';
            this.cleanDiet = itemData.clean_diet || '';
            this.location = itemData.location || '';
            this.category = itemData.category || '';
            this.mealPeriod = itemData.mealPeriod || '';
        } else {
            // Backward compatibility: handle individual parameters
            this.name = arguments[0] || '';
            this.calories = arguments[1] || 0;
            this.protein = arguments[2] || 0;
            this.carbs = arguments[3] || 0;
            this.fat = arguments[4] || 0;
        }
    }

    // Parse nutrition values like "6.5g" to number (6.5)
    parseNutritionValue(value) {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            // Remove 'g' and parse as float
            const num = parseFloat(value.replace(/[^\d.-]/g, ''));
            return isNaN(num) ? 0 : num;
        }
        return 0;
    }

    getCalories() {
        return this.calories || 0;
    }

    getProtein() {
        return this.protein || 0;
    }

    getCarbs() {
        return this.carbs || 0;
    }

    getFat() {
        return this.fat || 0;
    }

    getName() {
        return this.name || '';
    }

    getAllergens() {
        return this.allergens || '';
    }

    getIngredients() {
        return this.ingredients || '';
    }

    getLocation() {
        return this.location || '';
    }

    getCategory() {
        return this.category || '';
    }
}

export default Food;