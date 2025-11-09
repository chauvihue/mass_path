from flask import Flask, jsonify
from learning import value_iteration, simulate_day, MENU, infer_user_preferences_from_logs
from flask import request
from flask_cors import CORS
from flask_cors import cross_origin
from scraping import scrape_multiple_tids, DEFAULT_HALLS, mmddyyyy_from_date, filter_menu_by_hall
from rl_recommender import MealRecommenderBandit, calculate_reward, cold_start_recommendations
import json
import os
from datetime import datetime
from cal import calculate_daily_calories

# === Supabase imports and setup ===
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client("https://zyuztgytwxvcefawswlq.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXp0Z3l0d3h2Y2VmYXdzd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTYwOTIsImV4cCI6MjA3ODE5MjA5Mn0.gdlyHnsULbjPmVShlJ96quU4BwnkHvTVJdNpTfqR2Q8")

# === SQLAlchemy PostgreSQL setup ===
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
# If DATABASE_URL is not set, fall back to a local sqlite DB to avoid
# passing None to create_engine which raises: ArgumentError: Expected string or URL object, got None
if not DATABASE_URL:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    fallback_db = os.path.join(backend_dir, 'dev.db')
    DATABASE_URL = f"sqlite:///{fallback_db}"
    print(f"WARNING: DATABASE_URL environment variable is not set. Falling back to SQLite DB at {fallback_db}")

# For sqlite we need a specific connect_args
create_kwargs = {}
if DATABASE_URL.startswith("sqlite:"):
    create_kwargs = {"connect_args": {"check_same_thread": False}}

engine = create_engine(DATABASE_URL, **create_kwargs)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# RL Model storage directory
USER_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'user_models')
os.makedirs(USER_MODELS_DIR, exist_ok=True)

def check_and_update_menu(dining_hall: str, json_file: str = 'umass_menu_parsed.json') -> bool:
    """
    Check if the menu date for the specified dining hall matches today's date.
    If not, scrape the menu for today and update the JSON file.
    
    Parameters:
        dining_hall (str): Name of the dining hall (e.g., 'Berkshire', 'Franklin', 'Worcester', 'Hampshire')
        json_file (str): Path to the JSON file containing menu data. Defaults to 'umass_menu_parsed.json'.
    
    Returns:
        bool: True if the menu is up to date (or was successfully updated), False otherwise.
    """
    today = mmddyyyy_from_date(datetime.now())
    
    # Validate dining hall name
    if dining_hall not in DEFAULT_HALLS:
        raise ValueError(f"Invalid dining hall: {dining_hall}. Must be one of: {list(DEFAULT_HALLS.keys())}")
    
    # Ensure JSON file path is relative to the backend directory
    if not os.path.isabs(json_file):
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        json_file = os.path.join(backend_dir, json_file)
    
    # Check if JSON file exists and read current data
    current_data = {}
    if os.path.exists(json_file):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                current_data = json.load(f)
        except Exception as e:
            print(f"Error reading {json_file}: {e}")
            current_data = {}
    
    # Check if the dining hall's date matches today
    hall_data = current_data.get(dining_hall, {})
    hall_date = hall_data.get("date")
    
    if hall_date == today:
        # Menu is up to date
        return True
    
    # Menu is not up to date, need to scrape
    print(f"Menu for {dining_hall} is outdated (date: {hall_date}, today: {today}). Scraping...")
    
    try:
        # Scrape menu for the specific dining hall for today
        tids_map = {dining_hall: DEFAULT_HALLS[dining_hall]}
        scraped_data = scrape_multiple_tids(tids_map, today, verbose=False)
        
        # Update the current data with the new scraped data
        current_data.update(scraped_data)
        
        # Save updated data back to JSON file
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(current_data, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully updated menu for {dining_hall}")
        return True
        
    except Exception as e:
        print(f"Error scraping menu for {dining_hall}: {e}")
        return False


@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to the UMass Dining Menu API",
        "endpoints": {
            "/": "This welcome message",
            "/menu/<dining_hall>": "Get UMass Dining menu for a specific dining hall (e.g., /menu/Berkshire)",
            "/menu/all": "Get UMass Dining menu from all locations",
            "/health": "Health check endpoint"
        },
        "available_dining_halls": list(DEFAULT_HALLS.keys())
    })

