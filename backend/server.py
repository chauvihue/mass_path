from flask import Flask, jsonify
from flask_cors import CORS
from scraping import scrape_umass_menu, scrape_umass_menu_simple
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

def is_berkshire_menu_today():
    """
    Returns True if the 'date' field for Berkshire in umass_menu_parsed.json
    matches today's date (MM/DD/YYYY), False otherwise.
    """
    try:
        with open('umass_menu_parsed.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        berkshire_date = data.get("Berkshire", {}).get("date")
        today = datetime.now().strftime("%m/%d/%Y")
        return berkshire_date == today
    except Exception as e:
        # Could log e if needed
        return False


@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to the UMass Dining Menu API",
        "endpoints": {
            "/": "This welcome message",
            "/menu": "Get UMass Dining menu data (simple)",
            "/menu/all": "Get UMass Dining menu from all locations",
            "/health": "Health check endpoint"
        }
    })

@app.route('/menu', methods=['GET'])
def get_menu():
    """Endpoint to fetch UMass Dining menu (simple version)"""
    try:
        menu_data = scrape_umass_menu_simple()
        return jsonify({
            "success": True,
            "data": menu_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/menu/all', methods=['GET'])
def get_menu_all():
    """Endpoint to fetch UMass Dining menu from all locations"""
    try:
        menu_data = scrape_umass_menu()
        return jsonify({
            "success": True,
            "data": menu_data
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

