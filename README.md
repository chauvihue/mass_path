<div align="center">

# `MassPath` ⚡

**Intelligent meal recommendations for UMass dining halls powered by reinforcement learning**

<!-- ![App Screenshot](readme_assets/app_screenshot.png) -->

</div>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/Lucide%20React-000000?style=flat-square&logo=lucide&logoColor=white" alt="Lucide React"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Flask-3.0.0-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask"/>
  <img src="https://img.shields.io/badge/NumPy-1.24.3-013243?style=flat-square&logo=numpy&logoColor=white" alt="NumPy"/>
  <img src="https://img.shields.io/badge/scikit--learn-1.3.2-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" alt="scikit-learn"/>
  <img src="https://img.shields.io/badge/BeautifulSoup4-4.12.2-000000?style=flat-square&logo=python&logoColor=white" alt="BeautifulSoup4"/>
  <img src="https://img.shields.io/badge/Requests-2.31.0-000000?style=flat-square&logo=python&logoColor=white" alt="Requests"/>
</p>


---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Technologies](#technologies)
<!-- - [Roadmap](#roadmap) -->
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Overview

**MassPath** is an intelligent meal recommendation and calorie tracking system designed specifically for UMass Amherst students. The application solves the daily challenge of choosing nutritious and satisfying meals from the university's dining halls by leveraging advanced machine learning techniques, including reinforcement learning and Markov Decision Processes (MDPs).

The core functionality revolves around providing personalized meal recommendations based on individual user preferences, dietary goals, and nutritional requirements. Users can track their daily calorie intake, set macro targets, and receive AI-powered suggestions that adapt over time as the system learns their preferences through feedback.

The application features a modern React.js frontend that provides an intuitive user interface for browsing menus, logging meals, and receiving recommendations. The backend is built with Flask and Python, implementing a sophisticated reinforcement learning system using multi-armed bandit algorithms and Random Forest regression to predict meal satisfaction. The system automatically scrapes real-time menu data from UMass dining halls (Berkshire, Franklin, Worcester, and Hampshire) and processes nutritional information to deliver context-aware recommendations.

---

## Features

**Real-Time Menu Scraping**: Automatically fetches and updates daily menus from all UMass dining halls (Berkshire, Franklin, Worcester, Hampshire) with nutritional information, allergens, and dietary tags.

**Calorie & Macro Tracking**: Comprehensive daily nutrition tracking with visual progress indicators, allowing users to monitor calories, protein, carbs, and fat consumption against personalized goals.

**AI-Powered Recommendations**: Contextual multi-armed bandit system that learns user preferences over time, providing personalized meal suggestions based on time of day, remaining calorie budget, macro goals, and dietary restrictions.

**Reinforcement Learning Engine**: Advanced RL system using epsilon-greedy exploration with Random Forest regression to predict meal satisfaction, continuously improving recommendations through user feedback.

**MDP-Based Meal Planning**: Markov Decision Process implementation for optimal meal selection across breakfast, lunch, and dinner, maximizing nutritional value while staying within calorie targets.

**User Preference Learning**: System adapts to individual preferences by learning from user feedback (likes, dislikes, ratings), favorite cuisines, preferred dining halls, and dietary patterns.

**Multi-Dining Hall Support**: Browse and receive recommendations from all four UMass dining halls, with location-based filtering and distance indicators.

**Feedback Integration**: Users can provide feedback on recommendations (thumbs up/down, ratings), which the system uses to refine future suggestions and improve personalization accuracy.

---

## Project Structure

```
└── mass_path/
    ├── frontend/
    │   ├── public/
    │   │   ├── index.html
    │   │   ├── favicon.ico
    │   │   └── manifest.json
    │   ├── src/
    │   │   ├── App.js
    │   │   ├── CalorieCounterApp.js
    │   │   ├── Menu.js
    │   │   ├── Food.js
    │   │   ├── Login.js
    │   │   ├── supabase.js
    │   │   └── *.css
    │   └── package.json
    ├── backend/
    │   ├── server.py
    │   ├── rl_recommender.py
    │   ├── learning.py
    │   ├── scraping.py
    │   ├── cal.py
    │   ├── requirements.txt
    │   ├── umass_menu_parsed.json
    │   └── user_models/
    ├── package.json
    ├── start.js
    └── README.md
```

### Project Index

| File/Directory | Purpose |
|----------------|---------|
| `frontend/src/CalorieCounterApp.js` | Main React component handling UI state, menu fetching, and recommendation display |
| `frontend/src/Menu.js` | Service class for fetching and parsing menu data from backend API |
| `frontend/src/Food.js` | Food item model class with nutritional data and methods |
| `frontend/src/Login.js` | User authentication component using Supabase |
| `frontend/src/supabase.js` | Supabase client configuration |
| `backend/server.py` | Flask API server with endpoints for menus, recommendations, and RL feedback |
| `backend/rl_recommender.py` | Multi-armed bandit recommender system with Random Forest regression |
| `backend/learning.py` | MDP implementation for optimal meal planning using value iteration |
| `backend/scraping.py` | Web scraper for UMass dining hall menus with BeautifulSoup |
| `backend/cal.py` | Calorie calculation utilities |
| `backend/user_models/` | Directory storing per-user RL models and feedback logs |

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16.x or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Python** (version 3.8 or higher) - [Download](https://www.python.org/downloads/)
- **pip** (Python package manager)


### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/[username]/MassPath
   cd MassPath
   ```

2. **Install frontend dependencies**
   ```sh
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```sh
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (if needed)
   
   Create a `.env` file in the `frontend` directory if using Supabase:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
   ```

### Usage

1. **Start the backend server** (in one terminal)
   ```sh
   cd backend
   python server.py
   ```
   
   The backend will run on `http://localhost:4000` by default.

2. **Start the frontend development server** (in another terminal)
   ```sh
   cd frontend
   npm start
   ```
   
   The frontend will automatically open in your browser at `http://localhost:3000`.

> ***Note***: The backend API runs on port 4000, and the React development server runs on port 3000. Make sure both servers are running for the application to function properly.

---

## Technologies

### Frontend

- **React.js** (v19.2.0) - UI library for building interactive user interfaces
- **React DOM** (v19.2.0) - React renderer for the web
- **React Scripts** (v5.0.1) - Build tooling and development server
- **Lucide React** (v0.553.0) - Icon library for modern UI components
- **Supabase** (v2.54.11) - Backend-as-a-Service for authentication and database
- **@supabase/supabase-js** (v2.80.0) - Supabase JavaScript client

### Backend

- **Flask** (v3.0.0) - Python web framework for building REST APIs
- **Flask-CORS** (v4.0.0) - Cross-Origin Resource Sharing support for Flask
- **BeautifulSoup4** (v4.12.2) - HTML parsing library for web scraping
- **lxml** (v4.9.3) - XML/HTML parser backend for BeautifulSoup
- **Requests** (v2.31.0) - HTTP library for making API calls
- **NumPy** (v1.24.3) - Numerical computing library
- **scikit-learn** (v1.3.2) - Machine learning library (Random Forest, regression)

### Development Tools

- **Testing Library** - React component testing utilities
- **Web Vitals** - Performance monitoring
- **ESLint** - Code linting and quality checks

<!-- ---

## Roadmap

> **Note**: This is a personal WIP project. The roadmap below is for the author's reference only.

- [X] **`Menu Scraping`**: <strike>Implement web scraper for UMass dining hall menus</strike>
- [X] **`Backend API`**: <strike>Create Flask API with menu and recommendation endpoints</strike>
- [X] **`RL Recommender`**: <strike>Implement multi-armed bandit recommendation system</strike>
- [X] **`MDP Planning`**: <strike>Build Markov Decision Process for optimal meal selection</strike>
- [X] **`Frontend UI`**: <strike>Develop React interface for calorie tracking and recommendations</strike>
- [X] **`User Feedback`**: <strike>Add feedback collection system for RL model training</strike>
- [ ] **`User Authentication`**: Complete Supabase integration for user accounts
- [ ] **`Mobile Responsiveness`**: Optimize UI for mobile devices
- [ ] **`Advanced Filtering`**: Add dietary restrictions, allergen filtering, and cuisine preferences
- [ ] **`Historical Analytics`**: Display user eating patterns and nutritional trends
- [ ] **`Social Features`**: Share meals and recommendations with friends
- [ ] **`Offline Support`**: Cache menu data for offline access
- [ ] **`Performance Optimization`**: Optimize RL model training and recommendation speed -->

---

## Contributing

⚠️ **This project is currently a work-in-progress and is NOT accepting contributions.**

This is a personal learning project. Forks, pull requests, and contributions are not being accepted at this time. Thank you for your understanding!

---

## License

This is a personal/educational project. All rights reserved. This project is for viewing and learning purposes only.

---

## Acknowledgments

- **UMass Dining** - For providing the menu data and dining hall information
- **React Team** - For the excellent React.js framework
- **Flask Community** - For the lightweight and flexible web framework
- **scikit-learn** - For the powerful machine learning tools
- **BeautifulSoup** - For making web scraping accessible
- **Supabase** - For simplifying authentication and backend services
- **Lucide** - For the beautiful icon library

---

<div align="right">

[![][back-to-top]](#top)

</div>

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-151515?style=flat-square
