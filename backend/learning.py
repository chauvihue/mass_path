"""
learning.py
-------------
Simulates a simple Markov Decision Process (MDP) for multiple meals in a day
for the UMass Dining calorie counter. The goal is to choose menu items at each meal
that keep the user close to their daily calorie target.

Author: Sardar Rahman
"""

import numpy as np
import random

# --- Define the environment ---

# Total daily calorie goal
DAILY_CALORIE_TARGET = 2000

# Define meals in order
MEALS = ["breakfast", "lunch", "dinner"]

# Define menu items (name: {calories, tags})
MENU = {
    "omelette": {"calories": 400, "tags": ["high_protein", "breakfast"]},
    "bagel": {"calories": 300, "tags": ["light", "breakfast"]},
    "smoothie": {"calories": 250, "tags": ["plant_based", "light"]},
    "salad": {"calories": 350, "tags": ["light", "vegetarian", "plant_based"]},
    "sandwich": {"calories": 600, "tags": ["filling"]},
    "burger": {"calories": 900, "tags": ["filling", "grill"]},
    "pizza": {"calories": 800, "tags": ["filling", "comfort"]},
    "pasta": {"calories": 700, "tags": ["comfort"]},
    "fruit_bowl": {"calories": 200, "tags": ["light", "plant_based"]},
    "ice_cream": {"calories": 400, "tags": ["dessert", "comfort"]}
}

# States: remaining calories after each meal (discretized)
STATES = list(range(0, DAILY_CALORIE_TARGET + 100, 100))

# Discount factor
GAMMA = 0.9

# Default tag preference weights (can be overridden per user)
DEFAULT_PREFERRED_TAGS = {
    "high_protein": 1.0,
    "plant_based": 0.5,
    "vegetarian": 0.6,
    "light": 0.3,
    "filling": 0.1,
    "halal": 0.4,
    "dessert": -0.2  # negative if user avoids sweets
}


def reward(remaining, item_calories, item_tags=None, preferred_tags=None, tag_weight=2.0):
    """
    Reward function augmented with tag-match bonus.
    - tag_weight controls how much tag alignment affects reward.
    - preferred_tags is a dict mapping tag->weight for the user.
    """
    if item_tags is None:
        item_tags = []
    if preferred_tags is None:
        preferred_tags = DEFAULT_PREFERRED_TAGS

    new_remaining = remaining - item_calories
    if new_remaining < 0:
        base = -abs(new_remaining) * 0.1  # overshoot penalty
    elif new_remaining <= 100:
        base = 10  # ideal
    else:
        base = -0.05 * new_remaining  # small penalty for under target

    # Tag alignment score: sum of user weights for tags present (normalized)
    tag_score = 0.0
    if item_tags:
        for t in item_tags:
            tag_score += float(preferred_tags.get(t, 0.0))
        # normalize by number of tags to keep score stable across items
        tag_score = tag_score / max(1.0, len(item_tags))

    # Combine base reward with tag alignment (scaled)
    return base + tag_weight * tag_score


def transition(remaining, item_calories, item_tags=None, preferred_tags=None, tag_weight=2.0):
    """Compute next state and reward (now aware of tags / user prefs)."""
    new_state = max(0, remaining - item_calories)
    # Snap to nearest 100 to stay in discrete state space
    new_state = int(round(new_state / 100) * 100)
    new_state = min(max(new_state, 0), DAILY_CALORIE_TARGET)
    r = reward(remaining, item_calories, item_tags=item_tags, preferred_tags=preferred_tags, tag_weight=tag_weight)
    return new_state, r


def value_iteration(preferred_tags: dict | None = None, tag_weight: float = 2.0, iters: int = 100):
    """
    Compute optimal policy using value iteration.
    preferred_tags: user-specific tag weights (overrides DEFAULT_PREFERRED_TAGS).
    tag_weight: how much tags influence reward relative to calorie alignment.
    """
    if preferred_tags is None:
        preferred_tags = DEFAULT_PREFERRED_TAGS

    V = {s: 0 for s in STATES}
    policy = {}

    for _ in range(iters):
        for s in STATES:
            action_values = {}
            for a, meta in MENU.items():
                cal = meta["calories"]
                tags = meta.get("tags", [])
                s_next, r = transition(s, cal, item_tags=tags, preferred_tags=preferred_tags, tag_weight=tag_weight)
                action_values[a] = r + GAMMA * V[s_next]
            best_action = max(action_values, key=action_values.get)
            V[s] = action_values[best_action]
            policy[s] = best_action

    return V, policy