@app.route('/menu/<dining_hall>', methods=['GET'])
def get_menu(dining_hall: str):
    """Endpoint to fetch UMass Dining menu for a specific dining hall"""
    try:
        # Ensure menu is up to date before returning
        check_and_update_menu(dining_hall)
        
        # Read and return the menu data
        json_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'umass_menu_parsed.json')
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        hall_data = data.get(dining_hall, {})
        
        # Filter menu to ensure categories belong to the correct dining hall
        # This fixes cases where categories from other halls appear in the wrong place
        if isinstance(hall_data, dict) and "menu" in hall_data:
            hall_data["menu"] = filter_menu_by_hall(hall_data["menu"], dining_hall, verbose=False)
        
        return jsonify({
            "success": True,
            "data": hall_data
        })
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "available_halls": list(DEFAULT_HALLS.keys())
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/menu/all', methods=['GET'])
def get_menu_all():
    """Endpoint to fetch UMass Dining menu from all locations"""
    try:
        # Check and update all dining halls
        for hall_name in DEFAULT_HALLS.keys():
            check_and_update_menu(hall_name)
        
        # Read and return all menu data
        json_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'umass_menu_parsed.json')
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Filter each dining hall's menu to ensure categories belong to the correct hall
        for hall_name, hall_data in data.items():
            if isinstance(hall_data, dict) and "menu" in hall_data:
                hall_data["menu"] = filter_menu_by_hall(hall_data["menu"], hall_name, verbose=False)
        
        return jsonify({
            "success": True,
            "data": data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# Meal Recommendation Endpoint
@app.route('/recommend/<dining_hall>', methods=['GET'])
def recommend_meal(dining_hall: str):
    """
    Recommend an optimal meal item from the given dining hall
    based on calorie goals and the learned MDP policy.
    """
    try:
        check_and_update_menu(dining_hall)

        # Load MDP policy
        _, policy = value_iteration()

        # Read remaining calories from query params (default = 2000)
        remaining = int(request.args.get('remaining', 2000))
        remaining = int(round(remaining / 100) * 100)
        remaining = min(max(remaining, 0), 2000)

        # Get recommendation
        recommended_item = policy.get(remaining, 'salad')
        calories = MENU[recommended_item]

        return jsonify({
            "success": True,
            "recommendation": {
                "item": recommended_item,
                "calories": calories,
                "remaining_input": remaining,
                "dining_hall": dining_hall
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# Daily Simulation Endpoint
@app.route('/simulate_day', methods=['GET'])
def simulate_day_endpoint():
    """
    Simulate a full day (breakfast, lunch, dinner) following the learned policy.
    """
    try:
        _, policy = value_iteration()
        total_reward, log = simulate_day(policy)

        return jsonify({
            "success": True,
            "total_reward": total_reward,
            "simulation_log": [
                {
                    "meal": meal,
                    "item": item,
                    "calories": cal,
                    "remaining_before": rem,
                    "reward": r
                }
                for meal, item, cal, rem, r in log
            ]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500



@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})


@app.route('/api/profile/calculate-calories', methods=['POST'])
@cross_origin()
def calculate_calories_endpoint():
    """Calculate daily calories from posted profile data and optionally persist to Supabase

    Expected JSON body:
    {
      "height_in": float,
      "weight_lb": float,
      "gender": "male"|"female",
      "age": int,
      "activity_level": string,
      "user_id": "optional user id"
    }
    """
    try:
        payload = request.get_json(force=True)
        print("Received profile data:", payload)
        
        # basic validation
        height_in = float(payload.get('height_in'))
        weight_lb = float(payload.get('weight_lb'))
        gender = str(payload.get('gender'))
        age = int(payload.get('age'))
        activity_level = str(payload.get('activity_level'))
        
        print("Validated values:", {
            'height_in': height_in,
            'weight_lb': weight_lb,
            'gender': gender,
            'age': age,
            'activity_level': activity_level
        })

        daily_calories = calculate_daily_calories(
            height_in=height_in,
            weight_lb=weight_lb,
            gender=gender,
            age=age,
            activity_level=activity_level
        )
        
        print("Calculated calories (raw):", daily_calories)
        rounded = int(round(daily_calories))
        print("Rounded calories:", rounded)

        # If a user_id is supplied, attempt to persist to Supabase user_preferences
        user_id = payload.get('user_id')
        if user_id:
            try:
                prefs = {
                    'typical_meal_calories': rounded,
                    'favorite_cuisines': payload.get('favorite_cuisines', []),
                    'favorite_stations': payload.get('favorite_stations', []),
                    'favorite_dining_halls': payload.get('favorite_dining_halls', [])
                }
                update_user_preferences_in_supabase(user_id, preferences=prefs)
            except Exception as e:
                # non-fatal: log and continue
                print(f"Warning: could not persist profile for user {user_id}: {e}")

        return jsonify({
            'daily_calories': rounded,
            'profile': {
                'height_in': height_in,
                'weight_lb': weight_lb,
                'gender': gender,
                'age': age,
                'activity_level': activity_level
            },
            'message': 'Profile processed successfully'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/profile/calories', methods=['GET'])
def get_daily_calories_endpoint():
    """Return the stored daily calories for a user if user_id provided, otherwise return default placeholder."""
    try:
        user_id = request.args.get('user_id')
        if user_id:
            try:
                resp = supabase.table('user_preferences').select('typical_meal_calories').eq('user_id', user_id).execute()
                if resp and getattr(resp, 'data', None):
                    # resp.data is typically a list of rows
                    row = resp.data[0]
                    calories = row.get('typical_meal_calories')
                    if calories is not None:
                        return jsonify({'daily_calories': int(calories)})
            except Exception as e:
                print(f"Warning: error reading calories from Supabase for user {user_id}: {e}")

        # Fallback default
        return jsonify({'daily_calories': 2000})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== RL Recommendation Endpoints ==========

def get_user_model_path(user_id: str) -> str:
    """Get file path for user's RL model."""
    return os.path.join(USER_MODELS_DIR, f"{user_id}_model.json")


def load_user_model(user_id: str) -> MealRecommenderBandit:
    """Load user's RL model from disk, or create new one if doesn't exist."""
    model_path = get_user_model_path(user_id)
    if os.path.exists(model_path):
        try:
            return MealRecommenderBandit.load(model_path)
        except Exception as e:
            print(f"Error loading model for user {user_id}: {e}")
    
    # Create new model
    return MealRecommenderBandit(user_id=user_id)


def save_user_model(bandit: MealRecommenderBandit):
    """Save user's RL model to disk."""
    model_path = get_user_model_path(bandit.user_id)
    bandit.save(model_path)


# === Supabase user preference update ===
def update_user_preferences_in_supabase(user_id: str, meal: dict = None, feedback: dict = None, preferences: dict = None):
    """
    Update the user's preferences in Supabase.
    - If `preferences` is provided, upsert those fields directly.
    - Otherwise falls back to updating/creating based on a logged meal + feedback.
    """
    try:
        table = supabase.table("user_preferences")

        if preferences is not None:
            # Normalize fields we care about
            payload = {
                "user_id": user_id,
                "favorite_cuisines": preferences.get("favorite_cuisines", []),
                "favorite_stations": preferences.get("favorite_stations", []),
                "favorite_dining_halls": preferences.get("favorite_dining_halls", []),
                "typical_meal_calories": preferences.get("typical_meal_calories", None),
                "protein_preference": preferences.get("protein_preference", None),
                "meals_logged": preferences.get("meals_logged", 0)
            }
            # Try upsert by user_id (create or update)
            try:
                existing = table.select("*").eq("user_id", user_id).execute()
                if existing.data:
                    table.update(payload).eq("user_id", user_id).execute()
                else:
                    table.insert(payload).execute()
                print(f"✅ Upserted preferences for {user_id} to Supabase")
            except Exception as e:
                print(f"⚠️ Supabase upsert failed for preferences: {e}")
            return

        # Fallback: update based on meal + feedback (existing behavior)
        meal = meal or {}
        feedback = feedback or {}

        meal_name = meal.get("name", "")
        liked = feedback.get("liked", False)
        rating = feedback.get("rating", 0)

        existing = table.select("*").eq("user_id", user_id).execute()
        if existing.data:
            current = existing.data[0]
            total_logged = current.get("meals_logged", 0) + 1
            avg_rating = (
                (current.get("avg_rating", 0) * current.get("meals_logged", 0) + rating)
                / total_logged
            )
            favorites = current.get("favorite_meals", [])
            if liked and meal_name and meal_name not in favorites:
                favorites.append(meal_name)

            table.update({
                "meals_logged": total_logged,
                "avg_rating": avg_rating,
                "favorite_meals": favorites,
                "last_logged_meal": meal_name,
            }).eq("user_id", user_id).execute()
        else:
            table.insert({
                "user_id": user_id,
                "meals_logged": 1,
                "avg_rating": rating,
                "favorite_meals": [meal_name] if liked and meal_name else [],
                "last_logged_meal": meal_name,
            }).execute()

        print(f"✅ Updated Supabase preferences for {user_id}")

    except Exception as e:
        print(f"⚠️ Failed to update Supabase preferences: {e}")

def menu_item_to_meal_dict(food_item, dining_hall: str) -> dict:
    """Convert menu item to meal dictionary for RL system."""
    # Extract nutrition info
    calories = food_item.get('calories', 0)
    protein = food_item.get('protein', 0)
    carbs = food_item.get('carbs', 0)
    fat = food_item.get('fat', 0)
    
    # Try to get from raw_attrs if available
    if 'raw_attrs' in food_item:
        raw_attrs = food_item['raw_attrs']
        calories = float(raw_attrs.get('data-calories', calories))
        protein = float(raw_attrs.get('data-protein', protein).replace('g', '').strip() or 0)
        carbs = float(raw_attrs.get('data-total-carb', carbs).replace('g', '').strip() or 0)
        fat = float(raw_attrs.get('data-total-fat', fat).replace('g', '').strip() or 0)
    
    return {
        'id': food_item.get('name', '').lower().replace(' ', '_'),
        'name': food_item.get('name', ''),
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'location': dining_hall,
        'category': food_item.get('category', ''),
        'station': food_item.get('category', ''),
        'allergens': food_item.get('allergens', ''),
        'clean_diet': food_item.get('clean_diet', ''),
        'ingredients': food_item.get('ingredients', ''),
        'cuisine_type': food_item.get('cuisine_type', ''),
        'meal_period': food_item.get('mealPeriod', '')
    }


def get_available_meals_from_menu(menu_data: dict, dining_location: str = None, time_of_day: str = None) -> list:
    """Extract available meals from menu data."""
    meals = []
    
    if not menu_data or 'menu' not in menu_data:
        return meals
    
    menu = menu_data['menu']
    dining_hall = menu_data.get('dining_hall', dining_location or '')
    
    # Determine meal period
    current_hour = datetime.now().hour
    if time_of_day:
        meal_period = time_of_day
    elif current_hour < 11:
        meal_period = 'breakfast'
    elif current_hour < 15:
        meal_period = 'lunch'
    elif current_hour < 21:
        meal_period = 'dinner'
    else:
        meal_period = 'midnight'
    
    # Extract meals from menu structure
    if meal_period in menu:
        period_data = menu[meal_period]
        for category, items in period_data.items():
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and item.get('name'):
                        meal_dict = menu_item_to_meal_dict(item, dining_hall)
                        meal_dict['meal_period'] = meal_period
                        meals.append(meal_dict)
            elif isinstance(items, dict):
                # Handle nested structure
                if 'items' in items:
                    for item in items['items']:
                        if isinstance(item, dict) and item.get('name'):
                            meal_dict = menu_item_to_meal_dict(item, dining_hall)
                            meal_dict['meal_period'] = meal_period
                            meals.append(meal_dict)
    
    # Also check other meal periods if needed
    for period in ['breakfast', 'lunch', 'dinner', 'midnight']:
        if period != meal_period and period in menu:
            period_data = menu[period]
            for category, items in period_data.items():
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict) and item.get('name'):
                            meal_dict = menu_item_to_meal_dict(item, dining_hall)
                            meal_dict['meal_period'] = period
                            meals.append(meal_dict)
    
    return meals


@app.route('/api/rl/recommend', methods=['POST'])
def get_rl_recommendations():
    """
    Get personalized meal recommendations using RL.
    Expected JSON body:
    {
        "user_id": "user123",
        "user_state": {
            "time_of_day": "lunch",
            "calories_today": 500,
            "calorie_budget": 2200,
            "macros_today": {"protein": 30, "carbs": 50, "fat": 20},
            "protein_goal": 100,
            "carbs_goal": 200,
            "fat_goal": 70,
            "dietary_restrictions": [],
            "allergens": [],
            "favorite_cuisines": [],
            "favorite_dining_halls": [],
            "recent_meals": [],
            "high_protein_goal": false
        },
        "n_recommendations": 5,
        "dining_location": null
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        user_state = data.get('user_state', {})
        n_recommendations = data.get('n_recommendations', 5)
        dining_location = data.get('dining_location')
        
        # Load or create user model
        bandit = load_user_model(user_id)
        
        # Get available meals
        if dining_location:
            # Get menu for specific location
            check_and_update_menu(dining_location)
            json_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'umass_menu_parsed.json')
            with open(json_file, 'r', encoding='utf-8') as f:
                menu_data = json.load(f)
            hall_data = menu_data.get(dining_location, {})
            available_meals = get_available_meals_from_menu(hall_data, dining_location, user_state.get('time_of_day'))
        else:
            # Get menus from all locations
            check_and_update_menu('Berkshire')  # Update at least one
            json_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'umass_menu_parsed.json')
            with open(json_file, 'r', encoding='utf-8') as f:
                menu_data = json.load(f)
            available_meals = []
            for hall_name, hall_data in menu_data.items():
                meals = get_available_meals_from_menu(hall_data, hall_name, user_state.get('time_of_day'))
                available_meals.extend(meals)
        
        if not available_meals:
            return jsonify({
                "success": False,
                "error": "No meals available"
            }), 400
        
        # Get recommendations
        if bandit.preferences['meals_logged'] == 0:
            # Cold start
            recommendations = cold_start_recommendations(user_state, available_meals, n_recommendations)
        else:
            recommendations = bandit.recommend_meals(user_state, available_meals, n_recommendations)
        
        # Save model (in case preferences were updated)
        save_user_model(bandit)

        # Persist current learned preferences to Supabase (if available)
        try:
            update_user_preferences_in_supabase(user_id, preferences=bandit.preferences)
        except Exception as e:
            print(f"Warning: failed to persist preferences to Supabase: {e}")

        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "model_trained": bandit.is_trained,
            "meals_logged": bandit.preferences.get('meals_logged', 0)
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/rl/feedback', methods=['POST'])
def submit_rl_feedback():
    """
    Submit feedback on a recommended meal.
    Expected JSON body:
    {
        "user_id": "user123",
        "meal_id": "meal_123",
        "meal": {
            "name": "Grilled Chicken",
            "calories": 400,
            ...
        },
        "user_state": {
            ...
        },
        "ate_meal": true,
        "liked": true,
        "rating": 5
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        meal = data.get('meal', {})
        user_state = data.get('user_state', {})
        feedback = {
            'ate_meal': data.get('ate_meal', False),
            'liked': data.get('liked'),
            'rating': data.get('rating', 0)
        }
        
        # Log feedback immediately to a fallback file so feedback isn't lost
        feedback_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'meal': meal,
            'user_state': user_state,
            'feedback': feedback
        }
        try:
            feedback_log = os.path.join(USER_MODELS_DIR, 'feedback_log.json')
            existing = []
            if os.path.exists(feedback_log):
                try:
                    with open(feedback_log, 'r', encoding='utf-8') as f:
                        existing = json.load(f)
                except Exception:
                    existing = []
            existing.append(feedback_entry)
            with open(feedback_log, 'w', encoding='utf-8') as f:
                json.dump(existing, f, indent=2)
        except Exception as e:
            print(f"Warning: failed to write feedback_log.json: {e}")

        # Load user model and try to update it; if the model errors, record a warning
        model_warning = None
        reward = calculate_reward(feedback, user_state, meal)
        try:
            bandit = load_user_model(user_id)
            bandit.update(user_state, meal, reward)
            bandit.decay_epsilon()
            save_user_model(bandit)
            update_user_preferences_in_supabase(user_id, meal, feedback)
        except Exception as e:
            import traceback
            traceback.print_exc()
            model_warning = str(e)

        # Return success (feedback was logged). Include model_warning if training/save failed.
        response = {
            "success": True,
            "reward": float(reward),
            "message": "Feedback recorded"
        }
        if model_warning:
            response['model_warning'] = model_warning
        return jsonify(response)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# === Infer Preferences Endpoint ===
@app.route('/api/rl/infer_preferences', methods=['POST'])
def infer_preferences_endpoint():
    """
    Infer user preferences from their logged foods and update Supabase.
    Expected JSON body:
    {
        "user_id": "user123",
        "logged_foods": ["burger", "omelette", "salad"]
    }
    """
    try:
        data = request.get_json()
        user_id = data.get("user_id", "default_user")
        logged_foods = data.get("logged_foods", [])

        inferred_preferences = infer_user_preferences_from_logs(logged_foods)

        # Save inferred preferences to Supabase
        try:
            supabase.table("user_preferences").update({
                "inferred_preferences": inferred_preferences
            }).eq("user_id", user_id).execute()
        except Exception:
            # If user doesn't exist yet, insert instead
            supabase.table("user_preferences").insert({
                "user_id": user_id,
                "inferred_preferences": inferred_preferences
            }).execute()

        return jsonify({
            "success": True,
            "inferred_preferences": inferred_preferences
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/rl/user-insights/<user_id>', methods=['GET'])
def get_user_insights(user_id: str):
    """Get insights about user's learned preferences."""
    try:
        bandit = load_user_model(user_id)
        insights = bandit.get_insights()
        
        return jsonify({
            "success": True,
            "insights": insights
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)


# === PostgreSQL DB test endpoint ===
@app.route('/api/db/test', methods=['GET'])
def test_db():
    """Simple test to verify PostgreSQL connection."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM user_preferences"))
            count = result.scalar()
            return jsonify({"success": True, "user_preferences_rows": count})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

