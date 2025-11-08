from flask import Flask, jsonify
from learning import value_iteration, simulate_day, MENU
from flask import request
from flask_cors import CORS
from scraping import scrape_multiple_tids, DEFAULT_HALLS, mmddyyyy_from_date
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)

