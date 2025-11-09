"""
RL Recommender System
---------------------
Contextual multi-armed bandit for personalized meal recommendations.
Uses Random Forest regression to predict meal satisfaction based on user context.
"""

import numpy as np
import json
import os
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

import pickle

try:
    from sklearn.ensemble import RandomForestRegressor
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not available. Using simple heuristic fallback.")
else:
    # Additional utilities for validating fitted estimators
    try:
        from sklearn.utils.validation import check_is_fitted
        from sklearn.exceptions import NotFittedError
    except Exception:
        # If these are not available for some reason, provide fallbacks
        def check_is_fitted(estimator, attributes=None):
            # naive fallback: check common fitted attribute
            if not hasattr(estimator, 'estimators_'):
                raise NotFittedError("Estimator is not fitted yet")
        class NotFittedError(Exception):
            pass


class MealRecommenderBandit:
    """
    Contextual bandit for meal recommendations.
    Uses epsilon-greedy exploration with regression model.
    """
    
    def __init__(self, user_id: str, epsilon: float = 0.15, learning_rate: float = 0.01):
        self.user_id = user_id
        self.epsilon = epsilon  # exploration rate
        self.epsilon_min = 0.05
        self.epsilon_decay = 0.995
        self.learning_rate = learning_rate
        
        if SKLEARN_AVAILABLE:
            self.model = RandomForestRegressor(
                n_estimators=50,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
        else:
            self.model = None
        
        self.meal_history = []  # List of (context_features, reward) tuples
        self.is_trained = False
        self.preferences = {
            'favorite_cuisines': [],
            'favorite_stations': [],
            'favorite_dining_halls': [],
            'typical_meal_calories': 500,
            'protein_preference': 0.2,
            'meals_logged': 0
        }
    
    def get_context_features(self, state: Dict, meal: Dict) -> np.ndarray:
        """
        Convert state and meal into feature vector for the model.
        """
        # Time features
        time_of_day_map = {'breakfast': 0, 'lunch': 1, 'dinner': 2, 'midnight': 3}
        time_encoded = time_of_day_map.get(state.get('time_of_day', 'lunch'), 1)
        day_of_week = state.get('day_of_week', 0)  # 0-6
        
        # User state (normalized)
        calories_today = state.get('calories_today', 0)
        calorie_budget = state.get('calorie_budget', 2200)
        calorie_budget_remaining = max(0, calorie_budget - calories_today) / calorie_budget
        
        macros_today = state.get('macros_today', {})
        protein_remaining = max(0, state.get('protein_goal', 100) - macros_today.get('protein', 0)) / 100
        carbs_remaining = max(0, state.get('carbs_goal', 200) - macros_today.get('carbs', 0)) / 200
        fat_remaining = max(0, state.get('fat_goal', 70) - macros_today.get('fat', 0)) / 70
        
        # Meal features
        meal_calories = meal.get('calories', 0) / 1000  # normalize
        meal_protein = meal.get('protein', 0) / 50
        meal_carbs = meal.get('carbs', 0) / 100
        meal_fat = meal.get('fat', 0) / 35
        
        # Preference alignment
        favorite_cuisines = state.get('favorite_cuisines', [])
        meal_cuisine = meal.get('cuisine_type', '').lower()
        cuisine_match = 1.0 if any(cuisine.lower() in meal_cuisine for cuisine in favorite_cuisines) else 0.0
        
        favorite_dining_halls = state.get('favorite_dining_halls', [])
        meal_location = meal.get('location', '').lower()
        location_match = 1.0 if any(hall.lower() in meal_location for hall in favorite_dining_halls) else 0.0
        
        # Variety (avoid repetition)
        recent_meals = state.get('recent_meals', [])
        meal_name = meal.get('name', '').lower()
        is_recent = 1.0 if any(recent.lower() in meal_name or meal_name in recent.lower() for recent in recent_meals) else 0.0
        
        # Station/category features
        station = meal.get('category', '').lower()
        is_grill = 1.0 if 'grill' in station else 0.0
        is_international = 1.0 if 'international' in station or 'world' in station else 0.0
        is_comfort = 1.0 if 'comfort' in station or 'home' in station else 0.0
        is_salad = 1.0 if 'salad' in station or 'salad' in meal_name else 0.0
        
        # Dietary compliance
        dietary_restrictions = state.get('dietary_restrictions', [])
        allergens = state.get('allergens', [])
        meal_allergens = meal.get('allergens', '').lower()
        allergen_violation = 1.0 if any(allergen.lower() in meal_allergens for allergen in allergens) else 0.0
        
        meal_clean_diet = meal.get('clean_diet', '').lower()
        is_vegetarian = 1.0 if 'vegetarian' in meal_clean_diet or 'plant' in meal_clean_diet else 0.0
        user_vegetarian = 1.0 if 'vegetarian' in [r.lower() for r in dietary_restrictions] else 0.0
        vegetarian_match = 1.0 if (is_vegetarian and user_vegetarian) or (not is_vegetarian and not user_vegetarian) else 0.0
        
        # Calorie alignment
        ideal_meal_calories = calorie_budget_remaining * calorie_budget / 3  # assume 3 meals
        calorie_diff = abs(meal.get('calories', 0) - ideal_meal_calories) / 1000
        
        # Protein ratio
        protein_ratio = meal.get('protein', 0) / max(meal.get('calories', 1), 1)
        high_protein = 1.0 if protein_ratio > 0.25 else 0.0
        
        features = np.array([
            time_encoded / 3.0,  # normalize
            day_of_week / 6.0,
            calorie_budget_remaining,
            protein_remaining,
            carbs_remaining,
            fat_remaining,
            meal_calories,
            meal_protein,
            meal_carbs,
            meal_fat,
            cuisine_match,
            location_match,
            is_recent,
            is_grill,
            is_international,
            is_comfort,
            is_salad,
            allergen_violation,
            vegetarian_match,
            calorie_diff,
            high_protein
        ])
        
        return features
    
    def recommend_meals(self, state: Dict, available_meals: List[Dict], n_recommendations: int = 5) -> List[Dict]:
        """
        Recommend top N meals using epsilon-greedy strategy.
        """
        if not available_meals:
            return []
        
        # Filter meals by dietary restrictions and allergens
        filtered_meals = self._filter_meals(available_meals, state)
        
        if not filtered_meals:
            return []
        
        try:
            # Exploration: random recommendations
            # Ensure model flag reflects actual fittedness
            if SKLEARN_AVAILABLE and self.model and self.is_trained:
                try:
                    # verify model is actually fitted
                    check_is_fitted(self.model)
                except Exception:
                    # model isn't actually fitted — force exploration
                    self.is_trained = False

            if not self.is_trained or np.random.random() < self.epsilon:
                selected = np.random.choice(
                    len(filtered_meals),
                    size=min(n_recommendations, len(filtered_meals)),
                    replace=False
                )
                recommendations = [filtered_meals[i] for i in selected]
            else:
                # Exploitation: use model to predict rewards
                predictions = []
                for meal in filtered_meals:
                    context = self.get_context_features(state, meal)
                    try:
                        predicted_reward = self.model.predict([context])[0]
                    except Exception:
                        predicted_reward = 0.0

                    # Add meal object with predicted reward
                    meal_with_score = meal.copy()
                    meal_with_score['predicted_reward'] = float(predicted_reward)
                    meal_with_score['confidence_score'] = min(0.99, max(0.1, (predicted_reward + 1) / 2))  # normalize to 0-1
                    predictions.append(meal_with_score)

                # Sort by predicted reward
                predictions.sort(key=lambda x: x.get('predicted_reward', 0), reverse=True)
                recommendations = predictions[:n_recommendations]
        except Exception as e:
            # Defensive fallback: if anything goes wrong with the model (AttributeError from sklearn, etc.)
            # fall back to random exploration so the API remains responsive.
            try:
                selected = np.random.choice(
                    len(filtered_meals),
                    size=min(n_recommendations, len(filtered_meals)),
                    replace=False
                )
                recommendations = [filtered_meals[i] for i in selected]
            except Exception:
                # As a last resort, return up to n_recommendations first items
                recommendations = filtered_meals[:n_recommendations]
            # Exploitation: use model to predict rewards
            predictions = []
            pass
        
        # Add reasoning to each recommendation
        for i, rec in enumerate(recommendations):
            rec['rank'] = i + 1
            rec['reasoning'] = self._generate_reasoning(state, rec)
            if 'confidence_score' not in rec:
                rec['confidence_score'] = 0.5  # default for exploration
        
        return recommendations
    
    def _filter_meals(self, meals: List[Dict], state: Dict) -> List[Dict]:
        """Filter meals based on dietary restrictions and allergens."""
        filtered = []
        allergens = [a.lower() for a in state.get('allergens', [])]
        dietary_restrictions = [r.lower() for r in state.get('dietary_restrictions', [])]
        
        for meal in meals:
            # Check allergens
            meal_allergens = meal.get('allergens', '').lower()
            if any(allergen in meal_allergens for allergen in allergens):
                continue  # Skip meals with user's allergens
            
            # Check dietary restrictions
            meal_clean_diet = meal.get('clean_diet', '').lower()
            if 'vegetarian' in dietary_restrictions and 'vegetarian' not in meal_clean_diet and 'plant' not in meal_clean_diet:
                continue
            
            filtered.append(meal)
        
        return filtered
    
    def _generate_reasoning(self, state: Dict, meal: Dict) -> str:
        """Generate human-readable reasoning for recommendation."""
        reasons = []
        
        # Calorie alignment
        calorie_budget = state.get('calorie_budget', 2200)
        calories_today = state.get('calories_today', 0)
        remaining = calorie_budget - calories_today
        ideal = remaining / 3
        
        meal_cal = meal.get('calories', 0)
        if abs(meal_cal - ideal) < 100:
            reasons.append("perfect calorie match")
        elif meal_cal < ideal:
            reasons.append("light option")
        else:
            reasons.append("filling meal")
        
        # Protein
        protein_ratio = meal.get('protein', 0) / max(meal.get('calories', 1), 1)
        if protein_ratio > 0.25:
            reasons.append("high protein")
        
        # Preferences
        favorite_cuisines = state.get('favorite_cuisines', [])
        meal_name = meal.get('name', '').lower()
        if any(cuisine.lower() in meal_name for cuisine in favorite_cuisines):
            reasons.append("matches your taste")
        
        # Location
        favorite_halls = state.get('favorite_dining_halls', [])
        meal_location = meal.get('location', '')
        if any(hall.lower() in meal_location.lower() for hall in favorite_halls):
            reasons.append("at your preferred location")
        
        if not reasons:
            reasons.append("balanced nutrition")
        
        return ", ".join(reasons[:3])
    
    def update(self, state: Dict, meal: Dict, reward: float):
        """
        Update model with new feedback.
        """
        context = self.get_context_features(state, meal)
        self.meal_history.append((context, reward))
        
        # Update preferences based on positive feedback
        if reward > 0.3:
            # Update favorite cuisines
            cuisine_type = meal.get('cuisine_type', '')
            if cuisine_type:
                if cuisine_type not in self.preferences['favorite_cuisines']:
                    self.preferences['favorite_cuisines'].append(cuisine_type)
            
            # Update favorite stations
            station = meal.get('category', '')
            if station and station not in self.preferences['favorite_stations']:
                self.preferences['favorite_stations'].append(station)
            
            # Update favorite dining halls
            location = meal.get('location', '')
            if location and location not in self.preferences['favorite_dining_halls']:
                self.preferences['favorite_dining_halls'].append(location)
        
        # Retrain model periodically
        if len(self.meal_history) >= 5:  # minimum data needed
            try:
                X = np.array([h[0] for h in self.meal_history])
                y = np.array([h[1] for h in self.meal_history])
                
                if SKLEARN_AVAILABLE and self.model:
                    # Fit the model and verify it's actually trained before flipping the flag
                    try:
                        self.model.fit(X, y)
                        try:
                            check_is_fitted(self.model)
                            self.is_trained = True
                        except Exception:
                            # If the model still isn't fitted (rare), keep flag False
                            self.is_trained = False
                    except Exception as fit_err:
                        # If fitting raises an AttributeError or other sklearn-related error,
                        # recreate the model so we don't keep a broken estimator around.
                        print(f"Error training model: {fit_err}")
                        try:
                            # attempt to recreate a fresh estimator
                            self.model = RandomForestRegressor(
                                n_estimators=50,
                                max_depth=10,
                                random_state=42,
                                n_jobs=-1
                            )
                        except Exception:
                            # If recreation fails, null it out to force cold-start behavior
                            self.model = None
                        self.is_trained = False
            except Exception as e:
                print(f"Error training model: {e}")
        
        # Update statistics
        self.preferences['meals_logged'] = len(self.meal_history)
        if meal.get('calories'):
            # Update average calories
            all_calories = [m.get('calories', 0) for _, m, _ in [(None, meal, reward)] if m.get('calories')]
            if all_calories:
                self.preferences['typical_meal_calories'] = np.mean(all_calories)
    
    def decay_epsilon(self):
        """Reduce exploration over time."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
    
    def get_insights(self) -> Dict:
        """Get learned preferences and insights."""
        return {
            'favorite_cuisines': self.preferences['favorite_cuisines'][:5],
            'favorite_stations': self.preferences['favorite_stations'][:5],
            'favorite_dining_halls': self.preferences['favorite_dining_halls'][:5],
            'typical_meal_calories': int(self.preferences['typical_meal_calories']),
            'protein_preference': self.preferences['protein_preference'],
            'meals_logged': self.preferences['meals_logged'],
            'model_confidence': 0.8 if self.is_trained else 0.3,
            'exploration_rate': self.epsilon
        }
    
    def save(self, filepath: str):
        """Save model to disk."""
        data = {
            'user_id': self.user_id,
            'epsilon': self.epsilon,
            'meal_history': [(ctx.tolist() if isinstance(ctx, np.ndarray) else ctx, r) for ctx, r in self.meal_history],
            'preferences': self.preferences,
            'is_trained': self.is_trained
        }
        
        # Save model if available
        if SKLEARN_AVAILABLE and self.model and self.is_trained:
            # double-check the estimator is fitted before saving
            try:
                check_is_fitted(self.model)
                model_path = filepath.replace('.json', '_model.pkl')
                with open(model_path, 'wb') as f:
                    pickle.dump(self.model, f)
                data['model_path'] = model_path
            except Exception:
                # Do not write a model_path if the model isn't actually fitted
                data.pop('model_path', None)
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
    
    @classmethod
    def load(cls, filepath: str):
        """Load model from disk."""
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        user_id = data['user_id']
        epsilon = data.get('epsilon', 0.15)

        bandit = cls(user_id, epsilon=epsilon)
        bandit.epsilon = data.get('epsilon', 0.15)
        bandit.preferences = data.get('preferences', bandit.preferences)
        bandit.is_trained = data.get('is_trained', False)

        # Restore meal history
        meal_history = data.get('meal_history', [])
        bandit.meal_history = [(np.array(ctx), r) for ctx, r in meal_history]

        # Load model if available and ensure it's actually fitted
        if SKLEARN_AVAILABLE and data.get('model_path') and os.path.exists(data['model_path']):
            try:
                with open(data['model_path'], 'rb') as f:
                    bandit.model = pickle.load(f)
                try:
                    check_is_fitted(bandit.model)
                    bandit.is_trained = True
                except Exception:
                    # Loaded model is not fitted — treat as untrained
                    bandit.is_trained = False
                    # Recreate a fresh model instance so future training is clean
                    bandit.model = RandomForestRegressor(
                        n_estimators=50,
                        max_depth=10,
                        random_state=42,
                        n_jobs=-1
                    )
            except Exception as e:
                print(f"Error loading model: {e}")

        return bandit


def calculate_reward(feedback: Dict, state: Dict, meal: Dict) -> float:
    """
    Calculate reward based on user feedback.
    Returns reward in range [-1, 1]
    """
    reward = 0.0
    
    # 1. User Explicit Feedback (most important)
    ate_meal = feedback.get('ate_meal', False)
    liked = feedback.get('liked')
    rating = feedback.get('rating', 0)
    
    if ate_meal:
        reward += 0.4  # User actually ate it
        if liked is True:
            reward += 0.3  # User explicitly liked it
        elif liked is False:
            reward -= 0.5  # User explicitly disliked it
        
        # Rating bonus
        if rating:
            reward += (rating - 3) * 0.1  # 1-5 stars, center at 3
    else:
        reward -= 0.3  # Recommended but user didn't eat it
    
    # 2. Nutritional Goal Alignment
    calorie_budget = state.get('calorie_budget', 2200)
    calories_today = state.get('calories_today', 0)
    ideal_meal_calories = (calorie_budget - calories_today) / 3
    
    meal_calories = meal.get('calories', 0)
    calories_diff = abs(meal_calories - ideal_meal_calories)
    
    if calories_diff < 100:
        reward += 0.2
    elif calories_diff > 300:
        reward -= 0.2
    
    # 3. Macro Balance
    protein_ratio = meal.get('protein', 0) / max(meal.get('calories', 1), 1)
    if state.get('high_protein_goal', False) and protein_ratio > 0.25:
        reward += 0.1
    
    # 4. Variety Penalty (avoid repetition)
    recent_meals = state.get('recent_meals', [])
    meal_name = meal.get('name', '').lower()
    if any(recent.lower() in meal_name or meal_name in recent.lower() for recent in recent_meals[-7:]):
        reward -= 0.15
    
    # 5. Dietary Compliance
    allergens = state.get('allergens', [])
    meal_allergens = meal.get('allergens', '').lower()
    if any(allergen.lower() in meal_allergens for allergen in allergens):
        reward -= 1.0  # Major penalty for allergen violation
    
    dietary_restrictions = state.get('dietary_restrictions', [])
    meal_clean_diet = meal.get('clean_diet', '').lower()
    if 'vegetarian' in [r.lower() for r in dietary_restrictions]:
        if 'vegetarian' in meal_clean_diet or 'plant' in meal_clean_diet:
            reward += 0.1
    
    return np.clip(reward, -1.0, 1.0)


def cold_start_recommendations(user_state: Dict, available_meals: List[Dict], n: int = 5) -> List[Dict]:
    """
    Recommendations for users with no history.
    Use simple heuristics until we have data.
    """
    if not available_meals:
        return []
    
    # Filter by dietary restrictions
    filtered = []
    allergens = [a.lower() for a in user_state.get('allergens', [])]
    dietary_restrictions = [r.lower() for r in user_state.get('dietary_restrictions', [])]
    
    for meal in available_meals:
        # Check allergens
        meal_allergens = meal.get('allergens', '').lower()
        if any(allergen in meal_allergens for allergen in allergens):
            continue
        
        # Check dietary restrictions
        meal_clean_diet = meal.get('clean_diet', '').lower()
        if 'vegetarian' in dietary_restrictions and 'vegetarian' not in meal_clean_diet and 'plant' not in meal_clean_diet:
            continue
        
        filtered.append(meal)
    
    if not filtered:
        return []
    
    # Score meals
    calorie_budget = user_state.get('calorie_budget', 2200)
    calories_today = user_state.get('calories_today', 0)
    target_cal = (calorie_budget - calories_today) / 3
    
    scored = []
    for meal in filtered:
        score = 0
        
        # Match calorie target
        cal_diff = abs(meal.get('calories', 0) - target_cal)
        score += max(0, 100 - cal_diff / 10)
        
        # High protein bonus if user wants it
        if user_state.get('high_protein_goal', False):
            protein_ratio = meal.get('protein', 0) / max(meal.get('calories', 1), 1)
            if protein_ratio > 0.25:
                score += 20
        
        # Variety bonus (different stations)
        # Popularity bonus (balanced nutrition)
        protein = meal.get('protein', 0)
        carbs = meal.get('carbs', 0)
        fat = meal.get('fat', 0)
        if protein > 0 and carbs > 0 and fat > 0:
            score += 10
        
        scored.append((meal, score))
    
    scored.sort(key=lambda x: x[1], reverse=True)
    recommendations = [meal.copy() for meal, _ in scored[:n]]
    
    # Add metadata
    for i, rec in enumerate(recommendations):
        rec['rank'] = i + 1
        rec['confidence_score'] = 0.5  # cold start
        rec['reasoning'] = "balanced nutrition based on your goals"
    
    return recommendations

