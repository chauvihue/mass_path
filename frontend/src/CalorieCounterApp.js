import React, { useState, useEffect, useMemo } from 'react';

import { Camera, TrendingUp, MapPin, ThumbsUp, ThumbsDown, Calendar, Home, User, Utensils, ChevronRight, Clock, Flame, Award, Plus, Brain, RefreshCw, Star, Sparkles, X } from 'lucide-react';
import './CalorieCounterApp2.css';

import Menu from './Menu';
import Food from './Food';

import Login from './Login';

const CalorieCounterApp = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  const [activeTab, setActiveTab] = useState('home');
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const caloriesTarget = 2200;
  const progress = (caloriesConsumed / caloriesTarget) * 100;
  const [menuItems, setMenuItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mealsToday, setMealsToday] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMealForFeedback, setSelectedMealForFeedback] = useState(null);
  const menuService = useMemo(() => new Menu(), []);

  // Fetch menu data on component mount
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true);
        const allFoods = await menuService.getAllMenus();
        setMenuItems(allFoods);
        const highProteinFoods = allFoods
          .filter(food => food.getProtein() > 20 && food.getCalories() > 200 && food.getCalories() < 800)
          .slice(0, 10);
        const recs = highProteinFoods.map((food, idx) => {
          const protein = food.getProtein();
          const calories = food.getCalories();
          const carbs = food.getCarbs();
          const fat = food.getFat();
          const location = food.getLocation();
          let matchScore = 70;
          if (protein > 30) matchScore += 15;
          if (calories > 400 && calories < 600) matchScore += 10;
          if (food.cleanDiet && food.cleanDiet.includes('Antibiotic Free')) matchScore += 5;
          const tags = [];
          if (protein > 30) tags.push('High Protein');
          if (calories < 400) tags.push('Light');
          if (calories > 500) tags.push('Filling');
          if (food.cleanDiet && food.cleanDiet.includes('Plant Based')) tags.push('Vegetarian');
          if (food.cleanDiet && food.cleanDiet.includes('Halal')) tags.push('Halal');
          if (!tags.length) tags.push('Balanced');
          const distances = ["0.2 mi", "0.4 mi", "0.6 mi"];
          const distance = distances[idx % distances.length];
          return {
            name: food.getName(),
            calories: Math.round(calories),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            location: `${location} Dining`,
            distance: distance,
            matchScore: Math.min(99, matchScore),
            tags: tags.slice(0, 3),
            available: "Until 8:00 PM",
            food: food
          };
        });
        setRecommendations(recs.slice(0, 3));
        setLoading(false);
      } catch (error) {
        console.error('Error loading menus:', error);
        setLoading(false);
      }
    };
    loadMenus();
  }, [menuService]);


  // Shared feedback handler
  const handleShowFeedback = (meal, food) => {
    setSelectedMealForFeedback({ meal, food });
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (feedback) => {
    if (!selectedMealForFeedback) {
      console.error('Missing selectedMealForFeedback');
      return;
    }

    try {
      console.log('Submitting feedback:', feedback);
      
      const currentHour = new Date().getHours();
      let timeOfDay = 'lunch';
      if (currentHour < 11) timeOfDay = 'breakfast';
      else if (currentHour < 15) timeOfDay = 'lunch';
      else if (currentHour < 21) timeOfDay = 'dinner';
      else timeOfDay = 'midnight';

      const userState = {
        time_of_day: timeOfDay,
        calories_today: caloriesConsumed,
        calorie_budget: caloriesTarget,
        macros_today: { protein: 132, carbs: 165, fat: 48 },
        protein_goal: 100,
        carbs_goal: 200,
        fat_goal: 70,
        dietary_restrictions: [],
        allergens: [],
        favorite_cuisines: [],
        favorite_dining_halls: [],
        recent_meals: mealsToday.map(m => m.name).slice(-7),
        high_protein_goal: false
      };

      const response = await fetch('/api/rl/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal: selectedMealForFeedback.meal,
          user_state: userState,
          ate_meal: feedback.ate_meal,
          liked: feedback.liked,
          rating: feedback.rating
        })
      });

      const data = await response.json();
      console.log('Feedback response:', data);

      // === Trigger preference inference ===
      try {
        const inferResponse = await fetch('/api/rl/infer_preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logged_foods: mealsToday.map(m => m.name)
          })
        });
        const inferData = await inferResponse.json();
        if (inferData.success) {
          const data = inferData.data;
          setUserPreferences(data.inferred_preferences);
          setRecommendation(data.next_meal_recommendation);
          console.log('Inferred preferences:', data.inferred_preferences);
          console.log('Next recommended meal:', data.next_meal_recommendation);
        } else {
          console.error('Inference error:', inferData.error);
        }
      } catch (inferError) {
        console.error('Error inferring preferences:', inferError);
      }

      if (data.success) {
        alert('Thank you for your feedback! It helps us improve recommendations.');
      } else {
        alert('Error submitting feedback: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback: ' + error.message);
    } finally {
      setShowFeedbackModal(false);
      setSelectedMealForFeedback(null);
    }
  };

  const HomeScreen = ({ onShowFeedback }) => (
    <div className="space-y-6">
      {/* Calorie Progress Circle */}
      <div className="calorie-card">
        <div className="calorie-header">
          <div>
            <h2 className="calorie-number">{caloriesConsumed}</h2>
            <p className="calorie-target">of {caloriesTarget} cal</p>
          </div>
          <div className="progress-circle">
            <svg>
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${progress * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="progress-percentage">
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
        
        <div className="macro-grid">
          <div className="macro-item">
            <div className="macro-value">
              {Math.round(mealsToday.reduce((sum, meal) => sum + (meal.protein || 0), 0))}g
            </div>
            <div className="macro-label">Protein</div>
          </div>
          <div className="macro-item">
            <div className="macro-value">
              {Math.round(mealsToday.reduce((sum, meal) => sum + (meal.carbs || 0), 0))}g
            </div>
            <div className="macro-label">Carbs</div>
          </div>
          <div className="macro-item">
            <div className="macro-value">
              {Math.round(mealsToday.reduce((sum, meal) => sum + (meal.fat || 0), 0))}g
            </div>
            <div className="macro-label">Fat</div>
          </div>
        </div>
      </div>

      {/* AI Suggestion */}
      {loading ? (
        <div className="ai-suggestion-card">
          <div className="ai-suggestion-header">
            <div className="ai-icon">
              <Utensils />
            </div>
            <h3 className="ai-title">Loading recommendations...</h3>
          </div>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="ai-suggestion-card">
          <div className="ai-suggestion-header">
            <div className="ai-icon">
              <Utensils />
            </div>
            <h3 className="ai-title">AI suggests for dinner</h3>
            <span className="match-badge">{recommendations[0].matchScore}% match</span>
          </div>
          
          <div className="meal-highlight">
            <h4 className="meal-name">{recommendations[0].name}</h4>
            <div className="meal-info">
              <span className="meal-info-item">
                <Flame className="w-4 h-4" /> {recommendations[0].calories} cal
              </span>
              <span className="meal-info-item">
                <MapPin className="w-4 h-4" /> {recommendations[0].location} ({recommendations[0].distance})
              </span>
              <span className="meal-info-item">
                <Clock className="w-4 h-4" /> {recommendations[0].available}
              </span>
            </div>
            <div className="meal-tags">
              {recommendations[0].tags.map((tag, idx) => (
                <span key={idx} className="tag">{tag}</span>
              ))}
            </div>
          </div>
          
          <button className="view-menu-btn" onClick={() => setActiveTab('recommendations')}>
            View Full Menu
          </button>
        </div>
      ) : (
        <div className="ai-suggestion-card">
          <div className="ai-suggestion-header">
            <div className="ai-icon">
              <Utensils />
            </div>
            <h3 className="ai-title">No recommendations available</h3>
          </div>
        </div>
      )}



      {/* Today's Meals - Enhanced */}
      <div className="meals-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="meals-title">Today's Meals</h3>
          {mealsToday.length > 0 && (
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {mealsToday.length} {mealsToday.length === 1 ? 'meal' : 'meals'}
            </span>
          )}
        </div>
        
        {mealsToday.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            <Utensils style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No meals logged yet today</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Select meals from the Menu or For You tab</p>
          </div>
        ) : (
          <div>
            {/* Summary Stats */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#9333ea' }}>
                  {mealsToday.reduce((sum, meal) => sum + (meal.calories || 0), 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Cal</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {Math.round(mealsToday.reduce((sum, meal) => sum + (meal.protein || 0), 0))}g
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Protein</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {Math.round(mealsToday.reduce((sum, meal) => sum + (meal.carbs || 0), 0))}g
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Carbs</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {Math.round(mealsToday.reduce((sum, meal) => sum + (meal.fat || 0), 0))}g
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Fat</div>
              </div>
            </div>

            {/* Meal List */}
            {mealsToday.map((meal, idx) => (
              <div 
                key={idx} 
                className="meal-item"
                style={{
                  position: 'relative',
                  padding: '1rem',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  marginBottom: '0.75rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newMeals = mealsToday.filter((_, i) => i !== idx);
                    setMealsToday(newMeals);
                    setCaloriesConsumed(prev => prev - (meal.calories || 0));
                  }}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  title="Remove meal"
                >
                  <X style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                </button>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div className="meal-details" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div className="meal-item-name" style={{ fontSize: '1rem', fontWeight: '600' }}>
                        {meal.name}
                      </div>
                      {meal.recommendation && (
                        <span style={{
                          background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                          color: 'white',
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontWeight: '600'
                        }}>
                          AI
                        </span>
                      )}
                    </div>
                    <div className="meal-item-meta" style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.25rem' }} />
                      {meal.time}
                      {meal.location && (
                        <>
                          <span style={{ margin: '0 0.5rem' }}>·</span>
                          <MapPin style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.25rem' }} />
                          {meal.location}
                        </>
                      )}
                    </div>
                    
                    {/* Macros */}
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      flexWrap: 'wrap'
                    }}>
                      {meal.protein > 0 && (
                        <span>
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>💪 {Math.round(meal.protein)}g</span> protein
                        </span>
                      )}
                      {meal.carbs > 0 && (
                        <span>
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>🍞 {Math.round(meal.carbs)}g</span> carbs
                        </span>
                      )}
                      {meal.fat > 0 && (
                        <span>
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>🧈 {Math.round(meal.fat)}g</span> fat
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div className="meal-calories" style={{ textAlign: 'right', minWidth: '60px' }}>
                      <div className="meal-calories-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea' }}>
                        {meal.calories}
                      </div>
                      <div className="meal-calories-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        cal
                      </div>
                    </div>
                    {/* Feedback Button */}
                    {meal.recommendation && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onShowFeedback) {
                            onShowFeedback(meal.recommendation, meal);
                          }
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                        title="Give feedback on this meal"
                      >
                        <Star style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.25rem' }} />
                        Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Inferred Preferences */}
      {userPreferences && (
        <div className="preferences-section">
          <h3>Your Inferred Preferences</h3>
          <ul>
            {Object.entries(userPreferences).map(([tag, score]) => (
              <li key={tag}>
                <strong>{tag.replace(/_/g, " ")}:</strong> {(score * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Next Meal Recommendation */}
      {recommendation && (
        <div className="recommendation-section">
          <h3>Next Meal Recommendation</h3>
          <p><strong>Meal:</strong> {recommendation.meal}</p>
          <p><strong>Calories:</strong> {recommendation.calories}</p>
          <p><strong>Tags:</strong> {recommendation.tags.join(", ")}</p>
        </div>
      )}
    </div>
  );

  const RecommendationsScreen = () => {
    const [filter, setFilter] = useState('all');
    
    const filteredRecommendations = recommendations.filter(rec => {
      if (filter === 'all') return true;
      if (filter === 'high-protein') return rec.protein > 30;
      if (filter === 'vegetarian') return rec.tags.some(tag => tag.toLowerCase().includes('vegetarian'));
      if (filter === 'light') return rec.calories < 400;
      return true;
    });

    const handleSelectMeal = (rec) => {
      try {
        console.log('Select button clicked in For You tab for:', rec.name);
        
        // Create meal object from recommendation
        const newMeal = {
          name: rec.name || 'Unknown Meal',
          calories: rec.calories || 0,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          rating: null,
          location: rec.location || 'Unknown Location',
          protein: Math.round(rec.protein || 0),
          carbs: Math.round(rec.carbs || 0),
          fat: Math.round(rec.fat || 0),
          recommendation: rec
        };
        
        console.log('Meal object created:', newMeal);
        
        // Update state directly
        setMealsToday(prev => [...prev, newMeal]);
        setCaloriesConsumed(prev => prev + (newMeal.calories || 0));
        
        console.log('Meal logged successfully!');
        alert(`Added ${newMeal.name} to your meals!`);
      } catch (error) {
        console.error('Error selecting meal:', error);
        alert('Error adding meal: ' + error.message);
      }
    };
    
    return (
    <div className="space-y-4">
      <div className="recommendations-header">
        <h2 className="recommendations-title">For You</h2>
        <p className="recommendations-subtitle">Personalized meals based on your preferences</p>
        
        <div className="filter-buttons">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'high-protein' ? 'active' : ''}`} onClick={() => setFilter('high-protein')}>High Protein</button>
          <button className={`filter-btn ${filter === 'vegetarian' ? 'active' : ''}`} onClick={() => setFilter('vegetarian')}>Vegetarian</button>
          <button className={`filter-btn ${filter === 'light' ? 'active' : ''}`} onClick={() => setFilter('light')}>Light</button>
        </div>
      </div>

      {loading ? (
        <div className="recommendations-header">
          <p className="recommendations-subtitle">Loading menu items...</p>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="recommendations-header">
          <p className="recommendations-subtitle">No recommendations found. Try a different filter.</p>
        </div>
      ) : (
        filteredRecommendations.map((rec, idx) => (
        <div key={idx} className="recommendation-card">
          <div className="recommendation-header">
            <div className="recommendation-info">
              <h3 className="recommendation-name">{rec.name}</h3>
              <div className="recommendation-location">
                <MapPin className="w-4 h-4" />
                <span>{rec.location} · {rec.distance}</span>
              </div>
            </div>
            <div className="match-badge">{rec.matchScore}% match</div>
          </div>

          <div className="nutrition-grid">
            <div className="nutrition-item">
              <div className="nutrition-label">Calories</div>
              <div className="nutrition-value">{rec.calories}</div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-label">Protein</div>
              <div className="nutrition-value">{rec.protein}g</div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-label">Carbs</div>
              <div className="nutrition-value">{rec.carbs}g</div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-label">Fat</div>
              <div className="nutrition-value">{rec.fat}g</div>
            </div>
          </div>

          <div className="meal-tags">
            {rec.tags.map((tag, tagIdx) => (
              <span key={tagIdx} className="tag">{tag}</span>
            ))}
          </div>

          <div className="recommendation-footer">
            <span className="availability">
              <Clock className="w-4 h-4" /> {rec.available}
            </span>
            <button 
              className="select-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectMeal(rec);
              }}
            >
              Select
            </button>
          </div>
        </div>
      ))
      )}
    </div>
  );
  };

  const MenuScreen = ({ 
    onLogFood, 
    onShowFeedback,
    showFeedbackModal,
    setShowFeedbackModal,
    selectedMealForFeedback,
    setSelectedMealForFeedback,
    handleFeedback,
    user: menuUser,
    caloriesConsumed: menuCaloriesConsumed,
    caloriesTarget: menuCaloriesTarget,
    mealsToday: menuMealsToday
  }) => {
    const [selectedDiningHall, setSelectedDiningHall] = useState('Berkshire');
    const [menuItemsByMeal, setMenuItemsByMeal] = useState({
      breakfast: [],
      lunch: [],
      dinner: [],
      midnight: []
    });
    const [loading, setLoading] = useState(false);
    const [rlRecommendations, setRlRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [userInsights, setUserInsights] = useState(null);

    const diningHalls = ["Berkshire", "Franklin", "Worcester", "Hampshire"];
    const mealPeriods = [
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'dinner', label: 'Dinner' },
      { key: 'midnight', label: 'Midnight' }
    ];

    // Load menu when dining hall changes
    useEffect(() => {
      const loadMenu = async () => {
        setLoading(true);
        try {
          const items = await menuService.getMenu(selectedDiningHall);
          
          // Organize items by meal period
          const organized = {
            breakfast: [],
            lunch: [],
            dinner: [],
            midnight: []
          };

          items.forEach(food => {
            const mealPeriod = food.mealPeriod?.toLowerCase() || '';
            // Map meal period names from the API response
            // The API uses keys like "lunch", "dinner", etc. directly
            if (mealPeriod === 'breakfast' || mealPeriod.includes('breakfast')) {
              organized.breakfast.push(food);
            } else if (mealPeriod === 'lunch' || mealPeriod.includes('lunch')) {
              organized.lunch.push(food);
            } else if (mealPeriod === 'dinner' || mealPeriod.includes('dinner')) {
              organized.dinner.push(food);
            } else if (mealPeriod === 'midnight' || mealPeriod.includes('midnight') || mealPeriod.includes('late night')) {
              organized.midnight.push(food);
            } else {
              // If mealPeriod is empty or unknown, check category or default to lunch
              // Some items might not have mealPeriod set, so we'll distribute them
              const category = food.getCategory()?.toLowerCase() || '';
              if (category.includes('breakfast') || category.includes('morning')) {
                organized.breakfast.push(food);
              } else if (category.includes('dinner') || category.includes('evening')) {
                organized.dinner.push(food);
              } else {
                // Default to lunch for unknown items
                organized.lunch.push(food);
              }
            }
          });

          setMenuItemsByMeal(organized);
        } catch (error) {
          console.error('Error loading menu:', error);
        } finally {
          setLoading(false);
        }
      };

      loadMenu();
    }, [selectedDiningHall, menuService]);

    // Load RL recommendations
    useEffect(() => {
      const loadRecommendations = async () => {
        if (!menuUser) return;
        
        setLoadingRecommendations(true);
        try {
          // Get current time of day
          const currentHour = new Date().getHours();
          let timeOfDay = 'lunch';
          if (currentHour < 11) timeOfDay = 'breakfast';
          else if (currentHour < 15) timeOfDay = 'lunch';
          else if (currentHour < 21) timeOfDay = 'dinner';
          else timeOfDay = 'midnight';

          // Get user state
          const userState = {
            time_of_day: timeOfDay,
            day_of_week: new Date().getDay(),
            calories_today: menuCaloriesConsumed,
            calorie_budget: menuCaloriesTarget,
            macros_today: {
              protein: 132, // TODO: track actual macros
              carbs: 165,
              fat: 48
            },
            protein_goal: 100,
            carbs_goal: 200,
            fat_goal: 70,
            dietary_restrictions: [],
            allergens: [],
            favorite_cuisines: userInsights?.favorite_cuisines || [],
            favorite_dining_halls: userInsights?.favorite_dining_halls || [],
            recent_meals: menuMealsToday.map(m => m.name).slice(-7),
            high_protein_goal: false
          };

          const response = await fetch('/api/rl/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: menuUser.id,
              user_state: userState,
              n_recommendations: 5,
              dining_location: selectedDiningHall
            })
          });

          const data = await response.json();
          if (data.success) {
            setRlRecommendations(data.recommendations || []);
          }
        } catch (error) {
          console.error('Error loading recommendations:', error);
        } finally {
          setLoadingRecommendations(false);
        }
      };

      loadRecommendations();
    }, [menuUser, selectedDiningHall, menuCaloriesConsumed, menuCaloriesTarget, menuMealsToday, userInsights]);

    // Load user insights
    useEffect(() => {
      const loadInsights = async () => {
        if (!menuUser) return;
        
        try {
          const response = await fetch(`http://127.0.0.1:4000/api/rl/user-insights/${menuUser.id}`);
          const data = await response.json();
          if (data.success) {
            setUserInsights(data.insights);
          }
        } catch (error) {
          console.error('Error loading insights:', error);
        }
      };

      loadInsights();
    }, [menuUser]);

    const handleLogFood = (food, isRecommended = false, recommendation = null) => {
      try {
        // Validate food object
        if (!food) {
          console.error('handleLogFood: food is null or undefined');
          alert('Error: Food item not found. Please try again.');
          return;
        }

        // Safely get food properties with fallbacks
        const getName = food.getName ? food.getName.bind(food) : () => food.name || 'Unknown';
        const getCalories = food.getCalories ? food.getCalories.bind(food) : () => food.calories || 0;
        const getProtein = food.getProtein ? food.getProtein.bind(food) : () => food.protein || 0;
        const getCarbs = food.getCarbs ? food.getCarbs.bind(food) : () => food.carbs || 0;
        const getFat = food.getFat ? food.getFat.bind(food) : () => food.fat || 0;
        const getLocation = food.getLocation ? food.getLocation.bind(food) : () => food.location || selectedDiningHall;

        // Add food to mealsToday and update calories
        const newMeal = {
          name: getName(),
          calories: getCalories(),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          rating: null,
          location: getLocation() || selectedDiningHall,
          protein: Math.round(getProtein()),
          carbs: Math.round(getCarbs()),
          fat: Math.round(getFat()),
          recommendation: recommendation
        };

        console.log('handleLogFood called with:', { food, newMeal, isRecommended, hasCallback: !!onLogFood });
        
        // Update calories consumed via callback
        if (onLogFood && typeof onLogFood === 'function') {
          onLogFood(newMeal);
          console.log('onLogFood callback executed');
        } else {
          console.warn('onLogFood is not a function or is missing');
        }
        
        // If this was a recommended meal, show feedback modal
        if (isRecommended && recommendation && onShowFeedback) {
          onShowFeedback(recommendation, newMeal);
        }
        
        console.log('Successfully logged food:', newMeal);
      } catch (error) {
        console.error('Error in handleLogFood:', error);
        alert('Error logging food: ' + error.message);
      }
    };


    return (
      <div className="space-y-6">
        {/* Dining Hall Selector */}
        <div className="insights-header">
          <h2 className="insights-title">Menu</h2>
          <p className="insights-subtitle">Select a dining hall to view menu items</p>
          
          <div className="filter-buttons" style={{ marginTop: '1rem' }}>
            {diningHalls.map((hall) => (
              <button
                key={hall}
                className={`filter-btn ${selectedDiningHall === hall ? 'active' : ''}`}
                onClick={() => setSelectedDiningHall(hall)}
              >
                {hall}
              </button>
            ))}
          </div>
        </div>

        {/* Personalized Recommendations Section */}
        {menuUser && (
          <div className="preferences-card" style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', border: '1px solid rgba(147, 51, 234, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="preferences-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain style={{ width: '20px', height: '20px', color: '#9333ea' }} />
                AI-Powered Recommendations
              </h3>
              <button
                onClick={() => {
                  setLoadingRecommendations(true);
                  // Trigger reload by updating state
                  const currentHour = new Date().getHours();
                  let timeOfDay = 'lunch';
                  if (currentHour < 11) timeOfDay = 'breakfast';
                  else if (currentHour < 15) timeOfDay = 'lunch';
                  else if (currentHour < 21) timeOfDay = 'dinner';
                  else timeOfDay = 'midnight';
                  
                  fetch('/api/rl/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      user_id: menuUser.id,
                      user_state: {
                        time_of_day: timeOfDay,
                        calories_today: menuCaloriesConsumed,
                        calorie_budget: menuCaloriesTarget,
                        macros_today: { protein: 132, carbs: 165, fat: 48 },
                        protein_goal: 100,
                        carbs_goal: 200,
                        fat_goal: 70,
                        dietary_restrictions: [],
                        allergens: [],
                        favorite_cuisines: userInsights?.favorite_cuisines || [],
                        favorite_dining_halls: userInsights?.favorite_dining_halls || [],
                        recent_meals: menuMealsToday.map(m => m.name).slice(-7),
                        high_protein_goal: false
                      },
                      n_recommendations: 5,
                      dining_location: selectedDiningHall
                    })
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      setRlRecommendations(data.recommendations || []);
                    }
                    setLoadingRecommendations(false);
                  })
                  .catch(err => {
                    console.error('Error refreshing recommendations:', err);
                    setLoadingRecommendations(false);
                  });
                }}
                disabled={loadingRecommendations}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(147, 51, 234, 0.5)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px', animation: loadingRecommendations ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>

            {/* User Insights */}
            {userInsights && userInsights.meals_logged > 0 && (
              <div style={{ 
                background: 'rgba(147, 51, 234, 0.1)', 
                borderRadius: '8px', 
                padding: '0.75rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <Sparkles style={{ width: '16px', height: '16px', color: '#9333ea' }} />
                <span>We've learned: {userInsights.favorite_cuisines[0] || 'your preferences'} • {userInsights.meals_logged} meals logged</span>
              </div>
            )}

            {/* Recommendations List */}
            {loadingRecommendations ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>Finding your perfect meals...</p>
              </div>
            ) : rlRecommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rlRecommendations.map((rec, idx) => {
                  // Find matching food item - search across all meal periods
                  let matchingFood = null;
                  
                  // First try to find in the specific meal period
                  const mealPeriod = rec.meal_period || rec.mealPeriod;
                  if (mealPeriod && menuItemsByMeal[mealPeriod]) {
                    matchingFood = menuItemsByMeal[mealPeriod].find(
                      f => f.getName().toLowerCase() === rec.name.toLowerCase()
                    );
                  }
                  
                  // If not found, search all meal periods
                  if (!matchingFood) {
                    for (const period of ['breakfast', 'lunch', 'dinner', 'midnight']) {
                      matchingFood = menuItemsByMeal[period]?.find(
                        f => f.getName().toLowerCase() === rec.name.toLowerCase()
                      );
                      if (matchingFood) break;
                    }
                  }
                  
                  // If still not found, create a new Food object from recommendation data
                  if (!matchingFood) {
                    matchingFood = new Food({
                      name: rec.name,
                      calories: rec.calories || 0,
                      protein: rec.protein || 0,
                      carbs: rec.carbs || 0,
                      fat: rec.fat || 0,
                      location: rec.location || selectedDiningHall,
                      category: rec.category || '',
                      allergens: rec.allergens || '',
                      clean_diet: rec.clean_diet || '',
                      mealPeriod: mealPeriod || 'lunch'
                    });
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        border: '1px solid rgba(147, 51, 234, 0.2)',
                        position: 'relative'
                      }}
                    >
                      {/* Rank Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        #{rec.rank || idx + 1}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            {rec.name}
                          </h4>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                            <MapPin style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.25rem' }} />
                            {rec.location} • {rec.category}
                          </div>
                          
                          {/* Nutrition Info */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            fontSize: '0.75rem',
                            marginBottom: '0.5rem',
                            flexWrap: 'wrap'
                          }}>
                            <span>🔥 {rec.calories} cal</span>
                            <span>💪 {rec.protein}g protein</span>
                            <span>🍞 {rec.carbs}g carbs</span>
                            <span>🧈 {rec.fat}g fat</span>
                          </div>

                          {/* Reasoning */}
                          {rec.reasoning && (
                            <div style={{
                              background: 'rgba(147, 51, 234, 0.1)',
                              borderRadius: '6px',
                              padding: '0.5rem',
                              fontSize: '0.75rem',
                              marginTop: '0.5rem',
                              fontStyle: 'italic'
                            }}>
                              <span style={{ fontWeight: '600' }}>Why this?</span> {rec.reasoning}
                            </div>
                          )}

                          {/* Confidence Score */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            opacity: 0.7
                          }}>
                            <TrendingUp style={{ width: '12px', height: '12px' }} />
                            <span>{Math.round((rec.confidence_score || 0.5) * 100)}% match</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            console.log('Select button clicked for:', rec.name);
                            
                            // Create meal object directly from recommendation
                            const newMeal = {
                              name: rec.name || 'Unknown Meal',
                              calories: rec.calories || 0,
                              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                              rating: null,
                              location: rec.location || selectedDiningHall,
                              protein: Math.round(rec.protein || 0),
                              carbs: Math.round(rec.carbs || 0),
                              fat: Math.round(rec.fat || 0),
                              recommendation: rec
                            };
                            
                            console.log('Meal object created:', newMeal);
                            
                            // Call the callback directly to update parent state
                            if (onLogFood && typeof onLogFood === 'function') {
                              try {
                                onLogFood(newMeal);
                                console.log('onLogFood callback executed successfully');
                                
                                // Show feedback modal for recommended meals
                                setSelectedMealForFeedback({ meal: rec, food: newMeal });
                                setShowFeedbackModal(true);
                              } catch (error) {
                                console.error('Error in onLogFood callback:', error);
                                alert('Error logging meal: ' + error.message);
                              }
                            } else {
                              console.error('onLogFood is not a function or is missing');
                              console.log('onLogFood value:', onLogFood);
                              alert('Error: Cannot log meal. Please refresh the page.');
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
                <p>No recommendations available. Try selecting a different dining hall.</p>
              </div>
            )}
          </div>
        )}


        {/* Menu Items by Meal Period */}
        {loading ? (
          <div className="preferences-card">
            <p className="recommendations-subtitle">Loading menu...</p>
          </div>
        ) : (
          mealPeriods.map((mealPeriod) => {
            const items = menuItemsByMeal[mealPeriod.key];
            if (items.length === 0) return null;

            return (
              <div key={mealPeriod.key} className="preferences-card">
                <h3 className="preferences-title">
                  {mealPeriod.label} 
                  <span style={{ fontSize: '0.875rem', fontWeight: 'normal', marginLeft: '0.5rem', opacity: 0.7 }}>
                    ({items.length} items)
                  </span>
                </h3>
                <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {items.map((food, idx) => (
                    <div 
                      key={idx} 
                      className="meal-item" 
                      style={{ 
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div className="meal-details" style={{ flex: 1, minWidth: 0 }}>
                        <div className="meal-item-name" style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          {food.getName()}
                        </div>
                        <div className="meal-item-meta" style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                          {food.getCategory() && <span>{food.getCategory()}</span>}
                          {food.getAllergens() && (
                            <span style={{ marginLeft: '0.5rem' }}>
                              Allergens: {food.getAllergens()}
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '0.75rem', 
                          marginTop: '0.5rem',
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          flexWrap: 'wrap'
                        }}>
                          {food.getCalories() > 0 && <span>🔥 {food.getCalories()} cal</span>}
                          {food.getProtein() > 0 && <span>💪 {Math.round(food.getProtein())}g protein</span>}
                          {food.getCarbs() > 0 && <span>🍞 {Math.round(food.getCarbs())}g carbs</span>}
                          {food.getFat() > 0 && <span>🧈 {Math.round(food.getFat())}g fat</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="meal-calories" style={{ textAlign: 'right' }}>
                          <div className="meal-calories-value" style={{ fontSize: '1.25rem' }}>
                            {food.getCalories()}
                          </div>
                          <div className="meal-calories-label" style={{ fontSize: '0.75rem' }}>
                            cal
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            console.log('Plus button clicked for:', food.getName());
                            
                            try {
                              // Create meal object directly
                              const newMeal = {
                                name: food.getName ? food.getName() : food.name || 'Unknown Meal',
                                calories: food.getCalories ? food.getCalories() : food.calories || 0,
                                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                rating: null,
                                location: food.getLocation ? food.getLocation() : food.location || selectedDiningHall,
                                protein: Math.round(food.getProtein ? food.getProtein() : food.protein || 0),
                                carbs: Math.round(food.getCarbs ? food.getCarbs() : food.carbs || 0),
                                fat: Math.round(food.getFat ? food.getFat() : food.fat || 0)
                              };
                              
                              console.log('Meal object created:', newMeal);
                              
                              // Call the callback directly
                              if (onLogFood && typeof onLogFood === 'function') {
                                onLogFood(newMeal);
                                console.log('Meal logged successfully!');
                              } else {
                                console.error('onLogFood callback is missing or not a function');
                                alert('Error: Cannot log meal. Please refresh the page.');
                              }
                            } catch (error) {
                              console.error('Error in Plus button click:', error);
                              alert('Error adding meal: ' + error.message);
                            }
                          }}
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            border: '2px solid rgba(34, 197, 94, 0.5)',
                            borderRadius: '10px',
                            padding: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            minWidth: '44px',
                            minHeight: '44px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.7)';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                            e.target.style.transform = 'scale(1)';
                          }}
                          title={`Add ${food.getName()} to your log`}
                        >
                          <Plus className="w-6 h-6" style={{ color: '#22c55e' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {!loading && Object.values(menuItemsByMeal).every(arr => arr.length === 0) && (
          <div className="preferences-card">
            <p className="recommendations-subtitle">No menu items available for {selectedDiningHall}</p>
          </div>
        )}
      </div>
    );
  };

  const LogScreen = () => {
    const [selectedHall, setSelectedHall] = useState(null);
    const [hallMenuItems, setHallMenuItems] = useState([]);
    const [loadingHallMenu, setLoadingHallMenu] = useState(false);
    
    const diningHalls = ["Berkshire", "Franklin", "Worcester", "Hampshire"];
    
    const handleHallSelect = async (hall) => {
      setSelectedHall(hall);
      setLoadingHallMenu(true);
      try {
        const items = await menuService.getMenu(hall);
        setHallMenuItems(items);
      } catch (error) {
        console.error('Error loading hall menu:', error);
      } finally {
        setLoadingHallMenu(false);
      }
    };
    
    return (
    <div className="space-y-6">
      <div className="log-header">
        <h2 className="log-title">Log a Meal</h2>


        <div className="log-options">
          <button className="log-option-btn blue">
            <Utensils className="log-option-icon blue" />
            <div className="log-option-label">Dining Hall</div>
          </button>
          <button className="log-option-btn green">
            <MapPin className="log-option-icon green" />
            <div className="log-option-label">Manual Entry</div>
          </button>
        </div>
      </div>

      <div className="nearby-card">
        <h3 className="nearby-title">Select a Dining Hall</h3>
        <div>
          {diningHalls.map((hall, idx) => (
            <button key={idx} className="dining-hall-btn" onClick={() => handleHallSelect(hall)}>
              <div className="dining-hall-info">
                <div className="dining-hall-name">{hall} Dining</div>
                <div className="dining-hall-meta">{(idx + 1) * 0.2} mi away · Open now</div>
              </div>
              <ChevronRight className="chevron-icon" />
            </button>
          ))}
        </div>
      </div>

      {selectedHall && (
        <div className="nearby-card">
          <h3 className="nearby-title">{selectedHall} Dining Menu</h3>
          {loadingHallMenu ? (
            <div className="recommendations-subtitle">Loading menu...</div>
          ) : hallMenuItems.length === 0 ? (
            <div className="recommendations-subtitle">No menu items available</div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {hallMenuItems.slice(0, 50).map((food, idx) => (
                <div key={idx} className="meal-item" style={{ cursor: 'pointer' }} onClick={() => {
                  // Handle food selection - could add to mealsToday
                  console.log('Selected food:', food.getName());
                }}>
                  <div className="meal-details">
                    <div className="meal-item-name">{food.getName()}</div>
                    <div className="meal-item-meta">
                      {food.getCategory()} · {food.getLocation()}
                      {food.getAllergens() && ` · Allergens: ${food.getAllergens()}`}
                    </div>
                  </div>
                  <div className="meal-calories">
                    <div className="meal-calories-value">{food.getCalories()}</div>
                    <div className="meal-calories-label">cal</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
  };

  const MealFeedbackModal = ({ meal, food, onSubmit, onClose }) => {
    const [ateMeal, setAteMeal] = useState(null);
    const [liked, setLiked] = useState(null);
    const [rating, setRating] = useState(0);

    const handleSubmit = () => {
      if (ateMeal === null) {
        console.warn('Cannot submit: ateMeal is null');
        alert('Please select whether you ate this meal first.');
        return;
      }
      
      console.log('MealFeedbackModal: Submitting feedback with:', { ateMeal, liked, rating });
      
      const feedbackData = {
        ate_meal: ateMeal,
        liked: liked,
        rating: rating > 0 ? rating : null
      };
      
      console.log('MealFeedbackModal: Calling onSubmit with:', feedbackData);
      console.log('MealFeedbackModal: onSubmit type:', typeof onSubmit);
      
      if (onSubmit && typeof onSubmit === 'function') {
        try {
          onSubmit(feedbackData);
        } catch (error) {
          console.error('Error in onSubmit callback:', error);
          alert('Error submitting feedback: ' + error.message);
        }
      } else {
        console.error('onSubmit is not a function or is missing');
        alert('Error: Cannot submit feedback. Please refresh the page.');
      }
    };

    return (
      <div 
        onClick={(e) => {
          // Close modal when clicking outside
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(30, 30, 30, 0.98)',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            How was {meal?.name || food?.name}?
          </h2>

          {/* Did you eat it? */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', opacity: 0.8 }}>
              Did you eat this meal?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setAteMeal(true)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `2px solid ${ateMeal === true ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'}`,
                  background: ateMeal === true ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Yes, I ate it
              </button>
              <button
                onClick={() => setAteMeal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `2px solid ${ateMeal === false ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                  background: ateMeal === false ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                No, I didn't
              </button>
            </div>
          </div>

          {/* If they ate it, ask if they liked it */}
          {ateMeal === true && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', opacity: 0.8 }}>
                  Did you like it?
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setLiked(true)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${liked === true ? '#22c55e' : 'rgba(255, 255, 255, 0.2)'}`,
                      background: liked === true ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ThumbsUp style={{ width: '18px', height: '18px' }} />
                    Loved it!
                  </button>
                  <button
                    onClick={() => setLiked(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${liked === false ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                      background: liked === false ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ThumbsDown style={{ width: '18px', height: '18px' }} />
                    Not for me
                  </button>
                </div>
              </div>

              {/* Star rating */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem', opacity: 0.8 }}>
                  Rate it (optional)
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <Star
                        style={{
                          width: '32px',
                          height: '32px',
                          fill: star <= rating ? '#fbbf24' : 'transparent',
                          stroke: star <= rating ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
                          strokeWidth: '2'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Submit buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Submit Feedback button clicked');
                console.log('Current state:', { ateMeal, liked, rating });
                handleSubmit();
              }}
              disabled={ateMeal === null}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: ateMeal === null 
                  ? 'rgba(147, 51, 234, 0.3)' 
                  : 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: ateMeal === null ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: ateMeal === null ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (ateMeal !== null) {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Submit Feedback
            </button>
          </div>

          <p style={{
            fontSize: '0.75rem',
            textAlign: 'center',
            marginTop: '1rem',
            opacity: 0.6
          }}>
            Your feedback helps us learn your preferences better!
          </p>
        </div>
      </div>
    );
  };

  const ProfileScreen = () => {
    return (
      <div>
        <h1>Profile</h1>
        <p>User preferences and insights will appear here.</p>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1 className="header-title">UMass AI Nutrition</h1>
        </div>
      </div>

      {/* Content */}
      <div className="content-container">
        {activeTab === 'home' && <HomeScreen onShowFeedback={handleShowFeedback} />}
        {activeTab === 'recommendations' && <RecommendationsScreen />}
        {activeTab === 'log' && <LogScreen />}
        {activeTab === 'menu' && <MenuScreen 
          onLogFood={(meal) => {
            setMealsToday(prev => [...prev, meal]);
            setCaloriesConsumed(prev => prev + meal.calories);
          }}
          onShowFeedback={handleShowFeedback}
          showFeedbackModal={showFeedbackModal}
          setShowFeedbackModal={setShowFeedbackModal}
          selectedMealForFeedback={selectedMealForFeedback}
          setSelectedMealForFeedback={setSelectedMealForFeedback}
          handleFeedback={handleFeedbackSubmit}
          caloriesConsumed={caloriesConsumed}
          caloriesTarget={caloriesTarget}
          mealsToday={mealsToday}
        />}
        {activeTab === 'profile' && <ProfileScreen />}

        {/* Global Feedback Modal */}
        {showFeedbackModal && selectedMealForFeedback && (
          <MealFeedbackModal
            meal={selectedMealForFeedback.meal}
            food={selectedMealForFeedback.food}
            onSubmit={handleFeedbackSubmit}
            onClose={() => {
              setShowFeedbackModal(false);
              setSelectedMealForFeedback(null);
            }}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <div className="nav-items">
            <button 
              onClick={() => setActiveTab('home')}
              className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
            >
              <Home className="nav-icon" />
              <span className="nav-label">Home</span>
            </button>
            <button 
              onClick={() => setActiveTab('recommendations')}
              className={`nav-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
            >
              <Utensils className="nav-icon" />
              <span className="nav-label">For You</span>
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className="camera-btn"
            >
              <div className="camera-btn-circle">
                <Camera className="camera-btn-icon" />
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('menu')}
              className={`nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
            >
              <Utensils className="nav-icon" />
              <span className="nav-label">Menu</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <User className="nav-icon" />
              <span className="nav-label">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieCounterApp;