import React, { useState } from 'react';
import { Camera, TrendingUp, MapPin, ThumbsUp, ThumbsDown, Calendar, Home, User, Utensils, ChevronRight, Clock, Flame, Award } from 'lucide-react';
import './CalorieCounterAPpp.css';

const CalorieCounterApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [caloriesConsumed, setCaloriesConsumed] = useState(1450);
  const caloriesTarget = 2200;
  const progress = (caloriesConsumed / caloriesTarget) * 100;

  const mealsToday = [
    { name: "Breakfast Bowl", calories: 420, time: "8:30 AM", rating: "liked", location: "Worcester" },
    { name: "Chicken Salad", calories: 380, time: "12:45 PM", rating: "liked", location: "Franklin" },
    { name: "Protein Smoothie", calories: 250, time: "3:15 PM", rating: null, location: "Blue Wall" },
    { name: "Pasta Primavera", calories: 400, time: "6:20 PM", rating: null, location: "Hampshire" }
  ];

  const recommendations = [
    {
      name: "Grilled Salmon Bowl",
      calories: 520,
      protein: 45,
      carbs: 38,
      fat: 18,
      location: "Worcester Dining",
      distance: "0.2 mi",
      matchScore: 95,
      tags: ["High Protein", "You love fish", "Balanced"],
      available: "Until 8:00 PM"
    },
    {
      name: "Vegetarian Stir-Fry",
      calories: 380,
      protein: 22,
      carbs: 52,
      fat: 12,
      location: "Franklin Dining",
      distance: "0.4 mi",
      matchScore: 88,
      tags: ["Light", "Quick option", "Fresh"],
      available: "Until 8:30 PM"
    },
    {
      name: "Turkey & Avocado Wrap",
      calories: 450,
      protein: 35,
      carbs: 42,
      fat: 16,
      location: "Hampshire Dining",
      distance: "0.6 mi",
      matchScore: 82,
      tags: ["Grab & Go", "Balanced", "Filling"],
      available: "Until 9:00 PM"
    }
  ];

  const insights = [
    { label: "Protein Preference", value: 85, color: "blue" },
    { label: "Vegetable Variety", value: 72, color: "green" },
    { label: "Spice Tolerance", value: 60, color: "orange" },
    { label: "Portion Consistency", value: 90, color: "purple" }
  ];

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
      <div className="ai-suggestion-card">
        <div className="ai-suggestion-header">
          <div className="ai-icon">
            <Utensils />
          </div>
          <h3 className="ai-title">AI suggests for dinner</h3>
          <span className="match-badge">95% match</span>
        </div>
        
        <div className="meal-highlight">
          <h4 className="meal-name">Grilled Salmon Bowl</h4>
          <div className="meal-info">
            <span className="meal-info-item">
              <Flame className="w-4 h-4" /> 520 cal
            </span>
            <span className="meal-info-item">
              <MapPin className="w-4 h-4" /> Worcester (0.2 mi)
            </span>
            <span className="meal-info-item">
              <Clock className="w-4 h-4" /> Until 8:00 PM
            </span>
          </div>
          <div className="meal-tags">
            <span className="tag">High Protein</span>
            <span className="tag">You love fish</span>
            <span className="tag">Balanced</span>
          </div>
        </div>
        
        <button className="view-menu-btn">
          View Full Menu
        </button>
      </div>

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

  const RecommendationsScreen = () => (
    <div className="space-y-4">
      <div className="recommendations-header">
        <h2 className="recommendations-title">For You</h2>
        <p className="recommendations-subtitle">Personalized meals based on your preferences</p>
        
        <div className="filter-buttons">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">High Protein</button>
          <button className="filter-btn">Vegetarian</button>
          <button className="filter-btn">Quick Options</button>
        </div>
      </div>

      {recommendations.map((rec, idx) => (
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
      ))}
    </div>
  );

  const InsightsScreen = () => (
    <div className="space-y-6">
      <div className="insights-header">
        <h2 className="insights-title">AI Learning Insights</h2>
        <p className="insights-subtitle">What I've learned about your preferences</p>
      </div>

      <div className="preferences-card">
        <h3 className="preferences-title">Taste Preferences</h3>
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="preference-item">
              <div className="preference-header">
                <span className="preference-label">{insight.label}</span>
                <span className="preference-value">{insight.value}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${insight.color}`}
                  style={{ width: `${insight.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="preferences-card">
        <h3 className="preferences-title">Eating Patterns</h3>
        <div className="space-y-4">
          <div className="pattern-card blue">
            <div className="pattern-info">
              <div className="pattern-title">Peak Meal Time</div>
              <div className="pattern-description">You eat most between 12-2 PM</div>
            </div>
            <Clock className="pattern-icon blue" />
          </div>
          <div className="pattern-card green">
            <div className="pattern-info">
              <div className="pattern-title">Favorite Location</div>
              <div className="pattern-description">Worcester Dining Hall (42% of meals)</div>
            </div>
            <MapPin className="pattern-icon green" />
          </div>
          <div className="pattern-card orange">
            <div className="pattern-info">
              <div className="pattern-title">Protein Focus</div>
              <div className="pattern-description">You prefer high-protein options</div>
            </div>
            <TrendingUp className="pattern-icon orange" />
          </div>
        </div>
      </div>

      <div className="preferences-card">
        <h3 className="preferences-title">Foods You Love</h3>
        <div className="foods-grid">
          {["Salmon", "Chicken Breast", "Greek Yogurt", "Avocado", "Brown Rice", "Broccoli"].map((food, idx) => (
            <div key={idx} className="food-item">{food}</div>
          ))}
        </div>
      </div>
    </div>
  );

  const LogScreen = () => (
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
        <h3 className="nearby-title">Quick Add from Nearby</h3>
        <div>
          {["Worcester Dining", "Franklin Dining", "Hampshire Dining"].map((hall, idx) => (
            <button key={idx} className="dining-hall-btn">
              <div className="dining-hall-info">
                <div className="dining-hall-name">{hall}</div>
                <div className="dining-hall-meta">{(idx + 1) * 0.2} mi away · Open now</div>
              </div>
              <ChevronRight className="chevron-icon" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

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
        {activeTab === 'insights' && <InsightsScreen />}
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
              onClick={() => setActiveTab('insights')}
              className={`nav-btn ${activeTab === 'insights' ? 'active' : ''}`}
            >
              <TrendingUp className="nav-icon" />
              <span className="nav-label">Insights</span>
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