# --- Simulation over multiple meals ---

def simulate_day(policy):
    """Simulate a full day (breakfast, lunch, dinner) following a given policy."""
    remaining = DAILY_CALORIE_TARGET
    total_reward = 0
    day_log = []

    for meal in MEALS:
        state_bucket = int(round(remaining / 100) * 100)
        action = policy.get(state_bucket, random.choice(list(MENU.keys())))
        calories = MENU[action]["calories"]
        next_state, r = transition(remaining, calories, item_tags=MENU[action].get("tags", []))
        day_log.append((meal, action, calories, remaining, r))
        total_reward += r
        remaining = next_state

    return total_reward, day_log


# --- User preference inference from logs ---
def infer_user_preferences_from_logs(logged_foods: list[str]) -> dict:
    """
    Infer a user's food tag preferences based on their logged meals.
    Returns a normalized dictionary of tag weights (0 to 1).
    """
    tag_counts = {}
    total_tags = 0

    for food in logged_foods:
        item = MENU.get(food.lower())
        if not item:
            continue

        tags = item.get("tags", [])
        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
            total_tags += 1

    if total_tags == 0:
        return DEFAULT_PREFERRED_TAGS  # fallback if no valid foods found

    # Normalize to range [0, 1]
    preferences = {tag: count / total_tags for tag, count in tag_counts.items()}

    # Fill in missing tags with 0.0 (so model still gets complete dictionary)
    for tag in DEFAULT_PREFERRED_TAGS:
        preferences.setdefault(tag, 0.0)

    return preferences


# --- Next meal recommendation using inferred preferences and value iteration ---
def get_next_meal_recommendation(logged_foods: list[str], daily_target: int = DAILY_CALORIE_TARGET):
    """
    Given the foods a user has already eaten, infer their preferences and remaining calories,
    then use value iteration to recommend the next best meal.
    Returns a dictionary with inferred preferences, remaining calories, and recommendation.
    """
    # 1️⃣ Calculate total calories eaten
    calories_eaten = sum(MENU.get(food.lower(), {}).get("calories", 0) for food in logged_foods)
    remaining_calories = max(daily_target - calories_eaten, 0)

    # 2️⃣ Infer user preferences from their meal history
    inferred_prefs = infer_user_preferences_from_logs(logged_foods)

    # 3️⃣ Run value iteration with those preferences
    _, policy = value_iteration(preferred_tags=inferred_prefs, tag_weight=2.0)

    # 4️⃣ Find best next action for current calorie state
    current_state = int(round(remaining_calories / 100) * 100)
    next_meal = policy.get(current_state, random.choice(list(MENU.keys())))

    return {
        "logged_foods": logged_foods,
        "calories_eaten": calories_eaten,
        "remaining_calories": remaining_calories,
        "inferred_preferences": inferred_prefs,
        "next_meal_recommendation": {
            "meal": next_meal,
            "calories": MENU[next_meal]["calories"],
            "tags": MENU[next_meal]["tags"]
        }
    }


if __name__ == "__main__":
    print("Running value iteration (example user pref)...")
    # Example: user prefers high-protein and avoids desserts
    user_prefs = {"high_protein": 1.2, "dessert": -0.5, "plant_based": 0.3}
    V, policy = value_iteration(preferred_tags=user_prefs, tag_weight=2.0)

    print("\n--- Optimal Policy (sample) ---")
    for s in [2000, 1500, 1000, 500, 0]:
        print(f"Remaining {s} → {policy[s]}")

    print("\n--- Simulating 3 days ---")
    for day in range(1, 4):
        total_reward, log = simulate_day(policy)
        print(f"\nDay {day}: Total reward = {total_reward:.2f}")
        for meal, action, cal, rem, r in log:
            print(f"  {meal.title()}: {action} ({cal} cal) | Remaining: {rem} | Reward: {r:.2f}")