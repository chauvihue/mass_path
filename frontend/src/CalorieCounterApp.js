import React, { useState, useEffect, useMemo } from 'react';
import { Camera, TrendingUp, MapPin, ThumbsUp, ThumbsDown, Calendar, Home, User, Utensils, ChevronRight, Clock, Flame, Award, Plus } from 'lucide-react';
import './CalorieCounterAPpp.css';
import Menu from './Menu';
import Food from './Food';

import supabase from './supabase';
import Login from './Login';

const CalorieCounterApp = () => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoadingUser(false);
    });

    // Listen for auth state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState('home');
  const [caloriesConsumed, setCaloriesConsumed] = useState(1450);
  const caloriesTarget = 2200;
  const progress = (caloriesConsumed / caloriesTarget) * 100;
  const [menuItems, setMenuItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mealsToday, setMealsToday] = useState([
    { name: "Breakfast Bowl", calories: 420, time: "8:30 AM", rating: "liked", location: "Worcester" },
    { name: "Chicken Salad", calories: 380, time: "12:45 PM", rating: "liked", location: "Franklin" },
    { name: "Protein Smoothie", calories: 250, time: "3:15 PM", rating: null, location: "Blue Wall" },
    { name: "Pasta Primavera", calories: 400, time: "6:20 PM", rating: null, location: "Hampshire" }
  ]);
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

  // Conditional rendering after hooks
  if (loadingUser) {
    return <div>Loading user...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const HomeScreen = () => (
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
            <div className="macro-value">132g</div>
            <div className="macro-label">Protein</div>
          </div>
          <div className="macro-item">
            <div className="macro-value">165g</div>
            <div className="macro-label">Carbs</div>
          </div>
          <div className="macro-item">
            <div className="macro-value">48g</div>
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

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <Award className="stat-icon" />
          <div className="stat-value">12</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card orange">
          <TrendingUp className="stat-icon" />
          <div className="stat-value">4</div>
          <div className="stat-label">Meals Logged</div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="meals-card">
        <h3 className="meals-title">Today's Meals</h3>
        <div>
          {mealsToday.map((meal, idx) => (
            <div key={idx} className="meal-item">
              <div className="meal-details">
                <div className="meal-item-name">{meal.name}</div>
                <div className="meal-item-meta">{meal.time} · {meal.location}</div>
              </div>
              <div className="meal-calories">
                <div className="meal-calories-value">{meal.calories}</div>
                <div className="meal-calories-label">cal</div>
              </div>
              {meal.rating === 'liked' ? (
                <ThumbsUp className="rating-btn active" />
              ) : (
                <div className="rating-buttons">
                  <ThumbsUp className="rating-btn" />
                  <ThumbsDown className="rating-btn" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
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
            <button className="select-btn">Select</button>
          </div>
        </div>
      ))
      )}
    </div>
  );
  };

  const MenuScreen = ({ onLogFood }) => {
    const [selectedDiningHall, setSelectedDiningHall] = useState('Berkshire');
    const [menuItemsByMeal, setMenuItemsByMeal] = useState({
      breakfast: [],
      lunch: [],
      dinner: [],
      midnight: []
    });
    const [loading, setLoading] = useState(false);

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

    const handleLogFood = (food) => {
      // Add food to mealsToday and update calories
      const newMeal = {
        name: food.getName(),
        calories: food.getCalories(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        rating: null,
        location: food.getLocation() || selectedDiningHall,
        protein: Math.round(food.getProtein()),
        carbs: Math.round(food.getCarbs()),
        fat: Math.round(food.getFat())
      };
      
      // Update calories consumed via callback
      if (onLogFood) {
        onLogFood(newMeal);
      }
      
      console.log('Logged food:', newMeal);
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
                          onClick={() => handleLogFood(food)}
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
        
        <button className="photo-btn">
          <Camera className="photo-icon" />
          <div className="photo-title">Take Photo</div>
          <div className="photo-subtitle">AI will recognize your meal</div>
        </button>

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

  const ProfileScreen = () => {
    return (
      <div>
        <h1>Profile</h1>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
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
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'recommendations' && <RecommendationsScreen />}
        {activeTab === 'log' && <LogScreen />}
        {activeTab === 'menu' && <MenuScreen onLogFood={(meal) => {
          setMealsToday(prev => [...prev, meal]);
          setCaloriesConsumed(prev => prev + meal.calories);
        }} />}
        {activeTab === 'profile' && <ProfileScreen />}
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